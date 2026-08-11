'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { FilmDetail } from 'app/films/films-showcase'
import type { Film } from 'app/films/films-data'

export type SourceFrame = {
  src: string
  left: number
  top: number
  width: number
  height: number
}

function ExpandingImage({
  source,
  dialogRef,
}: {
  source: SourceFrame
  dialogRef: React.RefObject<HTMLDivElement | null>
}) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useLayoutEffect(() => {
    const image = imageRef.current
    const target =
      dialogRef.current?.querySelector<HTMLElement>('[data-detail-media]')
    if (!image || !target) {
      setVisible(false)
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(false)
      return
    }

    let finished = false
    let fallback: ReturnType<typeof setTimeout>
    target.style.transition = 'none'
    target.style.opacity = '0'

    const finish = () => {
      if (finished) return
      finished = true
      target.style.transition = 'opacity 300ms ease-out'
      target.style.opacity = '1'
      image.style.transition = 'opacity 300ms ease-out'
      image.style.opacity = '0'
      fallback = setTimeout(() => setVisible(false), 320)
    }

    image.style.transform = `translate3d(${source.left}px, ${source.top}px, 0)`
    image.style.width = `${source.width}px`
    image.style.height = `${source.height}px`

    const raf = requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect()
      image.style.transition =
        'transform 550ms cubic-bezier(0.22, 1, 0.36, 1), width 550ms cubic-bezier(0.22, 1, 0.36, 1), height 550ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 550ms cubic-bezier(0.22, 1, 0.36, 1)'
      image.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`
      image.style.width = `${rect.width}px`
      image.style.height = `${rect.height}px`
      image.style.borderRadius = '1rem'
    })

    image.addEventListener('transitionend', finish, { once: true })
    fallback = setTimeout(finish, 700)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
      target.style.transition = ''
      target.style.opacity = ''
    }
  }, [dialogRef, source])

  if (!visible) return null

  return (
    <div
      ref={imageRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[95] overflow-hidden rounded-xl shadow-2xl will-change-transform"
    >
      <img src={source.src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

export function ContactProjectDialog({
  film,
  index,
  source,
  onClose,
}: {
  film: Film
  index: number
  source?: SourceFrame
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mounted, onClose])

  if (!mounted) return null

  return createPortal(
    <div
      className="contact-project-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-2 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-project-title"
        className="contact-project-dialog relative max-h-[calc(100svh-1rem)] w-full max-w-[780px] overflow-hidden rounded-[1.35rem] bg-[var(--background)] shadow-[0_30px_100px_-24px_rgba(0,0,0,0.55)] outline outline-1 outline-white/15 sm:max-h-[calc(100svh-3rem)] sm:rounded-[1.75rem]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="absolute right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)]/85 text-[var(--foreground)] shadow-md backdrop-blur-xl transition-[transform,background-color] duration-200 hover:bg-[var(--surface-muted)] active:scale-[0.96] sm:right-4 sm:top-4"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="films-detail-scroll max-h-[calc(100svh-1rem)] overflow-y-auto p-3 pb-8 sm:max-h-[calc(100svh-3rem)] sm:p-5 sm:pb-10">
          <span id="contact-project-title" className="sr-only">
            {film.title}
          </span>
          <FilmDetail film={film} index={index} />
        </div>
      </div>
      {source && <ExpandingImage source={source} dialogRef={dialogRef} />}
    </div>,
    document.body,
  )
}
