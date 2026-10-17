import json
import time

from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.core.api import fail, ok
from apps.core.models import SystemSetting
from apps.core.permissions import role_required
from apps.ingest.services.llm import LLMError, complete_json


def masked_config(value):
    data = dict(value or {})
    api_key = data.get("api_key", "")
    if api_key:
        data["api_key"] = "sk-****" if not api_key.startswith("sk-") else "sk-****"
    data["ocr_engine"] = "RapidOCR"
    return data


@role_required("admin")
@require_GET
def get_model_settings(request):
    setting = SystemSetting.objects.filter(key="llm").first()
    return ok(masked_config(setting.value if setting else {}))


@role_required("admin")
@require_http_methods(["PATCH"])
def update_model_settings(request):
    payload = json.loads(request.body or "{}")
    setting = SystemSetting.objects.filter(key="llm").first()
    current = dict(setting.value) if setting else {}
    for field in ("base_url", "model", "api_key"):
        if field in payload:
            value = payload[field]
            if field == "api_key" and value in ("sk-****", "******"):
                continue
            current[field] = value
    if setting:
        setting.value = current
        setting.save()
    else:
        setting = SystemSetting.objects.create(key="llm", value=current)
    return ok(masked_config(setting.value))


@role_required("admin")
@require_POST
def test_model(request):
    start = time.time()
    try:
        complete_json("只输出 JSON。", "返回 {\"ok\": true}")
    except LLMError as exc:
        return fail("llm_error", str(exc), 502)
    return ok({"ok": True, "latency_ms": int((time.time() - start) * 1000)})
