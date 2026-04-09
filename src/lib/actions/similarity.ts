'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, buildEmbeddingText } from '@/lib/embeddings'

export interface SimilarDecision {
  id: string
  title: string
  description: string
  similarity: number
}

export async function findSimilarDecisions(
  title: string,
  description: string,
  excludeId?: string
): Promise<SimilarDecision[]> {
  if (!title.trim() && !description.trim()) return []

  console.log('[findSimilarDecisions] generating embedding for:', { title: title.slice(0, 40), descriptionLength: description.length })

  let embedding: number[]
  try {
    embedding = await generateEmbedding(buildEmbeddingText(title, description))
    console.log('[findSimilarDecisions] embedding generated, length:', embedding.length)
  } catch (err) {
    console.error('[findSimilarDecisions] embedding failed:', JSON.stringify(err, null, 2))
    return []
  }

  const supabase = await createClient()
  console.log('[findSimilarDecisions] calling match_decisions RPC, threshold: 0.6')
  const { data, error } = await supabase.rpc('match_decisions', {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 3,
    exclude_id: excludeId ?? null,
  })

  if (error) {
    console.error('[findSimilarDecisions] rpc error:', error)
    return []
  }

  console.log('[findSimilarDecisions] results:', data?.length ?? 0, data)
  return (data ?? []) as SimilarDecision[]
}
