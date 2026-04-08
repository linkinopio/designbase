import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDecisions } from '@/lib/actions/decisions'
import { getPatternsWithDecisions } from '@/lib/actions/patterns'
import { getTags } from '@/lib/actions/tags'
import { AppShell } from '@/components/layout/app-shell'

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[DesignBase] Missing Supabase env vars:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓ set' : '✗ missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✓ set' : '✗ missing',
    })
    throw new Error('Supabase environment variables are not configured. Check .env.local.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const [decisions, patterns, tags] = await Promise.all([
      getDecisions(),
      getPatternsWithDecisions(),
      getTags(),
    ])

    return (
      <AppShell
        user={user}
        initialDecisions={decisions}
        initialPatterns={patterns}
        initialTags={tags}
      />
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[DesignBase] Failed to load page data:', msg)
    throw err
  }
}
