import { Schema, model, type InferSchemaType, type Model } from 'mongoose'
import { BOOK_ID_PATTERN } from '../utils/bookId.js'

const PageSchema = new Schema(
  {
    page: { type: Number, required: true, min: 1 },
    title: { type: String, default: '' },
    // The text of a story page. A coloring page may have none (the picture is the page), see utils/coloring.ts.
    text: { type: String, default: '' },
    // Coloring books: the line art, the Bible passage and the text that belongs to the picture is `text`.
    image: { type: String, default: '' },
    reference: { type: String, default: '', maxlength: 300 }
  },
  { _id: false }
)

// Loose page sub-doc for EN — the EN translation is allowed to lag behind
// the DE source, so a partially-filled page (e.g. title set, body still
// missing) must not block save.
const OptionalPageSchema = new Schema(
  {
    page: { type: Number, required: true, min: 1 },
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    reference: { type: String, default: '', maxlength: 300 }
  },
  { _id: false }
)

const LocalizationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 1000 },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    contentNotes: { type: String, default: '', maxlength: 4000 },
    content: { type: [PageSchema], default: [] }
  },
  { _id: false }
)

const OptionalLocalizationSchema = new Schema(
  {
    title: { type: String, default: '', trim: true, maxlength: 300 },
    shortDescription: { type: String, default: '', trim: true, maxlength: 1000 },
    description: { type: String, default: '', trim: true, maxlength: 8000 },
    contentNotes: { type: String, default: '', maxlength: 4000 },
    content: { type: [OptionalPageSchema], default: [] }
  },
  { _id: false }
)

const AudioSchema = new Schema(
  {
    de: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  { _id: false }
)

const BookSchema = new Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      match: [BOOK_ID_PATTERN, 'bookId must match pattern <prefix>-<volume>-<shortname>']
    },
    author: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    bookSeriesId: { type: String, required: true, trim: true, index: true },
    // 'coloring' = a coloring book (Ausmalbuch): its pages are pictures that open in the coloring program.
    kind: { type: String, enum: ['story', 'coloring'], default: 'story' },
    // Coloring books: how many pictures are free (empty = the rule of the app).
    freePages: { type: Number, min: 0, max: 500, default: null },
    releaseDate: { type: Date, required: true },
    updatedDate: { type: Date, required: true, default: () => new Date() },
    badges: { type: [String], default: [] },
    websiteTags: { type: [String], default: [] },
    websitePrice: { type: String, default: '' },
    cover: { type: String, default: '' },
    // Mixed because older rows store a plain URL string while new rows store
    // `{ de, en }`. The zod validator accepts both shapes and the
    // `bookUrls.absolutize/relativize` helpers normalise on the way out so
    // consumers always see the object form.
    coverImage: { type: Schema.Types.Mixed, default: () => ({ de: '', en: '' }) },
    previewImage: { type: Schema.Types.Mixed, default: () => ({ de: '', en: '' }) },
    contentCoverImage: { type: AudioSchema, default: () => ({}) },
    achievementBadge: { type: AudioSchema, default: () => ({}) },
    etsyLink: { type: AudioSchema, default: () => ({}) },
    audio: { type: AudioSchema, default: () => ({}) },
    // Mixed because legacy rows store plain strings (the original PDF URL)
    // while new rows store `{ previewImage, data, type }`. Normalisation to
    // the new shape happens in `bookUrls.absolutizeBook` on the way out and
    // in the Zod validator on the way in.
    attachments: { type: [Schema.Types.Mixed], default: [] },
    localizations: {
      de: { type: LocalizationSchema, required: true },
      en: { type: OptionalLocalizationSchema, required: false, default: null }
    },
    isPublished: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
)

BookSchema.pre('save', function(next) {
  this.updatedDate = new Date()
  next()
})

BookSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type BookDocument = InferSchemaType<typeof BookSchema>
export const Book: Model<BookDocument> = model<BookDocument>('Book', BookSchema)
