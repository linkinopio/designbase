'use client'

import { useState, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { logout } from '@/lib/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutGrid,
  CircleAlert,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react'

/* ── Search context ─────────────────────────────────────────── */

const SearchContext = createContext('')
export function useSearch() { return useContext(SearchContext) }

/* ── Component ──────────────────────────────────────────────── */

interface Props {
  user: User
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/', label: 'Decisions', icon: LayoutGrid },
  { href: '/issues', label: 'Issues', icon: CircleAlert },
]

export function AppShell({ user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  return (
    <SearchContext.Provider value={search}>
      <div className="h-screen w-full overflow-hidden flex">

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

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto py-3 px-2">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 h-9 rounded-lg text-sm transition-all duration-150 ease-in-out cursor-pointer ${
                      active
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
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
          {/* Top bar */}
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
                <span className="font-heading text-base font-bold select-none shrink-0">
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
                placeholder="Search…"
                className="w-full h-10 pl-9 pr-4 rounded-full border border-[#E2DDD5] bg-white text-sm text-foreground placeholder:text-[#9C9186] outline-none focus:border-foreground/30 transition-colors cursor-pointer focus:cursor-text"
              />
            </div>
          </div>

          <main className="flex-1 overflow-y-auto flex flex-col">
            {children}
          </main>
        </div>

      </div>
    </SearchContext.Provider>
  )
}
