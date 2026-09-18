import { Schema, model, type InferSchemaType, type Model } from 'mongoose'

/**
 * One row per (anonymous user, calendar day) — the whole storage model of
 * the usage dashboard.
 *
 * `userUuid` is a random UUID the Tauri app (Android / iOS) generates on
 * first launch and keeps in localStorage; it carries no personal data and is
 * never linked to a profile. The web and Electron builds don't send one, so
 * these rows are mobile installs only. Storing one row per user *per day* (rather than a row per
 * request) keeps the collection bounded at ~DAU rows/day and makes "daily
 * active users" a plain count instead of a distinct-scan over a request log.
 */
const UserActivitySchema = new Schema(
  {
    userUuid: { type: String, required: true, trim: true, maxlength: 64 },
    // Local calendar day (`USAGE_TIMEZONE`) as `YYYY-MM-DD` — see utils/dayKey.ts.
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    // Client name resolved from the X-Client-Key map (`tauri`, `pages`, …).
    // Empty when CLIENT_KEYS is unconfigured.
    client: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// The uniqueness that makes a day's row count *be* the DAU number. Also the
// index the upsert path hits on every first-request-of-the-day.
UserActivitySchema.index({ day: 1, userUuid: 1 }, { unique: true })

// ≈ 13 months. The privacy policy promises the rows are deleted after that
// (App Review Guideline 5.1.1(i) requires a stated retention), and MongoDB's
// TTL monitor does the deleting. `UsageService.ensureIndexes()` creates this
// index at startup together with the unique one; `createdAt` is set on the
// upsert by the schema's `timestamps` option.
export const USAGE_RETENTION_DAYS = 396
UserActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: USAGE_RETENTION_DAYS * 24 * 60 * 60 })

UserActivitySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type UserActivityDocument = InferSchemaType<typeof UserActivitySchema>
export const UserActivity: Model<UserActivityDocument> = model<UserActivityDocument>(
  'UserActivity',
  UserActivitySchema
)
