import type { PaintJob } from '@/types/adventure'
import type { JobStatus } from '@/utils/toolMap'

/** The tasks drawn for a stage are kept (until the stage is entered anew), so "keep painting" and the painting screen see the same ones. */
const jobsKey = (journeyId: string, stageId: number) => `lk-paintjobs:${journeyId}:${stageId}`
const resultKey = (journeyId: string, stageId: number) => `lk-paintresult:${journeyId}:${stageId}`

function readIndices(journeyId: string, stageId: number): number[] | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(jobsKey(journeyId, stageId)) ?? 'null')
    return Array.isArray(v) && v.every((n) => Number.isInteger(n)) ? (v as number[]) : null
  } catch {
    return null
  }
}

/**
 * The tasks of a picture to paint: `count` of the pool, drawn by chance, for different elements (never two tasks for the same zone, which could
 * contradict each other). `redraw` draws anew (the stage was entered anew; never the same set as the last time when there is a choice),
 * otherwise the tasks drawn before stay. Empty when the picture has no tasks.
 */
export function paintJobsOf(
  journeyId: string,
  stageId: number,
  pool: PaintJob[] | undefined,
  count = 3,
  opts: { redraw?: boolean; random?: () => number } = {}
): PaintJob[] {
  if (!pool?.length) return []
  const zones = [...new Set(pool.map((j) => j.zone))]
  const want = Math.min(count, zones.length)
  const stored = readIndices(journeyId, stageId)
  const valid = (idx: number[] | null): idx is number[] =>
    !!idx && idx.length === want && idx.every((i) => i >= 0 && i < pool.length) && new Set(idx.map((i) => pool[i]!.zone)).size === want
  if (valid(stored) && !opts.redraw) return stored.map((i) => pool[i]!)
  const rnd = opts.random ?? Math.random
  const draw = (): number[] => {
    const order = [...zones]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    return order.slice(0, want).map((zone) => {
      const of = pool.map((j, i) => (j.zone === zone ? i : -1)).filter((i) => i >= 0)
      return of[Math.min(of.length - 1, Math.floor(rnd() * of.length))]!
    })
  }
  const same = (a: number[], b: number[]) => [...a].sort().join() === [...b].sort().join()
  let picked = draw()
  for (let tries = 0; tries < 6 && valid(stored) && same(picked, stored); tries++) picked = draw()
  try {
    localStorage.setItem(jobsKey(journeyId, stageId), JSON.stringify(picked))
  } catch {
    // no storage: new ones every time
  }
  return picked.map((i) => pool[i]!)
}

/** What the last "done" found for each task of the stage (in the order of the drawn tasks), for the page that shows the result. */
export function saveJobResults(journeyId: string, stageId: number, results: JobStatus[]) {
  try {
    localStorage.setItem(resultKey(journeyId, stageId), JSON.stringify(results))
  } catch {
    // the result page then shows the tasks without ticks
  }
}

export function readJobResults(journeyId: string, stageId: number): JobStatus[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(resultKey(journeyId, stageId)) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is JobStatus => x === 'met' || x === 'wrong' || x === 'more') : []
  } catch {
    return []
  }
}

/** What the child is told for a task that is not done: the wrong tool or colour, or that there is not enough yet. */
export function jobNoteKey(job: PaintJob, status: JobStatus): string | null {
  if (status === 'met') return null
  if (status === 'more') return 'app.adventure.paintJobMore'
  if (job.tool && job.color) return 'app.adventure.paintWrongBoth'
  return job.tool ? 'app.adventure.paintWrongTool' : 'app.adventure.paintWrongColor'
}
