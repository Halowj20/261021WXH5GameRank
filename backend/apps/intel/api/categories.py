import json

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.core.api import fail, ok
from apps.core.audit import log_action
from apps.core.permissions import role_required
from apps.intel.models import Category
from apps.intel.services.catalog import category_tree


def category_payload(category):
    return {
        "id": category.id,
        "name": category.name,
        "level": category.level,
        "parent_id": category.parent_id,
        "sort": category.sort,
        "status": category.status,
    }


@require_GET
def tree(request):
    return ok(category_tree())


@require_GET
def list_categories(request):
    qs = Category.objects.all()
    if request.GET.get("level"):
        qs = qs.filter(level=int(request.GET["level"]))
    return ok([category_payload(category) for category in qs])


@role_required("admin")
@require_POST
def create_category(request):
    payload = json.loads(request.body or "{}")
    name = (payload.get("name") or "").strip()
    if not name:
        return fail("invalid_name", "品类名称不能为空", 400)
    parent = None
    level = 1
    if payload.get("parent_id"):
        parent = get_object_or_404(Category, id=payload["parent_id"])
        level = parent.level + 1
    if level > 3:
        return fail("max_depth", "品类最多三级", 400)
    if Category.objects.filter(parent=parent, name=name).exists():
        return fail("duplicate_category", "同级品类已存在", 409)
    category = Category(parent=parent, level=level, name=name, sort=payload.get("sort", 0))
    try:
        category.full_clean()
    except ValidationError as exc:
        return fail("invalid_category", "；".join(exc.messages), 400)
    category.save()
    log_action(request.user, "category.create", category, after=category_payload(category))
    return ok(category_payload(category), status=201)


@role_required("admin")
@require_http_methods(["PATCH"])
def update_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    payload = json.loads(request.body or "{}")
    before = category_payload(category)
    if "name" in payload:
        category.name = payload["name"].strip()
    if "sort" in payload:
        category.sort = payload["sort"]
    if "status" in payload:
        category.status = payload["status"]
    try:
        category.full_clean()
    except ValidationError as exc:
        return fail("invalid_category", "；".join(exc.messages), 400)
    category.save()
    log_action(request.user, "category.update", category, before=before, after=category_payload(category))
    return ok(category_payload(category))
