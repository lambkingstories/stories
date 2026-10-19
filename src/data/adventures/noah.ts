/**
 * Abenteuer "Noah" für 8 bis 10 Jahre: 9 Etappen. Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Noah/ (Entwurf, Gegenlese-Befunde). Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0);
 * die App mischt die Antworten beim Anzeigen.
 */
import type { BuildGame, DotsGame, FindGame, FlyGame, Journey, MemoryGame, PaintJob, PaintZone, ShareGame } from '@/types/adventure'
import { NOAH_PATH } from './noahPath'
import { localize } from './localize'
import { noahEn } from './en/noah.en'

const IMG = 'images/abenteuer/noah/'
const G = 'images/abenteuer/spiele/'

/** Etappe 1, "Wimmelbild": Noah und seine drei Söhne im Hügelland finden (vier Figuren, teils halb hinter etwas). x/y = Mitte der Füße, w = Breite, in Prozent der Szene. */
const WIMMEL = `${G}wimmel-noah/`
const hügelWimmel: FindGame = {
  labels: ['Noah', 'Sem', 'Ham', 'Jafet'],
  doneText: 'Du hast Noah und alle drei Söhne gefunden!',
  scene: `${WIMMEL}szene.webp`,
  finds: [
    { image: `${WIMMEL}noah.webp`, x: 19, y: 53, w: 14 },
    { image: `${WIMMEL}sem.webp`, x: 77, y: 45, w: 11.5 },
    { image: `${WIMMEL}ham.webp`, x: 44, y: 76, w: 13.8 },
    { image: `${WIMMEL}jafet.webp`, x: 58, y: 38, w: 9 }
  ],
  // vor manchen Figuren, damit nur ein Teil herausschaut; einige stehen nur zum Verwirren da
  covers: [
    { image: `${WIMMEL}verdecker-6.webp`, x: 20, y: 56, w: 22 },
    { image: `${WIMMEL}verdecker-2.webp`, x: 77, y: 47, w: 24 },
    { image: `${WIMMEL}verdecker-3.webp`, x: 41, y: 79, w: 21 },
    { image: `${WIMMEL}verdecker-1.webp`, x: 59, y: 41, w: 17 },
    { image: `${WIMMEL}verdecker-4.webp`, x: 12, y: 86, w: 14 },
    { image: `${WIMMEL}verdecker-5.webp`, x: 83, y: 72, w: 15 },
    { image: `${WIMMEL}verdecker-7.webp`, x: 90, y: 60, w: 16 },
    { image: `${WIMMEL}verdecker-8.webp`, x: 6, y: 42, w: 15 }
  ]
}

/** Etappe 2, "Arche bauen": die Arche von der Seite (Plan aus einem Bild, die Teile liegen darauf), zwei Runden: Teile mit Umriss, Fugen mit Pech. */
const BAUEN = `${G}bauen/`
const archeBauen: BuildGame = {
  shadow: `${BAUEN}arche-plan-v2-schatten.webp`,
  aspect: 1000 / 239,
  ordered: false,
  rotate: false,
  // die Plätze in Prozent des Plans (Messung: spiele/fertig/bauen/arche-plan-v2-messung.json); Tür, Fensterband und Rampe sind nicht maßstäblich zum Plan, sie sitzen auf den abgelesenen Plätzen (Fensterband gestreckt)
  pieces: [
    { id: 'oben', label: 'das obere Deck', image: `${BAUEN}deck-oben-v2.webp`, x: 0, y: 0, w: 100, h: 48.95 },
    { id: 'mitte', label: 'das mittlere Deck', image: `${BAUEN}deck-mitte-v2.webp`, x: 0, y: 48.95, w: 100, h: 26.36 },
    { id: 'unten', label: 'das untere Deck', image: `${BAUEN}deck-unten-v2.webp`, x: 0, y: 75.31, w: 100, h: 24.69 },
    { id: 'tuer', label: 'die Tür', image: `${BAUEN}tuer-v2.webp`, x: 65.45, y: 35.41, w: 7.52, h: 36.2 },
    { id: 'fenster', label: 'das Fensterband', image: `${BAUEN}fenster-v2.webp`, x: 15.61, y: 7.87, w: 68.34, h: 11.28 },
    { id: 'rampe', label: 'die Rampe', image: `${BAUEN}rampe.webp`, x: 62, y: 61.1, w: 20, h: 38.9 }
  ],
  rounds: [
    // zwei Runden (Anton, 18.10.2026: höchstens zwei): erst die Teile im Umriss, dann das Pech
    { hint: 'Runde 1: Ziehe jedes Teil auf seinen Platz im Umriss.', outline: true },
    { hint: 'Runde 2: Nimm das Pech und fahre mit dem Finger an jeder Fuge entlang. Bleibe auf der Fuge.', pitch: true }
  ],
  // Pech schmieren: drei Fugen in der Holzwand (gerade, geschwungen, Zickzack), Linien in Prozent der Wand (900 x 1200), am Bild gemessen (spiele/fertig/bauen/holz-pech-v3-messung.json)
  pitch: {
    wall: `${BAUEN}holz-pech-v3.webp`,
    pot: `${BAUEN}pechtopf.webp`,
    tolerance: 5.5,
    seams: [
      { points: [[8, 20.55], [92, 20.55]] },
      { points: [[8, 48.625], [14, 47.583], [20, 46.708], [26, 46.208], [32, 46.25], [38, 46.667], [44, 47.458], [50, 48.375], [56, 49.125], [62, 49.708], [68, 49.917], [74, 49.75], [80, 49.333], [86, 48.583], [92, 47.708]] },
      { points: [[8, 78.042], [19.75, 74.75], [31.5, 80.042], [43.65, 74.833], [55.3, 79.958], [67.75, 74.833], [79.85, 79.958], [92, 76.625]] }
    ]
  }
}

/**
 * Etappe 9, Ausmalen: die Elemente des Bildes, über die die Zusatzbedingungen sprechen. Je ein Punkt mitten in jeder geschlossenen Fläche des
 * Strichbildes (die Flächen, die auch der Mal-Eimer füllt), am Bild gemessen (Bild-Sitzung: spiele/fertig/ausmalen/ausmalen-09-v2-zonen-pool.json).
 */
const AUSMALEN_9_ZONEN: Record<string, PaintZone> = {
  regenbogen: { seeds: [[53.6, 10.8], [48.8, 13.7], [50.4, 16.7], [49.8, 19.7], [49.8, 22.8]] },
  sonne: { seeds: [[85.3, 10.8]] },
  wolken: { seeds: [[15.9, 10.6], [5.4, 23.2], [95.1, 22.5], [9.3, 36.8], [86.4, 36.0]] },
  wiese: { seeds: [[50.1, 80.0]] },
  arche: { seeds: [[6.5, 50.6], [6.7, 53.2], [93.0, 53.2], [22.2, 55.9], [84.9, 55.7], [80.8, 57.6], [18.4, 57.7], [29.6, 60.0], [70.0, 60.0], [82.4, 62.0], [24.8, 62.1], [25.6, 63.6], [70.0, 63.6], [30.8, 48.1], [18.3, 44.7], [3.8, 48.7], [60.2, 55.3], [63.7, 55.3]] },
  baum: { seeds: [[8.7, 68.1]] },
  himmel: { seeds: [[60.0, 2.0]] }
}
/** Etappe 9: bei jedem neuen Start werden drei dieser Aufgaben (für verschiedene Elemente) gezogen; jede erfüllte Aufgabe ist ein Stern; das Übrige darf das Kind frei wählen. */
const AUSMALEN_9_AUFGABEN: PaintJob[] = [
  { zone: 'regenbogen', tool: 'watercolor', hint: 'Male den Regenbogen mit Wasserfarbe.' },
  { zone: 'regenbogen', tool: 'felt', hint: 'Male den Regenbogen mit dem Filzstift.' },
  { zone: 'regenbogen', tool: 'pencil', hint: 'Male den Regenbogen mit Buntstift.' },
  { zone: 'regenbogen', tool: 'chalk', hint: 'Male den Regenbogen mit Kreide.' },
  { zone: 'sonne', color: 'yellow', hint: 'Male die Sonne gelb.' },
  { zone: 'sonne', color: 'yellow', tool: 'pencil', hint: 'Male die Sonne gelb mit Buntstift.' },
  { zone: 'arche', color: 'brown', hint: 'Male die Arche braun.' },
  { zone: 'arche', color: 'brown', tool: 'pencil', hint: 'Male die Arche braun mit Buntstift.' },
  { zone: 'wolken', color: 'blue', hint: 'Male die Wolken blau.' },
  { zone: 'wiese', color: 'green', hint: 'Male die Wiese grün.' },
  { zone: 'baum', color: 'green', hint: 'Male den Baum grün.' },
  { zone: 'himmel', color: 'blue', hint: 'Male den Himmel blau.' }
]

/**
 * Etappe 4, Memory: sechs Paare aus Männchen und Weibchen (1. Mose 7,2–3: von allen Arten Männchen und Weibchen). Die zwei Karten eines Paares sind
 * verschieden (Männchen und Weibchen, 256 x 256, gemalt von Codex); die Sätze erscheinen beim Treffer und sagen nur, was in der Etappe steht.
 * Die Rückseite hat Anton für passend befunden.
 */
const PAARE = `${G}memory-paare/`
const tierMemory: MemoryGame = {
  back: `${PAARE}rueck.webp`,
  pairs: [
    { image: `${PAARE}loewe-m.webp`, imageB: `${PAARE}loewe-w.webp`, labels: ['Löwe', 'Löwin'], text: 'Löwe und Löwin: Tiere aus der Wildnis. Auch sie gehen in die Arche, das Männchen und das Weibchen.' },
    { image: `${PAARE}hirsch-m.webp`, imageB: `${PAARE}hirsch-w.webp`, labels: ['Hirsch', 'Hirschkuh'], text: 'Hirsch und Hirschkuh: Tiere aus der Wildnis. Das Männchen und das Weibchen gehen in die Arche.' },
    { image: `${PAARE}widder-m.webp`, imageB: `${PAARE}schaf-w.webp`, labels: ['Widder', 'Schaf'], text: 'Widder und Schaf: Tiere vom Feld. Das Männchen und das Weibchen gehen in die Arche.' },
    { image: `${PAARE}pfau-m.webp`, imageB: `${PAARE}pfau-w.webp`, labels: ['Pfau', 'Pfauenhenne'], text: 'Pfau und Pfauenhenne: Vögel aus der Luft. Auch von den Vögeln kommen Männchen und Weibchen.' },
    { image: `${PAARE}stier-m.webp`, imageB: `${PAARE}kuh-w.webp`, labels: ['Stier', 'Kuh'], text: 'Stier und Kuh: Tiere vom Feld. Von allen Arten kommen Männchen und Weibchen zu Noah.' },
    { image: `${PAARE}hahn-m.webp`, imageB: `${PAARE}henne-w.webp`, labels: ['Hahn', 'Henne'], text: 'Hahn und Henne: Auch sie gehören dazu. Männchen und Weibchen gehen in die Arche.' }
  ]
}

/**
 * Etappe 3, "Teilen/Verteilen": die Familie bekommt Früchte (fünf Sorten), jedes Tier genau ein Futterstück (ein zweites springt zurück): die Taube Körner (Futtersack), Kamel, Schaf, Ziege und Esel Heu.
 * Falsches Futter: rotes Kreuz und ein kurzer Satz. Ein leerer Krug und ein Holzhammer sind für niemanden. Zwei Runden: in Runde 2 sind mehr Tiere da.
 * Die Früchte sind fünf Körbe (Codex: BILDAUFTRAG-Teilen-Essen-2.md); auf den Karten steht kein Futter vorab.
 */
const TEILEN = `${G}teilen/`
const TIERE = `${G}tiere/`
const FRUECHTE = ['feige', 'dattel', 'traube', 'granat', 'olive']
const vorratTeilen: ShareGame = {
  scene: `${TEILEN}scheune.webp`,
  empty: `${TEILEN}korb-leer.webp`,
  receivers: [
    { id: 'familie', image: `${TEILEN}familie.webp`, label: 'Noahs Familie', accepts: FRUECHTE, rejects: { heu: 'Noahs Familie isst kein Heu.', korn: 'Noahs Familie isst keine Futterkörner.' } },
    { id: 'taube', image: `${TIERE}taube.webp`, label: 'die Taube', accepts: ['korn'], single: true, rejects: { heu: 'Die Taube frisst kein Heu.', '*': 'Das ist nichts für die Taube.' } },
    { id: 'kamel', image: `${TIERE}kamel.webp`, label: 'das Kamel', accepts: ['heu'], single: true, rejects: { korn: 'Das Kamel mag keine Körner.', '*': 'Das ist nichts für das Kamel.' } },
    { id: 'schaf', image: `${TIERE}schaf.webp`, label: 'das Schaf', accepts: ['heu'], single: true, rejects: { korn: 'Das Schaf mag keine Körner.', '*': 'Das ist nichts für das Schaf.' } },
    { id: 'ziege', image: `${TIERE}ziege.webp`, label: 'die Ziege', accepts: ['heu'], single: true, rejects: { korn: 'Die Ziege mag keine Körner.', '*': 'Das ist nichts für die Ziege.' } },
    { id: 'esel', image: `${TIERE}esel.webp`, label: 'der Esel', accepts: ['heu'], single: true, rejects: { korn: 'Der Esel mag keine Körner.', '*': 'Das ist nichts für den Esel.' } }
  ],
  baskets: [
    { id: 'feige', image: `${TEILEN}korb-feigen.webp`, label: 'Feigen' },
    { id: 'dattel', image: `${TEILEN}korb-datteln.webp`, label: 'Datteln' },
    { id: 'traube', image: `${TEILEN}korb-trauben.webp`, label: 'Trauben' },
    { id: 'granat', image: `${TEILEN}korb-granataepfel.webp`, label: 'Granatäpfeln' },
    { id: 'olive', image: `${TEILEN}korb-oliven.webp`, label: 'Oliven' },
    { id: 'heu', image: `${TEILEN}korb-heu.webp`, label: 'Heu' },
    { id: 'korn', image: `${TEILEN}futtersack.webp`, label: 'Futterkörnern' },
    // Ablenker: für niemanden (Codex: Tonkrug leer, Holzhammer)
    { id: 'krug', image: `${TEILEN}tonkrug-leer.webp`, label: 'einem leeren Krug', nobody: true },
    { id: 'hammer', image: `${TEILEN}werkzeug.webp`, label: 'einem Holzhammer', nobody: true }
  ],
  rounds: [
    // keine Zielkörbe und keine Zahlen: die Kinder kommen selbst darauf, wer was braucht (Anton, 18.10.2026); kein Essen gehört zu beiden Gruppen
    { hint: 'Runde 1: Wer braucht was? Schiebe jedes Essen zu denen, die es brauchen. Manches braucht hier niemand.', receivers: ['familie', 'taube', 'kamel', 'schaf'], baskets: ['feige', 'heu', 'korn', 'traube', 'heu', 'krug'], checkContent: true },
    { hint: 'Runde 2: Jetzt sind mehr Tiere da. Niemand soll leer ausgehen. Tippe dann auf Fertig.', receivers: ['familie', 'taube', 'kamel', 'schaf', 'ziege', 'esel'], baskets: ['dattel', 'heu', 'korn', 'granat', 'heu', 'olive', 'heu', 'heu', 'feige', 'hammer'], checkContent: true, free: true }
  ]
}

/** Etappe 6, "Punkte verbinden": die Gipfel tauchen auf. Bild: Codex (`spiele/fertig/punkte/ararat-v3.webp`, neue Arche, neun Zickzack-Gipfel); die Punkte sind an der Himmelsgrenze gemessen (Abstand mindestens 8 Prozent der Breite, Messung: ararat-v3-messung.json; der letzte Punkt bei x 97 fehlt wegen der Regel 3 bis 97). */
const PUNKTE = `${G}punkte/`
const araratPunkte: DotsGame = {
  image: `${PUNKTE}ararat-v3.webp`,
  // x, y in Prozent des Bildes, von links nach rechts entlang der Himmelsgrenze
  points: [
    [3, 19.2], [10.1, 29.2], [17.2, 16.3], [22.0, 29.1], [31.0, 17.9], [35.1, 28.5],
    [42.9, 13.7], [49.7, 28.4], [54.7, 19.9], [60.0, 28.5], [65.9, 15.6], [71.9, 28.5],
    [76.2, 19.7], [82.0, 28.5], [86.3, 18.7], [91.3, 28.5]
  ]
}

/** Etappe 7, "Steuern": die Taube folgt dem Finger, zwei Flüge (Bilder: Codex, `codex3/steuern/`; Himmel 2 ist die Fassung b mit dem Ölbaum bei x 78, y 24). */
const STEUERN = `${G}steuern/`
const taubeSteuern: FlyGame = {
  dove: [`${STEUERN}taube-1.webp`, `${STEUERN}taube-2.webp`],
  leaf: `${STEUERN}oelblatt.webp`,
  ark: `${STEUERN}arche-fenster-v2.webp`,
  home: { x: 17, y: 80 },
  rounds: [
    {
      hint: 'Runde 1: Fliege durch die Lichter über dem Wasser und dann zurück zur Arche.',
      background: `${STEUERN}himmel-1-v2.webp`,
      targets: [
        { kind: 'light', x: 46, y: 64 },
        { kind: 'light', x: 72, y: 46 },
        { kind: 'light', x: 44, y: 35 }
      ]
    },
    {
      hint: 'Runde 2: Lenke die Taube zum Baum und dann zurück zur Arche.',
      background: `${STEUERN}himmel-2.webp`,
      needLeaf: true,
      targets: [
        { kind: 'light', x: 40, y: 62 },
        { kind: 'light', x: 62, y: 44 },
        { kind: 'leaf', x: 79, y: 17 }
      ]
    }
  ]
}

/** Etappe 8, "Altar bauen": ein Altarbild (Codex, Fassung b, `spiele/fertig/altar/`), zwölf Steine als Umrisse (am Bild gemessen, `altar-messung.json`), von unten nach oben, mit Drehen. */
const ALTAR_DIR = `${G}altar/`
const ALTAR = `${ALTAR_DIR}altar-v2.webp`
const altarBauen: BuildGame = {
  image: ALTAR,
  background: `${ALTAR_DIR}hintergrund-v2.webp`,
  aspect: 1,
  ordered: true,
  rotate: true,
  // Stein 1 ist ganz unten links, Stein 12 ganz oben rechts; Umriss in Prozent des Altarbildes (in jeder Schicht von links nach rechts)
  pieces: [
    { id: 's1', label: 'Stein 1', image: ALTAR, x: 10.3, y: 62.7, w: 29.9, h: 16.9, layer: 1, polygon: [[26.6, 79.6], [11.2, 77.9], [10.3, 74.7], [13.8, 64.9], [21.6, 62.7], [40.2, 63.5], [37.2, 72.9], [38.1, 78.4]] },
    { id: 's2', label: 'Stein 2', image: ALTAR, x: 37.2, y: 63.4, w: 30.8, h: 16.1, layer: 1, polygon: [[61.7, 79.5], [38.7, 78.4], [37.2, 72.9], [40.6, 64.4], [44.8, 63.4], [66.0, 64.8], [67.9, 77.0], [66.4, 79.1]] },
    { id: 's3', label: 'Stein 3', image: ALTAR, x: 67.8, y: 63.7, w: 21.5, h: 15.6, layer: 1, polygon: [[80.9, 79.3], [69.4, 78.2], [67.8, 64.9], [86.0, 63.7], [88.5, 65.6], [89.3, 77.4], [87.4, 78.6]] },
    { id: 's4', label: 'Stein 4', image: ALTAR, x: 14.3, y: 49.3, w: 22.4, h: 14.3, layer: 2, polygon: [[30.2, 63.6], [22.7, 62.7], [14.6, 63.2], [14.3, 58.8], [18.0, 50.4], [24.2, 49.3], [36.4, 50.7], [36.7, 62.3]] },
    { id: 's5', label: 'Stein 5', image: ALTAR, x: 37.4, y: 49.6, w: 25.5, h: 14.5, layer: 2, polygon: [[61.9, 64.1], [46.9, 62.7], [38.1, 62.9], [37.4, 50.9], [45.1, 49.6], [60.0, 51.7], [62.7, 59.6], [62.9, 62.9]] },
    { id: 's6', label: 'Stein 6', image: ALTAR, x: 61.5, y: 49.5, w: 24.8, h: 14.7, layer: 2, polygon: [[73.0, 64.2], [63.9, 63.1], [61.5, 51.0], [68.9, 49.5], [74.9, 50.4], [83.4, 49.6], [86.2, 55.6], [86.3, 63.0]] },
    { id: 's7', label: 'Stein 7', image: ALTAR, x: 18.6, y: 34.4, w: 23.9, h: 15.2, layer: 3, polygon: [[37.0, 49.6], [18.6, 48.7], [21.5, 35.6], [23.8, 34.4], [35.4, 36.1], [42.4, 35.6], [38.6, 48.4]] },
    { id: 's8', label: 'Stein 8', image: ALTAR, x: 39.8, y: 35.3, w: 24.6, h: 15.4, layer: 3, polygon: [[60.3, 50.7], [39.9, 48.9], [39.8, 45.3], [43.6, 36.2], [47.4, 35.3], [62.8, 35.5], [63.8, 38.2], [64.4, 48.3]] },
    { id: 's9', label: 'Stein 9', image: ALTAR, x: 64.3, y: 35.1, w: 18.1, h: 14.5, layer: 3, polygon: [[80.3, 49.6], [65.6, 48.9], [64.3, 35.8], [76.6, 35.1], [78.6, 35.8], [81.2, 40.3], [82.4, 46.3], [81.9, 48.9]] },
    { id: 's10', label: 'Stein 10', image: ALTAR, x: 23.7, y: 20.9, w: 18.1, h: 14.2, layer: 4, polygon: [[35.4, 35.2], [23.7, 33.7], [23.7, 27.9], [26.7, 23.3], [34.7, 20.9], [41.8, 23.6], [40.1, 33.9], [38.6, 34.9]] },
    { id: 's11', label: 'Stein 11', image: ALTAR, x: 40.9, y: 20.2, w: 19.0, h: 14.7, layer: 4, polygon: [[45.3, 34.8], [42.1, 34.7], [40.9, 33.7], [43.0, 23.2], [49.7, 20.2], [57.6, 24.4], [59.9, 32.0], [59.6, 34.3]] },
    { id: 's12', label: 'Stein 12', image: ALTAR, x: 58.5, y: 21.1, w: 18.6, h: 14.0, layer: 4, polygon: [[73.8, 35.1], [61.3, 34.1], [58.5, 24.1], [62.7, 22.5], [70.7, 21.1], [73.5, 24.0], [77.1, 31.8], [76.8, 34.3]] }
  ],
  rounds: [
    // eine einzige Runde mit allen zwölf Steinen (Anton, 18.10.2026)
    { hint: 'Setze jeden Stein in seinen Umriss.', outline: true }
  ]
}

export const noah: Journey = {
  id: 'noah',
  title: 'Noah',
  subtitle: 'Die Arche und der Regenbogen',
  age: '8-10',
  downloadMb: 13, // Vorschau (Karte, Etappenbilder, Spiele der fertigen Etappen); beim Freischalten neu zählen (der Test sagt die echte Größe)
  medal: `${IMG}medaille-v2.webp`,
  // Geschenk-Ausmalbild: Codex-Fassung mit der neuen Arche (spiele/fertig/ausmalen/geschenk-v2.webp); Anton muss sie noch freigeben
  gift: { title: 'Die Arche unter dem Regenbogen', image: `${IMG}geschenk-v2.webp` },
  // Karte: Codex-Panorama 9908 x 1648 in vier Stücken (Stationen und Perlenweg: D:/Claude/lambking-design/abenteuer-noah/fertig/); der Ring ist der von Josef
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-r2-${n}.webp`), // Fassung mit Starkregen (18.10.2026)
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0281, y: 0.3368, d: 0.0339 },
      { x: 0.1151, y: 0.2275, d: 0.0339 },
      { x: 0.2039, y: 0.324, d: 0.0339 },
      { x: 0.332, y: 0.6377, d: 0.0339 },
      { x: 0.4978, y: 0.5285, d: 0.0339 },
      { x: 0.5813, y: 0.4066, d: 0.0339 },
      { x: 0.654, y: 0.3095, d: 0.0339 },
      { x: 0.7242, y: 0.182, d: 0.0339 },
      { x: 0.8433, y: 0.6456, d: 0.0339 }
    ],
    exam: { x: 0.9345, y: 0.6402, d: 0.0339 },
    path: NOAH_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Noah lebt mit Gott',
      ref: '1. Mose 6,5–10',
      text: [
        'Vor langer Zeit leben viele Menschen auf der Erde. Doch sie haben Gott vergessen. In ihrem Herzen ist es böse geworden, und was sie tun, ist nicht gut. Die Erde, die Gott so schön gemacht hat, ist voll Unrecht. Gott sieht es, und es macht ihn traurig. Es schmerzt ihn tief.',
        'Aber einer lebt anders. Er heißt Noah. Während die anderen nicht mehr nach Gott fragen, bleibt Noah bei ihm. Er hört auf Gott und geht seinen Weg mit ihm. Gott findet nichts an ihm auszusetzen, und er ist gut zu Noah.',
        'Noah hat eine Frau und drei Söhne. Die Söhne heißen Sem, Ham und Jafet.'
      ],
      task: { kind: 'wimmelbild', hint: 'Finde Noah und seine drei Söhne im Hügelland.', count: 4, find: hügelWimmel },
      questions: [
        { q: 'Wie heißen Noahs drei Söhne?', options: ['Sem, Ham und Jafet', 'Isaak, Jakob und Josef', 'Mose, Aaron und Josua'], answer: 0 },
        { q: 'Wer lebt mit Gott, als die anderen nicht auf ihn hören?', options: ['Noah', 'Sem', 'Jafet'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Gottes Bauplan',
      ref: '1. Mose 6,13–22',
      text: [
        'Gott hat gesehen, wie es auf der Erde zugeht. Eines Tages spricht er zu Noah. Er sagt: „Eine große Flut wird über die Erde kommen. Aber mit dir schließe ich einen Bund, ein festes Versprechen: Du und deine Familie sollt sicher sein. Bau eine Arche aus Holz.“',
        'Und Gott sagt ihm genau, wie sie aussehen soll: ein riesiger Kasten mit vielen Kammern und drei Stockwerken. In die Seite kommt eine Tür, und ganz oben, unter dem Dach, soll es Fenster geben. Innen und außen soll Noah das Holz mit Pech bestreichen, damit alles dicht ist.',
        'In die Arche sollen Noah und seine Frau, seine drei Söhne und deren Frauen. Auch Tiere sollen mit.',
        'Es ist ein gewaltiger Auftrag. Aber Noah hört gut zu, fängt an und tut alles genau so, wie Gott es gesagt hat.'
      ],
      task: { kind: 'bauen', hint: 'Baue die Arche und dichte sie am Ende mit Pech ab.', build: archeBauen },
      questions: [
        { q: 'Was wird über die Erde kommen, sagt Gott?', options: ['eine große Flut', 'ein langer Winter', 'eine lange Dürre'], answer: 0 },
        { q: 'Wer geht mit Noah in die Arche?', options: ['seine Frau, seine drei Söhne und deren Frauen', 'seine Frau und die Nachbarn', 'nur seine drei Söhne'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Vorrat für alle',
      ref: '1. Mose 6,21–22; 7,5',
      text: [
        'Die Arche steht. Doch Gott hat Noah noch etwas aufgetragen: „Sammle alles Essen, das ihr braucht, und bring es in die Arche. Es soll für euch reichen und für die Tiere.“',
        'Noah macht sich an die Arbeit. Er füllt Körbe mit Korn, er sammelt Früchte, er stapelt Futter für die Tiere. Korb um Korb trägt er in die Kammern der Arche und stapelt alles auf, bis es dort nach Korn und Heu riecht. Es ist viel Arbeit, denn es müssen viele satt werden, Menschen und Tiere.',
        'Alles, was Gott ihm aufgetragen hat, tut Noah. Nichts lässt er aus.'
      ],
      task: { kind: 'teilen', hint: 'Schiebe das richtige Essen zu denen, die es brauchen.', share: vorratTeilen },
      questions: [
        { q: 'Wie viel von Gottes Auftrag tut Noah?', options: ['alles', 'die Hälfte', 'nichts'], answer: 0 },
        { q: 'Wer sagt Noah, dass er Essen sammeln soll?', options: ['Gott', 'seine Frau', 'sein Sohn Sem'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04-v2.webp`,
      title: 'Die Tiere kommen',
      ref: '1. Mose 6,19–20; 7,1–9',
      text: [
        'Als alles bereit ist, spricht Gott noch einmal zu Noah: „Geh in die Arche, du und deine ganze Familie. Ich habe gesehen, dass du so lebst, wie es mir gefällt. In sieben Tagen lasse ich es regnen.“ Noah tut es. Er geht mit seiner Frau, seinen Söhnen und deren Frauen in die Arche.',
        'Und dann kommen die Tiere. Aus allen Richtungen ziehen sie heran, Tiere vom Feld und aus der Wildnis, Vögel aus der Luft und kleine Tiere vom Boden. Von allen Arten kommen Männchen und Weibchen zu Noah.',
        'Noah muss sie nicht suchen und nicht rufen. Sie kommen zu ihm, und alle gehen in die Arche, so wie Gott es gesagt hat. Nun ist nichts mehr zu tun, als zu warten, sieben Tage lang.'
      ],
      task: { kind: 'memory', hint: 'Finde Männchen und Weibchen. Du siehst nur einige Tierarten als Beispiel.', memory: tierMemory },
      questions: [
        { q: 'Muss Noah die Tiere suchen?', options: ['nein, sie kommen zu ihm', 'ja, er sucht sie überall', 'ja, er ruft sie mit einem Horn'], answer: 0 },
        { q: 'Wie lange dauert es noch, bis der Regen beginnt?', options: ['sieben Tage', 'zwei Tage', 'zehn Tage'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Die Flut',
      ref: '1. Mose 7,10–24',
      text: [
        'Sieben Tage sind vergangen. Noah ist in der Arche, seine Frau, seine Söhne und ihre Frauen, dazu alle Tiere. Dann schließt Gott selbst die Tür hinter ihnen.',
        'Und es beginnt zu regnen, genau wie Gott es gesagt hat. Wasser fällt vom Himmel, und aus der Erde quillt es hervor. Vierzig Tage und vierzig Nächte lang regnet es.',
        'Das Wasser steigt. Es hebt die Arche vom Boden hoch, und sie schwimmt. Das Wasser steigt immer höher, bis sogar die hohen Berge davon bedeckt sind. Nur Noah und alle, die bei ihm in der Arche sind, bleiben übrig.',
        'Drinnen sind sie geborgen. Sie hören den Regen aufs Dach prasseln. Gott hat die Tür geschlossen, und die Arche trägt sie.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie lange regnet es?', options: ['vierzig Tage und Nächte', 'zehn Tage und Nächte', 'sieben Tage und Nächte'], answer: 0 },
        { q: 'Wer macht die Tür der Arche zu?', options: ['Gott', 'Noah', 'Sem'], answer: 0 },
        { q: 'Was bedeckt das Wasser zuletzt?', options: ['sogar die hohen Berge', 'nur die Felder', 'nur das Tal'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06-v2.webp`,
      title: 'Gott denkt an Noah',
      ref: '1. Mose 8,1–5',
      text: [
        'Viele Wochen schwimmt die Arche auf dem Wasser. Draußen ist nichts als Wasser, so weit man schauen kann. Aber Gott hat Noah nicht vergessen. Er denkt an Noah und an alle Tiere in der Arche.',
        'Gott schickt einen Wind über die Erde. Der Regen hört auf, und auf dem Dach ist es auf einmal still. Das Wasser wird weniger.',
        'Eines Tages gibt es einen Ruck. Die Arche sitzt fest! Sie hat auf einem Gebirge aufgesetzt, dem Gebirge Ararat.',
        'Das Wasser sinkt immer weiter. Zuerst ragt nur eine Spitze heraus, dann noch eine, dann viele: Die Gipfel der Berge tauchen auf.'
      ],
      task: { kind: 'punkte', hint: 'Tippe die Zahlen der Reihe nach an. Die Gipfel tauchen auf.', dots: araratPunkte },
      questions: [
        { q: 'Was schickt Gott, damit das Wasser sinkt?', options: ['einen Wind', 'noch mehr Regen', 'einen Regenbogen'], answer: 0 },
        { q: 'Wo setzt die Arche auf?', options: ['auf dem Gebirge Ararat', 'auf einer grünen Wiese', 'mitten im Dorf'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-07.webp`,
      title: 'Rabe und Taube',
      ref: '1. Mose 8,6–12',
      text: [
        'Vierzig Tage sind vergangen, seit die Berggipfel zu sehen sind. Noch immer sitzt die Arche auf dem Gebirge fest. Da öffnet Noah ein Fenster der Arche und lässt einen Raben hinaus. Der Rabe fliegt davon, hin und her, und Noah sieht ihm nach.',
        'Dann schickt Noah eine Taube. Sie soll nachsehen, ob das Wasser gesunken ist. Doch die Taube findet keinen Platz, auf dem sie sich ausruhen kann. Sie fliegt zurück, und Noah nimmt sie wieder zu sich in die Arche.',
        'Sieben Tage wartet Noah. Dann schickt er die Taube noch einmal los. Am Abend kommt sie zurück, und im Schnabel trägt sie ein frisches Blatt vom Ölbaum, ein Ölblatt! Jetzt weiß Noah: Das Wasser ist gesunken.',
        'Wieder wartet er sieben Tage. Diesmal schickt er die Taube zum dritten Mal los, und sie kommt nicht mehr zurück.'
      ],
      task: { kind: 'steuern', hint: 'Lenke die Taube mit dem Finger.', fly: taubeSteuern },
      questions: [
        { q: 'Wie viele Tage wartet Noah, bevor er die Taube wieder losschickt?', options: ['sieben', 'drei', 'zehn'], answer: 0 },
        { q: 'Welchen Vogel lässt Noah zuerst hinaus?', options: ['den Raben', 'die Taube', 'einen Adler'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-08.webp`,
      title: 'Aus der Arche',
      ref: '1. Mose 8,13–22',
      text: [
        'Die Taube ist nicht zurückgekommen, und Noah wartet weiter. Wieder ist Zeit vergangen. Da öffnet er das Dach der Arche und schaut hinaus. Der Boden ist trocken! Noch einmal vergeht eine Weile, dann ist die Erde ganz trocken. Und Gott spricht zu Noah: „Geh aus der Arche, du und deine Familie, und lass auch alle Tiere hinaus.“',
        'Noah geht hinaus, mit seiner Frau, seinen Söhnen und deren Frauen. Auch alle Tiere gehen hinaus, Art für Art. Endlich stehen alle wieder auf festem Boden.',
        'Dann baut Noah einen Altar und bringt Gott ein Opfer, um Danke zu sagen.',
        'Und Gott sagt: „Solange die Erde besteht, soll es Saat und Ernte geben, Sommer und Winter, Tag und Nacht.“'
      ],
      task: { kind: 'bauen', hint: 'Baue den Altar aus zwölf Steinen, von unten nach oben. Tippe einen Stein, um ihn zu drehen.', build: altarBauen },
      questions: [
        { q: 'Was sieht Noah, als er hinausschaut?', options: ['trockenen Boden', 'noch viel Wasser', 'einen neuen Berg'], answer: 0 },
        { q: 'Wer sagt Noah, dass er aus der Arche gehen soll?', options: ['Gott', 'sein Sohn', 'der Rabe'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-09.webp`,
      title: 'Der Regenbogen',
      ref: '1. Mose 9,1–17',
      text: [
        'Noch einmal spricht Gott zu Noah und seinen Söhnen. Er segnet sie: Sie sollen viele Kinder haben, und die Menschen sollen sich auf der Erde ausbreiten.',
        'Dann hält Gott, was er Noah versprochen hat. Er sagt: „Ich schließe meinen Bund mit euch und euren Nachkommen und mit allen Tieren, die aus der Arche gekommen sind. Das ist ein Versprechen für alle Zeiten: Nie wieder soll eine Flut kommen, die alles Leben zerstört.“',
        'Und Gott nennt auch ein Zeichen für sein Versprechen: „Ich setze meinen Bogen in die Wolken.“ Das ist der Regenbogen. Wenn Wolken über der Erde stehen und der Bogen leuchtet, sieht Gott ihn und denkt an sein Versprechen. Das Versprechen gilt für alle Zeiten, für alle Menschen und alle Tiere.'
      ],
      task: { kind: 'ausmalen', hint: 'Male das Bild voll aus.', image: `${IMG}ausmalen-09-v2.webp`, zones: AUSMALEN_9_ZONEN, jobs: AUSMALEN_9_AUFGABEN, jobCount: 3 },
      questions: [
        { q: 'Was ist das Zeichen für Gottes Versprechen?', options: ['der Regenbogen', 'ein goldener Stern', 'eine weiße Taube'], answer: 0 },
        { q: 'Was verspricht Gott?', options: ['Nie wieder kommt eine Flut, die alles Leben zerstört.', 'Es regnet nie wieder.', 'Es gibt nie wieder Wolken.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißen Noahs drei Söhne?', options: ['Sem, Ham und Jafet', 'Isaak, Jakob und Josef', 'Mose, Aaron und Josua'], answer: 0 },
    { q: 'Was soll Noah nach Gottes Plan bauen?', options: ['eine Arche aus Holz', 'eine Mauer aus Stein', 'einen Turm aus Lehm'], answer: 0 },
    { q: 'Wie lange regnet es?', options: ['vierzig Tage und Nächte', 'zehn Tage und Nächte', 'sieben Tage und Nächte'], answer: 0 },
    { q: 'Was bringt die Taube im Schnabel mit?', options: ['ein frisches Ölblatt', 'einen kleinen Stein', 'eine bunte Feder'], answer: 0 },
    { q: 'Was baut Noah, um Gott Danke zu sagen?', options: ['einen Altar', 'ein Haus', 'eine Mauer'], answer: 0 },
    { q: 'Was ist das Zeichen für Gottes Versprechen?', options: ['der Regenbogen', 'ein goldener Stern', 'eine weiße Taube'], answer: 0 }
  ]
}

// the story of every stage read aloud by Google's speech model, voice Achernar (skill script `vorlesen_gemini.py`); text version 3 (8 to 10 years) = files "-v3", new texts need new file names
// the version of the recording per stage: a re-recorded story (new text) gets a new file name; stage 5 was re-recorded for its new text
const RECORDING: Record<number, string> = { 5: '-v4' }
for (const s of noah.stages) {
  s.audio = `audio/abenteuer/noah/geschichte-${String(s.id).padStart(2, '0')}${RECORDING[s.id] ?? '-v3'}.mp3`
}

// the background music of this journey (calm pieces made with Google's Lyria 3.5, see the skill `lambking-abenteuer-skill`, ton.md): they follow one another at random
noah.music = [
  'audio/abenteuer/noah/musik-wasser-v1.mp3',
  'audio/abenteuer/noah/musik-hoffnung-v1.mp3',
  'audio/abenteuer/noah/musik-morgen-v1.mp3',
  'audio/abenteuer/noah/musik-wiegen-v1.mp3'
]

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(noah, noahEn)
