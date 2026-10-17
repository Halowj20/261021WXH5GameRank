from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel

from .catalog import Game


class Observation(TimeStampedModel):
    class SourceType(models.TextChoices):
        OFFICIAL = "official_original", "官方原始"
        CITATION = "article_citation", "公众号转述"
        MANUAL = "manual", "人工整理"

    article = models.ForeignKey(
        "content.Article", null=True, blank=True, on_delete=models.CASCADE, related_name="observations"
    )
    asset = models.ForeignKey(
        "content.Asset", null=True, blank=True, on_delete=models.SET_NULL, related_name="observations"
    )
    platform = models.CharField(
        max_length=32, choices=[("wechat_mini", "微信小游戏"), ("douyin_mini", "抖音小游戏")]
    )
    board_type = models.CharField(
        max_length=16, choices=[("hot", "热门榜"), ("revenue", "畅销榜"), ("new", "新游榜")]
    )
    observed_date = models.DateField()
    rank = models.PositiveSmallIntegerField()
    game = models.ForeignKey(Game, null=True, blank=True, on_delete=models.SET_NULL, related_name="observations")
    raw_game_name = models.CharField(max_length=128)
    trend_raw = models.CharField(max_length=64, blank=True)
    source_type = models.CharField(max_length=24, choices=SourceType.choices)
    confidence = models.FloatField(default=1)

    class Meta:
        indexes = [models.Index(fields=["platform", "board_type", "observed_date"])]
        ordering = ["rank", "id"]


class Snapshot(TimeStampedModel):
    class Status(models.TextChoices):
        PROVISIONAL = "provisional", "暂定"
        CONFIRMED = "confirmed", "已确认"

    platform = models.CharField(max_length=32)
    board_type = models.CharField(max_length=16)
    observed_date = models.DateField()
    source_type = models.CharField(max_length=24)
    authority_score = models.FloatField(default=0)
    entry_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PROVISIONAL)

    class Meta:
        unique_together = [("platform", "board_type", "observed_date", "source_type")]
        ordering = ["-observed_date", "platform", "board_type"]


class Entry(TimeStampedModel):
    class Trend(models.TextChoices):
        UP = "up", "上升"
        DOWN = "down", "下降"
        NEW = "new", "新进"
        OUT = "out", "掉榜"
        FLAT = "flat", "持平"

    snapshot = models.ForeignKey(Snapshot, on_delete=models.CASCADE, related_name="entries")
    rank = models.PositiveSmallIntegerField()
    game = models.ForeignKey(Game, null=True, blank=True, on_delete=models.SET_NULL, related_name="entries")
    raw_name = models.CharField(max_length=128)
    trend = models.CharField(max_length=8, choices=Trend.choices, default=Trend.FLAT)
    delta = models.IntegerField(null=True, blank=True)
    evidence_observation_ids = models.JSONField(default=list)

    class Meta:
        unique_together = [("snapshot", "rank")]
        ordering = ["rank"]


class Conflict(TimeStampedModel):
    class Type(models.TextChoices):
        JUDGEMENT = "judgement", "观点"
        RANKING = "ranking", "名次"

    class Status(models.TextChoices):
        OPEN = "open", "待处理"
        RESOLVED = "resolved", "已核实"
        KEPT = "kept", "保留分歧"

    subject_type = models.CharField(max_length=16)
    subject_id = models.BigIntegerField(null=True, blank=True)
    window_start = models.DateField(null=True, blank=True)
    window_end = models.DateField(null=True, blank=True)
    claim_ids = models.JSONField(default=list)
    conflict_type = models.CharField(max_length=16, choices=Type.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    source = models.ForeignKey("content.Source", null=True, blank=True, on_delete=models.SET_NULL)
    article = models.ForeignKey("content.Article", null=True, blank=True, on_delete=models.SET_NULL)
    official_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    citation_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    platform = models.CharField(max_length=32, blank=True)
    board_type = models.CharField(max_length=16, blank=True)
    observed_date = models.DateField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="resolved_conflicts"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["conflict_type", "status"])]
        ordering = ["-created_at"]
