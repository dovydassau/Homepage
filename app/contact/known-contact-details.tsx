'use client'

import { useProducerWelcome } from 'app/components/producer-welcome-context'

const EMAIL = 'dovydassau@gmail.com'
const PHONE_DISPLAY = '+49 15144930962'
const PHONE_LINK = '+4915144930962'

export function KnownContactDetails() {
  const { invite } = useProducerWelcome()

  if (!invite) return null

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] font-medium text-[var(--foreground-muted)]">
        <a
          href={`mailto:${EMAIL}`}
          className="rounded-sm transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          {EMAIL}
        </a>
        <a
          href={`tel:${PHONE_LINK}`}
          className="rounded-sm tabular-nums transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          {PHONE_DISPLAY}
        </a>
      </div>
      <div
        aria-hidden
        className="mx-auto my-5 h-px w-12 bg-[var(--border)]"
      />
    </div>
  )
}
