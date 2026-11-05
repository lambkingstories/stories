/**
 * The new game of "Die letzte Woche", "Two halves" (`gebote` = GameGebote), mounted with sample data and played through: choosing and turning the halves
 * (tap, buttons, keys), laying them on the workbench (tap a place, drag), the halves that are not upright, on the wrong side or on a full place (no mistake),
 * two halves that do not belong together and the wrong heart (mistakes), the help, the rounds, the goal of "Go on" (`useTaskProgress`), the heart that becomes one,
 * the end with the stars and the words of the Bible in German, English and Spanish.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (written by D:/Claude/Abenteuer-LetzteWoche/tools/i18n_neu_letztewoche.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameGebote from '@/components/molecules/games/GameGebote.vue'
import { osterStars } from '@/utils/osternGames'
import { commandProblems } from '@/utils/letztewocheNeu'
import type { CommandGame } from '@/utils/letztewocheNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "commandmentField": "Die Werkbank: links ein Platz für die linke Hälfte eines Bildes, rechts einer für die rechte",
    "commandmentGod": "Gott lieben",
    "commandmentNeighbor": "Den Nächsten lieben",
    "commandmentSorted": "{n} Bilder",
    "commandmentSlotL": "Platz links",
    "commandmentSlotR": "Platz rechts",
    "commandmentTray": "Die Bildhälften",
    "commandmentPiece": "Bildhälfte {n}",
    "commandmentUpright": "Sie steht richtig herum.",
    "commandmentTurned": "Gedreht.",
    "commandmentTurnedBy": "um {deg} Grad gedreht",
    "commandmentTurnLeft": "Links drehen",
    "commandmentTurnRight": "Rechts drehen",
    "commandmentCount": "Bilder fertig: {n} von {total}",
    "commandmentPicked": "Hälfte {n} ist gewählt. Dreh sie, bis das Bild gerade steht.",
    "commandmentPickFirst": "Tippe zuerst auf eine Bildhälfte.",
    "commandmentTurnFirst": "Dreh die Hälfte erst, bis das Bild gerade steht.",
    "commandmentWrongSide": "Diese Hälfte gehört auf die andere Seite.",
    "commandmentBusy": "Hier liegt schon eine Hälfte. Tippe sie an, dann kommt sie zurück.",
    "commandmentMismatch": "Diese beiden Hälften passen nicht zusammen.",
    "commandmentJoined": "Das Bild ist ganz! Zu welchem Herzen gehört es?",
    "commandmentSortFirst": "Setze zuerst die zwei Hälften eines Bildes zusammen.",
    "commandmentHeartChoice": "{kind}? Enter legt das Bild dorthin.",
    "commandmentRightGod": "Richtig: {card}. Das gehört zu „Gott lieben“.",
    "commandmentRightNeighbor": "Richtig: {card}. Das gehört zu „Den Nächsten lieben“.",
    "commandmentWrongKind": "Schau noch einmal hin. Das Bild gehört zum anderen Herzen.",
    "commandmentBack": "Zieh die Hälfte auf einen der zwei Plätze.",
    "commandmentKeys": "Links und rechts: eine Hälfte wählen. Enter: drehen. Pfeil hoch: hinlegen. Pfeil runter: zurücknehmen.",
    "commandmentHelp": "Hilf mir",
    "commandmentHelped": "Schau: So geht es weiter.",
    "commandmentRoundDone": "Alle Bilder sind beim richtigen Herzen!",
    "commandmentWhole": "Die zwei Hälften des Herzens rücken zusammen.",
    "commandmentDone": "Jesus aber sprach zu ihm: „Du sollst lieben Gott, deinen HERRN, von ganzem Herzen, von ganzer Seele und von ganzem Gemüte.“ Dies ist das vornehmste und größte Gebot. Das andere aber ist ihm gleich; Du sollst deinen Nächsten lieben wie dich selbst. (Matthäus 22,37–39)"
  },
  "en": {
    "commandmentField": "The workbench: on the left a place for the left half of a picture, on the right one for the right half",
    "commandmentGod": "Love God",
    "commandmentNeighbor": "Love your neighbor",
    "commandmentSorted": "{n} pictures",
    "commandmentSlotL": "Left place",
    "commandmentSlotR": "Right place",
    "commandmentTray": "The halves of the pictures",
    "commandmentPiece": "Half {n}",
    "commandmentUpright": "It is the right way up.",
    "commandmentTurned": "Turned.",
    "commandmentTurnedBy": "turned by {deg} degrees",
    "commandmentTurnLeft": "Turn left",
    "commandmentTurnRight": "Turn right",
    "commandmentCount": "Pictures done: {n} of {total}",
    "commandmentPicked": "Half {n} is chosen. Turn it until the picture stands straight.",
    "commandmentPickFirst": "First tap a half.",
    "commandmentTurnFirst": "First turn the half until the picture stands straight.",
    "commandmentWrongSide": "This half belongs on the other side.",
    "commandmentBusy": "A half lies here already. Tap it and it goes back.",
    "commandmentMismatch": "These two halves do not belong together.",
    "commandmentJoined": "The picture is whole! Which heart does it belong to?",
    "commandmentSortFirst": "First put the two halves of a picture together.",
    "commandmentHeartChoice": "{kind}? Enter puts the picture there.",
    "commandmentRightGod": "Right: {card}. That belongs to “Love God”.",
    "commandmentRightNeighbor": "Right: {card}. That belongs to “Love your neighbor”.",
    "commandmentWrongKind": "Look again. The picture belongs to the other heart.",
    "commandmentBack": "Drag the half onto one of the two places.",
    "commandmentKeys": "Left and right: choose a half. Enter: turn it. Up: lay it down. Down: take it back.",
    "commandmentHelp": "Help me",
    "commandmentHelped": "Look: this is how it goes on.",
    "commandmentRoundDone": "All pictures are at the right heart!",
    "commandmentWhole": "The two halves of the heart move together.",
    "commandmentDone": "Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. This is the first and great commandment. And the second is like unto it, Thou shalt love thy neighbour as thyself. (Matthew 22:37-39)"
  },
  "es": {
    "commandmentField": "El banco de trabajo: a la izquierda un sitio para la mitad izquierda de una imagen, a la derecha otro para la mitad derecha",
    "commandmentGod": "Amar a Dios",
    "commandmentNeighbor": "Amar al prójimo",
    "commandmentSorted": "{n} imágenes",
    "commandmentSlotL": "Sitio izquierdo",
    "commandmentSlotR": "Sitio derecho",
    "commandmentTray": "Las mitades de las imágenes",
    "commandmentPiece": "Mitad {n}",
    "commandmentUpright": "Está derecha.",
    "commandmentTurned": "Girada.",
    "commandmentTurnedBy": "girada {deg} grados",
    "commandmentTurnLeft": "Girar a la izquierda",
    "commandmentTurnRight": "Girar a la derecha",
    "commandmentCount": "Imágenes terminadas: {n} de {total}",
    "commandmentPicked": "Has elegido la mitad {n}. Gírala hasta que la imagen esté derecha.",
    "commandmentPickFirst": "Toca primero una mitad.",
    "commandmentTurnFirst": "Primero gira la mitad hasta que la imagen esté derecha.",
    "commandmentWrongSide": "Esta mitad va al otro lado.",
    "commandmentBusy": "Aquí ya hay una mitad. Tócala y vuelve atrás.",
    "commandmentMismatch": "Estas dos mitades no van juntas.",
    "commandmentJoined": "¡La imagen está completa! ¿A qué corazón pertenece?",
    "commandmentSortFirst": "Primero junta las dos mitades de una imagen.",
    "commandmentHeartChoice": "¿{kind}? Enter pone la imagen allí.",
    "commandmentRightGod": "Correcto: {card}. Va con «Amar a Dios».",
    "commandmentRightNeighbor": "Correcto: {card}. Va con «Amar al prójimo».",
    "commandmentWrongKind": "Mira otra vez. La imagen va al otro corazón.",
    "commandmentBack": "Arrastra la mitad a uno de los dos sitios.",
    "commandmentKeys": "Izquierda y derecha: elegir una mitad. Enter: girar. Arriba: colocar. Abajo: quitar.",
    "commandmentHelp": "Ayúdame",
    "commandmentHelped": "Mira: así se sigue.",
    "commandmentRoundDone": "¡Todas las imágenes están en el corazón correcto!",
    "commandmentWhole": "Las dos mitades del corazón se juntan.",
    "commandmentDone": "Y Jesús le dijo: Amarás al Señor tu Dios de todo tu corazón, y de toda tu alma, y de toda tu mente. Este es el primero y el grande mandamiento. Y el segundo es semejante á éste: Amarás á tu prójimo como á ti mismo. (Mateo 22:37-39)"
  }
}
// NEW_KEYS_END

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

type Tree = Record<string, Record<string, Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as object), ...(spanish as object) } as Tree
  const out: Tree = {}
  for (const loc of ['de', 'en', 'es'] as const) {
    const b = base[loc] ?? {}
    const app = (b.app ?? {}) as Record<string, unknown>
    out[loc] = { ...b, app: { ...app, adventure: { ...((app.adventure as object) ?? {}), ...NEW_KEYS[loc] } } }
  }
  return out
}
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: allMessages() as never, missingWarn: false, fallbackWarn: false })
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
    return (b ? box(b.left, b.top, b.right - b.left, b.bottom - b.top) : box(0, 0, 0, 0)) as DOMRect
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
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

// ---------------------------------------------------------------- sample data (the shape of the adventure)
const G = 'images/abenteuer/spiele/letztewoche/gebote/'
const GAME: CommandGame = {
  heart: { image: `${G}herz.webp`, label: 'Ein rotes Herz: links der Himmel, rechts die Nachbarn' },
  cards: [
    { id: 'gott-1', image: `${G}gott-1.webp`, label: 'Ein Mädchen betet am Abend', kind: 'god' },
    { id: 'naechster-1', image: `${G}naechster-1.webp`, label: 'Ein Junge teilt sein Brot', kind: 'neighbor' },
    { id: 'gott-2', image: `${G}gott-2.webp`, label: 'Eine Familie singt', kind: 'god' },
    { id: 'gott-3', image: `${G}gott-3.webp`, label: 'Eine Familie dankt', kind: 'god' },
    { id: 'naechster-2', image: `${G}naechster-2.webp`, label: 'Eine Frau trägt den Krug', kind: 'neighbor' },
    { id: 'naechster-3', image: `${G}naechster-3.webp`, label: 'Ein Mädchen bringt Suppe', kind: 'neighbor' }
  ],
  rounds: [
    {
      hint: 'Dreh die Hälften und setze zwei Bilder zusammen.',
      pieces: [
        { card: 'naechster-1', side: 'R', turn: 90 },
        { card: 'gott-1', side: 'L', turn: 270 },
        { card: 'naechster-1', side: 'L', turn: 270 },
        { card: 'gott-1', side: 'R', turn: 90 }
      ]
    },
    {
      hint: 'Jetzt sind es vier Bilder.',
      pieces: [
        { card: 'gott-3', side: 'R', turn: 180 },
        { card: 'naechster-2', side: 'L', turn: 90 },
        { card: 'gott-2', side: 'L', turn: 270 },
        { card: 'naechster-3', side: 'R', turn: 180 },
        { card: 'gott-2', side: 'R', turn: 90 },
        { card: 'gott-3', side: 'L', turn: 270 },
        { card: 'naechster-3', side: 'L', turn: 90 },
        { card: 'naechster-2', side: 'R', turn: 180 }
      ]
    }
  ]
}

const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
  const w = mount(GameGebote, { props: { game: GAME }, ...opts(locale) })
  boxes.set(w.find('[data-bench="L"]').element, { left: 40, top: 200, right: 180, bottom: 387 })
  boxes.set(w.find('[data-bench="R"]').element, { left: 180, top: 200, right: 320, bottom: 387 })
  return w
}
type Wt = ReturnType<typeof mountIt>
const piece = (w: Wt, i: number) => w.find(`[data-piece="${i}"]`)
/** A tap of the finger on a half (pointer down and up at the same place). */
const tapPiece = async (w: Wt, i: number) => {
  pointer(piece(w, i).element, 'pointerdown', 100, 500)
  pointer(window, 'pointerup', 100, 500)
  await flushPromises()
}
const turnRight = async (w: Wt) => {
  await w.find('[data-turn="right"]').trigger('click')
}
const turnLeft = async (w: Wt) => {
  await w.find('[data-turn="left"]').trigger('click')
}
/** Choose half `i`, turn it upright with the buttons and tap its place. */
const lay = async (w: Wt, i: number, side: 'L' | 'R') => {
  await tapPiece(w, i)
  let turn = Number(piece(w, i).attributes('data-turn'))
  while (turn !== 0) {
    if (turn === 270) await turnRight(w)
    else await turnLeft(w)
    turn = Number(piece(w, i).attributes('data-turn'))
  }
  await w.find(`[data-bench="${side}"]`).trigger('click')
  await flushPromises()
}
const heart = (w: Wt, k: 'god' | 'neighbor') => w.find(`[data-heart="${k}"]`).trigger('click')
/** Plays a round without mistakes: [left piece, right piece, kind] for every picture. */
const playRound = async (w: Wt, steps: [number, number, 'god' | 'neighbor'][]) => {
  for (const [l, r, k] of steps) {
    await lay(w, l, 'L')
    await lay(w, r, 'R')
    await heart(w, k)
    await flushPromises()
  }
}
const ROUND1: [number, number, 'god' | 'neighbor'][] = [
  [2, 0, 'neighbor'],
  [1, 3, 'god']
]
const ROUND2: [number, number, 'god' | 'neighbor'][] = [
  [5, 0, 'god'],
  [1, 7, 'neighbor'],
  [2, 4, 'god'],
  [6, 3, 'neighbor']
]

describe('Zwei Hälften (GameGebote)', () => {
  it('the sample data are in order; the goal is every picture (2 + 4); the two halves of the heart, the workbench, four turned halves in the tray', () => {
    expect(commandProblems(GAME)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Bilder fertig: 0 von 6')
    expect(w.findAll('.gm-piece')).toHaveLength(4)
    expect(w.find('[data-heart="god"]').text()).toContain('Gott lieben')
    expect(w.find('[data-heart="neighbor"]').text()).toContain('Den Nächsten lieben')
    expect(w.find('[data-bench="L"]').attributes('aria-label')).toBe('Platz links')
    expect(piece(w, 0).attributes('aria-label')).toBe('Bildhälfte 1, um 90 Grad gedreht')
    expect(piece(w, 0).find('.gm-turner').attributes('style')).toContain('rotate(90deg)')
    expect(piece(w, 1).find('.gm-wide').classes()).toContain('L')
    expect(w.find('.gm-bench').attributes('tabindex')).toBe('0')
    expect(problems()).toEqual([])
  })

  it('a first tap chooses a half, a second tap turns it; the buttons turn it both ways; upright it says so', async () => {
    const w = mountIt()
    await turnRight(w)
    expect(w.text()).toContain('Tippe zuerst auf eine Bildhälfte.')
    await tapPiece(w, 1)
    expect(piece(w, 1).classes()).toContain('sel')
    expect(piece(w, 1).attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Hälfte 2 ist gewählt.')
    await tapPiece(w, 1)
    expect(piece(w, 1).attributes('data-turn')).toBe('0')
    expect(w.text()).toContain('Sie steht richtig herum.')
    await turnLeft(w)
    expect(piece(w, 1).attributes('data-turn')).toBe('270')
    await turnRight(w)
    expect(piece(w, 1).attributes('data-turn')).toBe('0')
    // turning is quiet (no sound on the buttons)
    expect(played).toEqual([])
  })

  it('a half that is not upright, on the wrong side, or on a full place stays in the tray: a word, no mistake', async () => {
    const w = mountIt()
    await tapPiece(w, 1)
    await w.find('[data-bench="L"]').trigger('click')
    expect(w.text()).toContain('Dreh die Hälfte erst')
    expect(piece(w, 1).exists()).toBe(true)
    await turnRight(w)
    await w.find('[data-bench="R"]').trigger('click')
    expect(w.text()).toContain('Diese Hälfte gehört auf die andere Seite.')
    await w.find('[data-bench="L"]').trigger('click')
    expect(piece(w, 1).exists()).toBe(false)
    expect(w.find('[data-bench="L"]').attributes('aria-label')).toBe('Platz links: Ein Mädchen betet am Abend')
    expect(count('snap')).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('two halves that do not belong together: a cross and a word, a mistake; the second goes back; a tap on a place takes its half back', async () => {
    const w = mountIt()
    await lay(w, 1, 'L')
    await lay(w, 0, 'R')
    expect(w.text()).toContain('Diese beiden Hälften passen nicht zusammen.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-bench-mark').exists()).toBe(true)
    await tick(800)
    expect(piece(w, 0).exists()).toBe(true)
    expect(piece(w, 1).exists()).toBe(false)
    await w.find('[data-bench="L"]').trigger('click')
    expect(piece(w, 1).exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a whole picture waits for its heart: the wrong heart is a mistake, the right one sorts it (a tick, one part done)', async () => {
    const w = mountIt()
    await heart(w, 'god')
    expect(w.text()).toContain('Setze zuerst die zwei Hälften eines Bildes zusammen.')
    await lay(w, 1, 'L')
    await lay(w, 3, 'R')
    expect(w.text()).toContain('Das Bild ist ganz!')
    expect(w.find('.gm-bench').classes()).toContain('whole')
    expect(w.find('[data-heart="god"]').classes()).toContain('armed')
    await heart(w, 'neighbor')
    expect(w.text()).toContain('Das Bild gehört zum anderen Herzen.')
    expect(count('wrong')).toBe(1)
    await heart(w, 'god')
    expect(w.text()).toContain('Richtig: Ein Mädchen betet am Abend.')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('[data-heart="god"]').text()).toContain('1 ✓')
    expect(w.text()).toContain('Bilder fertig: 1 von 6')
    expect(w.findAll('.gm-piece')).toHaveLength(2)
  })

  it('drag: a half dragged onto its place lies there; let go beside the places it stays in the tray (no mistake)', async () => {
    const w = mountIt()
    await tapPiece(w, 2)
    await turnRight(w)
    pointer(piece(w, 2).element, 'pointerdown', 100, 500)
    pointer(window, 'pointermove', 60, 400)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(true)
    pointer(window, 'pointerup', 400, 600)
    await flushPromises()
    expect(w.text()).toContain('Zieh die Hälfte auf einen der zwei Plätze.')
    expect(piece(w, 2).exists()).toBe(true)
    pointer(piece(w, 2).element, 'pointerdown', 100, 500)
    pointer(window, 'pointermove', 100, 300)
    pointer(window, 'pointerup', 100, 300)
    await flushPromises()
    expect(piece(w, 2).exists()).toBe(false)
    expect(w.find('[data-bench="L"] .gm-crop').exists()).toBe(true)
    expect(count('wrong')).toBe(0)
  })

  it('keys: left/right choose, Enter turns, up lays down, down takes back; with a whole picture left/right choose the heart and Enter sorts', async () => {
    const w = mountIt()
    const bench = w.find('.gm-bench')
    await bench.trigger('keydown', { key: 'Enter' })
    expect(piece(w, 0).classes()).toContain('sel')
    expect(w.text()).toContain('Pfeil hoch: hinlegen')
    await bench.trigger('keydown', { key: 'ArrowRight' })
    expect(piece(w, 1).classes()).toContain('sel')
    await bench.trigger('keydown', { key: 'ArrowRight' })
    await bench.trigger('keydown', { key: 'ArrowRight' })
    expect(piece(w, 3).classes()).toContain('sel')
    for (let k = 0; k < 3; k++) await bench.trigger('keydown', { key: 'Enter' })
    expect(piece(w, 3).attributes('data-turn')).toBe('0')
    await bench.trigger('keydown', { key: 'ArrowUp' })
    expect(piece(w, 3).exists()).toBe(false)
    await bench.trigger('keydown', { key: 'ArrowDown' })
    expect(piece(w, 3).exists()).toBe(true)
    await bench.trigger('keydown', { key: 'ArrowLeft' })
    expect(piece(w, 3).classes()).toContain('sel')
    await bench.trigger('keydown', { key: 'ArrowUp' })
    expect(piece(w, 3).exists()).toBe(false)
    await bench.trigger('keydown', { key: 'ArrowLeft' })
    expect(piece(w, 2).classes()).toContain('sel')
    await bench.trigger('keydown', { key: 'ArrowLeft' })
    expect(piece(w, 1).classes()).toContain('sel')
    await bench.trigger('keydown', { key: 'Enter' })
    await bench.trigger('keydown', { key: 'ArrowUp' })
    expect(w.text()).toContain('Das Bild ist ganz!')
    await bench.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('[data-heart="god"]').classes()).toContain('cursor')
    await bench.trigger('keydown', { key: 'Enter' })
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('"Help me" comes after fifteen seconds and does one step at a time (lay the halves, sort the picture)', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15_500)
    const help = () => w.findAll('button').find((b) => b.text() === 'Hilf mir')
    expect(help()).toBeTruthy()
    await help()!.trigger('click')
    expect(piece(w, 2).exists()).toBe(false)
    expect(help()).toBeFalsy()
    await tick(15_500)
    await help()!.trigger('click')
    expect(w.find('.gm-bench').classes()).toContain('whole')
    await tick(15_500)
    await help()!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('two rounds without a mistake: the next round has eight halves; at the end the heart becomes one and three stars with Matthew 22 (Luther 1912)', async () => {
    const w = mountIt()
    const emitted: number[] = []
    await playRound(w, ROUND1)
    expect(w.text()).toContain('Alle Bilder sind beim richtigen Herzen!')
    await tick(2700)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-piece')).toHaveLength(8)
    expect(w.text()).toContain('Jetzt sind es vier Bilder.')
    await playRound(w, ROUND2)
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(1200)
    expect(w.find('.gm-whole').exists()).toBe(true)
    expect(w.text()).toContain('Die zwei Hälften des Herzens rücken zusammen.')
    await tick(3200)
    expect(w.text()).toContain('Du sollst deinen Nächsten lieben wie dich selbst. (Matthäus 22,37–39)')
    expect(osterStars(0)).toBe(3)
    expect(useTaskProgress().finished.value).toBe(true)
    const next = w.findAll('button').find((b) => b.text().length > 0)!
    await next.trigger('click')
    for (const e of (w.emitted('done') ?? []) as number[][]) emitted.push(e[0]!)
    expect(emitted).toEqual([3])
    expect(count('star')).toBe(1)
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: five mistakes give one star', async () => {
    const w = mountIt()
    // five wrong hearts
    await lay(w, 1, 'L')
    await lay(w, 3, 'R')
    for (let k = 0; k < 5; k++) await heart(w, 'neighbor')
    await heart(w, 'god')
    await lay(w, 2, 'L')
    await lay(w, 0, 'R')
    await heart(w, 'neighbor')
    await tick(2700)
    await playRound(w, ROUND2)
    await tick(4500)
    expect(w.find('.gd-text').exists() || w.text().includes('Matthäus 22')).toBe(true)
    const next = w.findAll('button').find((b) => b.text().length > 0)!
    await next.trigger('click')
    expect((w.emitted('done') ?? [])[0]).toEqual([osterStars(5)])
    expect(osterStars(5)).toBe(1)
  })

  it('English and Spanish words, with the verse of the King James Version and of the Reina-Valera 1909', async () => {
    const en = mountIt('en')
    expect(en.find('[data-heart="god"]').text()).toContain('Love God')
    expect(en.find('[data-heart="neighbor"]').text()).toContain('Love your neighbor')
    expect(en.find('[data-turn="right"]').text()).toContain('Turn right')
    await playRound(en, ROUND1)
    await tick(2700)
    await playRound(en, ROUND2)
    await tick(4500)
    expect(en.text()).toContain('Thou shalt love thy neighbour as thyself. (Matthew 22:37-39)')
    en.unmount()
    const es = mountIt('es')
    expect(es.find('[data-heart="god"]').text()).toContain('Amar a Dios')
    await playRound(es, ROUND1)
    await tick(2700)
    await playRound(es, ROUND2)
    await tick(4500)
    expect(es.text()).toContain('Amarás á tu prójimo como á ti mismo. (Mateo 22:37-39)')
    expect(problems()).toEqual([])
  })
})
