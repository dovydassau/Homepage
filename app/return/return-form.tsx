'use client'

import {
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useFormStatus } from 'react-dom'
import { TapeStrip } from 'app/components/tape-strip'
import {
  sendReturnMessage,
  type ReturnMessageState,
} from './actions'

const initialState: ReturnMessageState = { status: 'idle', message: '' }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="group absolute -bottom-4 right-4 z-20 inline-flex h-12 min-w-40 rotate-[4deg] items-center justify-center gap-2 px-5 text-[13px] font-black uppercase tracking-[0.08em] text-white outline-none transition-[rotate,scale,opacity] duration-200 hover:rotate-[2deg] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f2efe4] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60 sm:-right-4"
    >
      <TapeStrip
        aria-hidden
        animate={false}
        color="#184fff"
        className="absolute inset-0 z-0"
      />
      {pending ? (
        <span className="relative z-10 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="relative z-10 h-4 w-4"
          fill="none"
        >
          <path
            d="M2 8h11M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="relative z-10">
        {pending ? 'Sending…' : 'Send message'}
      </span>
    </button>
  )
}

export function ReturnForm({ children }: { children: ReactNode }) {
  const [state, formAction] = useActionState(sendReturnMessage, initialState)
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState<{
    status: 'idle' | 'requesting' | 'shared' | 'unavailable'
    latitude?: number
    longitude?: number
    accuracy?: number
  }>({ status: 'idle' })

  function captureClientContext(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    const setValue = (name: string, value: string) => {
      const field = form.elements.namedItem(name)
      if (field instanceof HTMLInputElement) field.value = value
    }

    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string
          downlink?: number
          rtt?: number
          saveData?: boolean
        }
      }
    ).connection

    setValue(
      'clientTimezone',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )
    setValue('clientLanguages', navigator.languages.join(', '))
    setValue('clientPlatform', navigator.platform || 'Unavailable')
    setValue('clientViewport', `${window.innerWidth} × ${window.innerHeight}`)
    setValue('clientScreen', `${window.screen.width} × ${window.screen.height}`)
    setValue('clientPixelRatio', String(window.devicePixelRatio))
    setValue('clientColorDepth', `${window.screen.colorDepth}-bit`)
    setValue('clientTouchPoints', String(navigator.maxTouchPoints))
    setValue('clientReferrer', document.referrer || 'Direct / unavailable')
    setValue(
      'clientNetwork',
      connection
        ? [
            connection.effectiveType,
            connection.downlink ? `${connection.downlink} Mbps` : '',
            connection.rtt ? `${connection.rtt} ms RTT` : '',
            connection.saveData ? 'data saver' : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Unavailable',
    )
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocation({ status: 'unavailable' })
      return
    }

    setLocation({ status: 'requesting' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocation({
          status: 'shared',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      () => setLocation({ status: 'unavailable' }),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  function toggleLocationSharing() {
    if (location.status === 'shared') {
      setLocation({ status: 'idle' })
      return
    }

    shareLocation()
  }

  return (
    <form
      action={formAction}
      onSubmit={captureClientContext}
      className="contents"
      noValidate
    >
      <div className="grid gap-8 py-7 md:grid-cols-[1fr_1.2fr] md:gap-12 lg:py-9">
        <div>{children}</div>

        {state.status === 'success' ? (
          <div
            role="status"
            className="flex min-h-36 items-center rounded-2xl bg-[#e5f3d8] p-5 text-[15px] leading-relaxed text-[#183414] shadow-[inset_0_0_0_1px_rgba(24,52,20,0.08)]"
          >
            <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#183414] text-[12px] font-bold text-white">
              ✓
            </span>
            {state.message}
          </div>
        ) : (
          <div>
            <label
              htmlFor="return-message"
              className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50"
            >
              Message
            </label>
            <textarea
              id="return-message"
              name="message"
              rows={4}
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message here! "
              className="min-h-36 w-full resize-y rounded-2xl bg-white/55 px-4 py-3.5 text-[16px] leading-relaxed text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-black/35 hover:bg-white/70 focus:bg-white/80 focus:shadow-[inset_0_0_0_1.5px_#184fff,0_0_0_4px_rgba(24,79,255,0.1)]"
            />
            {state.status === 'error' && (
              <p className="mt-2 text-[12px] text-[#184fff]">
                {state.fieldError ?? state.message}
              </p>
            )}
            <div className="mt-2 rounded-xl bg-black/[0.035] p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-black/70">
                    Share my location as of now
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={location.status === 'shared'}
                  aria-label="Share current location with this message"
                  onClick={toggleLocationSharing}
                  disabled={location.status === 'requesting'}
                  className={`relative h-9 w-16 shrink-0 rounded-full border-2 border-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),0_2px_5px_rgba(0,0,0,0.12)] outline-none transition-[background-color,box-shadow,opacity,scale] duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-[#184fff] focus-visible:ring-offset-2 active:scale-[0.96] disabled:opacity-50 ${
                    location.status === 'shared'
                      ? 'bg-[#44d62c]'
                      : 'bg-[#f6d743]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-black/25 bg-white text-[14px] text-black shadow-[0_2px_4px_rgba(0,0,0,0.24)] transition-transform duration-200 ${
                      location.status === 'shared'
                        ? 'translate-x-7'
                        : 'translate-x-0'
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                    >
                      <path
                        d="M8 14s4-4.2 4-8A4 4 0 1 0 4 6c0 3.8 4 8 4 8Z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                      <circle cx="8" cy="6" r="1.25" fill="currentColor" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="return-website">Website</label>
        <input
          id="return-website"
          name="website"
          type="text"
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input name="clientTimezone" type="hidden" />
      <input name="clientLanguages" type="hidden" />
      <input name="clientPlatform" type="hidden" />
      <input name="clientViewport" type="hidden" />
      <input name="clientScreen" type="hidden" />
      <input name="clientPixelRatio" type="hidden" />
      <input name="clientColorDepth" type="hidden" />
      <input name="clientTouchPoints" type="hidden" />
      <input name="clientReferrer" type="hidden" />
      <input name="clientNetwork" type="hidden" />
      <input
        name="preciseLatitude"
        type="hidden"
        value={location.latitude ?? ''}
        readOnly
      />
      <input
        name="preciseLongitude"
        type="hidden"
        value={location.longitude ?? ''}
        readOnly
      />
      <input
        name="preciseAccuracy"
        type="hidden"
        value={location.accuracy ?? ''}
        readOnly
      />

      {state.status !== 'success' && <SubmitButton />}
    </form>
  )
}
