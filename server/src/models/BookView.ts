import { Schema, model, type InferSchemaType, type Model } from 'mongoose'

/**
 * One row per calendar day holding a plain counter: how often a book detail
 * page asked the API for its book.
 *
 * This replaced a per-install activity log. That log stored a random id per
 * device so the dashboard could chart daily *active users* — anonymous, but
 * still a per-device record, which meant the app had to declare data
 * collection in the App Store privacy answers and promise a retention period.
 * A counter answers the only question the dashboard actually asked ("how busy
 * was the app") while storing nothing about anyone: a day and a number.
 *
 * Because there is nothing personal in here, there is also no TTL — the
 * history is one document per day and costs nothing to keep.
 */
const BookViewSchema = new Schema(
  {
    // Local calendar day (`USAGE_TIMEZONE`) as `YYYY-MM-DD` — see utils/dayKey.ts.
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, unique: true },
    views: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
)

BookViewSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type BookViewDocument = InferSchemaType<typeof BookViewSchema>
export const BookView: Model<BookViewDocument> = model<BookViewDocument>('BookView', BookViewSchema)
