from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile
from apps.intel.models import Alias, Category, Game
from apps.intel.services.catalog import normalize_name, resolve_game


class CatalogTest(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(username="admin", password="admin123")
        self.admin.profile.role = UserProfile.Role.ADMIN
        self.admin.profile.save()
        self.l1 = Category.objects.create(level=1, name="休闲益智")
        self.l2 = Category.objects.create(level=2, name="消除", parent=self.l1)
        self.l3 = Category.objects.create(level=3, name="三消", parent=self.l2)
        self.game = Game.objects.create(canonical_name="抓大鹅", category=self.l3)
        Alias.objects.create(game=self.game, alias="抓大鹅正版")

    def test_normalize_and_alias_resolution(self):
        self.assertEqual(normalize_name("抓 大鹅"), "抓大鹅")
        self.assertEqual(resolve_game("抓大鹅正版"), self.game)

    def test_category_cannot_exceed_three_levels(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            "/api/categories/create",
            data={"parent_id": self.l3.id, "name": "第四级"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "max_depth")

    def test_admin_can_create_category(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            "/api/categories/create",
            data={"parent_id": self.l1.id, "name": "解谜"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["level"], 2)

    def test_game_list_returns_current_rank_fields(self):
        self.client.force_login(self.admin)
        response = self.client.get("/api/games")
        self.assertEqual(response.status_code, 200)
        item = response.json()["data"][0]
        self.assertEqual(item["name"], "抓大鹅")
        self.assertEqual(item["category_path"], ["休闲益智", "消除", "三消"])
