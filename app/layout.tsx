import './global.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import { GlobalProducerWelcome } from './components/global-producer-welcome'
import { ProducerWelcomeProvider } from './components/producer-welcome-context'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl } from './sitemap'
import { films } from './films/films-data'
import type { ProjectSearchItem } from './components/project-search'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Dovydas Saudys',
    template: '%s | Dovydas Saudys',
  },
  description: 'Videographer based in Berlin.',
  openGraph: {
    title: 'Dovydas Saudys',
    description: 'Videographer based in Berlin.',
    url: baseUrl,
    siteName: 'Dovydas Saudys',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

const searchProjects: ProjectSearchItem[] = films.map((film) => ({
  id: film.id,
  category: film.category,
  title: film.title,
  role: film.role,
  type: film.type,
  production: film.production,
  year: film.year,
  searchText: [
    film.title,
    film.role,
    film.type,
    film.production,
    film.year,
    film.description,
    ...film.credits.flatMap((credit) => [credit.label, credit.value]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''),
}))

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cx(GeistSans.variable, GeistMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-geist-sans)] text-[var(--foreground)] antialiased">
        <main className="flex min-h-screen flex-col">
          <Navbar searchProjects={searchProjects} />
          <ProducerWelcomeProvider>
            <Suspense fallback={null}>
              <GlobalProducerWelcome />
            </Suspense>
            <div className="flex-1">{children}</div>
          </ProducerWelcomeProvider>
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  )
}
