import type { CSSProperties } from 'react'
import { getContactShowcaseImages } from 'app/films/films-data'

type Slot = {
  className: string
  rotate: number
  duration: string
}

// Frames stay at the perimeter, leaving the form as the visual focal point.
const slots: Slot[] = [
  {
    className: '-left-14 -top-10 w-40 sm:-left-10 sm:w-56 lg:w-72',
    rotate: -8,
    duration: '26s',
  },
  {
    className: '-left-16 top-[42%] hidden w-44 sm:block lg:w-60',
    rotate: 6,
    duration: '31s',
  },
  {
    className: '-top-14 right-[4%] w-36 sm:right-[8%] sm:w-52 lg:w-64',
    rotate: 7,
    duration: '28s',
  },
  {
    className: '-right-16 top-[32%] w-40 sm:w-52 lg:w-64',
    rotate: -7,
    duration: '24s',
  },
  {
    className: '-bottom-16 -left-8 w-44 sm:left-[4%] sm:w-56 lg:w-72',
    rotate: 8,
    duration: '30s',
  },
  {
    className: '-bottom-14 right-[1%] w-40 sm:w-56 lg:w-72',
    rotate: -6,
    duration: '27s',
  },
  {
    className: '-bottom-24 left-[30%] hidden w-48 lg:block',
    rotate: 4,
    duration: '29s',
  },
  {
    className: '-top-24 left-[31%] hidden w-44 lg:block',
    rotate: -5,
    duration: '25s',
  },
]

export function ScatteredPhotos() {
  const images = getContactShowcaseImages(slots.length)

  if (images.length === 0) return null

  return (
    <div
      className="scattered-photos pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {images.map((src, index) => {
        const slot = slots[index % slots.length]
        const frameStyle = {
          animationDelay: `${index * 120}ms`,
          '--tile-rotate': `${slot.rotate}deg`,
        } as CSSProperties

        return (
          <div
            key={src}
            className={`scattered-photos__frame pointer-events-auto absolute aspect-[4/5] cursor-default overflow-hidden rounded-xl bg-[var(--surface-muted)] shadow-[0_2px_5px_rgba(0,0,0,0.08),0_18px_50px_-20px_rgba(0,0,0,0.35)] outline outline-1 outline-black/[0.08] transition-[transform,box-shadow,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:z-30 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1),0_28px_60px_-18px_rgba(0,0,0,0.42)] ${slot.className}`}
            style={frameStyle}
          >
            <img
              src={src}
              alt=""
              loading={index < 3 ? 'eager' : 'lazy'}
              decoding="async"
              className="scattered-photos__img h-full w-full object-cover"
              style={{ animationDuration: slot.duration } as CSSProperties}
            />
          </div>
        )
      })}
    </div>
  )
}
