import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FilmsShowcase } from '../../films/films-showcase'
import { FilmsViewport } from '../../films/films-viewport'
import {
  filmPath,
  getFilmBySlug,
  getFilmSlugs,
} from '../../films/films-data'

type AssistantFilmPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getFilmSlugs('assistant').map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: AssistantFilmPageProps): Promise<Metadata> {
  const { slug } = await params
  const film = getFilmBySlug(slug)

  if (!film) {
    return { title: 'Credit not found' }
  }

  const description = [film.role, film.type, film.year].filter(Boolean).join(' · ')

  return {
    title: film.title,
    description,
    openGraph: {
      title: film.title,
      description,
    },
  }
}

export default async function AssistantFilmPage({
  params,
}: AssistantFilmPageProps) {
  const { slug } = await params
  const film = getFilmBySlug(slug)

  if (!film) {
    notFound()
  }

  if (film.category === 'featured') {
    redirect(filmPath(film))
  }

  return (
    <FilmsViewport>
      <FilmsShowcase initialSlug={slug} initialCategory="assistant" />
    </FilmsViewport>
  )
}
