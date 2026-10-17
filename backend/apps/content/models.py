from django.db import models

from apps.core.models import TimeStampedModel


class Source(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "启用"
        PAUSED = "paused", "暂停"

    name = models.CharField(max_length=128, unique=True)
    platforms = models.JSONField(default=list)
    weight = models.PositiveSmallIntegerField(default=3)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["name"]


class Article(TimeStampedModel):
    class Method(models.TextChoices):
        LINK = "link", "链接"
        SCREENSHOT = "screenshot", "截图"
        FULLTEXT = "fulltext", "全文"

    class Status(models.TextChoices):
        RECEIVED = "received", "已接收"
        FETCHED = "fetched", "已抓取"
        PARSED = "parsed", "已解析"
        DEDUPED = "deduped", "已去重"
        EXTRACTED = "extracted", "已抽取"
        CATEGORIZED = "categorized", "已归类"
        NEEDS_REVIEW = "needs_review", "待人工确认"
        FAILED = "failed", "失败"
        PUBLISHED = "published", "已发布"

    source = models.ForeignKey(Source, null=True, blank=True, on_delete=models.SET_NULL, related_name="articles")
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=1024, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    fetched_at = models.DateTimeField(null=True, blank=True)
    raw_text = models.TextField(blank=True)
    raw_html = models.TextField(blank=True)
    ingest_method = models.CharField(max_length=16, choices=Method.choices)
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)
    parse_status = models.CharField(max_length=24, choices=Status.choices, default=Status.RECEIVED, db_index=True)
    failure_reason = models.TextField(blank=True)
    is_draft = models.BooleanField(default=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class Asset(TimeStampedModel):
    class Type(models.TextChoices):
        SCREENSHOT = "screenshot", "截图"
        TABLE = "table", "表格"
        COVER = "cover", "封面"

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="assets")
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.SCREENSHOT)
    file = models.FileField(upload_to="assets/%Y/%m/%d/")
    ocr_text = models.TextField(blank=True)
    ocr_confidence = models.FloatField(null=True, blank=True)
