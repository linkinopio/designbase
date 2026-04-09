import { getIssues } from '@/lib/actions/issues'
import { getPatterns } from '@/lib/actions/patterns'
import { IssuesView } from '@/components/issues/issues-view'

export default async function IssuesPage() {
  try {
    const [issues, patterns] = await Promise.all([
      getIssues(),
      getPatterns(),
    ])

    return <IssuesView initialIssues={issues} patterns={patterns} />
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[IssuesPage] Failed to load:', msg)
    throw err
  }
}
