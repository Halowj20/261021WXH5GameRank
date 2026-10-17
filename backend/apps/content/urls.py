from django.urls import path

from . import api

urlpatterns = [
    path("sources", api.list_sources),
    path("sources/create", api.create_source),
    path("sources/<int:source_id>", api.update_source),
    path("articles", api.list_articles),
    path("articles/<int:article_id>", api.article_detail),
]
