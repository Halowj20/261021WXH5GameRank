from django.http import JsonResponse


class ApiAuthMiddleware:
    """所有 /api 接口默认要求登录；auth 与 health 除外。"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if (
            path.startswith("/api/")
            and not path.startswith("/api/auth/")
            and path != "/api/health"
            and not request.user.is_authenticated
        ):
            return JsonResponse(
                {"error": {"code": "unauthenticated", "message": "请先登录", "details": {}}},
                status=401,
            )
        return self.get_response(request)
