from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    level = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=64)
    sort = models.IntegerField(default=0)
    status = models.CharField(max_length=16, default="active")

    class Meta:
        unique_together = [("parent", "name")]
        ordering = ["level", "sort", "id"]

    def clean(self):
        if self.level == 1 and self.parent_id:
            raise ValidationError("L1 不能有上级")
        if self.level in (2, 3) and (not self.parent_id or self.parent.level != self.level - 1):
            raise ValidationError("L2/L3 必须挂在上二级")
        if self.level > 3:
            raise ValidationError("品类最多三级")

    def __str__(self):
        return self.name


class Tag(TimeStampedModel):
    class Dimension(models.TextChoices):
        GAMEPLAY = "gameplay", "玩法"
        THEME = "theme", "题材"
        ART = "art", "美术"
        MONETIZATION = "monetization", "变现"
        LIFECYCLE = "lifecycle", "生命周期"

    name = models.CharField(max_length=64)
    dimension = models.CharField(max_length=24, choices=Dimension.choices)
    status = models.CharField(max_length=16, default="active")

    class Meta:
        unique_together = [("name", "dimension")]
        ordering = ["dimension", "name"]


class Game(TimeStampedModel):
    canonical_name = models.CharField(max_length=128, unique=True)
    publisher = models.CharField(max_length=128, blank=True)
    developer = models.CharField(max_length=128, blank=True)
    platforms = models.JSONField(default=list)
    release_date = models.DateField(null=True, blank=True)
    online_status = models.CharField(max_length=32, default="运营中")
    has_isbn = models.BooleanField(default=False)
    first_seen_at = models.DateTimeField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="games")
    category_source = models.CharField(
        max_length=8, choices=[("ai", "AI"), ("human", "人工")], default="ai"
    )
    category_confidence = models.FloatField(default=0)
    quality_flags = models.JSONField(default=list)
    tags = models.ManyToManyField(Tag, through="GameTag", related_name="games")

    class Meta:
        ordering = ["canonical_name"]

    @property
    def category_path(self):
        if not self.category:
            return []
        node = self.category
        path = [node.name]
        while node.parent_id:
            node = node.parent
            path.append(node.name)
        return list(reversed(path))


class Alias(TimeStampedModel):
    class AliasType(models.TextChoices):
        OFFICIAL = "official", "官方"
        ARTICLE = "article", "文章口径"
        ABBR = "abbr", "简称"

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="aliases")
    alias = models.CharField(max_length=128)
    source = models.ForeignKey("content.Source", null=True, blank=True, on_delete=models.SET_NULL)
    alias_type = models.CharField(max_length=16, choices=AliasType.choices, default=AliasType.ARTICLE)
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("game", "alias")]
        ordering = ["alias"]


class GameTag(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = [("game", "tag")]


class CategoryMapping(TimeStampedModel):
    source = models.ForeignKey("content.Source", on_delete=models.CASCADE)
    raw_category_text = models.CharField(max_length=128)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = [("source", "raw_category_text")]
