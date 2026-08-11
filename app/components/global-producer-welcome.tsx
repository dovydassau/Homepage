'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProducerWelcomeBanner } from '../assistant/producer-welcome-banner'
import {
  useProducerWelcome,
  welcomeStorageKey,
} from './producer-welcome-context'

export function GlobalProducerWelcome() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const welcomeCode = searchParams.get('w')
  const { activeCode, invite, activate, clear } = useProducerWelcome()

  useEffect(() => {
    let nextCode = welcomeCode

    if (!nextCode) {
      try {
        nextCode = window.localStorage.getItem(welcomeStorageKey)
      } catch {
        // Continue without persistence when storage is unavailable.
      }
    }

    if (!nextCode || nextCode === activeCode) return
    activate(nextCode)
  }, [activate, activeCode, welcomeCode])

  if (!activeCode) return null

  const hidesWelcome =
    pathname === '/contact' ||
    pathname === '/return' ||
    pathname.startsWith('/return/')
  const isFilmDetail =
    /^\/(?:films|assistant)\/[^/]+\/?$/.test(pathname)

  if (!invite || hidesWelcome) {
    return <ProducerWelcomeBanner key={activeCode} invite={null} />
  }

  return (
    <div
      className={`page-shell w-full pt-3 sm:pt-4 lg:pt-8 ${
        isFilmDetail ? 'hidden lg:block' : ''
      }`}
    >
      <div className="mx-auto max-w-[1400px]">
        <ProducerWelcomeBanner
          key={activeCode}
          invite={invite}
          onClose={clear}
        />
      </div>
    </div>
  )
}
