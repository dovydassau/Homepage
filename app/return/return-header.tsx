'use client'

import { TapeStrip } from 'app/components/tape-strip'
import { useProducerWelcome } from 'app/components/producer-welcome-context'

export function ReturnHeader() {
  const { invite } = useProducerWelcome()

  return (
    <header className="mx-auto max-w-3xl text-center">
      <TapeStrip
        as="span"
        variant="marker"
        color="#f6d743"
        className="inline-flex px-5 py-2 font-[family-name:var(--font-geist-mono)] text-[12px] font-black uppercase tracking-[0.13em] text-black"
      >
        You found one of my things
      </TapeStrip>
      <h1
        aria-live="polite"
        className="mt-7 text-balance text-[clamp(2.7rem,8vw,6rem)] font-medium leading-[0.92] tracking-[-0.06em] text-[var(--foreground)]"
      >
        Thank you for
        <br />
        picking it up{invite ? ` ${invite.name}` : ''}.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-pretty text-[16px] leading-relaxed text-[var(--foreground-muted)] sm:text-[18px]">
        Do the right thing ❤️
      </p>
    </header>
  )
}
