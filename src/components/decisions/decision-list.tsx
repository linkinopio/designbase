'use client'

import type { DecisionWithTags } from '@/lib/types'
import { DecisionCard } from './decision-card'
import { LayoutGrid } from 'lucide-react'

interface Props {
  decisions: DecisionWithTags[]
  onView: (d: DecisionWithTags) => void
  onEdit: (d: DecisionWithTags) => void
  onDeleted: (id: string) => void
  emptyMessage?: string
}

export function DecisionList({ decisions, onView, onEdit, onDeleted, emptyMessage }: Props) {
  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <LayoutGrid className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium">{emptyMessage ?? 'No decisions yet'}</p>
        {!emptyMessage && (
          <p className="text-sm mt-1 opacity-70">
            Create your first design decision to get started.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decisions.map((decision) => (
        <DecisionCard
          key={decision.id}
          decision={decision}
          onClick={() => onView(decision)}
          onEdit={() => onEdit(decision)}
          onDeleted={() => onDeleted(decision.id)}
        />
      ))}
    </div>
  )
}
