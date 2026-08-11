'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { markImageLoaded } from 'app/components/image-loading-overlay'
import { TapeStrip } from 'app/components/tape-strip'
import {
  films,
  getContactShowcaseItems,
  getFilmBySlug,
  type ContactShowcaseItem,
} from 'app/films/films-data'
import {
  ContactProjectDialog,
  type SourceFrame,
} from './contact-project-dialog'

type Slot = {
  className: string
  rotate: number
  duration: string
  revealX: string
  revealY: string
}

// Frames stay at the perimeter, leaving the form as the visual focal point.
const slots: Slot[] = [
  {
    className: '-left-14 -top-10 w-40 sm:-left-10 sm:w-56 lg:w-72',
    rotate: -8,
    duration: '26s',
    revealX: '3.5rem',
    revealY: '2.5rem',
  },
  {
    className: '-left-16 top-[42%] hidden w-44 sm:block lg:w-60',
    rotate: 6,
    duration: '31s',
    revealX: '4rem',
    revealY: '-0.5rem',
  },
  {
    className: '-top-14 right-[4%] w-36 sm:right-[8%] sm:w-52 lg:w-64',
    rotate: 7,
    duration: '28s',
    revealX: '0rem',
    revealY: '3.5rem',
  },
  {
    className: '-right-16 top-[32%] w-40 sm:w-52 lg:w-64',
    rotate: -7,
    duration: '24s',
    revealX: '-4rem',
    revealY: '-0.5rem',
  },
  {
    className: '-bottom-16 -left-8 w-44 sm:left-[4%] sm:w-56 lg:w-72',
    rotate: 8,
    duration: '30s',
    revealX: '2rem',
    revealY: '-4rem',
  },
  {
    className: '-bottom-14 right-[1%] w-40 sm:w-56 lg:w-72',
    rotate: -6,
    duration: '27s',
    revealX: '-0.5rem',
    revealY: '-3.5rem',
  },
  {
    className: '-bottom-24 left-[30%] hidden w-48 lg:block',
    rotate: 4,
    duration: '29s',
    revealX: '0rem',
    revealY: '-6rem',
  },
  {
    className: '-top-24 left-[31%] hidden w-44 lg:block',
    rotate: -5,
    duration: '25s',
    revealX: '0rem',
    revealY: '6rem',
  },
  {
    className: '-top-20 left-[16%] hidden w-40 lg:block',
    rotate: 9,
    duration: '32s',
    revealX: '0rem',
    revealY: '5rem',
  },
  {
    className: '-top-24 right-[24%] hidden w-36 lg:block',
    rotate: -8,
    duration: '27s',
    revealX: '0rem',
    revealY: '6rem',
  },
  {
    className: '-bottom-20 left-[18%] hidden w-40 lg:block',
    rotate: -6,
    duration: '30s',
    revealX: '0rem',
    revealY: '-5rem',
  },
  {
    className: '-bottom-24 right-[20%] hidden w-44 lg:block',
    rotate: 7,
    duration: '26s',
    revealX: '0rem',
    revealY: '-6rem',
  },
  {
    className: '-left-20 top-[18%] hidden w-36 lg:block',
    rotate: -10,
    duration: '29s',
    revealX: '5rem',
    revealY: '0rem',
  },
  {
    className: '-right-20 top-[62%] hidden w-40 lg:block',
    rotate: 10,
    duration: '33s',
    revealX: '-5rem',
    revealY: '-1rem',
  },
  {
    className: '-top-24 left-[46%] hidden w-32 lg:block',
    rotate: 5,
    duration: '28s',
    revealX: '0rem',
    revealY: '6rem',
  },
  {
    className: '-bottom-24 left-[48%] hidden w-36 lg:block',
    rotate: -4,
    duration: '31s',
    revealX: '0rem',
    revealY: '-6rem',
  },
]

// This only creates lightweight metadata. Browser image requests happen solely
// for the items currently mounted in the visible slots.
const contactItemPool = getContactShowcaseItems(Number.POSITIVE_INFINITY)

function ScatteredPhoto({
  item,
  index,
  slot,
  onOpen,
  onInteractionStart,
  onInteractionEnd,
  fadingOut,
}: {
  item: ContactShowcaseItem
  index: number
  slot: Slot
  onOpen: (
    item: ContactShowcaseItem,
    source: SourceFrame,
    trigger: HTMLButtonElement,
  ) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
  fadingOut: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const frameStyle = {
    animationDelay: `${Math.min(index, 7) * 70}ms`,
    '--tile-rotate': `${slot.rotate}deg`,
    '--tile-reveal-x': slot.revealX,
    '--tile-reveal-y': slot.revealY,
  } as CSSProperties

  return (
    <button
      type="button"
      aria-label={`Open ${item.title} project details`}
      onMouseEnter={onInteractionStart}
      onMouseLeave={onInteractionEnd}
      onFocus={onInteractionStart}
      onBlur={onInteractionEnd}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        onOpen(
          item,
          {
            src: item.src,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
          event.currentTarget,
        )
      }}
      className={`scattered-photos__frame group absolute aspect-[4/5] overflow-hidden rounded-xl bg-[var(--surface-muted)] shadow-[0_2px_5px_rgba(0,0,0,0.08),0_18px_50px_-20px_rgba(0,0,0,0.35)] outline outline-1 outline-black/[0.08] transition-[transform,box-shadow,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:z-30 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1),0_28px_60px_-18px_rgba(0,0,0,0.42)] focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
        loaded
          ? fadingOut
            ? 'scattered-photos__frame--loaded scattered-photos__frame--fading pointer-events-none'
            : 'scattered-photos__frame--loaded pointer-events-auto'
          : 'scattered-photos__frame--loading pointer-events-none'
      } ${slot.className}`}
      style={frameStyle}
    >
      <img
        src={item.src}
        alt={`${item.title} project still`}
        loading={index < 3 ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        ref={(node) =>
          markImageLoaded(node, loaded, () => setLoaded(true))
        }
        className={`scattered-photos__img h-full w-full object-cover transition-opacity duration-300 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ animationDuration: slot.duration } as CSSProperties}
      />
      <TapeStrip
        variant="marker"
        animate="interaction"
        className="pointer-events-none absolute inset-x-2 bottom-2 z-20 translate-y-2 p-2.5 text-left text-black transition-[translate] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0"
      >
        <span className="block truncate text-[12px] font-medium">
          {item.title}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-black/60">
          <span className="truncate">{item.role}</span>
          <span className="shrink-0">Open +</span>
        </span>
      </TapeStrip>
    </button>
  )
}

export function ScatteredPhotos() {
  const [items, setItems] = useState(() =>
    contactItemPool.slice(0, slots.length),
  )
  const [openProject, setOpenProject] = useState<{
    item: ContactShowcaseItem
    source: SourceFrame
    trigger: HTMLButtonElement
  } | null>(null)
  const [fadingSlots, setFadingSlots] = useState<Set<number>>(
    () => new Set(),
  )
  const nextItemIndex = useRef(items.length)
  const replacementTimers = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  )

  const selectedFilm = openProject
    ? getFilmBySlug(openProject.item.filmId)
    : undefined
  const selectedIndex = selectedFilm
    ? films
        .filter((film) => film.category === selectedFilm.category)
        .findIndex((film) => film.id === selectedFilm.id)
    : -1

  const closeProject = useCallback(() => {
    const trigger = openProject?.trigger
    setOpenProject(null)
    requestAnimationFrame(() => trigger?.focus())
  }, [openProject])

  const cancelReplacement = useCallback((slotIndex: number) => {
    const timer = replacementTimers.current.get(slotIndex)
    if (timer) {
      clearTimeout(timer)
      replacementTimers.current.delete(slotIndex)
    }
    setFadingSlots((current) => {
      if (!current.has(slotIndex)) return current
      const next = new Set(current)
      next.delete(slotIndex)
      return next
    })
  }, [])

  const scheduleReplacement = useCallback(
    (slotIndex: number) => {
      cancelReplacement(slotIndex)
      if (
        openProject ||
        nextItemIndex.current >= contactItemPool.length
      ) {
        return
      }

      const timer = setTimeout(() => {
        setFadingSlots((current) => new Set(current).add(slotIndex))

        const replaceTimer = setTimeout(() => {
          const nextItem = contactItemPool[nextItemIndex.current]
          if (!nextItem) {
            setFadingSlots((current) => {
              const next = new Set(current)
              next.delete(slotIndex)
              return next
            })
            replacementTimers.current.delete(slotIndex)
            return
          }
          nextItemIndex.current += 1
          setItems((current) => {
            const next = [...current]
            next[slotIndex] = nextItem
            return next
          })
          setFadingSlots((current) => {
            const next = new Set(current)
            next.delete(slotIndex)
            return next
          })
          replacementTimers.current.delete(slotIndex)
        }, 700)

        replacementTimers.current.set(slotIndex, replaceTimer)
      }, 1000)

      replacementTimers.current.set(slotIndex, timer)
    },
    [cancelReplacement, openProject],
  )

  useEffect(
    () => () => {
      replacementTimers.current.forEach(clearTimeout)
      replacementTimers.current.clear()
    },
    [],
  )

  if (items.length === 0) return null

  return (
    <>
      <nav
        className="scattered-photos pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-label="Selected projects"
      >
        {items.map((item, index) => (
          <ScatteredPhoto
            key={`${index}-${item.src}`}
            item={item}
            index={index}
            slot={slots[index % slots.length]}
            fadingOut={fadingSlots.has(index)}
            onOpen={(nextItem, source, trigger) => {
              cancelReplacement(index)
              setOpenProject({ item: nextItem, source, trigger })
            }}
            onInteractionStart={() => cancelReplacement(index)}
            onInteractionEnd={() => scheduleReplacement(index)}
          />
        ))}
      </nav>

      {openProject && selectedFilm && selectedIndex >= 0 && (
        <ContactProjectDialog
          film={selectedFilm}
          index={selectedIndex}
          source={openProject.source}
          onClose={closeProject}
        />
      )}
    </>
  )
}
