import { permanentRedirect } from 'next/navigation'
import {
  withRedirectQuery,
  type RedirectSearchParams,
} from '../../works/redirect'

type WorkFilmPageProps = {
  params: Promise<{ slug: string }>
  searchParams: RedirectSearchParams
}

export default async function WorkFilmPage({
  params,
  searchParams,
}: WorkFilmPageProps) {
  const { slug } = await params
  permanentRedirect(
    await withRedirectQuery(`/works/${slug}`, searchParams),
  )
}
