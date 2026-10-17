import json
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile
from apps.content.models import Article, Source
from apps.intel.models import Category, Claim, Conflict, Game, Observation


class ReviewApiTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()
        self.client.force_login(self.user)
        self.source = Source.objects.create(name="罗斯基", platforms=["wechat_mini"])
        self.article = Article.objects.create(
            title="待核文章", source=self.source, ingest_method=Article.Method.FULLTEXT,
            raw_text="猪猪侠快跑进入榜单", is_draft=False,
        )
        cat1 = Category.objects.create(level=1, name="休闲益智")
        self.cat2 = Category.objects.create(level=2, name="消除", parent=cat1)
        self.observation = Observation.objects.create(
            article=self.article, platform="wechat_mini", board_type="hot",
            observed_date=date(2026, 10, 17), rank=2, raw_game_name="猪猪侠快跑正版",
            source_type=Observation.SourceType.CITATION,
        )
        self.claim = Claim.objects.create(
            article=self.article, subject_type="game", subject_id=None,
            claim_text="猪猪侠快跑可能成为黑马", quote="猪猪侠快跑进入榜单",
            stance="positive", confidence=0.8, verify_status="pending",
        )

    def test_map_observation_creates_game_and_alias(self):
        response = self.client.post(
            f"/api/review/observations/{self.observation.id}/map",
            data=json.dumps({"new_game_name": "猪猪侠快跑", "category_id": self.cat2.id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.observation.refresh_from_db()
        self.assertIsNotNone(self.observation.game_id)
        self.assertTrue(Game.objects.filter(canonical_name="猪猪侠快跑").exists())
        self.assertTrue(self.observation.game.aliases.filter(alias="猪猪侠快跑正版").exists())

    def test_claim_verify(self):
        response = self.client.post(
            f"/api/review/claims/{self.claim.id}/verify",
            data=json.dumps({"status": "confirmed"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.claim.refresh_from_db()
        self.assertEqual(self.claim.verify_status, "confirmed")

    def test_conflict_resolve_and_lock(self):
        conflict = Conflict.objects.create(
            subject_type="game", subject_id=1, conflict_type=Conflict.Type.RANKING,
            platform="wechat_mini", board_type="hot", observed_date=date(2026, 10, 17),
            official_rank=1, citation_rank=3,
        )
        response = self.client.post(
            f"/api/conflicts/{conflict.id}/resolve",
            data=json.dumps({"status": "kept", "note": "保留双方口径"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        conflict.refresh_from_db()
        self.assertEqual(conflict.status, Conflict.Status.KEPT)
        self.assertEqual(conflict.resolution_note, "保留双方口径")
        response = self.client.post(
            f"/api/conflicts/{conflict.id}/resolve",
            data=json.dumps({"status": "resolved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)
