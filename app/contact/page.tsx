import type { Metadata } from 'next'
import { ContactForm } from './contact-form'
import { ScatteredPhotos } from './scattered-photos'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with dovydas saudys.',
}

export default function ContactPage() {
  return (
    <section className="contact-stage page-shell relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden pb-8 pt-24 sm:pb-10 sm:pt-28">
      <div aria-hidden className="contact-stage__focus absolute inset-0 z-10" />

      <div className="relative z-20 w-full max-w-[540px] text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
          Berlin · available worldwide
        </p>
        <h1 className="text-balance text-[clamp(2.4rem,7vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--foreground)]">
          Send a letter
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Tell me about your project, the place, the people—or just the first
          spark of an idea.
        </p>

        <div className="mt-7 text-left sm:mt-8">
          <ContactForm />
        </div>
      </div>
      <ScatteredPhotos />
    </section>
  )
}
