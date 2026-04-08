'use client'

import { useState } from 'react'
import type { PatternWithDecisions } from '@/lib/types'
import { deletePattern } from '@/lib/actions/patterns'
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

interface Props {
  pattern: PatternWithDecisions
  seenIds: Set<string>
  onClick: () => void
  onEdit: () => void
  onDeleted: () => void
}

export function PatternCard({ pattern, seenIds, onClick, onEdit, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePattern(pattern.id)
      toast.success('Pattern deleted')
      onDeleted()
    } catch {
      toast.error('Failed to delete pattern')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const count = pattern.decisions.length
  const unreadCount = pattern.decisions.filter((d) => !seenIds.has(d.id)).length

  return (
    <>
      <div
        className="group relative flex flex-col rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden hover:ring-foreground/20 hover:shadow-md transition-all cursor-pointer"
        onClick={onClick}
      >
        {/* Amber unread badge — top right, only when there are unseen decisions */}
        {unreadCount > 0 && (
          <div className="absolute top-4 right-4 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-status-amber-bg text-status-amber text-xs font-semibold border border-status-amber/20 select-none">
            {unreadCount}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 pr-9">
            <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1">
              {pattern.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          {pattern.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {pattern.description}
            </p>
          )}

          {/* Linked decisions count */}
          <p className="text-xs text-muted-foreground mt-auto pt-2">
            {count === 0
              ? 'No linked decisions'
              : `${count} linked decision${count !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete pattern?</DialogTitle>
            <DialogDescription>
              &ldquo;{pattern.name}&rdquo; will be permanently deleted. Linked decisions won&apos;t be affected.
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
