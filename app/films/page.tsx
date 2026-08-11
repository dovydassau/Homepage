import type { Metadata } from 'next'
import { FilmsShowcase } from './films-showcase'
import { FilmsViewport } from './films-viewport'

export const metadata: Metadata = {
  title: 'Films',
  description: 'Film and video work by dovydas saudys.',
}

export default function FilmsPage() {
  return (
    <FilmsViewport>
      <FilmsShowcase initialCategory="featured" />
    </FilmsViewport>
  )
}
