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

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'dovydas saudys',
    template: '%s | dovydas saudys',
  },
  description: 'Videographer based in Berlin.',
  openGraph: {
    title: 'dovydas saudys',
    description: 'Videographer based in Berlin.',
    url: baseUrl,
    siteName: 'dovydas saudys',
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
          <Navbar />
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
