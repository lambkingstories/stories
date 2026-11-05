/**
 * Abenteuer "Jesu Wunder am See" (Markus 4-6) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Vom Sturm bis zum Saum seines Kleides". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 1.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Wunder/ENTWURF_Wunder.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-11-01.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend; Antons Spielplan 5.11.2026: höchstens zwei bekannte Spiele): 1 Lückenvers (alt), 2 Boot ausschöpfen (neu), 3 Reihenfolge (alt), 4 nur Quiz,
 * 5 Durch das Gedränge (neu), 6 Der Saum (neu, 5.11.), 7 nur Quiz, 8 Reisebündel packen (neu), 9 Am Ufer entlang (neu, 5.11.), 10 Brot austeilen (neu), 11 Gegen den Wind rudern (neu), 12 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/wunder/, images/abenteuer/spiele/wunder/<spiel>/, audio/abenteuer/wunder/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BailGame, BreadGame, BundleGame, CrowdGame, Journey, OrderGame, RowGame, VerseGame } from '@/types/adventure'
import type { SaumGame, UferGame } from '@/utils/wunderNeu'
import { josef } from './josef'
import { WUNDER_PATH } from './wunderPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { wunderEn } from './en/wunder.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei Etappe 2 und 12 Variante b nach Antons Wahl): `images/abenteuer/wunder/etappe-bild-NN.webp`, bei b `etappe-bild-NN-b.webp`, 960 × 640
const PICS = 'images/abenteuer/wunder/'

const G = 'images/abenteuer/spiele/wunder/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 22 (kopiert). Hintergrund ist der gemalte Abend am See (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Lasst uns hinüberfahren ans andere ', '.“'], words: ['Ufer', 'Haus', 'Boot'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Jesus sagt zu seinen ', ': „Lasst uns ', ' ans andere Ufer.“'], words: ['Jüngern', 'hinüberfahren', 'Nachbarn', 'umkehren'], answers: [0, 1] }
  ]
}

/**
 * Etappe 3, "Der Sturm legt sich" (alte Mechanik, Reihenfolge legen): die Boote fahren am Abend los, der Sturm bricht aus, die Jünger wecken Jesus, es wird ganz still.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S34): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'abend', image: `${G}reihenfolge/karte-1.webp`, label: 'Die Boote fahren am Abend los' },
    { id: 'sturm', image: `${G}reihenfolge/karte-2.webp`, label: 'Der Sturm bricht los' },
    { id: 'wecken', image: `${G}reihenfolge/karte-3.webp`, label: 'Die Jünger wecken Jesus' },
    { id: 'stille', image: `${G}reihenfolge/karte-4.webp`, label: 'Es wird ganz still' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['sturm', 'wecken', 'stille'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang am Abend und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['abend', 'sturm', 'wecken', 'stille'] }
  ]
}

/** Die fünf neuen Spiele (Spezifikation: D:/Claude/Abenteuer-Wunder/SPIELE.md, Daten: SPIELE-DATEN.md). Lagen sind Prozent des Bildes und werden nach den gemalten Bildern verfeinert. */

/** Etappe 2, "Das Boot ausschöpfen" (neu): Sturm, das Boot läuft voll (Mk 4,37). */
const SCHOEPFEN: BailGame = {
  background: `${G}schoepfen/boot-innen.webp`,
  puddles: [
    { id: 'lache-1', image: `${G}schoepfen/lache-1.webp`, w: 20 },
    { id: 'lache-2', image: `${G}schoepfen/lache-2.webp`, w: 20 },
    { id: 'lache-3', image: `${G}schoepfen/lache-3.webp`, w: 20 }
  ],
  cup: { image: `${G}schoepfen/becher.webp`, w: 9 },
  spots: [
    { x: 28, y: 36 },
    { x: 50, y: 30 },
    { x: 72, y: 36 },
    { x: 24, y: 54 },
    { x: 76, y: 54 },
    { x: 38, y: 70 },
    { x: 62, y: 70 }
  ],
  rounds: [
    { hint: 'Schöpfe das Wasser aus dem Boot: Tippe auf eine Wasserlache. Jede Lache braucht drei Becher.', total: 5, every: 5 },
    { hint: 'Noch einmal, diesmal kommen die Wellen schneller. Schöpfe weiter.', total: 7, every: 4 }
  ]
}

/** Etappe 5, "Durch das Gedränge" (neu): die Menge drängt sich um Jesus und Jairus (Mk 5,24). */
const GEDRAENGE: CrowdGame = {
  background: `${G}gedraenge/strasse.webp`,
  area: { x: 10, y: 22, w: 80, h: 74 },
  pair: { image: `${G}gedraenge/paar.webp`, label: 'Jesus und Jairus', w: 18 },
  people: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `${G}gedraenge/mensch-${n}.webp`, label: 'Mensch im Gedränge', w: 13 })),
  door: { x: 50, y: 20 },
  rounds: [
    {
      hint: 'Jesus und Jairus wollen zum Haus. Tippe auf die Menschen, damit sie Platz machen.',
      rows: [
        [0, 0, 1, 0, 0],
        [0, 2, 3, 4, 0],
        [5, 0, 6, 0, 0]
      ]
    },
    {
      hint: 'Noch einmal, diesmal ist das Gedränge größer.',
      rows: [
        [0, 1, 2, 0, 3],
        [4, 5, 6, 0, 0],
        [0, 3, 4, 5, 0],
        [1, 0, 2, 6, 5],
        [0, 6, 5, 1, 0]
      ]
    }
  ]
}

/** Etappe 8, "Das Reisebündel packen" (neu): Stab, Sandalen und ein Hemd, sonst nichts (Mk 6,8-9). */
const ding = (id: string, label: string) => ({ id, image: `${G}buendel/ding-${id}.webp`, label, w: 16 })
const BUENDEL: BundleGame = {
  background: `${G}buendel/tuch.webp`,
  things: [
    ding('stab', 'Stab'),
    ding('sandalen', 'Sandalen'),
    ding('hemd', 'Hemd'),
    ding('brot', 'Brot'),
    ding('tasche', 'Tasche'),
    ding('geld', 'Geldbeutel'),
    ding('hemd2', 'Zweites Hemd')
  ],
  bundle: { image: `${G}buendel/buendel.webp`, label: 'Das Reisebündel', w: 18, x: 50, y: 91 },
  disciple: { image: `${G}buendel/juenger.webp`, label: 'Ein Jünger', w: 14, x: 86, y: 70 },
  rounds: [
    {
      hint: 'Jesus sagt: Nehmt nichts mit auf den Weg, außer einem Stab und Sandalen. Tippe auf das, was ins Bündel darf.',
      items: [
        { thing: 'stab', allowed: true, x: 24, y: 28 },
        { thing: 'sandalen', allowed: true, x: 56, y: 28 },
        { thing: 'brot', allowed: false, x: 24, y: 54 },
        { thing: 'geld', allowed: false, x: 56, y: 54 }
      ]
    },
    {
      hint: 'Noch einmal: Nur ein Hemd, keine Tasche, kein zweites Hemd, dazu der Stab.',
      items: [
        { thing: 'hemd', allowed: true, x: 24, y: 28 },
        { thing: 'tasche', allowed: false, x: 56, y: 28 },
        { thing: 'hemd2', allowed: false, x: 24, y: 54 },
        { thing: 'stab', allowed: true, x: 56, y: 54 }
      ]
    }
  ]
}

/** Etappe 10, "Brot austeilen" (neu): fünf Brote und zwei Fische für fünftausend, zwölf Körbe bleiben (Mk 6,39-43). */
const BROTE: BreadGame = {
  background: `${G}brote/wiese.webp`,
  groups: [
    { id: 'g1', image: `${G}brote/gruppe-1.webp`, label: 'Eine Gruppe von Menschen im Gras', x: 18, y: 34, w: 25 },
    { id: 'g2', image: `${G}brote/gruppe-2.webp`, label: 'Eine Gruppe von Menschen im Gras', x: 50, y: 30, w: 25 },
    { id: 'g3', image: `${G}brote/gruppe-3.webp`, label: 'Eine Gruppe von Menschen im Gras', x: 82, y: 34, w: 25 },
    { id: 'g4', image: `${G}brote/gruppe-4.webp`, label: 'Eine Gruppe von Menschen im Gras', x: 30, y: 56, w: 25 },
    { id: 'g5', image: `${G}brote/gruppe-5.webp`, label: 'Eine Gruppe von Menschen im Gras', x: 70, y: 56, w: 25 }
  ],
  basket: { image: `${G}brote/korb-voll.webp`, label: 'Korb mit fünf Broten und zwei Fischen', w: 16, x: 50, y: 96 },
  disciple: { image: `${G}brote/juenger-teilt.webp`, w: 9 },
  leftover: { image: `${G}brote/korb-leer.webp`, label: 'Korb mit Resten', w: 9, count: 12, area: { x: 8, y: 22, w: 84, h: 52 } },
  rounds: [
    { hint: 'Jesus dankt und lässt Brot und Fisch austeilen. Tippe auf eine Gruppe, damit ein Jünger sie satt macht.', kind: 'feed' },
    { hint: 'Es ist viel übrig geblieben. Sammle die Körbe mit den Resten ein: zwölf Körbe voll.', kind: 'collect' }
  ]
}

/** Etappe 11, "Gegen den Wind rudern" (neu): die Jünger mühen sich im Gegenwind ab, Jesus kommt über das Wasser (Mk 6,48). */
const RUDERN: RowGame = {
  background: `${G}rudern/see-nacht.webp`,
  boat: { image: `${G}rudern/boot-oben.webp`, label: 'Das Boot mit zwei Rudern', w: 26, ratio: 0.55 },
  jesus: { image: `${G}rudern/jesus-wasser.webp`, label: 'Jesus auf dem Wasser', w: 9, x: 68, y: 40 },
  start: 76,
  goal: 42,
  rounds: [
    { hint: 'Rudere abwechselnd links und rechts. Der Wind will das Boot drehen.', distance: 30, wind: 1.5 },
    { hint: 'Noch einmal, der Wind ist stärker. Rudere ein wenig mehr gegen den Wind.', distance: 45, wind: -3 }
  ]
}

/**
 * Etappe 6, "Der Saum" (neu, Antons Spielplan 5.11.2026; Mk 5,25-34): Jesus geht in der Gasse von Kapernaum durch die Menge, eine Frau aus der Menge streckt die Hand aus.
 * Das Kind tippt genau auf die Quasten am Saum, wenn sie an ihrer Hand vorbeikommen. Runde 1 langsam mit Ring, Runde 2 schneller, Menschen gehen davor vorbei.
 * Bilder (Bildauftrag S70): `saum/strasse.webp`, `jesus.webp`, `frau.webp`, `mensch-1..4.webp`. Lagen an den Bildern gemessen (tools/neue_spiele_wunder.py).
 */
const SAUM: SaumGame = {
  background: `${G}saum/strasse.webp`,
  road: 93,
  jesus: { image: `${G}saum/jesus.webp`, label: 'Jesus', w: 14.25, aspect: 1.87 },
  hem: { x: 13.75, y: 78.7 },
  woman: { image: `${G}saum/frau.webp`, label: 'Eine Frau aus der Menge', w: 18.89, aspect: 1.06, x: 40.63, y: 99.51 },
  touch: { x: 50, y: 84.48 },
  people: [
    { image: `${G}saum/mensch-1.webp`, label: 'Ein Mann mit einem Bündel', w: 12.51, aspect: 2.18 },
    { image: `${G}saum/mensch-2.webp`, label: 'Eine Frau mit einem Krug', w: 11.25, aspect: 2.55 },
    { image: `${G}saum/mensch-3.webp`, label: 'Ein alter Mann mit Stab', w: 12.57, aspect: 2 },
    { image: `${G}saum/mensch-4.webp`, label: 'Ein Junge mit einem Korb', w: 11.24, aspect: 1.81 }
  ],
  rounds: [
    {
      hint: 'Tippe genau auf die Quasten am Saum, wenn sie bei der Hand der Frau sind. Der Ring zeigt, wie weit sie reicht.',
      duration: 9,
      pause: 1.5,
      reach: 9,
      hemR: 7,
      sway: 1,
      ring: true,
      walkers: []
    },
    {
      hint: 'Jetzt geht Jesus schneller, und Menschen drängen sich davor. Warte auf den richtigen Augenblick.',
      duration: 6.5,
      pause: 1.2,
      reach: 8,
      hemR: 6.5,
      sway: 2,
      walkers: [{ person: 0, lane: 99, from: 110, to: -10, at: 0.9, dur: 4 }, { person: 3, lane: 100, from: -10, to: 110, at: 0.2, dur: 3 }]
    }
  ]
}

/**
 * Etappe 9, "Am Ufer entlang" (neu, Antons Spielplan 5.11.2026; Mk 6,30-34): Jesus und die Jünger fahren mit dem Boot an einen einsamen Ort, die Menschen laufen zu Fuß am Ufer entlang.
 * Das Kind zeichnet der Menge mit dem Finger einen Weg um die Felsen herum, nicht ins Wasser, bis zur Anlegestelle; dann läuft die Menge den Weg und das Boot kommt an.
 * Bilder (Bildauftrag S71): `ufer/ufer-1.webp`, `ufer-2.webp` (Ufer ohne Felsen), `fels-1..4.webp`, `menge.webp`, `boot.webp`. Das Wasser ist am Bild gemessen (Farbe, tools/neue_spiele_bilder_wunder.py).
 */
const UFER: UferGame = {
  rocks: [
    { image: `${G}ufer/fels-1.webp`, label: 'Ein großer Felsbrocken', w: 16 },
    { image: `${G}ufer/fels-2.webp`, label: 'Zwei Felsen', w: 16 },
    { image: `${G}ufer/fels-3.webp`, label: 'Ein hoher Felsen', w: 16 },
    { image: `${G}ufer/fels-4.webp`, label: 'Ein runder Felsen mit Busch', w: 16 }
  ],
  crowd: { image: `${G}ufer/menge.webp`, label: 'Die Menge', w: 12 },
  boat: { image: `${G}ufer/boot.webp`, label: 'Das Boot mit Jesus und den Jüngern', w: 17 },
  pad: 2,
  rounds: [
    {
      hint: 'Fang bei der Menge an und zieh mit dem Finger einen Weg am Ufer entlang bis zur Anlegestelle. Nicht durch die Felsen, nicht ins Wasser.',
      background: `${G}ufer/ufer-1.webp`,
      water: [
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 36 }, { x: 96, y: 37.5 }, { x: 92, y: 38.5 }, { x: 88, y: 40.5 }, { x: 84, y: 42.5 }, { x: 78, y: 43.5 }, { x: 70, y: 43.5 }, { x: 60, y: 43 }, { x: 50, y: 42 }, { x: 40, y: 40.5 }, { x: 30, y: 39 }, { x: 20, y: 37 }, { x: 15, y: 34 }, { x: 12, y: 30 }, { x: 8, y: 24 }, { x: 4, y: 18.5 }, { x: 0, y: 17 }]
      ],
      rocks: [
        { rock: 0, x: 30, y: 72, w: 15, r: 6 },
        { rock: 1, x: 48, y: 88, w: 15, r: 6 },
        { rock: 3, x: 68, y: 63, w: 14, r: 5.5 }
      ],
      start: { x: 13, y: 84 },
      goal: { x: 93, y: 48 },
      boatFrom: { x: 20, y: 18 },
      boatTo: { x: 84, y: 26 }
    },
    {
      hint: 'Jetzt ist eine Bucht im Weg, und mehr Felsen liegen am Ufer. Führe die Menge außen herum.',
      background: `${G}ufer/ufer-2.webp`,
      water: [
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 14 }, { x: 97, y: 17 }, { x: 93, y: 22 }, { x: 92, y: 28 }, { x: 93, y: 35 }, { x: 92, y: 45 }, { x: 89, y: 55 }, { x: 84, y: 62 }, { x: 77, y: 66 }, { x: 68, y: 68.5 }, { x: 60, y: 69.5 }, { x: 50, y: 68.5 }, { x: 42, y: 67 }, { x: 33, y: 63.5 }, { x: 25, y: 58.5 }, { x: 20, y: 52 }, { x: 16, y: 45 }, { x: 13.5, y: 38 }, { x: 14, y: 30 }, { x: 16, y: 26 }, { x: 14, y: 22 }, { x: 9, y: 17 }, { x: 4, y: 12 }, { x: 0, y: 11 }]
      ],
      rocks: [
        { rock: 2, x: 12, y: 60, w: 12, r: 4.8 },
        { rock: 0, x: 30, y: 84, w: 14, r: 5.5 },
        { rock: 3, x: 52, y: 92, w: 13, r: 5 },
        { rock: 1, x: 71, y: 83, w: 14, r: 5.5 },
        { rock: 2, x: 90, y: 68, w: 12, r: 4.8 }
      ],
      start: { x: 7, y: 80 },
      goal: { x: 96.5, y: 36 },
      boatFrom: { x: 30, y: 22 },
      boatTo: { x: 82, y: 30 }
    }
  ]
}

export const wunder: Journey = {
  id: 'wunder',
  title: 'Jesu Wunder am See',
  subtitle: 'Vom Sturm bis zum Saum seines Kleides',
  age: '8-10',
  downloadMb: 17, // gemessen 2.11.2026: Bilder 7,9 MB (Karte 5 MB), Spielbilder 3,2 MB, Musik 1,4 MB; die Aufnahmen (rund 4 MB) kommen dazu, ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-3.webp`, // Medaille 3 (Jesus auf dem Wasser, Antons Wahl 2.11.2026)
  // Geschenk-Ausmalbild: fünf Brote und zwei Fische (Konturzeichnung)
  gift: { title: 'Fünf Brote und zwei Fische', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus wunderPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/wunder/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0691, y: 0.5704, d: 0.0339 },
      { x: 0.1260, y: 0.6189, d: 0.0339 },
      { x: 0.1784, y: 0.6432, d: 0.0339 },
      { x: 0.2450, y: 0.5704, d: 0.0339 },
      { x: 0.3125, y: 0.4976, d: 0.0339 },
      { x: 0.3639, y: 0.6311, d: 0.0339 },
      { x: 0.5242, y: 0.6311, d: 0.0339 },
      { x: 0.6008, y: 0.5704, d: 0.0339 },
      { x: 0.6754, y: 0.4854, d: 0.0339 },
      { x: 0.7702, y: 0.6432, d: 0.0339 },
      { x: 0.8569, y: 0.5461, d: 0.0339 },
      { x: 0.9123, y: 0.6311, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.6675, d: 0.0339 },
    path: WUNDER_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Hinüber ans andere Ufer',
      ref: 'Markus 4,35–36',
      text: [
        'Den ganzen Tag hat Jesus am See Genezareth zu den Menschen gesprochen. Er saß dabei in einem Boot, und die Menge stand am Ufer. Er hat ihnen Geschichten erzählt, zum Beispiel von einem Bauern, der Samen auf seinen Acker streut.',
        'Jetzt wird es Abend. Jesus sagt zu seinen Jüngern: „Lasst uns hinüberfahren ans andere Ufer.“',
        'Die Jünger schicken die Menschen nach Hause. Jesus bleibt im Boot, so wie er ist, und sie legen ab. Noch andere Boote fahren mit ihnen hinaus.',
        'Hinter ihnen wird das Ufer immer kleiner. Auf dem Wasser wird es still.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Was hat Jesus den ganzen Tag getan?', options: ['Er hat die Menschen am See gelehrt.', 'Er hat Fische gefangen.', 'Er hat im Boot geschlafen.'], answer: 0 },
        { q: 'Was sagt Jesus am Abend zu seinen Jüngern?', options: ['Lasst uns hinüberfahren.', 'Wir bleiben hier.', 'Fahrt ohne mich.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02-b.webp`,
      title: 'Der Sturm',
      ref: 'Markus 4,37–38',
      text: [
        'Mitten auf dem See erhebt sich ein großer Sturm. Der Wind wirbelt, und die Wellen schlagen ins Boot. Immer mehr Wasser läuft hinein, bis das Boot voll ist.',
        'Jesus liegt hinten im Boot und schläft. Sein Kopf ruht auf einem Kissen. Er hat einen langen Tag hinter sich.',
        'Die Jünger versuchen, das Wasser aus dem Boot zu schöpfen, aber es kommt schneller nach, als sie schöpfen können. Sie wecken ihn auf. „Meister“, rufen sie, „kümmert es dich nicht, dass wir untergehen?“',
        'Der Wind pfeift. Die anderen Boote tanzen auf den Wellen. Die Jünger haben große Angst.'
      ],
      // Spiel: Boot ausschöpfen (schoepfen, neu)
      task: { kind: 'schoepfen', hint: 'Schöpfe das Wasser aus dem Boot: Tippe auf eine Wasserlache.', bail: SCHOEPFEN },
      questions: [
        { q: 'Was geschieht mit dem Boot im Sturm?', options: ['Es füllt sich mit Wasser.', 'Es bleibt trocken.', 'Es fliegt davon.'], answer: 0 },
        { q: 'Was tut Jesus, als der Sturm losbricht?', options: ['Er schläft hinten im Boot.', 'Er rudert.', 'Er steht am Ufer.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Eine große Stille',
      ref: 'Markus 4,39–41',
      text: [
        'Jesus steht auf. Er spricht zum Wind und zum Meer: „Schweig und verstumme!“',
        'Da legt sich der Wind. Die Wellen werden ruhig, und es wird ganz still auf dem See. Eben noch hat alles getobt. Jetzt hört man nur noch das Wasser am Boot. Die Jünger sitzen da und wissen nicht, was sie sagen sollen.',
        'Jesus sagt zu den Jüngern: „Warum seid ihr so ängstlich? Habt ihr keinen Glauben?“',
        'Die Jünger staunen und fürchten sich sehr. „Wer ist das nur?“, sagen sie zueinander. „Sogar der Wind und das Meer hören auf ihn.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagt Jesus zum Wind und zum Meer?', options: ['Schweig und verstumme!', 'Weht stärker!', 'Bringt uns ans Ufer!'], answer: 0 },
        { q: 'Was geschieht danach?', options: ['Es wird ganz still.', 'Der Sturm wird noch größer.', 'Das Boot geht unter.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der Mann bei den Gräbern',
      ref: 'Markus 5,1–20',
      text: [
        'Auf der anderen Seite des Sees, im Land der Gerasener, steigt Jesus aus dem Boot. Da läuft ihm ein Mann entgegen. Er wohnt draußen bei den Gräbern, denn ein böser Geist quält ihn, und niemand kann ihn halten.',
        'Der Mann fällt vor Jesus nieder. Jesus befiehlt dem bösen Geist, den Mann zu verlassen. Die Geister bitten, in eine große Schweineherde am Berg fahren zu dürfen, und Jesus erlaubt es. Da rennen die Tiere den Abhang hinunter in den See.',
        'Die Hirten laufen in die Stadt. Als die Leute kommen, sitzt der Mann ruhig da, mit Kleidern und klarem Kopf. Sie bekommen Angst und bitten Jesus, wieder zu gehen.',
        'Der Mann will mit Jesus fahren. Doch Jesus sagt: „Geh nach Hause zu den Deinen und erzähle, was der Herr für dich getan hat.“ Das tut der Mann in den zehn Städten, und alle staunen.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo wohnt der Mann, als Jesus ankommt?', options: ['bei den Gräbern', 'in einem Haus am See', 'auf einem Schiff'], answer: 0 },
        { q: 'Was geschieht mit der Schweineherde?', options: ['Sie rennt den Abhang hinunter in den See.', 'Sie läuft nach Hause.', 'Sie bleibt auf der Weide.'], answer: 0 },
        { q: 'Was soll der Mann zu Hause erzählen?', options: ['was der Herr für ihn getan hat', 'wohin Jesus fährt', 'wo die Schweine sind'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Jairus bittet um Hilfe',
      ref: 'Markus 5,21–24',
      text: [
        'Jesus fährt zurück über den See. Am Ufer wartet schon eine große Menge auf ihn. Alle wollen ihn sehen.',
        'Da kommt ein Mann durch die Menschen gelaufen. Er heißt Jairus und ist ein Vorsteher der Synagoge. Als er Jesus sieht, fällt er vor ihm nieder.',
        '„Meine Tochter liegt im Sterben“, bittet er. „Komm bitte und leg ihr die Hand auf, damit sie gesund wird und lebt.“',
        'Jesus geht mit ihm. Die ganze Menge folgt und drängt sich von allen Seiten um sie. Jairus muss sich durch das Gedränge schieben, denn jeder Schritt dauert lange.'
      ],
      // Spiel: Durch das Gedränge (gedraenge, neu)
      task: { kind: 'gedraenge', hint: 'Bring Jesus und Jairus durch das Gedränge: Tippe auf die Menschen, damit sie Platz machen.', crowd: GEDRAENGE },
      questions: [
        { q: 'Wie heißt der Mann, der Jesus um Hilfe bittet?', options: ['Jairus', 'Simon', 'Levi'], answer: 0 },
        { q: 'Was ist mit seiner Tochter?', options: ['Sie liegt im Sterben.', 'Sie ist weggelaufen.', 'Sie ist im Boot.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Der Saum seines Kleides',
      ref: 'Markus 5,25–34',
      text: [
        'In der Menge geht eine Frau mit. Seit zwölf Jahren ist sie krank. Viele Ärzte haben ihr nicht geholfen, und all ihr Geld ist weg.',
        'Sie hat von Jesus gehört. „Wenn ich nur sein Kleid anrühre“, denkt sie, „dann werde ich gesund.“ Von hinten drängt sie sich heran und berührt es. Sofort spürt sie: Sie ist gesund.',
        'Jesus bleibt stehen und dreht sich um. „Wer hat meine Kleider angerührt?“ Die Jünger wundern sich: „Du siehst doch, wie sie dich drängen!“',
        'Da kommt die Frau zitternd und fällt vor ihm nieder. Sie erzählt alles. Jesus sagt: „Meine Tochter, dein Glaube hat dich gesund gemacht. Geh hin in Frieden.“'
      ],
      // Spiel: Der Saum (saum, neu 5.11.2026)
      task: { kind: 'saum', hint: 'Tippe auf den Saum seines Mantels, wenn Jesus an der Frau vorbeigeht.', hemTouch: SAUM },
      questions: [
        { q: 'Wie lange ist die Frau schon krank?', options: ['zwölf Jahre', 'zwei Tage', 'zehn Jahre'], answer: 0 },
        { q: 'Was berührt sie?', options: ['Jesu Kleid', 'Jesu Hand', 'das Boot'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Das Mädchen schläft',
      ref: 'Markus 5,35–43',
      text: [
        'Während Jesus noch spricht, kommen Leute aus dem Haus des Jairus. „Deine Tochter ist gestorben“, sagen sie. „Warum bemühst du den Meister noch?“',
        'Jesus hört es und sagt zu Jairus: „Fürchte dich nicht, glaube nur!“ Nur Petrus, Jakobus und Johannes dürfen mitgehen.',
        'Im Haus weinen und klagen viele. Jesus sagt: „Das Kind ist nicht gestorben, es schläft.“ Sie lachen ihn aus. Er schickt alle hinaus. Dann geht er mit dem Vater, der Mutter und den drei Jüngern zum Kind.',
        'Er nimmt ihre Hand: „Talitha kumi! Mädchen, ich sage dir: Steh auf!“ Sofort steht sie auf und geht umher. Sie ist zwölf Jahre alt. Jesus bittet sie, es niemandem zu erzählen, und sagt, man soll ihr zu essen geben.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt Jesus zu Jairus?', options: ['Fürchte dich nicht, glaube nur!', 'Geh nach Hause.', 'Wir kommen zu spät.'], answer: 0 },
        { q: 'Wie viele Jünger gehen mit ins Haus?', options: ['drei', 'alle zwölf', 'keiner'], answer: 0 },
        { q: 'Was soll man dem Mädchen geben?', options: ['etwas zu essen', 'ein neues Kleid', 'Medizin'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Zwei und zwei',
      ref: 'Markus 6,1–13',
      text: [
        'Jesus kommt in seine Heimatstadt Nazareth. Am Sabbat lehrt er in der Synagoge. Die Leute staunen, aber sie ärgern sich auch: „Ist das nicht der Zimmermann, der Sohn der Maria?“ Jesus wundert sich über ihren Unglauben.',
        'Dann ruft er die Zwölf zu sich. Er schickt sie hinaus, immer zu zweit.',
        '„Nehmt nichts mit auf den Weg“, sagt er, „nur einen Stab. Kein Brot, keine Tasche und kein Geld im Gürtel. Zieht Sandalen an und nur ein Hemd.“',
        'Die Jünger gehen los. Sie erzählen von Gott, salben viele Kranke mit Öl und machen sie gesund.'
      ],
      // Spiel: Reisebündel packen (buendel, neu)
      task: { kind: 'buendel', hint: 'Packe das Bündel für die Reise: Tippe auf das, was Jesus erlaubt hat.', bundle: BUENDEL },
      questions: [
        { q: 'Wie schickt Jesus die Jünger los?', options: ['immer zu zweit', 'alle zusammen', 'jeden allein'], answer: 0 },
        { q: 'Was dürfen sie mitnehmen?', options: ['einen Stab, Sandalen und ein Hemd', 'Brot und Geld', 'eine große Tasche'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Ein ruhiger Ort',
      ref: 'Markus 6,30–34',
      text: [
        'Die Jünger kommen zu Jesus zurück und erzählen ihm alles, was sie getan haben. Es sind so viele Leute da, dass sie nicht einmal Zeit zum Essen haben.',
        'Jesus sagt: „Kommt, wir gehen an einen einsamen Ort und ruhen uns ein wenig aus.“ Sie fahren mit dem Boot los.',
        'Aber die Menschen sehen sie wegfahren. Aus allen Städten laufen sie zu Fuß am Ufer entlang und sind schon da, als das Boot ankommt.',
        'Jesus steigt aus und sieht die vielen Menschen. Sie tun ihm leid, denn sie sind wie Schafe ohne Hirten. Er fängt an, ihnen vieles zu erzählen.'
      ],
      // Spiel: Am Ufer entlang (ufer, neu 5.11.2026)
      task: { kind: 'ufer', hint: 'Zeichne der Menge einen Weg am Ufer entlang, um die Felsen herum bis zur Anlegestelle.', bankPath: UFER },
      questions: [
        { q: 'Wohin will Jesus mit den Jüngern fahren?', options: ['an einen einsamen Ort', 'nach Hause', 'nach Jerusalem'], answer: 0 },
        { q: 'Wie kommen die Menschen dorthin?', options: ['Sie laufen zu Fuß am Ufer entlang.', 'Sie fahren mit Booten.', 'Sie reiten auf Eseln.'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Fünf Brote und zwei Fische',
      ref: 'Markus 6,35–44',
      text: [
        'Der Tag ist fast vorbei. Die Jünger sagen: „Schick die Menschen weg, damit sie sich etwas zu essen kaufen.“ Aber Jesus antwortet: „Gebt ihr ihnen zu essen!“',
        '„Wie viel Brot habt ihr?“, fragt Jesus. Die Jünger schauen nach. „Fünf Brote“, sagen sie, „und zwei Fische.“',
        'Jesus lässt die Menschen sich in Gruppen auf das grüne Gras setzen. Dann nimmt er die Brote und die Fische, sieht zum Himmel auf und dankt. Er bricht das Brot und gibt es den Jüngern zum Austeilen.',
        'Alle essen und werden satt. Zwölf Körbe voll Reste sammeln die Jünger ein. Es waren fünftausend Männer.'
      ],
      // Spiel: Brot austeilen (brote, neu)
      task: { kind: 'brote', hint: 'Teile das Brot aus: Tippe auf eine Gruppe, dann sammle die Körbe ein.', bread: BROTE },
      questions: [
        { q: 'Was haben die Jünger zu essen dabei?', options: ['fünf Brote und zwei Fische', 'zwölf Brote', 'nichts'], answer: 0 },
        { q: 'Wie sitzen die Menschen?', options: ['in Gruppen auf dem grünen Gras', 'alle in einer Reihe', 'im Boot'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Jesus kommt über das Wasser',
      ref: 'Markus 6,45–52',
      text: [
        'Jesus schickt die Jünger im Boot voraus ans andere Ufer. Er selbst geht allein auf einen Berg, um zu beten.',
        'Am Abend ist das Boot mitten auf dem See. Der Wind weht ihnen entgegen, und sie kommen nur mühsam voran. Jesus sieht vom Land aus, wie sie sich abmühen.',
        'In der letzten Nachtwache geht er auf dem Wasser zu ihnen hinaus. Die Jünger sehen ihn und schreien auf. Sie denken, es sei ein Gespenst.',
        'Doch Jesus ruft: „Seid getrost! Ich bin es, fürchtet euch nicht!“ Er steigt ins Boot, und der Wind legt sich.'
      ],
      // Spiel: Gegen den Wind rudern (rudern, neu)
      task: { kind: 'rudern', hint: 'Rudere gegen den Wind: Tippe abwechselnd links und rechts.', row: RUDERN },
      questions: [
        { q: 'Wohin geht Jesus, um zu beten?', options: ['auf einen Berg', 'in die Stadt', 'ins Boot'], answer: 0 },
        { q: 'Warum kommen die Jünger so schwer voran?', options: ['Der Wind weht ihnen entgegen.', 'Das Boot ist zu schwer.', 'Die Ruder sind kaputt.'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12-b.webp`,
      title: 'Am Saum seines Kleides',
      ref: 'Markus 6,53–56',
      text: [
        'Das Boot legt im Land Genezareth an. Jesus steigt aus, und sofort erkennen ihn die Leute. „Jesus ist da!“, rufen sie.',
        'Sie laufen in alle Dörfer ringsum und erzählen es überall weiter, so schnell sie können. Dann tragen sie ihre Kranken auf Betten zu den Orten, an denen Jesus ist.',
        'Wo er hinkommt, in Dörfer, Städte und auf Märkte, legen sie die Kranken auf die Plätze. Sie bitten ihn: „Lass uns nur den Saum deines Kleides berühren.“',
        'Und alle, die ihn berühren, werden gesund. Die Märkte füllen sich mit glücklichen Menschen.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin kommt das Boot?', options: ['ins Land Genezareth', 'nach Nazareth', 'nach Jerusalem'], answer: 0 },
        { q: 'Wie bringen die Leute die Kranken zu Jesus?', options: ['auf Betten', 'auf dem Boot', 'auf Eseln'], answer: 0 },
        { q: 'Worum bitten sie Jesus?', options: ['nur den Saum seines Kleides zu berühren', 'ihnen Brot zu geben', 'mit ihnen zu essen'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Worauf liegt Jesu Kopf, als er im Sturm schläft?', options: ['auf einem Kissen', 'auf einem Netz', 'auf einem Ruder'], answer: 0 },
    { q: 'Was sagt Jesus zum Wind und zum Meer?', options: ['Schweig und verstumme!', 'Weht stärker!', 'Bringt uns heim!'], answer: 0 },
    { q: 'Wie heißt der Mann, der Jesus um Hilfe für seine Tochter bittet?', options: ['Jairus', 'Petrus', 'Levi'], answer: 0 },
    { q: 'Wie lange ist die Frau schon krank, die Jesu Kleid berührt?', options: ['zwölf Jahre', 'zwei Tage', 'ein Jahr'], answer: 0 },
    { q: 'Wie viele Körbe voll Reste bleiben nach dem Essen übrig?', options: ['zwölf', 'fünf', 'zwei'], answer: 0 },
    { q: 'Was ruft Jesus den Jüngern auf dem Wasser zu?', options: ['Seid getrost! Ich bin es, fürchtet euch nicht!', 'Rudert schneller!', 'Fahrt zurück!'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of wunder.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of wunder.stages) {
  const file = `audio/abenteuer/wunder/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (evening at the lake, storm and calm, the green meadow); they follow one another at random
wunder.music = [
  'audio/abenteuer/wunder/musik-abend-v1.mp3',
  'audio/abenteuer/wunder/musik-sturm-v1.mp3',
  'audio/abenteuer/wunder/musik-wiese-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(wunder, wunderEn)
