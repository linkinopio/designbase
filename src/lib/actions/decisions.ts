'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Status } from '@/lib/types'

export async function getDecisions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decisions')
    .select(`
      *,
      decision_patterns(pattern:patterns(*)),
      decision_tags(tag:tags(*))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getDecisions] Supabase error:', JSON.stringify(error))
    throw new Error(`getDecisions: ${error.message} (code: ${error.code})`)
  }

  return data.map((d) => ({
    ...d,
    patterns: d.decision_patterns.map((dp: { pattern: unknown }) => dp.pattern),
    tags: d.decision_tags.map((dt: { tag: unknown }) => dt.tag),
  }))
}

export async function getDecision(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decisions')
    .select(`
      *,
      decision_patterns(pattern:patterns(*)),
      decision_tags(tag:tags(*))
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...data,
    patterns: data.decision_patterns.map((dp: { pattern: unknown }) => dp.pattern),
    tags: data.decision_tags.map((dt: { tag: unknown }) => dt.tag),
  }
}

export async function createDecision(input: {
  title: string
  description: string
  notes: string | null
  pattern_ids: string[]
  tag_ids: string[]
  status: Status
  image_url: string | null
}) {
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      title: input.title,
      description: input.description,
      notes: input.notes,
      status: input.status,
      image_url: input.image_url,
    })
    .select()
    .single()

  if (error) {
    console.error('[createDecision] error:', JSON.stringify(error))
    throw new Error(error.message)
  }

  if (input.pattern_ids.length > 0) {
    const { error: patternError } = await supabase
      .from('decision_patterns')
      .insert(input.pattern_ids.map((pattern_id) => ({ decision_id: decision.id, pattern_id })))
    if (patternError) throw patternError
  }

  if (input.tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from('decision_tags')
      .insert(input.tag_ids.map((tag_id) => ({ decision_id: decision.id, tag_id })))
    if (tagError) throw tagError
  }

  revalidatePath('/')
  return decision
}

export async function updateDecision(
  id: string,
  input: {
    title: string
    description: string
    notes: string | null
    pattern_ids: string[]
    tag_ids: string[]
    status: Status
    image_url: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('decisions')
    .update({
      title: input.title,
      description: input.description,
      notes: input.notes,
      status: input.status,
      image_url: input.image_url,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateDecision] error:', JSON.stringify(error))
    throw new Error(error.message)
  }

  await supabase.from('decision_patterns').delete().eq('decision_id', id)
  if (input.pattern_ids.length > 0) {
    const { error: patternError } = await supabase
      .from('decision_patterns')
      .insert(input.pattern_ids.map((pattern_id) => ({ decision_id: id, pattern_id })))
    if (patternError) throw patternError
  }

  await supabase.from('decision_tags').delete().eq('decision_id', id)
  if (input.tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from('decision_tags')
      .insert(input.tag_ids.map((tag_id) => ({ decision_id: id, tag_id })))
    if (tagError) throw tagError
  }

  revalidatePath('/')
  revalidatePath(`/decisions/${id}`)
}

export async function deleteDecision(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('decisions').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function uploadDecisionImage(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  const ext = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('decision-images')
    .upload(filename, file, { contentType: file.type })

  if (error) {
    console.error('[uploadDecisionImage] Supabase storage error:', JSON.stringify(error))
    throw new Error(error.message)
  }

  const { data } = supabase.storage
    .from('decision-images')
    .getPublicUrl(filename)

  return data.publicUrl
}
