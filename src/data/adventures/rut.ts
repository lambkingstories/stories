/**
 * Abenteuer "Rut" (Rut 1–4) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Wo du hingehst, da gehe ich auch hin". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 24.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Rut/ENTWURF_Rut.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Nicht oder gemildert erzählt: die Namen der Söhne, Ruts Satz "Wo du stirbst, da sterbe ich auch", Boas' Lob über die Jünglinge, Rahel und Lea nur halb, der Stammbaum bis David verkürzt.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Lückenvers (alt), 3 Ähren hinter den Schnittern (neu), 4 nur Quiz, 5 Das Maß füllen (neu), 6 Noomis Rat ordnen (alt),
 * 7 nur Quiz, 8 Älteste an das Tor rufen (neu), 9 Die Wiege schaukeln (neu).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/rut/, images/abenteuer/spiele/rut/<spiel>/, audio/abenteuer/rut/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CradleGame, EldersGame, GleanGame, Journey, MeasureGame, OrderGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { RUT_PATH } from './rutPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { rutEn } from './en/rut.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/rut/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/rut/'

const G = 'images/abenteuer/spiele/rut/'

/**
 * Etappe 3, "Ähren hinter den Schnittern": ein goldenes Feld mit drei Stoppelstreifen; in jedem Streifen stehen drei Büschel Gerste, ein Schnitter geht von links nach rechts und mäht sie, wo ein Büschel fällt, bleibt eine Ähre liegen (neu).
 * Das Kind tippt die liegenden Ähren in Ruts Korb; ein Tipp auf ein Büschel, das noch steht, ist ein Fehler. Runde 1: zwei Schnitter, sechs Ähren, langsam; Runde 2: drei Schnitter, neun Ähren, etwas schneller.
 * Bilder (Bildauftrag R30): `nachlese/feld.webp` 1200 × 900 (drei Stoppelstreifen bei etwa 52, 66 und 80 Prozent der Höhe), `schnitter-1..3.webp` (aus EINEM Bogen geschnitten, gleicher Maßstab), `halme-1..4.webp`, `aehren-1..4.webp`, `korb.webp`.
 */
const NACHLESE: GleanGame = {
  background: `${G}nachlese/feld.webp`,
  lanes: [47, 60, 72],
  reapers: [1, 2, 3].map((n) => `${G}nachlese/schnitter-${n}.webp`),
  clumps: [1, 2, 3, 4].map((n) => `${G}nachlese/halme-${n}.webp`),
  ears: [1, 2, 3, 4].map((n) => `${G}nachlese/aehren-${n}.webp`),
  basket: `${G}nachlese/korb.webp`,
  basketPos: { x: 11, y: 97, w: 17 },
  reaperW: 17,
  clumpW: 10,
  earW: 7,
  rounds: [
    {
      hint: 'Sammle die Ähren, die hinter den Schnittern liegen.',
      reapers: [
        { lane: 0, at: 0, dur: 11000, sprite: 0, clumps: [24, 46, 70] },
        { lane: 2, at: 3600, dur: 11000, sprite: 1, clumps: [32, 55, 80] }
      ]
    },
    {
      hint: 'Jetzt arbeiten drei Schnitter. Warte, bis sie vorbei sind, und tippe nur die liegenden Ähren an.',
      reapers: [
        { lane: 0, at: 0, dur: 9500, sprite: 2, clumps: [20, 45, 76] },
        { lane: 1, at: 2600, dur: 9500, sprite: 0, clumps: [30, 58, 86] },
        { lane: 2, at: 5200, dur: 9500, sprite: 1, clumps: [18, 50, 82] }
      ]
    }
  ]
}

/**
 * Etappe 2, "Lückenvers" (alte Mechanik): Ruts Wort an Noomi aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Elia, kopiert. Hintergrund ist das Etappenbild 2, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Wo du ', ', da gehe ich auch hin.“'], words: ['hingehst', 'bleibst', 'wohnst'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Dein ', ' ist mein Volk, und dein ', ' ist mein Gott.“'], words: ['Volk', 'Gott', 'Land', 'Haus'], answers: [0, 1] }
  ]
}

/**
 * Etappe 5, "Das Maß füllen": der Platz am Feldrand mit dem Gerstenhaufen oben rechts; das Kind hält den Finger auf dem Haufen, die Körner laufen in das Hohlmaß (in etwa vier Sekunden von leer bis voll),
 * beim Loslassen an der goldenen Marke (acht Prozent Spielraum) ist die Runde geschafft; läuft es darüber, quillt es über (ein Fehler) und das Maß ist wieder leer (neu). Runde 1 bis zum Rand (ein Epha), Runde 2 halb voll (für Noomi).
 * Bilder (Bildauftrag R31): `epha/hof.webp` 1200 × 900, `mass-0..4.webp` (aus EINEM Bogen geschnitten, gleich große Flächen: leer, ein Viertel, halb, drei Viertel, voll), `korn.webp`, `marke.webp`.
 * Das Maß steht mit dem Fuß bei (24, 94) Prozent; innen liegt die Gerste bei 0 Prozent Füllung auf 44 Prozent der Maßhöhe (von oben), bei voller Füllung auf 23 Prozent.
 */
const MASS: MeasureGame = {
  background: `${G}epha/hof.webp`,
  states: [0, 1, 2, 3, 4].map((n) => `${G}epha/mass-${n}.webp`),
  measure: { x: 24, y: 94, w: 24, top: 23, bottom: 44 },
  heap: { x: 72, y: 46, w: 50, h: 44 },
  grain: `${G}epha/korn.webp`,
  grainW: 4,
  markImage: `${G}epha/marke.webp`,
  markW: 6,
  rounds: [
    { hint: 'Halte gedrückt, bis das Maß bis zur Marke gefüllt ist. Lass dann los.', mark: 1 },
    { hint: 'Das Übrige für Noomi: Fülle das Maß nur bis zur Hälfte.', mark: 0.5 }
  ]
}

/**
 * Etappe 6, "Noomis Rat ordnen" (alte Mechanik, Reihenfolge legen): vier Karten aus Noomis Rat (Rut 3,3–4): sich waschen, ihr gutes Kleid anziehen, hinab zur Tenne gehen, warten, bis Boas gegessen hat.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag R34): `reihenfolge/schritt-1..4.webp` (4:3, Rut vollständig angekleidet).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'waschen', image: `${G}reihenfolge/schritt-1.webp`, label: 'Rut wäscht sich Hände und Gesicht' },
    { id: 'kleid', image: `${G}reihenfolge/schritt-2.webp`, label: 'Rut zieht ihr gutes Kleid an' },
    { id: 'tenne', image: `${G}reihenfolge/schritt-3.webp`, label: 'Rut geht hinab zur Tenne' },
    { id: 'warten', image: `${G}reihenfolge/schritt-4.webp`, label: 'Rut wartet, bis Boas gegessen hat' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge von Noomis Rat. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['waschen', 'tenne', 'warten'] },
    { hint: 'Runde 2: Jetzt ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['waschen', 'kleid', 'tenne', 'warten'] }
  ]
}

/**
 * Etappe 8, "Älteste an das Tor rufen": der Platz vor dem Stadttor; Leute gehen von links nach rechts vorbei, alte Männer mit grauem Bart (Älteste) unter jungen Männern, Frauen und Kindern. Das Kind tippt die Ältesten: sie gehen zu einem Platz im Halbkreis (neu).
 * Ein Tipp auf jemand anderen ist ein Fehler. Runde 1 fünf Älteste unter zwölf Leuten, Runde 2 die anderen fünf unter zwölf; wer übersehen wurde, geht beim nächsten Vorbeigehen wieder vorbei. Sind alle zehn da, blendet das Bild die zehn Sitzenden ein.
 * Bilder (Bildauftrag R32): `aelteste/tor.webp` 1200 × 900, `aeltester-1..10.webp` und `andere-1..8.webp` (je aus EINEM Bogen geschnitten, gleicher Maßstab), `sitzend.webp` (die zehn im Halbkreis, durchsichtig).
 */
const AELTESTE: EldersGame = {
  background: `${G}aelteste/tor.webp`,
  elders: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `${G}aelteste/aeltester-${n}.webp`),
  others: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${G}aelteste/andere-${n}.webp`),
  seated: `${G}aelteste/sitzend.webp`,
  seatedBox: { x: 50, y: 95, w: 92 },
  seats: [
    { x: 11.3, y: 87.9 },
    { x: 18.6, y: 83.6 },
    { x: 25.7, y: 81.8 },
    { x: 34.8, y: 80 },
    { x: 44.6, y: 79.3 },
    { x: 55.4, y: 79.3 },
    { x: 63.5, y: 81.1 },
    { x: 72.5, y: 82.1 },
    { x: 80.6, y: 84.3 },
    { x: 88.7, y: 87.9 }
  ],
  walkerW: 17,
  seatW: 13,
  rounds: [
    {
      hint: 'Rufe zehn Älteste an das Tor. Tippe nur die Männer mit grauem Bart an.',
      walkers: [
        { kind: 'other', sprite: 0, at: 0, dur: 9500, y: 62 },
        { kind: 'other', sprite: 1, at: 1050, dur: 9500, y: 69 },
        { kind: 'elder', sprite: 0, at: 2100, dur: 9500, y: 66 },
        { kind: 'other', sprite: 2, at: 3150, dur: 9500, y: 72 },
        { kind: 'elder', sprite: 1, at: 4200, dur: 9500, y: 64 },
        { kind: 'other', sprite: 3, at: 5250, dur: 9500, y: 70 },
        { kind: 'other', sprite: 4, at: 6300, dur: 9500, y: 62 },
        { kind: 'elder', sprite: 2, at: 7350, dur: 9500, y: 69 },
        { kind: 'other', sprite: 5, at: 8400, dur: 9500, y: 66 },
        { kind: 'elder', sprite: 3, at: 9450, dur: 9500, y: 72 },
        { kind: 'other', sprite: 6, at: 10500, dur: 9500, y: 64 },
        { kind: 'elder', sprite: 4, at: 11550, dur: 9500, y: 70 }
      ]
    },
    {
      hint: 'Jetzt kommen die nächsten fünf. Tippe wieder nur die Männer mit grauem Bart an.',
      walkers: [
        { kind: 'other', sprite: 1, at: 0, dur: 8500, y: 62 },
        { kind: 'other', sprite: 2, at: 1050, dur: 8500, y: 69 },
        { kind: 'elder', sprite: 5, at: 2100, dur: 8500, y: 66 },
        { kind: 'other', sprite: 3, at: 3150, dur: 8500, y: 72 },
        { kind: 'elder', sprite: 6, at: 4200, dur: 8500, y: 64 },
        { kind: 'other', sprite: 4, at: 5250, dur: 8500, y: 70 },
        { kind: 'other', sprite: 5, at: 6300, dur: 8500, y: 62 },
        { kind: 'elder', sprite: 7, at: 7350, dur: 8500, y: 69 },
        { kind: 'other', sprite: 6, at: 8400, dur: 8500, y: 66 },
        { kind: 'elder', sprite: 8, at: 9450, dur: 8500, y: 72 },
        { kind: 'other', sprite: 7, at: 10500, dur: 8500, y: 64 },
        { kind: 'elder', sprite: 9, at: 11550, dur: 8500, y: 70 }
      ]
    }
  ]
}

/**
 * Etappe 9, "Die Wiege schaukeln": eine warme Stube mit einer Wiege und dem Baby darin; das Kind tippt abwechselnd links und rechts, ruhig, die Wiege schaukelt, das Baby wird müde und schläft (neu).
 * Ein Tipp auf die andere Seite nach einer ruhigen Pause (0,6 bis 1,8 Sekunden) ist eine ruhige Schaukel; zweimal dieselbe Seite oder zu schnell macht das Baby unruhig (ein Fehler). Runde 1 zehn ruhige Schaukeln mit sanftem Leuchten der nächsten Seite, Runde 2 vierzehn ohne Leuchten.
 * Bilder (Bildauftrag R33): `wiege/stube.webp` 1200 × 900 (die Mitte unten frei), `wiege-wach/muede/schlaf.webp` (aus EINEM Bogen geschnitten, gleich große Flächen).
 */
const WIEGE: CradleGame = {
  background: `${G}wiege/stube.webp`,
  states: [`${G}wiege/wiege-wach.webp`, `${G}wiege/wiege-muede.webp`, `${G}wiege/wiege-schlaf.webp`],
  cradle: { x: 50, y: 90, w: 30 },
  rounds: [
    { hint: 'Tippe abwechselnd links und rechts, ganz ruhig, bis das Kind schläft.', calm: 10, guide: true },
    { hint: 'Jetzt ohne Leuchten. Wieder abwechselnd und ruhig.', calm: 14, guide: false }
  ]
}

export const rut: Journey = {
  id: 'rut',
  title: 'Rut',
  subtitle: 'Wo du hingehst, da gehe ich auch hin',
  age: '8-10',
  downloadMb: 16, // gemessen 15,4 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v3.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: Die Geschichte von Rut in einem Bild (Konturzeichnung)
  gift: { title: 'Rut und Noomi', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus rutPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/rut/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0525, y: 0.5825, d: 0.0339 },
      { x: 0.2170, y: 0.5461, d: 0.0339 },
      { x: 0.2665, y: 0.5947, d: 0.0339 },
      { x: 0.3734, y: 0.5643, d: 0.0339 },
      { x: 0.5484, y: 0.6432, d: 0.0339 },
      { x: 0.6056, y: 0.6432, d: 0.0339 },
      { x: 0.7335, y: 0.3641, d: 0.0339 },
      { x: 0.8115, y: 0.2002, d: 0.0339 },
      { x: 0.9051, y: 0.3034, d: 0.0339 }
    ],
    exam: { x: 0.9770, y: 0.4369, d: 0.0339 },
    path: RUT_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Hunger in Bethlehem',
      ref: 'Rut 1,1–7',
      text: [
        'Zu der Zeit, als in Israel noch Richter regieren, kommt eine Hungersnot über das Land. Darum zieht ein Mann aus Bethlehem in Juda, Elimelech, mit seiner Frau Noomi und seinen zwei Söhnen in das Land Moab. Dort bleiben sie.',
        'In Moab stirbt Elimelech, und Noomi bleibt mit ihren Söhnen allein. Die beiden heiraten Frauen aus Moab. Die eine heißt Orpa, die andere Rut. Nach etwa zehn Jahren sterben auch die beiden Söhne. Nun sind drei Witwen übrig: Noomi und ihre Schwiegertöchter Orpa und Rut.',
        'Eines Tages hört Noomi, dass Gott seinem Volk geholfen und ihm wieder Brot gegeben hat. Da macht sie sich auf den Weg zurück nach Juda, und Orpa und Rut gehen mit ihr.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Warum zieht Elimelech mit seiner Familie nach Moab?', options: ['Es gibt Hunger im Land.', 'Es gibt einen Krieg.', 'Es gibt eine Hochzeit.'], answer: 0 },
        { q: 'Wie heißen Noomis Schwiegertöchter?', options: ['Orpa und Rut', 'Rahel und Lea', 'Sara und Rebekka'], answer: 0 },
        { q: 'Was hört Noomi eines Tages?', options: ['Gott hat seinem Volk wieder Brot gegeben.', 'Ein neuer König regiert.', 'In Moab bricht ein Krieg aus.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Wo du hingehst',
      ref: 'Rut 1,8–18',
      text: [
        'Unterwegs bleibt Noomi stehen. „Kehrt um, meine Töchter“, sagt sie, „jede in das Haus ihrer Mutter. Gott sei gut zu euch, wie ihr gut zu mir gewesen seid.“ Sie küsst die beiden, und alle drei weinen.',
        '„Nein, wir gehen mit dir zu deinem Volk“, sagen Orpa und Rut. Doch Noomi sagt: „Ich habe keine Söhne mehr, die eure Männer sein könnten. Geht heim!“ Da weinen sie noch mehr. Orpa küsst ihre Schwiegermutter zum Abschied und kehrt um. Rut aber bleibt bei Noomi.',
        '„Sieh“, sagt Noomi, „Orpa ist zu ihrem Volk und zu ihrem Gott zurückgekehrt. Geh du auch.“ Aber Rut antwortet: „Dränge mich nicht, dich zu verlassen. Wo du hingehst, da gehe ich auch hin. Wo du bleibst, da bleibe ich auch. Dein Volk ist mein Volk, und dein Gott ist mein Gott.“',
        'Als Noomi sieht, wie fest Rut entschlossen ist, sagt sie nichts mehr.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 1 von 2)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wer kehrt um zu ihrem Volk?', options: ['Orpa', 'Rut', 'Noomi'], answer: 0 },
        { q: 'Was sagt Rut zu Noomi?', options: ['Dein Volk ist mein Volk, und dein Gott ist mein Gott.', 'Ich will lieber in Moab bleiben.', 'Ich gehe zurück zu meiner Mutter.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Ist das Noomi?',
      ref: 'Rut 1,19 – 2,4',
      text: [
        'Die beiden Frauen gehen miteinander, bis sie nach Bethlehem kommen. Da regt sich die ganze Stadt: „Ist das Noomi?“ „Nennt mich nicht Noomi“, sagt sie, „nennt mich Mara, die Bittere. Voll bin ich fortgezogen, und leer hat Gott mich wieder heimgebracht.“',
        'Es ist die Zeit, in der die Gerstenernte beginnt. Eines Tages sagt Rut: „Lass mich aufs Feld gehen und Ähren auflesen, dort, wo ich freundlich aufgenommen werde.“ „Geh, meine Tochter“, sagt Noomi.',
        'Rut geht den Schnittern nach und liest auf, was sie liegen lassen. Es trifft sich, dass das Feld Boas gehört, einem wohlhabenden Mann aus der Familie Elimelechs. Da kommt Boas aus der Stadt zu seinen Leuten. „Der Herr sei mit euch!“, ruft er. „Der Herr segne dich!“, antworten die Schnitter.'
      ],
      // Spiel: Ähren hinter den Schnittern (nachlese, neu)
      task: { kind: 'nachlese', hint: 'Sammle die Ähren, die hinter den Schnittern liegen.', glean: NACHLESE },
      questions: [
        { q: 'Wie will Noomi jetzt genannt werden?', options: ['Mara', 'Orpa', 'Rut'], answer: 0 },
        { q: 'Was tut Rut auf dem Feld?', options: ['Sie liest Ähren auf.', 'Sie schneidet das Korn.', 'Sie bindet die Garben.'], answer: 0 },
        { q: 'Wem gehört das Feld?', options: ['Boas', 'Elimelech', 'Orpa'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Boas ist gütig',
      ref: 'Rut 2,5–16',
      text: [
        '„Wer ist diese junge Frau?“, fragt Boas den Knecht, der die Schnitter beaufsichtigt. „Die Moabiterin, die mit Noomi zurückgekommen ist“, sagt der Knecht. „Sie sammelt seit dem Morgen zwischen den Garben.“',
        'Da geht Boas zu Rut: „Meine Tochter, geh auf kein anderes Feld, bleib bei meinen Mägden. Meine Knechte dürfen dich nicht anrühren. Und wenn du Durst hast, trink aus ihren Krügen.“ Rut verneigt sich: „Warum bist du so freundlich zu mir? Ich bin doch fremd.“ „Man hat mir erzählt, was du für Noomi getan hast“, sagt Boas. „Bei Gott hast du Zuflucht gesucht, wie unter seinen Flügeln.“',
        'Zur Essenszeit sagt Boas: „Iss vom Brot.“ Rut setzt sich zu den Schnittern, und er reicht ihr geröstete Körner. Sie isst, wird satt und lässt sogar etwas übrig. Dann sagt Boas seinen Knechten: „Lasst sie auch zwischen den Garben lesen, und lasst absichtlich Ähren für sie liegen.“'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Auf welchem Feld soll Rut bleiben?', options: ['auf dem Feld von Boas', 'auf dem Feld am Fluss', 'auf jedem Feld'], answer: 0 },
        { q: 'Was reicht Boas der Rut zum Essen?', options: ['geröstete Körner', 'Honigkuchen', 'Fisch'], answer: 0 },
        { q: 'Was sagt Boas seinen Knechten?', options: ['Lasst Ähren für sie liegen.', 'Schickt sie fort.', 'Gebt ihr den ganzen Ertrag.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Ein Epha Gerste',
      ref: 'Rut 2,17–23',
      text: [
        'Rut liest auf dem Feld bis zum Abend. Dann schlägt sie die Körner aus den Ähren. Es ist ungefähr ein Epha Gerste, so viel, wie man in ein großes Maß füllt. Sie trägt es in die Stadt, und Noomi sieht, was sie gesammelt hat. Rut gibt ihr auch, was vom Essen übrig geblieben ist.',
        '„Wo hast du heute gesammelt?“, fragt Noomi. „Gesegnet sei der, der dich so freundlich angesehen hat!“ „Bei einem Mann namens Boas“, sagt Rut.',
        '„Gesegnet sei er von Gott!“, ruft Noomi. „Er gehört zu unserer Familie. Er darf für uns einstehen.“ Rut erzählt: „Boas hat auch gesagt, ich soll mich zu seinen Leuten halten, bis sie die ganze Ernte eingebracht haben.“ „Das ist gut, meine Tochter“, sagt Noomi.',
        'So sammelt Rut bis zum Ende der Gersten- und der Weizenernte. Und sie wohnt bei Noomi.'
      ],
      // Spiel: Das Maß füllen (epha, neu)
      task: { kind: 'epha', hint: 'Halte gedrückt, bis das Maß bis zur Marke gefüllt ist.', measure: MASS },
      questions: [
        { q: 'Was gibt Rut Noomi außer der Gerste noch?', options: ['was vom Essen übrig geblieben ist', 'ein Stück Land', 'einen Mantel'], answer: 0 },
        { q: 'Wie heißt der Mann, bei dem Rut gesammelt hat?', options: ['Boas', 'Elimelech', 'Obed'], answer: 0 },
        { q: 'Wie lange sammelt Rut auf den Feldern von Boas?', options: ['bis die Gersten- und die Weizenernte vorbei sind', 'bis zum Winter', 'bis zur nächsten Hochzeit'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Auf der Tenne',
      ref: 'Rut 3,1–9',
      text: [
        'Nach der Ernte sagt Noomi: „Meine Tochter, Boas worfelt heute Nacht Gerste auf seiner Tenne. Bade dich, salbe dich, zieh dein Kleid an und geh hinab zur Tenne. Gib dich ihm nicht zu erkennen, bis er gegessen und getrunken hat. Wenn er sich hinlegt, merk dir den Ort. Dann geh leise hin und decke seine Füße auf. Er wird dir sagen, was du tun sollst.“',
        '„Alles, was du sagst, will ich tun“, antwortet Rut, und sie tut es. Boas isst und trinkt und ist guter Dinge. Er legt sich neben den Kornhaufen. Da kommt Rut leise, deckt seine Füße auf und legt sich dazu.',
        'Um Mitternacht erschrickt Boas und beugt sich vor: Eine Frau liegt zu seinen Füßen! „Wer bist du?“, fragt er. „Ich bin Rut, deine Magd“, sagt sie. „Breite deine Decke über mich, denn du darfst für uns einstehen.“'
      ],
      // Spiel: Noomis Rat ordnen (reihenfolge, alt 2 von 2)
      task: { kind: 'reihenfolge', hint: 'Lege die Karten in die Reihenfolge von Noomis Rat.', order: REIHENFOLGE },
      questions: [
        { q: 'Was soll Rut tun, bis Boas gegessen und getrunken hat?', options: ['sich ihm nicht zu erkennen geben', 'ihm helfen', 'nach Hause gehen'], answer: 0 },
        { q: 'Wann erschrickt Boas?', options: ['um Mitternacht', 'am Morgen', 'bei Sonnenuntergang'], answer: 0 },
        { q: 'Wie antwortet Rut, als Boas wissen will, wer sie ist?', options: ['Ich bin Rut, deine Magd.', 'Ich bin Noomi.', 'Ich bin eine Schnitterin.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Sechs Maß Gerste',
      ref: 'Rut 3,10–18',
      text: [
        '„Gesegnet seist du von Gott, meine Tochter!“, sagt Boas. „Fürchte dich nicht. Die ganze Stadt weiß, dass du eine tüchtige Frau bist. Es ist wahr: Ich darf für euch einstehen. Aber es gibt einen Verwandten, der noch näher mit euch verwandt ist als ich. Morgen soll er entscheiden. Will er nicht, so tue ich es, so wahr Gott lebt.“',
        'Rut bleibt bis zum Morgen. Sie steht auf, noch ehe man einander erkennen kann. Boas will nicht, dass jemand erfährt, dass eine Frau auf der Tenne war.',
        '„Halte deinen Mantel auf“, sagt er. Er misst sechs Maß Gerste ab und legt sie ihr auf, dann geht er in die Stadt. Rut erzählt Noomi alles. „Er hat gesagt: Du sollst nicht mit leeren Händen zu deiner Schwiegermutter kommen.“ Noomi sagt: „Warte ab, meine Tochter. Der Mann wird nicht ruhen, bis die Sache heute zu Ende ist.“'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viel Gerste gibt Boas der Rut mit?', options: ['sechs Maß', 'zwei Körbe', 'ein Säckchen'], answer: 0 },
        { q: 'Was sagt Boas über einen anderen Verwandten?', options: ['Er ist noch näher mit euch verwandt als ich.', 'Er ist nach Moab gezogen.', 'Er hat das Feld schon gekauft.'], answer: 0 },
        { q: 'Was sagt Noomi über Boas?', options: ['Er wird nicht ruhen, bis die Sache heute zu Ende ist.', 'Er wird bald verreisen.', 'Er wird alles vergessen.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Am Stadttor',
      ref: 'Rut 4,1–12',
      text: [
        'Boas geht hinauf zum Stadttor und setzt sich dorthin. Da kommt der nähere Verwandte vorbei, von dem er gesprochen hat. „Komm und setz dich hierher!“, ruft Boas. Dann holt er zehn Männer von den Ältesten der Stadt: „Setzt euch her!“ Und sie setzen sich.',
        'Boas sagt zu dem Verwandten: „Noomi verkauft das Feldstück, das Elimelech gehörte. Willst du es kaufen? Dann tu es vor diesen Zeugen.“ „Ich kaufe es“, sagt der Mann. „Dann musst du auch Rut nehmen“, sagt Boas, „damit der Name des Verstorbenen weiterlebt.“ Da sagt der Mann: „Dann kann ich es nicht kaufen. Kauf du es!“ Und er zieht seinen Schuh aus und gibt ihn Boas. So bestätigt man es damals in Israel.',
        '„Ihr seid heute meine Zeugen“, sagt Boas. „Ich habe alles gekauft, was Elimelech gehörte. Auch Rut nehme ich zur Frau.“ „Wir sind Zeugen“, rufen alle im Tor.'
      ],
      // Spiel: Älteste an das Tor rufen (aelteste, neu)
      task: { kind: 'aelteste', hint: 'Rufe zehn Älteste an das Tor. Tippe nur die Männer mit grauem Bart an.', elders: AELTESTE },
      questions: [
        { q: 'Wohin geht Boas, um die Sache zu klären?', options: ['zum Stadttor', 'zur Tenne', 'zum Brunnen'], answer: 0 },
        { q: 'Was zieht der nähere Verwandte aus und gibt es Boas?', options: ['seinen Schuh', 'seinen Mantel', 'seinen Ring'], answer: 0 },
        { q: 'Was kauft Boas?', options: ['das Feldstück, das Elimelech gehörte', 'ein Haus in der Stadt', 'einen Weinberg'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Obed',
      ref: 'Rut 4,13–22',
      text: [
        'Boas nimmt Rut zur Frau. Gott schenkt ihnen einen Sohn.',
        'Die Frauen von Bethlehem sagen zu Noomi: „Gelobt sei Gott, der dir heute jemanden gegeben hat, der für deine Familie einsteht! Er wird dein Leben erfrischen und dich im Alter versorgen. Denn deine Schwiegertochter, die dich liebt, hat ihn geboren. Sie ist dir mehr wert als sieben Söhne.“',
        'Noomi nimmt das Kind, legt es auf ihren Schoß und sorgt für es. Die Nachbarinnen geben ihm einen Namen: Obed.',
        'Obed wird der Vater von Isai, und Isai wird der Vater von David. Der wird später König über Israel.'
      ],
      // Spiel: Die Wiege schaukeln (wiege, neu)
      task: { kind: 'wiege', hint: 'Tippe abwechselnd links und rechts, ganz ruhig, bis das Kind schläft.', cradle: WIEGE },
      questions: [
        { q: 'Wie heißt der Sohn von Rut und Boas?', options: ['Obed', 'Isai', 'Elimelech'], answer: 0 },
        { q: 'Wer legt das Kind auf ihren Schoß?', options: ['Noomi', 'Orpa', 'Rut'], answer: 0 },
        { q: 'Wer ist Davids Großvater?', options: ['Obed', 'Boas', 'Elimelech'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wohin zieht Elimelech wegen des Hungers?', options: ['nach Moab', 'nach Ägypten', 'nach Babel'], answer: 0 },
    { q: 'Was sagt Rut zu Noomi?', options: ['Dein Volk ist mein Volk, und dein Gott ist mein Gott.', 'Ich will lieber in Moab bleiben.', 'Ich gehe zurück zu meiner Mutter.'], answer: 0 },
    { q: 'Auf wessen Feld liest Rut Ähren auf?', options: ['Boas', 'Elimelech', 'Orpa'], answer: 0 },
    { q: 'Was reicht Boas der Rut zum Essen?', options: ['geröstete Körner', 'Honigkuchen', 'Fisch'], answer: 0 },
    { q: 'Was zieht der nähere Verwandte aus, als er verzichtet?', options: ['seinen Schuh', 'seinen Mantel', 'seinen Ring'], answer: 0 },
    { q: 'Wie heißt der Sohn von Rut und Boas?', options: ['Obed', 'Isai', 'Elimelech'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of rut.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of rut.stages) {
  const file = `audio/abenteuer/rut/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the way, the barley field, the cradle); they follow one another at random
rut.music = [
  'audio/abenteuer/rut/musik-weg-v1.mp3',
  'audio/abenteuer/rut/musik-gerstenfeld-v1.mp3',
  'audio/abenteuer/rut/musik-wiege-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(rut, rutEn)
