export type Locale = 'de' | 'en'

export interface BookPage {
  page: number
  title: string
  text: string
}

export interface BookLocalization {
  title: string
  shortDescription: string
  description: string
  contentNotes?: string
  content: BookPage[]
}

export interface BookAudio {
  de?: string
  en?: string
}

export type LocalizedImage = string | BookAudio

export function pickLocalizedImage(
  value: LocalizedImage | undefined,
  locale: 'de' | 'en' = 'de'
): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[locale] || value.de || value.en || ''
}

export function normalizeLocalizedImage(value: LocalizedImage | undefined): BookAudio {
  if (!value) return { de: '', en: '' }
  if (typeof value === 'string') return { de: value, en: '' }
  return { de: value.de ?? '', en: value.en ?? '' }
}

export type BookAttachmentType = 'coloring' | 'download'

export interface BookAttachment {
  previewImage?: string
  data?: string
  type: BookAttachmentType
}

export function normalizeAttachment(value: unknown): BookAttachment {
  if (typeof value === 'string') {
    return { previewImage: '', data: value, type: 'download' }
  }
  if (value && typeof value === 'object') {
    const v = value as { previewImage?: unknown; data?: unknown; type?: unknown }
    return {
      previewImage: typeof v.previewImage === 'string' ? v.previewImage : '',
      data: typeof v.data === 'string' ? v.data : '',
      type: v.type === 'coloring' ? 'coloring' : 'download'
    }
  }
  return { previewImage: '', data: '', type: 'download' }
}

export interface BookDTO {
  bookId: string
  author: string
  category: string
  bookSeriesId: string
  releaseDate: string
  updatedDate?: string
  badges: string[]
  websiteTags: string[]
  websitePrice: string
  cover?: string
  // coverImage is optional now — its DropZone is hidden in BookForm and
  // the server schema doesn't require it. The field stays declared so the
  // store can carry an existing value through edits without dropping it.
  coverImage?: BookAudio
  previewImage: BookAudio
  contentCoverImage?: BookAudio
  achievementBadge?: BookAudio
  etsyLink?: BookAudio
  audio: BookAudio
  attachments: BookAttachment[]
  localizations: Partial<Record<Locale, BookLocalization>>
  isPublished: boolean
}

export interface SeriesDTO {
  seriesId: string
  name: string
  prefix: string
  description?: string
  // Optional 16:9 banner image, uploaded via the SeriesManager dropzone.
  // Empty string / undefined means "not yet set".
  coverImage?: string
  // 1-based display position — lower sorts first, in both the AdminUI chip
  // list and the app's series page. Server-assigned on create.
  sortOrder?: number
}

export interface CategoryDTO {
  name: string
  // Optional square icon image, uploaded via the CategoryManager
  // dropzone. Empty string / undefined means "not yet set".
  icon?: string
}

// Books in this category are filtered out of the public Book app listing.
// The category itself is seeded server-side and cannot be deleted.
export const HIDDEN_CATEGORY = 'NO SHOW'
export const RESERVED_CATEGORIES: readonly string[] = [HIDDEN_CATEGORY]

export function isReservedCategory(name: string): boolean {
  return RESERVED_CATEGORIES.includes(name)
}

/* --- Usage dashboard (/admin/usage) ------------------------------------ */

/** Preset windows offered by the usage dashboard's filter row. */
export type UsageRange = '7' | '30' | '90' | '365' | 'all'

export interface UsageDayDTO {
  /** Local calendar day as `YYYY-MM-DD` (see the report's `timezone`). */
  day: string
  /** How often a book detail page was opened that day. */
  views: number
}

export interface UsageReportDTO {
  range: UsageRange
  /** IANA timezone the daily buckets were cut on, e.g. `Europe/Berlin`. */
  timezone: string
  from: string
  to: string
  /** Zero-filled — one entry per day in [from, to]. */
  days: UsageDayDTO[]
  totals: {
    viewsToday: number
    viewsInRange: number
    viewsAllTime: number
    averagePerDay: number
    peak: UsageDayDTO | null
    firstDay: string | null
  }
}
