import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, buildEmbeddingText } from '@/lib/embeddings'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Fetch all decisions that have no embedding yet
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, description')
    .is('embedding', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!decisions?.length) return NextResponse.json({ message: 'Nothing to backfill', count: 0 })

  const results: { ok: number; failed: number; errors: string[] } = { ok: 0, failed: 0, errors: [] }

  for (const d of decisions) {
    console.log(`[backfill] processing "${d.title}" (${d.id})`)
    try {
      const text = buildEmbeddingText(d.title, d.description)
      console.log(`[backfill] calling HuggingFace for "${d.title}"`)

      const embedding = await generateEmbedding(text)
      console.log(`[backfill] got embedding length: ${embedding.length} for "${d.title}"`)

      const { error: updateError } = await supabase
        .from('decisions')
        .update({ embedding })
        .eq('id', d.id)

      if (updateError) {
        console.error(`[backfill] supabase update failed for "${d.title}":`, updateError)
        throw updateError
      }

      console.log(`[backfill] ✓ saved "${d.title}"`)
      results.ok++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[backfill] ✗ failed "${d.title}" (${d.id}): ${message}`)
      results.errors.push(`"${d.title}": ${JSON.stringify(err)}`)
      results.failed++
    }
  }

  return NextResponse.json({ message: 'Backfill complete', ...results })
}
