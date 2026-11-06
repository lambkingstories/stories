import { describe, expect, it } from 'vitest'
import {
  PAINT_HANDOFF_KEY,
  buildDeck,
  clearPaintHandoff,
  loadPaintHandoff,
  paintFitsSnap,
  paintSecondsLeft,
  readActivitySnap,
  readPaintHandoff,
  writePaintHandoff,
  type ActivitySnap
} from '../src/utils/familyActivity'
import { mulberry32 } from '../src/utils/familyCode'

const good = (): ActivitySnap => ({
  teamCount: 3,
  cardsEach: 5,
  seconds: 60,
  kind: 'all',
  modes: ['explain', 'act'],
  teamNames: ['Löwen', '', '', ''],
  deck: buildDeck(['Arche', 'Noah', 'David', 'Goliat', 'Mose', 'Brot'], 6, ['explain', 'act'], mulberry32(5)),
  index: 2,
  scores: [1, 0, 2]
})

describe('activity: keep playing', () => {
  it('takes up a round of the right shape unchanged (cards stay as drawn, points stay)', () => {
    const snap = good()
    const back = readActivitySnap(JSON.parse(JSON.stringify(snap)))
    expect(back).toEqual(snap)
    expect(back?.deck).toEqual(snap.deck)
    expect(back?.scores).toEqual([1, 0, 2])
  })

  it('fills the team names up to four', () => {
    expect(readActivitySnap({ ...good(), teamNames: ['A'] })?.teamNames).toEqual(['A', '', '', ''])
  })

  it('throws away anything of another shape', () => {
    expect(readActivitySnap(null)).toBeNull()
    expect(readActivitySnap('x')).toBeNull()
    expect(readActivitySnap({})).toBeNull()
    expect(readActivitySnap({ ...good(), teamCount: 5 })).toBeNull()
    expect(readActivitySnap({ ...good(), seconds: 45 })).toBeNull()
    expect(readActivitySnap({ ...good(), kind: 'animal' })).toBeNull()
    expect(readActivitySnap({ ...good(), modes: ['sing'] })).toBeNull()
    expect(readActivitySnap({ ...good(), deck: [] })).toBeNull()
    expect(readActivitySnap({ ...good(), deck: [{ word: 'x', mode: 'sing' }] })).toBeNull()
    expect(readActivitySnap({ ...good(), index: 6 })).toBeNull()
    expect(readActivitySnap({ ...good(), index: -1 })).toBeNull()
    expect(readActivitySnap({ ...good(), scores: [1, 2] })).toBeNull()
    expect(readActivitySnap({ ...good(), scores: [1, 2, 'x'] })).toBeNull()
  })
})

describe('activity: painting a word in the painting program', () => {
  const t0 = 1_000_000_000_000
  const h = { word: 'Arche', seconds: 60, startedAt: t0, index: 2 }

  it('counts the sand from the start, not from ticks (a sleeping screen changes nothing)', () => {
    expect(paintSecondsLeft(h, t0)).toBe(60)
    expect(paintSecondsLeft(h, t0 + 1)).toBe(60)
    expect(paintSecondsLeft(h, t0 + 1000)).toBe(59)
    expect(paintSecondsLeft(h, t0 + 59_001)).toBe(1)
    expect(paintSecondsLeft(h, t0 + 60_000)).toBe(0)
    // the screen slept for five minutes: the time is simply over
    expect(paintSecondsLeft(h, t0 + 300_000)).toBe(0)
    // a clock set back never gives more than the full time
    expect(paintSecondsLeft(h, t0 - 30_000)).toBe(60)
  })

  it('takes a hand-over of the right shape (also as text) and throws away the rest', () => {
    expect(readPaintHandoff(h, t0)).toEqual(h)
    expect(readPaintHandoff(JSON.stringify(h), t0 + 5000)).toEqual(h)
    expect(readPaintHandoff(null, t0)).toBeNull()
    expect(readPaintHandoff('{broken', t0)).toBeNull()
    expect(readPaintHandoff({ ...h, word: '  ' }, t0)).toBeNull()
    expect(readPaintHandoff({ ...h, seconds: 45 }, t0)).toBeNull()
    expect(readPaintHandoff({ ...h, startedAt: 'x' }, t0)).toBeNull()
    expect(readPaintHandoff({ ...h, index: -1 }, t0)).toBeNull()
  })

  it('forgets a hand-over that is long over, but not one whose time has just run out', () => {
    expect(readPaintHandoff(h, t0 + 60_000 + 60_000)).toEqual(h)
    expect(readPaintHandoff(h, t0 + 60_000 + 11 * 60_000)).toBeNull()
  })

  it('belongs only to the card of the kept round it was made for', () => {
    const snap = good()
    const card = snap.deck[snap.index]!
    const mine = { word: card.word, seconds: 60, startedAt: t0, index: snap.index }
    expect(paintFitsSnap(mine, snap)).toBe(true)
    expect(paintFitsSnap({ ...mine, index: 3 }, snap)).toBe(false)
    expect(paintFitsSnap({ ...mine, word: 'Etwas anderes' }, snap)).toBe(false)
  })

  it('is kept in the session and goes away when it is cleared', () => {
    clearPaintHandoff()
    expect(loadPaintHandoff()).toBeNull()
    const now = Date.now()
    expect(writePaintHandoff({ ...h, startedAt: now })).toBe(true)
    expect(sessionStorage.getItem(PAINT_HANDOFF_KEY)).toContain('Arche')
    expect(loadPaintHandoff(now + 1000)).toEqual({ ...h, startedAt: now })
    clearPaintHandoff()
    expect(loadPaintHandoff()).toBeNull()
  })
})
