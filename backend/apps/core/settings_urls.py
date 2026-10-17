from django.urls import path

from . import settings_api

urlpatterns = [
    path("settings/model", settings_api.get_model_settings),
    path("settings/model/update", settings_api.update_model_settings),
    path("settings/model/test", settings_api.test_model),
]
