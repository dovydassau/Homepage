import { redirect } from 'next/navigation'
import {
  findWelcomeCode,
  isWelcomeCode,
} from './assistant/welcome-invites'

// Temporarily skip the homepage and land on films.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const withParam = params.with
  const withCode =
    typeof withParam === 'string' && isWelcomeCode(withParam)
      ? withParam
      : undefined
  const welcomeCode = withCode ?? findWelcomeCode(Object.keys(params))

  redirect(
    welcomeCode
      ? `/films?${withCode ? 'with=' : ''}${encodeURIComponent(welcomeCode)}`
      : '/films',
  )
}
