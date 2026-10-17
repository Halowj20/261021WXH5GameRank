from datetime import timedelta

from django.utils import timezone

from apps.digest.models import Digest, DigestItem
from apps.intel.api.review import summary as review_summary
from apps.intel.models import Claim, Conflict, Entry, Game, Snapshot


class DigestLocked(RuntimeError):
    pass


def _snapshot_for(date, platform, board):
    return (
        Snapshot.objects.filter(platform=platform, board_type=board, observed_date=date)
        .prefetch_related("entries__game")
        .order_by("-authority_score", "-created_at")
        .first()
    )


def _movement_text(entry, snapshot):
    name = entry.game.canonical_name if entry.game else entry.raw_name
    if entry.trend == "new":
        return f"《{name}》新进第 {entry.rank}。"
    if entry.trend == "up":
        return f"《{name}》升至第 {entry.rank}（+{entry.delta or 0}）。"
    if entry.trend == "down":
        return f"《{name}》降至第 {entry.rank}（{entry.delta or 0}）。"
    return f"《{name}》位列第 {entry.rank}。"


def generate_digest(digest_date, actor=None):
    existing = Digest.objects.filter(digest_date=digest_date).first()
    if existing and existing.status == Digest.Status.REVIEWED:
        raise DigestLocked("日报已定稿，不能重新生成")
    digest, _ = Digest.objects.update_or_create(
        digest_date=digest_date,
        defaults={
            "status": Digest.Status.DRAFT,
            "generated_at": timezone.now(),
            "editor": actor,
            "version": (existing.version + 1) if existing else 1,
        },
    )
    digest.items.all().delete()

    platforms = [("wechat_mini", "hot", "微信小游戏热门榜"), ("douyin_mini", "hot", "抖音小游戏热门榜")]
    all_movements = []
    platform_snapshots = []
    for platform, board, label in platforms:
        snapshot = _snapshot_for(digest_date, platform, board)
        if not snapshot:
            continue
        platform_snapshots.append((snapshot, label))
        for entry in snapshot.entries.all():
            if entry.trend in ("new", "up", "down"):
                all_movements.append((entry, snapshot, label))

    order = 0
    overview_texts = []
    overview_seen = set()
    for entry, snapshot, label in all_movements:
        key = entry.game_id or entry.raw_game_name
        if key in overview_seen:
            continue
        overview_seen.add(key)
        overview_texts.append(f"{'微信' if snapshot.platform == 'wechat_mini' else '抖音'}：{_movement_text(entry, snapshot)}")
        if len(overview_texts) >= 5:
            break
    if not overview_texts:
        overview_texts = ["今日暂无已入库的榜单异动。"]
    for text in overview_texts:
        DigestItem.objects.create(
            digest=digest,
            section=DigestItem.Section.OVERVIEW,
            order=order,
            ref_type=DigestItem.RefType.SNAPSHOT,
            ref_id=str(digest_date),
            generated_text=text,
        )
        order += 1

    for snapshot, label in platform_snapshots:
        prefix = "" if snapshot.status == Snapshot.Status.CONFIRMED else "（暂定，未经官方核对）"
        for entry in snapshot.entries.all():
            if entry.trend not in ("new", "up", "down"):
                continue
            DigestItem.objects.create(
                digest=digest,
                section=DigestItem.Section.WECHAT
                if snapshot.platform == "wechat_mini"
                else DigestItem.Section.DOUYIN,
                order=entry.rank,
                ref_type=DigestItem.RefType.SNAPSHOT,
                ref_id=str(snapshot.id),
                generated_text=_movement_text(entry, snapshot) + prefix,
            )

    current_games = list(
        Game.objects.filter(
            entries__snapshot__observed_date=digest_date,
            entries__snapshot__status__in=[Snapshot.Status.CONFIRMED, Snapshot.Status.PROVISIONAL],
        )
        .select_related("category")
        .distinct()
    )
    previous_date = digest_date - timedelta(days=1)
    previous_games = list(
        Game.objects.filter(
            entries__snapshot__observed_date=previous_date,
        )
        .select_related("category")
        .distinct()
    )

    def l1_counts(games):
        counts = {}
        for game in games:
            path = game.category_path
            key = path[0] if path else "未分类"
            counts[key] = counts.get(key, 0) + 1
        return counts

    current_counts = l1_counts(current_games)
    previous_counts = l1_counts(previous_games)
    category_changes = []
    for name in sorted(set(current_counts) | set(previous_counts)):
        diff = current_counts.get(name, 0) - previous_counts.get(name, 0)
        if diff:
            category_changes.append((name, diff))
    category_changes.sort(key=lambda item: abs(item[1]), reverse=True)
    if not category_changes:
        DigestItem.objects.create(
            digest=digest,
            section=DigestItem.Section.CATEGORY,
            order=0,
            ref_type=DigestItem.RefType.SNAPSHOT,
            ref_id=str(digest_date),
            generated_text="今日已归类游戏的一级品类结构无变化。",
        )
    for index, (name, diff) in enumerate(category_changes[:3]):
        direction = "增加" if diff > 0 else "减少"
        DigestItem.objects.create(
            digest=digest,
            section=DigestItem.Section.CATEGORY,
            order=index,
            ref_type=DigestItem.RefType.SNAPSHOT,
            ref_id=str(digest_date),
            generated_text=f"{name}上榜游戏{direction} {abs(diff)} 款。",
        )

    claims = (
        Claim.objects.filter(article__is_draft=False)
        .select_related("article__source")
        .order_by("-article__source__weight", "-created_at")[:3]
    )
    for index, claim in enumerate(claims):
        DigestItem.objects.create(
            digest=digest,
            section=DigestItem.Section.CLAIMS,
            order=index,
            ref_type=DigestItem.RefType.CLAIM,
            ref_id=str(claim.id),
            generated_text=f"{claim.claim_text}（{claim.article.source.name if claim.article.source else '未知来源'}）",
        )

    pending = review_summary()
    pending_texts = []
    if pending["mapping"]:
        pending_texts.append(f"{pending['mapping']} 条观测待映射游戏。")
    if pending["category"]:
        pending_texts.append(f"{pending['category']} 款游戏待补品类。")
    if pending["claims"]:
        pending_texts.append(f"{pending['claims']} 条观点待核实。")
    if pending["errors"]:
        pending_texts.append(f"{pending['errors']} 篇文章解析异常。")
    for index, text in enumerate(pending_texts):
        DigestItem.objects.create(
            digest=digest,
            section=DigestItem.Section.PENDING,
            order=index,
            ref_type=DigestItem.RefType.REVIEW,
            ref_id=str(digest_date),
            generated_text=text,
        )

    return digest
