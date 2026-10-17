import json

import requests
from django.conf import settings


class LLMError(RuntimeError):
    pass


def complete_json(system_prompt: str, user_prompt: str) -> dict:
    if not settings.LLM_BASE_URL or not settings.LLM_API_KEY:
        raise LLMError("未配置 LLM_BASE_URL / LLM_API_KEY")
    url = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.LLM_MODEL,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=settings.LLM_TIMEOUT,
    )
    if response.status_code >= 400:
        raise LLMError(f"LLM 调用失败：{response.status_code} {response.text[:300]}")
    content = response.json()["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMError("LLM 返回不是合法 JSON") from exc
