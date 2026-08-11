import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from '../films/films-showcase'
import { getWelcomeInvite } from './welcome-invites'

export const metadata: Metadata = {
  title: 'Assistant',
  description: 'Assistant camera and crew credits by dovydas saudys.',
}

type AssistantPageProps = {
  searchParams: Promise<{
    w?: string | string[]
  }>
}

export default async function AssistantPage({
  searchParams,
}: AssistantPageProps) {
  const welcomeParam = (await searchParams).w
  const welcomeCode =
    typeof welcomeParam === 'string' ? welcomeParam : undefined
  const invite = getWelcomeInvite(welcomeCode)

  return (
    <PageShell>
      <FilmsShowcase
        initialCategory="assistant"
        workedIn={invite?.workedIn}
      />
    </PageShell>
  )
}
