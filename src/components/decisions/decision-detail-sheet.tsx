'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { DecisionWithTags } from '@/lib/types'
import { deleteDecision } from '@/lib/actions/decisions'
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
  decision: DecisionWithTags | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDeleted: (id: string) => void
}

export function DecisionDetailSheet({ decision, open, onOpenChange, onEdit, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  async function handleDelete() {
    if (!decision) return
    setDeleting(true)
    try {
      await deleteDecision(decision.id)
      toast.success('Decision deleted')
      setDeleteOpen(false)
      onOpenChange(false)
      onDeleted(decision.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete decision')
    } finally {
      setDeleting(false)
    }
  }

  const isApproved = decision?.status === 'approved'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="sm:max-w-none w-[min(820px,90vw)] max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col"
        >
          {/* Two-column body */}
          <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

            {/* ── Left column (60%) ─────────────────── */}
            <div className="flex flex-col gap-6 flex-[3] overflow-y-auto px-7 py-7 border-r border-border/60">

              {/* Title + status */}
              <div className="flex flex-col gap-2.5 pr-6">
                <h2 className="font-sans text-xl font-bold leading-snug">{decision?.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {decision && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      isApproved
                        ? 'bg-status-green-bg text-status-green border-status-green/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {isApproved ? 'Approved' : 'Under Review'}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {decision?.description && (
                <Section label="Description">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {decision.description}
                  </p>
                </Section>
              )}

              {/* Notes */}
              {decision?.notes && (
                <Section label="Notes">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {decision.notes}
                  </p>
                </Section>
              )}

              {/* Image */}
              {decision?.image_url && (
                <Section label="Visual Example">
                  <div
                    className="group/img rounded-lg overflow-hidden ring-1 ring-foreground/10 relative cursor-pointer"
                    onClick={() => setImageOpen(true)}
                  >
                    <Image
                      src={decision.image_url}
                      alt={decision.title}
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

              {/* Related Patterns */}
              {decision?.patterns && decision.patterns.length > 0 && (
                <Section label="Related Patterns">
                  <div className="flex flex-wrap gap-1.5">
                    {decision.patterns.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-amber-bg text-status-amber border border-status-amber/20"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Applies To */}
              {decision?.tags && decision.tags.length > 0 && (
                <Section label="Applies To">
                  <div className="flex flex-wrap gap-1.5">
                    {decision.tags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-accent-blue-bg text-primary border border-primary/15"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Timestamp */}
              {decision?.created_at && (
                <Section label="Created">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDistanceToNow(decision.created_at)}
                  </span>
                </Section>
              )}

              {/* Actions — pinned to bottom */}
              <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Decision
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Decision
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
            <DialogTitle>Delete decision?</DialogTitle>
            <DialogDescription>
              &ldquo;{decision?.title}&rdquo; will be permanently deleted. This cannot be undone.
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
      {decision?.image_url && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="sm:max-w-none w-[min(90vw,1200px)] p-2 bg-black/90 border-0 ring-0" showCloseButton>
            <DialogHeader className="sr-only">
              <DialogTitle>{decision.title}</DialogTitle>
            </DialogHeader>
            <Image
              src={decision.image_url}
              alt={decision.title}
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
