'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { TapeStrip } from 'app/components/tape-strip'
import { sendContactEmail, type ContactState } from './actions'

const initialState: ContactState = { status: 'idle', message: '' }

const fieldClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--background)]/90 px-4 text-[15px] text-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_30px_-20px_rgba(0,0,0,0.2)] outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--foreground-subtle)] hover:border-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:bg-[var(--background)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent),0_12px_32px_-20px_rgba(0,0,0,0.25)]'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="tape-snap-control group relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)]/90 px-5 text-[14px] font-medium text-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_30px_-20px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-[border-color,background-color,color,opacity] duration-200 hover:border-transparent hover:text-black focus-visible:border-transparent focus-visible:text-black focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
    >
      <TapeStrip
        aria-hidden
        variant="marker"
        animate="snap"
        className="absolute -inset-[2px] z-0"
      />
      {pending && (
        <span className="relative z-10 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      <span className="relative z-10">{pending ? 'Sending…' : 'Send'}</span>
      {!pending && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="relative z-10"
        >
          <path
            d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState)
  // Controlled so values persist on validation/send failure. React otherwise
  // resets uncontrolled fields after a form action completes.
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  if (state.status === 'success') {
    return (
      <div className="rounded-3xl bg-[var(--background)]/90 p-7 text-center shadow-[0_2px_6px_rgba(0,0,0,0.04),0_24px_70px_-30px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-9">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]">
          ✓
        </span>
        <p className="mt-4 text-[16px] font-medium text-[var(--foreground)]">
          Letter sent
        </p>
        <p className="mt-1 text-[14px] text-[var(--foreground-muted)]">
          {state.message}
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <div>
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${fieldClass} min-h-32 resize-none py-3.5`}
          placeholder="Tell me about your project…"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-[12px] text-[var(--accent)]">
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      <div className="flex gap-2.5">
        <div className="min-w-0 flex-1">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${fieldClass} h-12`}
            placeholder="Email address"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-left text-[12px] text-[var(--accent)]">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
        <SubmitButton />
      </div>

      {/* Honeypot field, hidden from humans. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'error' && !state.fieldErrors && (
        <p className="text-center text-[13px] text-[var(--accent)]">
          {state.message}
        </p>
      )}
    </form>
  )
}
