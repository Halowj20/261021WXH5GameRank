from django.core.management.base import BaseCommand

from apps.intel.models import Alias, Category, Game, Tag

TREE = {
    "休闲益智": {"消除": ["三消", "合成消除"], "解谜": ["物理解谜"]},
    "策略": {"塔防": ["放置塔防", "传统塔防"]},
    "模拟经营": {"经营养成": ["餐厅", "农场"]},
    "角色扮演": {"放置RPG": ["挂机", "卡牌放置"]},
    "休闲竞技": {"派对": ["派对竞技", "io竞技"]},
}

GAMES = [
    ("抓大鹅", "疯狂游戏", ["wechat_mini"], ("休闲益智", "消除", "三消"), ["抓大鹅正版"]),
    ("羊了个羊", "简游科技", ["wechat_mini"], ("休闲益智", "消除", "三消"), []),
    ("向僵尸开炮", "海彼游戏", ["wechat_mini", "douyin_mini"], ("策略", "塔防", "放置塔防"), ["僵尸开炮"]),
    ("咸鱼之王", "青瓷游戏", ["wechat_mini"], ("角色扮演", "放置RPG", "卡牌放置"), ["咸鱼"]),
    ("小小蚁国", "星合互动", ["wechat_mini"], ("模拟经营", "经营养成", "农场"), []),
    ("元梦之星", "腾讯", ["wechat_mini", "douyin_mini"], ("休闲竞技", "派对", "派对竞技"), ["元梦"]),
    ("蛋仔派对", "网易", ["douyin_mini"], ("休闲竞技", "派对", "派对竞技"), ["蛋仔"]),
    ("寻道大千", "三七互娱", ["wechat_mini"], ("角色扮演", "放置RPG", "挂机"), ["寻道"]),
    ("这城有良田", "益世界", ["wechat_mini"], ("模拟经营", "经营养成", "农场"), []),
    ("贪吃蛇大作战", "微派网络", ["wechat_mini", "douyin_mini"], ("休闲竞技", "派对", "io竞技"), ["贪吃蛇"]),
]


class Command(BaseCommand):
    help = "创建三级品类、标签与演示游戏"

    def handle(self, *args, **options):
        category_map = {}
        for l1_name, l2_map in TREE.items():
            l1, _ = Category.objects.get_or_create(parent=None, name=l1_name, defaults={"level": 1})
            for l2_name, l3_names in l2_map.items():
                l2, _ = Category.objects.get_or_create(parent=l1, name=l2_name, defaults={"level": 2})
                for l3_name in l3_names:
                    l3, _ = Category.objects.get_or_create(parent=l2, name=l3_name, defaults={"level": 3})
                    category_map[(l1_name, l2_name, l3_name)] = l3

        tags = [
            ("合成", "gameplay"),
            ("放置", "gameplay"),
            ("社交裂变", "gameplay"),
            ("卡通", "art"),
            ("广告变现", "monetization"),
            ("长线运营", "lifecycle"),
        ]
        tag_map = {}
        for name, dimension in tags:
            tag, _ = Tag.objects.get_or_create(name=name, dimension=dimension)
            tag_map[name] = tag

        for name, publisher, platforms, path, aliases in GAMES:
            game, _ = Game.objects.get_or_create(
                canonical_name=name,
                defaults={
                    "publisher": publisher,
                    "developer": publisher,
                    "platforms": platforms,
                    "category": category_map[path],
                    "category_source": "human",
                    "category_confidence": 1,
                },
            )
            game.category = category_map[path]
            game.platforms = platforms
            game.save()
            for alias in aliases:
                Alias.objects.get_or_create(
                    game=game,
                    alias=alias,
                    defaults={"alias_type": Alias.AliasType.ARTICLE},
                )

        self.stdout.write(self.style.SUCCESS(f"seed_catalog done: {Category.objects.count()} categories, {Game.objects.count()} games"))
