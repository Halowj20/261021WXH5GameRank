from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        database = "ok"
        status_code = 200
    except Exception:
        database = "error"
        status_code = 503
    return JsonResponse(
        {"data": {"status": "ok" if database == "ok" else "degraded", "database": database}},
        status=status_code,
    )
