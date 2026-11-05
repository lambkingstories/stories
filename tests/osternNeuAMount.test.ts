/**
 * "The errand" (`botengang` = GameBotengang) and "The shutters" (`fensterlaeden` = GameFensterlaeden) of "Ostern", mounted with sample data and played through: the tiles and their turns, Mary's walk
 * after a tap in a straight line, the swipe and the arrow keys to the next branching, the dead end (a cross, a word, a step back), "Help me", the less motion; the shutters with their neighbours,
 * the moves over par, the arrow keys between the windows, the rounds, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here, so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameBotengang from '@/components/molecules/games/GameBotengang.vue'
import GameFensterlaeden from '@/components/molecules/games/GameFensterlaeden.vue'
import { partialStars } from '@/utils/adventureScore'
import { osterStars } from '@/utils/osternGames'
import { errandProblems, shuttersBest, shuttersProblems } from '@/utils/osternNeuA'
import type { ErrandGame, ShuttersGame } from '@/utils/osternNeuA'

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

/** The new words (the same as in D:\Claude\Abenteuer-Ostern\i18n-neu-A.json). */
const NEW = {
  de: {
    errandField: 'Die Gassen von Jerusalem von oben. Maria steht am Gartentor.',
    errandMaria: 'Maria Magdalena, Reihe {r}, Spalte {c}',
    errandHelp: 'Hilf mir',
    errandHelpSay: 'Lauf bis zur markierten Gasse.',
    errandKeys: 'Mit den Pfeiltasten läuft Maria bis zur nächsten Abzweigung.',
    errandStraight: 'Maria läuft nur geradeaus. Tipp eine Gasse, die in gerader Linie vor ihr liegt.',
    errandRoof: 'Das ist ein Dach. Dort kann Maria nicht laufen.',
    errandWall: 'Da ist ein Haus im Weg.',
    errandDead: 'Hier geht es nicht weiter.',
    errandArrived: 'Maria ist bei den Jüngern!',
    errandDone: 'Maria Magdalena kommt und verkündigt den Jüngern: Ich habe den HERRN gesehen, und solches hat er zu mir gesagt.',
    shuttersField: 'Das Haus am Abend. Oben sind die Fenster mit den Läden.',
    shuttersWindow: 'Fenster {n}: {state}',
    shuttersOpen: 'offen',
    shuttersClosed: 'zu',
    shuttersCount: 'Offen: {n} von {total}',
    shuttersMoves: 'Züge: {n} (es geht mit {par})',
    shuttersTooMany: 'Zwei Züge zu viel. Es geht auch mit weniger.',
    shuttersAll: 'Alle Fenster sind hell!',
    shuttersHelp: 'Hilf mir',
    shuttersHelpSay: 'Tipp auf das markierte Fenster.',
    shuttersDone: 'Da sie aber davon redeten, trat er selbst, Jesus, mitten unter sie und sprach: Friede sei mit euch!'
  },
  en: {
    errandField: 'The lanes of Jerusalem from above. Mary stands at the garden gate.',
    errandMaria: 'Mary Magdalene, row {r}, column {c}',
    errandHelp: 'Help me',
    errandHelpSay: 'Run to the marked lane.',
    errandKeys: 'With the arrow keys Mary runs to the next turning.',
    errandStraight: 'Mary only runs straight ahead. Tap a lane that lies in a straight line from her.',
    errandRoof: 'That is a roof. Mary cannot walk there.',
    errandWall: 'A house is in the way.',
    errandDead: 'The way ends here.',
    errandArrived: 'Mary is with the disciples!',
    errandDone: 'Mary Magdalene came and told the disciples that she had seen the Lord, and that he had spoken these things unto her.',
    shuttersField: 'The house in the evening. Up above are the windows with their shutters.',
    shuttersWindow: 'Window {n}: {state}',
    shuttersOpen: 'open',
    shuttersClosed: 'closed',
    shuttersCount: 'Open: {n} of {total}',
    shuttersMoves: 'Moves: {n} (it can be done in {par})',
    shuttersTooMany: 'Two moves too many. It can be done with fewer.',
    shuttersAll: 'All the windows are bright!',
    shuttersHelp: 'Help me',
    shuttersHelpSay: 'Tap the marked window.',
    shuttersDone: 'And as they thus spake, Jesus himself stood in the midst of them, and saith unto them, Peace be unto you.'
  },
  es: {
    errandField: 'Las callejuelas de Jerusalén desde arriba. María está en la puerta del huerto.',
    errandMaria: 'María Magdalena, fila {r}, columna {c}',
    errandHelp: 'Ayúdame',
    errandHelpSay: 'Corre hasta la calle marcada.',
    errandKeys: 'Con las flechas, María corre hasta el próximo cruce.',
    errandStraight: 'María solo corre en línea recta. Toca una calle que esté en línea recta delante de ella.',
    errandRoof: 'Eso es un tejado. María no puede caminar por ahí.',
    errandWall: 'Hay una casa en el camino.',
    errandDead: 'Aquí no se puede seguir.',
    errandArrived: '¡María está con los discípulos!',
    errandDone: 'Fue María Magdalena dando las nuevas a los discípulos de que había visto al Señor, y que él le había dicho estas cosas.',
    shuttersField: 'La casa al atardecer. Arriba están las ventanas con sus contraventanas.',
    shuttersWindow: 'Ventana {n}: {state}',
    shuttersOpen: 'abierta',
    shuttersClosed: 'cerrada',
    shuttersCount: 'Abiertas: {n} de {total}',
    shuttersMoves: 'Movimientos: {n} (se puede con {par})',
    shuttersTooMany: 'Dos movimientos de más. Se puede con menos.',
    shuttersAll: '¡Todas las ventanas están iluminadas!',
    shuttersHelp: 'Ayúdame',
    shuttersHelpSay: 'Toca la ventana marcada.',
    shuttersDone: 'Y entre tanto que ellos hablaban estas cosas, él se puso en medio de ellos, y les dijo: Paz a vosotros.'
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
const boxes = new WeakMap<Element, { left: number; top: number; right: number; bottom: number }>()
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const b = boxes.get(this)
    return (b ? box(b.left, b.top, b.right - b.left, b.bottom - b.top) : box(0, 0, 100, 100)) as DOMRect
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
  // the matchMedia of the test of less motion
  window.matchMedia = originalMatchMedia
})
const originalMatchMedia = window.matchMedia
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

// ---------------------------------------------------------------- the errand
const R1 = ['S..##', '##.##', 'B....', '####.', '####Z']
const R2 = ['S.....B', '##.##.#', 'B..##.#', '##.....', '##.###.', '##B###Z']
const ERRAND: ErrandGame = {
  tiles: { straight: 'gerade', corner: 'ecke', tee: 't', cross: 'kreuz', dead: 'sackgasse', roofs: ['dach-1', 'dach-2'], start: 'start', goal: 'ziel' },
  walker: 'maria',
  rounds: [
    { hint: 'Lauf zu den Jüngern.', rows: R1 },
    { hint: 'Die Stadt ist groß.', rows: R2 }
  ]
}

describe('Botengang (botengang)', () => {
  /** The field is 50 pixels a cell: 250 x 250 in round 1, 350 x 300 in round 2. */
  const CELL = 50
  const mountIt = (game: ErrandGame = ERRAND, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameBotengang, { props: { game }, ...opts(locale) })
    layout(w)
    return w
  }
  type W = ReturnType<typeof mountIt>
  const layout = (w: W) => {
    const f = w.find('.gm-field')
    if (!f.exists()) return
    const cols = f.findAll('.gm-cell').length / (w.text().includes('Runde 2') ? 6 : 5)
    const rows = w.text().includes('Runde 2') ? 6 : 5
    boxes.set(f.element, { left: 0, top: 0, right: cols * CELL, bottom: rows * CELL })
  }
  /** Where Mary stands (row, column), from her place in percent. */
  const maria = (w: W) => {
    const el = w.find('.gm-maria').element as HTMLElement
    const cols = w.findAll('.gm-cell').length / (w.text().includes('Runde 2') ? 6 : 5)
    const rows = w.text().includes('Runde 2') ? 6 : 5
    return { r: Math.round((parseFloat(el.style.top) / 100) * rows - 0.5) || 0, c: Math.round((parseFloat(el.style.left) / 100) * cols - 0.5) || 0 }
  }
  const tap = async (w: W, r: number, c: number) => {
    const x = (c + 0.5) * CELL
    const y = (r + 0.5) * CELL
    pointer(w.find('.gm-field').element, 'pointerdown', x, y)
    pointer(window, 'pointerup', x + 2, y + 1)
    await flushPromises()
  }
  const swipe = async (w: W, dx: number, dy: number) => {
    pointer(w.find('.gm-field').element, 'pointerdown', 100, 100)
    pointer(window, 'pointerup', 100 + dx, 100 + dy)
    await flushPromises()
  }
  const key = async (w: W, k: string, wait = 1200) => {
    await w.find('.gm-field').trigger('keydown', { key: k })
    await tick(wait)
  }
  /** Round 1 by the arrow keys (8 steps), then round 2 (11 steps). */
  const playRound1 = async (w: W) => {
    await key(w, 'ArrowRight')
    await key(w, 'ArrowRight', 1100)
  }
  const playRound2 = async (w: W) => {
    await key(w, 'ArrowRight')
    await key(w, 'ArrowDown')
    await key(w, 'ArrowDown')
    await key(w, 'ArrowRight')
    await key(w, 'ArrowRight', 800)
  }

  it('the sample data are in order; the goal is every step of both shortest ways (8 + 11); 25 tiles, Mary at the gate, the round, the hint', () => {
    expect(errandProblems(ERRAND)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(19)
    expect(w.findAll('.gm-cell')).toHaveLength(25)
    expect(maria(w)).toEqual({ r: 0, c: 0 })
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Lauf zu den Jüngern.')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Die Gassen von Jerusalem von oben. Maria steht am Gartentor.')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-maria').attributes('aria-label')).toBe('Maria Magdalena, Reihe 1, Spalte 1')
    expect(w.find('.gm-maria').attributes('role')).toBe('img')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(problems()).toEqual([])
  })

  it('the tiles are pictures turned by CSS to fit their neighbours', () => {
    const w = mountIt()
    const cell = (r: number, c: number) => w.find(`[data-cell="${r}-${c}"]`)
    expect(cell(0, 2).classes()).toContain('corner')
    expect(cell(0, 2).find('.gm-turn').attributes('style')).toContain('rotate(180deg)')
    expect(cell(0, 2).find('img').attributes('src')).toContain('ecke')
    expect(cell(0, 1).find('.gm-turn').attributes('style')).toContain('rotate(90deg)')
    expect(cell(2, 2).classes()).toContain('tee')
    expect(cell(2, 0).classes()).toContain('dead')
    expect(cell(0, 0).classes()).toContain('start')
    expect(cell(4, 4).classes()).toContain('goal')
    expect(cell(0, 3).classes()).toContain('roof')
    expect(w.find('svg').exists()).toBe(false)
  })

  it('a tap on a lane in a straight line: Mary walks there cell by cell, and the steps count for "Go on"', async () => {
    const w = mountIt()
    await tap(w, 0, 2)
    expect(count('tap')).toBe(1)
    expect(w.find('.gm-maria').classes()).toContain('walking')
    await tick(10)
    expect(maria(w)).toEqual({ r: 0, c: 1 })
    await tick(500)
    expect(maria(w)).toEqual({ r: 0, c: 2 })
    expect(w.find('.gm-maria').classes()).not.toContain('walking')
    expect(useTaskProgress().parts.value).toBe(2)
    await tap(w, 2, 2)
    await tick(600)
    expect(maria(w)).toEqual({ r: 2, c: 2 })
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('a tap that is not in a straight line, or on a roof, only gets a word (no mistake)', async () => {
    const w = mountIt()
    await tap(w, 2, 2)
    expect(w.text()).toContain('Maria läuft nur geradeaus.')
    expect(maria(w)).toEqual({ r: 0, c: 0 })
    await tap(w, 0, 3)
    expect(w.text()).toContain('Das ist ein Dach.')
    await tick(3000)
    expect(count('wrong')).toBe(0)
    expect(maria(w)).toEqual({ r: 0, c: 0 })
  })

  it('a swipe runs along the lane round the corner to the next branching; into a house nothing happens', async () => {
    const w = mountIt()
    await swipe(w, 60, 4)
    await tick(1200)
    expect(maria(w)).toEqual({ r: 2, c: 2 })
    await swipe(w, 0, 60)
    expect(w.text()).toContain('Da ist ein Haus im Weg.')
    expect(maria(w)).toEqual({ r: 2, c: 2 })
  })

  it('a dead end with a well: a cross, "Hier geht es nicht weiter", a low tone, a mistake; Mary goes one step back', async () => {
    const w = mountIt()
    await key(w, 'ArrowRight')
    await key(w, 'ArrowLeft', 2 * 220 + 20)
    expect(maria(w)).toEqual({ r: 2, c: 0 })
    expect(w.find('.gm-maria .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Hier geht es nicht weiter.')
    expect(count('wrong')).toBe(1)
    await tick(950)
    expect(maria(w)).toEqual({ r: 2, c: 1 })
    expect(w.find('.gm-maria .gm-mark').exists()).toBe(false)
    // no step counts twice for "Go on": the dead end is not nearer to the house
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('the keyboard: Enter without a mark says how the keys work', async () => {
    const w = mountIt()
    await key(w, 'Enter', 0)
    expect(w.text()).toContain('Mit den Pfeiltasten läuft Maria')
    expect(maria(w)).toEqual({ r: 0, c: 0 })
  })

  it('a button "Hilf mir" shows after fifteen seconds: it marks the next stop, Enter sends Mary there', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(w.find('[data-cell="0-2"]').classes()).toContain('hint')
    expect(w.text()).toContain('Lauf bis zur markierten Gasse.')
    expect(w.text()).not.toContain('Hilf mir')
    await key(w, 'Enter', 600)
    expect(maria(w)).toEqual({ r: 0, c: 2 })
    expect(w.findAll('.gm-cell.hint')).toHaveLength(0)
  })

  it('both rounds: at the house a tick and a word, then 6 x 7 lanes; at the end the words of the Bible and three stars', async () => {
    const w = mountIt()
    await playRound1(w)
    expect(maria(w)).toEqual({ r: 4, c: 4 })
    expect(w.find('.gm-maria .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Maria ist bei den Jüngern!')
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(2700)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-cell')).toHaveLength(42)
    expect(w.findAll('.gm-cell.dead')).toHaveLength(3)
    layout(w)
    expect(maria(w)).toEqual({ r: 0, c: 0 })
    await playRound2(w)
    expect(maria(w)).toEqual({ r: 5, c: 6 })
    await tick(2000)
    expect(played).toContain('star')
    expect(w.text()).toContain('Ich habe den HERRN gesehen')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(19)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three times into the dead end gives two stars', async () => {
    const w = mountIt()
    await key(w, 'ArrowRight')
    for (let i = 0; i < 3; i++) await key(w, 'ArrowLeft', 1600)
    expect(count('wrong')).toBe(3)
    expect(maria(w)).toEqual({ r: 2, c: 1 })
    await key(w, 'ArrowRight')
    await key(w, 'ArrowRight')
    await tick(2700)
    layout(w)
    await playRound2(w)
    await tick(2000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(3)])
    expect(osterStars(3)).toBe(2)
  })

  it('"Go on" gives one star after a third of the steps', async () => {
    const w = mountIt()
    await playRound1(w)
    const goal = useTaskProgress().goal.value
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
  })

  it('less motion: Mary is at the place at once', async () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as never
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    expect(maria(w)).toEqual({ r: 2, c: 2 })
    expect(w.find('.gm-maria').classes()).not.toContain('walking')
  })

  it('English and Spanish words', async () => {
    const en = mountIt(ERRAND, 'en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The lanes of Jerusalem')
    await tap(en, 2, 2)
    expect(en.text()).toContain('Mary only runs straight ahead.')
    const es = mountIt(ERRAND, 'es')
    expect(es.find('.gm-maria').attributes('aria-label')).toBe('María Magdalena, fila 1, columna 1')
    await tap(es, 0, 3)
    expect(es.text()).toContain('Eso es un tejado.')
  })
})

// ---------------------------------------------------------------- the shutters
const row4 = [10, 32, 54, 76].map((x) => ({ x, y: 30, w: 14, h: 30 }))
const grid6 = [15, 57].flatMap((y) => [14, 43, 72].map((x) => ({ x, y, w: 14, h: 28 })))
const SHUT: ShuttersGame = {
  shutter: 'laden',
  lights: ['licht-1', 'licht-2', 'licht-3', 'licht-4', 'licht-5', 'licht-6'],
  rounds: [
    { hint: 'Mach alle Fenster hell.', background: 'haus-1', windows: row4, links: [[1], [0, 2], [1, 3], [2]], start: [false, false, false, false], par: 2 },
    {
      hint: 'Jetzt sind es sechs.',
      background: 'haus-2',
      ratio: 4 / 3,
      windows: grid6,
      links: [
        [1, 3],
        [0, 2, 4],
        [1, 5],
        [0, 4],
        [1, 3, 5],
        [2, 4]
      ],
      start: [true, true, true, false, true, false],
      par: 3
    }
  ]
}

describe('Fensterläden (fensterlaeden)', () => {
  const mountIt = (game: ShuttersGame = SHUT, locale: 'de' | 'en' | 'es' = 'de') => mount(GameFensterlaeden, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const win = (w: W, i: number) => w.find(`[data-win="${i}"]`)
  const press = async (w: W, i: number) => {
    await win(w, i).trigger('click')
    await flushPromises()
  }
  const openOnes = (w: W) => w.findAll('.gm-win').map((el) => el.classes().includes('open'))
  const solveRound = async (w: W, ri: number) => {
    const r = SHUT.rounds[ri]!
    for (const i of shuttersBest(r.start, r.links)!.taps) await press(w, i)
  }

  it('the sample data are in order; the goal is every closed window (4 + 2); four windows with a light and a shutter, all closed', () => {
    expect(shuttersProblems(SHUT)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('.gm-win')).toHaveLength(4)
    expect(w.findAll('.gm-win .gm-light img')).toHaveLength(4)
    expect(w.findAll('.gm-win .gm-shutter img')).toHaveLength(4)
    expect(openOnes(w)).toEqual([false, false, false, false])
    expect(win(w, 0).attributes('aria-label')).toBe('Fenster 1: zu')
    expect(win(w, 0).attributes('role')).toBe('button')
    expect(win(w, 0).attributes('tabindex')).toBe('0')
    expect(win(w, 2).attributes('style')).toContain('left: 54%')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Mach alle Fenster hell.')
    expect(w.text()).toContain('Offen: 0 von 4')
    expect(w.text()).toContain('Züge: 0 (es geht mit 2)')
    expect(w.find('.gm-field').attributes('style')).toContain('haus-1')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a tap turns the shutter and those of the neighbours; the open windows count for "Go on"', async () => {
    const w = mountIt()
    await press(w, 0)
    expect(openOnes(w)).toEqual([true, true, false, false])
    expect(win(w, 0).attributes('aria-label')).toBe('Fenster 1: offen')
    expect(win(w, 0).attributes('aria-pressed')).toBe('true')
    expect(count('flip')).toBe(1)
    expect(w.text()).toContain('Offen: 2 von 4')
    expect(w.text()).toContain('Züge: 1 (es geht mit 2)')
    expect(useTaskProgress().parts.value).toBe(2)
    await press(w, 1)
    expect(openOnes(w)).toEqual([false, false, true, false])
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('the keyboard: the arrows go from window to window, Enter and the space bar turn the shutter', async () => {
    const w = mountIt()
    ;(win(w, 0).element as HTMLElement).focus()
    await win(w, 0).trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(win(w, 1).element)
    await win(w, 1).trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(win(w, 0).element)
    await win(w, 0).trigger('keydown', { key: 'Enter' })
    expect(openOnes(w)).toEqual([true, true, false, false])
    await win(w, 3).trigger('keydown', { key: ' ' })
    expect(openOnes(w)).toEqual([true, true, true, true])
    expect(w.text()).toContain('Alle Fenster sind hell!')
  })

  it('two moves over par are a mistake: a cross and a word, a low tone', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) await press(w, 1)
    expect(count('wrong')).toBe(0)
    await press(w, 1)
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-moves .gm-bad').exists()).toBe(true)
    expect(w.text()).toContain('Zwei Züge zu viel. Es geht auch mit weniger.')
    expect(w.text()).toContain('Züge: 4 (es geht mit 2)')
    await tick(3100)
    expect(w.find('.gm-moves .gm-bad').exists()).toBe(false)
  })

  it('a button "Hilf mir" shows after fifteen seconds; it marks a window of a shortest solution and gives it the focus', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()
    const marked = w.findAll('.gm-win.hint')
    expect(marked).toHaveLength(1)
    const i = Number(marked[0]!.attributes('data-win'))
    expect([0, 3]).toContain(i)
    expect(document.activeElement).toBe(win(w, i).element)
    expect(w.text()).toContain('Tipp auf das markierte Fenster.')
    await press(w, i)
    expect(w.findAll('.gm-win.hint')).toHaveLength(0)
  })

  it('both rounds: every window bright with a tick, then six windows in two rows; at the end the words of the Bible and three stars', async () => {
    const w = mountIt()
    await solveRound(w, 0)
    expect(w.text()).toContain('Alle Fenster sind hell!')
    expect(w.findAll('.gm-win .gm-mark')).toHaveLength(4)
    // between the rounds a tap does nothing
    await press(w, 0)
    expect(openOnes(w)).toEqual([true, true, true, true])
    await tick(400)
    expect(played).toContain('right')
    await tick(2500)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-win')).toHaveLength(6)
    expect(w.find('.gm-field').attributes('style')).toContain('haus-2')
    expect(openOnes(w)).toEqual([true, true, true, false, true, false])
    expect(w.text()).toContain('Züge: 0 (es geht mit 3)')
    await solveRound(w, 1)
    expect(w.text()).toContain('Alle Fenster sind hell!')
    await tick(2100)
    expect(played).toContain('star')
    expect(w.text()).toContain('Friede sei mit euch!')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(6)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('the stars follow the moves over par: six too many in round 1 give osterStars(3)', async () => {
    const w = mountIt()
    for (let i = 0; i < 6; i++) await press(w, 1)
    await solveRound(w, 0)
    await tick(2900)
    await solveRound(w, 1)
    await tick(2100)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(3)])
    expect(osterStars(3)).toBe(2)
  })

  it('"Go on" gives one star after round 1', async () => {
    const w = mountIt()
    await solveRound(w, 0)
    expect(partialStars(useTaskProgress().parts.value, useTaskProgress().goal.value)).toBeGreaterThanOrEqual(1)
  })

  it('English and Spanish words', async () => {
    const en = mountIt(SHUT, 'en')
    expect(en.text()).toContain('Open: 0 of 4')
    expect(en.text()).toContain('Moves: 0 (it can be done in 2)')
    expect(en.find('[data-win="0"]').attributes('aria-label')).toBe('Window 1: closed')
    const es = mountIt(SHUT, 'es')
    expect(es.text()).toContain('Abiertas: 0 de 4')
    expect(es.find('[data-win="0"]').attributes('aria-label')).toBe('Ventana 1: cerrada')
  })
})
