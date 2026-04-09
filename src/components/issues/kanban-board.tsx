'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Issue, IssueStatus } from '@/lib/types'
import { IssueCard } from './issue-card'

/* ── Column config ─────────────────────────────────────────── */

interface Column {
  status: IssueStatus
  label: string
  headerClass: string
  dotClass: string
  dropClass: string
}

const COLUMNS: Column[] = [
  {
    status: 'backlog',
    label: 'Backlog',
    headerClass: 'text-muted-foreground',
    dotClass: 'bg-muted-foreground/40',
    dropClass: 'border-border/60 bg-muted/20',
  },
  {
    status: 'tbd',
    label: 'TBD',
    headerClass: 'text-status-amber',
    dotClass: 'bg-status-amber',
    dropClass: 'border-status-amber/30 bg-status-amber-bg/40',
  },
  {
    status: 'resolved',
    label: 'Resolved',
    headerClass: 'text-status-green',
    dotClass: 'bg-status-green',
    dropClass: 'border-status-green/30 bg-status-green-bg/40',
  },
]

/* ── Draggable card wrapper ────────────────────────────────── */

function DraggableCard({
  issue,
  onView,
  onEdit,
  onDeleted,
}: {
  issue: Issue
  onView: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <IssueCard
        issue={issue}
        onClick={onView}
        onEdit={onEdit}
        onDeleted={onDeleted}
      />
    </div>
  )
}

/* ── Droppable column ──────────────────────────────────────── */

function KanbanColumn({
  col,
  issues,
  isOver,
  onView,
  onEdit,
  onDeleted,
}: {
  col: Column
  issues: Issue[]
  isOver: boolean
  onView: (issue: Issue) => void
  onEdit: (issue: Issue) => void
  onDeleted: (id: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: col.status })

  return (
    <div className="flex flex-col flex-1 min-w-[260px] max-w-sm min-h-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotClass}`} />
        <span className={`text-sm font-semibold ${col.headerClass}`}>{col.label}</span>
        <span className="font-mono text-xs text-muted-foreground/60 tabular-nums ml-auto">
          {issues.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 flex-1 rounded-xl border-2 border-dashed p-3 overflow-y-auto transition-colors duration-150 min-h-[200px] ${
          isOver ? col.dropClass : 'border-transparent'
        }`}
      >
        {issues.map((issue) => (
          <DraggableCard
            key={issue.id}
            issue={issue}
            onView={() => onView(issue)}
            onEdit={() => onEdit(issue)}
            onDeleted={() => onDeleted(issue.id)}
          />
        ))}

        {issues.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/40 select-none">Drop here</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Board ─────────────────────────────────────────────────── */

interface Props {
  issues: Issue[]
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void
  onView: (issue: Issue) => void
  onEdit: (issue: Issue) => void
  onDeleted: (id: string) => void
}

export function KanbanBoard({ issues, onStatusChange, onView, onEdit, onDeleted }: Props) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [overId, setOverId] = useState<IssueStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveIssue(event.active.data.current?.issue ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId((event.over?.id as IssueStatus) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveIssue(null)
    setOverId(null)

    if (!over) return
    const newStatus = over.id as IssueStatus
    const issue = active.data.current?.issue as Issue
    if (issue && issue.status !== newStatus) {
      onStatusChange(issue.id, newStatus)
    }
  }

  function handleDragCancel() {
    setActiveIssue(null)
    setOverId(null)
  }

  const byStatus = (status: IssueStatus) => issues.filter((i) => i.status === status)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            col={col}
            issues={byStatus(col.status)}
            isOver={overId === col.status}
            onView={onView}
            onEdit={onEdit}
            onDeleted={onDeleted}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue && (
          <IssueCard
            issue={activeIssue}
            isDragging
            onClick={() => {}}
            onEdit={() => {}}
            onDeleted={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
