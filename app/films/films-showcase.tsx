'use client'

import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { Group, Panel, Separator } from 'react-resizable-panels'
import {
  DataTable,
  DataTableCell,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableIndex,
  DataTablePrimaryCell,
  DataTablePrimaryLine,
  DataTableRow,
  DataTableSubtext,
  DataTableTabular,
} from '../components/data-table'
import {
  films,
  formatFilmNumber,
  getFilmBySlug,
  isFilmInactive,
  toEmbedUrl,
  type ExtraContent,
  type ExtraImageInput,
  type Film,
  type FilmCategory,
} from './films-data'

type PreviewLayer = { id: number; src: string; loaded: boolean }

function MousePreview({
  src,
  cardRef,
}: {
  src: string | null
  cardRef?: Ref<HTMLDivElement>
}) {
  const followRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const prevX = useRef(0)
  const counter = useRef(0)
  const prevSrc = useRef<string | null>(null)

  const [layers, setLayers] = useState<PreviewLayer[]>([])

  const topLayer = layers[layers.length - 1]
  const topLoaded = topLayer?.loaded ?? false

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      target.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])

  // Queue a new layer whenever the hovered image changes.
  useEffect(() => {
    const cameFromHidden = !prevSrc.current
    prevSrc.current = src
    if (!src) return
    setLayers((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.src === src) return prev
      counter.current += 1
      const nextLayer = { id: counter.current, src, loaded: false }
      // Fresh appearance (mouse entered from outside the list): start clean so
      // no stale image flashes — only the progress bar shows until it loads.
      // Moving item-to-item keeps the previous image for a smooth crossfade.
      return cameFromHidden
        ? [nextLayer]
        : [...prev, nextLayer].slice(-3)
    })
  }, [src])

  // Once the newest image is ready, drop the layers underneath it.
  useEffect(() => {
    if (!topLoaded) return
    const timer = setTimeout(() => {
      setLayers((prev) => prev.slice(-1))
    }, 320)
    return () => clearTimeout(timer)
  }, [topLoaded, topLayer?.id])

  // Spring the card toward the cursor with a velocity-based tilt.
  useEffect(() => {
    if (layers.length === 0) return

    current.current = { ...target.current }
    prevX.current = current.current.x
    let frame = 0

    const tick = () => {
      const el = followRef.current
      const t = target.current
      const c = current.current

      c.x += (t.x - c.x) * 0.16
      c.y += (t.y - c.y) * 0.16

      const velocity = c.x - prevX.current
      prevX.current = c.x
      const tilt = Math.max(-16, Math.min(16, velocity * 0.7))

      if (el) {
        el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) translate(1.25rem, -50%) rotate(${tilt}deg)`
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [layers.length])

  const markLoaded = (id: number) =>
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, loaded: true } : layer,
      ),
    )

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-50 hidden transition-opacity duration-200 ease-out lg:block ${
        src ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div ref={followRef} style={{ willChange: 'transform' }}>
        <div
          className={`origin-center transition-transform duration-300 ease-out ${
            src ? 'scale-100' : 'scale-90'
          }`}
        >
          <div
            ref={cardRef}
            className="relative h-40 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] shadow-2xl"
          >
            {/* Skeleton shimmer shown until the first image resolves. */}
            <div
              className={`preview-shimmer absolute inset-0 transition-opacity duration-300 ${
                topLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {layers.map((layer, index) => {
              const isTop = index === layers.length - 1
              const visible = isTop ? layer.loaded : !topLoaded
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={layer.id}
                  src={layer.src}
                  alt=""
                  onLoad={() => markLoaded(layer.id)}
                  ref={(node) => {
                    if (node?.complete && node.naturalWidth > 0 && !layer.loaded) {
                      // Handle already-cached images (no load event fires).
                      setTimeout(() => markLoaded(layer.id), 0)
                    }
                  }}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${
                    visible ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )
            })}

            {/* Indeterminate progress bar while the newest image loads. */}
            <div
              className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-[var(--surface-hover)] transition-opacity duration-200 ${
                topLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="preview-progress-bar h-full w-1/3 rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type FlyRect = { left: number; top: number; width: number; height: number }
type FlyState = { token: number; src: string; start: FlyRect }

// On list click, the hover card flies onto the detail media, then fades out.
function FlyOverlay({ fly, onDone }: { fly: FlyState; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const done = () => onDoneRef.current()
    let cancelled = false
    let settleTimer: ReturnType<typeof setTimeout>
    let targetEl: HTMLElement | null = null

    const restoreTarget = () => {
      if (!targetEl) return
      targetEl.style.transition = ''
      targetEl.style.opacity = ''
    }

    el.style.transform = `translate(${fly.start.left}px, ${fly.start.top}px)`
    el.style.width = `${fly.start.width}px`
    el.style.height = `${fly.start.height}px`
    el.style.opacity = '1'

    const fadeOut = () => {
      if (cancelled) return
      // Reveal the media underneath as the card dissolves over it.
      if (targetEl) {
        targetEl.style.transition = 'opacity 0.4s ease-out'
        targetEl.style.opacity = '1'
      }
      el.style.transition = 'opacity 0.4s ease-out'
      el.style.opacity = '0'
      settleTimer = setTimeout(done, 420)
    }

    let tries = 0
    const flyToTarget = () => {
      if (cancelled) return
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('[data-detail-media]'),
      )
      targetEl =
        targets.find((node) => {
          const rect = node.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        }) ?? null

      if (!targetEl) {
        if (tries++ < 12) {
          requestAnimationFrame(flyToTarget)
          return
        }
        done()
        return
      }

      // Hide the media until the card arrives on top of it.
      targetEl.style.transition = 'none'
      targetEl.style.opacity = '0'

      const target = targetEl.getBoundingClientRect()
      void el.offsetWidth
      const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transition = `transform 0.55s ${ease}, width 0.55s ${ease}, height 0.55s ${ease}`
      el.style.transform = `translate(${target.left}px, ${target.top}px)`
      el.style.width = `${target.width}px`
      el.style.height = `${target.height}px`

      const handleEnd = (event: TransitionEvent) => {
        if (event.propertyName !== 'transform') return
        el.removeEventListener('transitionend', handleEnd)
        fadeOut()
      }
      el.addEventListener('transitionend', handleEnd)
      // Fallback in case transitionend doesn't fire.
      settleTimer = setTimeout(fadeOut, 650)
    }

    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(flyToTarget),
    )

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      restoreTarget()
    }
    // Runs once per launch; identified by token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fly.token])

  return (
    <div
      aria-hidden
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-50 hidden overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl will-change-transform lg:block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fly.src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

function resolveInitialState(initialSlug?: string) {
  const film = initialSlug ? getFilmBySlug(initialSlug) : undefined

  if (film) {
    return {
      category: film.category,
      selectedId: film.id,
      mobileDetailId: initialSlug ? film.id : null,
    }
  }

  const firstFeatured = films.find((entry) => entry.category === 'featured')

  return {
    category: 'featured' as FilmCategory,
    selectedId: firstFeatured?.id ?? films[0]?.id ?? '',
    mobileDetailId: null,
  }
}

function FilmTag({ tag }: { tag: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)]/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--foreground-muted)] backdrop-blur-sm">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
      {tag}
    </span>
  )
}

function FilmPreview({ film, index }: { film: Film; index: number }) {
  const embedUrl = film.videoUrl ? toEmbedUrl(film.videoUrl) : null

  if (embedUrl) {
    return (
      <div
        data-detail-media
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black"
      >
        {film.tag && (
          <div className="absolute right-3 top-3 z-10">
            <FilmTag tag={film.tag} />
          </div>
        )}
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={film.title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      data-detail-media
      className="detail-media-reveal relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)]"
      style={{ backgroundImage: film.gradient }}
    >
      {film.tag && (
        <div className="absolute right-3 top-3 z-10">
          <FilmTag tag={film.tag} />
        </div>
      )}
      <div className="absolute inset-3 rounded-xl border border-dashed border-white/40" />
      <div className="absolute bottom-3 left-3 rounded-md bg-black/25 px-2 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm">
        preview / {formatFilmNumber(index)}
      </div>
    </div>
  )
}

function isIndependent(value?: string) {
  return value?.trim().toLowerCase() === 'independent'
}

function CreditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2.5 text-[14px]">
      <span className="text-[var(--foreground-subtle)]">{label}</span>
      <span
        className={
          isIndependent(value)
            ? 'text-[var(--foreground-subtle)]'
            : 'text-[var(--foreground)]'
        }
      >
        {value}
      </span>
    </div>
  )
}

function FilmDetail({ film, index }: { film: Film; index: number }) {
  return (
    <div>
      <FilmPreview film={film} index={index} />
      <div
        className="detail-rise mt-4 flex flex-wrap items-center gap-2.5"
        style={{ animationDelay: '0.1s' }}
      >
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-[var(--accent)]">
          {film.title}
        </h2>
        {film.tag && <FilmTag tag={film.tag} />}
      </div>
      <p
        className="detail-rise mt-1 text-[14px] text-[var(--foreground-muted)]"
        style={{ animationDelay: '0.16s' }}
      >
        {film.role} · {film.year}
      </p>

      {film.summary && (
        <p
          className="detail-rise mt-4 text-[14px] leading-relaxed text-[var(--foreground-muted)]"
          style={{ animationDelay: '0.22s' }}
        >
          {film.summary}
        </p>
      )}

      <div className="detail-rise mt-5" style={{ animationDelay: '0.24s' }}>
        {film.credits.map((credit) => (
          <CreditRow
            key={credit.id}
            label={credit.label}
            value={credit.value}
          />
        ))}
      </div>

      {film.description && (
        <p
          className="detail-rise mt-5 text-[14px] leading-relaxed text-[var(--foreground-muted)]"
          style={{ animationDelay: '0.3s' }}
        >
          {film.description}
        </p>
      )}

      {film.extraContent && film.extraContent.length > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {film.extraContent.map((item) => (
            <ExtraContentItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ImageLoadingOverlay({ loaded }: { loaded: boolean }) {
  return (
    <>
      <div
        className={`preview-shimmer absolute inset-0 transition-opacity duration-300 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-[var(--surface-hover)] transition-opacity duration-200 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="preview-progress-bar h-full w-1/3 rounded-full bg-[var(--accent)]" />
      </div>
    </>
  )
}

function markImageLoaded(
  node: HTMLImageElement | null,
  loaded: boolean,
  onLoad: () => void,
) {
  if (node?.complete && node.naturalWidth > 0 && !loaded) {
    // Handle already-cached images (no load event fires).
    setTimeout(onLoad, 0)
  }
}

function BtsImageCaption({ description }: { description: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 z-[9] h-24 w-36 sm:h-28 sm:w-44"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 0% 100%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 55%, transparent 72%)',
        }}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-3rem)]">
        <span className="inline-block rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-medium leading-snug tracking-wide text-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:text-[12px]">
          {description}
        </span>
      </div>
    </>
  )
}

function ImageLightbox({
  images,
  title,
  openIndex,
  onClose,
  onChange,
}: {
  images: ExtraImageInput[]
  title: string
  openIndex: number | null
  onClose: () => void
  onChange: (index: number) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (openIndex === null) return
    setLoaded(false)
  }, [openIndex])

  useEffect(() => {
    if (openIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowLeft' && openIndex > 0) {
        onChange(openIndex - 1)
      }
      if (event.key === 'ArrowRight' && openIndex < images.length - 1) {
        onChange(openIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [images.length, onChange, onClose, openIndex])

  if (!mounted || openIndex === null) return null

  const hasMultiple = images.length > 1
  const currentImage = images[openIndex]
  const currentDescription = currentImage.description?.trim()

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image ${openIndex + 1} of ${images.length}`}
      className="image-lightbox-enter fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {hasMultiple && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[12px] font-medium tracking-wide text-white/80 backdrop-blur-sm">
          {openIndex + 1} / {images.length}
        </div>
      )}

      {hasMultiple && openIndex > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onChange(openIndex - 1)
          }}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 hover:text-white sm:left-6"
        >
          <Chevron className="rotate-180" />
        </button>
      )}

      {hasMultiple && openIndex < images.length - 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onChange(openIndex + 1)
          }}
          aria-label="Next image"
          className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 hover:text-white sm:right-6"
        >
          <Chevron />
        </button>
      )}

      <div
        className="relative z-[1] min-h-[12rem] min-w-[min(100%,20rem)] max-h-[calc(100vh-4rem)] max-w-[min(100%,72rem)] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-muted)]/20"
        onClick={(event) => event.stopPropagation()}
      >
        <ImageLoadingOverlay loaded={loaded} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentImage.src}
          src={currentImage.src}
          alt={
            currentDescription
              ? `${title} — ${currentDescription}`
              : `${title} ${openIndex + 1}`
          }
          onLoad={() => setLoaded(true)}
          ref={(node) => markImageLoaded(node, loaded, () => setLoaded(true))}
          className={`max-h-[calc(100vh-4rem)] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-opacity duration-300 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {currentDescription && (
          <BtsImageCaption description={currentDescription} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function BtsThumbnail({
  image,
  title,
  index,
  onOpen,
}: {
  image: ExtraImageInput
  title: string
  index: number
  onOpen: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const description = image.description?.trim()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={
        description
          ? `Open ${title} image ${index + 1}: ${description}`
          : `Open ${title} image ${index + 1}`
      }
      className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-left transition-[border-color,transform] duration-200 hover:border-[var(--foreground-subtle)] active:scale-[0.99] sm:rounded-2xl"
    >
      <ImageLoadingOverlay loaded={loaded} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={
          description ? `${title} — ${description}` : `${title} ${index + 1}`
        }
        loading="lazy"
        onLoad={() => setLoaded(true)}
        ref={(node) => markImageLoaded(node, loaded, () => setLoaded(true))}
        className={`aspect-[4/3] w-full object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.02] ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {description && <BtsImageCaption description={description} />}
      <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
      <span className="pointer-events-none absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M1.5 4.5V1.5H4.5M7.5 1.5H10.5V4.5M1.5 7.5V10.5H4.5M7.5 10.5H10.5V7.5"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}

function ExpandableImages({
  images,
  title,
}: {
  images: ExtraImageInput[]
  title: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <>
      <div
        className={`mt-3 grid gap-3 ${
          images.length > 1 ? 'grid-cols-2' : ''
        }`}
      >
        {images.map((image, index) => (
          <BtsThumbnail
            key={image.src}
            image={image}
            title={title}
            index={index}
            onOpen={() => setOpenIndex(index)}
          />
        ))}
      </div>

      <ImageLightbox
        images={images}
        title={title}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onChange={setOpenIndex}
      />
    </>
  )
}

function ExtraContentItem({ item }: { item: ExtraContent }) {
  const embedUrl = item.videoUrl ? toEmbedUrl(item.videoUrl) : null
  const images = item.imageContents ?? []

  return (
    <div>
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-[var(--foreground)]">
        {item.title}
      </h3>
      {item.description && (
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--foreground-muted)]">
          {item.description}
        </p>
      )}
      {images.length > 0 && (
        <ExpandableImages images={images} title={item.title} />
      )}
      {embedUrl && (
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black sm:rounded-2xl">
          <iframe
            src={embedUrl}
            title={item.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M1 1L7 7L1 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const categories: { id: FilmCategory; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'assistant', label: 'Assistant' },
]

function CategoryToggle({
  value,
  onChange,
}: {
  value: FilmCategory
  onChange: (next: FilmCategory) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-[var(--surface-muted)] p-0.5 text-[13px] font-medium">
      {categories.map((category) => {
        const isActive = value === category.id
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${
              isActive
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}

// Update the URL without a Next route change so the showcase stays mounted
// (a full navigation would remount this tree and abort the fly animation).
function updateUrl(path: string) {
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    window.history.pushState(null, '', path)
  }
}

export function FilmsShowcase({ initialSlug }: { initialSlug?: string }) {
  const [initial] = useState(() => resolveInitialState(initialSlug))
  const [category, setCategory] = useState<FilmCategory>(initial.category)
  const [selectedId, setSelectedId] = useState(initial.selectedId)
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(
    initial.mobileDetailId,
  )
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [fly, setFly] = useState<FlyState | null>(null)
  const previewCardRef = useRef<HTMLDivElement>(null)
  const flyToken = useRef(0)

  const visibleFilms = useMemo(
    () => films.filter((film) => film.category === category),
    [category],
  )

  function launchFly(src: string) {
    const card = previewCardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    if (rect.width === 0) return
    flyToken.current += 1
    setFly({
      token: flyToken.current,
      src,
      start: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    })
    setPreviewSrc(null)
  }

  function selectFilm(film: Film, options?: { openMobileDetail?: boolean }) {
    setCategory(film.category)
    setSelectedId(film.id)
    if (options?.openMobileDetail) {
      setMobileDetailId(film.id)
    }
    updateUrl(`/films/${film.id}`)
  }

  function closeMobileDetail() {
    setMobileDetailId(null)
    updateUrl('/films')
  }

  function handleCategoryChange(next: FilmCategory) {
    if (next === category) return

    const first = films.find((film) => film.category === next)
    setCategory(next)
    setMobileDetailId(null)

    if (first) {
      setSelectedId(first.id)
      updateUrl(`/films/${first.id}`)
    } else {
      updateUrl('/films')
    }
  }

  // Keep selection in sync when the user navigates via browser back/forward.
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/films\/([^/]+)/)
      const film = match ? getFilmBySlug(match[1]) : undefined
      setMobileDetailId(null)
      if (film) {
        setCategory(film.category)
        setSelectedId(film.id)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const selectedFilm = getFilmBySlug(selectedId)
  const selectedIndex = selectedFilm
    ? visibleFilms.findIndex((film) => film.id === selectedId)
    : 0

  const mobileFilm = mobileDetailId ? getFilmBySlug(mobileDetailId) : null
  const mobileIndex =
    mobileFilm && mobileFilm.category === category
      ? visibleFilms.findIndex((film) => film.id === mobileDetailId)
      : mobileFilm
        ? films
            .filter((film) => film.category === mobileFilm.category)
            .findIndex((film) => film.id === mobileDetailId)
        : -1
  const detailOpen = mobileFilm !== null

  return (
    <>
      <MousePreview src={fly ? null : previewSrc} cardRef={previewCardRef} />
      {fly && (
        <FlyOverlay
          key={fly.token}
          fly={fly}
          onDone={() =>
            setFly((current) =>
              current && current.token === fly.token ? null : current,
            )
          }
        />
      )}

      {/* Desktop: click-to-select, resizable two-pane */}
      <div className="mt-2 hidden lg:block">
      <Group
        orientation="horizontal"
        id="films-panels"
        style={{ overflow: 'visible' }}
      >
        <Panel defaultSize="42%" minSize="28%" style={{ overflow: 'visible' }}>
          <div className="films-detail-scroll sticky top-24 max-h-[calc(100vh-8rem)] self-start overflow-y-auto pr-8">
            {selectedFilm && selectedIndex >= 0 && (
              <FilmDetail
                key={selectedFilm.id}
                film={selectedFilm}
                index={selectedIndex}
              />
            )}
          </div>
        </Panel>

        <Separator className="group relative mx-1 flex w-4 cursor-col-resize items-center justify-center">
          <span className="h-16 w-px bg-[var(--border)] transition-colors group-hover:bg-[var(--foreground-subtle)] group-active:bg-[var(--accent)]" />
          <span className="absolute flex h-8 w-4 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
            <span className="h-6 w-1 rounded-full bg-[var(--foreground-subtle)] group-active:bg-[var(--accent)]" />
          </span>
        </Separator>

        <Panel defaultSize="58%" minSize="35%" style={{ overflow: 'visible' }}>
          <DataTable themed className="pl-2">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-[var(--foreground-muted)]">
                {visibleFilms.length}{' '}
                {category === 'featured'
                  ? 'featured films'
                  : 'assistant credits'}
              </span>
              <CategoryToggle value={category} onChange={handleCategoryChange} />
            </div>

            <DataTableHeader>
              <DataTableHeaderCell>Project</DataTableHeaderCell>
              <DataTableHeaderCell responsive="hide-narrow">
                Production
              </DataTableHeaderCell>
              <DataTableHeaderCell>Role</DataTableHeaderCell>
              <DataTableHeaderCell align="right">Year</DataTableHeaderCell>
            </DataTableHeader>

            {visibleFilms.map((film, index) => {
              const isSelected = selectedId === film.id
              const isInactive = isFilmInactive(film)

              return (
                <DataTableRow
                  key={film.id}
                  selected={isSelected}
                  inactive={isInactive}
                  onClick={() => {
                    if (isInactive) return
                    if (film.id !== selectedId && film.previewImg) {
                      launchFly(film.previewImg)
                    }
                    selectFilm(film)
                  }}
                  onMouseEnter={() =>
                    setPreviewSrc(film.previewImg ?? null)
                  }
                  onMouseLeave={() => setPreviewSrc(null)}
                >
                  <DataTablePrimaryCell>
                    <DataTablePrimaryLine>
                      <DataTableIndex>
                        {formatFilmNumber(index)}
                      </DataTableIndex>
                      <span className="data-table__title">{film.title}</span>
                    </DataTablePrimaryLine>
                    {film.category === 'assistant' && (
                      <DataTableSubtext
                        responsive="show-narrow"
                        className={
                          isIndependent(film.production)
                            ? 'data-table__cell--muted'
                            : undefined
                        }
                      >
                        {film.production}
                      </DataTableSubtext>
                    )}
                    {film.category === 'featured' && film.tag && (
                      <DataTableSubtext inline>
                        <FilmTag tag={film.tag} />
                      </DataTableSubtext>
                    )}
                  </DataTablePrimaryCell>
                  <DataTableCell
                    responsive="hide-narrow"
                    truncate
                    muted={isIndependent(film.production)}
                  >
                    {film.production}
                  </DataTableCell>
                  <DataTableCell truncate>{film.role}</DataTableCell>
                  <DataTableCell align="right">
                    <DataTableTabular>{film.year}</DataTableTabular>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTable>
        </Panel>
      </Group>
      </div>

      {/* Mobile: iOS-style navigation stack */}
      <div className="relative mt-2 overflow-hidden lg:hidden">
        {/* List screen */}
        <div
          className={`transition-[transform,opacity] duration-300 ease-out ${
            detailOpen
              ? 'pointer-events-none absolute inset-0 -translate-x-1/4 opacity-0'
              : 'relative translate-x-0 opacity-100'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] text-[var(--foreground-muted)]">
              {visibleFilms.length}{' '}
              {category === 'featured' ? 'films' : 'credits'}
            </span>
            <CategoryToggle value={category} onChange={handleCategoryChange} />
          </div>

          {visibleFilms.map((film, index) => {
            const isInactive = isFilmInactive(film)

            return (
            <button
              key={film.id}
              type="button"
              disabled={isInactive}
              onClick={() => !isInactive && selectFilm(film, { openMobileDetail: true })}
              className={`group flex w-full items-center gap-3 border-b border-[var(--border)] py-3 text-left transition-colors ${
                isInactive
                  ? 'cursor-default'
                  : 'active:bg-[var(--surface-muted)]'
              }`}
            >
              <div
                className={`relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] ${isInactive ? 'opacity-40' : ''}`}
                style={{ backgroundImage: film.gradient }}
              >
                {film.previewImg && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={film.previewImg}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[16px] tracking-[-0.012em] ${
                    isInactive
                      ? 'text-[var(--foreground-subtle)]'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  <span className="tabular-nums text-[var(--foreground-subtle)]">
                    {formatFilmNumber(index)}.
                  </span>{' '}
                  {film.title}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--foreground-muted)]">
                  {film.tag && <FilmTag tag={film.tag} />}
                  <span className="truncate">
                    {film.type ? `${film.type} · ` : ''}
                    {film.role} · {film.year}
                  </span>
                </div>
              </div>
              <Chevron className="shrink-0 text-[var(--foreground-subtle)] transition-transform group-active:translate-x-0.5" />
            </button>
            )
          })}
        </div>

        {/* Detail screen */}
        <div
          className={`transition-[transform,opacity] duration-300 ease-out ${
            detailOpen
              ? 'relative translate-x-0 opacity-100'
              : 'pointer-events-none absolute inset-0 translate-x-full opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={closeMobileDetail}
            className="group -mx-4 mb-2 flex min-h-[60px] w-[calc(100%+2rem)] items-center gap-1.5 border-b border-[var(--border)] px-4 text-[17px] font-medium text-[var(--accent)] transition-colors active:bg-[var(--surface-muted)]"
          >
            <Chevron className="rotate-180 transition-transform group-hover:-translate-x-0.5 group-active:-translate-x-1" />
            Films
          </button>

          {mobileFilm && mobileIndex >= 0 && (
            <div key={mobileFilm.id} className="film-detail-enter pt-2">
              <FilmDetail film={mobileFilm} index={mobileIndex} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
