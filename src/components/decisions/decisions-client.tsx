'use client'

import { useState, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import type { DecisionWithTags, Pattern, Tag, Status } from '@/lib/types'
import { Navbar } from '@/components/layout/navbar'
import { DecisionList } from '@/components/decisions/decision-list'
import { DecisionDialog } from '@/components/decisions/decision-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface Props {
  initialDecisions: DecisionWithTags[]
  patterns: Pattern[]
  tags: Tag[]
  user: User
}

type FilterStatus = 'all' | Status

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'under_review', label: 'Under Review' },
]

export function DecisionsClient({ initialDecisions, patterns, tags, user }: Props) {
  const [decisions, setDecisions] = useState(initialDecisions)
  const [allPatterns, setAllPatterns] = useState(patterns)
  const [allTags, setAllTags] = useState(tags)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDecision, setEditingDecision] = useState<DecisionWithTags | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const filtered = useMemo(() => {
    let result = decisions
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.patterns?.some((p) => p.name.toLowerCase().includes(q)) ||
          d.tags?.some((t) => t.name.toLowerCase().includes(q))
      )
    }
    return result
  }, [decisions, statusFilter, search])

  function handleNew() {
    setEditingDecision(null)
    setDialogOpen(true)
  }

  function handleEdit(decision: DecisionWithTags) {
    setEditingDecision(decision)
    setDialogOpen(true)
  }

  function handleSaved(decision: DecisionWithTags) {
    setDecisions((prev) => {
      const idx = prev.findIndex((d) => d.id === decision.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = decision
        return next
      }
      return [decision, ...prev]
    })
    setDialogOpen(false)
    setEditingDecision(null)
  }

  function handleDeleted(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }

  const counts = useMemo(() => ({
    all: decisions.length,
    approved: decisions.filter((d) => d.status === 'approved').length,
    under_review: decisions.filter((d) => d.status === 'under_review').length,
  }), [decisions])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Design Standards</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleNew} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            New Decision
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions…"
              className="pl-8"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs tabular-nums ${
                  statusFilter === tab.value ? 'text-muted-foreground' : 'text-muted-foreground/60'
                }`}>
                  {counts[tab.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results info when filtering */}
        {(search || statusFilter !== 'all') && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filtered.length} of {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
            {search && <> matching &ldquo;<strong className="text-foreground">{search}</strong>&rdquo;</>}
          </p>
        )}

        <DecisionList
          decisions={filtered}
          onView={handleEdit}
          onEdit={handleEdit}
          onDeleted={handleDeleted}
          emptyMessage={
            search || statusFilter !== 'all'
              ? 'No decisions match your filters.'
              : undefined
          }
        />
      </main>

      <DecisionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingDecision(null)
        }}
        decision={editingDecision}
        patterns={allPatterns}
        tags={allTags}
        onPatternCreated={(p) =>
          setAllPatterns((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))
        }
        onTagCreated={(t) =>
          setAllTags((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)))
        }
        onSaved={handleSaved}
      />
    </div>
  )
}
