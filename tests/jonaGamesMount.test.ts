/**
 * The new games of "Jona" (`bord`, `strand`, `saecke`, `schatten`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { OverboardGame, SacksGame, ShadeGame, ShoreGame } from '@/types/adventure'

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
const box400x300 = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })

// ---------------------------------------------------------------- cargo overboard
describe('Ladung über Bord (overboard)', () => {
  const game: OverboardGame = {
    background: 'images/x/meer.webp',
    ship: 'images/x/schiff.webp',
    shipBox: { x: 50, y: 88, w: 86 },
    deck: { y: 26, h: 24 },
    kinds: [
      { id: 'kiste', image: 'images/x/kiste.webp', w: 12 },
      { id: 'fass', image: 'images/x/fass.webp', w: 10 }
    ],
    rounds: [
      { hint: 'Wirf die Ladung ins Meer.', pieces: [{ kind: 'kiste', x: 30, amp: 8, periodMs: 3000 }, { kind: 'fass', x: 60, amp: 6, periodMs: 2600, phase: 1 }] },
      { hint: 'Noch mehr Wellen.', pieces: [{ kind: 'kiste', x: 25, amp: 8, periodMs: 2400 }, { kind: 'fass', x: 50, amp: 6, periodMs: 2200 }, { kind: 'kiste', x: 75, amp: 6, periodMs: 2000 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Overboard } = await import('@/components/molecules/games/GameOverboard.vue')
    const w = mount(Overboard, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const throwAll = async (w: W, n: number) => {
    for (let i = 0; i < n; i++) await w.findAll('.ob-piece')[i]!.trigger('click')
  }

  it('the goal is every piece of both rounds; round 1 shows two pieces, the ship has not risen', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.ob-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.ob-piece')).toHaveLength(2)
    expect(w.find('.ob-count').text()).toBe('Über Bord: 0 von 2')
  })

  it('a tap on a piece throws it into the sea (a sound, a part of the task, the ship rises); a tap on the empty deck is a mistake with a cross', async () => {
    const w = await open()
    await w.findAll('.ob-piece')[0]!.trigger('click')
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.ob-piece')[0]!.classes()).toContain('gone')
    expect(w.find('.ob-count').text()).toBe('Über Bord: 1 von 2')
    expect(w.find('.ob-rise').attributes('style')).toContain('translateY(-2.5%)')
    // the same piece again does nothing
    await w.findAll('.ob-piece')[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    await w.find('.ob-deck').trigger('click', { clientX: 200, clientY: 100 })
    expect(played).toContain('wrong')
    expect(w.find('.ob-fb').text()).toContain('Hier liegt nichts')
    expect(w.find('.gm.bad').exists()).toBe(true)
  })

  it('the cargo slides to and fro on the deck', async () => {
    const w = await open()
    const first = w.findAll('.ob-piece')[0]!.attributes('style')
    await tick(750)
    expect(w.findAll('.ob-piece')[0]!.attributes('style')).not.toBe(first)
  })

  it('both rounds: all the cargo gone brings the next round, then the end; up to three wrong taps three stars, up to eight two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await w.find('.ob-deck').trigger('click', { clientX: 200, clientY: 100 })
      await throwAll(w, 2)
      expect(played).toContain('star')
      await tick(2300)
      expect(w.find('.ob-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.ob-piece')).toHaveLength(3)
      await throwAll(w, 3)
      await tick(1500)
      expect(useTaskProgress().parts.value).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ob-count').text()).toBe('Overboard: 0 of 2')
    await w.find('.ob-deck').trigger('click', { clientX: 200, clientY: 100 })
    expect(w.find('.ob-fb').text()).toBe('Nothing lies here. Tap the crates and barrels.')
  })
})

// ---------------------------------------------------------------- shells before the wave
describe('Muscheln vor der Welle (shore)', () => {
  const game: ShoreGame = {
    background: 'images/x/strand.webp',
    shells: ['images/x/m1.webp', 'images/x/m2.webp'],
    bucket: 'images/x/eimer.webp',
    foam: 'images/x/schaum.webp',
    rounds: [
      { hint: 'Sammle die Muscheln.', periodMs: 4000, low: 90, high: 50, shells: [{ x: 20, y: 20, kind: 0 }, { x: 60, y: 66, kind: 1 }] },
      { hint: 'Die Welle ist schneller.', periodMs: 3000, low: 90, high: 40, shells: [{ x: 30, y: 25, kind: 1 }, { x: 70, y: 30, kind: 0 }, { x: 50, y: 60, kind: 1 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Shore } = await import('@/components/molecules/games/GameShore.vue')
    const w = mount(Shore, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }

  it('the goal is every shell of both rounds; round 1 lies on the dry beach with two shells', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.sh-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.sh-shell')).toHaveLength(2)
    expect(w.find('.sh-count').text()).toBe('Muscheln: 0 von 2')
  })

  it('a tap on a shell on the dry sand takes it (a sound, a part of the task)', async () => {
    const w = await open()
    await w.findAll('.sh-shell')[0]!.trigger('click')
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.sh-shell')[0]!.classes()).toContain('taken')
    expect(w.find('.sh-count').text()).toBe('Muscheln: 1 von 2')
  })

  it('the wave washes away a shell that is still there: a mistake, the shell comes back higher up, the game goes on', async () => {
    const w = await open()
    await tick(2200 + 2100) // after the lead of 2.2 s the wave is at its highest (50 percent) after half a period; the shell at 66 percent is under water
    expect(played).toContain('wrong')
    expect(w.find('.sh-fb').text()).toContain('Die Welle hat eine Muschel mitgenommen')
    // the shell lies higher up now (above 50 percent), dry, and can be taken
    const style = w.findAll('.sh-shell')[1]!.attributes('style')!
    const top = Number(/top:\s*([\d.]+)%/.exec(style)![1])
    expect(top).toBeLessThan(50)
    await tick(2000) // back at the sea
    await w.findAll('.sh-shell')[1]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('the whole game: both rounds and the end; a shell washed away costs stars only after two losses', async () => {
    useTaskProgress().reset()
    const w = await open()
    for (const s of w.findAll('.sh-shell')) await s.trigger('click')
    expect(played).toContain('star')
    await tick(2300)
    expect(w.find('.sh-round').text()).toContain('Runde 2 von 2')
    for (const s of w.findAll('.sh-shell')) await s.trigger('click')
    await tick(1500)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.sh-count').text()).toBe('Shells: 0 of 2')
  })
})

// ---------------------------------------------------------------- sacks for great and small
describe('Säcke für Groß und Klein (sacks)', () => {
  const fig = (id: string, who: 'child' | 'adult' | 'animal', x: number) => ({ id, who, image: `images/x/${id}.webp`, imageSack: `images/x/${id}-s.webp`, x, y: 70, w: 15 })
  const game: SacksGame = {
    background: 'images/x/strasse.webp',
    sackSmall: 'images/x/klein.webp',
    sackBig: 'images/x/gross.webp',
    rounds: [
      { hint: 'Kleine Säcke für die Kinder.', figures: [fig('kind', 'child', 20), fig('mann', 'adult', 50)] },
      { hint: 'Auch die Tiere.', figures: [fig('kind2', 'child', 20), fig('ochse', 'animal', 50), fig('frau', 'adult', 80)] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Sacks } = await import('@/components/molecules/games/GameSacks.vue')
    const w = mount(Sacks, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Chooses a pile with the keyboard (Enter), then taps the figure. */
  const give = async (w: W, sack: 'small' | 'big', figure: number) => {
    await w.findAll('.sk-sack')[sack === 'small' ? 0 : 1]!.trigger('keydown', { key: 'Enter' })
    await w.findAll('.sk-figure')[figure]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every figure of both rounds; round 1 shows a child and a grown-up and the two piles', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.sk-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.sk-figure')).toHaveLength(2)
    expect(w.findAll('.sk-sack')).toHaveLength(2)
    expect(w.find('.sk-count').text()).toBe('Säcke: 0 von 2')
  })

  it('the right size changes the figure to its picture in the sack; the wrong size is a mistake with a cross and a line that says who needs which', async () => {
    const w = await open()
    await give(w, 'big', 0) // a big sack for the child: wrong
    expect(played).toContain('wrong')
    expect(w.find('.sk-fb').text()).toBe('Die Kinder brauchen kleine Säcke.')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await give(w, 'small', 0)
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.sk-figure')[0]!.classes()).toContain('done')
    expect(w.findAll('.sk-figure')[0]!.find('img').attributes('src')).toContain('kind-s.webp')
    await give(w, 'small', 1) // a small sack for the grown-up: wrong
    expect(w.find('.sk-fb').text()).toBe('Die Großen und die Tiere brauchen große Säcke.')
    // a figure that is dressed does not take another sack
    const parts = useTaskProgress().parts.value
    await give(w, 'small', 0)
    expect(useTaskProgress().parts.value).toBe(parts)
  })

  it('both rounds and the end; up to two wrong sacks three stars, up to five two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await give(w, 'big', 0)
      await give(w, 'small', 0)
      await give(w, 'big', 1)
      expect(played).toContain('star')
      await tick(2300)
      expect(w.find('.sk-round').text()).toContain('Runde 2 von 2')
      await give(w, 'small', 0)
      await give(w, 'big', 1)
      await give(w, 'big', 2)
      await tick(1500)
      expect(useTaskProgress().parts.value).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.sk-count').text()).toBe('Sacks: 0 of 2')
    await give(w, 'big', 0)
    expect(w.find('.sk-fb').text()).toBe('The children need small sacks.')
  })
})

// ---------------------------------------------------------------- keep the shade
describe('Schatten halten (shade)', () => {
  const base = (tolerance: number): ShadeGame => ({
    background: 'images/x/huegel.webp',
    jonah: 'images/x/jona.webp',
    roof: 'images/x/dach.webp',
    sun: 'images/x/sonne.webp',
    jonahBox: { x: 50, y: 66, w: 22 },
    roofW: 32,
    rounds: [
      { hint: 'Zieh das Dach über Jona.', seconds: 1, sunSeconds: 20, tolerance },
      { hint: 'Die Sonne ist schneller.', seconds: 1, sunSeconds: 10, tolerance }
    ]
  })
  const open = async (game: ShadeGame, locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Shade } = await import('@/components/molecules/games/GameShade.vue')
    const w = mount(Shade, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }

  it('the goal is a part for every fifth of a second in the shade, in both rounds', async () => {
    const w = await open(base(100))
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.sd-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.sd-fb').text()).toContain('Jona sitzt im Schatten')
  })

  it('in the sun the heat rises and says so; when it is full Jonah gets a sunstroke (a mistake, the game goes on)', async () => {
    const w = await open(base(1))
    expect(w.find('.sd-fb').text()).toContain('Jona sitzt in der Sonne')
    await tick(2000)
    expect(Number(w.findAll('.sd-track')[0]!.attributes('aria-valuenow'))).toBeGreaterThan(40)
    await tick(2200)
    expect(played).toContain('wrong')
    expect(w.find('.sd-fb').text()).toContain('Sonnenstich')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the arrow keys move the roof; in the shade every fifth of a second counts a part; after the time the round is done', async () => {
    const w = await open(base(100))
    const before = w.find('.sd-roof').attributes('style')
    await w.find('.sd-roof').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('.sd-roof').attributes('style')).not.toBe(before)
    await tick(500)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(2)
    await tick(900)
    expect(played).toContain('star')
    await tick(2300)
    expect(w.find('.sd-round').text()).toContain('Runde 2 von 2')
  })

  it('the whole game: both rounds in the shade, the end with three stars', async () => {
    const w = await open(base(100))
    await tick(1500)
    await tick(2300)
    await tick(1500)
    await tick(1600)
    expect(useTaskProgress().parts.value).toBe(10)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open(base(1), 'en')
    expect(w.find('.sd-fb').text()).toBe('Jonah sits in the sun. Pull the leafy roof over him.')
  })
})
