/**
 * Abenteuer "Jona" (Jona 1–4) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Der Sturm, der große Fisch und die Stadt". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, Nacht vom 21. auf den 22.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Jona/ENTWURF_Jona.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfung: PRUEFBERICHT-BIBELTREUE-2026-10-22.md,
 * Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Ladung über Bord (neu), 3 Lückenvers (alt), 4 nur Quiz, 5 Ausmalen (alt), 6 Muscheln vor der Welle (neu), 7 Säcke für Groß und Klein (neu),
 * 8 nur Quiz, 9 Schatten halten (neu).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/jona/, images/abenteuer/spiele/jona/<spiel>/, audio/abenteuer/jona/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { Journey, OverboardGame, SacksGame, ShadeGame, ShoreGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { JONA_PATH } from './jonaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { jonaEn } from './en/jona.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt später a/b): `images/abenteuer/jona/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/jona/'

const G = 'images/abenteuer/spiele/jona/'

/**
 * Etappe 2, "Ladung über Bord": im Sturm rutscht die Ladung auf dem Deck hin und her, das Kind tippt jedes Stück an und wirft es ins Meer (neu). Bilder (Bildauftrag J30): `bord/meer.webp` 900 × 675,
 * `schiff.webp`, `kiste-klein`, `kiste-gross`, `fass-klein`, `fass-gross`, `sack-klein`, `sack-gross` (transparent). Lage des Schiffes und des Decks (Prozent des Bildes) am gemalten Bild abgelesen.
 */
const BORD: OverboardGame = {
  background: `${G}bord/meer.webp`,
  ship: `${G}bord/schiff.webp`,
  shipBox: { x: 50, y: 88, w: 86 },
  deck: { y: 49, h: 24 },
  kinds: [
    { id: 'kiste-klein', image: `${G}bord/kiste-klein.webp`, w: 9 },
    { id: 'kiste-gross', image: `${G}bord/kiste-gross.webp`, w: 15 },
    { id: 'fass-klein', image: `${G}bord/fass-klein.webp`, w: 8 },
    { id: 'fass-gross', image: `${G}bord/fass-gross.webp`, w: 12 },
    { id: 'sack-klein', image: `${G}bord/sack-klein.webp`, w: 9 },
    { id: 'sack-gross', image: `${G}bord/sack-gross.webp`, w: 14 }
  ],
  rounds: [
    {
      hint: 'Tippe die rutschenden Kisten und Fässer an und wirf sie ins Meer, damit das Schiff leichter wird.',
      pieces: [
        { kind: 'kiste-gross', x: 30, amp: 11, periodMs: 3800 },
        { kind: 'fass-klein', x: 46, amp: 9, periodMs: 3200, phase: 1.6 },
        { kind: 'sack-gross', x: 60, amp: 10, periodMs: 3600, phase: 3.1 },
        { kind: 'kiste-klein', x: 72, amp: 8, periodMs: 3000, phase: 4.6 }
      ]
    },
    {
      hint: 'Jetzt kommen noch mehr Wellen. Wirf auch die letzte Ladung ins Meer.',
      pieces: [
        { kind: 'fass-gross', x: 24, amp: 10, periodMs: 2700 },
        { kind: 'sack-klein', x: 36, amp: 9, periodMs: 2400, phase: 1.2 },
        { kind: 'kiste-gross', x: 48, amp: 10, periodMs: 2900, phase: 2.4 },
        { kind: 'fass-klein', x: 58, amp: 8, periodMs: 2500, phase: 3.6 },
        { kind: 'kiste-klein', x: 68, amp: 9, periodMs: 2200, phase: 4.8 },
        { kind: 'sack-gross', x: 78, amp: 7, periodMs: 2600, phase: 0.6 }
      ]
    }
  ]
}

/**
 * Etappe 3, "Lückenvers" (alte Mechanik): Jonas Satz aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Josua/Adam und Eva, kopiert. Hintergrund ist das Etappenbild 3, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-03.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Ich bin ein ', '“, sagt Jona.'], words: ['Hebräer', 'Seemann', 'Kapitän'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Ich verehre Gott, den Herrn des ', ', der das ', ' und das trockene Land gemacht hat.'], words: ['Himmels', 'Meer', 'Berges', 'Sturm'], answers: [0, 1] }
  ]
}

/**
 * Etappe 6, "Muscheln vor der Welle": am Strand läuft eine Welle hinauf und zurück; das Kind sammelt die Muscheln im trockenen Sand ein, bevor die Welle sie wegspült (neu). Bilder (Bildauftrag J31):
 * `strand/strand.webp` 900 × 675, `muschel-1..5.webp` und `eimer.webp` (transparent), `schaum.webp` (Schaumstreifen, transparent). Lage der Muscheln (Prozent des Strandes) am gemalten Bild abgelesen.
 */
const STRAND: ShoreGame = {
  background: `${G}strand/strand.webp`,
  shells: [1, 2, 3, 4, 5].map((n) => `${G}strand/muschel-${n}.webp`),
  bucket: `${G}strand/eimer.webp`,
  foam: `${G}strand/schaum.webp`,
  rounds: [
    {
      hint: 'Sammle die Muscheln im trockenen Sand ein, bevor die Welle kommt.',
      periodMs: 7600,
      low: 86,
      high: 52,
      shells: [
        { x: 22, y: 22, kind: 0 },
        { x: 58, y: 30, kind: 1 },
        { x: 80, y: 44, kind: 2 },
        { x: 36, y: 60, kind: 3 },
        { x: 68, y: 68, kind: 4 }
      ]
    },
    {
      hint: 'Die Welle läuft schneller und weiter hinauf. Pass auf!',
      periodMs: 6200,
      low: 88,
      high: 42,
      shells: [
        { x: 14, y: 20, kind: 1 },
        { x: 46, y: 28, kind: 3 },
        { x: 84, y: 24, kind: 0 },
        { x: 26, y: 50, kind: 4 },
        { x: 60, y: 56, kind: 2 },
        { x: 78, y: 66, kind: 1 },
        { x: 40, y: 74, kind: 3 }
      ]
    }
  ]
}

/**
 * Etappe 7, "Säcke für Groß und Klein": auf einer Straße in Ninive stehen Menschen und Tiere; das Kind zieht kleine Säcke über die Kinder und große über die Erwachsenen und Tiere (neu). Bilder (Bildauftrag J32):
 * `saecke/strasse.webp` 900 × 675, die Figuren je in Kleidung und im Sack (transparent), `sack-klein.webp`, `sack-gross.webp`. Lage (Mitte der Füße und Breite, Prozent der Straße) am gemalten Bild abgelesen.
 */
const SAECKE: SacksGame = {
  background: `${G}saecke/strasse.webp`,
  sackSmall: `${G}saecke/sack-klein.webp`,
  sackBig: `${G}saecke/sack-gross.webp`,
  rounds: [
    {
      hint: 'Ziehe kleine Säcke über die Kinder und große über die Erwachsenen und Tiere.',
      figures: [
        { id: 'kind-a', who: 'child', image: `${G}saecke/kind-a.webp`, imageSack: `${G}saecke/kind-a-sack.webp`, x: 16, y: 70, w: 10.2 },
        { id: 'erw-a', who: 'adult', image: `${G}saecke/erw-a.webp`, imageSack: `${G}saecke/erw-a-sack.webp`, x: 34, y: 70, w: 17.1 },
        { id: 'kind-b', who: 'child', image: `${G}saecke/kind-b.webp`, imageSack: `${G}saecke/kind-b-sack.webp`, x: 52, y: 70, w: 10.1 },
        { id: 'erw-b', who: 'adult', image: `${G}saecke/erw-b.webp`, imageSack: `${G}saecke/erw-b-sack.webp`, x: 70, y: 70, w: 14.6 },
        { id: 'kind-c', who: 'child', image: `${G}saecke/kind-c.webp`, imageSack: `${G}saecke/kind-c-sack.webp`, x: 26, y: 97, w: 11.2 },
        { id: 'erw-c', who: 'adult', image: `${G}saecke/erw-c.webp`, imageSack: `${G}saecke/erw-c-sack.webp`, x: 62, y: 97, w: 16.8 }
      ]
    },
    {
      hint: 'Auch die Tiere brauchen große Säcke.',
      figures: [
        { id: 'kind-b', who: 'child', image: `${G}saecke/kind-b.webp`, imageSack: `${G}saecke/kind-b-sack.webp`, x: 14, y: 70, w: 10.1 },
        { id: 'erw-d', who: 'adult', image: `${G}saecke/erw-d.webp`, imageSack: `${G}saecke/erw-d-sack.webp`, x: 32, y: 70, w: 13.1 },
        { id: 'ochse', who: 'animal', image: `${G}saecke/ochse.webp`, imageSack: `${G}saecke/ochse-sack.webp`, x: 58, y: 70, w: 20.7 },
        { id: 'kind-c', who: 'child', image: `${G}saecke/kind-c.webp`, imageSack: `${G}saecke/kind-c-sack.webp`, x: 84, y: 70, w: 11.2 },
        { id: 'erw-e', who: 'adult', image: `${G}saecke/erw-e.webp`, imageSack: `${G}saecke/erw-e-sack.webp`, x: 20, y: 97, w: 14.6 },
        { id: 'schaf', who: 'animal', image: `${G}saecke/schaf.webp`, imageSack: `${G}saecke/schaf-sack.webp`, x: 48, y: 97, w: 17.2 },
        { id: 'erw-a', who: 'adult', image: `${G}saecke/erw-a.webp`, imageSack: `${G}saecke/erw-a-sack.webp`, x: 76, y: 97, w: 17.1 }
      ]
    }
  ]
}

/**
 * Etappe 9, "Schatten halten": die Sonne wandert in einem Bogen über den Himmel, das Kind zieht das Blätterdach des Rizinus zwischen Sonne und Jona (neu). Bilder (Bildauftrag J33):
 * `schatten/huegel.webp` 900 × 675 (ohne Himmelskörper), `jona.webp`, `blaetterdach.webp`, `sonne.webp` (transparent). Lage Jonas (Mitte, Prozent des Bildes) am gemalten Bild abgelesen.
 */
const SCHATTEN: ShadeGame = {
  background: `${G}schatten/huegel.webp`,
  jonah: `${G}schatten/jona.webp`,
  roof: `${G}schatten/blaetterdach.webp`,
  sun: `${G}schatten/sonne.webp`,
  jonahBox: { x: 62, y: 70, w: 23 },
  roofW: 36,
  rounds: [
    { hint: 'Ziehe das Blätterdach so über Jona, dass die Sonne ihn nicht trifft.', seconds: 8, sunSeconds: 30, tolerance: 18 },
    { hint: 'Die Sonne wandert schneller. Folge ihr mit dem Dach.', seconds: 10, sunSeconds: 22, tolerance: 13 }
  ]
}

export const jona: Journey = {
  id: 'jona',
  title: 'Jona',
  subtitle: 'Der Sturm, der große Fisch und die Stadt',
  age: '8-10',
  downloadMb: 14, // Schätzung vor den Aufnahmen; wird nach dem Bau gemessen
  medal: `${PICS}medaille.webp`, // Der große Fisch und das Schiff (Goldring mit Seilmuster)
  // Geschenk-Ausmalbild: Die ganze Geschichte von Jona in einem Bild (Konturzeichnung)
  gift: { title: 'Jona und der große Fisch', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus jonaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/jona/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.1161, y: 0.6311, d: 0.0339 },
      { x: 0.2019, y: 0.6068, d: 0.0339 },
      { x: 0.2877, y: 0.619, d: 0.0339 },
      { x: 0.3916, y: 0.6068, d: 0.0339 },
      { x: 0.4764, y: 0.6129, d: 0.0339 },
      { x: 0.6005, y: 0.6311, d: 0.0339 },
      { x: 0.7338, y: 0.5886, d: 0.0339 },
      { x: 0.8175, y: 0.6068, d: 0.0339 },
      { x: 0.9013, y: 0.6129, d: 0.0339 }
    ],
    exam: { x: 0.979, y: 0.6068, d: 0.0339 },
    path: JONA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der Auftrag und die Flucht',
      ref: 'Jona 1,1–3',
      text: [
        'Jona, der Sohn Amittais, hört eines Tages, wie Gott zu ihm spricht.',
        '„Mach dich auf und geh nach Ninive“, sagt Gott. „Das ist eine große Stadt. Sag ihnen, dass das Böse, das sie tun, bis zu mir heraufgekommen ist.“',
        'Aber Jona will nicht nach Ninive gehen. Er steht auf und läuft in die andere Richtung, weg von Gott. Er geht hinunter nach Japho, an das Meer. Dort liegt ein Schiff, das nach Tarsis fahren will, weit über das Meer.',
        'Jona bezahlt das Fährgeld und steigt ein. Er will mit den Seeleuten nach Tarsis fahren, weit weg von Gott.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin soll Jona gehen?', options: ['nach Ninive', 'nach Tarsis', 'nach Japho'], answer: 0 },
        { q: 'In welcher Stadt am Meer steigt Jona auf ein Schiff?', options: ['in Japho', 'in Ninive', 'in Tarsis'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Der große Sturm',
      ref: 'Jona 1,4–6',
      text: [
        'Auf dem Meer lässt Gott einen großen Wind aufkommen. Es stürmt und kracht, die Wellen werden hoch, und das Schiff droht zu zerbrechen.',
        'Die Seeleute fürchten sich. Jeder von ihnen ruft zu seinem Gott um Hilfe. Sie werfen die Ladung und das Gerät aus dem Schiff ins Meer, damit es leichter wird.',
        'Jona aber ist hinunter in den Bauch des Schiffes gestiegen. Er liegt da und schläft tief.',
        'Da kommt der Kapitän zu ihm. „Was schläfst du?“, ruft er. „Steh auf und ruf zu deinem Gott! Vielleicht denkt er an uns, und wir gehen nicht unter.“'
      ],
      // Spiel: Ladung über Bord (bord, neu)
      task: { kind: 'bord', hint: 'Tippe die rutschenden Kisten und Fässer an und wirf sie ins Meer, damit das Schiff leichter wird.', overboard: BORD },
      questions: [
        { q: 'Was werfen die Seeleute ins Meer?', options: ['die Ladung', 'die Segel', 'die Taue'], answer: 0 },
        { q: 'Was tut Jona im Schiff?', options: ['Er schläft.', 'Er rudert.', 'Er betet laut.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das Los',
      ref: 'Jona 1,7–10',
      text: [
        'Die Seeleute sind sicher: Dieser Sturm hat einen Grund. „Kommt, wir werfen das Los“, sagen sie, „dann erfahren wir, wer schuld ist.“ Das Los fällt auf Jona.',
        'Sofort fragen sie ihn: „Sag uns, wer du bist! Was ist deine Arbeit? Woher kommst du? Aus welchem Land und von welchem Volk?“',
        '„Ich bin ein Hebräer“, antwortet Jona. „Ich verehre Gott, den Herrn des Himmels, der das Meer und das trockene Land gemacht hat.“',
        'Da erschrecken die Männer sehr. Jona hat ihnen erzählt, dass er vor Gott flieht. „Warum hast du das getan?“, rufen sie.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 1 von 2)
      task: { kind: 'lueckenvers', hint: 'Ziehe die fehlenden Wörter in Jonas Satz.', verse: VERS },
      questions: [
        { q: 'Wen trifft das Los?', options: ['Jona', 'den Kapitän', 'den jüngsten Seemann'], answer: 0 },
        { q: 'Was sagt Jona über Gott?', options: ['Er hat das Meer und das trockene Land gemacht.', 'Er wohnt in einem Haus in Japho.', 'Er schickt nur Wind und Wellen.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Ins Meer',
      ref: 'Jona 1,11–16',
      text: [
        '„Was sollen wir mit dir tun, damit das Meer wieder still wird?“, fragen die Männer. Die Wellen werden immer wilder.',
        '„Nehmt mich und werft mich ins Meer“, sagt Jona. „Dann wird es still. Ich weiß, dass dieser Sturm wegen mir über euch gekommen ist.“',
        'Aber die Männer wollen das nicht. Sie rudern mit aller Kraft zurück zum Land, doch das Meer ist zu stark. Da rufen sie zu Gott: „Ach Gott, lass uns nicht untergehen wegen dieses Mannes! Du, Gott, tust, was dir gefällt.“',
        'Dann heben sie Jona hoch und werfen ihn ins Meer. Im selben Augenblick wird das Meer still. Die Männer haben große Ehrfurcht vor Gott. Sie bringen ihm ein Opfer und machen ihm Versprechen.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt Jona, damit das Meer still wird?', options: ['„Werft mich ins Meer.“', '„Betet zu euren Göttern.“', '„Fahrt nach Tarsis.“'], answer: 0 },
        { q: 'Was geschieht, als Jona im Meer ist?', options: ['Das Meer wird still.', 'Der Sturm wird stärker.', 'Das Schiff geht unter.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Im Bauch des Fisches',
      ref: 'Jona 1,17 bis 2,9',
      text: [
        'Aber Gott lässt einen großen Fisch kommen, und der verschluckt Jona. Drei Tage und drei Nächte ist Jona im Bauch des Fisches.',
        'Dort betet er zu Gott. „Ich habe zu dir gerufen in meiner Angst“, sagt er, „und du hast mir geantwortet. Du hast mich in die Tiefe geworfen, mitten ins Meer, und alle deine Wellen sind über mich gegangen. Als ich den Mut verlor, habe ich an dich gedacht, und mein Gebet ist zu dir gekommen.“',
        'Jona weiß jetzt: Gott hört ihn, sogar hier in der Tiefe.',
        '„Ich will dir danken und halten, was ich versprochen habe“, betet er. „Denn die Hilfe kommt von Gott.“'
      ],
      // Spiel: Ausmalen (ausmalen, alt 2 von 2, ruhig)
      task: { kind: 'ausmalen', hint: 'Male den Fisch im Meer aus.', image: `${PICS}etappe-05.webp` },
      questions: [
        { q: 'Wie lange ist Jona im Bauch des Fisches?', options: ['drei Tage und drei Nächte', 'einen Tag und eine Nacht', 'sieben Tage'], answer: 0 },
        { q: 'Was tut Jona im Bauch des Fisches?', options: ['Er betet zu Gott.', 'Er baut ein Floß.', 'Er schweigt und wartet.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Wieder an Land',
      ref: 'Jona 2,10; 3,1–3',
      text: [
        'Da spricht Gott zu dem Fisch, und der Fisch spuckt Jona ans trockene Land. Jona steht wieder auf festem Boden, gerettet aus der Tiefe.',
        'Zum zweiten Mal kommt Gottes Wort zu Jona: „Mach dich auf und geh nach Ninive. Sag den Menschen dort, was ich dir sage.“ Gott gibt ihm den Auftrag noch einmal.',
        'Diesmal läuft Jona nicht davon. Er geht, so wie Gott es gesagt hat. Der Weg ist weit, aber er geht ihn bis nach Ninive.',
        'Ninive ist eine riesige Stadt. Man braucht drei Tage, um durch sie hindurchzugehen.'
      ],
      // Spiel: Muscheln vor der Welle (strand, neu)
      task: { kind: 'strand', hint: 'Sammle die Muscheln im trockenen Sand ein, bevor die Welle kommt.', shore: STRAND },
      questions: [
        { q: 'Was tut der Fisch, als Gott zu ihm spricht?', options: ['Er spuckt Jona ans Land.', 'Er schwimmt mit Jona nach Ninive.', 'Er taucht tief hinab.'], answer: 0 },
        { q: 'Was sagt Gott zu Jona zum zweiten Mal?', options: ['Geh nach Ninive.', 'Bleib am Strand.', 'Fahr nach Tarsis.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Ninive hört zu',
      ref: 'Jona 3,4–10',
      text: [
        'Jona geht einen Tag lang in die Stadt hinein und ruft: „Noch vierzig Tage, dann wird Ninive untergehen!“',
        'Da glauben die Menschen von Ninive an Gott. Sie beschließen zu fasten, und alle, die Großen und die Kleinen, ziehen grobe Säcke an.',
        'Auch der König hört davon. Er steht von seinem Thron auf, legt seinen Königsmantel ab, hüllt sich in einen Sack und setzt sich in die Asche. Er lässt ausrufen: „Kein Mensch und kein Tier soll essen oder trinken. Menschen und Tiere sollen Säcke tragen. Alle sollen zu Gott rufen und umkehren von ihrem bösen Weg. Wer weiß? Vielleicht tut es Gott leid, und wir gehen nicht unter.“',
        'Gott sieht, wie sie sich ändern. Da tut es ihm leid, was er angekündigt hat, und er tut es nicht.'
      ],
      // Spiel: Säcke für Groß und Klein (saecke, neu)
      task: { kind: 'saecke', hint: 'Ziehe kleine Säcke über die Kinder und große über die Erwachsenen und Tiere.', sacks: SAECKE },
      questions: [
        { q: 'Was ruft Jona in der Stadt?', options: ['Noch vierzig Tage, dann wird Ninive untergehen.', 'Noch drei Tage, dann kommt der Fisch.', 'Noch ein Jahr, dann kommt der König.'], answer: 0 },
        { q: 'Was tut der König von Ninive?', options: ['Er setzt sich in einen Sack in die Asche.', 'Er schickt Jona fort.', 'Er verlässt die Stadt.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Jonas Zorn',
      ref: 'Jona 4,1–5',
      text: [
        'Gott hat Ninive verschont. Aber Jona ist darüber gar nicht froh. Er wird zornig und betet: „Ach Gott, das habe ich doch gleich gesagt, als ich noch zu Hause war! Darum wollte ich nach Tarsis fliehen. Ich wusste ja, dass du gnädig und barmherzig bist, langmütig und von großer Güte.“',
        '„Meinst du, dass du zu Recht zornig bist?“, fragt Gott.',
        'Jona geht aus der Stadt hinaus und setzt sich auf der Ostseite hin. Dort macht er sich eine Hütte und sitzt in ihrem Schatten. Er will sehen, was mit Ninive geschieht.'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Warum ist Jona zornig?', options: ['Gott verschont Ninive.', 'Das Schiff ist untergegangen.', 'Der Fisch hat ihn verschluckt.'], answer: 0 },
        { q: 'Wohin setzt sich Jona?', options: ['in eine Hütte vor der Stadt', 'in den Palast des Königs', 'auf ein Schiff'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Der Rizinus',
      ref: 'Jona 4,6–11',
      text: [
        'Gott lässt über Jona einen Rizinus wachsen. Die großen Blätter geben Schatten für seinen Kopf, und Jona freut sich sehr darüber.',
        'Aber am nächsten Morgen schickt Gott einen Wurm, der sticht die Pflanze, und sie verdorrt. Dann schickt Gott einen heißen Ostwind, und die Sonne sticht Jona auf den Kopf, bis er matt wird. Wieder ist er zornig.',
        '„Dich jammert der Rizinus“, sagt Gott, „für den du nicht gearbeitet hast. In einer Nacht ist er gewachsen, in einer Nacht ist er verdorrt.“',
        '„Und mich sollte Ninive nicht jammern, diese große Stadt? Mehr als hundertzwanzigtausend Menschen leben dort, und viele Tiere.“'
      ],
      // Spiel: Schatten halten (schatten, neu)
      task: { kind: 'schatten', hint: 'Ziehe das Blätterdach so über Jona, dass die Sonne ihn nicht trifft.', shade: SCHATTEN },
      questions: [
        { q: 'Was lässt Gott über Jona wachsen?', options: ['einen Rizinus', 'einen Feigenbaum', 'eine Palme'], answer: 0 },
        { q: 'Wodurch verdorrt der Rizinus?', options: ['Ein Wurm sticht ihn.', 'Jona reißt ihn aus.', 'Es regnet zu viel.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wohin soll Jona gehen?', options: ['nach Ninive', 'nach Tarsis', 'nach Japho'], answer: 0 },
    { q: 'Wer hat laut Jona das Meer und das trockene Land gemacht?', options: ['Gott, der Herr des Himmels', 'der Kapitän', 'ein Gott von Tarsis'], answer: 0 },
    { q: 'Was geschieht, als Jona ins Meer geworfen wird?', options: ['Das Meer wird still.', 'Der Sturm wird stärker.', 'Das Schiff geht unter.'], answer: 0 },
    { q: 'Wie lange ist Jona im Bauch des Fisches?', options: ['drei Tage und drei Nächte', 'einen Tag und eine Nacht', 'sieben Tage'], answer: 0 },
    { q: 'Was tun die Menschen von Ninive, als sie Jona hören?', options: ['Sie glauben an Gott und ziehen Säcke an.', 'Sie jagen Jona fort.', 'Sie bauen eine Mauer.'], answer: 0 },
    { q: 'Was sagt Gott zum Schluss über Ninive?', options: ['Die Stadt soll ihn jammern, so viele Menschen und Tiere.', 'Die Stadt soll untergehen.', 'Die Stadt soll Jona gehören.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of jona.stages) {
  if (st.task.verse) st.task.verse.background = st.image ?? st.task.verse.background
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])
for (const s of jona.stages) {
  const file = `audio/abenteuer/jona/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (sea, the deep, hope); they follow one another at random
jona.music = [
  'audio/abenteuer/jona/musik-meer-v1.mp3',
  'audio/abenteuer/jona/musik-tiefe-v1.mp3',
  'audio/abenteuer/jona/musik-zuversicht-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(jona, jonaEn)
