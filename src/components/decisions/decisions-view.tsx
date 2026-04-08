'use client'

import { useState, useMemo } from 'react'
import type { DecisionWithTags, Pattern, Tag, Status } from '@/lib/types'
import { DecisionList } from '@/components/decisions/decision-list'
import { DecisionDialog } from '@/components/decisions/decision-dialog'
import { DecisionDetailSheet } from '@/components/decisions/decision-detail-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface Props {
  decisions: DecisionWithTags[]
  patterns: Pattern[]
  tags: Tag[]
  onDecisionSaved: (d: DecisionWithTags) => void
  onDecisionDeleted: (id: string) => void
  onPatternCreated: (p: Pattern) => void
  onTagCreated: (t: Tag) => void
}

type FilterStatus = 'all' | Status

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'under_review', label: 'Under Review' },
]

export function DecisionsView({
  decisions,
  patterns,
  tags,
  onDecisionSaved,
  onDecisionDeleted,
  onPatternCreated,
  onTagCreated,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDecision, setEditingDecision] = useState<DecisionWithTags | null>(null)
  const [detailDecision, setDetailDecision] = useState<DecisionWithTags | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const filtered = useMemo(() => {
    let result = decisions
    if (statusFilter !== 'all') result = result.filter((d) => d.status === statusFilter)
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

  const counts = useMemo(() => ({
    all: decisions.length,
    approved: decisions.filter((d) => d.status === 'approved').length,
    under_review: decisions.filter((d) => d.status === 'under_review').length,
  }), [decisions])

  const tagsByFrequency = useMemo(() => {
    const freq = new Map<string, number>()
    decisions.forEach((d) => d.tags?.forEach((t) => freq.set(t.id, (freq.get(t.id) ?? 0) + 1)))
    return [...tags].sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0))
  }, [tags, decisions])

  const patternsByFrequency = useMemo(() => {
    const freq = new Map<string, number>()
    decisions.forEach((d) => d.patterns?.forEach((p) => freq.set(p.id, (freq.get(p.id) ?? 0) + 1)))
    return [...patterns].sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0))
  }, [patterns, decisions])

  function handleSaved(decision: DecisionWithTags) {
    onDecisionSaved(decision)
    setDialogOpen(false)
    // Update detail overlay immediately with fresh data
    if (detailDecision?.id === decision.id) setDetailDecision(decision)
    // Clear after a tick so the dialog close animation sees stable decision prop
    setTimeout(() => setEditingDecision(null), 200)
  }

  function openDetail(decision: DecisionWithTags) {
    setDetailDecision(decision)
    setDetailOpen(true)
  }

  function openEdit(decision: DecisionWithTags) {
    setEditingDecision(decision)
    setDialogOpen(true)
  }

  return (
    <div className="w-full px-6 py-8 flex flex-col gap-6">

      {/* ── Page header ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Design Decisions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setEditingDecision(null); setDialogOpen(true) }} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          New Decision
        </Button>
      </div>

      {/* ── Filters row ─────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions…"
            className="pl-8"
          />
        </div>
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

      {(search || statusFilter !== 'all') && (
        <p className="text-sm text-muted-foreground -mt-2">
          Showing {filtered.length} of {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
          {search && <> matching &ldquo;<strong className="text-foreground">{search}</strong>&rdquo;</>}
        </p>
      )}

      <DecisionList
        decisions={filtered}
        onView={openDetail}
        onEdit={openEdit}
        onDeleted={onDecisionDeleted}
        emptyMessage={search || statusFilter !== 'all' ? 'No decisions match your filters.' : undefined}
      />

      <DecisionDetailSheet
        decision={detailDecision}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => detailDecision && openEdit(detailDecision)}
        onDeleted={(id) => { onDecisionDeleted(id); setDetailOpen(false) }}
      />

      <DecisionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setTimeout(() => setEditingDecision(null), 200)
        }}
        decision={editingDecision}
        patterns={patternsByFrequency}
        tags={tagsByFrequency}
        onPatternCreated={onPatternCreated}
        onTagCreated={onTagCreated}
        onSaved={handleSaved}
      />
    </div>
  )
}
