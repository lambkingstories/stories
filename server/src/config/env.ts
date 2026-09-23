import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().default('main_db'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),

  ADMIN_USER: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    // Trailing slashes get stripped because the browser's Origin header is
    // bare (`https://example.com`, no `/`) — keeping a `/` in the env value
    // would silently fail the exact-match check in the CORS middleware.
    .transform((v) =>
      v.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean)
    ),

  // Per-client API keys gating the public read endpoints. Format:
  //   CLIENT_KEYS=tauri:abc123,pages:def456,adminui:xyz789
  // Each value pairs a client *name* (used in logs/metrics) with a *key*
  // the matching client ships baked into its build as VITE_CLIENT_KEY.
  // Keys baked into public clients are NOT secret — anyone can extract one
  // by inspecting an APK or the Pages JS bundle. They serve as attribution
  // + a CORS bypass channel (requests carrying a known key skip the strict
  // Origin allowlist), not as an auth boundary. Real DoS protection lives
  // in the per-IP `readLimiter` and at the platform edge.
  // Empty string disables the gate (legacy behaviour) so local dev / tests
  // don't have to provision keys upfront.
  CLIENT_KEYS: z
    .string()
    .default('')
    .transform((v) => {
      const map = new Map<string, string>()
      for (const pair of v.split(',')) {
        const trimmed = pair.trim()
        if (!trimmed) continue
        const idx = trimmed.indexOf(':')
        if (idx <= 0) continue
        const name = trimmed.slice(0, idx).trim()
        const key = trimmed.slice(idx + 1).trim()
        if (!name || !key) continue
        // Indexed by key so the lookup at request time is O(1) on the
        // header value; the value is the human-readable client name.
        map.set(key, name)
      }
      return map
    }),

  // View counting for the /admin/usage dashboard: one row per calendar day
  // holding how often a book detail page was opened. Nothing about the
  // caller is stored — no id, no address, nothing. Set to `false` to stop
  // counting entirely (the dashboard then shows the history so far).
  USAGE_TRACKING_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  // IANA timezone the daily buckets are cut on. Matches the backup job's
  // default so "yesterday" means the same thing in both places.
  USAGE_TIMEZONE: z.string().default('Europe/Berlin'),

  AUDIOBOOKS_DIR: z.string().default('./audiobooks'),
  UPLOADS_DIR: z.string().default('./uploads'),

  HF_HOME: z.string().optional(),
  TRANSLATION_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  TRANSLATION_DTYPE: z.enum(['fp32', 'fp16', 'q8', 'q4']).default('q8'),

  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),

  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Nightly DB backup (emailed as gzipped JSON). Disabled by default so local
  // dev does not try to send mail unless explicitly configured.
  BACKUP_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  BACKUP_CRON: z.string().default('0 2 * * *'),
  BACKUP_TIMEZONE: z.string().default('Europe/Berlin'),
  BACKUP_EMAIL_TO: z.string().default('littlebiblestories.app@gmail.com'),
  BACKUP_EMAIL_FROM: z.string().optional(),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
