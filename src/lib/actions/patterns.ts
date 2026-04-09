'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getPatterns() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patterns')
    .select('*')
    .order('name')
  if (error) throw new Error(`getPatterns: ${error.message}`)
  return data
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
