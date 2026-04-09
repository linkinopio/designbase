'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { DecisionWithTags, Pattern, Tag, Status } from '@/lib/types'
import { createDecision, updateDecision, uploadDecisionImage } from '@/lib/actions/decisions'
import { createPattern } from '@/lib/actions/patterns'
import { createTag } from '@/lib/actions/tags'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { SimilarDecisions } from '@/components/decisions/similar-decisions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  decision: DecisionWithTags | null
  patterns: Pattern[]
  tags: Tag[]
  onPatternCreated: (p: Pattern) => void
  onTagCreated: (t: Tag) => void
  onSaved: (d: DecisionWithTags) => void
  onViewDecision?: (id: string) => void
}

export function DecisionDialog({
  open,
  onOpenChange,
  decision,
  patterns,
  tags,
  onPatternCreated,
  onTagCreated,
  onSaved,
  onViewDecision,
}: Props) {
  const isEdit = !!decision

  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('')
  const [selectedPatterns, setSelectedPatterns] = useState<Pattern[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [status, setStatus] = useState<Status>('under_review')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newPatternName, setNewPatternName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  // Patterns created inline during this session — kept separate so they appear
  // immediately without waiting for the parent state to propagate back down.
  const [sessionPatterns, setSessionPatterns] = useState<Pattern[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

  useEffect(() => {
    if (open) {
      if (decision) {
        setDescription(decision.description)
        setNotes(decision.notes ?? '')
        setTitle(decision.title)
        setSelectedPatterns(decision.patterns ?? [])
        setSelectedTags(decision.tags ?? [])
        setStatus(decision.status)
        setImageUrl(decision.image_url)
        setImagePreview(decision.image_url)
      } else {
        setDescription('')
        setNotes('')
        setTitle('')
        setSelectedPatterns([])
        setSelectedTags([])
        setStatus('under_review')
        setImageUrl(null)
        setImagePreview(null)
      }
      setNewPatternName('')
      setNewTagName('')
      setSessionPatterns([])
    }
  }, [open, decision])

  async function uploadFile(file: File) {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image exceeds 50 MB limit. Please choose a smaller file.')
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
      const url = await uploadDecisionImage(formData)
      setImageUrl(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image'
      toast.error(msg)
      setImagePreview(imageUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  async function handleAddPattern() {
    const name = newPatternName.trim()
    if (!name) return
    const existing = patterns.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!selectedPatterns.find((p) => p.id === existing.id))
        setSelectedPatterns((prev) => [...prev, existing])
      setNewPatternName('')
      return
    }
    try {
      const pattern = await createPattern(name)
      setSessionPatterns((prev) => [...prev, pattern])
      setSelectedPatterns((prev) => [...prev, pattern])
      setNewPatternName('')
      onPatternCreated(pattern)
      toast.success(`Pattern "${name}" created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create pattern')
    }
  }

  async function handleAddTag() {
    const name = newTagName.trim()
    if (!name) return
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!selectedTags.find((t) => t.id === existing.id))
        setSelectedTags((prev) => [...prev, existing])
      setNewTagName('')
      return
    }
    try {
      const tag = await createTag(name)
      onTagCreated(tag)
      setSelectedTags((prev) => [...prev, tag])
      setNewTagName('')
    } catch {
      toast.error('Failed to create tag')
    }
  }

  function togglePattern(pattern: Pattern) {
    setSelectedPatterns((prev) =>
      prev.some((p) => p.id === pattern.id)
        ? prev.filter((p) => p.id !== pattern.id)
        : [...prev, pattern]
    )
  }

  function toggleTag(tag: Tag) {
    setSelectedTags((prev) =>
      prev.some((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!description.trim()) { toast.error('Description is required'); return }
    if (!title.trim()) { toast.error('Title is required'); return }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim() || null,
        pattern_ids: selectedPatterns.map((p) => p.id),
        tag_ids: selectedTags.map((t) => t.id),
        status,
        image_url: imageUrl,
      }

      let saved: DecisionWithTags
      if (isEdit && decision) {
        await updateDecision(decision.id, payload)
        saved = { ...decision, ...payload, patterns: selectedPatterns, tags: selectedTags, updated_at: new Date().toISOString() }
      } else {
        const result = await createDecision(payload)
        saved = { ...result, patterns: selectedPatterns, tags: selectedTags }
      }

      toast.success(isEdit ? 'Decision updated' : 'Decision created')
      onSaved(saved)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[DecisionDialog] save failed:', msg)
      toast.error(msg || 'Failed to save decision')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-none w-[min(780px,calc(100vw-2rem))] max-h-[88vh] overflow-y-auto p-0">

        {/* Header */}
        <DialogHeader className="px-7 pt-6 pb-5 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Decision' : 'New Design Decision'}
          </DialogTitle>
        </DialogHeader>

        <div>
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
                placeholder="Describe the design decision, its rationale, and context…"
                rows={5}
                className="resize-none text-sm leading-relaxed"
                required
              />
            </div>

            {/* Duplicate warning — triggers after user types description, only when creating */}
            {!isEdit && onViewDecision && (
              <SimilarDecisions
                title={title}
                description={description}
                onView={(id) => { onOpenChange(false); onViewDecision(id) }}
              />
            )}

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional context, open questions, or follow-up actions…"
                rows={3}
                className="resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="h-px bg-border/60" />

            {/* Status */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Status</FieldLabel>
              <div className="flex gap-2">
                {(['under_review', 'approved'] as Status[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ease-in-out cursor-pointer ${
                      status === s
                        ? s === 'approved'
                          ? 'bg-status-green-bg text-status-green border-status-green/20'
                          : 'bg-muted text-muted-foreground border-border'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-foreground/25'
                    }`}
                  >
                    {s === 'approved' ? 'Approved' : 'Under Review'}
                  </button>
                ))}
              </div>
            </div>

            {/* Related Patterns */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Related Patterns</FieldLabel>
              <PillSelector
                items={[...patterns, ...sessionPatterns.filter((s) => !patterns.some((p) => p.id === s.id))]}
                selected={selectedPatterns}
                onToggle={togglePattern}
                newValue={newPatternName}
                onNewValueChange={setNewPatternName}
                onAdd={handleAddPattern}
                placeholder="Add a pattern…"
                emptyHint="No patterns yet — type one below to create"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Applies To</FieldLabel>
              <PillSelector
                items={tags}
                selected={selectedTags}
                onToggle={toggleTag}
                newValue={newTagName}
                onNewValueChange={setNewTagName}
                onAdd={handleAddTag}
                placeholder="Add a tag…"
                emptyHint="No tags yet — type one below to create"
              />
            </div>

            <div className="h-px bg-border/60" />

            {/* Visual Example */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Visual Example</FieldLabel>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
                  isDragging
                    ? 'border-primary bg-accent-blue-bg'
                    : 'border-border hover:border-foreground/30'
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
                onChange={handleImageChange}
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
              {isEdit ? 'Save changes' : 'Create decision'}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}

/* ── helpers ────────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </Label>
  )
}

interface PillSelectorProps<T extends { id: string; name: string }> {
  items: T[]
  selected: T[]
  onToggle: (item: T) => void
  newValue: string
  onNewValueChange: (v: string) => void
  onAdd: () => void
  placeholder: string
  emptyHint: string
}

function PillSelector<T extends { id: string; name: string }>({
  items,
  selected,
  onToggle,
  newValue,
  onNewValueChange,
  onAdd,
  placeholder,
  emptyHint,
}: PillSelectorProps<T>) {
  // Include selected items that haven't propagated to the items list yet
  const displayItems = [
    ...items,
    ...selected.filter((s) => !items.some((i) => i.id === s.id)),
  ]

  return (
    <div className="flex flex-col gap-2">
      {displayItems.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {displayItems.map((item) => {
            const isSelected = selected.some((s) => s.id === item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item)}
                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-full text-xs font-medium border transition-all duration-150 ease-in-out cursor-pointer ${
                  isSelected
                    ? 'bg-foreground text-background border-foreground hover:bg-foreground/85'
                    : 'bg-background text-muted-foreground border-border hover:bg-[#F0EEE8] hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {item.name}
                {isSelected && <X className="h-2.5 w-2.5 opacity-70" />}
              </button>
            )
          })}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          placeholder={placeholder}
          className="h-7 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onAdd}
          className="h-7 w-7 shrink-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
