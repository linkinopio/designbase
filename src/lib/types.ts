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

export type IssueStatus = 'backlog' | 'tbd' | 'resolved'
export type IssuePriority = 'low' | 'medium' | 'high'

export interface Issue {
  id: string
  title: string
  description: string | null
  notes: string | null
  status: IssueStatus
  priority: IssuePriority
  related_pattern: string | null
  related_decision_id: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}
