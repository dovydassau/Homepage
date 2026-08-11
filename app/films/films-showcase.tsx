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
  ImageLoadingOverlay,
  markImageLoaded,
} from '../components/image-loading-overlay'
import { useProducerWelcome } from '../components/producer-welcome-context'
import { TapeStrip } from '../components/tape-strip'
import {
  categoryBasePath,
  compareFilmsPinnedThenNewest,
  filmPath,
  films,
  formatFilmNumber,
  getFilmBySlug,
  isFilmInactive,
  isFilmVisibleInAll,
  isFilmVisibleInWorks,
  isDirectVideoUrl,
  toEmbedUrl,
  type ExtraContent,
  type ExtraImageInput,
  type Film,
  type FilmCategory,
} from './films-data'

type ShowcaseCategory = FilmCategory | 'all'
type AllWorksBasePath = '/all' | '/works'

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

const FLY_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const FLY_DURATION_MS = 580
const FLY_HANDOFF_MS = 220

// On list click, the hover card flies onto the detail media, then dissolves.
// Handoff is cover-then-reveal (never a crossfade) so identical stills don't
// dip through the page background at mid-opacity.
function FlyOverlay({ fly, onDone }: { fly: FlyState; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const done = () => onDoneRef.current()
    let cancelled = false
    let handedOff = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let targetEl: HTMLElement | null = null

    const restoreTarget = () => {
      if (!targetEl) return
      targetEl.style.transition = ''
      targetEl.style.opacity = ''
    }

    const applyRect = (rect: FlyRect, radius: string) => {
      el.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`
      el.style.width = `${rect.width}px`
      el.style.height = `${rect.height}px`
      el.style.borderRadius = radius
    }

    // Match the hover card's resting look.
    applyRect(fly.start, '0.75rem')
    el.style.opacity = '1'
    el.style.boxShadow =
      '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px color-mix(in srgb, var(--border) 80%, transparent)'

    const handoff = () => {
      if (cancelled || handedOff) return
      handedOff = true
      clearTimeout(settleTimer)

      // Re-measure in case the detail panel settled during flight.
      if (targetEl) {
        const latest = targetEl.getBoundingClientRect()
        el.style.transition = 'none'
        applyRect(
          {
            left: latest.left,
            top: latest.top,
            width: latest.width,
            height: latest.height,
          },
          '1rem',
        )
        // Show the destination at full opacity while still fully covered by
        // the fly card — avoids the ±50% dip of a simultaneous crossfade.
        targetEl.style.transition = 'none'
        targetEl.style.opacity = '1'
        void el.offsetWidth
      }

      el.style.transition = `opacity ${FLY_HANDOFF_MS}ms ease-out, box-shadow ${FLY_HANDOFF_MS}ms ease-out`
      el.style.opacity = '0'
      el.style.boxShadow = '0 0 0 0 transparent'
      settleTimer = setTimeout(done, FLY_HANDOFF_MS + 20)
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

      // Keep destination hidden until handoff — the fly card is the only
      // visible surface during the move.
      targetEl.style.transition = 'none'
      targetEl.style.opacity = '0'

      const target = targetEl.getBoundingClientRect()
      void el.offsetWidth

      el.style.transition = [
        `transform ${FLY_DURATION_MS}ms ${FLY_EASE}`,
        `width ${FLY_DURATION_MS}ms ${FLY_EASE}`,
        `height ${FLY_DURATION_MS}ms ${FLY_EASE}`,
        `border-radius ${FLY_DURATION_MS}ms ${FLY_EASE}`,
        `box-shadow ${FLY_DURATION_MS}ms ${FLY_EASE}`,
      ].join(', ')
      applyRect(
        {
          left: target.left,
          top: target.top,
          width: target.width,
          height: target.height,
        },
        '1rem',
      )
      el.style.boxShadow =
        '0 8px 24px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px color-mix(in srgb, var(--border) 90%, transparent)'

      const handleEnd = (event: TransitionEvent) => {
        if (event.propertyName !== 'transform') return
        el.removeEventListener('transitionend', handleEnd)
        handoff()
      }
      el.addEventListener('transitionend', handleEnd)
      settleTimer = setTimeout(handoff, FLY_DURATION_MS + 40)
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
      className="pointer-events-none fixed left-0 top-0 z-50 hidden overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)] will-change-transform lg:block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fly.src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

function resolveInitialState(
  initialSlug?: string,
  initialCategory: ShowcaseCategory = 'featured',
  excludeIndependent = false,
): {
  category: ShowcaseCategory
  selectedId: string
  mobileDetailId: string | null
} {
  const film = initialSlug ? getFilmBySlug(initialSlug) : undefined

  if (film) {
    return {
      category: initialCategory === 'all' ? 'all' : film.category,
      selectedId: film.id,
      mobileDetailId: initialSlug ? film.id : null,
    }
  }

  const firstInCategory =
    initialCategory === 'all'
      ? films
          .filter(
            (entry) =>
              excludeIndependent
                ? isFilmVisibleInWorks(entry)
                : isFilmVisibleInAll(entry),
          )
          .sort(compareFilmsPinnedThenNewest)[0]
      : films.find((entry) => entry.category === initialCategory)

  return {
    category: initialCategory,
    selectedId: firstInCategory?.id ?? films[0]?.id ?? '',
    mobileDetailId: null,
  }
}

function FilmTag({
  tag,
  overlay,
}: {
  tag: string
  overlay?: 'desktop' | 'mobile'
}) {
  const placement =
    overlay === 'desktop'
      ? 'pointer-events-none absolute right-[1.5rem] top-1/2 z-10 flex -translate-y-1/2'
      : overlay === 'mobile'
        ? 'pointer-events-none absolute right-0 top-1/2 z-10 flex -translate-y-1/2'
        : 'relative inline-flex'

  const color =
    tag.trim().toLowerCase() === 'upcoming' ? '#184fff' : '#FF5C00'

  return (
    <TapeStrip
      variant="marker"
      color={color}
      className={`${placement} shrink-0 items-center px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[10px] font-black uppercase leading-none tracking-[-0.035em] ${
        tag.trim().toLowerCase() === 'upcoming' ? 'text-white' : 'text-black'
      }`}
    >
      {tag}
    </TapeStrip>
  )
}

function WorkedTogetherNote({ compact = false }: { compact?: boolean }) {
  return (
    <TapeStrip
      variant="marker"
      aria-label="We worked on this together"
      className={`pointer-events-none whitespace-nowrap font-[family-name:var(--font-geist-mono)] font-black uppercase text-black ${
        compact
          ? 'relative mt-1.5 inline-flex px-3.5 py-2 text-[11px] leading-none tracking-[-0.035em]'
          : 'absolute left-[1.5rem] top-1/2 z-10 flex -translate-y-1/2 px-4 py-2 text-[12px] leading-none tracking-[-0.045em]'
      }`}
    >
      we worked on this together
    </TapeStrip>
  )
}

function FilmPreview({
  film,
  index,
  deferReveal = false,
}: {
  film: Film
  index: number
  // When a fly animation is covering the slot, stay hidden until FlyOverlay
  // fades this in — same pattern as the video iframe target.
  deferReveal?: boolean
}) {
  // Latch so we don't re-run detail-media-reveal after the fly finishes.
  const [skippedCssReveal] = useState(deferReveal)
  const videoUrl = film.videoUrl?.trim() || null
  const directVideoUrl =
    videoUrl && isDirectVideoUrl(videoUrl) ? videoUrl : null
  const embedUrl = videoUrl && !directVideoUrl ? toEmbedUrl(videoUrl) : null
  const hideUntilFlySettles = deferReveal

  if (directVideoUrl || embedUrl) {
    return (
      <div
        data-detail-media
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black"
        style={hideUntilFlySettles ? { opacity: 0 } : undefined}
      >
        {film.tag && (
          <div className="absolute right-3 top-3 z-10">
            <FilmTag tag={film.tag} />
          </div>
        )}
        {directVideoUrl ? (
          <video
            key={directVideoUrl}
            src={directVideoUrl}
            title={film.title}
            className="absolute inset-0 h-full w-full"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <iframe
            key={embedUrl!}
            src={embedUrl!}
            title={film.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>
    )
  }

  if (film.previewImg) {
    return (
      <div
        data-detail-media
        className={[
          'relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]',
          // Skip the CSS reveal while flying — it would show this same image
          // under the fly card. FlyOverlay handles the delayed fade-in.
          skippedCssReveal ? '' : 'detail-media-reveal',
        ]
          .filter(Boolean)
          .join(' ')}
        style={hideUntilFlySettles ? { opacity: 0 } : undefined}
      >
        {film.tag && (
          <div className="absolute right-3 top-3 z-10">
            <FilmTag tag={film.tag} />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.previewImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      data-detail-media
      className={[
        'relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)]',
        skippedCssReveal ? '' : 'detail-media-reveal',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundImage: film.gradient,
        ...(hideUntilFlySettles ? { opacity: 0 } : null),
      }}
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

export function FilmDetail({
  film,
  index,
  deferMediaReveal = false,
}: {
  film: Film
  index: number
  deferMediaReveal?: boolean
}) {
  return (
    <div>
      <FilmPreview
        film={film}
        index={index}
        deferReveal={deferMediaReveal}
      />
      <div
        className="detail-rise mt-4 flex flex-wrap items-center gap-2.5"
        style={{ animationDelay: '0.1s' }}
      >
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-[var(--accent)]">
          {film.title}
        </h2>
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

function BtsImageCaption({ description }: { description: string }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-3rem)]">
      <TapeStrip
        variant="marker"
        color="#7151D8"
        className="relative inline-flex max-w-full px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[12px]"
      >
        <span className="relative z-10">
          {description}
        </span>
      </TapeStrip>
    </div>
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
  const videoUrl = item.videoUrl?.trim() || null
  const directVideoUrl =
    videoUrl && isDirectVideoUrl(videoUrl) ? videoUrl : null
  const embedUrl = videoUrl && !directVideoUrl ? toEmbedUrl(videoUrl) : null
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
      {(directVideoUrl || embedUrl) && (
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black sm:rounded-2xl">
          {directVideoUrl ? (
            <video
              src={directVideoUrl}
              title={item.title}
              className="h-full w-full"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <iframe
              src={embedUrl!}
              title={item.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          )}
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

const emptyWorkedIn: readonly string[] = []

function CategoryToggle({
  value,
  onChange,
}: {
  value: ShowcaseCategory
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

export function FilmsShowcase({
  initialSlug,
  initialCategory = 'featured',
  workedIn,
  allBasePath = '/works',
  excludeIndependent = false,
}: {
  initialSlug?: string
  initialCategory?: ShowcaseCategory
  workedIn?: readonly string[]
  allBasePath?: AllWorksBasePath
  excludeIndependent?: boolean
}) {
  const [initial] = useState(() =>
    resolveInitialState(initialSlug, initialCategory, excludeIndependent),
  )
  const [category, setCategory] = useState<ShowcaseCategory>(initial.category)
  const [selectedId, setSelectedId] = useState(initial.selectedId)
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(
    initial.mobileDetailId,
  )
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [fly, setFly] = useState<FlyState | null>(null)
  const previewCardRef = useRef<HTMLDivElement>(null)
  const desktopDetailScrollRef = useRef<HTMLDivElement>(null)
  const mobileDetailScrollRef = useRef<HTMLDivElement>(null)
  const flyToken = useRef(0)
  const { invite: welcomeInvite } = useProducerWelcome()
  const activeWorkedIn =
    workedIn ?? welcomeInvite?.workedIn ?? emptyWorkedIn

  const visibleFilms = useMemo(() => {
    const filteredFilms = films.filter((film) =>
      category === 'all'
        ? excludeIndependent
          ? isFilmVisibleInWorks(film)
          : isFilmVisibleInAll(film)
        : film.category === category,
    )

    return category === 'all'
      ? filteredFilms.sort(compareFilmsPinnedThenNewest)
      : filteredFilms
  }, [category, excludeIndependent])
  const workedInSet = useMemo(
    () => new Set(activeWorkedIn),
    [activeWorkedIn],
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
    if (category !== 'all') {
      setCategory(film.category)
    }
    setSelectedId(film.id)
    if (options?.openMobileDetail) {
      setMobileDetailId(film.id)
    }
    updateUrl(
      category === 'all' ? `${allBasePath}/${film.id}` : filmPath(film),
    )
  }

  function closeMobileDetail() {
    setMobileDetailId(null)
    updateUrl(category === 'all' ? allBasePath : categoryBasePath(category))
  }

  function handleCategoryChange(next: FilmCategory) {
    if (next === category) return

    const first = films.find((film) => film.category === next)
    setCategory(next)
    setMobileDetailId(null)

    if (first) {
      setSelectedId(first.id)
      updateUrl(filmPath(first))
    } else {
      updateUrl(categoryBasePath(next))
    }
  }

  // Keep selection in sync when the user navigates via browser back/forward.
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(
        /^\/(films|assistant|works|all)(?:\/([^/]+))?\/?$/,
      )
      setMobileDetailId(null)

      if (!match) return

      const [, section, slug] = match
      if (slug) {
        const film = getFilmBySlug(slug)
        if (film) {
          setCategory(
            section === 'works' || section === 'all'
              ? 'all'
              : film.category,
          )
          setSelectedId(film.id)
        }
        return
      }

      const nextCategory: ShowcaseCategory =
        section === 'works' || section === 'all'
          ? 'all'
          : section === 'assistant'
            ? 'assistant'
            : 'featured'
      const first =
        nextCategory === 'all'
          ? films
              .filter(
                (film) =>
                  excludeIndependent
                    ? isFilmVisibleInWorks(film)
                    : isFilmVisibleInAll(film),
              )
              .sort(compareFilmsPinnedThenNewest)[0]
          : films.find((film) => film.category === nextCategory)
      setCategory(nextCategory)
      if (first) setSelectedId(first.id)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [excludeIndependent])

  const selectedFilm = getFilmBySlug(selectedId)
  const selectedIndex = selectedFilm
    ? visibleFilms.findIndex((film) => film.id === selectedId)
    : 0

  const mobileFilm = mobileDetailId ? getFilmBySlug(mobileDetailId) : null
  const mobileIndex =
    mobileFilm &&
    (category === 'all' || mobileFilm.category === category)
      ? visibleFilms.findIndex((film) => film.id === mobileDetailId)
      : mobileFilm
        ? films
            .filter((film) => film.category === mobileFilm.category)
            .findIndex((film) => film.id === mobileDetailId)
        : -1
  const detailOpen = mobileFilm !== null
  const desktopTopPadding = welcomeInvite ? 'pt-0' : 'pt-[6.5rem]'
  const mobileTopPadding =
    welcomeInvite && !detailOpen
      ? 'pt-0'
      : 'pt-[4.75rem] sm:pt-[6.25rem]'

  // Keep the project list anchored where the user was browsing, but always
  // start a newly selected project's independent detail pane from the top.
  useEffect(() => {
    desktopDetailScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    if (mobileDetailId) {
      mobileDetailScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [mobileDetailId, selectedId])

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

      <div className="h-full min-h-0">
      {/* Desktop: click-to-select, resizable two-pane */}
      <div className="hidden h-full min-h-0 lg:block">
      <Group
        orientation="horizontal"
        id="films-panels"
        style={{ height: '100%', overflow: 'hidden' }}
      >
        <Panel defaultSize="42%" minSize="28%" style={{ overflow: 'hidden' }}>
          <div
            ref={desktopDetailScrollRef}
            className={`films-detail-scroll h-full overflow-y-auto overscroll-contain pb-5 pr-8 ${desktopTopPadding}`}
          >
            {selectedFilm && selectedIndex >= 0 && (
              <FilmDetail
                key={selectedFilm.id}
                film={selectedFilm}
                index={selectedIndex}
                deferMediaReveal={fly !== null}
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

        <Panel defaultSize="58%" minSize="35%" style={{ overflow: 'hidden' }}>
          <div className={`films-detail-scroll h-full overflow-y-auto overscroll-contain pb-5 pl-2 ${desktopTopPadding}`}>
          <DataTable themed>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-[var(--foreground-muted)]">
                {visibleFilms.length}{' '}
                {category === 'all'
                  ? 'projects'
                  : category === 'featured'
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
              const isSharedProject = workedInSet.has(film.id)

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
                  <DataTablePrimaryCell
                    className={
                      film.category === 'featured' && film.tag
                        ? 'relative overflow-visible'
                        : undefined
                    }
                  >
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
                      <FilmTag tag={film.tag} overlay="desktop" />
                    )}
                  </DataTablePrimaryCell>
                  <DataTableCell
                    responsive="hide-narrow"
                    className={isSharedProject ? 'relative overflow-visible' : undefined}
                    muted={isIndependent(film.production)}
                  >
                    <span className="block">{film.production}</span>
                    {isSharedProject && <WorkedTogetherNote />}
                  </DataTableCell>
                  <DataTableCell truncate>{film.role}</DataTableCell>
                  <DataTableCell align="right">
                    <DataTableTabular>{film.year}</DataTableTabular>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTable>
          </div>
        </Panel>
      </Group>
      </div>

      {/* Mobile: iOS-style navigation stack */}
      <div className="relative h-full min-h-0 overflow-hidden lg:hidden">
        {/* List screen */}
        <div
          className={`films-detail-scroll h-full min-h-0 overflow-y-auto overscroll-contain pb-3 transition-[transform,opacity] duration-300 ease-out sm:pb-4 ${mobileTopPadding} ${
            detailOpen
              ? 'pointer-events-none absolute inset-0 -translate-x-1/4 opacity-0'
              : 'relative translate-x-0 opacity-100'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] text-[var(--foreground-muted)]">
              {visibleFilms.length}{' '}
              {category === 'all'
                ? 'projects'
                : category === 'featured'
                  ? 'films'
                  : 'credits'}
            </span>
            <CategoryToggle value={category} onChange={handleCategoryChange} />
          </div>

          {visibleFilms.map((film, index) => {
            const isInactive = isFilmInactive(film)
            const isSharedProject = workedInSet.has(film.id)

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
              <div className="relative min-w-0 flex-1">
                <div
                  className={`relative truncate text-[16px] tracking-[-0.012em] ${
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
                {film.tag && <FilmTag tag={film.tag} overlay="mobile" />}
                <div className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--foreground-muted)]">
                  <span className="truncate">
                    {film.type ? `${film.type} · ` : ''}
                    {film.role} · {film.year}
                  </span>
                </div>
                {isSharedProject && <WorkedTogetherNote compact />}
              </div>
              <Chevron className="shrink-0 text-[var(--foreground-subtle)] transition-transform group-active:translate-x-0.5" />
            </button>
            )
          })}
        </div>

        {/* Detail screen */}
        <div
          ref={mobileDetailScrollRef}
          className={`films-detail-scroll h-full min-h-0 overflow-y-auto overscroll-contain pb-3 transition-[transform,opacity] duration-300 ease-out sm:pb-4 ${mobileTopPadding} ${
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
            {category === 'all' ? 'Work' : 'Films'}
          </button>

          {mobileFilm && mobileIndex >= 0 && (
            <div key={mobileFilm.id} className="film-detail-enter pt-2">
              <FilmDetail film={mobileFilm} index={mobileIndex} />
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
