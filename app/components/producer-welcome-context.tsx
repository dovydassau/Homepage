'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getWelcomeInvite,
  type WelcomeInvite,
} from '../assistant/welcome-invites'

type ProducerWelcomeContextValue = {
  activeCode: string | null
  invite: WelcomeInvite | null
  activate: (code: string) => void
  clear: () => void
}

export const welcomeStorageKey = 'portfolio-welcome-code'

const ProducerWelcomeContext =
  createContext<ProducerWelcomeContextValue | null>(null)

export function ProducerWelcomeProvider({
  children,
}: {
  children: ReactNode
}) {
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [invite, setInvite] = useState<WelcomeInvite | null>(null)

  const activate = useCallback((code: string) => {
    const nextInvite = getWelcomeInvite(code)

    setActiveCode(code)
    setInvite(nextInvite)

    try {
      if (nextInvite) {
        window.localStorage.setItem(welcomeStorageKey, code)
      } else {
        window.localStorage.removeItem(welcomeStorageKey)
      }
    } catch {
      // Storage can be unavailable in private or restricted browsing modes.
    }
  }, [])

  const clear = useCallback(() => {
    setActiveCode(null)
    setInvite(null)

    try {
      window.localStorage.removeItem(welcomeStorageKey)
    } catch {
      // The in-memory state is still cleared when storage is unavailable.
    }
  }, [])

  const value = useMemo(
    () => ({ activeCode, invite, activate, clear }),
    [activeCode, activate, clear, invite],
  )

  return (
    <ProducerWelcomeContext.Provider value={value}>
      {children}
    </ProducerWelcomeContext.Provider>
  )
}

export function useProducerWelcome() {
  const context = useContext(ProducerWelcomeContext)

  if (!context) {
    throw new Error(
      'useProducerWelcome must be used inside ProducerWelcomeProvider',
    )
  }

  return context
}
