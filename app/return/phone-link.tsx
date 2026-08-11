'use client'

import { useState } from 'react'

const phoneParts = ['+49', '151', '449', '30', '962']
const phoneNumber = phoneParts.join('')
const displayNumber = phoneParts.join(' ')

export function PhoneLink() {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return (
      <a
        href={`tel:${phoneNumber}`}
        className="group inline-flex min-h-11 items-center gap-2 text-[clamp(1.15rem,3vw,1.5rem)] font-medium tracking-[-0.025em] text-[var(--foreground)] underline decoration-[var(--foreground-subtle)] decoration-1 underline-offset-4 transition-[text-decoration-color,color] hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
      >
        <span className="tabular-nums">{displayNumber}</span>
        <span
          aria-hidden
          className="text-[14px] text-[var(--foreground-subtle)] transition-transform duration-200 group-hover:translate-x-0.5"
        >
          ↗
        </span>
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="min-h-11 rounded-full bg-[var(--surface-muted)] px-4 text-[14px] font-medium text-[var(--foreground)] outline-none transition-[background-color,scale] duration-200 hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-[0.96]"
      aria-label="Reveal phone number"
    >
      Show phone number
    </button>
  )
}
