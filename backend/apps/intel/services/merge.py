import json

from apps.intel.models import Conflict, Entry, Observation, Snapshot

from .catalog import normalize_name


def parse_trend_raw(raw: str):
    try:
        data = json.loads(raw or "{}")
        trend = data.get("trend", "flat")
        delta = data.get("delta")
        if trend not in {"up", "down", "new", "out", "flat"}:
            trend = "flat"
        return trend, int(delta) if delta is not None else None
    except Exception:
        return "flat", None


def merge_day(platform: str, board: str, observed_date):
    observations = list(
        Observation.objects.filter(
            platform=platform, board_type=board, observed_date=observed_date
        )
        .select_related("game", "article", "article__source")
        .order_by("rank", "id")
    )
    official = [obs for obs in observations if obs.source_type == Observation.SourceType.OFFICIAL]
    official_snapshot = (
        Snapshot.objects.filter(
            platform=platform,
            board_type=board,
            observed_date=observed_date,
            source_type=Observation.SourceType.OFFICIAL,
        )
        .prefetch_related("entries__game")
        .first()
    )
    if official:
        source_type = Observation.SourceType.OFFICIAL
        status = Snapshot.Status.CONFIRMED
        authority = 1.0
        basis = official
        Snapshot.objects.filter(
            platform=platform,
            board_type=board,
            observed_date=observed_date,
            source_type=Observation.SourceType.CITATION,
        ).delete()
    else:
        source_type = Observation.SourceType.CITATION
        status = Snapshot.Status.PROVISIONAL
        authority = 0.5
        basis = observations

    snapshot, _ = Snapshot.objects.update_or_create(
        platform=platform,
        board_type=board,
        observed_date=observed_date,
        source_type=source_type,
        defaults={"status": status, "authority_score": authority, "entry_count": len(basis)},
    )
    snapshot.entries.all().delete()
    seen = set()
    seen_ranks = set()
    for obs in basis:
        key = ("game", obs.game_id) if obs.game_id else ("raw", normalize_name(obs.raw_game_name))
        if key in seen or obs.rank in seen_ranks:
            continue
        seen.add(key)
        seen_ranks.add(obs.rank)
        trend, delta = parse_trend_raw(obs.trend_raw)
        Entry.objects.create(
            snapshot=snapshot,
            rank=obs.rank,
            game=obs.game,
            raw_name=obs.raw_game_name,
            trend=trend,
            delta=delta,
            evidence_observation_ids=[obs.id],
        )

    existing_conflicts = {
        (conflict.subject_id, conflict.source_id, conflict.article_id): conflict
        for conflict in Conflict.objects.filter(
            conflict_type=Conflict.Type.RANKING,
            platform=platform,
            board_type=board,
            observed_date=observed_date,
        )
    }
    keep_keys = set()
    if official or official_snapshot:
        if official:
            official_ranks = {entry.game_id: entry.rank for entry in snapshot.entries.all() if entry.game_id}
        else:
            official_ranks = {
                entry.game_id: entry.rank for entry in official_snapshot.entries.all() if entry.game_id
            }
        for obs in observations:
            if obs.source_type != Observation.SourceType.CITATION or not obs.game_id:
                continue
            official_rank = official_ranks.get(obs.game_id)
            if not official_rank or official_rank == obs.rank:
                continue
            key = (obs.game_id, obs.article.source_id if obs.article else None, obs.article_id)
            if key in keep_keys:
                continue
            keep_keys.add(key)
            existing = existing_conflicts.get(key)
            if existing:
                if existing.official_rank != official_rank or existing.citation_rank != obs.rank:
                    existing.official_rank = official_rank
                    existing.citation_rank = obs.rank
                    existing.status = Conflict.Status.OPEN
                    existing.resolution_note = ""
                    existing.resolved_by = None
                    existing.resolved_at = None
                    existing.save()
            else:
                Conflict.objects.create(
                    subject_type="game",
                    subject_id=obs.game_id,
                    conflict_type=Conflict.Type.RANKING,
                    status=Conflict.Status.OPEN,
                    source=obs.article.source if obs.article else None,
                    article=obs.article,
                    official_rank=official_rank,
                    citation_rank=obs.rank,
                    platform=platform,
                    board_type=board,
                    observed_date=observed_date,
                    window_start=observed_date,
                    window_end=observed_date,
                )
    for key, conflict in existing_conflicts.items():
        if key not in keep_keys:
            conflict.delete()
    return snapshot


def merge_all_for_date(observed_date):
    keys = (
        Observation.objects.filter(observed_date=observed_date)
        .values_list("platform", "board_type")
        .distinct()
    )
    for platform, board in keys:
        merge_day(platform, board, observed_date)
