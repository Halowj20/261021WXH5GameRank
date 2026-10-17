import json
import logging
import re
from datetime import date

from apps.ingest.services.bundle import ClaimDraft, ExtractionResult, RankingBlock, RankingItem
from apps.ingest.services.llm import complete_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是小游戏榜单情报分析助手。只输出 JSON，不要输出 Markdown。
输出结构：
{
  "rankings": [
    {"platform": "wechat_mini|douyin_mini", "board_type": "hot|revenue|new",
     "observed_date": "YYYY-MM-DD", "source_type": "official_original|article_citation|manual",
     "items": [{"rank": 1, "name": "游戏名", "trend": "up|down|new|out|flat", "delta": 1}]}
  ],
  "claims": [
    {"subject_type": "game|category|market", "subject_name": "对象名",
     "stance": "positive|negative|neutral", "claim_text": "观点",
     "quote": "原文中的原句", "confidence": 0.9}
  ]
}
规则：quote 必须逐字来自原文；不确定的字段留空或使用 flat；不要编造榜单。"""


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value or "")


def quote_in_text(quote: str, text: str) -> bool:
    return bool(quote) and normalize_text(quote) in normalize_text(text)


class FixtureExtractor:
    """本地无模型 Key 时打通链路的固定抽取器；日志明确标记，不作为生产默认。"""

    def extract(self, article):
        logger.warning("using fixture extractor for article %s", article.id)
        today = date.today().isoformat()
        quote = (article.raw_text or "")[:80]
        return ExtractionResult(
            rankings=[
                RankingBlock(
                    platform="wechat_mini",
                    board_type="hot",
                    observed_date=today,
                    source_type="article_citation",
                    items=[
                        RankingItem(rank=1, name="抓大鹅", trend="up", delta=3),
                        RankingItem(rank=2, name="羊了个羊", trend="flat", delta=0),
                        RankingItem(rank=3, name="向僵尸开炮", trend="new", delta=None),
                    ],
                )
            ],
            claims=[
                ClaimDraft(
                    subject_type="game",
                    subject_name="抓大鹅",
                    stance="positive",
                    claim_text="抓大鹅依靠强社交传播重回榜首。",
                    quote=quote,
                    confidence=0.9,
                )
            ]
            if quote
            else [],
        )


class LLMExtractor:
    def extract(self, article):
        user_prompt = f"标题：{article.title}\n正文：\n{(article.raw_text or '')[:12000]}"
        payload = complete_json(SYSTEM_PROMPT, user_prompt)
        result = ExtractionResult()
        for block in payload.get("rankings", []):
            items = [
                RankingItem(
                    rank=int(item.get("rank", 0)),
                    name=str(item.get("name", "")).strip(),
                    trend=item.get("trend", "flat"),
                    delta=item.get("delta"),
                )
                for item in block.get("items", [])
                if item.get("name") and int(item.get("rank", 0)) > 0
            ]
            if items:
                result.rankings.append(
                    RankingBlock(
                        platform=block.get("platform", "wechat_mini"),
                        board_type=block.get("board_type", "hot"),
                        observed_date=block.get("observed_date") or date.today().isoformat(),
                        source_type=block.get("source_type", "article_citation"),
                        items=items,
                    )
                )
        for claim in payload.get("claims", []):
            if claim.get("claim_text") and claim.get("quote"):
                result.claims.append(
                    ClaimDraft(
                        subject_type=claim.get("subject_type", "game"),
                        subject_name=claim.get("subject_name", ""),
                        stance=claim.get("stance", "neutral"),
                        claim_text=claim["claim_text"],
                        quote=claim["quote"],
                        confidence=float(claim.get("confidence", 0.5)),
                    )
                )
        return result


def extract_article(article):
    from django.conf import settings

    if settings.LLM_API_KEY:
        return LLMExtractor().extract(article)
    return FixtureExtractor().extract(article)
