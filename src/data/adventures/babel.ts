/**
 * Abenteuer "Der Turm von Babel" (1. Mose 11,1–9) für 8 bis 10 Jahre: 6 Etappen, Untertitel "Eine Stadt und ein Turm". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Babel/ENTWURF_Babel.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Alle fünf Spiele dieses Abenteuers sind neu (keines in Josef, Noah oder Adam und Eva), Etappe 5 ist nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/babel/, images/abenteuer/spiele/babel/<spiel>/, audio/abenteuer/babel/.
 *
 * STAND: Etappen noch `soon` (nicht spielbar), bis die Bilder (Panorama, Etappenbilder, Medaille, Spielbilder) und die Vorlese-Aufnahmen eingebaut sind.
 * Zahlen, die aus Messdateien der Bilder kommen, sind mit PLATZHALTER markiert und werden beim Einbau durch die gemessenen ersetzt.
 */
import type { ChainGame, Journey, MissingGame, StackGame, TraceGame, WipeGame } from '@/types/adventure'
import { BABEL_PATH } from './babelPath'
import { localize } from './localize'
import { babelEn } from './en/babel.en'

const IMG = 'images/abenteuer/babel/'
const G = 'images/abenteuer/spiele/babel/'
const REC = 'audio/abenteuer/babel/'
/** Alle Etappen sind noch nicht spielbar; beim Einbau der Bilder und Töne auf `false` setzen. */
const SOON = true

/**
 * Etappe 1, "Wer fehlt im Zug?": eine Reihe von Menschen vor dem Etappenbild 1, eine Staubwolke zieht vorbei, jemand fehlt (Bildauftrag B10).
 * PLATZHALTER: die sechs Plätze (Fußpunkte, Prozent des Etappenbildes) kommen aus `fehlt/fehlt-messung.json`.
 */
const FEHLT: MissingGame = {
  background: `${IMG}etappe-bild-01.webp`,
  cloud: `${G}fehlt/wolke.webp`,
  people: [
    { id: 'mensch-1', image: `${G}fehlt/mensch-1.webp`, label: 'Mann mit blauem Kopftuch' },
    { id: 'mensch-2', image: `${G}fehlt/mensch-2.webp`, label: 'Frau mit ockerfarbenem Tuch und Wasserkrug' },
    { id: 'mensch-3', image: `${G}fehlt/mensch-3.webp`, label: 'Kind mit rotem Tuch' },
    { id: 'mensch-4', image: `${G}fehlt/mensch-4.webp`, label: 'Mann mit großem Bündel' },
    { id: 'mensch-5', image: `${G}fehlt/mensch-5.webp`, label: 'Frau mit Korb' },
    { id: 'mensch-6', image: `${G}fehlt/mensch-6.webp`, label: 'Mädchen mit Zopf' }
  ],
  slots: [[14, 84], [28, 84], [42, 84], [56, 84], [70, 84], [84, 84]],
  rounds: [
    {
      hint: 'Vier Menschen ziehen. Wer ist weg, wenn die Staubwolke vorbei ist?',
      tasks: [
        { row: ['mensch-1', 'mensch-2', 'mensch-3', 'mensch-4'], gone: ['mensch-3'] },
        { row: ['mensch-5', 'mensch-2', 'mensch-6', 'mensch-1'], gone: ['mensch-2'] },
        { row: ['mensch-4', 'mensch-6', 'mensch-3', 'mensch-5'], gone: ['mensch-5'] }
      ]
    },
    {
      hint: 'Jetzt fehlen zwei.',
      tasks: [
        { row: ['mensch-1', 'mensch-2', 'mensch-3', 'mensch-4', 'mensch-5', 'mensch-6'], gone: ['mensch-2', 'mensch-5'] },
        { row: ['mensch-6', 'mensch-4', 'mensch-2', 'mensch-1', 'mensch-3', 'mensch-5'], gone: ['mensch-4', 'mensch-3'] },
        { row: ['mensch-3', 'mensch-5', 'mensch-1', 'mensch-6', 'mensch-2', 'mensch-4'], gone: ['mensch-1', 'mensch-6'] }
      ]
    }
  ]
}

/**
 * Etappe 2, "Ziegelkette": Bauleute reichen Ziegel und Pechtöpfe vom Ofen zum Stapel (Bildauftrag B11, Hintergrund Etappenbild 2).
 * PLATZHALTER: Ofen, Plätze und Stapel kommen aus `kette/kette-messung.json`.
 */
const KETTE: ChainGame = {
  background: `${IMG}etappe-bild-02.webp`,
  worker: `${G}kette/bauarbeiter.webp`,
  brick: `${G}kette/ziegel.webp`,
  pitch: `${G}kette/pechtopf.webp`,
  rounds: [
    {
      hint: 'Tippe den, der etwas in den Händen hält, er reicht es weiter.',
      people: 3,
      items: ['brick', 'brick', 'brick', 'brick'],
      slots: [[38, 76], [54, 76], [70, 76]],
      source: [24, 66],
      sink: [86, 80]
    },
    {
      hint: 'Jetzt kommen auch Pechtöpfe, und eine Person mehr hilft.',
      people: 4,
      items: ['brick', 'pitch', 'brick', 'brick', 'pitch', 'pitch', 'brick', 'pitch'],
      slots: [[34, 76], [48, 76], [62, 76], [76, 76]],
      source: [22, 66],
      sink: [89, 80]
    }
  ]
}

/** Etappe 3, "Stufenturm stapeln": ein Lehmziegelblock gleitet am Balken hin und her, ein Tipp setzt ihn auf die Stufe (Bildauftrag B12, Hintergrund Etappenbild 3). */
const STAPELN: StackGame = {
  background: `${IMG}etappe-bild-03.webp`,
  block: `${G}stapeln/stufe.webp`,
  beam: `${G}stapeln/balken.webp`,
  rounds: [
    { hint: 'Tippe, wenn der Block über der Stufe ist.', layers: 4, baseWidth: 52, shrink: 0.08, speed: 0.18 },
    { hint: 'Die Stufen werden schmaler.', layers: 4, baseWidth: 36, shrink: 0.1, speed: 0.26 }
  ]
}

/** Etappe 4, "Nebel wegwischen": Abendnebel über dem Etappenbild 4 (Bildauftrag B13); Runde 1 der Turm (obere Mitte), Runde 2 die Stadt (untere Hälfte). */
const WISCHEN: WipeGame = {
  background: `${IMG}etappe-bild-04.webp`,
  mist: `${G}wischen/nebel.webp`,
  rounds: [
    { hint: 'Wische den Nebel vom Turm.', region: { x: 28, y: 4, w: 44, h: 50 } },
    { hint: 'Jetzt die Stadt.', region: { x: 4, y: 52, w: 92, h: 44 } }
  ]
}

/**
 * Etappe 6, "Wege nachfahren": Wege führen vom unfertigen Turm in die Ebene (Bildauftrag B14); Runde 1 zwei fast gerade Wege, Runde 2 vier geschwungene.
 * PLATZHALTER: die Linien (8 bis 12 Punkte je Weg) und die halbe Wegbreite kommen aus `spur/wege-messung.json`.
 */
const SPUR: TraceGame = {
  scene: `${G}spur/wege.webp`,
  walker: `${G}spur/wanderer.webp`,
  rounds: [
    {
      hint: 'Fahre die beiden Wege nach.',
      paths: [
        { id: 'berge', points: [[54, 50], [60, 49], [66, 48], [72, 47], [78, 45], [84, 43], [90, 40]], r: 4, goal: 'berge' },
        { id: 'fluss', points: [[46, 50], [40, 51], [34, 52], [28, 54], [22, 56], [16, 59], [10, 62]], r: 4, goal: 'fluss' }
      ]
    },
    {
      hint: 'Jetzt vier Wege in alle Richtungen.',
      paths: [
        { id: 'berge', points: [[53, 47], [58, 42], [62, 36], [67, 30], [72, 25], [77, 20], [82, 16]], r: 3, goal: 'berge' },
        { id: 'fluss', points: [[47, 47], [42, 42], [38, 36], [32, 31], [27, 26], [22, 21], [17, 17]], r: 3, goal: 'fluss' },
        { id: 'palmen', points: [[53, 54], [58, 59], [63, 64], [69, 68], [75, 72], [81, 75], [87, 78]], r: 3, goal: 'palmen' },
        { id: 'huegel', points: [[47, 54], [42, 59], [36, 64], [30, 68], [24, 72], [18, 75], [12, 78]], r: 3, goal: 'huegel' }
      ]
    }
  ]
}

export const babel: Journey = {
  id: 'babel',
  title: 'Der Turm von Babel',
  subtitle: 'Eine Stadt und ein Turm',
  age: '8-10',
  downloadMb: 1, // beim Einbau neu zählen (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Der Turm (Stufenturm aus Lehmziegeln) in der Ebene im Morgenlicht
  // Geschenk-Ausmalbild: der Turm aus Ziegeln mit vielen Bauleuten bei Sonnenaufgang (unvollendet, friedlich)
  gift: { title: 'Der Turm aus Ziegeln', image: `${IMG}geschenk.webp` },
  // noch keine gemalte Karte (images leer): die Reise zeigt sich als Liste; Stationen und Perlenweg kommen mit dem Panorama
  map: {
    images: [],
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 1,
    stages: [],
    exam: { x: 0, y: 0, d: 0 },
    path: BABEL_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Eine Sprache',
      ref: '1. Mose 11,1–2',
      audio: `${REC}geschichte-01-v1.mp3`,
      text: [
        'Nach der großen Flut leben wieder viele Menschen auf der Erde. Sie alle sprechen dieselbe Sprache. Wenn einer etwas ruft, versteht ihn jeder, und jedes Wort bedeutet für alle dasselbe.',
        'Eines Tages brechen die Menschen auf und ziehen gemeinsam weiter, Familien mit ihren Kindern, mit Tieren und Bündeln. Sie reden und lachen unterwegs, und keiner muss den anderen fragen, was er meint.',
        'Schließlich finden sie eine weite, flache Ebene im Land Schinar. So viel Platz gibt es hier, dass alle nebeneinander wohnen können. Sie lassen sich dort nieder.'
      ],
      task: { kind: 'fehlt', hint: 'Schau gut hin: Wer fehlt im Zug?', missing: FEHLT },
      questions: [
        { q: 'Welche Sprache sprechen die Menschen am Anfang?', options: ['alle dieselbe', 'jede Familie eine andere', 'gar keine'], answer: 0 },
        { q: 'Was finden die Menschen im Land Schinar?', options: ['eine weite Ebene', 'einen hohen Berg', 'einen tiefen Wald'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Ziegel und Pech',
      ref: '1. Mose 11,3',
      audio: `${REC}geschichte-02-v1.mp3`,
      text: [
        'In der Ebene liegen keine großen Steine herum, aber es gibt Lehm. Die Menschen sagen zueinander: „Kommt, wir formen Ziegel und brennen sie im Feuer!“',
        'Sie graben den Lehm aus dem Boden und drücken ihn in Formen aus Holz. Sie lassen ihn in der Sonne trocknen und brennen die Ziegel im Ofen, bis sie hart sind. Bald liegen ganze Stapel davon in der Ebene.',
        'Statt Steinen bauen sie mit diesen Ziegeln. Und statt Mörtel nehmen sie Pech, schwarz und klebrig, das die Ziegel fest zusammenhält. Alle packen mit an, und alle verstehen einander. Was einer vorschlägt, das tun die anderen.'
      ],
      task: { kind: 'kette', hint: 'Reiche Ziegel und Pech von Hand zu Hand zum Stapel.', chain: KETTE },
      questions: [
        { q: 'Was machen die Menschen mit den Ziegeln, damit sie hart werden?', options: ['Sie brennen sie.', 'Sie malen sie an.', 'Sie schneiden sie.'], answer: 0 },
        { q: 'Wie arbeiten die Menschen?', options: ['gemeinsam', 'jeder allein', 'gar nicht'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Eine Stadt mit einem Turm',
      ref: '1. Mose 11,4',
      audio: `${REC}geschichte-03-v1.mp3`,
      text: [
        'Die Menschen wollen mehr als nur ein paar Häuser. „Kommt“, sagen sie, „wir bauen eine Stadt und einen Turm, dessen Spitze bis an den Himmel reicht!“',
        'Sie wollen sich damit einen Namen machen, damit alle von ihnen sprechen. Und sie wollen zusammenbleiben und nicht über die ganze Erde zerstreut werden.',
        'Dann beginnt der Bau. Tag für Tag tragen sie Ziegel herbei und stapeln sie auf. Stufe um Stufe wächst der Turm in die Höhe, und rundherum entstehen Häuser und Gassen. Die Menschen schauen zu ihm hinauf.'
      ],
      task: { kind: 'stapeln', hint: 'Setze die Stufen des Turms Stück für Stück.', stack: STAPELN },
      questions: [
        { q: 'Wie hoch soll der Turm reichen?', options: ['bis an den Himmel', 'bis zur Stadtmauer', 'bis zum Meer'], answer: 0 },
        { q: 'Was wollen sich die Menschen mit dem Bau machen?', options: ['einen Namen', 'einen Schatz', 'einen Garten'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Gott sieht den Bau',
      ref: '1. Mose 11,5–6',
      audio: `${REC}geschichte-04-v1.mp3`,
      text: [
        'Der Turm ragt hoch über die Häuser der Stadt. Da kommt Gott herab, um sich anzusehen, was die Menschen dort bauen: die Stadt und den Turm.',
        'Gott sieht: Es ist ein Volk, und alle sprechen dieselbe Sprache. Das ist erst der Anfang von dem, was sie tun. Wenn sie so weitermachen, wird ihnen nichts unmöglich sein, was sie sich vornehmen.',
        'Unten in der Stadt wird es Abend. Die Menschen arbeiten noch eine Weile und rufen einander zu.'
      ],
      task: { kind: 'wischen', hint: 'Wische den Nebel weg, damit man Turm und Stadt sieht.', wipe: WISCHEN },
      questions: [
        { q: 'Wer kommt herab, um die Stadt und den Turm anzusehen?', options: ['Gott', 'ein Engel', 'der König'], answer: 0 },
        { q: 'Was sieht Gott über die Menschen?', options: ['Sie sind ein Volk und sprechen dieselbe Sprache.', 'Sie streiten sich.', 'Sie sind schon fertig.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Viele Sprachen',
      ref: '1. Mose 11,7–8',
      audio: `${REC}geschichte-05-v1.mp3`,
      text: [
        'Gott sagt: „Ich will hinabgehen und ihre Sprache verwirren, damit keiner mehr den anderen versteht.“',
        'Und so geschieht es. Ein Mann ruft seinem Nachbarn etwas zu, aber der versteht ihn nicht. Er hört fremde Wörter. Die Bauleute fragen und zeigen auf die Ziegel, sie schütteln die Köpfe, aber keiner begreift den anderen.',
        'Nun können sie nicht mehr gemeinsam planen und nicht mehr gemeinsam bauen. So zerstreut Gott die Menschen von dort über die ganze Erde. Sie packen ihre Bündel und ziehen auf vielen Wegen davon. Die Stadt bauen sie nicht fertig.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was verwirrt Gott?', options: ['ihre Sprache', 'ihre Wege', 'ihre Ziegel'], answer: 0 },
        { q: 'Wohin verteilt Gott die Menschen?', options: ['über die ganze Erde', 'in die Stadt', 'auf den Turm'], answer: 0 },
        { q: 'Was geschieht mit dem Bau der Stadt?', options: ['Sie hören auf zu bauen.', 'Sie bauen noch schneller.', 'Sie bauen einen zweiten Turm.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Der Name Babel',
      ref: '1. Mose 11,9',
      audio: `${REC}geschichte-06-v1.mp3`,
      text: [
        'Darum bekommt die Stadt den Namen Babel. Das erinnert an das Wort für „verwirren“, denn dort hat Gott die Sprache aller Menschen verwirrt.',
        'Von dort zerstreut Gott die Menschen über die ganze Erde. Auf vielen Wegen gehen sie auseinander, Familien mit ihren Kindern, mit Tieren und Bündeln, jede Gruppe in ihre eigene Richtung.',
        'Hinter ihnen bleibt die Ebene mit der Stadt und dem Turm. Er steht unfertig im Morgenlicht. So kommen Menschen in alle Länder der Erde, und aus den vielen Familien werden viele Völker.'
      ],
      task: { kind: 'spur', hint: 'Fahre die Wege mit dem Finger nach.', trace: SPUR },
      questions: [
        { q: 'Wie heißt die Stadt?', options: ['Babel', 'Eden', 'Schinar'], answer: 0 },
        { q: 'Woran erinnert der Name Babel?', options: ['an das Wort für „verwirren“', 'an das Wort für „Ziegel“', 'an das Wort für „Turm“'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Welche Sprache sprechen die Menschen am Anfang?', options: ['alle dieselbe', 'jede Familie eine andere', 'gar keine'], answer: 0 },
    { q: 'Was nehmen die Menschen statt Mörtel?', options: ['Pech', 'Wasser', 'Stroh'], answer: 0 },
    { q: 'Wie hoch soll der Turm reichen?', options: ['bis an den Himmel', 'bis zur Stadtmauer', 'bis zum Meer'], answer: 0 },
    { q: 'Wer kommt herab, um die Stadt und den Turm anzusehen?', options: ['Gott', 'ein Engel', 'der König'], answer: 0 },
    { q: 'Was geschieht, als Gott die Sprache verwirrt?', options: ['Die Menschen verstehen einander nicht mehr.', 'Die Menschen werden still.', 'Die Menschen bauen schneller.'], answer: 0 },
    { q: 'Wie heißt die Stadt am Ende?', options: ['Babel', 'Eden', 'Schinar'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(babel, babelEn)
