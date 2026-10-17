import json

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from apps.accounts.models import UserProfile
from apps.content.models import Article
from apps.intel.models import Category, Claim, Game, Observation, Snapshot


@override_settings(TASKS_SYNC=True)
class FulltextIngestTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()
        self.client.force_login(self.user)
        cat1 = Category.objects.create(level=1, name="休闲益智")
        cat2 = Category.objects.create(level=2, name="消除", parent=cat1)
        self.game1 = Game.objects.create(canonical_name="抓大鹅", category=cat2)
        self.game2 = Game.objects.create(canonical_name="羊了个羊", category=cat2)
        self.game3 = Game.objects.create(canonical_name="向僵尸开炮", category=cat2)

    def test_fulltext_creates_draft_observations_and_claims_then_confirms(self):
        text = "抓大鹅依靠强社交传播重回榜首。向僵尸开炮保持强势。"
        response = self.client.post(
            "/api/ingest/fulltext",
            data=json.dumps({"title": "联调文章", "text": text}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        article_data = response.json()["data"]["articles"][0]
        article = Article.objects.get(id=article_data["id"])
        self.assertTrue(article.is_draft)
        self.assertEqual(article.parse_status, Article.Status.EXTRACTED)
        self.assertEqual(Observation.objects.filter(article=article).count(), 3)
        self.assertEqual(Claim.objects.filter(article=article).count(), 1)

        response = self.client.post(
            "/api/ingest/confirm",
            data=json.dumps({"ids": [article.id]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        article.refresh_from_db()
        self.assertFalse(article.is_draft)
        self.assertTrue(Snapshot.objects.filter(observed_date=article.observations.first().observed_date).exists())

    def test_duplicate_fulltext_is_not_created_twice(self):
        payload = {"title": "重复文章", "text": "抓大鹅依靠强社交传播重回榜首。"}
        first = self.client.post("/api/ingest/fulltext", data=json.dumps(payload), content_type="application/json")
        second = self.client.post("/api/ingest/fulltext", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertTrue(second.json()["data"]["articles"][0]["duplicate"])
        self.assertEqual(Article.objects.count(), 1)
