/**
 * Abenteuer "Nehemia" (Nehemia 1–8) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Die Mauer von Jerusalem". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 30.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Nehemia/ENTWURF_Nehemia.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md.
 * Gemildert erzählt: die Mordpläne der Feinde ("die Arbeit stoppen", nie gezeigt), die Rachegebete (4,4–5; 6,14), das Namensverzeichnis (Neh 7). Waffen werden nur getragen, nie gebraucht.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Puzzle (alt), 2 Memory (alt), 3 Der nächtliche Ritt (neu), 4 Wimmelbild (alt), 5 nur Quiz, 6 Die Posaune ruft (neu), 7 Reihenfolge (alt), 8 nur Quiz, 9 Lückenvers (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/nehemia/, images/abenteuer/spiele/nehemia/<spiel>/, audio/abenteuer/nehemia/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { FindGame, Journey, MemoryGame, OrderGame, PostGame, RideGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { NEHEMIA_PATH } from './nehemiaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { nehemiaEn } from './en/nehemia.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/nehemia/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/nehemia/'

const G = 'images/abenteuer/spiele/nehemia/'

/**
 * Etappe 9, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Salomo (kopiert). Hintergrund ist der gemalte Platz vor dem Wassertor (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Dieser Tag ist ', ' dem Herrn, eurem Gott. Seid nicht traurig!“'], words: ['heilig', 'schwer', 'kurz'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Die ', ' am Herrn ist eure ', '.“'], words: ['Freude', 'Stärke', 'Sorge', 'Mauer'], answers: [0, 1] }
  ]
}

/**
 * Etappe 7, "Die Schulden werden erlassen" (alte Mechanik, Reihenfolge legen): die Familien klagen, Nehemia spricht zu den Obersten, die Reichen geben alles zurück, das Volk ruft Amen und lobt Gott.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S36): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'geschrei', image: `${G}reihenfolge/karte-1.webp`, label: 'Die Familien klagen über ihre Not' },
    { id: 'rede', image: `${G}reihenfolge/karte-2.webp`, label: 'Nehemia spricht zu den Obersten' },
    { id: 'zurueck', image: `${G}reihenfolge/karte-3.webp`, label: 'Die Obersten geben alles zurück' },
    { id: 'amen', image: `${G}reihenfolge/karte-4.webp`, label: 'Das Volk ruft Amen und lobt Gott' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['rede', 'zurueck', 'amen'] },
    { hint: 'Runde 2: Jetzt mit dem Klagen der Familien und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['geschrei', 'rede', 'zurueck', 'amen'] }
  ]
}

/**
 * Etappe 2, "Memory" (alte Mechanik): die sechs Dinge des Mundschenks (Becher, Weinkrug, Brief, Holzbalken, Pferd, Tor); die Rückseite zeigt einen goldenen Becher (Bildauftrag S32, ein Bogen mit den sechs Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-becher.webp`, text: 'Der Becher: Nehemia reicht dem König den Becher.' },
    { image: `${G}memory/karte-weinkrug.webp`, text: 'Der Weinkrug: Wein steht vor dem König.' },
    { image: `${G}memory/karte-brief.webp`, text: 'Der Brief: Der König gibt Nehemia Briefe für die Statthalter.' },
    { image: `${G}memory/karte-holz.webp`, text: 'Das Holz: Asaf soll Nehemia Holz für die Tore geben.' },
    { image: `${G}memory/karte-pferd.webp`, text: 'Das Pferd: Der König schickt Reiter mit.' },
    { image: `${G}memory/karte-tor.webp`, text: 'Das Tor: Nehemia will die Stadt mit ihren Toren wieder aufbauen.' }
  ]
}

/**
 * Etappe 3, "Der nächtliche Ritt" (neu): Jerusalem bei Nacht (gemaltes Bild) mit fünf verschiedenen Orten an der zerbrochenen Mauer; Nehemia auf dem Esel (Bild) wartet am Anfang. Das Kind tippt die Orte in der Reihenfolge des Textes an:
 * Taltor, Schlangenquelle, Misttor, Quelltor, Königsteich. Der richtige Ort lässt den Reiter dorthin reiten; ein falscher Ort ist ein Fehler (Kreuz); ein Ort, an dem er schon war, ist kein Fehler. Runde 1 mit der Liste der Orte
 * über dem Bild, Runde 2 ohne Liste (aus dem Kopf). Am Ende reitet er zum Taltor zurück.
 * Bilder (Bildauftrag S33): `ritt/karte.webp` 1200 × 900, `esel.webp` (Nehemia auf dem Esel, ein Bogen mit Magenta-Schnitt).
 */
const RITT: RideGame = {
  background: `${G}ritt/karte.webp`,
  rider: `${G}ritt/esel.webp`,
  riderW: 14,
  start: { x: 8, y: 90 },
  spots: [
    { id: 'taltor', label: 'Taltor', x: 13, y: 61, w: 12 },
    { id: 'quelle', label: 'Schlangenquelle', x: 49, y: 79, w: 12 },
    { id: 'mist', label: 'Misttor', x: 81, y: 72, w: 12 },
    { id: 'quelltor', label: 'Quelltor', x: 86, y: 42, w: 12 },
    { id: 'teich', label: 'Königsteich', x: 80, y: 21, w: 12 }
  ],
  rounds: [
    { hint: 'Reite zu den Orten, in der Reihenfolge des Textes. Die Liste oben hilft dir.', order: ['taltor', 'quelle', 'mist', 'quelltor', 'teich'], showList: true },
    { hint: 'Noch einmal, jetzt ohne Liste: Wohin reitet Nehemia zuerst, wohin danach?', order: ['taltor', 'quelle', 'mist', 'quelltor', 'teich'], showList: false }
  ]
}

/**
 * Etappe 6, "Die Posaune ruft" (neu): die lange Mauer von Jerusalem (gemaltes Bild) mit Bauleuten, die weit auseinander stehen; Nehemia und der Posaunist (Bild) stehen an einer Stelle, goldene Schallbögen zeigen den Ton.
 * "Wo ihr die Posaune hört, dahin sammelt euch bei uns." Das Kind tippt jeden Bauarbeiter an, er läuft zur Posaune und stellt sich in den Fächer um den Posaunisten. Runde 1 in der Mitte (4 Bauleute), Runde 2 am linken Ende (5),
 * Runde 3 am rechten Ende (6). Es gibt keinen Fehler; das Spiel ist fertig, wenn alle versammelt sind.
 * Bilder (Bildauftrag S34): `posaune/mauer.webp` 1200 × 900, `bauarbeiter-1..6.webp` (ein Bogen mit Magenta-Schnitt), `posaune.webp`, `welle.webp`.
 */
const POSAUNE: PostGame = {
  background: `${G}posaune/mauer.webp`,
  workers: [1, 2, 3, 4, 5, 6].map((n) => `${G}posaune/bauarbeiter-${n}.webp`),
  workerW: 11,
  horn: `${G}posaune/posaune.webp`,
  hornW: 16,
  wave: `${G}posaune/welle.webp`,
  rounds: [
    {
      hint: 'Die Posaune ruft! Tippe die Bauleute an: Sie laufen zu Nehemia und zum Posaunisten.',
      horn: { x: 50, y: 76 },
      workers: [{ x: 12, y: 80 }, { x: 28, y: 74 }, { x: 72, y: 76 }, { x: 88, y: 84 }]
    },
    {
      hint: 'Jetzt steht die Posaune am linken Ende der Mauer. Rufe alle zu ihr.',
      horn: { x: 14, y: 78 },
      workers: [{ x: 34, y: 76 }, { x: 50, y: 84 }, { x: 64, y: 74 }, { x: 78, y: 82 }, { x: 90, y: 76 }]
    },
    {
      hint: 'Zuletzt am rechten Ende. Rufe alle zur Posaune.',
      horn: { x: 86, y: 78 },
      workers: [{ x: 8, y: 80 }, { x: 22, y: 74 }, { x: 36, y: 84 }, { x: 50, y: 76 }, { x: 62, y: 82 }, { x: 74, y: 74 }]
    }
  ]
}

/**
 * Etappe 4, "Wimmelbild" (alte Mechanik): eine belebte Mauerbaustelle im Hochformat (Bildauftrag S35); gesucht werden fünf Bauleute: der Priester, der Goldschmied, der Salbenmischer und zwei von Schallums Töchtern; einige stehen hinter Gerüst, Steinen und Körben.
 * Bilder: `wimmel/szene.webp`, `bauleute-1..5.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Priester', 'Goldschmied', 'Salbenmischer', 'Tochter Schallums', 'Tochter Schallums'],
  doneText: 'Du hast alle fünf Bauleute gefunden: den Priester, den Goldschmied, den Salbenmischer und zwei von Schallums Töchtern!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/bauleute-1.webp`, x: 10, y: 46, w: 15 },
    { image: `${G}wimmel/bauleute-2.webp`, x: 38, y: 32, w: 15 },
    { image: `${G}wimmel/bauleute-3.webp`, x: 62, y: 42, w: 16 },
    { image: `${G}wimmel/bauleute-4.webp`, x: 20, y: 95, w: 22 },
    { image: `${G}wimmel/bauleute-5.webp`, x: 90, y: 72, w: 19 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 38, y: 34, w: 18 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 20, y: 97, w: 22 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 90, y: 74, w: 20 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 62, y: 44, w: 19 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 10, y: 48, w: 17 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 52, y: 92, w: 16 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 30, y: 72, w: 14 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 80, y: 54, w: 16 }
  ]
}

export const nehemia: Journey = {
  id: 'nehemia',
  title: 'Nehemia',
  subtitle: 'Die Mauer von Jerusalem',
  age: '8-10',
  downloadMb: 15, // gemessen 14,3 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: die Mauer von Jerusalem mit Nehemia und dem Posaunisten (Konturzeichnung)
  gift: { title: 'Die Mauer von Jerusalem', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus nehemiaPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/nehemia/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0715, y: 0.6584, d: 0.0339 },
      { x: 0.1833, y: 0.5370, d: 0.0339 },
      { x: 0.2786, y: 0.6086, d: 0.0339 },
      { x: 0.4976, y: 0.7160, d: 0.0339 },
      { x: 0.5571, y: 0.6729, d: 0.0339 },
      { x: 0.6225, y: 0.6729, d: 0.0339 },
      { x: 0.6760, y: 0.6299, d: 0.0339 },
      { x: 0.7618, y: 0.7445, d: 0.0339 },
      { x: 0.8332, y: 0.6729, d: 0.0339 }
    ],
    exam: { x: 0.9737, y: 0.4078, d: 0.0339 },
    path: NEHEMIA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Die Nachricht aus Jerusalem',
      ref: 'Nehemia 1',
      text: [
        'Nehemia lebt in der Burg von Susa. Er ist der Mundschenk des Königs Artaxerxes und bringt ihm den Wein. Eines Tages kommt sein Bruder Hanani mit Männern aus Juda zu Besuch. „Wie geht es den Juden in Jerusalem?“, fragt Nehemia.',
        '„Nicht gut“, sagen die Männer. „Sie leben in großer Not. Die Mauern von Jerusalem sind zerbrochen, und die Tore sind verbrannt.“',
        'Da setzt sich Nehemia hin und weint. Etliche Tage lang trauert er und isst nichts. Er betet zu Gott: „Ach Herr, Gott des Himmels, lass deine Ohren aufmerken auf das Gebet deines Knechtes. Dein Volk gehört dir, du hast es erlöst.“ Dann bittet er, dass der König ihm gnädig ist.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild von der zerbrochenen Mauer zusammen.', puzzle: { image: `${G}puzzle/mauer.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was ist Nehemia am Hof des Königs Artaxerxes?', options: ['der Mundschenk', 'der Koch', 'der Wächter'], answer: 0 },
        { q: 'Wer kommt mit Männern aus Juda zu Besuch?', options: ['sein Bruder Hanani', 'der König', 'Esra'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Der traurige Mundschenk',
      ref: 'Nehemia 2,1–8',
      text: [
        'Einige Monate später steht wieder Wein vor dem König. Nehemia nimmt den Becher und reicht ihn Artaxerxes. Der König sieht sein Gesicht. „Warum siehst du so traurig aus?“, fragt er. „Du bist doch nicht krank.“',
        'Nehemia erschrickt sehr. „Der König lebe ewig“, sagt er. „Wie sollte ich nicht traurig sein? Die Stadt, in der meine Väter begraben sind, liegt in Trümmern, und ihre Tore sind verbrannt.“ „Was wünschst du dir?“, fragt der König.',
        'Da betet Nehemia zu Gott. Dann bittet er: „Schick mich nach Juda, damit ich die Stadt wieder aufbaue.“ Die Königin sitzt neben dem König. „Wie lange dauert deine Reise?“, fragt der König. Er lässt Nehemia ziehen und gibt ihm Briefe für die Statthalter und für Asaf, den Waldhüter, der Holz für die Tore geben soll. Reiter ziehen mit.'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Was reicht Nehemia dem König?', options: ['einen Becher Wein', 'ein Brot', 'einen Brief'], answer: 0 },
        { q: 'Worum bittet Nehemia den König?', options: ['nach Juda gesandt zu werden, um die Stadt wieder aufzubauen', 'um viel Gold', 'um ein Haus in Susa'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Bei Nacht um die Stadt',
      ref: 'Nehemia 2,9–20',
      text: [
        'Nehemia reist nach Jerusalem und wartet drei Tage. Dann steht er bei Nacht auf, mit nur wenigen Männern. Niemandem hat er gesagt, was Gott ihm ins Herz gegeben hat. Er reitet auf seinem Tier zum Taltor hinaus, zur Schlangenquelle und zum Misttor. Dann geht es zum Quelltor und zum Königsteich.',
        'Dort ist kein Platz für sein Tier. Nehemia zieht im Dunkeln den Bach hinauf. Er sieht die zerbrochenen Mauern, und es tut ihm weh. Dann kehrt er durchs Taltor zurück.',
        'Danach ruft er die Priester und die Obersten zusammen. „Ihr seht, in welcher Not wir sind“, sagt er. „Kommt, lasst uns die Mauer bauen!“ Sie rufen: „Auf, wir wollen bauen!“'
      ],
      // Spiel: Der nächtliche Ritt (ritt, neu)
      task: { kind: 'ritt', hint: 'Reite bei Nacht um die Stadt, wie Nehemia es getan hat.', ride: RITT },
      questions: [
        { q: 'Wie lange wartet Nehemia nach der Ankunft, bevor er nachts losreitet?', options: ['drei Tage', 'einen Tag', 'zwei Wochen'], answer: 0 },
        { q: 'Warum kommt Nehemias Tier nicht weiter?', options: ['Es ist kein Platz.', 'Es ist müde.', 'Es hat Durst.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Jeder baut sein Stück',
      ref: 'Nehemia 3',
      text: [
        'Jetzt packen viele an. Der Hohepriester Eljaschib und die Priester bauen das Schaftor und setzen die Türen ein. Daneben bauen die Männer aus Jericho. Die Söhne Senaas bauen das Fischtor mit Türen, Schlössern und Riegeln.',
        'Ein Goldschmied namens Usiël baut ein Stück der Mauer, und neben ihm Hananja, einer der Salbenmischer. Ein Stadtoberster, Schallum, kommt mit seinen Töchtern und baut mit. Viele bauen genau das Stück, das vor ihrem eigenen Haus liegt.',
        'So wächst die Mauer rund um die Stadt, Stück für Stück. Auch Goldschmiede und Händler bauen mit. An jedem Tor arbeiten andere Leute.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde die Bauleute: den Priester, den Goldschmied, den Salbenmischer und zwei von Schallums Töchtern.', count: 5, find: WIMMEL },
      questions: [
        { q: 'Wer baut das Schaftor?', options: ['die Priester', 'die Männer aus Jericho', 'die Söhne Senaas'], answer: 0 },
        { q: 'Welchen Beruf hat Usiël?', options: ['Goldschmied', 'Zimmermann', 'Hirte'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Spott und Wache',
      ref: 'Nehemia 4,1–14',
      text: [
        'Als Sanballat hört, dass die Juden bauen, wird er zornig und spottet. „Was machen diese schwachen Leute?“, ruft er. „Glauben sie, sie können Steine aus dem Schutt wieder lebendig machen?“ Tobija sagt: „Wenn ein Fuchs auf ihre Mauer springt, bricht sie ein.“',
        'Nehemia hört es und betet. Das Volk baut weiter, und bald ist die Mauer schon halb hoch. Die Leute arbeiten mit Lust.',
        'Da werden Sanballat, Tobija und ihre Verbündeten sehr zornig. Sie wollen die Bauleute überraschen und die Arbeit stoppen. Nehemia stellt Tag und Nacht Wachen auf. Hinter der Mauer stehen Familien mit Speeren und Bogen. „Fürchtet euch nicht vor ihnen!“, ruft er. „Denkt an den großen Herrn.“'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer spottet über die Bauleute?', options: ['Sanballat und Tobija', 'Esra und Hanani', 'der König'], answer: 0 },
        { q: 'Wie hoch ist die Mauer, als die Feinde zornig werden?', options: ['halb hoch', 'schon fertig', 'erst einen Stein hoch'], answer: 0 },
        { q: 'Was ruft Nehemia den Leuten zu?', options: ['„Fürchtet euch nicht vor ihnen!“', '„Rennt davon!“', '„Hört auf mit dem Bauen!“'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Die Posaune ruft',
      ref: 'Nehemia 4,15–23',
      text: [
        'Als die Feinde merken, dass ihr Plan bekannt ist, wird nichts daraus. Alle kehren zur Mauer zurück und arbeiten weiter. Von nun an baut nur die Hälfte der jungen Männer, die andere Hälfte hält Wache mit Speeren, Schilden und Bogen. Wer Steine trägt, hat in einer Hand die Last und in der anderen die Waffe.',
        'Die Mauer ist lang, und die Leute stehen weit voneinander entfernt. Darum steht ein Mann mit einer Posaune neben Nehemia. „Wo ihr die Posaune hört, dahin sammelt euch bei uns“, sagt Nehemia. „Unser Gott wird für uns streiten.“',
        'So arbeiten sie vom frühen Morgen, bis die Sterne kommen. Nachts bleiben alle in Jerusalem, bereit zur Wache.'
      ],
      // Spiel: Die Posaune ruft (posaune, neu)
      task: { kind: 'posaune', hint: 'Tippe die Bauleute an: Sie laufen zur Posaune.', post: POSAUNE },
      questions: [
        { q: 'Wer hält Wache, wer baut?', options: ['Die eine Hälfte baut, die andere hält Wache.', 'Alle bauen, keiner hält Wache.', 'Nur die Priester bauen.'], answer: 0 },
        { q: 'Wozu steht ein Mann mit einer Posaune neben Nehemia?', options: ['Wer sie hört, soll sich dort sammeln.', 'Sie ruft zum Essen.', 'Sie ruft zum Schlafen.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Die Schulden werden erlassen',
      ref: 'Nehemia 5',
      text: [
        'Eines Tages erhebt sich ein großes Geschrei im Volk. Viele Familien haben nichts mehr zu essen. Sie mussten ihre Äcker, Weinberge und Häuser verpfänden, um Getreide zu kaufen. Die Obersten haben ihnen Geld geliehen und verlangen noch Zinsen dazu.',
        'Nehemia wird sehr zornig. „Das ist nicht gut, was ihr tut!“, sagt er zu den Obersten. „Wir sind doch Brüder.“ Er ruft das ganze Volk zusammen, und die Obersten schweigen.',
        '„Auch ich habe Geld verliehen“, sagt Nehemia. „Lasst uns diese Schuld erlassen. Gebt ihnen heute ihre Äcker, Weinberge, Ölgärten und Häuser zurück.“ „Wir geben alles zurück“, sagen die Obersten. Vor den Priestern versprechen sie es. Das ganze Volk ruft „Amen!“ und lobt Gott.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was müssen die Familien verpfänden, um Getreide zu kaufen?', options: ['Äcker, Weinberge und Häuser', 'Schafe und Esel', 'Töpfe und Teppiche'], answer: 0 },
        { q: 'Wie reagiert Nehemia auf die Not der Familien?', options: ['Er wird zornig und ruft das Volk zusammen.', 'Er schaut weg.', 'Er reist ab.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Die Mauer ist fertig',
      ref: 'Nehemia 6',
      text: [
        'Sanballat, Tobija und Geschem hören, dass die Mauer fertig ist und keine Lücke mehr hat. Nur die Türen hängen noch nicht in den Toren. Da schicken Sanballat und Geschem Boten zu Nehemia. „Komm, wir treffen uns in der Ebene von Ono“, lassen sie sagen. Sie wollen ihm Böses tun.',
        'Nehemia antwortet: „Ich habe ein großes Werk zu tun. Ich kann nicht hinunterkommen.“ Viermal fragen sie, viermal antwortet er so. Dann kommt ein falscher Brief, und ein Mann will ihn in den Tempel locken, um ihm Angst zu machen. „Sollte ein Mann wie ich fliehen?“, sagt Nehemia. „Ich gehe nicht hinein.“',
        'Nach nur zweiundfünfzig Tagen ist die Mauer fertig. Als die Feinde das hören, verlässt sie der Mut. Sie merken: Das Werk ist von Gott.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin laden die Boten Nehemia ein?', options: ['in die Ebene von Ono', 'nach Susa', 'zum Königsteich'], answer: 0 },
        { q: 'Was antwortet Nehemia viermal?', options: ['„Ich habe ein großes Werk zu tun.“', '„Ich komme morgen.“', '„Ich habe keine Zeit zum Essen.“'], answer: 0 },
        { q: 'Wie viele Tage dauert der Bau der Mauer?', options: ['zweiundfünfzig Tage', 'sieben Tage', 'hundert Tage'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die Freude am Herrn',
      ref: 'Nehemia 8',
      text: [
        'Als der siebte Monat kommt, versammelt sich das ganze Volk auf dem Platz vor dem Wassertor. Esra, der Schriftgelehrte, steht auf einem hohen Holzgestell und liest aus dem Buch des Gesetzes, vom frühen Morgen bis zum Mittag. Alle hören aufmerksam zu. Die Leviten erklären es, sodass jeder es versteht.',
        'Als das Volk die Worte hört, weinen viele. Aber Nehemia und Esra sagen: „Dieser Tag ist heilig. Seid nicht traurig! Geht hin, esst und trinkt, und schickt denen etwas davon, die nichts haben. Denn die Freude am Herrn ist eure Stärke.“',
        'Da gehen alle fröhlich heim. Am nächsten Tag lesen sie im Gesetz, dass sie Laubhütten bauen sollen. Sie holen Zweige und bauen sich Hütten, auf den Dächern und in den Höfen. Es ist ein großes Freudenfest.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wer liest dem Volk aus dem Buch des Gesetzes vor?', options: ['Esra', 'Hanani', 'Tobija'], answer: 0 },
        { q: 'Was sollen die Leute denen schicken, die nichts haben?', options: ['etwas vom Essen und Trinken', 'ihre Häuser', 'ihre Kleider'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wer bringt dem König Artaxerxes den Wein?', options: ['Nehemia', 'Esra', 'Hanani'], answer: 0 },
    { q: 'Was bringt Hanani für Nachrichten aus Jerusalem?', options: ['Die Mauern sind zerbrochen.', 'Die Stadt ist reich.', 'Der König ist tot.'], answer: 0 },
    { q: 'Wie lange wartet Nehemia in Jerusalem, bevor er nachts losreitet?', options: ['drei Tage', 'eine Woche', 'einen Monat'], answer: 0 },
    { q: 'Wer baut mit seinen Töchtern an der Mauer?', options: ['Schallum', 'Usiël', 'Tobija'], answer: 0 },
    { q: 'Was soll das Volk tun, wenn es die Posaune hört?', options: ['sich dort sammeln', 'nach Hause gehen', 'schlafen'], answer: 0 },
    { q: 'Was ist die Stärke des Volkes, sagt Nehemia?', options: ['die Freude am Herrn', 'die hohe Mauer', 'das viele Gold'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of nehemia.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of nehemia.stages) {
  const file = `audio/abenteuer/nehemia/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the cupbearer, the wall grows, the feast of joy); they follow one another at random
nehemia.music = [
  'audio/abenteuer/nehemia/musik-mundschenk-v2.mp3',
  'audio/abenteuer/nehemia/musik-mauer-v2.mp3',
  'audio/abenteuer/nehemia/musik-freude-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(nehemia, nehemiaEn)
