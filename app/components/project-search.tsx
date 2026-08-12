'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { FilmCategory } from 'app/films/films-data'

const MAX_RESULTS = 8

const ProjectSearchDialog = dynamic(
  () =>
    import('./project-search-dialog').then(
      (module) => module.ProjectSearchDialog,
    ),
  { ssr: false },
)

export type ProjectSearchItem = {
  id: string
  category: FilmCategory
  title: string
  role: string
  type?: string
  production: string
  year: string
  searchText: string
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function ProjectSearch({ projects }: { projects: ProjectSearchItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedProject, setSelectedProject] =
    useState<ProjectSearchItem | null>(null)

  const results = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return []

    return projects
      .filter(({ searchText }) =>
        terms.every((term) => searchText.includes(term)),
      )
      .slice(0, MAX_RESULTS)
  }, [projects, query])

  useEffect(() => {
    if (!isOpen && !isMobileExpanded) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setIsMobileExpanded(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [isMobileExpanded, isOpen])

  const openFilm = useCallback((project: ProjectSearchItem) => {
    setSelectedProject(project)
    setIsOpen(false)
    setIsMobileExpanded(false)
  }, [])

  const closeFilm = useCallback(() => {
    setSelectedProject(null)
    requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        mobileButtonRef.current?.focus()
      } else {
        inputRef.current?.focus()
      }
    })
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setIsMobileExpanded(false)
      requestAnimationFrame(() => mobileButtonRef.current?.focus())
      return
    }

    if (results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex(
        (index) => (index - 1 + results.length) % results.length,
      )
    } else if (event.key === 'Enter' && isOpen) {
      event.preventDefault()
      openFilm(results[activeIndex] ?? results[0])
    }
  }

  const showResults = isOpen && query.trim().length > 0

  return (
    <>
      <div
        ref={rootRef}
        className="relative z-20 h-10 w-10 md:w-[clamp(7.5rem,32vw,22rem)]"
      >
        <button
          ref={mobileButtonRef}
          type="button"
          aria-label="Open project search"
          aria-expanded={isMobileExpanded}
          onClick={() => {
            setIsMobileExpanded(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)]/80 text-[var(--foreground-muted)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[border-color,background-color,color,scale] hover:border-[var(--foreground-subtle)] hover:text-[var(--foreground)] active:scale-[0.96] md:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="h-4 w-4"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.35" />
            <path
              d="m10.4 10.4 3.1 3.1"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div
          className={`absolute left-1/2 top-1/2 w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 md:relative md:left-auto md:top-auto md:block md:w-full md:translate-x-0 md:translate-y-0 ${
            isMobileExpanded ? 'block' : 'hidden'
          }`}
        >
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-subtle)]"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.35" />
              <path
                d="m10.4 10.4 3.1 3.1"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
                setIsOpen(true)
              }}
              onFocus={() => {
                if (query.trim()) setIsOpen(true)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search work"
              role="combobox"
              aria-label="Search projects"
              aria-autocomplete="list"
              aria-expanded={showResults}
              aria-controls="project-search-results"
              aria-activedescendant={
                showResults && results.length > 0
                  ? `project-search-result-${results[activeIndex]?.category}-${results[activeIndex]?.id}`
                  : undefined
              }
              autoComplete="off"
              className="h-10 w-full rounded-full border border-[var(--foreground-subtle)] bg-[var(--background)] pl-9 pr-11 text-[13px] text-[var(--foreground)] shadow-[0_8px_30px_-14px_rgba(0,0,0,0.35)] outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color] placeholder:text-[var(--foreground-subtle)] hover:border-[var(--foreground-subtle)] focus:border-[var(--foreground-subtle)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_6%,transparent),0_8px_30px_-14px_rgba(0,0,0,0.35)] md:border-[var(--border)] md:bg-[var(--background)]/80 md:pr-4 md:shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            />
            <button
              type="button"
              aria-label="Close project search"
              onClick={() => {
                setIsOpen(false)
                setIsMobileExpanded(false)
                requestAnimationFrame(() => mobileButtonRef.current?.focus())
              }}
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-[color,scale] hover:text-[var(--foreground)] active:scale-[0.96] md:hidden"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {showResults && (
            <div
              id="project-search-results"
              role="listbox"
              aria-label="Project search results"
              className="absolute left-1/2 top-[calc(100%+0.55rem)] w-[min(26rem,calc(100vw-1rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]/95 p-1.5 shadow-[0_18px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
            >
              {results.length > 0 ? (
                results.map((film, index) => (
                  <button
                    key={`${film.category}-${film.id}`}
                    id={`project-search-result-${film.category}-${film.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openFilm(film)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      index === activeIndex
                        ? 'bg-[var(--surface-muted)]'
                        : 'hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--foreground)]">
                        {film.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--foreground-muted)]">
                        {[film.role, film.type, film.production]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums text-[var(--foreground-subtle)]">
                      {film.year}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-center text-[12px] text-[var(--foreground-muted)]">
                  No projects found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectSearchDialog
          filmId={selectedProject.id}
          category={selectedProject.category}
          onClose={closeFilm}
        />
      )}
    </>
  )
}
