import { BookView } from '../models/BookView.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { addDays, dayKey, dayRange } from '../utils/dayKey.js'

export type UsageRange = '7' | '30' | '90' | '365' | 'all'

export interface DailyUsagePoint {
  day: string
  views: number
}

export interface UsageReport {
  range: UsageRange
  timezone: string
  from: string
  to: string
  days: DailyUsagePoint[]
  totals: {
    viewsToday: number
    viewsInRange: number
    viewsAllTime: number
    averagePerDay: number
    peak: DailyUsagePoint | null
    firstDay: string | null
  }
}

const RANGE_DAYS: Record<Exclude<UsageRange, 'all'>, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
  '365': 365
}

async function sumViews(from?: string): Promise<number> {
  const match = from ? [{ $match: { day: { $gte: from } } }] : []
  const rows = await BookView.aggregate<{ views: number }>([
    ...match,
    { $group: { _id: null, views: { $sum: '$views' } } }
  ]).exec()
  return rows[0]?.views ?? 0
}

export const UsageService = {
  today(): string {
    return dayKey(new Date(), env.USAGE_TIMEZONE)
  },

  /**
   * Count one book detail view against today. A bare `$inc` upsert, so
   * concurrent requests can't lose each other's increment the way a
   * read-modify-write would.
   */
  async recordBookView(): Promise<void> {
    const day = this.today()
    try {
      await BookView.updateOne({ day }, { $inc: { views: 1 } }, { upsert: true }).exec()
    } catch (err) {
      // Two requests racing to create the same day's row: one loses the
      // unique index and its increment is lost. That is a single view off a
      // counter, once a day — not worth a retry, and never worth failing the
      // book fetch this hangs off.
      const code = (err as { code?: number }).code
      if (code !== 11000) {
        logger.warn('book view counter failed', { err: (err as Error).message })
      }
    }
  },

  /** Earliest recorded day, or null when nothing has been counted yet. */
  async firstDay(): Promise<string | null> {
    const doc = await BookView.findOne({}, { day: 1 }).sort({ day: 1 }).lean().exec()
    return doc?.day ?? null
  },

  /** Zero-filled daily view series plus headline totals. */
  async report(range: UsageRange): Promise<UsageReport> {
    const to = this.today()
    const first = await this.firstDay()
    const from =
      range === 'all'
        ? (first && first < to ? first : to)
        : addDays(to, -(RANGE_DAYS[range] - 1))

    const [rows, viewsInRange, viewsAllTime] = await Promise.all([
      BookView.find({ day: { $gte: from, $lte: to } }, { day: 1, views: 1 })
        .sort({ day: 1 })
        .lean()
        .exec(),
      sumViews(from),
      sumViews()
    ])

    const byDay = new Map(rows.map((r) => [r.day, r.views]))
    const days: DailyUsagePoint[] = dayRange(from, to).map((day) => ({
      day,
      views: byDay.get(day) ?? 0
    }))

    const peak = days.reduce<DailyUsagePoint | null>(
      (best, d) => (d.views > 0 && (!best || d.views > best.views) ? d : best),
      null
    )
    const sum = days.reduce((acc, d) => acc + d.views, 0)

    return {
      range,
      timezone: env.USAGE_TIMEZONE,
      from,
      to,
      days,
      totals: {
        viewsToday: byDay.get(to) ?? 0,
        viewsInRange,
        viewsAllTime,
        averagePerDay: days.length ? Math.round((sum / days.length) * 10) / 10 : 0,
        peak,
        firstDay: first
      }
    }
  },

  /**
   * Build the unique day index explicitly.
   *
   * `connectDatabase` disables mongoose autoIndex in production, so without
   * this the upsert would run index-less in the only environment where it
   * matters — and the day row would stop being unique.
   */
  async ensureIndexes(): Promise<void> {
    try {
      await BookView.createIndexes()
    } catch (err) {
      logger.warn('failed to create BookView indexes', { err: (err as Error).message })
    }
  }
}
