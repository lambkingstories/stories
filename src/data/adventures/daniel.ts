/**
 * Abenteuer "Daniel" (Daniel 1–3, 5–6) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Die Löwen, das Feuer und die Schrift an der Wand". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, Nacht vom 21. auf den 22.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Daniel/ENTWURF_Daniel.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfung: PRUEFBERICHT-BIBELTREUE-2026-10-22.md,
 * Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md. Kapitel 4 und 7–12 gehören nicht zu diesem Abenteuer.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Zehn Tage (neu), 3 Lückenvers (alt), 4 Das Standbild (neu), 5 Wimmelbild (alt), 6 nur Quiz, 7 Das Licht an der Wand (neu),
 * 8 Dreimal am Tag (neu), 9 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/daniel/, images/abenteuer/spiele/daniel/<spiel>/, audio/abenteuer/daniel/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { DaysGame, FindGame, HoursGame, Journey, LampGame, StatueGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { DANIEL_PATH } from './danielPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { danielEn } from './en/daniel.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt später a/b): `images/abenteuer/daniel/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/daniel/'

const G = 'images/abenteuer/spiele/daniel/'

/**
 * Etappe 2, "Zehn Tage": zehn kurze Runden (Tage); an jedem Tag stehen vier Speisen auf dem Tisch, das Kind tippt die zwei an, die Daniel isst (Gemüse, Wasser), nicht des Königs Essen (neu). Bilder (Bildauftrag D30):
 * `tage/tisch.webp` 900 × 675, acht Speisen auf gleich großen durchsichtigen Flächen (330 × 260, unten mittig, wahrer Größenunterschied). Die Tischplatte liegt bei 52–77 % der Höhe, Daniels Platz links.
 */
const TAGE: DaysGame = {
  background: `${G}tage/tisch.webp`,
  dishes: [
    { id: 'gemuese-schale', kind: 'veg', image: `${G}tage/gemuese-schale.webp` },
    { id: 'gemuese-korb', kind: 'veg', image: `${G}tage/gemuese-korb.webp` },
    { id: 'wasserkrug', kind: 'water', image: `${G}tage/wasserkrug.webp` },
    { id: 'wasserbecher', kind: 'water', image: `${G}tage/wasserbecher.webp` },
    { id: 'braten', kind: 'meat', image: `${G}tage/braten.webp` },
    { id: 'keule', kind: 'meat', image: `${G}tage/keule.webp` },
    { id: 'weinkrug', kind: 'sweet', image: `${G}tage/weinkrug.webp` },
    { id: 'honigkuchen', kind: 'sweet', image: `${G}tage/honigkuchen.webp` }
  ],
  days: 10,
  table: { y: 42, h: 28, w: 20 },
  limits: [7, 5, 4]
}

/**
 * Etappe 3, "Lückenvers" (alte Mechanik): Daniels Lobpreis aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Jona, kopiert. Hintergrund ist das Etappenbild 3, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-03.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Gelobt sei der Name Gottes von ', ' zu Ewigkeit!“'], words: ['Ewigkeit', 'Anfang', 'Morgen'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Denn sein ist beides, ', ' und ', '.“'], words: ['Weisheit', 'Stärke', 'Reichtum', 'Schweigen'], answers: [0, 1] }
  ]
}

/**
 * Etappe 4, "Das Standbild": die fünf Scheiben des Standbildes aus dem Traum (Kopf aus Gold, Brust und Arme aus Silber, Bauch und Hüften aus Erz, Beine aus Eisen, Füße aus Eisen und Ton) werden auf ihre Plätze gezogen, danach rollt der Stein, das Standbild
 * zerfällt und der Stein wird zum Berg (neu). Bilder (Bildauftrag D31, Neufassung v2): `standbild/traum.webp` 900 × 675 (Sockel bei 27–73 Prozent der Breite), `scheibe-1..5.webp` (aus EINEM gemalten Standbild nach Material geschnitten, Gliederpuppe ohne Gesicht,
 * `tools/standbild_scheiben.py` in Abenteuer-Daniel), `stein.webp`, `berg.webp`. Lage und Breite in Prozent des Bildes aus dem Schnitt gemessen: Kopf bei 6, Füße bei 77 Prozent der Höhe; die Arme hängen neben Bauch und Beinen und gehören zur Brust
 * (darum liegt der Platz der Brust nur am Körper, die Scheibe selbst sitzt in der Mitte ihrer Umrisse). Wartend sind die Scheiben größer gezeichnet (`wait`).
 */
const STANDBILD: StatueGame = {
  background: `${G}standbild/traum.webp`,
  pieces: [
    { id: 'kopf', image: `${G}standbild/scheibe-1.webp`, label: 'Gold', w: 5.18, at: { x: 50.11, y: 11.9 }, wait: 2.2 },
    { id: 'brust', image: `${G}standbild/scheibe-2.webp`, label: 'Silber', w: 15.68, at: { x: 50.01, y: 33.4 }, wait: 1.2 },
    { id: 'bauch', image: `${G}standbild/scheibe-3.webp`, label: 'Erz', w: 9.35, at: { x: 50.13, y: 36.05 }, wait: 2.0 },
    { id: 'beine', image: `${G}standbild/scheibe-4.webp`, label: 'Eisen', w: 9.22, at: { x: 50.07, y: 56.71 }, wait: 1.2 },
    { id: 'fuesse', image: `${G}standbild/scheibe-5.webp`, label: 'Eisen und Ton', w: 13.01, at: { x: 50.09, y: 74.17 }, wait: 2.0 }
  ],
  slots: [
    { x: 50.11, y: 11.9, w: 5.18, h: 11.79 },
    { x: 50.11, y: 23.88, w: 9.35, h: 12.18 },
    { x: 50.13, y: 36.05, w: 9.35, h: 12.15 },
    { x: 50.07, y: 56.71, w: 9.22, h: 29.18 },
    { x: 50.09, y: 74.17, w: 13.01, h: 5.74 }
  ],
  stone: `${G}standbild/stein.webp`,
  mountain: `${G}standbild/berg.webp`,
  rounds: [
    {
      hint: 'Setze das Standbild so zusammen, wie der König es im Traum gesehen hat.',
      labels: true,
      homes: [{ x: 85, y: 13 }, { x: 15, y: 28 }, { x: 85, y: 50 }, { x: 15, y: 74 }, { x: 78, y: 83 }]
    },
    {
      hint: 'Noch einmal, jetzt ohne Namen. Wo gehört jede Scheibe hin?',
      labels: false,
      homes: [{ x: 15, y: 13 }, { x: 85, y: 28 }, { x: 15, y: 50 }, { x: 85, y: 74 }, { x: 22, y: 83 }]
    }
  ]
}

/**
 * Etappe 5, "Wimmelbild" (alte Mechanik): das Tal Dura im Hochformat; Sadrach, Mesach und Abed-Nego, die drei Männer, die stehen bleiben, sind zu finden; sie stehen halb hinter einem Zelt, einem Krug und einem Dornbusch,
 * dazu stehen Verdecker (Palme, Knieende, Hornbläser, Harfner, Säule) nur zum Verwirren da. Bilder (Bildauftrag D34 und D35): `wimmel/szene.webp` 1100 × 1467 (3:4), `sadrach/mesach/abednego.webp` (aus einem Bogen, Maßstab erhalten), `verdecker-1..8.webp`.
 * x/y = Mitte der Füße, w = Breite, in Prozent der Szene.
 */
const WIMMEL: FindGame = {
  labels: ['Sadrach', 'Mesach', 'Abed-Nego'],
  doneText: 'Du hast alle drei Männer gefunden, die stehen geblieben sind!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/sadrach.webp`, x: 22, y: 52, w: 10 },
    { image: `${G}wimmel/mesach.webp`, x: 70, y: 68, w: 12 },
    { image: `${G}wimmel/abednego.webp`, x: 40, y: 84, w: 13.5 }
  ],
  // vor den Männern, damit nur ein Teil herausschaut; einige stehen nur zum Verwirren da
  covers: [
    { image: `${G}wimmel/verdecker-5.webp`, x: 24, y: 55, w: 26 },
    { image: `${G}wimmel/verdecker-6.webp`, x: 68, y: 70, w: 22 },
    { image: `${G}wimmel/verdecker-7.webp`, x: 42, y: 85, w: 26 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 9, y: 40, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 58, y: 50, w: 24 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 88, y: 58, w: 18 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 16, y: 78, w: 17 },
    { image: `${G}wimmel/verdecker-8.webp`, x: 88, y: 88, w: 18 }
  ]
}


/**
 * Etappe 7, "Das Licht an der Wand": das Kind zieht eine Öllampe über die dunkle Wand des Festsaals und findet vier goldene Zeichen (zwei und zwei; neu). Bilder (Bildauftrag D32): `lampe/wand.webp` 900 × 675,
 * `lampe.webp` (Sprite 260 × 176), `zeichen-1..4.webp` (Gold auf Schwarz, 320 × 320, die App mischt mit `screen`). Die helle Wand liegt bei 8–92 % der Breite und 3–82 % der Höhe, unten die Tafel.
 */
const LAMPE: LampGame = {
  background: `${G}lampe/wand.webp`,
  lamp: `${G}lampe/lampe.webp`,
  lampW: 18,
  rounds: [
    {
      hint: 'Führe die Lampe über die Wand und finde die leuchtenden Zeichen.',
      radius: 22,
      flicker: false,
      signs: [
        { image: `${G}lampe/zeichen-1.webp`, x: 28, y: 30, w: 17 },
        { image: `${G}lampe/zeichen-2.webp`, x: 70, y: 46, w: 17 }
      ]
    },
    {
      hint: 'Jetzt flackert die Flamme. Führe die Lampe ganz langsam.',
      radius: 15,
      flicker: true,
      signs: [
        { image: `${G}lampe/zeichen-3.webp`, x: 24, y: 58, w: 17 },
        { image: `${G}lampe/zeichen-4.webp`, x: 74, y: 24, w: 17 }
      ]
    }
  ]
}

/**
 * Etappe 8, "Dreimal am Tag": die Sonne zieht über den Himmel vor Daniels Fenster, das Kind tippt Daniel an den drei goldenen Marken (früh, Mittag, spät; neu). Bilder (Bildauftrag D33): `zeiten/himmel.webp` 900 × 675
 * (ohne Sonne), `rahmen.webp` (Innenraum, die Fensteröffnung bei 33–71 % der Breite und 6–65 % der Höhe ist durchsichtig), `daniel-steht.webp`, `daniel-kniet.webp` (Sprites), `sonne.webp` (aus Jona kopiert).
 */
const ZEITEN: HoursGame = {
  window: { x: 33, y: 6, w: 38, h: 59 },
  sky: `${G}zeiten/himmel.webp`,
  frame: `${G}zeiten/rahmen.webp`,
  standing: `${G}zeiten/daniel-steht.webp`,
  kneeling: `${G}zeiten/daniel-kniet.webp`,
  sun: `${G}zeiten/sonne.webp`,
  rounds: [
    { hint: 'Tippe auf Daniel, wenn die Sonne an einer goldenen Marke steht: dreimal am Tag.', dayMs: 12000, days: 1, windowMs: 1100 },
    { hint: 'Jetzt kommen zwei Tage, und die Sonne geht schneller.', dayMs: 9000, days: 2, windowMs: 750 }
  ]
}

export const daniel: Journey = {
  id: 'daniel',
  title: 'Daniel',
  subtitle: 'Die Löwen, das Feuer und die Schrift an der Wand',
  age: '8-10',
  downloadMb: 12, // gemessen 10,3 MB ohne die Vorlesedateien (neun Geschichten, ca. 2 MB); nach den Aufnahmen neu messen
  medal: `${PICS}medaille.webp`, // Der ruhige Löwe und das Licht (Goldring mit Seilmuster)
  // Geschenk-Ausmalbild: Die Geschichte von Daniel in einem Bild (Konturzeichnung)
  gift: { title: 'Daniel und die Löwen', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus danielPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/daniel/karte-pano-v4-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0706, y: 0.6481, d: 0.0339 },
      { x: 0.1191, y: 0.6481, d: 0.0339 },
      { x: 0.2352, y: 0.6481, d: 0.0339 },
      { x: 0.4744, y: 0.6432, d: 0.0339 },
      { x: 0.5551, y: 0.2913, d: 0.0339 },
      { x: 0.651, y: 0.5461, d: 0.0339 },
      { x: 0.7216, y: 0.5825, d: 0.0339 },
      { x: 0.8377, y: 0.3883, d: 0.0339 },
      { x: 0.9336, y: 0.2852, d: 0.0339 }
    ],
    exam: { x: 0.9861, y: 0.2852, d: 0.0339 },
    path: DANIEL_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Daniel am Hof des Königs',
      ref: 'Daniel 1,1–7',
      text: [
        'Der König Nebukadnezar von Babel zieht gegen Jerusalem. Er nimmt einige Gefäße aus dem Haus Gottes mit. In der Schatzkammer seines Gottes stellt er sie auf.',
        'Dann gibt er einen Befehl: Junge Männer aus dem Volk Israel sollen an seinen Hof kommen. Sie sollen gesund und klug sein. Sie sollen die Schrift und die Sprache der Babylonier lernen. Drei Jahre lang werden sie von des Königs Tisch ernährt, danach sollen sie ihm dienen.',
        'Unter ihnen sind Daniel, Hananja, Misael und Asarja aus dem Stamm Juda. Der oberste Kämmerer gibt ihnen neue Namen. Daniel heißt nun Beltsazar, und die anderen drei heißen Sadrach, Mesach und Abed-Nego.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt der König von Babel?', options: ['Nebukadnezar', 'Belsazar', 'Darius'], answer: 0 },
        { q: 'Welchen neuen Namen bekommt Daniel?', options: ['Beltsazar', 'Sadrach', 'Abed-Nego'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Gemüse und Wasser',
      ref: 'Daniel 1,8–21',
      text: [
        'Daniel nimmt sich in seinem Herzen vor: Er will nicht von des Königs Speise essen und nicht von seinem Wein trinken. Er bittet den obersten Kämmerer um Erlaubnis. Gott lässt ihn bei Daniel freundlich sein, aber er hat Angst. „Wenn ihr schlechter aussehen würdet als die anderen jungen Männer, bekomme ich große Schwierigkeiten mit dem König“, sagt er.',
        'Da wendet sich Daniel an den Aufseher. „Versuch es zehn Tage mit uns“, bittet er. „Gib uns Gemüse zu essen und Wasser zu trinken. Dann schau uns an und vergleiche uns mit den anderen.“ Der Aufseher lässt sich darauf ein.',
        'Nach zehn Tagen sehen die vier schöner und kräftiger aus als alle, die von des Königs Speise essen. Darum bekommen sie weiter Gemüse. Gott schenkt ihnen Verstand und Weisheit, und der König findet sie zehnmal klüger als alle Weisen in seinem Reich.'
      ],
      // Spiel: Zehn Tage (tage, neu)
      task: { kind: 'tage', hint: 'Tippe jeden Tag das Gemüse oder das Wasser an, nicht die Speisen des Königs.', days: TAGE },
      questions: [
        { q: 'Was essen und trinken Daniel und seine Freunde?', options: ['Gemüse und Wasser', 'Brot und Wein', 'Fleisch und Milch'], answer: 0 },
        { q: 'Wie lange dauert die Probe?', options: ['zehn Tage', 'drei Tage', 'sieben Tage'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Der Traum des Königs',
      ref: 'Daniel 2,1–23',
      text: [
        'Der König Nebukadnezar hat einen Traum, der ihn so erschreckt, dass er aufwacht. Doch am Morgen weiß er nicht mehr, was er geträumt hat. Er ruft alle Weisen von Babel: „Sagt mir meinen Traum und erklärt ihn mir!“ Die Weisen antworten: „Das kann kein Mensch. Nur die Götter wissen so etwas.“',
        'Da wird der König sehr zornig. Das Urteil gilt allen Weisen von Babel, auch Daniel und seinen Freunden. Daniel bittet den König um etwas Zeit. Dann geht er heim und erzählt es Hananja, Misael und Asarja. Sie bitten Gott gemeinsam, dass er ihnen das Geheimnis zeigt.',
        'In der Nacht zeigt Gott dem Daniel den Traum. Da lobt Daniel Gott: „Gelobt sei der Name Gottes von Ewigkeit zu Ewigkeit! Denn sein ist beides, Weisheit und Stärke.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 1 von 2)
      task: { kind: 'lueckenvers', hint: 'Ziehe die fehlenden Wörter in Daniels Lob.', verse: VERS },
      questions: [
        { q: 'Was hat der König vergessen?', options: ['seinen Traum', 'seinen Namen', 'sein Versprechen'], answer: 0 },
        { q: 'Wer zeigt Daniel den Traum?', options: ['Gott', 'die Weisen von Babel', 'der König'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Das große Standbild',
      ref: 'Daniel 2,24–49',
      text: [
        'Daniel geht zum König. „Kein Weiser kann dir dein Geheimnis sagen“, sagt er. „Aber es gibt einen Gott im Himmel, der Geheimnisse zeigt.“ Dann erzählt er den Traum. Der König hat ein großes, glänzendes Standbild gesehen. Sein Kopf war aus feinem Gold, seine Brust und seine Arme aus Silber, sein Bauch und seine Hüften aus Erz, seine Beine aus Eisen und seine Füße aus Eisen und Ton.',
        'Da löste sich ein Stein, ohne dass eine Hand ihn berührte. Er traf die Füße des Standbildes, und das ganze Bild zerfiel wie Spreu im Wind. Der Stein aber wurde zu einem großen Berg.',
        'Daniel sagt: „Gott wird einmal ein Reich aufrichten, das nie zerstört wird.“ Da sagt der König: „Euer Gott ist ein Gott über alle Götter und ein Herr über alle Könige.“'
      ],
      // Spiel: Das Standbild (standbild, neu)
      task: { kind: 'standbild', hint: 'Ziehe jedes Metall auf seinen Platz am Standbild.', statue: STANDBILD },
      questions: [
        { q: 'Woraus ist der Kopf des Standbildes?', options: ['aus feinem Gold', 'aus Silber', 'aus Ton'], answer: 0 },
        { q: 'Was trifft die Füße des Standbildes?', options: ['ein Stein', 'ein Blitz', 'ein Pfeil'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Das goldene Bild',
      ref: 'Daniel 3,1–18',
      text: [
        'Der König Nebukadnezar lässt ein riesiges Bild aus Gold machen, sechzig Ellen hoch. Er stellt es im Tal Dura auf, und alle hohen Herren des Landes sollen zur Einweihung kommen.',
        'Ein Herold ruft: „Sobald ihr die Musik von Posaunen, Harfen und vielen anderen Instrumenten hört, sollt ihr euch niederwerfen und das goldene Bild anbeten! Wer es nicht tut, wird in einen glühenden Ofen geworfen.“',
        'Die Musik erklingt, und alle fallen nieder. Aber Sadrach, Mesach und Abed-Nego bleiben stehen. Einige Männer verraten sie beim König.',
        'Der König lässt die drei zu sich rufen. „Wollt ihr mein Bild nicht anbeten?“, fragt er. Sie antworten: „Unser Gott kann uns aus dem Feuer retten. Und wenn er es nicht tut, beten wir dein Bild trotzdem nicht an.“'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt 2 von 2)
      task: { kind: 'wimmelbild', hint: 'Finde die drei Männer, die stehen bleiben.', count: 3, find: WIMMEL },
      questions: [
        { q: 'Wie heißt das Tal, in dem das Bild steht?', options: ['Dura', 'Babel', 'Jerusalem'], answer: 0 },
        { q: 'Was sagen die drei Freunde zum König?', options: ['„Wir beten dein Bild nicht an.“', '„Wir beten dein Bild an.“', '„Wir gehen fort.“'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Im Feuerofen',
      ref: 'Daniel 3,19–30',
      text: [
        'Da wird der König voll Zorn. Er befiehlt, den Ofen siebenmal heißer zu machen als sonst. Die stärksten Männer seines Heeres binden Sadrach, Mesach und Abed-Nego und werfen sie in den glühenden Ofen.',
        'Doch plötzlich erschrickt der König und springt auf. „Haben wir nicht drei Männer gebunden ins Feuer geworfen?“, fragt er. „Ja, Herr König“, antworten seine Räte. „Aber ich sehe vier Männer im Feuer umhergehen, frei und unverletzt“, ruft er. „Und der vierte sieht aus wie ein Sohn der Götter!“',
        'Der König tritt an die Öffnung des Ofens: „Sadrach, Mesach, Abed-Nego, ihr Knechte Gottes des Höchsten, kommt heraus!“ Da kommen die drei aus dem Feuer. Ihr Haar ist nicht versengt, ihre Mäntel sind heil, und man riecht keinen Rauch an ihnen. „Gelobt sei der Gott der drei“, sagt der König, „der seinen Engel gesandt und seine Knechte gerettet hat!“'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele Männer sieht der König im Feuer?', options: ['vier', 'drei', 'sieben'], answer: 0 },
        { q: 'Was ist mit den Mänteln der drei Männer?', options: ['Sie sind heil geblieben.', 'Sie sind verbrannt.', 'Sie sind nass.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Die Schrift an der Wand',
      ref: 'Daniel 5',
      text: [
        'Viele Jahre später feiert König Belsazar ein großes Fest für tausend Gäste. Er lässt die goldenen Gefäße holen, die sein Vater aus dem Haus Gottes in Jerusalem mitgenommen hat, und trinkt mit seinen Gästen daraus.',
        'Plötzlich erscheinen Finger wie von einer Menschenhand und schreiben etwas an die Wand des Saals. Der König wird blass, und seine Knie zittern. Keiner seiner Weisen kann die Schrift lesen.',
        'Da kommt die Königin in den Saal. „Es gibt einen Mann, der Geheimnisse deuten kann: Daniel“, sagt sie. Daniel wird gerufen. „Behalte deine Geschenke“, sagt er, „ich lese dir die Schrift trotzdem.“',
        '„Da steht: Mene, mene, tekel, u-parsin“, sagt Daniel. „Das heißt: Gott hat dein Königreich gezählt. Du wurdest gewogen und zu leicht gefunden. Dein Reich wird geteilt und den Medern und Persern gegeben.“'
      ],
      // Spiel: Das Licht an der Wand (lampe, neu)
      task: { kind: 'lampe', hint: 'Führe die Lampe über die Wand und finde die vier leuchtenden Zeichen.', lamp: LAMPE },
      questions: [
        { q: 'Aus welchen Gefäßen trinkt der König?', options: ['aus den goldenen Gefäßen aus Gottes Haus', 'aus Tonkrügen', 'aus Holzbechern'], answer: 0 },
        { q: 'Wer deutet die Schrift an der Wand?', options: ['Daniel', 'die Weisen', 'die Königin'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Daniel betet',
      ref: 'Daniel 6,1–13',
      text: [
        'Jetzt ist Darius König. Er will Daniel über das ganze Reich setzen, weil Daniel treu ist und einen hohen Geist hat. Das ärgert die anderen hohen Herren. Sie suchen etwas, das sie gegen Daniel sagen können, aber sie finden nichts.',
        'Da sagen sie zum König: „Wer in den nächsten dreißig Tagen zu einem Gott oder einem Menschen betet, nur nicht zu dir, soll zu den Löwen in die Grube geworfen werden.“ Darius unterschreibt das Gebot.',
        'Daniel hört davon. Er geht nach Hause, in sein Zimmer mit den offenen Fenstern nach Jerusalem. Dreimal am Tag kniet er nieder, betet und dankt seinem Gott, so wie er es immer getan hat.',
        'Die Männer beobachten ihn und finden ihn betend. Sofort gehen sie zum König und verklagen Daniel.'
      ],
      // Spiel: Dreimal am Tag (zeiten, neu)
      task: { kind: 'zeiten', hint: 'Tippe auf Daniel, wenn die Sonne an einer Gebetszeit steht.', hours: ZEITEN },
      questions: [
        { q: 'Wohin gehen die offenen Fenster in Daniels Zimmer?', options: ['nach Jerusalem', 'nach Babel', 'zum Fluss'], answer: 0 },
        { q: 'Wie oft am Tag betet Daniel?', options: ['dreimal', 'einmal', 'siebenmal'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'In der Löwengrube',
      ref: 'Daniel 6,14–28',
      text: [
        'Der König wird traurig, als er das hört. Bis zum Abend müht er sich, Daniel zu retten. Aber das Gesetz darf nicht geändert werden. Da lässt er Daniel zu den Löwen in die Grube bringen. „Dein Gott, dem du immer dienst, helfe dir!“, sagt er.',
        'Ein Stein wird vor die Grube gelegt, und der König versiegelt ihn mit seinem Ring. In der Nacht kann er nicht essen und nicht schlafen.',
        'Früh am Morgen eilt er zur Grube und ruft: „Daniel, hat dein Gott dich retten können?“ Daniel antwortet: „Mein Gott hat seinen Engel gesandt, der den Löwen den Rachen zugehalten hat. Sie haben mir nichts getan.“',
        'Der König ist froh. Man zieht Daniel aus der Grube und findet keine Wunde an ihm, denn er hat seinem Gott vertraut. Da schreibt der König allen Völkern: „Ehrt den Gott Daniels, denn er ist der lebendige Gott!“'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Womit versiegelt der König den Stein?', options: ['mit seinem Ring', 'mit Wachs', 'mit Lehm'], answer: 0 },
        { q: 'Wer hält den Löwen den Rachen zu?', options: ['ein Engel Gottes', 'Daniel', 'der König'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißt der König von Babel am Anfang?', options: ['Nebukadnezar', 'Belsazar', 'Darius'], answer: 0 },
    { q: 'Was essen Daniel und seine Freunde zehn Tage lang?', options: ['Gemüse und Wasser', 'Brot und Wein', 'Fleisch und Milch'], answer: 0 },
    { q: 'Woraus ist der Kopf des Standbildes im Traum des Königs?', options: ['aus feinem Gold', 'aus Silber', 'aus Ton'], answer: 0 },
    { q: 'Was sagen Sadrach, Mesach und Abed-Nego zum König?', options: ['„Wir beten dein Bild nicht an.“', '„Wir beten dein Bild an.“', '„Wir gehen fort.“'], answer: 0 },
    { q: 'Wie viele Männer sieht der König im Feuer?', options: ['vier', 'drei', 'sieben'], answer: 0 },
    { q: 'Wer hält den Löwen den Rachen zu?', options: ['ein Engel Gottes', 'Daniel', 'der König'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of daniel.stages) {
  if (st.task.verse) st.task.verse.background = st.image ?? st.task.verse.background
}

// the German recordings of the stories (voice Achernar, Gemini, files "geschichte-NN-v1.mp3"); the English ones are linked in `en/daniel.en.ts` ("-en-v1")
// Stages 1, 5 and 8 changed in the Bible check of 24.10.2026 (see D:/Claude/Abenteuer-Daniel/NEUAUFNAHME-BIBELTREUE-2026-10-24.md) and were recorded again as "-v2".
const RECORDED_AGAIN = [1, 5, 8]
for (const s of daniel.stages) {
  const file = `audio/abenteuer/daniel/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.includes(s.id) ? 'v2' : 'v1'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (Babylon, trust, peace); they follow one another at random
daniel.music = [
  'audio/abenteuer/daniel/musik-babylon-v1.mp3',
  'audio/abenteuer/daniel/musik-vertrauen-v1.mp3',
  'audio/abenteuer/daniel/musik-ruhe-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(daniel, danielEn)
