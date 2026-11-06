/**
 * Abenteuer "Alles wird neu" (Offenbarung 1–5, 7, 21–22; id `offenbarung`) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Eine Auswahl aus der Offenbarung: die Kapitel der Hoffnung". Entstanden nach dem Skill "LambKing Abenteuer Skill", Nr. 33 der Gesamtreise, das letzte Abenteuer.
 * Jesus mit Gesicht nur in Etappe 4 (ohne Heiligenschein, ohne Lichtkranz). Gott, Engel, die Ältesten, die vier Wesen und Lichtgestalten sind nie im Bild; sie stehen nur im Text. Nicht aufgenommen: Offb 6 und 8–20
 * (Reiter, Plagen, Drache, Tiere, Babylon, das tausendjährige Reich), die Drohworte in den Briefen und Offb 21,8. "getötet" (Etappe 6) steht im Text, wie Luther 1912 "erwürget" mild sagt.
 * Quelle der Texte: D:/Claude/Abenteuer-Offenbarung/ENTWURF_Offenbarung.md (Luther 1912 von bibeltext.com gelesen, nacherzählt), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Schreib es in ein Buch (neu, schreiben), 2 nur Fragen, 3 Sieben Briefe (neu, briefe), 4 Lückenvers (bekannt),
 * 5 nur Fragen, 6 Alle stimmen ein (neu, lob), 7 Palmzweige (neu, palmen), 8 Puzzle (bekannt), 9 Zwölf Perlentore (neu, perlentore).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/offenbarung/, images/abenteuer/spiele/offenbarung/<spiel>/, audio/abenteuer/offenbarung/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Offenbarung/tools/bauen_offenbarung.py: nicht von Hand ändern.
 */
import type { Journey, PuzzleGame, VerseGame } from '@/types/adventure'
import type { LettersGame, PraiseGame, WriteGame } from '@/utils/offenbarungNeuA'
import type { GatesGame, PalmsGame } from '@/utils/offenbarungNeuB'
import { josef } from './josef'
import { OFFENBARUNG_PATH } from './offenbarungPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { offenbarungEn } from './en/offenbarung.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/offenbarung/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/offenbarung/'

const G = 'images/abenteuer/spiele/offenbarung/'

/**
 * Etappe 1, "Schreib es in ein Buch" (neu, `schreiben`, Offb 1,11): der Schreibplatz von oben (3:2, ohne Feder und Tintenfass), die App legt dünne Hilfslinien über die Rolle; die Feder folgt dem Finger,
 * eine Schrift ohne lesbare Zeichen erscheint. Eine Füllung reicht für 0.6 einer Zeile der Länge 1; vor dem Leerwerden ins Tintenfass tauchen. Runde 1: drei Zeilen, Runde 2: fünf längere Zeilen.
 * Lagen in Prozent (am Rohbild `tisch` gemessen 6.11.2026: Papyrus von 13 bis 70 % der Breite, Tintenfass rechts auf dem Stein; tools/_massen_offenbarung.json).
 * Bilder: `schreiben/tisch`, `rolle-zu`, `tintenfass`, `feder`, `schrift-zeile`, `tropfen-voll`, `tropfen-leer`.
 */
const SCHREIBEN: WriteGame = {
  desk: `${G}schreiben/tisch.webp`,
  closed: `${G}schreiben/rolle-zu.webp`,
  inkwell: `${G}schreiben/tintenfass.webp`,
  pen: `${G}schreiben/feder.webp`,
  script: `${G}schreiben/schrift-zeile.webp`,
  dropFull: `${G}schreiben/tropfen-voll.webp`,
  dropEmpty: `${G}schreiben/tropfen-leer.webp`,
  ratio: 1.5,
  inkwellAt: { x: 89, y: 48, r: 9 },
  inkwellW: 14.7,
  lineX: [15, 68],
  lineYs: [26, 38, 50, 62, 74],
  band: 5,
  scriptH: 5,
  penW: 12,
  penTip: { x: 0.03, y: 0.7 },
  penRest: { x: 84, y: 84 },
  dropAt: { x: 89, y: 28 },
  dropW: 9,
  inkPerDip: 0.6,
  warnAt: 0.2,
  rounds: [
    { hint: 'Drei kurze Zeilen. Tauch die Feder ein, bevor die Tinte ausgeht.', lines: 3, lineLength: 1 },
    { hint: 'Jetzt sind es fünf längere Zeilen. Du musst öfter eintauchen.', lines: 5, lineLength: 1.6 }
  ]
}

/**
 * Etappe 3, "Sieben Briefe" (neu, `briefe`, Offb 1,11; 2–3): die gemalte Karte der Küste von Asien (3:2, ohne Schrift), eine Straße im Ring durch die sieben Städte, jede mit einem gemalten Wahrzeichen;
 * der Bote geht die Straße entlang und bleibt an jedem Stadttor stehen, das Kind gibt ihm den Brief der Stadt (Siegel mit dem Wahrzeichen). Runde 1: die ersten drei Städte mit Namen am Tor,
 * Runde 2: alle sieben ohne Namen am Tor. Straße und Stadttore in Prozent am Rohbild `karte` gemessen (6.11.2026; `at` = Stelle der Stadt auf der Straße, 0 bis 1; tools/_massen_offenbarung.json).
 * Bilder: `briefe/karte`, `bote-1`, `bote-2`, `leuchter`, `brief-<stadt>`.
 */
const BRIEFE: LettersGame = {
  map: `${G}briefe/karte.webp`,
  messenger: [`${G}briefe/bote-1.webp`, `${G}briefe/bote-2.webp`],
  lamp: `${G}briefe/leuchter.webp`,
  ratio: 1.5,
  speed: 16,
  messengerW: 12,
  gateR: 6.5,
  lampW: 9,
  path: [{ x: 15.1, y: 69.9 }, { x: 17.1, y: 69.5 }, { x: 18.6, y: 68.4 }, { x: 18.9, y: 67.2 }, { x: 18.2, y: 64.5 }, { x: 17.1, y: 61.7 }, { x: 16, y: 59.4 }, { x: 15.6, y: 57.8 }, { x: 17.1, y: 55.9 }, { x: 18.6, y: 53.2 }, { x: 18.6, y: 50.8 }, { x: 17.6, y: 49.3 }, { x: 15.3, y: 47.9 }, { x: 13, y: 47.4 }, { x: 10.7, y: 46.4 }, { x: 9.4, y: 44.1 }, { x: 9.8, y: 42 }, { x: 10.3, y: 40 }, { x: 9.2, y: 38.1 }, { x: 8.6, y: 35.6 }, { x: 9.8, y: 33.7 }, { x: 12.4, y: 31.2 }, { x: 14, y: 28.8 }, { x: 15.3, y: 26.4 }, { x: 17.3, y: 24.4 }, { x: 19.5, y: 22 }, { x: 20.8, y: 19.5 }, { x: 21.2, y: 17.6 }, { x: 21.9, y: 15.9 }, { x: 23.8, y: 13.2 }, { x: 25.7, y: 12.2 }, { x: 25.9, y: 10.9 }, { x: 22.8, y: 9.8 }, { x: 20.2, y: 8.6 }, { x: 18.9, y: 8 }, { x: 21.5, y: 7.8 }, { x: 23.4, y: 9.6 }, { x: 25.9, y: 11.2 }, { x: 28.6, y: 13.7 }, { x: 31.9, y: 14.5 }, { x: 34.2, y: 15.3 }, { x: 36.5, y: 15.8 }, { x: 39.1, y: 17.1 }, { x: 41.3, y: 18.4 }, { x: 43.6, y: 19.3 }, { x: 46.2, y: 20 }, { x: 48.8, y: 20.2 }, { x: 51.8, y: 20.8 }, { x: 55.3, y: 21 }, { x: 59.2, y: 20.7 }, { x: 62.5, y: 20.3 }, { x: 65.8, y: 20.9 }, { x: 67.7, y: 22.3 }, { x: 68, y: 24.2 }, { x: 66.5, y: 26.4 }, { x: 64.1, y: 27.8 }, { x: 62.2, y: 29.3 }, { x: 61.7, y: 31.4 }, { x: 62.4, y: 33.7 }, { x: 64.1, y: 37.6 }, { x: 65.8, y: 39.3 }, { x: 68.4, y: 40.5 }, { x: 71.6, y: 40.4 }, { x: 74.9, y: 41 }, { x: 78.1, y: 41 }, { x: 82, y: 40.8 }, { x: 86.6, y: 40.4 }, { x: 89.8, y: 41.2 }, { x: 91.7, y: 43.5 }, { x: 91.9, y: 46.1 }, { x: 90.8, y: 48.8 }, { x: 88.5, y: 51.3 }, { x: 86.9, y: 53.7 }, { x: 86.1, y: 56.2 }, { x: 86.3, y: 58.6 }],
  cities: [
    { id: 'ephesus', name: 'Ephesus', at: 0.0263, letter: `${G}briefe/brief-ephesus.webp` },
    { id: 'smyrna', name: 'Smyrna', at: 0.1799, letter: `${G}briefe/brief-smyrna.webp` },
    { id: 'pergamon', name: 'Pergamon', at: 0.3978, letter: `${G}briefe/brief-pergamon.webp` },
    { id: 'thyatira', name: 'Thyatira', at: 0.605, letter: `${G}briefe/brief-thyatira.webp` },
    { id: 'sardes', name: 'Sardes', at: 0.7254, letter: `${G}briefe/brief-sardes.webp` },
    { id: 'philadelphia', name: 'Philadelphia', at: 0.8458, letter: `${G}briefe/brief-philadelphia.webp` },
    { id: 'laodizea', name: 'Laodizea', at: 1.0, letter: `${G}briefe/brief-laodizea.webp` }
  ],
  rounds: [
    { hint: 'Gib dem Boten in jeder Stadt den richtigen Brief. Der Name steht am Tor und an der Rolle.', cities: ['ephesus', 'smyrna', 'pergamon'], names: true, tray: ['pergamon', 'ephesus', 'smyrna'] },
    { hint: 'Jetzt gehen sieben Briefe auf die Reise. Am Tor steht kein Name mehr: Schau auf das Siegel und auf das Wahrzeichen der Stadt.', cities: ['ephesus', 'smyrna', 'pergamon', 'thyatira', 'sardes', 'philadelphia', 'laodizea'], names: false, tray: ['laodizea', 'smyrna', 'thyatira', 'ephesus', 'philadelphia', 'pergamon', 'sardes'] }
  ]
}

/**
 * Etappe 4, "Lückenvers" (bekannt 1, Offb 3,20): die Sätze stehen wörtlich im Etappentext (Luther 1912 „So jemand meine Stimme hören wird und die Tür auftun“ ist dort „Wenn jemand meine Stimme hört
 * und die Tür auftut“). Tafel und Blatt wie in allen Abenteuern (aus `spiele/heilung/lueckenvers/` kopiert), Hintergrund `hintergrund/vers-hintergrund` (Holztür in heller Lehmwand am Abend).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Siehe, ich stehe vor der ', ' und klopfe an.'], words: ['Tür', 'Mauer', 'Stadt'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Wenn jemand meine ', ' hört und die Tür ', ', zu dem werde ich hineingehen und mit ihm essen und er mit mir.'], words: ['Stimme', 'auftut', 'Schritte', 'zuschließt'], answers: [0, 1] }
  ]
}

/**
 * Etappe 6, "Alle stimmen ein" (neu, `lob`, Offb 5,13): die weite Welt ohne Menschen in der Mitte (3:2): Himmel mit Vögeln, Erde mit Herden und einem Dorf, Meer mit Fischen; ganz oben nur Regenbogen und Licht,
 * darunter das kleine Lamm. Drei große Bereiche liegen darüber. Runde 1: Himmel, Erde, Meer in der Reihenfolge des Verses rufen; Runde 2: alle singen, jede Gruppe wird nach und nach leiser (`fade` Millisekunden,
 * `offset` = wie weit sie schon im Leiserwerden ist), ein Tippen lässt sie wieder voll singen; 20 Sekunden lang darf keine ganz verstummen. Bereiche in Prozent (vorläufig, am gemalten Bild nachmessen).
 * Bilder: `lob/welt`, `himmel-still`, `himmel-lob`, `erde-still`, `erde-lob`, `meer-still`, `meer-lob`, `lamm`, `klang`.
 */
const LOB: PraiseGame = {
  world: `${G}lob/welt.webp`,
  lamb: `${G}lob/lamm.webp`,
  wave: `${G}lob/klang.webp`,
  ratio: 1.5,
  lambAt: { x: 50, y: 45, w: 8 },
  duration: 20000,
  silent: 2000,
  order: ['himmel', 'erde', 'meer'],
  zones: [
    { id: 'himmel', name: 'Der Himmel', place: 'im Himmel', box: { left: 0, top: 0, right: 100, bottom: 33 }, still: `${G}lob/himmel-still.webp`, sing: `${G}lob/himmel-lob.webp`, fade: 7000, offset: 0 },
    { id: 'erde', name: 'Die Erde', place: 'auf Erden', box: { left: 0, top: 33, right: 100, bottom: 75 }, still: `${G}lob/erde-still.webp`, sing: `${G}lob/erde-lob.webp`, fade: 6500, offset: 1000 },
    { id: 'meer', name: 'Das Meer', place: 'im Meer', box: { left: 0, top: 75, right: 100, bottom: 100 }, still: `${G}lob/meer-still.webp`, sing: `${G}lob/meer-lob.webp`, fade: 6000, offset: 2000 }
  ],
  rounds: [
    { hint: 'Ruf Himmel, Erde und Meer zum Lob, so wie Johannes es hört.' },
    { hint: 'Halte alle beim Singen, bis das Amen kommt.' }
  ]
}

/**
 * Etappe 7, "Palmzweige" (neu, `palmen`, Offb 7,9): ein weiter Platz im Licht (3:1), vorn drei Reihen weiß gekleideter Menschen aus allen Völkern (je Reihe zwei Streifen: Zweige gesenkt, Zweige hoch, dieselben
 * Menschen an derselben Stelle), hinten das kleine Lamm. Ein ruhiger Wisch von links nach rechts lässt die Zweige wie eine Welle hochgehen; das Tempo (Bildbreiten je Sekunde, von langsam bis schnell) zählt.
 * Runde 1: eine Reihe, zwei Wellen; Runde 2: drei Reihen, je eine Welle (hinten langsamer). Reihen in Prozent (vorläufig, am gemalten Bild nachmessen). Bilder: `palmen/schar`, `reihe-1..3-unten`, `-oben`,
 * `tempo-palme`, `tempo-zeiger`, dazu das Lamm von `lob/lamm`.
 */
const PALMEN: PalmsGame = {
  crowd: `${G}palmen/schar.webp`,
  lamb: `${G}lob/lamm.webp`,
  meterPalm: `${G}palmen/tempo-palme.webp`,
  meterNeedle: `${G}palmen/tempo-zeiger.webp`,
  ratio: 3,
  lambAt: { x: 50, y: 45, w: 5 },
  cols: 11,
  hold: 900,
  rows: [
    { down: `${G}palmen/reihe-1-unten.webp`, up: `${G}palmen/reihe-1-oben.webp`, y: 57.14, h: 42.86 },
    { down: `${G}palmen/reihe-2-unten.webp`, up: `${G}palmen/reihe-2-oben.webp`, y: 45.71, h: 34.29 },
    { down: `${G}palmen/reihe-3-unten.webp`, up: `${G}palmen/reihe-3-oben.webp`, y: 37.86, h: 27.14 }
  ],
  rounds: [
    { hint: 'Streich ruhig über die Schar, dann gehen die Palmzweige wie eine Welle hoch.', waves: [{ row: 0, speed: [0.25, 0.6] }, { row: 0, speed: [0.25, 0.6] }] },
    { hint: 'Jetzt sind es drei Reihen. Die hinteren sind länger, darum geht die Welle dort etwas langsamer.', waves: [{ row: 0, speed: [0.25, 0.6] }, { row: 1, speed: [0.22, 0.55] }, { row: 2, speed: [0.2, 0.5] }] }
  ]
}

/**
 * Etappe 8, "Puzzle" (bekannt 2, Offb 21,1–2): die neue Erde in neutralem hellem Licht (keine Sonne, keine Tiere, kein Meer), oben kommt die goldene Stadt herab; 3:2 wie alle Puzzles der Reise.
 * `PuzzleGame` kennt nur ein Bild (keine Runden), 2 × 3 Teile wie in den anderen Abenteuern. Bild: `puzzle/neue-erde`.
 */
const PUZZEL: PuzzleGame = { image: `${G}puzzle/neue-erde.webp`, cols: 2, rows: 3 }

/**
 * Etappe 9, "Zwölf Perlentore" (neu, `perlentore`, Offb 21,12–13.21): die Stadt von oben (quadratisch, zwölf leere Torplätze, ohne Sonne), daneben die Windrose mit vier Zeichen für die alten Wörter
 * (Hahn = Morgen, Brot und Krug = Mittag, Lampe = Abend, schlafendes Kind = Mitternacht); der Vers wird Stück für Stück verlangt („Vom Morgen drei Tore“), das Kind setzt je drei Perlentore an die Seite.
 * Runde 1: Morgen und Abend, Runde 2: Mitternacht und Mittag; am Ende stehen alle zwölf Tore offen (`stadt-offen`). Lagen der Torplätze, der Windrose und der Torgröße in Prozent
 * (vorläufig, am gemalten Bild nachmessen). Bilder: `perlentore/stadt`, `stadt-offen`, `windrose`, `tor-perle`.
 */
const TORE: GatesGame = {
  city: `${G}perlentore/stadt.webp`,
  cityOpen: `${G}perlentore/stadt-offen.webp`,
  rose: `${G}perlentore/windrose.webp`,
  gate: `${G}perlentore/tor-perle.webp`,
  roseAt: { x: 17.5, y: 18.5 },
  roseW: 18,
  gateW: 9.5,
  openR: 9,
  sides: [
    { id: 'morgen', word: 'Morgen', part: 'Vom Morgen drei Tore', name: 'Seite Morgen (Osten)', dir: { x: 1, y: 0 }, openings: [{ x: 93.7, y: 27.1 }, { x: 93.7, y: 49.8 }, { x: 93.7, y: 71 }] },
    { id: 'abend', word: 'Abend', part: 'Vom Abend drei Tore', name: 'Seite Abend (Westen)', dir: { x: -1, y: 0 }, openings: [{ x: 6.3, y: 27.1 }, { x: 6.3, y: 49.8 }, { x: 6.3, y: 71 }] },
    { id: 'mitternacht', word: 'Mitternacht', part: 'Von Mitternacht drei Tore', name: 'Seite Mitternacht (Norden)', dir: { x: 0, y: -1 }, openings: [{ x: 26.4, y: 6.3 }, { x: 50, y: 6.3 }, { x: 73.6, y: 6.3 }] },
    { id: 'mittag', word: 'Mittag', part: 'Vom Mittag drei Tore', name: 'Seite Mittag (Süden)', dir: { x: 0, y: 1 }, openings: [{ x: 26.4, y: 92.9 }, { x: 50, y: 92.9 }, { x: 73.6, y: 92.9 }] }
  ],
  rounds: [
    { hint: 'Setze an jede Seite der Mauer drei Tore aus Perlen. Zuerst Morgen und Abend, die gegenüberliegenden Seiten.', order: ['morgen', 'abend'] },
    { hint: 'Jetzt kommen die zwei anderen Seiten dran: Mitternacht und Mittag.', order: ['mitternacht', 'mittag'] }
  ]
}

export const offenbarung: Journey = {
  id: 'offenbarung',
  title: 'Alles wird neu',
  subtitle: 'Eine Auswahl aus der Offenbarung: die Kapitel der Hoffnung',
  age: '8-10',
  downloadMb: 16, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: die Stadt und der Strom (Strom, Baum des Lebens an beiden Ufern, ein Perlentor im Hintergrund; ohne Gestalt, ohne Schrift; Konturzeichnung)
  gift: { title: 'Die Stadt und der Strom', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): von Patmos über die sieben Städte, Regenbogen und Licht, die neue Erde bis zur Stadt am Strom mit dem Baum des Lebens;
  // Stationen aus ergebnis/panorama/map-offenbarung.json, Perlenweg aus offenbarungPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/offenbarung/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0706, y: 0.5340, d: 0.0339 },
      { x: 0.1018, y: 0.2549, d: 0.0339 },
      { x: 0.1895, y: 0.4612, d: 0.0339 },
      { x: 0.2359, y: 0.6796, d: 0.0339 },
      { x: 0.4556, y: 0.4490, d: 0.0339 },
      { x: 0.5040, y: 0.5643, d: 0.0339 },
      { x: 0.6168, y: 0.6899, d: 0.0339 },
      { x: 0.7453, y: 0.3459, d: 0.0339 },
      { x: 0.9073, y: 0.5643, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.5340, d: 0.0339 },
    path: OFFENBARUNG_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Johannes auf Patmos',
      ref: 'Offenbarung 1,1–11',
      text: [
        'Das letzte Buch der Bibel heißt die Offenbarung. Ein Mann mit Namen Johannes hat es aufgeschrieben. Gleich am Anfang steht: „Selig ist, der da liest und die da hören die Worte.“ Johannes schreibt an sieben Gemeinden in Asien, so heißt damals das Land im Westen der heutigen Türkei. „Gnade sei mit euch und Friede“, grüßt er sie.',
        'Johannes nennt sich ihren Bruder. Er ist auf einer kleinen Insel im Meer, die heißt Patmos. Dort ist er wegen des Wortes Gottes und wegen des Zeugnisses von Jesus Christus.',
        'Am Tag des Herrn ist Johannes im Geist. Da hört er hinter sich eine große Stimme, laut wie eine Posaune.',
        '„Ich bin das A und das O, der Erste und der Letzte“, sagt die Stimme. „Was du siehst, das schreibe in ein Buch und sende es zu den Gemeinden.“ Sieben Städte nennt sie: Ephesus, Smyrna, Pergamon, Thyatira, Sardes, Philadelphia und Laodizea.'
      ],
      // Spiel: Schreib es in ein Buch (schreiben, neu)
      task: { kind: 'schreiben', hint: 'Schreib mit Johannes Zeile für Zeile und tauch die Feder rechtzeitig ein.', write: SCHREIBEN },
      questions: [
        { q: 'Wie heißt die Insel, auf der Johannes ist?', options: ['Patmos', 'Kreta', 'Zypern'], answer: 0 },
        { q: 'Was soll Johannes mit dem tun, was er sieht?', options: ['in ein Buch schreiben', 'auf einen Stein malen', 'allen Fischern erzählen'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Fürchte dich nicht',
      ref: 'Offenbarung 1,12–20',
      text: [
        'Johannes wendet sich um. Er will sehen, wer da mit ihm redet. Er sieht sieben goldene Leuchter, und mitten unter ihnen einen, der aussieht wie ein Menschensohn. Er trägt ein langes Gewand und um die Brust einen goldenen Gürtel.',
        'Sein Haar ist weiß wie Wolle, wie Schnee. Seine Stimme rauscht wie großes Wasser. In seiner rechten Hand hält er sieben Sterne, und sein Gesicht leuchtet wie die helle Sonne.',
        'Als Johannes ihn sieht, fällt er zu seinen Füßen nieder wie ein Toter. Da legt er seine rechte Hand auf Johannes.',
        '„Fürchte dich nicht!“, sagt er. „Ich bin der Erste und der Letzte und der Lebendige. Ich war tot, und siehe, ich bin lebendig von Ewigkeit zu Ewigkeit. Schreibe, was du gesehen hast.“ Und er sagt ihm: „Die sieben Leuchter sind die sieben Gemeinden.“ Es ist Jesus, der Lebendige.'
      ],
      // nur Fragen (ehrfürchtige Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist still und feierlich. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sieht Johannes, als er sich umwendet?', options: ['sieben goldene Leuchter', 'sieben weiße Schiffe', 'sieben hohe Türme'], answer: 0 },
        { q: 'Was tut er, als Johannes wie tot vor ihm liegt?', options: ['Er legt seine rechte Hand auf ihn.', 'Er gibt ihm einen Becher Wasser.', 'Er ruft laut nach den Fischern.'], answer: 0 },
        { q: 'Was sagt er zuerst zu Johannes?', options: ['Fürchte dich nicht!', 'Geh zurück nach Hause!', 'Steh schnell auf und lauf!'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Briefe an die Gemeinden',
      ref: 'Offenbarung 2–3, Auswahl',
      text: [
        'Dann sagt Jesus dem Johannes sieben Briefe an, für jede Gemeinde einen. Johannes soll sie alle aufschreiben.',
        'An die Gemeinde in Ephesus lässt er schreiben: „Ich weiß deine Arbeit und deine Geduld. Um meines Namens willen arbeitest du und bist nicht müde geworden. Aber ich habe gegen dich, dass du die erste Liebe verlässt. Kehr um und tu wieder die ersten Werke!“ Und er verspricht: „Wer überwindet, dem will ich zu essen geben vom Baum des Lebens, der im Paradies Gottes ist.“',
        'Nach Philadelphia lässt er schreiben: „Siehe, ich habe vor dir eine offene Tür gegeben, und niemand kann sie zuschließen. Du hast eine kleine Kraft, und du hast mein Wort behalten.“ Und weiter: „Siehe, ich komme bald. Halte, was du hast.“',
        'In jedem der sieben Briefe steht derselbe Satz: „Wer Ohren hat, der höre, was der Geist den Gemeinden sagt!“'
      ],
      // Spiel: Sieben Briefe (briefe, neu)
      task: { kind: 'briefe', hint: 'Gib dem Boten in jeder Stadt den richtigen Brief.', letters: BRIEFE },
      questions: [
        { q: 'Was hat die Gemeinde in Ephesus verlassen?', options: ['die erste Liebe', 'das große Haus', 'den alten Hafen'], answer: 0 },
        { q: 'Was hat die Gemeinde in Philadelphia vor sich?', options: ['eine offene Tür', 'eine hohe Mauer', 'einen tiefen Graben'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Ich stehe vor der Tür',
      ref: 'Offenbarung 3,14–22',
      text: [
        'Der letzte der sieben Briefe geht an die Gemeinde in Laodizea. Die Leute dort sagen: „Ich bin reich und habe genug und brauche nichts.“',
        'Jesus aber lässt ihnen schreiben: „Du weißt nicht, dass du arm bist und blind und bloß. Ich rate dir, dass du Gold von mir kaufst, damit du reich wirst, und weiße Kleider, damit du dich anziehst. Und salbe deine Augen, damit du sehen kannst. So sei nun fleißig und kehr um!“',
        'Dann sagt er: „Siehe, ich stehe vor der Tür und klopfe an. Wenn jemand meine Stimme hört und die Tür auftut, zu dem werde ich hineingehen und mit ihm essen und er mit mir.“',
        '„Wer überwindet“, heißt es weiter, „dem will ich geben, mit mir auf meinem Thron zu sitzen.“'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Was sagen die Leute in Laodizea von sich?', options: ['Ich bin reich und brauche nichts.', 'Wir sind müde und krank.', 'Wir haben großen Hunger.'], answer: 0 },
        { q: 'Was tut Jesus vor der Tür?', options: ['Er klopft an.', 'Er setzt sich hin.', 'Er geht weiter.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Der Regenbogen um den Thron',
      ref: 'Offenbarung 4',
      text: [
        'Danach sieht Johannes eine offene Tür im Himmel. Die erste Stimme, laut wie eine Posaune, sagt zu ihm: „Steig herauf! Ich will dir zeigen, was nach diesem geschehen soll.“',
        'Da sieht Johannes im Himmel einen Thron, und auf dem Thron sitzt einer. Er ist anzusehen wie die Edelsteine Jaspis und Sarder. Um den Thron ist ein Regenbogen, der leuchtet wie ein grüner Smaragd. Vor dem Thron liegt etwas wie ein gläsernes Meer, klar wie Kristall.',
        'Rings um den Thron stehen vierundzwanzig Throne. Darauf sitzen vierundzwanzig Älteste in weißen Kleidern, mit goldenen Kronen auf dem Kopf. Vier Wesen rufen Tag und Nacht: „Heilig, heilig, heilig ist Gott der Herr, der Allmächtige, der da war und der da ist und der da kommt!“',
        'Da fallen die vierundzwanzig Ältesten nieder und legen ihre Kronen vor den Thron. „Herr, du bist würdig, zu nehmen Preis und Ehre und Kraft“, sagen sie, „denn du hast alle Dinge geschaffen.“'
      ],
      // nur Fragen (ehrfürchtige Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist still und feierlich. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was leuchtet um den Thron wie ein Smaragd?', options: ['ein Regenbogen', 'ein großes Feuer', 'ein heller Stern'], answer: 0 },
        { q: 'Was haben die Ältesten auf dem Kopf?', options: ['goldene Kronen', 'weiße Tücher', 'grüne Kränze'], answer: 0 },
        { q: 'Wohin legen die Ältesten ihre Kronen?', options: ['vor den Thron', 'unter ihre Sitze', 'in eine Truhe'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Das Lamm ist würdig',
      ref: 'Offenbarung 5',
      text: [
        'In der rechten Hand dessen, der auf dem Thron sitzt, sieht Johannes ein Buch. Es ist innen und außen beschrieben und mit sieben Siegeln verschlossen. Ein starker Engel ruft mit großer Stimme: „Wer ist würdig, das Buch aufzutun und seine Siegel zu brechen?“ Aber niemand im Himmel und auf der Erde kann es auftun. Da weint Johannes sehr.',
        'Einer von den Ältesten sagt zu ihm: „Weine nicht! Siehe, der Löwe aus dem Stamm Juda, die Wurzel Davids, hat überwunden. Er kann das Buch auftun.“',
        'Johannes sieht hin. Mitten zwischen dem Thron und den Ältesten steht ein Lamm, wie wenn es getötet worden wäre. Es kommt und nimmt das Buch. Da fallen die Ältesten vor dem Lamm nieder und singen ein neues Lied: „Du bist würdig, das Buch zu nehmen. Denn du bist getötet worden und hast Menschen für Gott erkauft aus allen Stämmen und Sprachen und Völkern.“',
        'Tausende und Abertausende Engel rufen: „Das Lamm ist würdig, zu nehmen Kraft und Reichtum und Weisheit und Stärke und Ehre und Preis und Lob.“ Und alles, was im Himmel lebt und auf der Erde und im Meer, stimmt mit ein.'
      ],
      // Spiel: Alle stimmen ein (lob, neu)
      task: { kind: 'lob', hint: 'Ruf Himmel, Erde und Meer zum Lob, so wie Johannes es hört.', praise: LOB },
      questions: [
        { q: 'Warum weint Johannes?', options: ['Niemand kann das Buch auftun.', 'Er hat Hunger und Durst.', 'Er hat seine Feder verloren.'], answer: 0 },
        { q: 'Wer nimmt das Buch?', options: ['das Lamm', 'der Engel', 'Johannes'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Aus allen Völkern',
      ref: 'Offenbarung 7,9–17',
      text: [
        'Danach sieht Johannes eine große Schar, die niemand zählen kann. Die Menschen kommen aus allen Heiden und Völkern und Sprachen. Sie stehen vor dem Thron und vor dem Lamm, in weißen Kleidern, und haben Palmzweige in den Händen.',
        'Mit großer Stimme rufen sie: „Heil sei dem, der auf dem Thron sitzt, unserm Gott, und dem Lamm!“',
        'Einer der Ältesten fragt Johannes: „Wer sind diese in den weißen Kleidern, und woher sind sie gekommen?“ „Herr, du weißt es“, antwortet Johannes. Da sagt der Älteste: „Sie sind gekommen aus großer Trübsal. Darum sind sie vor dem Thron Gottes und dienen ihm Tag und Nacht.“',
        '„Sie werden nicht mehr hungern und nicht mehr dürsten“, sagt er weiter. „Keine Sonne und keine Hitze wird auf sie fallen. Denn das Lamm wird sie weiden und zu den Quellen des lebendigen Wassers führen. Und Gott wird abwischen alle Tränen von ihren Augen.“'
      ],
      // Spiel: Palmzweige (palmen, neu)
      task: { kind: 'palmen', hint: 'Streich ruhig über die Schar, dann gehen die Palmzweige wie eine Welle hoch.', palms: PALMEN },
      questions: [
        { q: 'Was haben die Menschen in den Händen?', options: ['Palmzweige', 'Fackeln', 'Körbe'], answer: 0 },
        { q: 'Was wird Gott von ihren Augen abwischen?', options: ['alle Tränen', 'den Staub der Straße', 'den Schlaf der Nacht'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Alles wird neu',
      ref: 'Offenbarung 21,1–7',
      text: [
        'Ganz am Ende sieht Johannes einen neuen Himmel und eine neue Erde. Der erste Himmel und die erste Erde sind vergangen, und das Meer ist nicht mehr.',
        'Er sieht die heilige Stadt, das neue Jerusalem, von Gott aus dem Himmel herabkommen. Sie ist geschmückt wie eine Braut für ihren Mann.',
        'Eine große Stimme vom Thron sagt: „Siehe da, die Hütte Gottes bei den Menschen! Er wird bei ihnen wohnen, und sie werden sein Volk sein. Und Gott wird abwischen alle Tränen von ihren Augen. Der Tod wird nicht mehr sein, und kein Leid und kein Geschrei und kein Schmerz. Denn das Erste ist vergangen.“',
        'Der auf dem Thron sitzt, spricht: „Siehe, ich mache alles neu!“ Und zu Johannes sagt er: „Schreibe, denn diese Worte sind wahrhaftig und gewiss. Wer Durst hat, dem will ich umsonst geben von der Quelle des lebendigen Wassers.“'
      ],
      // Spiel: Puzzle (puzzle, bekannt)
      task: { kind: 'puzzle', hint: 'Setze das Bild von der neuen Erde zusammen.', puzzle: PUZZEL },
      questions: [
        { q: 'Was sieht Johannes aus dem Himmel herabkommen?', options: ['die heilige Stadt, das neue Jerusalem', 'einen großen goldenen Wagen', 'eine Arche voller Tiere'], answer: 0 },
        { q: 'Was wird es nicht mehr geben, wenn Gott bei den Menschen wohnt?', options: ['den Tod und das Leid', 'die Häuser und die Gärten', 'die Lieder und die Feste'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die Stadt und der Strom',
      ref: 'Offenbarung 21,10–25; 22,1–5.20',
      text: [
        'Ein Engel führt Johannes auf einen großen, hohen Berg und zeigt ihm die Stadt. Sie hat eine große, hohe Mauer mit zwölf Toren, drei an jeder Seite. Jedes Tor ist aus einer einzigen Perle. Die Grundsteine der Mauer sind mit Edelsteinen geschmückt, und die Gassen sind aus reinem Gold, wie durchscheinendes Glas.',
        'Einen Tempel sieht Johannes darin nicht. Die Stadt braucht keine Sonne und keinen Mond, denn die Herrlichkeit Gottes macht sie hell, und ihre Leuchte ist das Lamm. Ihre Tore werden am Tag nicht verschlossen, und dort wird keine Nacht sein.',
        'Dann zeigt ihm der Engel einen klaren Strom mit dem Wasser des Lebens, hell wie Kristall. Er fließt vom Thron Gottes und des Lammes. Mitten auf der Gasse und auf beiden Seiten des Stroms steht der Baum des Lebens und trägt jeden Monat Früchte. Vom Baum des Lebens erzählt die Bibel schon ganz am Anfang: Er stand mitten im Garten Eden.',
        'Am Ende des Buches sagt Jesus: „Ja, ich komme bald.“ Und Johannes schreibt: „Amen, ja, komm, Herr Jesus!“'
      ],
      // Spiel: Zwölf Perlentore (perlentore, neu)
      task: { kind: 'perlentore', hint: 'Setze an jede Seite der Mauer drei Tore aus Perlen.', gates: TORE },
      questions: [
        { q: 'Woraus ist jedes Tor der Stadt?', options: ['aus einer einzigen Perle', 'aus dunklem Holz', 'aus rotem Lehm'], answer: 0 },
        { q: 'Was steht auf beiden Seiten des Stroms?', options: ['der Baum des Lebens', 'ein hoher Turm', 'eine Mauer aus Stein'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Auf welcher Insel hört Johannes die große Stimme?', options: ['Patmos', 'Kreta', 'Zypern'], answer: 0 },
    { q: 'Was sagt Jesus zu Johannes, als Johannes wie tot niederfällt?', options: ['Fürchte dich nicht!', 'Geh zurück nach Hause!', 'Steh schnell auf und lauf!'], answer: 0 },
    { q: 'Wer steht vor der Tür und klopft an?', options: ['Jesus', 'Petrus', 'Johannes'], answer: 0 },
    { q: 'Wer nimmt das Buch mit den sieben Siegeln?', options: ['das Lamm', 'der Engel', 'Johannes'], answer: 0 },
    { q: 'Was sagt der, der auf dem Thron sitzt?', options: ['Siehe, ich mache alles neu!', 'Siehe, ich baue ein Haus!', 'Siehe, ich gehe fort!'], answer: 0 },
    { q: 'Was antwortet Johannes, als Jesus sagt: „Ja, ich komme bald“?', options: ['Amen, ja, komm, Herr Jesus!', 'Ich gehe jetzt schlafen.', 'Ich fahre heim nach Ephesus.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of offenbarung.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of offenbarung.stages) {
  const file = `audio/abenteuer/offenbarung/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the music of its own is not made yet: until then the general pieces play (journeyFiles puts them into the pack)

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(offenbarung, offenbarungEn)
