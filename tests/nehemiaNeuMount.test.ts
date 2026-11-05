/**
 * The three new games of "Nehemia" (Anton's plan of 5.11.2026), each mounted with sample data and played through:
 * GameBecher (the finger leads Nehemiah, a bump spills, the arrow keys, the help, both rounds, the end), GamePfand (the chest, the wrong and the right family, dragging, the help, the end),
 * GameLaubhuetten (picking, the roof, the thorn bush, a tap on the path, the arrow keys, the help, the end); the goal of "Go on" (`useTaskProgress`), the stars and the words of the Bible,
 * German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/nehemia/INTEGRATION.json, written by D:/Claude/Abenteuer-Nehemia/tools/i18n_neu_nehemia.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameBecher from '@/components/molecules/games/GameBecher.vue'
import GamePfand from '@/components/molecules/games/GamePfand.vue'
import GameLaubhuetten from '@/components/molecules/games/GameLaubhuetten.vue'
import { boothNext, boothProblems, cupProblems, pledgeOwner, pledgeProblems } from '@/utils/nehemiaNeu'
import type { BoothGame, BoothState, CupGame, PledgeGame, PledgeKind } from '@/utils/nehemiaNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "cupCarryField": "Der Thronsaal in Susa. Oben sitzen der König und die Königin. Nehemia trägt den vollen Becher.",
    "cupCarryCalm": "Der Wein ist ruhig.",
    "cupCarrySloshing": "Der Wein schwappt.",
    "cupCarryCareful": "Vorsicht, gleich läuft er über!",
    "cupCarryBump": "Vorsicht, {thing}! Der Wein schwappt.",
    "cupCarrySpill": "Oh! Ein wenig Wein ist übergeschwappt. Geh ruhiger.",
    "cupCarryArrived": "Geschafft! Nehemia reicht dem König den Becher.",
    "cupCarryHelp": "Hilf mir",
    "cupCarryHelping": "Schau: Nehemia geht ein Stück ganz ruhig. Dann führst du wieder.",
    "cupCarryDone": "Im Monat Nisan des zwanzigsten Jahre des Königs Arthahsastha, da Wein vor ihm stand, hob ich den Wein auf und gab dem König. (Nehemia 2,1)",
    "pledgesField": "Ein Platz in Jerusalem. Vorn steht die Truhe mit den Pfandscheinen, dahinter warten die Familien.",
    "pledgesChest": "Die Truhe: noch {n} Pfandscheine. Antippen zieht einen heraus.",
    "pledgesTaken": "Aus der Truhe: {thing}. Welcher Familie gehört der Schein?",
    "pledgesInHand": "Pfandschein in der Hand: {thing}",
    "pledgesFirst": "Zieh zuerst einen Pfandschein aus der Truhe.",
    "pledgesAlready": "Diese Familie hat ihr Pfand schon zurück.",
    "pledgesWrong": "Das ist nicht ihr Pfand. Schau auf das blasse Bild über den Familien.",
    "pledgesRight": "{thing} gehört ihnen wieder!",
    "pledgesFamilyWaits": "{family}. Sie warten auf ihr Pfand: {thing}.",
    "pledgesFamilyHas": "{family}. {thing} gehört ihnen wieder.",
    "pledgesCount": "Zurückgegeben: {n} von {total}",
    "pledgesRoundDone": "Alle Familien haben zurück, was ihnen gehört.",
    "pledgesHelp": "Hilf mir",
    "pledgesHelpChest": "Tippe auf die Truhe und zieh einen Pfandschein heraus.",
    "pledgesHelping": "Schau: Diese Familie wartet auf den Schein in deiner Hand.",
    "pledgesDone": "So gebt ihnen nun heute wieder ihre Äcker, Weinberge, Ölgärten und Häuser … Da sprachen sie: Wir wollen’s wiedergeben und wollen nichts von ihnen fordern und wollen tun wie du gesagt hast. (Nehemia 5,11–12)",
    "boothsField": "Links der Hang mit den Bäumen, rechts das Haus mit der Treppe aufs Dach. Auf dem Dach steht das Gestell für die Laubhütte.",
    "boothsNeedTitle": "Das braucht die Hütte",
    "boothsNeed": "{things}: {n} von {total}",
    "boothsTree": "{tree}: einen Zweig holen",
    "boothsHouse": "Das Haus: die Zweige aufs Dach bringen. An der Hütte: {n} von {total}",
    "boothsBasket": "Im Korb: {n} von {total}",
    "boothsPicked": "Ein {thing} ist im Korb.",
    "boothsThorn": "Am dürren Dornbusch ist kein Laub. Hol Zweige von Ölbaum, Myrte und Palme.",
    "boothsEnough": "Genug {things}! Hol eine andere Sorte.",
    "boothsFull": "Der Korb ist voll. Bring die Zweige aufs Dach! Tippe auf das Haus.",
    "boothsEmpty": "Der Korb ist leer. Hol zuerst Zweige von den Bäumen.",
    "boothsBuilt": "Die Zweige sind an der Hütte festgebunden.",
    "boothsRoundDone": "Die Laubhütte steht!",
    "boothsHelp": "Hilf mir",
    "boothsHelpingTree": "Schau: Der Mann holt einen {thing}.",
    "boothsHelpingRoof": "Schau: Der Mann bringt den Korb aufs Dach.",
    "boothsDone": "Und das Volk ging hinaus und holten und machten sich Laubhütten, ein jeglicher auf seinem Dach und in ihren Höfen … und es war eine große Freude. (Nehemia 8,16–17)"
  },
  "en": {
    "cupCarryField": "The throne hall in Shushan. The king and the queen sit at the top. Nehemiah carries the full cup.",
    "cupCarryCalm": "The wine is calm.",
    "cupCarrySloshing": "The wine sloshes.",
    "cupCarryCareful": "Careful, it is about to spill!",
    "cupCarryBump": "Careful, {thing}! The wine sloshes.",
    "cupCarrySpill": "Oh! A little wine spilled. Walk more calmly.",
    "cupCarryArrived": "Well done! Nehemiah hands the king the cup.",
    "cupCarryHelp": "Help me",
    "cupCarryHelping": "Look: Nehemiah walks a little way very calmly. Then you lead again.",
    "cupCarryDone": "And it came to pass in the month Nisan, in the twentieth year of Artaxerxes the king, that wine was before him: and I took up the wine, and gave it unto the king. (Nehemiah 2:1)",
    "pledgesField": "A square in Jerusalem. The chest with the pledges stands in front, the families wait behind it.",
    "pledgesChest": "The chest: {n} pledges left. Tap it to pull one out.",
    "pledgesTaken": "Out of the chest: {thing}. Which family does it belong to?",
    "pledgesInHand": "Pledge in your hand: {thing}",
    "pledgesFirst": "First pull a pledge out of the chest.",
    "pledgesAlready": "This family already has its pledge back.",
    "pledgesWrong": "That is not their pledge. Look at the pale picture above the families.",
    "pledgesRight": "{thing} is theirs again!",
    "pledgesFamilyWaits": "{family}. They are waiting for their pledge: {thing}.",
    "pledgesFamilyHas": "{family}. {thing} is theirs again.",
    "pledgesCount": "Given back: {n} of {total}",
    "pledgesRoundDone": "Every family has back what belongs to it.",
    "pledgesHelp": "Help me",
    "pledgesHelpChest": "Tap the chest and pull out a pledge.",
    "pledgesHelping": "Look: this family is waiting for the pledge in your hand.",
    "pledgesDone": "Restore, I pray you, to them, even this day, their lands, their vineyards, their oliveyards, and their houses … Then said they, We will restore them, and will require nothing of them; so will we do as thou sayest. (Nehemiah 5:11–12)",
    "boothsField": "On the left the hillside with the trees, on the right the house with the stairs to the roof. On the roof stands the frame of the booth.",
    "boothsNeedTitle": "What the booth needs",
    "boothsNeed": "{things}: {n} of {total}",
    "boothsTree": "{tree}: fetch a branch",
    "boothsHouse": "The house: take the branches up to the roof. On the booth: {n} of {total}",
    "boothsBasket": "In the basket: {n} of {total}",
    "boothsPicked": "One more in the basket: {thing}.",
    "boothsThorn": "The dry thorn bush has no leaves. Fetch branches of olive, myrtle and palm.",
    "boothsEnough": "Enough {things}! Fetch another kind.",
    "boothsFull": "The basket is full. Take the branches up to the roof! Tap the house.",
    "boothsEmpty": "The basket is empty. First fetch branches from the trees.",
    "boothsBuilt": "The branches are tied to the booth.",
    "boothsRoundDone": "The booth is finished!",
    "boothsHelp": "Help me",
    "boothsHelpingTree": "Look: the man fetches a branch: {thing}.",
    "boothsHelpingRoof": "Look: the man takes the basket up to the roof.",
    "boothsDone": "So the people went forth, and brought them, and made themselves booths, every one upon the roof of his house, and in their courts … And there was very great gladness. (Nehemiah 8:16–17)"
  },
  "es": {
    "cupCarryField": "La sala del trono en Susa. Arriba están sentados el rey y la reina. Nehemías lleva la copa llena.",
    "cupCarryCalm": "El vino está tranquilo.",
    "cupCarrySloshing": "El vino se mueve.",
    "cupCarryCareful": "¡Cuidado, se va a derramar!",
    "cupCarryBump": "¡Cuidado, {thing}! El vino se mueve.",
    "cupCarrySpill": "¡Oh! Se derramó un poco de vino. Camina más despacio.",
    "cupCarryArrived": "¡Lo lograste! Nehemías le da la copa al rey.",
    "cupCarryHelp": "Ayúdame",
    "cupCarryHelping": "Mira: Nehemías camina un trecho muy tranquilo. Luego guías tú otra vez.",
    "cupCarryDone": "Y fué en el mes de Nisán, en el año veinte del rey Artajerjes, que estando ya el vino delante de él, tomé el vino, y dílo al rey. (Nehemías 2:1)",
    "pledgesField": "Una plaza en Jerusalén. Delante está el cofre con las prendas; detrás esperan las familias.",
    "pledgesChest": "El cofre: quedan {n} prendas. Tócalo para sacar una.",
    "pledgesTaken": "Del cofre: {thing}. ¿A qué familia pertenece?",
    "pledgesInHand": "Prenda en tu mano: {thing}",
    "pledgesFirst": "Primero saca una prenda del cofre.",
    "pledgesAlready": "Esta familia ya tiene su prenda.",
    "pledgesWrong": "Esa no es su prenda. Mira el dibujo pálido encima de las familias.",
    "pledgesRight": "¡Les devuelven: {thing}!",
    "pledgesFamilyWaits": "{family}. Esperan su prenda: {thing}.",
    "pledgesFamilyHas": "{family}. Ya les devolvieron: {thing}.",
    "pledgesCount": "Devueltas: {n} de {total}",
    "pledgesRoundDone": "Todas las familias tienen de nuevo lo que es suyo.",
    "pledgesHelp": "Ayúdame",
    "pledgesHelpChest": "Toca el cofre y saca una prenda.",
    "pledgesHelping": "Mira: esta familia espera la prenda que tienes en la mano.",
    "pledgesDone": "Ruégoos que les devolváis hoy sus tierras, sus viñas, sus olivares, y sus casas … Y dijeron: Devolveremos, y nada les demandaremos; haremos así como tú dices. (Nehemías 5:11–12)",
    "boothsField": "A la izquierda la ladera con los árboles, a la derecha la casa con la escalera al terrado. En el terrado está el armazón de la cabaña.",
    "boothsNeedTitle": "Lo que necesita la cabaña",
    "boothsNeed": "{things}: {n} de {total}",
    "boothsTree": "{tree}: traer una rama",
    "boothsHouse": "La casa: subir las ramas al terrado. En la cabaña: {n} de {total}",
    "boothsBasket": "En la cesta: {n} de {total}",
    "boothsPicked": "Una rama está en la cesta: {thing}.",
    "boothsThorn": "El espino seco no tiene hojas. Trae ramas de olivo, arrayán y palmera.",
    "boothsEnough": "¡Ya hay bastantes: {things}! Trae otra clase.",
    "boothsFull": "La cesta está llena. ¡Sube las ramas al terrado! Toca la casa.",
    "boothsEmpty": "La cesta está vacía. Primero trae ramas de los árboles.",
    "boothsBuilt": "Las ramas están atadas a la cabaña.",
    "boothsRoundDone": "¡La cabaña está lista!",
    "boothsHelp": "Ayúdame",
    "boothsHelpingTree": "Mira: el hombre trae una rama: {thing}.",
    "boothsHelpingRoof": "Mira: el hombre sube la cesta al terrado.",
    "boothsDone": "Salió pues el pueblo, y trajeron, é hiciéronse cabañas, cada uno sobre su terrado, y en sus patios … Y hubo alegría muy grande. (Nehemías 8:16–17)"
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
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect)
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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointerup' | 'pointermove', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const key = (el: Element, type: 'keydown' | 'keyup', k: string) => el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }))
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}
type W = { text: () => string; findAll: (s: string) => { text: () => string; trigger: (e: string) => Promise<void> }[] }
const helpButton = (w: W) => w.findAll('button').find((b) => b.text() === 'Hilf mir')

// ---------------------------------------------------------------- 1. the cup
const CUP: CupGame = {
  background: 'x/saal.webp',
  ratio: 2 / 3,
  floor: { left: 6, right: 94, top: 40, bottom: 97 },
  walker: { image: 'x/n.webp', label: 'Nehemia mit dem Becher', w: 17 },
  body: 3,
  cup: { image: 'x/c.webp', label: 'Der Becher' },
  king: { x: 50, y: 41, r: 8 },
  speed: 18,
  rounds: [
    {
      hint: 'Bring dem König den Becher.',
      start: { x: 50, y: 96 },
      limit: 3.2,
      things: [{ image: 'x/k.webp', label: 'Krug', x: 50, y: 80, w: 13, r: 4.5 }],
      path: [{ x: 50, y: 96 }, { x: 62, y: 85 }, { x: 60, y: 60 }, { x: 50, y: 42 }]
    },
    {
      hint: 'Jetzt mehr Dinge.',
      start: { x: 20, y: 96 },
      limit: 2.2,
      things: [
        { image: 'x/k.webp', label: 'Krug', x: 30, y: 80, w: 13, r: 4.5 },
        { image: 'x/s.webp', label: 'Säule', x: 70, y: 60, w: 15, r: 5.5 }
      ],
      path: [{ x: 20, y: 96 }, { x: 22, y: 70 }, { x: 49, y: 42 }]
    }
  ]
}

describe('Der Becher (GameBecher)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBecher, { props: { game: CUP }, ...opts(locale) })
  const walkerTop = (w: ReturnType<typeof mountIt>) => parseFloat((w.find('.gm-walker').element as HTMLElement).style.top)

  it('the sample data are in order; the hall, the jar, Nehemiah, the cup with its line; the goal is three parts a round', () => {
    expect(cupProblems(CUP)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Bring dem König den Becher.')
    expect(w.findAll('.gm-thing')).toHaveLength(1)
    expect(w.find('.gm-walker').attributes('aria-label')).toContain('Nehemia mit dem Becher')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Thronsaal')
    expect(w.text()).toContain('Der Wein ist ruhig.')
    expect(problems()).toEqual([])
  })

  it('a tap shows where he goes; walking straight into the jar spills (a cross, a word, a mistake); the arrow keys move him', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    // straight up to the king: the jar stands in the way
    pointer(field, 'pointerdown', 150, 84)
    pointer(window, 'pointerup', 150, 84)
    expect(await until(() => w.text().includes('Oh! Ein wenig Wein ist übergeschwappt.'), 6)).toBe(true)
    expect(count('wrong')).toBeGreaterThanOrEqual(1)
    expect(count('tap')).toBeGreaterThanOrEqual(1)
    expect(w.find('.gm-walker .gm-mark').exists()).toBe(true)
    await tick(2000)
    const before = walkerTop(w)
    key(field, 'keydown', 'ArrowDown')
    await tick(600)
    key(field, 'keyup', 'ArrowDown')
    await tick(600)
    expect(walkerTop(w)).toBeGreaterThan(before)
    expect(problems()).toEqual([])
  })

  it('"Help me" after two spills or fifteen seconds walks him past the jar; both rounds; the end with the words of the Bible', async () => {
    const w = mountIt()
    expect(helpButton(w)).toBeUndefined()
    for (let i = 0; i < 6 && !w.text().includes('Arthahsastha'); i++) {
      if (await until(() => !!helpButton(w) || w.text().includes('Arthahsastha'), 20)) {
        const b = helpButton(w)
        if (b) {
          await b.trigger('click')
          expect(w.text()).toContain('Schau: Nehemia geht ein Stück ganz ruhig.')
        }
      }
      await until(() => w.text().includes('Runde 2 von 2') || w.text().includes('Arthahsastha'), 12)
    }
    expect(w.text()).toContain('Arthahsastha')
    expect(w.text()).toContain('(Nehemia 2,1)')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(6)
    expect(w.findAll('[aria-label]').length).toBeGreaterThan(0)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').text()).toContain('The wine is calm.')
    expect(mountIt('es').text()).toContain('El vino está tranquilo.')
  })
})

// ---------------------------------------------------------------- 2. give back the pledge
const S = (image: string) => ({ image: `x/${image}.webp`, label: image })
const PLEDGE: PledgeGame = {
  background: 'x/platz.webp',
  ratio: 1.5,
  chest: { ...S('Truhe'), x: 50, y: 99, w: 24 },
  families: [S('Familie A'), S('Familie B'), S('Familie C'), S('Familie D')],
  slips: { acker: S('Der Acker'), weinberg: S('Der Weinberg'), oelgarten: S('Der Ölgarten'), haus: S('Das Haus') },
  slipW: 14,
  familyAspect: 1,
  rounds: [
    {
      hint: 'Zieh einen Pfandschein aus der Truhe.',
      spots: [
        { family: 0, kind: 'acker', x: 20, y: 66, w: 22 },
        { family: 1, kind: 'weinberg', x: 80, y: 66, w: 22 },
        { family: 2, kind: 'haus', x: 50, y: 60, w: 20 }
      ],
      draw: ['haus', 'acker', 'weinberg']
    },
    {
      hint: 'Jetzt vier Familien.',
      spots: [
        { family: 3, kind: 'oelgarten', x: 13, y: 66, w: 21 },
        { family: 2, kind: 'weinberg', x: 37, y: 60, w: 19 },
        { family: 1, kind: 'haus', x: 63, y: 60, w: 19 },
        { family: 0, kind: 'acker', x: 87, y: 66, w: 21 }
      ],
      draw: ['weinberg', 'acker', 'oelgarten', 'haus']
    }
  ]
}

describe('Pfand zurück (GamePfand)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GamePfand, { props: { game: PLEDGE }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const fam = (w: Wr, i: number) => w.findAll('.gm-fam')[i]!
  const take = async (w: Wr) => {
    pointer(w.find('.gm-chest').element, 'pointerdown', 150, 190)
    pointer(window, 'pointerup', 150, 190)
    await flushPromises()
  }

  it('the sample data are in order; the families as buttons with what they wait for, the chest, the count', () => {
    expect(pledgeProblems(PLEDGE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('.gm-fam')).toHaveLength(3)
    expect(fam(w, 0).element.tagName).toBe('BUTTON')
    expect(fam(w, 0).attributes('aria-label')).toBe('Familie A. Sie warten auf ihr Pfand: Der Acker.')
    expect(w.find('.gm-chest').attributes('aria-label')).toContain('noch 3 Pfandscheine')
    expect(w.findAll('.gm-badge')).toHaveLength(3)
    expect(w.text()).toContain('Zurückgegeben: 0 von 3')
    expect(problems()).toEqual([])
  })

  it('first the chest; the wrong family is a mistake and the paper stays in the hand; the right family takes it', async () => {
    const w = mountIt()
    await fam(w, 0).trigger('click')
    expect(w.text()).toContain('Zieh zuerst einen Pfandschein aus der Truhe.')
    await take(w)
    expect(w.text()).toContain('Aus der Truhe: Das Haus.')
    expect(w.find('.gm-slip').attributes('aria-label')).toContain('Das Haus')
    expect(w.find('.gm-chest').attributes('aria-label')).toContain('noch 2 Pfandscheine')
    await fam(w, 0).trigger('click')
    expect(w.text()).toContain('Das ist nicht ihr Pfand.')
    expect(count('wrong')).toBe(1)
    expect(fam(w, 0).find('.gm-mark').exists()).toBe(true)
    expect(w.find('.gm-slip').exists()).toBe(true)
    await fam(w, 2).trigger('click')
    expect(w.text()).toContain('Das Haus gehört ihnen wieder!')
    expect(fam(w, 2).attributes('aria-label')).toContain('gehört ihnen wieder')
    expect(w.find('.gm-slip').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Zurückgegeben: 1 von 3')
    // the family that has its paper says so
    await take(w)
    await fam(w, 2).trigger('click')
    expect(w.text()).toContain('Diese Familie hat ihr Pfand schon zurück.')
    expect(problems()).toEqual([])
  })

  it('dragging the paper and letting it go over a family gives it to that family; Enter on the chest takes a paper; the arrow keys go along the row', async () => {
    const w = mountIt()
    pointer(w.find('.gm-chest').element, 'pointerdown', 150, 190)
    pointer(window, 'pointermove', 60, 100)
    await flushPromises()
    expect(w.find('.gm-slip').classes()).toContain('drag')
    // every rectangle is the same in the test: the first family takes it (the house is not theirs)
    pointer(window, 'pointerup', 60, 100)
    await flushPromises()
    expect(w.text()).toContain('Das ist nicht ihr Pfand.')
    const w2 = mountIt()
    key(w2.find('.gm-chest').element, 'keydown', 'Enter')
    await flushPromises()
    expect(w2.text()).toContain('Aus der Truhe: Das Haus.')
    key(w2.find('.gm-chest').element, 'keydown', 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(w2.findAll('.gm-fam')[0]!.element)
  })

  it('"Help me" after fifteen seconds shows the chest, then the family; all rounds; the end with the words of the Bible', async () => {
    const w = mountIt()
    await tick(15500)
    await helpButton(w)!.trigger('click')
    expect(w.find('.gm-chest').classes()).toContain('help')
    await take(w)
    await tick(15500)
    await helpButton(w)!.trigger('click')
    expect(fam(w, 2).classes()).toContain('help')
    for (let r = 0; r < 2; r++) {
      const round = PLEDGE.rounds[r]!
      const given: number[] = []
      for (let k = 0; k < round.draw.length; k++) {
        if (!w.find('.gm-slip').exists()) await take(w)
        const owner = pledgeOwner(round, given, round.draw[k] as PledgeKind)
        given.push(owner)
        await fam(w, owner).trigger('click')
      }
      expect(w.text()).toContain('Alle Familien haben zurück, was ihnen gehört.')
      await tick(3000)
    }
    expect(w.text()).toContain('Ölgärten')
    expect(w.text()).toContain('(Nehemia 5,11–12)')
    expect(useTaskProgress().parts.value).toBe(7)
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').text()).toContain('Given back: 0 of 3')
    expect(mountIt('es').text()).toContain('Devueltas: 0 de 3')
  })
})

// ---------------------------------------------------------------- 3. booths
const BOOTH: BoothGame = {
  background: 'x/hof.webp',
  ratio: 1.5,
  hill: 80,
  road: 91,
  walker: { image: 'x/traeger.webp', label: 'Der Mann mit dem Korb', w: 13 },
  speed: 22,
  stairs: 68,
  house: { left: 64, right: 99, top: 20, bottom: 92 },
  trees: { oel: S('Ölbaum'), myrte: S('Myrte'), palme: S('Palme'), dorn: S('Dürrer Dornbusch') },
  boughs: { oel: { ...S('Ölzweig'), plural: 'Ölzweige' }, myrte: { ...S('Myrtenzweig'), plural: 'Myrtenzweige' }, palme: { ...S('Palmzweig'), plural: 'Palmzweige' } },
  slots: Array.from({ length: 9 }, (_, i) => ({ x: 72 + i * 2, y: 25, w: 8, rot: 0 })),
  rounds: [
    { hint: 'Tippe die Bäume an.', trees: [{ kind: 'oel', x: 12, w: 18 }, { kind: 'myrte', x: 33, w: 16 }, { kind: 'palme', x: 53, w: 16 }], need: { oel: 2, myrte: 2, palme: 2 }, carry: 3, start: 60 },
    {
      hint: 'Jetzt mehr Zweige.',
      trees: [{ kind: 'palme', x: 10, w: 16 }, { kind: 'dorn', x: 27, w: 14 }, { kind: 'oel', x: 41, w: 17 }, { kind: 'myrte', x: 57, w: 15 }],
      need: { oel: 3, myrte: 3, palme: 3 },
      carry: 3,
      start: 62
    }
  ]
}

describe('Laubhütten (GameLaubhuetten)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameLaubhuetten, { props: { game: BOOTH }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const tree = (w: Wr, i: number) => w.findAll('.gm-tree')[i]!
  /** plays a round with the moves of the help (clicks as a child would) */
  const playRound = async (w: Wr, r: number) => {
    const round = BOOTH.rounds[r]!
    let st: BoothState = { x: round.start, goal: null, basket: [], built: [], pause: 0, done: false, left: false }
    for (let i = 0; i < 20 && !st.done; i++) {
      const g = boothNext(BOOTH, round, st)!
      if (g.type === 'tree') {
        await tree(w, g.tree).trigger('click')
        st = { ...st, x: round.trees[g.tree]!.x, basket: [...st.basket, round.trees[g.tree]!.kind as 'oel'] }
      } else {
        await w.find('.gm-house').trigger('click')
        st = { ...st, x: BOOTH.stairs, built: [...st.built, ...st.basket], basket: [] }
        st.done = st.built.length >= 3 * (r === 0 ? 2 : 3)
      }
      await tick(5000)
    }
  }

  it('the sample data are in order; the trees and the house are buttons; what the booth needs; the basket', () => {
    expect(boothProblems(BOOTH)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(15)
    expect(w.findAll('.gm-tree')).toHaveLength(3)
    expect(tree(w, 0).element.tagName).toBe('BUTTON')
    expect(tree(w, 0).attributes('aria-label')).toBe('Ölbaum: einen Zweig holen')
    expect(w.find('.gm-house').attributes('aria-label')).toContain('An der Hütte: 0 von 6')
    expect(w.text()).toContain('Ölzweige: 0 von 2')
    expect(w.text()).toContain('Im Korb: 0 von 3')
    expect(problems()).toEqual([])
  })

  it('a tree gives a branch into the basket; the house ties it to the booth; a tap on the path sends him there; the arrow keys go along the row', async () => {
    const w = mountIt()
    await tree(w, 2).trigger('click')
    expect(await until(() => w.text().includes('Ein Palmzweig ist im Korb.'), 5)).toBe(true)
    expect(w.text()).toContain('Im Korb: 1 von 3')
    expect(w.findAll('.gm-load-item')).toHaveLength(1)
    await w.find('.gm-house').trigger('click')
    expect(await until(() => w.text().includes('Die Zweige sind an der Hütte festgebunden.'), 5)).toBe(true)
    expect(w.findAll('.gm-slot')).toHaveLength(1)
    expect(w.text()).toContain('Palmzweige: 1 von 2')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(600)
    pointer(w.find('.gm-field').element, 'pointerdown', 30, 190)
    await tick(5000)
    expect(parseFloat((w.find('.gm-walker').element as HTMLElement).style.left)).toBeCloseTo(10, 0)
    key(tree(w, 0).element, 'keydown', 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(tree(w, 1).element)
    key(tree(w, 0).element, 'keydown', 'ArrowLeft')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('.gm-house').element)
    expect(problems()).toEqual([])
  })

  it('round 2: the thorn bush and a fourth branch of a kind are mistakes; a full basket is none; "Help me" does the next step; the end', async () => {
    const w = mountIt()
    await playRound(w, 0)
    expect(useTaskProgress().parts.value).toBe(6)
    expect(count('wrong')).toBe(0)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    await tree(w, 1).trigger('click')
    expect(await until(() => w.text().includes('Am dürren Dornbusch ist kein Laub.'), 5)).toBe(true)
    expect(count('wrong')).toBe(1)
    expect(tree(w, 1).find('.gm-mark').exists()).toBe(true)
    for (let i = 0; i < 3; i++) {
      await tree(w, 0).trigger('click')
      await tick(2500)
    }
    await tree(w, 0).trigger('click')
    expect(await until(() => w.text().includes('Genug Palmzweige!'), 5)).toBe(true)
    expect(count('wrong')).toBe(2)
    // the help: fifteen seconds without a move, then it does the next right step (the basket is full of palms: up to the roof)
    await tick(15500)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Schau: Der Mann bringt den Korb aufs Dach.')
    expect(await until(() => w.findAll('.gm-slot').length === 3, 8)).toBe(true)
    for (let i = 0; i < 8 && !w.text().includes('Laubhütten'); i++) {
      await tick(15500)
      const b = helpButton(w)
      if (b) await b.trigger('click')
      await tick(5000)
    }
    expect(w.text()).toContain('große Freude')
    expect(w.text()).toContain('(Nehemia 8,16–17)')
    expect(useTaskProgress().parts.value).toBe(15)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').text()).toContain('In the basket: 0 of 3')
    expect(mountIt('es').text()).toContain('En la cesta: 0 de 3')
  })
})

// ---------------------------------------------------------------- the real data of the adventure
describe('the real data of Nehemia (stages 2, 7, 9) mount without problems', () => {
  it('the cup, the pledges and the booths', async () => {
    const { nehemia } = await import('@/data/adventures/nehemia')
    const task = (n: number) => nehemia.stages[n - 1]!.task as unknown as { cupCarry: CupGame; pledges: PledgeGame; booths: BoothGame }
    const a = mount(GameBecher, { props: { game: task(2).cupCarry }, ...opts() })
    expect(a.findAll('.gm-thing')).toHaveLength(task(2).cupCarry.rounds[0]!.things.length)
    const b = mount(GamePfand, { props: { game: task(7).pledges }, ...opts() })
    expect(b.findAll('.gm-fam')).toHaveLength(3)
    const c = mount(GameLaubhuetten, { props: { game: task(9).booths }, ...opts() })
    expect(c.findAll('.gm-tree')).toHaveLength(3)
    await tick(500)
    expect(problems()).toEqual([])
  })
})
