import json
from datetime import date as date_cls

from apps.content.models import Article
from apps.core.tasks import runner
from apps.ingest.services.extract import extract_article, quote_in_text
from apps.intel.models import Category, Claim, Observation
from apps.intel.services.catalog import resolve_game
from apps.intel.services.merge import merge_day


def resolve_subject_id(draft):
    if draft.subject_type == "game":
        game = resolve_game(draft.subject_name)
        return game.id if game else None
    if draft.subject_type == "category":
        category = Category.objects.filter(name=draft.subject_name).first()
        return category.id if category else None
    return None


def save_extraction(article, result):
    Observation.objects.filter(article=article).delete()
    Claim.objects.filter(article=article).delete()
    affected = set()
    for block in result.rankings:
        try:
            observed_date = date_cls.fromisoformat(block.observed_date)
        except ValueError:
            observed_date = date_cls.today()
        for item in block.items:
            game = resolve_game(item.name)
            Observation.objects.create(
                article=article,
                platform=block.platform,
                board_type=block.board_type,
                observed_date=observed_date,
                rank=item.rank,
                game=game,
                raw_game_name=item.name,
                trend_raw=json.dumps({"trend": item.trend, "delta": item.delta}),
                source_type=block.source_type,
                confidence=1,
            )
            affected.add((block.platform, block.board_type, observed_date))
    for draft in result.claims:
        verified = (
            bool(draft.quote)
            and quote_in_text(draft.quote, article.raw_text)
            and draft.confidence >= 0.7
        )
        Claim.objects.create(
            article=article,
            subject_type=draft.subject_type,
            subject_id=resolve_subject_id(draft),
            claim_text=draft.claim_text,
            stance=draft.stance,
            confidence=draft.confidence,
            quote=draft.quote,
            extracted_by="ai",
            verify_status="confirmed" if verified else "pending",
        )
    return affected


def article_needs_review(article):
    return article.claims.filter(verify_status="pending").exists()


def process_article(article_id: int):
    article = Article.objects.get(id=article_id)
    try:
        article.parse_status = (
            Article.Status.FETCHED if article.ingest_method == Article.Method.LINK else Article.Status.PARSED
        )
        article.failure_reason = ""
        article.save(update_fields=["parse_status", "failure_reason", "updated_at"])

        result = extract_article(article)
        affected = save_extraction(article, result)
        article.parse_status = (
            Article.Status.NEEDS_REVIEW if article_needs_review(article) else Article.Status.EXTRACTED
        )
        article.save(update_fields=["parse_status", "updated_at"])
        if not article.is_draft:
            for platform, board, observed_date in affected:
                merge_day(platform, board, observed_date)
    except Exception as exc:
        article.parse_status = Article.Status.FAILED
        article.failure_reason = str(exc)[:2000]
        article.save(update_fields=["parse_status", "failure_reason", "updated_at"])
        raise


def process_fulltext(article):
    process_article(article.id)


def retry_article(article_id: int):
    Article.objects.filter(id=article_id).update(
        parse_status=Article.Status.RECEIVED, failure_reason=""
    )
    runner.submit(process_article, article_id)
