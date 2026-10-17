from dataclasses import dataclass, field


@dataclass
class RankingItem:
    rank: int
    name: str
    trend: str = "flat"
    delta: int | None = None


@dataclass
class RankingBlock:
    platform: str
    board_type: str
    observed_date: str
    source_type: str
    items: list[RankingItem] = field(default_factory=list)


@dataclass
class ClaimDraft:
    subject_type: str
    subject_name: str
    stance: str
    claim_text: str
    quote: str
    confidence: float


@dataclass
class ExtractionResult:
    rankings: list[RankingBlock] = field(default_factory=list)
    claims: list[ClaimDraft] = field(default_factory=list)
