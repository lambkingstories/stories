/**
 * The three new games of "Jakob" (no game of an earlier journey is repeated there): each is mounted with sample data and used: right moves, the rounds (at most two),
 * the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { move, neighbors, scramble, solvedBoard, type Board } from '@/utils/jakobGames'
import type { CrankGame, HoldGame, SlideGame } from '@/types/adventure'

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: (n: string) => {
      played.push(n)
      return Promise.resolve()
    },
    preload: vi.fn(),
    stopAll: vi.fn(),
    lengthOf: () => 0,
    enabled: { value: true },
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    playedSince: () => true
  })
}))

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
const pointer = (target: EventTarget, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

/** The shortest way back to the finished picture (breadth-first search, fine for 3 x 2): the places of the tiles to slide. */
function solveSteps(start: Board, cols: number): number[] {
  const target = start.map((_, i) => i).join(',')
  const seen = new Map<string, { from: string; place: number } | null>([[start.join(','), null]])
  let frontier: Board[] = [start]
  while (frontier.length) {
    const next: Board[] = []
    for (const b of frontier) {
      if (b.join(',') === target) {
        const steps: number[] = []
        for (let s = seen.get(target); s; ) {
          steps.unshift(s.place)
          s = seen.get(s.from) ?? null
        }
        return steps
      }
      for (const place of neighbors(b, cols)) {
        const m = move(b, cols, place)!
        if (!seen.has(m.join(','))) {
          seen.set(m.join(','), { from: b.join(','), place })
          next.push(m)
        }
      }
    }
    frontier = next
  }
  throw new Error('no way back')
}

// ---------------------------------------------------------------- slide puzzle
describe('Treppe zusammenschieben (slide)', () => {
  const game: SlideGame = {
    image: 'images/x/night.webp',
    rounds: [
      { hint: 'Runde eins: schiebe eine Kachel.', cols: 3, rows: 2, moves: 12, seed: 3 },
      { hint: 'Runde zwei: mehr Kacheln.', cols: 3, rows: 2, moves: 16, seed: 5 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Slide } = await import('@/components/molecules/games/GameSlide.vue')
    const w = mount(Slide, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const tiles = (w: W) => w.findAll('.sl-tile')
  const click = async (w: W, place: number) => {
    await tiles(w)[place]!.trigger('click')
    await flushPromises()
  }
  /** Solve the round on the screen: the places of the tiles are found by a search from the mixed board of the data. */
  const solveRound = async (w: W, r: number) => {
    const g = game.rounds[r]!
    for (const place of solveSteps(scramble(g.cols, g.rows, g.moves, g.seed), g.cols)) await click(w, place)
  }

  it('the goal is every round; the picture is cut into six tiles with one gap; the tiles next to the gap can be slid', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.sl-round').text()).toContain('Runde 1 von 2')
    expect(tiles(w)).toHaveLength(6)
    expect(w.findAll('.sl-tile.gap')).toHaveLength(1)
    const board = scramble(3, 2, 12, 3)
    // the tile at a place shows the part of the picture of its piece: background-position of the piece
    const place0 = board[0]!
    expect(tiles(w)[0]!.attributes('style')).toContain(`${(place0 % 3) * 50}%`)
    expect(w.find('.sl-hint').text()).toContain('schiebe eine Kachel')
    expect(w.find('.sl-count').text()).toBe('Gelöst: 0 von 2')
    const movable = neighbors(board, 3)
    expect(w.findAll('.sl-tile.movable')).toHaveLength(movable.length)
  })

  it('a tile next to the gap slides into it; a tile that is not next to it does nothing (no mistake, no message)', async () => {
    const w = await open()
    const board = scramble(3, 2, 12, 3)
    const far = board.map((_, i) => i).find((i) => !neighbors(board, 3).includes(i) && board[i] !== 5)!
    const before = tiles(w).map((t) => t.attributes('style') ?? '')
    await click(w, far)
    expect(tiles(w).map((t) => t.attributes('style') ?? '')).toEqual(before)
    expect(played).not.toContain('wrong')
    const near = neighbors(board, 3)[0]!
    await click(w, near)
    expect(played).toContain('tap')
    const after = move(board, 3, near)!
    expect(tiles(w).findIndex((t) => t.classes().includes('gap'))).toBe(after.indexOf(5))
  })

  it('the arrow keys slide the tile on the other side of the gap into it', async () => {
    const w = await open()
    const board = scramble(3, 2, 12, 3)
    const gap = board.indexOf(5)
    const col = gap % 3
    const row = Math.floor(gap / 3)
    const key = col < 2 ? 'ArrowLeft' : 'ArrowRight'
    const from = col < 2 ? gap + 1 : gap - 1
    await w.find('.sl-field').trigger('keydown', { key })
    expect(tiles(w).findIndex((t) => t.classes().includes('gap'))).toBe(from)
    // the other way and up or down work, too, when there is a tile there
    await w.find('.sl-field').trigger('keydown', { key: row === 0 ? 'ArrowUp' : 'ArrowDown' })
    expect(w.findAll('.sl-tile.gap')).toHaveLength(1)
  })

  it('"Tip" shows the whole picture for three seconds and is counted', async () => {
    const w = await open()
    expect(w.find('.sl-model').exists()).toBe(false)
    await w.findAll('button').find((b) => b.text() === 'Tipp' && b.classes().some((c) => c.includes('lk-btn')))!.trigger('click')
    expect(w.find('.sl-model').exists()).toBe(true)
    await tick(3100)
    expect(w.find('.sl-model').exists()).toBe(false)
  })

  it('solving the round lights the stairway (a part of the task) and round 2 follows with another mixing; both solved are three stars without a tip', async () => {
    const w = await open()
    await solveRound(w, 0)
    expect(w.find('.sl-grid.solved').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('snap')
    expect(w.find('.sl-fb').text()).toBe('Die Treppe ist wieder ganz!')
    expect(w.find('.sl-count').text()).toBe('Gelöst: 1 von 2')
    // everything is locked while the stairway shines, the last tile fills the gap
    expect(w.findAll('.sl-tile.gap')).toHaveLength(0)
    await tick(1500 + 1400)
    expect(w.find('.sl-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.sl-grid.solved').exists()).toBe(false)
    await solveRound(w, 1)
    await tick(1600)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Die Treppe zum Himmel leuchtet!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('tips cost stars: one tip two stars, three tips one star', async () => {
    for (const [tips, stars] of [[1, 2], [3, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < tips; i++) {
        await w.findAll('button').find((b) => b.text() === 'Tipp')!.trigger('click')
        await tick(3100)
      }
      await solveRound(w, 0)
      await tick(2900)
      await solveRound(w, 1)
      await tick(1600)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${tips} tips`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.sl-count').text()).toBe('Solved: 0 of 2')
    expect(w.findAll('button').some((b) => b.text() === 'Tip')).toBe(true)
    expect(w.find('.sl-tile.gap').attributes('aria-label')).toBe('The free gap')
  })

  it('a finished board really is the solved board (the pieces of the last move fill the gap)', async () => {
    const w = await open()
    await solveRound(w, 0)
    const labels = tiles(w).map((t) => t.attributes('aria-label'))
    expect(labels).toEqual(solvedBoard(3, 2).map((p) => `Kachel ${p + 1}`))
  })
})

// ---------------------------------------------------------------- crank the well
describe('Brunnen kurbeln (crank)', () => {
  const game: CrankGame = {
    background: 'images/x/well.webp',
    crank: 'images/x/crank.webp',
    bucket: 'images/x/bucket.webp',
    troughEmpty: 'images/x/trough-empty.webp',
    troughFull: 'images/x/trough-full.webp',
    crankAt: [70, 50],
    bucketAt: [50, 30, 60],
    troughAt: [26, 76, 26],
    rounds: [
      { hint: 'Runde eins: ein Eimer.', buckets: 1 },
      { hint: 'Runde zwei: drei Eimer.', buckets: 3 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    boxOf100()
    const { default: Crank } = await import('@/components/molecules/games/GameCrank.vue')
    const w = mount(Crank, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** The finger on the crank (its middle is at 50, 50 pixels) circles to `degrees` in steps of 30. */
  const circle = async (w: W, from: number, to: number) => {
    const at = (deg: number) => ({ x: 50 + 40 * Math.cos((deg * Math.PI) / 180), y: 50 + 40 * Math.sin((deg * Math.PI) / 180) })
    const start = at(from)
    pointer(w.find('.cr-crank').element, 'pointerdown', start.x, start.y)
    const n = Math.abs(to - from) / 30
    for (let i = 1; i <= n; i++) {
      const p = at(from + Math.sign(to - from) * 30 * i)
      pointer(window, 'pointermove', p.x, p.y)
    }
    pointer(window, 'pointerup')
    await flushPromises()
  }
  const bucketTop = (w: W) => parseFloat(w.find('.cr-bucket').attributes('style')!.match(/top: ([\d.]+)%/)![1]!)
  const stepButton = (w: W) => w.findAll('button').find((b) => b.text() === 'Kurbeln')!

  it('the goal is every bucket of both rounds; the bucket hangs low in the well, the trough is empty', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.cr-round').text()).toContain('Runde 1 von 2')
    expect(bucketTop(w)).toBe(60)
    expect(w.find('.cr-water').attributes('style')).toContain('opacity: 0')
    expect(w.find('.cr-count').text()).toBe('Eimer: 0 von 1')
    expect(w.find('.cr-trough').attributes('aria-label')).toBe('Der Trog: 0 von 1 Eimern')
  })

  it('a finger that circles turns the crank and the bucket rises; turning back lets it down again', async () => {
    const w = await open()
    await circle(w, 0, 360)
    // one turn of three: a third of the way up (60 - 30 / 3 = 50)
    expect(bucketTop(w)).toBeCloseTo(50, 1)
    expect(parseFloat(w.find('.cr-crank img').attributes('style')!.match(/rotate\(([\d.]+)deg\)/)![1]!)).toBeCloseTo(360, 3)
    await circle(w, 360, 180)
    expect(bucketTop(w)).toBeCloseTo(55, 1)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).not.toContain('wrong')
  })

  it('three turns fill the bucket: it tips into the trough (a part of the task) and round 2 follows', async () => {
    const w = await open()
    await circle(w, 0, 1080)
    expect(w.find('.cr-bucket.pouring').exists()).toBe(true)
    expect(w.find('.cr-fb').text()).toContain('Das Wasser fließt in den Trog')
    await tick(950)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toEqual(expect.arrayContaining(['sack', 'snap']))
    expect(w.find('.cr-water').attributes('style')).toContain('opacity: 1')
    await tick(1500)
    expect(w.find('.cr-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.cr-count').text()).toBe('Eimer: 0 von 3')
    expect(bucketTop(w)).toBe(60)
  })

  it('without circling: eight taps on the button fill a bucket; Enter on the crank turns a step, a tap with a finger does not', async () => {
    const w = await open()
    await w.find('.cr-crank').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    expect(bucketTop(w)).toBe(60)
    await w.find('.cr-crank').trigger('click')
    expect(bucketTop(w)).toBeLessThan(60)
    for (let i = 0; i < 6; i++) await stepButton(w).trigger('click')
    expect(w.find('.cr-bucket.pouring').exists()).toBe(false)
    await stepButton(w).trigger('click')
    expect(w.find('.cr-bucket.pouring').exists()).toBe(true)
  })

  it('all four buckets: three stars at the end (there is no mistake in this game); the trough fills bit by bit in round 2', async () => {
    const w = await open()
    for (let i = 0; i < 8; i++) await stepButton(w).trigger('click')
    await tick(950 + 1500)
    for (let b = 0; b < 3; b++) {
      for (let i = 0; i < 8; i++) await stepButton(w).trigger('click')
      await tick(950)
      if (b < 2) expect(parseFloat(w.find('.cr-water').attributes('style')!.match(/opacity: ([\d.]+)/)![1]!)).toBeCloseTo((b + 1) / 3, 2)
    }
    await tick(1000)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Alle Schafe haben getrunken!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cr-count').text()).toBe('Buckets: 0 of 1')
    expect(w.findAll('button').some((b) => b.text() === 'Crank')).toBe(true)
  })
})

// ---------------------------------------------------------------- hold the morning light
describe('Morgenrot halten (hold)', () => {
  const game: HoldGame = {
    background: 'images/x/river.webp',
    spark: 'images/x/spark.webp',
    start: [50, 70],
    rounds: [
      { hint: 'Runde eins: halte das Licht.', seconds: 1 },
      { hint: 'Runde zwei: geh mit.', seconds: 1.5, path: [[20, 70], [60, 70]] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    boxOf100()
    const { default: Hold } = await import('@/components/molecules/games/GameHold.vue')
    const w = mount(Hold, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const field = (w: W) => w.find('.hd-field').element
  const sparkAt = (w: W) => {
    const m = w.find('.hd-spark').attributes('style')!.match(/left: ([\d.]+)%; top: ([\d.]+)%/)!
    return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) }
  }
  const percent = (w: W) => parseInt(w.find('.hd-count').text().match(/(\d+) %/)![1]!, 10)

  it('the goal is the whole morning in percent; the light lies where the data says; the night lies over the picture', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(100)
    expect(w.find('.hd-round').text()).toContain('Runde 1 von 2')
    expect(sparkAt(w)).toEqual({ x: 50, y: 70 })
    expect(percent(w)).toBe(0)
    expect(parseFloat(w.find('.hd-night').attributes('style')!.match(/opacity: ([\d.]+)/)![1]!)).toBeCloseTo(0.7, 2)
  })

  it('the morning comes only while the finger is on the light; a finger beside it does nothing (a friendly line, no mistake); letting go changes nothing', async () => {
    const w = await open()
    pointer(field(w), 'pointerdown', 10, 10)
    await tick(500)
    expect(percent(w)).toBe(0)
    expect(w.find('.hd-fb').text()).toContain('Lege den Finger wieder auf das Licht')
    expect(played).not.toContain('wrong')
    pointer(field(w), 'pointermove', 52, 71)
    await tick(500)
    // half of a round of one second: 25 % of the whole
    expect(percent(w)).toBe(25)
    expect(w.find('.hd-spark.held').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(25)
    pointer(field(w), 'pointerup', 52, 71)
    await tick(3000)
    expect(percent(w)).toBe(25)
    // the seconds add up: the finger comes back
    pointer(field(w), 'pointerdown', 50, 70)
    await tick(300)
    expect(percent(w)).toBe(40)
  })

  it('round 1 done (50 %): round 2 begins with the light at the start of its way; it wanders as the morning comes and the finger has to go along', async () => {
    const w = await open()
    pointer(field(w), 'pointerdown', 50, 70)
    await tick(1100)
    expect(percent(w)).toBe(50)
    expect(useTaskProgress().parts.value).toBe(50)
    pointer(field(w), 'pointerup', 50, 70)
    await tick(1500)
    expect(w.find('.hd-round').text()).toContain('Runde 2 von 2')
    expect(sparkAt(w)).toEqual({ x: 20, y: 70 })
    // the finger holds the light at its start: it wanders to the right
    pointer(field(w), 'pointerdown', 20, 70)
    await tick(300)
    const moved = sparkAt(w)
    expect(moved.x).toBeGreaterThan(20)
    // the finger stays where it was: the light has wandered out of reach, the morning stands still
    for (let i = 0; i < 20; i++) await tick(100)
    const stuck = percent(w)
    await tick(1000)
    expect(percent(w)).toBe(stuck)
    expect(percent(w)).toBeLessThan(100)
    expect(played).not.toContain('wrong')
  })

  it('a finger that goes along with the light brings the whole morning: the sun rises, three stars', async () => {
    const w = await open()
    pointer(field(w), 'pointerdown', 50, 70)
    await tick(1100)
    pointer(field(w), 'pointerup', 50, 70)
    await tick(1500)
    pointer(field(w), 'pointerdown', 20, 70)
    for (let i = 0; i < 30 && percent(w) < 100; i++) {
      await tick(100)
      const s = sparkAt(w)
      pointer(field(w), 'pointermove', s.x, s.y)
    }
    expect(percent(w)).toBe(100)
    expect(useTaskProgress().parts.value).toBe(100)
    expect(w.find('.hd-fb').text()).toBe('Die Sonne geht auf!')
    expect(played).toContain('star')
    await tick(1700)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Der Morgen ist da!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('"Tap instead of holding": every tap brings a tenth of the round', async () => {
    const w = await open()
    const tap = () => w.findAll('button').find((b) => b.text() === 'Tippen statt Halten')!
    for (let i = 0; i < 4; i++) await tap().trigger('click')
    expect(percent(w)).toBe(20)
    for (let i = 0; i < 6; i++) await tap().trigger('click')
    expect(percent(w)).toBe(50)
    await tick(1500)
    expect(w.find('.hd-round').text()).toContain('Runde 2 von 2')
    for (let i = 0; i < 10; i++) await tap().trigger('click')
    await tick(1700)
    expect(useTaskProgress().parts.value).toBe(100)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.hd-count').text()).toBe('Morning light: 0 %')
    expect(w.findAll('button').some((b) => b.text() === 'Tap instead of holding')).toBe(true)
    pointer(field(w), 'pointerdown', 10, 10)
    await flushPromises()
    expect(w.find('.hd-fb').text()).toBe('Put your finger on the light again.')
  })
})
