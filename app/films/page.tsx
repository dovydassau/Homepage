import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from './films-showcase'

export const metadata: Metadata = {
  title: 'Films',
  description: 'Film and video work by dovydas saudys.',
}

export default function FilmsPage() {
  return (
    <PageShell>
      <FilmsShowcase initialCategory="featured" />
    </PageShell>
  )
}
