'use server'

import { Resend } from 'resend'

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Partial<Record<'email' | 'message', string>>
}

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'studio@dovydassaudys.com'
// Must be on a domain verified in Resend (e.g. love.dovydassaudys.com).
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? 'contact@love.dovydassaudys.com'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendContactEmail(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  // Honeypot: bots fill hidden fields; humans leave it empty.
  const honeypot = String(formData.get('company') ?? '').trim()

  if (honeypot) {
    return { status: 'success', message: "Thanks — I'll be in touch soon." }
  }

  const fieldErrors: ContactState['fieldErrors'] = {}
  if (!email) {
    fieldErrors.email = 'Please enter your email.'
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Please enter a valid email.'
  }
  if (!message) {
    fieldErrors.message = 'Please enter a message.'
  } else if (message.length < 10) {
    fieldErrors.message = 'Message is a little short.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Please fix the fields below.', fieldErrors }
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      status: 'error',
      message: 'Email is not configured yet. Please try again later.',
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: `Portfolio Contact <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New portfolio message from ${email}`,
      text: `From: ${email}\n\n${message}`,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.6;">
          <p><strong>From:</strong> ${escapeHtml(email)}</p>
          <hr style="border: none; border-top: 1px solid #e4e4e1;" />
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
      `,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      const detail = [error.name, error.message].filter(Boolean).join(': ')
      return {
        status: 'error',
        message: detail
          ? `Send failed — ${detail}`
          : 'Something went wrong sending your message. Please try again.',
      }
    }

    return { status: 'success', message: "Thanks — I'll be in touch soon." }
  } catch (error) {
    console.error('[contact] Unexpected error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return {
      status: 'error',
      message: `Send failed — ${detail}`,
    }
  }
}
