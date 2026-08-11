import type { Metadata } from 'next'
import { PageShell } from 'app/components/page-shell'
import { TapeStrip } from 'app/components/tape-strip'
import { PhoneLink } from './phone-link'
import { ReturnForm } from './return-form'
import { ReturnHeader } from './return-header'

export const metadata: Metadata = {
  title: 'Return an item',
  description: 'How to return found gear to Dovydas Saudys.',
  robots: {
    index: false,
    follow: false,
  },
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
    >
      <path
        d="M3 13 13 3m-7 0h7v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ReturnPage() {
  return (
    <PageShell className="relative isolate overflow-hidden pb-20 pt-8 sm:pt-12 lg:pb-28 lg:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#f6d743]/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-16 -z-10 h-80 w-80 rounded-full bg-[#44d62c]/10 blur-3xl"
      />

      <ReturnHeader />

      <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
        <TapeStrip
          aria-hidden
          animate={false}
          color="#191919"
          className="absolute -left-5 -top-3 z-20 hidden h-11 w-32 -rotate-[7deg] sm:block"
        />
        <article className="relative overflow-visible rounded-[2rem] bg-[#f2efe4] p-5 text-[#171714] shadow-[0_2px_3px_rgba(0,0,0,0.08),0_30px_90px_-45px_rgba(0,0,0,0.48)] sm:p-8 lg:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#171714_0.55px,transparent_0.55px)] [background-size:5px_5px]"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-6 border-b border-dashed border-black/25 pb-6">
              <div>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50">
                  Owner / 01
                </p>
                <h2 className="mt-2 text-balance text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.055em]">
                  Dovydas Saudys
                </h2>
              </div>
              <div
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-black/30"
              >
                <span className="h-4 w-4 rounded-full bg-black/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]" />
              </div>
            </div>

            <ReturnForm>
              <>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
                  Call or email
                </p>
                <div className="mt-3">
                  <PhoneLink />
                </div>
                <a
                  href="mailto:studio@dovydassaudys.com"
                  className="mt-2 inline-flex min-h-11 items-center text-[clamp(1.05rem,2.5vw,1.35rem)] font-medium tracking-[-0.025em] underline decoration-black/25 decoration-1 underline-offset-4 transition-[color,text-decoration-color] hover:text-[#184fff] hover:decoration-[#184fff]"
                >
                  studio@dovydassaudys.com
                </a>
              </>
            </ReturnForm>

            <div
              aria-hidden
              className="flex h-8 items-center gap-[3px] overflow-hidden border-y border-dashed border-black/20"
            >
              {Array.from({ length: 48 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-4 bg-black ${
                    index % 5 === 0 ? 'w-[3px]' : index % 2 === 0 ? 'w-px' : 'w-0.5'
                  }`}
                />
              ))}
              <span className="ml-auto font-[family-name:var(--font-geist-mono)] text-[9px] font-semibold tracking-[0.16em] text-black/45">
                RETURN–DS–2026
              </span>
            </div>
          </div>
        </article>
      </div>

      <section className="mx-auto mt-16 max-w-5xl sm:mt-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
              Drop-off / 02
            </p>
            <h2 className="mt-2 text-balance text-[clamp(2rem,5vw,3.5rem)] font-medium leading-none tracking-[-0.05em] text-[var(--foreground)]">
              or at...
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-3xl bg-[var(--surface-muted)] p-6 shadow-[inset_0_0_0_1px_var(--border),0_20px_50px_-38px_rgba(0,0,0,0.4)] sm:p-7">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Sophienstr.+21%2C+10178+Berlin"
              target="_blank"
              rel="noreferrer"
              className="group/map absolute right-3 top-4 z-10 inline-flex h-10 min-w-28 rotate-[5deg] items-center justify-center gap-1.5 px-3 font-[family-name:var(--font-geist-mono)] text-[10px] font-black uppercase tracking-[0.08em] text-white outline-none transition-[rotate,scale] duration-200 hover:rotate-[2deg] focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-[0.96]"
            >
              <TapeStrip
                aria-hidden
                animate={false}
                color="#184fff"
                className="absolute inset-0 -z-10"
              />
              Open map <ArrowIcon />
            </a>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground-subtle)]">
              Berlin · DE
            </p>
            <h3 className="mt-5 text-[1.4rem] font-medium tracking-[-0.035em] text-[var(--foreground)]">
              Iconoclast Germany GmbH
            </h3>
            <address className="mt-3 text-pretty text-[15px] not-italic leading-relaxed text-[var(--foreground-muted)]">
              Sophienstr. 21
              <br />
              10178 Berlin
              <br />
              c/o Dovydas Saudys
            </address>
          </article>

          <article className="group relative overflow-hidden rounded-3xl bg-[var(--surface-muted)] p-6 shadow-[inset_0_0_0_1px_var(--border),0_20px_50px_-38px_rgba(0,0,0,0.4)] sm:p-7">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Smolensko+10-93%2C+03201+Vilnius%2C+Lithuania"
              target="_blank"
              rel="noreferrer"
              className="group/map absolute right-3 top-4 z-10 inline-flex h-10 min-w-28 rotate-[5deg] items-center justify-center gap-1.5 px-3 font-[family-name:var(--font-geist-mono)] text-[10px] font-black uppercase tracking-[0.08em] text-black outline-none transition-[rotate,scale] duration-200 hover:rotate-[2deg] focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-[0.96]"
            >
              <TapeStrip
                aria-hidden
                animate={false}
                variant="marker"
                color="#44d62c"
                className="absolute inset-0 -z-10"
              />
              Open map <ArrowIcon />
            </a>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground-subtle)]">
              Vilnius · LT
            </p>
            <h3 className="mt-5 text-[1.4rem] font-medium tracking-[-0.035em] text-[var(--foreground)]">
              The Magic UAB
            </h3>
            <address className="mt-3 text-pretty text-[15px] not-italic leading-relaxed text-[var(--foreground-muted)]">
              Dovydas Saudys
              <br />
              Smolensko 10-93
              <br />
              03201 Vilnius, Lithuania
            </address>
          </article>
        </div>
      </section>

      <footer className="mx-auto mt-14 max-w-3xl text-center">
        <p className="text-pretty text-[14px] leading-relaxed text-[var(--foreground-subtle)]">
          Thanks for taking the time. I owe you one.
        </p>
      </footer>
    </PageShell>
  )
}
