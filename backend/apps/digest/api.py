import json
from datetime import date as date_cls

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.core.api import fail, ok
from apps.core.audit import log_action
from apps.core.permissions import role_required
from apps.digest.models import Digest, DigestItem
from apps.digest.services import DigestLocked, generate_digest
from apps.intel.api.review import summary as review_summary
from apps.intel.models import Claim, Conflict, Observation, Snapshot


def item_payload(item):
    return {
        "id": item.id,
        "section": item.section,
        "order": item.order,
        "ref_type": item.ref_type,
        "ref_id": item.ref_id,
        "generated_text": item.generated_text,
        "text": item.text_override or item.generated_text,
        "is_included": item.is_included,
        "text_override": item.text_override,
        "editor_note": item.editor_note,
    }


def digest_payload(digest):
    return {
        "id": digest.id,
        "date": digest.digest_date.isoformat(),
        "status": digest.status,
        "version": digest.version,
        "generated_at": digest.generated_at.isoformat(),
        "items": [item_payload(item) for item in digest.items.all()],
    }


@role_required("operator", "admin")
@require_POST
def generate(request):
    payload = json.loads(request.body or "{}")
    date_text = payload.get("date")
    if not date_text:
        return fail("invalid_date", "缺少日期", 400)
    try:
        digest = generate_digest(date_cls.fromisoformat(date_text), request.user)
    except DigestLocked as exc:
        return fail("digest_locked", str(exc), 409)
    log_action(request.user, "digest.generate", digest, after={"date": digest.digest_date.isoformat()})
    return ok(digest_payload(digest), status=201)


@require_GET
def detail(request, date):
    digest = Digest.objects.filter(digest_date=date).first()
    if not digest:
        return fail("not_found", "该日期尚未生成日报", 404)
    return ok(digest_payload(digest))


@role_required("operator", "admin")
@require_http_methods(["PATCH"])
def update_item(request, item_id):
    item = get_object_or_404(DigestItem.objects.select_related("digest"), id=item_id)
    if item.digest.status != Digest.Status.DRAFT:
        return fail("digest_locked", "日报已定稿，不能编辑", 409)
    payload = json.loads(request.body or "{}")
    for field in ("is_included", "text_override", "editor_note"):
        if field in payload:
            setattr(item, field, payload[field])
    item.save()
    return ok(item_payload(item))


@role_required("operator", "admin")
@require_POST
def reorder(request, date):
    digest = get_object_or_404(Digest, digest_date=date)
    if digest.status != Digest.Status.DRAFT:
        return fail("digest_locked", "日报已定稿，不能排序", 409)
    payload = json.loads(request.body or "{}")
    ids = [int(value) for value in payload.get("item_ids", [])]
    for index, item_id in enumerate(ids):
        DigestItem.objects.filter(digest=digest, id=item_id).update(order=index)
    return ok(digest_payload(digest))


@role_required("operator", "admin")
@require_http_methods(["DELETE"])
def delete_item(request, item_id):
    item = get_object_or_404(DigestItem.objects.select_related("digest"), id=item_id)
    if item.digest.status != Digest.Status.DRAFT:
        return fail("digest_locked", "日报已定稿，不能删除", 409)
    item.delete()
    return ok({"deleted": item_id})


@role_required("operator", "admin")
@require_POST
def finalize(request, date):
    digest = get_object_or_404(Digest, digest_date=date)
    if digest.status != Digest.Status.DRAFT:
        return fail("digest_locked", "日报已定稿", 409)
    if not digest.items.filter(is_included=True).exists():
        return fail("empty_digest", "至少保留一条日报内容", 400)
    digest.status = Digest.Status.REVIEWED
    digest.editor = request.user
    digest.save(update_fields=["status", "editor", "updated_at"])
    log_action(request.user, "digest.finalize", digest, after={"status": digest.status})
    return ok(digest_payload(digest))


@require_GET
def item_source(request, item_id):
    item = get_object_or_404(DigestItem.objects.select_related("digest"), id=item_id)
    payload = {
        "ref_type": item.ref_type,
        "ref_id": item.ref_id,
        "title": "",
        "meta": [],
        "articles": [],
        "hint": "",
    }
    articles = []

    def add_article(article):
        if not article or any(existing["id"] == article.id for existing in articles):
            return
        articles.append(
            {
                "id": article.id,
                "title": article.title,
                "source": article.source.name if article.source else "",
                "url": article.url or "",
                "ingest_method": article.ingest_method,
            }
        )

    if item.ref_type == DigestItem.RefType.SNAPSHOT:
        if item.ref_id.isdigit():
            snapshot = (
                Snapshot.objects.filter(id=int(item.ref_id))
                .prefetch_related("entries__game")
                .first()
            )
        else:
            snapshot = (
                Snapshot.objects.filter(observed_date=item.ref_id)
                .prefetch_related("entries__game")
                .order_by("-authority_score", "-created_at")
                .first()
            )
        if snapshot:
            platform_label = {"wechat_mini": "微信小游戏", "douyin_mini": "抖音小游戏"}.get(
                snapshot.platform, snapshot.platform
            )
            board_label = {"hot": "热门榜", "revenue": "畅销榜", "new": "新游榜"}.get(
                snapshot.board_type, snapshot.board_type
            )
            payload["title"] = f"{platform_label} · {board_label} · {snapshot.observed_date}"
            payload["meta"] = [
                "官方原始榜单" if snapshot.status == Snapshot.Status.CONFIRMED else "暂定，未经官方核对",
                f"共 {snapshot.entries.count()} 条",
            ]
            observation_ids = []
            for entry in snapshot.entries.all():
                observation_ids.extend(entry.evidence_observation_ids or [])
            observations = (
                Observation.objects.filter(id__in=observation_ids)
                .select_related("article__source")
                .order_by("article_id")
            )
            for observation in observations:
                add_article(observation.article)
    elif item.ref_type == DigestItem.RefType.CLAIM:
        claim = (
            Claim.objects.filter(id=item.ref_id)
            .select_related("article__source")
            .first()
            if str(item.ref_id).isdigit()
            else None
        )
        if claim:
            payload["title"] = claim.claim_text
            payload["meta"] = [
                f"倾向：{claim.get_stance_display()}",
                "观点已核实" if claim.verify_status == "confirmed" else "观点待核实",
            ]
            add_article(claim.article)
    elif item.ref_type == DigestItem.RefType.CONFLICT:
        conflict = Conflict.objects.filter(id=item.ref_id).select_related("article__source").first() if str(item.ref_id).isdigit() else None
        if conflict:
            payload["title"] = f"官方第 {conflict.official_rank} 名 / 转述第 {conflict.citation_rank} 名"
            payload["meta"] = [conflict.get_status_display()]
            add_article(conflict.article)
    elif item.ref_type == DigestItem.RefType.REVIEW:
        pending = review_summary()
        payload["title"] = "待核队列汇总"
        payload["meta"] = [
            f"游戏映射 {pending['mapping']}",
            f"品类待补 {pending['category']}",
            f"观点待核 {pending['claims']}",
            f"解析异常 {pending['errors']}",
        ]
        payload["hint"] = "前往待核队列查看具体条目"
    payload["articles"] = articles
    return ok(payload)


@require_GET
def export_markdown(request, date):
    digest = Digest.objects.filter(digest_date=date).first()
    if not digest:
        return fail("not_found", "该日期尚未生成日报", 404)
    lines = [
        "# 微小 / 抖小游戏榜单情报日报",
        f"- 日期：{digest.digest_date.isoformat()}",
        f"- 状态：{'已定稿' if digest.status == Digest.Status.REVIEWED else '草稿'}",
        "",
    ]
    section_titles = dict(DigestItem.Section.choices)
    for section in DigestItem.Section.values:
        items = digest.items.filter(section=section, is_included=True).order_by("order", "id")
        if not items:
            continue
        lines.append(f"## {section_titles[section]}")
        for item in items:
            lines.append(f"- {item.text_override or item.generated_text}")
        lines.append("")
    response = HttpResponse("\n".join(lines), content_type="text/markdown; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="digest-{date}.md"'
    return response
