/**
 * The three new games of "Jesus heilt" (`synagoge` = GameSynagoge, `zehn` = GameZehn, `kinder` = GameKinder), each mounted with sample data and played through:
 * setting the parts (tap, drag, keys, help), the beam before its columns, the roof; leading the ten (tap, help, keys, men left behind and fetched); bringing the children (the wrong child, the order,
 * keys, help); the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/heilung/INTEGRATION.json).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameSynagoge from '@/components/molecules/games/GameSynagoge.vue'
import GameZehn from '@/components/molecules/games/GameZehn.vue'
import GameKinder from '@/components/molecules/games/GameKinder.vue'
import type { ChildrenGame, SynagogueGame, SynagogueSlot, TenGame } from '@/utils/heilungNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  de: {
    synagogueField: "Der Bauplatz der Synagoge in Kapernaum, von vorn",
    synagogueTray: "Die Bauteile",
    synagogueLeft: "{part}, noch {n}",
    synagogueCount: "Gesetzt: {n} von {total}",
    synagogueRight: "Passt! Das steht fest.",
    synagogueKind: "Das passt hier nicht hin.",
    synagogueNeedsBeam: "Der Balken braucht erst die Säulen darunter.",
    synagogueNeedsRoof: "Das Dach braucht erst die Balken darunter.",
    synagogueFull: "Hier steht schon etwas.",
    synagogueBack: "Zieh es auf den Bauplatz.",
    synagoguePicked: "{part}: Wohin gehört das?",
    synagoguePickFirst: "Nimm zuerst ein Bauteil aus der Leiste.",
    synagogueKeys: "Links und rechts: ein Bauteil wählen. Hoch und runter: einen Platz wählen. Enter: setzen.",
    synagogueChoice: "{part} auf {place}?",
    synagogueHelp: "Hilf mir",
    synagogueHelped: "Schau: Das kommt als Nächstes.",
    synagogueRoundDone: "Geschafft! Alles steht fest.",
    synagogueBuilt: "Die Synagoge steht. Der Hauptmann hat sie für das Volk gebaut.",
    synagogueDone: "denn er hat unser Volk lieb, und die Schule hat er uns erbaut.",
    tenField: "Das Land von oben. Unten stehen die zehn Männer, oben ist das Haus der Priester.",
    tenMan: "Mann {n}",
    tenManLost: "Mann {n}: zurückgeblieben",
    tenCount: "Beim Haus der Priester: {n} von {total}",
    tenLostCount: "zurückgeblieben: {n}",
    tenLost: "Ein Mann ist zurückgeblieben. Hol ihn ab!",
    tenFetched: "Er kommt wieder mit.",
    tenArrived: "Alle zehn sind beim Haus der Priester!",
    tenHelp: "Hilf mir",
    tenHelping: "Ein Stück gehen sie von allein. Dann führst du wieder.",
    tenKeys: "Mit den Pfeiltasten führst du die Männer. Mit Enter gehen sie zum nächsten Stück des Weges.",
    tenDone: "Und da er sie sah, sprach er zu ihnen: Gehet hin und zeiget euch den Priestern!",
    childrenField: "Der Hof mit dem Feigenbaum. Jesus sitzt auf der Bank, vorn warten die Kinder.",
    childrenWith: "{name}, bei Jesus",
    childrenCount: "Bei Jesus: {n} von {total}",
    childrenRight: "Ja! {name} kommt zu Jesus.",
    childrenBigger: "Da wartet noch ein kleineres Kind.",
    childrenBiggerArm: "Da wartet noch ein kleineres Kind. Schau auch auf die Kleinen auf dem Arm.",
    childrenRoundDone: "Jesus nimmt die Kinder in die Arme, legt ihnen die Hände auf und segnet sie.",
    childrenHelp: "Hilf mir",
    childrenHelped: "Schau: {name} ist das kleinste Kind, das noch wartet.",
    childrenKeys: "Links und rechts: ein Kind wählen. Enter: zu Jesus bringen.",
    childrenDone: "Und er herzte sie und legte die Hände auf sie und segnete sie."
  },
  en: {
    synagogueField: "The building site of the synagogue in Capernaum, from the front",
    synagogueTray: "The building parts",
    synagogueLeft: "{part}, {n} left",
    synagogueCount: "Set: {n} of {total}",
    synagogueRight: "It fits! That stands firm.",
    synagogueKind: "That does not belong here.",
    synagogueNeedsBeam: "The beam needs the columns under it first.",
    synagogueNeedsRoof: "The roof needs the beams under it first.",
    synagogueFull: "Something stands here already.",
    synagogueBack: "Drag it onto the building site.",
    synagoguePicked: "{part}: where does it go?",
    synagoguePickFirst: "First take a part from the strip.",
    synagogueKeys: "Left and right: choose a part. Up and down: choose a place. Enter: set it.",
    synagogueChoice: "{part} on {place}?",
    synagogueHelp: "Help me",
    synagogueHelped: "Look: this comes next.",
    synagogueRoundDone: "Well done! Everything stands firm.",
    synagogueBuilt: "The synagogue stands. The captain built it for the people.",
    synagogueDone: "For he loveth our nation, and he hath built us a synagogue.",
    tenField: "The land from above. The ten men stand at the bottom, the house of the priests is at the top.",
    tenMan: "Man {n}",
    tenManLost: "Man {n}: left behind",
    tenCount: "At the house of the priests: {n} of {total}",
    tenLostCount: "left behind: {n}",
    tenLost: "One man is left behind. Fetch him!",
    tenFetched: "He comes along again.",
    tenArrived: "All ten are at the house of the priests!",
    tenHelp: "Help me",
    tenHelping: "They walk a little way by themselves. Then you lead again.",
    tenKeys: "The arrow keys lead the men. Enter takes them to the next part of the way.",
    tenDone: "And when he saw them, he said unto them, Go shew yourselves unto the priests.",
    childrenField: "The courtyard with the fig tree. Jesus sits on the bench, the children wait in front.",
    childrenWith: "{name}, with Jesus",
    childrenCount: "With Jesus: {n} of {total}",
    childrenRight: "Yes! {name} comes to Jesus.",
    childrenBigger: "A smaller child is still waiting.",
    childrenBiggerArm: "A smaller child is still waiting. Look at the little ones on the arm, too.",
    childrenRoundDone: "Jesus takes the children in his arms, lays his hands on them and blesses them.",
    childrenHelp: "Help me",
    childrenHelped: "Look: {name} is the smallest child still waiting.",
    childrenKeys: "Left and right: choose a child. Enter: bring it to Jesus.",
    childrenDone: "And he took them up in his arms, put his hands upon them, and blessed them."
  },
  es: {
    synagogueField: "El lugar de la obra de la sinagoga en Capernaum, de frente",
    synagogueTray: "Las piezas",
    synagogueLeft: "{part}, quedan {n}",
    synagogueCount: "Puestas: {n} de {total}",
    synagogueRight: "¡Encaja! Eso queda firme.",
    synagogueKind: "Eso no va aquí.",
    synagogueNeedsBeam: "La viga necesita primero las columnas debajo.",
    synagogueNeedsRoof: "El techo necesita primero las vigas debajo.",
    synagogueFull: "Aquí ya hay algo.",
    synagogueBack: "Arrástralo a la obra.",
    synagoguePicked: "{part}: ¿adónde va?",
    synagoguePickFirst: "Primero toma una pieza de la barra.",
    synagogueKeys: "Izquierda y derecha: elige una pieza. Arriba y abajo: elige un lugar. Enter: ponerla.",
    synagogueChoice: "¿{part} en {place}?",
    synagogueHelp: "Ayúdame",
    synagogueHelped: "Mira: esto viene ahora.",
    synagogueRoundDone: "¡Lo lograste! Todo queda firme.",
    synagogueBuilt: "La sinagoga está en pie. El centurión la construyó para el pueblo.",
    synagogueDone: "Que ama nuestra nación, y él nos edificó una sinagoga.",
    tenField: "La tierra desde arriba. Abajo están los diez hombres, arriba está la casa de los sacerdotes.",
    tenMan: "Hombre {n}",
    tenManLost: "Hombre {n}: se quedó atrás",
    tenCount: "En la casa de los sacerdotes: {n} de {total}",
    tenLostCount: "se quedaron atrás: {n}",
    tenLost: "Un hombre se quedó atrás. ¡Ve a buscarlo!",
    tenFetched: "Ya viene otra vez.",
    tenArrived: "¡Los diez están en la casa de los sacerdotes!",
    tenHelp: "Ayúdame",
    tenHelping: "Caminan un poco solos. Luego guías tú otra vez.",
    tenKeys: "Con las flechas guías a los hombres. Con Enter van al siguiente tramo del camino.",
    tenDone: "Y como él los vio, les dijo: Id, mostraos a los sacerdotes.",
    childrenField: "El patio con la higuera. Jesús está sentado en el banco, delante esperan los niños.",
    childrenWith: "{name}, con Jesús",
    childrenCount: "Con Jesús: {n} de {total}",
    childrenRight: "¡Sí! {name} viene a Jesús.",
    childrenBigger: "Todavía espera un niño más pequeño.",
    childrenBiggerArm: "Todavía espera un niño más pequeño. Mira también a los pequeños en brazos.",
    childrenRoundDone: "Jesús toma a los niños en sus brazos, pone las manos sobre ellos y los bendice.",
    childrenHelp: "Ayúdame",
    childrenHelped: "Mira: {name} es el niño más pequeño que todavía espera.",
    childrenKeys: "Izquierda y derecha: elige un niño. Enter: llevarlo a Jesús.",
    childrenDone: "Y tomándolos en los brazos, poniendo las manos sobre ellos, los bendecía."
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
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the corner: a pointer at (x, y) is at x %, y % of the field
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => box(0, 0, 100, 100) as DOMRect)
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
const status = (w: VueWrapper) => w.find('[role="status"]').text()
/** A pointer event (jsdom has no PointerEvent: a MouseEvent with the pointer's name does the same here). */
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const button = (w: VueWrapper, text: string) => w.findAll('button').find((b) => b.text() === text)

// ---------------------------------------------------------------- every word the games use is there, in three languages
describe('the words', () => {
  it('every key of app.adventure that the three games use is there in German, English and Spanish', () => {
    const all = allMessages()
    for (const file of ['GameSynagoge', 'GameZehn', 'GameKinder']) {
      const code = readFileSync(`src/components/molecules/games/${file}.vue`, 'utf-8')
      const keys = [...new Set([...code.matchAll(/app\.adventure\.(\w+)/g)].map((m) => m[1]!))]
      expect(keys.length, file).toBeGreaterThan(5)
      for (const loc of ['de', 'en', 'es'] as const) {
        const adv = ((all[loc]!.app as Record<string, unknown>).adventure ?? {}) as Record<string, unknown>
        for (const k of keys) expect(typeof adv[k], `${file} ${loc} ${k}`).toBe('string')
      }
    }
    expect(Object.keys(NEW_KEYS.en).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    expect(Object.keys(NEW_KEYS.es).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
  })
})

// ---------------------------------------------------------------- 1. the synagogue
const col = (id: string, x: number): SynagogueSlot => ({ id, kind: 'column', x: x - 2.5, y: 30, w: 5, h: 40, needs: [], name: `Säule ${id}` })
const SYN: SynagogueGame = {
  background: 'bau.webp',
  ratio: 1.5,
  floor: 70,
  parts: { column: { image: 'saeule.webp', name: 'Eine Säule' }, beam: { image: 'balken.webp', name: 'Ein Balken' }, roof: { image: 'dach.webp', name: 'Das Dach' } },
  rounds: [
    { hint: 'Runde eins', outline: true, slots: [col('s1', 25), col('s2', 42), col('s3', 58), col('s4', 75), { id: 'b1', kind: 'beam', x: 20, y: 25, w: 60, h: 5, needs: ['s1', 's2', 's3', 's4'], name: 'Der Balken' }] },
    {
      hint: 'Runde zwei',
      outline: false,
      slots: [
        col('s1', 15),
        col('s2', 29),
        col('s3', 43),
        col('s4', 57),
        col('s5', 71),
        col('s6', 85),
        { id: 'b1', kind: 'beam', x: 11, y: 25, w: 36, h: 5, needs: ['s1', 's2', 's3'], name: 'Der linke Balken' },
        { id: 'b2', kind: 'beam', x: 53, y: 25, w: 36, h: 5, needs: ['s4', 's5', 's6'], name: 'Der rechte Balken' },
        { id: 'r', kind: 'roof', x: 8, y: 8, w: 84, h: 17, needs: ['b1', 'b2'], name: 'Das Dach' }
      ]
    }
  ]
}

describe('GameSynagoge', () => {
  it('round 1 by tapping: a beam before the columns is a mistake; four columns and the beam finish the round; round 2 with the roof by the help; the end gives the stars and Luke 7,5', async () => {
    const w = mount(GameSynagoge, { props: { game: SYN }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(14)
    expect(w.text()).toContain('Runde eins')
    // only columns and the beam in the strip, with how many are left
    expect(w.findAll('[data-part]').map((b) => b.attributes('data-part'))).toEqual(['column', 'beam'])
    expect(w.find('[data-part="column"]').attributes('aria-label')).toBe('Eine Säule, noch 4')
    // round 1 shows the places
    expect(w.findAll('.gs-slot.shown')).toHaveLength(5)
    // a tap on a place without a part
    await w.find('[data-slot="s1"]').trigger('click')
    expect(status(w)).toContain('Nimm zuerst ein Bauteil')
    // the beam first: a mistake
    await w.find('[data-part="beam"]').trigger('click')
    expect(status(w)).toContain('Ein Balken: Wohin gehört das?')
    await w.find('[data-slot="b1"]').trigger('click')
    expect(status(w)).toContain('Der Balken braucht erst die Säulen')
    expect(played).toContain('wrong')
    expect(w.find('.gs-mark').exists()).toBe(true)
    expect(w.findAll('[data-set]')).toHaveLength(0)
    // the four columns
    for (const s of ['s1', 's2', 's3', 's4']) {
      await w.find('[data-part="column"]').trigger('click')
      await w.find(`[data-slot="${s}"]`).trigger('click')
    }
    expect(w.findAll('[data-set]')).toHaveLength(4)
    expect(w.text()).toContain('Gesetzt: 4 von 5')
    expect(w.findAll('[data-part]').map((b) => b.attributes('data-part'))).toEqual(['beam'])
    await w.find('[data-part="beam"]').trigger('click')
    await w.find('[data-slot="b1"]').trigger('click')
    expect(status(w)).toContain('Geschafft')
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(3000)
    expect(w.text()).toContain('Runde zwei')
    expect(w.findAll('[data-set]')).toHaveLength(0)
    // round 2: the places only show while a part is in the hand
    expect(w.findAll('.gs-slot.shown')).toHaveLength(0)
    await w.find('[data-part="roof"]').trigger('click')
    expect(w.findAll('.gs-slot.shown')).toHaveLength(9)
    await w.find('[data-slot="r"]').trigger('click')
    expect(status(w)).toContain('Das Dach braucht erst die Balken')
    // the help sets the rest, one part each time
    for (let k = 0; k < 9; k++) {
      await tick(16000)
      const help = button(w, 'Hilf mir')
      expect(help, `help ${k}`).toBeTruthy()
      await help!.trigger('click')
    }
    expect(w.findAll('[data-set]')).toHaveLength(9)
    expect(status(w)).toContain('Die Synagoge steht')
    await tick(3500)
    // two mistakes: three stars
    expect(w.text()).toContain('denn er hat unser Volk lieb, und die Schule hat er uns erbaut.')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('dragging: a column let go near a place stands there; let go far away it comes back without a mistake; a beam on a column place is a mistake', async () => {
    const w = mount(GameSynagoge, { props: { game: SYN }, ...opts('de') })
    await flushPromises()
    const drag = async (part: string, x: number, y: number) => {
      pointer(w.find(`[data-part="${part}"]`).element, 'pointerdown', 50, 150)
      await flushPromises()
      pointer(window, 'pointermove', x, y)
      await flushPromises()
      pointer(window, 'pointerup', x, y)
      await flushPromises()
    }
    await drag('column', 43, 50)
    expect(w.find('[data-set="s2"]').exists()).toBe(true)
    await drag('column', 2, 96)
    expect(status(w)).toContain('Zieh es auf den Bauplatz')
    expect(w.findAll('[data-set]')).toHaveLength(1)
    await drag('beam', 75, 55)
    expect(status(w)).toContain('Das passt hier nicht hin')
    expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
    w.unmount()
  })

  it('the keyboard: left/right choose a part, up/down a place, Enter sets it; English and Spanish words', async () => {
    const w = mount(GameSynagoge, { props: { game: SYN }, ...opts('en') })
    await flushPromises()
    const field = w.find('.gs-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Eine Säule on Säule s1?')
    expect(status(w)).toContain('Left and right: choose a part')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-set="s1"]').exists()).toBe(true)
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowDown' })
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(status(w)).toContain('on Säule s3?')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-set="s3"]').exists()).toBe(true)
    w.unmount()
    const es = mount(GameSynagoge, { props: { game: SYN }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Puestas: 0 de 5')
    es.unmount()
  })
})

// ---------------------------------------------------------------- 2. ten on the way
const TEN: TenGame = {
  men: Array.from({ length: 10 }, (_, i) => `mann-${i + 1}.webp`),
  manW: 10,
  house: { image: 'haus.webp', w: 22, name: 'Das Haus der Priester' },
  rounds: [
    {
      hint: 'Runde eins',
      background: 'land-1.webp',
      start: { x: 50, y: 86 },
      house: { x: 50, y: 10 },
      goal: { x: 50, y: 24, r: 14 },
      obstacles: [
        { image: 'baum.webp', x: 25, y: 60, w: 18, r: 7, kind: 'tree', name: 'Ein Ölbaum' },
        { image: 'fels.webp', x: 76, y: 46, w: 14, r: 5, kind: 'rock', name: 'Ein Fels' }
      ],
      route: [
        { x: 50, y: 70 },
        { x: 50, y: 45 }
      ]
    },
    {
      hint: 'Runde zwei',
      background: 'land-2.webp',
      start: { x: 50, y: 86 },
      house: { x: 50, y: 10 },
      goal: { x: 50, y: 24, r: 14 },
      obstacles: [
        { image: 'mauer.webp', x: 30, y: 58, w: 50, r: 3, span: 22, kind: 'wall', name: 'Eine Mauer' },
        { image: 'mauer.webp', x: 82, y: 58, w: 30, r: 3, span: 12, kind: 'wall', name: 'Eine Mauer' },
        { image: 'dorn.webp', x: 20, y: 40, w: 12, r: 5, kind: 'thorn', name: 'Ein Dornbusch' }
      ],
      route: [
        { x: 62, y: 72 },
        { x: 62, y: 58 },
        { x: 60, y: 44 }
      ]
    }
  ]
}

describe('GameZehn', () => {
  it('ten men, the house and the things; a tap leads the ring; round 1 by the help; in round 2 the finger across the wall leaves men behind, they are fetched; the end gives Luke 17,14', async () => {
    const w = mount(GameZehn, { props: { game: TEN }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(20)
    expect(w.findAll('[data-man]')).toHaveLength(10)
    expect(w.findAll('[data-obstacle]')).toHaveLength(2)
    expect(w.find('[aria-label="Das Haus der Priester"]').exists()).toBe(true)
    expect(w.text()).toContain('Beim Haus der Priester: 0 von 10')
    // a tap ahead: the ring and the men go there
    const field = w.find('.gz-field')
    pointer(field.element, 'pointerdown', 50, 70)
    pointer(window, 'pointerup', 50, 70)
    await tick(2000)
    expect(w.find('.gz-ring').attributes('style')).toMatch(/top: 70(\.\d+)?%/)
    // the help after fifteen seconds: the ring goes the safe way
    await tick(15000)
    const help = button(w, 'Hilf mir')
    expect(help).toBeTruthy()
    await help!.trigger('click')
    expect(status(w)).toContain('Ein Stück gehen sie von allein')
    for (let k = 0; k < 40 && !status(w).includes('Alle zehn'); k++) await tick(250)
    expect(status(w)).toContain('Alle zehn sind beim Haus der Priester')
    expect(useTaskProgress().parts.value).toBe(10)
    expect(w.findAll('.gz-mark').length).toBe(10)
    await tick(3000)
    expect(w.text()).toContain('Runde zwei')
    // straight across the long wall and holding there: men are left behind
    pointer(field.element, 'pointerdown', 30, 20)
    await tick(12000)
    pointer(window, 'pointerup', 30, 20)
    await flushPromises()
    expect(played).toContain('wrong')
    expect(w.findAll('.gz-man.lost').length).toBeGreaterThan(0)
    expect(w.text()).toMatch(/zurückgeblieben: \d/)
    // back down to them: they are fetched
    for (let k = 0; k < 14 && w.findAll('.gz-man.lost').length; k++) {
      await field.trigger('keydown', { key: 'ArrowDown' })
      await tick(800)
    }
    expect(played).toContain('tap')
    // then the help to the end
    for (let k = 0; k < 8 && !w.text().includes('Und da er sie sah'); k++) {
      await tick(16000)
      const h = button(w, 'Hilf mir')
      if (h) await h.trigger('click')
      await tick(9000)
    }
    expect(w.text()).toContain('Und da er sie sah, sprach er zu ihnen: Gehet hin und zeiget euch den Priestern!')
    await button(w, 'Weiter')!.trigger('click')
    const stars = w.emitted('done')![0]![0] as number
    expect(stars).toBeGreaterThanOrEqual(1)
    expect(stars).toBeLessThanOrEqual(3)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('the arrow keys move the ring a step, Enter goes to the next point of the way; English words', async () => {
    const w = mount(GameZehn, { props: { game: TEN }, ...opts('en') })
    await flushPromises()
    const field = w.find('.gz-field')
    await field.trigger('keydown', { key: 'ArrowUp' })
    await tick(1000)
    expect(w.find('.gz-ring').attributes('style')).toMatch(/top: 80\.75%/)
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('The arrow keys lead the men')
    await tick(1500)
    expect(w.find('.gz-ring').attributes('style')).toMatch(/top: 70(\.\d+)?%/)
    expect(w.text()).toContain('At the house of the priests: 0 of 10')
    w.unmount()
  })
})

// ---------------------------------------------------------------- 3. to Jesus
const KIDS: ChildrenGame = {
  background: 'hof.webp',
  ratio: 1.5,
  figureRatio: 300 / 330,
  row: { y: 97, x0: 10, x1: 90 },
  seats: [
    { x: 50, y: 62, scale: 0.6 },
    { x: 58, y: 64, scale: 0.6 },
    { x: 66, y: 64, scale: 0.6 },
    { x: 74, y: 62, scale: 0.6 },
    { x: 44, y: 66, scale: 0.6 },
    { x: 80, y: 66, scale: 0.6 }
  ],
  rounds: [
    {
      hint: 'Runde eins',
      children: [
        { id: 'zopf', image: 'f1.webp', name: 'Das Mädchen mit dem Zopf', rank: 3, h: 34 },
        { id: 'mutter', image: 'f4.webp', name: 'Das Kleinkind auf dem Arm der Mutter', rank: 1, h: 46, carried: true },
        { id: 'gross', image: 'g.webp', name: 'Das große Mädchen', rank: 4, h: 42 },
        { id: 'klein', image: 'k.webp', name: 'Das kleine Mädchen', rank: 2, h: 27 }
      ]
    },
    {
      hint: 'Runde zwei',
      children: [
        { id: 'lamm', image: 'f3.webp', name: 'Der Junge mit dem Lämmchen', rank: 5, h: 38 },
        { id: 'klein', image: 'k.webp', name: 'Das kleine Mädchen', rank: 3, h: 27 },
        { id: 'vater', image: 'v.webp', name: 'Das Baby auf dem Arm des Vaters', rank: 1, h: 47, carried: true },
        { id: 'gross', image: 'g.webp', name: 'Das große Mädchen', rank: 6, h: 42 },
        { id: 'mutter', image: 'f4.webp', name: 'Das Kleinkind auf dem Arm der Mutter', rank: 2, h: 46, carried: true },
        { id: 'zopf', image: 'f1.webp', name: 'Das Mädchen mit dem Zopf', rank: 4, h: 33 }
      ]
    }
  ]
}

describe('GameKinder', () => {
  it('a bigger child first is a mistake (with a word about the little ones on the arm); in order they come to Jesus; round 2 by keys and help; the end gives Mark 10,16', async () => {
    const w = mount(GameKinder, { props: { game: KIDS }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.findAll('button.gk-child')).toHaveLength(4)
    await w.find('[data-child="gross"]').trigger('click')
    expect(status(w)).toContain('Schau auch auf die Kleinen auf dem Arm')
    expect(played).toContain('wrong')
    expect(w.find('.gk-mark').exists()).toBe(true)
    await w.find('[data-child="mutter"]').trigger('click')
    expect(status(w)).toContain('Ja! Das Kleinkind auf dem Arm der Mutter kommt zu Jesus.')
    expect(w.find('div.gk-child.with[data-child="mutter"]').exists()).toBe(true)
    // the child is at its place round Jesus
    expect(w.find('div.gk-child.with[data-child="mutter"]').attributes('style')).toContain('top: 62%')
    await w.find('[data-child="gross"]').trigger('click')
    expect(status(w)).toBe('Da wartet noch ein kleineres Kind.')
    for (const id of ['klein', 'zopf', 'gross']) await w.find(`button[data-child="${id}"]`).trigger('click')
    expect(w.text()).toContain('Bei Jesus: 4 von 4')
    await tick(1200)
    expect(status(w)).toContain('Jesus nimmt die Kinder in die Arme')
    await tick(4000)
    expect(w.text()).toContain('Runde zwei')
    expect(w.findAll('button.gk-child')).toHaveLength(6)
    // the keys: the first who waits, then on to the baby on the father's arm
    const field = w.find('.gk-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Der Junge mit dem Lämmchen')
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toBe('Das Baby auf dem Arm des Vaters')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.find('div.gk-child.with[data-child="vater"]').exists()).toBe(true)
    // the help shows the next and brings it
    for (let k = 0; k < 5; k++) {
      await tick(16000)
      const help = button(w, 'Hilf mir')
      expect(help, `help ${k}`).toBeTruthy()
      await help!.trigger('click')
      expect(w.find('.gk-child.help').exists()).toBe(true)
      await tick(1300)
    }
    expect(w.findAll('div.gk-child.with')).toHaveLength(6)
    await tick(4500)
    expect(w.text()).toContain('Und er herzte sie und legte die Hände auf sie und segnete sie.')
    await button(w, 'Weiter')!.trigger('click')
    // two mistakes: three stars
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(10)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameKinder, { props: { game: KIDS }, ...opts('en') })
    await flushPromises()
    await en.find('[data-child="zopf"]').trigger('click')
    expect(status(en)).toContain('A smaller child is still waiting')
    en.unmount()
    const es = mount(GameKinder, { props: { game: KIDS }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Con Jesús: 0 de 4')
    es.unmount()
  })
})
