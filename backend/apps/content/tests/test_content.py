import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile
from apps.content.models import Article, Source


class ContentApiTest(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(username="admin", password="admin123")
        self.admin.profile.role = UserProfile.Role.ADMIN
        self.admin.profile.save()
        self.operator = get_user_model().objects.create_user(username="op", password="op12345")
        self.source = Source.objects.create(name="游戏葡萄", platforms=["wechat_mini"], weight=5)
        self.article = Article.objects.create(
            title="示例文章", url="https://example.com/a", source=self.source,
            ingest_method=Article.Method.LINK, raw_text="正文", is_draft=False,
        )

    def test_sources_require_login(self):
        self.assertEqual(self.client.get("/api/sources").status_code, 401)

    def test_admin_can_create_source_and_operator_cannot(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            "/api/sources/create",
            data=json.dumps({"name": "罗斯基", "platforms": ["wechat_mini"], "weight": 4}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.client.force_login(self.operator)
        response = self.client.post(
            "/api/sources/create",
            data=json.dumps({"name": "DataEye"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_article_detail_returns_observations_and_claims(self):
        self.client.force_login(self.operator)
        response = self.client.get(f"/api/articles/{self.article.id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["title"], "示例文章")
        self.assertEqual(data["raw_text"], "正文")
        self.assertEqual(data["observations"], [])
        self.assertEqual(data["claims"], [])

    def test_article_list_hides_nothing_by_default(self):
        self.client.force_login(self.operator)
        response = self.client.get("/api/articles")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["data"]), 1)
