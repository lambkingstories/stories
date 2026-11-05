/**
 * Abenteuer "Ostern" (Lukas 24, Johannes 20 und 21) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Jesus lebt". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 5.11.2026), Nr. 29 der Gesamtreise.
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein, ohne Lichtkranz, ohne sichtbare Male an den Händen). Gott der Vater, Engel und Lichtgestalten sind nie im Bild.
 * Der Ton ist hell und froh, aber leise: die Menschen verstehen nach und nach. Kein Kreuz im Bild, kein Blut, keine Wunden, kein Leichnam; die Leinentücher liegen flach gefaltet im leeren Grab.
 * Quelle der Texte: D:/Claude/Abenteuer-Ostern/ENTWURF_Ostern.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Wimmelbild (bekannt), 2 Botengang (neu), 3 Wanderweg (neu), 4 Tisch decken (neu), 5 Fensterläden (neu),
 * 6 Unterschiede finden (bekannt, Mechanik von Mose), 7 Das Netz zur Rechten (neu, fischzug), 8 Die Lämmer führen (neu, weiden), 9 Licht weitergeben (neu).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/ostern/, images/abenteuer/spiele/ostern/<spiel>/, audio/abenteuer/ostern/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Ostern/tools/bauen_ostern.py: nicht von Hand ändern.
 */
import type { DiffGame, FindGame, Journey, FischzugGame, GrazeGame } from '@/types/adventure'
import type { ErrandGame, ShuttersGame } from '@/utils/osternNeuA'
import type { FlameGame, TableGame, WanderGame } from '@/utils/osternNeuB'
import { josef } from './josef'
import { OSTERN_PATH } from './osternPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { osternEn } from './en/ostern.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/ostern/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/ostern/'

const G = 'images/abenteuer/spiele/ostern/'


/**
 * Etappe 2, "Botengang" (neu, `botengang`, Joh 20,18): Maria Magdalena läuft durch die Gassen Jerusalems zu den Jüngern. Das Gitter ist aus gemalten Gassenkacheln (Draufsicht, 256 × 256),
 * die App dreht sie nach den Nachbarn (`#` Dach, `.` Gasse, `S` Gartentor, `Z` Haus der Jünger, `B` Sackgasse mit Brunnen). Runde 1: 5 × 5 mit einer Sackgasse, Runde 2: 6 × 7 mit vier.
 */
const BOTENGANG: ErrandGame = {
  tiles: {
    straight: `${G}botengang/gasse-gerade.webp`,
    corner: `${G}botengang/gasse-ecke.webp`,
    tee: `${G}botengang/gasse-t.webp`,
    cross: `${G}botengang/gasse-kreuz.webp`,
    dead: `${G}botengang/sackgasse.webp`,
    roofs: [`${G}botengang/dach-1.webp`, `${G}botengang/dach-2.webp`],
    start: `${G}botengang/start.webp`,
    goal: `${G}botengang/ziel.webp`
  },
  walker: `${G}botengang/maria.webp`,
  rounds: [
    { hint: 'Maria läuft vom Garten zu den Jüngern. Tippe auf die Gasse, in die sie laufen soll.', rows: ['S..#Z', '##.#.', 'B....', '#.#.#', '#...#'] },
    { hint: 'Jetzt sind es mehr Gassen. Wo ein Brunnen steht, geht es nicht weiter.', rows: ['S..##B#', '##.#..Z', 'B....##', '##.#.##', '#..#..B', '#B#####'] }
  ]
}

/**
 * Etappe 3, "Wanderweg" (neu, `wanderweg`, Lk 24,13–15): die zwei Jünger gehen nach Emmaus; das Kind führt sie mit dem Finger die gemalte Landstraße hinauf (3:4) an Steinen und Dornbüschen vorbei
 * zum Meilenstein. Straßenmitte und Hindernisse vom gemalten Bild abgelesen (tools/_massen_neu.json). Der Wanderer-Sprite ist der aus dem alten Wegspiel (`weg/wanderer.webp`).
 */
const WANDERWEG: WanderGame = {
  walker: `${G}weg/wanderer.webp`,
  walkerW: 16,
  rounds: [
    {
      hint: 'Führe die zwei Wanderer die Straße hinauf bis zum Meilenstein. Weiche den Steinen und Dornbüschen aus.',
      background: `${G}wanderweg/strasse-1.webp`,
      road: 12,
      path: [{ x: 43.2, y: 100 }, { x: 41.8, y: 90 }, { x: 47.8, y: 80 }, { x: 58.2, y: 70 }, { x: 61.6, y: 60 }, { x: 52.8, y: 50 }, { x: 37.6, y: 40 }, { x: 34.9, y: 30 }, { x: 48.1, y: 20 }, { x: 56, y: 10 }],
      obstacles: [
        { image: `${G}wanderweg/stein-1.webp`, x: 31.4, y: 88, r: 5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/dorn-1.webp`, x: 66.9, y: 72, r: 5, name: 'Ein Dornbusch', kind: 'thorn' },
        { image: `${G}wanderweg/stein-2.webp`, x: 46.1, y: 55, r: 4.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/stein-3.webp`, x: 48.7, y: 38, r: 4.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/dorn-2.webp`, x: 31.6, y: 22, r: 5, name: 'Ein Dornbusch', kind: 'thorn' }
      ],
      goal: { image: `${G}wanderweg/ziel.webp`, x: 64.1, y: 5, w: 12, name: 'Der Meilenstein' }
    },
    {
      hint: 'Jetzt ist die Straße länger und es liegen mehr Steine darauf.',
      background: `${G}wanderweg/strasse-2.webp`,
      road: 12,
      path: [{ x: 40.8, y: 100 }, { x: 41.9, y: 95 }, { x: 41.1, y: 90 }, { x: 37.8, y: 80 }, { x: 30.6, y: 70 }, { x: 30.4, y: 60 }, { x: 35, y: 55 }, { x: 43.9, y: 50 }, { x: 56.2, y: 45 }, { x: 63.2, y: 40 }, { x: 66.3, y: 35 }, { x: 63.4, y: 30 }, { x: 55.3, y: 25 }, { x: 43.7, y: 20 }, { x: 36.8, y: 15 }, { x: 37.8, y: 10 }, { x: 45, y: 5 }],
      obstacles: [
        { image: `${G}wanderweg/stein-1.webp`, x: 30.6, y: 90, r: 3.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/dorn-1.webp`, x: 47.2, y: 80, r: 3.5, name: 'Ein Dornbusch', kind: 'thorn' },
        { image: `${G}wanderweg/stein-3.webp`, x: 39, y: 70, r: 3.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/dorn-2.webp`, x: 23.2, y: 60, r: 3.5, name: 'Ein Dornbusch', kind: 'thorn' },
        { image: `${G}wanderweg/stein-2.webp`, x: 33.9, y: 50, r: 3.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/stein-1.webp`, x: 68.9, y: 40, r: 3.5, name: 'Ein Stein', kind: 'stone' },
        { image: `${G}wanderweg/dorn-1.webp`, x: 70.1, y: 30, r: 3.5, name: 'Ein Dornbusch', kind: 'thorn' },
        { image: `${G}wanderweg/stein-3.webp`, x: 51, y: 20, r: 3.5, name: 'Ein Stein', kind: 'stone' }
      ],
      goal: { image: `${G}wanderweg/ziel.webp`, x: 57, y: 5, w: 12, name: 'Der Meilenstein' }
    }
  ]
}

/**
 * Etappe 4, "Tisch decken" (neu, `tischdecken`, Lk 24,29–31): der Tisch in Emmaus von oben mit drei Kissen; das Kind zieht die Dinge an ihre Plätze. Runde 1 je Platz ein Becher und eine Schale,
 * Runde 2 Lampe und Krug in die Mitte, das Fladenbrot zum Gast (oben), Netz und Hirtenstab gehören nicht auf den Tisch (in den Korb). Am Ende bricht das Brot in zwei Hälften.
 * Plätze vom gemalten Tisch abgelesen (tools/_massen_neu.json).
 */
const TISCH: TableGame = {
  background: `${G}tisch/tisch.webp`,
  slots: [
    { id: 'links', x: 29.7, y: 51.6, r: 7, name: 'Der Platz links' },
    { id: 'oben', x: 49, y: 38, r: 6.5, name: 'Der Platz des Gastes' },
    { id: 'rechts', x: 68.4, y: 51.6, r: 7, name: 'Der Platz rechts' },
    { id: 'mitte', x: 49, y: 57.5, r: 7, name: 'Die Mitte des Tisches' },
    { id: 'korb', x: 87, y: 87.5, r: 9, name: 'Der Korb neben dem Tisch' }
  ],
  basket: { image: `${G}tisch/korb.webp`, x: 87, y: 87.5, w: 16 },
  bread: { item: 'brot', whole: `${G}tisch/brot.webp`, halves: [`${G}tisch/brot-haelfte-1.webp`, `${G}tisch/brot-haelfte-2.webp`] },
  guestSlot: 'oben',
  rounds: [
    {
      hint: 'Die zwei bitten den Fremden: Bleib bei uns! Stell an jeden Platz einen Becher und eine Schale.',
      items: [
        { id: 'becher-1', image: `${G}tisch/becher.webp`, name: 'Ein Becher', w: 7, target: 'links', kind: 'becher' },
        { id: 'becher-2', image: `${G}tisch/becher.webp`, name: 'Ein Becher', w: 7, target: 'oben', kind: 'becher' },
        { id: 'becher-3', image: `${G}tisch/becher.webp`, name: 'Ein Becher', w: 7, target: 'rechts', kind: 'becher' },
        { id: 'schale-1', image: `${G}tisch/schale.webp`, name: 'Eine Schale', w: 9, target: 'links', kind: 'schale' },
        { id: 'schale-2', image: `${G}tisch/schale.webp`, name: 'Eine Schale', w: 9, target: 'oben', kind: 'schale' },
        { id: 'schale-3', image: `${G}tisch/schale.webp`, name: 'Eine Schale', w: 9, target: 'rechts', kind: 'schale' }
      ]
    },
    {
      hint: 'Lampe und Krug kommen in die Mitte, das Brot zum Gast. Was nicht auf den Tisch gehört, kommt in den Korb.',
      items: [
        { id: 'lampe', image: `${G}tisch/lampe.webp`, name: 'Die Öllampe', w: 8, target: 'mitte', kind: 'lampe' },
        { id: 'krug', image: `${G}tisch/krug.webp`, name: 'Der Krug', w: 8, target: 'mitte', kind: 'krug' },
        { id: 'brot', image: `${G}tisch/brot.webp`, name: 'Das Fladenbrot', w: 12, target: 'oben', kind: 'brot' },
        { id: 'netz', image: `${G}tisch/netz.webp`, name: 'Ein Fischernetz', w: 12, target: 'korb', kind: 'netz' },
        { id: 'stab', image: `${G}tisch/stab.webp`, name: 'Ein Hirtenstab', w: 14, target: 'korb', kind: 'stab' }
      ]
    }
  ]
}

/**
 * Etappe 5, "Fensterläden" (neu, `fensterlaeden`, Lk 24,36): das Obergeschoss am Abend; jedes Fenster hat einen Laden. Ein Tippen klappt den Laden um und die Nachbarn mit; hinter jedem offenen
 * Fenster leuchtet Lampenlicht und ein froher Jünger. Runde 1: vier Fenster in einer Reihe, alle zu (Bestzahl 2). Runde 2: zwei Reihen zu drei, die Nachbarn je Reihe, fünf zu (Bestzahl 3).
 * Die Öffnungen der zwei Häuser sind verschieden geformt, darum hat Runde 1 eigene, schmalere Bilder. Lagen vom gemalten Bild abgelesen (tools/_massen_neu.json).
 */
const FENSTER: ShuttersGame = {
  shutter: `${G}fenster/laden.webp`,
  lights: [`${G}fenster/licht-1.webp`, `${G}fenster/licht-2.webp`, `${G}fenster/licht-3.webp`, `${G}fenster/licht-4.webp`, `${G}fenster/licht-5.webp`, `${G}fenster/licht-6.webp`],
  rounds: [
    {
      hint: 'Jesus steht mitten unter den Jüngern. Öffne alle Fensterläden. Ein Laden nimmt seine Nachbarn mit.',
      background: `${G}fenster/haus-1.webp`,
      ratio: 1.5,
      shutter: `${G}fenster/laden-schmal.webp`,
      lights: [`${G}fenster/licht-schmal-1.webp`, `${G}fenster/licht-schmal-2.webp`, `${G}fenster/licht-schmal-3.webp`, `${G}fenster/licht-schmal-4.webp`],
      windows: [{ x: 9.3, y: 37.8, w: 12.4, h: 31.9 }, { x: 32.6, y: 37.8, w: 12.3, h: 31.8 }, { x: 54.9, y: 37.8, w: 12.3, h: 31.8 }, { x: 77.7, y: 37.8, w: 12.2, h: 31.8 }],
      links: [[1], [0, 2], [1, 3], [2]],
      start: [false, false, false, false],
      par: 2
    },
    {
      hint: 'Jetzt hat das Haus zwei Reihen. In jeder Reihe gehen die Nachbarn links und rechts mit.',
      background: `${G}fenster/haus-2.webp`,
      ratio: 4 / 3,
      windows: [{ x: 14.7, y: 20.3, w: 12.8, h: 24.4 }, { x: 43.9, y: 20.3, w: 12.7, h: 24.4 }, { x: 73.1, y: 20.3, w: 12.6, h: 24.5 }, { x: 14.9, y: 56.6, w: 12.6, h: 24.4 }, { x: 43.9, y: 56.5, w: 12.8, h: 24.7 }, { x: 73.1, y: 56.3, w: 12.7, h: 24.8 }],
      links: [[1], [0, 2], [1], [4], [3, 5], [4]],
      start: [false, true, false, false, false, false],
      par: 3
    }
  ]
}

/**
 * Etappe 6, "Unterschiede finden" (Mechanik von Mose Etappe 5, eines der zwei bekannten Spiele dieses Abenteuers; Joh 20,26): zwei Ansichten des Saals acht Tage später, das rechte Bild hat Dinge mehr.
 * Runde 1 drei große Dinge (Mantel, Krug, Sandalen), Runde 2 vier kleinere (Becher, Brot, Rolle, Lampe). Lagen vom gemalten Bild abgelesen (tools/_massen_neu.json).
 */
const UNTERSCHIED: DiffGame = {
  rounds: [
    {
      hint: 'Acht Tage später sind die Jünger wieder im Haus. Das rechte Bild hat ein paar Dinge mehr. Tippe, was links fehlt.',
      base: `${G}unterschied/saal-1.webp`,
      items: [
        { image: `${G}unterschied/mantel.webp`, x: 66, y: 69.3, w: 16 },
        { image: `${G}unterschied/krug.webp`, x: 86, y: 69, w: 12 },
        { image: `${G}unterschied/sandalen.webp`, x: 46, y: 89.1, w: 10 }
      ]
    },
    {
      hint: 'Noch einmal, mit kleineren Dingen.',
      base: `${G}unterschied/saal-2.webp`,
      items: [
        { image: `${G}unterschied/becher.webp`, x: 35.9, y: 61.5, w: 4.5 },
        { image: `${G}unterschied/brot.webp`, x: 64.2, y: 62.3, w: 6 },
        { image: `${G}unterschied/rolle.webp`, x: 89.1, y: 15.5, w: 6 },
        { image: `${G}unterschied/lampe.webp`, x: 9, y: 30, w: 5 }
      ]
    }
  ]
}

/**
 * Etappe 9, "Licht weitergeben" (neu, `lichtweg`, Lk 24,52–53): auf dem Weg vom Hügel bei Bethanien nach Jerusalem stehen Menschen mit Öllampen; das Kind zieht die Flamme von einer brennenden Lampe zur
 * nächsten in Reichweite, bis alle brennen. Runde 1: sechs Menschen in einer Reihe, Runde 2: neun mit einer Gabelung. Fußpunkte und Lampenanker vom gemalten Bild abgelesen (tools/_massen_neu.json).
 */
const LICHT: FlameGame = {
  flame: `${G}licht/flamme.webp`,
  rounds: [
    {
      hint: 'Die Jünger gehen mit großer Freude zurück nach Jerusalem. Zieh die Flamme von Lampe zu Lampe, bis alle brennen.',
      background: `${G}licht/huegel.webp`,
      people: [
        { image: `${G}licht/mensch-1.webp`, x: 26, y: 94, w: 17.33, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-2.webp`, x: 15, y: 72, w: 14, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-3.webp`, x: 30, y: 54.5, w: 10.67, anchor: { x: 61, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-4.webp`, x: 52, y: 42, w: 8, anchor: { x: 65, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-1.webp`, x: 74, y: 44, w: 7.33, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-2.webp`, x: 89, y: 37.5, w: 6, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' }
      ],
      start: 0,
      reach: 26,
      gate: { x: 91.5, y: 33 }
    },
    {
      hint: 'Jetzt teilt sich der Weg. Alle Lampen sollen brennen, auf beiden Wegen.',
      background: `${G}licht/huegel.webp`,
      people: [
        { image: `${G}licht/mensch-1.webp`, x: 27, y: 95, w: 17.33, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-2.webp`, x: 15, y: 78, w: 14.67, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-3.webp`, x: 17, y: 62, w: 12, anchor: { x: 61, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-4.webp`, x: 32, y: 53.5, w: 10, anchor: { x: 65, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-1.webp`, x: 45, y: 47, w: 8.67, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-2.webp`, x: 55, y: 42, w: 7.33, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-3.webp`, x: 63, y: 49.5, w: 8, anchor: { x: 61, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-4.webp`, x: 76, y: 44.5, w: 6.67, anchor: { x: 65, y: 31.5 }, name: 'Ein Mensch mit einer Öllampe' },
        { image: `${G}licht/mensch-1.webp`, x: 89, y: 37.5, w: 6, anchor: { x: 61, y: 31 }, name: 'Ein Mensch mit einer Öllampe' }
      ],
      start: 0,
      reach: 20,
      gate: { x: 91.5, y: 33 }
    }
  ]
}

/**
 * Etappe 7, "Das Netz zur Rechten" (neu, `fischzug`, Joh 21,6): der See am frühen Morgen (3:2, leer), unten links das Boot mit den sieben Fischern, dunkle Fischschatten schwimmen in Schwärmen. Der Finger zieht von dort einen
 * gestrichelten Kreis (so groß wie das Netz) aufs Wasser und lässt los: das Netz fliegt, sinkt, und alle Fische, deren Mitte im Kreis liegt, sind gefangen und fliegen in den Korb oben rechts; ein Wurf ohne Fang ist ein Fehler.
 * Runde 1 fünf Fische, drei Würfe, vier genügen; Runde 2 acht Fische in zwei Schwärmen, vier Würfe, sechs genügen. Am Ende liegt das volle Netz am Ufer (`fang`). Lagen und Größen sind Prozent des Bildes (Startwerte, die Leitung stellt sie
 * am echten Bild ein: `tools/_massen_ostern.json`). Bilder (Bildauftrag): `fischzug/see` (3:2), `boot`, `netz` (rund), `fisch-1..3`, `korb`, `fang` (3:2).
 */
const FISCHZUG: FischzugGame = {
  lake: `${G}fischzug/see.webp`,
  boat: { image: `${G}fischzug/boot.webp`, label: 'Das Boot mit den sieben Fischern', w: 26, x: 17, y: 97 },
  net: { image: `${G}fischzug/netz.webp`, label: 'Das Netz', w: 24 },
  fish: [
    { image: `${G}fischzug/fisch-1.webp`, label: 'Ein Fisch', w: 9 },
    { image: `${G}fischzug/fisch-2.webp`, label: 'Ein Fisch', w: 9 },
    { image: `${G}fischzug/fisch-3.webp`, label: 'Ein Fisch', w: 9 }
  ],
  basket: { image: `${G}fischzug/korb.webp`, label: 'Der Fischkorb', w: 10, x: 91, y: 24 },
  full: `${G}fischzug/fang.webp`,
  area: { left: 8, top: 32, right: 92, bottom: 78 },
  rounds: [
    { hint: 'Zieh das Netz dorthin, wo die Fische schwimmen, und lass los.', fish: 5, throws: 3, goal: 4 },
    { hint: 'Jetzt sind es zwei Schwärme. Zieh das Netz dorthin, wo die meisten Fische schwimmen.', fish: 8, throws: 4, goal: 6, schools: 2 }
  ]
}

/**
 * Etappe 8, "Die Lämmer führen" (neu, `weiden`, Joh 21,15-17): eine grüne Hanglandschaft über dem See (3:2); das Kind führt den Hirten (ziehen, antippen oder Pfeiltasten), die Tiere in der Nähe schließen sich an und laufen ihm nach.
 * Er führt sie in den Pferch mit dem offenen Tor; ein Dornbusch hält ein Tier auf (Fehler), der Hirte geht zu ihm und es folgt dann auf einem Umweg. In Runde 2 fließt ein Bach durch die Wiese: Tiere und Hirte gehen nur über den Steg.
 * Runde 1 "Weide meine Lämmer!" (vier Lämmer), Runde 2 "Weide meine Schafe!" (zwei Lämmer, zwei Schafe, mit Bach). Der Titel der zweiten Runde steht wie im Text der Etappe (Luther 1912: "Weide meine Schafe!").
 * Lagen und Größen sind Prozent des Bildes (Startwerte, die Leitung stellt sie am echten Bild ein: `tools/_massen_ostern.json`; Pferch-Innenfläche, Bachband und Stegspur am Bild messen).
 * Bilder (Bildauftrag): `weiden/wiese` (3:2, leer), `wiese-bach` (dieselbe Wiese mit Bach), `hirte`, `lamm-1`, `lamm-2`, `schaf`, `dornen`, `pferch`, `steg`.
 */
const WEIDEN: GrazeGame = {
  meadow: `${G}weiden/wiese.webp`,
  meadowStream: `${G}weiden/wiese-bach.webp`,
  hirte: { image: `${G}weiden/hirte.webp`, label: 'Der Hirte', w: 13, x: 8, y: 72 },
  kinds: [
    { id: 'lamm-1', image: `${G}weiden/lamm-1.webp`, label: 'Ein Lamm', w: 9 },
    { id: 'lamm-2', image: `${G}weiden/lamm-2.webp`, label: 'Ein Lamm', w: 9 },
    { id: 'schaf', image: `${G}weiden/schaf.webp`, label: 'Ein Schaf', w: 11, speed: 17 }
  ],
  thorn: { image: `${G}weiden/dornen.webp`, label: 'Ein Dornbusch', w: 13 },
  pen: { image: `${G}weiden/pferch.webp`, label: 'Der Pferch mit dem offenen Tor', w: 24, x: 88, y: 88, area: { left: 78, top: 58, right: 97, bottom: 86 } },
  bridge: { image: `${G}weiden/steg.webp`, label: 'Der Steg über den Bach', w: 12, x: 50, y: 56 },
  stream: { from: 46, to: 54, top: 40, bottom: 56 },
  rounds: [
    {
      title: 'Weide meine Lämmer!',
      hint: 'Führe die Lämmer zur Weide: Geh voran, und weich den Dornen aus.',
      animals: ['lamm-1', 'lamm-1', 'lamm-2', 'lamm-2'],
      starts: [{ x: 22, y: 66 }, { x: 27, y: 76 }, { x: 32, y: 64 }, { x: 36, y: 74 }],
      thorns: [{ x: 55, y: 72 }],
      stream: false
    },
    {
      title: 'Weide meine Schafe!',
      hint: 'Jetzt fließt ein Bach durch die Wiese. Führe die Tiere über den Steg und weich den Dornen aus.',
      animals: ['lamm-1', 'lamm-2', 'schaf', 'schaf'],
      starts: [{ x: 24, y: 64 }, { x: 28, y: 76 }, { x: 32, y: 62 }, { x: 36, y: 76 }],
      thorns: [{ x: 66, y: 70 }],
      stream: true
    }
  ]
}

/**
 * Etappe 1, "Wimmelbild" (alte Mechanik): der Garten im Morgengrauen mit dem Felsengrab, einem Olivenbaum, einer niedrigen Mauer und einer Blumenwiese (Hochformat 3:4, Bildauftrag); gesucht werden vier aus Johannes 20,1-10:
 * Maria Magdalena, Petrus, der andere Jünger und die flach gefalteten Leinentücher. Einige stehen hinter einem Olivenstamm, einem Mauerstück, einem Busch oder einem Felsbrocken (die ersten vier Verdecker decken je einen Gesuchten).
 * Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Maria Magdalena', 'Petrus', 'Der andere Jünger', 'Die Leinentücher'],
  doneText: 'Du hast alles gefunden: Maria Magdalena, Petrus, den anderen Jünger und die Leinentücher.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 22, y: 88, w: 22 },
    { image: `${G}wimmel/figur-2.webp`, x: 70, y: 82, w: 22 },
    { image: `${G}wimmel/figur-3.webp`, x: 46, y: 64, w: 17 },
    { image: `${G}wimmel/figur-4.webp`, x: 84, y: 93, w: 20 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 22, y: 90, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 70, y: 84, w: 18 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 46, y: 66, w: 14 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 84, y: 94, w: 14 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 58, y: 90, w: 12 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 30, y: 66, w: 10 }
  ]
}

export const ostern: Journey = {
  id: 'ostern',
  title: 'Ostern',
  subtitle: 'Jesus lebt',
  age: '8-10',
  downloadMb: 16, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: der Fischzug (ein Boot auf dem See bei Sonnenaufgang, ein volles Netz mit Fischen, ein Kohlenfeuer am Ufer; Konturzeichnung)
  gift: { title: 'Der Fischzug', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Garten mit dem Felsengrab über die Straße nach Emmaus und den Saal in Jerusalem an den See und zum Hügel bei Bethanien, mit Stationen und Perlenweg aus osternPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/ostern/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0625, y: 0.6007, d: 0.0339 },
      { x: 0.2167, y: 0.6371, d: 0.0339 },
      { x: 0.3357, y: 0.5400, d: 0.0339 },
      { x: 0.4556, y: 0.6493, d: 0.0339 },
      { x: 0.5302, y: 0.6584, d: 0.0339 },
      { x: 0.6038, y: 0.6644, d: 0.0339 },
      { x: 0.6774, y: 0.5977, d: 0.0339 },
      { x: 0.8216, y: 0.7282, d: 0.0339 },
      { x: 0.9133, y: 0.5097, d: 0.0339 }
    ],
    exam: { x: 0.9829, y: 0.4854, d: 0.0339 },
    path: OSTERN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01-b.webp`,
      title: 'Das Grab ist leer',
      ref: 'Johannes 20,1–10',
      text: [
        'Es ist der erste Tag der Woche und noch finster, als Maria Magdalena zum Grab kommt. Der große Stein vor dem Eingang ist weggerollt. Maria läuft zu Simon Petrus und zu dem anderen Jünger, den Jesus liebhat. „Sie haben den Herrn aus dem Grab weggenommen“, ruft sie, „und wir wissen nicht, wohin sie ihn gelegt haben!“',
        'Da laufen die beiden Männer los, und der andere Jünger ist schneller als Petrus. Er kommt als Erster am Grab an, bückt sich und schaut hinein. Er sieht die Leinentücher liegen, aber er geht nicht hinein.',
        'Dann kommt Petrus und geht gleich in das Grab. Die Leinentücher liegen da. Das Tuch, das um Jesu Kopf gebunden war, liegt nicht dabei, sondern zusammengewickelt an einem besonderen Platz. Nun geht auch der andere Jünger hinein. Er sieht es und glaubt. Aus der Schrift wissen sie noch nicht, dass Jesus von den Toten auferstehen muss. Die beiden gehen wieder nach Hause.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde Maria Magdalena, Petrus, den anderen Jünger und die Leinentücher im Garten.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Wer kommt früh zum Grab?', options: ['Maria Magdalena', 'Pilatus', 'ein Hirte'], answer: 0 },
        { q: 'Was sehen die Jünger im Grab?', options: ['die Leinentücher', 'einen Schatz', 'ein Feuer'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Maria!',
      ref: 'Johannes 20,11–18',
      text: [
        'Maria steht draußen vor dem Grab und weint. Unter Tränen schaut sie hinein. Dort sitzen zwei Engel in weißen Kleidern. „Frau, warum weinst du?“, fragen sie. „Sie haben meinen Herrn weggenommen“, sagt Maria, „und ich weiß nicht, wohin sie ihn gelegt haben.“',
        'Da dreht sie sich um und sieht jemanden stehen. Es ist Jesus, aber sie weiß es nicht. „Frau, warum weinst du? Wen suchst du?“, fragt er. Maria hält ihn für den Gärtner. „Herr, wenn du ihn weggetragen hast, dann sag mir, wohin du ihn gelegt hast. Ich will ihn holen.“',
        '„Maria!“, sagt Jesus. Da wendet sie sich ihm zu. „Rabbuni!“, ruft sie, das heißt Meister. „Geh zu meinen Brüdern“, sagt Jesus, „und sag ihnen: Ich gehe hinauf zu meinem Vater und zu eurem Vater, zu meinem Gott und zu eurem Gott.“',
        'Maria Magdalena geht zu den Jüngern. „Ich habe den Herrn gesehen!“, erzählt sie, und sie sagt ihnen, was er zu ihr gesagt hat.'
      ],
      // Spiel: Botengang (botengang, neu)
      task: { kind: 'botengang', hint: 'Bring Maria durch die Gassen zu den Jüngern.', errand: BOTENGANG },
      questions: [
        { q: 'Wofür hält Maria den Mann am Grab?', options: ['für den Gärtner', 'für einen Soldaten', 'für einen Händler'], answer: 0 },
        { q: 'Was ruft Jesus?', options: ['Maria!', 'Petrus!', 'Thomas!'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Zwei Wanderer',
      ref: 'Lukas 24,13–27',
      text: [
        'Am selben Tag gehen zwei Jünger nach Emmaus, einem Dorf ein Stück von Jerusalem entfernt. Einer von ihnen heißt Kleopas. Unterwegs reden sie über alles, was in diesen Tagen geschehen ist.',
        'Da kommt Jesus selbst dazu und geht mit ihnen, aber sie erkennen ihn nicht. „Worüber redet ihr unterwegs?“, fragt er. Traurig bleiben die beiden stehen.',
        '„Du bist wohl der Einzige in Jerusalem, der nicht weiß, was dort geschehen ist“, sagt Kleopas. „Was denn?“, fragt Jesus. „Das mit Jesus von Nazareth“, sagen sie. „Er war ein Prophet, mächtig in Taten und Worten. Er wurde gekreuzigt. Wir hatten gehofft, dass er Israel erlöst. Heute früh waren Frauen am Grab. Sie haben seinen Leib nicht gefunden und sagen, er lebe.“',
        '„Musste der Christus nicht das alles leiden und dann in seine Herrlichkeit gehen?“, fragt Jesus. Und er erklärt ihnen, was in der ganzen Schrift von ihm steht, von Mose an und durch alle Propheten.'
      ],
      // Spiel: Wanderweg (wanderweg, neu)
      task: { kind: 'wanderweg', hint: 'Führe die zwei Wanderer nach Emmaus.', wander: WANDERWEG },
      questions: [
        { q: 'Wohin gehen die zwei Jünger?', options: ['nach Emmaus', 'nach Bethlehem', 'ans Meer'], answer: 0 },
        { q: 'Was erklärt Jesus ihnen?', options: ['was in der Schrift von ihm steht', 'wie man Fische fängt', 'den Weg nach Jerusalem'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-b.webp`,
      title: 'Das Brot in Emmaus',
      ref: 'Lukas 24,28–35',
      text: [
        'Die beiden kommen nah an das Dorf, in das sie wollen. Jesus tut so, als ginge er weiter. Aber sie bitten ihn: „Bleib bei uns! Es wird Abend, und der Tag geht zu Ende.“ Da geht er mit hinein, um bei ihnen zu bleiben.',
        'Am Tisch nimmt Jesus das Brot, dankt, bricht es und gibt es ihnen. Da werden ihre Augen geöffnet, und sie erkennen ihn. Aber er verschwindet vor ihnen. „Brannte nicht unser Herz“, sagen sie zueinander, „als er unterwegs mit uns redete und uns die Schrift öffnete?“',
        'Noch in derselben Stunde stehen sie auf und gehen zurück nach Jerusalem. Dort sind die Jünger versammelt. „Der Herr ist wirklich auferstanden“, sagen die ihnen, „und Simon ist er erschienen!“ Da erzählen die beiden, was auf dem Weg geschehen ist und woran sie ihn erkannt haben: Er hat das Brot gebrochen.'
      ],
      // Spiel: Tisch decken (tischdecken, neu)
      task: { kind: 'tischdecken', hint: 'Deck den Tisch in Emmaus.', table: TISCH },
      questions: [
        { q: 'Was sagen die beiden zu Jesus vor dem Dorf?', options: ['Bleib bei uns!', 'Geh weiter!', 'Wir kennen dich nicht.'], answer: 0 },
        { q: 'Woran erkennen sie Jesus?', options: ['Er bricht das Brot.', 'Er singt ein Lied.', 'Er zeigt ihnen ein Netz.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05-b.webp`,
      title: 'Friede sei mit euch',
      ref: 'Lukas 24,36–43; Johannes 20,19–20',
      text: [
        'In Jerusalem reden die Jünger noch darüber, was die beiden aus Emmaus erzählt haben. Es ist Abend, und die Türen sind verschlossen, denn sie haben Angst. Plötzlich steht Jesus mitten unter ihnen. „Friede sei mit euch!“, sagt er.',
        'Die Jünger erschrecken und fürchten sich. Sie meinen, sie sehen einen Geist. „Warum seid ihr so erschrocken?“, fragt Jesus. „Seht meine Hände und meine Füße: Ich bin es selbst! Fasst mich an und seht: Ein Geist hat kein Fleisch und keine Knochen, wie ihr seht, dass ich sie habe.“ Und er zeigt ihnen seine Hände. Da werden die Jünger froh, dass sie den Herrn sehen.',
        'Aber vor lauter Freude können sie es noch nicht glauben und wundern sich. „Habt ihr etwas zu essen?“, fragt Jesus. Sie geben ihm ein Stück gebratenen Fisch. Er nimmt es und isst es vor ihren Augen.'
      ],
      // Spiel: Fensterläden (fensterlaeden, neu)
      task: { kind: 'fensterlaeden', hint: 'Öffne alle Fensterläden des Saals.', shutters: FENSTER },
      questions: [
        { q: 'Was sagt Jesus, als er mitten unter die Jünger tritt?', options: ['Friede sei mit euch!', 'Fürchtet euch!', 'Geht nach Hause!'], answer: 0 },
        { q: 'Was isst Jesus vor ihnen?', options: ['ein Stück gebratenen Fisch', 'ein Stück Brot', 'eine Schale Trauben'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Thomas',
      ref: 'Johannes 20,24–29',
      text: [
        'Thomas, einer von den Zwölfen, den man Zwilling nennt, war nicht dabei, als Jesus zu den Jüngern kam. „Wir haben den Herrn gesehen!“, erzählen sie ihm. Aber Thomas antwortet: „Ich glaube es nicht, wenn ich ihn nicht selbst sehe.“',
        'Acht Tage später sind die Jünger wieder im Haus beieinander, und diesmal ist Thomas bei ihnen. Die Türen sind verschlossen. Da tritt Jesus mitten unter sie. „Friede sei mit euch!“, sagt er.',
        'Dann wendet er sich an Thomas. „Sieh meine Hände“, sagt er, „und sei nicht ungläubig, sondern gläubig!“',
        'Thomas antwortet: „Mein Herr und mein Gott!“',
        '„Du glaubst, weil du mich gesehen hast“, sagt Jesus. „Selig sind, die nicht sehen und doch glauben!“'
      ],
      // Spiel: Unterschiede finden (unterschied, bekannt aus Mose)
      task: { kind: 'unterschied', hint: 'Finde, was im linken Bild fehlt.', diff: UNTERSCHIED },
      questions: [
        { q: 'Was sagt Thomas den anderen Jüngern?', options: ['Ich glaube es nicht, wenn ich ihn nicht selbst sehe.', 'Ich glaube euch sofort.', 'Ich will nichts davon hören.'], answer: 0 },
        { q: 'Was sagt Thomas zu Jesus?', options: ['Mein Herr und mein Gott!', 'Ich kenne dich nicht!', 'Geh weg!'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07-b.webp`,
      title: 'Der Fischzug am See',
      ref: 'Johannes 21,1–14',
      text: [
        'Danach zeigt sich Jesus seinen Jüngern noch einmal, am See von Tiberias. Sieben von ihnen sind dort beieinander, unter ihnen Simon Petrus und Thomas. „Ich gehe fischen“, sagt Petrus. „Wir kommen mit“, sagen die anderen. Die ganze Nacht fangen sie nichts.',
        'Am Morgen steht jemand am Ufer, aber die Jünger wissen nicht, dass es Jesus ist. „Kinder, habt ihr nichts zu essen?“, ruft er. „Nein“, rufen sie zurück. „Werft das Netz auf der rechten Seite des Bootes aus“, sagt er, „dann werdet ihr etwas fangen.“ Sie werfen es aus und können es vor lauter Fischen nicht mehr einziehen.',
        '„Es ist der Herr!“, sagt der Jünger, den Jesus liebhat, zu Petrus. Da zieht Petrus sich den Mantel über und springt ins Wasser. Die anderen kommen im Boot nach. Am Ufer brennt ein Kohlenfeuer, und Fisch und Brot liegen darauf. „Bringt von den Fischen, die ihr gefangen habt“, sagt Jesus. Petrus zieht das Netz an Land, hundertdreiundfünfzig große Fische, und das Netz reißt nicht. „Kommt und esst!“, sagt Jesus, und er gibt ihnen Brot und Fisch.'
      ],
      // Spiel: Das Netz zur Rechten (fischzug, neu)
      task: { kind: 'fischzug', hint: 'Wirf das Netz dorthin, wo die Fische schwimmen.', fischzug: FISCHZUG },
      questions: [
        { q: 'Was fangen die Jünger in der Nacht?', options: ['nichts', 'sehr viele Fische', 'nur kleine Fische'], answer: 0 },
        { q: 'Was tut Petrus, als er hört: Es ist der Herr?', options: ['Er springt ins Wasser.', 'Er versteckt sich im Boot.', 'Er läuft in die Berge.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Weide meine Lämmer',
      ref: 'Johannes 21,15–19',
      text: [
        'Das Essen am Kohlenfeuer ist vorbei. Da wendet sich Jesus an Simon Petrus. „Simon, Sohn des Jona“, fragt er, „hast du mich lieb, mehr als diese hier?“ „Ja, Herr“, antwortet Petrus, „du weißt, dass ich dich liebhabe.“ „Weide meine Lämmer!“, sagt Jesus.',
        'Noch einmal fragt er: „Simon, Sohn des Jona, hast du mich lieb?“ „Ja, Herr, du weißt, dass ich dich liebhabe.“ „Weide meine Schafe!“, sagt Jesus.',
        'Zum dritten Mal fragt er: „Simon, Sohn des Jona, hast du mich lieb?“ Petrus wird traurig, weil Jesus ihn zum dritten Mal fragt. „Herr, du weißt alles“, sagt er, „du weißt, dass ich dich liebhabe.“ „Weide meine Schafe!“, sagt Jesus.',
        'Dann sagt er zu Petrus: „Folge mir nach!“'
      ],
      // Spiel: Die Lämmer führen (weiden, neu)
      task: { kind: 'weiden', hint: 'Führe die Lämmer zur Weide.', graze: WEIDEN },
      questions: [
        { q: 'Was fragt Jesus Petrus?', options: ['Hast du mich lieb?', 'Willst du zurück nach Hause?', 'Hast du Hunger?'], answer: 0 },
        { q: 'Was sagt Jesus zum Schluss zu Petrus?', options: ['Folge mir nach!', 'Bleib hier am Feuer!', 'Fahre zurück zum Boot!'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Ihr seid Zeugen',
      ref: 'Lukas 24,44–53',
      text: [
        'Jesus sagt zu seinen Jüngern: „Alles muss erfüllt werden, was über mich im Gesetz des Mose, in den Propheten und in den Psalmen geschrieben steht.“ Dann öffnet er ihnen das Verständnis, sodass sie die Schrift verstehen.',
        '„So steht es geschrieben“, sagt er. „Der Christus muss leiden und am dritten Tag von den Toten auferstehen. In seinem Namen soll allen Völkern Umkehr und Vergebung der Sünden verkündet werden, und das beginnt in Jerusalem. Ihr aber seid Zeugen von alledem. Ich will auf euch senden, was mein Vater verheißen hat. Bleibt in der Stadt Jerusalem, bis ihr mit der Kraft aus der Höhe ausgerüstet werdet.“',
        'Dann führt Jesus sie hinaus bis nach Bethanien. Er hebt die Hände und segnet sie. Während er sie segnet, verlässt er sie und fährt auf in den Himmel. Die Jünger beten ihn an und gehen mit großer Freude zurück nach Jerusalem. Dort sind sie jeden Tag im Tempel und loben Gott.'
      ],
      // Spiel: Licht weitergeben (lichtweg, neu)
      task: { kind: 'lichtweg', hint: 'Gib das Licht weiter bis nach Jerusalem.', flame: LICHT },
      questions: [
        { q: 'Was tut Jesus dort mit erhobenen Händen?', options: ['Er segnet sie.', 'Er ruft Soldaten.', 'Er baut ein Zelt.'], answer: 0 },
        { q: 'Wie gehen die Jünger nach Jerusalem zurück?', options: ['mit großer Freude', 'mit Angst', 'traurig und schweigend'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was ist mit dem Stein vor dem Grab?', options: ['Er ist weggerollt.', 'Er liegt noch davor.', 'Er ist zerbrochen.'], answer: 0 },
    { q: 'Wer geht mit ihnen, ohne dass sie ihn erkennen?', options: ['Jesus', 'Petrus', 'ein Hirte'], answer: 0 },
    { q: 'Woran erkennen sie Jesus?', options: ['Er bricht das Brot.', 'Er singt ein Lied.', 'Er zeigt ihnen ein Netz.'], answer: 0 },
    { q: 'Was sagt Thomas zu Jesus?', options: ['Mein Herr und mein Gott!', 'Ich kenne dich nicht!', 'Geh weg!'], answer: 0 },
    { q: 'Wohin sollen sie das Netz werfen?', options: ['auf die rechte Seite des Bootes', 'auf die linke Seite des Bootes', 'ans Ufer'], answer: 0 },
    { q: 'Was sagt Jesus zum Schluss zu Petrus?', options: ['Folge mir nach!', 'Bleib hier am Feuer!', 'Fahre zurück zum Boot!'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of ostern.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
// stages whose German recording is to be made again (listed here while the new file is not in; the old file stays in the folder). Empty: nothing is waiting.
const TO_RERECORD = new Set<number>([])
for (const s of ostern.stages) {
  const file = `audio/abenteuer/ostern/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) || TO_RERECORD.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the garden in the morning light, the way to Emmaus, breakfast at the lake); they follow one another at random
ostern.music = [
  'audio/abenteuer/ostern/musik-garten-v1.mp3',
  'audio/abenteuer/ostern/musik-emmaus-v1.mp3',
  'audio/abenteuer/ostern/musik-see-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(ostern, osternEn)
