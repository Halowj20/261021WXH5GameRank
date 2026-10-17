from django.db import models

from apps.core.models import TimeStampedModel


class Claim(TimeStampedModel):
    class SubjectType(models.TextChoices):
        GAME = "game", "游戏"
        CATEGORY = "category", "品类"
        MARKET = "market", "大盘"

    class Stance(models.TextChoices):
        POSITIVE = "positive", "看好"
        NEGATIVE = "negative", "看衰"
        NEUTRAL = "neutral", "中性"

    class VerifyStatus(models.TextChoices):
        PENDING = "pending", "待核"
        CONFIRMED = "confirmed", "已确认"
        DISPUTED = "disputed", "有分歧"

    article = models.ForeignKey("content.Article", on_delete=models.CASCADE, related_name="claims")
    subject_type = models.CharField(max_length=16, choices=SubjectType.choices)
    subject_id = models.BigIntegerField(null=True, blank=True)
    claim_text = models.TextField()
    stance = models.CharField(max_length=16, choices=Stance.choices, default=Stance.NEUTRAL)
    confidence = models.FloatField(default=0)
    quote = models.TextField(blank=True)
    quote_start = models.IntegerField(null=True, blank=True)
    quote_end = models.IntegerField(null=True, blank=True)
    extracted_by = models.CharField(max_length=8, choices=[("ai", "AI"), ("human", "人工")], default="ai")
    verify_status = models.CharField(max_length=16, choices=VerifyStatus.choices, default=VerifyStatus.PENDING)

    class Meta:
        ordering = ["-created_at"]
