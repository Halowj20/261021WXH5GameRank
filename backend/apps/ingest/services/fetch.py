from dataclasses import dataclass

import requests
import trafilatura


@dataclass
class FetchResult:
    title: str
    text: str
    html: str


class FetchError(RuntimeError):
    pass


def fetch_article(url: str) -> FetchResult:
    try:
        response = requests.get(url, timeout=20, headers={"User-Agent": "RankingIntel/1.0"})
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FetchError(f"抓取失败：{exc}") from exc
    html = response.text
    if not response.encoding or response.encoding.lower() in {"iso-8859-1", "ascii"}:
        response.encoding = response.apparent_encoding or "utf-8"
        html = response.text
    text = trafilatura.extract(html) or ""
    metadata = trafilatura.extract_metadata(html)
    title = metadata.title if metadata and metadata.title else url
    if not text.strip():
        raise FetchError("未提取到有效正文")
    return FetchResult(title=title, text=text, html=html)
