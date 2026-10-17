from datetime import date

from django.test import TestCase

from apps.content.models import Article, Source
from apps.intel.models import Category, Conflict, Entry, Game, Observation, Snapshot
from apps.intel.services.merge import merge_day


class MergeTest(TestCase):
    def setUp(self):
        self.date = date(2026, 10, 17)
        self.source = Source.objects.create(name="游戏葡萄", platforms=["wechat_mini"])
        cat1 = Category.objects.create(level=1, name="休闲")
        cat2 = Category.objects.create(level=2, name="消除", parent=cat1)
        self.game1 = Game.objects.create(canonical_name="抓大鹅", category=cat2)
        self.game2 = Game.objects.create(canonical_name="羊了个羊", category=cat2)
        self.article = Article.objects.create(
            title="转述文章",
            url="https://example.com/citation",
            source=self.source,
            ingest_method=Article.Method.LINK,
            raw_text="正文",
            is_draft=False,
        )

    def _official_snapshot(self, ranks):
        snapshot = Snapshot.objects.create(
            platform="wechat_mini",
            board_type="hot",
            observed_date=self.date,
            source_type=Observation.SourceType.OFFICIAL,
            status=Snapshot.Status.CONFIRMED,
            authority_score=1,
            entry_count=len(ranks),
        )
        for game, rank in ranks:
            Entry.objects.create(snapshot=snapshot, rank=rank, game=game, raw_name=game.canonical_name)
        return snapshot

    def test_provisional_snapshot_from_citations(self):
        Observation.objects.create(
            article=self.article, platform="wechat_mini", board_type="hot", observed_date=self.date,
            rank=1, game=self.game1, raw_game_name="抓大鹅", source_type=Observation.SourceType.CITATION,
        )
        snapshot = merge_day("wechat_mini", "hot", self.date)
        self.assertEqual(snapshot.status, Snapshot.Status.PROVISIONAL)
        self.assertEqual(snapshot.entries.count(), 1)

    def test_official_snapshot_and_conflict(self):
        self._official_snapshot([(self.game1, 1), (self.game2, 2)])
        Observation.objects.create(
            article=self.article, platform="wechat_mini", board_type="hot", observed_date=self.date,
            rank=3, game=self.game1, raw_game_name="抓大鹅", source_type=Observation.SourceType.CITATION,
        )
        snapshot = merge_day("wechat_mini", "hot", self.date)
        self.assertEqual(snapshot.status, Snapshot.Status.PROVISIONAL)
        official = Snapshot.objects.get(
            platform="wechat_mini", board_type="hot", observed_date=self.date,
            source_type=Observation.SourceType.OFFICIAL,
        )
        self.assertEqual(official.entries.count(), 2)
        conflicts = Conflict.objects.filter(conflict_type=Conflict.Type.RANKING)
        self.assertEqual(conflicts.count(), 1)
        self.assertEqual(conflicts.first().official_rank, 1)
        self.assertEqual(conflicts.first().citation_rank, 3)

    def test_merge_is_idempotent_and_preserves_resolution(self):
        self._official_snapshot([(self.game1, 1), (self.game2, 2)])
        Observation.objects.create(
            article=self.article, platform="wechat_mini", board_type="hot", observed_date=self.date,
            rank=3, game=self.game1, raw_game_name="抓大鹅", source_type=Observation.SourceType.CITATION,
        )
        merge_day("wechat_mini", "hot", self.date)
        conflict = Conflict.objects.first()
        conflict.status = Conflict.Status.KEPT
        conflict.resolution_note = "保留双方口径"
        conflict.save()
        merge_day("wechat_mini", "hot", self.date)
        self.assertEqual(Entry.objects.filter(snapshot__source_type=Observation.SourceType.OFFICIAL).count(), 2)
        self.assertEqual(Entry.objects.filter(snapshot__source_type=Observation.SourceType.CITATION).count(), 1)
        self.assertEqual(Conflict.objects.count(), 1)
        conflict.refresh_from_db()
        self.assertEqual(conflict.status, Conflict.Status.KEPT)
        self.assertEqual(conflict.resolution_note, "保留双方口径")
