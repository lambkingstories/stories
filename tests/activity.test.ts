import { beforeEach, describe, expect, it } from 'vitest'
import { dayKey, useActivity } from '../src/use/useActivity'

describe('activity diary', () => {
  beforeEach(() => {
    localStorage.clear()
    useActivity().clear()
  })

  it('adds up seconds per section and turns them into minutes', () => {
    const a = useActivity()
    a.addSeconds('read', 90)
    a.addSeconds('paint', 30)
    expect(a.todayMinutes.value).toBe(2)
    expect(a.sectionMinutes(7).read).toBe(2)
    expect(a.sectionMinutes(7).paint).toBe(1)
  })

  it('counts pages, stages and pictures on the day they happened', () => {
    const a = useActivity()
    a.count('pages')
    a.count('pages')
    a.count('stages')
    a.count('pictures')
    const last = a.lastDays(7).at(-1)!
    expect(last.day).toBe(dayKey())
    expect(last).toMatchObject({ pages: 2, stages: 1, pictures: 1 })
  })

  it('returns exactly n days, oldest first, with zeros for quiet days', () => {
    const days = useActivity().lastDays(7)
    expect(days).toHaveLength(7)
    expect(days[0]!.day < days[6]!.day).toBe(true)
    expect(days.every((d) => d.minutes === 0)).toBe(true)
  })

  it('ignores zero and negative seconds', () => {
    const a = useActivity()
    a.addSeconds('read', 0)
    a.addSeconds('read', -5)
    expect(a.todayMinutes.value).toBe(0)
  })
})
