/**
 * Abenteuer "Jesus ruft seine Freunde" (Lukas 5; Markus 2-3) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Vom Boot am See bis auf den Berg". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 1.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Freunde/ENTWURF_Freunde.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-11-01.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (nach Antons Regel vom 5.11.2026: höchstens zwei bekannte, nie hintereinander): 1 Puzzle (alt), 2 Das Lot (neu), 3 Beide Boote füllen (neu), 4 Reihenfolge (alt), 5 Das Dach öffnen (neu), 6 nur Quiz, 7 Sitzplätze (neu), 8 Die Zwölf (neu), 9 nur Quiz.
 * Bilder der neuen Spiele: D:/Claude/Abenteuer-Freunde/BILDAUFTRAEGE/BILDAUFTRAG-S37..S39; Maße: tools/_masse_neu.json; Leitung: D:/Claude/Spiele-Neu/freunde/BERICHT.md.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/freunde/, images/abenteuer/spiele/freunde/<spiel>/, audio/abenteuer/freunde/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BoatsGame, Journey, OrderGame, RoofGame } from '@/types/adventure'
import type { PlumbGame, SeatsGame, TwelveGame } from '@/utils/freundeNeu'
import { josef } from './josef'
import { FREUNDE_PATH } from './freundePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { freundeEn } from './en/freunde.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/freunde/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/freunde/'

const G = 'images/abenteuer/spiele/freunde/'

const SURFACE_1 = 32.7 // Wasserlinie im Bild see.webp in Prozent der Höhe (gemessen)
const SURFACE_2 = 30.8 // dasselbe für see2.webp
const LEAD_RATIO = 0.5789 // Breite : Höhe des Senkbleis
const MAT_RATIO = 2.699 // Breite : Höhe der Matte

/**
 * Etappe 4, "Der Fischzug" (alte Mechanik, Reihenfolge legen): Jesus lehrt vom Boot, Simon wirft das Netz aus, beide Boote sind voll, sie lassen alles zurück und folgen Jesus.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S34): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'lehrt', image: `${G}reihenfolge/karte-1.webp`, label: 'Jesus lehrt vom Boot aus' },
    { id: 'wirft', image: `${G}reihenfolge/karte-2.webp`, label: 'Simon wirft das Netz aus' },
    { id: 'voll', image: `${G}reihenfolge/karte-3.webp`, label: 'Beide Boote sind voll Fische' },
    { id: 'folgt', image: `${G}reihenfolge/karte-4.webp`, label: 'Sie lassen alles zurück und folgen Jesus' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['wirft', 'voll', 'folgt'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang am Ufer und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['lehrt', 'wirft', 'voll', 'folgt'] }
  ]
}

/**
 * Etappe 3, "Beide Boote füllen" (neu): Simon fängt so viele Fische, dass sein Netz zu reißen beginnt, die Gefährten kommen im zweiten Boot, und sie füllen beide Boote so voll, dass sie fast untergehen (Lk 5,6-7).
 * Über dem See hängt das Netz voller Fische, zwei Boote liegen auf dem Wasser; jedes hat so viele leere Plätze (gestrichelte Ringe) für Fische, wie es fasst. Ein Tipp auf ein Boot schickt einen Fisch hinein, das Boot sinkt etwas tiefer;
 * ein Tipp auf ein volles Boot ist ein Fehler. Zwei Runden (3 und 5, dann 4 und 6 Fische). Bilder (Bildauftrag S35): `boote/see.webp` 1200 × 900, `boot-klein`, `boot-gross` (Bogen mit Magenta-Schnitt), `haufen.webp`, die vier Fische aus Nr. 22 (kopiert).
 */
const BOOTE: BoatsGame = {
  background: `${G}boote/see.webp`,
  boats: [
    { id: 'klein', image: `${G}boote/boot-klein.webp`, label: 'Kleines Boot', w: 44, ratio: 1.67, x: 26, y: 92, deck: { x: 22, y: 38, w: 60, h: 34 } },
    { id: 'gross', image: `${G}boote/boot-gross.webp`, label: 'Großes Boot', w: 44, ratio: 1.67, x: 72, y: 92, deck: { x: 12, y: 40, w: 76, h: 32 } }
  ],
  fish: [
    { id: 'blau', image: `${G}boote/fisch-blau.webp`, w: 8.5 },
    { id: 'gold', image: `${G}boote/fisch-gold.webp`, w: 8.5 },
    { id: 'gruen', image: `${G}boote/fisch-gruen.webp`, w: 8.5 },
    { id: 'streifen', image: `${G}boote/fisch-streifen.webp`, w: 8.5 }
  ],
  pile: `${G}boote/haufen.webp`,
  pileAt: { x: 50, y: 30, w: 24 },
  rounds: [
    { hint: 'Fülle beide Boote bis zur Marke: Tippe auf ein Boot, dann springt ein Fisch hinein.', capacity: [3, 5] },
    { hint: 'Noch einmal, diesmal mit mehr Fischen. Fülle wieder beide Boote.', capacity: [4, 6] }
  ]
}

/**
 * Etappe 5, "Das Dach öffnen" (neu): vier Freunde tragen einen Gelähmten zu Jesus, kommen wegen der Menge nicht hinein und decken das Dach auf, „da er war“ (Mk 2,4). Wir sehen in das Haus: Jesus und andere Menschen sitzen am Boden,
 * darüber liegt das Flachdach in Stücken. Die Stücke über dem freien Platz bei Jesus kommen ab; unter den anderen sitzen Menschen (ein Tipp dort ist ein Fehler, Staub fällt, die Menschen ducken sich). Ist das Loch offen, lassen die vier
 * Freunde das Bett an einem Seil vor Jesus hinunter. Zwei Runden (kleines Loch, dann breiteres an anderer Stelle). Bilder (Bildauftrag S36): `dach/haus.webp` 1200 × 900, `dach.webp` (Streifen), `leute-1..6`, `jesus`, `matte`, `traeger`, `seil`.
 */
const DACH: RoofGame = {
  background: `${G}dach/haus.webp`,
  roof: `${G}dach/dach.webp`,
  area: { x: 18, y: 12, w: 64, h: 14.2 },
  floor: 90,
  jesus: { image: `${G}dach/jesus.webp`, label: 'Jesus sitzt und lehrt', w: 14 },
  people: [
    { id: 'l1', image: `${G}dach/leute-1.webp`, label: 'Zwei Männer mit Bart', w: 15 },
    { id: 'l2', image: `${G}dach/leute-2.webp`, label: 'Frau mit Kind', w: 15 },
    { id: 'l3', image: `${G}dach/leute-3.webp`, label: 'Alter Mann mit Stock', w: 15 },
    { id: 'l4', image: `${G}dach/leute-4.webp`, label: 'Drei junge Männer', w: 15 },
    { id: 'l5', image: `${G}dach/leute-5.webp`, label: 'Mädchen und Junge', w: 15 },
    { id: 'l6', image: `${G}dach/leute-6.webp`, label: 'Zwei Frauen mit Kopftüchern', w: 15 }
  ],
  mat: { image: `${G}dach/matte.webp`, label: 'Der Gelähmte auf seinem Bett', w: 10, ratio: 0.5 },
  rope: { image: `${G}dach/seil.webp`, w: 2.2 },
  carriers: { image: `${G}dach/traeger.webp`, w: 34 },
  rounds: [
    {
      hint: 'Öffne das Dach genau über Jesus: Tippe auf die Dachstücke dort. Unter den anderen sitzen Menschen.',
      cols: 8,
      free: [3, 4],
      jesusX: 50,
      matX: 50,
      spots: [
        { person: 'l1', x: 22 },
        { person: 'l2', x: 34.5 },
        { person: 'l3', x: 65.5 },
        { person: 'l4', x: 79 }
      ]
    },
    {
      hint: 'Jetzt sitzt Jesus an einem anderen Platz. Öffne das Dach wieder genau über ihm.',
      cols: 10,
      free: [5, 6, 7],
      jesusX: 60,
      matX: 60,
      spots: [
        { person: 'l5', x: 18 },
        { person: 'l6', x: 30.5 },
        { person: 'l2', x: 42 },
        { person: 'l1', x: 77 },
        { person: 'l3', x: 90.5 }
      ]
    }
  ]
}

/**
 * Etappe 2, "Das Lot" (neu, Lk 5,4-5): Jesus sagt „Fahre hinaus auf die Tiefe“. Der See im Schnitt von der Seite, Simons Boot schwimmt oben; das Kind fährt es mit dem Finger oder den Pfeiltasten, lässt das Lot an der Leine hinunter, liest ab,
 * wie viele Klafter tief es ist (Apg 27,28 kennt Lot und Klafter), und lässt Simon das Netz nur auswerfen, wo es tief genug ist. Das Wort „Klafter“ steht im Hinweis erklärt. Die Tiefen sind Spieldaten, die Bibel nennt keine Zahl.
 * Bilder (Bildauftrag S37): `lot/see.webp` 1200 × 900 (Wasserlinie bei 32,7 %) und `see2.webp` 1200 × 800 (30,8 %, ein Dorf am Ufer), `boot.webp` 760 × 423 (Simon kniet, Jesus sitzt hinten), `lot2.webp` (das Blei), `leine.webp` (das Seil aus Nr. 23, nur gestreckt).
 */
const LOT: PlumbGame = {
  boat: { image: `${G}lot/boot.webp`, label: 'Simons Boot', w: 40, ratio: 760 / 423, hand: { x: 71, y: 71 }, keel: 88 },
  lead: { image: `${G}lot/lot2.webp`, w: 7, ratio: LEAD_RATIO },
  line: `${G}lot/leine.webp`,
  rounds: [
    {
      hint: 'Fahre das Boot mit dem Finger und lass das Lot hinunter. Das Netz braucht mindestens 12 Klafter Wasser. Ein Klafter ist so lang wie zwei ausgestreckte Arme.',
      background: `${G}lot/see.webp`,
      ratio: 4 / 3,
      surface: SURFACE_1,
      floor: 96,
      scale: 20,
      bottom: [{ x: 0, d: 3 }, { x: 20, d: 4 }, { x: 38, d: 7 }, { x: 52, d: 12 }, { x: 70, d: 16 }, { x: 84, d: 13 }, { x: 92, d: 6 }, { x: 100, d: 4 }],
      range: [20, 80],
      start: 22,
      deep: 12
    },
    {
      hint: 'Die tiefe Stelle ist jetzt schmaler. Das Netz braucht mindestens 14 Klafter. Suche genau, vorher liegen Stellen mit 12 und 13.',
      background: `${G}lot/see2.webp`,
      ratio: 3 / 2,
      surface: SURFACE_2,
      floor: 96,
      scale: 20,
      bottom: [{ x: 0, d: 7 }, { x: 14, d: 12 }, { x: 24, d: 13 }, { x: 34, d: 7 }, { x: 44, d: 5 }, { x: 56, d: 9 }, { x: 64, d: 14 }, { x: 72, d: 19 }, { x: 80, d: 15 }, { x: 88, d: 8 }, { x: 100, d: 5 }],
      range: [20, 80],
      start: 24,
      deep: 14
    }
  ]
}

/**
 * Etappe 7, "Sitzplätze" (neu, Mk 2,15; Lk 5,29): Levi gibt ein großes Mahl, viele Zöllner und Sünder sitzen mit Jesus zu Tisch. Levis Haus von oben, ein Schiebepuzzle: Das Kind schiebt Bänke (zwei oder drei Plätze),
 * bis auf jeder Matte am langen Tisch eine Bank liegt. Raum 1 5 × 5 mit zwei Matten, Raum 2 6 × 6 mit drei Matten, einem Krug und einem Korb. Die Zugzahlen (`par`) sind vom Test mit einer Breitensuche geprüft.
 * Bilder (Bildauftrag S38): `sitzplaetze/boden.webp` 900 × 900, `tisch` (4 : 1), `bank-2` (2 : 1), `bank-3` (3 : 1), `matte`, `krug`, `korb`, `gaeste` (Levi heißt fünf Gäste willkommen).
 */
const SITZ: SeatsGame = {
  floor: `${G}sitzplaetze/boden.webp`,
  table: `${G}sitzplaetze/tisch.webp`,
  bench2: `${G}sitzplaetze/bank-2.webp`,
  bench3: `${G}sitzplaetze/bank-3.webp`,
  jar: `${G}sitzplaetze/krug.webp`,
  basket: `${G}sitzplaetze/korb.webp`,
  mat: `${G}sitzplaetze/matte.webp`,
  matRatio: MAT_RATIO,
  guests: `${G}sitzplaetze/gaeste.webp`,
  guestsLabel: 'Levi begrüßt seine Gäste',
  rounds: [
    {
      hint: 'Schiebe die Bänke, bis auf beiden Matten am Tisch eine Bank liegt. Dann haben alle Gäste einen Platz.',
      rows: ['.....', '.....', '.TTTT', '.....', '.....'],
      mats: [{ r: 1, c: 1 }, { r: 3, c: 3 }],
      benches: [
        { id: 'a', r: 1, c: 3, len: 2, dir: 'h' },
        { id: 'b', r: 3, c: 1, len: 2, dir: 'h' },
        { id: 'c', r: 0, c: 3, len: 2, dir: 'h' },
        { id: 'd', r: 0, c: 0, len: 3, dir: 'v' },
        { id: 'e', r: 4, c: 1, len: 2, dir: 'h' },
        { id: 'f', r: 0, c: 1, len: 2, dir: 'v' }
      ],
      par: 4
    },
    {
      hint: 'Jetzt kommen noch mehr Gäste. Schiebe die Bänke auf alle drei Matten am Tisch.',
      rows: ['......', '......', '.TTTT.', '......', 'K....O', '......'],
      mats: [{ r: 1, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 3 }],
      benches: [
        { id: 'a', r: 3, c: 1, len: 2, dir: 'h' },
        { id: 'b', r: 0, c: 0, len: 2, dir: 'v' },
        { id: 'c', r: 0, c: 1, len: 3, dir: 'h' },
        { id: 'd', r: 2, c: 0, len: 2, dir: 'v' },
        { id: 'e', r: 4, c: 1, len: 2, dir: 'h' },
        { id: 'f', r: 0, c: 4, len: 2, dir: 'h' },
        { id: 'g', r: 3, c: 4, len: 2, dir: 'v' },
        { id: 'h', r: 3, c: 3, len: 2, dir: 'v' },
        { id: 'i', r: 5, c: 2, len: 2, dir: 'h' }
      ],
      par: 8
    }
  ]
}

/**
 * Etappe 8, "Die Zwölf" (neu, Mk 3,13-19; Lk 6,14-16): Ein Name leuchtet auf, dazu sein Zeichen in Worten, und das Kind tippt den Freund von Jesus an. Zeichen gibt es nur, wo die Bibel sie hergibt (die Fischer Simon, Andreas, Jakobus und Johannes;
 * Matthäus, der Zöllner, Mt 10,3); bei den anderen nur etwas zum Unterscheiden (Kopftuch, Bart, Glatze, Stab, Stirnband), keine Aussage über sie. Alle wirken freundlich, auch Judas. Namen nach Mk 3,16-19.
 * Runde 1: sechs Freunde, fünf Namen; Runde 2: alle zwölf, acht Namen. Bilder (Bildauftrag S39): `zwoelf/berg.webp` 900 × 1200, zwölf stehende Figuren 200 × 330 (vier aus Nr. 23, acht neu im gleichen Maßstab).
 */
const ZWOELF: TwelveGame = {
  background: `${G}zwoelf/berg.webp`,
  ratio: 900 / 1200,
  figure: 200 / 330,
  disciples: [
    { id: 'simon', image: `${G}zwoelf/simon.webp`, name: 'Simon Petrus', sign: 'der Fischer mit dem Netz' },
    { id: 'andreas', image: `${G}zwoelf/andreas.webp`, name: 'Andreas', sign: 'der Fischer mit dem Fischkorb' },
    { id: 'jakobus-z', image: `${G}zwoelf/jakobus-z.webp`, name: 'Jakobus, Sohn des Zebedäus', sign: 'der Fischer mit dem Seil' },
    { id: 'johannes', image: `${G}zwoelf/johannes.webp`, name: 'Johannes', sign: 'der Fischer mit dem Ruder' },
    { id: 'philippus', image: `${G}zwoelf/philippus.webp`, name: 'Philippus', sign: 'der Mann mit dem hellen Kopftuch' },
    { id: 'bartholomaeus', image: `${G}zwoelf/bartholomaeus.webp`, name: 'Bartholomäus', sign: 'der Mann mit dem grauen Bart' },
    { id: 'matthaeus', image: `${G}zwoelf/matthaeus.webp`, name: 'Matthäus', sign: 'der Zöllner mit dem Münzkästchen' },
    { id: 'thomas', image: `${G}zwoelf/thomas.webp`, name: 'Thomas', sign: 'der junge Mann ohne Bart' },
    { id: 'jakobus-a', image: `${G}zwoelf/jakobus-a.webp`, name: 'Jakobus, Sohn des Alphäus', sign: 'der Mann mit der Glatze' },
    { id: 'thaddaeus', image: `${G}zwoelf/thaddaeus.webp`, name: 'Thaddäus', sign: 'der Mann mit dem langen Wanderstab' },
    { id: 'simon-z', image: `${G}zwoelf/simon-z.webp`, name: 'Simon, der Zelot', sign: 'der Mann mit dem langen schwarzen Bart' },
    { id: 'judas', image: `${G}zwoelf/judas.webp`, name: 'Judas Iskariot', sign: 'der Mann mit dem Stirnband' }
  ],
  rounds: [
    {
      hint: 'Ein Name leuchtet auf. Tippe den Freund von Jesus an, der dazu passt.',
      spots: [{ x: 20, y: 62, w: 24 }, { x: 50, y: 62, w: 24 }, { x: 80, y: 62, w: 24 }, { x: 20, y: 96, w: 24 }, { x: 50, y: 96, w: 24 }, { x: 80, y: 96, w: 24 }],
      stand: ['simon', 'matthaeus', 'thomas', 'philippus', 'andreas', 'johannes'],
      call: ['matthaeus', 'andreas', 'thomas', 'philippus', 'simon']
    },
    {
      hint: 'Jetzt stehen alle zwölf am Berg. Tippe immer den an, dessen Name leuchtet.',
      spots: [
        { x: 14, y: 55, w: 20 }, { x: 38, y: 55, w: 20 }, { x: 62, y: 55, w: 20 }, { x: 86, y: 55, w: 20 },
        { x: 14, y: 78, w: 20 }, { x: 38, y: 78, w: 20 }, { x: 62, y: 78, w: 20 }, { x: 86, y: 78, w: 20 },
        { x: 14, y: 99, w: 20 }, { x: 38, y: 99, w: 20 }, { x: 62, y: 99, w: 20 }, { x: 86, y: 99, w: 20 }
      ],
      stand: ['matthaeus', 'simon', 'philippus', 'judas', 'thomas', 'jakobus-z', 'bartholomaeus', 'johannes', 'simon-z', 'andreas', 'thaddaeus', 'jakobus-a'],
      call: ['andreas', 'judas', 'thomas', 'simon', 'matthaeus', 'thaddaeus', 'jakobus-a', 'philippus']
    }
  ]
}

export const freunde: Journey = {
  id: 'freunde',
  title: 'Jesus ruft seine Freunde',
  subtitle: 'Vom Boot am See bis auf den Berg',
  age: '8-10',
  downloadMb: 14, // gemessen 8,6 MB ohne die Karte plus 5,4 MB Karte = rund 14 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: das volle Netz (Konturzeichnung)
  gift: { title: 'Das volle Netz', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus freundePath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/freunde/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1255, y: 0.5686, d: 0.0339 },
      { x: 0.2453, y: 0.7160, d: 0.0339 },
      { x: 0.3361, y: 0.7160, d: 0.0339 },
      { x: 0.4193, y: 0.6735, d: 0.0339 },
      { x: 0.5501, y: 0.6371, d: 0.0339 },
      { x: 0.6493, y: 0.6414, d: 0.0339 },
      { x: 0.7141, y: 0.7585, d: 0.0339 },
      { x: 0.8063, y: 0.6675, d: 0.0339 },
      { x: 0.8882, y: 0.7585, d: 0.0339 }
    ],
    exam: { x: 0.9507, y: 0.7282, d: 0.0339 },
    path: FREUNDE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Das Boot als Kanzel',
      ref: 'Lukas 5,1–3',
      text: [
        'Jesus steht am See Genezareth. Die Menschen drängen sich immer dichter an ihn heran, denn sie wollen das Wort Gottes hören.',
        'Am Ufer liegen zwei Boote. Die Fischer sind schon ausgestiegen und waschen ihre Netze. Zu ihnen gehören Simon und seine Gefährten Jakobus und Johannes, die Söhne des Zebedäus.',
        'Jesus sieht die Boote und geht auf sie zu. Er steigt in das Boot, das Simon gehört. Er bittet ihn, ein kleines Stück vom Land hinauszufahren.',
        'Dann setzt sich Jesus ins Boot und lehrt die Menschen vom Wasser aus. So können alle ihn sehen und hören.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Ufer mit den Booten zusammen.', puzzle: { image: `${G}puzzle/ufer.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wo steht Jesus, als sich die Menschen zu ihm drängen?', options: ['am See Genezareth', 'am Jordan', 'im Tempel'], answer: 0 },
        { q: 'Was tun die Fischer am Ufer?', options: ['Sie waschen ihre Netze.', 'Sie schlafen.', 'Sie verkaufen Fische.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Auf dein Wort',
      ref: 'Lukas 5,4–5',
      text: [
        'Als Jesus aufgehört hat zu reden, sagt er zu Simon: „Fahre hinaus auf die Tiefe. Werft eure Netze aus, damit ihr einen Fang tut.“',
        'Simon antwortet: „Meister, wir haben die ganze Nacht gearbeitet. Wir haben nichts gefangen.“ Ihre Netze waren die ganze Nacht lang leer.',
        'Aber dann sagt Simon: „Auf dein Wort will ich das Netz auswerfen.“',
        'Vom Boot aus hat Jesus eben noch zu den Menschen am Ufer gesprochen. Jetzt tut Simon, was Jesus gesagt hat. Sie fahren hinaus auf den See, und Jesus ist bei ihnen im Boot.'
      ],
      // Spiel: Das Lot (lot, neu)
      task: { kind: 'lot', hint: 'Fahre das Boot zur tiefen Stelle und lass das Lot hinunter.', plumb: LOT },
      questions: [
        { q: 'Was sagt Jesus zu Simon?', options: ['Fahre hinaus auf die Tiefe und werft eure Netze aus.', 'Geh nach Hause.', 'Bring mir einen Fisch.'], answer: 0 },
        { q: 'Was hat Simon in der Nacht gefangen?', options: ['nichts', 'hundert Fische', 'einen großen Fisch'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das volle Netz',
      ref: 'Lukas 5,6–7',
      text: [
        'Simon und die anderen im Boot werfen die Netze aus, so wie Jesus es gesagt hat. Die ganze Nacht haben sie nichts gefangen. Das Netz, das eben noch leer war, wird schwer. Jetzt fangen sie auf einmal eine so große Menge Fische, dass ihr Netz zu reißen beginnt.',
        'Allein können sie das Netz nicht ziehen. Sie winken ihren Gefährten im anderen Boot zu. Die sollen kommen und ihnen helfen.',
        'Die Gefährten kommen herbei. Zu ihnen gehören Jakobus und Johannes. Gemeinsam füllen sie beide Boote mit Fischen. Die Boote werden so voll, dass sie fast untergehen.'
      ],
      // Spiel: Beide Boote füllen (boote, neu)
      task: { kind: 'boote', hint: 'Fülle beide Boote bis zur Marke: Tippe auf ein Boot, dann springt ein Fisch hinein.', boats: BOOTE },
      questions: [
        { q: 'Was geschieht mit dem Netz, als sie so viele Fische fangen?', options: ['Es beginnt zu reißen.', 'Es bleibt leer.', 'Es versinkt im See.'], answer: 0 },
        { q: 'Wen rufen sie zu Hilfe?', options: ['ihre Gefährten im anderen Boot', 'die Menschen am Ufer', 'Jesus'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Menschen fangen',
      ref: 'Lukas 5,8–11',
      text: [
        'Als Simon Petrus das sieht, fällt er im Boot vor Jesus auf die Knie. „Herr, geh weg von mir“, sagt er, „ich bin ein sündiger Mensch.“ Ein großer Schrecken hat ihn gepackt, ihn und alle, die bei ihm sind, über den Fang, den sie gemacht haben.',
        'Auch Jakobus und Johannes, die Söhne des Zebedäus, erschrecken. Sie sind Simons Gefährten und waren im anderen Boot.',
        'Jesus sagt zu Simon: „Fürchte dich nicht! Von nun an wirst du Menschen fangen.“',
        'Da fahren sie die Boote ans Land. Sie lassen alles zurück und gehen mit Jesus.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagt Jesus zu Simon?', options: ['Fürchte dich nicht! Von nun an wirst du Menschen fangen.', 'Fahre wieder hinaus.', 'Verkaufe die Fische.'], answer: 0 },
        { q: 'Wie heißen die Söhne des Zebedäus?', options: ['Jakobus und Johannes', 'Andreas und Philippus', 'Thomas und Matthäus'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Durch das Dach',
      ref: 'Markus 2,1–12',
      text: [
        'Einige Tage später ist Jesus wieder in Kapernaum. Es spricht sich herum, dass er im Haus ist, und so viele Menschen kommen, dass nicht einmal vor der Tür noch Platz ist. Jesus sagt ihnen das Wort Gottes.',
        'Vier Männer tragen einen Gelähmten auf seinem Bett zu Jesus. Wegen der Menge kommen sie nicht hinein. Da decken sie das Dach auf, genau über der Stelle, wo Jesus ist, und lassen das Bett mit dem Kranken hinunter.',
        'Als Jesus ihren Glauben sieht, sagt er zu dem Gelähmten: „Mein Sohn, deine Sünden sind dir vergeben.“',
        'Er will zeigen, dass er Macht hat, Sünden zu vergeben. Dann sagt er: „Steh auf, nimm dein Bett und geh nach Hause!“ Da steht der Mann auf, nimmt sein Bett und geht hinaus, vor den Augen aller. Alle staunen und loben Gott.'
      ],
      // Spiel: Das Dach öffnen (dach, neu)
      task: { kind: 'dach', hint: 'Öffne das Dach genau über Jesus: Tippe auf die Dachstücke dort.', roof: DACH },
      questions: [
        { q: 'Wie viele Männer tragen den Gelähmten?', options: ['vier', 'zwei', 'zehn'], answer: 0 },
        { q: 'Wie kommen sie zu Jesus, als sie nicht durch die Tür können?', options: ['Sie decken das Dach auf und lassen das Bett hinunter.', 'Sie warten draußen bis zum Abend.', 'Sie klettern durch ein Fenster.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Levi am Zoll',
      ref: 'Markus 2,13–14; Lukas 5,27–28',
      text: [
        'Jesus geht wieder hinaus an den See. Alle Menschen kommen zu ihm, und er lehrt sie. Dann geht er ein Stück weiter.',
        'Vorher hat Jesus schon vier Fischer gerufen: Simon, Andreas, Jakobus und Johannes. Nun kommt er an einen Ort, an dem ein Mann am Zoll sitzt.',
        'Dieser Mann heißt Levi und ist der Sohn des Alphäus. Er ist ein Zöllner: Er nimmt von den Leuten, die vorbeikommen, den Zoll ein. Wer mit seinen Waren vorbeikommt, muss bei ihm bezahlen.',
        'Jesus sieht ihn und sagt: „Folge mir nach!“ Da steht Levi auf, lässt alles zurück und folgt Jesus nach.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer sitzt am Zoll?', options: ['Levi, der Sohn des Alphäus', 'Simon, der Fischer', 'Johannes, der Sohn des Zebedäus'], answer: 0 },
        { q: 'Was sagt Jesus zu ihm?', options: ['Folge mir nach!', 'Bleib hier sitzen.', 'Zähle dein Geld.'], answer: 0 },
        { q: 'Was tut Levi?', options: ['Er steht auf und folgt Jesus nach.', 'Er bleibt am Zoll sitzen.', 'Er läuft davon.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Das Fest bei Levi',
      ref: 'Markus 2,15–17; Lukas 5,29–32',
      text: [
        'Später lädt Levi Jesus zu einem großen Essen in sein Haus ein. Viele Zöllner und Sünder setzen sich mit Jesus und seinen Jüngern zu Tisch. Es sind viele, die ihm nachfolgen.',
        'Die Schriftgelehrten und Pharisäer sehen das und murren. Sie fragen die Jünger: „Warum isst und trinkt er mit den Zöllnern und Sündern?“',
        'Jesus hört, was sie sagen. Er antwortet ihnen: „Nicht die Gesunden brauchen einen Arzt, sondern die Kranken.“',
        'Dann sagt er: „Ich bin nicht gekommen, die Gerechten zu rufen. Ich bin gekommen, die Sünder zu rufen, damit sie umkehren.“'
      ],
      // Spiel: Sitzplätze (sitzplaetze, neu)
      task: { kind: 'sitzplaetze', hint: 'Schiebe die Bänke, bis jeder Gast am Tisch einen Platz hat.', seats: SITZ },
      questions: [
        { q: 'Bei wem sitzt Jesus zu Tisch?', options: ['bei Levi', 'bei Simon', 'bei Zebedäus'], answer: 0 },
        { q: 'Wer isst mit Jesus?', options: ['viele Zöllner und Sünder', 'nur die Schriftgelehrten', 'nur Fischer'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Zwölf Freunde auf dem Berg',
      ref: 'Markus 3,13–19; Lukas 6,13',
      text: [
        'Jesus steigt auf einen Berg und ruft zu sich, wen er will. Sie kommen zu ihm.',
        'Er bestimmt zwölf von ihnen, die er auch Apostel nennt. Sie sollen bei ihm sein, und er will sie aussenden, damit sie den Menschen Gottes Wort sagen. Sie sollen auch Macht haben, Kranke gesund zu machen.',
        'Jesus gibt Simon den Namen Petrus. Jakobus und Johannes, die Söhne des Zebedäus, nennt er Donnersöhne. Dazu kommen Andreas, Philippus, Bartholomäus, Matthäus und Thomas.',
        'Und Jakobus, der Sohn des Alphäus, Thaddäus, Simon, der Zelot, und Judas Iskariot. Der hat ihn später verraten.'
      ],
      // Spiel: Die Zwölf (zwoelf, neu)
      task: { kind: 'zwoelf', hint: 'Tippe den Freund von Jesus an, dessen Name leuchtet.', twelve: ZWOELF },
      questions: [
        { q: 'Wohin geht Jesus, als er die Zwölf ruft?', options: ['auf einen Berg', 'an den See', 'in den Tempel'], answer: 0 },
        { q: 'Welchen Namen gibt Jesus dem Simon?', options: ['Petrus', 'Johannes', 'Thaddäus'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Wer gehört zu Jesus?',
      ref: 'Markus 3,31–35',
      text: [
        'Jesus ist in einem Haus, und viele Menschen sitzen im Kreis um ihn. Draußen kommen seine Mutter und seine Brüder an. Sie bleiben vor dem Haus stehen und lassen ihn rufen.',
        'Die Menschen im Haus sagen zu Jesus: „Deine Mutter und deine Brüder sind draußen. Sie fragen nach dir.“',
        'Jesus antwortet: „Wer ist meine Mutter, und wer sind meine Brüder?“ Er sieht die an, die im Kreis um ihn sitzen.',
        'Dann sagt er: „Das hier sind meine Mutter und meine Brüder! Denn wer Gottes Willen tut, der ist mein Bruder und meine Schwester und meine Mutter.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer steht draußen vor dem Haus?', options: ['Jesu Mutter und seine Brüder', 'die Zwölf Jünger', 'die Fischer vom See'], answer: 0 },
        { q: 'Wohin sieht Jesus, als er antwortet?', options: ['auf die, die im Kreis um ihn sitzen', 'zur Tür hinaus', 'zum Himmel'], answer: 0 },
        { q: 'Wer ist Jesu Bruder und Schwester und Mutter?', options: ['wer Gottes Willen tut', 'wer am meisten Geld hat', 'wer am schnellsten läuft'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sagt Simon, bevor er das Netz auswirft?', options: ['Auf dein Wort will ich das Netz auswerfen.', 'Das ist mir zu weit.', 'Ich habe keine Zeit.'], answer: 0 },
    { q: 'Wie voll werden die beiden Boote?', options: ['so voll, dass sie fast untergehen', 'nur halb voll', 'gar nicht voll'], answer: 0 },
    { q: 'Was sagt Jesus zu Simon im Boot?', options: ['Fürchte dich nicht! Von nun an wirst du Menschen fangen.', 'Fahre wieder hinaus.', 'Verkaufe die Fische.'], answer: 0 },
    { q: 'Wie viele Männer tragen den Gelähmten zu Jesus?', options: ['vier', 'zwei', 'zehn'], answer: 0 },
    { q: 'Wer braucht den Arzt, sagt Jesus?', options: ['die Kranken', 'die Gesunden', 'niemand'], answer: 0 },
    { q: 'Welchen Namen gibt Jesus dem Simon?', options: ['Petrus', 'Johannes', 'Thaddäus'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of freunde.stages) {
  const file = `audio/abenteuer/freunde/geschichte-${String(s.id).padStart(2, '0')}-${s.id === 5 ? 'v2' : 'v1'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (at the shore, the full net, on the mountain); they follow one another at random
freunde.music = [
  'audio/abenteuer/freunde/musik-ufer-v2.mp3',
  'audio/abenteuer/freunde/musik-netz-v2.mp3',
  'audio/abenteuer/freunde/musik-berg-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(freunde, freundeEn)
