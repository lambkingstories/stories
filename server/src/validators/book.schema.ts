import { z } from 'zod'
import { BOOK_ID_PATTERN } from '../utils/bookId.js'

// A story page needs its text, a coloring page its picture: `assertPagesValid` in BookService checks that, because it
// depends on the book's `kind`.
const pageSchema = z.object({
  page: z.number().int().min(1, 'page must be a positive integer'),
  title: z.string().max(300).default(''),
  text: z.string().default(''),
  image: z.string().default(''),
  reference: z.string().max(300).default('')
})

const localizationSchema = z.object({
  title: z.string().trim().min(1, 'title must not be empty').max(300),
  shortDescription: z
    .string()
    .trim()
    .min(1, 'shortDescription must not be empty')
    .max(1000, 'shortDescription must be at most 1000 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'description must not be empty')
    .max(8000, 'description must be at most 8000 characters'),
  contentNotes: z
    .string()
    .max(4000, 'contentNotes must be at most 4000 characters')
    .optional()
    .default(''),
  content: z.array(pageSchema).min(1, 'content must contain at least one page')
})

// EN is treated as a translation surface that may be partially or entirely
// missing — the German entry is the source of truth. Every field is allowed
// to be empty so the admin UI can save a DE-only book even if the editor
// already touched the EN tab (which seeds an empty `localizations.en` slot).
const optionalPageSchema = z.object({
  page: z.number().int().min(1, 'page must be a positive integer'),
  title: z.string().max(300).default(''),
  text: z.string().default(''),
  image: z.string().default(''),
  reference: z.string().max(300).default('')
})

const optionalLocalizationSchema = z.object({
  title: z.string().trim().max(300).default(''),
  shortDescription: z
    .string()
    .trim()
    .max(1000, 'shortDescription must be at most 1000 characters')
    .default(''),
  description: z
    .string()
    .trim()
    .max(8000, 'description must be at most 8000 characters')
    .default(''),
  contentNotes: z
    .string()
    .max(4000, 'contentNotes must be at most 4000 characters')
    .optional()
    .default(''),
  content: z.array(optionalPageSchema).default([])
})

const audioSchema = z.object({
  de: z.string().optional().default(''),
  en: z.string().optional().default('')
})

// Localized image. Accepts either a legacy plain URL string (older payloads
// and existing DB rows) or the new `{ de, en }` shape, then normalises to
// the object shape so the rest of the stack only ever sees one form. The
// `requireDe` flavour enforces a non-empty German URL — used for the
// always-present marketing artwork (`coverImage` / `previewImage`).
const localizedImageSchema = z
  .union([
    z.string(),
    z.object({
      de: z.string().optional().default(''),
      en: z.string().optional().default('')
    })
  ])
  .transform((v) => (typeof v === 'string' ? { de: v, en: '' } : { de: v.de ?? '', en: v.en ?? '' }))

function localizedImageRequiringDe(field: string) {
  return localizedImageSchema.refine(
    (v) => Boolean(v.de && v.de.length),
    { message: `${field} is required` }
  )
}

// Attachments can come in three shapes:
//   - the new object form `{ previewImage?, data?, type }`
//   - a legacy plain URL string (older books still in the DB)
// The transform normalises everything to the new shape so the rest of the
// stack only ever sees objects.
const attachmentSchema = z
  .union([
    z
      .object({
        previewImage: z.string().optional().default(''),
        data: z.string().optional().default(''),
        type: z.enum(['coloring', 'download']).default('download')
      })
      .passthrough(),
    z.string()
  ])
  .transform((v) => {
    if (typeof v === 'string') return { previewImage: '', data: v, type: 'download' as const }
    return {
      previewImage: v.previewImage ?? '',
      data: v.data ?? '',
      type: v.type === 'coloring' ? ('coloring' as const) : ('download' as const)
    }
  })

export const createBookSchema = z.object({
  body: z
    .object({
      bookId: z
        .string()
        .regex(BOOK_ID_PATTERN, 'bookId must match pattern <2-letter-prefix>-<volume>-<shortname>'),
      author: z.string().trim().min(1, 'author must not be empty').max(200),
      category: z.string().trim().min(1, 'category must not be empty').max(120),
      bookSeriesId: z.string().trim().min(1, 'bookSeriesId must not be empty'),
      kind: z.enum(['story', 'coloring']).default('story'),
      freePages: z.number().int().min(0).max(500).nullable().default(null),
      releaseDate: z
        .string()
        .datetime({ message: 'releaseDate must be an ISO 8601 datetime string' })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'releaseDate must be YYYY-MM-DD or ISO datetime')),
      badges: z.array(z.string()).default([]),
      websiteTags: z.array(z.string()).default([]),
      websitePrice: z.string().max(120).default(''),
      cover: z.string().optional(),
      // coverImage and contentCoverImage (Buch-Vorderseiten-Titelbild) are
      // currently hidden in the admin UI — every "cover" surface uses
      // previewImage. Kept on the schema as optional so older books with a
      // populated coverImage still validate, and so we can re-enable the
      // upload UI later without a migration. Only previewImage is required.
      coverImage: localizedImageSchema.optional().default({ de: '', en: '' }),
      previewImage: localizedImageRequiringDe('previewImage'),
      contentCoverImage: audioSchema.default({ de: '', en: '' }),
      achievementBadge: audioSchema.default({ de: '', en: '' }),
      etsyLink: audioSchema.default({ de: '', en: '' }),
      audio: audioSchema.default({ de: '', en: '' }),
      attachments: z.array(attachmentSchema).default([]),
      localizations: z.object({
        de: localizationSchema,
        en: optionalLocalizationSchema.optional()
      }),
      isPublished: z.boolean().default(true)
    })
    .strict()
})

export const updateBookSchema = z.object({
  body: createBookSchema.shape.body.partial().extend({
    localizations: z
      .object({
        de: localizationSchema.optional(),
        en: optionalLocalizationSchema.optional()
      })
      .optional()
  }),
  params: z.object({ id: z.string().min(1) })
})

export const bookParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) })
})

export type CreateBookInput = z.infer<typeof createBookSchema>['body']
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body']
