/**
 * The two new games of "Jesus erzählt von sich" (`ichbin`), mounted with sample data and played through:
 * - `wehen` = GameWehen ("Which way does the wind blow?"): the gusts move the things, the three tablets, right and wrong, the turning wind, the calm, "Watch again", "Help me" after fifteen seconds,
 *   the keyboard, less motion, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words;
 * - `hirtenruf` = GameHirtenruf ("The call of the shepherd"): the growing ring, the sheep that come, a call that is too quiet, the callers in the fog, right and wrong, the three passes, "Help me", the keyboard,
 *   less motion, the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`ichbinNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameWehen from '@/components/molecules/games/GameWehen.vue'
import GameHirtenruf from '@/components/molecules/games/GameHirtenruf.vue'
import { ichbinStars } from '@/utils/ichbinGames'
import { BREEZE, HERD } from './ichbinSamples'
import { ICHBIN_WORDS } from './ichbinNeuI18n'

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

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...ICHBIN_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

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
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
type Wr = ReturnType<typeof mount>
const helpButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Hilf mir')

// ================================================================ wehen
describe('Woher weht der Wind? (wehen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWehen, { props: { game: BREEZE }, ...opts(locale) })
  const tablet = (w: Wr, k: 'left' | 'still' | 'right') => w.find(`[data-tablet="${k}"]`)
  const flame = (w: Wr) => w.find('[data-thing="flamme"]')
  const enabled = (w: Wr) => w.findAll('button.gm-tablet').every((b) => b.attributes('disabled') === undefined)
  /** Waits until the gust is over and the tablets can be tapped (a gust starts 1.5 s after the mount, lasts `ms`). */
  const untilAsk = async (w: Wr) => {
    for (let i = 0; i < 80 && !enabled(w); i++) await tick(100)
    expect(enabled(w)).toBe(true)
  }
  /** Taps the right tablet of the gust that is on. */
  const solve = async (w: Wr, k: 'left' | 'still' | 'right') => {
    await untilAsk(w)
    await tablet(w, k).trigger('click')
  }

  it('the goal is every gust (4 + 5); the hint, the round, the field as one picture, three tablets, the status line; no drawing; no tablet can be tapped before the first gust is over', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Du siehst den Wind nicht. Schau, was er bewegt, und tippe, wohin er weht.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Ein Hof bei Nacht')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-tablet')).toHaveLength(3)
    expect(w.findAll('button.gm-tablet').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.text()).toContain('Böen: 0 von 9')
    expect(w.findAll('.gm-thing')).toHaveLength(5)
    expect(w.findAll('.gm-thing').every((t) => t.attributes('aria-hidden') === 'true')).toBe(true)
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the tablets have a name and a word each (not the colour only), at least 56 pixels wide by their data', () => {
    const w = mountIt()
    expect(tablet(w, 'left').attributes('aria-label')).toBe('Nach links')
    expect(tablet(w, 'still').attributes('aria-label')).toBe('Still')
    expect(tablet(w, 'right').attributes('aria-label')).toBe('Nach rechts')
    expect(tablet(w, 'right').text()).toContain('Nach rechts')
    expect(w.find('.gm-tablets').attributes('role')).toBe('group')
    expect((tablet(w, 'left').element as HTMLElement).style.width).toBe('24%')
    expect(BREEZE.tabletW * 3.6).toBeGreaterThanOrEqual(56)
  })

  it('the gust moves the things: the flame, the cloth and the leaf lean and drift to the right; afterwards the tablets work and the question is asked', async () => {
    const w = mountIt()
    await tick(1400)
    expect(flame(w).attributes('data-pose')).toBe('still')
    await tick(1500) // a second and a half into the gust
    expect(flame(w).attributes('data-pose')).toBe('right')
    expect(w.find('[data-thing="tuch"]').attributes('data-pose')).toBe('right')
    expect(flame(w).find('img').attributes('src')).toContain('flamme-rechts')
    const leaf = w.find('[data-thing="blatt"]').element as HTMLElement
    expect(parseFloat(leaf.style.left)).toBeGreaterThan(50)
    expect(w.find('[data-thing="gras"]').attributes('style')).toMatch(/rotate\(1\d\.\d+deg\)/)
    expect(enabled(w)).toBe(false)
    await untilAsk(w)
    expect(w.text()).toContain('Wohin hat der Wind geweht?')
    expect(flame(w).attributes('data-pose')).toBe('right') // held for a moment
    await tick(2200)
    expect(flame(w).attributes('data-pose')).toBe('still') // then they stand up again
  })

  it('a right tap: a tick, a bright tone, "The wind blows to the right.", one more gust read; the next gust follows', async () => {
    const w = mountIt()
    await solve(w, 'right')
    expect(count('right')).toBe(1)
    expect(count('wrong')).toBe(0)
    expect(w.text()).toContain('Der Wind weht nach rechts.')
    expect(tablet(w, 'right').find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Böen: 1 von 9')
    expect(enabled(w)).toBe(false)
    await tick(2100) // the next gust (to the left) begins
    await tick(1500)
    expect(flame(w).attributes('data-pose')).toBe('left')
    expect(w.text()).not.toContain('Der Wind weht nach rechts.')
  })

  it('a wrong tap: a cross, a low tone, a line that says what the flame did, a mistake; the same gust is shown again; after a second mistake the right tablet shines', async () => {
    const w = mountIt()
    await solve(w, 'left')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Schau noch einmal: Die Flamme neigt sich nach rechts.')
    expect(tablet(w, 'left').find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(2300)
    await tick(1500)
    expect(flame(w).attributes('data-pose')).toBe('right') // the same gust again
    expect(tablet(w, 'right').classes()).not.toContain('shine')
    await solve(w, 'still')
    expect(count('wrong')).toBe(2)
    await tick(2300)
    await untilAsk(w)
    expect(tablet(w, 'right').classes()).toContain('shine')
    await tablet(w, 'right').trigger('click')
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(problems()).toEqual([])
  })

  it('"Watch again" comes when the things have stood up again and shows the same gust without a mistake', async () => {
    const w = mountIt()
    await untilAsk(w)
    const again = () => w.findAll('button').find((b) => b.text() === 'Noch einmal ansehen')
    expect(again()).toBeUndefined()
    await tick(2000)
    expect(again()).toBeDefined()
    await again()!.trigger('click')
    expect(enabled(w)).toBe(false)
    await tick(1500)
    expect(flame(w).attributes('data-pose')).toBe('right')
    expect(count('wrong')).toBe(0)
    await untilAsk(w)
    await tablet(w, 'right').trigger('click')
    expect(count('right')).toBe(1)
  })

  it('"Help me" comes after fifteen seconds without a tap, makes the right tablet shine and the flame swing, and costs nothing', async () => {
    const w = mountIt()
    await untilAsk(w)
    expect(helpButton(w)).toBeUndefined()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(tablet(w, 'right').classes()).toContain('shine')
    expect(tablet(w, 'left').classes()).not.toContain('shine')
    expect(flame(w).classes()).toContain('swing')
    expect(w.text()).toContain('Eine Tafel leuchtet. Schau, was sich bewegt hat.')
    await tablet(w, 'right').trigger('click')
    expect(count('right')).toBe(1)
    expect(count('wrong')).toBe(0)
    expect(tablet(w, 'right').classes()).not.toContain('shine')
  })

  it('both rounds: round 2 asks "Which way does it blow now?", the wind turns (the end counts), one gust is still; the verse and the stars at the end; no mistake gives three stars', async () => {
    const w = mountIt()
    for (const k of ['right', 'left', 'left', 'right'] as const) await solve(w, k)
    await tick(2400) // "Well done"
    await tick(2400)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Der Wind dreht sich. Tippe, wohin er zuletzt weht, oder auf die Ruhe.')
    // gust 1: the wind blows to the left, then turns to the right: the end counts
    await untilAsk(w)
    expect(w.text()).toContain('Wohin weht er jetzt?')
    expect(flame(w).attributes('data-pose')).toBe('right')
    await tablet(w, 'right').trigger('click')
    expect(w.text()).toContain('Der Wind weht nach rechts.')
    await tick(2100)
    await solve(w, 'left')
    await tick(2100)
    await solve(w, 'left') // blows to the right, turns to the left
    await tick(2100)
    // the calm: nothing leans, the flame trembles
    await tick(1500)
    expect(flame(w).attributes('data-pose')).toBe('still')
    expect(flame(w).classes()).toContain('flicker')
    await solve(w, 'still')
    expect(w.text()).toContain('Es ist ganz still.')
    await tick(2100)
    await solve(w, 'right')
    expect(useTaskProgress().parts.value).toBe(9)
    await tick(4000)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Der Wind bläst, wo er will, und du hörst sein Sausen wohl; aber du weißt nicht, woher er kommt und wohin er fährt.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('wrong in round 2: on a turning wind "The wind turned.", on the calm "Nothing moves."; two mistakes still give three stars, five give one', async () => {
    const w = mountIt()
    for (const k of ['right', 'left', 'left', 'right'] as const) await solve(w, k)
    await tick(4800)
    await solve(w, 'left') // wrong: it ended to the right
    expect(w.text()).toContain('Der Wind hat gedreht. Schau, wohin die Flamme jetzt zeigt.')
    await tick(2300)
    await solve(w, 'right')
    await tick(2100)
    await solve(w, 'left')
    await tick(2100)
    await solve(w, 'left')
    await tick(2100)
    await solve(w, 'right') // wrong: the calm
    expect(w.text()).toContain('Es bewegt sich nichts.')
    await tick(2300)
    await solve(w, 'still')
    await tick(2100)
    await solve(w, 'right')
    await tick(4000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([ichbinStars(2)])
    expect(ichbinStars(2)).toBe(3)
    expect(ichbinStars(5)).toBe(1)
  })

  it('the keyboard: the tablets are buttons; the arrow keys move between them; Enter taps', async () => {
    const w = mountIt()
    await untilAsk(w)
    const box = w.find('.gm-tablets')
    ;(tablet(w, 'left').element as HTMLElement).focus()
    await box.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tablet(w, 'still').element)
    await box.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tablet(w, 'right').element)
    await box.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tablet(w, 'right').element)
    await box.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tablet(w, 'still').element)
    expect(w.findAll('button.gm-tablet').every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    await tablet(w, 'right').trigger('click')
    expect(count('right')).toBe(1)
  })

  it('with less motion the things switch instead of gliding and stay in the end pose for four seconds', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
    await tick(1500)
    await tick(400)
    const poses = new Set<string>()
    const leaf = w.find('[data-thing="blatt"]').element as HTMLElement
    for (let i = 0; i < 20; i++) {
      await tick(100)
      poses.add(flame(w).attributes('data-pose')!)
    }
    expect(poses.has('left')).toBe(false)
    expect([...poses].every((p) => p === 'still' || p === 'right')).toBe(true)
    expect(parseFloat(leaf.style.left)).toBe(50) // during the gust the leaf lies where it was
    await untilAsk(w)
    expect(flame(w).attributes('data-pose')).toBe('right')
    expect(parseFloat(leaf.style.left)).toBeGreaterThan(70) // afterwards it lies where it drifted to
    await tick(3000)
    expect(flame(w).attributes('data-pose')).toBe('right') // still held after three seconds
    await tick(2000)
    expect(flame(w).attributes('data-pose')).toBe('still')
    expect(flame(w).classes()).not.toContain('flicker')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('A courtyard at night')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('Un patio de noche')
    expect(mountIt('en').text()).toContain('Gusts: 0 of 9')
  })
})

// ================================================================ hirtenruf
describe('Der Ruf des Hirten (hirtenruf)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHirtenruf, { props: { game: HERD }, ...opts(locale) })
  const shepherd = (w: Wr) => w.find('[data-figure="shepherd"]')
  const sheep = (w: Wr, id: string) => w.find(`[data-sheep="${id}"]`)
  const left = (w: Wr, id: string) => parseFloat((sheep(w, id).element as HTMLElement).style.left)
  const fig = (w: Wr, side: 'left' | 'right') => w.find(`[data-figure="${side}"]`)
  const fog = (w: Wr) => parseFloat((w.find('.gm-fog').element as HTMLElement).style.opacity)
  /** Round 1 played through: three quick calls, every sheep comes, "Well done", and round 2 begins (a pass begins at once). */
  const playRound1 = async (w: Wr) => {
    await tick(700)
    for (let i = 0; i < 3; i++) {
      await shepherd(w).trigger('click')
      await tick(300)
    }
    await tick(2600 + 500 + 2600 + 2400)
  }
  /** The pass of round 2: waits until the callers can be tapped. */
  const untilAsk = async (w: Wr) => {
    for (let i = 0; i < 100 && fig(w, 'left').attributes('disabled') !== undefined; i++) await tick(100)
    expect(fig(w, 'left').attributes('disabled')).toBeUndefined()
  }

  it('the goal is the two rounds; the hint, the round, the field, the status line; the shepherd is a button; no drawing; nobody has come yet', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Tippe auf den Hirten. Jeder Ruf reicht ein Stück weiter.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Eine Weide am Morgen')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(shepherd(w).element.tagName).toBe('BUTTON')
    expect(shepherd(w).attributes('aria-label')).toBe('Der Hirte')
    expect(w.findAll('.gm-sheep')).toHaveLength(6)
    expect(w.text()).toContain('Schafe beim Hirten: 0 von 6')
    expect(helpButton(w)).toBeUndefined()
    await tick(700)
    expect(shepherd(w).attributes('disabled')).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the first call: a ring over the ground, a soft tone; the two nearest sheep lift their heads and walk to their places beside the shepherd', async () => {
    const w = mountIt()
    await tick(700)
    expect(w.find('.gm-ring').exists()).toBe(false)
    await shepherd(w).trigger('click')
    expect(count('tap')).toBe(1)
    expect(w.findAll('.gm-ring')).toHaveLength(1)
    expect(w.text()).toContain('Die Schafe heben den Kopf und kommen.')
    expect(sheep(w, 's1').classes()).toContain('up')
    expect(sheep(w, 's1').find('img').attributes('src')).toContain('schaf-1-hoert')
    expect(sheep(w, 's2').classes()).toContain('up')
    expect(sheep(w, 's3').classes()).not.toContain('up')
    expect(left(w, 's1')).toBe(30) // still where it stood
    await tick(1000)
    expect(left(w, 's1')).toBe(30) // the places are the first two of the list
    expect(left(w, 's2')).toBe(44)
    await tick(2300)
    expect(sheep(w, 's1').classes()).not.toContain('up')
    expect(count('bead')).toBe(2)
    expect(w.text()).toContain('Schafe beim Hirten: 2 von 6')
    expect(left(w, 's3')).toBe(50) // nobody else moved
    expect(w.findAll('.gm-ring')).toHaveLength(0) // the ring has faded
    expect(count('wrong')).toBe(0)
  })

  it('every further call within two seconds reaches farther: the second fetches the two sheep in the middle distance, the third the far ones; all six: a tick, a tone, the words', async () => {
    const w = mountIt()
    await tick(700)
    await shepherd(w).trigger('click')
    await tick(500)
    await shepherd(w).trigger('click')
    expect(sheep(w, 's3').classes()).toContain('up')
    expect(sheep(w, 's4').classes()).toContain('up')
    expect(sheep(w, 's5').classes()).not.toContain('up')
    await tick(500)
    await shepherd(w).trigger('click')
    expect(sheep(w, 's5').classes()).toContain('up')
    expect(sheep(w, 's6').classes()).toContain('up')
    await tick(3000)
    expect(left(w, 's3')).toBe(54) // the places are taken in the order of the calls
    expect(left(w, 's4')).toBe(38)
    expect(left(w, 's5')).toBe(22)
    expect(left(w, 's6')).toBe(12)
    expect(count('bead')).toBe(6)
    await tick(500)
    expect(w.text()).toContain('Alle Schafe sind bei ihrem Hirten.')
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(count('wrong')).toBe(0)
  })

  it('a call that reaches nobody is "too quiet" (no mistake); after two seconds without a call the ring begins small again', async () => {
    const w = mountIt()
    await tick(700)
    await shepherd(w).trigger('click') // ring 0: the two near sheep
    await tick(3500) // the window of two seconds is over
    await shepherd(w).trigger('click') // ring 0 again: nobody new
    expect(w.text()).toContain('Das war zu leise. Ruf noch einmal.')
    expect(sheep(w, 's3').classes()).not.toContain('up')
    await tick(500)
    await shepherd(w).trigger('click') // within two seconds: ring 1
    expect(sheep(w, 's3').classes()).toContain('up')
    expect(sheep(w, 's4').classes()).toContain('up')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('after the third ring the next call begins small again, and a sheep that has come is not called twice', async () => {
    const w = mountIt()
    await tick(700)
    for (let i = 0; i < 4; i++) {
      await shepherd(w).trigger('click')
      await tick(200)
    }
    expect(w.text()).toContain('Das war zu leise. Ruf noch einmal.')
    expect(count('tap')).toBe(4)
  })

  it('"Help me" comes after fifteen seconds without a tap and makes the shepherd shine', async () => {
    const w = mountIt()
    await tick(13000)
    expect(helpButton(w)).toBeUndefined()
    await tick(3000)
    await helpButton(w)!.trigger('click')
    expect(w.find('.gm-man').classes()).toContain('shine')
    expect(w.text()).toContain('Der Hirte leuchtet. Tippe ihn schnell mehrmals an.')
    await shepherd(w).trigger('click')
    expect(w.find('.gm-man').classes()).not.toContain('shine')
    expect(helpButton(w)).toBeUndefined()
  })

  it('round 2: two callers in thick fog, dark shapes; both call one after the other with the same ring; the sheep run to one of them; the callers can be tapped afterwards', async () => {
    const w = mountIt()
    await playRound1(w)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Schau, wohin die Schafe laufen, und tippe auf den Hirten.')
    expect(w.text()).toContain('Durchgang 1 von 3')
    expect(fog(w)).toBeGreaterThan(0.9)
    expect(w.find('[data-side="left"]').classes()).toContain('dark')
    expect(w.find('[data-side="right"]').classes()).toContain('dark')
    expect(w.findAll('.gm-sheep')).toHaveLength(4)
    expect(fig(w, 'left').attributes('disabled')).toBeDefined()
    expect(fig(w, 'left').attributes('aria-label')).toBe('Der Rufer links im Nebel')
    expect(fig(w, 'right').attributes('aria-label')).toBe('Der Rufer rechts im Nebel')
    // the two calls: left at 0.7 s, right at 2 s
    const before = count('tap')
    await tick(900)
    expect(count('tap') - before).toBe(1)
    expect(w.findAll('.gm-ring')).toHaveLength(1)
    await tick(1300)
    expect(count('tap') - before).toBe(2)
    expect(left(w, 's1')).toBe(40) // the sheep stand in the middle
    await tick(1900) // 3.6 s: they run to the left caller (pass 1)
    await tick(2000)
    expect(left(w, 's1')).toBe(22)
    expect(left(w, 's2')).toBe(30)
    await untilAsk(w)
    expect(w.text()).toContain('Tippe auf den Hirten.')
  })

  it('a wrong caller: a cross, a low tone, "Look which way the sheep run.", a mistake; the pass is played again; the right one: the fog lifts, both are shown, a tick, the words', async () => {
    const w = mountIt()
    await playRound1(w)
    await untilAsk(w)
    await fig(w, 'right').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Schau, wohin die Schafe laufen.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(fog(w)).toBeGreaterThan(0.9)
    await tick(2700)
    expect(left(w, 's1')).toBe(40) // the sheep are back in the middle: the pass plays again
    await untilAsk(w)
    await fig(w, 'left').trigger('click')
    expect(count('right')).toBe(2) // round 1 and this pass
    expect(w.text()).toContain('Das ist der Hirte. Die Schafe kennen seine Stimme.')
    expect(fog(w)).toBe(0)
    expect(w.find('[data-side="left"]').classes()).not.toContain('dark')
    expect(w.find('[data-side="left"] img').attributes('src')).toContain('hirte')
    expect(w.find('[data-side="right"] img').attributes('src')).toContain('fremder')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('three passes: left, right (the sheep run hesitantly), left (the stranger stands nearer); the verse and the stars at the end', async () => {
    const w = mountIt()
    await playRound1(w)
    await untilAsk(w)
    await fig(w, 'left').trigger('click')
    await tick(3300)
    expect(w.text()).toContain('Durchgang 2 von 3')
    // pass 2: the sheep first take a short way to the right, pause, then run on
    await tick(3700)
    expect(left(w, 's1')).toBeGreaterThan(40)
    expect(left(w, 's1')).toBeLessThan(78)
    await untilAsk(w)
    expect(left(w, 's1')).toBe(78)
    await fig(w, 'left').trigger('click') // wrong
    expect(count('wrong')).toBe(1)
    await tick(2700)
    await untilAsk(w)
    await fig(w, 'right').trigger('click')
    await tick(3300)
    expect(w.text()).toContain('Durchgang 3 von 3')
    // pass 3: the stranger (right) steps towards the middle; the shepherd stands at the left edge
    expect(parseFloat((w.find('[data-side="right"]').element as HTMLElement).style.left)).toBe(67)
    expect(parseFloat((w.find('[data-side="left"]').element as HTMLElement).style.left)).toBe(11)
    await untilAsk(w)
    expect(left(w, 's1')).toBe(22)
    await fig(w, 'left').trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3300 + 1500)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Dem tut der Türhüter auf, und die Schafe hören seine Stimme; und er ruft seine Schafe mit Namen und führt sie aus.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([ichbinStars(1)])
    expect(problems()).toEqual([])
  })

  it('"Help me" in round 2 lays a trail of light to where the sheep run; the callers are buttons; the arrow keys move between them', async () => {
    const w = mountIt()
    await playRound1(w)
    await untilAsk(w)
    await tick(16500)
    await helpButton(w)!.trigger('click')
    expect(w.findAll('.gm-trail')).toHaveLength(3)
    expect(w.text()).toContain('Eine Spur aus Licht zeigt, wohin die Schafe laufen.')
    const field = w.find('.gm-field')
    ;(fig(w, 'left').element as HTMLElement).focus()
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(fig(w, 'right').element)
    await field.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(fig(w, 'left').element)
    expect(fig(w, 'left').element.tagName).toBe('BUTTON')
    await fig(w, 'left').trigger('click')
    expect(w.findAll('.gm-trail')).toHaveLength(0)
    expect(count('wrong')).toBe(0)
  })

  it('with less motion the sheep jump to their places and nothing glides', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
    await tick(700)
    await shepherd(w).trigger('click')
    expect((sheep(w, 's1').element as HTMLElement).style.transitionDuration).toBe('0ms')
    await tick(700)
    expect(left(w, 's1')).toBe(30)
    expect(count('bead')).toBe(2)
    expect(w.find('.gm-ring').exists()).toBe(true) // the ring stands still
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('A pasture in the morning')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('Un pasto por la mañana')
    expect(mountIt('en').text()).toContain('Sheep with the shepherd: 0 of 6')
  })
})
