/**
 * Abenteuer "Jesus ruft seine Freunde" (Lukas 5; Markus 2-3) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Vom Boot am See bis auf den Berg". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 1.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Freunde/ENTWURF_Freunde.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-11-01.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Puzzle (alt), 2 Lückenvers (alt), 3 Beide Boote füllen (neu), 4 Reihenfolge (alt), 5 Das Dach öffnen (neu), 6 nur Quiz, 7 Memory (alt), 8 Wimmelbild (alt), 9 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/freunde/, images/abenteuer/spiele/freunde/<spiel>/, audio/abenteuer/freunde/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BoatsGame, FindGame, Journey, MemoryGame, OrderGame, RoofGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { FREUNDE_PATH } from './freundePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { freundeEn } from './en/freunde.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/freunde/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/freunde/'

const G = 'images/abenteuer/spiele/freunde/'

/**
 * Etappe 2, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 22 (kopiert). Hintergrund ist der gemalte Strand am See (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Auf dein ', ' will ich das Netz auswerfen.“'], words: ['Wort', 'Zeichen', 'Gebot'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Fahre hinaus auf die ', '. Werft eure ', ', damit ihr einen Fang tut.“'], words: ['Tiefe', 'Netze', 'Ufer', 'Anker'], answers: [0, 1] }
  ]
}

/**
 * Etappe 4, "Der Fischzug" (alte Mechanik, Reihenfolge legen): Jesus lehrt vom Boot, Simon wirft das Netz aus, beide Boote sind voll, sie lassen alles zurück und folgen Jesus.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S34): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'lehrt', image: `${G}reihenfolge/karte-1.webp`, label: 'Jesus lehrt vom Boot aus' },
    { id: 'wirft', image: `${G}reihenfolge/karte-2.webp`, label: 'Simon wirft das Netz aus' },
    { id: 'voll', image: `${G}reihenfolge/karte-3.webp`, label: 'Beide Boote sind voll Fische' },
    { id: 'folgt', image: `${G}reihenfolge/karte-4.webp`, label: 'Sie lassen alles zurück und folgen Jesus' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['wirft', 'voll', 'folgt'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang am Ufer und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['lehrt', 'wirft', 'voll', 'folgt'] }
  ]
}

/**
 * Etappe 7, "Memory" (alte Mechanik): sechs Dinge vom Fest bei Levi (Brot, Krug, Schale, Salbentopf, Schriftrolle, Münzbeutel); die Rückseite zeigt einen goldenen Fisch (Bildauftrag S32, ein Bogen mit den sechs Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-brot.webp`, text: 'Das Brot: Jesus isst mit den Zöllnern und Sündern.' },
    { image: `${G}memory/karte-krug.webp`, text: 'Der Krug: Levi gibt in seinem Haus ein großes Mahl.' },
    { image: `${G}memory/karte-schale.webp`, text: 'Die Schale: Viele Zöllner und Sünder essen mit Jesus.' },
    { image: `${G}memory/karte-salbe.webp`, text: 'Der Salbentopf: Nicht die Gesunden brauchen einen Arzt, sondern die Kranken.' },
    { image: `${G}memory/karte-schriftrolle.webp`, text: 'Die Schriftrolle: Die Schriftgelehrten fragen: Warum isst er mit den Sündern?' },
    { image: `${G}memory/karte-beutel.webp`, text: 'Der Münzbeutel: Levi ist ein Zöllner und nimmt den Zoll ein.' }
  ]
}

/**
 * Etappe 3, "Beide Boote füllen" (neu): Simon fängt so viele Fische, dass sein Netz zu reißen beginnt, die Gefährten kommen im zweiten Boot, und sie füllen beide Boote so voll, dass sie fast untergehen (Lk 5,6-7).
 * Über dem See hängt das Netz voller Fische, zwei Boote liegen auf dem Wasser; jedes hat so viele leere Plätze (gestrichelte Ringe) für Fische, wie es fasst. Ein Tipp auf ein Boot schickt einen Fisch hinein, das Boot sinkt etwas tiefer;
 * ein Tipp auf ein volles Boot ist ein Fehler. Zwei Runden (3 und 5, dann 4 und 6 Fische). Bilder (Bildauftrag S35): `boote/see.webp` 1200 × 900, `boot-klein`, `boot-gross` (Bogen mit Magenta-Schnitt), `haufen.webp`, die vier Fische aus Nr. 22 (kopiert).
 */
const BOOTE: BoatsGame = {
  background: `${G}boote/see.webp`,
  boats: [
    { id: 'klein', image: `${G}boote/boot-klein.webp`, label: 'Kleines Boot', w: 44, ratio: 1.67, x: 26, y: 92, deck: { x: 22, y: 38, w: 60, h: 34 } },
    { id: 'gross', image: `${G}boote/boot-gross.webp`, label: 'Großes Boot', w: 44, ratio: 1.67, x: 72, y: 92, deck: { x: 12, y: 40, w: 76, h: 32 } }
  ],
  fish: [
    { id: 'blau', image: `${G}boote/fisch-blau.webp`, w: 8.5 },
    { id: 'gold', image: `${G}boote/fisch-gold.webp`, w: 8.5 },
    { id: 'gruen', image: `${G}boote/fisch-gruen.webp`, w: 8.5 },
    { id: 'streifen', image: `${G}boote/fisch-streifen.webp`, w: 8.5 }
  ],
  pile: `${G}boote/haufen.webp`,
  pileAt: { x: 50, y: 30, w: 24 },
  rounds: [
    { hint: 'Fülle beide Boote bis zur Marke: Tippe auf ein Boot, dann springt ein Fisch hinein.', capacity: [3, 5] },
    { hint: 'Noch einmal, diesmal mit mehr Fischen. Fülle wieder beide Boote.', capacity: [4, 6] }
  ]
}

/**
 * Etappe 5, "Das Dach öffnen" (neu): vier Freunde tragen einen Gelähmten zu Jesus, kommen wegen der Menge nicht hinein und decken das Dach auf, „da er war“ (Mk 2,4). Wir sehen in das Haus: Jesus und andere Menschen sitzen am Boden,
 * darüber liegt das Flachdach in Stücken. Die Stücke über dem freien Platz bei Jesus kommen ab; unter den anderen sitzen Menschen (ein Tipp dort ist ein Fehler, Staub fällt, die Menschen ducken sich). Ist das Loch offen, lassen die vier
 * Freunde das Bett an einem Seil vor Jesus hinunter. Zwei Runden (kleines Loch, dann breiteres an anderer Stelle). Bilder (Bildauftrag S36): `dach/haus.webp` 1200 × 900, `dach.webp` (Streifen), `leute-1..6`, `jesus`, `matte`, `traeger`, `seil`.
 */
const DACH: RoofGame = {
  background: `${G}dach/haus.webp`,
  roof: `${G}dach/dach.webp`,
  area: { x: 18, y: 12, w: 64, h: 14.2 },
  floor: 90,
  jesus: { image: `${G}dach/jesus.webp`, label: 'Jesus sitzt und lehrt', w: 14 },
  people: [
    { id: 'l1', image: `${G}dach/leute-1.webp`, label: 'Zwei Männer mit Bart', w: 15 },
    { id: 'l2', image: `${G}dach/leute-2.webp`, label: 'Frau mit Kind', w: 15 },
    { id: 'l3', image: `${G}dach/leute-3.webp`, label: 'Alter Mann mit Stock', w: 15 },
    { id: 'l4', image: `${G}dach/leute-4.webp`, label: 'Drei junge Männer', w: 15 },
    { id: 'l5', image: `${G}dach/leute-5.webp`, label: 'Mädchen und Junge', w: 15 },
    { id: 'l6', image: `${G}dach/leute-6.webp`, label: 'Zwei Frauen mit Kopftüchern', w: 15 }
  ],
  mat: { image: `${G}dach/matte.webp`, label: 'Der Gelähmte auf seinem Bett', w: 10, ratio: 0.5 },
  rope: { image: `${G}dach/seil.webp`, w: 2.2 },
  carriers: { image: `${G}dach/traeger.webp`, w: 34 },
  rounds: [
    {
      hint: 'Öffne das Dach genau über Jesus: Tippe auf die Dachstücke dort. Unter den anderen sitzen Menschen.',
      cols: 8,
      free: [3, 4],
      jesusX: 50,
      matX: 50,
      spots: [
        { person: 'l1', x: 22 },
        { person: 'l2', x: 34.5 },
        { person: 'l3', x: 65.5 },
        { person: 'l4', x: 79 }
      ]
    },
    {
      hint: 'Jetzt sitzt Jesus an einem anderen Platz. Öffne das Dach wieder genau über ihm.',
      cols: 10,
      free: [5, 6, 7],
      jesusX: 60,
      matX: 60,
      spots: [
        { person: 'l5', x: 18 },
        { person: 'l6', x: 30.5 },
        { person: 'l2', x: 42 },
        { person: 'l1', x: 77 },
        { person: 'l3', x: 90.5 }
      ]
    }
  ]
}

/**
 * Etappe 8, "Wimmelbild" (alte Mechanik): ein Berghang im Hochformat voller Menschen (Bildauftrag S33); gesucht werden die vier Fischer, die Jesus am See gerufen hat (Mk 1,16-20), jeder mit etwas in der Hand, das zu ihm gehört;
 * einige stehen hinter Fels, Baum, Mauer und Busch. Bilder: `wimmel/szene.webp`, `fischer-1..4.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Simon mit dem Fangnetz', 'Andreas mit dem Fischkorb', 'Jakobus mit dem Seil', 'Johannes mit dem Ruder'],
  doneText: 'Du hast alle vier gefunden: Simon, Andreas, Jakobus und Johannes. Sie gehören zu den zwölf Freunden von Jesus.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/fischer-1.webp`, x: 52, y: 44, w: 20 },
    { image: `${G}wimmel/fischer-2.webp`, x: 50, y: 80, w: 20 },
    { image: `${G}wimmel/fischer-3.webp`, x: 24, y: 61, w: 20 },
    { image: `${G}wimmel/fischer-4.webp`, x: 81, y: 85, w: 20 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 52, y: 46.5, w: 28 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 50, y: 83, w: 26 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 24, y: 64, w: 28 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 81, y: 87.5, w: 26 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 36, y: 70, w: 18 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 10, y: 89, w: 22 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 63, y: 93, w: 20 }
  ]
}

export const freunde: Journey = {
  id: 'freunde',
  title: 'Jesus ruft seine Freunde',
  subtitle: 'Vom Boot am See bis auf den Berg',
  age: '8-10',
  downloadMb: 14, // gemessen 8,6 MB ohne die Karte (noch nicht gemalt, rund 5 MB dazu) (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: das volle Netz (Konturzeichnung)
  gift: { title: 'Das volle Netz', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus freundePath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/freunde/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0706, y: 0.6068, d: 0.0339 },
      { x: 0.1714, y: 0.6311, d: 0.0339 },
      { x: 0.2621, y: 0.6371, d: 0.0339 },
      { x: 0.4133, y: 0.6371, d: 0.0339 },
      { x: 0.4990, y: 0.6371, d: 0.0339 },
      { x: 0.5847, y: 0.6371, d: 0.0339 },
      { x: 0.7157, y: 0.6371, d: 0.0339 },
      { x: 0.8014, y: 0.6371, d: 0.0339 },
      { x: 0.8871, y: 0.6371, d: 0.0339 }
    ],
    exam: { x: 0.9526, y: 0.6408, d: 0.0339 },
    path: FREUNDE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Das Boot als Kanzel',
      ref: 'Lukas 5,1–3',
      text: [
        'Jesus steht am See Genezareth. Die Menschen drängen sich immer dichter an ihn heran, denn sie wollen das Wort Gottes hören.',
        'Am Ufer liegen zwei Boote. Die Fischer sind schon ausgestiegen und waschen ihre Netze. Zu ihnen gehören Simon und seine Gefährten Jakobus und Johannes, die Söhne des Zebedäus.',
        'Jesus sieht die Boote und geht auf sie zu. Er steigt in das Boot, das Simon gehört. Er bittet ihn, ein kleines Stück vom Land hinauszufahren.',
        'Dann setzt sich Jesus ins Boot und lehrt die Menschen vom Wasser aus. So können alle ihn sehen und hören.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Ufer mit den Booten zusammen.', puzzle: { image: `${G}puzzle/ufer.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wo steht Jesus, als sich die Menschen zu ihm drängen?', options: ['am See Genezareth', 'am Jordan', 'im Tempel'], answer: 0 },
        { q: 'Was tun die Fischer am Ufer?', options: ['Sie waschen ihre Netze.', 'Sie schlafen.', 'Sie verkaufen Fische.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Auf dein Wort',
      ref: 'Lukas 5,4–5',
      text: [
        'Als Jesus aufgehört hat zu reden, sagt er zu Simon: „Fahre hinaus auf die Tiefe. Werft eure Netze aus, damit ihr einen Fang tut.“',
        'Simon antwortet: „Meister, wir haben die ganze Nacht gearbeitet. Wir haben nichts gefangen.“ Ihre Netze waren die ganze Nacht lang leer.',
        'Aber dann sagt Simon: „Auf dein Wort will ich das Netz auswerfen.“',
        'Vom Boot aus hat Jesus eben noch zu den Menschen am Ufer gesprochen. Jetzt tut Simon, was Jesus gesagt hat. Sie fahren hinaus auf den See, und Jesus ist bei ihnen im Boot.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Was sagt Jesus zu Simon?', options: ['Fahre hinaus auf die Tiefe und werft eure Netze aus.', 'Geh nach Hause.', 'Bring mir einen Fisch.'], answer: 0 },
        { q: 'Was hat Simon in der Nacht gefangen?', options: ['nichts', 'hundert Fische', 'einen großen Fisch'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das volle Netz',
      ref: 'Lukas 5,6–7',
      text: [
        'Simon und die anderen im Boot werfen die Netze aus, so wie Jesus es gesagt hat. Die ganze Nacht haben sie nichts gefangen. Das Netz, das eben noch leer war, wird schwer. Jetzt fangen sie auf einmal eine so große Menge Fische, dass ihr Netz zu reißen beginnt.',
        'Allein können sie das Netz nicht ziehen. Sie winken ihren Gefährten im anderen Boot zu. Die sollen kommen und ihnen helfen.',
        'Die Gefährten kommen herbei. Zu ihnen gehören Jakobus und Johannes. Gemeinsam füllen sie beide Boote mit Fischen. Die Boote werden so voll, dass sie fast untergehen.'
      ],
      // Spiel: Beide Boote füllen (boote, neu)
      task: { kind: 'boote', hint: 'Fülle beide Boote bis zur Marke: Tippe auf ein Boot, dann springt ein Fisch hinein.', boats: BOOTE },
      questions: [
        { q: 'Was geschieht mit dem Netz, als sie so viele Fische fangen?', options: ['Es beginnt zu reißen.', 'Es bleibt leer.', 'Es versinkt im See.'], answer: 0 },
        { q: 'Wen rufen sie zu Hilfe?', options: ['ihre Gefährten im anderen Boot', 'die Menschen am Ufer', 'Jesus'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Menschen fangen',
      ref: 'Lukas 5,8–11',
      text: [
        'Als Simon Petrus das sieht, fällt er im Boot vor Jesus auf die Knie. „Herr, geh weg von mir“, sagt er, „ich bin ein sündiger Mensch.“ Ein großer Schrecken hat ihn gepackt, ihn und alle, die bei ihm sind, über den Fang, den sie gemacht haben.',
        'Auch Jakobus und Johannes, die Söhne des Zebedäus, erschrecken. Sie sind Simons Gefährten und waren im anderen Boot.',
        'Jesus sagt zu Simon: „Fürchte dich nicht! Von nun an wirst du Menschen fangen.“',
        'Da fahren sie die Boote ans Land. Sie lassen alles zurück und gehen mit Jesus.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagt Jesus zu Simon?', options: ['Fürchte dich nicht! Von nun an wirst du Menschen fangen.', 'Fahre wieder hinaus.', 'Verkaufe die Fische.'], answer: 0 },
        { q: 'Wie heißen die Söhne des Zebedäus?', options: ['Jakobus und Johannes', 'Andreas und Philippus', 'Thomas und Matthäus'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Durch das Dach',
      ref: 'Markus 2,1–12',
      text: [
        'Einige Tage später ist Jesus wieder in Kapernaum. Es spricht sich herum, dass er im Haus ist, und so viele Menschen kommen, dass nicht einmal vor der Tür noch Platz ist. Jesus sagt ihnen das Wort Gottes.',
        'Vier Männer tragen einen Gelähmten auf seinem Bett zu Jesus. Wegen der Menge kommen sie nicht hinein. Da decken sie das Dach auf, genau über der Stelle, wo Jesus ist, und lassen das Bett mit dem Kranken hinunter.',
        'Als Jesus ihren Glauben sieht, sagt er zu dem Gelähmten: „Mein Sohn, deine Sünden sind dir vergeben.“',
        'Er will zeigen, dass er Macht hat, Sünden zu vergeben. Dann sagt er: „Steh auf, nimm dein Bett und geh nach Hause!“ Da steht der Mann auf, nimmt sein Bett und geht hinaus, vor den Augen aller. Alle staunen und loben Gott.'
      ],
      // Spiel: Das Dach öffnen (dach, neu)
      task: { kind: 'dach', hint: 'Öffne das Dach genau über Jesus: Tippe auf die Dachstücke dort.', roof: DACH },
      questions: [
        { q: 'Wie viele Männer tragen den Gelähmten?', options: ['vier', 'zwei', 'zehn'], answer: 0 },
        { q: 'Wie kommen sie zu Jesus, als sie nicht durch die Tür können?', options: ['Sie decken das Dach auf und lassen das Bett hinunter.', 'Sie warten draußen bis zum Abend.', 'Sie klettern durch ein Fenster.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Levi am Zoll',
      ref: 'Markus 2,13–14; Lukas 5,27–28',
      text: [
        'Jesus geht wieder hinaus an den See. Alle Menschen kommen zu ihm, und er lehrt sie. Dann geht er ein Stück weiter.',
        'Vorher hat Jesus schon vier Fischer gerufen: Simon, Andreas, Jakobus und Johannes. Nun kommt er an einen Ort, an dem ein Mann am Zoll sitzt.',
        'Dieser Mann heißt Levi und ist der Sohn des Alphäus. Er ist ein Zöllner: Er nimmt von den Leuten, die vorbeikommen, den Zoll ein. Wer mit seinen Waren vorbeikommt, muss bei ihm bezahlen.',
        'Jesus sieht ihn und sagt: „Folge mir nach!“ Da steht Levi auf, lässt alles zurück und folgt Jesus nach.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer sitzt am Zoll?', options: ['Levi, der Sohn des Alphäus', 'Simon, der Fischer', 'Johannes, der Sohn des Zebedäus'], answer: 0 },
        { q: 'Was sagt Jesus zu ihm?', options: ['Folge mir nach!', 'Bleib hier sitzen.', 'Zähle dein Geld.'], answer: 0 },
        { q: 'Was tut Levi?', options: ['Er steht auf und folgt Jesus nach.', 'Er bleibt am Zoll sitzen.', 'Er läuft davon.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Das Fest bei Levi',
      ref: 'Markus 2,15–17; Lukas 5,29–32',
      text: [
        'Später lädt Levi Jesus zu einem großen Essen in sein Haus ein. Viele Zöllner und Sünder setzen sich mit Jesus und seinen Jüngern zu Tisch. Es sind viele, die ihm nachfolgen.',
        'Die Schriftgelehrten und Pharisäer sehen das und murren. Sie fragen die Jünger: „Warum isst und trinkt er mit den Zöllnern und Sündern?“',
        'Jesus hört, was sie sagen. Er antwortet ihnen: „Nicht die Gesunden brauchen einen Arzt, sondern die Kranken.“',
        'Dann sagt er: „Ich bin nicht gekommen, die Gerechten zu rufen. Ich bin gekommen, die Sünder zu rufen, damit sie umkehren.“'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Bei wem sitzt Jesus zu Tisch?', options: ['bei Levi', 'bei Simon', 'bei Zebedäus'], answer: 0 },
        { q: 'Wer isst mit Jesus?', options: ['viele Zöllner und Sünder', 'nur die Schriftgelehrten', 'nur Fischer'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Zwölf Freunde auf dem Berg',
      ref: 'Markus 3,13–19; Lukas 6,13',
      text: [
        'Jesus steigt auf einen Berg und ruft zu sich, wen er will. Sie kommen zu ihm.',
        'Er bestimmt zwölf von ihnen, die er auch Apostel nennt. Sie sollen bei ihm sein, und er will sie aussenden, damit sie den Menschen Gottes Wort sagen. Sie sollen auch Macht haben, Kranke gesund zu machen.',
        'Jesus gibt Simon den Namen Petrus. Jakobus und Johannes, die Söhne des Zebedäus, nennt er Donnersöhne. Dazu kommen Andreas, Philippus, Bartholomäus, Matthäus und Thomas.',
        'Und Jakobus, der Sohn des Alphäus, Thaddäus, Simon, der Zelot, und Judas Iskariot. Der hat ihn später verraten.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Suche am Berg: Finde die vier Fischer, die Jesus am See gerufen hat.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Wohin geht Jesus, als er die Zwölf ruft?', options: ['auf einen Berg', 'an den See', 'in den Tempel'], answer: 0 },
        { q: 'Welchen Namen gibt Jesus dem Simon?', options: ['Petrus', 'Johannes', 'Thaddäus'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Wer gehört zu Jesus?',
      ref: 'Markus 3,31–35',
      text: [
        'Jesus ist in einem Haus, und viele Menschen sitzen im Kreis um ihn. Draußen kommen seine Mutter und seine Brüder an. Sie bleiben vor dem Haus stehen und lassen ihn rufen.',
        'Die Menschen im Haus sagen zu Jesus: „Deine Mutter und deine Brüder sind draußen. Sie fragen nach dir.“',
        'Jesus antwortet: „Wer ist meine Mutter, und wer sind meine Brüder?“ Er sieht die an, die im Kreis um ihn sitzen.',
        'Dann sagt er: „Das hier sind meine Mutter und meine Brüder! Denn wer Gottes Willen tut, der ist mein Bruder und meine Schwester und meine Mutter.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer steht draußen vor dem Haus?', options: ['Jesu Mutter und seine Brüder', 'die Zwölf Jünger', 'die Fischer vom See'], answer: 0 },
        { q: 'Wohin sieht Jesus, als er antwortet?', options: ['auf die, die im Kreis um ihn sitzen', 'zur Tür hinaus', 'zum Himmel'], answer: 0 },
        { q: 'Wer ist Jesu Bruder und Schwester und Mutter?', options: ['wer Gottes Willen tut', 'wer am meisten Geld hat', 'wer am schnellsten läuft'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sagt Simon, bevor er das Netz auswirft?', options: ['Auf dein Wort will ich das Netz auswerfen.', 'Das ist mir zu weit.', 'Ich habe keine Zeit.'], answer: 0 },
    { q: 'Wie voll werden die beiden Boote?', options: ['so voll, dass sie fast untergehen', 'nur halb voll', 'gar nicht voll'], answer: 0 },
    { q: 'Was sagt Jesus zu Simon im Boot?', options: ['Fürchte dich nicht! Von nun an wirst du Menschen fangen.', 'Fahre wieder hinaus.', 'Verkaufe die Fische.'], answer: 0 },
    { q: 'Wie viele Männer tragen den Gelähmten zu Jesus?', options: ['vier', 'zwei', 'zehn'], answer: 0 },
    { q: 'Wer braucht den Arzt, sagt Jesus?', options: ['die Kranken', 'die Gesunden', 'niemand'], answer: 0 },
    { q: 'Welchen Namen gibt Jesus dem Simon?', options: ['Petrus', 'Johannes', 'Thaddäus'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of freunde.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of freunde.stages) {
  const file = `audio/abenteuer/freunde/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (at the shore, the full net, on the mountain); they follow one another at random
freunde.music = [
  'audio/abenteuer/freunde/musik-ufer-v2.mp3',
  'audio/abenteuer/freunde/musik-netz-v2.mp3',
  'audio/abenteuer/freunde/musik-berg-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(freunde, freundeEn)
