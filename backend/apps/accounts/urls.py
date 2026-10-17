from django.urls import path

from . import api, members

urlpatterns = [
    path("csrf", api.csrf),
    path("login", api.login_view),
    path("me", api.me),
    path("logout", api.logout_view),
    path("members", members.list_members),
    path("members/create", members.create_member),
    path("members/<int:user_id>", members.update_member),
]
