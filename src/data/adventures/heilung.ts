/**
 * Abenteuer "Jesus heilt" (Lukas 5, 7, 17; Markus 10) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Vom Mann mit dem Aussatz bis Bartimäus". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 3.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Heilung/ENTWURF_Heilung.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-11-03.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend): 1 Lückenvers (alt), 2 Memory (alt), 3 Reihenfolge (alt), 4 nur Quiz, 5 Puzzle (alt), 6 Wer kehrt um? (neu),
 * 7 Wimmelbild (alt), 8 Lauter rufen (neu), 9 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/heilung/, images/abenteuer/spiele/heilung/<spiel>/, audio/abenteuer/heilung/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { FindGame, Journey, MemoryGame, OrderGame, ShoutGame, TurnBackGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { HEILUNG_PATH } from './heilungPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { heilungEn } from './en/heilung.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/heilung/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/heilung/'

const G = 'images/abenteuer/spiele/heilung/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 22 (kopiert). Hintergrund ist der gemalte Morgen am Stadtrand (Bildauftrag).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Herr, wenn du willst, kannst du mich ', ' machen.“'], words: ['rein', 'laut', 'müde'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Jesus streckt die ', ' aus und sagt: „Ich will es tun. Sei ', '!“'], words: ['Hand', 'rein', 'Faust', 'still'], answers: [0, 1] }
  ]
}

/**
 * Etappe 2, "Memory" (alte Mechanik): sechs Dinge aus der Geschichte des Hauptmanns (Helm, Bett, Synagoge, Schriftrolle, Haus, Sandalen); die Rückseite zeigt einen Palmzweig (Bildauftrag, ein Bogen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-helm.webp`, text: 'Der Helm: Der Hauptmann hat Soldaten unter sich.' },
    { image: `${G}memory/karte-bett.webp`, text: 'Das Bett: Sein Diener liegt todkrank darin.' },
    { image: `${G}memory/karte-synagoge.webp`, text: 'Die Synagoge: Der Hauptmann hat sie für das Volk gebaut.' },
    { image: `${G}memory/karte-schriftrolle.webp`, text: 'Die Schriftrolle: Die Ältesten der Juden bitten für ihn.' },
    { image: `${G}memory/karte-haus.webp`, text: 'Das Haus: Jesus geht mit den Ältesten dorthin.' },
    { image: `${G}memory/karte-sandalen.webp`, text: 'Die Sandalen: Jesus macht sich auf den Weg durch die Straßen von Kapernaum.' }
  ]
}

/**
 * Etappe 3, "Sprich nur ein Wort" (alte Mechanik, Reihenfolge legen): die Ältesten bitten Jesus, er geht mit ihnen, die Freunde des Hauptmanns kommen entgegen, der Diener ist gesund.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'bitte', image: `${G}reihenfolge/karte-1.webp`, label: 'Die Ältesten bitten Jesus um Hilfe' },
    { id: 'weg', image: `${G}reihenfolge/karte-2.webp`, label: 'Jesus geht mit den Ältesten' },
    { id: 'wort', image: `${G}reihenfolge/karte-3.webp`, label: 'Die Freunde sagen: Sprich nur ein Wort' },
    { id: 'gesund', image: `${G}reihenfolge/karte-4.webp`, label: 'Der Diener ist gesund' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['weg', 'wort', 'gesund'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang bei den Ältesten und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['bitte', 'weg', 'wort', 'gesund'] }
  ]
}

/**
 * Etappe 6, "Wer kehrt um?" (neu): zehn Männer gehen zu den Priestern, einer kehrt um und dankt (Lk 17,14-16). Bilder (Bildauftrag): `umkehr/strasse.webp` (Weg, ganz rechts das Haus der Priester), `mann-1..6.webp`,
 * `samariter.webp` (blau-weiß gestreiftes Kopftuch), `jesus.webp` (Jesus mit zwei Jüngern, links). Lagen sind Prozent des Bildes und werden nach den gemalten Bildern verfeinert.
 */
const UMKEHR: TurnBackGame = {
  background: `${G}umkehr/strasse.webp`,
  men: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `${G}umkehr/mann-${n}.webp`, label: 'Ein Mann auf dem Weg zu den Priestern', w: 11 })),
  samaritan: { image: `${G}umkehr/samariter.webp`, label: 'Der Samariter mit dem blau-weiß gestreiften Kopftuch', w: 11.5 },
  jesus: { image: `${G}umkehr/jesus.webp`, label: 'Jesus mit zwei Jüngern', w: 17, x: 10, y: 80 },
  road: { y: 78, spread: 10, startX: 20, gap: 6.4, houseX: 86 },
  rounds: [
    { hint: 'Die Männer gehen zum Haus der Priester. Tippe auf den, der umkehrt.', seconds: 4, crossing: false },
    { hint: 'Jetzt kreuzen sie sich. Achte auf den Streifen am Kopftuch.', seconds: 4, crossing: true }
  ]
}

/**
 * Etappe 8, "Lauter rufen" (neu): Bartimäus ruft lauter, als die Leute ihn zum Schweigen bringen wollen; Jesus bleibt stehen (Mk 10,47-49). Bilder (Bildauftrag): `ruf/weg.webp`, `bartimaeus.webp`, `zug.webp`
 * (Jesus, Jünger und Menge), `mann-winkt.webp`.
 */
const RUF: ShoutGame = {
  background: `${G}ruf/weg.webp`,
  bartimaeus: { image: `${G}ruf/bartimaeus.webp`, label: 'Bartimäus am Wegrand', w: 20, x: 20, y: 95 },
  group: { image: `${G}ruf/zug.webp`, label: 'Jesus, seine Jünger und eine Menge', w: 40, y: 56, from: 24, to: 60 },
  waver: { image: `${G}ruf/mann-winkt.webp`, label: 'Ein Mann winkt', w: 11, dx: 4, y: 72 },
  rounds: [
    { hint: 'Tippe schnell auf „Rufen“, damit Jesus dich hört.', seconds: 12, need: 25, hushes: 2 },
    { hint: 'Noch einmal. Die Menge ist lauter. Ruf lauter!', seconds: 14, need: 35, hushes: 4 }
  ]
}

/**
 * Etappe 7, "Wimmelbild" (alte Mechanik): der Hof mit dem Feigenbaum, Mütter, Väter und Kinder (Bildauftrag); gesucht werden vier Kinder (Mk 10,13-16): ein Mädchen mit Zopf, ein Junge mit Lockenkopf,
 * ein Junge mit einem Lämmchen und ein Kleinkind auf dem Arm. Einige stehen hinter Menschen, Krügen und Tüchern. Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Das Mädchen mit dem Zopf', 'Der Junge mit den Locken', 'Der Junge mit dem Lämmchen', 'Das kleine Kind auf dem Arm'],
  doneText: 'Du hast alle vier Kinder gefunden. Jesus hat sie alle in die Arme genommen und gesegnet.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 14, y: 46, w: 19 },
    { image: `${G}wimmel/figur-2.webp`, x: 47, y: 48, w: 19 },
    { image: `${G}wimmel/figur-3.webp`, x: 84, y: 63, w: 19 },
    { image: `${G}wimmel/figur-4.webp`, x: 34, y: 44, w: 20 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 17, y: 50, w: 15 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 49, y: 50, w: 14 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 88, y: 67, w: 15 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 36, y: 47, w: 15 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 80, y: 76, w: 12 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 92, y: 92, w: 13 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 76, y: 62, w: 13 }
  ]
}

export const heilung: Journey = {
  id: 'heilung',
  title: 'Jesus heilt',
  subtitle: 'Vom Mann mit dem Aussatz bis Bartimäus',
  age: '8-10',
  downloadMb: 14, // wird nach dem Bau gemessen (Bilder, Karte, Spielbilder, Musik, Aufnahmen), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v3.webp`, // Medaille 3 (Antons Wahl vom 3.11.2026)
  // Geschenk-Ausmalbild: Bartimäus' Mantel am Wegrand (Konturzeichnung)
  gift: { title: 'Der Mantel am Wegrand', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus heilungPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/heilung/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0827, y: 0.6493, d: 0.0339 },
      { x: 0.2218, y: 0.6068, d: 0.0339 },
      { x: 0.3175, y: 0.6311, d: 0.0339 },
      { x: 0.5040, y: 0.6523, d: 0.0339 },
      { x: 0.5685, y: 0.6675, d: 0.0339 },
      { x: 0.6250, y: 0.6675, d: 0.0339 },
      { x: 0.6754, y: 0.6068, d: 0.0339 },
      { x: 0.8165, y: 0.7464, d: 0.0339 },
      { x: 0.8972, y: 0.7585, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.6675, d: 0.0339 },
    path: HEILUNG_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01-b.webp`,
      title: 'Wenn du willst',
      ref: 'Lukas 5,12–14',
      text: [
        'In einer Stadt in Galiläa begegnet Jesus einem Mann mit Aussatz. Das ist eine Hautkrankheit, vor der sich alle fürchten, und darum muss der Mann allein leben.',
        'Als er Jesus sieht, wirft er sich vor ihm auf die Erde. „Herr“, bittet er, „wenn du willst, kannst du mich rein machen.“',
        'Jesus streckt die Hand aus und berührt ihn. „Ich will es tun“, sagt er. „Sei rein!“ Sofort ist die Krankheit verschwunden.',
        'Dann sagt Jesus zu ihm: „Erzähle es niemandem. Geh zum Priester und zeige dich ihm, so wie Mose es geboten hat.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Was bittet der Mann?', options: ['Jesus soll ihn rein machen.', 'Jesus soll ihm Brot geben.', 'Jesus soll ihn nach Hause bringen.'], answer: 0 },
        { q: 'Was tut Jesus, als der Mann ihn bittet?', options: ['Er streckt die Hand aus und berührt ihn.', 'Er geht weiter.', 'Er schickt ihn weg.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Der Hauptmann bittet',
      ref: 'Lukas 7,1–6',
      text: [
        'In Kapernaum lebt ein Hauptmann. Er hat Soldaten unter sich. Sein Diener liegt todkrank im Bett, und der Hauptmann hat ihn sehr gern.',
        'Er hat von Jesus gehört. Darum schickt er einige Älteste zu ihm. Sie sollen Jesus bitten, dass er kommt und den Diener gesund macht.',
        'Die Ältesten finden Jesus und bitten ihn dringend: „Er hat es verdient, dass du ihm hilfst. Er hat unser Volk lieb, und die Synagoge hat er uns gebaut.“',
        'Jesus macht sich auf den Weg und geht mit ihnen durch die Straßen von Kapernaum.'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Wer ist todkrank?', options: ['der Diener des Hauptmanns', 'der Hauptmann selbst', 'ein Priester'], answer: 0 },
        { q: 'Wen schickt der Hauptmann zu Jesus?', options: ['einige Älteste', 'seine Kinder', 'die Jünger'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Sprich nur ein Wort',
      ref: 'Lukas 7,6–10',
      text: [
        'Fast sind sie am Haus des Hauptmanns, da kommen ihnen Freunde des Hauptmanns entgegen. Sie richten aus, was der Hauptmann ihnen aufgetragen hat: „Herr, mach dir keine Mühe. Ich bin es nicht wert, dass du in mein Haus kommst. Sprich nur ein Wort, dann wird mein Diener gesund.“',
        'Der Hauptmann weiß, wie ein Befehl wirkt. Wenn er zu einem Soldaten sagt: „Geh!“, dann geht der. Und wenn er zu seinem Diener sagt: „Tu das!“, dann tut er es.',
        'Jesus hört es und staunt. Er dreht sich zu den Menschen um, die ihm folgen: „So einen Glauben habe ich in Israel nicht gefunden.“',
        'Die Boten gehen zurück zum Haus. Dort finden sie den Diener gesund.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagen die Freunde im Namen des Hauptmanns?', options: ['Sprich nur ein Wort.', 'Komm schnell in mein Haus.', 'Bring ein Bett mit.'], answer: 0 },
        { q: 'Wie reagiert Jesus?', options: ['Er staunt.', 'Er lacht.', 'Er geht traurig weg.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Weine nicht',
      ref: 'Lukas 7,11–17',
      text: [
        'Jesus kommt mit seinen Jüngern und vielen Menschen zur Stadt Nain. Am Stadttor kommt ihnen ein Trauerzug entgegen. Ein junger Mann ist gestorben, der einzige Sohn seiner Mutter. Sie ist Witwe, und viele Leute aus der Stadt gehen mit ihr.',
        'Jesus sieht die Frau, und sie tut ihm von Herzen leid. „Weine nicht!“, sagt er zu ihr. Dann tritt er an die Bahre und berührt sie. Die Träger bleiben stehen.',
        '„Junger Mann“, sagt Jesus, „ich sage dir: Steh auf!“ Da setzt der Tote sich auf und fängt an zu reden. Jesus gibt ihn seiner Mutter zurück.',
        'Alle sind erschüttert und loben Gott. „Ein großer Prophet ist bei uns aufgetreten!“, rufen sie.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt die Stadt?', options: ['Nain', 'Jericho', 'Kapernaum'], answer: 0 },
        { q: 'Was sagt Jesus zu der Witwe?', options: ['Weine nicht!', 'Geh nach Hause!', 'Hab keine Angst vor dem Tor!'], answer: 0 },
        { q: 'Wer ist der junge Mann für die Witwe?', options: ['ihr einziger Sohn', 'ihr Bruder', 'ihr Nachbar'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Zehn Männer rufen',
      ref: 'Lukas 17,11–14',
      text: [
        'Jesus ist unterwegs nach Jerusalem. Er zieht durch Samarien und Galiläa und kommt an ein Dorf. Dort begegnen ihm zehn Männer mit Aussatz. Sie dürfen den anderen nicht nahe kommen, darum bleiben sie weit entfernt stehen.',
        'Gemeinsam heben sie die Stimmen und rufen so laut sie können: „Jesus, lieber Meister, hab Erbarmen mit uns!“',
        'Jesus sieht sie an. „Geht hin“, sagt er, „und zeigt euch den Priestern!“',
        'Noch sind die Männer krank. Aber sie machen sich auf den Weg zu den Priestern, alle zehn zusammen.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Dorfrand mit den zehn Männern zusammen.', puzzle: { image: `${G}puzzle/strasse.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wie viele Männer rufen Jesus?', options: ['zehn', 'zwei', 'zwölf'], answer: 0 },
        { q: 'Wo stehen die Männer?', options: ['weit entfernt am Dorfrand', 'mitten auf dem Marktplatz', 'im Boot'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06-b.webp`,
      title: 'Einer kehrt um',
      ref: 'Lukas 17,14–19',
      text: [
        'Unterwegs bemerken die zehn Männer, dass sie rein geworden sind. Die Krankheit ist verschwunden.',
        'Einer von ihnen bleibt stehen. Er dreht sich um und läuft zu Jesus zurück. Er lobt Gott mit lauter Stimme, wirft sich vor Jesu Füßen auf die Erde und dankt ihm. Dieser Mann ist ein Samariter.',
        'Jesus fragt: „Sind nicht zehn rein geworden? Wo sind die neun? Ist keiner zurückgekommen, um Gott die Ehre zu geben, nur dieser Fremde?“',
        'Und zu dem Mann sagt er: „Steh auf und geh. Dein Glaube hat dir geholfen.“'
      ],
      // Spiel: Wer kehrt um? (umkehr, neu)
      task: { kind: 'umkehr', hint: 'Tippe auf den Mann, der umkehrt und zu Jesus zurückläuft.', turnBack: UMKEHR },
      questions: [
        { q: 'Wie viele Männer kehren um und danken Jesus?', options: ['einer', 'zehn', 'alle neun'], answer: 0 },
        { q: 'Woher kommt dieser Mann?', options: ['aus Samarien', 'aus Jerusalem', 'aus Nain'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Lasst die Kinder zu mir kommen',
      ref: 'Markus 10,13–16',
      text: [
        'Mütter und Väter bringen ihre Kinder zu Jesus, auch die ganz kleinen auf dem Arm. Er soll sie berühren und segnen. Aber die Jünger schimpfen mit ihnen und wollen sie wegschicken.',
        'Jesus sieht es, und es gefällt ihm gar nicht. „Lasst die Kinder zu mir kommen“, sagt er, „und haltet sie nicht auf. Denn zu solchen wie ihnen gehört das Reich Gottes. Wer es nicht annimmt wie ein Kind, wird nicht hineinkommen.“',
        'Dann nimmt er die Kinder in die Arme, legt ihnen die Hände auf und segnet sie.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Suche im Hof: Finde die vier Kinder, die zu Jesus kommen.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Wer wehrt die Leute mit den Kindern ab?', options: ['die Jünger', 'die Priester', 'die Soldaten'], answer: 0 },
        { q: 'Was sagt Jesus?', options: ['Lasst die Kinder zu mir kommen.', 'Schickt sie nach Hause.', 'Kommt später wieder.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Lauter rufen',
      ref: 'Markus 10,46–49',
      text: [
        'Später verlässt Jesus mit den Jüngern und einer großen Menge die Stadt Jericho. Am Weg sitzt ein blinder Mann und bettelt. Er heißt Bartimäus. Er kann nicht sehen, aber er hört, dass viele Menschen vorbeigehen.',
        'Dann hört er, dass Jesus von Nazareth dabei ist. „Jesus, du Sohn Davids!“, ruft er. „Hab Erbarmen mit mir!“',
        'Viele fahren ihn an: „Sei still!“ Aber Bartimäus ruft noch viel lauter: „Du Sohn Davids, hab Erbarmen mit mir!“',
        'Da bleibt Jesus stehen. „Ruft ihn her!“, sagt er. Die Leute rufen dem Blinden zu: „Sei getrost! Steh auf, er ruft dich!“'
      ],
      // Spiel: Lauter rufen (ruf, neu)
      task: { kind: 'ruf', hint: 'Tippe auf den Knopf, damit Bartimäus lauter ruft als die anderen.', shout: RUF },
      questions: [
        { q: 'Wie heißt der Blinde?', options: ['Bartimäus', 'Jairus', 'Simon'], answer: 0 },
        { q: 'Was tut Bartimäus, als die Leute sagen, er soll still sein?', options: ['Er ruft noch viel lauter.', 'Er schweigt.', 'Er geht weg.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Ich will sehen',
      ref: 'Markus 10,50–52',
      text: [
        'Bartimäus wirft seinen Mantel ab, springt auf und kommt zu Jesus. „Was willst du, dass ich dir tun soll?“, fragt Jesus ihn.',
        '„Rabbuni“, sagt der Blinde, das heißt „mein Meister“. „Ich möchte sehen können.“',
        '„Geh hin“, sagt Jesus, „dein Glaube hat dir geholfen.“ Im selben Augenblick kann Bartimäus sehen.',
        'Er geht nicht zurück an seinen Platz am Wegrand. Er folgt Jesus auf dem Weg, an dem er gesessen hat, mitten unter den vielen Menschen, und sieht alles um sich herum.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was tut Bartimäus mit seinem Mantel?', options: ['Er wirft ihn ab.', 'Er verkauft ihn.', 'Er schenkt ihn Jesus.'], answer: 0 },
        { q: 'Was wünscht sich Bartimäus?', options: ['Er will sehen können.', 'Er will Geld haben.', 'Er will nach Hause gehen.'], answer: 0 },
        { q: 'Was tut Bartimäus, nachdem er sehen kann?', options: ['Er folgt Jesus auf dem Weg.', 'Er geht nach Hause.', 'Er bleibt am Wegrand sitzen.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sagt Jesus zu dem Mann mit Aussatz?', options: ['Ich will es tun, sei rein!', 'Geh weg von hier!', 'Komm morgen wieder!'], answer: 0 },
    { q: 'Was lässt der Hauptmann Jesus durch seine Freunde ausrichten?', options: ['Sprich nur ein Wort.', 'Komm schnell zu mir.', 'Bring ein Bett mit.'], answer: 0 },
    { q: 'Was sagt Jesus zur weinenden Witwe von Nain?', options: ['Weine nicht!', 'Geh nach Hause!', 'Sei still!'], answer: 0 },
    { q: 'Wie viele Männer mit Aussatz rufen Jesus?', options: ['zehn', 'zwei', 'zwölf'], answer: 0 },
    { q: 'Wie viele kommen zurück, um Jesus zu danken?', options: ['einer', 'fünf', 'alle zehn'], answer: 0 },
    { q: 'Was ruft Bartimäus laut, obwohl die Leute ihn zum Schweigen bringen wollen?', options: ['Du Sohn Davids, hab Erbarmen mit mir!', 'Hilf mir mit meinem Mantel!', 'Komm, setz dich zu mir!'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of heilung.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of heilung.stages) {
  const file = `audio/abenteuer/heilung/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the street of Capernaum, the gate of Nain, the road to Jericho); they follow one another at random
heilung.music = [
  'audio/abenteuer/heilung/musik-strasse-v1.mp3',
  'audio/abenteuer/heilung/musik-tor-v1.mp3',
  'audio/abenteuer/heilung/musik-weg-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(heilung, heilungEn)
