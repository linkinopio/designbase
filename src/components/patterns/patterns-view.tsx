'use client'

import { useState, useCallback, useMemo } from 'react'
import type { PatternWithDecisions, DecisionWithTags, Pattern, Tag } from '@/lib/types'
import { createPattern, updatePattern } from '@/lib/actions/patterns'
import { PatternCard } from '@/components/patterns/pattern-card'
import { PatternDetailSheet } from '@/components/patterns/pattern-detail-sheet'
import { DecisionDetailSheet } from '@/components/decisions/decision-detail-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Layers } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const SEEN_KEY = 'designbase:seen_decisions'

function useSeenDecisions() {
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(SEEN_KEY)
      return stored ? new Set<string>(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const markSeen = useCallback((ids: string[]) => {
    setSeenIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  return { seenIds, markSeen }
}

interface Props {
  patterns: PatternWithDecisions[]
  allDecisions: DecisionWithTags[]
  search: string
  onPatternCreated: (p: Pattern) => void
  onPatternsChanged: (patterns: PatternWithDecisions[]) => void
}

export function PatternsView({ patterns, allDecisions, search, onPatternCreated, onPatternsChanged }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<PatternWithDecisions | null>(null)
  const [detailPattern, setDetailPattern] = useState<PatternWithDecisions | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewingDecision, setViewingDecision] = useState<DecisionWithTags | null>(null)
  const [decisionViewOpen, setDecisionViewOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const { seenIds, markSeen } = useSeenDecisions()

  const filteredPatterns = useMemo(() => {
    if (!search.trim()) return patterns
    const q = search.toLowerCase()
    return patterns.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.decisions.some((d) => d.title.toLowerCase().includes(q))
    )
  }, [patterns, search])

  function openAdd() {
    setEditingPattern(null)
    setName('')
    setDescription('')
    setAddOpen(true)
  }

  function openEdit(pattern: PatternWithDecisions) {
    setEditingPattern(pattern)
    setName(pattern.name)
    setDescription(pattern.description ?? '')
    setAddOpen(true)
  }

  function openDetail(pattern: PatternWithDecisions) {
    setDetailPattern(pattern)
    setDetailOpen(true)
    // Mark all linked decisions as seen when user opens the pattern
    markSeen(pattern.decisions.map((d) => d.id))
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editingPattern) {
        await updatePattern(editingPattern.id, { name: name.trim(), description: description.trim() || null })
        onPatternsChanged(patterns.map((p) =>
          p.id === editingPattern.id
            ? { ...p, name: name.trim(), description: description.trim() || null }
            : p
        ))
        toast.success('Pattern updated')
      } else {
        const created = await createPattern(name.trim(), description.trim() || null)
        const newPattern: PatternWithDecisions = { ...created, decisions: [], tags: [] }
        onPatternsChanged([...patterns, newPattern].sort((a, b) => a.name.localeCompare(b.name)))
        onPatternCreated(created)
        toast.success('Pattern created')
      }
      setAddOpen(false)
    } catch {
      toast.error('Failed to save pattern')
    } finally {
      setSaving(false)
    }
  }

  function handlePatternUpdated(updated: PatternWithDecisions) {
    const next = patterns.map((p) => p.id === updated.id ? updated : p)
    onPatternsChanged(next)
    setDetailPattern(updated)
    // Mark any newly linked decisions as seen
    markSeen(updated.decisions.map((d) => d.id))
  }

  function handleDeleted(id: string) {
    onPatternsChanged(patterns.filter((p) => p.id !== id))
    if (detailPattern?.id === id) setDetailOpen(false)
  }

  return (
    <div className="w-full px-6 py-8 flex flex-col gap-6">

      {/* ── Page header ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-light tracking-[-0.3px]">Design Patterns</h1>
          <p className="text-sm text-muted-foreground">
            {search.trim() && filteredPatterns.length !== patterns.length
              ? `${filteredPatterns.length} of ${patterns.length} pattern${patterns.length !== 1 ? 's' : ''}`
              : `${patterns.length} pattern${patterns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openAdd} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          New Pattern
        </Button>
      </div>

      {/* ── Grid ────────────────────────────────── */}
      {patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <Layers className="h-10 w-10 mb-3 opacity-20" />
          <p className="font-medium">No patterns yet</p>
          <p className="text-sm mt-1 opacity-70">Create a pattern to start grouping decisions.</p>
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <Layers className="h-10 w-10 mb-3 opacity-20" />
          <p className="font-medium">No patterns match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              seenIds={seenIds}
              onClick={() => openDetail(pattern)}
              onEdit={() => openEdit(pattern)}
              onDeleted={() => handleDeleted(pattern.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-none w-[min(480px,calc(100vw-2rem))] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
            <DialogTitle className="text-base font-semibold">
              {editingPattern ? 'Edit Pattern' : 'New Pattern'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="flex flex-col gap-2">
              <Label className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Navigation, Form Validation…"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this pattern covers…"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {editingPattern ? 'Save changes' : 'Create pattern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <PatternDetailSheet
        pattern={detailPattern}
        allDecisions={allDecisions}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPatternUpdated={handlePatternUpdated}
        onViewDecision={(d) => { setViewingDecision(d); setDecisionViewOpen(true) }}
      />

      {/* Decision detail overlay (opened from pattern sheet) */}
      <DecisionDetailSheet
        decision={viewingDecision}
        open={decisionViewOpen}
        onOpenChange={setDecisionViewOpen}
        onEdit={() => {}}
        onDeleted={() => {}}
      />
    </div>
  )
}
