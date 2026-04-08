'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getTags() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')
  if (error) {
    console.error('[getTags] Supabase error:', JSON.stringify(error))
    throw new Error(`getTags: ${error.message} (code: ${error.code})`)
  }
  return data
}

export async function createTag(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/')
  return data
}
