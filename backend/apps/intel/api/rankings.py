import json
from collections import defaultdict

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from apps.core.api import fail, ok
from apps.core.audit import log_action
from apps.core.permissions import role_required
from apps.intel.models import Claim, Conflict, Entry, Game, Observation, Snapshot


def entry_payload(entry, official_rank=None):
    game = entry.game
    return {
        "id": entry.id,
        "rank": entry.rank,
        "game_id": entry.game_id,
        "game_name": game.canonical_name if game else entry.raw_name,
        "raw_name": entry.raw_name,
        "category_path": game.category_path if game else [],
        "trend": entry.trend,
        "delta": entry.delta,
        "diff": (entry.rank - official_rank) if official_rank else None,
    }


def snapshot_payload(snapshot):
    return {
        "id": snapshot.id,
        "platform": snapshot.platform,
        "board_type": snapshot.board_type,
        "date": snapshot.observed_date.isoformat(),
        "status": snapshot.status,
        "source_type": snapshot.source_type,
        "entry_count": snapshot.entry_count,
        "captured_at": snapshot.created_at.isoformat(),
    }


@require_GET
def rankings(request):
    platform = request.GET.get("platform", "wechat_mini")
    board = request.GET.get("board", "hot")
    date = request.GET.get("date")
    if not date:
        return fail("invalid_date", "缺少日期", 400)

    official = (
        Snapshot.objects.filter(
            platform=platform,
            board_type=board,
            observed_date=date,
            source_type=Observation.SourceType.OFFICIAL,
        )
        .prefetch_related("entries__game")
        .first()
    )
    snapshot = official or (
        Snapshot.objects.filter(
            platform=platform,
            board_type=board,
            observed_date=date,
            source_type=Observation.SourceType.CITATION,
        )
        .prefetch_related("entries__game")
        .first()
    )
    if not snapshot:
        return ok(
            {
                "platform": platform,
                "board": board,
                "date": date,
                "status": "missing",
                "official": None,
                "citations": [],
                "conflicts": [],
            }
        )

    official_ranks = {}
    if official:
        official_ranks = {
            entry.game_id: entry.rank for entry in official.entries.all() if entry.game_id
        }
    entries = [entry_payload(entry, official_ranks.get(entry.game_id)) for entry in snapshot.entries.all()]

    citation_groups = defaultdict(list)
    citation_meta = {}
    observations = (
        Observation.objects.filter(
            platform=platform,
            board_type=board,
            observed_date=date,
            source_type=Observation.SourceType.CITATION,
            article__isnull=False,
        )
        .select_related("article__source", "game")
        .order_by("article_id", "rank")
    )
    for obs in observations:
        citation_groups[obs.article_id].append(
            {
                "rank": obs.rank,
                "game_id": obs.game_id,
                "game_name": obs.game.canonical_name if obs.game else obs.raw_game_name,
                "raw_name": obs.raw_game_name,
                "diff": (obs.rank - official_ranks[obs.game_id]) if obs.game_id in official_ranks else None,
            }
        )
        citation_meta[obs.article_id] = {
            "source_name": obs.article.source.name if obs.article.source else "未指定来源",
            "article_id": obs.article_id,
            "captured_at": obs.article.fetched_at.isoformat() if obs.article.fetched_at else obs.article.created_at.isoformat(),
        }
    citations = [
        {**citation_meta[article_id], "entries": entries_}
        for article_id, entries_ in citation_groups.items()
    ]

    conflicts = Conflict.objects.filter(
        conflict_type=Conflict.Type.RANKING,
        platform=platform,
        board_type=board,
        observed_date=date,
    ).select_related("source", "article")
    conflict_game_ids = {conflict.subject_id for conflict in conflicts if conflict.subject_id}
    conflict_games = {
        game.id: game.canonical_name for game in Game.objects.filter(id__in=conflict_game_ids)
    }
    return ok(
        {
            "platform": platform,
            "board": board,
            "date": date,
            "status": snapshot.status,
            "snapshot": snapshot_payload(snapshot),
            "official": {
                "source_label": "官方榜单" if official else "公众号转述（暂定）",
                "entries": entries,
            },
            "citations": citations,
            "conflicts": [
                {
                    "id": conflict.id,
                    "game_id": conflict.subject_id,
                    "game_name": conflict_games.get(conflict.subject_id, f"游戏 #{conflict.subject_id}"),
                    "official_rank": conflict.official_rank,
                    "citation_rank": conflict.citation_rank,
                    "source_name": conflict.source.name if conflict.source else "",
                    "article_id": conflict.article_id,
                    "status": conflict.status,
                    "note": conflict.resolution_note,
                }
                for conflict in conflicts
            ],
        }
    )


@require_GET
def evidence(request):
    game_id = request.GET.get("game_id")
    date = request.GET.get("date")
    platform = request.GET.get("platform", "wechat_mini")
    board = request.GET.get("board", "hot")
    if not game_id or not date:
        return fail("invalid_params", "缺少 game_id 或 date", 400)
    game = get_object_or_404(Game, id=game_id)
    observations = (
        Observation.objects.filter(
            game=game, platform=platform, board_type=board, observed_date=date
        )
        .select_related("article__source")
        .order_by("rank")
    )
    claims = Claim.objects.filter(subject_type="game", subject_id=game.id).select_related(
        "article__source"
    )
    conflicts = Conflict.objects.filter(
        conflict_type=Conflict.Type.RANKING,
        subject_id=game.id,
        platform=platform,
        board_type=board,
        observed_date=date,
    )
    return ok(
        {
            "game": {"id": game.id, "name": game.canonical_name, "category_path": game.category_path},
            "observations": [
                {
                    "id": obs.id,
                    "rank": obs.rank,
                    "source_type": obs.source_type,
                    "source_name": obs.article.source.name if obs.article and obs.article.source else "官方/人工",
                    "article_id": obs.article_id,
                }
                for obs in observations
            ],
            "claims": [
                {
                    "id": claim.id,
                    "text": claim.claim_text,
                    "quote": claim.quote,
                    "stance": claim.stance,
                    "source": claim.article.source.name if claim.article and claim.article.source else "",
                    "article_id": claim.article_id,
                }
                for claim in claims
            ],
            "conflicts": [
                {
                    "id": conflict.id,
                    "official_rank": conflict.official_rank,
                    "citation_rank": conflict.citation_rank,
                    "status": conflict.status,
                    "note": conflict.resolution_note,
                }
                for conflict in conflicts
            ],
        }
    )


@role_required("operator", "admin")
@require_POST
def resolve_conflict(request, conflict_id):
    payload = json.loads(request.body or "{}")
    status = payload.get("status")
    if status not in {Conflict.Status.RESOLVED, Conflict.Status.KEPT}:
        return fail("invalid_status", "结论只能是 resolved 或 kept", 400)
    with transaction.atomic():
        conflict = get_object_or_404(Conflict.objects.select_for_update(), id=conflict_id)
        if conflict.status != Conflict.Status.OPEN:
            return fail("already_resolved", "该差异已处理", 409)
        before = {"status": conflict.status, "note": conflict.resolution_note}
        conflict.status = status
        conflict.resolution_note = (payload.get("note") or "").strip()
        conflict.resolved_by = request.user
        conflict.resolved_at = timezone.now()
        conflict.save()
    log_action(
        request.user,
        "conflict.resolve",
        conflict,
        before=before,
        after={"status": conflict.status, "note": conflict.resolution_note},
    )
    return ok({"id": conflict.id, "status": conflict.status, "note": conflict.resolution_note})
