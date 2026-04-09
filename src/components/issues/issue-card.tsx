'use client'

import { useState } from 'react'
import type { Issue, IssuePriority } from '@/lib/types'
import { deleteIssue } from '@/lib/actions/issues'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/lib/utils'

interface Props {
  issue: Issue
  onClick: () => void
  onEdit: () => void
  onDeleted: () => void
  isDragging?: boolean
}

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-status-amber-bg text-status-amber border-status-amber/20',
  low: 'bg-muted text-muted-foreground border-border',
}

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function IssueCard({ issue, onClick, onEdit, onDeleted, isDragging }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteIssue(issue.id)
      toast.success('Issue deleted')
      onDeleted()
    } catch {
      toast.error('Failed to delete issue')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div
        className={`group flex flex-col rounded-xl bg-card ring-1 transition-all duration-150 ease-in-out cursor-pointer select-none ${
          isDragging
            ? 'ring-foreground/25 shadow-xl rotate-1 scale-[1.02] opacity-90'
            : 'ring-foreground/10 hover:ring-foreground/20 hover:shadow-md'
        }`}
        onClick={onClick}
      >
        <div className="flex flex-col gap-2.5 p-3.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-sans font-semibold text-sm leading-snug line-clamp-2 flex-1 min-w-0">
              {issue.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1"
                  />
                }
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {issue.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          )}

          {/* Footer: priority + pattern + timestamp */}
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[issue.priority]}`}>
              {PRIORITY_LABELS[issue.priority]}
            </span>
            {issue.related_pattern && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-amber-bg text-status-amber border border-status-amber/20">
                {issue.related_pattern}
              </span>
            )}
            <p className="font-mono text-xs text-muted-foreground/50 ml-auto whitespace-nowrap">
              {formatDistanceToNow(issue.created_at)}
            </p>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete issue?</DialogTitle>
            <DialogDescription>
              &ldquo;{issue.title}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
