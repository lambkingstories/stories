/**
 * The three new games of "Der König kommt" (`laternen` = GameLaternen, `spross` = GameSpross, `zionwege` = GameZionwege), each mounted with the real data and played through:
 * catching the lanterns with a name (tap, keys, help), a lantern without a name, a name out of turn; letting the shoot grow and steering it (keys, buttons, finger, help),
 * touching a stone; turning the path tiles (tap, keys, help), too many taps; the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible,
 * German, English and Spanish words. The new words are not in `i18n/app.ts` yet: they are mixed in here (written by D:/Claude/Abenteuer-Propheten/tools/i18n_neu_propheten.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameLaternen from '@/components/molecules/games/GameLaternen.vue'
import GameSpross from '@/components/molecules/games/GameSpross.vue'
import GameZionwege from '@/components/molecules/games/GameZionwege.vue'
import { propheten } from '@/data/adventures/propheten'
import { prophetenStars, zionCost, zionTurns } from '@/utils/prophetenNeu'
import type { LanternGame, ShootGame, ZionGame, ZionKind, ZionRound } from '@/utils/prophetenNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "lanternsField": "Der Abendhimmel über Galiläa. Laternen steigen auf.",
    "lanternsNames": "Die Namen des Kindes",
    "lanternsNext": "als Nächstes",
    "lanternsNamed": "Laterne mit dem Namen {name}",
    "lanternsNoName": "Laterne ohne Namen",
    "lanternsCaught": "Gefangen: {name}!",
    "lanternsBlank": "Auf dieser Laterne steht kein Name.",
    "lanternsOrder": "Noch nicht! Zuerst kommt {name}.",
    "lanternsAll": "Du hast alle Namen des Kindes gefangen!",
    "lanternsLane": "Bahn {n} von {total}",
    "lanternsKeys": "Mit den Pfeiltasten wählst du eine Bahn. Mit Enter fängst du die Laterne darin.",
    "lanternsNone": "In dieser Bahn ist gerade keine Laterne.",
    "lanternsCount": "Namen gefangen: {n} von {total}",
    "lanternsHelp": "Hilf mir",
    "lanternsHelped": "Die Laternen steigen jetzt langsamer. Die mit dem Ring brauchst du.",
    "lanternsDone": "Denn uns ist ein Kind geboren, ein Sohn ist uns gegeben, und die Herrschaft ist auf seiner Schulter; er heißt Wunderbar, Rat, Held, Ewig-Vater, Friedefürst. (Jesaja 9,5)",
    "shootGrowField": "Ein alter Ölbaumhain. Unten steht der Baumstumpf, oben fällt Licht herein.",
    "shootGrowStart": "Tippe aufs Bild oder halte einen Pfeil. Dann wächst der Trieb.",
    "shootGrowGrows": "Der Trieb wächst! Lenke ihn an den Steinen vorbei.",
    "shootGrowKeys": "Halte die Pfeiltaste nach links oder rechts, dann neigt sich der Trieb.",
    "shootGrowStone": "Ein Stein! Lenke den Trieb zur Seite.",
    "shootGrowLight": "Der Trieb ist im Licht!",
    "shootGrowLightLabel": "Das Licht, zu dem der Trieb wächst",
    "shootGrowStoneLabel": "Stein {n}",
    "shootGrowTip": "Die Spitze des Triebs",
    "shootGrowLeft": "Nach links lenken (gedrückt halten)",
    "shootGrowRight": "Nach rechts lenken (gedrückt halten)",
    "shootGrowCount": "Weg zum Licht: {n} %",
    "shootGrowHelp": "Hilf mir",
    "shootGrowHelped": "Schau, ein Stück wächst der Trieb von allein. Dann lenkst du wieder.",
    "shootGrowDone": "Und es wird eine Rute aufgehen von dem Stamm Isais und ein Zweig aus seiner Wurzel Frucht bringen. (Jesaja 11,1)",
    "zionPathsField": "Eine Landkarte aus Wegplatten. Oben liegt der Berg Zion.",
    "zionPathsCell": "Reihe {r}, Spalte {c}",
    "zionPathsTile": "Wegplatte",
    "zionPathsZion": "Der Berg Zion",
    "zionPathsFieldTile": "Feld ohne Weg",
    "zionPathsPersonWaits": "Hier wartet ein Mensch.",
    "zionPathsPersonWay": "Dieser Mensch hat einen Weg zum Zion.",
    "zionPathsFixed": "Hier ist kein Weg. Das Feld bleibt, wie es ist.",
    "zionPathsZionFixed": "Der Berg Zion bleibt, wo er ist. Dreh die Wegplatten.",
    "zionPathsMany": "Schon viele Drehungen. Schau, wohin die Wege führen.",
    "zionPathsJoined": "Ein Mensch hat jetzt einen Weg zum Berg Zion!",
    "zionPathsAll": "Alle haben einen Weg zum Berg Zion!",
    "zionPathsKeys": "Mit den Pfeiltasten wählst du eine Platte. Mit Enter drehst du sie.",
    "zionPathsCount": "Auf dem Weg zum Zion: {n} von {total}",
    "zionPathsHelp": "Hilf mir",
    "zionPathsHelped": "Schau, diese Platte hat sich gedreht.",
    "zionPathsDone": "Kommt, laßt uns hinauf zum Berge des HERRN gehen und zum Hause des Gottes Jakobs, daß er uns lehre seine Wege und wir auf seiner Straße wandeln! (Micha 4,2)"
  },
  "en": {
    "lanternsField": "The evening sky over Galilee. Lanterns are rising.",
    "lanternsNames": "The names of the child",
    "lanternsNext": "next",
    "lanternsNamed": "Lantern with the name {name}",
    "lanternsNoName": "Lantern without a name",
    "lanternsCaught": "Caught: {name}!",
    "lanternsBlank": "This lantern has no name on it.",
    "lanternsOrder": "Not yet! First comes {name}.",
    "lanternsAll": "You have caught all the names of the child!",
    "lanternsLane": "Lane {n} of {total}",
    "lanternsKeys": "The arrow keys choose a lane. Enter catches the lantern in it.",
    "lanternsNone": "There is no lantern in this lane right now.",
    "lanternsCount": "Names caught: {n} of {total}",
    "lanternsHelp": "Help me",
    "lanternsHelped": "The lanterns rise more slowly now. You need the ones with the ring.",
    "lanternsDone": "For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace. (Isaiah 9:6)",
    "shootGrowField": "An old olive grove. The tree stump stands at the bottom, light falls in at the top.",
    "shootGrowStart": "Tap the picture or hold an arrow. Then the shoot grows.",
    "shootGrowGrows": "The shoot is growing! Steer it past the stones.",
    "shootGrowKeys": "Hold the left or right arrow key, and the shoot leans that way.",
    "shootGrowStone": "A stone! Steer the shoot to the side.",
    "shootGrowLight": "The shoot has reached the light!",
    "shootGrowLightLabel": "The light the shoot grows toward",
    "shootGrowStoneLabel": "Stone {n}",
    "shootGrowTip": "The tip of the shoot",
    "shootGrowLeft": "Steer left (hold)",
    "shootGrowRight": "Steer right (hold)",
    "shootGrowCount": "Way to the light: {n} %",
    "shootGrowHelp": "Help me",
    "shootGrowHelped": "Look, the shoot grows a little way by itself. Then you steer again.",
    "shootGrowDone": "And there shall come forth a rod out of the stem of Jesse, and a Branch shall grow out of his roots. (Isaiah 11:1)",
    "zionPathsField": "A map made of path tiles. Mount Zion is at the top.",
    "zionPathsCell": "Row {r}, column {c}",
    "zionPathsTile": "Path tile",
    "zionPathsZion": "Mount Zion",
    "zionPathsFieldTile": "Field without a path",
    "zionPathsPersonWaits": "Someone is waiting here.",
    "zionPathsPersonWay": "This person has a way to Zion.",
    "zionPathsFixed": "There is no path here. The field stays as it is.",
    "zionPathsZionFixed": "Mount Zion stays where it is. Turn the path tiles.",
    "zionPathsMany": "That is a lot of turns. Look where the paths lead.",
    "zionPathsJoined": "Someone now has a way to Mount Zion!",
    "zionPathsAll": "Everybody has a way to Mount Zion!",
    "zionPathsKeys": "The arrow keys choose a tile. Enter turns it.",
    "zionPathsCount": "On the way to Zion: {n} of {total}",
    "zionPathsHelp": "Help me",
    "zionPathsHelped": "Look, this tile has turned.",
    "zionPathsDone": "Come, and let us go up to the mountain of the Lord, and to the house of the God of Jacob; and he will teach us of his ways, and we will walk in his paths. (Micah 4:2)"
  },
  "es": {
    "lanternsField": "El cielo de la tarde sobre Galilea. Suben faroles.",
    "lanternsNames": "Los nombres del niño",
    "lanternsNext": "el siguiente",
    "lanternsNamed": "Farol con el nombre {name}",
    "lanternsNoName": "Farol sin nombre",
    "lanternsCaught": "¡Atrapado: {name}!",
    "lanternsBlank": "Este farol no lleva ningún nombre.",
    "lanternsOrder": "¡Todavía no! Primero viene {name}.",
    "lanternsAll": "¡Has atrapado todos los nombres del niño!",
    "lanternsLane": "Carril {n} de {total}",
    "lanternsKeys": "Con las flechas eliges un carril. Con Enter atrapas el farol que está en él.",
    "lanternsNone": "Ahora no hay ningún farol en este carril.",
    "lanternsCount": "Nombres atrapados: {n} de {total}",
    "lanternsHelp": "Ayúdame",
    "lanternsHelped": "Ahora los faroles suben más despacio. Necesitas los del anillo.",
    "lanternsDone": "Porque un niño nos es nacido, hijo nos es dado; y el principado sobre su hombro: y llamaráse su nombre Admirable, Consejero, Dios fuerte, Padre eterno, Príncipe de paz. (Isaías 9:6)",
    "shootGrowField": "Un viejo olivar. Abajo está el tocón del árbol, arriba entra la luz.",
    "shootGrowStart": "Toca la imagen o mantén pulsada una flecha. Entonces crece el brote.",
    "shootGrowGrows": "¡El brote crece! Guíalo entre las piedras.",
    "shootGrowKeys": "Mantén pulsada la flecha izquierda o derecha y el brote se inclina.",
    "shootGrowStone": "¡Una piedra! Guía el brote hacia un lado.",
    "shootGrowLight": "¡El brote ha llegado a la luz!",
    "shootGrowLightLabel": "La luz hacia la que crece el brote",
    "shootGrowStoneLabel": "Piedra {n}",
    "shootGrowTip": "La punta del brote",
    "shootGrowLeft": "Guiar a la izquierda (mantener pulsado)",
    "shootGrowRight": "Guiar a la derecha (mantener pulsado)",
    "shootGrowCount": "Camino a la luz: {n} %",
    "shootGrowHelp": "Ayúdame",
    "shootGrowHelped": "Mira, el brote crece un trecho solo. Luego lo guías tú otra vez.",
    "shootGrowDone": "Y saldrá una vara del tronco de Isaí, y un vástago retoñará de sus raíces. (Isaías 11:1)",
    "zionPathsField": "Un mapa hecho de losas de camino. Arriba está el monte Sión.",
    "zionPathsCell": "Fila {r}, columna {c}",
    "zionPathsTile": "Losa de camino",
    "zionPathsZion": "El monte Sión",
    "zionPathsFieldTile": "Campo sin camino",
    "zionPathsPersonWaits": "Aquí espera una persona.",
    "zionPathsPersonWay": "Esta persona tiene un camino a Sión.",
    "zionPathsFixed": "Aquí no hay camino. El campo se queda como está.",
    "zionPathsZionFixed": "El monte Sión se queda donde está. Gira las losas de camino.",
    "zionPathsMany": "Ya son muchos giros. Mira adónde llevan los caminos.",
    "zionPathsJoined": "¡Una persona ya tiene un camino al monte Sión!",
    "zionPathsAll": "¡Todos tienen un camino al monte Sión!",
    "zionPathsKeys": "Con las flechas eliges una losa. Con Enter la giras.",
    "zionPathsCount": "En camino a Sión: {n} de {total}",
    "zionPathsHelp": "Ayúdame",
    "zionPathsHelped": "Mira, esta losa ha girado.",
    "zionPathsDone": "Venid, y subamos al monte de Jehová, y á la casa del Dios de Jacob; y enseñarános en sus caminos, y andaremos por sus veredas. (Miqueas 4:2)"
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
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => box(0, 0, 300, 400) as DOMRect)
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
const until = async (cond: () => boolean, maxSeconds = 30, step = 100) => {
  for (let i = 0; i < (maxSeconds * 1000) / step && !cond(); i++) await tick(step)
  return cond()
}
const status = (w: VueWrapper) => w.find('[role="status"]').text()
const task = (n: number) => propheten.stages[n - 1]!.task as unknown as { lanterns: LanternGame; shootGrow: ShootGame; zionPaths: ZionGame }
const DE = NEW_KEYS.de

// ================================================================ the name lanterns
describe('GameLaternen', () => {
  const game = task(2).lanterns
  /** A lantern button in the middle band of the sky that carries one of `names` (-1 = no name). */
  const lanternWith = (w: VueWrapper, names: number[]) =>
    w.findAll('.gm-lantern').find((b) => {
      const top = parseFloat((b.element as HTMLElement).style.top)
      return names.includes(Number(b.attributes('data-name'))) && top > 10 && top < 90
    })
  async function catchNames(w: VueWrapper, next: () => number[]) {
    for (let i = 0; i < 600; i++) {
      const want = next()
      if (!want.length) return
      const b = lanternWith(w, want)
      if (b) await b.trigger('click')
      await tick(100)
    }
  }

  it('round 1: a name is caught (tick, the name in the row), a lantern without a name is a mistake; round 2 wants the order of the verse; the end shows the stars and Isaiah 9,5', async () => {
    const w = mount(GameLaternen, { props: { game }, ...opts() })
    const progress = useTaskProgress()
    expect(progress.goal.value).toBe(10)
    expect(w.findAll('.gm-name').map((n) => n.text())).toEqual(['Wunderbar', 'Rat', 'Held', 'Ewig-Vater', 'Friedefürst'])
    expect(await until(() => !!lanternWith(w, [0, 1, 2, 3, 4]), 20)).toBe(true)
    const named = lanternWith(w, [0, 1, 2, 3, 4])!
    const name = Number(named.attributes('data-name'))
    expect(named.text()).toContain(game.names[name])
    await named.trigger('click')
    expect(status(w)).toBe(DE.lanternsCaught!.replace('{name}', game.names[name]!))
    expect(w.find(`.gm-name[data-name="${name}"]`).classes()).toContain('caught')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(count('bead')).toBe(1)
    expect(progress.parts.value).toBe(1)
    expect(await until(() => !!lanternWith(w, [-1]), 20)).toBe(true)
    await lanternWith(w, [-1])!.trigger('click')
    expect(status(w)).toBe(DE.lanternsBlank)
    expect(count('wrong')).toBe(1)
    const caught = () => w.findAll('.gm-name.caught').map((n) => Number(n.attributes('data-name')))
    await catchNames(w, () => [0, 1, 2, 3, 4].filter((k) => !caught().includes(k)))
    expect(status(w)).toBe(DE.lanternsAll)
    await tick(3000)
    expect(w.find('.gm-round').text()).toContain('2')
    expect(w.findAll('.gm-name.caught')).toHaveLength(0)
    expect(w.find('.gm-name.next').attributes('data-name')).toBe('0')
    // a name out of turn is a mistake
    expect(await until(() => !!lanternWith(w, [1, 2, 3, 4]), 20)).toBe(true)
    await lanternWith(w, [1, 2, 3, 4])!.trigger('click')
    expect(status(w)).toBe(DE.lanternsOrder!.replace('{name}', 'Wunderbar'))
    expect(count('wrong')).toBe(2)
    await catchNames(w, () => {
      const n = w.find('.gm-name.next')
      return n.exists() ? [Number(n.attributes('data-name'))] : []
    })
    expect(progress.parts.value).toBe(10)
    await tick(3000)
    expect(w.text()).toContain(DE.lanternsDone)
    expect(w.findAll('.ast-star, [class*="star"]').length).toBeGreaterThan(0)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([prophetenStars(2)])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('keys: the first arrow takes the middle lane, the next ones move it (a dashed band); Enter catches the lantern of that lane nearest the middle or says that there is none', async () => {
    const w = mount(GameLaternen, { props: { game }, ...opts() })
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.gm-lane').exists()).toBe(true)
    expect(status(w)).toBe(DE.lanternsLane!.replace('{n}', '3').replace('{total}', '5'))
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toBe(DE.lanternsLane!.replace('{n}', '4').replace('{total}', '5'))
    let done = false
    for (let i = 0; i < 300 && !done; i++) {
      await tick(100)
      const before = played.length
      await field.trigger('keydown', { key: 'Enter' })
      if (played.length > before) done = true
    }
    expect(done).toBe(true)
    expect(count('bead') + count('wrong')).toBe(1)
    w.unmount()
  })

  it('"Help me" comes after fifteen seconds without a tap: the sky runs at half speed and the wanted lanterns get a ring', async () => {
    const w = mount(GameLaternen, { props: { game }, ...opts() })
    await tick(14000)
    expect(w.text()).not.toContain(DE.lanternsHelp)
    await tick(1500)
    const help = w.findAll('button').find((b) => b.text() === DE.lanternsHelp)!
    await help.trigger('click')
    expect(status(w)).toBe(DE.lanternsHelped)
    expect(await until(() => w.findAll('.gm-lantern.wanted').length > 0, 10)).toBe(true)
    for (const b of w.findAll('.gm-lantern.wanted')) expect(Number(b.attributes('data-name'))).toBeGreaterThanOrEqual(0)
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameLaternen, { props: { game }, ...opts('en') })
    expect(en.find('.gm-field').attributes('aria-label')).toBe(NEW_KEYS.en.lanternsField)
    expect(en.text()).toContain('Names caught: 0 of 5')
    en.unmount()
    const es = mount(GameLaternen, { props: { game }, ...opts('es') })
    expect(es.text()).toContain('Nombres atrapados: 0 de 5')
    es.unmount()
  })
})

// ================================================================ the shoot
describe('GameSpross', () => {
  const game = task(4).shootGrow
  const heading = (w: VueWrapper) => parseFloat(/rotate\((-?[\d.]+)deg\)/.exec((w.find('[data-tip]').element as HTMLElement).style.transform)![1]!)
  const tipTop = (w: VueWrapper) => parseFloat((w.find('[data-tip]').element as HTMLElement).style.top)

  it('nothing grows before the start; Enter starts, the shoot grows into a stone (a mistake, a cross), and with "Help me" it reaches the light; two rounds, then the stars and Isaiah 11,1', async () => {
    const w = mount(GameSpross, { props: { game }, ...opts() })
    const progress = useTaskProgress()
    expect(progress.goal.value).toBe(20)
    expect(status(w)).toBe(DE.shootGrowStart)
    const y0 = tipTop(w)
    await tick(2000)
    expect(tipTop(w)).toBe(y0)
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    await tick(1000)
    expect(tipTop(w)).toBeLessThan(y0)
    expect(await until(() => count('wrong') === 1, 15)).toBe(true)
    expect(status(w)).toBe(DE.shootGrowStone)
    expect(w.find('.gm-mark').exists()).toBe(true)
    // nobody steers: "Help me" appears, the shoot grows along the way of the help
    for (let round = 0; round < 2; round++) {
      const ok = await until(() => {
        const help = w.findAll('button').find((b) => b.text() === DE.shootGrowHelp)
        if (help) void help.trigger('click')
        return w.text().includes(DE.shootGrowLight!) || w.text().includes(DE.shootGrowDone!)
      }, 120, 250)
      expect(ok).toBe(true)
      await tick(3000)
      if (round === 0) {
        expect(w.find('.gm-round').text()).toContain('2')
        expect(status(w)).toBe(DE.shootGrowStart)
        await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
      }
    }
    expect(progress.parts.value).toBe(20)
    expect(w.text()).toContain(DE.shootGrowDone)
    await w.find('button').trigger('click')
    const stars = w.emitted('done')![0]![0] as number
    expect(stars).toBe(prophetenStars(count('wrong')))
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('steering: an arrow key held turns the tip, letting go keeps the lean; the buttons below turn it too; a finger on the picture turns it toward the finger', async () => {
    const w = mount(GameSpross, { props: { game }, ...opts() })
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowLeft' })
    await tick(300)
    expect(heading(w)).toBeLessThan(-10)
    await field.trigger('keyup', { key: 'ArrowLeft' })
    const h = heading(w)
    await tick(300)
    expect(heading(w)).toBeCloseTo(h, 5)
    const right = w.find('[data-turn="right"]')
    right.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }))
    await tick(600)
    expect(heading(w)).toBeGreaterThan(h + 20)
    right.element.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0 }))
    // the finger far left of the tip (the field is 300 x 400 in this test)
    field.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 10, clientY: 150 }))
    await tick(800)
    expect(heading(w)).toBeLessThan(-10)
    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 10, clientY: 150 }))
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameSpross, { props: { game }, ...opts('en') })
    expect(en.text()).toContain(NEW_KEYS.en.shootGrowStart)
    expect(en.find('[data-turn="left"]').attributes('aria-label')).toBe('Steer left (hold)')
    en.unmount()
    const es = mount(GameSpross, { props: { game }, ...opts('es') })
    expect(es.text()).toContain('Camino a la luz: 0 %')
    es.unmount()
  })
})

// ================================================================ ways to Zion
describe('GameZionwege', () => {
  const game = task(9).zionPaths
  const cell = (w: VueWrapper, r: number, c: number) => w.find(`[data-cell="${r}-${c}"]`)
  async function solve(w: VueWrapper, round: ZionRound) {
    const start = zionTurns(round.start)
    const sol = zionTurns(round.solution)
    for (let r = 0; r < round.rows.length; r++)
      for (let c = 0; c < round.rows[r]!.length; c++) {
        const k = round.rows[r]![c]!
        if (!'ILTE'.includes(k)) continue
        for (let n = zionCost(k as ZionKind, start[r]![c]!, sol[r]![c]!); n > 0; n--) await cell(w, r, c).trigger('click')
      }
  }

  it('a field and Mount Zion do not turn; turning the tiles of the solution gives everybody a way (ticks, count); extra taps become a mistake; the end shows the stars and Micah 4,2', async () => {
    const w = mount(GameZionwege, { props: { game }, ...opts() })
    const progress = useTaskProgress()
    expect(progress.goal.value).toBe(7)
    const r1 = game.rounds[0]!
    expect(w.findAll('.gm-cell')).toHaveLength(16)
    expect(w.text()).toContain('Auf dem Weg zum Zion: 0 von 3')
    await cell(w, 0, 0).trigger('click')
    expect(status(w)).toBe(DE.zionPathsFixed)
    await cell(w, 0, 1).trigger('click')
    expect(status(w)).toBe(DE.zionPathsZionFixed)
    expect(count('tap')).toBe(0)
    const before = (cell(w, 1, 0).find('.gm-tile').element as HTMLElement).style.transform
    await solve(w, r1)
    expect((cell(w, 1, 0).find('.gm-tile').element as HTMLElement).style.transform).not.toBe(before)
    expect(count('tap')).toBe(r1.par)
    expect(w.findAll('.gm-ok')).toHaveLength(3)
    expect(w.text()).toContain('Auf dem Weg zum Zion: 3 von 3')
    expect(status(w)).toBe(DE.zionPathsAll)
    expect(progress.parts.value).toBe(3)
    expect(count('wrong')).toBe(0)
    await tick(3000)
    expect(w.find('.gm-round').text()).toContain('2')
    expect(w.findAll('.gm-cell')).toHaveLength(25)
    expect(w.findAll('.gm-ok')).toHaveLength(0)
    // four taps on one tile turn it round once: four taps more than needed, one mistake at the end
    for (let i = 0; i < 4; i++) await cell(w, 1, 1).trigger('click')
    await solve(w, game.rounds[1]!)
    expect(count('wrong')).toBe(1)
    expect(progress.parts.value).toBe(7)
    await tick(3000)
    expect(w.text()).toContain(DE.zionPathsDone)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([prophetenStars(1)])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('keys: the arrows choose a tile (a dashed frame and its name), Enter turns it', async () => {
    const w = mount(GameZionwege, { props: { game }, ...opts() })
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toBe(DE.zionPathsKeys)
    expect(w.find('.gm-cell.cursor').attributes('data-cell')).toBe('1-0')
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.gm-cell.cursor').attributes('data-cell')).toBe('1-1')
    expect(status(w)).toContain('Reihe 2, Spalte 2')
    const before = (cell(w, 1, 1).find('.gm-tile').element as HTMLElement).style.transform
    await field.trigger('keydown', { key: 'Enter' })
    expect((cell(w, 1, 1).find('.gm-tile').element as HTMLElement).style.transform).not.toBe(before)
    expect(count('tap')).toBe(1)
    w.unmount()
  })

  it('"Help me" after fifteen seconds turns the next tile of a solution by itself; with it alone a round is solved', async () => {
    const w = mount(GameZionwege, { props: { game }, ...opts() })
    await tick(14000)
    expect(w.text()).not.toContain(DE.zionPathsHelp)
    const ok = await until(() => {
      const help = w.findAll('button').find((b) => b.text() === DE.zionPathsHelp)
      if (help) void help.trigger('click')
      return w.findAll('.gm-ok').length === 3
    }, 400, 500)
    expect(ok).toBe(true)
    expect(count('tap')).toBe(game.rounds[0]!.par)
    expect(count('wrong')).toBe(0)
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameZionwege, { props: { game }, ...opts('en') })
    expect(en.text()).toContain('On the way to Zion: 0 of 3')
    expect(en.find('[data-cell="0-1"]').attributes('aria-label')).toContain('Mount Zion')
    en.unmount()
    const es = mount(GameZionwege, { props: { game }, ...opts('es') })
    expect(es.text()).toContain('En camino a Sión: 0 de 3')
    es.unmount()
  })
})
