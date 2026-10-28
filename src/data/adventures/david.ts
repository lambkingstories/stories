/**
 * Abenteuer "David" (1. Samuel 16 – 2. Samuel 7) für 8 bis 10 Jahre: 15 Etappen, Untertitel "Der Hirtenjunge wird König". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 27.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-David/ENTWURF_David.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Nicht oder gemildert erzählt: Löwe und Bär nur als Davids Bericht ("rettete das Schaf"), Goliats Tod ohne Kopf, Schwert und Blut (der Stein trifft, der Riese stürzt, die Philister fliehen), Sauls Spieß nur als ein Satz,
 * Nob und Doeg, Sauls Schlaf im Lager, Nabals Tod, Sauls Tod im Einzelnen, der Amalekiter, Davids Frauen und Kinder, Usas Tod nur als "ein Unglück geschieht", Michal, Davids Kriege.
 * Die Lade wird immer mit zwei goldenen Cherubim gezeigt. Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Lückenvers (alt), 2 Saul zur Ruhe bringen (neu), 3 nur Quiz, 4 Die Herde beschützen (neu), 5 Glatte Steine finden (neu), 6 Die Schleuder schwingen (neu), 7 Memory (alt), 8 nur Quiz,
 * 9 Das Zeichen mit den Pfeilen (neu), 10 Den Zipfel abschneiden (neu), 11 Reihenfolge (alt), 12 nur Quiz, 13 Puzzle (alt), 14 Wörter ordnen (alt), 15 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/david/, images/abenteuer/spiele/david/<spiel>/, audio/abenteuer/david/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { ArrowGame, HarpGame, HemGame, Journey, MemoryGame, OrderGame, PebblesGame, ShepherdGame, SlingGame, VerseGame, WordsGame } from '@/types/adventure'
import { josef } from './josef'
import { DAVID_PATH } from './davidPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { davidEn } from './en/david.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/david/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/david/'

const G = 'images/abenteuer/spiele/david/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik 1 von 5): Gottes Wort an Samuel aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Samuel (kopiert). Hintergrund ist das Etappenbild 1, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-01.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Gott sieht das ', ' an.“'], words: ['Herz', 'Haar', 'Kleid'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Ein Mensch sieht, was vor ', ' ist, aber Gott sieht das ', ' an.“'], words: ['Augen', 'Herz', 'Kleid', 'Haar'], answers: [0, 1] }
  ]
}

/**
 * Etappe 2, "Saul zur Ruhe bringen": Saul sitzt unruhig in seiner Halle (drei gemalte Bilder, die ineinander übergehen: unruhig, müde, ruhig), vor ihm steht Davids Harfe mit acht Saiten (neu).
 * Das Kind streicht mit dem Finger langsam über die Saiten (hin und her): jede Saite klingt, jede etwas höher. Ein Ton nach einer Pause von mindestens 0,3 Sekunden (Runde 2: 0,42) ist ruhig und bringt Saul der Ruhe näher;
 * zu schnelles Streichen ist ein Misston (die Ruhe sinkt um zwei, ein Kreuz, ein Fehler). Runde 1 braucht acht ruhige Töne, Runde 2 zehn.
 * Bilder (Bildauftrag R30): `harfe/halle.webp` 1200 × 900, `saul-1..3.webp` (ein Stuhl, eine Lage, nur Haltung und Gesicht ändern sich), `harfe.webp` (acht gerade Saiten).
 */
const HARFE: HarpGame = {
  background: `${G}harfe/halle.webp`,
  saul: [1, 2, 3].map((n) => `${G}harfe/saul-${n}.webp`),
  saulPos: { x: 20, y: 93, w: 32 },
  harp: `${G}harfe/harfe.webp`,
  harpPos: { x: 63, y: 100, w: 50 },
  strings: { n: 8, x0: 0.32, x1: 0.68, y0: 0.15, y1: 0.78 },
  rounds: [
    { hint: 'Streiche langsam über die Saiten, wie David. Dann wird Saul ruhig.', need: 8, minGap: 300 },
    { hint: 'Jetzt ist Saul unruhiger. Spiele noch ruhiger.', need: 10, minGap: 420 }
  ]
}

/**
 * Etappe 4, "Die Herde beschützen": David steht mit dem Stab auf der Weide, drei Lämmer grasen; von links oder rechts geht langsam ein Löwe oder ein Bär auf ein Lamm zu (ruhig gemalt, nichts wird bekämpft) (neu).
 * Das Kind stellt David zum bedrohten Lamm (ziehen oder tippen): steht er dort, bleibt das Tier stehen, zögert und trabt zurück. Erreicht es das Lamm vorher, läuft das Lamm erschrocken zu David (ein Fehler) und das Tier geht auch.
 * Runde 1: erst ein Löwe, dann ein Bär; Runde 2: beide fast zugleich von den zwei Seiten.
 * Bilder (Bildauftrag R31): `hirte/weide.webp` 1200 × 900, `david.webp`, `loewe.webp`, `baer.webp` (beide blicken nach links, der Code spiegelt sie), `lammer-1..3.webp` (aus EINEM Bogen geschnitten).
 */
const HIRTE: ShepherdGame = {
  background: `${G}hirte/weide.webp`,
  david: `${G}hirte/david.webp`,
  davidW: 17,
  davidStart: { x: 50, y: 92 },
  animals: [`${G}hirte/loewe.webp`, `${G}hirte/baer.webp`],
  animalW: [27, 25],
  lambs: [1, 2, 3].map((n) => `${G}hirte/lammer-${n}.webp`),
  lambW: 12.5,
  lambPos: [
    { x: 28, y: 74 },
    { x: 54, y: 70 },
    { x: 80, y: 76 }
  ],
  edge: { left: { x: -12, y: 72 }, right: { x: 112, y: 74 } },
  guard: 16,
  rounds: [
    {
      hint: 'Ein Löwe will ein Lamm holen. Stelle David zwischen das Tier und das Lamm.',
      threats: [
        { animal: 0, from: 'right', lamb: 2, delay: 0, dur: 7000 },
        { animal: 1, from: 'left', lamb: 0, delay: 9500, dur: 7000 }
      ]
    },
    {
      hint: 'Jetzt kommen zwei Tiere von beiden Seiten. Beschütze beide Lämmer.',
      threats: [
        { animal: 0, from: 'left', lamb: 0, delay: 0, dur: 7500 },
        { animal: 1, from: 'right', lamb: 2, delay: 2500, dur: 7500 }
      ]
    }
  ]
}

/**
 * Etappe 5, "Glatte Steine finden": im Kiesbett eines Baches liegen glatte, runde, helle Steine und raue, eckige, dunkle (neu); daneben Davids Hirtentasche. Das Kind tippt die glatten Steine, sie fliegen in die Tasche;
 * ein rauer Stein wackelt und bleibt (ein Fehler). Runde 1: drei glatte unter sechs Steinen, Runde 2: fünf glatte unter zehn ("wie David").
 * Bilder (Bildauftrag R32): `kiesel/bach.webp` 1200 × 900, `glatt-1..6.webp` und `rauh-1..6.webp` (je aus EINEM Bogen geschnitten, gleicher Maßstab), `tasche.webp`.
 */
const KIESEL: PebblesGame = {
  background: `${G}kiesel/bach.webp`,
  smooth: [1, 2, 3, 4, 5, 6].map((n) => `${G}kiesel/glatt-${n}.webp`),
  rough: [1, 2, 3, 4, 5, 6].map((n) => `${G}kiesel/rauh-${n}.webp`),
  bag: `${G}kiesel/tasche.webp`,
  bagPos: { x: 11, y: 99, w: 18 },
  rounds: [
    {
      hint: 'David braucht glatte Steine. Tippe drei glatte Steine an.',
      smooth: [
        { sprite: 0, x: 22, y: 80, w: 13 },
        { sprite: 2, x: 40, y: 92, w: 13 },
        { sprite: 4, x: 62, y: 50, w: 13 }
      ],
      rough: [
        { sprite: 0, x: 34, y: 68, w: 13 },
        { sprite: 3, x: 50, y: 84, w: 13 },
        { sprite: 5, x: 80, y: 50, w: 13 }
      ]
    },
    {
      hint: 'Jetzt fünf glatte Steine, wie David. Die rauen bleiben liegen.',
      smooth: [
        { sprite: 1, x: 12, y: 74, w: 10.5 },
        { sprite: 3, x: 28, y: 94, w: 10.5 },
        { sprite: 5, x: 46, y: 56, w: 10.5 },
        { sprite: 0, x: 74, y: 50, w: 10.5 },
        { sprite: 2, x: 90, y: 45, w: 10.5 }
      ],
      rough: [
        { sprite: 1, x: 24, y: 66, w: 10.5 },
        { sprite: 4, x: 38, y: 82, w: 10.5 },
        { sprite: 2, x: 58, y: 52, w: 10.5 },
        { sprite: 0, x: 84, y: 56, w: 10.5 },
        { sprite: 5, x: 52, y: 92, w: 10.5 }
      ]
    }
  ]
}

/**
 * Etappe 6, "Die Schleuder schwingen": im Tal schwingt David die Schleuder, weit weg steht Goliat, ruhig und riesig (gemalt) (neu). Der Stein kreist um Davids erhobene Hand; ein feiner gestrichelter Strahl zeigt, wohin er
 * flöge, wenn man ihn losließe, und leuchtet golden, wenn er auf Goliats Stirn zeigt. Ein Tipp lässt den Stein los: Treffer, und Goliat liegt ruhig am Boden (zweites Bild, kein Blut); Fehlwurf, ein Fehler, David schwingt weiter.
 * Runde 1: Goliat fern, Kreis langsam, großer Spielraum (12 Grad); Runde 2: Goliat näher, Kreis schneller, kleinerer Spielraum (7 Grad).
 * Bilder (Bildauftrag R33): `schleuder/tal.webp` 1200 × 900, `david.webp` (von der Seite, Arm erhoben), `goliat.webp`, `goliat-liegt.webp` (gleicher Maßstab), `stein.webp`.
 */
const SCHLEUDER: SlingGame = {
  background: `${G}schleuder/tal.webp`,
  david: `${G}schleuder/david.webp`,
  davidPos: { x: 18, y: 96, w: 20.5 },
  hand: { x: 13.5, y: 33 },
  radius: 8,
  goliat: `${G}schleuder/goliat.webp`,
  goliatFallen: `${G}schleuder/goliat-liegt.webp`,
  fallenScale: 1.68,
  stone: `${G}schleuder/stein.webp`,
  stoneW: 3.4,
  rounds: [
    { hint: 'David schwingt die Schleuder. Tippe, wenn der Stein auf Goliat zeigt.', period: 2600, tol: 12, goliat: { x: 78, y: 62, w: 15.9 }, head: { x: 78, y: 34.4 } },
    { hint: 'Jetzt steht Goliat näher und der Stein dreht schneller. Ziele genau.', period: 1900, tol: 7, goliat: { x: 74, y: 68, w: 20 }, head: { x: 74, y: 33 } }
  ]
}

/**
 * Etappe 7, "Memory" (alte Mechanik 2 von 5): die fünf Gaben Jonatans an David (Rock, Mantel, Schwert, Bogen, Gürtel); die Rückseite zeigt eine goldene Harfe (Bildauftrag R36, ein Bogen mit den fünf Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-rock.webp`, text: 'Der Rock: Jonatan zieht ihn aus und gibt ihn David.' },
    { image: `${G}memory/karte-mantel.webp`, text: 'Der Mantel: Jonatan legt ihn David um die Schultern.' },
    { image: `${G}memory/karte-schwert.webp`, text: 'Das Schwert: Jonatan schenkt es David.' },
    { image: `${G}memory/karte-bogen.webp`, text: 'Der Bogen: Auch ihn gibt Jonatan seinem Freund.' },
    { image: `${G}memory/karte-guertel.webp`, text: 'Der Gürtel: Das letzte Geschenk zum Zeichen des Bundes.' },
    { image: `${G}memory/karte-stein.webp`, text: 'Der glatte Stein: David hat ihn im Bach gefunden, er trägt ihn noch in der Tasche.' }
  ]
}

/**
 * Etappe 9, "Das Zeichen mit den Pfeilen": auf dem Feld steht Jonatan mit seinem Bogen links, ein kleiner Junge in der Mitte, rechts der große Stein, hinter dem David wartet (neu). Das Kind legt den Finger auf das Bild, zieht ihn
 * nach links (der Pfeil wird zurückgezogen) und lässt los: je weiter gezogen, desto weiter fliegt der Pfeil. Runde 1, das Zeichen des Friedens: der Pfeil soll hinter dem Jungen landen; Runde 2, das Zeichen zur Flucht:
 * vor dem Jungen, drei Pfeile. Die Zielstrecke ist weich auf dem Gras markiert; ein Pfeil außerhalb ist ein Fehler.
 * Bilder (Bildauftrag R34): `pfeil/feld.webp` 1200 × 900, `jonatan.webp`, `knabe.webp` (beide von der Seite nach rechts), `pfeil.webp` (waagerecht nach rechts).
 */
const PFEIL: ArrowGame = {
  background: `${G}pfeil/feld.webp`,
  jonatan: `${G}pfeil/jonatan.webp`,
  jonatanPos: { x: 14, y: 88, w: 21.8 },
  boy: `${G}pfeil/knabe.webp`,
  boyPos: { x: 50, y: 86, w: 15.4 },
  arrow: `${G}pfeil/pfeil.webp`,
  arrowW: 16,
  shootFrom: { x: 22, y: 64 },
  groundY: 88,
  range: { min: 26, max: 88 },
  rounds: [
    { hint: 'Jonatan schickt das Zeichen des Friedens: Der Pfeil soll hinter dem Jungen landen.', sign: 'peace', arrows: 2, zone: { from: 28, to: 44 } },
    { hint: 'Jetzt das Zeichen zur Flucht: Der Pfeil soll vor dem Jungen landen, weiter weg.', sign: 'flee', arrows: 3, zone: { from: 58, to: 76 } }
  ]
}

/**
 * Etappe 10, "Den Zipfel abschneiden": in der Höhle steht Saul mit dem Rücken zu David, der lange Mantel mit der gestickten Borte hängt herab (neu). Eine weiche gestrichelte Naht läuft am Saum entlang. Das Kind fährt sie mit dem
 * Finger vom Anfang bis zum Ende nach, ganz leise; zu weit daneben ist ein Fehler (Saul sieht sich um) und der Strich beginnt von vorn. Am Ende ist der Zipfel ab, und das Bild wechselt zu David mit dem Zipfel in der Hand (kein Messer).
 * Runde 1: gerade Naht, breite Spur (7 Prozent), Runde 2: geschwungene Naht, schmalere Spur (4.5 Prozent).
 * Bilder (Bildauftrag R35): `zipfel/hoehle.webp` 1200 × 900, `david-zipfel.webp` 1200 × 900. Die Nähte sind Prozentpunkte des Bildes, an den gemalten Bildern abgelesen.
 */
const ZIPFEL: HemGame = {
  background: `${G}zipfel/hoehle.webp`,
  reward: `${G}zipfel/david-zipfel.webp`,
  rounds: [
    { hint: 'Folge der Naht mit dem Finger, ganz leise.', tol: 7, path: [{ x: 52.5, y: 60 }, { x: 56, y: 70 }, { x: 60.2, y: 83.8 }] },
    { hint: 'Noch einmal: die Naht ist geschwungen. Bleibe auf der Spur.', tol: 4.5, path: [{ x: 32.3, y: 82.4 }, { x: 35.8, y: 81.1 }, { x: 40, y: 79.1 }, { x: 45, y: 76.7 }, { x: 50, y: 75.1 }, { x: 53.3, y: 76.7 }, { x: 57.5, y: 80.6 }, { x: 59.8, y: 83.1 }] }
  ]
}

/**
 * Etappe 11, "Abigajil bringt Brot" (alte Mechanik 3 von 5, Reihenfolge legen): Nabal schickt die Boten weg, Abigajil lädt die Esel, sie kniet vor David, David nimmt die Gaben an.
 * Runde 1 drei Karten (packen, knien, Segen) mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag R37): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'nabal', image: `${G}reihenfolge/karte-1.webp`, label: 'Nabal schickt die Boten weg' },
    { id: 'packen', image: `${G}reihenfolge/karte-2.webp`, label: 'Abigajil lädt die Esel' },
    { id: 'knien', image: `${G}reihenfolge/karte-3.webp`, label: 'Abigajil kniet vor David' },
    { id: 'gaben', image: `${G}reihenfolge/karte-4.webp`, label: 'David nimmt die Gaben an' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['packen', 'knien', 'gaben'] },
    { hint: 'Runde 2: Jetzt mit Nabal und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['nabal', 'packen', 'knien', 'gaben'] }
  ]
}

/**
 * Etappe 14, "Die Wörter ordnen" (alte Mechanik 5 von 5): die Wörter eines Satzes liegen auf Steinplättchen in gemischter Folge und werden der Reihe nach in den Streifen gelegt; alle Sätze stehen wörtlich im Text der Etappe.
 * Hintergrund ist das Etappenbild 14 (weichgezeichnet); Steine und Streifen sind die aus Mose (kopiert).
 */
const WORTE: WordsGame = {
  background: `${PICS}etappe-bild-14.webp`,
  chip: `${G}worte/stein.webp`,
  strip: `${G}worte/streifen.webp`,
  rounds: [
    { hint: 'Lege die Wörter in der richtigen Reihenfolge in den Streifen.', sentences: ['Gott segnet Obed-Edoms Haus.', 'Dann gehen alle nach Hause.'] },
    { hint: 'Jetzt längere Sätze.', sentences: ['Ganz Israel führt die Lade mit Jauchzen und Posaunen herauf.', 'David tanzt mit aller Kraft vor Gott her, im leinenen Gewand.'] }
  ]
}

export const david: Journey = {
  id: 'david',
  title: 'David',
  subtitle: 'Der Hirtenjunge wird König',
  age: '8-10',
  downloadMb: 24, // gemessen 24 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: David mit der Harfe zwischen seinen Schafen, die fünf Steine und die Schleuder (Konturzeichnung)
  gift: { title: 'David und die Harfe', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in fünf Stücken, 15976 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit fünfzehn Orten und dem Ziel) mit Stationen und Perlenweg aus davidPath.ts
  map: {
    images: [1, 2, 3, 4, 5].map((n) => `images/abenteuer/david/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 15976 / 1648,
    widthPx: 15976,
    stages: [
      { x: 0.0707, y: 0.6068, d: 0.0210 },
      { x: 0.1221, y: 0.5825, d: 0.0210 },
      { x: 0.1847, y: 0.5947, d: 0.0210 },
      { x: 0.2660, y: 0.6129, d: 0.0210 },
      { x: 0.3242, y: 0.4490, d: 0.0210 },
      { x: 0.3850, y: 0.5825, d: 0.0210 },
      { x: 0.4644, y: 0.6250, d: 0.0210 },
      { x: 0.5270, y: 0.2852, d: 0.0210 },
      { x: 0.5671, y: 0.3095, d: 0.0210 },
      { x: 0.6291, y: 0.4248, d: 0.0210 },
      { x: 0.6885, y: 0.3277, d: 0.0210 },
      { x: 0.7912, y: 0.4612, d: 0.0210 },
      { x: 0.8463, y: 0.2427, d: 0.0210 },
      { x: 0.9014, y: 0.2002, d: 0.0210 },
      { x: 0.9514, y: 0.2670, d: 0.0210 }
    ],
    exam: { x: 0.9884, y: 0.3398, d: 0.0210 },
    path: DAVID_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der Jüngste auf der Weide',
      ref: '1. Samuel 16,1–13',
      text: [
        'Gott schickt Samuel nach Bethlehem. „Fülle dein Horn mit Öl“, sagt er. „Unter den Söhnen Isais habe ich mir einen König ausgesucht.“ Samuel fürchtet sich vor Saul, aber er geht, und die Ältesten der Stadt fragen ihn: „Kommst du in Frieden?“',
        'Isai ruft seine Söhne. Der erste ist Eliab, groß und stark. „Das ist bestimmt der Richtige“, denkt Samuel. Doch Gott sagt: „Sieh nicht auf seine Gestalt. Ein Mensch sieht, was vor Augen ist, aber Gott sieht das Herz an.“ Sieben Söhne gehen an Samuel vorbei, und Gott hat keinen von ihnen gewählt.',
        '„Sind das alle?“, fragt Samuel. „Der jüngste fehlt noch“, sagt Isai. „Er hütet die Schafe.“ „Schick nach ihm! Wir setzen uns nicht, bis er da ist.“ David kommt, bräunlich, mit schönen Augen. „Auf“, sagt Gott, „salbe ihn! Er ist es.“ Da nimmt Samuel das Horn und salbt David mitten unter seinen Brüdern.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 1 von 5)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wohin schickt Gott Samuel?', options: ['nach Bethlehem', 'nach Silo', 'nach Jericho'], answer: 0 },
        { q: 'Was tut David, als Samuel nach den Söhnen fragt?', options: ['Er hütet die Schafe.', 'Er schläft im Haus.', 'Er kämpft im Heer.'], answer: 0 },
        { q: 'Was tut Samuel mit dem Horn?', options: ['Er salbt David.', 'Er trinkt daraus.', 'Er verschenkt es.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Die Harfe für Saul',
      ref: '1. Samuel 16,14–23',
      text: [
        'Saul ist unruhig und traurig, denn Gottes Geist hat ihn verlassen. „Such einen Mann, der gut Harfe spielt“, sagen seine Diener. „Wenn die Unruhe über dich kommt, spielt er für dich, und es wird dir besser gehen.“',
        '„Ich kenne einen“, sagt einer von ihnen. „Isais Sohn aus Bethlehem. Er spielt Saiten, er ist mutig und klug im Reden, und Gott ist mit ihm.“ Da lässt Saul Isai ausrichten: „Schick mir deinen Sohn David, der bei den Schafen ist.“',
        'Isai lädt einen Esel mit Brot, einen Schlauch Wein und ein Ziegenböcklein und schickt David damit zu Saul. David bleibt bei ihm. Saul hat ihn sehr lieb, und David trägt seine Waffen. Wenn die Unruhe über Saul kommt, nimmt David die Harfe und spielt. Dann wird Saul ruhig, und es geht ihm besser.'
      ],
      // Spiel: Saul zur Ruhe bringen (harfe, neu)
      task: { kind: 'harfe', hint: 'Streiche langsam über die Saiten, dann wird Saul ruhig.', harp: HARFE },
      questions: [
        { q: 'Was soll David für Saul spielen?', options: ['die Harfe', 'die Flöte', 'die Trommel'], answer: 0 },
        { q: 'Was schickt Isai mit David zu Saul?', options: ['Brot, Wein und ein Ziegenböcklein', 'ein Schwert und einen Schild', 'Gold und Silber'], answer: 0 },
        { q: 'Was geschieht, wenn David spielt?', options: ['Saul wird ruhig.', 'Saul wird zornig.', 'Saul schläft ein.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Brot für die Brüder',
      ref: '1. Samuel 17,1–30',
      text: [
        'Die Philister und das Heer Israels stehen auf zwei Bergen, und dazwischen liegt ein Tal. Jeden Morgen und jeden Abend tritt Goliat hervor, ein Riese, sechs Ellen und eine Handbreit groß, mit Helm, Panzer und einem Spieß wie ein Weberbaum. „Schickt mir einen Mann zum Kampf!“, ruft er. Vierzig Tage lang fürchten sich Saul und ganz Israel sehr.',
        'Davids drei älteste Brüder sind beim Heer. Isai gibt David geröstete Körner, zehn Brote und zehn Käse für sie. David lässt die Schafe beim Hüter und geht früh los. Als er seine Brüder grüßt, tritt Goliat wieder hervor, und David hört es.',
        '„Wer ist dieser Philister, dass er das Heer des lebendigen Gottes verspottet?“, fragt David. Sein ältester Bruder Eliab wird zornig: „Warum bist du hier? Wem hast du die Schafe gelassen?“ David fragt trotzdem weiter. Die Männer erzählen es Saul, und Saul lässt David holen.'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie groß ist Goliat?', options: ['sechs Ellen und eine Handbreit', 'so groß wie ein Mann', 'so klein wie ein Kind'], answer: 0 },
        { q: 'Was bringt David seinen Brüdern?', options: ['geröstete Körner, Brote und Käse', 'Waffen und Schilde', 'Wein und Fleisch'], answer: 0 },
        { q: 'Was fragt David?', options: ['Wer ist dieser Philister, dass er das Heer des lebendigen Gottes verspottet?', 'Wie viel Gold bekomme ich?', 'Wann gibt es Essen?'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Die Rüstung ist zu schwer',
      ref: '1. Samuel 17,31–39',
      text: [
        '„Niemand soll den Mut verlieren“, sagt David zu Saul. „Dein Knecht geht und kämpft gegen den Philister.“ „Das kannst du nicht“, sagt Saul. „Du bist noch ein Junge, und er ist von Jugend auf ein Krieger.“',
        '„Ich hüte die Schafe meines Vaters“, sagt David. „Wenn ein Löwe oder ein Bär ein Schaf von der Herde holte, lief ich ihm nach und rettete es aus seinem Maul. Gott hat mich vor dem Löwen und dem Bären gerettet, und er wird mich auch vor diesem Philister retten.“ „Geh“, sagt Saul, „Gott sei mit dir.“',
        'Saul gibt David seinen Helm, seinen Panzer und sein Schwert. David versucht zu gehen, aber er hat noch nie eine Rüstung getragen. „So kann ich nicht gehen“, sagt er. „Ich bin es nicht gewohnt.“ Er legt alles wieder ab.'
      ],
      // Spiel: Die Herde beschützen (hirte, neu)
      task: { kind: 'hirte', hint: 'Stelle David zwischen das Tier und das Lamm.', shepherd: HIRTE },
      questions: [
        { q: 'Was erzählt David von seiner Herde?', options: ['Ein Löwe und ein Bär holten ein Schaf, und er rettete es.', 'Ein Wolf bewachte die Herde.', 'Alle Schafe liefen davon.'], answer: 0 },
        { q: 'Wer gibt David die Rüstung?', options: ['Saul', 'Goliat', 'Isai'], answer: 0 },
        { q: 'Warum legt David die Rüstung ab?', options: ['Er ist sie nicht gewohnt.', 'Sie ist zu klein.', 'Sie ist kaputt.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Fünf glatte Steine',
      ref: '1. Samuel 17,40–47',
      text: [
        'David nimmt seinen Hirtenstab. Am Bach sucht er sich fünf glatte Steine aus und steckt sie in seine Hirtentasche. In der anderen Hand hält er die Schleuder. So geht er auf den Philister zu.',
        'Goliat kommt näher, und sein Schildträger geht vor ihm her. Er sieht David an und lacht ihn aus, denn David ist noch ein Junge, bräunlich und schön. „Bin ich ein Hund, dass du mit einem Stecken zu mir kommst?“, ruft er.',
        'David bleibt ruhig. „Du kommst zu mir mit Schwert, Spieß und Schild“, sagt er. „Ich aber komme im Namen des Herrn, des Gottes von Israels Heer, das du verspottet hast. Der Herr hilft nicht durch Schwert und Spieß. Der Streit gehört ihm.“'
      ],
      // Spiel: Glatte Steine finden (kiesel, neu)
      task: { kind: 'kiesel', hint: 'Tippe die glatten Steine an.', pebbles: KIESEL },
      questions: [
        { q: 'Wie viele Steine sucht David aus dem Bach?', options: ['fünf', 'zwei', 'zehn'], answer: 0 },
        { q: 'Wo steckt David die Steine hin?', options: ['in seine Hirtentasche', 'in seinen Gürtel', 'in einen Korb'], answer: 0 },
        { q: 'Womit kommt David zu Goliat?', options: ['mit Stab und Schleuder', 'mit Schwert und Spieß', 'mit Pfeil und Bogen'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'David und Goliat',
      ref: '1. Samuel 17,48–54',
      text: [
        'Goliat kommt immer näher. David aber läuft ihm entgegen. Er greift in seine Tasche, nimmt einen Stein und legt ihn in die Schleuder. Er schwingt sie und lässt den Stein fliegen.',
        'Der Stein trifft Goliat an der Stirn, und der Riese stürzt zu Boden. So besiegt David den Philister mit einer Schleuder und einem Stein, und er hat kein Schwert in der Hand.',
        'Als die Philister sehen, dass ihr Stärkster am Boden liegt, laufen sie davon. Die Männer von Israel und Juda rufen laut vor Freude. Der Streit gehört Gott, wie David es gesagt hat.'
      ],
      // Spiel: Die Schleuder schwingen (schleuder, neu)
      task: { kind: 'schleuder', hint: 'Tippe, wenn der Stein auf Goliat zeigt.', sling: SCHLEUDER },
      questions: [
        { q: 'Womit besiegt David Goliat?', options: ['mit einer Schleuder und einem Stein', 'mit einem Schwert', 'mit einem Spieß'], answer: 0 },
        { q: 'Was tun die Philister, als Goliat am Boden liegt?', options: ['Sie laufen davon.', 'Sie greifen an.', 'Sie bleiben stehen.'], answer: 0 },
        { q: 'Wer hilft Israel?', options: ['Gott', 'der Schildträger', 'der König allein'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Jonatan und David',
      ref: '1. Samuel 18,1–5',
      text: [
        'Als David mit Saul zu Ende gesprochen hat, verbindet sich das Herz von Sauls Sohn Jonatan mit Davids Herz. Er hat David lieb wie sein eigenes Leben.',
        'Jonatan und David machen einen Bund miteinander. Zum Zeichen zieht Jonatan seinen Rock aus, den er trägt, und gibt ihn David, dazu seinen Mantel, sein Schwert, seinen Bogen und seinen Gürtel.',
        'Saul nimmt David zu sich und lässt ihn nicht mehr nach Hause gehen. David zieht überall hin, wohin Saul ihn schickt, und er handelt klug. Saul setzt ihn über seine Krieger. Das ganze Volk hat David gern, auch die Diener Sauls.'
      ],
      // Spiel: Memory (memory, alt 2 von 5)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Wer ist Jonatan?', options: ['Sauls Sohn', 'Davids Bruder', 'ein Hirte'], answer: 0 },
        { q: 'Was gibt Jonatan David?', options: ['seinen Rock, Mantel, sein Schwert, seinen Bogen und seinen Gürtel', 'ein Pferd', 'ein Haus'], answer: 0 },
        { q: 'Was machen Jonatan und David miteinander?', options: ['einen Bund', 'einen Wettlauf', 'ein Fest'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Saul wird neidisch',
      ref: '1. Samuel 18,6–16',
      text: [
        'Als David vom Sieg heimkommt, ziehen Frauen aus allen Städten dem König entgegen. Sie singen und tanzen mit Pauken und Freudenrufen. „Saul hat tausend geschlagen“, singen sie, „aber David zehntausend.“',
        'Da wird Saul sehr zornig. „Sie geben David zehntausend und mir nur tausend“, denkt er. „Jetzt fehlt ihm nur noch das Königreich.“ Von diesem Tag an sieht er David finster an.',
        'Am nächsten Tag kommt die Unruhe wieder über Saul. David spielt die Harfe wie jeden Tag, aber Saul wirft einen Spieß nach ihm. David weicht aus, zweimal. Saul fürchtet sich vor David, denn Gott ist mit David und nicht mehr mit ihm. Er schickt David weg und setzt ihn über tausend Männer. Ganz Israel hat David lieb.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was singen die Frauen?', options: ['Saul hat tausend geschlagen, aber David zehntausend.', 'David ist der König.', 'Saul ist der Stärkste.'], answer: 0 },
        { q: 'Wie sieht Saul David von diesem Tag an an?', options: ['finster', 'freundlich', 'gar nicht'], answer: 0 },
        { q: 'Warum fürchtet sich Saul vor David?', options: ['Gott ist mit David.', 'David ist größer als er.', 'David hat ein Schwert.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Das Zeichen mit den Pfeilen',
      ref: '1. Samuel 20',
      text: [
        'David flieht zu Jonatan. „Was habe ich getan?“, fragt er. „Dein Vater will mich töten.“ „Ich tue für dich, was du willst“, sagt Jonatan. Sie machen einen Plan: David versteckt sich auf dem Feld, und Jonatan schickt einen Jungen, die Pfeile zu holen, die er schießt. Liegt ein Pfeil hinter dem Jungen, darf David zurückkommen. Liegt er weiter vorn, muss David fliehen.',
        'Am dritten Tag geht Jonatan mit einem kleinen Jungen aufs Feld. „Lauf und such die Pfeile, die ich schieße!“, sagt er und schießt einen Pfeil über ihn hinweg. „Der Pfeil liegt weiter vorn!“, ruft er. Der Junge versteht nichts davon und bringt die Pfeile zurück.',
        'Jonatan schickt ihn mit dem Bogen in die Stadt. Da kommt David hinter dem Stein hervor. Die Freunde weinen, und Jonatan sagt: „Geh in Frieden. Gott ist zwischen uns, für immer.“'
      ],
      // Spiel: Das Zeichen mit den Pfeilen (pfeil, neu)
      task: { kind: 'pfeil', hint: 'Ziehe die Sehne so weit, dass der Pfeil in der Zielstrecke landet.', arrow: PFEIL },
      questions: [
        { q: 'Wohin geht Jonatan mit dem Jungen?', options: ['aufs Feld', 'in die Stadt', 'in die Wüste'], answer: 0 },
        { q: 'Was bedeutet der Pfeil, der weiter vorn liegt?', options: ['David muss fliehen.', 'David darf zurückkommen.', 'Das Essen ist fertig.'], answer: 0 },
        { q: 'Wo versteckt sich David?', options: ['hinter einem Stein', 'in einem Zelt', 'in einem Haus'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'In der Höhle',
      ref: '1. Samuel 24',
      text: [
        'Saul zieht mit dreitausend Männern in die Wüste bei En-Gedi und sucht David. Am Weg liegt eine Höhle, und Saul geht hinein. David und seine Männer sitzen hinten im Dunkel.',
        '„Das ist der Tag, von dem Gott gesprochen hat!“, flüstern Davids Männer. „Mach mit ihm, was du willst.“ David steht auf und schneidet leise einen Zipfel von Sauls Mantel ab. Gleich danach klopft ihm das Herz. „Das lasse Gott fern von mir sein“, sagt er zu seinen Männern. „Saul ist der von Gott gesalbte König. Ich lege nicht Hand an ihn.“',
        'Als Saul die Höhle verlässt, ruft David hinter ihm her: „Mein Herr König!“ Er verneigt sich und hält den Zipfel hoch. „Sieh, ich hätte dir etwas antun können. Aber ich habe es nicht getan.“ Da weint Saul. „Du bist besser als ich“, sagt er. „Du hast mir Gutes getan, und ich dir Böses.“'
      ],
      // Spiel: Den Zipfel abschneiden (zipfel, neu)
      task: { kind: 'zipfel', hint: 'Folge der Naht mit dem Finger, ganz leise.', hem: ZIPFEL },
      questions: [
        { q: 'Wo sind David und seine Männer?', options: ['in einer Höhle', 'in einer Stadt', 'auf einem Schiff'], answer: 0 },
        { q: 'Was schneidet David ab?', options: ['einen Zipfel von Sauls Mantel', 'Sauls Bart', 'Sauls Schwert'], answer: 0 },
        { q: 'Was tut Saul, als David ihm den Zipfel zeigt?', options: ['Er weint.', 'Er lacht.', 'Er greift an.'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Abigajil bringt Brot',
      ref: '1. Samuel 25',
      text: [
        'Samuel ist gestorben, und ganz Israel trauert um ihn. David lebt mit seinen Männern in der Wüste. Ein reicher Mann namens Nabal hat dort dreitausend Schafe. Er ist hart, aber seine Frau Abigajil ist klug und freundlich.',
        'David bittet Nabal um etwas zu essen, denn seine Männer haben Nabals Hirten beschützt. „Wer ist David?“, sagt Nabal und schickt die Boten weg. David wird zornig und zieht mit vierhundert Männern los.',
        'Ein Knecht erzählt es Abigajil. Sie lädt eilig zweihundert Brote, zwei Krüge Wein, Schafe, Mehl, Rosinen- und Feigenkuchen auf Esel und reitet David entgegen. Sie verneigt sich vor ihm. „Hör mich an“, sagt sie. „Gott hat dich davor bewahrt, dir selbst Recht zu verschaffen.“ „Gelobt sei Gott, der dich zu mir geschickt hat“, sagt David. „Geh in Frieden.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt 3 von 5)
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Wer schickt die Boten weg?', options: ['Nabal', 'Abigajil', 'Saul'], answer: 0 },
        { q: 'Was lädt Abigajil auf die Esel?', options: ['Brot, Wein, Schafe und Kuchen', 'Schwerter und Schilde', 'Gold und Silber'], answer: 0 },
        { q: 'Was sagt David zu Abigajil?', options: ['Gelobt sei Gott, der dich zu mir geschickt hat.', 'Geh weg!', 'Ich habe dich nicht gesehen.'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Davids Klage',
      ref: '1. Samuel 31; 2. Samuel 1',
      text: [
        'Die Philister kämpfen gegen Israel auf dem Berg Gilboa. Dort fallen Saul und seine Söhne, auch Jonatan. David ist in Ziklag, als ein Bote kommt. Er trägt zerrissene Kleider und hat Erde auf dem Kopf.',
        'David erfährt, was geschehen ist. Er zerreißt seine Kleider, und alle seine Männer tun es auch. Sie trauern, sie weinen, und sie essen bis zum Abend nichts. Sie trauern um Saul, um Jonatan und um das Volk Gottes.',
        'Dann singt David ein Lied. „Wie sind die Helden gefallen!“, singt er. „Es tut mir leid um dich, mein Bruder Jonatan. Du warst mir sehr lieb.“ Er befiehlt, dass alle in Juda das Bogenlied lernen.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo kämpfen die Philister gegen Israel?', options: ['auf dem Berg Gilboa', 'in Bethlehem', 'im Eichgrund'], answer: 0 },
        { q: 'Was tut David, als er hört, was geschehen ist?', options: ['Er zerreißt seine Kleider und trauert.', 'Er feiert ein Fest.', 'Er zieht in den Krieg.'], answer: 0 },
        { q: 'Um wen trauert David besonders?', options: ['um Jonatan', 'um Goliat', 'um Nabal'], answer: 0 }
      ]
    },
    {
      id: 13,
      image: `${PICS}etappe-bild-13.webp`,
      title: 'König in Hebron und Jerusalem',
      ref: '2. Samuel 2,1–4; 5,1–12',
      text: [
        'David fragt Gott: „Soll ich in eine der Städte Judas ziehen?“ „Zieh hinauf nach Hebron“, sagt Gott. Dort salben die Männer von Juda David zum König.',
        'Später kommen alle Stämme Israels nach Hebron. „Wir gehören zusammen“, sagen sie. „Schon als Saul König war, hast du uns geführt. Gott hat gesagt: Du sollst mein Volk Israel hüten.“ Die Ältesten schließen mit David einen Bund und salben ihn zum König über ganz Israel. David ist dreißig Jahre alt und regiert vierzig Jahre.',
        'Dann zieht David mit seinen Männern nach Jerusalem. Die Bewohner sagen: „Du kommst hier nicht herein!“ Aber David gewinnt die Burg Zion. Sie heißt von nun an Davids Stadt, und David baut sie aus. Er wird immer mächtiger, denn Gott ist mit ihm.'
      ],
      // Spiel: Puzzle (puzzle, alt 4 von 5)
      task: { kind: 'puzzle', hint: 'Setze das Bild der Stadt Davids zusammen.', puzzle: { image: `${G}puzzle/stadt.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wohin zieht David auf Gottes Wort?', options: ['nach Hebron', 'nach Silo', 'nach Gilgal'], answer: 0 },
        { q: 'Wie alt ist David, als er König wird?', options: ['dreißig Jahre', 'zehn Jahre', 'hundert Jahre'], answer: 0 },
        { q: 'Wie heißt die Burg, die David gewinnt?', options: ['Zion, die Stadt Davids', 'Bethlehem', 'Gibea'], answer: 0 }
      ]
    },
    {
      id: 14,
      image: `${PICS}etappe-bild-14.webp`,
      title: 'Die Lade kommt heim',
      ref: '2. Samuel 6',
      text: [
        'David holt die Lade Gottes nach Jerusalem. Auf einem neuen Wagen fahren sie sie los, und David und ganz Israel spielen vor Gott mit Harfen, Pauken, Schellen und Zimbeln. Dann geschieht ein Unglück. David erschrickt und fragt: „Wie soll die Lade Gottes zu mir kommen?“ Er bringt sie ins Haus Obed-Edoms. Dort bleibt sie drei Monate. Gott segnet Obed-Edoms Haus.',
        'Als David das hört, holt er die Lade mit Freude. Nach sechs Schritten bringen sie ein Opfer dar. David tanzt mit aller Kraft vor Gott her, im leinenen Gewand. Ganz Israel führt die Lade mit Jauchzen und Posaunen herauf.',
        'In der Stadt stellen sie die Lade in das Zelt, das David für sie aufgeschlagen hat. David segnet das Volk und gibt jedem einen Brotkuchen, ein Stück Fleisch und Wein. Dann gehen alle nach Hause.'
      ],
      // Spiel: Die Wörter ordnen (worte, alt 5 von 5)
      task: { kind: 'worte', hint: 'Lege die Wörter in der richtigen Reihenfolge in den Streifen.', words: WORTE },
      questions: [
        { q: 'Mit was spielen David und Israel vor Gott?', options: ['mit Harfen, Pauken, Schellen und Zimbeln', 'mit Schwertern', 'mit Steinen'], answer: 0 },
        { q: 'Wo bleibt die Lade drei Monate?', options: ['im Haus Obed-Edoms', 'im Zelt Davids', 'in Silo'], answer: 0 },
        { q: 'Was tut David vor der Lade?', options: ['Er tanzt mit aller Kraft.', 'Er schläft.', 'Er läuft weg.'], answer: 0 }
      ]
    },
    {
      id: 15,
      image: `${PICS}etappe-bild-15.webp`,
      title: 'Ein Haus für Gott?',
      ref: '2. Samuel 7',
      text: [
        'David wohnt in einem Haus aus Zedernholz, aber die Lade Gottes steht in einem Zelt. „Das ist nicht richtig“, sagt er zu dem Propheten Natan. „Ich möchte Gott ein Haus bauen.“ „Tu, was du im Herzen hast“, sagt Natan. „Gott ist mit dir.“',
        'In der Nacht spricht Gott zu Natan: „Sag David: Ich habe dich von der Weide genommen, damit du Fürst über mein Volk wirst. Ich bin mit dir gewesen, wohin du auch gingst. Ich will dir ein Haus machen. Dein Haus und dein Königreich sollen für immer bestehen.“',
        'Natan sagt David alles. Da geht David zum Zelt der Lade, setzt sich vor Gott und betet. „Wer bin ich, Herr, und was ist mein Haus, dass du mich bis hierher gebracht hast? Es ist keiner wie du, und es gibt keinen Gott außer dir.“'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo steht die Lade Gottes?', options: ['in einem Zelt', 'in einem Zedernhaus', 'auf dem Berg'], answer: 0 },
        { q: 'Wen fragt David zuerst?', options: ['den Propheten Natan', 'Isai', 'Jonatan'], answer: 0 },
        { q: 'Was verspricht Gott David?', options: ['Ich will dir ein Haus machen.', 'Du bekommst Gold.', 'Du wirst nie krank.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was tut David, als Samuel nach den Söhnen fragt?', options: ['Er hütet die Schafe.', 'Er schläft im Haus.', 'Er kämpft im Heer.'], answer: 0 },
    { q: 'Was spielt David für Saul?', options: ['die Harfe', 'die Flöte', 'die Trommel'], answer: 0 },
    { q: 'Womit besiegt David Goliat?', options: ['mit einer Schleuder und einem Stein', 'mit einem Schwert', 'mit einem Spieß'], answer: 0 },
    { q: 'Was gibt Jonatan David?', options: ['seinen Mantel, sein Schwert, seinen Bogen und seinen Gürtel', 'ein Pferd', 'ein Haus'], answer: 0 },
    { q: 'Was schneidet David in der Höhle von Sauls Mantel ab?', options: ['einen Zipfel', 'den Ärmel', 'den Saum'], answer: 0 },
    { q: 'Wo ist die Lade Gottes, als David ein Haus bauen will?', options: ['in einem Zelt', 'in einem Zedernhaus', 'in Silo'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of david.stages) {
  if (st.task.verse) st.task.verse.background = st.image ?? st.task.verse.background
  if (st.task.words) st.task.words.background = st.image ?? st.task.words.background
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of david.stages) {
  const file = `audio/abenteuer/david/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the pasture and the harp, the valley, the city of David); they follow one another at random
david.music = [
  'audio/abenteuer/david/musik-weide-v1.mp3',
  'audio/abenteuer/david/musik-tal-v1.mp3',
  'audio/abenteuer/david/musik-stadt-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(david, davidEn)
