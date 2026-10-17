from functools import wraps

from .api import fail


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return fail("unauthenticated", "请先登录", 401)
            role = getattr(getattr(request.user, "profile", None), "role", None)
            if role not in roles:
                return fail("forbidden", "当前角色无权限", 403)
            return view(request, *args, **kwargs)

        return wrapper

    return decorator
