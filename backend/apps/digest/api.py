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
