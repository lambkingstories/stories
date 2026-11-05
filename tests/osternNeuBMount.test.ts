/**
 * Three more games of "Ostern" (`wanderweg` = GameWanderweg, `tischdecken` = GameTischdecken, `lichtweg` = GameLichtweg), each mounted with sample data and played through:
 * leading the walkers (tap, drag, keys, help), the stones and thornbushes, the milestone; dragging and tapping things to their places, the wrong and the full place, the help, the broken bread;
 * passing the flame (drag, tap, keys, help), too far, the gate; the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Abenteuer-Ostern/i18n-neu-B.json).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameWanderweg from '@/components/molecules/games/GameWanderweg.vue'
import GameTischdecken from '@/components/molecules/games/GameTischdecken.vue'
import GameLichtweg from '@/components/molecules/games/GameLichtweg.vue'
import { partialStars } from '@/utils/adventureScore'
import { osterStars } from '@/utils/osternGames'
import { flameLamps, flameProblems, tableProblems, wanderDist, wanderProblems, wanderRadius, wanderRoute, wanderStart } from '@/utils/osternNeuB'
import type { FlameGame, Pt, TableGame, WanderGame } from '@/utils/osternNeuB'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  de: {
    wanderField: "Die Landstraße nach Emmaus. Unten stehen die zwei Wanderer.",
    wanderWalkers: "Die zwei Wanderer",
    wanderGoal: "Der Meilenstein mit dem Krug",
    wanderCount: "Wegstücke: {n} von {total}",
    wanderHitStone: "Vorsicht, ein Stein!",
    wanderHitThorn: "Vorsicht, ein Dornbusch!",
    wanderArrived: "Geschafft! Die Wanderer sind am Meilenstein.",
    wanderHelp: "Hilf mir",
    wanderHelping: "Ein Stück gehen sie von allein. Dann führst du wieder.",
    wanderKeys: "Mit den Pfeiltasten gehen die Wanderer. Mit Enter gehen sie bis zur nächsten Biegung.",
    wanderDone: "Und es geschah, da sie so redeten und befragten sich miteinander, nahte sich Jesus zu ihnen und wandelte mit ihnen.",
    tableField: "Der Tisch in Emmaus von oben, mit drei Kissen",
    tableTray: "Die Dinge für den Tisch",
    tableSlot: "Platz {n}",
    tableCount: "Auf dem Tisch: {n} von {total}",
    tableRight: "Richtig, das passt!",
    tableWrong: "Das gehört nicht dorthin.",
    tableFull: "Hier liegt schon eins davon.",
    tablePicked: "{thing}: Wohin gehört das?",
    tablePickFirst: "Nimm zuerst ein Ding aus der Leiste.",
    tableBack: "Zieh es auf einen Platz.",
    tableKeys: "Links und rechts: ein Ding wählen. Hoch und runter: einen Platz wählen. Enter: hinlegen.",
    tableChoice: "{thing} auf {place}?",
    tableHelp: "Hilf mir",
    tableHelped: "Schau: Das gehört hierhin.",
    tableRoundDone: "Der Tisch ist gedeckt!",
    tableBreak: "Jesus nimmt das Brot, dankt, bricht es und gibt es ihnen.",
    tableBread: "Das gebrochene Brot",
    tableDone: "Und es geschah, da er mit ihnen zu Tische saß, nahm er das Brot, dankte, brach's und gab's ihnen. Da wurden ihre Augen geöffnet, und sie erkannten ihn. Und er verschwand vor ihnen.",
    flameField: "Ein Hügel bei Bethanien am Abend. Am Weg nach Jerusalem stehen Menschen mit Öllampen.",
    flameLampLit: "Lampe {n}: brennt",
    flameLampDark: "Lampe {n}: noch aus",
    flameReach: "So weit reicht die Flamme",
    flameCount: "Lampen, die brennen: {n} von {total}",
    flameLit: "Die Lampe brennt!",
    flameFar: "Zu weit! Die Flamme reicht nur bis zum Kreis.",
    flameAlready: "Diese Lampe brennt schon.",
    flameDark: "Nimm die Flamme von einer Lampe, die schon brennt.",
    flamePick: "Jetzt tippe auf eine Lampe im Kreis.",
    flameKeys: "Mit den Pfeiltasten wählst du eine Lampe. Enter nimmt die Flamme und gibt sie weiter.",
    flameGate: "Alle Lampen brennen, bis hin zum Stadttor!",
    flameHelp: "Hilf mir",
    flameHelped: "Schau: Diese Lampe war nah genug.",
    flameDone: "Sie aber beteten ihn an und kehrten wieder gen Jerusalem mit großer Freude und waren allewege im Tempel, priesen und lobten Gott."
  },
  en: {
    wanderField: "The country road to Emmaus. The two walkers stand at the bottom.",
    wanderWalkers: "The two walkers",
    wanderGoal: "The milestone with the jug",
    wanderCount: "Parts of the way: {n} of {total}",
    wanderHitStone: "Careful, a stone!",
    wanderHitThorn: "Careful, a thornbush!",
    wanderArrived: "Well done! The walkers are at the milestone.",
    wanderHelp: "Help me",
    wanderHelping: "They walk a little way by themselves. Then you lead again.",
    wanderKeys: "The arrow keys move the walkers. Enter takes them to the next bend.",
    wanderDone: "And it came to pass, that, while they communed together and reasoned, Jesus himself drew near, and went with them.",
    tableField: "The table in Emmaus from above, with three cushions",
    tableTray: "The things for the table",
    tableSlot: "Place {n}",
    tableCount: "On the table: {n} of {total}",
    tableRight: "Right, that fits!",
    tableWrong: "That does not go there.",
    tableFull: "One of those is here already.",
    tablePicked: "{thing}: Where does it go?",
    tablePickFirst: "First take a thing from the strip.",
    tableBack: "Drag it onto a place.",
    tableKeys: "Left and right: choose a thing. Up and down: choose a place. Enter: put it down.",
    tableChoice: "{thing} on {place}?",
    tableHelp: "Help me",
    tableHelped: "Look: that goes here.",
    tableRoundDone: "The table is laid!",
    tableBreak: "Jesus takes the bread, gives thanks, breaks it and gives it to them.",
    tableBread: "The broken bread",
    tableDone: "And it came to pass, as he sat at meat with them, he took bread, and blessed it, and brake, and gave to them. And their eyes were opened, and they knew him; and he vanished out of their sight.",
    flameField: "A hill near Bethany in the evening. People with oil lamps stand by the road to Jerusalem.",
    flameLampLit: "Lamp {n}: burning",
    flameLampDark: "Lamp {n}: not lit yet",
    flameReach: "This is how far the flame reaches",
    flameCount: "Lamps burning: {n} of {total}",
    flameLit: "The lamp is burning!",
    flameFar: "Too far! The flame only reaches as far as the circle.",
    flameAlready: "This lamp is burning already.",
    flameDark: "Take the flame from a lamp that is burning.",
    flamePick: "Now tap a lamp inside the circle.",
    flameKeys: "The arrow keys choose a lamp. Enter takes the flame and passes it on.",
    flameGate: "All the lamps are burning, right up to the city gate!",
    flameHelp: "Help me",
    flameHelped: "Look: this lamp was near enough.",
    flameDone: "And they worshipped him, and returned to Jerusalem with great joy: And were continually in the temple, praising and blessing God. Amen."
  },
  es: {
    wanderField: "El camino a Emaús. Abajo están los dos caminantes.",
    wanderWalkers: "Los dos caminantes",
    wanderGoal: "El mojón con el cántaro",
    wanderCount: "Tramos del camino: {n} de {total}",
    wanderHitStone: "¡Cuidado, una piedra!",
    wanderHitThorn: "¡Cuidado, un espino!",
    wanderArrived: "¡Lo lograste! Los caminantes están en el mojón.",
    wanderHelp: "Ayúdame",
    wanderHelping: "Un trecho caminan solos. Luego los guías tú otra vez.",
    wanderKeys: "Con las flechas caminan los caminantes. Con Enter van hasta la próxima curva.",
    wanderDone: "Y aconteció que yendo hablando entre sí, y preguntándose el uno al otro, el mismo Jesús se llegó, e iba con ellos juntamente.",
    tableField: "La mesa en Emaús vista desde arriba, con tres cojines",
    tableTray: "Las cosas para la mesa",
    tableSlot: "Puesto {n}",
    tableCount: "En la mesa: {n} de {total}",
    tableRight: "¡Bien, eso va ahí!",
    tableWrong: "Eso no va ahí.",
    tableFull: "Aquí ya hay uno de esos.",
    tablePicked: "{thing}: ¿Dónde va?",
    tablePickFirst: "Primero toma una cosa de la tira.",
    tableBack: "Arrástralo a un puesto.",
    tableKeys: "Izquierda y derecha: elegir una cosa. Arriba y abajo: elegir un puesto. Enter: dejarla.",
    tableChoice: "¿{thing} en {place}?",
    tableHelp: "Ayúdame",
    tableHelped: "Mira: eso va aquí.",
    tableRoundDone: "¡La mesa está puesta!",
    tableBreak: "Jesús toma el pan, da gracias, lo parte y se lo da.",
    tableBread: "El pan partido",
    tableDone: "Y aconteció, que estando sentado con ellos a la mesa, tomando el pan, bendijo, y partió, y dioles. Entonces fueron abiertos los ojos de ellos, y le conocieron; mas él se desapareció de los ojos de ellos.",
    flameField: "Una colina cerca de Betania al atardecer. Junto al camino a Jerusalén hay personas con lámparas de aceite.",
    flameLampLit: "Lámpara {n}: encendida",
    flameLampDark: "Lámpara {n}: todavía apagada",
    flameReach: "Hasta aquí llega la llama",
    flameCount: "Lámparas encendidas: {n} de {total}",
    flameLit: "¡La lámpara arde!",
    flameFar: "¡Demasiado lejos! La llama solo llega hasta el círculo.",
    flameAlready: "Esta lámpara ya arde.",
    flameDark: "Toma la llama de una lámpara que ya arde.",
    flamePick: "Ahora toca una lámpara dentro del círculo.",
    flameKeys: "Con las flechas eliges una lámpara. Enter toma la llama y la pasa.",
    flameGate: "¡Todas las lámparas arden, hasta la puerta de la ciudad!",
    flameHelp: "Ayúdame",
    flameHelped: "Mira: esta lámpara estaba bastante cerca.",
    flameDone: "Y ellos, después de haberle adorado, se volvieron a Jerusalem con gran gozo; y estaban siempre en el templo, alabando y bendiciendo a Dios. Amén."
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
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const num = (s: string) => parseFloat(s)
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}

// ---------------------------------------------------------------- sample data
const W = 'spiele/ostern/wanderweg/'
const obstacle = (image: string, x: number, y: number, r: number) => ({ image: `${W}${image}.webp`, x, y, r, name: image.startsWith('dorn') ? 'Dornbusch' : 'Stein' })
const WANDER: WanderGame = {
  walker: 'spiele/ostern/weg/wanderer.webp',
  walkerW: 12,
  rounds: [
    {
      background: `${W}strasse-1.webp`,
      hint: 'Führe die beiden Wanderer zum Meilenstein.',
      road: 18,
      path: [
        { x: 50, y: 92 },
        { x: 50, y: 60 },
        { x: 35, y: 35 },
        { x: 50, y: 10 }
      ],
      obstacles: [obstacle('stein-1', 50, 72, 4), obstacle('dorn-1', 20, 85, 4), obstacle('stein-2', 80, 60, 4), obstacle('dorn-2', 20, 45, 4), obstacle('stein-3', 70, 25, 4)],
      goal: { image: `${W}ziel.webp`, x: 50, y: 6, w: 12 }
    },
    {
      background: `${W}strasse-2.webp`,
      hint: 'Jetzt liegen mehr Steine auf dem Weg.',
      road: 18,
      path: [
        { x: 30, y: 92 },
        { x: 65, y: 72 },
        { x: 35, y: 42 },
        { x: 60, y: 10 }
      ],
      obstacles: [
        obstacle('stein-1', 50, 84, 3.5),
        obstacle('dorn-1', 12, 75, 4),
        obstacle('stein-2', 85, 82, 4),
        obstacle('dorn-2', 62, 58, 3.5),
        obstacle('stein-3', 30, 62, 3.5),
        obstacle('dorn-1', 85, 50, 4),
        obstacle('stein-1', 15, 30, 4),
        obstacle('dorn-2', 52, 30, 3.5),
        obstacle('stein-2', 85, 18, 4)
      ],
      goal: { image: `${W}ziel.webp`, x: 60, y: 6, w: 12 }
    }
  ]
}

const T = 'spiele/ostern/tisch/'
const thing = (id: string, image: string, name: string, w: number, target: string) => ({ id, image: `${T}${image}.webp`, name, w, target })
const TABLE: TableGame = {
  background: `${T}tisch.webp`,
  slots: [
    { id: 'platz-1', x: 20, y: 30, r: 10 },
    { id: 'platz-2', x: 50, y: 22, r: 10, name: 'Platz des Gastes' },
    { id: 'platz-3', x: 80, y: 30, r: 10 },
    { id: 'mitte', x: 50, y: 55, r: 10, name: 'Mitte des Tisches' },
    { id: 'korb', x: 88, y: 82, r: 9, name: 'Korb' }
  ],
  basket: { image: `${T}korb.webp`, x: 88, y: 82, w: 16 },
  bread: { item: 'brot', whole: `${T}brot.webp`, halves: [`${T}brot-haelfte-1.webp`, `${T}brot-haelfte-2.webp`] },
  guestSlot: 'platz-2',
  rounds: [
    {
      hint: 'Stell an jeden Platz einen Becher und eine Schale.',
      items: [
        thing('becher-1', 'becher', 'Becher', 8, 'platz-1'),
        thing('schale-1', 'schale', 'Schale', 10, 'platz-1'),
        thing('becher-2', 'becher', 'Becher', 8, 'platz-2'),
        thing('schale-2', 'schale', 'Schale', 10, 'platz-2'),
        thing('becher-3', 'becher', 'Becher', 8, 'platz-3'),
        thing('schale-3', 'schale', 'Schale', 10, 'platz-3')
      ]
    },
    {
      hint: 'Lampe und Krug in die Mitte, das Brot zum Gast. Was nicht auf den Tisch gehört, kommt in den Korb.',
      items: [
        thing('lampe', 'lampe', 'Öllampe', 9, 'mitte'),
        thing('krug', 'krug', 'Krug', 9, 'mitte'),
        thing('brot', 'brot', 'Fladenbrot', 11, 'platz-2'),
        thing('netz', 'netz', 'Netz', 10, 'korb'),
        thing('stab', 'stab', 'Hirtenstab', 10, 'korb')
      ]
    }
  ]
}

const L = 'spiele/ostern/licht/'
const person = (n: number, x: number, y: number) => ({ image: `${L}mensch-${((n - 1) % 4) + 1}.webp`, x, y, w: 8, anchor: { x: 70, y: 45 } })
const FLAME: FlameGame = {
  flame: `${L}flamme.webp`,
  rounds: [
    {
      background: `${L}huegel.webp`,
      hint: 'Gib das Licht weiter, bis zum Tor.',
      start: 0,
      reach: 20,
      gate: { x: 90, y: 50 },
      people: [person(1, 10, 80), person(2, 24, 75), person(3, 38, 70), person(4, 52, 65), person(5, 66, 60), person(6, 80, 55)]
    },
    {
      background: `${L}huegel.webp`,
      hint: 'Der Weg teilt sich. Alle Lampen sollen brennen.',
      start: 0,
      reach: 18,
      gate: { x: 92, y: 40 },
      people: [person(1, 8, 86), person(2, 20, 82), person(3, 32, 76), person(4, 44, 64), person(5, 56, 56), person(6, 44, 88), person(7, 56, 92), person(8, 70, 50), person(9, 84, 44)]
    }
  ]
}

// ---------------------------------------------------------------- the road to Emmaus
describe('Wanderweg (GameWanderweg)', () => {
  const mountIt = (game: WanderGame = WANDER, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameWanderweg, { props: { game }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 400 })
    return w
  }
  type Wr = ReturnType<typeof mountIt>
  /** The field is 300 x 400 pixels (3:4). */
  const px = (p: Pt) => ({ x: p.x * 3, y: p.y * 4 })
  const walker = (w: Wr): Pt => ({ x: num((w.find('.gm-walker').element as HTMLElement).style.left), y: num((w.find('.gm-walker').element as HTMLElement).style.top) })
  const tapAt = (w: Wr, p: Pt) => {
    const q = px(p)
    pointer(w.find('.gm-field').element, 'pointerdown', q.x, q.y)
    pointer(window, 'pointerup', q.x, q.y)
  }
  /** Walk the safe way of the round to the milestone, point by point (the last step goes to the middle of the milestone). */
  const walkRoute = async (w: Wr, ri: number) => {
    const route = wanderRoute(WANDER, ri, walker(w), wanderRadius(WANDER) + 0.8)!
    const goal = WANDER.rounds[ri]!.goal
    for (const p of [...route.slice(1), { x: goal.x, y: goal.y }]) {
      tapAt(w, p)
      await until(() => wanderDist(walker(w), p) < 0.5 || w.text().includes('Geschafft!'), 10)
      if (w.text().includes('Geschafft!')) break
    }
  }

  it('the sample data are in order; the goal is three parts of each road; the road, five obstacles, the milestone, the walkers at the bottom', () => {
    expect(wanderProblems(WANDER)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Führe die beiden Wanderer zum Meilenstein.')
    expect(w.text()).toContain('Wegstücke: 0 von 3')
    expect(w.findAll('.gm-obstacle')).toHaveLength(5)
    expect(w.find('.gm-goal').attributes('aria-label')).toBe('Der Meilenstein mit dem Krug')
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Die zwei Wanderer')
    expect(w.find('[data-obstacle="1"]').attributes('aria-label')).toBe('Dornbusch')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Landstraße nach Emmaus')
    expect(w.find('.gm-field').attributes('style')).toContain('strasse-1')
    expect(walker(w)).toEqual({ x: 50, y: 92 })
    expect(problems()).toEqual([])
  })

  it('a tap sends the walkers there; they walk at most 18 units a second and stop at the place (a ring shows where)', async () => {
    const w = mountIt()
    tapAt(w, { x: 80, y: 92 })
    await flushPromises()
    expect(w.find('.gm-target').exists()).toBe(true)
    await tick(1000)
    expect(walker(w).x).toBeGreaterThan(50 + 14)
    expect(walker(w).x).toBeLessThan(50 + 19)
    expect(w.find('.gm-walker').classes()).toContain('walking')
    await tick(1500)
    expect(walker(w).x).toBeCloseTo(80, 0)
    expect(w.find('.gm-target').exists()).toBe(false)
    tapAt(w, { x: 70, y: 92 })
    await tick(300)
    expect(w.find('.gm-walker .gm-flip').attributes('style')).toContain('scaleX(-1)')
  })

  it('a drag leads them after the finger', async () => {
    const w = mountIt()
    const a = px({ x: 50, y: 90 })
    pointer(w.find('.gm-field').element, 'pointerdown', a.x, a.y)
    const b = px({ x: 70, y: 86 })
    pointer(window, 'pointermove', b.x, b.y)
    await tick(2000)
    expect(walker(w).x).toBeCloseTo(70, 0)
    expect(walker(w).y).toBeCloseTo(86, 0)
    pointer(window, 'pointerup', b.x, b.y)
  })

  it('touching a stone: a cross on it, "Vorsicht, ein Stein!", a low tone, one mistake; they stand for a moment', async () => {
    const w = mountIt()
    tapAt(w, { x: 50, y: 50 })
    expect(await until(() => w.text().includes('Vorsicht, ein Stein!'), 3)).toBe(true)
    expect(w.find('[data-obstacle="0"]').classes()).toContain('hit')
    expect(w.find('[data-obstacle="0"] .gm-mark').exists()).toBe(true)
    expect(w.find('.gm-walker').classes()).toContain('stopped')
    expect(count('wrong')).toBe(1)
    await tick(3000)
    // pushing on against the same stone is no new mistake
    expect(count('wrong')).toBe(1)
    expect(w.find('[data-obstacle="0"] .gm-mark').exists()).toBe(false)
  })

  it('touching a thornbush says "Vorsicht, ein Dornbusch!"', async () => {
    const thorny: WanderGame = { ...WANDER, rounds: [{ ...WANDER.rounds[0]!, obstacles: [obstacle('dorn-1', 50, 72, 4), ...WANDER.rounds[0]!.obstacles.slice(1)] }] }
    const w = mountIt(thorny)
    tapAt(w, { x: 50, y: 50 })
    expect(await until(() => w.text().includes('Vorsicht, ein Dornbusch!'), 3)).toBe(true)
  })

  it('the keyboard: an arrow sends them a step (six units), Enter to the next bend', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowRight' })
    await tick(800)
    expect(walker(w).x).toBeCloseTo(56, 0)
    await field.trigger('keydown', { key: 'ArrowDown' })
    await tick(800)
    expect(walker(w).y).toBeCloseTo(Math.min(92 + 4.5, 100 - 3.6 * 0.75), 0)
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Mit den Pfeiltasten gehen die Wanderer')
  })

  it('"Hilf mir" shows after fifteen seconds without a move; they walk a safe piece of the way by themselves', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(w.text()).toContain('Ein Stück gehen sie von allein.')
    expect(w.text()).not.toContain('Hilf mir')
    const start = walker(w)
    await tick(2500)
    expect(wanderDist(walker(w), start)).toBeGreaterThan(20)
    expect(count('wrong')).toBe(0)
  })

  it('"Go on" gives one star after a third of the parts', async () => {
    const w = mountIt()
    tapAt(w, { x: 66, y: 80 })
    await tick(2000)
    tapAt(w, { x: 66, y: 52 })
    await tick(3000)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Wegstücke: 1 von 3')
    expect(partialStars(1, 6)).toBe(0)
    tapAt(w, { x: 45, y: 25 })
    await tick(3000)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Wegstücke: 2 von 3')
    expect(partialStars(2, 6)).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('both roads: round the obstacles to the milestone (a tick), the next road, then the words of the Bible and three stars', async () => {
    const w = mountIt()
    await walkRoute(w, 0)
    expect(w.text()).toContain('Geschafft! Die Wanderer sind am Meilenstein.')
    expect(w.find('.gm-goal .gm-mark').exists()).toBe(true)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-obstacle')).toHaveLength(9)
    expect(w.find('.gm-field').attributes('style')).toContain('strasse-2')
    expect(walker(w)).toEqual({ x: wanderStart(WANDER, 1).x, y: wanderStart(WANDER, 1).y })
    await walkRoute(w, 1)
    expect(w.text()).toContain('Geschafft!')
    await tick(2500)
    expect(played).toContain('star')
    expect(count('wrong')).toBe(0)
    expect(w.text()).toContain('nahte sich Jesus zu ihnen und wandelte mit ihnen')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(6)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three touches give two stars', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) {
      tapAt(w, { x: 50, y: 50 })
      await until(() => count('wrong') === i + 1, 4)
      tapAt(w, { x: 50, y: 96 })
      await tick(2000)
    }
    expect(count('wrong')).toBe(3)
    await walkRoute(w, 0)
    await tick(3000)
    await walkRoute(w, 1)
    await tick(2500)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(3)])
    expect(osterStars(3)).toBe(2)
  })

  it('English and Spanish words', () => {
    const en = mountIt(WANDER, 'en')
    expect(en.text()).toContain('Parts of the way: 0 of 3')
    expect(en.find('.gm-walker').attributes('aria-label')).toBe('The two walkers')
    const es = mountIt(WANDER, 'es')
    expect(es.text()).toContain('Tramos del camino: 0 de 3')
  })
})

// ---------------------------------------------------------------- lay the table
describe('Tisch decken (GameTischdecken)', () => {
  const mountIt = (game: TableGame = TABLE, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameTischdecken, { props: { game }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 400, bottom: 300 })
    return w
  }
  type Wt = ReturnType<typeof mountIt>
  /** The field is 400 x 300 pixels (4:3); the strip lies below it. */
  const px = (p: Pt) => ({ x: p.x * 4, y: p.y * 3 })
  const slotOf = (id: string) => TABLE.slots.find((s) => s.id === id)!
  const thingBtn = (w: Wt, id: string) => w.find(`[data-item="${id}"]`)
  /** Drag thing `id` from the strip to a place of the picture and let go. */
  const dragTo = async (w: Wt, id: string, at: Pt) => {
    pointer(thingBtn(w, id).element, 'pointerdown', 200, 340)
    const p = px(at)
    pointer(window, 'pointermove', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
  }
  const put = (w: Wt, id: string, slot: string) => dragTo(w, id, slotOf(slot))

  it('the sample data are in order; the goal is every thing (6 + 5); the table, the basket, five places, six things in the strip', () => {
    expect(tableProblems(TABLE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(11)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Auf dem Tisch: 0 von 11')
    expect(w.findAll('.gm-thing')).toHaveLength(6)
    expect(w.findAll('.gm-slot')).toHaveLength(5)
    expect(w.find('.gm-basket').exists()).toBe(true)
    expect(w.find('[data-slot="platz-1"]').attributes('aria-label')).toBe('Platz 1')
    expect(w.find('[data-slot="mitte"]').attributes('aria-label')).toBe('Mitte des Tisches')
    expect(thingBtn(w, 'becher-1').attributes('aria-label')).toBe('Becher')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    // every place is a button of at least 44 pixels (the CSS says so), every thing too
    expect(problems()).toEqual([])
  })

  it('a cup dragged to a cushion stays there: a tick, a click, it leaves the strip, one part is done', async () => {
    const w = mountIt()
    pointer(thingBtn(w, 'becher-1').element, 'pointerdown', 200, 340)
    pointer(window, 'pointermove', 300, 200)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(true)
    expect(w.find('.gm-slot.armed').exists()).toBe(true)
    const p = px(slotOf('platz-3'))
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(w.find('[data-laid="becher-1"]').exists()).toBe(true)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Richtig, das passt!')
    expect(thingBtn(w, 'becher-1').exists()).toBe(false)
    expect(count('snap')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Auf dem Tisch: 1 von 11')
  })

  it('a cup in the middle springs back: a cross and a word, a low tone, a mistake; a second cup at the same cushion is "full"', async () => {
    const w = mountIt()
    await put(w, 'becher-1', 'mitte')
    expect(w.text()).toContain('Das gehört nicht dorthin.')
    expect(count('wrong')).toBe(1)
    expect(thingBtn(w, 'becher-1').exists()).toBe(true)
    expect(thingBtn(w, 'becher-1').classes()).toContain('bounce')
    expect(w.find('.gm-mark').exists()).toBe(true)
    await put(w, 'becher-1', 'platz-1')
    await put(w, 'becher-2', 'platz-1')
    expect(w.text()).toContain('Hier liegt schon eins davon.')
    expect(count('wrong')).toBe(2)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('letting go beside the places is no mistake', async () => {
    const w = mountIt()
    await dragTo(w, 'schale-1', { x: 50, y: 40 })
    expect(w.text()).toContain('Zieh es auf einen Platz.')
    expect(count('wrong')).toBe(0)
    expect(thingBtn(w, 'schale-1').exists()).toBe(true)
  })

  it('a tap on a thing and then on a place puts it there; a place without a thing in the hand says so', async () => {
    const w = mountIt()
    await w.find('[data-slot="platz-2"]').trigger('click')
    expect(w.text()).toContain('Nimm zuerst ein Ding aus der Leiste.')
    pointer(thingBtn(w, 'schale-2').element, 'pointerdown', 200, 340)
    pointer(window, 'pointerup', 201, 340)
    await flushPromises()
    expect(thingBtn(w, 'schale-2').classes()).toContain('sel')
    expect(thingBtn(w, 'schale-2').attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Schale: Wohin gehört das?')
    await w.find('[data-slot="platz-2"]').trigger('click')
    expect(w.find('[data-laid="schale-2"]').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('the keyboard: right chooses a thing, down a place, Enter puts it down', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(thingBtn(w, 'becher-1').classes()).toContain('sel')
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-slot="platz-1"]').classes()).toContain('cursor')
    expect(w.text()).toContain('Becher auf Platz 1?')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-laid="becher-1"]').exists()).toBe(true)
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowDown' })
    await field.trigger('keydown', { key: 'ArrowDown' })
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(w.text()).toContain('Schale auf Mitte des Tisches?')
    await field.trigger('keydown', { key: 'Enter' })
    expect(count('wrong')).toBe(1)
  })

  it('"Hilf mir" shows after fifteen seconds and puts one thing in a right place', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await btn.trigger('click')
    expect(w.find('[data-laid="becher-1"]').exists()).toBe(true)
    expect(w.text()).toContain('Schau: Das gehört hierhin.')
    expect(count('wrong')).toBe(0)
    expect(w.text()).not.toContain('Hilf mir')
  })

  it('both rounds: the table is laid, then lamp, jug, bread and the basket; the bread breaks in two; the words of the Bible and three stars', async () => {
    const w = mountIt()
    for (const [id, slot] of [
      ['becher-1', 'platz-1'],
      ['schale-1', 'platz-1'],
      ['becher-2', 'platz-2'],
      ['schale-2', 'platz-2'],
      ['becher-3', 'platz-3'],
      ['schale-3', 'platz-3']
    ] as const)
      await put(w, id, slot)
    expect(w.text()).toContain('Der Tisch ist gedeckt!')
    expect(useTaskProgress().parts.value).toBe(6)
    // "Go on" with one star already
    expect(partialStars(6, 11)).toBeGreaterThanOrEqual(1)
    await tick(2700)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-thing')).toHaveLength(5)
    // the things of round 1 stay on the table
    expect(w.findAll('.gm-laid')).toHaveLength(6)
    for (const [id, slot] of [
      ['lampe', 'mitte'],
      ['krug', 'mitte'],
      ['netz', 'korb'],
      ['stab', 'korb'],
      ['brot', 'platz-2']
    ] as const)
      await put(w, id, slot)
    expect(w.findAll('.gm-laid')).toHaveLength(11)
    expect(w.find('[data-laid="brot"]').attributes('aria-label')).toBe('Fladenbrot')
    await tick(1200)
    expect(w.find('.gm-bread').exists()).toBe(true)
    expect(w.findAll('.gm-bread .gm-half')).toHaveLength(2)
    expect(w.find('.gm-bread').attributes('aria-label')).toBe('Das gebrochene Brot')
    expect(w.text()).toContain('Jesus nimmt das Brot, dankt, bricht es und gibt es ihnen.')
    await tick(2600)
    expect(played).toContain('star')
    expect(w.text()).toContain("brach's und gab's ihnen")
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(11)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: five wrong places give one star', async () => {
    const one: TableGame = { ...TABLE, rounds: [TABLE.rounds[1]!] }
    const w = mountIt(one)
    for (let i = 0; i < 5; i++) await put(w, 'netz', 'mitte')
    expect(count('wrong')).toBe(5)
    for (const [id, slot] of [
      ['lampe', 'mitte'],
      ['krug', 'mitte'],
      ['netz', 'korb'],
      ['stab', 'korb'],
      ['brot', 'platz-2']
    ] as const)
      await put(w, id, slot)
    await tick(4000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(5)])
    expect(osterStars(5)).toBe(1)
  })

  it('English and Spanish words', () => {
    const en = mountIt(TABLE, 'en')
    expect(en.text()).toContain('On the table: 0 of 11')
    expect(en.find('[data-slot="platz-1"]').attributes('aria-label')).toBe('Place 1')
    const es = mountIt(TABLE, 'es')
    expect(es.text()).toContain('En la mesa: 0 de 11')
  })
})

// ---------------------------------------------------------------- pass on the light
describe('Licht weitergeben (GameLichtweg)', () => {
  const mountIt = (game: FlameGame = FLAME, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameLichtweg, { props: { game }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 200 })
    return w
  }
  type Wl = ReturnType<typeof mountIt>
  /** The field is 300 x 200 pixels (3:2). */
  const px = (p: Pt) => ({ x: p.x * 3, y: p.y * 2 })
  const lampsOf = (ri: number) => flameLamps(FLAME, FLAME.rounds[ri]!)
  const field = (w: Wl) => w.find('.gm-field').element
  /** Drag the flame from lamp `a` to lamp `b` (round `ri`). */
  const dragFlame = async (w: Wl, a: number, b: number, ri = 0) => {
    const from = px(lampsOf(ri)[a]!)
    const to = px(lampsOf(ri)[b]!)
    pointer(field(w), 'pointerdown', from.x, from.y)
    pointer(window, 'pointermove', (from.x + to.x) / 2, (from.y + to.y) / 2)
    pointer(window, 'pointerup', to.x, to.y)
    await flushPromises()
  }
  const tapLamp = async (w: Wl, i: number, ri = 0) => {
    const p = px(lampsOf(ri)[i]!)
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
  }
  const isLit = (w: Wl, i: number) => w.find(`[data-lamp="${i}"]`).classes().includes('lit')

  it('the sample data are in order; the goal is every lamp to light (5 + 8); six people, six lamps, one flame', () => {
    expect(flameProblems(FLAME)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(13)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Lampen, die brennen: 1 von 6')
    expect(w.findAll('.gm-person')).toHaveLength(6)
    expect(w.findAll('.gm-lamp')).toHaveLength(6)
    expect(w.findAll('.gm-flame')).toHaveLength(1)
    expect(w.find('[data-lamp="0"]').attributes('aria-label')).toBe('Lampe 1: brennt')
    expect(w.find('[data-lamp="1"]').attributes('aria-label')).toBe('Lampe 2: noch aus')
    expect(w.find('.gm-reach').exists()).toBe(false)
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(problems()).toEqual([])
  })

  it('dragging the flame shows its reach (a circle as wide as twice the reach) and lights a lamp in it: a tick, a tone, one part', async () => {
    const w = mountIt()
    const from = px(lampsOf(0)[0]!)
    pointer(field(w), 'pointerdown', from.x, from.y)
    pointer(window, 'pointermove', from.x + 20, from.y)
    await flushPromises()
    expect(w.find('.gm-reach').exists()).toBe(true)
    expect((w.find('.gm-reach').element as HTMLElement).style.width).toBe('40%')
    expect(w.find('.gm-carry').exists()).toBe(true)
    const to = px(lampsOf(0)[1]!)
    pointer(window, 'pointerup', to.x, to.y)
    await flushPromises()
    expect(isLit(w, 1)).toBe(true)
    expect(w.find('[data-lamp="1"] .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Die Lampe brennt!')
    expect(w.text()).toContain('Lampen, die brennen: 2 von 6')
    expect(count('bead')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-reach').exists()).toBe(false)
  })

  it('too far: the flame goes back, a cross and "Zu weit!", a low tone, a mistake', async () => {
    const w = mountIt()
    await dragFlame(w, 0, 2)
    expect(isLit(w, 2)).toBe(false)
    expect(w.text()).toContain('Zu weit!')
    expect(w.find('[data-lamp="2"] .gm-mark').exists()).toBe(true)
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('letting go where there is no lamp: the flame goes back, no mistake', async () => {
    const w = mountIt()
    const from = px(lampsOf(0)[0]!)
    pointer(field(w), 'pointerdown', from.x, from.y)
    pointer(window, 'pointermove', 150, 20)
    pointer(window, 'pointerup', 150, 20)
    await flushPromises()
    expect(count('wrong')).toBe(0)
    expect(w.find('.gm-carry').exists()).toBe(false)
    expect(w.find('.gm-reach').exists()).toBe(false)
  })

  it('a tap on the burning lamp takes the flame (the circle shows), a tap on a dark lamp in reach lights it; a dark lamp alone says so', async () => {
    const w = mountIt()
    await tapLamp(w, 2)
    expect(w.text()).toContain('Nimm die Flamme von einer Lampe, die schon brennt.')
    await tapLamp(w, 0)
    expect(w.text()).toContain('Jetzt tippe auf eine Lampe im Kreis.')
    expect(w.find('.gm-reach').exists()).toBe(true)
    expect(w.find('[data-lamp="0"]').attributes('aria-pressed')).toBe('true')
    await tapLamp(w, 1)
    expect(isLit(w, 1)).toBe(true)
    // a tap on a burning lamp that was taken puts the flame back
    await tapLamp(w, 1)
    expect(w.find('.gm-reach').exists()).toBe(true)
    await tapLamp(w, 1)
    expect(w.find('.gm-reach').exists()).toBe(false)
  })

  it('the keyboard: Enter shows the first lamp, Enter takes the flame, an arrow chooses the next lamp, Enter lights it', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-lamp="0"]').classes()).toContain('cursor')
    expect(w.text()).toContain('Mit den Pfeiltasten wählst du eine Lampe')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('.gm-reach').exists()).toBe(true)
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-lamp="1"]').classes()).toContain('cursor')
    expect(w.text()).toContain('Lampe 2: noch aus')
    await f.trigger('keydown', { key: 'Enter' })
    expect(isLit(w, 1)).toBe(true)
    // too far by keys as well
    await f.trigger('keydown', { key: 'Enter' })
    await f.trigger('keydown', { key: 'ArrowRight' })
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-lamp="3"]').classes()).toContain('cursor')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Zu weit!')
  })

  it('"Hilf mir" shows after fifteen seconds and lights the next lamp in reach', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await btn.trigger('click')
    expect(w.find('.gm-carry.fly').exists()).toBe(true)
    await tick(600)
    expect(isLit(w, 1)).toBe(true)
    expect(w.text()).toContain('Schau: Diese Lampe war nah genug.')
    expect(count('wrong')).toBe(0)
  })

  it('both rounds: the row, then the fork; every lamp burns up to the gate; the words of the Bible and three stars', async () => {
    const w = mountIt()
    for (let i = 0; i < 5; i++) await dragFlame(w, i, i + 1)
    expect(w.text()).toContain('Alle Lampen brennen, bis hin zum Stadttor!')
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-lamp')).toHaveLength(9)
    expect(w.text()).toContain('Lampen, die brennen: 1 von 9')
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [4, 7],
      [7, 8]
    ] as const)
      await dragFlame(w, a, b, 1)
    expect(w.text()).toContain('Alle Lampen brennen')
    await tick(2600)
    expect(played).toContain('star')
    expect(count('wrong')).toBe(0)
    expect(w.text()).toContain('kehrten wieder gen Jerusalem mit großer Freude')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(13)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three times too far gives two stars', async () => {
    const w = mountIt({ ...FLAME, rounds: [FLAME.rounds[0]!] })
    for (let i = 0; i < 3; i++) await dragFlame(w, 0, 3)
    for (let i = 0; i < 5; i++) await dragFlame(w, i, i + 1)
    await tick(2600)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(3)])
    expect(osterStars(3)).toBe(2)
  })

  it('English and Spanish words', () => {
    const en = mountIt(FLAME, 'en')
    expect(en.text()).toContain('Lamps burning: 1 of 6')
    expect(en.find('[data-lamp="1"]').attributes('aria-label')).toBe('Lamp 2: not lit yet')
    const es = mountIt(FLAME, 'es')
    expect(es.text()).toContain('Lámparas encendidas: 1 de 6')
  })
})
