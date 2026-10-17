import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from apps.accounts.models import UserProfile
from apps.content.models import Article
from apps.ingest.services.fetch import FetchResult
from apps.intel.models import Category, Game, Observation


@override_settings(TASKS_SYNC=True)
class LinkBatchIngestTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()
        self.client.force_login(self.user)
        cat1 = Category.objects.create(level=1, name="休闲益智")
        cat2 = Category.objects.create(level=2, name="消除", parent=cat1)
        for name in ("抓大鹅", "羊了个羊", "向僵尸开炮"):
            Game.objects.create(canonical_name=name, category=cat2)

    @patch("apps.ingest.api.fetch_article")
    def test_20_links_are_all_ingested(self, fetch):
        def fake_fetch(url):
            index = url.rsplit("/", 1)[-1].replace(".html", "")
            return FetchResult(
                title=f"批量文章 {index}",
                text=f"抓大鹅依靠强社交传播重回榜首。批量文章 {index}。",
                html="<html></html>",
            )

        fetch.side_effect = fake_fetch
        urls = [f"http://example.com/batch-{index}.html" for index in range(20)]
        response = self.client.post(
            "/api/ingest/link",
            data=json.dumps({"urls": urls}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Article.objects.count(), 20)
        self.assertEqual(Observation.objects.count(), 60)
        ids = [article.id for article in Article.objects.all()]
        response = self.client.post(
            "/api/ingest/confirm",
            data=json.dumps({"ids": ids}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Article.objects.filter(is_draft=False).count(), 20)

    @patch("apps.ingest.api.fetch_article")
    def test_same_content_different_urls_is_deduplicated(self, fetch):
        fetch.return_value = FetchResult(title="同一文章", text="抓大鹅重回榜首。", html="<html></html>")
        first = self.client.post(
            "/api/ingest/link",
            data=json.dumps({"urls": ["http://example.com/a.html"]}),
            content_type="application/json",
        )
        second = self.client.post(
            "/api/ingest/link",
            data=json.dumps({"urls": ["http://example.com/b.html"]}),
            content_type="application/json",
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertTrue(second.json()["data"]["articles"][0]["duplicate"])
        self.assertEqual(Article.objects.count(), 1)
