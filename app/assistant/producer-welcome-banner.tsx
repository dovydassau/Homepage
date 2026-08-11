'use client'

import { useEffect, useRef, useState } from 'react'
import { TapeStrip } from '../components/tape-strip'

type ProducerWelcomeBannerProps = {
  code: string
  invite: {
    name: string
    workedIn: readonly string[]
  } | null
  onClose?: () => void
}

type BannerState = 'visible' | 'closing' | 'hidden'

function removeWelcomeCodeFromUrl(code: string) {
  const url = new URL(window.location.href)
  url.searchParams.delete(code)
  if (url.searchParams.get('with') === code) {
    url.searchParams.delete('with')
  }

  const cleanUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', cleanUrl)
}

export function ProducerWelcomeBanner({
  code,
  invite,
  onClose,
}: ProducerWelcomeBannerProps) {
  const [state, setState] = useState<BannerState>('visible')
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    removeWelcomeCodeFromUrl(code)
  }, [code])

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )

  function dismiss() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('hidden')
      onClose?.()
      return
    }

    setState('closing')
    closeTimer.current = setTimeout(() => {
      setState('hidden')
      onClose?.()
    }, 180)
  }

  if (!invite || state === 'hidden') return null

  const sharedProjectCount = invite.workedIn.length
  const hasSharedProjects = sharedProjectCount > 0

  return (
    <TapeStrip
      as="aside"
      variant="gaffer"
      animate={state === 'visible'}
      aria-labelledby="producer-welcome-title"
      aria-live="polite"
      className={`producer-welcome relative mb-7 overflow-hidden text-white sm:mb-9 ${
        state === 'closing' ? 'producer-welcome--closing' : ''
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-x-[8%] top-1/2 z-[1] h-px bg-white/15"
      />

      <div className="relative z-10 grid gap-5 px-7 py-7 pr-16 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-10 sm:py-8 sm:pr-20">
        <div className="max-w-2xl">
          <h1
            id="producer-welcome-title"
            className="text-balance font-[family-name:var(--font-geist-mono)] text-[clamp(2rem,5vw,3.75rem)] font-medium uppercase leading-[0.98] tracking-[-0.06em]"
          >
            Hey {invite.name}, welcome
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white sm:text-[14px]">
            {hasSharedProjects ? (
              <>
                Thanks for taking a look ❤️ I highlighted {sharedProjectCount}{' '}
                {sharedProjectCount === 1 ? 'project' : 'projects'} we worked on
                together. 
              </>
            ) : (
              <>
                I put this selection together to give
                you a quick sense of my camera and assistant work. Thanks for
                taking a look ❤️
              </>
            )}
          </p>
        </div>

        <p className="-rotate-2 font-[family-name:var(--font-geist-mono)] text-[12px] font-medium uppercase tracking-[0.08em] text-white sm:pb-0.5 sm:text-right">
          xx Dovydas 
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white opacity-60 transition-[background-color,opacity,scale] duration-200 hover:bg-black/15 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#184fff] active:scale-[0.96] sm:right-5 sm:top-4"
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
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </TapeStrip>
  )
}
