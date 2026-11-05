/**
 * Abenteuer "Salomo" (1. Könige 3–10) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Der weise König und das Haus Gottes". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 28.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Salomo/ENTWURF_Salomo.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Nicht oder gemildert erzählt: Salomos Heirat, die Höhen, die Fronarbeiter, die Namen der Amtleute, Speisung und Pferde, die Strafworte Gottes (9,6–9), die zwanzig Städte für Hiram und das ganze Kapitel 11 (Abfall; liegt außerhalb dieses Abenteuers).
 * Das Urteil (Etappe 3) wird erzählt, nicht gespielt; das Schwert wird nur gebracht und nie gegen das Kind gehoben, die "zwei Huren" heißen "zwei Frauen". Die Lade wird immer mit zwei goldenen Cherubim gezeigt.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Spielplan 5.11.2026: höchstens zwei bekannte, nie hintereinander): 1 Weggabelung (bekannt), 2 Wunschkarten (neu), 3 nur Quiz, 4 Ernten (bekannt), 5 Flöße (neu), 6 Steine leise legen (neu),
 * 7 Schnitzen (neu), 8 Granatäpfel (neu), 9 Die Stufen hinauf (neu), 10 nur Quiz, 11 Die Schatzkammer (neu), 12 Den Thron bauen (neu). Die Typen der sechs Spiele vom 5.11.2026 stehen in `@/utils/salomoNeu`.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/salomo/, images/abenteuer/spiele/salomo/<spiel>/, audio/abenteuer/salomo/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { HarvestGame, Journey, QuietGame, ThroneGame, WayGame } from '@/types/adventure'
import type { CarveGame, PomGame, RaftGame, StairsGame, TreasuryGame, WishGame } from '@/utils/salomoNeu'
import { josef } from './josef'
import { SALOMO_PATH } from './salomoPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { salomoEn } from './en/salomo.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/salomo/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/salomo/'

const G = 'images/abenteuer/spiele/salomo/'
// gemeinsame Bilder der alten Spiele (Früchte und Dornen aus Josef)
const GS = 'images/abenteuer/spiele/'

/**
 * Etappe 1, "Weggabelung" (alte Mechanik 1 von 8): der Zug Salomos (Salomo auf dem Maultier, ein Diener, Ochsen und Schafe) zieht nach Gibeon; an fünf Gabelungen im steinigen Bergland tippt das Kind den Weg,
 * auf dem die frischen Spuren der Tiere liegen und am Ende ein dünner Rauchfaden vom Opferhügel aufsteigt (ohne Schilder). Die letzte Gabelung hat drei Wege. Bilder (Bildauftrag S39): `weg/weg-1..5.webp` 1000 × 750, `weg/zug.webp`.
 */
const WEG: WayGame = {
  walker: `${G}weg/zug.webp`,
  texts: {
    hint: 'Weggabelung {n} von {total}: Tippe auf den Weg, auf dem die Spuren des Zuges liegen.',
    right: 'Richtig! Der Zug zieht weiter nach Gibeon.',
    wrong: 'Hier sind keine Spuren. Der Zug kehrt um.',
    done: 'Der Zug hat den Weg nach Gibeon gefunden!'
  },
  scenes: [
    { image: `${G}weg/weg-1.webp`, goal: 'right' },
    { image: `${G}weg/weg-2.webp`, goal: 'left' },
    { image: `${G}weg/weg-3.webp`, goal: 'left' },
    { image: `${G}weg/weg-4.webp`, goal: 'right' },
    // the last fork has three ways
    { image: `${G}weg/weg-5.webp`, goal: 'middle', paths: 3 }
  ]
}

/**
 * Etappe 4, "Ernten" (alte Mechanik 3 von 8): ein sonniger Garten mit Feigenbaum und Weinstock; reife Früchte (Trauben, Feigen, Granatäpfel, Datteln) kommen in den Korb, Dornen und Steine nicht.
 * Früchte, Dornen und Korb sind die gemeinsamen aus Josef (`images/abenteuer/spiele/ernten/`), der Garten ist neu (Bildauftrag S32).
 */
const ERNTEN: HarvestGame = {
  field: `${G}ernten/feld.webp`,
  basket: `${GS}ernten/korb.webp`,
  fruits: ['traube', 'feige', 'granat', 'dattel'].map((n) => `${GS}ernten/${n}.webp`),
  weeds: ['distel', 'dornbusch', 'stein', 'dornenzweig'].map((n) => `${GS}ernten/${n}.webp`),
  count: 10
}


/**
 * Etappe 6, "Steine leise legen": der Bauplatz des Hauses Gottes (gemaltes Bild) mit einem Fundament, in dem drei Lücken offen sind; die Steine warten links (neu). Das Kind zieht einen Stein mit dem Finger zu einer Lücke und lässt los:
 * er sinkt hinein. Die Steine kommen fertig behauen zur Baustelle, darum darf nichts poltern: wird ein Stein zu schnell gezogen, klackt er (eine Wolke mit Kreuz, der Stein springt zurück, ein Fehler). Ein Ohr-Messer zeigt, wie laut
 * der Stein gerade ist. Runde 1 ein Stein, Runde 2 zwei, Runde 3 drei, jede Runde etwas strenger (`max` in Prozent der Bildbreite je Sekunde). Loslassen neben der Lücke ist kein Fehler.
 * Bilder (Bildauftrag S37): `leise/bauplatz.webp` 1200 × 900, `stein-1..3.webp` (aus EINEM Bogen geschnitten, Magenta-Schnitt).
 */
const LEISE: QuietGame = {
  background: `${G}leise/bauplatz.webp`,
  stones: [1, 2, 3].map((n) => `${G}leise/stein-${n}.webp`),
  stoneW: 15.5,
  rounds: [
    {
      hint: 'Ziehe den Stein ganz langsam in die Lücke. Dann bleibt es leise.',
      gaps: [{ x: 51, y: 51, w: 15 }],
      starts: [{ x: 50, y: 70 }],
      max: 70
    },
    {
      hint: 'Jetzt zwei Steine. Auch sie müssen leise liegen.',
      gaps: [{ x: 31, y: 51, w: 15 }, { x: 70, y: 51, w: 15 }],
      starts: [{ x: 30, y: 70 }, { x: 70, y: 70 }],
      max: 52
    },
    {
      hint: 'Drei Steine in einer Reihe. Noch ruhiger.',
      gaps: [{ x: 31, y: 51, w: 15 }, { x: 51, y: 51, w: 15 }, { x: 70, y: 51, w: 15 }],
      starts: [{ x: 22, y: 72 }, { x: 50, y: 72 }, { x: 78, y: 72 }],
      max: 40
    }
  ]
}

/**
 * Etappe 12, "Den Thron bauen": der Thronsaal (gemaltes Bild) mit dem Elfenbeinthron und sechs leeren Stufen (neu). Unter dem Bild warten goldene Löwen, jeder sieht nach links oder nach rechts. Das Kind zieht einen Löwen auf einen Platz
 * (oder tippt ihn an und dann den Platz): auf jeder Stufe steht links und rechts je ein Löwe, sie sehen zur Mitte; ein Löwe, der nach rechts sieht, gehört also nach links, und umgekehrt. Falsche Seite oder besetzter Platz ist ein Fehler
 * (Kreuz, der Löwe springt zurück), Loslassen neben den Plätzen nicht. Runde 1 die drei unteren Stufen, Runde 2 die drei oberen, Runde 3 die zwei Löwen an den Armlehnen (zusammen zwölf und zwei).
 * Bilder (Bildauftrag S38): `thron/saal.webp` 1200 × 900, `loewe.webp` (ein goldener Löwe, blickt nach links; der Code spiegelt ihn).
 */
const THRON: ThroneGame = {
  background: `${G}thron/saal.webp`,
  lion: `${G}thron/loewe.webp`,
  lionW: 10,
  rounds: [
    { hint: 'Setze die Löwen auf die unteren Stufen: links einen, rechts einen. Sie sehen zur Mitte.', slots: [{ x: 14, y: 71, w: 10, side: 'left' }, { x: 86, y: 71, w: 10, side: 'right' }, { x: 20, y: 64, w: 10, side: 'left' }, { x: 80, y: 64, w: 10, side: 'right' }, { x: 26, y: 57, w: 10, side: 'left' }, { x: 74, y: 57, w: 10, side: 'right' }], lions: ['right', 'left', 'left', 'right', 'right', 'left'] },
    { hint: 'Jetzt die oberen Stufen. Wer nach rechts sieht, gehört nach links.', slots: [{ x: 29, y: 52, w: 10, side: 'left' }, { x: 71, y: 52, w: 10, side: 'right' }, { x: 31, y: 47, w: 10, side: 'left' }, { x: 69, y: 47, w: 10, side: 'right' }, { x: 27, y: 43, w: 10, side: 'left' }, { x: 73, y: 43, w: 10, side: 'right' }], lions: ['left', 'right', 'right', 'left', 'left', 'right'] },
    { hint: 'Zuletzt zwei Löwen an die Armlehnen des Throns.', slots: [{ x: 38, y: 29, w: 8, side: 'arm-left' }, { x: 62, y: 29, w: 8, side: 'arm-right' }], lions: ['right', 'left'] }
  ]
}

/**
 * Etappe 2, "Die Wunschkarten" (neu, 5.11.2026; 1. Kön 3,5–14): In der Nacht bei Gibeon schweben Bildkarten über den Himmel: Reichtum, langes Leben, Sieg über die Feinde und ein gehorsames Herz.
 * Das Kind fängt nur das Herz (darum bittet Salomo); eine andere Karte ist ein Fehler. Runde 1 drei Herzen, Runde 2 schneller und vier Herzen. Bilder (Bildauftrag S40): `wunschkarten/nacht.webp`, `karte-*.webp`.
 */
const WUNSCHKARTEN: WishGame = {
  background: `${G}wunschkarten/nacht.webp`,
  cards: {
    heart: { image: `${G}wunschkarten/karte-herz.webp`, label: 'Ein gehorsames Herz', w: 15 },
    riches: { image: `${G}wunschkarten/karte-reichtum.webp`, label: 'Reichtum', w: 15 },
    life: { image: `${G}wunschkarten/karte-leben.webp`, label: 'Ein langes Leben', w: 15 },
    victory: { image: `${G}wunschkarten/karte-sieg.webp`, label: 'Sieg über die Feinde', w: 15 }
  },
  cardW: 15,
  rounds: [
    { hint: 'Die Karten schweben vorbei. Fang dreimal das gehorsame Herz.', speed: 8, period: 12, need: 3, cards: [{ kind: 'heart', lane: 50, at: 0 }, { kind: 'riches', lane: 17, at: 3 }, { kind: 'life', lane: 83, at: 6 }, { kind: 'victory', lane: 50, at: 9 }, { kind: 'heart', lane: 83, at: 10 }] },
    { hint: 'Jetzt schneller. Fang viermal das Herz.', speed: 12, period: 10, need: 4, cards: [{ kind: 'riches', lane: 50, at: 0 }, { kind: 'heart', lane: 17, at: 1.5 }, { kind: 'victory', lane: 83, at: 2.5 }, { kind: 'life', lane: 50, at: 3.2 }, { kind: 'life', lane: 17, at: 4.5 }, { kind: 'riches', lane: 83, at: 6 }, { kind: 'heart', lane: 50, at: 6.5 }, { kind: 'victory', lane: 17, at: 8 }] }
  ]
}

/**
 * Etappe 5, "Die Flöße" (neu, 5.11.2026; 1. Kön 5,9): Das Meer von oben. Das Kind tippt die Zedernstämme am Strand von Tyrus an, sie legen sich zu einem Floß zusammen, die Seile werden gebunden.
 * Dann fährt das Floß nach rechts; ein Tipp aufs Meer gibt die Richtung. Riffe und die Felsen der Küste sind Fehler, der helle Strand ist der Landeplatz. Runde 2: vier Stämme, mehr Riffe, das Meer treibt das Floß ab.
 * Bilder (Bildauftrag S41): `floesse/meer.webp`, `stamm.webp`, `seil.webp`, `riff-1.webp`, `riff-2.webp`.
 */
const FLOESSE: RaftGame = {
  background: `${G}floesse/meer.webp`,
  trunk: { image: `${G}floesse/stamm.webp`, label: 'Zedernstamm', w: 13, thick: 2.17 },
  rope: { image: `${G}floesse/seil.webp`, label: 'Seil', w: 2 },
  reefs: [
    { image: `${G}floesse/riff-1.webp`, label: 'Riff', w: 10 },
    { image: `${G}floesse/riff-2.webp`, label: 'Riff', w: 10 }
  ],
  coast: 88,
  rounds: [
    {
      hint: 'Tippe die drei Stämme an. Dann steuere das Floß zum hellen Strand.',
      loose: [{ x: 20, y: 22 }, { x: 22, y: 50 }, { x: 19, y: 78 }],
      start: { x: 20, y: 50 },
      speed: 7,
      turn: 75,
      landing: { top: 32, bottom: 58 },
      reefs: [{ x: 42, y: 28, r: 4.5, kind: 0 }, { x: 52, y: 72, r: 4.5, kind: 1 }, { x: 64, y: 38, r: 4.5, kind: 0 }],
      route: [{ x: 34, y: 52 }, { x: 52, y: 48 }, { x: 66, y: 56 }, { x: 80, y: 46 }]
    },
    {
      hint: 'Jetzt vier Stämme und mehr Riffe. Das Meer treibt das Floß nach unten.',
      loose: [{ x: 19, y: 14 }, { x: 22, y: 36 }, { x: 19, y: 58 }, { x: 22, y: 80 }],
      start: { x: 20, y: 50 },
      speed: 8,
      turn: 70, drift: { x: 0, y: 2.2 },
      landing: { top: 34, bottom: 56 },
      reefs: [{ x: 38, y: 28, r: 4.5, kind: 0 }, { x: 40, y: 74, r: 4.5, kind: 1 }, { x: 56, y: 44, r: 4.5, kind: 0 }, { x: 70, y: 72, r: 4.5, kind: 1 }, { x: 72, y: 22, r: 4.5, kind: 0 }],
      route: [{ x: 32, y: 50 }, { x: 46, y: 54 }, { x: 58, y: 62 }, { x: 68, y: 52 }, { x: 78, y: 46 }, { x: 84, y: 44 }]
    }
  ]
}

/**
 * Etappe 7, "Schnitzen" (neu, 5.11.2026; 1. Kön 6,18.29): Ein Brett aus Zedernholz zeigt eine Blume, einen Knoten, eine Palme oder eine Ranke als goldene Linie. Das Kind fährt die Linie mit dem Finger nach,
 * das Schnitzeisen folgt; weicht der Finger zu weit ab, rutscht das Eisen ab (Fehler). Die Cherubim werden nicht gezeigt (Anton: nur als geschnitztes Muster, hier gar nicht).
 * Die Linie (`rows`, 40 x 40 Zellen) hat neue_spiele_salomo.py aus den gemalten Brettern gelesen (Goldfarbe). Bilder (Bildauftrag S42): `schnitzen/*.webp`, `eisen.webp`, `staub.webp`.
 */
const SCHNITZEN: CarveGame = {
  patterns: [
    {
      image: `${G}schnitzen/blume.webp`,
      label: 'Blume',
      rows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '...................###..................',
        '.................##..##.................',
        '................#......#................',
        '................#......#................',
        '...............##......##...............',
        '............##.##......##.##............',
        '..........#######......#######..........',
        '.........##.....##....##.....##.........',
        '.........#.......######.......#.........',
        '.........#.......##..##.......##........',
        '.........#.......#....#.......#.........',
        '.........#......##....##......#.........',
        '.........##.....##....##.....##.........',
        '..........########....########..........',
        '.............##...####...##.............',
        '............#......##......#............',
        '...........##......##......#............',
        '...........#.......##......##...........',
        '...........#.......##......##...........',
        '............#.....####.....#............',
        '............##...######...#.............',
        '..............###..##..###..............',
        '...................##...................',
        '............#####..##..#####............',
        '............##...######...##............',
        '.............#....####....#.............',
        '..............#....##....#..............',
        '...............##########...............',
        '...................###..................',
        '...................##...................',
        '...................##...................',
        '...................#....................',
        '........................................',
        '........................................',
        '........................................',
        '........................................'
      ]
    },
    {
      image: `${G}schnitzen/knoten.webp`,
      label: 'Knoten',
      rows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '................########................',
        '...............##......##...............',
        '..............##........##..............',
        '.............##..........##.............',
        '.............#............#.............',
        '............##............#.............',
        '............##............#.............',
        '............##............#.............',
        '............##............#.............',
        '.............#............#.............',
        '.............#...........##.............',
        '.............##..........#..............',
        '..............##........#...............',
        '..........#######......######...........',
        '........####..####....####..####........',
        '.......##........##.###........##.......',
        '......##..........###...........##......',
        '.....##............##............#......',
        '.....#............####............#.....',
        '.....#............#..#............#.....',
        '....##...........##..#............#.....',
        '....##...........#...##...........#.....',
        '.....#...........#....#...........#.....',
        '.....#..........#.....##.........##.....',
        '.....##........##......#.........#......',
        '......##......##........#.......##......',
        '.......###...##..........##...###.......',
        '.........####.............#####.........',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................'
      ]
    },
    {
      image: `${G}schnitzen/palme.webp`,
      label: 'Palme',
      rows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '.....................####...............',
        '....................##.#................',
        '...................#..#.................',
        '.............#....##.#..................',
        '..........#######.#..#...###............',
        '.........###....###.#####..###..........',
        '........#######..##.###....####.........',
        '..............##..#.##..########........',
        '..............####.##.###...............',
        '............##...##########.............',
        '...........#....#######...##............',
        '..........#..###...##.###..##...........',
        '..........#.##.....##....##.#...........',
        '.........###.......##.....###...........',
        '.........##........##......##...........',
        '...................##.......#...........',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '...................##...................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................'
      ]
    },
    {
      image: `${G}schnitzen/ranke.webp`,
      label: 'Ranke mit Blumen',
      rows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........##..............................',
        '.......####.............................',
        '.....###..#.............................',
        '.....#.#..###...........................',
        '....##......#...........................',
        '.....##...###...........................',
        '......#.#..#............................',
        '.....##.##.#............................',
        '......######.......#....................',
        '.......##.........####..................',
        '......########...##..#.............####.',
        '....##.......###.##.##..........###.....',
        '.###...........######..........##.......',
        '..................###........##.........',
        '....................###########.........',
        '........................##...#..........',
        '..........................#######.......',
        '..........................#..#..#.......',
        '..........................##...##.......',
        '.........................#......#.......',
        '.........................#..#...##......',
        '.........................###..###.......',
        '...........................####.........',
        '............................##..........',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................'
      ]
    }
  ],
  tool: { image: `${G}schnitzen/eisen.webp`, label: 'Schnitzeisen', w: 16 },
  dust: `${G}schnitzen/staub.webp`,
  brush: 1.6,
  rounds: [
    { hint: 'Fahre die Blume und den Knoten mit dem Finger nach.', patterns: [0, 1], need: 0.8, slip: 3.5 },
    { hint: 'Jetzt die Palme und die Ranke. Bleib genau auf der goldenen Linie.', patterns: [2, 3], need: 0.85, slip: 2.6 }
  ]
}

/**
 * Etappe 8, "Granatäpfel" (neu, 5.11.2026; 1. Kön 7,17–20): Am Knauf der Erzsäule hängen Ketten. Die ersten Dinge zeigen ein Muster (Granatapfel, Lilie, Kettenglied), die übrigen Haken sind leer.
 * Ein Tipp auf einen Haken hängt ein Ding daran, jeder weitere Tipp wechselt es; "Prüfen" schaut die Kette an (eine Prüfung mit Fehlern ist ein Fehler). Runde 2 zwei Ketten mit drei Dingen.
 * Bilder (Bildauftrag S43): `granatapfel/saeule.webp`, `granat.webp`, `lilie.webp`, `kette.webp`, `haken.webp`.
 */
const GRANATAPFEL: PomGame = {
  background: `${G}granatapfel/saeule.webp`,
  items: {
    granat: { image: `${G}granatapfel/granat.webp`, label: 'Granatapfel', w: 13 },
    lilie: { image: `${G}granatapfel/lilie.webp`, label: 'Lilie', w: 13 },
    kette: { image: `${G}granatapfel/kette.webp`, label: 'Kettenglied', w: 13 }
  },
  hook: { image: `${G}granatapfel/haken.webp`, label: 'Haken', w: 5 },
  x0: 11,
  x1: 89,
  slotW: 13,
  rounds: [
    { hint: 'Schau dir das Muster an und hänge die Kette fertig.', rows: [{ y: 42, motif: ['granat', 'lilie'], length: 6, given: [0, 1, 2] }] },
    { hint: 'Zwei Ketten mit drei Dingen. Setze jedes Muster fort.', rows: [{ y: 20, motif: ['granat', 'granat', 'lilie'], length: 6, given: [0, 1, 2] }, { y: 58, motif: ['lilie', 'kette', 'granat'], length: 6, given: [0, 1, 2] }] }
  ]
}

/**
 * Etappe 9, "Die Stufen hinauf" (neu, 5.11.2026; 1. Kön 8,3–6): Die Priester tragen die Lade die breite Treppe zum Haus Gottes hinauf. Das Kind tippt links und rechts im Gleichschritt;
 * der falsche Fuß und ein zu schneller Schritt sind Fehler, in Runde 2 auch ein zu langsamer. Bilder (Bildauftrag S44): `stufen/treppe.webp` (Hochformat 3:4), `traeger.webp` (von hinten).
 */
const STUFEN: StairsGame = {
  background: `${G}stufen/treppe.webp`,
  ratio: 0.75,
  group: { image: `${G}stufen/traeger.webp`, label: 'Vier Priester tragen die Lade des Bundes', w: 50 },
  bottom: 99,
  top: 44,
  topScale: 0.45,
  rounds: [
    { hint: 'Tippe links, rechts, links, rechts. Nicht zu schnell, die Lade ist schwer!', steps: 10, min: 0.35, max: 2.5 },
    { hint: 'Jetzt mehr Stufen. Bleib im Gleichschritt: nicht zu schnell und nicht zu langsam.', steps: 14, min: 0.4, max: 1.3, strict: true }
  ]
}

/**
 * Etappe 11, "Die Schatzkammer" (neu, 5.11.2026; 1. Kön 10,2.10): Ein Kamel der Königin steht in der Vorratskammer, auf seinem Tragbrett liegen Gewürze, Gold und Edelsteine. Das Kind zieht jedes Geschenk
 * in das Fach mit der passenden Form (oder tippt erst das Geschenk, dann das Fach); eine falsche Form ist ein Fehler. Runde 2: zwei Kamele, sechs Fächer.
 * Bilder (Bildauftrag S45): `schatzkammer/kammer.webp`, `kamel.webp`, `fach-*.webp`; die Geschenke sind die früheren Gaben der Etappe (Bildauftrag S36), umbenannt.
 */
const SCHATZKAMMER: TreasuryGame = {
  background: `${G}schatzkammer/kammer.webp`,
  camel: { image: `${G}schatzkammer/kamel.webp`, label: 'Ein Kamel der Königin', w: 38, x: 79, y: 98 },
  board: [{ x: 79, y: 50.5 }, { x: 89, y: 50.5 }, { x: 84, y: 37 }],
  items: {
    sack: { image: `${G}schatzkammer/sack.webp`, label: 'Gewürze', w: 12 },
    barren: { image: `${G}schatzkammer/barren.webp`, label: 'Gold', w: 12 },
    stein: { image: `${G}schatzkammer/stein.webp`, label: 'Edelstein', w: 12 }
  },
  niches: {
    sack: { image: `${G}schatzkammer/fach-sack.webp`, label: 'Fach für Gewürze', w: 14.5 },
    barren: { image: `${G}schatzkammer/fach-barren.webp`, label: 'Fach für Gold', w: 14.5 },
    stein: { image: `${G}schatzkammer/fach-stein.webp`, label: 'Fach für Edelsteine', w: 14.5 }
  },
  rounds: [
    { hint: 'Ein Kamel bringt drei Geschenke. Lege jedes in das Fach mit seiner Form.', slots: [{ shape: 'sack', x: 21, y: 32 }, { shape: 'barren', x: 36, y: 32 }, { shape: 'stein', x: 51, y: 32 }], camels: [['sack', 'barren', 'stein']] },
    { hint: 'Jetzt kommen zwei Kamele mit sechs Geschenken.', slots: [{ shape: 'barren', x: 21, y: 20 }, { shape: 'stein', x: 36, y: 20 }, { shape: 'sack', x: 51, y: 20 }, { shape: 'sack', x: 21, y: 46 }, { shape: 'barren', x: 36, y: 46 }, { shape: 'stein', x: 51, y: 46 }], camels: [['stein', 'sack', 'barren'], ['barren', 'stein', 'sack']] }
  ]
}

export const salomo: Journey = {
  id: 'salomo',
  title: 'Salomo',
  subtitle: 'Der weise König und das Haus Gottes',
  age: '8-10',
  downloadMb: 20, // gemessen 20 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: Salomos Thron mit den zwölf Löwen auf den sechs Stufen (Konturzeichnung)
  gift: { title: 'Salomos Thron', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 12942 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus salomoPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/salomo/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 12942 / 1648,
    widthPx: 12942,
    stages: [
      { x: 0.0695, y: 0.5036, d: 0.0260 },
      { x: 0.1159, y: 0.6250, d: 0.0260 },
      { x: 0.2086, y: 0.6311, d: 0.0260 },
      { x: 0.2607, y: 0.5097, d: 0.0260 },
      { x: 0.4121, y: 0.6432, d: 0.0260 },
      { x: 0.4755, y: 0.5704, d: 0.0260 },
      { x: 0.5214, y: 0.6432, d: 0.0260 },
      { x: 0.6049, y: 0.4854, d: 0.0260 },
      { x: 0.7099, y: 0.6481, d: 0.0260 },
      { x: 0.7682, y: 0.6481, d: 0.0260 },
      { x: 0.8207, y: 0.6481, d: 0.0260 },
      { x: 0.9241, y: 0.6311, d: 0.0260 }
    ],
    exam: { x: 0.9767, y: 0.6068, d: 0.0260 },
    path: SALOMO_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Auf dem Weg nach Gibeon',
      ref: '1. Könige 3,3–5',
      text: [
        'Salomo ist noch jung, und er ist König in Israel. Sein Vater David ist gestorben. Salomo hat Gott lieb und will leben, wie David gelebt hat.',
        'Das Haus für Gott gibt es noch nicht, denn in Jerusalem hat niemand es gebaut. Die Leute opfern an vielen Orten auf den Höhen. Der wichtigste Platz liegt bei Gibeon. Dorthin macht sich Salomo mit seinen Leuten auf den Weg.',
        'Auf dem großen Altar von Gibeon opfert er tausend Brandopfer. In der Nacht schläft er ein. Da kommt ein Traum, und Gott spricht zu ihm: „Bitte, was ich dir geben soll!“'
      ],
      // Spiel: Weggabelung (weg, bekannt)
      task: { kind: 'weg', hint: 'Folge den Spuren des Zuges nach Gibeon. Schau dir die Wege genau an.', way: WEG },
      questions: [
        { q: 'Wohin geht Salomo, um Gott zu danken?', options: ['nach Gibeon', 'nach Silo', 'nach Bethel'], answer: 0 },
        { q: 'Wie viele Brandopfer bringt er dort?', options: ['tausend', 'zehn', 'hundert'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Ein gehorsames Herz',
      ref: '1. Könige 3,6–15',
      text: [
        'Salomo darf sich etwas wünschen. Zuerst dankt er Gott: „Du warst gut zu meinem Vater David. Nun hast du mich zum König gemacht, und ich bin noch jung. Ich weiß nicht, wie ich es anfangen soll. Und dein Volk ist so groß, dass niemand es zählen kann.“',
        'Dann bittet er: „Gib mir ein gehorsames Herz, damit ich dein Volk richten kann und weiß, was gut ist und was böse.“',
        'Gott gefällt diese Bitte. „Du bittest nicht um langes Leben, nicht um Reichtum und nicht darum, dass es deinen Feinden schlecht ergeht“, sagt er. „Ich gebe dir ein weises und verständiges Herz. Und was du nicht erbeten hast, gebe ich dir dazu: Reichtum und Ehre.“',
        'Salomo wacht auf, und es war ein Traum. Er geht nach Jerusalem, tritt vor die Lade des Bundes und feiert ein großes Mahl mit allen seinen Leuten.'
      ],
      // Spiel: Die Wunschkarten (wunschkarten, neu 5.11.2026)
      task: { kind: 'wunschkarten', hint: 'Fang nur die Karte mit dem, worum Salomo bittet.', wishCards: WUNSCHKARTEN },
      questions: [
        { q: 'Worum bittet Salomo?', options: ['um ein gehorsames Herz', 'um ein langes Leben', 'um viel Gold'], answer: 0 },
        { q: 'Was gibt Gott ihm dazu?', options: ['Reichtum und Ehre', 'ein Schwert', 'ein Schiff'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das Urteil des Königs',
      ref: '1. Könige 3,16–28',
      text: [
        'Zwei Frauen kommen zum König. Sie wohnen im selben Haus und haben beide einen kleinen Sohn. In der Nacht ist eines der Kinder gestorben. Jede sagt: „Der Lebende ist mein Sohn, und der Tote ist deiner!“ Sie rufen durcheinander vor dem König.',
        'Salomo hört beiden zu. Dann sagt er: „Holt mir ein Schwert!“ Ein Diener bringt es. „Teilt das lebende Kind in zwei Teile“, sagt der König, „und gebt jeder die Hälfte.“',
        'Da ruft die eine Frau, und ihr Herz brennt vor Liebe: „Bitte, mein Herr, gebt ihr das Kind lebendig und tötet es nicht!“ Die andere sagt: „Es soll weder mir noch dir gehören. Teilt es!“',
        '„Gebt dieser das Kind lebendig und tötet es nicht“, sagt Salomo. „Sie ist seine Mutter.“ Ganz Israel hört davon und staunt über den König.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer kommt zum König?', options: ['zwei Frauen', 'zwei Soldaten', 'zwei Händler'], answer: 0 },
        { q: 'Worum bittet die richtige Mutter?', options: ['Gebt ihr das Kind lebendig!', 'Gebt mir ein Schwert!', 'Gebt mir mehr Zeit!'], answer: 0 },
        { q: 'Was sagt Salomo am Ende?', options: ['Sie ist seine Mutter.', 'Ich weiß es nicht.', 'Kommt morgen wieder.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Sicher unter dem Feigenbaum',
      ref: '1. Könige 4,20–34',
      text: [
        'Salomo ist König über ganz Israel. Das Volk ist so groß wie der Sand am Meer. Die Leute essen, trinken und sind fröhlich. Im ganzen Land ist Frieden. Von Dan bis nach Beerscheba sitzt jeder in Ruhe unter seinem Weinstock und seinem Feigenbaum.',
        'Gott hat Salomo viel Weisheit gegeben, so weit wie der Sand am Ufer des Meeres. Er spricht dreitausend Sprüche und singt tausendundfünf Lieder. Er redet über Bäume, von der Zeder auf dem Libanon bis zum Ysop, der aus der Mauer wächst. Er redet über Vieh, Vögel, Kriechtiere und Fische.',
        'Aus allen Völkern kommen Menschen, um ihn zu hören, auch von den Königen der Erde, die von seiner Weisheit gehört haben.'
      ],
      // Spiel: Ernten (ernten, bekannt)
      task: { kind: 'ernten', hint: 'Tippe die reifen Früchte an. Steine und Dornen gehören nicht in den Korb.', harvest: ERNTEN },
      questions: [
        { q: 'Wo sitzen die Leute in Ruhe?', options: ['unter Weinstock und Feigenbaum', 'in der Burg', 'am Feuer'], answer: 0 },
        { q: 'Wie viele Sprüche spricht Salomo?', options: ['dreitausend', 'dreißig', 'dreihundert'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Zedern aus dem Libanon',
      ref: '1. Könige 5,1–12',
      text: [
        'König Hiram von Tyrus schickt Boten zu Salomo, denn er hat von seiner Salbung gehört. Hiram hat David geliebt, solange David lebte.',
        'Salomo lässt ihm sagen: „Mein Vater David konnte kein Haus für den Namen Gottes bauen, denn er musste Kriege führen. Nun hat Gott mir Ruhe geschenkt. Ich will das Haus bauen. Lass Zedern auf dem Libanon schlagen. Bei uns versteht niemand so gut Holz zu hauen wie deine Leute.“',
        'Hiram freut sich und sagt: „Gelobt sei der Herr, der David einen weisen Sohn gegeben hat!“ Seine Männer bringen die Stämme hinab ans Meer und binden sie zu Flößen. Dafür schickt Salomo ihm Weizen und Öl, Jahr für Jahr. Die beiden Könige schließen Frieden miteinander.'
      ],
      // Spiel: Die Flöße (floesse, neu 5.11.2026)
      task: { kind: 'floesse', hint: 'Binde die Stämme zu einem Floß und steuere es über das Meer an die Küste.', rafts: FLOESSE },
      questions: [
        { q: 'Wer schickt Holz für das Haus Gottes?', options: ['Hiram, der König von Tyrus', 'der Pharao', 'die Königin von Saba'], answer: 0 },
        { q: 'Welches Holz kommt vom Libanon?', options: ['Zedern', 'Palmen', 'Feigen'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Steine ohne Lärm',
      ref: '1. Könige 5,13–18; 6,1–7',
      text: [
        'Salomo holt viele Männer zur Arbeit. Siebzigtausend tragen Lasten, achtzigtausend hauen im Gebirge die Steine. Auch die Bauleute Hirams helfen mit. Sie brechen große, kostbare Steine aus dem Fels, als Grund für das Haus Gottes.',
        'Im vierten Jahr seiner Herrschaft beginnt der Bau. Das Haus wird sechzig Ellen lang, zwanzig Ellen breit und dreißig Ellen hoch, mit einer Halle davor und Fenstern mit festen Stäben.',
        'Die Steine sind schon fertig behauen, bevor sie zur Baustelle kommen. Darum hört man beim Bauen keinen Hammer, kein Beil und kein anderes Werkzeug aus Eisen. Jeder Stein findet seinen Platz.'
      ],
      // Spiel: Steine leise legen (leise, neu)
      task: { kind: 'leise', hint: 'Ziehe den Stein ganz langsam in die Lücke, damit es leise bleibt.', quiet: LEISE },
      questions: [
        { q: 'Wie sind die Steine, wenn sie ankommen?', options: ['schon fertig behauen', 'noch ganz roh', 'aus Holz'], answer: 0 },
        { q: 'Was hört man auf der Baustelle nicht?', options: ['Hammer und Beil', 'Vogelsang', 'Gesang'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Zedern, Gold und Cherubim',
      ref: '1. Könige 6,14–35',
      text: [
        'Im Inneren des Hauses ist alles aus Zedernholz, von den Wänden bis zur Decke. Auf dem Holz sind Knoten und Blumen geschnitzt, sodass man keinen Stein mehr sieht. Der Boden ist aus Tannenbrettern.',
        'Hinten im Haus liegt ein Raum, zwanzig Ellen lang, breit und hoch. Dort soll die Lade des Bundes stehen. Salomo überzieht alles mit reinem Gold. Er lässt zwei Cherubim aus Ölbaumholz machen, jeder zehn Ellen hoch, und überzieht auch sie mit Gold. Ihre Flügel reichen von Wand zu Wand und berühren sich in der Mitte.',
        'An den Wänden und auf den Türen sind Cherubim, Palmen und Blumen geschnitzt. Alles glänzt golden.'
      ],
      // Spiel: Schnitzen (schnitzen, neu 5.11.2026)
      task: { kind: 'schnitzen', hint: 'Fahre die goldene Linie im Zedernholz mit dem Finger nach.', carving: SCHNITZEN },
      questions: [
        { q: 'Aus welchem Holz sind die Wände innen?', options: ['aus Zedernholz', 'aus Tannenholz', 'aus Ebenholz'], answer: 0 },
        { q: 'Womit überzieht Salomo den hinteren Raum?', options: ['mit reinem Gold', 'mit Silber', 'mit Ton'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Zwei Säulen aus Erz',
      ref: '1. Könige 7,13–22; 6,37–38',
      text: [
        'Salomo lässt Hiram aus Tyrus holen, einen Meister im Erz. Seine Mutter ist eine Witwe aus dem Stamm Naftali, sein Vater stammte aus Tyrus. Hiram ist voller Weisheit und Kunst und macht alle Werke, die Salomo braucht.',
        'Er gießt zwei Säulen aus Erz, jede achtzehn Ellen hoch. Oben auf jede Säule setzt er einen Knauf wie eine Lilie, mit Gitterwerk und zwei Reihen Granatäpfeln, zweihundert an jedem Knauf. Er stellt die Säulen vor die Halle des Hauses. Die rechte nennt er Jachin, die linke Boas.',
        'Sieben Jahre lang baut Salomo am Haus Gottes. Dann ist alles fertig, genau wie es sein soll.'
      ],
      // Spiel: Granatäpfel (granatapfel, neu 5.11.2026)
      task: { kind: 'granatapfel', hint: 'Hänge die Ketten fertig. Setze das Muster fort.', pomegranates: GRANATAPFEL },
      questions: [
        { q: 'Wie heißt der Meister im Erz?', options: ['Hiram', 'Zadok', 'Natan'], answer: 0 },
        { q: 'Wie heißen die beiden Säulen?', options: ['Jachin und Boas', 'Adam und Eva', 'Ruben und Simeon'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die Lade zieht ein',
      ref: '1. Könige 8,1–11',
      text: [
        'Salomo ruft die Ältesten und die Oberen aller Stämme nach Jerusalem. Alle kommen zum Fest, denn die Lade des Bundes soll in das neue Haus ziehen.',
        'Die Priester heben die Lade auf und tragen sie hinauf. Der König und das ganze Volk gehen vor ihr her. Sie opfern Schafe und Rinder, so viele, dass niemand sie zählen kann. Die Priester bringen die Lade in den hinteren Raum, unter die Flügel der Cherubim. In der Lade liegen nur die zwei steinernen Tafeln. Mose hat sie am Berg Horeb hineingelegt.',
        'Als die Priester das Haus verlassen, erfüllt eine Wolke das Haus Gottes. Sie können nicht mehr stehen, um ihren Dienst zu tun, denn Gottes Herrlichkeit ist da.'
      ],
      // Spiel: Die Stufen hinauf (stufen, neu 5.11.2026)
      task: { kind: 'stufen', hint: 'Trage die Lade mit den Priestern hinauf: links, rechts, im Gleichschritt.', stairs: STUFEN },
      questions: [
        { q: 'Was tragen die Priester ins neue Haus?', options: ['die Lade des Bundes', 'den Thron des Königs', 'einen Altar aus Gold'], answer: 0 },
        { q: 'Wohin stellen sie die Lade?', options: ['unter die Flügel der Cherubim', 'vor das Tor', 'in den Hof'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Salomos Gebet',
      ref: '1. Könige 8,22–30; 9,1–3',
      text: [
        'Salomo tritt vor den Altar, vor die ganze Gemeinde. Er breitet seine Hände zum Himmel aus und betet: „Herr, Gott Israels, es ist kein Gott wie du, droben im Himmel und unten auf der Erde.“',
        'Dann sagt er: „Sollte Gott wirklich auf der Erde wohnen? Der Himmel und aller Himmel Himmel können dich nicht fassen. Wie sollte es dann dieses Haus tun, das ich gebaut habe? Höre, wenn dein Volk an diesem Ort zu dir betet, und sei ihm gnädig.“',
        'Danach feiern Salomo und das ganze Volk vierzehn Tage lang ein großes Fest. Später, als alles gebaut ist, erscheint Gott dem König noch einmal. „Ich habe dein Gebet gehört“, sagt er. „Dieses Haus habe ich geheiligt. Meine Augen und mein Herz sollen immer dort sein.“'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie betet Salomo vor dem Altar?', options: ['mit ausgebreiteten Händen zum Himmel', 'mit gesenktem Kopf', 'im Sitzen'], answer: 0 },
        { q: 'Was kann Gott nicht fassen, sagt Salomo?', options: ['der Himmel und aller Himmel Himmel', 'das Meer', 'der Libanon'], answer: 0 },
        { q: 'Wie lange dauert das Fest?', options: ['vierzehn Tage', 'einen Tag', 'ein Jahr'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Die Königin von Saba',
      ref: '1. Könige 10,1–13',
      text: [
        'Eine Königin aus einem fernen Land hört von Salomo und von dem Gott, den er ehrt. Sie will ihn mit Rätseln auf die Probe stellen. Mit vielen Dienern und mit Kamelen zieht sie nach Jerusalem. Die Kamele tragen Gewürze, viel Gold und Edelsteine.',
        'Salomo beantwortet alles, was sie fragt. Nichts ist ihm zu schwer. Sie sieht sein Haus, die Speisen auf seinem Tisch, die Diener in ihren Kleidern, die Mundschenke und die Opfer im Haus Gottes. Da kommt sie aus dem Staunen nicht mehr heraus.',
        '„Es ist wahr, was ich gehört habe“, sagt sie. „Ich habe es erst nicht glauben wollen, bis ich es mit eigenen Augen sah. Es ist mir nicht einmal die Hälfte gesagt worden. Gelobt sei der Herr, dein Gott!“ Sie schenkt Salomo Gold und Gewürze. Er gibt ihr alles, was sie sich wünscht, und sie zieht heim.'
      ],
      // Spiel: Die Schatzkammer (schatzkammer, neu 5.11.2026)
      task: { kind: 'schatzkammer', hint: 'Lege jedes Geschenk in das Fach mit der passenden Form.', treasury: SCHATZKAMMER },
      questions: [
        { q: 'Was bringt die Königin mit?', options: ['Gewürze, Gold und Edelsteine', 'Schafe und Ziegen', 'Schwerter und Schilde'], answer: 0 },
        { q: 'Wie kommt sie nach Jerusalem?', options: ['mit Kamelen', 'mit einem Schiff', 'mit einem Wagen'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Der Thron aus Elfenbein',
      ref: '1. Könige 10,14–25',
      text: [
        'Salomo wird reicher und weiser als alle Könige der Erde. Er lässt zweihundert große Schilde aus Gold machen und stellt sie in sein Haus im Libanonwald. Alle Trinkgefäße des Königs sind aus Gold, denn Silber gilt zu Salomos Zeiten für nichts.',
        'Dazu baut er einen großen Thron aus Elfenbein und überzieht ihn mit feinem Gold. Sechs Stufen führen hinauf. Auf jeder Stufe steht links und rechts ein Löwe, zwölf in allen. Zwei weitere Löwen stehen an den Lehnen. So etwas gibt es in keinem Königreich.',
        'Alle Welt will Salomo sehen und seine Weisheit hören, die Gott ihm ins Herz gegeben hat. Jedes Jahr bringen sie ihm Geschenke: Gold und Silber, Kleider, Gewürze, Pferde und Maultiere.'
      ],
      // Spiel: Den Thron bauen (thron, neu)
      task: { kind: 'thron', hint: 'Setze die Löwen auf die Stufen. Sie sehen zur Mitte des Throns.', throne: THRON },
      questions: [
        { q: 'Woraus ist der Thron gebaut?', options: ['aus Elfenbein, mit Gold überzogen', 'aus Stein', 'aus Holz'], answer: 0 },
        { q: 'Wie viele Stufen hat der Thron?', options: ['sechs', 'drei', 'zehn'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Worum bittet Salomo Gott?', options: ['um ein gehorsames Herz', 'um viel Gold', 'um ein langes Leben'], answer: 0 },
    { q: 'Wem gibt Salomo das Kind zurück?', options: ['der echten Mutter', 'dem König Hiram', 'dem Diener'], answer: 0 },
    { q: 'Woher kommen die Zedern für das Haus Gottes?', options: ['vom Libanon', 'aus Ägypten', 'vom Berg Sinai'], answer: 0 },
    { q: 'Wie heißen die zwei Säulen vor der Halle?', options: ['Jachin und Boas', 'Salomo und David', 'Hiram und Tyrus'], answer: 0 },
    { q: 'Was liegt in der Lade des Bundes?', options: ['die zwei steinernen Tafeln', 'Brot und Wein', 'ein Schwert'], answer: 0 },
    { q: 'Wie viele Löwen stehen auf den Stufen des Throns?', options: ['zwölf', 'sechs', 'hundert'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of salomo.stages) {
  const file = `audio/abenteuer/salomo/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the young king at Gibeon, the house of cedar, the queen's caravan); they follow one another at random
salomo.music = [
  'audio/abenteuer/salomo/musik-gibeon-v2.mp3',
  'audio/abenteuer/salomo/musik-haus-v2.mp3',
  'audio/abenteuer/salomo/musik-karawane-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(salomo, salomoEn)
