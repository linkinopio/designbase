'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Issue, IssueStatus, IssuePriority } from '@/lib/types'

export async function getIssues(): Promise<Issue[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getIssues] Supabase error:', JSON.stringify(error))
    throw new Error(`getIssues: ${error.message}`)
  }

  return data as Issue[]
}

export async function createIssue(input: {
  title: string
  description: string | null
  notes: string | null
  status: IssueStatus
  priority: IssuePriority
  related_pattern: string | null
  image_url: string | null
}): Promise<Issue> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('issues')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('[createIssue] error:', JSON.stringify(error))
    throw new Error(error.message)
  }

  revalidatePath('/issues')
  return data as Issue
}

export async function updateIssue(
  id: string,
  input: {
    title: string
    description: string | null
    notes: string | null
    status: IssueStatus
    priority: IssuePriority
    related_pattern: string | null
    image_url: string | null
  }
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('issues')
    .update(input)
    .eq('id', id)

  if (error) {
    console.error('[updateIssue] error:', JSON.stringify(error))
    throw new Error(error.message)
  }

  revalidatePath('/issues')
}

export async function deleteIssue(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('issues').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/issues')
}

export async function uploadIssueImage(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const file = formData.get('file') as File
  const ext = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('decision-images')
    .upload(filename, file, { contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('decision-images').getPublicUrl(filename)
  return data.publicUrl
}
