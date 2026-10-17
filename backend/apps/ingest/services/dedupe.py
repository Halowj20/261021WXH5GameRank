import hashlib
import re

from apps.content.models import Article


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value or "")


def content_hash(value: str) -> str:
    return hashlib.sha256(normalize_text(value).encode("utf-8")).hexdigest()


def find_duplicate(url: str | None = None, text: str | None = None, exclude_id: int | None = None):
    qs = Article.objects.all()
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    if url:
        found = qs.filter(url=url).first()
        if found:
            return found
    if text:
        found = qs.filter(content_hash=content_hash(text)).first()
        if found:
            return found
    return None
