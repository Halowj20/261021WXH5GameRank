import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.core.api import fail, ok


def user_payload(user):
    profile = getattr(user, "profile", None)
    return {
        "id": user.id,
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "role": profile.role if profile else "operator",
    }


@ensure_csrf_cookie
@require_GET
def csrf(request):
    return ok({"csrf": "cookie"})


@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return fail("invalid_json", "请求体不是合法 JSON", 400)
    user = authenticate(request, username=payload.get("username", ""), password=payload.get("password", ""))
    if not user:
        return fail("invalid_credentials", "用户名或密码错误", 401)
    login(request, user)
    return ok(user_payload(user))


@require_GET
def me(request):
    if not request.user.is_authenticated:
        return fail("unauthenticated", "请先登录", 401)
    return ok(user_payload(request.user))


@require_POST
def logout_view(request):
    logout(request)
    return ok({"ok": True})
