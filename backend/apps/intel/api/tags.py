import json

from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.core.api import fail, ok
from apps.core.permissions import role_required
from apps.intel.models import Tag


def tag_payload(tag):
    return {"id": tag.id, "name": tag.name, "dimension": tag.dimension, "status": tag.status}


@require_GET
def list_tags(request):
    qs = Tag.objects.all()
    if request.GET.get("dimension"):
        qs = qs.filter(dimension=request.GET["dimension"])
    return ok([tag_payload(tag) for tag in qs])


@role_required("admin")
@require_POST
def create_tag(request):
    payload = json.loads(request.body or "{}")
    name = (payload.get("name") or "").strip()
    dimension = payload.get("dimension")
    if not name or dimension not in Tag.Dimension.values:
        return fail("invalid_tag", "标签名与维度必填", 400)
    tag, created = Tag.objects.get_or_create(name=name, dimension=dimension)
    if not created:
        return fail("duplicate_tag", "标签已存在", 409)
    return ok(tag_payload(tag), status=201)


@role_required("admin")
@require_http_methods(["PATCH"])
def update_tag(request, tag_id):
    tag = Tag.objects.filter(id=tag_id).first()
    if not tag:
        return fail("not_found", "标签不存在", 404)
    payload = json.loads(request.body or "{}")
    if "name" in payload:
        tag.name = payload["name"]
    if "status" in payload:
        tag.status = payload["status"]
    tag.save()
    return ok(tag_payload(tag))
