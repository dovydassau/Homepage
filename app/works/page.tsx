import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from '../films/films-showcase'

export const metadata: Metadata = {
  title: 'Works',
  description: 'Selected film and assistant work by dovydas saudys.',
}

export default function WorksPage() {
  return (
    <PageShell>
      <FilmsShowcase initialCategory="all" />
    </PageShell>
  )
}
