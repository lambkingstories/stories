import { describe, expect, it } from 'vitest'
import { EPOCHS, TIMELINE, groupByEpoch, timelineNumber } from '@/data/adventures/timeline'

describe('the time line of the adventures', () => {
  it('lists the 31 adventures of the plan once each, every one in a known epoch', () => {
    expect(TIMELINE).toHaveLength(31)
    expect(new Set(TIMELINE.map((e) => e.id)).size).toBe(31)
    const epochs = new Set(EPOCHS.map((e) => e.id))
    for (const e of TIMELINE) expect(epochs.has(e.epoch), e.id).toBe(true)
  })

  it('keeps the order of the Bible for the adventures that are built', () => {
    const order = ['adam-eva', 'noah', 'babel', 'abraham', 'jakob', 'josef', 'mose', 'josua', 'gideon', 'rut', 'samuel', 'david', 'elia', 'jona', 'daniel']
    const nr = order.map(timelineNumber)
    expect(nr.every((n) => n > 0)).toBe(true)
    expect([...nr].sort((a, b) => a - b)).toEqual(nr)
  })

  it('every epoch has at least one adventure and the epochs follow the order of the time line', () => {
    const seen = TIMELINE.map((e) => e.epoch).filter((v, i, a) => a.indexOf(v) === i)
    expect(seen).toEqual(EPOCHS.map((e) => e.id))
  })

  it('lays the built adventures over the time line and leaves the rest closed in their place', () => {
    const items = [{ journey: { id: 'josef', title: 'Josef' } }, { journey: { id: 'mose', title: 'Mose' } }]
    const groups = groupByEpoch(items)
    expect(groups).toHaveLength(EPOCHS.length)
    const all = groups.flatMap((g) => g.entries)
    expect(all).toHaveLength(31)
    expect(all.filter((e) => e.item).map((e) => e.id)).toEqual(['josef', 'mose'])
    expect(all.find((e) => e.id === 'josef')!.nr).toBe(timelineNumber('josef'))
    expect(all.find((e) => e.id === 'david')!.item).toBeNull()
  })
})
