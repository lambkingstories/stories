import { env } from '../config/env.js'

function base(): string {
  return env.PUBLIC_BASE_URL.replace(/\/+$/, '')
}

// Match any "scheme://host[:port]" that precedes an /uploads/ or /audiobooks/ path.
const ABSOLUTE_UPLOAD_URL = /https?:\/\/[^/\s"'<>)]+(\/(?:uploads|audiobooks)\/)/gi
const RELATIVE_UPLOAD_PREFIXES = ['/uploads/', '/audiobooks/']

export function toAbsolute(value: string): string {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  for (const p of RELATIVE_UPLOAD_PREFIXES) {
    if (value.startsWith(p)) return base() + value
  }
  return value
}

export function toRelative(value: string): string {
  if (!value) return value
  return value.replace(ABSOLUTE_UPLOAD_URL, '$1')
}

function absolutizeEmbeddedUrls(html: string): string {
  if (!html) return html
  const b = base()
  return html.replace(/(?<![\w:/])(\/(?:uploads|audiobooks)\/[^\s"'<>)]+)/g, (m) => b + m)
}

function relativizeEmbeddedUrls(html: string): string {
  if (!html) return html
  return html.replace(ABSOLUTE_UPLOAD_URL, '$1')
}

function mapBook<T>(
  book: T,
  mapString: (s: string) => string,
  mapEmbedded: (s: string) => string
): T {
  if (!book || typeof book !== 'object') return book
  const b = book as Record<string, unknown>
  const out: Record<string, unknown> = { ...b }

  // `cover` is a CSS gradient string, not a URL — mapped as a flat string.
  {
    const v = out.cover
    if (typeof v === 'string') out.cover = mapString(v)
  }

  // Localized image assets. Legacy rows store these as plain URL strings;
  // promote to `{ de, en }` on the way out so consumers can rely on the
  // object shape. Empty `en` is fine — the mobile app falls back to `de`.
  for (const k of ['coverImage', 'previewImage', 'contentCoverImage', 'achievementBadge', 'audio']) {
    const v = out[k]
    if (typeof v === 'string') {
      out[k] = { de: mapString(v), en: '' }
    } else if (v && typeof v === 'object') {
      const o = v as { de?: string; en?: string }
      out[k] = {
        ...o,
        de: typeof o.de === 'string' ? mapString(o.de) : (o.de ?? ''),
        en: typeof o.en === 'string' ? mapString(o.en) : (o.en ?? '')
      }
    }
  }

  if (Array.isArray(out.attachments)) {
    out.attachments = (out.attachments as unknown[]).map((a) => {
      // Legacy: plain URL string. Promote to the new download-attachment
      // shape so consumers can render it uniformly.
      if (typeof a === 'string') {
        return { previewImage: '', data: mapString(a), type: 'download' }
      }
      if (a && typeof a === 'object') {
        const o = a as { previewImage?: unknown; data?: unknown; type?: unknown }
        return {
          previewImage: typeof o.previewImage === 'string' ? mapString(o.previewImage) : '',
          data: typeof o.data === 'string' ? mapString(o.data) : '',
          type: o.type === 'coloring' ? 'coloring' : 'download'
        }
      }
      return a
    })
  }

  const loc = out.localizations as {
    de?: { content?: { text?: string; image?: string }[] };
    en?: { content?: { text?: string; image?: string }[] }
  } | undefined
  if (loc && typeof loc === 'object') {
    const rewriteLoc = (l?: { content?: { text?: string; image?: string }[] }) => {
      if (!l || !Array.isArray(l.content)) return l
      return {
        ...l,
        content: l.content.map((p) => ({
          ...p,
          text: typeof p.text === 'string' ? mapEmbedded(p.text) : p.text,
          // the picture of a coloring page
          ...(typeof p.image === 'string' ? { image: mapString(p.image) } : {})
        }))
      }
    }
    out.localizations = { ...loc, de: rewriteLoc(loc.de), en: rewriteLoc(loc.en) }
  }

  return out as T
}

export function absolutizeBook<T>(book: T): T {
  return mapBook(book, toAbsolute, absolutizeEmbeddedUrls)
}

export function absolutizeBooks<T>(books: T[]): T[] {
  return books.map((b) => absolutizeBook(b))
}

export function relativizeBook<T>(book: T): T {
  return mapBook(book, toRelative, relativizeEmbeddedUrls)
}
