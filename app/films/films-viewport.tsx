'use client'

import { useEffect, useRef } from 'react'

export function FilmsViewport({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const main = sectionRef.current?.closest('main')
    const routeContainer = sectionRef.current?.parentElement
    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyHeight: body.style.height,
      mainHeight: main?.style.height ?? '',
      mainMinHeight: main?.style.minHeight ?? '',
      mainOverflow: main?.style.overflow ?? '',
      routeMinHeight: routeContainer?.style.minHeight ?? '',
      routeOverflow: routeContainer?.style.overflow ?? '',
    }

    window.scrollTo(0, 0)
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    body.style.height = '100dvh'

    if (main) {
      main.style.height = '100dvh'
      main.style.minHeight = '0'
      main.style.overflow = 'hidden'
    }
    if (routeContainer) {
      routeContainer.style.minHeight = '0'
      routeContainer.style.overflow = 'hidden'
    }

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overscrollBehavior = previous.htmlOverscroll
      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscroll
      body.style.height = previous.bodyHeight
      if (main) {
        main.style.height = previous.mainHeight
        main.style.minHeight = previous.mainMinHeight
        main.style.overflow = previous.mainOverflow
      }
      if (routeContainer) {
        routeContainer.style.minHeight = previous.routeMinHeight
        routeContainer.style.overflow = previous.routeOverflow
      }
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="page-shell h-full w-full overflow-hidden"
    >
      <div className="mx-auto h-full max-w-[1400px]">{children}</div>
    </section>
  )
}
