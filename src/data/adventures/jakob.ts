/**
 * Abenteuer "Jakob" (1. Mose 25,19–34; 27; 28,10–22; 29; 32,23–32; 33,1–11) für 8 bis 10 Jahre: 6 Etappen, Untertitel "Ein Weg mit Umwegen". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Jakob/ENTWURF_Jakob.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Zählen (alt), 2 nur Quiz, 3 Treppe zusammenschieben (neu), 4 Brunnen kurbeln (neu),
 * 5 Morgenrot halten (neu), 6 Puzzle (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/jakob/, images/abenteuer/spiele/jakob/<spiel>/, audio/abenteuer/jakob/.
 *
 * STAND 20.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte und Vorlese-Aufnahmen (Deutsch und Englisch) sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CrankGame, HoldGame, Journey, SlideGame } from '@/types/adventure'
import { JAKOB_PATH } from './jakobPath'
import { localize } from './localize'
import { jakobEn } from './en/jakob.en'

const IMG = 'images/abenteuer/jakob/'
const G = 'images/abenteuer/spiele/jakob/'
const REC = 'audio/abenteuer/jakob/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Zählen": Jakobs Schafe vor dem Zelt (Etappenbild 1), jedes angetippt und mitgezählt. Das Zählspiel hat nur eine Szene (keine Runden).
 * Das Schaf ist das aus Noah (Kopie unter `zaehlen/`); es ist kein Bild neu zu malen.
 */

/**
 * Etappe 3, "Treppe zusammenschieben": das Etappenbild 3 (Nachtlandschaft mit der Himmelsleiter) wird von der App in Kacheln geschnitten und gemischt (`scramble`, mit festem
 * `seed`), eine Kachel fehlt. Runde 1 3 × 2, Runde 2 4 × 3 Kacheln. Es ist kein Spielbild neu zu malen.
 */
const SCHIEBEN: SlideGame = {
  image: `${IMG}etappe-bild-03.webp`,
  rounds: [
    { hint: 'Schiebe eine Kachel in die freie Lücke.', cols: 3, rows: 2, moves: 24, seed: 7 },
    { hint: 'Jetzt sind es mehr Kacheln.', cols: 4, rows: 3, moves: 80, seed: 11 }
  ]
}

/**
 * Etappe 4, "Brunnen kurbeln": der Brunnen im Etappenbild 4 mit einer Kurbel, einem Eimer am Seil und einem Trog (Bildauftrag J10). Runde 1 ein Eimer, Runde 2 drei.
 * Die Plätze (Kurbelmitte, Seil x und Eimer oben/unten, Trog Mitte x, y und Breite; Prozent des Etappenbildes 4) sind die Messwerte aus `kurbel/kurbel-messung.json`; der Trog (dort als linke Kante x 62, Unterkante y 97,
 * Breite 23, Höhe 2:1 gemessen) ist auf seine Mitte umgerechnet: x 62 + 11,5, y 97 - 8,6. Der Trog steht am Fuß der rechten Brunnenwand (die Lage links aus dem Bildlauf lag auf den Schafsköpfen).
 */
const KURBEL: CrankGame = {
  background: `${IMG}etappe-bild-04.webp`,
  crank: `${G}kurbel/kurbel.webp`,
  bucket: `${G}kurbel/eimer.webp`,
  troughEmpty: `${G}kurbel/trog-leer.webp`,
  troughFull: `${G}kurbel/trog-voll.webp`,
  crankAt: [44, 82],
  bucketAt: [59, 63, 75],
  troughAt: [73.5, 88.4, 23],
  rounds: [
    { hint: 'Hole einen Eimer Wasser für die Schafe.', buckets: 1 },
    { hint: 'Jetzt trinkt die ganze Herde: drei Eimer.', buckets: 3 }
  ]
}

/**
 * Etappe 5, "Morgenrot halten": das Flussufer bei Nacht (Etappenbild 5, von der App abgedunkelt und aufgehellt) mit einem sanften Licht (Bildauftrag J11); kein Gegner, keine Gestalt.
 * Runde 1 bleibt das Licht stehen (10 Sekunden Halten), Runde 2 wandert es das Ufer entlang (15 Sekunden). Lage und Weg des Lichts sind die Messwerte aus `halten/halten-messung.json` (Prozent des Etappenbildes 5, im Ufersand vor Jakobs Füßen, von links nach rechts).
 */
const HALTEN: HoldGame = {
  background: `${IMG}etappe-bild-05.webp`,
  spark: `${G}halten/funke.webp`,
  start: [22, 89],
  rounds: [
    { hint: 'Lege den Finger auf das Licht und halte es.', seconds: 10 },
    { hint: 'Jetzt wandert das Licht am Ufer: geh mit.', seconds: 15, path: [[22, 89], [29, 92], [36, 94], [43, 95], [50, 95], [57, 95], [64, 94], [71, 93]] }
  ]
}

export const jakob: Journey = {
  id: 'jakob',
  title: 'Jakob',
  subtitle: 'Ein Weg mit Umwegen',
  age: '8-10',
  downloadMb: 7, // 7,2 MB gezählt am 20.10.2026 (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Jakob und die Himmelsleiter (Treppe aus Steinen im Sternenlicht)
  // Geschenk-Ausmalbild: Jakob und die Himmelsleiter im Traum (Treppe aus Steinen, Sterne, Tiere der Herde schlafend, friedlich)
  gift: { title: 'Jakob und die Himmelsleiter im Traum', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 4944 × 821 px) mit Stationen und Perlenweg aus fertig/messdaten.json und jakobPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 4944 / 821,
    widthPx: 4944,
    stages: [
      { x: 0.1416, y: 0.6456, d: 0.0339 },
      { x: 0.2528, y: 0.6456, d: 0.0339 },
      { x: 0.3904, y: 0.6151, d: 0.0339 },
      { x: 0.5138, y: 0.5627, d: 0.0339 },
      { x: 0.7282, y: 0.609, d: 0.0339 },
      { x: 0.8212, y: 0.5968, d: 0.0339 }
    ],
    exam: { x: 0.981, y: 0.5847, d: 0.0339 },
    path: JAKOB_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Zwillinge',
      ref: '1. Mose 25,19–34',
      audio: `${REC}geschichte-01-v1.mp3`,
      text: [
        'Isaak, der Sohn, auf den Abraham so lange gewartet hatte, wurde selbst Vater. Er und seine Frau Rebekka warten lange auf ein Kind. Isaak betet zu Gott, und Rebekka bekommt Zwillinge.',
        'Der erste Junge ist rötlich und hat überall Haare. Sie nennen ihn Esau. Der zweite kommt gleich hinterher und hält die Ferse seines Bruders fest. Darum nennen sie ihn Jakob.',
        'Die beiden wachsen heran und sind sehr verschieden. Esau wird ein Jäger und ist am liebsten draußen auf dem Feld. Jakob ist ruhig und bleibt bei den Zelten. Isaak hat Esau besonders gern, und Rebekka hat Jakob besonders gern.',
        'Eines Tages kommt Esau müde und hungrig heim. Jakob kocht gerade ein Linsengericht. „Gib mir schnell von dem Roten da!“, sagt Esau. Jakob antwortet: „Dann gib mir dein Erstgeburtsrecht.“ Das ist der besondere Platz des Ältesten in der Familie. Esau schwört es ihm, isst und geht weg. Ihm war sein Erstgeburtsrecht nicht wichtig.'
      ],
      task: { kind: 'zaehlen', hint: 'Tippe die Schafe an und zähle sie.', count: 8, image: `${G}zaehlen/schaf.webp`, background: `${IMG}etappe-bild-01.webp` },
      questions: [
        { q: 'Wie heißen die Zwillinge von Isaak und Rebekka?', options: ['Esau und Jakob', 'Isaak und Lot', 'Kain und Abel'], answer: 0 },
        { q: 'Was gibt Esau für das Linsengericht her?', options: ['sein Erstgeburtsrecht', 'sein Zelt', 'seinen Bogen'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Der Segen',
      ref: '1. Mose 27,1–45 (gekürzt)',
      audio: `${REC}geschichte-02-v1.mp3`,
      text: [
        'Isaak ist alt geworden, und seine Augen sind so schwach, dass er kaum noch etwas sieht. Er ruft Esau: „Jage mir ein Wild und mach mir mein Lieblingsessen. Danach will ich dich segnen.“',
        'Rebekka hört es. Sie sagt zu Jakob: „Hol dir den Segen an Esaus Stelle!“ Jakob zögert, aber er tut es. Er zieht Esaus Kleider an und legt sich Ziegenfell auf Hände und Hals, damit er wie sein Bruder anfühlt. Dann bringt er dem Vater das Essen.',
        '„Bist du wirklich Esau?“, fragt Isaak. Er spürt das Fell und riecht die Kleider. „Ja“, sagt Jakob. Das ist nicht wahr. Isaak glaubt es und segnet ihn.',
        'Kaum ist Jakob gegangen, kommt Esau zurück. Isaak erschrickt, als er merkt, was geschehen ist. Esau ist traurig und enttäuscht: „Segne mich auch!“ Aber der Segen ist gegeben. Esau ist zornig auf seinen Bruder.',
        'Rebekka schickt Jakob darum zu ihrem Bruder Laban nach Haran, weit weg. Jakob packt sein Bündel und geht. Er hat seinen Vater getäuscht, und das hat Folgen: Er muss sein Zuhause verlassen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer ist alt und kann kaum noch sehen?', options: ['Isaak', 'Laban', 'Esau'], answer: 0 },
        { q: 'Was legt sich Jakob auf Hände und Hals?', options: ['Ziegenfell', 'Mehl', 'Lehm'], answer: 0 },
        { q: 'Wohin schickt Rebekka Jakob?', options: ['zu ihrem Bruder Laban', 'zu Esau', 'ans Meer'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Die Himmelsleiter',
      ref: '1. Mose 28,10–22',
      audio: `${REC}geschichte-03-v1.mp3`,
      text: [
        'Jakob ist allein unterwegs nach Haran. Als es dunkel wird, bleibt er an einem einsamen Ort. Er nimmt einen Stein als Kopfkissen und legt sich schlafen.',
        'Da träumt er: Eine Treppe steht auf der Erde, und ihre Spitze reicht bis an den Himmel. Sie leuchtet in der Nacht. Boten Gottes gehen auf ihr auf und ab.',
        'Oben spricht Gott zu ihm: „Ich bin der Gott deiner Vorfahren Abraham und Isaak. Das Land, auf dem du liegst, will ich dir und deinen Nachkommen geben. Ich bin bei dir und behüte dich, wohin du auch gehst. Ich bringe dich wieder in dieses Land zurück und verlasse dich nicht.“',
        'Jakob wacht auf. „Gott ist an diesem Ort“, sagt er, „und ich habe es nicht gewusst!“ Am Morgen stellt er den Stein als Zeichen auf und gießt Öl darüber. Er nennt den Ort Bethel, das bedeutet „Haus Gottes“. Dann geht er weiter.'
      ],
      task: { kind: 'schieben', hint: 'Schiebe die Kacheln, bis die Treppe zum Himmel wieder ganz ist.', slide: SCHIEBEN },
      questions: [
        { q: 'Was nimmt Jakob als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
        { q: 'Wie nennt Jakob den Ort?', options: ['Bethel', 'Haran', 'Mamre'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Bei Laban',
      ref: '1. Mose 29,1–30 (gekürzt)',
      audio: `${REC}geschichte-04-v1.mp3`,
      text: [
        'Jakob kommt in das Land seiner Verwandten. Auf einem Feld sieht er einen Brunnen, den ein großer Stein verschließt. Hirten mit ihren Schafen warten dort. „Kennt ihr Laban?“, fragt Jakob. „Ja“, sagen sie, „da kommt seine Tochter Rahel mit den Schafen!“',
        'Jakob wälzt den Stein vom Brunnen und tränkt Labans Schafe. Er sagt Rahel, dass er der Sohn ihrer Tante Rebekka ist. Rahel läuft nach Hause, und Laban eilt herbei und nimmt Jakob freundlich auf.',
        'Jakob arbeitet bei Laban. Rahel hat er besonders lieb. „Ich arbeite sieben Jahre für dich“, sagt er zu Laban, „wenn ich dafür Rahel heiraten darf.“ Die sieben Jahre kommen ihm vor wie wenige Tage, so lieb hat er sie.',
        'Doch am Hochzeitstag führt Laban nicht Rahel, sondern ihre ältere Schwester Lea zu ihm. „Bei uns heiratet die Ältere zuerst“, sagt Laban. Jakob arbeitet noch einmal sieben Jahre, und dann darf er auch Rahel heiraten. So bleibt er viele Jahre bei Laban.'
      ],
      task: { kind: 'kurbel', hint: 'Drehe die Kurbel mit dem Finger im Kreis.', crank: KURBEL },
      questions: [
        { q: 'Wen trifft Jakob am Brunnen?', options: ['Rahel', 'Lea', 'Rebekka'], answer: 0 },
        { q: 'Wie viele Jahre arbeitet Jakob zuerst für Rahel?', options: ['sieben', 'zwei', 'zwanzig'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Der Kampf am Fluss',
      ref: '1. Mose 32,23–32',
      audio: `${REC}geschichte-05-v1.mp3`,
      text: [
        'Viele Jahre später zieht Jakob mit seiner großen Familie und seinen Herden zurück in das Land, das Gott ihm versprochen hat. Er hört, dass Esau ihm mit vielen Männern entgegenkommt. Jakob hat Angst, ob sein Bruder noch zornig ist. Er schickt Geschenke aus seinen Herden voraus.',
        'In der Nacht bringt er seine Familie und alles, was er hat, über den Fluss Jabbok. Er selbst bleibt allein auf der anderen Seite zurück.',
        'Da ringt ein Mann mit ihm, bis der Morgen anbricht. Als es hell wird, sagt der Mann: „Lass mich los!“ Jakob antwortet: „Ich lasse dich nicht, es sei denn, du segnest mich.“',
        '„Wie heißt du?“, fragt der Mann. „Jakob“, antwortet er. „Du sollst nicht mehr Jakob heißen, sondern Israel. Denn du hast mit Gott und mit Menschen gerungen und nicht aufgegeben.“ Er segnet Jakob dort.',
        'Jakob nennt den Ort Pnuël. „Ich habe Gott gesehen“, sagt er, „und ich lebe noch.“ Die Sonne geht auf. Jakob geht weiter und hinkt, denn seine Hüfte tut ihm weh.'
      ],
      task: { kind: 'halten', hint: 'Halte das Licht fest, bis der Morgen kommt.', hold: HALTEN },
      questions: [
        { q: 'An welchem Fluss ist Jakob in dieser Nacht?', options: ['Jabbok', 'Jordan', 'Nil'], answer: 0 },
        { q: 'Wie nennt der Mann Jakob am Morgen?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Wiedersehen',
      ref: '1. Mose 33,1–11',
      audio: `${REC}geschichte-06-v1.mp3`,
      text: [
        'Am Morgen sieht Jakob Esau kommen, mit vielen Männern. Jakob stellt seine Familie in eine Reihe. Er selbst geht voran, verneigt sich vor seinem Bruder und noch einmal, siebenmal bis zur Erde.',
        'Da läuft Esau ihm entgegen! Er fällt Jakob um den Hals und küsst ihn. Beide weinen vor Freude.',
        '„Wer sind die Frauen und Kinder?“, fragt Esau. „Das sind die Kinder, die Gott mir geschenkt hat“, sagt Jakob. Alle kommen heran und verneigen sich.',
        'Dann zeigt Jakob auf die Herden. „Das ist mein Geschenk für dich“, sagt er. „Ich habe genug, behalte, was du hast“, sagt Esau. Aber Jakob bittet: „Nimm es doch! Dein Gesicht zu sehen ist, als sähe ich Gottes Gesicht, so freundlich hast du mich empfangen.“ Da nimmt Esau das Geschenk an. Gott war bei Jakob, wie er es versprochen hatte.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Wiedersehen zusammen.', puzzle: { image: `${G}puzzle/wiedersehen.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was tut Esau, als er Jakob sieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er läuft weg.', 'Er schickt ihn fort.'], answer: 0 },
        { q: 'Was bringt Jakob seinem Bruder mit?', options: ['Tiere als Geschenk', 'ein Schwert', 'ein Zelt'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Wie heißen die Zwillinge von Isaak und Rebekka?', options: ['Esau und Jakob', 'Isaak und Lot', 'Kain und Abel'], answer: 0 },
    { q: 'Was legt sich Jakob auf die Hände, damit der Vater ihn für Esau hält?', options: ['Ziegenfell', 'Mehl', 'Lehm'], answer: 0 },
    { q: 'Was nimmt Jakob in der Nacht als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
    { q: 'Wen trifft Jakob am Brunnen?', options: ['Rahel', 'Lea', 'Rebekka'], answer: 0 },
    { q: 'Wie heißt Jakob nach dieser Nacht am Fluss?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 },
    { q: 'Was tut Esau, als er Jakob wiedersieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er läuft weg.', 'Er schickt ihn fort.'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(jakob, jakobEn)
