export type WelcomeInvite = {
  name: string
  workedIn: readonly string[]
  validUntil?: number
}

// validUntil is an absolute Unix timestamp in milliseconds.
// /assistant?w=k
const welcomeInvites: Readonly<Record<string, WelcomeInvite>> = {
  kr: {
    name: 'Karin',
    workedIn: ['lufthansa-all-it-takes-is-a-yes'],
    validUntil: Date.UTC(2026, 11),
  },
  pars: {
    name: 'Pars',
    workedIn: [],
  },
  nb: {
    name: 'Nico',
    workedIn: ['telekom-the-teacher', 'serious-klein-up'],
    validUntil: Date.UTC(2026, 11),
  }
}

export function getWelcomeInvite(
  code: string | undefined,
  now = Date.now(),
) {
  if (!code) return null

  const invite = welcomeInvites[code]
  if (!invite) return null

  if (invite.validUntil) {
    if (now > invite.validUntil) {
      return null
    }
  }

  return { ...invite, workedIn: [...invite.workedIn] }
}
