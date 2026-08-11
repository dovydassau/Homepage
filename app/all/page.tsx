import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from '../films/films-showcase'

export const metadata: Metadata = {
  title: 'All work',
  description: 'All film and assistant work by dovydas saudys.',
}

export default function AllPage() {
  return (
    <PageShell>
      <FilmsShowcase initialCategory="all" allBasePath="/all" />
    </PageShell>
  )
}
