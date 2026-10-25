/**
 * Abenteuer "Samuel und Saul" (1. Samuel 1–15) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Rede, Herr, denn dein Knecht hört". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 25.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Samuel/ENTWURF_Samuel.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Nicht oder gemildert erzählt: Elis böse Söhne und das Strafwort über sein Haus, Elis Tod und der Name Ikabod, die Beulen nur als "krank werden", die Männer von Bet-Schemesch, Nahasch und Jabesch,
 * der Philisterkrieg bei Michmas mit Jonatan, der Bann über Amalek und der Tod Agags; Gottes Reue nur im Wort Samuels. Die Lade wird immer mit zwei goldenen Cherubim gezeigt, nie ein Götterbild (Dagon nur als zerbrochene Steine ohne Gesicht).
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Das passende Oberkleid (neu), 3 Lückenvers (alt), 4 nur Quiz, 5 Zwei Kühe ziehen heim (neu), 6 Den Stein in die Mitte setzen (neu), 7 nur Quiz,
 * 8 Auf der Karte suchen (neu), 9 Die Zeichen ordnen (alt), 10 Saul im Gepäck finden (neu), 11 Das Volk bei Saul halten (neu), 12 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/samuel/, images/abenteuer/spiele/samuel/<spiel>/, audio/abenteuer/samuel/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BaggageGame, CoatGame, CowsGame, GatherGame, Journey, OrderGame, SearchGame, StoneGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { SAMUEL_PATH } from './samuelPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { samuelEn } from './en/samuel.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/samuel/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/samuel/'

const G = 'images/abenteuer/spiele/samuel/'

/**
 * Etappe 2, "Das passende Oberkleid": die Stube im Haus Gottes; Samuel steht links, jedes Jahr größer (ein gemalter Junge, vom Code in drei Größen gezeigt), auf dem Regal liegen kleine Oberkleider, alle vom selben gemalten Kleid, vom Code in verschiedenen Breiten gezeigt (neu).
 * Das Kind tippt das Oberkleid, das Samuel passt: es fliegt zu ihm. Ein zu kleines oder zu großes ist ein Fehler (Kreuz, ein Wort). Jede Runde drei Kleider, von Runde zu Runde näher beieinander (Runde 1 um 30 und 40 Prozent daneben, Runde 3 um 16 und 18), immer genau eines passt (`coatFits`, zwölf Prozent Spielraum).
 * Bilder (Bildauftrag R30): `oberkleid/stube.webp` 1200 × 900, `samuel.webp` (ein einzelner Junge, der Code zeigt ihn in drei Größen), `kleid.webp`.
 */
const OBERKLEID: CoatGame = {
  background: `${G}oberkleid/stube.webp`,
  boy: `${G}oberkleid/samuel.webp`,
  boyW: [15.3, 20.8, 27],
  boyPos: { x: 17, y: 92 },
  coat: `${G}oberkleid/kleid.webp`,
  shelf: { y: 94, x0: 34, x1: 98 },
  ratio: 0.75,
  rounds: [
    { hint: 'Welches Oberkleid passt Samuel?', boy: 0, coats: [8.03, 11.48, 16.07] },
    { hint: 'Samuel ist gewachsen. Welches passt jetzt?', boy: 1, coats: [19.03, 12.48, 15.6] },
    { hint: 'Wieder ein Jahr später. Welches passt?', boy: 2, coats: [17.01, 23.89, 20.25] }
  ]
}

/**
 * Etappe 3, "Lückenvers" (alte Mechanik 1 von 2): Samuels Antworten aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Elia, kopiert. Hintergrund ist das Etappenbild 3, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-03.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Rede, Herr, denn dein ', ' hört.“'], words: ['Knecht', 'Priester', 'König'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Hier ', ' ich! Du hast mich ', '.“'], words: ['bin', 'gerufen', 'war', 'geschlafen'], answers: [0, 1] }
  ]
}

/**
 * Etappe 5, "Zwei Kühe ziehen heim": eine gerade Staubstraße führt vom unteren Bildrand auf eine Stadt auf dem Hügel zu; der Wagen mit der Lade und zwei jungen Kühen fährt von selbst (von hinten gesehen, er wird kleiner, je weiter er fährt),
 * aber die Kühe werden zum Gras gezogen, mal links, mal rechts (neu). Das Kind tippt die linke oder die rechte Bildhälfte: der Wagen wird zu dieser Seite zurückgeschoben. Berührt ein Rad das Gras, bleiben die Kühe stehen und fressen (ein Fehler), der Wagen steht danach wieder in der Mitte.
 * Runde 1 zieht sanft (14 Sekunden Fahrt), Runde 2 stärker (18 Sekunden). Bilder (Bildauftrag R31): `kuehe/strasse.webp` 1200 × 900, `wagen.webp`, `gras-1..4.webp` (aus EINEM Bogen geschnitten).
 */
const KUEHE: CowsGame = {
  background: `${G}kuehe/strasse.webp`,
  road: { y0: 90, y1: 50, cx0: 49.5, cx1: 50.8, half0: 30, half1: 9.5 },
  cart: `${G}kuehe/wagen.webp`,
  cartW: 32,
  tufts: [
    { image: `${G}kuehe/gras-1.webp`, x: 13, y: 94, w: 11 },
    { image: `${G}kuehe/gras-2.webp`, x: 87, y: 90, w: 11 },
    { image: `${G}kuehe/gras-3.webp`, x: 30, y: 76, w: 8.5 },
    { image: `${G}kuehe/gras-4.webp`, x: 70, y: 71, w: 8.5 },
    { image: `${G}kuehe/gras-1.webp`, x: 38, y: 62, w: 6.5 },
    { image: `${G}kuehe/gras-2.webp`, x: 62, y: 59, w: 6.5 }
  ],
  rounds: [
    { hint: 'Die Kühe wollen zum Gras. Tippe auf die Seite, zu der der Wagen zurück soll.', drift: 40, dur: 14000 },
    { hint: 'Jetzt ziehen sie stärker. Bleibe mit dem Wagen auf der Straße.', drift: 46, dur: 18000 }
  ]
}

/**
 * Etappe 6, "Den Stein in die Mitte setzen": eine Landschaft mit einem Weg, links und rechts ein Wahrzeichen (Mizpa als Hügel mit Zelten, ein Fels); das Kind zieht den Stein und lässt ihn genau in der Mitte zwischen den beiden los (acht Prozent des Abstands Spielraum) (neu).
 * Richtig: der Stein steht fest; falsch: ein Kreuz, ein Wort, der Stein geht zurück. Runde 1 mit einer Kerbe in der Mitte, Runde 2 ohne; je Runde zwei Steine zwischen anderen Abständen.
 * Bilder (Bildauftrag R32): `stein/land.webp` 1200 × 900, `orte-1..2.webp` (aus EINEM Bogen geschnitten), `stein.webp`.
 */
const STEIN: StoneGame = {
  background: `${G}stein/land.webp`,
  marks: [1, 2].map((n) => `${G}stein/orte-${n}.webp`),
  markW: [25.6, 29],
  stone: `${G}stein/stein.webp`,
  stoneW: 9.5,
  groundY: 70,
  startPos: { x: 50, y: 92 },
  rounds: [
    {
      hint: 'Setze den Stein genau in die Mitte zwischen die beiden Orte. Die Kerbe hilft dir.',
      notch: true,
      pairs: [
        { a: { image: 0, x: 22 }, b: { image: 1, x: 80 } },
        { a: { image: 0, x: 14 }, b: { image: 1, x: 64 } }
      ]
    },
    {
      hint: 'Noch einmal, jetzt ohne Kerbe. Schätze die Mitte.',
      notch: false,
      pairs: [
        { a: { image: 1, x: 30 }, b: { image: 0, x: 88 } },
        { a: { image: 0, x: 10 }, b: { image: 1, x: 52 } }
      ]
    }
  ]
}

/**
 * Etappe 8, "Auf der Karte suchen": eine gemalte Karte mit fünf Orten (Gebirge Ephraim, Land Schalischa, Land Schaalim, Land Benjamin, Land Zuf); Saul und der Knecht suchen die Eselinnen und gehen von Ort zu Ort (neu).
 * Das Kind tippt die Orte in der Reihenfolge der Geschichte; ein falscher Ort ist ein Fehler. Runde 1 mit Fußspuren zum nächsten Ort, Runde 2 ohne Spuren (der Hinweis nennt die Reihenfolge).
 * Bilder (Bildauftrag R33): `suchen/karte.webp` 1200 × 900 (die fünf Orte sind in die Karte gemalt, das Spiel legt runde Tippflächen darüber), `saul.webp`, `spuren-1..4.webp` (vier Paare Fußspuren).
 */
const SUCHEN: SearchGame = {
  background: `${G}suchen/karte.webp`,
  places: [
    { label: 'Ephraim', x: 17, y: 16, w: 11 },
    { label: 'Schalischa', x: 25, y: 45, w: 11 },
    { label: 'Schaalim', x: 80, y: 58, w: 11 },
    { label: 'Benjamin', x: 64, y: 22, w: 11 },
    { label: 'Zuf', x: 92, y: 14, w: 11 }
  ],
  prints: [1, 2, 3, 4].map((n) => `${G}suchen/spuren-${n}.webp`),
  printW: 2.7,
  saul: `${G}suchen/saul.webp`,
  saulW: 3.7,
  rounds: [
    { hint: 'Saul sucht die Eselinnen. Folge den Spuren von Ort zu Ort.', prints: true, order: [0, 1, 2, 3, 4] },
    { hint: 'Jetzt ohne Spuren: erst Ephraim, dann Schalischa, Schaalim, Benjamin und zuletzt Zuf.', prints: false, order: [0, 1, 2, 3, 4] }
  ]
}

/**
 * Etappe 9, "Die Zeichen ordnen" (alte Mechanik 2 von 2, Reihenfolge legen): die Zeichen, die Samuel Saul nennt (1. Samuel 10,2–6), und die Salbung selbst als erste Karte.
 * Runde 1 drei Karten (zwei Männer am Grab, drei Männer an der Eiche, die Propheten) mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag R36): `reihenfolge/schritt-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'salbung', image: `${G}reihenfolge/schritt-1.webp`, label: 'Samuel salbt Saul' },
    { id: 'grab', image: `${G}reihenfolge/schritt-2.webp`, label: 'Zwei Männer beim Grab Rahels' },
    { id: 'eiche', image: `${G}reihenfolge/schritt-3.webp`, label: 'Drei Männer an der Eiche' },
    { id: 'propheten', image: `${G}reihenfolge/schritt-4.webp`, label: 'Die Propheten mit Harfen und Flöten' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Zeichen. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['grab', 'eiche', 'propheten'] },
    { hint: 'Runde 2: Jetzt mit der Salbung und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['salbung', 'grab', 'eiche', 'propheten'] }
  ]
}

/**
 * Etappe 10, "Saul im Gepäck finden": der Platz in Mizpa mit Stapeln aus Säcken, Körben und Krügen (niedrig bis hoch); hinter einem hohen Stapel steht Saul, einen Kopf größer als alle (neu).
 * Das Kind hebt Stapel mit einem Tipp an; darunter ist nur Gepäck (ein Fehler) oder Saul (die Runde ist geschafft). Runde 1 fünf Stapel, Runde 2 acht, Saul steht an einer anderen Stelle. Nur ein Stapel, der so hoch ist wie Saul, kann ihn verbergen.
 * Bilder (Bildauftrag R34): `gepaeck/platz.webp` 1200 × 900, `stapel-1..4.webp` (aus EINEM Bogen geschnitten, gleicher Maßstab), `saul.webp`, `dinge-1..3.webp` (Krug, Zicklein, Brotkorb: liegen unter den Stapeln, die niemanden verbergen).
 */
const GEPAECK: BaggageGame = {
  background: `${G}gepaeck/platz.webp`,
  piles: [1, 2, 3, 4].map((n) => `${G}gepaeck/stapel-${n}.webp`),
  pileW: [26, 26, 26, 26],
  pileH: [48, 47, 47, 48],
  saul: `${G}gepaeck/saul.webp`,
  saulW: 10.1,
  saulH: 39,
  things: [1, 2, 3].map((n) => `${G}gepaeck/dinge-${n}.webp`),
  thingW: 8.9,
  rounds: [
    {
      hint: 'Saul ist größer als alle. Hinter welchem Stapel kann er sich verstecken?',
      hidden: 3,
      piles: [
        { kind: 0, x: 16, y: 64, scale: 0.62 },
        { kind: 1, x: 58, y: 64, scale: 0.7 },
        { kind: 0, x: 92, y: 64, scale: 0.55 },
        { kind: 3, x: 35, y: 86 },
        { kind: 2, x: 74, y: 88 }
      ]
    },
    {
      hint: 'Jetzt acht Stapel, und Saul steht an einer anderen Stelle. Hebe sie an.',
      hidden: 5,
      piles: [
        { kind: 0, x: 36, y: 60, scale: 0.6 },
        { kind: 1, x: 90, y: 60, scale: 0.62 },
        { kind: 1, x: 10, y: 62, scale: 0.55 },
        { kind: 2, x: 64, y: 62, scale: 0.58 },
        { kind: 3, x: 22, y: 86 },
        { kind: 0, x: 78, y: 86 },
        { kind: 2, x: 50, y: 88 },
        { kind: 3, x: 92, y: 92, scale: 0.6 }
      ]
    }
  ]
}

/**
 * Etappe 11, "Das Volk bei Saul halten": das Lager in Gilgal, Saul am Altar, sechs Männer des Volkes um ihn; eine gemalte Sonne wandert, Tag für Tag, und einzelne Männer gehen weg zum Rand (neu).
 * Das Kind tippt einen Weggehenden: er kommt zurück. Wer den Rand erreicht, ist verloren (ein Fehler), er kommt nach einer Weile beschämt zurück. Am Ende der Tage kommt Samuel. Runde 1 drei Tage, Runde 2 sieben Tage, mehr Männer gehen weg.
 * Es gibt nichts zu opfern und keinen Knopf dafür; es geht nur um die Männer. Bilder (Bildauftrag R35): `volk/lager.webp` 1200 × 900, `maenner-1..6.webp` (aus EINEM Bogen geschnitten, gleicher Maßstab), `saul.webp` (roter Mantel, ohne Krone), `sonne.webp`, `samuel.webp`.
 */
const VOLK: GatherGame = {
  background: `${G}volk/lager.webp`,
  men: [1, 2, 3, 4, 5, 6].map((n) => `${G}volk/maenner-${n}.webp`),
  manW: 16.8,
  homes: [
    { sprite: 0, x: 20, y: 64, dir: -1 },
    { sprite: 1, x: 74, y: 64, dir: 1 },
    { sprite: 2, x: 10, y: 78, dir: -1 },
    { sprite: 3, x: 88, y: 78, dir: 1 },
    { sprite: 4, x: 30, y: 92, dir: -1 },
    { sprite: 5, x: 72, y: 92, dir: 1 }
  ],
  saul: `${G}volk/saul.webp`,
  saulPos: { x: 56, y: 86, w: 12.6 },
  sun: `${G}volk/sonne.webp`,
  samuel: `${G}volk/samuel.webp`,
  samuelPos: { x: 88, y: 94, w: 15.1 },
  rounds: [
    { hint: 'Saul wartet auf Samuel. Tippe jeden Mann an, der weggeht: er kommt zurück.', days: 3, dayMs: 4500, leaves: [{ man: 1, at: 1500 }, { man: 4, at: 5200 }, { man: 2, at: 8800 }] },
    { hint: 'Jetzt sieben Tage lang. Halte die Männer bei Saul.', days: 7, dayMs: 3500, leaves: [{ man: 3, at: 1200 }, { man: 0, at: 4200 }, { man: 5, at: 7000 }, { man: 1, at: 9800 }, { man: 4, at: 12600 }, { man: 2, at: 15400 }, { man: 3, at: 18200 }] }
  ]
}

export const samuel: Journey = {
  id: 'samuel',
  title: 'Samuel und Saul',
  subtitle: 'Rede, Herr, denn dein Knecht hört',
  age: '8-10',
  downloadMb: 22, // gemessen 22 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: die Lampe im Haus Gottes, Samuel, das Oberkleid und das Ölhorn (Konturzeichnung)
  gift: { title: 'Samuel und die Lampe', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 12942 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus samuelPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/samuel/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 12942 / 1648,
    widthPx: 12942,
    stages: [
      { x: 0.0433, y: 0.5643, d: 0.0260 },
      { x: 0.1159, y: 0.6250, d: 0.0260 },
      { x: 0.2287, y: 0.5704, d: 0.0260 },
      { x: 0.3323, y: 0.6068, d: 0.0260 },
      { x: 0.4157, y: 0.3277, d: 0.0260 },
      { x: 0.5115, y: 0.5643, d: 0.0260 },
      { x: 0.5780, y: 0.5886, d: 0.0260 },
      { x: 0.6722, y: 0.5461, d: 0.0260 },
      { x: 0.7418, y: 0.5036, d: 0.0260 },
      { x: 0.8422, y: 0.6311, d: 0.0260 },
      { x: 0.8870, y: 0.4733, d: 0.0260 },
      { x: 0.9427, y: 0.5158, d: 0.0260 }
    ],
    exam: { x: 0.9844, y: 0.3944, d: 0.0260 },
    path: SAMUEL_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Hanna betet',
      ref: '1. Samuel 1,1–20',
      text: [
        'Jedes Jahr zieht Elkana mit seiner Familie nach Silo, um Gott anzubeten. Seine Frau Peninna hat Kinder, aber seine Frau Hanna hat keine. Peninna ärgert Hanna deswegen, und Hanna weint und mag nichts essen. „Warum weinst du?“, fragt Elkana. „Bin ich dir nicht mehr wert als zehn Söhne?“',
        'Da geht Hanna zum Haus Gottes, wo der Priester Eli sitzt. Sie betet lange und weint, und nur ihre Lippen bewegen sich. „Herr, schenk mir einen Sohn“, betet sie, „dann gebe ich ihn dir sein Leben lang zurück.“ Eli sieht ihre Lippen zittern und meint, sie habe zu viel Wein getrunken.',
        '„Nein, mein Herr“, sagt Hanna, „ich bin sehr traurig und habe mein Herz vor Gott ausgeschüttet.“ „Geh in Frieden“, sagt Eli. „Gott wird dir geben, worum du gebeten hast.“ Bald darauf bekommt Hanna einen Sohn. Sie nennt ihn Samuel, denn sie hat ihn von Gott erbeten.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin zieht Elkana jedes Jahr mit seiner Familie?', options: ['nach Silo', 'nach Jericho', 'nach Bethlehem'], answer: 0 },
        { q: 'Was verspricht Hanna Gott für einen Sohn?', options: ['Sie will ihn Gott sein Leben lang zurückgeben.', 'Sie will ein großes Fest feiern.', 'Sie will ein Haus bauen.'], answer: 0 },
        { q: 'Wie nennt Hanna ihren Sohn?', options: ['Samuel', 'Elkana', 'Eli'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Das kleine Oberkleid',
      ref: '1. Samuel 1,21 – 2,26',
      text: [
        'Als Samuel alt genug ist, bringt Hanna ihn nach Silo zu Eli. „Ich bin die Frau, die hier gebetet hat“, sagt sie. „Um diesen Jungen habe ich gebeten, und Gott hat mir meine Bitte erfüllt. Nun gebe ich ihn Gott zurück, solange er lebt.“ Dort beten sie Gott an.',
        'Samuel bleibt bei Eli und dient Gott im Haus Gottes, obwohl er noch ein kleiner Junge ist. Und jedes Jahr, wenn Hanna mit ihrem Mann nach Silo hinaufzieht, bringt sie ihm ein kleines Oberkleid mit, das sie für ihn gemacht hat.',
        'Eli segnet Elkana und Hanna. Später schenkt Gott Hanna noch drei Söhne und zwei Töchter. Samuel aber wächst im Haus Gottes heran, und Gott und die Menschen haben ihn gern.'
      ],
      // Spiel: Das passende Oberkleid (oberkleid, neu)
      task: { kind: 'oberkleid', hint: 'Tippe das Oberkleid an, das Samuel passt.', coat: OBERKLEID },
      questions: [
        { q: 'Bei wem bleibt Samuel im Haus Gottes?', options: ['bei Eli', 'bei Elkana', 'bei Peninna'], answer: 0 },
        { q: 'Was bringt Hanna ihm jedes Jahr mit?', options: ['ein kleines Oberkleid', 'ein Schaf', 'einen Krug Wein'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Gott ruft Samuel',
      ref: '1. Samuel 3',
      text: [
        'Samuel dient Gott bei Eli. Eli ist sehr alt, und seine Augen sind schwach. Eines Nachts liegt Samuel dort, wo die Lade Gottes steht, und die Lampe brennt noch. Da hört er jemanden rufen: „Samuel!“',
        '„Hier bin ich!“, sagt Samuel, läuft zu Eli und ruft: „Du hast mich gerufen.“ „Ich habe dich nicht gerufen“, sagt Eli. „Geh wieder schlafen.“ Das geschieht noch ein zweites und ein drittes Mal, denn Samuel kennt Gott noch nicht. Da merkt Eli, dass Gott den Jungen ruft.',
        '„Wenn du gerufen wirst, dann sprich: Rede, Herr, denn dein Knecht hört“, sagt er. Samuel legt sich wieder hin. Wieder ruft Gott: „Samuel, Samuel!“ „Rede, denn dein Knecht hört“, sagt Samuel. Gott sagt ihm ein ernstes Wort für Eli, und Samuel erzählt es am Morgen, ohne etwas zu verschweigen. Von da an erkennt ganz Israel: Samuel ist ein Prophet Gottes.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 1 von 2)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Zu wem läuft Samuel in der Nacht?', options: ['zu Eli', 'zu Hanna', 'zu Elkana'], answer: 0 },
        { q: 'Wer merkt, dass Gott den Jungen ruft?', options: ['Eli', 'Samuel', 'Elkana'], answer: 0 },
        { q: 'Was erkennt ganz Israel?', options: ['Samuel ist ein Prophet Gottes.', 'Samuel ist ein Richter.', 'Samuel ist ein König.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Die Lade bei den Philistern',
      ref: '1. Samuel 4–5',
      text: [
        'Israel zieht gegen die Philister in den Kampf und verliert. Da holen die Israeliten die Bundeslade aus Silo ins Lager. Das Volk jubelt so laut, dass die Erde dröhnt, und die Philister erschrecken. Aber sie kämpfen trotzdem, und Israel verliert noch einmal. Viele Männer fallen, und die Philister nehmen die Lade Gottes mit.',
        'Sie bringen die Lade in das Haus ihres Gottes Dagon in Aschdod und stellen sie neben ihn. Am nächsten Morgen finden sie Dagon umgefallen vor der Lade. Sie stellen ihn wieder auf. Am nächsten Morgen liegt er wieder da, und diesmal ist er zerbrochen.',
        'Die Menschen in Aschdod werden krank, und die Angst wird groß. „Die Hand des Gottes Israels liegt zu schwer auf uns“, sagen sie. „Die Lade soll nicht bei uns bleiben.“ Sie tragen die Lade von Stadt zu Stadt, aber überall wird es nicht besser.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was holen die Israeliten aus Silo ins Lager?', options: ['die Bundeslade', 'eine Fahne', 'ein Schwert'], answer: 0 },
        { q: 'Wohin bringen die Philister die Lade?', options: ['in das Haus ihres Gottes Dagon', 'in ihren Königspalast', 'in ein Zelt am Meer'], answer: 0 },
        { q: 'Was finden die Leute in Aschdod am Morgen?', options: ['Dagon liegt umgefallen vor der Lade.', 'Die Lade ist verschwunden.', 'Die Lade leuchtet.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Zwei Kühe ziehen heim',
      ref: '1. Samuel 6,1 – 7,2',
      text: [
        'Sieben Monate ist die Lade bei den Philistern. Da fragen sie ihre Priester: „Was sollen wir mit der Lade tun?“ „Schickt sie nicht leer zurück“, sagen die Priester. „Gebt dem Gott Israels eine Gabe aus Gold. Baut einen neuen Wagen und nehmt zwei junge Kühe, auf denen noch nie ein Joch lag. Ihre Kälber lasst zu Hause.“',
        '„Legt die Lade auf den Wagen und lasst die Kühe gehen. Gehen sie nach Bet-Schemesch, dann hat uns der Gott Israels diese Not geschickt.“ Die Philister tun es. Und die Kühe gehen geradewegs auf Bet-Schemesch zu, sie blöken, aber sie weichen nicht nach rechts und nicht nach links.',
        'In Bet-Schemesch schneiden die Leute gerade Weizen im Tal. Sie sehen die Lade und freuen sich. Der Wagen bleibt auf einem Acker bei einem großen Stein stehen. Später holen Männer aus Kirjat-Jearim die Lade in ein Haus auf dem Hügel.'
      ],
      // Spiel: Zwei Kühe ziehen heim (kuehe, neu)
      task: { kind: 'kuehe', hint: 'Halte den Wagen auf der Straße. Tippe auf die Seite, zu der er zurück soll.', cows: KUEHE },
      questions: [
        { q: 'Was bleibt bei den Kühen zu Hause?', options: ['die Kälber', 'der Wagen', 'das Joch'], answer: 0 },
        { q: 'Wohin gehen die Kühe?', options: ['geradewegs auf Bet-Schemesch zu', 'zurück nach Aschdod', 'ans Meer'], answer: 0 },
        { q: 'Was tun die Leute in Bet-Schemesch gerade?', options: ['Sie schneiden Weizen.', 'Sie backen Brot.', 'Sie bauen ein Haus.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Eben-Ezer',
      ref: '1. Samuel 7,3–14',
      text: [
        'Zwanzig Jahre bleibt die Lade in Kirjat-Jearim, und das Volk ist traurig. Da sagt Samuel: „Wenn ihr von ganzem Herzen zu Gott umkehrt und ihm allein dient, wird er euch retten.“ Das Volk legt die fremden Götterbilder weg. Samuel ruft alle nach Mizpa, um für sie zu beten. Dort gießen sie Wasser vor Gott aus und sagen: „Wir haben an Gott gesündigt.“',
        'Als die Philister hören, dass Israel in Mizpa versammelt ist, ziehen sie dorthin. Das Volk bekommt Angst. „Hör nicht auf, für uns zu Gott zu rufen!“, bitten sie Samuel. Samuel opfert ein Lamm und ruft zu Gott, und Gott erhört ihn. Als die Philister angreifen, lässt Gott einen gewaltigen Donner über sie krachen. Sie erschrecken und fliehen.',
        'Da nimmt Samuel einen Stein und stellt ihn zwischen Mizpa und Sen auf. Er nennt ihn Eben-Ezer und sagt: „Bis hierher hat uns Gott geholfen.“'
      ],
      // Spiel: Den Stein in die Mitte setzen (stein, neu)
      task: { kind: 'stein', hint: 'Ziehe den Stein genau in die Mitte zwischen die beiden Orte.', stone: STEIN },
      questions: [
        { q: 'Was gießt das Volk in Mizpa vor Gott aus?', options: ['Wasser', 'Wein', 'Öl'], answer: 0 },
        { q: 'Was lässt Gott über die Philister krachen?', options: ['einen gewaltigen Donner', 'einen Steinregen', 'einen Sturm'], answer: 0 },
        { q: 'Wie nennt Samuel den Stein?', options: ['Eben-Ezer', 'Silo', 'Rama'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Wir wollen einen König',
      ref: '1. Samuel 8',
      text: [
        'Samuel wird alt. Er setzt seine Söhne als Richter ein, aber die gehen nicht seinen Weg: Sie nehmen Geschenke und beugen das Recht. Da kommen alle Ältesten Israels zu Samuel nach Rama. „Du bist alt, und deine Söhne gehen nicht deine Wege“, sagen sie. „Gib uns einen König, wie ihn alle Völker haben.“',
        'Das gefällt Samuel nicht, und er betet. Gott sagt zu ihm: „Hör auf das Volk. Nicht dich haben sie verworfen, sondern mich. Aber warne sie und sag ihnen, was ein König mit ihnen tun wird.“',
        'Samuel warnt das Volk: „Ein König nimmt eure Söhne und Töchter, damit sie für ihn arbeiten. Er nimmt eure besten Felder und von allem den zehnten Teil.“ Doch das Volk will nicht hören. „Nein“, rufen sie, „wir wollen einen König! Er soll unsere Kriege führen.“ Und Gott sagt zu Samuel: „Gib ihnen einen König.“'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin kommen die Ältesten Israels?', options: ['nach Rama zu Samuel', 'nach Silo zu Eli', 'nach Mizpa'], answer: 0 },
        { q: 'Warum wollen die Ältesten einen König?', options: ['Samuel ist alt, und seine Söhne gehen nicht seine Wege.', 'Die Philister haben es befohlen.', 'Samuel ist krank geworden.'], answer: 0 },
        { q: 'Was sagt Samuel über einen König?', options: ['Er nimmt eure Söhne und die besten Felder.', 'Er schenkt euch Gold.', 'Er baut euch Häuser.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Saul sucht die Eselinnen',
      ref: '1. Samuel 9,1–14',
      text: [
        'In Benjamin lebt ein reicher Mann, Kisch. Sein junger Sohn Saul ist einen Kopf größer als alle anderen im Volk. Eines Tages sind Kischs Eselinnen verloren gegangen. „Nimm einen Knecht mit und such sie“, sagt er zu Saul.',
        'Saul und der Knecht gehen durch das Gebirge Ephraim, durch das Land Schalischa, durch das Land Schaalim und durch das Land Benjamin. Aber sie finden die Eselinnen nirgends. Als sie ins Land Zuf kommen, sagt Saul: „Komm, wir gehen heim. Sonst sorgt sich mein Vater um uns.“',
        'Der Knecht sagt: „In dieser Stadt wohnt ein Mann Gottes. Was er sagt, geschieht. Vielleicht sagt er uns, welchen Weg wir gehen sollen.“ „Aber was bringen wir ihm? Unser Brot ist aufgegessen“, sagt Saul. „Ich habe ein Viertel Silberstück“, sagt der Knecht. Da steigen sie zur Stadt hinauf und fragen die Mädchen am Brunnen: „Ist der Seher hier?“'
      ],
      // Spiel: Auf der Karte suchen (suchen, neu)
      task: { kind: 'suchen', hint: 'Tippe die Orte in der Reihenfolge der Geschichte an.', search: SUCHEN },
      questions: [
        { q: 'Wessen Sohn ist Saul?', options: ['Kischs', 'Elis', 'Elkanas'], answer: 0 },
        { q: 'Was haben Saul und der Knecht verloren und suchen?', options: ['Kischs Eselinnen', 'ihr Zelt', 'ihr Brot'], answer: 0 },
        { q: 'Was hat der Knecht für den Mann Gottes bei sich?', options: ['ein Viertel Silberstück', 'einen Krug Wein', 'ein Lamm'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Samuel salbt Saul',
      ref: '1. Samuel 9,15 – 10,8',
      text: [
        'Einen Tag vorher hat Gott zu Samuel gesagt: „Morgen schicke ich dir einen Mann aus Benjamin. Den sollst du zum Fürsten über mein Volk salben.“ Als Samuel Saul sieht, sagt Gott: „Das ist der Mann.“ „Um die Eselinnen musst du dich nicht mehr sorgen, sie sind gefunden“, sagt Samuel zu Saul. Saul wundert sich: „Ich bin doch aus dem kleinsten Stamm Israels.“',
        'Samuel setzt Saul beim Festessen obenan. Am Morgen schickt Samuel den Knecht voraus. Dann gießt er Öl auf Sauls Kopf, küsst ihn und sagt: „Gott hat dich zum Fürsten über sein Volk gesalbt.“',
        'Samuel kündigt Saul drei Zeichen an: Zwei Männer werden ihm sagen, dass die Eselinnen gefunden sind. Bei der Eiche geben ihm drei Männer zwei Brote. Und eine Schar Propheten kommt ihm mit Harfen und Flöten entgegen. Als Saul sich zum Gehen wendet, gibt Gott ihm ein anderes Herz.'
      ],
      // Spiel: Die Zeichen ordnen (reihenfolge, alt 2 von 2)
      task: { kind: 'reihenfolge', hint: 'Lege die Karten in die Reihenfolge der Zeichen.', order: REIHENFOLGE },
      questions: [
        { q: 'Was gießt Samuel auf Sauls Kopf?', options: ['Öl', 'Wasser', 'Wein'], answer: 0 },
        { q: 'Was sagt Samuel über die Eselinnen?', options: ['Sie sind gefunden.', 'Sie sind verkauft.', 'Sie sind weggelaufen.'], answer: 0 },
        { q: 'Was gibt Gott Saul, als er sich zum Gehen wendet?', options: ['ein anderes Herz', 'ein Schwert', 'eine Krone'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Saul wird König',
      ref: '1. Samuel 10,17–27',
      text: [
        'Samuel ruft das Volk nach Mizpa. „So spricht Gott: Ich habe euch aus Ägypten geführt, und ihr habt mich verworfen und wollt einen König. Nun tretet vor Gott, Stamm für Stamm.“ Samuel lässt das Los werfen. Es trifft den Stamm Benjamin und dann Saul, den Sohn des Kisch.',
        'Aber als sie Saul suchen, ist er nicht da. „Wird er noch kommen?“, fragen sie Gott. „Seht, er hat sich bei dem Gepäck versteckt“, antwortet Gott. Da laufen sie hin und holen ihn heraus. Als Saul unter das Volk tritt, ist er einen Kopf größer als alle.',
        '„Seht, den hat Gott erwählt!“, ruft Samuel. „Keiner im Volk ist wie er.“ Da jubelt das Volk: „Es lebe der König!“ Dann geht Saul nach Gibea, und Männer, deren Herz Gott berührt hat, gehen mit ihm. Ein paar Leute verachten ihn. Saul tut, als hörte er es nicht.'
      ],
      // Spiel: Saul im Gepäck finden (gepaeck, neu)
      task: { kind: 'gepaeck', hint: 'Hebe die Gepäckstapel an und finde Saul.', baggage: GEPAECK },
      questions: [
        { q: 'Wohin ruft Samuel das Volk?', options: ['nach Mizpa', 'nach Silo', 'nach Gilgal'], answer: 0 },
        { q: 'Was ruft das Volk, als Saul vor sie tritt?', options: ['Es lebe der König!', 'Wir wollen heim!', 'Wo ist Samuel?'], answer: 0 },
        { q: 'Wohin geht Saul danach?', options: ['nach Gibea', 'nach Rama', 'nach Silo'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Saul kann nicht warten',
      ref: '1. Samuel 13,1–14',
      text: [
        'Saul ist schon eine Weile König, da sammeln die Philister ein riesiges Heer gegen Israel, mit Wagen, Reitern und so vielen Männern wie Sand am Meer. Die Israeliten bekommen Angst und verstecken sich in Höhlen, Felsspalten und Gruben. Saul wartet in Gilgal, und sein Volk zittert hinter ihm.',
        'Samuel hatte zu Saul gesagt: „Warte sieben Tage, bis ich komme.“ Saul wartet sieben Tage, aber Samuel kommt nicht. Das Volk läuft ihm davon, einer nach dem anderen. Da wird Saul unruhig. „Bringt mir das Opfer her!“, ruft er und opfert selbst.',
        'Kaum ist er fertig, da kommt Samuel. „Was hast du getan?“ „Das Volk lief mir davon, du kamst nicht, und die Philister warten auf mich“, sagt Saul. „Du hast töricht gehandelt“, sagt Samuel. „Du hast Gottes Gebot nicht gehalten. Dein Königtum wird nicht bleiben. Gott hat sich einen Mann gesucht, der ihm am Herzen liegt.“'
      ],
      // Spiel: Das Volk bei Saul halten (volk, neu)
      task: { kind: 'volk', hint: 'Tippe jeden Mann an, der weggeht, und halte das Volk bei Saul.', gather: VOLK },
      questions: [
        { q: 'Wo verstecken sich die Israeliten vor den Philistern?', options: ['in Höhlen, Felsspalten und Gruben', 'in der Stadt Silo', 'hinter der Lade'], answer: 0 },
        { q: 'Was tut Saul, als das Volk davonläuft?', options: ['Er opfert selbst.', 'Er läuft auch davon.', 'Er greift allein an.'], answer: 0 },
        { q: 'Was sagt Samuel zu Saul?', options: ['Du hast töricht gehandelt.', 'Du hast gut gewartet.', 'Du bist ein tapferer König.'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Gehorsam ist besser als Opfer',
      ref: '1. Samuel 15',
      text: [
        'Gott sendet Samuel zu Saul: „Zieh gegen die Amalekiter und tu alles, was Gott dir sagt.“ Saul zieht aus und siegt. Aber er und das Volk behalten die besten Schafe und Rinder.',
        'Da sagt Gott zu Samuel: „Es tut mir leid, dass ich Saul zum König gemacht habe. Er hört nicht auf mich.“ Samuel ruft die ganze Nacht zu Gott. Am Morgen fragt er Saul: „Was ist das für ein Blöken der Schafe?“ „Das Volk hat die besten behalten, um sie Gott zu opfern“, sagt Saul.',
        '„Hat Gott mehr Freude an Opfern als am Gehorsam?“, fragt Samuel. „Gehorsam ist besser als Opfer. Gott hat dich verworfen.“ Saul gibt zu: „Ich habe gesündigt.“ Als Samuel gehen will, hält Saul ihn am Mantel fest, und der Mantel reißt. „So reißt Gott das Königtum von dir“, sagt Samuel. Er sieht Saul nicht mehr, aber er trauert um ihn.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was behalten Saul und das Volk für sich?', options: ['die besten Schafe und Rinder', 'das Gold der Amalekiter', 'ihre Häuser'], answer: 0 },
        { q: 'Was sagt Samuel zu Saul?', options: ['Gehorsam ist besser als Opfer.', 'Opfer sind besser als Gehorsam.', 'Du bist der beste König.'], answer: 0 },
        { q: 'Was passiert mit Samuels Mantel?', options: ['Er reißt.', 'Er verbrennt.', 'Er wird verschenkt.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie nennt Hanna ihren Sohn?', options: ['Samuel', 'Elkana', 'Eli'], answer: 0 },
    { q: 'Was antwortet Samuel, als Gott ihn ruft?', options: ['Rede, denn dein Knecht hört.', 'Ich will nicht.', 'Ich bin zu klein.'], answer: 0 },
    { q: 'Was bleibt bei den Kühen zu Hause, als sie die Lade ziehen?', options: ['die Kälber', 'der Wagen', 'das Joch'], answer: 0 },
    { q: 'Was sagt Samuel über den Stein Eben-Ezer?', options: ['Bis hierher hat uns Gott geholfen.', 'Hier wohnt Gott.', 'Hier endet das Land.'], answer: 0 },
    { q: 'Was sucht Saul, als er zu Samuel kommt?', options: ['die Eselinnen seines Vaters', 'ein Schwert', 'einen neuen Weg'], answer: 0 },
    { q: 'Was ist besser als Opfer?', options: ['Gehorsam', 'Gold', 'Schafe'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of samuel.stages) {
  if (st.task.verse) st.task.verse.background = st.image ?? st.task.verse.background
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of samuel.stages) {
  const file = `audio/abenteuer/samuel/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (Shiloh and the night, the way of the cows, the king); they follow one another at random
samuel.music = [
  'audio/abenteuer/samuel/musik-silo-v1.mp3',
  'audio/abenteuer/samuel/musik-weg-v1.mp3',
  'audio/abenteuer/samuel/musik-koenig-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(samuel, samuelEn)
