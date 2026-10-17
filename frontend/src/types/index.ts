export type Role = 'operator' | 'lead' | 'admin'

export type User = { id: number; username: string; name: string; role: Role }

export type Source = {
  id: number
  name: string
  platforms: string[]
  weight: number
  status: string
  note: string
}

export type Article = {
  id: number
  title: string
  url: string
  source: Source | null
  published_at: string | null
  fetched_at: string | null
  ingest_method: string
  parse_status: string
  failure_reason: string
  is_draft: boolean
  content_hash: string
  created_at: string
  duplicate?: boolean
  obs_count?: number
  claim_count?: number
  raw_text?: string
  assets?: Asset[]
  observations?: Observation[]
  claims?: Claim[]
}

export type Asset = {
  id: number
  type: string
  url: string
  ocr_text: string
  ocr_confidence: number | null
}

export type Observation = {
  id: number
  platform: string
  board_type: string
  observed_date: string
  rank: number
  raw_game_name: string
  source_type: string
  game: { id: number; name: string } | null
}

export type Claim = {
  id: number
  claim_text: string
  quote: string
  stance: string
  confidence: number
  verify_status: string
  source?: string
  article_id?: number
}

export type Category = {
  id: number
  name: string
  level: number
  parent_id: number | null
  children?: Category[]
}

export type Game = {
  id: number
  name: string
  publisher: string
  developer: string
  platforms: string[]
  release_date: string | null
  online_status: string
  has_isbn: boolean
  category_id: number | null
  category_path: string[]
  quality_flags: string[]
  aliases: string[]
  current_rank?: number | null
  best_rank?: number | null
  days_on_board?: number
}

export type RankingEntry = {
  id?: number
  rank: number
  game_id: number | null
  game_name: string
  raw_name: string
  category_path?: string[]
  trend: string
  delta: number | null
  diff: number | null
}

export type RankingResponse = {
  platform: string
  board: string
  date: string
  status: 'confirmed' | 'provisional' | 'missing'
  official: { source_label: string; entries: RankingEntry[] } | null
  citations: { source_name: string; article_id: number; captured_at: string; entries: RankingEntry[] }[]
  conflicts: {
    id: number
    game_id: number
    game_name: string
    official_rank: number
    citation_rank: number
    source_name: string
    article_id: number
    status: string
    note: string
  }[]
}

export type ReviewSummary = { mapping: number; category: number; claims: number; errors: number; total: number }

export type DigestItem = {
  id: number
  section: string
  order: number
  ref_type: string
  ref_id: string
  generated_text: string
  text: string
  is_included: boolean
  text_override: string
  editor_note: string
}

export type Digest = {
  id: number
  date: string
  status: 'draft' | 'reviewed'
  version: number
  generated_at: string
  items: DigestItem[]
}
