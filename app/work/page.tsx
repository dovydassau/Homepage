import { permanentRedirect } from 'next/navigation'
import {
  withRedirectQuery,
  type RedirectSearchParams,
} from '../works/redirect'

export default async function WorkPage({
  searchParams,
}: {
  searchParams: RedirectSearchParams
}) {
  permanentRedirect(await withRedirectQuery('/works', searchParams))
}
