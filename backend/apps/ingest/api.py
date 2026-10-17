import json
from datetime import datetime

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from apps.content.api import article_payload
from apps.content.models import Article, Asset, Source
from apps.core.api import fail, ok
from apps.core.permissions import role_required
from apps.core.tasks import runner
from apps.ingest.services.dedupe import content_hash, find_duplicate
from apps.ingest.services.fetch import FetchError, fetch_article
from apps.ingest.services.ocr import ocr_image
from apps.ingest.services.pipeline import process_article, retry_article
from apps.intel.models import Observation
from apps.intel.services.merge import merge_day


def task_payload(article):
    data = article_payload(article)
    data["duplicate"] = False
    data["obs_count"] = article.observations.count()
    data["claim_count"] = article.claims.count()
    return data


@role_required("operator", "admin")
@require_POST
def ingest_link(request):
    payload = json.loads(request.body or "{}")
    urls = []
    for url in payload.get("urls", []):
        url = (url or "").strip()
        if url and url not in urls:
            urls.append(url)
    if not urls:
        return fail("empty_urls", "请提供至少一个链接", 400)
    if len(urls) > 20:
        return fail("too_many_urls", "一次最多 20 个链接", 400)
    source = None
    if payload.get("source_id"):
        source = Source.objects.filter(id=payload["source_id"]).first()

    results = []
    for url in urls:
        existing = find_duplicate(url=url)
        if existing:
            data = task_payload(existing)
            data["duplicate"] = True
            results.append(data)
            continue
        article = Article.objects.create(
            title=url,
            url=url,
            source=source,
            ingest_method=Article.Method.LINK,
        )
        try:
            fetched = fetch_article(url)
            duplicate_by_text = find_duplicate(text=fetched.text, exclude_id=article.id)
            if duplicate_by_text:
                article.delete()
                data = task_payload(duplicate_by_text)
                data["duplicate"] = True
                results.append(data)
                continue
            article.title = fetched.title
            article.raw_text = fetched.text
            article.raw_html = fetched.html
            article.fetched_at = timezone.now()
            article.content_hash = content_hash(fetched.text)
            article.save()
            runner.submit(process_article, article.id)
        except FetchError as exc:
            article.parse_status = Article.Status.FAILED
            article.failure_reason = str(exc)
            article.save(update_fields=["parse_status", "failure_reason", "updated_at"])
        results.append(task_payload(article))
    return ok({"articles": results}, status=201)


@role_required("operator", "admin")
@require_POST
def ingest_fulltext(request):
    payload = json.loads(request.body or "{}")
    text = (payload.get("text") or "").strip()
    if not text:
        return fail("empty_text", "正文不能为空", 400)
    duplicate = find_duplicate(text=text)
    if duplicate:
        data = task_payload(duplicate)
        data["duplicate"] = True
        return ok({"articles": [data]}, status=201)
    source = Source.objects.filter(id=payload.get("source_id")).first() if payload.get("source_id") else None
    article = Article.objects.create(
        title=(payload.get("title") or "全文投喂").strip(),
        source=source,
        raw_text=text,
        ingest_method=Article.Method.FULLTEXT,
        content_hash=content_hash(text),
    )
    runner.submit(process_article, article.id)
    return ok({"articles": [task_payload(article)]}, status=201)


@role_required("operator", "admin")
@require_POST
def ingest_screenshot(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return fail("missing_file", "请上传截图", 400)
    source = Source.objects.filter(id=request.POST.get("source_id")).first() if request.POST.get("source_id") else None
    article = Article.objects.create(
        title=(request.POST.get("title") or "截图投喂").strip(),
        source=source,
        ingest_method=Article.Method.SCREENSHOT,
    )
    asset = Asset.objects.create(article=article, type=Asset.Type.SCREENSHOT, file=uploaded)
    ocr = ocr_image(asset.file.path)
    asset.ocr_text = ocr.text
    asset.ocr_confidence = ocr.confidence
    asset.save(update_fields=["ocr_text", "ocr_confidence", "updated_at"])
    if not ocr.text.strip():
        article.parse_status = Article.Status.FAILED
        article.failure_reason = "OCR 未识别到文字"
        article.save(update_fields=["parse_status", "failure_reason", "updated_at"])
    else:
        article.raw_text = ocr.text
        article.save(update_fields=["raw_text", "updated_at"])
        runner.submit(process_article, article.id)
    return ok({"articles": [task_payload(article)]}, status=201)


@require_GET
def tasks(request):
    ids = [int(value) for value in request.GET.get("ids", "").split(",") if value.strip().isdigit()]
    qs = Article.objects.filter(id__in=ids).select_related("source")
    return ok([task_payload(article) for article in qs])


def _confirm_ids(ids):
    with transaction.atomic():
        articles = Article.objects.filter(id__in=ids, is_draft=True)
        affected = set()
        for article in articles:
            for observation in Observation.objects.filter(article=article):
                affected.add((observation.platform, observation.board_type, observation.observed_date))
            article.is_draft = False
            article.confirmed_at = timezone.now()
            article.save(update_fields=["is_draft", "confirmed_at", "updated_at"])
        for platform, board, observed_date in affected:
            merge_day(platform, board, observed_date)
        return articles.count()


@role_required("operator", "admin")
@require_POST
def confirm(request):
    payload = json.loads(request.body or "{}")
    ids = [int(value) for value in payload.get("ids", [])]
    count = _confirm_ids(ids)
    return ok({"confirmed": count})


@role_required("operator", "admin")
@require_POST
def cancel(request):
    payload = json.loads(request.body or "{}")
    ids = [int(value) for value in payload.get("ids", [])]
    deleted, _ = Article.objects.filter(id__in=ids, is_draft=True).delete()
    return ok({"deleted": deleted})


@role_required("operator", "admin")
@require_POST
def retry(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    retry_article(article.id)
    return ok({"id": article.id, "status": Article.Status.RECEIVED})
