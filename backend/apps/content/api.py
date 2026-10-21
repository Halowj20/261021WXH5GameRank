import json

from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.core.api import fail, ok
from apps.core.permissions import role_required

from .models import Article, Source


def source_payload(source):
    return {
        "id": source.id,
        "name": source.name,
        "platforms": source.platforms,
        "weight": source.weight,
        "status": source.status,
        "note": source.note,
    }


def article_payload(article, detail=False):
    data = {
        "id": article.id,
        "title": article.title,
        "url": article.url or "",
        "source": source_payload(article.source) if article.source else None,
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "fetched_at": article.fetched_at.isoformat() if article.fetched_at else None,
        "ingest_method": article.ingest_method,
        "parse_status": article.parse_status,
        "failure_reason": article.failure_reason,
        "is_draft": article.is_draft,
        "content_hash": article.content_hash,
        "created_at": article.created_at.isoformat(),
    }
    if detail:
        data["raw_text"] = article.raw_text
        data["assets"] = [
            {
                "id": asset.id,
                "type": asset.type,
                "url": asset.file.url if asset.file else "",
                "ocr_text": asset.ocr_text,
                "ocr_confidence": asset.ocr_confidence,
            }
            for asset in article.assets.all()
        ]
        data["observations"] = [
            {
                "id": obs.id,
                "platform": obs.platform,
                "board_type": obs.board_type,
                "observed_date": obs.observed_date.isoformat(),
                "rank": obs.rank,
                "raw_game_name": obs.raw_game_name,
                "source_type": obs.source_type,
                "game": {"id": obs.game_id, "name": obs.game.canonical_name} if obs.game_id else None,
            }
            for obs in article.observations.select_related("game").all()
        ]
        data["claims"] = [
            {
                "id": claim.id,
                "claim_text": claim.claim_text,
                "quote": claim.quote,
                "stance": claim.stance,
                "confidence": claim.confidence,
                "verify_status": claim.verify_status,
            }
            for claim in article.claims.all()
        ]
    return data


@require_GET
def list_sources(request):
    return ok([source_payload(source) for source in Source.objects.all()])


@role_required("admin")
@require_POST
def create_source(request):
    payload = json.loads(request.body or "{}")
    name = (payload.get("name") or "").strip()
    if not name:
        return fail("invalid_name", "公众号名称不能为空", 400)
    source, created = Source.objects.get_or_create(
        name=name,
        defaults={
            "platforms": payload.get("platforms", []),
            "weight": payload.get("weight", 3),
            "note": payload.get("note", ""),
        },
    )
    if not created:
        return fail("duplicate_source", "公众号已存在", 409)
    return ok(source_payload(source), status=201)


@role_required("admin")
@require_http_methods(["PATCH"])
def update_source(request, source_id):
    source = get_object_or_404(Source, id=source_id)
    payload = json.loads(request.body or "{}")
    for field in ("name", "platforms", "weight", "status", "note"):
        if field in payload:
            setattr(source, field, payload[field])
    source.save()
    return ok(source_payload(source))


@require_GET
def list_articles(request):
    limit = min(int(request.GET.get("limit", 50)), 200)
    qs = Article.objects.select_related("source")
    status = request.GET.get("status")
    if status:
        qs = qs.filter(parse_status=status)
    if request.GET.get("confirmed") == "1":
        qs = qs.filter(is_draft=False)
    return ok([article_payload(article) for article in qs[:limit]])


@require_GET
def article_detail(request, article_id):
    article = get_object_or_404(Article.objects.select_related("source"), id=article_id)
    return ok(article_payload(article, detail=True))


@role_required("operator", "admin")
@require_http_methods(["DELETE"])
def delete_article(request, article_id):
    from apps.intel.services.merge import merge_day

    article = get_object_or_404(Article.objects.select_related("source"), id=article_id)
    affected = set(
        article.observations.values_list("platform", "board_type", "observed_date")
    )
    title = article.title
    for asset in article.assets.all():
        if asset.file:
            try:
                asset.file.delete(save=False)
            except OSError:
                pass
    article.delete()
    for platform, board, observed_date in affected:
        merge_day(platform, board, observed_date)
    return ok({"deleted": article_id, "title": title})
