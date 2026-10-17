from django.urls import path

from .api import categories, games, rankings, review, tags, workbench

urlpatterns = [
    path("categories/tree", categories.tree),
    path("categories", categories.list_categories),
    path("categories/create", categories.create_category),
    path("categories/<int:category_id>", categories.update_category),
    path("tags", tags.list_tags),
    path("tags/create", tags.create_tag),
    path("tags/<int:tag_id>", tags.update_tag),
    path("games", games.list_games),
    path("games/<int:game_id>", games.game_detail),
    path("games/<int:game_id>/claims", games.game_claims),
    path("games/<int:game_id>/sources", games.game_sources),
    path("rankings", rankings.rankings),
    path("rankings/evidence", rankings.evidence),
    path("conflicts/<int:conflict_id>/resolve", rankings.resolve_conflict),
    path("review/summary", review.review_summary),
    path("review", review.review_list),
    path("review/observations/<int:observation_id>/map", review.map_observation),
    path("review/games/<int:game_id>/category", review.assign_category),
    path("review/claims/<int:claim_id>/verify", review.verify_claim),
    path("review/articles/<int:article_id>/retry", review.retry_article),
    path("workbench", workbench.workbench),
]
