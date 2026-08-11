export type WelcomeInvite = {
  name: string
  workedIn: readonly string[]
  validUntil?: number
}

// validUntil is an absolute Unix timestamp in milliseconds.
// Supported link styles: /assistant?kr and /assistant?with=kr
const welcomeInvites: Readonly<Record<string, WelcomeInvite>> = {
  kr: {
    name: 'Karin',
    workedIn: ['lufthansa-all-it-takes-is-a-yes', 'telekom-the-teacher', 'mercedes-ft-tyla'],
    validUntil: Date.UTC(2026, 11),
  },
  pars: {
    name: 'Pars',
    workedIn: [],
  },
  nb: {
    name: 'Nico',
    workedIn: ['serious-klein-up', 'ssense-x-gucci-balztanz'],
    validUntil: Date.UTC(2026, 11),
  },
  ta: {
    name: 'Tim',
    workedIn: ['zdf-olympia', 'aldi-nord-gute-beats-fur-alle'],
    validUntil: Date.UTC(2026, 11),
  }
}

export function isWelcomeCode(code: string) {
  return Object.hasOwn(welcomeInvites, code)
}

export function findWelcomeCode(codes: readonly string[]) {
  for (const code of codes) {
    if (isWelcomeCode(code)) return code
  }

  return undefined
}

export function getWelcomeInvite(
  code: string | undefined,
  now = Date.now(),
) {
  if (!code || !isWelcomeCode(code)) return null

  const invite = welcomeInvites[code]

  if (invite.validUntil) {
    if (now > invite.validUntil) {
      return null
    }
  }

  return { ...invite, workedIn: [...invite.workedIn] }
}
