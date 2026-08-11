'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { sendContactEmail, type ContactState } from './actions'

const initialState: ContactState = { status: 'idle', message: '' }

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)]'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-[14px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--background)] border-t-transparent" />
      )}
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState)
  // Controlled so values persist on validation/send failure. React otherwise
  // resets uncontrolled fields after a form action completes.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:p-8">
        <p className="text-[15px] font-medium text-[var(--foreground)]">
          Message sent
        </p>
        <p className="mt-1.5 text-[14px] text-[var(--foreground-muted)]">
          {state.message}
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="name"
          className="text-[13px] font-medium text-[var(--foreground-muted)]"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
          placeholder="Your name"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-[12px] text-[var(--accent)]">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="text-[13px] font-medium text-[var(--foreground-muted)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
          placeholder="you@email.com"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-[12px] text-[var(--accent)]">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-[13px] font-medium text-[var(--foreground-muted)]"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${fieldClass} resize-y`}
          placeholder="Tell me about your project…"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-[12px] text-[var(--accent)]">
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot field, hidden from humans. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <SubmitButton />
        {state.status === 'error' && !state.fieldErrors && (
          <p className="text-[13px] text-[var(--accent)]">{state.message}</p>
        )}
      </div>
    </form>
  )
}
