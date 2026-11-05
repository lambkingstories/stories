/**
 * The three new games of "Der junge Jesus und die Taufe", mounted with sample data and played through:
 * "The scrolls" (`schriftrolle` = GameSchriftrolle): rolling by drag, buttons and keys, "That is it!" right, wrong and off the middle, "Help me", the rounds, the end;
 * "Sun and shade" (`schattenweg` = GameSchattenweg): a tap on a shadow, the walk, a tap on the sand, the heat as a mistake, the keys, "Help me" to the goal in both rounds;
 * "Light over Galilee" (`sonnenaufgang` = GameSonnenaufgang): the sun pulled along its arc, the villages that get light, holding, letting go too early, a tap beside the sun, the keys, "Help me".
 * Also: the goal for "Go on" (`useTaskProgress`), reduced motion, the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (they come from D:/Claude/Abenteuer-Taufe/tools/i18n_neu_taufe.py, the same as INTEGRATION.json).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameSchriftrolle from '@/components/molecules/games/GameSchriftrolle.vue'
import GameSchattenweg from '@/components/molecules/games/GameSchattenweg.vue'
import GameSonnenaufgang from '@/components/molecules/games/GameSonnenaufgang.vue'
import { scrollMetrics, scrollProblems, shadeProblems, shadeShadow, shadeSimulate, sunAt, sunriseProblems } from '@/utils/taufeNeu'
import type { ScrollGame, ShadowWalkGame, SunGame } from '@/utils/taufeNeu'

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

// NEW-BEGIN
const NEW = {
  "de": {
    "scrollField": "Die Schriftrolle im Tempel. Roll sie nach oben oder unten.",
    "scrollLook": "Suche: {name} ({n} von {total})",
    "scrollShows": "Im Fenster: {name}.",
    "scrollBetween": "In der Mitte steht gerade kein Bild.",
    "scrollOff": "Roll noch ein kleines Stück, bis das Bild in der Mitte steht.",
    "scrollWrong": "Das ist {name}. Das suchen wir gerade nicht.",
    "scrollRight": "Gefunden! Jetzt suche: {name}.",
    "scrollHelped": "Da ist es. Jetzt suche: {name}.",
    "scrollAll": "Du hast alle Bilder gefunden!",
    "scrollUp": "▲ Hoch",
    "scrollDown": "▼ Runter",
    "scrollThis": "Das ist es!",
    "scrollHelp": "Hilf mir",
    "shadowWalkField": "Die Wüste in der Sonne. Felsen und Sträucher werfen Schatten.",
    "shadowWalkArrived": "Jesus steht im Schatten.",
    "shadowWalkHot": "Zu heiß! Jesus geht selbst zum nächsten Schatten.",
    "shadowWalkGoal": "Jesus ist im Schatten des großen Felsens!",
    "shadowWalkHere": "Jesus ist schon in diesem Schatten. Er bleibt darin.",
    "shadowWalkGo": "Jesus geht zum Schatten: {name}.",
    "shadowWalkHelped": "Dieser Schatten ist gut: {name}.",
    "shadowWalkMiss": "Tippe auf einen Schatten, einen Felsen oder einen Strauch.",
    "shadowWalkKeys": "Mit den Pfeiltasten wählst du einen Schatten. Mit Enter geht Jesus hin.",
    "shadowWalkGoalName": "{name} (das Ziel)",
    "shadowWalkGoalBadge": "Ziel",
    "shadowWalkJesusShade": "Jesus, im Schatten",
    "shadowWalkJesusSun": "Jesus, in der Sonne",
    "shadowWalkInShade": "Im Schatten",
    "shadowWalkInSun": "In der Sonne: es wird heiß",
    "shadowWalkHeat": "Hitze",
    "shadowWalkHelp": "Hilf mir",
    "sunriseField": "Der See Genezareth vor Sonnenaufgang. Zieh die Sonne am Bogen hoch.",
    "sunriseCount": "Licht über {n} von {total} Dörfern",
    "sunriseNotYet": "Noch nicht überall Licht ({n} von {total}). Die Sonne sinkt wieder.",
    "sunriseAll": "Licht über allen Dörfern am See!",
    "sunriseHelped": "Hier ist über allen Dörfern Licht.",
    "sunriseTake": "Nimm die Sonne mit dem Finger und zieh sie am Bogen entlang.",
    "sunriseVillageLit": "{name}: hell",
    "sunriseVillageDark": "{name}: dunkel",
    "sunriseHelp": "Hilf mir",
    "scrollDone": "Und es begab sich, nach drei Tagen fanden sie ihn im Tempel sitzen mitten unter den Lehrern, wie er ihnen zuhörte und sie fragte. (Lukas 2,46)",
    "shadowWalkDone": "Es steht geschrieben: Der Mensch lebt nicht vom Brot allein, sondern von einem jeglichen Wort, das durch den Mund Gottes geht. (Matthäus 4,4)",
    "sunriseDone": "Das Volk, das in Finsternis saß, hat ein großes Licht gesehen. (Matthäus 4,16)"
  },
  "en": {
    "scrollField": "The scroll in the temple. Roll it up or down.",
    "scrollLook": "Look for: {name} ({n} of {total})",
    "scrollShows": "In the window: {name}.",
    "scrollBetween": "No picture stands in the middle now.",
    "scrollOff": "Roll a little more, until the picture stands in the middle.",
    "scrollWrong": "That is {name}. That is not what we are looking for.",
    "scrollRight": "Found it! Now look for: {name}.",
    "scrollHelped": "There it is. Now look for: {name}.",
    "scrollAll": "You have found all the pictures!",
    "scrollUp": "▲ Up",
    "scrollDown": "▼ Down",
    "scrollThis": "That is it!",
    "scrollHelp": "Help me",
    "shadowWalkField": "The wilderness in the sun. Rocks and bushes cast shadows.",
    "shadowWalkArrived": "Jesus stands in the shade.",
    "shadowWalkHot": "Too hot! Jesus walks to the nearest shade by himself.",
    "shadowWalkGoal": "Jesus is in the shade of the big rock!",
    "shadowWalkHere": "Jesus is in this shade already. He stays in it.",
    "shadowWalkGo": "Jesus walks to the shade: {name}.",
    "shadowWalkHelped": "This shade is good: {name}.",
    "shadowWalkMiss": "Tap a shadow, a rock or a bush.",
    "shadowWalkKeys": "Choose a shadow with the arrow keys. With Enter Jesus walks there.",
    "shadowWalkGoalName": "{name} (the goal)",
    "shadowWalkGoalBadge": "Goal",
    "shadowWalkJesusShade": "Jesus, in the shade",
    "shadowWalkJesusSun": "Jesus, in the sun",
    "shadowWalkInShade": "In the shade",
    "shadowWalkInSun": "In the sun: it gets hot",
    "shadowWalkHeat": "Heat",
    "shadowWalkHelp": "Help me",
    "sunriseField": "The Sea of Galilee before sunrise. Pull the sun up along its arc.",
    "sunriseCount": "Light over {n} of {total} villages",
    "sunriseNotYet": "Not yet light everywhere ({n} of {total}). The sun sinks again.",
    "sunriseAll": "Light over all the villages by the lake!",
    "sunriseHelped": "Here there is light over all the villages.",
    "sunriseTake": "Take the sun with your finger and pull it along the arc.",
    "sunriseVillageLit": "{name}: in the light",
    "sunriseVillageDark": "{name}: dark",
    "sunriseHelp": "Help me",
    "scrollDone": "And it came to pass, that after three days they found him in the temple, sitting in the midst of the doctors, both hearing them, and asking them questions. (Luke 2:46)",
    "shadowWalkDone": "It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God. (Matthew 4:4)",
    "sunriseDone": "The people which sat in darkness saw great light. (Matthew 4:16)"
  },
  "es": {
    "scrollField": "El rollo en el templo. Enróllalo hacia arriba o hacia abajo.",
    "scrollLook": "Busca: {name} ({n} de {total})",
    "scrollShows": "En la ventana: {name}.",
    "scrollBetween": "Ahora no hay ningún dibujo en el centro.",
    "scrollOff": "Enrolla un poco más, hasta que el dibujo quede en el centro.",
    "scrollWrong": "Eso es {name}. No es lo que buscamos ahora.",
    "scrollRight": "¡Encontrado! Ahora busca: {name}.",
    "scrollHelped": "Ahí está. Ahora busca: {name}.",
    "scrollAll": "¡Has encontrado todos los dibujos!",
    "scrollUp": "▲ Arriba",
    "scrollDown": "▼ Abajo",
    "scrollThis": "¡Es este!",
    "scrollHelp": "Ayúdame",
    "shadowWalkField": "El desierto bajo el sol. Las rocas y los arbustos dan sombra.",
    "shadowWalkArrived": "Jesús está a la sombra.",
    "shadowWalkHot": "¡Hace demasiado calor! Jesús va solo a la sombra más cercana.",
    "shadowWalkGoal": "¡Jesús está a la sombra de la gran roca!",
    "shadowWalkHere": "Jesús ya está en esta sombra. Se queda en ella.",
    "shadowWalkGo": "Jesús va a la sombra: {name}.",
    "shadowWalkHelped": "Esta sombra es buena: {name}.",
    "shadowWalkMiss": "Toca una sombra, una roca o un arbusto.",
    "shadowWalkKeys": "Elige una sombra con las flechas. Con Enter, Jesús va allí.",
    "shadowWalkGoalName": "{name} (la meta)",
    "shadowWalkGoalBadge": "Meta",
    "shadowWalkJesusShade": "Jesús, a la sombra",
    "shadowWalkJesusSun": "Jesús, al sol",
    "shadowWalkInShade": "A la sombra",
    "shadowWalkInSun": "Al sol: hace calor",
    "shadowWalkHeat": "Calor",
    "shadowWalkHelp": "Ayúdame",
    "sunriseField": "El mar de Galilea antes del amanecer. Sube el sol por su arco.",
    "sunriseCount": "Luz sobre {n} de {total} pueblos",
    "sunriseNotYet": "Todavía no hay luz en todas partes ({n} de {total}). El sol vuelve a bajar.",
    "sunriseAll": "¡Luz sobre todos los pueblos junto al mar!",
    "sunriseHelped": "Aquí hay luz sobre todos los pueblos.",
    "sunriseTake": "Toma el sol con el dedo y llévalo por el arco.",
    "sunriseVillageLit": "{name}: con luz",
    "sunriseVillageDark": "{name}: a oscuras",
    "sunriseHelp": "Ayúdame",
    "scrollDone": "Y aconteció, que tres días después le hallaron en el templo, sentado en medio de los doctores, oyéndoles y preguntándoles. (Lucas 2:46)",
    "shadowWalkDone": "Escrito está: No con solo el pan vivirá el hombre, mas con toda palabra que sale de la boca de Dios. (Mateo 4:4)",
    "sunriseDone": "El pueblo asentado en tinieblas, vió gran luz. (Mateo 4:16)"
  }
}
// NEW-END

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const words = NEW as Record<string, Record<string, string>>
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...words[lang] } } }
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
})
const lessMotion = () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false })) as never
}
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const parts = () => useTaskProgress().parts.value
const fb = (w: { find: (s: string) => { text: () => string } }) => w.find('.gm-fb').text()

// ================================================================ the scrolls
const TILES = ['tempel', 'lamm', 'esel', 'krug', 'brot', 'tor', 'palme', 'lampe']
const SCROLL: ScrollGame = {
  background: 'tempel.webp',
  frame: 'rolle.webp',
  frameRatio: 2 / 3,
  window: { x: 14, y: 16, w: 72, h: 66 },
  tiles: TILES.map((id) => ({ id, image: `${id}.webp`, label: id })),
  rounds: [
    { hint: 'Roll die Rolle.', tiles: ['lamm', 'tempel', 'esel', 'krug', 'brot', 'tor'], find: ['tempel', 'brot', 'lamm'], start: 3, tolerance: 0.35 },
    { hint: 'Eine längere Rolle.', tiles: ['krug', 'palme', 'tempel', 'lampe', 'esel', 'tor', 'lamm', 'brot'], find: ['lampe', 'lamm', 'palme', 'brot'], start: 0, tolerance: 0.22 }
  ]
}

describe('Schriftrolle (schriftrolle)', () => {
  const WIN_H = 300
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameSchriftrolle, { props: { game: SCROLL }, ...opts(locale) })
    boxes.set(w.find('.gm-window').element, { left: 0, top: 0, right: 200, bottom: WIN_H })
    return w
  }
  type W = ReturnType<typeof mountIt>
  const stepPx = WIN_H * scrollMetrics(SCROLL).step
  const key = async (w: W, k: string, times = 1) => {
    for (let i = 0; i < times; i++) await w.find('.gm-window').trigger('keydown', { key: k })
    await flushPromises()
  }
  /** The picture in the middle (from the place of the tiles). */
  const middle = (w: W) => {
    const tops = w.findAll('.gm-tile').map((t) => parseFloat((t.element as HTMLElement).style.top))
    const side = scrollMetrics(SCROLL).side * 100
    let best = 0
    tops.forEach((top, i) => {
      if (Math.abs(top + side / 2 - 50) < Math.abs(tops[best]! + side / 2 - 50)) best = i
    })
    return best
  }
  const drag = async (w: W, dy: number) => {
    const el = w.find('.gm-window').element
    pointer(el, 'pointerdown', 100, 150)
    pointer(window, 'pointermove', 100, 150 + dy / 2)
    pointer(window, 'pointermove', 100, 150 + dy)
    pointer(window, 'pointerup', 100, 150 + dy)
    await flushPromises()
  }
  const button = (w: W, text: string) => w.findAll('button').find((b) => b.text().includes(text))!

  it('the sample data are in order; goal 3 + 4; the round, the hint, what is looked for, the window and the status', () => {
    expect(scrollProblems(SCROLL)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Roll die Rolle.')
    expect(w.find('.gm-want').text()).toContain('Suche: tempel (1 von 3)')
    expect(w.findAll('.gm-tile')).toHaveLength(6)
    expect(middle(w)).toBe(3)
    const win = w.find('.gm-window')
    expect(win.attributes('tabindex')).toBe('0')
    expect(win.attributes('role')).toBe('group')
    expect(win.attributes('aria-label')).toContain('Im Fenster: krug.')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the arrow keys roll a third of a step; Enter on the right picture: a tick, a part for "Go on", the next one is looked for', async () => {
    const w = mountIt()
    await key(w, 'ArrowUp', 6)
    expect(middle(w)).toBe(1)
    await key(w, 'Enter')
    expect(fb(w)).toBe('Gefunden! Jetzt suche: brot.')
    expect(parts()).toBe(1)
    expect(count('bead')).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.find('.gm-want').text()).toContain('Suche: brot (2 von 3)')
  })

  it('a wrong picture is a mistake with a cross and words; between two pictures nothing is counted', async () => {
    const w = mountIt()
    await key(w, 'Enter')
    expect(fb(w)).toBe('Das ist krug. Das suchen wir gerade nicht.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
    await drag(w, -stepPx / 2)
    await key(w, 'Enter')
    expect(fb(w)).toBe('Roll noch ein kleines Stück, bis das Bild in der Mitte steht.')
    expect(count('wrong')).toBe(1)
    expect(parts()).toBe(0)
  })

  it('a drag rolls the scroll (up = later pictures), a tap is "That is it!", the buttons roll a whole picture', async () => {
    const w = mountIt()
    await drag(w, stepPx) // down: earlier pictures
    expect(middle(w)).toBe(2)
    await button(w, 'Hoch').trigger('click')
    expect(middle(w)).toBe(1)
    const el = w.find('.gm-window').element
    pointer(el, 'pointerdown', 100, 150)
    pointer(window, 'pointerup', 101, 151)
    await flushPromises()
    expect(fb(w)).toBe('Gefunden! Jetzt suche: brot.')
    await button(w, 'Runter').trigger('click')
    await button(w, 'Runter').trigger('click')
    await button(w, 'Runter').trigger('click')
    expect(middle(w)).toBe(4)
    await button(w, 'Das ist es!').trigger('click')
    expect(parts()).toBe(2)
  })

  it('"Help me" comes after fifteen seconds and rolls to the picture; both rounds to the end with the words of the Bible', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    for (let k = 0; k < 7; k++) {
      await tick(15500)
      const h = button(w, 'Hilf mir')
      expect(h, `help ${k}`).toBeTruthy()
      await h.trigger('click')
      await tick(700)
      if (k === 2) {
        expect(fb(w)).toBe('Du hast alle Bilder gefunden!')
        await tick(3000)
        expect(w.text()).toContain('Runde 2 von 2')
        expect(w.findAll('.gm-tile')).toHaveLength(8)
      }
    }
    await tick(2500)
    expect(w.text()).toContain('nach drei Tagen fanden sie ihn im Tempel')
    expect(parts()).toBe(7)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    const next = w.findAll('button').find((b) => b.text().includes('Weiter'))
    await next!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('with reduced motion "Help me" jumps at once; English and Spanish words', async () => {
    lessMotion()
    const w = mountIt('en')
    await tick(15500)
    await button(w, 'Help me').trigger('click')
    await flushPromises()
    expect(fb(w)).toBe('There it is. Now look for: brot.')
    expect(w.find('.gm-want').text()).toContain('Look for: brot (2 of 3)')
    const s = mount(GameSchriftrolle, { props: { game: SCROLL }, ...opts('es') })
    expect(s.text()).toContain('¡Es este!')
    expect(s.find('.gm-want').text()).toContain('Busca: tempel (1 de 3)')
  })
})

// ================================================================ sun and shade
const THINGS = [
  { id: 'fels', image: 'fels.webp', label: 'Felsbrocken', w: 12, ratio: 1.2 },
  { id: 'strauch', image: 'strauch.webp', label: 'Dornstrauch', w: 11, ratio: 1.1 },
  { id: 'gross', image: 'gross.webp', label: 'großer Fels', w: 22, ratio: 1.6 }
]
const SHADE: ShadowWalkGame = {
  background: 'wueste.webp',
  walker: 'jesus.webp',
  walkerW: 12,
  walkerRatio: 0.5,
  sun: 'sonne.webp',
  sunW: 10,
  shadow: 'schatten.webp',
  things: THINGS,
  rounds: [
    {
      hint: 'Führe Jesus von Schatten zu Schatten.',
      places: [
        { thing: 'fels', x: 12, y: 80, reach: 4, size: 6 },
        { thing: 'strauch', x: 34, y: 70, reach: 3, size: 5 },
        { thing: 'fels', x: 56, y: 82, reach: 4, size: 6 },
        { thing: 'gross', x: 82, y: 66, reach: 5, size: 9, goal: true }
      ],
      start: 0,
      seconds: 60,
      heat: 3,
      speed: 8
    },
    {
      hint: 'Ein langer Weg.',
      places: [
        { thing: 'fels', x: 10, y: 88, reach: 4, size: 6 },
        { thing: 'strauch', x: 28, y: 76, reach: 3, size: 5 },
        { thing: 'strauch', x: 44, y: 90, reach: 3, size: 5 },
        { thing: 'fels', x: 58, y: 72, reach: 4, size: 6 },
        { thing: 'strauch', x: 40, y: 58, reach: 3, size: 5 },
        { thing: 'gross', x: 84, y: 82, reach: 5, size: 9, goal: true }
      ],
      start: 0,
      seconds: 45,
      heat: 2.4,
      speed: 8
    }
  ]
}

describe('Schattenweg (schattenweg)', () => {
  /** The field is 300 x 200 pixels: one percent is 3 pixels across and 2 pixels down. */
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameSchattenweg, { props: { game: SHADE }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 200 })
    return w
  }
  type W = ReturnType<typeof mountIt>
  const tapAt = async (w: W, x: number, y: number) => {
    pointer(w.find('.gm-field').element, 'pointerdown', x * 3, y * 2)
    pointer(window, 'pointerup', x * 3, y * 2)
    await flushPromises()
  }
  const tapShadow = async (w: W, i: number, t = 0) => {
    const s = shadeShadow(SHADE.rounds[0]!.places[i]!, t)
    await tapAt(w, s.x, s.y)
  }

  it('the sample data are in order; the goal is the stops of "Help me"; the field, Jesus in the shade, the heat bar, the goal badge', () => {
    expect(shadeProblems(SHADE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(shadeSimulate(SHADE.rounds[0]!).hops + shadeSimulate(SHADE.rounds[1]!).hops)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Die Wüste in der Sonne. Felsen und Sträucher werfen Schatten.')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Jesus, im Schatten')
    expect(w.findAll('.gm-shadow')).toHaveLength(4)
    expect(w.findAll('.gm-thing')).toHaveLength(4)
    expect(w.find('.gm-goal').text()).toBe('Ziel')
    expect(w.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(w.text()).toContain('Im Schatten')
    expect(problems()).toEqual([])
  })

  it('a tap on a shadow: Jesus walks there and stands in it (a part for "Go on"); a tap on the sand only says what to do', async () => {
    const w = mountIt()
    await tapAt(w, 50, 40)
    expect(fb(w)).toBe('Tippe auf einen Schatten, einen Felsen oder einen Strauch.')
    await tapShadow(w, 1)
    expect(fb(w)).toBe('Jesus geht zum Schatten: Dornstrauch.')
    expect(w.find('.gm-shadow.target').exists()).toBe(true)
    await tick(4000)
    expect(fb(w)).toBe('Jesus steht im Schatten.')
    expect(parts()).toBe(1)
    expect(count('bead')).toBe(1)
  })

  it('too long in the sun is a mistake: a cross, words, and Jesus goes to the nearest shade', async () => {
    const w = mountIt()
    await tapShadow(w, 3) // the goal is far away: the walk is too long in the sun
    let hot = false
    for (let i = 0; i < 80 && !hot; i++) {
      await tick(100)
      hot = fb(w) === 'Zu heiß! Jesus geht selbst zum nächsten Schatten.'
    }
    expect(hot).toBe(true)
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
  })

  it('the arrow keys choose a shadow, Enter sends Jesus', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    expect(fb(w)).toContain('Pfeiltasten')
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    expect(fb(w)).toBe('Dornstrauch')
    expect(w.find('.gm-shadow.cursor').exists()).toBe(true)
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    expect(fb(w)).toBe('Jesus geht zum Schatten: Dornstrauch.')
  })

  it('"Help me" after fifteen seconds leads to the goal in both rounds without a mistake: three stars and the words of the Bible', async () => {
    const w = mountIt()
    for (let k = 0; k < 200 && !w.text().includes('Weiter'); k++) {
      const h = w.findAll('button').find((b) => b.text().includes('Hilf mir'))
      if (h) await h.trigger('click')
      await tick(h ? 300 : 1000)
    }
    expect(w.text()).toContain('Der Mensch lebt nicht vom Brot allein')
    expect(count('wrong')).toBe(0)
    expect(parts()).toBe(useTaskProgress().goal.value)
    await w.findAll('button').find((b) => b.text().includes('Weiter'))!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', () => {
    const w = mountIt('en')
    expect(w.find('.gm-goal').text()).toBe('Goal')
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Jesus, in the shade')
    const s = mount(GameSchattenweg, { props: { game: SHADE }, ...opts('es') })
    expect(s.text()).toContain('A la sombra')
  })
})

// ================================================================ light over Galilee
const SUN: SunGame = {
  background: 'see.webp',
  sun: 'sonne.webp',
  sunW: 13,
  glow: 'glanz.webp',
  bead: 'perle.webp',
  arc: { cx: 50, cy: 48, rx: 40, ry: 32 },
  hold: 1,
  rounds: [
    {
      hint: 'Zieh die Sonne hoch.',
      villages: [
        { image: 'd1.webp', name: 'Kapernaum', x: 20, y: 80, w: 14, from: 0.15, to: 0.62 },
        { image: 'd2.webp', name: 'Dorf 2', x: 40, y: 86, w: 14, from: 0.3, to: 0.7 },
        { image: 'd3.webp', name: 'Dorf 3', x: 62, y: 80, w: 14, from: 0.35, to: 0.85 },
        { image: 'd4.webp', name: 'Dorf 4', x: 82, y: 88, w: 14, from: 0.25, to: 0.75 }
      ],
      start: 0.04
    },
    {
      hint: 'Mehr Dörfer.',
      villages: [
        { image: 'd1.webp', name: 'Kapernaum', x: 12, y: 80, w: 13, from: 0.1, to: 0.52 },
        { image: 'd2.webp', name: 'Dorf 2', x: 28, y: 90, w: 13, from: 0.3, to: 0.7 },
        { image: 'd3.webp', name: 'Dorf 3', x: 44, y: 78, w: 13, from: 0.4, to: 0.88 },
        { image: 'd4.webp', name: 'Dorf 4', x: 60, y: 92, w: 13, from: 0.22, to: 0.6 },
        { image: 'd5.webp', name: 'Dorf 5', x: 74, y: 80, w: 13, from: 0.43, to: 0.8 },
        { image: 'd6.webp', name: 'Dorf 6', x: 90, y: 90, w: 13, from: 0.35, to: 0.75 }
      ],
      start: 0.02
    }
  ]
}

describe('Sonnenaufgang (sonnenaufgang)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameSonnenaufgang, { props: { game: SUN }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 200 })
    return w
  }
  type W = ReturnType<typeof mountIt>
  const px = (p: number) => {
    const s = sunAt(SUN, p)
    return [s.x * 3, s.y * 2] as const
  }
  /** Takes the sun where it stands (`from`) and pulls it to the place `to` of the arc; `up` lets go. */
  const pull = async (w: W, from: number, to: number, up = true) => {
    const [x0, y0] = px(from)
    const [x1, y1] = px(to)
    pointer(w.find('.gm-field').element, 'pointerdown', x0, y0)
    pointer(window, 'pointermove', (x0 + x1) / 2, Math.min(y0, y1) - 5)
    pointer(window, 'pointermove', x1, y1)
    if (up) pointer(window, 'pointerup', x1, y1)
    await flushPromises()
  }
  const countText = (w: W) => w.find('.gm-count').text()

  it('the sample data are in order; goal 4 + 6 villages; the slider, the beads, the villages in the dark', () => {
    expect(sunriseProblems(SUN)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    const f = w.find('.gm-field')
    expect(f.attributes('role')).toBe('slider')
    expect(f.attributes('aria-label')).toBe('Der See Genezareth vor Sonnenaufgang. Zieh die Sonne am Bogen hoch.')
    expect(f.attributes('aria-valuenow')).toBe('4')
    expect(w.findAll('.gm-bead')).toHaveLength(15)
    expect(w.findAll('.gm-village')).toHaveLength(4)
    expect(w.findAll('.gm-village.lit')).toHaveLength(0)
    expect(w.find('.gm-village').attributes('aria-label')).toBe('Kapernaum: dunkel')
    expect(countText(w)).toBe('Licht über 0 von 4 Dörfern')
    expect(problems()).toEqual([])
  })

  it('pulling the sun up gives light; holding it with light over all wins the round', async () => {
    const w = mountIt()
    await pull(w, 0.04, 0.2, false)
    await tick(100)
    expect(countText(w)).toBe('Licht über 1 von 4 Dörfern')
    expect(w.find('.gm-village').attributes('aria-label')).toBe('Kapernaum: hell')
    expect(parts()).toBe(1)
    pointer(window, 'pointermove', ...px(0.5))
    await tick(400)
    expect(countText(w)).toBe('Licht über 4 von 4 Dörfern')
    expect(w.findAll('.gm-glow')).toHaveLength(4)
    await tick(800)
    expect(fb(w)).toBe('Licht über allen Dörfern am See!')
    expect(parts()).toBe(4)
    expect(w.find('.gm-mark').exists()).toBe(true)
    pointer(window, 'pointerup', ...px(0.5))
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
  })

  it('letting go too early is a mistake and the sun sinks back; a tap beside the sun only says how', async () => {
    const w = mountIt()
    await tapBeside(w)
    expect(fb(w)).toBe('Nimm die Sonne mit dem Finger und zieh sie am Bogen entlang.')
    await pull(w, 0.04, 0.2)
    expect(fb(w)).toBe('Noch nicht überall Licht (1 von 4). Die Sonne sinkt wieder.')
    expect(count('wrong')).toBe(1)
    await tick(1500)
    expect(countText(w)).toBe('Licht über 0 von 4 Dörfern')
    // letting go in the light wins at once
    await pull(w, 0.04, 0.45)
    expect(fb(w)).toBe('Licht über allen Dörfern am See!')
  })
  async function tapBeside(w: W) {
    pointer(w.find('.gm-field').element, 'pointerdown', 150, 180)
    pointer(window, 'pointerup', 150, 180)
    await flushPromises()
  }

  it('the arrow keys move the sun, Enter lets go', async () => {
    const w = mountIt()
    for (let i = 0; i < 23; i++) await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    expect(fb(w)).toBe('Licht über 4 von 4 Dörfern')
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    expect(fb(w)).toBe('Licht über allen Dörfern am See!')
  })

  it('"Help me" after fifteen seconds lifts the sun; both rounds to the end with the words of the Bible and three stars', async () => {
    const w = mountIt()
    for (let r = 0; r < 2; r++) {
      await tick(15500)
      const h = w.findAll('button').find((b) => b.text().includes('Hilf mir'))
      expect(h, `round ${r + 1}`).toBeTruthy()
      await h!.trigger('click')
      await tick(800)
      expect(fb(w)).toBe('Hier ist über allen Dörfern Licht.')
      await tick(3000)
    }
    expect(w.text()).toContain('Das Volk, das in Finsternis saß, hat ein großes Licht gesehen.')
    expect(parts()).toBe(10)
    await w.findAll('button').find((b) => b.text().includes('Weiter'))!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('with reduced motion the help does not glide; English and Spanish words', async () => {
    lessMotion()
    const w = mountIt('en')
    expect(countText(w)).toBe('Light over 0 of 4 villages')
    await tick(15500)
    await w.findAll('button').find((b) => b.text().includes('Help me'))!.trigger('click')
    await flushPromises()
    expect(fb(w)).toBe('Here there is light over all the villages.')
    const s = mount(GameSonnenaufgang, { props: { game: SUN }, ...opts('es') })
    expect(s.find('.gm-count').text()).toBe('Luz sobre 0 de 4 pueblos')
  })
})
