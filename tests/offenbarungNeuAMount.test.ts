/**
 * "Write it in a book" (`schreiben` = GameSchreiben), "Seven letters" (`briefe` = GameBriefe) and "All join in" (`lob` = GameLob) of "Alles wird neu" (`offenbarung`),
 * mounted with sample data and played through: right and wrong moves (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds, the rounds,
 * the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`offenbarungNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameSchreiben from '@/components/molecules/games/GameSchreiben.vue'
import GameBriefe from '@/components/molecules/games/GameBriefe.vue'
import GameLob from '@/components/molecules/games/GameLob.vue'
import { osterStars } from '@/utils/osternGames'
import { LETTERS, PRAISE, WRITE } from './offenbarungSamples'
import { OFFENBARUNG_WORDS } from './offenbarungNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...OFFENBARUNG_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the top left: a pointer at (x, y) is (x %, y %) of the field
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
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
type Wr = ReturnType<typeof mount>
const helpButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Hilf mir')

// ---------------------------------------------------------------- schreiben
describe('Schreib es in ein Buch (schreiben)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSchreiben, { props: { game: WRITE }, ...opts(locale) })
  /** The pen goes down at the first place, moves over the others and lets go. */
  const draw = async (w: Wr, ...pts: [number, number][]) => {
    const f = w.find('.gm-field').element
    pointer(f, 'pointerdown', pts[0]![0], pts[0]![1])
    for (const p of pts.slice(1)) pointer(window, 'pointermove', p[0], p[1])
    pointer(window, 'pointerup', pts[pts.length - 1]![0], pts[pts.length - 1]![1])
    await flushPromises()
  }
  const dip = async (w: Wr) => {
    await w.find('.gm-well').trigger('click')
  }
  /** The x of a share of the line. */
  const at = (share: number) => 15 + share * 53

  it('the goal is every line; three lines, the inkwell, the drop, the pen; the hint, the round, the status line, no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.findAll('.gm-line')).toHaveLength(3)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Drei kurze Zeilen.')
    expect(w.find('.gm-well').attributes('aria-label')).toBe('Tintenfass. Tippen, um die Feder einzutauchen.')
    expect(w.find('.gm-drop').attributes('aria-label')).toBe('Tinte in der Feder: 0 Prozent')
    expect(w.find('.gm-pen').exists()).toBe(true)
    expect(w.find('.gm-count').text()).toBe('Zeile 1 von 3, Tinte 0 %')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a pen without ink writes nothing and says so (no mistake); a dip fills it', async () => {
    const w = mountIt()
    await draw(w, [16, 38], [30, 38])
    expect(w.find('.gm-script').exists()).toBe(false)
    expect(w.text()).toContain('Tauch die Feder zuerst ins Tintenfass.')
    expect(count('wrong')).toBe(0)
    await dip(w)
    expect(count('tap')).toBe(1)
    expect(w.text()).toContain('Die Feder ist voll.')
    expect(w.find('.gm-count').text()).toBe('Zeile 1 von 3, Tinte 100 %')
  })

  it('the script follows the finger and uses ink; "The ink is running out!" at 20 percent; leaving the line writes nothing and is no mistake', async () => {
    const w = mountIt()
    await dip(w)
    await draw(w, [16, 38], [at(0.28), 38])
    expect(w.find('.gm-script').attributes('data-written')).toBe('28')
    expect(w.find('.gm-count').text()).toContain('Tinte 53 %')
    await draw(w, [16, 38], [at(0.4), 80], [at(0.45), 80])
    expect(w.find('.gm-script').attributes('data-written')).toBe('28')
    await draw(w, [16, 38], [at(0.5), 38])
    expect(w.text()).toContain('Die Tinte geht aus!')
    expect(count('wrong')).toBe(0)
  })

  it('the pen runs dry while the finger goes on: a cross, a word, a low tone, a mistake; after a dip the writing goes on where it stopped and the line is done', async () => {
    const w = mountIt()
    await dip(w)
    await draw(w, [16, 38], [at(0.4), 38], [at(0.85), 38])
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Feder ist trocken.')
    expect(w.find('.gm-script').attributes('data-written')).toBe('60')
    expect(w.find('.gm-mark').exists()).toBe(true)
    await dip(w)
    await draw(w, [16, 38], [at(0.9), 38], [68, 38])
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Die Zeile ist fertig.')
    expect(w.find('[data-line="0"]').classes()).not.toContain('now')
    expect(w.find('[data-line="1"]').classes()).toContain('now')
  })

  it('dipping works with the pen over the inkwell, too', async () => {
    const w = mountIt()
    pointer(w.find('.gm-field').element, 'pointerdown', 88, 40)
    pointer(window, 'pointerup', 88, 40)
    await flushPromises()
    expect(count('tap')).toBe(1)
    expect(w.find('.gm-count').text()).toContain('Tinte 100 %')
  })

  it('both rounds played through without a mistake: five more longer lines, the closed book, the verse, three stars', async () => {
    const w = mountIt()
    // round 1: lines at 38, 50, 62; one dip is worth 60 percent
    for (const y of [38, 50, 62]) {
      await dip(w)
      await draw(w, [16, y], [at(0.58), y])
      await dip(w)
      await draw(w, [16, y], [68, y])
    }
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.text()).toContain('Alle Zeilen sind geschrieben!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Fünf längere Zeilen.')
    expect(w.findAll('.gm-line')).toHaveLength(5)
    // round 2: lines at 26 ... 74; one dip is worth 37.5 percent of a line
    for (const y of [26, 38, 50, 62, 74]) {
      await dip(w)
      await draw(w, [16, y], [at(0.36), y])
      await dip(w)
      await draw(w, [16, y], [at(0.72), y])
      await dip(w)
      await draw(w, [16, y], [68, y])
    }
    expect(useTaskProgress().parts.value).toBe(8)
    expect(count('wrong')).toBe(0)
    await tick(1500)
    expect(w.text()).toContain('Johannes rollt das Buch zu.')
    expect(w.find('.gm-line').exists()).toBe(false)
    await tick(3000)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Was du siehst, das schreibe in ein Buch und sende es zu den Gemeinden in Asien.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(problems()).toEqual([])
  })

  it('the keyboard: Enter dips, the right arrow writes a bit; with the keys a pen that is dry only asks for a dip', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'Enter' })
    expect(count('tap')).toBe(1)
    for (let i = 0; i < 10; i++) await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.gm-script').attributes('data-written')).toBe('40')
    for (let i = 0; i < 6; i++) await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.gm-script').attributes('data-written')).toBe('60')
    expect(w.text()).toContain('Tauch die Feder zuerst ins Tintenfass.')
    expect(count('wrong')).toBe(0)
  })

  it('"Help me" comes after fifteen seconds and lets the inkwell glow', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Das Tintenfass leuchtet. Tipp darauf.')
    expect(w.find('.gm-well').classes()).toContain('pulse')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-well').attributes('aria-label')).toBe('Inkwell. Tap to dip the pen.')
    expect(mountIt('es').find('.gm-well').attributes('aria-label')).toBe('Tintero. Toca para mojar la pluma.')
  })
})

// ---------------------------------------------------------------- briefe
describe('Sieben Briefe (briefe)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBriefe, { props: { game: LETTERS }, ...opts(locale) })
  /** Waits until the messenger stands at a gate (the letters can be given). */
  const arrive = async (w: Wr) => {
    for (let i = 0; i < 80 && w.find('.gm-letter').attributes('disabled') !== undefined; i++) await tick(250)
    expect(w.find('.gm-letter').attributes('disabled')).toBeUndefined()
  }
  const give = async (w: Wr, id: string) => {
    await w.find(`[data-letter="${id}"]`).trigger('click')
  }

  it('the goal is every city of both rounds; round 1 has three gates with names and three letters, all shut until the messenger has arrived', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.findAll('.gm-gate')).toHaveLength(3)
    expect(w.findAll('.gm-gname').map((n) => n.text())).toEqual(['Ephesus', 'Smyrna', 'Pergamon'])
    expect(w.findAll('.gm-letter')).toHaveLength(3)
    expect(w.findAll('.gm-letter').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.find('[data-gate="smyrna"]').attributes('aria-label')).toBe('Das Stadttor von Smyrna')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the messenger walks to the first gate and stops; the wrong letter: a cross, a word, a low tone, a mistake, the letter stays; the right letter lights the lamp', async () => {
    const w = mountIt()
    await arrive(w)
    expect(w.text()).toContain('Der Bote steht in Ephesus. Welcher Brief gehört hierher?')
    expect(w.find('[data-gate="ephesus"]').classes()).toContain('now')
    await give(w, 'smyrna')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist nicht der Brief für diese Stadt.')
    expect(w.find('[data-letter="smyrna"]').exists()).toBe(true)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect((w.find('[data-lamp="ephesus"]').element as HTMLElement).style.display).toBe('none')
    await give(w, 'ephesus')
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Der Brief für Ephesus ist angekommen!')
    expect(w.find('[data-letter="ephesus"]').exists()).toBe(false)
    expect((w.find('[data-lamp="ephesus"]').element as HTMLElement).style.display).not.toBe('none')
    expect(useTaskProgress().parts.value).toBe(1)
    // while he walks on, no letter can be given
    expect(w.findAll('.gm-letter').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('both rounds played through: seven gates without names in round 2, seven lamps, the verse, the stars', async () => {
    const w = mountIt()
    for (const id of ['ephesus', 'smyrna', 'pergamon']) {
      await arrive(w)
      await give(w, id)
    }
    expect(w.text()).toContain('Alle Briefe sind angekommen!')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-gate')).toHaveLength(7)
    expect(w.findAll('.gm-gname')).toHaveLength(0)
    expect(w.findAll('.gm-letter')).toHaveLength(7)
    expect(w.find('[data-gate="sardes"]').attributes('aria-label')).toBe('Das Stadttor von Sardes')
    for (const id of ['ephesus', 'smyrna', 'pergamon', 'thyatira', 'sardes', 'philadelphia', 'laodizea']) {
      await arrive(w)
      if (id === 'sardes') expect(w.text()).toContain('Der Bote steht an einem Stadttor. Welcher Brief gehört hierher?')
      await give(w, id)
    }
    expect(useTaskProgress().parts.value).toBe(10)
    expect(count('wrong')).toBe(0)
    await tick(2700)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Wer Ohren hat, der höre, was der Geist den Gemeinden sagt!')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(problems()).toEqual([])
  })

  it('"Help me" comes after fifteen seconds at a gate and lifts the right letter', async () => {
    const w = mountIt()
    await arrive(w)
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('[data-letter="ephesus"]').classes()).toContain('help')
    expect(w.text()).toContain('Schau auf das Siegel des Briefes.')
  })

  it('the arrow keys move between the letters', async () => {
    const w = mountIt()
    await arrive(w)
    const tray = w.find('.gm-tray')
    const first = w.findAll('.gm-letter')[0]!.element as HTMLElement
    first.focus()
    expect(document.activeElement).toBe(first)
    await tray.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(w.findAll('.gm-letter')[1]!.element)
    await tray.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(first)
  })

  it('with less motion the messenger does not walk but stands at the gate at once', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
    await tick(800)
    expect(w.find('.gm-letter').attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('Der Bote steht in Ephesus.')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('[data-gate="smyrna"]').attributes('aria-label')).toBe('The gate of Smyrna')
    expect(mountIt('es').find('[data-gate="smyrna"]').attributes('aria-label')).toBe('La puerta de Smyrna')
  })
})

// ---------------------------------------------------------------- lob
describe('Alle stimmen ein (lob)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameLob, { props: { game: PRAISE }, ...opts(locale) })
  const call = async (w: Wr, id: string) => {
    await w.find(`[data-zone="${id}"]`).trigger('click')
  }

  it('the goal is three groups and four quarters of the song; three areas with names; round 1 shows the groups still', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('.gm-zone').map((z) => z.text())).toEqual(['Der Himmel', 'Die Erde', 'Das Meer'])
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Ruf Himmel, Erde und Meer zum Lob.')
    expect((w.find('[data-sing="himmel"]').element as HTMLElement).style.opacity).toBe('0')
    expect(w.find('.gm-time').exists()).toBe(false)
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('round 1: out of order is a mistake with the right place in the words; the right group joins in and sings; the same group again is no mistake', async () => {
    const w = mountIt()
    await call(w, 'meer')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Hör noch einmal: Johannes hört zuerst im Himmel.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    await call(w, 'himmel')
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Der Himmel stimmt ein!')
    expect((w.find('[data-sing="himmel"]').element as HTMLElement).style.opacity).toBe('1')
    expect(useTaskProgress().parts.value).toBe(1)
    await call(w, 'himmel')
    expect(w.text()).toContain('Der Himmel singt schon.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-count').text()).toBe('Stimmen: 1 von 3')
  })

  it('round 2: every group gets quieter on its own, with its percent in words; a silent group is a mistake, joins in again after two seconds; the clock stands while it is silent', async () => {
    const w = mountIt()
    for (const id of ['himmel', 'erde', 'meer']) await call(w, id)
    expect(w.text()).toContain('Alle drei stimmen ein!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Halte alle beim Singen.')
    expect(w.find('.gm-time').exists()).toBe(true)
    expect(w.find('[data-zone="meer"]').text()).toMatch(/^Das Meer \d+ %$/)
    await tick(1000)
    const early = w.find('.gm-time-text').text()
    expect(early).toMatch(/^Lied: \d+ %$/)
    // the sea has 4 seconds from the start (fade 6000, offset 2000)
    await tick(3500)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das Meer ist still geworden.')
    expect(w.find('[data-zone="meer"]').text()).toBe('Das Meer 0 %')
    const before = w.find('.gm-time-text').text()
    await tick(1000)
    expect(w.find('.gm-time-text').text()).toBe(before)
    await tick(1200)
    expect(w.text()).toContain('Das Meer stimmt wieder ein.')
    expect(w.find('[data-zone="meer"]').text()).not.toBe('Das Meer 0 %')
  })

  it('round 2: a call lets a group sing in full again; kept up for twenty seconds the song ends with the Amen, the verse and the stars', async () => {
    const w = mountIt()
    for (const id of ['himmel', 'erde', 'meer']) await call(w, id)
    await tick(2900)
    for (let s = 0; s < 22 && !w.text().includes('Amen!'); s += 2) {
      for (const id of ['himmel', 'erde', 'meer']) await call(w, id)
      await tick(2000)
    }
    expect(w.text()).toContain('Amen! Alle haben bis zum Schluss gesungen.')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(2700)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Dem, der auf dem Stuhl sitzt, und dem Lamm sei Lob und Ehre und Preis und Gewalt von Ewigkeit zu Ewigkeit!')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(problems()).toEqual([])
  })

  it('"Help me" comes after fifteen seconds: round 1 the next group glows', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('[data-zone="himmel"]').classes()).toContain('help')
    expect(w.text()).toContain('Der Himmel leuchtet. Tipp darauf.')
  })

  it('the arrow keys move between the groups', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    const first = w.findAll('.gm-zone')[0]!.element as HTMLElement
    first.focus()
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(w.findAll('.gm-zone')[1]!.element)
    await field.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(first)
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('The wide world')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('El mundo entero')
  })
})
