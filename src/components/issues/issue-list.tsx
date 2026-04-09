'use client'

import type { Issue } from '@/lib/types'
import { IssueCard } from './issue-card'
import { CircleAlert } from 'lucide-react'

interface Props {
  issues: Issue[]
  onView: (issue: Issue) => void
  onEdit: (issue: Issue) => void
  onDeleted: (id: string) => void
  emptyMessage?: string
}

export function IssueList({ issues, onView, onEdit, onDeleted, emptyMessage }: Props) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground min-h-[60vh]">
        <CircleAlert className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium">{emptyMessage ?? 'No issues yet'}</p>
        {!emptyMessage && (
          <p className="text-sm mt-1 opacity-70">
            Create your first design issue to get started.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onClick={() => onView(issue)}
          onEdit={() => onEdit(issue)}
          onDeleted={() => onDeleted(issue.id)}
        />
      ))}
    </div>
  )
}
