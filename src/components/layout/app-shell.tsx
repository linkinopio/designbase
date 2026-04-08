'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { DecisionWithTags, PatternWithDecisions, Pattern, Tag } from '@/lib/types'
import { logout } from '@/lib/actions/auth'
import { DecisionsView } from '@/components/decisions/decisions-view'
import { PatternsView } from '@/components/patterns/patterns-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutGrid,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react'

interface Props {
  user: User
  initialDecisions: DecisionWithTags[]
  initialPatterns: PatternWithDecisions[]
  initialTags: Tag[]
}

export function AppShell({ user, initialDecisions, initialPatterns, initialTags }: Props) {
  const [decisions, setDecisions] = useState(initialDecisions)
  const [patterns, setPatterns] = useState(initialPatterns)
  const [tags, setTags] = useState(initialTags)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'decisions' | 'patterns'>('decisions')
  const [search, setSearch] = useState('')

  // Flat pattern list for the DecisionDialog pill selectors
  const flatPatterns: Pattern[] = patterns.map(({ decisions: _, tags: __, ...p }) => p)

  function handleDecisionSaved(decision: DecisionWithTags) {
    setDecisions((prev) => {
      const idx = prev.findIndex((d) => d.id === decision.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = decision; return next }
      return [decision, ...prev]
    })
    // Update linked counts in patterns
    setPatterns((prev) => prev.map((p) => {
      const wasLinked = p.decisions.some((d) => d.id === decision.id)
      const isLinked = decision.patterns.some((dp) => dp.id === p.id)
      if (wasLinked && !isLinked) return { ...p, decisions: p.decisions.filter((d) => d.id !== decision.id) }
      if (!wasLinked && isLinked) return { ...p, decisions: [...p.decisions, decision] }
      if (wasLinked && isLinked) return { ...p, decisions: p.decisions.map((d) => d.id === decision.id ? decision : d) }
      return p
    }))
  }

  function handleDecisionDeleted(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
    setPatterns((prev) => prev.map((p) => ({ ...p, decisions: p.decisions.filter((d) => d.id !== id) })))
  }

  function handlePatternCreated(p: Pattern) {
    setPatterns((prev) =>
      [...prev, { ...p, decisions: [], tags: [] }].sort((a, b) => a.name.localeCompare(b.name))
    )
  }

  function handleTagCreated(t: Tag) {
    setTags((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)))
  }

  return (
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'decisions' | 'patterns')}
      className="h-screen w-full overflow-hidden"
    >
      <div className="flex h-full">
        {/* ── Sidebar ─────────────────────────────── */}
        <aside
          className={`flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 overflow-hidden ${
            sidebarOpen ? 'w-56' : 'w-0'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <span className="font-heading text-base font-bold select-none">
              <span className="text-foreground">Design</span>
              <span className="text-primary">Base</span>
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 ease-in-out cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Nav tabs */}
          <div className="flex-1 overflow-y-auto py-3 px-2">
            <TabsList
              variant="line"
              className="w-full flex-col gap-0.5 bg-transparent p-0"
            >
              <TabsTrigger
                value="decisions"
                className="w-full justify-start gap-2.5 px-3 py-2 h-9 rounded-lg text-sm"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Decisions
              </TabsTrigger>
              <TabsTrigger
                value="patterns"
                className="w-full justify-start gap-2.5 px-3 py-2 h-9 rounded-lg text-sm"
              >
                <Layers className="h-4 w-4 shrink-0" />
                Patterns
              </TabsTrigger>
            </TabsList>
          </div>

          {/* User area */}
          <div className="px-2 pb-3 pt-2 border-t border-border shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 ease-in-out cursor-pointer" />
                }
              >
                <span className="flex-1 text-left truncate text-xs">{user.email}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => { await logout() }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top bar — always visible */}
          <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 ease-in-out cursor-pointer"
                  title="Open sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <span className="text-base font-bold tracking-tight select-none shrink-0">
                  <span className="text-foreground">Design</span>
                  <span className="text-primary">Base</span>
                </span>
              </>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9186] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search decisions, patterns, elements…"
                className="w-full h-10 pl-9 pr-4 rounded-full border border-[#E2DDD5] bg-white text-sm text-foreground placeholder:text-[#9C9186] outline-none focus:border-foreground/30 transition-colors cursor-pointer focus:cursor-text"
              />
            </div>
          </div>

          <main className="flex-1 overflow-y-auto">
            {activeTab === 'decisions' && (
              <DecisionsView
                decisions={decisions}
                patterns={flatPatterns}
                tags={tags}
                search={search}
                onDecisionSaved={handleDecisionSaved}
                onDecisionDeleted={handleDecisionDeleted}
                onPatternCreated={handlePatternCreated}
                onTagCreated={handleTagCreated}
              />
            )}
            {activeTab === 'patterns' && (
              <PatternsView
                patterns={patterns}
                allDecisions={decisions}
                search={search}
                onPatternCreated={handlePatternCreated}
                onPatternsChanged={setPatterns}
              />
            )}
          </main>
        </div>
      </div>
    </Tabs>
  )
}
