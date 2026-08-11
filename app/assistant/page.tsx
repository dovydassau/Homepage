import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from '../films/films-showcase'

export const metadata: Metadata = {
  title: 'Assistant',
  description: 'Assistant camera and crew credits by dovydas saudys.',
}

export default function AssistantPage() {
  return (
    <PageShell>
      <FilmsShowcase initialCategory="assistant" />
    </PageShell>
  )
}
