from datetime import datetime, timedelta

from django.db.models import Count
from django.views.decorators.http import require_GET

from apps.content.models import Article, Source
from apps.core.api import ok
from apps.intel.api.review import summary as review_summary
from apps.intel.models import Entry, Snapshot


@require_GET
def workbench(request):
    date_text = request.GET.get("date")
    if not date_text:
        date_text = datetime.now().date().isoformat()
    today = datetime.fromisoformat(date_text).date()
    pending = review_summary()

    snapshots = Snapshot.objects.filter(observed_date=today).prefetch_related("entries__game")
    best_snapshots = {}
    for snapshot in snapshots:
        key = (snapshot.platform, snapshot.board_type)
        current = best_snapshots.get(key)
        if current is None or snapshot.authority_score > current.authority_score:
            best_snapshots[key] = snapshot
    movements = []
    new_entries = 0
    for snapshot in best_snapshots.values():
        for entry in snapshot.entries.all():
            if entry.trend in ("new", "up", "down"):
                new_entries += 1 if entry.trend == "new" else 0
                movements.append(
                    {
                        "game_id": entry.game_id,
                        "game_name": entry.game.canonical_name if entry.game else entry.raw_name,
                        "platform": snapshot.platform,
                        "board_type": snapshot.board_type,
                        "rank": entry.rank,
                        "trend": entry.trend,
                        "delta": entry.delta,
                        "status": snapshot.status,
                    }
                )
    movements.sort(key=lambda item: (item["trend"] != "new", item["rank"]))
    movements = movements[:10]

    digest_payload = None
    try:
        from apps.digest.models import Digest

        digest = Digest.objects.filter(digest_date=today).first()
        if digest:
            total = digest.items.count()
            selected = digest.items.filter(is_included=True).count()
            digest_payload = {
                "status": digest.status,
                "selected": selected,
                "total": total,
                "date": today.isoformat(),
            }
    except Exception:
        digest_payload = None

    recent_articles = [
        {
            "id": article.id,
            "title": article.title,
            "source": article.source.name if article.source else "",
            "status": article.parse_status,
            "time": article.created_at.isoformat(),
        }
        for article in Article.objects.filter(is_draft=False)
        .select_related("source")
        .order_by("-created_at")[:5]
    ]
    return ok(
        {
            "date": today.isoformat(),
            "pending": pending,
            "new_entries": new_entries,
            "source_coverage": Source.objects.filter(status=Source.Status.ACTIVE).count(),
            "movements": movements,
            "digest": digest_payload,
            "recent_articles": recent_articles,
        }
    )
