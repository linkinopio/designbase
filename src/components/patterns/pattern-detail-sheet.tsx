'use client'

import { useState } from 'react'
import type { PatternWithDecisions, DecisionWithTags } from '@/lib/types'
import { linkDecisionToPattern, unlinkDecisionFromPattern } from '@/lib/actions/patterns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link2, Unlink, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  pattern: PatternWithDecisions | null
  allDecisions: DecisionWithTags[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatternUpdated: (p: PatternWithDecisions) => void
  onViewDecision: (d: DecisionWithTags) => void
}

export function PatternDetailSheet({ pattern, allDecisions, open, onOpenChange, onPatternUpdated, onViewDecision }: Props) {
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  if (!pattern) return null

  const linkedIds = new Set(pattern.decisions.map((d) => d.id))

  const unlinked = allDecisions.filter(
    (d) => !linkedIds.has(d.id) &&
      (!search.trim() || d.title.toLowerCase().includes(search.toLowerCase()))
  )
  const linked = pattern.decisions.filter(
    (d) => !search.trim() || d.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleLink(decision: DecisionWithTags) {
    setPending(decision.id)
    try {
      await linkDecisionToPattern(pattern!.id, decision.id)
      onPatternUpdated({
        ...pattern!,
        decisions: [...pattern!.decisions, decision],
      })
    } catch {
      toast.error('Failed to link decision')
    } finally {
      setPending(null)
    }
  }

  async function handleUnlink(decision: DecisionWithTags) {
    setPending(decision.id)
    try {
      await unlinkDecisionFromPattern(pattern!.id, decision.id)
      onPatternUpdated({
        ...pattern!,
        decisions: pattern!.decisions.filter((d) => d.id !== decision.id),
      })
    } catch {
      toast.error('Failed to unlink decision')
    } finally {
      setPending(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">{pattern.name}</SheetTitle>
          {pattern.description && (
            <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
          )}
          {pattern.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {pattern.tags.map((t) => (
                <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accent-blue-bg text-primary border border-primary/15">
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions…"
              className="pl-8 h-8 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">
            {/* Linked decisions */}
            {linked.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Linked · {pattern.decisions.length}
                </p>
                <div className="flex flex-col gap-1.5">
                  {linked.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => onViewDecision(d)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-1">{d.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={pending === d.id}
                        onClick={(e) => { e.stopPropagation(); handleUnlink(d) }}
                        title="Unlink"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlinked decisions */}
            {unlinked.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available to link
                </p>
                <div className="flex flex-col gap-1.5">
                  {unlinked.map((d) => (
                    <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-1 text-muted-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">{d.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-primary"
                        disabled={pending === d.id}
                        onClick={() => handleLink(d)}
                        title="Link"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {linked.length === 0 && unlinked.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No decisions found</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
