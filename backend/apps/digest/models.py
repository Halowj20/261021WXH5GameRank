from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Digest(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "草稿"
        REVIEWED = "reviewed", "已定稿"
        PUBLISHED = "published", "已发布"

    digest_date = models.DateField(unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    generated_at = models.DateTimeField()
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    version = models.PositiveIntegerField(default=1)


class DigestItem(TimeStampedModel):
    class Section(models.TextChoices):
        OVERVIEW = "overview", "今日概览"
        WECHAT = "wechat", "微信小游戏榜"
        DOUYIN = "douyin", "抖音小游戏榜"
        CATEGORY = "category", "品类动态"
        CLAIMS = "claims", "值得关注的观点"
        PENDING = "pending", "待核实事项"

    class RefType(models.TextChoices):
        SNAPSHOT = "snapshot", "快照"
        CLAIM = "claim", "观点"
        CONFLICT = "conflict", "分歧"
        REVIEW = "review", "待核"

    digest = models.ForeignKey(Digest, on_delete=models.CASCADE, related_name="items")
    section = models.CharField(max_length=16, choices=Section.choices)
    order = models.PositiveIntegerField(default=0)
    ref_type = models.CharField(max_length=16, choices=RefType.choices)
    ref_id = models.CharField(max_length=64)
    generated_text = models.TextField()
    is_included = models.BooleanField(default=True)
    text_override = models.TextField(blank=True)
    editor_note = models.TextField(blank=True)

    class Meta:
        ordering = ["section", "order", "id"]
