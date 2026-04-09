'use client'

import { useState, useMemo } from 'react'
import type { Issue, IssueStatus, IssuePriority, Pattern } from '@/lib/types'
import { updateIssue } from '@/lib/actions/issues'
import { KanbanBoard } from '@/components/issues/kanban-board'
import { IssueDialog } from '@/components/issues/issue-dialog'
import { IssueDetailSheet } from '@/components/issues/issue-detail-sheet'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/components/layout/app-shell'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialIssues: Issue[]
  patterns: Pattern[]
}

type FilterPriority = 'all' | IssuePriority

const PRIORITY_PILLS: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function IssuesView({ initialIssues, patterns }: Props) {
  const search = useSearch()

  const [issues, setIssues] = useState(initialIssues)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')

  const filtered = useMemo(() => {
    let result = issues
    if (priorityFilter !== 'all') result = result.filter((i) => i.priority === priorityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q) ||
          (i.related_pattern ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [issues, priorityFilter, search])

  function handleSaved(issue: Issue) {
    setIssues((prev) => {
      const idx = prev.findIndex((i) => i.id === issue.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = issue; return next }
      return [issue, ...prev]
    })
    if (detailIssue?.id === issue.id) setDetailIssue(issue)
    setTimeout(() => setEditingIssue(null), 200)
  }

  function handleDeleted(id: string) {
    setIssues((prev) => prev.filter((i) => i.id !== id))
    if (detailIssue?.id === id) setDetailOpen(false)
  }

  async function handleStatusChange(issueId: string, newStatus: IssueStatus) {
    const issue = issues.find((i) => i.id === issueId)
    if (!issue) return

    // Optimistic update
    setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, status: newStatus } : i))
    if (detailIssue?.id === issueId) setDetailIssue((d) => d ? { ...d, status: newStatus } : d)

    try {
      await updateIssue(issueId, {
        title: issue.title,
        description: issue.description,
        notes: issue.notes,
        status: newStatus,
        priority: issue.priority,
        related_pattern: issue.related_pattern,
        image_url: issue.image_url,
      })
    } catch {
      // Revert on failure
      setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, status: issue.status } : i))
      toast.error('Failed to update issue status')
    }
  }

  function openDetail(issue: Issue) {
    setDetailIssue(issue)
    setDetailOpen(true)
  }

  function openEdit(issue: Issue) {
    setEditingIssue(issue)
    setDialogOpen(true)
  }

  return (
    <div className="w-full px-6 py-8 flex flex-col gap-5 flex-1 min-h-0">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between w-full gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-light tracking-[-0.3px]">Design Issues</h1>
          <p className="text-sm text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Priority filter pills */}
          <div className="flex items-center gap-1 rounded-lg border border-[#E2DDD5] bg-muted/30 p-1">
            {PRIORITY_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setPriorityFilter(pill.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out whitespace-nowrap cursor-pointer ${
                  priorityFilter === pill.value
                    ? 'bg-white text-foreground shadow-sm ring-1 ring-foreground/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <Button onClick={() => { setEditingIssue(null); setDialogOpen(true) }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>
      </div>

      {/* ── Kanban board ── */}
      <KanbanBoard
        issues={filtered}
        onStatusChange={handleStatusChange}
        onView={openDetail}
        onEdit={openEdit}
        onDeleted={handleDeleted}
      />

      <IssueDetailSheet
        issue={detailIssue}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => detailIssue && openEdit(detailIssue)}
        onDeleted={handleDeleted}
      />

      <IssueDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setTimeout(() => setEditingIssue(null), 200)
        }}
        issue={editingIssue}
        patterns={patterns}
        onSaved={handleSaved}
      />
    </div>
  )
}
