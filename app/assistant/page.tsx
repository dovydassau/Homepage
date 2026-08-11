import type { Metadata } from 'next'
import { FilmsShowcase } from '../films/films-showcase'
import { FilmsViewport } from '../films/films-viewport'

export const metadata: Metadata = {
  title: 'Assistant',
  description: 'Assistant camera and crew credits by dovydas saudys.',
}

export default function AssistantPage() {
  return (
    <FilmsViewport>
      <FilmsShowcase initialCategory="assistant" />
    </FilmsViewport>
  )
}
