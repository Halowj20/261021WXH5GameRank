import json

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.accounts.models import UserProfile
from apps.core.api import fail, ok
from apps.core.permissions import role_required


def member_payload(user):
    profile = getattr(user, "profile", None)
    return {
        "id": user.id,
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "role": profile.role if profile else "operator",
        "title": profile.title if profile else "",
        "is_active": user.is_active,
    }


@role_required("admin")
@require_GET
def list_members(request):
    users = get_user_model().objects.select_related("profile").order_by("id")
    return ok([member_payload(user) for user in users])


@role_required("admin")
@require_POST
def create_member(request):
    payload = json.loads(request.body or "{}")
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    role = payload.get("role", UserProfile.Role.OPERATOR)
    if not username or len(password) < 6:
        return fail("invalid_member", "用户名必填，密码至少 6 位", 400)
    if get_user_model().objects.filter(username=username).exists():
        return fail("duplicate_member", "用户名已存在", 409)
    user = get_user_model().objects.create_user(username=username, password=password)
    user.profile.role = role
    user.profile.title = payload.get("title", "")
    user.profile.save()
    return ok(member_payload(user), status=201)


@role_required("admin")
@require_http_methods(["PATCH"])
def update_member(request, user_id):
    user = get_object_or_404(get_user_model(), id=user_id)
    payload = json.loads(request.body or "{}")
    profile = user.profile
    if "role" in payload:
        profile.role = payload["role"]
    if "title" in payload:
        profile.title = payload["title"]
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
        user.save(update_fields=["is_active"])
    profile.save()
    return ok(member_payload(user))
