from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import UserProfile
from apps.content.models import Article, Source
from apps.digest.models import Digest
from apps.digest.services import generate_digest
from apps.ingest.services.dedupe import content_hash
from apps.intel.models import Claim, Entry, Game, Observation, Snapshot
from apps.intel.services.merge import merge_day


class Command(BaseCommand):
    help = "创建本地演示账号、信源、榜单、待核与日报"

    def handle(self, *args, **options):
        call_command("seed_catalog")
        User = get_user_model()
        for username, password, role, title in [
            ("operator", "operator123", UserProfile.Role.OPERATOR, "平台运营"),
            ("lead", "lead123", UserProfile.Role.LEAD, "团队负责人"),
            ("admin", "admin123", UserProfile.Role.ADMIN, "管理员"),
        ]:
            user, _ = User.objects.get_or_create(username=username)
            user.set_password(password)
            user.save()
            user.profile.role = role
            user.profile.title = title
            user.profile.save()

        sources = [
            ("游戏葡萄", ["wechat_mini", "douyin_mini"], 5),
            ("罗斯基", ["wechat_mini"], 4),
            ("DataEye", ["wechat_mini", "douyin_mini"], 4),
            ("游戏陀螺", ["wechat_mini"], 3),
            ("竞核", ["douyin_mini"], 3),
            ("手游那点事", ["wechat_mini", "douyin_mini"], 3),
        ]
        source_map = {}
        for name, platforms, weight in sources:
            source, _ = Source.objects.get_or_create(
                name=name, defaults={"platforms": platforms, "weight": weight}
            )
            source_map[name] = source
        Source.objects.get_or_create(
            name="官方榜单", defaults={"platforms": ["wechat_mini", "douyin_mini"], "weight": 6}
        )

        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        games = list(Game.objects.order_by("id")[:10])
        for day in (yesterday, today):
            for platform, board in [("wechat_mini", "hot"), ("douyin_mini", "hot")]:
                snapshot, _ = Snapshot.objects.update_or_create(
                    platform=platform,
                    board_type=board,
                    observed_date=day,
                    source_type=Observation.SourceType.OFFICIAL,
                    defaults={
                        "status": Snapshot.Status.CONFIRMED,
                        "authority_score": 1,
                        "entry_count": min(10, len(games)),
                    },
                )
                snapshot.entries.all().delete()
                for index, game in enumerate(games[:10], start=1):
                    trend = "new" if day == today and index == 3 else "flat"
                    delta = 0
                    if day == today and index == 1:
                        trend, delta = "up", 3
                    if day == today and index == 2:
                        trend, delta = "down", -2
                    Entry.objects.create(
                        snapshot=snapshot,
                        rank=index,
                        game=game,
                        raw_name=game.canonical_name,
                        trend=trend,
                        delta=delta,
                        evidence_observation_ids=[],
                    )

        citation_source = source_map["游戏葡萄"]
        citation_article, _ = Article.objects.get_or_create(
            url="https://example.com/demo-citation",
            defaults={
                "title": "小游戏榜单观察：抓大鹅重回榜首",
                "source": citation_source,
                "raw_text": "抓大鹅依靠强社交传播重回榜首，向僵尸开炮保持强势。",
                "ingest_method": Article.Method.LINK,
                "content_hash": content_hash("抓大鹅依靠强社交传播重回榜首，向僵尸开炮保持强势。"),
                "parse_status": Article.Status.EXTRACTED,
                "is_draft": False,
            },
        )
        Observation.objects.filter(article=citation_article).delete()
        for game, rank in [(games[0], 3), (games[2], 2)]:
            Observation.objects.create(
                article=citation_article,
                platform="wechat_mini",
                board_type="hot",
                observed_date=today,
                rank=rank,
                game=game,
                raw_game_name=game.canonical_name,
                trend_raw='{"trend":"up","delta":3}',
                source_type=Observation.SourceType.CITATION,
                confidence=0.9,
            )

        failed_article, _ = Article.objects.get_or_create(
            url="https://example.com/demo-failed",
            defaults={
                "title": "抓取失败的示例文章",
                "source": source_map["罗斯基"],
                "ingest_method": Article.Method.LINK,
                "parse_status": Article.Status.FAILED,
                "failure_reason": "示例：目标页面需要登录",
                "is_draft": False,
            },
        )
        screenshot_article, _ = Article.objects.get_or_create(
            url="https://example.com/demo-screenshot",
            defaults={
                "title": "榜单截图示例",
                "source": source_map["DataEye"],
                "raw_text": "1 抓大鹅\n2 羊了个羊\n3 向僵尸开炮",
                "ingest_method": Article.Method.SCREENSHOT,
                "parse_status": Article.Status.NEEDS_REVIEW,
                "is_draft": False,
            },
        )
        Claim.objects.filter(article=citation_article).delete()
        Claim.objects.create(
            article=citation_article,
            subject_type="game",
            subject_id=games[0].id,
            claim_text="抓大鹅依靠强社交传播重回榜首，短期仍有上升空间。",
            stance="positive",
            confidence=0.92,
            quote="抓大鹅依靠强社交传播重回榜首",
            verify_status="confirmed",
            extracted_by="ai",
        )
        Claim.objects.create(
            article=citation_article,
            subject_type="game",
            subject_id=games[2].id,
            claim_text="向僵尸开炮的买量投放强度值得关注。",
            stance="neutral",
            confidence=0.63,
            quote="向僵尸开炮保持强势",
            verify_status="pending",
            extracted_by="ai",
        )

        merge_day("wechat_mini", "hot", today)
        merge_day("douyin_mini", "hot", today)
        if not Digest.objects.filter(digest_date=today).exists():
            generate_digest(today)

        self.stdout.write(
            self.style.SUCCESS(
                f"seed_demo done: users=3 sources={Source.objects.count()} games={Game.objects.count()} "
                f"articles={Article.objects.count()} snapshots={Snapshot.objects.count()}"
            )
        )
