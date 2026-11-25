/**
 * Abenteuer "Hiskia: Ein Brief vor Gott" (2. Könige 18–20, 2. Chronik 29, 30 und 32; id `hiskia`) für 7 bis 10 Jahre: 10 Etappen. Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Luther 1912 kindgerecht erzählt; weggelassen (ETAPPENPLAN.md): die Tempelreinigung, Samaria, die Spottrede an Jesajas Antwort (V. 22–31), die Zahl im Lager von Assyrien, die Gesandten aus Babel und Hiskias Tod.
 * Etappe 8 nennt den Engel des HERRN nur im Text (nie im Bild, ohne Zahl, ohne Schlag); Gott der Vater, der Engel, Sanherib und sein Gesandter sind nie im Bild. Kein Blut, keine Waffen, keine Soldaten.
 * Merkvers: 2. Könige 19,6 (Lückenvers in Etappe 6).
 * Quelle der Texte: D:/Claude/Abenteuer-Hiskia/ENTWURF_Hiskia.md, Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 2 Schicke die Läufer los (laufwege, neu), 4 Am oberen Teich (memory, bekannt, Paare finden), 6 Lückenvers (lueckenvers, bekannt,
 * Merkvers 2. Kön 19,6), 8 Die Stadt wacht auf (stadtmorgen, neu), 9 Wie viele Stufen? (sonnenuhr, neu), 10 Treffen im Fels (stollen, neu); die Etappen 1, 3, 5 (ernst) und 7 nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/hiskia/, images/abenteuer/spiele/hiskia/<spiel>/, audio/abenteuer/hiskia/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Hiskia/tools/bauen_hiskia.py: nicht von Hand ändern.
 */
import type { Journey, MemoryGame, VerseGame } from '@/types/adventure'
import type { CityMorningGame, RunRoutesGame, SundialGame, TunnelGame } from '@/utils/hiskiaNeu'
import { josef } from './josef'
import { HISKIA_PATH } from './hiskiaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { hiskiaEn } from './en/hiskia.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung nach Antons Wahl): `images/abenteuer/hiskia/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/hiskia/'
const G = 'images/abenteuer/spiele/hiskia/'

/**
 * Etappe 2, "Schicke die Läufer los" (neu, `laufwege`, 2. Chr 30,1-12): auf der Karte vom Bergland stehen Jerusalem und fünf (Runde 1) oder sieben (Runde 2) Städte, durch Wege verbunden. Jeder Läufer hat drei Briefe,
 * in jeder Stadt bleibt ein Brief, in keine darf ein zweiter. Zahl der Läufer, Briefe und Wege sowie die Verteilung sind Spielregeln (der Text nennt keine Städte); wer lacht und wer sich aufmacht, ist je Runde festgelegt
 * (die Bibel sagt „etliche“). Lagen: VORLÄUFIG, am gemalten Bild nachzumessen (tools/_massen_hiskia.json).
 * Bilder (`spiele/hiskia/laufwege/`): `karte` (1500 × 1000), `jerusalem` (280 × 220), `ort-1…7` (je 200 × 170), `strasse` (600 × 56), `fuss` (56 × 56), `laeufer-1…3` (je 260 × 380), `brief` (90 × 120), `lacht`, `kommt` (je 360 × 280).
 */
const LAUFWEGE: RunRoutesGame = {
  background: `${G}laufwege/karte.webp`,
  ratio: 1.5,
  city: { image: `${G}laufwege/jerusalem.webp`, label: 'Jerusalem', x: 50, y: 86, w: 18 },
  cityRatio: 1.273,
  townRatio: 1.176,
  runners: [
    { image: `${G}laufwege/laeufer-1.webp`, label: 'Läufer mit Stirnband' },
    { image: `${G}laufwege/laeufer-2.webp`, label: 'Läufer mit Bartschatten' },
    { image: `${G}laufwege/laeufer-3.webp`, label: 'junger Läufer' }
  ],
  runnerRatio: 0.684,
  runnerW: 12.5,
  waiting: [{ x: 7, y: 96 }, { x: 19, y: 96 }, { x: 31, y: 96 }],
  road: `${G}laufwege/strasse.webp`,
  roadH: 3.4,
  step: `${G}laufwege/fuss.webp`,
  letter: `${G}laufwege/brief.webp`,
  letterRatio: 0.75,
  letterW: 5,
  scenes: { comes: `${G}laufwege/kommt.webp`, laughs: `${G}laufwege/lacht.webp` },
  sceneRatio: 1.286,
  sceneW: 22,
  rounds: [
    {
      hint: 'Zwei Läufer, fünf Städte. Tippe einen Läufer an, dann die Stadt, zu der er läuft.',
      runners: 2,
      letters: 3,
      towns: [
        { id: '1', image: `${G}laufwege/ort-1.webp`, label: 'Stadt 1', x: 52, y: 51, w: 17, reacts: 'laughs' },
        { id: '2', image: `${G}laufwege/ort-2.webp`, label: 'Stadt 2', x: 74, y: 67, w: 17, reacts: 'comes' },
        { id: '3', image: `${G}laufwege/ort-3.webp`, label: 'Stadt 3', x: 20, y: 46, w: 17, reacts: 'laughs' },
        { id: '4', image: `${G}laufwege/ort-4.webp`, label: 'Stadt 4', x: 70, y: 28, w: 17, reacts: 'laughs' },
        { id: '5', image: `${G}laufwege/ort-5.webp`, label: 'Stadt 5', x: 29, y: 68, w: 17, reacts: 'comes' }
      ],
      roads: [['J', '1'], ['J', '2'], ['J', '5'], ['1', '2'], ['1', '3'], ['1', '4'], ['1', '5'], ['3', '5']]
    },
    {
      hint: 'Drei Läufer, sieben Städte. In jede Stadt kommt nur ein Brief.',
      runners: 3,
      letters: 3,
      towns: [
        { id: '1', image: `${G}laufwege/ort-1.webp`, label: 'Stadt 1', x: 75, y: 62, w: 17, reacts: 'comes' },
        { id: '2', image: `${G}laufwege/ort-2.webp`, label: 'Stadt 2', x: 74, y: 29, w: 17, reacts: 'comes' },
        { id: '3', image: `${G}laufwege/ort-3.webp`, label: 'Stadt 3', x: 34, y: 55, w: 17, reacts: 'comes' },
        { id: '4', image: `${G}laufwege/ort-4.webp`, label: 'Stadt 4', x: 54, y: 54, w: 17, reacts: 'comes' },
        { id: '5', image: `${G}laufwege/ort-5.webp`, label: 'Stadt 5', x: 13, y: 58, w: 17, reacts: 'laughs' },
        { id: '6', image: `${G}laufwege/ort-6.webp`, label: 'Stadt 6', x: 24, y: 19, w: 17, reacts: 'laughs' },
        { id: '7', image: `${G}laufwege/ort-7.webp`, label: 'Stadt 7', x: 42, y: 30, w: 17, reacts: 'laughs' }
      ],
      roads: [
        ['J', '1'],
        ['J', '3'],
        ['J', '4'],
        ['1', '2'],
        ['1', '4'],
        ['2', '4'],
        ['2', '7'],
        ['3', '4'],
        ['3', '5'],
        ['3', '6'],
        ['3', '7'],
        ['4', '7'],
        ['6', '7']
      ]
    }
  ]
}

/**
 * Etappe 4, "Am oberen Teich" (Paare finden, bekannt 1, 2. Kön 18,13-17): sechs Paare von Dingen der Etappe (Wasserleitung, Teich, Türen, Truhe, Botschaft, Mauer), zu jedem Treffer ein Satz; kein Vers, keine Menschen,
 * kein Feind. Bilder (`spiele/hiskia/memory/`): `rueck` und sechs Karten, je 256 × 256.
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/leitung.webp`, text: 'Die Wasserleitung des oberen Teiches.' },
    { image: `${G}memory/teich.webp`, text: 'Der obere Teich.' },
    { image: `${G}memory/tuer.webp`, text: 'Die Türen am Tempel.' },
    { image: `${G}memory/truhe.webp`, text: 'Eine Truhe mit Silber.' },
    { image: `${G}memory/rolle.webp`, text: 'Hiskia schickt eine Botschaft nach Lachis.' },
    { image: `${G}memory/mauer.webp`, text: 'Die Mauer von Jerusalem.' }
  ]
}

/**
 * Etappe 6, "Lückenvers" (bekannt 2, 2. Kön 19,6, der Merkvers): der Vers steht im Wortlaut von Luther 1912 („Fürchte dich nicht vor den Worten, die du gehört hast“). Tafel und Blatt wie in allen Abenteuern
 * (aus `spiele/simson/lueckenvers/` kopiert), Hintergrund `hintergrund/vers-hintergrund` (Vorhalle des Tempels, ohne Menschen).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    {
      hint: 'Setze das fehlende Wort in den Vers.',
      parts: ['Fürchte dich nicht vor den ', ', die du gehört hast.'],
      words: ['Worten', 'Wellen', 'Wölfen'],
      answers: [0]
    },
    {
      hint: 'Jetzt fehlen zwei Wörter.',
      parts: ['', ' dich nicht vor den Worten, die du ', ' hast.'],
      words: ['Fürchte', 'gehört', 'Freue', 'gesehen'],
      answers: [0, 1]
    }
  ]
}

/**
 * Etappe 8, "Die Stadt wacht auf" (neu, `stadtmorgen`, 2. Kön 19,35 „am Morgen früh“): am Hang von Jerusalem stehen Häuser in einem Raster, ihre Türen sind noch zu. Ein Tipp wechselt die Tür des Hauses und die Türen der vier
 * Nachbarn; sind alle offen, ist der Morgen da. Die Nachbarregel und die Zahl der Häuser sind Spielregeln; kein Lager, kein Feind, keine Waffen, kein Engel. Lagen des Rasters: VORLÄUFIG (tools/_massen_hiskia.json).
 * Bilder (`spiele/hiskia/stadtmorgen/`): `hang` (900 × 1200), `haus-1|2-zu|auf` (je 280 × 260).
 */
const STADTMORGEN: CityMorningGame = {
  background: `${G}stadtmorgen/hang.webp`,
  ratio: 0.75,
  houses: [
    { shut: `${G}stadtmorgen/haus-1-zu.webp`, open: `${G}stadtmorgen/haus-1-auf.webp` },
    { shut: `${G}stadtmorgen/haus-2-zu.webp`, open: `${G}stadtmorgen/haus-2-auf.webp` }
  ],
  houseRatio: 1.077,
  fill: 1,
  rounds: [
    {
      hint: 'Neun Häuser, drei Türen sind noch zu.',
      cols: 3,
      rows: 3,
      shut: [true, false, false, false, true, false, false, false, true],
      grid: { x: 8, y: 30, w: 84, h: 58.5 }
    },
    {
      hint: 'Zwölf Häuser, sieben Türen sind noch zu.',
      cols: 3,
      rows: 4,
      shut: [true, false, false, true, true, false, true, true, false, true, false, true],
      grid: { x: 12, y: 20, w: 76, h: 68 }
    }
  ]
}

/**
 * Etappe 9, "Wie viele Stufen?" (neu, `sonnenuhr`, 2. Kön 20,8-11): der Schatten liegt auf einer Stufe der Treppe des Ahas; das Kind zeigt mit der Schattenspitze (dem Griff), auf welcher Stufe er nach drei Stufen vorwärts und nach
 * zehn Stufen zurück stehen wird, und zählt dabei. Erst nach der richtigen Antwort bewegt sich der Schatten von selbst (das Zeichen macht nicht das Kind). Vierzehn Stufen und der Übungsschritt von drei Stufen sind Spielregeln.
 * Die Lage der Stufen (`treads`, Prozent der Bildhöhe, von oben) und des Pfostens ist VORLÄUFIG und am gemalten Bild nachzumessen (tools/_massen_hiskia.json).
 * Bilder (`spiele/hiskia/sonnenuhr/`): `treppe` (900 × 1200), `schatten` (220 × 600), `spitze` (160 × 160).
 */
const SONNENUHR: SundialGame = {
  background: `${G}sonnenuhr/treppe.webp`,
  ratio: 0.75,
  treads: [23, 27.3, 31.6, 36.2, 41, 45.7, 51, 56.4, 62, 67.8, 73.9, 80.2, 86.7, 93.4],
  post: { x: 76.6, y: 21.3 },
  shadow: `${G}sonnenuhr/schatten.webp`,
  shadowW: 7,
  tip: `${G}sonnenuhr/spitze.webp`,
  tipW: 17,
  notchX: 8.3,
  rounds: [
    {
      hint: 'Der Schatten geht drei Stufen vorwärts, die Treppe hinab. Zeige, wo er dann steht.',
      start: 4,
      steps: 3,
      dir: 1
    },
    {
      hint: 'Jetzt geht der Schatten zehn Stufen zurück, die Treppe hinauf. Zeige, wo er dann steht.',
      start: 13,
      steps: 10,
      dir: -1
    }
  ]
}

/**
 * Etappe 10, "Treffen im Fels" (neu, `stollen`, 2. Kön 20,20; 2. Chr 32,30): von oben gesehen liegt der Fels zwischen einer Quelle (links) und einem Teich (rechts); zwei Gräbertrupps beginnen an den Enden, das Kind wählt für beide
 * Trupps Zug um Zug die Richtung (oben, geradeaus, unten), dunkle Gesteinsschichten schieben den Stollen zur Seite, in der Mitte sollen sich die Stollen treffen. Dass von zwei Seiten gegraben wurde, steht nicht in der Bibel
 * (Forschungsstand): hier nur Spielregel; die Schichten, Stücke und das Klopfzeichen sind erdacht. Einheiten: Prozent der Bildbreite (die Bildhöhe ist 66,7). Sterne nach der Treffgenauigkeit.
 * Bilder (`spiele/hiskia/stollen/`): `fels` (1500 × 1000), `quelle`, `teich` (je 300 × 300), `schicht-ab|auf` (je 420 × 1000), `trupp-links|rechts` (je 220 × 220), `gang` (160 × 90), `wasser` (160 × 60), `klopf` (160 × 160), `zeiger` (80 × 80).
 */
const STOLLEN: TunnelGame = {
  background: `${G}stollen/fels.webp`,
  ratio: 1.5,
  spring: { image: `${G}stollen/quelle.webp`, x: 8, w: 12, label: 'die Quelle' },
  pool: { image: `${G}stollen/teich.webp`, x: 92, w: 12, label: 'der Teich' },
  crews: {
    left: `${G}stollen/trupp-links.webp`,
    right: `${G}stollen/trupp-rechts.webp`,
    w: 11.5,
    labelLeft: 'Gräbertrupp bei der Quelle',
    labelRight: 'Gräbertrupp beim Teich'
  },
  tile: { gang: `${G}stollen/gang.webp`, water: `${G}stollen/wasser.webp`, w: 5.2 },
  knock: `${G}stollen/klopf.webp`,
  pointer: `${G}stollen/zeiger.webp`,
  bands: { ab: `${G}stollen/schicht-ab.webp`, auf: `${G}stollen/schicht-auf.webp` },
  tolerance: { three: 1.5, two: 3, join: 8 },
  rounds: [
    {
      hint: 'Wähle für beide Trupps eine Richtung und tippe auf »Graben«. Die dunklen Schichten schieben den Stollen zur Seite.',
      pieces: 5,
      seg: 9,
      turn: 20,
      left: { x: 6, y: 22 },
      right: { x: 94, y: 38 },
      bands: [{ x0: 18, x1: 34, shift: 1.8, image: 'ab' }, { x0: 66, x1: 82, shift: -1.8, image: 'auf' }],
      listen: 'always'
    },
    {
      hint: 'Drei Schichten schieben den Stollen. Tippe auf »Horchen«, dann siehst du, wo der andere Trupp klopft.',
      pieces: 6,
      seg: 7.5,
      turn: 20,
      left: { x: 6, y: 30 },
      right: { x: 94, y: 46 },
      bands: [
        { x0: 14, x1: 28, shift: -2, image: 'auf' },
        { x0: 40, x1: 58, shift: 2.2, image: 'ab' },
        { x0: 72, x1: 86, shift: -2, image: 'auf' }
      ],
      listen: 'button'
    }
  ]
}

export const hiskia: Journey = {
  id: 'hiskia',
  title: 'Hiskia: Ein Brief vor Gott',
  subtitle: 'Vom Brief an alle bis zum Wasser für die Stadt',
  age: '8-10',
  downloadMb: 12, // gemessen 25.11.2026: alle 119 Dateien von journeyFiles(hiskia) = 11,97 MB (Panorama v3), aufgerundet
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild (Standard bis zu Antons Wahl: Variante b): Jerusalem in Hiskias Tagen, Konturzeichnung für Zehnjährige
  gift: { title: 'Jerusalem in Hiskias Tagen', image: `${PICS}geschenk-b.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Tempel mit der offenen Tür über die Mauer und den Vorhof bis zum Hang mit Teich und Wasserleitung;
  // Stationen aus ergebnis/panorama-<Fassung>/map-hiskia*.json, Perlenweg aus hiskiaPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/hiskia/karte-pano-v3-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1310, y: 0.6978, d: 0.0339 },
      { x: 0.1714, y: 0.1396, d: 0.0339 },
      { x: 0.3327, y: 0.4733, d: 0.0339 },
      { x: 0.4385, y: 0.3277, d: 0.0339 },
      { x: 0.5595, y: 0.7767, d: 0.0339 },
      { x: 0.6653, y: 0.4369, d: 0.0339 },
      { x: 0.7460, y: 0.7706, d: 0.0339 },
      { x: 0.8397, y: 0.1820, d: 0.0339 },
      { x: 0.8851, y: 0.7585, d: 0.0339 },
      { x: 0.9677, y: 0.2002, d: 0.0339 }
    ],
    exam: { x: 0.9839, y: 0.7585, d: 0.0339 },
    path: HISKIA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      music: 'audio/abenteuer/hiskia/musik-offenetuer-v1.mp3',
      title: 'Hiskia wird König',
      ref: '2. Könige 18,1–7; 2. Chronik 29,3',
      text: [
        'Hiskia ist fünfundzwanzig Jahre alt, als er König wird. Sein Vater Ahas war König in Juda. Neunundzwanzig Jahre lang regiert Hiskia in Jerusalem.',
        'Hiskia tut, was dem HERRN gefällt, wie sein Vorfahre David. Er vertraut dem HERRN, dem Gott Israels, so sehr, dass es unter allen Königen von Juda keinen gibt wie ihn, weder vor ihm noch nach ihm.',
        'Er hält sich an den HERRN und weicht nicht von ihm ab. Der HERR ist mit ihm. Wohin Hiskia auch zieht, er handelt klug. Dem König von Assyrien will er nicht mehr untertan sein.',
        'Im ersten Monat des ersten Jahres, seit er König ist, macht Hiskia die Türen am Haus des HERRN auf und bessert sie aus.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie alt ist Hiskia, als er König wird?', options: ['fünfundzwanzig Jahre', 'zwölf Jahre', 'vierzig Jahre'], answer: 0 },
        { q: 'Wem vertraut Hiskia?', options: ['dem HERRN, dem Gott Israels', 'dem König von Assyrien', 'dem Pharao von Ägypten'], answer: 0 },
        { q: 'Was macht Hiskia im ersten Jahr als König?', options: ['Er macht die Türen am Haus des HERRN auf.', 'Er baut eine neue Mauer.', 'Er reist nach Assyrien.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      music: 'audio/abenteuer/hiskia/musik-offenetuer-v1.mp3',
      title: 'Briefe an alle',
      ref: '2. Chronik 30,1–12',
      text: [
        'Hiskia will das Passahfest feiern. Es ist lange nicht mehr so gefeiert worden, wie es geschrieben steht. Darum schreibt Hiskia Briefe an ganz Israel und Juda: Alle sollen nach Jerusalem zum Haus des HERRN kommen.',
        'Läufer tragen die Briefe des Königs durch das ganze Land. „Ihr Kinder Israel“, rufen sie, „kehrt um zum HERRN! Der HERR, euer Gott, ist gnädig und barmherzig. Er wendet sein Angesicht nicht von euch ab, wenn ihr zu ihm umkehrt.“',
        'Die Läufer gehen von Stadt zu Stadt. Viele lachen sie aus und spotten über sie. Doch einige demütigen sich und kommen nach Jerusalem. Auch in Juda macht Gott die Herzen einig, so dass sie tun, was der König geboten hat.'
      ],
      // Spiel: Schicke die Läufer los (laufwege, neu)
      task: { kind: 'laufwege', hint: 'Hiskia schickt Läufer mit Briefen. Jeder Läufer hat drei Briefe. Schicke sie so los, dass jede Stadt einen bekommt.', runRoutes: LAUFWEGE },
      questions: [
        { q: 'Wer trägt Hiskias Briefe durch das Land?', options: ['die Läufer', 'die Hirten', 'die Priester'], answer: 0 },
        { q: 'Was tun viele Leute, als die Läufer kommen?', options: ['Sie lachen und spotten.', 'Sie laufen sofort mit.', 'Sie schließen die Tore.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      music: 'audio/abenteuer/hiskia/musik-offenetuer-v1.mp3',
      title: 'Das große Fest',
      ref: '2. Chronik 30,13–27',
      text: [
        'Ein großes Volk kommt in Jerusalem zusammen. Sie feiern das Fest sieben Tage lang mit großer Freude.',
        'Viele von ihnen haben sich nicht so vorbereitet, wie es geschrieben steht. Da bittet Hiskia für sie: „Der HERR, der gütig ist, wolle allen gnädig sein, die ihr Herz darauf richten, Gott zu suchen, den HERRN, den Gott ihrer Väter.“ Und der HERR erhört Hiskia.',
        'Die Priester und die Leviten loben den HERRN jeden Tag mit Saitenspielen. Als die sieben Tage um sind, beschließen alle, noch einmal sieben Tage zu feiern, und sie feiern mit Freuden.',
        'Es ist große Freude in Jerusalem. Seit der Zeit Salomos, des Sohnes Davids, ist so etwas nicht gewesen. Dann stehen die Priester und die Leviten auf und segnen das Volk. Ihre Stimme wird erhört, und ihr Gebet kommt zu Gottes heiliger Wohnung im Himmel.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele Tage feiern sie zuerst?', options: ['sieben Tage', 'drei Tage', 'vierzig Tage'], answer: 0 },
        { q: 'Wer bittet für die Leute, die nicht so vorbereitet sind?', options: ['Hiskia', 'Salomo', 'Jesaja'], answer: 0 },
        { q: 'Seit wann gab es in Jerusalem keine solche Freude mehr?', options: ['seit der Zeit Salomos', 'seit der Zeit Noahs', 'seit der Zeit Davids'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      music: 'audio/abenteuer/hiskia/musik-vormauer-v1.mp3',
      title: 'Sanherib kommt',
      ref: '2. Könige 18,13–17',
      text: [
        'Im vierzehnten Jahr, seit Hiskia König ist, zieht Sanherib, der König von Assyrien, gegen alle festen Städte von Juda und nimmt sie ein. Da schickt Hiskia zu ihm nach Lachis: „Ich habe mich versündigt. Zieh ab von mir. Was du mir auflegst, will ich tragen.“',
        'Der König von Assyrien verlangt sehr viel Silber und Gold. Hiskia gibt ihm alles Silber, das er im Haus des HERRN und in den Schätzen des Königshauses findet. Er bricht sogar die Platten von den Türen am Tempel ab, die er selbst hatte darüberziehen lassen, und gibt sie dem König von Assyrien.',
        'Doch der König von Assyrien schickt seinen Gesandten, den Erzschenken, mit zwei anderen hohen Männern und einem großen Heer von Lachis nach Jerusalem. Sie halten an der Wasserleitung des oberen Teiches und rufen nach dem König.'
      ],
      // Spiel: Am oberen Teich (memory, Paare finden, bekannt, ohne Vers)
      task: { kind: 'memory', hint: 'Finde die zwei gleichen Bilder.', memory: MEMORY },
      questions: [
        { q: 'Wer zieht gegen die festen Städte von Juda?', options: ['Sanherib, der König von Assyrien', 'Salomo, der König von Israel', 'der Pharao von Ägypten'], answer: 0 },
        { q: 'Woher nimmt Hiskia das Silber?', options: ['aus dem Haus des HERRN und aus den Schätzen des Königshauses', 'aus dem Fluss und aus den Bergen', 'vom Markt und von den Feldern'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      music: 'audio/abenteuer/hiskia/musik-vormauer-v1.mp3',
      title: 'Worauf verlässt du dich?',
      ref: '2. Könige 18,19–37',
      text: [
        'Drei Männer des Königs kommen vor der Mauer zu dem Gesandten des Königs von Assyrien heraus. „Sagt Hiskia“, fordert er sie auf, „so spricht der große König: Worauf verlässt du dich denn?“',
        'Dann ruft er mit lauter Stimme zu den Leuten auf der Mauer, in der Sprache der Juden: „Lasst euch von Hiskia nicht auf den HERRN vertrösten, wenn er sagt: Der HERR wird uns erretten. Wo ist ein Gott, der sein Land aus meiner Hand gerettet hat? Wie sollte der HERR Jerusalem aus meiner Hand erretten?“',
        'Die Leute auf der Mauer schweigen und antworten ihm nichts, denn der König hat geboten: „Antwortet ihm nichts.“ Hiskias Männer gehen mit zerrissenen Kleidern zu ihm und sagen ihm, was der Gesandte gerufen hat.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was fragt der Gesandte den König?', options: ['Worauf verlässt du dich denn?', 'Wo ist dein Schatz?', 'Wann öffnest du das Tor?'], answer: 0 },
        { q: 'Wie antworten die Leute auf der Mauer?', options: ['Sie schweigen.', 'Sie rufen laut zurück.', 'Sie laufen weg.'], answer: 0 },
        { q: 'Wohin gehen Hiskias Männer zuletzt?', options: ['zu Hiskia', 'zu Sanherib', 'zum Tempel'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      music: 'audio/abenteuer/hiskia/musik-vormauer-v1.mp3',
      title: 'Im Haus des HERRN',
      ref: '2. Könige 19,1–7',
      text: [
        'Als Hiskia hört, was der Gesandte gesagt hat, zerreißt er seine Kleider, legt einen Sack an und geht in das Haus des HERRN.',
        'Er schickt seine Männer und die ältesten Priester, auch sie mit Säcken angetan, zu dem Propheten Jesaja, dem Sohn des Amoz.',
        'Sie sagen: „So spricht Hiskia: Das ist ein Tag der Not, des Scheltens und des Lästerns. Vielleicht hört der HERR, dein Gott, alle Worte des Gesandten, der den lebendigen Gott verspottet hat. Bete für alle, die noch übrig sind.“',
        'Jesaja antwortet: „So sagt eurem Herrn: So spricht der HERR: Fürchte dich nicht vor den Worten, die du gehört hast, mit denen die Knechte des Königs von Assyrien mich gelästert haben. Er wird ein Gerücht hören und wieder in sein Land ziehen.“'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt, Merkvers 2. Kön 19,6)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Zu wem schickt Hiskia seine Männer?', options: ['zum Propheten Jesaja', 'zum König von Assyrien', 'zu den Läufern'], answer: 0 },
        { q: 'Was legt Hiskia an, als er ins Haus des HERRN geht?', options: ['einen Sack', 'eine Rüstung', 'einen Mantel'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      music: 'audio/abenteuer/hiskia/musik-briefgebet-v1.mp3',
      title: 'Ein Brief vor Gott',
      ref: '2. Könige 19,8–19',
      text: [
        'Sanherib, der König von Assyrien, schickt noch einmal Boten zu Hiskia, mit einem Brief. „Lass dich deinen Gott nicht betrügen, auf den du dich verlässt“, steht darin. „Du hast gehört, was die Könige von Assyrien getan haben. Und du solltest gerettet werden?“',
        'Hiskia nimmt den Brief von den Boten und liest ihn. Dann geht er hinauf zum Haus des HERRN und breitet den Brief vor dem HERRN aus.',
        'Er betet: „HERR, Gott Israels, du bist allein Gott über alle Königreiche auf Erden. Du hast Himmel und Erde gemacht. HERR, neige deine Ohren und höre! Tu deine Augen auf und sieh! Höre die Worte Sanheribs, der gesandt hat, den lebendigen Gott zu verspotten.“',
        '„Nun aber, HERR, unser Gott, hilf uns aus seiner Hand, damit alle Königreiche auf Erden erkennen, dass du, HERR, allein Gott bist.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was breitet Hiskia vor dem HERRN aus?', options: ['den Brief', 'seine Krone', 'ein Tuch'], answer: 0 },
        { q: 'Wohin geht Hiskia mit dem Brief?', options: ['hinauf zum Haus des HERRN', 'auf die Mauer', 'zu Jesaja'], answer: 0 },
        { q: 'Um was bittet Hiskia den HERRN?', options: ['Hilf uns aus seiner Hand.', 'Schick uns Regen.', 'Gib uns viel Silber.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      music: 'audio/abenteuer/hiskia/musik-briefgebet-v1.mp3',
      title: 'Gott antwortet',
      ref: '2. Könige 19,20–21.32–36',
      text: [
        'Jesaja, der Sohn des Amoz, schickt eine Antwort zu Hiskia: „So spricht der HERR, der Gott Israels: Was du zu mir gebetet hast um Sanherib, den König von Assyrien, das habe ich gehört.“ Über Sanherib sagt der HERR: „Die Tochter Jerusalem schüttelt den Kopf über dich.“',
        'Und weiter spricht der HERR über den König von Assyrien: „Er soll nicht in diese Stadt kommen. Den Weg, den er gekommen ist, soll er wieder zurückziehen. Ich will diese Stadt beschirmen und ihr helfen, um meinetwillen und um meines Knechtes David willen.“',
        'In derselben Nacht fährt der Engel des HERRN aus. Am Morgen früh ist im Lager von Assyrien kein Feind mehr. Also bricht Sanherib, der König von Assyrien, auf, zieht weg, kehrt um und bleibt in Ninive.'
      ],
      // Spiel: Die Stadt wacht auf (stadtmorgen, neu)
      task: { kind: 'stadtmorgen', hint: 'Die Stadt wacht auf. Tippe ein Haus an: Seine Tür und die Türen daneben wechseln. Öffne alle Türen.', cityMorning: STADTMORGEN },
      questions: [
        { q: 'Was sagt der HERR zu Hiskias Gebet?', options: ['Ich habe es gehört.', 'Ich habe es vergessen.', 'Ich will es prüfen.'], answer: 0 },
        { q: 'Wo bleibt Sanherib am Ende?', options: ['in Ninive', 'in Jerusalem', 'in Ägypten'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      music: 'audio/abenteuer/hiskia/musik-briefgebet-v1.mp3',
      title: 'Der Schatten geht zurück',
      ref: '2. Könige 20,1–11',
      text: [
        'Zu der Zeit wird Hiskia todkrank. Jesaja kommt zu ihm: „So spricht der HERR: Bring dein Haus in Ordnung, denn du wirst sterben.“',
        'Da dreht Hiskia sein Gesicht zur Wand und betet: „Ach, HERR, denke doch daran, dass ich treu vor dir gelebt habe und getan habe, was dir gefällt.“ Und Hiskia weint sehr.',
        'Jesaja ist noch nicht weit gegangen, da kommt das Wort des HERRN zu ihm: „Geh zurück und sage Hiskia: Ich habe dein Gebet gehört und deine Tränen gesehen. Ich will dich gesund machen. Ich will fünfzehn Jahre zu deinem Leben tun.“',
        'Als Zeichen fragt Jesaja: „Soll der Schatten zehn Stufen vorwärts gehen oder zehn Stufen zurück?“ „Vorwärts ist leicht“, sagt Hiskia. „Ich will, dass er zehn Stufen zurückgeht.“ Jesaja ruft den HERRN an, und der Schatten geht zehn Stufen zurück an der Treppe des Ahas.'
      ],
      // Spiel: Wie viele Stufen? (sonnenuhr, neu)
      task: { kind: 'sonnenuhr', hint: 'Der Schatten wandert über die Treppe. Zeige mit der Schattenspitze, wo er stehen wird, und zähle Stufe für Stufe.', sundial: SONNENUHR },
      questions: [
        { q: 'Was tut Hiskia, als er hört, dass er sterben wird?', options: ['Er dreht sein Gesicht zur Wand und betet.', 'Er läuft aus dem Haus.', 'Er ruft nach den Ärzten.'], answer: 0 },
        { q: 'Wie viele Jahre will der HERR zu Hiskias Leben tun?', options: ['fünfzehn Jahre', 'drei Jahre', 'hundert Jahre'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      music: 'audio/abenteuer/hiskia/musik-briefgebet-v1.mp3',
      title: 'Das Wasser für die Stadt',
      ref: '2. Könige 20,20; 2. Chronik 32,2–4.30',
      text: [
        'Von Hiskia wird noch mehr erzählt. Als Sanherib kommt und gegen Jerusalem ziehen will, hält Hiskia Rat mit seinen Obersten und Mächtigen. Sie wollen das Wasser der Quellen draußen vor der Stadt zudecken, und sie helfen ihm.',
        'Ein großes Volk versammelt sich. Sie decken alle Brunnen zu und den Bach, der mitten durchs Land fließt. „Die Könige von Assyrien sollen nicht viel Wasser finden, wenn sie kommen“, sagen sie.',
        'Hiskia macht den Teich und die Wasserleitung, durch die er Wasser in die Stadt leitet. Die obere Quelle des Gihon deckt er zu und leitet das Wasser hinunter, auf die Westseite der Stadt Davids.'
      ],
      // Spiel: Treffen im Fels (stollen, neu)
      task: { kind: 'stollen', hint: 'Zwei Trupps graben von beiden Seiten durch den Fels. Lenke beide, damit sie sich in der Mitte treffen.', tunnel: STOLLEN },
      questions: [
        { q: 'Was sollen die Könige von Assyrien nicht finden, wenn sie kommen?', options: ['viel Wasser', 'viel Brot', 'viel Silber'], answer: 0 },
        { q: 'Wohin leitet Hiskia das Wasser der oberen Quelle des Gihon?', options: ['in die Stadt hinunter', 'auf die Felder', 'in den Jordan'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was macht Hiskia im ersten Jahr als König?', options: ['Er macht die Türen am Haus des HERRN auf.', 'Er baut eine neue Mauer.', 'Er reist nach Assyrien.'], answer: 0 },
    { q: 'Wie antworten die Leute auf der Mauer dem Gesandten?', options: ['Sie schweigen.', 'Sie rufen laut zurück.', 'Sie laufen weg.'], answer: 0 },
    { q: 'Was breitet Hiskia vor dem HERRN aus?', options: ['den Brief', 'seine Krone', 'ein Tuch'], answer: 0 },
    { q: 'Wo bleibt Sanherib am Ende?', options: ['in Ninive', 'in Jerusalem', 'in Ägypten'], answer: 0 },
    { q: 'Wie viele Stufen geht der Schatten zurück?', options: ['zehn Stufen', 'drei Stufen', 'zwölf Stufen'], answer: 0 },
    { q: 'Was sollen die Könige von Assyrien nicht finden, wenn sie kommen?', options: ['viel Wasser', 'viel Brot', 'viel Silber'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of hiskia.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-vK.mp3"; K is the version, a re-recorded story gets a new number); until a recording is made the app reads with the voice of the device.
// stage -> version of the file in public/audio/abenteuer/hiskia/ (written by bauen_hiskia.py from the files that exist and ergebnis/geltend.json)
const RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 6, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2 }
for (const s of hiskia.stages) {
  const version = RECORDING_VERSION[s.id]
  const file = version ? `audio/abenteuer/hiskia/geschichte-${String(s.id).padStart(2, '0')}-v${version}.mp3` : undefined
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria; they follow one another at random (a stage with its own `music` plays exactly that piece)
hiskia.music = [
  'audio/abenteuer/hiskia/musik-offenetuer-v1.mp3',
  'audio/abenteuer/hiskia/musik-vormauer-v1.mp3',
  'audio/abenteuer/hiskia/musik-briefgebet-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(hiskia, hiskiaEn)
