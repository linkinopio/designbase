'use client'

import { useState, useMemo } from 'react'
import type { DecisionWithTags, Pattern, Tag, Status } from '@/lib/types'
import { DecisionList } from '@/components/decisions/decision-list'
import { DecisionDialog } from '@/components/decisions/decision-dialog'
import { DecisionDetailSheet } from '@/components/decisions/decision-detail-sheet'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/components/layout/app-shell'
import { Plus } from 'lucide-react'

interface Props {
  initialDecisions: DecisionWithTags[]
  initialPatterns: Pattern[]
  initialTags: Tag[]
}

type FilterStatus = 'all' | Status

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'under_review', label: 'Under Review' },
]

export function DecisionsView({ initialDecisions, initialPatterns, initialTags }: Props) {
  const search = useSearch()

  const [decisions, setDecisions] = useState(initialDecisions)
  const [patterns, setPatterns] = useState(initialPatterns)
  const [tags, setTags] = useState(initialTags)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDecision, setEditingDecision] = useState<DecisionWithTags | null>(null)
  const [detailDecision, setDetailDecision] = useState<DecisionWithTags | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [patternFilter, setPatternFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = decisions
    if (statusFilter !== 'all') result = result.filter((d) => d.status === statusFilter)
    if (patternFilter) result = result.filter((d) => d.patterns?.some((p) => p.id === patternFilter))
    if (tagFilter) result = result.filter((d) => d.tags?.some((t) => t.id === tagFilter))
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
  }, [decisions, statusFilter, patternFilter, tagFilter, search])

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

  function handleDecisionSaved(decision: DecisionWithTags) {
    setDecisions((prev) => {
      const idx = prev.findIndex((d) => d.id === decision.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = decision; return next }
      return [decision, ...prev]
    })
    setDialogOpen(false)
    if (detailDecision?.id === decision.id) setDetailDecision(decision)
    setTimeout(() => setEditingDecision(null), 200)
  }

  function handleDecisionDeleted(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }

  function handlePatternCreated(p: Pattern) {
    setPatterns((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleTagCreated(t: Tag) {
    setTags((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function openDetail(decision: DecisionWithTags) {
    setDetailDecision(decision)
    setDetailOpen(true)
  }

  function openEdit(decision: DecisionWithTags) {
    setEditingDecision(decision)
    setDialogOpen(true)
  }

  const isFiltered = !!(search || statusFilter !== 'all' || patternFilter || tagFilter)

  return (
    <div className="w-full px-6 py-8 flex flex-col gap-5 flex-1 min-h-0">

      {/* ── Top bar: title left, tabs + button right ── */}
      <div className="flex items-start justify-between w-full gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-light tracking-[-0.3px]">Design Decisions</h1>
          <p className="text-sm text-muted-foreground">
            {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-[#E2DDD5] bg-muted/30 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-white text-foreground shadow-sm ring-1 ring-foreground/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 font-mono text-xs tabular-nums ${
                  statusFilter === tab.value ? 'text-muted-foreground' : 'text-muted-foreground/60'
                }`}>
                  {counts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          <Button onClick={() => { setEditingDecision(null); setDialogOpen(true) }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Decision
          </Button>
        </div>
      </div>

      {/* ── Pattern filter row ───────────────────────── */}
      {patternsByFrequency.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="All"
            active={patternFilter === null}
            onClick={() => setPatternFilter(null)}
          />
          {patternsByFrequency.map((p) => (
            <FilterPill
              key={p.id}
              label={p.name}
              active={patternFilter === p.id}
              onClick={() => setPatternFilter(patternFilter === p.id ? null : p.id)}
            />
          ))}
        </div>
      )}

      {/* ── Tag filter row ───────────────────────────── */}
      {tagsByFrequency.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="All"
            active={tagFilter === null}
            onClick={() => setTagFilter(null)}
          />
          {tagsByFrequency.map((t) => (
            <FilterPill
              key={t.id}
              label={t.name}
              active={tagFilter === t.id}
              onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)}
            />
          ))}
        </div>
      )}

      <DecisionList
        decisions={filtered}
        onView={openDetail}
        onEdit={openEdit}
        onDeleted={handleDecisionDeleted}
        emptyMessage={isFiltered ? 'No decisions match your filters.' : undefined}
      />

      <DecisionDetailSheet
        decision={detailDecision}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => detailDecision && openEdit(detailDecision)}
        onDeleted={(id) => { handleDecisionDeleted(id); setDetailOpen(false) }}
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
        onPatternCreated={handlePatternCreated}
        onTagCreated={handleTagCreated}
        onSaved={handleDecisionSaved}
        onViewDecision={(id) => {
          const found = decisions.find((d) => d.id === id)
          if (found) setTimeout(() => openDetail(found), 150)
        }}
      />
    </div>
  )
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ease-in-out whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-foreground text-background border-foreground hover:bg-foreground/85'
          : 'bg-white text-muted-foreground border-[#E2DDD5] hover:bg-[#F0EEE8] hover:border-foreground/25 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
