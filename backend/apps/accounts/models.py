from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class UserProfile(TimeStampedModel):
    class Role(models.TextChoices):
        OPERATOR = "operator", "运营"
        LEAD = "lead", "负责人"
        ADMIN = "admin", "管理员"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.OPERATOR)
    title = models.CharField(max_length=64, blank=True)
