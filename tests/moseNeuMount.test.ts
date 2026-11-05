/**
 * "Frogs back to the Nile" (`froesche` = GameFroesche) of "Mose", mounted with sample data and with the real data of stage 7 and played through: the frogs on their places,
 * a swipe on a frog (it flies to the water and is gone), a tap without a swipe and a finger beside every frog (only a word), round 2 with a swipe the wrong way (a cross, a word, a mistake)
 * and frogs that hop on in turn, the arrow keys and Enter, "Help me" after fifteen seconds, the less motion, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible,
 * German, English and Spanish words. The new words are mixed into the messages of the app here (the same as in D:\Claude\Spiele-Neu\mose\INTEGRATION.json), so that the test does not wait for `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameFroesche from '@/components/molecules/games/GameFroesche.vue'
import { osterStars } from '@/utils/osternGames'
import { frogFlickProblems, frogSwipeToWater } from '@/utils/moseNeu'
import type { FrogFlickGame } from '@/utils/moseNeu'

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

/** The new words (the same as in D:\Claude\Spiele-Neu\mose\INTEGRATION.json). */
const NEW = {
  de: {
    frogFlickField: 'Ein Haus in Ägypten voller Frösche. Durch die offene Seite sieht man den Nil.',
    frogFlickRiver: 'Das Wasser des Nils',
    frogFlickFrog: 'Frosch {n}',
    frogFlickLeft: 'Noch im Haus: {n} von {total}',
    frogFlickTap: 'Wisch den Frosch mit einem kurzen Zug zum Nil.',
    frogFlickMiss: 'Leg den Finger auf einen Frosch und wisch zum Nil.',
    frogFlickGood: 'Hopp, zum Nil!',
    frogFlickWrong: 'Dort ist kein Wasser. Wisch nach {dir}.',
    frogFlickDirUp: 'oben',
    frogFlickDirDown: 'unten',
    frogFlickDirLeft: 'links',
    frogFlickDirRight: 'rechts',
    frogFlickDirUpLeft: 'links oben',
    frogFlickDirUpRight: 'rechts oben',
    frogFlickDirDownLeft: 'links unten',
    frogFlickDirDownRight: 'rechts unten',
    frogFlickClean: 'Aufgeräumt! Hier sitzt kein Frosch mehr.',
    frogFlickKeys: 'Mit den Pfeiltasten wählst du einen Frosch, mit Enter schnippst du ihn zum Nil.',
    frogFlickSelected: 'Frosch {n} von {total} ist gewählt.',
    frogFlickHelp: 'Hilf mir',
    frogFlickHelpSay: 'Wisch den markierten Frosch nach {dir}.',
    frogFlickDone: 'Auf dass du erfahrest, dass niemand ist wie der HERR, unser Gott.'
  },
  en: {
    frogFlickField: 'A house in Egypt full of frogs. Through the open side you can see the Nile.',
    frogFlickRiver: 'The water of the Nile',
    frogFlickFrog: 'Frog {n}',
    frogFlickLeft: 'Still in the house: {n} of {total}',
    frogFlickTap: 'Swipe the frog with a short stroke towards the Nile.',
    frogFlickMiss: 'Put your finger on a frog and swipe towards the Nile.',
    frogFlickGood: 'Hop, off to the Nile!',
    frogFlickWrong: 'There is no water there. Swipe {dir}.',
    frogFlickDirUp: 'up',
    frogFlickDirDown: 'down',
    frogFlickDirLeft: 'to the left',
    frogFlickDirRight: 'to the right',
    frogFlickDirUpLeft: 'up and to the left',
    frogFlickDirUpRight: 'up and to the right',
    frogFlickDirDownLeft: 'down and to the left',
    frogFlickDirDownRight: 'down and to the right',
    frogFlickClean: 'All tidy! No frog sits here any more.',
    frogFlickKeys: 'With the arrow keys you choose a frog, with Enter you flick it to the Nile.',
    frogFlickSelected: 'Frog {n} of {total} is chosen.',
    frogFlickHelp: 'Help me',
    frogFlickHelpSay: 'Swipe the marked frog {dir}.',
    frogFlickDone: 'That thou mayest know that there is none like unto the LORD our God.'
  },
  es: {
    frogFlickField: 'Una casa en Egipto llena de ranas. Por el lado abierto se ve el Nilo.',
    frogFlickRiver: 'El agua del Nilo',
    frogFlickFrog: 'Rana {n}',
    frogFlickLeft: 'Todavía en la casa: {n} de {total}',
    frogFlickTap: 'Desliza la rana con un trazo corto hacia el Nilo.',
    frogFlickMiss: 'Pon el dedo sobre una rana y desliza hacia el Nilo.',
    frogFlickGood: '¡Hop, al Nilo!',
    frogFlickWrong: 'Ahí no hay agua. Desliza hacia {dir}.',
    frogFlickDirUp: 'arriba',
    frogFlickDirDown: 'abajo',
    frogFlickDirLeft: 'la izquierda',
    frogFlickDirRight: 'la derecha',
    frogFlickDirUpLeft: 'arriba a la izquierda',
    frogFlickDirUpRight: 'arriba a la derecha',
    frogFlickDirDownLeft: 'abajo a la izquierda',
    frogFlickDirDownRight: 'abajo a la derecha',
    frogFlickClean: '¡Todo recogido! Aquí ya no queda ninguna rana.',
    frogFlickKeys: 'Con las flechas eliges una rana; con Enter la lanzas al Nilo.',
    frogFlickSelected: 'Rana {n} de {total} elegida.',
    frogFlickHelp: 'Ayúdame',
    frogFlickHelpSay: 'Desliza la rana marcada hacia {dir}.',
    frogFlickDone: 'Para que conozcas que no hay como Jehová nuestro Dios.'
  }
}

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
/** The messages of the app with the new words mixed into `app.adventure` (German, English, Spanish). */
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...NEW[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
/** The field is 300 x 400 pixels (3:4). */
const FW = 300
const FH = 400
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return (this.classList.contains('gm-field') ? box(0, 0, FW, FH) : box(0, 0, 100, 100)) as DOMRect
  })
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
  window.matchMedia = originalMatchMedia
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

const SAMPLE: FrogFlickGame = {
  frogs: ['frosch-a', 'frosch-c'],
  jump: 'frosch-b',
  rounds: [
    {
      hint: 'Hilf beim Aufräumen.',
      scene: 'haus-1',
      river: { x: 20, y: 10, w: 60, h: 25 },
      spots: [
        { x: 20, y: 70, w: 13 },
        { x: 50, y: 75, w: 13 },
        { x: 80, y: 70, w: 13 },
        { x: 35, y: 92, w: 13 }
      ],
      count: 3,
      aim: 180
    },
    {
      hint: 'Jetzt hüpfen sie.',
      scene: 'haus-2',
      river: { x: 0, y: 20, w: 35, h: 30 },
      spots: [
        { x: 60, y: 60, w: 13 },
        { x: 85, y: 60, w: 13 },
        { x: 60, y: 85, w: 13 },
        { x: 85, y: 85, w: 13 },
        { x: 70, y: 42, w: 13 }
      ],
      count: 4,
      aim: 25,
      hop: 3.5
    }
  ]
}

type W = ReturnType<typeof mount>
const mountIt = (game: FrogFlickGame = SAMPLE, locale: 'de' | 'en' | 'es' = 'de') => mount(GameFroesche, { props: { game }, ...opts(locale) })
const round2 = (w: W) => w.text().includes('Runde 2') || w.text().includes('Round 2') || w.text().includes('Ronda 2')
/** Where the finger catches a frog: its middle, a little above its feet (as in the component). */
function frogMiddle(w: W, id: number, game = SAMPLE) {
  const el = w.find(`[data-frog="${id}"]`).element as HTMLElement
  const x = parseFloat(el.style.left)
  const y = parseFloat(el.style.top)
  const ww = (parseFloat(el.style.width) / 100) * FW
  void game
  return { x: (x / 100) * FW, y: (y / 100) * FH - ww * 0.45 }
}
const swipe = async (w: W, id: number, dx: number, dy: number) => {
  const m = frogMiddle(w, id)
  pointer(w.find('.gm-field').element, 'pointerdown', m.x, m.y)
  pointer(window, 'pointerup', m.x + dx, m.y + dy)
  await flushPromises()
}
const gone = (w: W, id: number) => (w.find(`[data-frog="${id}"]`).attributes('style') ?? '').includes('display: none')
const key = async (w: W, k: string, wait = 0) => {
  await w.find('.gm-field').trigger('keydown', { key: k })
  await tick(wait)
}
/** Clears a round by swiping every frog straight at the water. */
async function clearRound(w: W, game = SAMPLE) {
  const r = game.rounds[round2(w) ? 1 : 0]!
  for (const el of w.findAll('.gm-frog')) {
    const id = Number(el.attributes('data-frog'))
    if (gone(w, id)) continue
    const s = el.element as HTMLElement
    const s2 = frogSwipeToWater({ x: parseFloat(s.style.left), y: parseFloat(s.style.top) }, r.river, FW, 0.75)
    const len = Math.hypot(s2.dx, s2.dy)
    await swipe(w, id, (s2.dx / len) * 60, (s2.dy / len) * 60)
    await tick(500)
  }
}

describe('Frösche zurück in den Nil (froesche)', () => {
  it('the sample data are in order; the goal is every frog (3 + 4); three frogs on their places, the round, the hint, the words for the screen reader', () => {
    expect(frogFlickProblems(SAMPLE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('.gm-frog')).toHaveLength(3)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Hilf beim Aufräumen.')
    expect(w.text()).toContain('Noch im Haus: 3 von 3')
    const f = w.find('.gm-field')
    expect(f.attributes('aria-label')).toBe('Ein Haus in Ägypten voller Frösche. Durch die offene Seite sieht man den Nil.')
    expect(f.attributes('tabindex')).toBe('0')
    expect(w.find('.gm-river').attributes('aria-label')).toBe('Das Wasser des Nils')
    expect(w.find('[data-frog="0"]').attributes('aria-label')).toBe('Frosch 1')
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('left: 20%')
    expect(w.find('[data-frog="0"] img').attributes('src')).toContain('frosch-a')
    expect(w.find('[data-frog="1"] img').attributes('src')).toContain('frosch-c')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a swipe on a frog in round 1 (any way): it jumps to the water, gets small and is gone; it counts for "Go on"', async () => {
    const w = mountIt()
    await swipe(w, 0, 50, 10)
    expect(count('bead')).toBe(1)
    expect(w.find('[data-frog="0"]').classes()).toContain('fly')
    expect(w.find('[data-frog="0"] img').attributes('src')).toContain('frosch-b')
    // it flies into the water
    const st = w.find('[data-frog="0"]').attributes('style')!
    expect(parseFloat(st.match(/top: ([\d.]+)%/)![1]!)).toBeLessThan(35)
    expect(w.text()).toContain('Hopp, zum Nil!')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(500)
    expect(gone(w, 0)).toBe(true)
    expect(w.text()).toContain('Noch im Haus: 2 von 3')
    expect(count('wrong')).toBe(0)
  })

  it('a tap without a swipe, or a finger beside every frog, only gets a word (no mistake)', async () => {
    const w = mountIt()
    const m = frogMiddle(w, 1)
    pointer(w.find('.gm-field').element, 'pointerdown', m.x, m.y)
    pointer(window, 'pointerup', m.x + 3, m.y + 2)
    await flushPromises()
    expect(w.text()).toContain('Wisch den Frosch mit einem kurzen Zug zum Nil.')
    pointer(w.find('.gm-field').element, 'pointerdown', 150, 10)
    await flushPromises()
    expect(w.text()).toContain('Leg den Finger auf einen Frosch')
    await tick(3000)
    expect(count('wrong')).toBe(0)
    expect(w.findAll('.gm-frog.fly')).toHaveLength(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('both rounds: "Aufgeräumt!", then four frogs in the bedroom; in round 2 a swipe the wrong way is a mistake (a cross, a word), the frog stays', async () => {
    const w = mountIt()
    await clearRound(w)
    expect(w.text()).toContain('Aufgeräumt! Hier sitzt kein Frosch mehr.')
    expect(count('right')).toBe(1)
    await tick(2700)
    expect(round2(w)).toBe(true)
    expect(w.findAll('.gm-frog')).toHaveLength(4)
    expect(w.text()).toContain('Jetzt hüpfen sie.')
    // the water is on the left: a swipe to the right is wrong
    await swipe(w, 0, 60, 0)
    expect(count('wrong')).toBe(1)
    expect(w.find('[data-frog="0"] .gm-mark').exists()).toBe(true)
    expect(w.find('[data-frog="0"]').classes()).toContain('bump')
    expect(w.text()).toContain('Dort ist kein Wasser. Wisch nach links oben.')
    expect(gone(w, 0)).toBe(false)
    await tick(1300)
    expect(w.find('[data-frog="0"] .gm-mark').exists()).toBe(false)
    // to the left it goes
    await swipe(w, 0, -60, -20)
    await tick(500)
    expect(gone(w, 0)).toBe(true)
  })

  it('round 2: every few seconds one frog hops on to the next free place, in turn', async () => {
    const w = mountIt()
    await clearRound(w)
    await tick(2700)
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('left: 60%')
    await tick(3600)
    // frog 1 (on place 1) hopped to the only free place, place 5
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('left: 70%')
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('top: 42%')
    await tick(3600)
    // frog 2 (on place 2) hopped to the next free place after it, place 1
    expect(w.find('[data-frog="1"]').attributes('style')).toContain('left: 60%')
    expect(w.find('[data-frog="1"]').attributes('style')).toContain('top: 60%')
  })

  it('the keyboard: the arrow keys choose a frog (from left to right), Enter flicks it to the water; Enter without a choice says how', async () => {
    const w = mountIt()
    await key(w, 'Enter')
    expect(w.text()).toContain('Mit den Pfeiltasten wählst du einen Frosch')
    await key(w, 'ArrowRight')
    expect(w.find('[data-frog="0"]').classes()).toContain('sel')
    expect(w.text()).toContain('Frosch 1 von 3 ist gewählt.')
    await key(w, 'ArrowRight')
    expect(w.find('[data-frog="1"]').classes()).toContain('sel')
    await key(w, 'ArrowLeft')
    await key(w, 'ArrowLeft')
    expect(w.find('[data-frog="2"]').classes()).toContain('sel')
    await key(w, 'Enter', 500)
    expect(gone(w, 2)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a button "Hilf mir" shows after fifteen seconds: the frog nearest the water and the water are marked, a word says which way; Enter flicks it', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(w.find('[data-frog="1"]').classes()).toContain('hint')
    expect(w.find('.gm-river').classes()).toContain('hint')
    expect(w.text()).toContain('Wisch den markierten Frosch nach oben.')
    expect(w.findAll('button').some((b) => b.text() === 'Hilf mir')).toBe(false)
    await key(w, 'Enter', 500)
    expect(gone(w, 1)).toBe(true)
    expect(w.find('.gm-river').classes()).not.toContain('hint')
  })

  it('at the end: the words of the Bible and the stars of the mistakes; "Weiter" sends them', async () => {
    const w = mountIt()
    await clearRound(w)
    await tick(2700)
    await swipe(w, 1, 60, 0) // one mistake
    await tick(1300)
    await clearRound(w)
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(2000)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Auf dass du erfahrest, dass niemand ist wie der HERR, unser Gott.')
    const next = w.findAll('button').find((b) => b.text() === 'Weiter' || b.text().includes('Weiter'))!
    await next.trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('less motion: a flicked frog is gone at once, and the frogs hop half as often', async () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() })) as never
    const w = mountIt()
    await swipe(w, 0, 0, -60)
    await tick(0)
    expect(gone(w, 0)).toBe(true)
    await clearRound(w)
    await tick(2700)
    await tick(3600)
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('left: 60%')
    await tick(3600)
    expect(w.find('[data-frog="0"]').attributes('style')).toContain('left: 70%')
  })

  it('English and Spanish words', async () => {
    const en = mountIt(SAMPLE, 'en')
    expect(en.find('.gm-field').attributes('aria-label')).toBe('A house in Egypt full of frogs. Through the open side you can see the Nile.')
    expect(en.text()).toContain('Still in the house: 3 of 3')
    en.unmount()
    const es = mountIt(SAMPLE, 'es')
    expect(es.find('.gm-river').attributes('aria-label')).toBe('El agua del Nilo')
    await clearRound(es)
    expect(es.text()).toContain('¡Todo recogido!')
  })

  it('the real data of stage 7 mount and can be cleared without a mistake', async () => {
    const { mose } = await import('@/data/adventures/mose')
    const game = (mose.stages[6]!.task as unknown as { frogFlick: FrogFlickGame }).frogFlick
    const w = mountIt(game)
    expect(w.findAll('.gm-frog')).toHaveLength(game.rounds[0]!.count)
    await clearRound(w, game)
    await tick(2700)
    expect(w.findAll('.gm-frog')).toHaveLength(game.rounds[1]!.count)
    await clearRound(w, game)
    await tick(2000)
    expect(w.text()).toContain('Auf dass du erfahrest')
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })
})
