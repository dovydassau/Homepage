import { redirect } from 'next/navigation'

// Temporarily skip the homepage and land on films.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ w?: string | string[] }>
}) {
  const welcomeParam = (await searchParams).w
  const welcomeCode =
    typeof welcomeParam === 'string' ? welcomeParam : undefined

  redirect(welcomeCode ? `/films?w=${encodeURIComponent(welcomeCode)}` : '/films')
}
