'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { DecisionWithTags } from '@/lib/types'
import { deleteDecision } from '@/lib/actions/decisions'
import { Badge } from '@/components/ui/badge'
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
import { MoreHorizontal, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/lib/utils'

interface Props {
  decision: DecisionWithTags
  onClick: () => void
  onEdit: () => void
  onDeleted: () => void
}

export function DecisionCard({ decision, onClick, onEdit, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDecision(decision.id)
      toast.success('Decision deleted')
      onDeleted()
    } catch {
      toast.error('Failed to delete decision')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div
        className="group flex flex-col rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden hover:ring-foreground/20 hover:shadow-md transition-all cursor-pointer"
        onClick={onClick}
      >
        {/* Image area */}
        {decision.image_url ? (
          <div className="relative h-40 bg-muted shrink-0">
            <Image
              src={decision.image_url}
              alt={decision.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="h-40 bg-muted/50 flex items-center justify-center text-muted-foreground/30 shrink-0 border-b border-foreground/5">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
              {decision.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {decision.description}
          </p>

          {/* Meta: status + patterns */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              decision.status === 'approved'
                ? 'bg-status-green-bg text-status-green border-status-green/20'
                : 'bg-status-amber-bg text-status-amber border-status-amber/20'
            }`}>
              {decision.status === 'approved' ? 'Approved' : 'Under Review'}
            </span>
            {decision.patterns?.map((p) => (
              <Badge key={p.id} variant="outline">{p.name}</Badge>
            ))}
          </div>

          {/* Tags */}
          {decision.tags && decision.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {decision.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accent-blue-bg text-primary border border-primary/15"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground/60 mt-auto pt-1">
            {formatDistanceToNow(decision.created_at)}
          </p>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete decision?</DialogTitle>
            <DialogDescription>
              &ldquo;{decision.title}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
