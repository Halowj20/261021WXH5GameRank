from django.urls import path

from . import api

urlpatterns = [
    path("digests/generate", api.generate),
    path("digests/<str:date>", api.detail),
    path("digests/<str:date>/reorder", api.reorder),
    path("digests/<str:date>/finalize", api.finalize),
    path("digests/<str:date>/export", api.export_markdown),
    path("digest-items/<int:item_id>", api.update_item),
    path("digest-items/<int:item_id>/delete", api.delete_item),
    path("digest-items/<int:item_id>/source", api.item_source),
]
