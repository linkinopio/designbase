'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PatternWithDecisions } from '@/lib/types'

export async function getPatterns() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patterns')
    .select('*')
    .order('name')
  if (error) {
    console.error('[getPatterns] Supabase error:', JSON.stringify(error))
    throw new Error(`getPatterns: ${error.message} (code: ${error.code})`)
  }
  return data
}

export async function getPatternsWithDecisions(): Promise<PatternWithDecisions[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patterns')
    .select(`
      *,
      decision_patterns(
        decision:decisions(
          *,
          decision_patterns(pattern:patterns(*)),
          decision_tags(tag:tags(*))
        )
      )
    `)
    .order('name')

  if (error) {
    console.error('[getPatternsWithDecisions] Supabase error:', JSON.stringify(error))
    throw new Error(`getPatternsWithDecisions: ${error.message} (code: ${error.code})`)
  }

  return data.map((p) => {
    const decisions = p.decision_patterns.map((dp: any) => ({
      ...dp.decision,
      patterns: (dp.decision.decision_patterns ?? []).map((dp2: any) => dp2.pattern),
      tags: (dp.decision.decision_tags ?? []).map((dt: any) => dt.tag),
    }))

    // Aggregate unique tags across all linked decisions
    const tagMap = new Map()
    decisions.forEach((d: any) => d.tags.forEach((t: any) => tagMap.set(t.id, t)))

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      created_at: p.created_at,
      decisions,
      tags: Array.from(tagMap.values()),
    }
  })
}

export async function createPattern(name: string, description?: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patterns')
    .insert({ name, description: description ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/')
  return data
}

export async function updatePattern(id: string, updates: { name: string; description: string | null }) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('patterns')
    .update(updates)
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function deletePattern(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('patterns').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function linkDecisionToPattern(patternId: string, decisionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('decision_patterns')
    .insert({ pattern_id: patternId, decision_id: decisionId })
  if (error) throw error
  revalidatePath('/')
}

export async function unlinkDecisionFromPattern(patternId: string, decisionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('decision_patterns')
    .delete()
    .eq('pattern_id', patternId)
    .eq('decision_id', decisionId)
  if (error) throw error
  revalidatePath('/')
}
