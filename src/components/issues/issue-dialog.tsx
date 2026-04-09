'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Issue, IssueStatus, IssuePriority, Pattern } from '@/lib/types'
import { createIssue, updateIssue, uploadIssueImage } from '@/lib/actions/issues'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue: Issue | null
  patterns: Pattern[]
  onSaved: (issue: Issue) => void
}

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'tbd', label: 'TBD' },
  { value: 'resolved', label: 'Resolved' },
]

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_ACTIVE: Record<IssueStatus, string> = {
  backlog: 'bg-muted text-muted-foreground border-border',
  tbd: 'bg-status-amber-bg text-status-amber border-status-amber/20',
  resolved: 'bg-status-green-bg text-status-green border-status-green/20',
}

const PRIORITY_ACTIVE: Record<IssuePriority, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-status-amber-bg text-status-amber border-status-amber/20',
  low: 'bg-muted text-muted-foreground border-border',
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024

export function IssueDialog({ open, onOpenChange, issue, patterns, onSaved }: Props) {
  const isEdit = !!issue

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<IssueStatus>('backlog')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [relatedPattern, setRelatedPattern] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (issue) {
        setTitle(issue.title)
        setDescription(issue.description ?? '')
        setNotes(issue.notes ?? '')
        setStatus(issue.status)
        setPriority(issue.priority)
        setRelatedPattern(issue.related_pattern)
        setImageUrl(issue.image_url)
        setImagePreview(issue.image_url)
      } else {
        setTitle('')
        setDescription('')
        setNotes('')
        setStatus('backlog')
        setPriority('medium')
        setRelatedPattern(null)
        setImageUrl(null)
        setImagePreview(null)
      }
    }
  }, [open, issue])

  async function uploadFile(file: File) {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image exceeds 50 MB limit.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.')
      return
    }
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadIssueImage(formData)
      setImageUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
      setImagePreview(imageUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { toast.error('Title is required'); return }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        status,
        priority,
        related_pattern: relatedPattern,
        image_url: imageUrl,
      }

      let saved: Issue
      if (isEdit && issue) {
        await updateIssue(issue.id, payload)
        saved = { ...issue, ...payload, updated_at: new Date().toISOString() }
      } else {
        saved = await createIssue(payload)
      }

      toast.success(isEdit ? 'Issue updated' : 'Issue created')
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save issue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-none w-[min(780px,calc(100vw-2rem))] max-h-[88vh] overflow-y-auto p-0">

        <DialogHeader className="px-7 pt-6 pb-5 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Issue' : 'New Design Issue'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 px-7 py-6">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, descriptive title"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the design issue, its impact, and context…"
              rows={4}
              className="resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context, open questions, or next steps…"
              rows={3}
              className="resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="h-px bg-border/60" />

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Priority</FieldLabel>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ease-in-out cursor-pointer ${
                    priority === opt.value
                      ? PRIORITY_ACTIVE[opt.value]
                      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-foreground/25'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Status</FieldLabel>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ease-in-out cursor-pointer ${
                    status === opt.value
                      ? STATUS_ACTIVE[opt.value]
                      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-foreground/25'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Related Pattern */}
          {patterns.length > 0 && (
            <div className="flex flex-col gap-2">
              <FieldLabel>Related Pattern</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {patterns.map((p) => {
                  const selected = relatedPattern === p.name
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRelatedPattern(selected ? null : p.name)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ease-in-out cursor-pointer ${
                        selected
                          ? 'bg-status-amber-bg text-status-amber border-status-amber/30'
                          : 'bg-background text-muted-foreground border-border hover:bg-[#F0EEE8] hover:border-foreground/25 hover:text-foreground'
                      }`}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="h-px bg-border/60" />

          {/* Visual Example */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Visual Example</FieldLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDrop={async (e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) await uploadFile(file)
              }}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
                isDragging ? 'border-primary bg-accent-blue-bg' : 'border-border hover:border-foreground/30'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Visual example"
                    width={780}
                    height={360}
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageUrl(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 rounded-full bg-background p-1 shadow ring-1 ring-foreground/10 hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Upload className={`h-6 w-6 transition-opacity ${isDragging ? 'opacity-80 text-primary' : 'opacity-40'}`} />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging ? 'Drop to upload' : 'Click or drag & drop to upload'}
                    </p>
                    <p className="text-xs opacity-60 mt-0.5">PNG, JPG, GIF, WebP · up to 50 MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) await uploadFile(file)
              }}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-7 py-4 border-t border-border/60">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={saving || uploading} onClick={handleSubmit}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {isEdit ? 'Save changes' : 'Create issue'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </Label>
  )
}
