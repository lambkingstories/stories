/**
 * The three new games of "Jesus ruft seine Freunde", mounted with the real data of the adventure and played through: "Das Lot" (`lot` = GameLot: the boat follows the finger and the arrow keys, the lead goes down and
 * reads the depth, a cast in shallow water is a mistake, both rounds, "Help me", less motion), "Sitzplätze" (`sitzplaetze` = GameSitzplaetze: a bench follows the finger as far as it can go, the arrow keys, the moves over par,
 * both rounds along the shortest way, "Help me") and "Die Zwölf" (`zwoelf` = GameZwoelf: the called name, right and wrong taps, the list, both rounds, the keys, "Help me"); the goal for "Go on" (`useTaskProgress`),
 * the end with its stars and the words of the Bible in German, English and Spanish. The new words are mixed into the messages of the app here (the same as in D:\Claude\Spiele-Neu\freunde\INTEGRATION.json).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import GameLot from '@/components/molecules/games/GameLot.vue'
import GameSitzplaetze from '@/components/molecules/games/GameSitzplaetze.vue'
import GameZwoelf from '@/components/molecules/games/GameZwoelf.vue'
import { freunde } from '@/data/adventures/freunde'
import { partialStars } from '@/utils/adventureScore'
import { osterStars } from '@/utils/osternGames'
import { plumbFathoms, plumbHandX, plumbProblems, plumbTarget, seatsBest, seatsProblems, twelveProblems } from '@/utils/freundeNeu'
import type { PlumbGame, SeatsGame, TwelveGame } from '@/utils/freundeNeu'

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

/** The new words (the same as in D:\Claude\Spiele-Neu\freunde\INTEGRATION.json). */
const NEW = {
  de: {
    plumbField: "Der See Genezareth von der Seite. Simons Boot schwimmt oben auf dem Wasser.",
    plumbBoat: "Simons Boot, Stelle {n} von 100",
    plumbLead: "Das Lot an seiner Leine",
    plumbNoDepth: "Lass das Lot hinunter, dann siehst du, wie tief es ist.",
    plumbLower: "Lot hinunterlassen",
    plumbRaise: "Lot hochziehen",
    plumbCast: "Hier das Netz auswerfen",
    plumbDepth: "Tiefe: {n} Klafter",
    plumbRight: "{n} Klafter: Das ist tief genug! Simon wirft das Netz aus.",
    plumbShallow: "Nur {n} Klafter: Hier ist es zu flach, das Netz braucht {deep}. Such eine tiefere Stelle.",
    plumbHelp: "Hilf mir",
    plumbHelpSay: "Das Boot fährt zu einer tiefen Stelle. Lass dort das Lot hinunter.",
    plumbDone: "Und Simon antwortete und sprach zu ihm: Meister, wir haben die ganze Nacht gearbeitet und nichts gefangen, aber auf dein Wort will ich das Netz auswerfen.",
    seatsField: "Levis Haus von oben. Am langen Tisch liegen Matten für die Gäste, auf dem Boden stehen Bänke.",
    seatsBench: "Bank mit {n} Plätzen, Reihe {r}, Spalte {c}",
    seatsGuests: "Levi begrüßt seine Gäste.",
    seatsCount: "Plätze besetzt: {n} von {total}",
    seatsMoves: "Züge: {n} (es geht mit {par})",
    seatsTooMany: "Drei Züge zu viel. Es geht auch mit weniger.",
    seatsAll: "Alle Gäste haben einen Platz!",
    seatsStuck: "Da ist etwas im Weg. Die Bank kann nicht weiter.",
    seatsKeys: "Mit den Pfeiltasten schiebst du die Bank, die du ausgewählt hast.",
    seatsHelp: "Hilf mir",
    seatsHelpSay: "Schiebe die markierte Bank nach {dir}.",
    seatsDir0: "oben",
    seatsDir1: "rechts",
    seatsDir2: "unten",
    seatsDir3: "links",
    seatsDone: "Und Levi richtete ihm ein großes Mahl zu in seinem Hause, und viele Zöllner und andere saßen mit ihm zu Tisch.",
    twelveField: "Der Berg. Zwölf Freunde von Jesus stehen am Hang.",
    twelveFigure: "Freund {n}: {sign}",
    twelveFoundLabel: "{name}, gefunden",
    twelveAgain: "{name} hast du schon gefunden.",
    twelveRight: "Richtig: {name}!",
    twelveWrong: "Das ist {other}. Gesucht ist {name}: {sign}.",
    twelveAll: "Alle Namen sind gefunden!",
    twelveList: "Gefunden: {n} von {total}",
    twelveHelp: "Hilf mir",
    twelveHelpSay: "Der markierte Freund ist {name}.",
    twelveDone: "Und er ordnete die Zwölf, daß sie bei ihm sein sollten und daß er sie aussendete, zu predigen."
  },
  en: {
    plumbField: "The Sea of Galilee seen from the side. Simon's boat floats on the water.",
    plumbBoat: "Simon's boat, place {n} of 100",
    plumbLead: "The lead on its line",
    plumbNoDepth: "Let the lead down to see how deep it is.",
    plumbLower: "Let the lead down",
    plumbRaise: "Pull the lead up",
    plumbCast: "Cast the net here",
    plumbDepth: "Depth: {n} fathoms",
    plumbRight: "{n} fathoms: that is deep enough! Simon casts the net.",
    plumbShallow: "Only {n} fathoms: it is too shallow here, the net needs {deep}. Look for a deeper place.",
    plumbHelp: "Help me",
    plumbHelpSay: "The boat sails to a deep place. Let the lead down there.",
    plumbDone: "And Simon answering said unto him, Master, we have toiled all the night, and have taken nothing: nevertheless at thy word I will let down the net.",
    seatsField: "Levi's house from above. Mats for the guests lie at the long table, and benches stand on the floor.",
    seatsBench: "Bench with {n} seats, row {r}, column {c}",
    seatsGuests: "Levi welcomes his guests.",
    seatsCount: "Seats taken: {n} of {total}",
    seatsMoves: "Moves: {n} (it can be done in {par})",
    seatsTooMany: "Three moves too many. It can be done with fewer.",
    seatsAll: "Every guest has a seat!",
    seatsStuck: "Something is in the way. The bench cannot go further.",
    seatsKeys: "With the arrow keys you push the bench you have chosen.",
    seatsHelp: "Help me",
    seatsHelpSay: "Push the marked bench {dir}.",
    seatsDir0: "up",
    seatsDir1: "to the right",
    seatsDir2: "down",
    seatsDir3: "to the left",
    seatsDone: "And Levi made him a great feast in his own house: and there was a great company of publicans and of others that sat down with them.",
    twelveField: "The mountain. Twelve friends of Jesus stand on the slope.",
    twelveFigure: "Friend {n}: {sign}",
    twelveFoundLabel: "{name}, found",
    twelveAgain: "You have already found {name}.",
    twelveRight: "Right: {name}!",
    twelveWrong: "That is {other}. You are looking for {name}: {sign}.",
    twelveAll: "All the names are found!",
    twelveList: "Found: {n} of {total}",
    twelveHelp: "Help me",
    twelveHelpSay: "The marked friend is {name}.",
    twelveDone: "And he ordained twelve, that they should be with him, and that he might send them forth to preach."
  },
  es: {
    plumbField: "El mar de Galilea visto de lado. La barca de Simón flota sobre el agua.",
    plumbBoat: "La barca de Simón, lugar {n} de 100",
    plumbLead: "La plomada en su cuerda",
    plumbNoDepth: "Baja la plomada para ver qué profundo es.",
    plumbLower: "Bajar la plomada",
    plumbRaise: "Subir la plomada",
    plumbCast: "Echar aquí la red",
    plumbDepth: "Profundidad: {n} brazas",
    plumbRight: "{n} brazas: ¡es bastante profundo! Simón echa la red.",
    plumbShallow: "Solo {n} brazas: aquí hay poca agua, la red necesita {deep}. Busca un lugar más profundo.",
    plumbHelp: "Ayúdame",
    plumbHelpSay: "La barca va a un lugar profundo. Baja allí la plomada.",
    plumbDone: "Y respondiendo Simón, le dijo: Maestro, habiendo trabajado toda la noche, nada hemos tomado; mas en tu palabra echaré la red.",
    seatsField: "La casa de Leví desde arriba. En la mesa larga hay esteras para los invitados y en el suelo hay bancos.",
    seatsBench: "Banco con {n} asientos, fila {r}, columna {c}",
    seatsGuests: "Leví da la bienvenida a sus invitados.",
    seatsCount: "Asientos ocupados: {n} de {total}",
    seatsMoves: "Movimientos: {n} (se puede con {par})",
    seatsTooMany: "Tres movimientos de más. Se puede con menos.",
    seatsAll: "¡Todos los invitados tienen asiento!",
    seatsStuck: "Hay algo en el camino. El banco no puede ir más lejos.",
    seatsKeys: "Con las flechas empujas el banco que has elegido.",
    seatsHelp: "Ayúdame",
    seatsHelpSay: "Empuja el banco marcado {dir}.",
    seatsDir0: "hacia arriba",
    seatsDir1: "hacia la derecha",
    seatsDir2: "hacia abajo",
    seatsDir3: "hacia la izquierda",
    seatsDone: "E hizo Leví gran banquete en su casa; y había mucha compañía de publicanos y de otros, los cuales estaban a la mesa con ellos.",
    twelveField: "El monte. Doce amigos de Jesús están en la ladera.",
    twelveFigure: "Amigo {n}: {sign}",
    twelveFoundLabel: "{name}, encontrado",
    twelveAgain: "Ya has encontrado a {name}.",
    twelveRight: "¡Correcto: {name}!",
    twelveWrong: "Ese es {other}. Buscas a {name}: {sign}.",
    twelveAll: "¡Todos los nombres están encontrados!",
    twelveList: "Encontrados: {n} de {total}",
    twelveHelp: "Ayúdame",
    twelveHelpSay: "El amigo marcado es {name}.",
    twelveDone: "Y estableció doce, para que estuviesen con él, y para enviarlos a predicar."
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
const originalMatchMedia = window.matchMedia
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
  window.matchMedia = originalMatchMedia
  setAdventureLanguage('de')
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const lessMotion = () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as never
}
const task = (n: number) => freunde.stages[n - 1]!.task as unknown as { plumb?: PlumbGame; seats?: SeatsGame; twelve?: TwelveGame }

// ================================================================ the sounding lead
const LOT = task(2).plumb!

describe('Das Lot (lot)', () => {
  /** The field is 400 pixels wide, so one pixel is a quarter of a percent. */
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de', game: PlumbGame = LOT) => {
    const w = mount(GameLot, { props: { game }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 400, bottom: 300 })
    return w
  }
  type W = ReturnType<typeof mountIt>
  const button = (w: W, label: string) => w.findAll('button').find((b) => b.text() === label)
  /** A finger on the water at a place in percent of the width. */
  const drive = async (w: W, x: number) => {
    pointer(w.find('.gm-field').element, 'pointerdown', x * 4, 100)
    pointer(window, 'pointerup', x * 4, 100)
    await flushPromises()
  }
  const boatX = (w: W) => parseFloat((w.find('.gm-boat').element as HTMLElement).style.left)
  const lower = async (w: W) => {
    await button(w, 'Lot hinunterlassen')!.trigger('click')
    await tick(1000)
  }
  const target = (round: number) => plumbTarget(LOT, LOT.rounds[round]!, LOT.rounds[round]!.start)!
  const solveRound = async (w: W, round: number) => {
    await drive(w, target(round))
    await lower(w)
    await button(w, 'Hier das Netz auswerfen')!.trigger('click')
    await flushPromises()
  }

  it('the real data are in order; the goal is one cast per round; boat, lead and line are pictures; the boat is at the start, no depth is shown yet', () => {
    expect(plumbProblems(LOT)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.findAll('.gm-field img')).toHaveLength(3)
    expect(w.find('svg').exists()).toBe(false)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Das Netz braucht mindestens 12 Klafter Wasser.')
    expect(w.text()).toContain('Lass das Lot hinunter, dann siehst du, wie tief es ist.')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Der See Genezareth von der Seite. Simons Boot schwimmt oben auf dem Wasser.')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-boat').attributes('aria-label')).toBe('Simons Boot, Stelle 22 von 100')
    expect(w.find('.gm-boat').attributes('role')).toBe('img')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(button(w, 'Lot hinunterlassen')).toBeTruthy()
    expect(button(w, 'Hier das Netz auswerfen')).toBeUndefined()
    expect(w.findAll('.gm-tick').map((t) => t.text())).toEqual(['5', '10', '15', '20'])
    expect(problems()).toEqual([])
  })

  it('a finger on the water drives the boat (kept in its range); the lead goes down and shows the depth in fathoms; the depth is the one under the hand of Simon', async () => {
    const w = mountIt()
    await drive(w, 50)
    expect(boatX(w)).toBeCloseTo(50, 3)
    expect(w.find('.gm-boat').attributes('aria-label')).toBe('Simons Boot, Stelle 50 von 100')
    await drive(w, 99)
    expect(boatX(w)).toBe(LOT.rounds[0]!.range[1])
    await drive(w, 1)
    expect(boatX(w)).toBe(LOT.rounds[0]!.range[0])
    await drive(w, 40)
    await button(w, 'Lot hinunterlassen')!.trigger('click')
    expect(count('tap')).toBe(1)
    expect(button(w, 'Lot hinunterlassen')).toBeUndefined()
    await tick(1000)
    const n = plumbFathoms(LOT.rounds[0]!.bottom, plumbHandX(LOT.boat, 40))
    expect(w.find('.gm-depth').text()).toBe(`Tiefe: ${n} Klafter`)
    expect(count('clunk')).toBe(1)
    expect(button(w, 'Hier das Netz auswerfen')).toBeTruthy()
    expect(button(w, 'Lot hochziehen')).toBeTruthy()
    expect(problems()).toEqual([])
  })

  it('driving on pulls the lead up; "Lot hochziehen" does too', async () => {
    const w = mountIt()
    await lower(w)
    expect(w.find('.gm-depth').text()).toMatch(/Tiefe: \d+ Klafter/)
    await drive(w, 60)
    expect(w.find('.gm-depth').text()).toBe('Lass das Lot hinunter, dann siehst du, wie tief es ist.')
    expect(button(w, 'Lot hinunterlassen')).toBeTruthy()
    await lower(w)
    await button(w, 'Lot hochziehen')!.trigger('click')
    expect(button(w, 'Lot hinunterlassen')).toBeTruthy()
    expect(w.text()).not.toContain('zu flach')
  })

  it('a cast in shallow water is a mistake: a cross, "zu flach" with the number and the depth that is needed, a low tone; after a moment the lead is up again', async () => {
    const w = mountIt()
    await lower(w)
    await button(w, 'Hier das Netz auswerfen')!.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-mark.bad').exists()).toBe(true)
    expect(w.find('.gm-fb').text()).toMatch(/^Nur \d+ Klafter: Hier ist es zu flach, das Netz braucht 12\./)
    expect(button(w, 'Hier das Netz auswerfen')).toBeUndefined()
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1600)
    expect(w.find('.gm-mark.bad').exists()).toBe(false)
    expect(button(w, 'Lot hinunterlassen')).toBeTruthy()
  })

  it('both rounds: the right cast gives a tick and a word and counts for "Go on"; round 2 is deeper and narrower; at the end the words of the Bible and the stars', async () => {
    const w = mountIt()
    await solveRound(w, 0)
    expect(w.find('.gm-mark.good').exists()).toBe(true)
    expect(w.text()).toMatch(/Klafter: Das ist tief genug! Simon wirft das Netz aus\./)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(2800)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Das Netz braucht mindestens 14 Klafter.')
    expect(boatX(w)).toBe(LOT.rounds[1]!.start)
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 400, bottom: 300 })
    // a decoy first: 12 or 13 fathoms are not enough
    await drive(w, 22 + 0)
    await lower(w)
    await button(w, 'Hier das Netz auswerfen')!.trigger('click')
    await tick(1600)
    expect(count('wrong')).toBe(1)
    await solveRound(w, 1)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2000)
    expect(played).toContain('star')
    expect(w.text()).toContain('aber auf dein Wort will ich das Netz auswerfen')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('no mistake at all gives three stars; "Go on" gives a star after one of the two casts', async () => {
    const w = mountIt()
    await solveRound(w, 0)
    expect(partialStars(useTaskProgress().parts.value, useTaskProgress().goal.value)).toBe(1)
    await tick(2800)
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 400, bottom: 300 })
    await solveRound(w, 1)
    await tick(2000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
  })

  it('the keyboard: the arrows drive the boat, the arrow down and Enter let the lead down, Enter casts, the arrow up pulls the lead up', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    const x0 = boatX(w)
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(boatX(w)).toBeCloseTo(x0 + 3, 6)
    await f.trigger('keydown', { key: 'ArrowLeft' })
    await f.trigger('keydown', { key: 'ArrowLeft' })
    // 22 - 3 would be 19: the boat stops at the left end of its range (20)
    expect(boatX(w)).toBe(LOT.rounds[0]!.range[0])
    await f.trigger('keydown', { key: 'ArrowDown' })
    await tick(1000)
    expect(button(w, 'Hier das Netz auswerfen')).toBeTruthy()
    await f.trigger('keydown', { key: 'ArrowUp' })
    expect(button(w, 'Lot hinunterlassen')).toBeTruthy()
    await f.trigger('keydown', { key: 'Enter' })
    await tick(1000)
    await f.trigger('keydown', { key: 'Enter' })
    expect(count('wrong')).toBe(1)
    // the arrow keys alone reach the deep place of round 1
    const w2 = mountIt()
    const f2 = w2.find('.gm-field')
    for (let i = 0; i < 14; i++) await f2.trigger('keydown', { key: 'ArrowRight' })
    await f2.trigger('keydown', { key: 'Enter' })
    await tick(1000)
    await f2.trigger('keydown', { key: ' ' })
    expect(w2.text()).toContain('Das ist tief genug!')
  })

  it('a button "Hilf mir" shows after fifteen seconds: the boat drives to the deep place, marked with a dashed frame, and says where to let the lead down', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = button(w, 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(boatX(w)).toBeCloseTo(target(0), 3)
    expect(w.find('.gm-boat').classes()).toContain('help')
    expect(w.text()).toContain('Das Boot fährt zu einer tiefen Stelle.')
    expect(w.text()).not.toContain('Hilf mir')
    await lower(w)
    await button(w, 'Hier das Netz auswerfen')!.trigger('click')
    expect(count('right')).toBe(1)
  })

  it('less motion: the lead is down at once', async () => {
    lessMotion()
    const w = mountIt()
    await button(w, 'Lot hinunterlassen')!.trigger('click')
    expect(button(w, 'Hier das Netz auswerfen')).toBeTruthy()
    expect(w.find('.gm-depth').text()).toMatch(/Tiefe: \d+ Klafter/)
  })

  it('English and Spanish words and verses; the fathoms are "brazas" in Spanish', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The Sea of Galilee')
    expect(en.find('.gm-boat').attributes('aria-label')).toBe("Simon's boat, place 22 of 100")
    await en.findAll('button').find((b) => b.text() === 'Let the lead down')!.trigger('click')
    await tick(1000)
    expect(en.find('.gm-depth').text()).toMatch(/^Depth: \d+ fathoms$/)
    const es = mountIt('es')
    expect(es.find('.gm-boat').attributes('aria-label')).toBe('La barca de Simón, lugar 22 de 100')
    await es.findAll('button').find((b) => b.text() === 'Bajar la plomada')!.trigger('click')
    await tick(1000)
    expect(es.find('.gm-depth').text()).toMatch(/^Profundidad: \d+ brazas$/)
    // the end of the game: the verse in the three languages
    for (const [loc, verse] of [['en', 'nevertheless at thy word I will let down the net'], ['es', 'mas en tu palabra echaré la red']] as const) {
      const g = mountIt(loc)
      for (let r = 0; r < 2; r++) {
        boxes.set(g.find('.gm-field').element, { left: 0, top: 0, right: 400, bottom: 300 })
        await drive(g, target(r))
        await g.find('.gm-field').trigger('keydown', { key: 'Enter' })
        await tick(1000)
        await g.find('.gm-field').trigger('keydown', { key: 'Enter' })
        await tick(2900)
      }
      expect(g.text()).toContain(verse)
    }
  })
})

// ================================================================ the seats
const SEATS = task(7).seats!

describe('Sitzplätze (sitzplaetze)', () => {
  /** The field is 500 pixels wide: 100 pixels a cell in round 1 (5 columns), 83 in round 2 (6 columns). */
  const rect = (w: ReturnType<typeof mount>) => boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 500, bottom: 500 })
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de', game: SeatsGame = SEATS) => {
    const w = mount(GameSitzplaetze, { props: { game }, ...opts(locale) })
    rect(w)
    return w
  }
  type W = ReturnType<typeof mountIt>
  const bench = (w: W, id: string) => w.find(`[data-bench="${id}"]`)
  const left = (w: W, id: string) => (bench(w, id).element as HTMLElement).style.left
  const top = (w: W, id: string) => (bench(w, id).element as HTMLElement).style.top
  const drag = async (w: W, id: string, dx: number, dy: number) => {
    pointer(bench(w, id).element, 'pointerdown', 250, 250)
    pointer(window, 'pointermove', 250 + dx / 2, 250 + dy / 2)
    pointer(window, 'pointermove', 250 + dx, 250 + dy)
    pointer(window, 'pointerup', 250 + dx, 250 + dy)
    await flushPromises()
  }
  const keys = async (w: W, id: string, key: string, n = 1) => {
    for (let i = 0; i < n; i++) await bench(w, id).trigger('keydown', { key })
  }
  const ARROW = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']
  const solveByKeys = async (w: W, round: number) => {
    const r = SEATS.rounds[round]!
    const best = seatsBest(r.rows, r.mats, r.benches, r.benches.map((b) => ({ r: b.r, c: b.c })))!
    for (const m of best.path) await keys(w, r.benches[m.i]!.id, ARROW[m.dir]!, m.k)
  }

  it('the real data are in order; the goal is every mat (2 + 3); the pictures of the floor, the table, the mats and the benches; the guests above; the counts', () => {
    expect(seatsProblems(SEATS)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('.gm-bench')).toHaveLength(6)
    expect(w.findAll('.gm-mat')).toHaveLength(2)
    expect(w.find('.gm-table img').exists()).toBe(true)
    expect(w.find('.gm-guests').attributes('aria-label')).toBe('Levi begrüßt seine Gäste')
    expect(w.find('.gm-field').attributes('style')).toContain('boden')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Plätze besetzt: 0 von 2')
    expect(w.text()).toContain('Züge: 0 (es geht mit 4)')
    expect(bench(w, 'd').attributes('aria-label')).toBe('Bank mit 3 Plätzen, Reihe 1, Spalte 1')
    expect(bench(w, 'a').attributes('role')).toBe('button')
    expect(bench(w, 'a').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a finger pushes a bench as far as it goes: two cells to the right cover the mat and count for "Go on"; the up-and-down bench is the picture turned', async () => {
    const w = mountIt()
    expect(left(w, 'b')).toBe('20%')
    await drag(w, 'b', 200, 0)
    expect(left(w, 'b')).toBe('60%')
    expect(top(w, 'b')).toBe('60%')
    expect(count('snap')).toBe(1)
    expect(w.text()).toContain('Plätze besetzt: 1 von 2')
    expect(w.text()).toContain('Züge: 1 (es geht mit 4)')
    expect(w.findAll('.gm-spot .gm-mark')).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(bench(w, 'd').classes()).toContain('v')
    expect((bench(w, 'd').element as HTMLElement).style.getPropertyValue('--len')).toBe('3')
    // pushed further than it can go: it stops at the wall of the room
    await drag(w, 'b', 400, 0)
    expect(left(w, 'b')).toBe('60%')
    await drag(w, 'd', 0, 300)
    expect(top(w, 'd')).toBe('40%')
    expect(problems()).toEqual([])
  })

  it('a bench that cannot go there stays and a word says why (no mistake, no move); a tap only gives the bench the focus', async () => {
    const w = mountIt()
    await drag(w, 'b', 0, -100)
    expect(top(w, 'b')).toBe('60%')
    expect(w.text()).toContain('Da ist etwas im Weg. Die Bank kann nicht weiter.')
    expect(w.text()).toContain('Züge: 0')
    pointer(bench(w, 'e').element, 'pointerdown', 250, 250)
    pointer(window, 'pointerup', 250, 250)
    await flushPromises()
    expect(document.activeElement).toBe(bench(w, 'e').element)
    expect(w.text()).toContain('Züge: 0')
    expect(count('wrong')).toBe(0)
  })

  it('the arrow keys push the focused bench one cell; keys in one direction on one bench are one move', async () => {
    const w = mountIt()
    await keys(w, 'b', 'ArrowRight')
    expect(left(w, 'b')).toBe('40%')
    await keys(w, 'b', 'ArrowRight')
    expect(left(w, 'b')).toBe('60%')
    expect(w.text()).toContain('Züge: 1 (es geht mit 4)')
    await keys(w, 'b', 'ArrowRight')
    expect(w.text()).toContain('Da ist etwas im Weg.')
    await keys(w, 'b', 'ArrowLeft')
    expect(w.text()).toContain('Züge: 2')
    await bench(w, 'b').trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Mit den Pfeiltasten schiebst du die Bank')
  })

  it('both rounds along the shortest way: a tick and a word, then the 6 x 6 room with the jar and the basket; at the end the words of the Bible and three stars', async () => {
    const w = mountIt()
    await solveByKeys(w, 0)
    expect(w.text()).toContain('Alle Gäste haben einen Platz!')
    expect(w.findAll('.gm-spot .gm-mark')).toHaveLength(2)
    await tick(300)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2800)
    rect(w)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-bench')).toHaveLength(9)
    expect(w.findAll('.gm-mat')).toHaveLength(3)
    expect(w.findAll('.gm-thing')).toHaveLength(2)
    expect(w.text()).toContain('Plätze besetzt: 0 von 3')
    await solveByKeys(w, 1)
    expect(w.text()).toContain('Alle Gäste haben einen Platz!')
    await tick(2000)
    expect(played).toContain('star')
    expect(w.text()).toContain('viele Zöllner und andere saßen mit ihm zu Tisch')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(5)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('three moves over the fewest are a mistake: a cross and a word; it costs a star at the end', async () => {
    const w = mountIt()
    // bench b one cell to the right and back, seven moves in all (par 4): the third one over par
    for (let i = 0; i < 7; i++) await keys(w, 'b', i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft')
    expect(w.text()).toContain('Züge: 7 (es geht mit 4)')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-moves .gm-bad').exists()).toBe(true)
    expect(w.text()).toContain('Drei Züge zu viel. Es geht auch mit weniger.')
    await tick(3100)
    expect(w.find('.gm-moves .gm-bad').exists()).toBe(false)
    // now the round, then the second one without a mistake: the whole game has one mistake
    await solveByKeys(w, 0)
    await tick(2800)
    rect(w)
    await solveByKeys(w, 1)
    await tick(2000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
  })

  it('a button "Hilf mir" shows after fifteen seconds: it marks a bench of a shortest solution, says where to push it and gives it the focus', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()
    const marked = w.findAll('.gm-bench.hint')
    expect(marked).toHaveLength(1)
    expect(w.find('.gm-fb').text()).toMatch(/^Schiebe die markierte Bank nach (oben|rechts|unten|links)\.$/)
    expect(document.activeElement).toBe(marked[0]!.element)
    expect(w.text()).not.toContain('Hilf mir')
    // pushing any bench takes the mark away
    await keys(w, 'b', 'ArrowRight')
    expect(w.findAll('.gm-bench.hint')).toHaveLength(0)
  })

  it('English and Spanish words and verses', async () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Seats taken: 0 of 2')
    expect(bench(en, 'd').attributes('aria-label')).toBe('Bench with 3 seats, row 1, column 1')
    await keys(en, 'b', 'ArrowUp')
    expect(en.text()).toContain('Something is in the way.')
    const es = mountIt('es')
    expect(es.text()).toContain('Asientos ocupados: 0 de 2')
    for (const [loc, verse] of [['en', 'a great company of publicans and of others that sat down with them'], ['es', 'los cuales estaban a la mesa con ellos']] as const) {
      const g = mountIt(loc)
      await solveByKeys(g, 0)
      await tick(2800)
      rect(g)
      await solveByKeys(g, 1)
      await tick(2000)
      expect(g.text()).toContain(verse)
    }
  })
})

// ================================================================ the Twelve
const TWELVE = task(8).twelve!

describe('Die Zwölf (zwoelf)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de', game: TwelveGame = TWELVE) => mount(GameZwoelf, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const fig = (w: W, id: string) => w.find(`[data-disciple="${id}"]`)
  const named = (id: string) => TWELVE.disciples.find((d) => d.id === id)!
  const tap = async (w: W, id: string) => {
    await fig(w, id).trigger('click')
    await flushPromises()
  }
  const wantedName = (w: W) => w.find('.gm-name').text()
  const playRound = async (w: W, round: number) => {
    for (const id of TWELVE.rounds[round]!.call) {
      expect(wantedName(w)).toBe(named(id).name)
      await tap(w, id)
    }
  }

  it('the real data are in order; the goal is every call (5 + 8); six figures, each a button with its sign; the first name and its sign on top; the list is empty', () => {
    expect(twelveProblems(TWELVE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(13)
    expect(w.findAll('.gm-fig')).toHaveLength(6)
    expect(w.findAll('.gm-fig img')).toHaveLength(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Ein Name leuchtet auf.')
    expect(wantedName(w)).toBe('Matthäus')
    expect(w.find('.gm-sign').text()).toBe('der Zöllner mit dem Münzkästchen')
    expect(w.find('.gm-list').text()).toContain('Gefunden: 0 von 5')
    expect(fig(w, 'simon').attributes('role')).toBe('button')
    expect(fig(w, 'simon').attributes('tabindex')).toBe('0')
    expect(fig(w, 'andreas').attributes('aria-label')).toMatch(/^Freund \d: der Fischer mit dem Fischkorb$/)
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Der Berg. Zwölf Freunde von Jesus stehen am Hang.')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a right tap: a tick, a word, a tone, the name goes to the list, the next name lights up; it counts for "Go on"', async () => {
    const w = mountIt()
    await tap(w, 'matthaeus')
    expect(count('found')).toBe(1)
    expect(fig(w, 'matthaeus').classes()).toContain('found')
    expect(fig(w, 'matthaeus').find('.gm-mark').exists()).toBe(true)
    expect(fig(w, 'matthaeus').attributes('aria-label')).toBe('Matthäus, gefunden')
    expect(w.find('.gm-fb').text()).toBe('Richtig: Matthäus!')
    expect(w.find('.gm-list').text()).toContain('Gefunden: 1 von 5')
    expect(w.findAll('.gm-chip').map((c) => c.text())).toEqual(['Matthäus'])
    expect(wantedName(w)).toBe('Andreas')
    expect(w.find('.gm-sign').text()).toBe('der Fischer mit dem Fischkorb')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a wrong tap: a cross, a low tone, a word that says who it was and what is looked for; the name stays; no progress; the cross goes away', async () => {
    const w = mountIt()
    await tap(w, 'simon')
    expect(count('wrong')).toBe(1)
    expect(fig(w, 'simon').find('.gm-mark').exists()).toBe(true)
    expect(w.find('.gm-fb').text()).toBe('Das ist Simon Petrus. Gesucht ist Matthäus: der Zöllner mit dem Münzkästchen.')
    expect(wantedName(w)).toBe('Matthäus')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1600)
    expect(fig(w, 'simon').find('.gm-mark').exists()).toBe(false)
    // a figure that is already found only gets a word
    await tap(w, 'matthaeus')
    await tap(w, 'matthaeus')
    expect(w.find('.gm-fb').text()).toBe('Matthäus hast du schon gefunden.')
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('both rounds: the end of round 1 says all are found, round 2 has all twelve; at the end the words of the Bible and the stars of the mistakes', async () => {
    const w = mountIt()
    await tap(w, 'thomas')
    await playRound(w, 0)
    expect(w.text()).toContain('Alle Namen sind gefunden!')
    await tick(300)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(2800)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-fig')).toHaveLength(12)
    expect(w.find('.gm-list').text()).toContain('Gefunden: 0 von 8')
    await playRound(w, 1)
    await tick(2000)
    expect(played).toContain('star')
    expect(w.text()).toContain('daß sie bei ihm sein sollten')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(13)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('no mistake gives three stars; "Go on" gives a star after a third of the names', async () => {
    const w = mountIt()
    await playRound(w, 0)
    expect(partialStars(useTaskProgress().parts.value, useTaskProgress().goal.value)).toBe(1)
    await tick(2800)
    await playRound(w, 1)
    await tick(2000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
  })

  it('the keyboard: the arrows go from figure to figure, Enter and the space bar tap', async () => {
    const w = mountIt()
    ;(fig(w, 'simon').element as HTMLElement).focus()
    await fig(w, 'simon').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(fig(w, 'matthaeus').element)
    await fig(w, 'matthaeus').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(fig(w, 'andreas').element)
    await fig(w, 'andreas').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(fig(w, 'matthaeus').element)
    await fig(w, 'matthaeus').trigger('keydown', { key: 'Enter' })
    expect(fig(w, 'matthaeus').classes()).toContain('found')
    await fig(w, 'andreas').trigger('keydown', { key: ' ' })
    expect(fig(w, 'andreas').classes()).toContain('found')
  })

  it('a button "Hilf mir" shows after fifteen seconds: it marks the disciple that is called and gives him the focus', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()
    expect(w.findAll('.gm-fig.hint')).toHaveLength(1)
    expect(fig(w, 'matthaeus').classes()).toContain('hint')
    expect(document.activeElement).toBe(fig(w, 'matthaeus').element)
    expect(w.find('.gm-fb').text()).toBe('Der markierte Freund ist Matthäus.')
    expect(w.text()).not.toContain('Hilf mir')
    await tap(w, 'matthaeus')
    expect(w.findAll('.gm-fig.hint')).toHaveLength(0)
  })

  it('English and Spanish words, the names of the King James Version and the verses', async () => {
    setAdventureLanguage('en')
    const en = mountIt('en')
    expect(wantedName(en)).toBe('Matthew')
    expect(en.find('.gm-sign').text()).toBe('the tax collector with the coin box')
    expect(en.find('.gm-list').text()).toContain('Found: 0 of 5')
    await tap(en, 'simon')
    expect(en.find('.gm-fb').text()).toBe('That is Simon Peter. You are looking for Matthew: the tax collector with the coin box.')
    const es = mountIt('es')
    expect(es.find('.gm-list').text()).toContain('Encontrados: 0 de 5')
    for (const [loc, verse] of [['en', 'And he ordained twelve'], ['es', 'Y estableció doce']] as const) {
      const g = mountIt(loc)
      for (const id of TWELVE.rounds[0]!.call) if (!fig(g, id).classes().includes('found')) await tap(g, id)
      await tick(2800)
      for (const id of TWELVE.rounds[1]!.call) if (!fig(g, id).classes().includes('found')) await tap(g, id)
      await tick(2000)
      expect(g.text()).toContain(verse)
    }
  })
})
