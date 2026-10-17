from django.urls import path

from . import api

urlpatterns = [
    path("ingest/link", api.ingest_link),
    path("ingest/fulltext", api.ingest_fulltext),
    path("ingest/screenshot", api.ingest_screenshot),
    path("ingest/tasks", api.tasks),
    path("ingest/confirm", api.confirm),
    path("ingest/cancel", api.cancel),
    path("ingest/articles/<int:article_id>/retry", api.retry),
]
