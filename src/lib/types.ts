export type Status = 'approved' | 'under_review'

export interface Pattern {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface Decision {
  id: string
  title: string
  description: string
  notes: string | null
  status: Status
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface DecisionWithTags extends Decision {
  patterns: Pattern[]
  tags: Tag[]
}

export interface PatternWithDecisions extends Pattern {
  decisions: DecisionWithTags[]
  tags: Tag[]           // aggregated unique tags from linked decisions
}
