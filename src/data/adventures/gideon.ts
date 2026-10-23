/**
 * Abenteuer "Gideon" (Richter 4–8) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Der Kleinste und die Dreihundert". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Gideon/ENTWURF_Gideon.md (Phase 1, 20.10.2026, Prüfdurchgang am selben Abend), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Säcke in die Höhle schieben (neu), 3 Spreu im Wind (neu), 4 Das Wort legen (neu),
 * 5 nur Quiz, 6 Die Nacht vergeht (neu), 7 Wer geht heim? (neu), 8 Wimmelbild (alt), 9 Leise den Hang hinab (neu), 10 Auf Gideons Zeichen (neu), 11 nur Quiz, 12 Memory (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/gideon/, images/abenteuer/spiele/gideon/<spiel>/, audio/abenteuer/gideon/.
 *
 * STAND 21.10.2026: alle neun Spiele sind gebaut (die Bilder der Spiele fehlen noch, bis dahin stehen Platzhalter, siehe `NOT_PAINTED_YET` in `utils/journeyFiles.ts`); die Etappen 1, 5 und 11 bleiben Quiz. Die Etappenbilder sind noch die von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit allen zwölf Stationen und dem Ziel (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Deutsche Vorlese-Aufnahmen: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht, die englische App liest mit der Gerätestimme. Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CaveGame, CueGame, DewGame, FindGame, Journey, MemoryGame, SneakGame, SwitchGame, WinnowGame, WordGame } from '@/types/adventure'
import { josef } from './josef'
import { GIDEON_PATH } from './gideonPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { gideonEn } from './en/gideon.en'

// Etappenbilder (vorläufig Variante a der neuen Bilder; Anton wählt später a/b): `images/abenteuer/gideon/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/gideon/'

const G = 'images/abenteuer/spiele/gideon/'

/**
 * Etappe 4, "Das Wort legen": ein Satzanfang aus dem Text als Hinweis, darunter Kästchen für die Buchstaben des gesuchten Wortes und Kacheln, eine davon überzählig (Bildauftrag: keiner, die Buchstaben sind Text).
 * Hintergrund = das Etappenbild 4, von der App weichgezeichnet. Jede Sprache hat ihre eigenen Wörter und Hinweise (Runde 1 Friede / Peace, Runde 2 Felsen / Rock); beide Wörter stehen wörtlich im Text der Etappe.
 */
const WORT: WordGame = {
  background: `${PICS}etappe-bild-04.webp`,
  rounds: [
    { hint: 'Wie nennt Gideon den Altar? Gott ist der …', word: 'FRIEDE', extra: ['T'] },
    { hint: 'Worauf stellt Gideon das Essen? Auf den …', word: 'FELSEN', extra: ['A'] }
  ]
}

/**
 * Etappe 8, "Am Wasser" (Wimmelbild, alte Mechanik): am Bachufer knien zehn Männer und trinken mit dem Mund direkt aus dem Wasser (Richter 7,5, neu gemalt 21.10.2026, Szene b), und fünf andere führen das Wasser mit der Hand zum Mund; einige stehen halb hinter Schilf und Busch (Bildauftrag G34; eigene Szene
 * `wimmel/wasser-szene.webp`). Plan v3: zwei Männerbilder, die sich abwechseln, und zwei Deckungsbilder an drei Plätzen. Die Lagen (Mitte der Unterkante und Breite, Prozent der Szene) sind am gemalten Bild abgelesen (`wimmel-messung-G34b.json` als Vorschlag, an der Szene mit den Sprites zusammen neu gesetzt: Männer frei auf Sand, nicht an den knienden; die Männer als Fußpunkte umgerechnet auf die Unterkante der Datei; die drei Deckungen halbieren drei Männer).
 * Bilder (gemalt, 21.10.2026): `wimmel/wasser-szene.webp` 1100 × 1467, `finde-a.webp`, `finde-b.webp` je ca. 140 × 220, `deck-schilf.webp`, `deck-busch.webp` je 330 × 260.
 */
const WIMMEL: FindGame = {
  labels: Array.from({ length: 5 }, () => 'Mann am Bach, der das Wasser mit der Hand zum Mund führt'),
  doneText: 'Du hast alle fünf Männer gefunden, die das Wasser mit der Hand zum Mund führen!',
  scene: `${G}wimmel/wasser-szene.webp`,
  finds: [
    { image: `${G}wimmel/finde-a.webp`, x: 19, y: 25.8, w: 12.7 },
    { image: `${G}wimmel/finde-b.webp`, x: 89.5, y: 33.5, w: 12.7 },
    { image: `${G}wimmel/finde-a.webp`, x: 15.4, y: 51.7, w: 12.7 },
    { image: `${G}wimmel/finde-b.webp`, x: 90.8, y: 64.5, w: 12.7 },
    { image: `${G}wimmel/finde-a.webp`, x: 34.9, y: 81.4, w: 12.7 }
  ],
  covers: [
    { image: `${G}wimmel/deck-schilf.webp`, x: 19, y: 27.3, w: 23 },
    { image: `${G}wimmel/deck-schilf.webp`, x: 15.4, y: 53.2, w: 20 },
    { image: `${G}wimmel/deck-busch.webp`, x: 34.9, y: 82.9, w: 23 }
  ]
}

/** Etappe 12, "Rückblick" (Memory, alte Mechanik): fünf Paare aus den Etappen des Abenteuers (das Horn entfällt, es kommt im Zeichen-Spiel vor), zu jedem Treffer ein Satz aus dem Text. Bilder (gemalt, 21.10.2026): `memory/karte-*.webp` und `rueck.webp`, je 256 × 256 (Bildauftrag G37). */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-palme.webp`, text: 'Die Palme: Hier sitzt Debora und spricht Recht.' },
    { image: `${G}memory/karte-kelter.webp`, text: 'Die Kelter: Hier drischt Gideon heimlich Weizen.' },
    { image: `${G}memory/karte-fell.webp`, text: 'Das Fell: Erst ist nur das Fell nass, dann nur der Boden.' },
    { image: `${G}memory/karte-altar.webp`, text: 'Der Altar: Gott ist der Friede.' },
    { image: `${G}memory/karte-krug.webp`, text: 'Der Krug: Darin steckt eine Fackel.' }
  ]
}

/**
 * Etappe 6, "Die Nacht vergeht": der Mond wird am Regler vom Abend zum Morgen gezogen, der Himmel tönt sich dabei; am Morgen funkelt der Tau, den das Kind antippt (Bildauftrag G32; eigener Hintergrund
 * `tau/tenne.webp`, neutral beleuchtet). Plan v3: Runde 1 "die erste Nacht": Tau nur auf dem Fell (vier Tropfen), Runde 2 "die zweite Nacht": Tau nur auf dem Boden ringsum (sechs Tropfen). Fellrechteck und Tropfen
 * (Prozent der Tenne) sind am gemalten Bild abgelesen (`tau-messung.json`, Variante a bzw. b, mit den Sprites zusammen angesehen).
 * Bilder (gemalt, 21.10.2026): `tau/tenne.webp` 1200 × 900, `fell.webp` 420 × 300, `schale.webp` 240 × 160, `mond.webp`, `sonne.webp` je 120 × 120 (alle außer der Tenne transparent).
 */
const TAU: DewGame = {
  background: `${G}tau/tenne.webp`,
  fleece: `${G}tau/fell.webp`,
  bowl: `${G}tau/schale.webp`,
  moon: `${G}tau/mond.webp`,
  sun: `${G}tau/sonne.webp`,
  fleeceBox: { x: 30, y: 34, w: 40, h: 38.1 },
  rounds: [
    { hint: 'Die erste Nacht: Ziehe den Mond bis zum Morgen. Dann liegt Tau auf dem Fell. Tippe die Tropfen an.', wet: 'fleece', spots: [[42, 48], [52, 46], [59, 54], [46, 61]] },
    { hint: 'Die zweite Nacht: Diesmal ist das Fell trocken. Wo liegt der Tau jetzt?', wet: 'ground', spots: [[22, 43], [22, 64], [44, 75.5], [65, 74.5], [79, 46], [70, 30]] }
  ]
}

/**
 * Etappe 3, "Spreu im Wind": in der Worfelwanne liegen Körner und leichte Spreu, ein Regler stellt den Wind ein; die Spreu fliegt bei mittlerem Wind davon, bei zu starkem Wind auch Körner (Bildauftrag G31; Hintergrund =
 * das Etappenbild 3, von der App weichgezeichnet). Plan v3: Runde 1 acht Spreuteile und sechs Körner, breiter richtiger Bereich (35 bis 75 %); Runde 2 zehn Spreuteile, sechs Körner, schmalerer Bereich (42 bis 64 %), keine Böe.
 * Die Wanne (`trayBox`, Bildschirm-Prozent) ist am gemalten Bild abgelesen (`worfeln-messung.json`).
 * Bilder (gemalt, 21.10.2026): `worfeln/wanne.webp` 480 × 300, `korn.webp`, `spreu.webp` je 64 × 64, `regler-griff.webp` 120 × 120 (alle transparent).
 */
const WORFELN: WinnowGame = {
  background: `${PICS}etappe-bild-03.webp`,
  tray: `${G}worfeln/wanne.webp`,
  grain: `${G}worfeln/korn.webp`,
  chaffImage: `${G}worfeln/spreu.webp`,
  handle: `${G}worfeln/regler-griff.webp`,
  trayBox: { x: 23.75, y: 44, w: 40.5, h: 38 },
  rounds: [
    { hint: 'Stelle den Wind ein. Die leichte Spreu soll wegfliegen, die schweren Körner sollen liegen bleiben.', chaff: 8, grains: 6, window: [35, 75], gust: 0, seed: 31 },
    { hint: 'Jetzt ist der richtige Wind enger. Gib acht auf die Körner.', chaff: 10, grains: 6, window: [42, 64], gust: 0, seed: 47 }
  ]
}

/**
 * Etappe 7, "Wer geht heim?": die Männer kommen den Pfad herab und stehen an der Gabelung; eine Sprechblase zeigt ein Haus (will heim) oder ein Horn (bleibt); das Kind stellt die Weiche, links ins Lager, rechts heim
 * (Bildauftrag G33; eigener Hintergrund `weiche/weiche.webp`). Die Zeichen sind eine Spielhilfe, keine Aussage der Bibel. Plan v3: zwei Männerbilder, die sich abwechseln, und ein Hebelbild (der linke Hebel ist das
 * rechte gespiegelt). Runde 1 fünf Männer, die Blase bleibt; Runde 2 sechs Männer, zwei warten, die Blase geht nach zwei Sekunden (Antippen des Mannes zeigt sie wieder). Die Gabelung `fork` (Prozent des Bildes) ist
 * am gemalten Bild abgelesen (`weiche-messung.json`) und mit den Männern zusammen angesehen.
 * Bilder (gemalt, 21.10.2026): `weiche/weiche.webp` 900 × 1200, `mann-a.webp`, `mann-b.webp` je 140 × 220, `blase-haus.webp`, `blase-horn.webp` je 120 × 120, `hebel.webp` 200 × 200
 * (alle außer dem Hintergrund transparent).
 */
const WEICHE: SwitchGame = {
  background: `${G}weiche/weiche.webp`,
  men: [
    { id: 'mann-a', image: `${G}weiche/mann-a.webp`, w: 14 },
    { id: 'mann-b', image: `${G}weiche/mann-b.webp`, w: 14 }
  ],
  bubbleHome: `${G}weiche/blase-haus.webp`,
  bubbleHorn: `${G}weiche/blase-horn.webp`,
  leverRight: `${G}weiche/hebel.webp`,
  fork: [50, 66.7],
  rounds: [
    { hint: 'Wer ein Haus zeigt, will heim: Weiche nach rechts. Wer ein Horn zeigt, bleibt: Weiche nach links.', men: ['home', 'stay', 'stay', 'home', 'home'], queue: 1 },
    { hint: 'Jetzt verschwindet die Sprechblase bald. Tippe den Mann an, dann ist sie wieder da.', men: ['stay', 'home', 'home', 'stay', 'home', 'stay'], hideBubbleMs: 2000, queue: 2 }
  ]
}

/**
 * Etappe 10, "Auf Gideons Zeichen": das Kind wartet auf das Horn und antwortet dann zuerst mit Gideons Krug, danach mit den Gruppen links und rechts (Bildauftrag G36; eigener Hintergrund `zeichen/tal-nacht.webp`).
 * Das Horn leuchtet auch (für Kinder ohne Ton). Plan v3: Runde 1 zwei Zeichen; Runde 2 drei Zeichen und zwei falsche Zeichen (die Eule, zweimal), die nicht beantwortet werden dürfen. Die drei Gruppen sind ein Bild
 * (`gruppe.webp`) an drei Plätzen. Lagen (Prozent des Bildes) sind am gemalten Bild abgelesen (`zeichen-messung.json`, Variante a bzw. b, mit den Sprites zusammen angesehen).
 * Bilder (gemalt, 21.10.2026): `zeichen/tal-nacht.webp` 1200 × 900, `gruppe.webp` 260 × 260, `gideon-krug.webp` 200 × 260, `horn.webp` 200 × 200, `eule.webp` 140 × 140,
 * `scherben.webp` 180 × 120 (alle außer dem Tal transparent).
 */
const ZEICHEN: CueGame = {
  background: `${G}zeichen/tal-nacht.webp`,
  groups: [
    { id: 'links', image: `${G}zeichen/gruppe.webp`, x: 18, y: 80, jars: 3 },
    { id: 'rechts', image: `${G}zeichen/gruppe.webp`, x: 82, y: 80, jars: 3 }
  ],
  leader: { id: 'gideon', image: `${G}zeichen/gideon-krug.webp`, x: 50, y: 74, jars: 1 },
  front: { id: 'vorn', image: `${G}zeichen/gruppe.webp`, x: 50, y: 96, jars: 3 },
  horn: `${G}zeichen/horn.webp`,
  decoyImages: { owl: `${G}zeichen/eule.webp` },
  shards: `${G}zeichen/scherben.webp`,
  rounds: [
    { hint: 'Warte auf das Horn. Dann tippe Gideons Krug, danach die Gruppen links und rechts.', signals: 2, decoys: [], waitMs: [2000, 4000] },
    { hint: 'Gib acht: Eine Eule ruft. Das ist kein Zeichen. Antworte nur auf das Horn.', signals: 3, decoys: ['owl', 'owl'], waitMs: [2500, 4500] }
  ]
}

/**
 * Etappe 2, "Säcke in die Höhle schieben": der Grundriss einer Höhle von oben; ein kleiner Mann schiebt Kornsäcke in die Nischen (nur schieben, nie ziehen, ein Sack zur Zeit; Bildauftrag G30; eigener Hintergrund
 * `hoehle/hoehle-plan.webp`). Plan v3: beide Runden 5 × 4 ohne Felsen; Runde 1 zwei Säcke (acht Schritte, drei Schiebungen), Runde 2 drei Säcke (zwölf Schritte, fünf Schiebungen); beide Rätsel sind lösbar (Breitensuche
 * im Test). Plätze sind (Spalte, Zeile). Der Bereich `area` (Prozent des Bildes) für das Raster ist am gemalten Bild abgelesen (`hoehle-messung.json`).
 * Bilder (gemalt, 21.10.2026): `hoehle/hoehle-plan.webp` 900 × 1200, `sack.webp`, `nische.webp` je 120 × 120, `mann.webp` 120 × 160 (alle außer dem Plan transparent).
 */
const HOEHLE: CaveGame = {
  background: `${G}hoehle/hoehle-plan.webp`,
  man: `${G}hoehle/mann.webp`,
  sack: `${G}hoehle/sack.webp`,
  niche: `${G}hoehle/nische.webp`,
  area: { x: 16.7, y: 30, w: 66.7, h: 40 },
  rounds: [
    { hint: 'Schiebe die Säcke in die leuchtenden Nischen. Du kannst nur schieben, nicht ziehen.', cols: 5, rows: 4, walls: [], niches: [[2, 0], [4, 0]], sacks: [[2, 1], [3, 1]], man: [4, 3] },
    { hint: 'Jetzt drei Säcke. Überlege, bevor du schiebst.', cols: 5, rows: 4, walls: [], niches: [[4, 2], [1, 3], [3, 0]], sacks: [[1, 2], [1, 1], [3, 2]], man: [2, 2] }
  ]
}

/**
 * Etappe 9, "Leise den Hang hinab": Gideon und Pura werden auf einem Pfad von Schattenplatz zu Schattenplatz geführt, Wächter mit Laternen lassen Lichtkegel hin und her schwingen; im Schatten warten ist nie ein Fehler
 * (Bildauftrag G35; eigener Hintergrund `schleichen/hang-nacht.webp`, 3:4). Plan v3: Runde 1 zwei Wächter, ruhige Schwünge und zwei Felsen; Runde 2 drei Wächter, ungleiche Schwünge und drei Felsen. Es gibt nur ein Wächterbild. Die Lagen (Prozent des Bildes: Pfad,
 * Schattenplätze, Wächter) sind am gemalten Bild abgelesen (`schleichen-messung.json`, Variante a bzw. b, mit den Sprites zusammen angesehen); die Daten sind so gewählt, dass jeder Abschnitt in jeder Runde zu bestimmten Zeiten frei ist (Test).
 * Bilder (gemalt, 21.10.2026): `schleichen/hang-nacht.webp` 900 × 1200, `paar.webp` 140 × 180, `waechter.webp` 140 × 200 (alle außer dem Hang transparent).
 */
const SCHLEICHEN: SneakGame = {
  background: `${G}schleichen/hang-nacht.webp`,
  pair: `${G}schleichen/paar.webp`,
  watcherImages: [`${G}schleichen/waechter.webp`, `${G}schleichen/waechter-b.webp`],
  // der gemalte Pfad (am Bild mit dem Pfad verglichen), die Felsen stehen am Pfad: Runde 1 am dritten und am Ende, Runde 2 am ersten, am vierten und am Ende
  path: [[6.8, 9.0], [12.0, 13.6], [16.7, 18.0], [22.6, 20.1], [28.5, 21.2], [33.9, 22.7], [37.1, 25.8], [32.9, 28.8], [34.1, 31.0], [38.7, 34.4], [44.0, 36.1], [49.2, 37.8], [52.0, 41.1], [49.8, 44.1], [44.6, 46.0], [39.3, 47.9], [37.4, 50.8], [39.5, 53.0], [43.8, 56.1], [48.9, 58.3], [54.4, 59.9], [59.9, 61.4], [65.1, 63.6], [70.3, 65.8], [74.0, 67.8], [75.5, 72.0], [71.5, 76.3], [66.8, 79.7], [66.5, 83.7], [68.0, 87.5], [71.3, 90.2]],
  rounds: [
    {
      hint: 'Führe Gideon und Pura von Fels zu Fels. Warte im Schatten, wenn ein Lichtkegel kommt.',
      stops: [[38.7, 34.4], [71.3, 90.2]],
      watchers: [
        { x: 12, y: 62, from: -14, to: 41, periodMs: 6400, reach: 46 },
        { x: 15, y: 45, from: -141, to: -71, periodMs: 5000, reach: 38 }
      ]
    },
    {
      hint: 'Jetzt sind es drei Wächter, und ihr Licht schwingt unregelmäßig. Hab Geduld im Schatten.',
      stops: [[37, 25.9], [55.1, 60.1], [71.3, 90.2]],
      watchers: [
        { x: 84, y: 60, from: 163, to: 203, periodMs: 5200, reach: 34 },
        { x: 86, y: 80, from: -156, to: -86, periodMs: 5200, reach: 46 },
        { x: 15, y: 45, from: -131, to: -61, periodMs: 4200, reach: 34 }
      ]
    }
  ]
}

export const gideon: Journey = {
  id: 'gideon',
  title: 'Gideon',
  subtitle: 'Der Kleinste und die Dreihundert',
  age: '8-10',
  downloadMb: 12, // gemessen am 21.10.2026 mit den eigenen Etappenbildern (Variante a) und der eigenen Karte; ohne die noch fehlenden Aufnahmen
  medal: 'images/abenteuer/gideon/medaille-v3.webp', // Der Krug mit dem Licht (Tonkrug mit Fackel, Horn, Lichterkette in der Nacht, Goldring)
  // Geschenk-Ausmalbild: Die Nacht mit den Krügen und Fackeln (Männer mit Horn und Krug auf dem Hügel bei Nacht) (Konturzeichnung)
  gift: { title: 'Die Nacht mit den Krügen und Fackeln', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, erzählendes Panorama v4 (OpenAI-Bildmodell gpt-image-2.5-sunburst, 23.10.2026) mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus gideonPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/gideon/karte-pano-v4-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0888, y: 0.3277, d: 0.0339 },
      { x: 0.1514, y: 0.5461, d: 0.0339 },
      { x: 0.2069, y: 0.1578, d: 0.0339 },
      { x: 0.3109, y: 0.2609, d: 0.0339 },
      { x: 0.3593, y: 0.4248, d: 0.0339 },
      { x: 0.4118, y: 0.6493, d: 0.0339 },
      { x: 0.5026, y: 0.2306, d: 0.0339 },
      { x: 0.6106, y: 0.3034, d: 0.0339 },
      { x: 0.6712, y: 0.2002, d: 0.0339 },
      { x: 0.7923, y: 0.1396, d: 0.0339 },
      { x: 0.8781, y: 0.3277, d: 0.0339 },
      { x: 0.9255, y: 0.3155, d: 0.0339 }
    ],
    exam: { x: 0.9830, y: 0.2852, d: 0.0339 },
    path: GIDEON_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Debora und Barak',
      ref: 'Richter 4,1–10.14–15; 5,31',
      text: [
        'Zwanzig Jahre lang bedrängt der König Jabin die Israeliten, bis sie zu Gott rufen.',
        'In dieser Zeit ist Debora Richterin in Israel, eine Prophetin, die Gottes Wort weitergibt. Sie sitzt unter einer Palme, und die Leute kommen zu ihr, damit sie ihnen Recht spricht.',
        'Eines Tages ruft Debora den Barak: „Hat Gott dir nicht gesagt: Geh mit zehntausend Männern auf den Berg Tabor?“ „Wenn du mit mir gehst, gehe ich“, antwortet Barak. „Ich gehe mit dir“, sagt Debora.',
        'Auf dem Tabor ruft Debora: „Auf, das ist der Tag! Gott zieht vor dir her!“ Barak zieht hinab, und Gott bringt das Heer des Königs in Verwirrung. Es flieht. Danach hat das Land vierzig Jahre Ruhe.'
      ],
      // nur Quiz (ernst bzw. ruhig, nichts wird gespielt); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Unter welchem Baum sitzt Debora?', options: ['unter einer Palme', 'unter einer Eiche', 'unter einer Zeder'], answer: 0 },
        { q: 'Was sagt Barak zu Debora?', options: ['„Wenn du mit mir gehst, gehe ich.“', '„Ich gehe allein.“', '„Ich bleibe hier.“'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Die Midianiter kommen',
      ref: 'Richter 6,1–10',
      text: [
        'Wieder vergessen die Israeliten Gott. Sieben Jahre lang sind die Midianiter stärker als sie.',
        'Jedes Jahr, wenn das Korn reif wird, kommen sie mit ihren Zelten und Kamelen. Es sind so viele wie Heuschrecken, und ihre Kamele kann niemand zählen.',
        'Sie fressen die Felder kahl und lassen den Israeliten nichts zu essen übrig. Auf den Äckern bleibt kein Halm zum Ernten.',
        'Die Israeliten verstecken sich in Höhlen und Felsspalten und bauen sich Festungen in den Bergen. Sie sind arm geworden und haben Angst. Da schreien sie zu Gott um Hilfe. Gott schickt ihnen einen Propheten: „So spricht Gott: Ich habe euch aus Ägypten geführt, aber ihr habt nicht auf meine Stimme gehört.“'
      ],
      // Spiel: Säcke in die Höhle schieben (hoehle, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'hoehle', hint: 'Schiebe die Säcke in die Nischen der Höhle.', cave: HOEHLE },
      questions: [
        { q: 'Wie lange sind die Midianiter stärker als Israel?', options: ['sieben Jahre', 'zwanzig Jahre', 'vierzig Jahre'], answer: 0 },
        { q: 'Womit sind die Midianiter vergleichbar?', options: ['mit einem Schwarm Heuschrecken', 'mit einer Schafherde', 'mit einem Fluss'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Gideon in der Kelter',
      ref: 'Richter 6,11–16',
      text: [
        'In Ophra steht eine große Eiche. In der Nähe drischt ein Mann namens Gideon in einer Kelter heimlich Weizen. Eine Kelter ist ein Becken im Fels, in dem man sonst Trauben presst. Hier sieht ihn kein Midianiter.',
        'Da setzt sich ein Engel Gottes unter die Eiche. „Gott ist mit dir, du starker Held!“, sagt er zu Gideon.',
        'Gideon antwortet traurig: „Wenn Gott mit uns ist, warum ist uns das alles passiert? Wo sind die Wunder, von denen unsere Väter erzählt haben? Gott hat uns verlassen.“ Aber Gott sagt: „Geh hin in dieser deiner Kraft und rette Israel. Ich habe dich gesandt.“',
        '„Wie soll ich das tun?“, fragt Gideon. „Ich bin doch der Kleinste in meiner Familie, und meine Familie ist die geringste.“ „Ich will mit dir sein“, antwortet Gott.'
      ],
      // Spiel: Spreu im Wind (worfeln, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'worfeln', hint: 'Stelle den Wind ein, damit die Spreu fortfliegt.', winnow: WORFELN },
      questions: [
        { q: 'Wo drischt Gideon seinen Weizen?', options: ['in einer Kelter', 'auf dem Dach', 'am Fluss'], answer: 0 },
        { q: 'Was sagt Gott zu Gideon?', options: ['„Ich will mit dir sein.“', '„Du musst allein gehen.“', '„Geh zurück nach Ägypten.“'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Feuer aus dem Fels',
      ref: 'Richter 6,17–24',
      text: [
        'Gideon kann es kaum glauben. „Gib mir ein Zeichen, dass du es wirklich bist“, bittet er den Boten Gottes. „Geh nicht weg, bis ich dir etwas bringe.“',
        'Er bereitet ein Essen zu, backt Brot dazu und bringt alles unter die Eiche. „Stell es dort auf den Felsen“, sagt der Bote.',
        'Da fährt Feuer aus dem Felsen und verzehrt das Essen, und der Bote ist verschwunden. Gideon erschrickt.',
        'Aber Gott spricht zu ihm: „Friede sei mit dir! Fürchte dich nicht.“ Da baut Gideon dort einen Altar und nennt ihn: Gott ist der Friede.'
      ],
      // Spiel: Das Wort legen (wort, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'wort', hint: 'Lege das Wort aus den Buchstaben.', word: WORT },
      questions: [
        { q: 'Was fährt aus dem Felsen?', options: ['Feuer', 'Wasser', 'ein Sturm'], answer: 0 },
        { q: 'Was bittet Gideon zuerst von dem Boten?', options: ['ein Zeichen', 'etwas Mehl', 'ein Schwert'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Der Altar des Baal',
      ref: 'Richter 6,25–32',
      text: [
        'In derselben Nacht spricht Gott zu Gideon: „Reiß den Altar nieder, den dein Vater für Baal gebaut hat. Baue mir stattdessen oben auf dem Felsen einen Altar.“ Baal ist ein Götze, den viele anbeten.',
        'Gideon nimmt zehn seiner Knechte mit und tut, was Gott sagt. Weil er sich vor den Leuten der Stadt fürchtet, tut er es nachts.',
        'Am Morgen sehen die Leute den zerstörten Altar und werden zornig. „Wer hat das getan?“, fragen sie, und bald wissen sie es. Sie rufen vor dem Haus von Gideons Vater Joas: „Gib deinen Sohn heraus!“',
        'Aber Joas stellt sich vor seinen Sohn. „Wollt ihr für Baal streiten? Ist Baal ein Gott, soll er selbst für sich streiten!“ Seit diesem Tag heißt Gideon auch Jerubbaal.'
      ],
      // nur Quiz (ernst bzw. ruhig, nichts wird gespielt); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wann reißt Gideon den Altar des Baal nieder?', options: ['in der Nacht', 'am Mittag', 'zur Erntezeit'], answer: 0 },
        { q: 'Wer stellt sich vor Gideon?', options: ['sein Vater Joas', 'Barak', 'ein Prophet'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Das Fell auf der Tenne',
      ref: 'Richter 6,33–40',
      text: [
        'Wieder lagern die Midianiter in der Ebene Jesreel. Da erfüllt Gottes Geist den Gideon mit Mut. Er bläst die Posaune und ruft die Männer seiner Familie und seines Stammes zusammen.',
        'Aber Gideon möchte es noch genauer wissen. „Ich lege ein Fell auf die Tenne, den festen Platz, auf dem das Korn gedroschen wird“, sagt er zu Gott. „Ist morgen früh nur das Fell nass und der Boden ringsum trocken, dann weiß ich, dass du mir hilfst.“',
        'So geschieht es. Am Morgen ist das Fell so nass, dass Gideon eine ganze Schale voll Wasser auswringt, aber der Boden ringsum ist trocken.',
        'Gideon bittet noch einmal: „Sei mir nicht böse. Diesmal soll nur das Fell trocken bleiben und der Boden nass sein.“ Und Gott tut es auch in dieser Nacht.'
      ],
      // Spiel: Die Nacht vergeht (tau, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'tau', hint: 'Lass die Nacht vergehen und finde den Tau.', dew: TAU },
      questions: [
        { q: 'Was legt Gideon auf die Tenne?', options: ['ein Fell', 'einen Mantel', 'einen Sack Mehl'], answer: 0 },
        { q: 'Worum bittet Gideon beim zweiten Mal?', options: ['dass das Fell trocken bleibt und der Boden nass wird', 'dass es regnet', 'dass das Fell verschwindet'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Zu viele Männer',
      ref: 'Richter 7,1–3',
      text: [
        'Früh am Morgen lagert Gideon mit allen Männern, die auf seinen Ruf gekommen sind, an der Quelle Harod. Unten in der Ebene liegen die Feinde.',
        'Da sagt Gott: „Du hast zu viele Männer bei dir. Sonst sagt das Volk später: Wir haben uns selbst geholfen.“',
        'Darum soll Gideon ausrufen: „Wer Angst hat, darf nach Hause gehen!“',
        'Zweiundzwanzigtausend Männer gehen heim. Nur zehntausend bleiben bei Gideon. Sie sehen den anderen nach, wie sie über die Hügel ziehen. Im Lager wird es still. Aber Gott sagt: „Es sind immer noch zu viele.“'
      ],
      // Spiel: Wer geht heim? (weiche, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'weiche', hint: 'Stelle die Weiche, damit jeder Mann seinen Weg geht.', swit: WEICHE },
      questions: [
        { q: 'Was sagt Gott über die Männer?', options: ['Sie sind zu viele.', 'Sie sind zu müde.', 'Sie sind zu laut.'], answer: 0 },
        { q: 'Wie viele Männer bleiben zuerst bei Gideon?', options: ['zehntausend', 'zweiundzwanzigtausend', 'neunhundert'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Am Wasser',
      ref: 'Richter 7,4–8',
      text: [
        '„Führe die Männer ans Wasser“, sagt Gott zu Gideon. „Dort will ich sie für dich prüfen.“ Gideon führt sie zum Bach hinunter.',
        'Die meisten Männer knien nieder und trinken. Aber ein kleiner Trupp leckt das Wasser aus der Hand, wie ein Hund es leckt, und führt es zum Mund.',
        '„Durch diese dreihundert Männer will ich euch retten“, sagt Gott. „Die anderen sollen nach Hause gehen.“',
        'Gideon schickt alle anderen heim. Nur die dreihundert behält er bei sich, und sie nehmen Vorrat und ihre Posaunen mit. Unten in der Ebene liegt das riesige Lager der Feinde.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt); das Etappenbild ist noch das von Josef
      task: { kind: 'wimmelbild', hint: 'Finde die Männer, die das Wasser mit der Hand zum Mund führen. Manche verstecken sich!', count: 5, find: WIMMEL },
      questions: [
        { q: 'Wie viele Männer behält Gideon bei sich?', options: ['dreihundert', 'zehntausend', 'zweiundzwanzigtausend'], answer: 0 },
        { q: 'Was nehmen die dreihundert Männer mit?', options: ['Vorrat und ihre Posaunen', 'Zelte und Herden', 'Brot und Wein'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Der Traum im Lager',
      ref: 'Richter 7,9–15',
      text: [
        'In derselben Nacht sagt Gott zu Gideon: „Geh hinab zum Lager der Feinde! Wenn du dich fürchtest, nimm deinen Diener Pura mit.“',
        'Leise gehen die beiden den Hang hinab. Unten im Tal liegen so viele Feinde mit ihren Kamelen wie Heuschrecken.',
        'Da hört Gideon, wie ein Mann einem anderen seinen Traum erzählt. „Ich träumte, ein rundes Gerstenbrot rollte ins Lager und warf ein Zelt um.“ „Das ist nichts anderes als das Schwert Gideons, des Sohnes des Joas“, antwortet der andere. „Gott hat das ganze Lager in seine Hand gegeben.“',
        'Gideon verneigt sich und dankt Gott. Dann geht er zurück zu seinen Männern: „Auf, Gott hat das Lager der Feinde in eure Hände gegeben!“'
      ],
      // Spiel: Leise den Hang hinab (schleichen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'schleichen', hint: 'Führe die beiden leise von Schatten zu Schatten den Hang hinab.', sneak: SCHLEICHEN },
      questions: [
        { q: 'Wen nimmt Gideon mit zum Lager der Feinde?', options: ['seinen Diener Pura', 'seinen Vater Joas', 'Barak'], answer: 0 },
        { q: 'Wovon träumt der Mann im Lager?', options: ['von einem rollenden Gerstenbrot', 'von einem Schaf', 'von einer Brücke'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Krüge, Fackeln und Posaunen',
      ref: 'Richter 7,16–21',
      text: [
        'Gideon teilt die dreihundert Männer in drei Gruppen zu je hundert. Jeder bekommt eine Posaune und einen leeren Krug, und in jedem Krug steckt eine Fackel.',
        '„Seht auf mich und macht es genauso“, sagt Gideon. „Wenn ich die Posaune blase, blast ihr auch und ruft: Für Gott und für Gideon!“',
        'Mitten in der Nacht stellen sich die Männer rings um das Lager der Feinde auf. Gideon bläst die Posaune, und alle zerschlagen ihre Krüge. Plötzlich leuchten die Fackeln in der Dunkelheit, und überall schallen die Posaunen: „Das Schwert Gottes und Gideons!“',
        'Die dreihundert bleiben an ihrem Platz stehen. Die Feinde schrecken aus dem Schlaf, laufen durcheinander und schreien. Das ganze Heer erschrickt und flieht.'
      ],
      // Spiel: Auf Gideons Zeichen (zeichen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'zeichen', hint: 'Warte auf das Horn und antworte dann der Reihe nach.', cue: ZEICHEN },
      questions: [
        { q: 'Was steckt in den Krügen der Männer?', options: ['Fackeln', 'Brot', 'Wasser'], answer: 0 },
        { q: 'In wie viele Gruppen teilt Gideon die dreihundert Männer?', options: ['in drei', 'in zwei', 'in zwölf'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Ephraim und die Furten',
      ref: 'Richter 7,24 bis 8,3',
      text: [
        'Gideon schickt Boten nach Ephraim: „Kommt herab und besetzt die Furten am Jordan, damit die Feinde nicht hinüberkommen!“ Eine Furt ist eine flache Stelle, an der man durch den Fluss gehen kann.',
        'Die Männer von Ephraim kommen, besetzen die Furten und fangen zwei Fürsten der Feinde, Oreb und Seeb. Später aber kommen sie zornig zu Gideon: „Warum hast du uns nicht gerufen, als du gegen die Feinde gezogen bist?“ Sie streiten heftig mit ihm.',
        'Gideon bleibt ruhig. „Was habe ich im Vergleich zu euch getan?“, sagt er. „Gott hat die Fürsten der Feinde in eure Hände gegeben. Wie hätte ich tun können, was ihr getan habt?“',
        'Als Gideon so freundlich redet, legt sich ihr Zorn.'
      ],
      // nur Quiz (ernst bzw. ruhig, nichts wird gespielt); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer kommt zornig zu Gideon?', options: ['die Männer von Ephraim', 'Barak', 'die Feinde'], answer: 0 },
        { q: 'Wie antwortet Gideon den Männern von Ephraim?', options: ['ruhig und freundlich', 'mit lauten Worten', 'gar nicht'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Gott soll euer Herr sein',
      ref: 'Richter 8,22–28.33–35',
      text: [
        'Nach dem Sieg kommen die Israeliten zu Gideon. „Sei unser Herrscher“, sagen sie, „du und dein Sohn und dein Enkel. Du hast uns aus der Hand der Feinde gerettet.“',
        'Gideon schüttelt den Kopf. „Ich will nicht euer Herr sein“, sagt er, „und mein Sohn soll es auch nicht sein. Gott soll euer Herr sein.“',
        'Gideon ist ein Mensch mit Fehlern. Er bittet um das Gold, das die Feinde getragen haben, und lässt daraus ein Priestergewand machen. Ganz Israel betet es an, und das wird Gideon und seinem Haus zum Fall.',
        'Die Feinde erheben ihren Kopf nicht mehr, und das Land ist still, vierzig Jahre lang, solange Gideon lebt. Als er gestorben ist, vergisst das Volk Gott wieder und läuft dem Baal nach. Und doch war Gott mit Gideon, wie er es versprochen hat: „Ich will mit dir sein.“'
      ],
      // Spiel: Memory (memory, alt); das Etappenbild ist noch das von Josef
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Was antwortet Gideon, als sie ihn zum Herrscher machen wollen?', options: ['„Gott soll euer Herr sein.“', '„Ja, ich werde euer König.“', '„Mein Sohn soll es werden.“'], answer: 0 },
        { q: 'Wie lange ist das Land still, solange Gideon lebt?', options: ['vierzig Jahre', 'sieben Jahre', 'zwanzig Jahre'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Unter welchem Baum sitzt Debora?', options: ['unter einer Palme', 'unter einer Eiche', 'unter einer Zeder'], answer: 0 },
    { q: 'Wo drischt Gideon heimlich seinen Weizen?', options: ['in einer Kelter', 'auf dem Dach', 'am Fluss'], answer: 0 },
    { q: 'Was legt Gideon auf die Tenne, um ein Zeichen zu bekommen?', options: ['ein Fell', 'einen Mantel', 'einen Sack Mehl'], answer: 0 },
    { q: 'Wie viele Männer behält Gideon bei sich?', options: ['dreihundert', 'zehntausend', 'zweiundzwanzigtausend'], answer: 0 },
    { q: 'Was steckt in den Krügen der Männer?', options: ['Fackeln', 'Brot', 'Wasser'], answer: 0 },
    { q: 'Was antwortet Gideon, als sie ihn zum Herrscher machen wollen?', options: ['„Gott soll euer Herr sein.“', '„Ja, ich werde euer König.“', '„Mein Sohn soll es werden.“'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of gideon.stages) {
  if (st.task.winnow) st.task.winnow.background = st.image
  if (st.task.word) st.task.word.background = st.image
}

// the German recordings of the stories (voice Achernar); there are no English ones yet, so the English app reads with the voice of the device
// Stages whose text was corrected for Bible faithfulness on 21.10.2026 (2: the prophet 6,7-10 and no stored food, 3: Gideon's complaint 6,13-15, 8: "like a dog" 7,5, 9 and 10: "das Schwert Gideons" 7,14 and the cry 7,20, 11: Oreb and Zeeb 7,25, 12: the golden garment 8,24-27 and the end 8,33-34)
// were recorded again as "-v4" (list in `D:/Claude/Abenteuer-Gideon/NEUAUFNAHME-BIBELTREUE-2026-10-21.md`); the others are "-v3".
const RECORDED_AGAIN = new Set([2, 3, 8, 9, 10, 11, 12])
for (const s of gideon.stages) {
  const file = `audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.has(s.id) ? 'v4' : 'v3'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (skill `lambking-abenteuer-skill`, ton.md); they follow one another at random
gideon.music = [
  'audio/abenteuer/gideon/musik-nacht-v1.mp3',
  'audio/abenteuer/gideon/musik-fackeln-v1.mp3',
  'audio/abenteuer/gideon/musik-zuversicht-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(gideon, gideonEn)
