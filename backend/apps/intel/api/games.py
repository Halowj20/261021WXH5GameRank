import json

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_http_methods

from apps.core.api import fail, ok
from apps.core.audit import log_action
from apps.core.permissions import role_required
from apps.intel.models import Alias, Category, Claim, Entry, Game, Observation
from apps.intel.services.catalog import game_payload, game_profile, normalize_name


@require_GET
def list_games(request):
    qs = (
        Q(canonical_name__icontains=request.GET.get("q", ""))
        | Q(publisher__icontains=request.GET.get("q", ""))
        | Q(developer__icontains=request.GET.get("q", ""))
        | Q(aliases__alias__icontains=request.GET.get("q", ""))
    )
    games = Game.objects.prefetch_related("aliases").filter(qs).distinct()
    platform = request.GET.get("platform")
    if platform:
        games = [game for game in games if platform in (game.platforms or [])]
    category_id = request.GET.get("category")
    if category_id:
        category_ids = [int(category_id)]
        category_ids.extend(
            Category.objects.filter(parent_id=category_id).values_list("id", flat=True)
        )
        games = [game for game in games if game.category_id in category_ids]
    limit = min(int(request.GET.get("limit", 100)), 300)
    data = []
    for game in list(games)[:limit]:
        entries = Entry.objects.filter(game=game).select_related("snapshot").order_by(
            "-snapshot__observed_date", "rank"
        )
        current = entries.first()
        item = game_payload(game)
        item["current_rank"] = current.rank if current else None
        item["best_rank"] = min(entries.values_list("rank", flat=True), default=None)
        item["days_on_board"] = entries.values("snapshot__observed_date").distinct().count()
        data.append(item)
    return ok(data)


@require_GET
def game_detail(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    return ok(game_profile(game))


@role_required("operator", "admin")
@require_http_methods(["PATCH"])
def update_game(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    payload = json.loads(request.body or "{}")
    before = game_payload(game, detail=True)
    for field in ("canonical_name", "publisher", "developer", "online_status", "has_isbn"):
        if field in payload:
            setattr(game, field, payload[field])
    if "category_id" in payload:
        category = get_object_or_404(Category, id=payload["category_id"])
        if category.level not in (2, 3):
            return fail("invalid_category", "游戏品类只能挂 L2 或 L3", 400)
        game.category = category
        game.category_source = "human"
        game.category_confidence = 1
        game.quality_flags = [flag for flag in (game.quality_flags or []) if flag != "L3 品类待补"]
    if "release_date" in payload:
        game.release_date = payload["release_date"] or None
    if "platforms" in payload:
        game.platforms = payload["platforms"]
    game.save()
    for alias_text in payload.get("aliases", []):
        alias_text = alias_text.strip()
        if alias_text and normalize_name(alias_text) != normalize_name(game.canonical_name):
            Alias.objects.get_or_create(
                game=game,
                alias=alias_text,
                defaults={
                    "source": None,
                    "alias_type": Alias.AliasType.ARTICLE,
                    "confirmed_by": request.user,
                    "confirmed_at": timezone.now(),
                },
            )
    log_action(request.user, "game.update", game, before=before, after=game_payload(game, detail=True))
    return ok(game_profile(game))


@require_GET
def game_claims(request, game_id):
    get_object_or_404(Game, id=game_id)
    claims = Claim.objects.filter(subject_type="game", subject_id=game_id).select_related(
        "article__source"
    )
    return ok(
        [
            {
                "id": claim.id,
                "text": claim.claim_text,
                "quote": claim.quote,
                "stance": claim.stance,
                "confidence": claim.confidence,
                "verify_status": claim.verify_status,
                "source": claim.article.source.name if claim.article and claim.article.source else "",
                "article_id": claim.article_id,
            }
            for claim in claims
        ]
    )


@require_GET
def game_sources(request, game_id):
    get_object_or_404(Game, id=game_id)
    observations = (
        Observation.objects.filter(game_id=game_id, article__isnull=False)
        .select_related("article__source")
        .order_by("-observed_date")
    )
    seen = set()
    data = []
    for obs in observations:
        article = obs.article
        if article.id in seen:
            continue
        seen.add(article.id)
        data.append(
            {
                "article_id": article.id,
                "title": article.title,
                "source": article.source.name if article.source else "",
                "date": obs.observed_date.isoformat(),
                "platform": obs.platform,
                "board_type": obs.board_type,
                "rank": obs.rank,
            }
        )
    return ok(data)
