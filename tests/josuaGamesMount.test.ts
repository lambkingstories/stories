/**
 * The new games of "Josua" (`packen`, `verstecken`, `abseilen` (the red rope), `schritt`, `backen`, `still`, and the shared memory with its stand-ins): each is mounted with sample data and used: right and
 * wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { BakeGame, HideGame, HushGame, LowerGame, PackGame, StepGame } from '@/types/adventure'

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


// ---------------------------------------------------------------- the memory with cards that are not painted yet
describe('Memory with cards that are not painted yet', () => {
  it('a card whose picture cannot be loaded is a plain card in its place; the game works the same', async () => {
    const { josua } = await import('@/data/adventures/josua')
    const { default: Memory } = await import('@/components/molecules/games/GameMemory.vue')
    const w = mount(Memory, { ...opts(), props: { game: josua.stages[4]!.task.memory! } })
    await flushPromises()
    expect(w.findAll('.mem-card')).toHaveLength(12)
    expect(w.findAll('img.mem-face')).toHaveLength(24)
    for (const img of w.findAll('img.mem-face')) await img.trigger('error')
    await flushPromises()
    expect(w.findAll('img.mem-face')).toHaveLength(0)
    expect(w.findAll('.mem-stand.mem-front')).toHaveLength(12)
    expect(w.findAll('.mem-stand.back')).toHaveLength(12)
    // two cards of one pair have the same colour
    const colours = w.findAll('.mem-stand.mem-front').map((x) => x.attributes('style'))
    expect(new Set(colours).size).toBe(6)
    await w.findAll('.mem-card')[0]!.trigger('click')
    expect(w.findAll('.mem-card.up')).toHaveLength(1)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- in step
describe('Im Gleichschritt (step)', () => {
  const game: StepGame = {
    background: 'images/x/riverbed.webp',
    bearers: 'images/x/ark.webp',
    print: 'images/x/print.webp',
    path: [[50, 90], [50, 60], [50, 30]],
    rounds: [
      { hint: 'Runde eins.', bpm: 60, steps: 3, tolerance: 0.3 },
      { hint: 'Runde zwei.', bpm: 120, steps: 2, tolerance: 0.25 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Step } = await import('@/components/molecules/games/GameStep.vue')
    const w = mount(Step, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const press = async (w: W) => {
    await w.find('.st-go').trigger('click')
    await flushPromises()
  }
  /** Start the round: from here the first beat is 1.5 seconds away, then one second each (60 a minute). */
  const start = async (w: W) => {
    await press(w)
  }
  const bearerTop = (w: W) => /top: ([\d.]+)%/.exec(w.find('.st-bearers').attributes('style') ?? '')![1]
  /** A whole round of three right steps. */
  const roundOne = async (w: W) => {
    await start(w)
    await tick(1500)
    await press(w)
    await tick(1000)
    await press(w)
    await tick(1000)
    await press(w)
  }
  /** Round 2: two steps at 120 a minute (half a second apart). */
  const roundTwo = async (w: W) => {
    await start(w)
    await tick(1500)
    await press(w)
    await tick(500)
    await press(w)
  }

  it('the goal is every step of both rounds; the footprints lie on the path, the button says "Start", nothing is walked yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.st-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.st-print')).toHaveLength(3)
    expect(w.find('.st-go').text()).toBe('Start')
    expect(w.find('.st-count').text()).toBe('Schritte: 0 von 3')
    expect(w.find('.st-print.next').exists()).toBe(true)
  })

  it('a tap before the first beat is no mistake', async () => {
    const w = await open()
    await start(w)
    expect(w.find('.st-go').text()).toBe('Schritt!')
    await press(w)
    await tick(300)
    await press(w)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a tap on the beat is a step: a tick, a soft tone, the bearers go on, the next footprint is next', async () => {
    const w = await open()
    const before = bearerTop(w)
    await start(w)
    await tick(1500)
    await press(w)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.st-count').text()).toBe('Schritte: 1 von 3')
    expect(w.find('.st-mark').exists()).toBe(true)
    expect(Number(bearerTop(w))).toBeLessThan(Number(before))
    expect(w.findAll('.st-print.done')).toHaveLength(1)
  })

  it('a tap between the beats is a cross, a wobble and a mistake; so is a second tap on the same beat', async () => {
    const w = await open()
    await start(w)
    await tick(2000)
    await press(w)
    expect(played).toContain('wrong')
    expect(w.find('.st-bearers').classes()).toContain('wobble')
    expect(w.find('.st-fb').text()).toContain('Nicht im Takt')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(500)
    played.length = 0
    await press(w)
    expect(played).not.toContain('wrong')
    await press(w)
    expect(played).toContain('wrong')
  })

  it('beats that nobody taps cost nothing: they just go on', async () => {
    const w = await open()
    await start(w)
    await tick(15000)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('after five wrong taps the beat gets more room: a tap that was too far off is in time now', async () => {
    const w = await open()
    await start(w)
    await tick(2000)
    for (let i = 0; i < 5; i++) await press(w)
    expect(w.find('.st-fb').text()).toContain('Ruhiger Takt')
    // 0.4 seconds after a beat: too far for 0.3, in time for 0.45
    await tick(1900)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(0)
    await press(w)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('"Show the beat" shows a bar that fills up to the next beat', async () => {
    const w = await open()
    expect(w.find('.st-bar').exists()).toBe(false)
    await w.findAll('.st-actions button')[1]!.trigger('click')
    expect(w.find('.st-bar').exists()).toBe(true)
    await start(w)
    await tick(2000)
    expect(w.find('.st-bar-fill').attributes('style')).toMatch(/width: (4[5-9]|5[0-5])%/)
  })

  it('three right steps end round 1; round 2 asks for "Start" again with two steps at a quicker beat', async () => {
    const w = await open()
    await roundOne(w)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1800)
    expect(w.find('.st-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.st-go').text()).toBe('Start')
    expect(w.find('.st-count').text()).toBe('Schritte: 0 von 2')
    expect(w.findAll('.st-print')).toHaveLength(2)
  })

  it('the whole game: the end with three stars; the wrong taps give the stars (up to three: three, up to eight: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await start(w)
      await tick(2000)
      // the wrong taps are all on one spot between the beats
      for (let i = 0; i < wrong; i++) await press(w)
      await tick(500)
      await press(w)
      await tick(1000)
      await press(w)
      await tick(1000)
      await press(w)
      await tick(1800)
      await roundTwo(w)
      await tick(1100)
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
    expect(w.find('.st-count').text()).toBe('Steps: 0 of 3')
    expect(w.findAll('.st-actions button')[1]!.text()).toBe('Show the beat')
    await start(w)
    expect(w.find('.st-go').text()).toBe('Step!')
  })
})

// ---------------------------------------------------------------- the red rope
describe('Das rote Seil (lower)', () => {
  const game: LowerGame = {
    background: 'images/x/wall.webp',
    men: [
      { id: 'a', image: 'images/x/a.webp', w: 16 },
      { id: 'b', image: 'images/x/b.webp', w: 16 }
    ],
    guard: 'images/x/wache.webp',
    window: [20.2, 13.5],
    ground: 91,
    road: 94,
    guardSpeed: 12,
    lightRadius: 16,
    warnLead: 24,
    knots: 4,
    rounds: [
      { hint: 'Runde eins.', man: 'a', descentMs: 8000, passes: 1, gapMs: 1500 },
      { hint: 'Runde zwei.', man: 'b', descentMs: 15000, passes: 2, gapMs: 1500 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Lower } = await import('@/components/molecules/games/GameLower.vue')
    const w = mount(Lower, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const press = async (w: W) => {
    await w.find('.lw-field').trigger('pointerdown')
    await flushPromises()
  }
  const lift = async (w: W) => {
    await w.find('.lw-field').trigger('pointerup')
    await flushPromises()
  }
  const dropOf = (w: W) => Number(/height: ([\d.]+)%/.exec(w.find('.lw-line').attributes('style') ?? '')![1])
  const sign = (w: W) => w.find('.lw-sign').text()
  const waiting = (w: W) => w.find('.lw-sign').classes().includes('wait')
  const wrongs = () => played.filter((n) => n === 'wrong').length
  /** The place of the man as a part of the way down (the way down is `room`, not the whole height of the rope). */
  const room = 91 - 13.5 - (16 * (560 / 160)) / (4 / 3)
  const part = (w: W) => (dropOf(w) / 100) * ((91 - 13.5) / room)
  /** Right play: hold when the sign says go, let go when it says wait, until the man is down (the message says so) or the time is up. */
  const playRound = async (w: W, limitMs = 40000) => {
    for (let ms = 0; ms < limitMs; ms += 100) {
      if (w.find('.lw-fb').text() === 'Der Mann ist unten!') break
      if (waiting(w)) await lift(w)
      else await press(w)
      await tick(100)
    }
    await lift(w)
  }

  it('the goal is every man down; the man hangs at the window, the sign says go, no guard walks before the first hold', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.lw-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.lw-hint').text()).toBe('Runde eins.')
    expect(dropOf(w)).toBe(0)
    expect(sign(w)).toBe('▼ Weiter')
    expect(w.find('.lw-guard').exists()).toBe(false)
    expect(w.findAll('.lw-knot')).toHaveLength(4)
    expect(w.find('.lw-sr').attributes('aria-live')).toBe('polite')
    await tick(3000)
    expect(dropOf(w)).toBe(0)
    expect(w.find('.lw-guard').exists()).toBe(false)
  })

  it('holding the rope lets the man down evenly and the guard starts to walk; letting go stops the man, the guard walks on', async () => {
    const w = await open()
    await press(w)
    await tick(1000)
    expect(w.find('.lw-guard').exists()).toBe(true)
    const a = dropOf(w)
    expect(a).toBeGreaterThan(0)
    expect(part(w)).toBeCloseTo(1000 / 8000, 1)
    const x0 = /left: ([\d.]+)%/.exec(w.find('.lw-guard').attributes('style')!)![1]
    await lift(w)
    await tick(1000)
    expect(dropOf(w)).toBe(a)
    const x1 = /left: ([\d.]+)%/.exec(w.find('.lw-guard').attributes('style')!)![1]
    expect(Number(x1)).toBeLessThan(Number(x0) - 5)
    expect(w.find('.lw-go').classes()).not.toContain('on')
  })

  it('the sign says wait about two seconds before the light (4.8 s), with a dashed rope and a spoken note; it says go again when the guard has passed (9.5 s)', async () => {
    const w = await open()
    await press(w)
    await tick(4000)
    await lift(w)
    expect(waiting(w)).toBe(false)
    expect(w.find('.lw-line').classes()).not.toContain('dashed')
    await tick(1000)
    expect(sign(w)).toBe('✋ Warte')
    expect(waiting(w)).toBe(true)
    expect(w.find('.lw-line').classes()).toContain('dashed')
    expect(w.find('.lw-light').classes()).toContain('near')
    expect(w.find('.lw-sr').text()).toBe('Warte, eine Wache kommt.')
    await tick(4700)
    expect(sign(w)).toBe('▼ Weiter')
    expect(w.find('.lw-line').classes()).not.toContain('dashed')
    expect(w.find('.lw-sr').text()).toBe('Jetzt weiter.')
  })

  it('waiting is never a mistake: whoever lets go at "wait" and holds again at "go" is never seen, no cross, no dull sound', async () => {
    const w = await open()
    await press(w)
    await tick(4500)
    await lift(w)
    await tick(5200)
    expect(sign(w)).toBe('▼ Weiter')
    expect(wrongs()).toBe(0)
    expect(w.find('.lw-mark').exists()).toBe(false)
    await press(w)
    await tick(500)
    expect(dropOf(w)).toBeGreaterThan(0)
    expect(wrongs()).toBe(0)
  })

  it('whoever holds when the guard is in the light is seen: a cross, a dull sound, a kind sentence, the man climbs back to the last knot; nothing is lost and the round goes on', async () => {
    const w = await open()
    await press(w)
    await tick(6700)
    // 6.7 s of 8 s: 84 percent of the way, a little before the light
    expect(part(w)).toBeCloseTo(0.84, 1)
    expect(wrongs()).toBe(0)
    await tick(250)
    expect(wrongs()).toBe(1)
    expect(w.find('.lw-fb').text()).toBe('Pst! Die Wache schaut herüber. Er klettert ein Stück zurück.')
    expect(w.find('.lw-mark').exists()).toBe(true)
    expect(part(w)).toBeCloseTo(0.75, 2)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('.lw-round').text()).toContain('Runde 1 von 2')
    await lift(w)
    // the guard has passed: free again, and the man goes on from the knot
    await tick(3000)
    expect(sign(w)).toBe('▼ Weiter')
    await press(w)
    await tick(500)
    expect(part(w)).toBeGreaterThan(0.75)
  })

  it('right play brings the first man down in about 13 seconds: a tick, the number of men down, then round 2 with the other man and two passes of the guard', async () => {
    const w = await open()
    await playRound(w)
    expect(wrongs()).toBe(0)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.lw-fb').text()).toBe('Der Mann ist unten!')
    expect(played).toContain('snap')
    expect(w.find('.lw-field').attributes('aria-label')).toContain('1 von 2 Männern unten')
    await tick(1900)
    expect(w.find('.lw-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.lw-hint').text()).toBe('Runde zwei.')
    expect(dropOf(w)).toBe(0)
    expect(w.find('.lw-guard').exists()).toBe(false)
    expect(sign(w)).toBe('▼ Weiter')
  })

  it('the whole game: both men down, the end with its stars; seen 0 or 1 times three stars, up to three times two, then one', async () => {
    for (const [seen, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      played.length = 0
      useTaskProgress().reset()
      const w = await open()
      if (seen) {
        await press(w)
        for (let i = 0; i < 100 && wrongs() < seen; i++) await tick(100)
        await lift(w)
        expect(wrongs()).toBe(seen)
      }
      await playRound(w)
      await tick(1900)
      await playRound(w)
      await tick(1100)
      expect(useTaskProgress().parts.value, `${seen} seen`).toBe(2)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.find('.gd').text()).toContain('Beide Männer sind sicher unten.')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${seen} seen`).toEqual([[stars]])
      expect(played).toContain('star')
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('for those who cannot hold: a single click on the button lets the rope down until the next click; keys held down do the same; the focus lost lets go', async () => {
    const w = await open()
    await w.find('.lw-go').trigger('click')
    expect(w.find('.lw-go').classes()).toContain('on')
    await tick(1000)
    expect(part(w)).toBeCloseTo(0.125, 1)
    await w.find('.lw-go').trigger('click')
    expect(w.find('.lw-go').classes()).not.toContain('on')
    const a = dropOf(w)
    await tick(500)
    expect(dropOf(w)).toBe(a)
    // a key held down
    await w.find('.lw').trigger('keydown', { key: ' ' })
    await tick(1000)
    expect(dropOf(w)).toBeGreaterThan(a)
    await w.find('.lw').trigger('keyup', { key: ' ' })
    const b = dropOf(w)
    await tick(500)
    expect(dropOf(w)).toBe(b)
    await w.find('.lw').trigger('keydown', { key: 'Enter' })
    await tick(300)
    expect(dropOf(w)).toBeGreaterThan(b)
    // the window loses the focus: let go
    window.dispatchEvent(new Event('blur'))
    await flushPromises()
    const c = dropOf(w)
    await tick(500)
    expect(dropOf(w)).toBe(c)
    expect(w.find('.lw-go').classes()).not.toContain('on')
  })

  it('a switched-on rope that is held while the guard is in the light lets the man be seen and then lets go by itself (the child decides again)', async () => {
    const w = await open()
    await w.find('.lw-go').trigger('click')
    await tick(7000)
    expect(wrongs()).toBe(1)
    expect(w.find('.lw-go').classes()).not.toContain('on')
    await tick(3000)
    expect(wrongs()).toBe(1)
  })

  it('a long stop does not jump: the clock never counts more than a tenth of a second in one tick', async () => {
    const w = await open()
    await press(w)
    await tick(100)
    const a = dropOf(w)
    // the device sleeps for a minute: one tick, not a minute
    vi.setSystemTime(Date.now() + 60000)
    await tick(40)
    expect(dropOf(w)).toBeLessThan(a + 3)
    expect(wrongs()).toBe(0)
    expect(w.find('.gd').exists()).toBe(false)
  })

  it('with reduced motion the guard walks in steps of half a second', async () => {
    const old = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, onchange: null, dispatchEvent: () => false })) as never
    try {
      const w = await open()
      await press(w)
      await tick(100)
      const left = () => /left: ([\d.]+)%/.exec(w.find('.lw-guard').attributes('style')!)![1]
      const first = left()
      await tick(300)
      expect(left()).toBe(first)
      await tick(300)
      expect(Number(left())).toBeLessThan(Number(first))
    } finally {
      window.matchMedia = old
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.lw-go').text()).toBe('Let the rope down (hold)')
    expect(sign(w)).toBe('▼ Go')
    await press(w)
    await tick(5000)
    await lift(w)
    expect(sign(w)).toBe('✋ Wait')
    expect(w.find('.lw-sr').text()).toBe('Wait, a guard is coming.')
    await tick(5000)
    expect(w.find('.lw-sr').text()).toBe('Go on now.')
    expect(w.find('.lw-field').attributes('aria-label')).toBe('The city wall with the red rope: 0 of 2 men are down')
    w.unmount()
    const v = await open('en')
    await press(v)
    await tick(7000)
    expect(v.find('.lw-fb').text()).toBe('Shh! The guard is looking. He climbs back a little.')
  })
})

// ---------------------------------------------------------------- pack the supplies
describe('Proviant packen (pack)', () => {
  const game: PackGame = {
    background: 'images/x/camp.webp',
    basket: 'images/x/basket.webp',
    items: [
      { id: 'sack', image: 'images/x/sack.webp', w: 2, h: 2 },
      { id: 'krug-1', image: 'images/x/krug.webp', w: 1, h: 2 },
      { id: 'krug-2', image: 'images/x/krug.webp', w: 1, h: 2 },
      { id: 'brote', image: 'images/x/brote.webp', w: 2, h: 1 },
      { id: 'datteln', image: 'images/x/datteln.webp', w: 1, h: 1 }
    ],
    area: { x: 26, y: 40, w: 48, h: 46 },
    rounds: [
      { hint: 'Runde eins.', cols: 4, rows: 3, items: ['sack', 'krug-1', 'brote'] },
      { hint: 'Runde zwei.', cols: 4, rows: 3, items: ['sack', 'krug-1', 'krug-2', 'datteln'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Pack } = await import('@/components/molecules/games/GamePack.vue')
    const w = mount(Pack, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose the thing in the tray (a press and a release without moving), then tap the cell. */
  const put = async (w: W, trayIndex: number, col: number, row: number) => {
    const el = w.findAll('.pk-item')[trayIndex]!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find(`[data-drop="cell-${col}-${row}"]`).trigger('click')
    await flushPromises()
  }
  const roundOne = async (w: W) => {
    await put(w, 0, 0, 0)
    await put(w, 0, 2, 0)
    await put(w, 0, 2, 2)
  }
  const roundTwo = async (w: W) => {
    await put(w, 0, 0, 0)
    await put(w, 0, 2, 0)
    await put(w, 0, 3, 0)
    await put(w, 0, 0, 2)
  }

  it('the goal is every thing of both rounds; the basket has 4 x 3 cells, the things wait in the tray', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.find('.pk-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.pk-cell')).toHaveLength(12)
    expect(w.findAll('.pk-item')).toHaveLength(3)
    expect(w.find('.pk-count').text()).toBe('Gepackt: 0 von 3')
  })

  it('a thing put into the basket lies where it was put, with its size in cells; the tray has one less', async () => {
    const w = await open()
    await put(w, 0, 0, 0)
    expect(w.findAll('.pk-thing')).toHaveLength(1)
    const style = w.find('.pk-thing').attributes('style') ?? ''
    expect(style).toContain('left: 0%')
    expect(style).toContain('width: 50%')
    expect(style).toContain('height: 66.666')
    expect(w.findAll('.pk-item')).toHaveLength(2)
    expect(played).toContain('tap')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a thing that fits nowhere near the cell sinks back: a cross, a dull sound, a mistake', async () => {
    const w = await open()
    await put(w, 0, 0, 0)
    played.length = 0
    await put(w, 0, 0, 0)
    expect(played).toContain('wrong')
    expect(w.find('.pk-fb').text()).toContain('passt hier nicht')
    expect(w.findAll('.pk-thing')).toHaveLength(1)
    expect(w.find('.pk-mark').exists()).toBe(true)
  })

  it('a thing that would stick out is moved in; a long thing is turned when it only fits across', async () => {
    const w = await open()
    // the loaves (2 x 1) let go on the last column lie one cell to the left
    await put(w, 2, 3, 0)
    const style = w.find('.pk-thing').attributes('style') ?? ''
    expect(style).toContain('left: 50%')
    expect(style).toContain('width: 50%')
    // the jug (1 x 2) let go on the last row is moved up to fit
    await put(w, 1, 0, 2)
    expect(w.findAll('.pk-thing')).toHaveLength(2)
  })

  it('a tap on a packed thing turns it a quarter when there is room, else it says so', async () => {
    const w = await open()
    await put(w, 1, 2, 0)
    const jug = () => w.find('.pk-thing').attributes('style') ?? ''
    expect(jug()).toContain('width: 25%')
    expect(jug()).toContain('height: 66.666')
    const el = w.find('.pk-thing').element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    expect(jug()).toContain('width: 50%')
    expect(jug()).toContain('height: 33.333')
  })

  it('"Empty the basket" takes everything out again (no mistake)', async () => {
    const w = await open()
    await put(w, 0, 0, 0)
    await w.findAll('.pk-actions button')[1]!.trigger('click')
    expect(w.findAll('.pk-thing')).toHaveLength(0)
    expect(w.findAll('.pk-item')).toHaveLength(3)
    expect(played).not.toContain('wrong')
  })

  it('the tip shows a place for a thing from which the rest can still be packed; it counts as a tip and goes away', async () => {
    const w = await open()
    await w.findAll('.pk-actions button')[0]!.trigger('click')
    expect(w.find('.pk-hintbox').exists()).toBe(true)
    expect(w.find('.pk-fb').text()).toContain('Versuche es hiermit')
    expect(w.findAll('.pk-item.hinted')).toHaveLength(1)
    await tick(3600)
    expect(w.find('.pk-hintbox').exists()).toBe(false)
  })

  it('everything in the basket: it shines with a star; after a while round 2 has four things', async () => {
    const w = await open()
    await roundOne(w)
    expect(w.find('.pk-basket').classes()).toContain('full')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(2100)
    expect(w.find('.pk-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.pk-item')).toHaveLength(4)
    expect(w.findAll('.pk-thing')).toHaveLength(0)
    expect(w.find('.pk-basket').classes()).not.toContain('full')
  })

  it('the whole game: the end with three stars; mistakes and tips together give the stars (up to three: three, up to eight: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await put(w, 0, 0, 0)
      for (let i = 0; i < wrong; i++) await put(w, 0, 0, 0)
      await put(w, 0, 2, 0)
      await put(w, 0, 2, 2)
      await tick(2100)
      await roundTwo(w)
      await tick(1500)
      expect(useTaskProgress().parts.value).toBe(7)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.pk-count').text()).toBe('Packed: 0 of 3')
    expect(w.findAll('.pk-item')[0]!.attributes('aria-label')).toBe('Sack of grain')
    await put(w, 0, 0, 0)
    await put(w, 0, 0, 0)
    expect(w.find('.pk-fb').text()).toBe('That does not fit here.')
  })
})

// ---------------------------------------------------------------- bake flatbreads
describe('Fladen backen (bake)', () => {
  const game: BakeGame = {
    background: 'images/x/fire.webp',
    dough: 'images/x/dough.webp',
    raw: 'images/x/raw.webp',
    golden: 'images/x/golden.webp',
    dark: 'images/x/dark.webp',
    stack: 'images/x/stack.webp',
    stonesAt: [[26, 56], [46, 50], [66, 56]],
    stackAt: [86, 70],
    rounds: [
      { hint: 'Runde eins.', dough: 2, stones: 2, goldenFrom: 2, goldenTo: 5 },
      { hint: 'Runde zwei.', dough: 3, stones: 3, goldenFrom: 1.5, goldenTo: 3 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Bake } = await import('@/components/molecules/games/GameBake.vue')
    const w = mount(Bake, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose a ball of dough (a press and a release without moving), then tap the stone. */
  const bake = async (w: W, stone: number) => {
    const el = w.findAll('.bk-dough')[0]!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find(`[data-drop="stone-${stone}"]`).trigger('click')
    await flushPromises()
  }
  const touch = async (w: W, stone: number) => {
    await w.find(`[data-drop="stone-${stone}"]`).trigger('click')
    await flushPromises()
  }
  const word = (w: W, stone: number) => w.find(`[data-drop="stone-${stone}"] .bk-word`).text()

  it('the goal is every flatbread of both rounds; two stones, two balls of dough, nothing on the stones, an empty stack', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.bk-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.bk-stone')).toHaveLength(2)
    expect(w.findAll('.bk-dough')).toHaveLength(2)
    expect(w.findAll('.bk-bread')).toHaveLength(0)
    expect(w.find('.bk-stack-n').text()).toBe('0')
    expect(w.find('.bk-count').text()).toBe('Fladen gewendet: 0 von 2')
  })

  it('dough on a stone is a raw flatbread; the state stands as a word under it; tapping a raw one only says not yet', async () => {
    const w = await open()
    await bake(w, 0)
    expect(w.findAll('.bk-bread')).toHaveLength(1)
    expect(w.findAll('.bk-dough')).toHaveLength(1)
    expect(word(w, 0)).toBe('noch roh')
    await touch(w, 0)
    expect(w.find('.bk-fb').text()).toContain('Noch roh')
    expect(w.findAll('.bk-bread')).toHaveLength(1)
    expect(played).not.toContain('wrong')
  })

  it('a stone with a flatbread on it takes no more dough', async () => {
    const w = await open()
    await bake(w, 0)
    await bake(w, 0)
    expect(w.find('.bk-fb').text()).toContain('schon ein Fladen')
    expect(w.findAll('.bk-dough')).toHaveLength(1)
  })

  it('golden after two seconds: a tick, the word "fertig"; a tap turns it onto the stack, the stone is free again', async () => {
    const w = await open()
    await bake(w, 0)
    await tick(2200)
    expect(word(w, 0)).toBe('fertig')
    expect(w.find('[data-drop="stone-0"] .gm.good').exists()).toBe(true)
    await touch(w, 0)
    expect(w.findAll('.bk-bread')).toHaveLength(0)
    expect(w.find('.bk-stack-n').text()).toBe('1')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('snap')
    expect(w.findAll('.bk-dough')).toHaveLength(1)
  })

  it('too long on the stone: too dark, a cross, a dull sound, one mistake; the dough comes back; a tap clears the stone', async () => {
    const w = await open()
    await bake(w, 0)
    await tick(5500)
    expect(word(w, 0)).toBe('zu dunkel')
    expect(w.find('[data-drop="stone-0"] .gm.bad').exists()).toBe(true)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
    expect(w.find('.bk-fb').text()).toContain('zu dunkel')
    // it is counted once, and the ball of dough is given back
    await tick(3000)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
    expect(w.findAll('.bk-dough')).toHaveLength(2)
    await touch(w, 0)
    expect(w.findAll('.bk-bread')).toHaveLength(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('both flatbreads turned: round 2 has three stones and three flatbreads', async () => {
    const w = await open()
    await bake(w, 0)
    await bake(w, 1)
    await tick(2500)
    await touch(w, 0)
    await touch(w, 1)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(1900)
    expect(w.find('.bk-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.bk-stone')).toHaveLength(3)
    expect(w.findAll('.bk-dough')).toHaveLength(3)
    expect(w.find('.bk-stack-n').text()).toBe('0')
  })

  it('the whole game: the end with three stars; the too dark flatbreads give the stars (one: three, up to three: two, more: one)', async () => {
    for (const [burnt, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < burnt; i++) {
        await bake(w, 0)
        await tick(5500)
        await touch(w, 0)
      }
      await bake(w, 0)
      await bake(w, 1)
      await tick(2500)
      await touch(w, 0)
      await touch(w, 1)
      await tick(1900)
      await bake(w, 0)
      await bake(w, 1)
      await bake(w, 2)
      await tick(1700)
      await touch(w, 0)
      await touch(w, 1)
      await touch(w, 2)
      await tick(1100)
      expect(useTaskProgress().parts.value).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${burnt} dark`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.bk-count').text()).toBe('Flatbreads turned: 0 of 2')
    await bake(w, 0)
    expect(word(w, 0)).toBe('still raw')
    await tick(2200)
    expect(word(w, 0)).toBe('ready')
  })
})

// ---------------------------------------------------------------- under the flax
describe('Unter dem Flachs verstecken (hide)', () => {
  const bundle = (id: string, image: string, w: number, h: number) => ({ id, image: `images/x/${image}.webp`, w, h })
  const game: HideGame = {
    background: 'images/x/roof.webp',
    messenger: 'images/x/messengers.webp',
    men: [
      { id: 'mann-a', image: 'images/x/a.webp', x: 10, y: 24, w: 30, h: 9.375 },
      { id: 'mann-b', image: 'images/x/b.webp', x: 52, y: 60, w: 30, h: 9.375 }
    ],
    bundles: [bundle('gross-1', 'gross', 30, 10.8), bundle('gross-2', 'gross', 30, 10.8), bundle('gross-3', 'gross', 30, 10.8), bundle('mittel-1', 'mittel', 21.7, 10), bundle('klein-1', 'klein', 15, 9.2)],
    rounds: [
      { hint: 'Runde eins.', men: ['mann-a'], bundles: ['gross-1', 'gross-2', 'klein-1'] },
      { hint: 'Runde zwei.', men: ['mann-a', 'mann-b'], bundles: ['gross-1', 'gross-2', 'gross-3', 'mittel-1', 'klein-1'] }
    ]
  }
  // the roof is 300 x 400 pixels: a unit (a percent of the width) is three pixels in both directions
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 400, right: 300, bottom: 400, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Hide } = await import('@/components/molecules/games/GameHide.vue')
    const w = mount(Hide, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose the bundle at this place of the tray (a press and a release without moving), then tap the roof at the middle (in units). */
  const lay = async (w: W, trayIndex: number, cx: number, cy: number) => {
    const el = w.findAll('.hd-token')[trayIndex]!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find('.hd-roof').trigger('click', { clientX: cx * 3, clientY: cy * 3 })
    await flushPromises()
  }
  /** A percent of the first bundle on the roof, as a number (the sums leave tiny rounding). */
  const pct = (w: W, name: 'left' | 'top' | 'width' | 'height') => Number(new RegExp(name + ': (-?[0-9.e-]+)%').exec(w.find('.hd-bundle').attributes('style') ?? '')![1])
  const look = async (w: W) => {
    await w.find('.hd-look').trigger('click')
    await tick(1400)
  }
  const roundOne = async (w: W) => {
    await lay(w, 0, 25, 37.4)
    await lay(w, 0, 25, 39.1)
  }
  const roundTwo = async (w: W) => {
    await lay(w, 0, 25, 37.4)
    await lay(w, 0, 25, 39.1)
    await lay(w, 0, 67, 85.4)
    await lay(w, 0, 71.15, 87.5)
    await lay(w, 0, 59.5, 87.9)
  }

  it('the goal is every man of both rounds; one man lies on the roof, three bundles wait at the edge', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.hd-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.hd-man')).toHaveLength(1)
    expect(w.findAll('.hd-token')).toHaveLength(3)
    expect(w.find('.hd-count').text()).toBe('Zugedeckt: 0 von 1')
  })

  it('a bundle lies where it was put, with its size (percent of the picture); the tray has one less', async () => {
    const w = await open()
    await lay(w, 0, 25, 37.4)
    expect(pct(w, 'left')).toBeCloseTo(10, 6)
    expect(pct(w, 'top')).toBeCloseTo(24, 6)
    expect(pct(w, 'width')).toBeCloseTo(30, 6)
    expect(pct(w, 'height')).toBeCloseTo(8.1, 6)
    expect(w.findAll('.hd-token')).toHaveLength(2)
    expect(played).toContain('tap')
  })

  it('a bundle let go near the edge is moved in and stays on the roof', async () => {
    const w = await open()
    await lay(w, 0, 99, 5)
    expect(pct(w, 'left')).toBeCloseTo(70, 6)
    expect(pct(w, 'top')).toBeCloseTo(0, 6)
  })

  it('a tap on a bundle on the roof turns it across', async () => {
    const w = await open()
    await lay(w, 0, 50, 70)
    const el = w.find('.hd-bundle').element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 150, clientY: 210 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 150, clientY: 210 }))
    await flushPromises()
    expect(pct(w, 'width')).toBeCloseTo(10.8, 6)
    expect(pct(w, 'height')).toBeCloseTo(22.5, 6)
  })

  it('a bundle can be dragged on the roof; let go outside the roof it goes back to the edge', async () => {
    const w = await open()
    await lay(w, 0, 50, 70)
    const el = w.find('.hd-bundle').element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 150, clientY: 210 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 180, clientY: 240 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 180, clientY: 240 }))
    await flushPromises()
    expect(pct(w, 'left')).toBeCloseTo(45, 6)
    const again = w.find('.hd-bundle').element
    again.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 180, clientY: 240 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 400, clientY: 500 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 400, clientY: 500 }))
    await flushPromises()
    expect(w.findAll('.hd-bundle')).toHaveLength(0)
    expect(w.findAll('.hd-token')).toHaveLength(3)
  })

  it('from the keyboard: Enter on a bundle in the tray puts it over the man; the arrow keys move it, Enter turns it, Delete takes it back', async () => {
    const w = await open()
    await w.findAll('.hd-token')[0]!.trigger('keydown', { key: 'Enter' })
    expect(w.findAll('.hd-bundle')).toHaveLength(1)
    const left = () => pct(w, 'left')
    const before = left()
    await w.find('.hd-bundle').trigger('keydown', { key: 'ArrowRight' })
    expect(left()).toBeCloseTo(before + 2, 6)
    await w.find('.hd-bundle').trigger('keydown', { key: 'Delete' })
    expect(w.findAll('.hd-bundle')).toHaveLength(0)
  })

  it('"The messengers come" with a corner still looking out: the places are marked, a cross, a mistake; the messengers walk by', async () => {
    const w = await open()
    await lay(w, 2, 25, 38)
    await w.find('.hd-look').trigger('click')
    expect(w.find('.hd-messengers').exists()).toBe(true)
    await tick(1400)
    expect(w.find('.hd-messengers').exists()).toBe(false)
    expect(played).toContain('wrong')
    expect(w.findAll('.hd-peek').length).toBeGreaterThan(0)
    expect(w.find('.hd-mark').exists()).toBe(true)
    expect(w.find('.hd-fb').text()).toContain('schaut noch etwas heraus')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('every man covered: nothing can be seen, a star; the marks go away when a bundle is moved; after a while round 2 has two men', async () => {
    const w = await open()
    await roundOne(w)
    await look(w)
    expect(played).toContain('star')
    expect(w.find('.hd-fb').text()).toContain('Niemand ist zu sehen')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1900)
    expect(w.find('.hd-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.hd-man')).toHaveLength(2)
    expect(w.findAll('.hd-token')).toHaveLength(5)
    expect(w.findAll('.hd-bundle')).toHaveLength(0)
  })

  it('the whole game: the end with three stars; the looks with a corner give the stars (up to one: three, up to three: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await look(w)
      await roundOne(w)
      await look(w)
      await tick(1900)
      await roundTwo(w)
      await look(w)
      await tick(1300)
      expect(useTaskProgress().parts.value).toBe(3)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} looks`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.hd-count').text()).toBe('Covered: 0 of 1')
    expect(w.find('.hd-look').text()).toBe('The messengers come')
    await look(w)
    expect(w.find('.hd-fb').text()).toContain('Something is still looking out')
  })
})

// ---------------------------------------------------------------- keep quiet
describe('Ruhe bewahren (hush)', () => {
  const spot = (n: number, animal: string) => ({ id: `platz-${n}`, animal, image: `images/x/${animal}.webp`, x: 10 + n * 15, y: 88, w: 13 })
  const game: HushGame = {
    background: 'images/x/road.webp',
    clouds: ['images/x/w1.webp', 'images/x/w2.webp', 'images/x/w3.webp'],
    spots: [spot(0, 'esel'), spot(1, 'gans'), spot(2, 'ziege'), spot(3, 'lamm'), spot(4, 'hahn'), spot(5, 'karren')],
    rounds: [
      { hint: 'Runde eins.', calms: 3, maxClouds: 2, grow: 3, seed: 5 },
      { hint: 'Runde zwei.', calms: 4, maxClouds: 3, grow: 2, seed: 9 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Hush } = await import('@/components/molecules/games/GameHush.vue')
    const w = mount(Hush, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const cloudy = (w: W) => w.findAll('.hs-spot').flatMap((s, i) => (s.classes().includes('cloudy') ? [i] : []))
  /** Wait (a tenth of a second at a time) until a cloud has come up. */
  const waitCloud = async (w: W) => {
    for (let i = 0; i < 80 && cloudy(w).length === 0; i++) await tick(100)
  }
  const calmOne = async (w: W) => {
    await waitCloud(w)
    await w.findAll('.hs-spot')[cloudy(w)[0]!]!.trigger('click')
    await flushPromises()
  }
  const wrongs = () => played.filter((p) => p === 'wrong').length

  it('the goal is every animal of both rounds; six animals sit at the side of the road, no cloud yet; a tap on a quiet animal does nothing', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.find('.hs-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.hs-spot')).toHaveLength(6)
    expect(w.findAll('.hs-cloud')).toHaveLength(0)
    expect(w.find('.hs-count').text()).toBe('Beruhigt: 0 von 3')
    await w.findAll('.hs-spot')[0]!.trigger('click')
    expect(played).toHaveLength(0)
  })

  it('a small cloud comes up over an animal and grows through three sizes until it would be loud', async () => {
    const w = await open()
    await waitCloud(w)
    expect(cloudy(w)).toHaveLength(1)
    const first = cloudy(w)[0]!
    // (a second cloud may come up meanwhile; this one is followed)
    const level = () => w.findAll('.hs-spot')[first]!.find('.hs-cloud').classes()
    expect(level()).toContain('level-1')
    await tick(1200)
    expect(level()).toContain('level-2')
    await tick(1000)
    expect(level()).toContain('level-3')
    expect(w.findAll('.hs-spot')[first]!.attributes('aria-label')).toContain('Antippen beruhigt')
  })

  it('a tap before the cloud is loud calms the animal: the cloud melts, a tick, a soft tone, the point is counted', async () => {
    const w = await open()
    await calmOne(w)
    expect(w.find('.hs-count').text()).toBe('Beruhigt: 1 von 3')
    expect(played).toContain('tap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm.good').exists()).toBe(true)
    expect(wrongs()).toBe(0)
  })

  it('a cloud that has grown for the whole time is loud: a cross, a mistake, the cloud is gone and does not count; the game goes on', async () => {
    const w = await open()
    await waitCloud(w)
    await tick(3500)
    expect(wrongs()).toBeGreaterThanOrEqual(1)
    expect(w.find('.hs-fb').text()).toContain('Zu laut')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('.hs-count').text()).toBe('Beruhigt: 0 von 3')
    // another cloud comes
    await waitCloud(w)
    expect(cloudy(w).length).toBeGreaterThan(0)
  })

  it('never more clouds at once than the round allows (two in round 1)', async () => {
    const w = await open()
    let most = 0
    for (let i = 0; i < 150; i++) {
      await tick(100)
      most = Math.max(most, cloudy(w).length)
    }
    expect(most).toBeLessThanOrEqual(2)
    expect(most).toBeGreaterThanOrEqual(1)
  })

  it('the clouds come in the same order every time', async () => {
    const order = async () => {
      const w = await open()
      const seen: number[] = []
      for (let i = 0; i < 120; i++) {
        await tick(100)
        for (const c of cloudy(w)) if (!seen.includes(c)) seen.push(c)
        if (seen.length >= 3) break
      }
      w.unmount()
      return seen
    }
    const a = await order()
    const b = await order()
    expect(a.length).toBeGreaterThanOrEqual(2)
    expect(b).toEqual(a)
  })

  it('three animals calmed end round 1; round 2 has four, up to three clouds and a shorter time', async () => {
    const w = await open()
    for (let i = 0; i < 3; i++) await calmOne(w)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1900)
    expect(w.find('.hs-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.hs-count').text()).toBe('Beruhigt: 0 von 4')
  })

  it('the whole game: the end with three stars when nothing got loud; the loud clouds give the stars (up to three: three, up to eight: two, more: one)', async () => {
    const w = await open()
    for (let i = 0; i < 3; i++) await calmOne(w)
    await tick(1900)
    for (let i = 0; i < 4; i++) await calmOne(w)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(7)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    // with loud clouds: the stars follow the number of cross sounds
    useTaskProgress().reset()
    played.length = 0
    const v = await open()
    for (let i = 0; i < 400 && wrongs() < 4; i++) await tick(100)
    const loud = wrongs()
    expect(loud).toBeGreaterThanOrEqual(4)
    for (let i = 0; i < 3; i++) await calmOne(v)
    await tick(1900)
    for (let i = 0; i < 4; i++) await calmOne(v)
    await tick(1100)
    const total = wrongs()
    await v.find('.gd button').trigger('click')
    expect(v.emitted('done'), `${total} loud`).toEqual([[total <= 3 ? 3 : total <= 8 ? 2 : 1]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.hs-count').text()).toBe('Calmed: 0 of 3')
    await waitCloud(w)
    expect(w.findAll('.hs-spot')[cloudy(w)[0]!]!.attributes('aria-label')).toContain('Tap to calm')
  })
})
