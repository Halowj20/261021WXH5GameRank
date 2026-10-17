import json

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from apps.content.models import Article
from apps.core.api import fail, ok
from apps.core.audit import log_action
from apps.core.permissions import role_required
from apps.intel.models import Alias, Category, Claim, Game, Observation
from apps.intel.services.catalog import normalize_name
from apps.intel.services.merge import merge_day


def summary():
    mapping = Observation.objects.filter(
        game__isnull=True, article__isnull=False, article__is_draft=False
    ).count()
    category = Game.objects.filter(category__isnull=True).count() + Game.objects.filter(
        category__level=2
    ).count()
    claims = Claim.objects.filter(
        verify_status=Claim.VerifyStatus.PENDING, article__is_draft=False
    ).count()
    errors = Article.objects.filter(
        parse_status__in=[Article.Status.FAILED, Article.Status.NEEDS_REVIEW], is_draft=False
    ).count()
    return {
        "mapping": mapping,
        "category": category,
        "claims": claims,
        "errors": errors,
        "total": mapping + category + claims + errors,
    }


@require_GET
def review_summary(request):
    return ok(summary())


@require_GET
def review_list(request):
    tab = request.GET.get("tab", "mapping")
    if tab == "mapping":
        data = [
            {
                "id": obs.id,
                "raw_game_name": obs.raw_game_name,
                "platform": obs.platform,
                "board_type": obs.board_type,
                "rank": obs.rank,
                "confidence": obs.confidence,
                "source": obs.article.source.name if obs.article and obs.article.source else "",
                "article_id": obs.article_id,
            }
            for obs in Observation.objects.filter(
                game__isnull=True, article__isnull=False, article__is_draft=False
            ).select_related("article__source")
        ]
    elif tab == "category":
        data = [
            {
                "id": game.id,
                "name": game.canonical_name,
                "category_path": game.category_path,
                "platforms": game.platforms,
                "quality_flags": game.quality_flags,
            }
            for game in Game.objects.filter(category__isnull=True)
            | Game.objects.filter(category__level=2)
        ]
    elif tab == "claims":
        data = [
            {
                "id": claim.id,
                "claim_text": claim.claim_text,
                "quote": claim.quote,
                "stance": claim.stance,
                "confidence": claim.confidence,
                "source": claim.article.source.name if claim.article.source else "",
                "article_id": claim.article_id,
            }
            for claim in Claim.objects.filter(
                verify_status=Claim.VerifyStatus.PENDING, article__is_draft=False
            ).select_related("article__source")
        ]
    elif tab == "errors":
        data = [
            {
                "id": article.id,
                "title": article.title,
                "status": article.parse_status,
                "failure_reason": article.failure_reason,
                "source": article.source.name if article.source else "",
            }
            for article in Article.objects.filter(
                parse_status__in=[Article.Status.FAILED, Article.Status.NEEDS_REVIEW],
                is_draft=False,
            ).select_related("source")
        ]
    else:
        return fail("invalid_tab", "未知待核类型", 400)
    return ok(data)


@role_required("operator", "admin")
@require_POST
def map_observation(request, observation_id):
    observation = get_object_or_404(
        Observation.objects.select_related("article__source"), id=observation_id
    )
    payload = json.loads(request.body or "{}")
    game = None
    if payload.get("game_id"):
        game = get_object_or_404(Game, id=payload["game_id"])
    elif (payload.get("new_game_name") or "").strip():
        name = payload["new_game_name"].strip()
        category = None
        if payload.get("category_id"):
            category = get_object_or_404(Category, id=payload["category_id"])
            if category.level not in (2, 3):
                return fail("invalid_category", "游戏品类只能挂 L2 或 L3", 400)
        game, _ = Game.objects.get_or_create(
            canonical_name=name,
            defaults={
                "category": category,
                "category_source": "human" if category else "ai",
                "category_confidence": 1 if category else 0,
                "quality_flags": [] if category else ["品类待补"],
            },
        )
    if not game:
        return fail("invalid_game", "请选择已有游戏或填写新游戏名", 400)

    if observation.raw_game_name and normalize_name(observation.raw_game_name) != normalize_name(
        game.canonical_name
    ):
        Alias.objects.get_or_create(
            game=game,
            alias=observation.raw_game_name,
            defaults={
                "source": observation.article.source if observation.article else None,
                "alias_type": Alias.AliasType.ARTICLE,
                "confirmed_by": request.user,
                "confirmed_at": timezone.now(),
            },
        )
    observation.game = game
    observation.save(update_fields=["game", "updated_at"])
    merge_day(observation.platform, observation.board_type, observation.observed_date)
    log_action(
        request.user,
        "observation.map_game",
        observation,
        after={"game_id": game.id, "raw_game_name": observation.raw_game_name},
    )
    return ok({"observation_id": observation.id, "game_id": game.id})


@role_required("operator", "admin")
@require_POST
def assign_category(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    payload = json.loads(request.body or "{}")
    category = get_object_or_404(Category, id=payload.get("category_id"))
    if category.level not in (2, 3):
        return fail("invalid_category", "游戏品类只能挂 L2 或 L3", 400)
    before = {"category_id": game.category_id, "quality_flags": game.quality_flags}
    game.category = category
    game.category_source = "human"
    game.category_confidence = 1
    game.quality_flags = [flag for flag in (game.quality_flags or []) if flag != "L3 品类待补"]
    game.save()
    log_action(request.user, "game.assign_category", game, before=before, after={"category_id": category.id})
    return ok({"game_id": game.id, "category_path": game.category_path})


@role_required("operator", "admin")
@require_POST
def verify_claim(request, claim_id):
    claim = get_object_or_404(Claim, id=claim_id)
    payload = json.loads(request.body or "{}")
    status = payload.get("status")
    if status not in {Claim.VerifyStatus.CONFIRMED, Claim.VerifyStatus.DISPUTED}:
        return fail("invalid_status", "结论只能是 confirmed 或 disputed", 400)
    before = {"verify_status": claim.verify_status}
    claim.verify_status = status
    claim.save(update_fields=["verify_status", "updated_at"])
    log_action(request.user, "claim.verify", claim, before=before, after={"verify_status": status})
    return ok({"id": claim.id, "verify_status": claim.verify_status})


@role_required("operator", "admin")
@require_POST
def retry_article(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    from apps.ingest.services.pipeline import retry_article as retry

    retry(article.id)
    return ok({"id": article.id, "status": Article.Status.RECEIVED})
