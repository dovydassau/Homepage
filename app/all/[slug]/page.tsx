import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from 'app/components/page-shell'
import { FilmsShowcase } from '../../films/films-showcase'
import {
  films,
  getFilmBySlug,
  isFilmVisibleInAll,
} from '../../films/films-data'

type AllFilmPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return films
    .filter(isFilmVisibleInAll)
    .map((film) => ({ slug: film.id }))
}

export async function generateMetadata({
  params,
}: AllFilmPageProps): Promise<Metadata> {
  const { slug } = await params
  const film = getFilmBySlug(slug)

  if (!film || !isFilmVisibleInAll(film)) {
    return { title: 'Work not found' }
  }

  const description = [film.role, film.type, film.year]
    .filter(Boolean)
    .join(' · ')

  return {
    title: film.title,
    description,
    openGraph: {
      title: film.title,
      description,
    },
  }
}

export default async function AllFilmPage({ params }: AllFilmPageProps) {
  const { slug } = await params
  const film = getFilmBySlug(slug)

  if (!film || !isFilmVisibleInAll(film)) {
    notFound()
  }

  return (
    <PageShell>
      <FilmsShowcase
        initialSlug={slug}
        initialCategory="all"
        allBasePath="/all"
      />
    </PageShell>
  )
}
