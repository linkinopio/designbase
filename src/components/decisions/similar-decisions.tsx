'use client'

import { useState, useEffect, useRef } from 'react'
import { findSimilarDecisions, type SimilarDecision } from '@/lib/actions/similarity'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  title: string
  description: string
  excludeId?: string
  onView: (id: string) => void
}

const DEBOUNCE_MS = 800

export function SimilarDecisions({ title, description, excludeId, onView }: Props) {
  const [results, setResults] = useState<SimilarDecision[]>([])
  const [dismissed, setDismissed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(0)

  // Only trigger on description changes — title is used for context but doesn't debounce alone
  useEffect(() => {
    setDismissed(false)
    if (timer.current) clearTimeout(timer.current)

    if (!description.trim()) {
      setResults([])
      return
    }

    const seq = ++latest.current

    timer.current = setTimeout(async () => {
      console.log('[SimilarDecisions] debounce fired, calling findSimilarDecisions')
      try {
        const data = await findSimilarDecisions(title, description, excludeId)
        console.log('[SimilarDecisions] received results:', data.length, data)
        if (seq === latest.current) setResults(data)
      } catch (err) {
        console.error('[SimilarDecisions] error:', err)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [description, excludeId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || results.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-status-amber/30 bg-status-amber-bg px-3.5 py-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-status-amber shrink-0" />
          <span className="text-xs font-semibold text-status-amber">
            Similar decisions already exist
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-status-amber/50 hover:text-status-amber transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss warning"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Matches */}
      <div className="flex flex-col gap-1">
        {results.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onView(r.id)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/60 border border-status-amber/20 text-left hover:bg-white hover:border-status-amber/40 transition-all duration-150 cursor-pointer"
          >
            <span className="text-sm font-medium line-clamp-1 flex-1 min-w-0 text-foreground">
              {r.title}
            </span>
            <span className="font-mono text-xs text-status-amber shrink-0 whitespace-nowrap">
              {Math.round(r.similarity * 100)}% match — click to view
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-status-amber/70">
        You can still save this as a new decision if it&apos;s different.
      </p>
    </div>
  )
}
