const DIRECT_VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i

export function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return DIRECT_VIDEO_EXT.test(parsed.pathname)
  } catch {
    return false
  }
}

export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'www-ccv.adobe.io' || host === 'ccv.adobe.io') {
      if (parsed.pathname.includes('/embed')) {
        return parsed.toString()
      }

      const match = parsed.pathname.match(/\/v1\/player\/ccv\/([^/]+)/)
      if (match?.[1]) {
        parsed.pathname = `/v1/player/ccv/${match[1]}/embed`
        return parsed.toString()
      }

      return null
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) return url
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }

    if (host === 'player.vimeo.com') {
      return url
    }

    return null
  } catch {
    return null
  }
}
