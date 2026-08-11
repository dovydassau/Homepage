'use client'

import { ContactProjectDialog } from 'app/contact/contact-project-dialog'
import { films, type FilmCategory } from 'app/films/films-data'

export function ProjectSearchDialog({
  filmId,
  category,
  onClose,
}: {
  filmId: string
  category: FilmCategory
  onClose: () => void
}) {
  const film = films.find(
    (item) => item.id === filmId && item.category === category,
  )

  if (!film) return null

  return (
    <ContactProjectDialog
      film={film}
      index={films.indexOf(film)}
      onClose={onClose}
    />
  )
}
