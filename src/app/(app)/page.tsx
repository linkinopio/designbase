import { getDecisions } from '@/lib/actions/decisions'
import { getPatterns } from '@/lib/actions/patterns'
import { getTags } from '@/lib/actions/tags'
import { DecisionsView } from '@/components/decisions/decisions-view'

export default async function DecisionsPage() {
  try {
    const [decisions, patterns, tags] = await Promise.all([
      getDecisions(),
      getPatterns(),
      getTags(),
    ])

    return (
      <DecisionsView
        initialDecisions={decisions}
        initialPatterns={patterns}
        initialTags={tags}
      />
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[DecisionsPage] Failed to load:', msg)
    throw err
  }
}
