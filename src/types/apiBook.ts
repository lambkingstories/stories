// Shape returned by the Render API (see server/src/models/Book.ts). URLs are
// absolutized at the API boundary (see server/src/utils/bookUrls.ts) so every
// cover/audio/attachment is a plain https URL by the time it reaches the
// client.

export type Locale = 'de' | 'en'

export interface ApiLocalizedPage {
  page: number
  title: string
  /** The text of a story page. Empty in the slim list (`lean`) and for a coloring page without a text. */
  text: string
  /** Coloring books: the line art of the page. */
  image?: string
  /** Coloring books: the Bible passage of the picture. */
  reference?: string
}

export interface ApiLocalization {
  title: string
  shortDescription: string
  description: string
  contentNotes?: string
  content: ApiLocalizedPage[]
}

export interface ApiLocalizedAsset {
  de?: string
  en?: string
}

// Localized image asset. Server normalises to `{ de, en }` on the way out,
// but legacy responses or older cached payloads might still carry a plain
// URL string — `pickLocalizedImage` handles both forms.
export type ApiLocalizedImage = string | ApiLocalizedAsset

export function pickLocalizedImage(
  value: ApiLocalizedImage | undefined,
  locale: Locale = 'de'
): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[locale] || value.de || value.en || ''
}

export type ApiBookAttachmentType = 'coloring' | 'download'

export interface ApiBookAttachment {
  previewImage?: string
  data?: string
  type: ApiBookAttachmentType
}

export interface ApiBook {
  bookId: string
  author: string
  category: string
  bookSeriesId: string
  /** 'coloring' = Ausmalbuch. Older books have none; `isColoringBook` then looks at the category. */
  kind?: 'story' | 'coloring'
  /** Coloring books: how many pictures are free (missing = the rule of the app). */
  freePages?: number | null
  /** Only in the slim list: the pages carry no story text, the book has to be fetched in full to read it. */
  lean?: boolean
  releaseDate: string
  updatedDate: string
  badges: string[]
  cover?: string
  // coverImage is optional — the admin UI's upload slot is hidden and the
  // server schema no longer requires it. previewImage is the single source
  // of truth for every "cover" surface in the app.
  coverImage?: ApiLocalizedImage
  previewImage: ApiLocalizedImage
  contentCoverImage?: ApiLocalizedAsset
  achievementBadge?: ApiLocalizedAsset
  /** Where the printed book can be bought (the backend calls the field `etsyLink`). */
  etsyLink?: ApiLocalizedAsset
  audio?: ApiLocalizedAsset
  attachments?: ApiBookAttachment[]
  localizations: {
    de: ApiLocalization
    en?: ApiLocalization | null
  }
  isPublished: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiBookListResponse {
  books: ApiBook[]
  cacheHit?: boolean
}

// Public-facing series payload as served by `GET /api/book-series`.
// `coverImage` is the URL of the 16:9 banner uploaded via the AdminUI
// dropzone (empty string when not yet set).
export interface ApiSeries {
  seriesId: string
  name: string
  prefix: string
  description?: string
  coverImage?: string
  // 1-based display position set in the AdminUI — lower comes first. The
  // API already sorts by it; the app re-applies it because its own series
  // tiles are derived by grouping books, not from this list's order.
  sortOrder?: number
}

export interface ApiSeriesListResponse {
  series: ApiSeries[]
}

// Public-facing category payload as served by `GET /api/categories`.
// `icon` is the URL of the small square icon uploaded via the AdminUI
// dropzone (empty string when not yet set).
export interface ApiCategory {
  name: string
  icon?: string
}

export interface ApiCategoryListResponse {
  categories: ApiCategory[]
}

export interface ApiBookResponse {
  book: ApiBook
  cacheHit?: boolean
}
