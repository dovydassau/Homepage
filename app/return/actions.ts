'use server'

import { Resend } from 'resend'
import { headers } from 'next/headers'

export type ReturnMessageState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldError?: string
}

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'studio@dovydassaudys.com'
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? 'contact@love.dovydassaudys.com'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formValue(formData: FormData, name: string, maxLength = 300) {
  return String(formData.get(name) ?? '').trim().slice(0, maxLength)
}

function decodeHeader(value: string | null) {
  if (!value) return ''

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function validCoordinate(value: string, limit: number) {
  if (!value) return null

  const coordinate = Number(value)
  return Number.isFinite(coordinate) && Math.abs(coordinate) <= limit
    ? coordinate
    : null
}

export async function sendReturnMessage(
  _previousState: ReturnMessageState,
  formData: FormData,
): Promise<ReturnMessageState> {
  const message = String(formData.get('message') ?? '').trim()
  const honeypot = String(formData.get('website') ?? '').trim()

  if (honeypot) {
    return { status: 'success', message: 'Thank you — message received.' }
  }

  if (!message) {
    return {
      status: 'error',
      message: 'Please add a short message.',
      fieldError: 'What did you find, and where is it?',
    }
  }

  if (message.length > 2000) {
    return {
      status: 'error',
      message: 'Please shorten the message a little.',
      fieldError: 'Maximum 2,000 characters.',
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      status: 'error',
      message: 'Messaging is unavailable right now. Please call or email instead.',
    }
  }

  const requestHeaders = await headers()
  const city = decodeHeader(requestHeaders.get('x-vercel-ip-city'))
  const region = decodeHeader(requestHeaders.get('x-vercel-ip-country-region'))
  const postalCode = decodeHeader(
    requestHeaders.get('x-vercel-ip-postal-code'),
  )
  const country = decodeHeader(requestHeaders.get('x-vercel-ip-country'))
  const approximateLatitude = requestHeaders.get('x-vercel-ip-latitude') ?? ''
  const approximateLongitude =
    requestHeaders.get('x-vercel-ip-longitude') ?? ''
  const userAgent = requestHeaders.get('user-agent') ?? ''
  const preciseLatitude = validCoordinate(
    formValue(formData, 'preciseLatitude'),
    90,
  )
  const preciseLongitude = validCoordinate(
    formValue(formData, 'preciseLongitude'),
    180,
  )
  const preciseAccuracyValue = formValue(formData, 'preciseAccuracy')
  const preciseAccuracy = preciseAccuracyValue
    ? Number(preciseAccuracyValue)
    : null

  const contextRows = [
    { label: 'Received', value: new Date().toISOString() },
    {
      label: 'Approx. location',
      value:
        [city, region, postalCode, country].filter(Boolean).join(', ') ||
        'Unavailable',
    },
    {
      label: 'Approx. coordinates',
      value:
        approximateLatitude && approximateLongitude
          ? `${approximateLatitude}, ${approximateLongitude} (network estimate)`
          : 'Unavailable',
    },
    {
      label: 'Precise location',
      value:
        preciseLatitude !== null && preciseLongitude !== null
          ? `${preciseLatitude}, ${preciseLongitude}${
              preciseAccuracy !== null && Number.isFinite(preciseAccuracy)
                ? ` (±${Math.round(preciseAccuracy)} m)`
                : ''
            } · https://www.google.com/maps?q=${preciseLatitude},${preciseLongitude}`
          : 'Not shared',
    },
    {
      label: 'Timezone',
      value: formValue(formData, 'clientTimezone') || 'Unavailable',
    },
    {
      label: 'Languages',
      value:
        formValue(formData, 'clientLanguages') ||
        requestHeaders.get('accept-language') ||
        'Unavailable',
    },
    {
      label: 'Browser / OS',
      value: userAgent || 'Unavailable',
    },
    {
      label: 'Platform',
      value: formValue(formData, 'clientPlatform') || 'Unavailable',
    },
    {
      label: 'Viewport',
      value: formValue(formData, 'clientViewport') || 'Unavailable',
    },
    {
      label: 'Screen',
      value: [
        formValue(formData, 'clientScreen'),
        formValue(formData, 'clientPixelRatio')
          ? `${formValue(formData, 'clientPixelRatio')}× pixel ratio`
          : '',
        formValue(formData, 'clientColorDepth'),
      ]
        .filter(Boolean)
        .join(' · ') || 'Unavailable',
    },
    {
      label: 'Touch points',
      value: formValue(formData, 'clientTouchPoints') || 'Unavailable',
    },
    {
      label: 'Network',
      value: formValue(formData, 'clientNetwork') || 'Unavailable',
    },
    {
      label: 'Referrer',
      value: formValue(formData, 'clientReferrer') || 'Unavailable',
    },
  ]

  const contextText = contextRows
    .map(({ label, value }) => `${label}: ${value}`)
    .join('\n')
  const contextHtml = contextRows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding: 5px 16px 5px 0; color: #666; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
          <td style="padding: 5px 0; vertical-align: top; word-break: break-word;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join('')

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: `Return page <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: 'Someone found an item',
      text: `${message}\n\n---\nReturn page context\n${contextText}`,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.6;">
          <p><strong>Message from the return page:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />
          <p style="margin-bottom: 8px;"><strong>Return page context</strong></p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${contextHtml}
          </table>
        </div>
      `,
    })

    if (error) {
      console.error('[return] Resend error:', error)
      return {
        status: 'error',
        message: 'The message did not send. Please call or email instead.',
      }
    }

    return {
      status: 'success',
      message: 'Thank you.',
    }
  } catch (error) {
    console.error('[return] Unexpected error:', error)
    return {
      status: 'error',
      message: 'The message did not send. Please call or email instead.',
    }
  }
}
