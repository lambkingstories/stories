/**
 * Abenteuer "Der junge Jesus und die Taufe" (Lukas 2,41-52; Matthäus 3-4) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Vom Tempel in Jerusalem bis an den See". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 31.10.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (hier als Junge von zwölf Jahren und als Mann, ohne Heiligenschein). Gott der Vater, Engel und der Versucher sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Taufe/ENTWURF_Taufe.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-10-31.md.
 * Der Versucher wird im Erzähltext "der Versucher" genannt (Mt 4,3); nur in Jesu Wort steht "Satan" (Mt 4,10).
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Spielplan 5.11.2026: höchstens zwei bekannte, nie hintereinander): 1 Wimmelbild (alt), 2 Schriftrollen (neu), 3 Den Weg bereiten (neu), 4 Reihenfolge (alt), 5 Sonne und Schatten (neu), 6 nur Quiz,
 * 7 Licht über Galiläa (neu), 8 Das Netz auswerfen (neu), 9 nur Quiz. Die Typen der drei neuesten Spiele kommen aus `@/utils/taufeNeu`.
 * ERZEUGT von D:/Claude/Abenteuer-Taufe/tools/bauen_taufe.py (Spieldaten der neuen Spiele: neue_spiele_taufe.py); nicht von Hand ändern.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/taufe/, images/abenteuer/spiele/taufe/<spiel>/, audio/abenteuer/taufe/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { FindGame, Journey, NetGame, OrderGame, RoadGame } from '@/types/adventure'
import type { ScrollGame, ShadowWalkGame, SunGame } from '@/utils/taufeNeu'
import { josef } from './josef'
import { TAUFE_PATH } from './taufePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { taufeEn } from './en/taufe.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/taufe/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/taufe/'

const G = 'images/abenteuer/spiele/taufe/'

/**
 * Etappe 4, "Jesu Taufe" (alte Mechanik, Reihenfolge legen): Jesus kommt an den Jordan, Johannes tauft ihn, Jesus steigt aus dem Wasser, der Himmel tut sich auf.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S34): `reihenfolge/karte-1..4.webp` (4:3). Keine Figur im Himmel.
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'kommt', image: `${G}reihenfolge/karte-1.webp`, label: 'Jesus kommt an den Jordan' },
    { id: 'tauft', image: `${G}reihenfolge/karte-2.webp`, label: 'Johannes tauft Jesus im Jordan' },
    { id: 'steigt', image: `${G}reihenfolge/karte-3.webp`, label: 'Jesus steigt aus dem Wasser' },
    { id: 'himmel', image: `${G}reihenfolge/karte-4.webp`, label: 'Der Himmel tut sich auf' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['tauft', 'steigt', 'himmel'] },
    { hint: 'Runde 2: Jetzt mit dem Weg zum Jordan und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['kommt', 'tauft', 'steigt', 'himmel'] }
  ]
}

/**
 * Etappe 3, "Den Weg bereiten" (neu): Johannes ruft in der Wüste „Bereitet dem Herrn den Weg!“ (Mt 3,3). Auf dem breiten Weg zum Jordan liegen Felsbrocken, Steinhaufen, Dornensträucher und Äste; das Kind tippt sie an und sie
 * werden weggeräumt. Am Wegrand rasten Wanderer: wer sie antippt, macht einen Fehler (Kreuz). Zwei Runden, in der zweiten liegt mehr auf dem Weg.
 * Bilder (Bildauftrag S35): `bahn/weg.webp` 1200 × 900, `fels`, `steine`, `dorn`, `ast` (Bogen mit Magenta-Schnitt), `mann`, `frau` (Bogen mit Magenta-Schnitt).
 */
const WEG: RoadGame = {
  background: `${G}bahn/weg.webp`,
  items: [
    { id: 'fels', image: `${G}bahn/fels.webp`, label: 'Felsbrocken', w: 20 },
    { id: 'steine', image: `${G}bahn/steine.webp`, label: 'Steinhaufen', w: 18 },
    { id: 'dorn', image: `${G}bahn/dorn.webp`, label: 'Dornenstrauch', w: 16 },
    { id: 'ast', image: `${G}bahn/ast.webp`, label: 'Umgestürzter Ast', w: 20 },
    { id: 'mann', image: `${G}bahn/mann.webp`, label: 'Wanderer mit Stab', w: 12 },
    { id: 'frau', image: `${G}bahn/frau.webp`, label: 'Frau mit Kind', w: 13 }
  ],
  rounds: [
    {
      hint: 'Räume den Weg frei: Tippe auf Steine, Dornen und Äste. Die Wanderer lässt du in Ruhe.',
      spots: [
        { item: 'fels', x: 26, y: 90 },
        { item: 'dorn', x: 48, y: 76 },
        { item: 'steine', x: 68, y: 64 },
        { item: 'ast', x: 42, y: 58 },
        { item: 'mann', x: 82, y: 84, keep: true }
      ]
    },
    {
      hint: 'Noch mehr liegt auf dem Weg. Räume ihn ganz frei.',
      spots: [
        { item: 'dorn', x: 27, y: 93 },
        { item: 'ast', x: 46, y: 86 },
        { item: 'fels', x: 64, y: 74 },
        { item: 'steine', x: 38, y: 66 },
        { item: 'dorn', x: 72, y: 60 },
        { item: 'fels', x: 54, y: 52 },
        { item: 'frau', x: 80, y: 90, keep: true },
        { item: 'mann', x: 14, y: 78, keep: true }
      ]
    }
  ]
}

/**
 * Etappe 8, "Das Netz auswerfen" (neu): Simon und Andreas „warfen ihre Netze ins Meer“ (Mt 4,18). Fische schwimmen langsam durch den See; ein Tipp wirft das runde Netz dorthin und fängt alle Fische darunter.
 * Ein Wurf ohne Fisch ist ein Fehler (Kreuz, das Netz kommt leer hoch). Zwei Runden (vier und sechs Fische). Bilder (Bildauftrag S36): `netz/see.webp` 1200 × 900, `blau`, `gold`, `gruen`, `streifen` (Bogen mit Magenta-Schnitt), `netz.webp`.
 */
const NETZ: NetGame = {
  background: `${G}netz/see.webp`,
  fish: [
    { id: 'blau', image: `${G}netz/blau.webp`, w: 12 },
    { id: 'gold', image: `${G}netz/gold.webp`, w: 12 },
    { id: 'gruen', image: `${G}netz/gruen.webp`, w: 13 },
    { id: 'streifen', image: `${G}netz/streifen.webp`, w: 9 }
  ],
  net: `${G}netz/netz.webp`,
  netW: 30,
  reach: 11,
  area: { x: 6, y: 28, w: 70, h: 48 },
  rounds: [
    { hint: 'Wirf das Netz aus: Tippe dorthin, wo die Fische schwimmen.', fish: ['blau', 'gold', 'gruen', 'streifen'], speed: 0.045 },
    { hint: 'Noch einmal. Diesmal schwimmen mehr Fische im See.', fish: ['gold', 'blau', 'streifen', 'gruen', 'blau', 'gold'], speed: 0.055 }
  ]
}

/**
 * Etappe 1, "Wimmelbild" (alte Mechanik): die Pilgerstraße im Hochformat (Bildauftrag S33); gesucht werden fünf Verwandte und Bekannte aus der Reisegruppe (Lk 2,44), einige stehen hinter Karren, Fels, Baum und Mauer.
 * Jesus ist nicht dabei (er ist in Jerusalem geblieben). Bilder: `wimmel/szene.webp`, `reisende-1..5.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Onkel mit Wanderstab', 'Tante mit Wasserkrug', 'Nachbar mit Bündel', 'Großmutter mit Stock', 'Mädchen mit Korb'],
  doneText: 'Du hast alle fünf gefunden: den Onkel, die Tante, den Nachbarn, die Großmutter und das Mädchen. Aber Jesus ist nicht dabei.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/reisende-1.webp`, x: 44, y: 62, w: 12 },
    { image: `${G}wimmel/reisende-2.webp`, x: 72, y: 53, w: 12 },
    { image: `${G}wimmel/reisende-3.webp`, x: 88, y: 66, w: 12 },
    { image: `${G}wimmel/reisende-4.webp`, x: 20, y: 82, w: 12 },
    { image: `${G}wimmel/reisende-5.webp`, x: 60, y: 91, w: 12 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 44, y: 62.5, w: 20 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 72, y: 53.5, w: 20 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 88, y: 66.5, w: 22 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 20, y: 82.5, w: 20 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 60, y: 91.5, w: 18 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 34, y: 48, w: 16 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 92, y: 46, w: 16 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 8, y: 66, w: 18 }
  ]
}

/**
 * Etappe 2, "Schriftrollen" (neu, Antons Spielplan 5.11.2026): Jesus sitzt im Tempel mitten unter den Lehrern (Lk 2,46). Eine Schriftrolle wird auf- und abgerollt (Finger, Knöpfe, Pfeiltasten),
 * bis das gesuchte Bild in der Mitte des Fensters steht; „Das ist es!“. Runde 1: sechs Bilder, drei gesucht; Runde 2: acht Bilder, vier gesucht, genauer. Bilder (Bildauftrag S40): `schriftrolle/rolle.webp`
 * (Fenster = das leere Pergament, gemessen von neue_spiele_bilder_taufe.py), acht Miniaturen aus einem Bogen. Hintergrund: der gemalte Vorhof des Tempels (S30).
 */
const SCHRIFT: ScrollGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  frame: `${G}schriftrolle/rolle.webp`,
  frameRatio: 0.7712,
  window: { x: 14.14, y: 12.45, w: 70.88, h: 77.03 },
  tiles: [
    { id: 'tempel', image: `${G}schriftrolle/tempel.webp`, label: 'der Tempel' },
    { id: 'lamm', image: `${G}schriftrolle/lamm.webp`, label: 'das Lamm' },
    { id: 'esel', image: `${G}schriftrolle/esel.webp`, label: 'der Esel' },
    { id: 'krug', image: `${G}schriftrolle/krug.webp`, label: 'der Krug' },
    { id: 'brot', image: `${G}schriftrolle/brot.webp`, label: 'der Brotkorb' },
    { id: 'tor', image: `${G}schriftrolle/tor.webp`, label: 'das Stadttor' },
    { id: 'palme', image: `${G}schriftrolle/palme.webp`, label: 'die Palme' },
    { id: 'lampe', image: `${G}schriftrolle/lampe.webp`, label: 'die Öllampe' }
  ],
  rounds: [
    { hint: 'Jesus sitzt im Tempel mitten unter den Lehrern. Roll die Schriftrolle, bis das gesuchte Bild in der Mitte steht.', tiles: ['lamm', 'tempel', 'esel', 'krug', 'brot', 'tor'], find: ['tempel', 'brot', 'lamm'], start: 3, tolerance: 0.35 },
    { hint: 'Jetzt ist die Rolle länger, und das Bild muss genau in der Mitte stehen.', tiles: ['krug', 'palme', 'tempel', 'lampe', 'esel', 'tor', 'lamm', 'brot'], find: ['lampe', 'lamm', 'palme', 'brot'], start: 0, tolerance: 0.22 }
  ]
}

/**
 * Etappe 5, "Sonne und Schatten" (neu, Antons Spielplan 5.11.2026): Jesus fastet in der Wüste (Mt 4,1-2). Die Sonne wandert von Osten nach Westen, die Schatten der Felsen und Sträucher wandern mit.
 * Das Kind tippt einen Schatten an, Jesus geht hin; zu lange in der Sonne ist ein Fehler. Ziel ist der Schatten des großen Felsens. Der Versucher ist nie im Bild (nur der Text erzählt von ihm).
 * Bilder (Bildauftrag S41): `schattenweg/wueste.webp` 1200 × 800, `jesus` (Referenz jesus30), sechs Dinge aus einem Bogen, `sonne`, `schatten` (gemalter weicher Schatten, freigestellt).
 */
const SCHATTEN: ShadowWalkGame = {
  background: `${G}schattenweg/wueste.webp`,
  walker: `${G}schattenweg/jesus.webp`,
  walkerW: 8,
  walkerRatio: 0.3583,
  sun: `${G}schattenweg/sonne.webp`,
  sunW: 11,
  shadow: `${G}schattenweg/schatten.webp`,
  things: [
    { id: 'fels', image: `${G}schattenweg/fels.webp`, label: 'der Felsbrocken', w: 12, ratio: 1.0851 },
    { id: 'stein', image: `${G}schattenweg/stein.webp`, label: 'der hohe Fels', w: 8, ratio: 0.4434 },
    { id: 'platte', image: `${G}schattenweg/platte.webp`, label: 'der flache Fels', w: 15, ratio: 2.1638 },
    { id: 'dorn', image: `${G}schattenweg/dorn.webp`, label: 'der Dornstrauch', w: 12, ratio: 1.152 },
    { id: 'tamariske', image: `${G}schattenweg/tamariske.webp`, label: 'der Tamariskenstrauch', w: 13, ratio: 1.209 },
    { id: 'gross', image: `${G}schattenweg/gross.webp`, label: 'der große Fels', w: 26, ratio: 1.8919 }
  ],
  rounds: [
    {
      hint: 'Die Sonne wandert über die Wüste. Führe Jesus von Schatten zu Schatten bis zum großen Felsen.',
      places: [
        { thing: 'fels', x: 12, y: 80, reach: 7, size: 6 },
        { thing: 'dorn', x: 34, y: 70, reach: 7, size: 5.5 },
        { thing: 'platte', x: 56, y: 84, reach: 6, size: 7 },
        { thing: 'gross', x: 82, y: 66, reach: 8, size: 11, goal: true }
      ],
      start: 0,
      seconds: 30,
      heat: 3,
      speed: 8
    },
    {
      hint: 'Der Weg ist länger und die Sonne brennt stärker. Bleib nicht zu lange in der Sonne.',
      places: [
        { thing: 'fels', x: 13, y: 88, reach: 7, size: 6 },
        { thing: 'tamariske', x: 28, y: 74, reach: 7, size: 6 },
        { thing: 'dorn', x: 46, y: 90, reach: 7, size: 5.5 },
        { thing: 'stein', x: 60, y: 72, reach: 10, size: 4.5 },
        { thing: 'tamariske', x: 42, y: 56, reach: 7, size: 6 },
        { thing: 'gross', x: 81, y: 82, reach: 8, size: 11, goal: true }
      ],
      start: 0,
      seconds: 22,
      heat: 2.4,
      speed: 8
    }
  ]
}

/**
 * Etappe 7, "Licht über Galiläa" (neu, Antons Spielplan 5.11.2026): „Das Volk, das in Finsternis saß, hat ein großes Licht gesehen“ (Mt 4,16). Die Sonne wird am Bogen hochgezogen; jedes Dorf am See
 * hat Licht, solange die Sonne auf seinem Stück des Bogens steht (`from` bis `to`). Licht über allen zugleich (festhalten oder dort loslassen) gewinnt die Runde; zu früh loslassen ist ein Fehler.
 * Bilder (Bildauftrag S42): `sonnenaufgang/see.webp` 1200 × 800, sechs Dörfer aus einem Bogen, `glanz` (gemalter Lichtschein, freigestellt), die Sonne aus S41, die Perle des Perlenwegs.
 */
const SONNE: SunGame = {
  background: `${G}sonnenaufgang/see.webp`,
  sun: `${G}sonnenaufgang/sonne.webp`,
  sunW: 13,
  glow: `${G}sonnenaufgang/glanz.webp`,
  bead: `${G}sonnenaufgang/perle.webp`,
  arc: { cx: 50, cy: 46, rx: 40, ry: 32 },
  hold: 1,
  rounds: [
    {
      hint: 'Über dem Land am See ist es noch dunkel. Zieh die Sonne am Bogen hoch, bis über allen Dörfern Licht ist.',
      villages: [
        { image: `${G}sonnenaufgang/dorf-1.webp`, name: 'Kapernaum', x: 20, y: 84, w: 15, from: 0.15, to: 0.62 },
        { image: `${G}sonnenaufgang/dorf-2.webp`, name: 'ein Dorf am See', x: 40, y: 92, w: 15, from: 0.3, to: 0.7 },
        { image: `${G}sonnenaufgang/dorf-3.webp`, name: 'ein Dorf am Hang', x: 62, y: 84, w: 15, from: 0.35, to: 0.85 },
        { image: `${G}sonnenaufgang/dorf-5.webp`, name: 'ein Fischerdorf', x: 82, y: 92, w: 15, from: 0.25, to: 0.75 }
      ],
      start: 0.04
    },
    {
      hint: 'Jetzt sind es mehr Dörfer. Such die Stelle am Bogen, an der überall Licht ist.',
      villages: [
        { image: `${G}sonnenaufgang/dorf-1.webp`, name: 'Kapernaum', x: 12, y: 82, w: 14, from: 0.1, to: 0.52 },
        { image: `${G}sonnenaufgang/dorf-2.webp`, name: 'ein Dorf am See', x: 29, y: 93, w: 14, from: 0.3, to: 0.7 },
        { image: `${G}sonnenaufgang/dorf-3.webp`, name: 'ein Dorf am Hang', x: 45, y: 85, w: 14, from: 0.4, to: 0.88 },
        { image: `${G}sonnenaufgang/dorf-4.webp`, name: 'ein größeres Dorf', x: 61, y: 94, w: 14, from: 0.22, to: 0.6 },
        { image: `${G}sonnenaufgang/dorf-5.webp`, name: 'ein Fischerdorf', x: 75, y: 82, w: 14, from: 0.43, to: 0.8 },
        { image: `${G}sonnenaufgang/dorf-6.webp`, name: 'ein Dorf mit Brunnen', x: 90, y: 93, w: 14, from: 0.35, to: 0.75 }
      ],
      start: 0.02
    }
  ]
}

export const taufe: Journey = {
  id: 'taufe',
  title: 'Der junge Jesus und die Taufe',
  subtitle: 'Vom Tempel in Jerusalem bis an den See',
  age: '8-10',
  downloadMb: 14, // gemessen 13,4 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: das Fischerboot (Konturzeichnung)
  gift: { title: 'Das Fischerboot', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus taufePath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/taufe/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1089, y: 0.7342, d: 0.0339 },
      { x: 0.1764, y: 0.6735, d: 0.0339 },
      { x: 0.2984, y: 0.6978, d: 0.0339 },
      { x: 0.4570, y: 0.7203, d: 0.0339 },
      { x: 0.5071, y: 0.5461, d: 0.0339 },
      { x: 0.5897, y: 0.6068, d: 0.0339 },
      { x: 0.7432, y: 0.6475, d: 0.0339 },
      { x: 0.8051, y: 0.6717, d: 0.0339 },
      { x: 0.8800, y: 0.6553, d: 0.0339 }
    ],
    exam: { x: 0.9677, y: 0.5765, d: 0.0339 },
    path: TAUFE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Jesus bleibt in Jerusalem',
      ref: 'Lukas 2,41–45',
      text: [
        'Jedes Jahr gehen Maria und Josef nach Jerusalem zum Passafest. Als Jesus zwölf Jahre alt ist, nehmen sie ihn mit. Eine große Reisegruppe zieht aus Nazareth hinauf, Verwandte und Bekannte sind dabei.',
        'Nach den Festtagen gehen alle wieder nach Hause. Aber der Junge Jesus bleibt in Jerusalem zurück, und seine Eltern merken es nicht. Sie meinen, er sei irgendwo in der Reisegruppe.',
        'Einen ganzen Tag lang wandern sie so weiter. Dann suchen sie ihn unter den Verwandten und Bekannten, aber sie finden ihn nicht. Da kehren sie um und gehen zurück nach Jerusalem, um ihn zu suchen.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Suche in der Reisegruppe: Finde fünf Verwandte und Bekannte.', count: 5, find: WIMMEL },
      questions: [
        { q: 'Wie alt ist Jesus, als er mit nach Jerusalem geht?', options: ['zwölf Jahre', 'sieben Jahre', 'dreißig Jahre'], answer: 0 },
        { q: 'Wohin gehen Maria und Josef jedes Jahr zum Passafest?', options: ['nach Jerusalem', 'nach Bethlehem', 'nach Jericho'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Im Haus seines Vaters',
      ref: 'Lukas 2,46–52',
      text: [
        'Nach drei Tagen finden sie Jesus im Tempel. Er sitzt mitten unter den Lehrern, hört ihnen zu und stellt ihnen Fragen. Alle, die ihn hören, wundern sich über sein Verstehen und seine Antworten.',
        'Maria und Josef staunen, als sie ihn sehen. „Mein Sohn, warum hast du uns das getan?“, sagt Maria. „Dein Vater und ich haben dich mit Schmerzen gesucht.“',
        '„Warum habt ihr mich gesucht?“, fragt Jesus. „Wisst ihr nicht, dass ich sein muss in dem, was meines Vaters ist?“ Sie verstehen das Wort nicht, das er zu ihnen sagt.',
        'Jesus geht mit ihnen hinab nach Nazareth und ist ihnen gehorsam. Maria behält alle diese Worte in ihrem Herzen. Jesus nimmt zu an Weisheit, Alter und Gnade bei Gott und den Menschen.'
      ],
      // Spiel: Schriftrollen (schriftrolle, neu)
      task: { kind: 'schriftrolle', hint: 'Roll die Schriftrolle auf und ab und finde die gesuchten Bilder.', scroll: SCHRIFT },
      questions: [
        { q: 'Wo finden Maria und Josef den Jungen Jesus?', options: ['im Tempel', 'auf dem Markt', 'am Stadttor'], answer: 0 },
        { q: 'Was tut Jesus unter den Lehrern?', options: ['Er hört ihnen zu und fragt sie.', 'Er schläft.', 'Er läuft davon.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Johannes ruft in der Wüste',
      ref: 'Matthäus 3,1–12',
      text: [
        'Viele Jahre später kommt Johannes der Täufer in die Wüste von Judäa. Er trägt ein Kleid aus Kamelhaar und einen ledernen Gürtel. Er isst Heuschrecken und wilden Honig.',
        'Johannes ruft den Menschen zu: „Kehrt um! Das Himmelreich ist nahe.“ Von ihm hat schon der Prophet Jesaja gesprochen: Eine Stimme ruft in der Wüste: „Bereitet dem Herrn den Weg und macht seine Steige richtig!“',
        'Die Menschen kommen zu ihm hinaus, aus Jerusalem, aus ganz Judäa und aus dem Land am Jordan. Sie bekennen ihre Sünden, und Johannes tauft sie im Jordan.',
        '„Ich taufe euch mit Wasser“, sagt er. „Aber nach mir kommt einer, der ist stärker als ich. Ich bin nicht gut genug, ihm die Schuhe zu tragen. Er wird euch mit dem Heiligen Geist taufen.“'
      ],
      // Spiel: Den Weg bereiten (bahn, neu)
      task: { kind: 'bahn', hint: 'Räume den Weg frei für den Herrn: Tippe auf Steine, Dornen und Äste.', road: WEG },
      questions: [
        { q: 'Was trägt Johannes der Täufer?', options: ['ein Kleid aus Kamelhaar', 'einen Königsmantel', 'ein Schaffell'], answer: 0 },
        { q: 'Was isst Johannes?', options: ['Heuschrecken und wilden Honig', 'Brot und Fisch', 'Datteln und Milch'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Jesus wird getauft',
      ref: 'Matthäus 3,13–17',
      text: [
        'Eines Tages kommt Jesus aus Galiläa an den Jordan zu Johannes. Er will sich von ihm taufen lassen. Johannes wehrt ab: „Ich müsste von dir getauft werden, und du kommst zu mir?“',
        'Jesus antwortet: „Lass es jetzt geschehen. So erfüllen wir, was vor Gott recht ist.“ Da lässt Johannes es zu und tauft Jesus im Jordan.',
        'Als Jesus aus dem Wasser steigt, tut sich der Himmel über ihm auf. Er sieht den Geist Gottes wie eine Taube herabkommen und auf sich kommen.',
        'Und eine Stimme aus dem Himmel sagt: „Dies ist mein lieber Sohn. An ihm habe ich Wohlgefallen.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Wer tauft Jesus?', options: ['Johannes', 'Petrus', 'Josef'], answer: 0 },
        { q: 'Wo wird Jesus getauft?', options: ['im Jordan', 'im See Genezareth', 'im Meer'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Vierzig Tage in der Wüste',
      ref: 'Matthäus 4,1–4',
      text: [
        'Danach führt der Geist Jesus in die Wüste. Dort soll er versucht werden. Die Wüste ist trocken, und überall liegen Steine. Vierzig Tage und vierzig Nächte fastet Jesus, er isst nichts. Danach hat er großen Hunger.',
        'Da kommt der Versucher zu ihm. „Wenn du Gottes Sohn bist“, sagt er, „dann sprich, dass diese Steine zu Brot werden.“',
        'Jesus macht aus den Steinen kein Brot. Er antwortet mit einem Wort aus der Schrift, das Gott gesagt hat: „Es steht geschrieben: Der Mensch lebt nicht vom Brot allein, sondern von jedem Wort, das aus dem Mund Gottes kommt.“'
      ],
      // Spiel: Sonne und Schatten (schattenweg, neu)
      task: { kind: 'schattenweg', hint: 'Tippe auf einen Schatten. Jesus geht hin und bleibt im Schatten.', shadowWalk: SCHATTEN },
      questions: [
        { q: 'Wie lange fastet Jesus in der Wüste?', options: ['vierzig Tage und vierzig Nächte', 'sieben Tage', 'drei Tage'], answer: 0 },
        { q: 'Was sollen die Steine nach den Worten des Versuchers werden?', options: ['Brot', 'Gold', 'Wasser'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Auf dem Tempel und auf dem Berg',
      ref: 'Matthäus 4,5–11',
      text: [
        'Dann führt der Versucher Jesus in die Heilige Stadt und stellt ihn auf die Zinne des Tempels. „Wenn du Gottes Sohn bist, dann spring hinab“, sagt er. „Es steht ja geschrieben: Seine Engel werden dich auf den Händen tragen.“ Jesus antwortet: „Es steht auch geschrieben: Du sollst Gott, deinen Herrn, nicht auf die Probe stellen.“',
        'Zuletzt führt der Versucher ihn auf einen sehr hohen Berg. Er zeigt ihm alle Reiche der Welt in ihrer Pracht. „Das alles will ich dir geben“, sagt er, „wenn du dich niederwirfst und mich anbetest.“',
        'Da sagt Jesus: „Weg mit dir, Satan! Es steht geschrieben: Du sollst Gott, deinen Herrn, anbeten und ihm allein dienen.“',
        'Da lässt der Versucher von ihm ab. Und Engel kommen zu Jesus und dienen ihm.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Worauf stellt der Versucher Jesus in der Heiligen Stadt?', options: ['auf die Zinne des Tempels', 'auf ein Hausdach', 'auf die Stadtmauer'], answer: 0 },
        { q: 'Was zeigt der Versucher Jesus auf dem sehr hohen Berg?', options: ['alle Reiche der Welt', 'ein großes Meer', 'seine Heimatstadt'], answer: 0 },
        { q: 'Wem soll man allein dienen, sagt Jesus?', options: ['Gott, dem Herrn', 'dem Versucher', 'den Königen'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Jesus zieht nach Kapernaum',
      ref: 'Matthäus 4,12–17',
      text: [
        'Jesus hört, dass man Johannes gefangen genommen hat. Da geht er nach Galiläa. Er verlässt Nazareth und wohnt in Kapernaum, einer Stadt am See, im Land Sebulon und Naphthali. Dort am See lebt er nun.',
        'So geschieht, was der Prophet Jesaja über dieses Land gesagt hat, das am Weg zum Meer liegt: „Das Volk, das in der Finsternis saß, hat ein großes Licht gesehen. Über denen, die im Dunkeln wohnen, ist ein Licht aufgegangen.“',
        'Von da an fängt Jesus an zu predigen. Er sagt den Menschen: „Kehrt um! Das Himmelreich ist nahe.“'
      ],
      // Spiel: Licht über Galiläa (sonnenaufgang, neu)
      task: { kind: 'sonnenaufgang', hint: 'Zieh die Sonne am Bogen hoch, bis über allen Dörfern am See Licht ist.', sunrise: SONNE },
      questions: [
        { q: 'Wo wohnt Jesus jetzt?', options: ['in Kapernaum', 'in Nazareth', 'in Jerusalem'], answer: 0 },
        { q: 'Was hat das Volk gesehen, das in der Finsternis saß?', options: ['ein großes Licht', 'einen großen Stern', 'ein großes Feuer'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Jesus ruft vier Fischer',
      ref: 'Matthäus 4,18–22',
      text: [
        'Jesus geht am See von Galiläa entlang und sieht zwei Brüder: Simon, der Petrus genannt wird, und Andreas. Sie sind Fischer und werfen ihre Netze in den See.',
        '„Folgt mir nach!“, sagt Jesus. „Ich will euch zu Menschenfischern machen.“ Sofort lassen sie ihre Netze liegen und gehen mit ihm.',
        'Ein Stück weiter sieht Jesus zwei andere Brüder: Jakobus, den Sohn des Zebedäus, und seinen Bruder Johannes. Sie sitzen im Boot bei ihrem Vater Zebedäus und flicken ihre Netze. Jesus ruft sie.',
        'Sofort verlassen sie das Boot und ihren Vater und folgen Jesus nach.'
      ],
      // Spiel: Das Netz auswerfen (netz, neu)
      task: { kind: 'netz', hint: 'Wirf das Netz aus: Tippe dorthin, wo die Fische schwimmen.', net: NETZ },
      questions: [
        { q: 'Was sind Simon und Andreas von Beruf?', options: ['Fischer', 'Hirten', 'Zöllner'], answer: 0 },
        { q: 'Wozu will Jesus sie machen?', options: ['zu Menschenfischern', 'zu Hirten', 'zu Bauern'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Jesus lehrt und heilt',
      ref: 'Matthäus 4,23–25',
      text: [
        'Jesus geht durch ganz Galiläa. Er lehrt in den Synagogen, das sind die Häuser, in denen die Menschen zusammenkommen, um Gottes Wort zu hören. Er erzählt vom Reich Gottes. Er macht die Menschen gesund von allen Krankheiten und Leiden.',
        'Die Nachricht von ihm kommt bis nach Syrien. Die Leute bringen alle Kranken zu ihm, auch die, die große Schmerzen haben. Jesus macht sie alle gesund.',
        'Eine große Menge von Menschen folgt ihm nach. Sie kommt aus Galiläa, aus den Zehn Städten, aus Jerusalem, aus Judäa und von jenseits des Jordans her.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo lehrt Jesus in Galiläa?', options: ['in den Synagogen', 'auf dem Meer', 'nur im Tempel'], answer: 0 },
        { q: 'Was tut Jesus mit den Kranken, die man zu ihm bringt?', options: ['Er macht sie gesund.', 'Er schickt sie weg.', 'Er gibt ihnen Geld.'], answer: 0 },
        { q: 'Woher kommen die Menschen, die ihm folgen?', options: ['aus Galiläa, Jerusalem und Judäa', 'nur aus Nazareth', 'nur aus Rom'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wo finden Maria und Josef den Jungen Jesus?', options: ['im Tempel', 'auf dem Markt', 'am Stadttor'], answer: 0 },
    { q: 'Was isst Johannes der Täufer?', options: ['Heuschrecken und wilden Honig', 'Brot und Fisch', 'Datteln und Milch'], answer: 0 },
    { q: 'Wie kommt der Geist Gottes auf Jesus herab?', options: ['wie eine Taube', 'wie ein Adler', 'wie ein Sturm'], answer: 0 },
    { q: 'Wie lange fastet Jesus in der Wüste?', options: ['vierzig Tage und vierzig Nächte', 'sieben Tage', 'drei Tage'], answer: 0 },
    { q: 'Wem soll man allein dienen, sagt Jesus?', options: ['Gott, dem Herrn', 'dem Versucher', 'den Königen'], answer: 0 },
    { q: 'Wozu will Jesus Simon und Andreas machen?', options: ['zu Menschenfischern', 'zu Hirten', 'zu Bauern'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of taufe.stages) {
  const file = `audio/abenteuer/taufe/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the road to Jerusalem, at the Jordan, at the lake); they follow one another at random
taufe.music = [
  'audio/abenteuer/taufe/musik-weg-v2.mp3',
  'audio/abenteuer/taufe/musik-jordan-v2.mp3',
  'audio/abenteuer/taufe/musik-see-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(taufe, taufeEn)
