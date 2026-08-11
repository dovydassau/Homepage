export type RedirectSearchParams = Promise<
  Record<string, string | string[] | undefined>
>

export async function withRedirectQuery(
  pathname: string,
  searchParams: RedirectSearchParams,
) {
  const values = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else if (value !== undefined) {
      query.set(key, value)
    }
  }

  const serialized = query.toString()
  return serialized ? `${pathname}?${serialized}` : pathname
}
