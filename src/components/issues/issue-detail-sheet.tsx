'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Issue, IssueStatus, IssuePriority } from '@/lib/types'
import { deleteIssue } from '@/lib/actions/issues'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/lib/utils'

interface Props {
  issue: Issue | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDeleted: (id: string) => void
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  backlog: 'bg-muted text-muted-foreground border-border',
  tbd: 'bg-status-amber-bg text-status-amber border-status-amber/20',
  resolved: 'bg-status-green-bg text-status-green border-status-green/20',
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  tbd: 'TBD',
  resolved: 'Resolved',
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

export function IssueDetailSheet({ issue, open, onOpenChange, onEdit, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  async function handleDelete() {
    if (!issue) return
    setDeleting(true)
    try {
      await deleteIssue(issue.id)
      toast.success('Issue deleted')
      setDeleteOpen(false)
      onOpenChange(false)
      onDeleted(issue.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete issue')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="sm:max-w-none w-[min(820px,90vw)] max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col"
        >
          <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

            {/* ── Left column (60%) ─────────────────── */}
            <div className="flex flex-col gap-6 flex-[3] overflow-y-auto px-7 py-7 border-r border-border/60">

              {/* Title + badges */}
              <div className="flex flex-col gap-2.5 pr-6">
                <h2 className="font-sans text-xl font-bold leading-snug">{issue?.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {issue && (
                    <>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[issue.status]}`}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[issue.priority]}`}>
                        {PRIORITY_LABELS[issue.priority]} Priority
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {issue?.description && (
                <Section label="Description">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {issue.description}
                  </p>
                </Section>
              )}

              {/* Notes */}
              {issue?.notes && (
                <Section label="Notes">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {issue.notes}
                  </p>
                </Section>
              )}

              {/* Visual Example */}
              {issue?.image_url && (
                <Section label="Visual Example">
                  <div
                    className="group/img rounded-lg overflow-hidden ring-1 ring-foreground/10 relative cursor-pointer"
                    onClick={() => setImageOpen(true)}
                  >
                    <Image
                      src={issue.image_url}
                      alt={issue.title}
                      width={600}
                      height={400}
                      className="w-full object-contain bg-muted transition-transform duration-200 group-hover/img:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <span className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 text-white text-xs font-medium bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        View full image
                      </span>
                    </div>
                  </div>
                </Section>
              )}
            </div>

            {/* ── Right column (40%) ─────────────────── */}
            <div className="flex flex-col gap-6 flex-[2] overflow-y-auto px-6 py-7">

              {/* Related Pattern */}
              {issue?.related_pattern && (
                <Section label="Related Pattern">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-amber-bg text-status-amber border border-status-amber/20">
                    {issue.related_pattern}
                  </span>
                </Section>
              )}

              {/* Created */}
              {issue?.created_at && (
                <Section label="Created">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDistanceToNow(issue.created_at)}
                  </span>
                </Section>
              )}

              {/* Actions */}
              <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-2">
                <Button variant="outline" className="w-full gap-2" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                  Edit Issue
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Issue
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete issue?</DialogTitle>
            <DialogDescription>
              &ldquo;{issue?.title}&rdquo; will be permanently deleted. This cannot be undone.
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

      {/* Image lightbox */}
      {issue?.image_url && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="sm:max-w-none w-[min(90vw,1200px)] p-2 bg-black/90 border-0 ring-0" showCloseButton>
            <DialogHeader className="sr-only">
              <DialogTitle>{issue.title}</DialogTitle>
            </DialogHeader>
            <Image
              src={issue.image_url}
              alt={issue.title}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain rounded-md"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}
