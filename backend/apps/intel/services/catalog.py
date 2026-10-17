import re
import unicodedata

from apps.intel.models import Alias, Category, Claim, Entry, Game, Observation


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    value = re.sub(r"[\s·・:：\-—_（）()【】\[\]《》<>\"'“”‘’!！?？]+", "", value)
    return value.lower()


def resolve_game(raw_name: str):
    key = normalize_name(raw_name)
    if not key:
        return None
    for game in Game.objects.all():
        if normalize_name(game.canonical_name) == key:
            return game
    for alias in Alias.objects.select_related("game"):
        if normalize_name(alias.alias) == key:
            return alias.game
    return None


def category_tree():
    categories = list(Category.objects.all())
    by_parent = {}
    for category in categories:
        by_parent.setdefault(category.parent_id, []).append(category)
    for items in by_parent.values():
        items.sort(key=lambda c: (c.sort, c.id))

    def build(parent_id):
        return [
            {
                "id": item.id,
                "name": item.name,
                "level": item.level,
                "children": build(item.id),
            }
            for item in by_parent.get(parent_id, [])
        ]

    return build(None)


def game_payload(game, detail=False):
    data = {
        "id": game.id,
        "name": game.canonical_name,
        "publisher": game.publisher,
        "developer": game.developer,
        "platforms": game.platforms,
        "release_date": game.release_date.isoformat() if game.release_date else None,
        "online_status": game.online_status,
        "has_isbn": game.has_isbn,
        "category_id": game.category_id,
        "category_path": game.category_path,
        "category_source": game.category_source,
        "category_confidence": game.category_confidence,
        "quality_flags": game.quality_flags,
        "aliases": [alias.alias for alias in game.aliases.all()],
    }
    if detail:
        data["tags"] = [
            {"id": tag.id, "name": tag.name, "dimension": tag.dimension} for tag in game.tags.all()
        ]
    return data


def game_profile(game):
    entries = list(
        Entry.objects.filter(game=game)
        .select_related("snapshot")
        .order_by("-snapshot__observed_date", "rank")
    )
    dates = sorted({entry.snapshot.observed_date for entry in entries}, reverse=True)
    current = entries[0] if entries else None
    best = min((entry.rank for entry in entries), default=None)
    streak = 0
    for index, observed_date in enumerate(dates):
        if index == 0 or (dates[index - 1] - observed_date).days == 1:
            streak += 1
        else:
            break
    claims = Claim.objects.filter(subject_type="game", subject_id=game.id).select_related("article__source")
    observations = Observation.objects.filter(game=game).select_related("article__source")
    source_ids = sorted(
        {
            obs.article.source_id
            for obs in observations
            if obs.article and obs.article.source_id
        }
    )
    from apps.content.models import Source

    return {
        "game": game_payload(game, detail=True),
        "stats": {
            "current_rank": current.rank if current else None,
            "best_rank": best,
            "days_on_board": len(dates),
            "streak": streak,
        },
        "history": [
            {
                "date": entry.snapshot.observed_date.isoformat(),
                "platform": entry.snapshot.platform,
                "board_type": entry.snapshot.board_type,
                "rank": entry.rank,
                "trend": entry.trend,
                "delta": entry.delta,
                "status": entry.snapshot.status,
            }
            for entry in entries[:14]
        ],
        "claims": [
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
        ],
        "aliases": [
            {
                "alias": alias.alias,
                "type": alias.alias_type,
                "source": alias.source.name if alias.source else "",
            }
            for alias in game.aliases.select_related("source")
        ],
        "sources": list(Source.objects.filter(id__in=source_ids).values("id", "name")),
        "quality_flags": game.quality_flags,
    }
