import json
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile
from apps.content.models import Article, Source
from apps.digest.models import Digest
from apps.digest.services import generate_digest
from apps.intel.models import Category, Claim, Entry, Game, Snapshot


class DigestTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()
        self.client.force_login(self.user)
        self.today = date(2026, 10, 17)
        self.yesterday = self.today - timedelta(days=1)
        cat1 = Category.objects.create(level=1, name="休闲益智")
        cat2 = Category.objects.create(level=2, name="消除", parent=cat1)
        self.game = Game.objects.create(canonical_name="抓大鹅", category=cat2)
        self.source = Source.objects.create(name="游戏葡萄", weight=5)
        self.article = Article.objects.create(
            title="观点文章", source=self.source, ingest_method=Article.Method.FULLTEXT,
            raw_text="抓大鹅重回榜首", is_draft=False,
        )
        Claim.objects.create(
            article=self.article, subject_type="game", subject_id=self.game.id,
            claim_text="抓大鹅重回榜首", quote="抓大鹅重回榜首", stance="positive",
            confidence=0.9, verify_status="confirmed",
        )
        for observed_date, rank in [(self.yesterday, 5), (self.today, 1)]:
            snapshot = Snapshot.objects.create(
                platform="wechat_mini", board_type="hot", observed_date=observed_date,
                source_type="official_original", status="confirmed", authority_score=1, entry_count=1,
            )
            Entry.objects.create(
                snapshot=snapshot, rank=rank, game=self.game, raw_name="抓大鹅",
                trend="up" if observed_date == self.today else "flat",
                delta=4 if observed_date == self.today else 0,
            )

    def test_generate_finalize_lock_and_export(self):
        digest = generate_digest(self.today, self.user)
        self.assertEqual(digest.status, Digest.Status.DRAFT)
        self.assertTrue(digest.items.filter(section="overview").exists())
        self.assertTrue(digest.items.filter(section="claims").exists())

        response = self.client.post(f"/api/digests/{self.today}/finalize")
        self.assertEqual(response.status_code, 200)
        digest.refresh_from_db()
        self.assertEqual(digest.status, Digest.Status.REVIEWED)

        item = digest.items.first()
        response = self.client.patch(
            f"/api/digest-items/{item.id}",
            data=json.dumps({"text_override": "不能改"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)

        response = self.client.get(f"/api/digests/{self.today}/export")
        self.assertEqual(response.status_code, 200)
        self.assertIn("已定稿", response.content.decode("utf-8"))

    def test_regenerate_after_review_returns_409(self):
        digest = generate_digest(self.today, self.user)
        digest.status = Digest.Status.REVIEWED
        digest.save()
        response = self.client.post(
            "/api/digests/generate",
            data=json.dumps({"date": self.today.isoformat()}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)
