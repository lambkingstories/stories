/**
 * Abenteuer "Der Turm von Babel" (1. Mose 11,1–9) für 8 bis 10 Jahre: 6 Etappen, Untertitel "Eine Stadt und ein Turm". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Babel/ENTWURF_Babel.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Alle fünf Spiele dieses Abenteuers sind neu (keines in Josef, Noah oder Adam und Eva), Etappe 5 ist nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/babel/, images/abenteuer/spiele/babel/<spiel>/, audio/abenteuer/babel/.
 *
 * STAND 20.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte und Vorlese-Aufnahmen (Deutsch und Englisch) sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { ChainGame, Journey, MissingGame, StackGame, TraceGame, WipeGame } from '@/types/adventure'
import { BABEL_PATH } from './babelPath'
import { localize } from './localize'
import { babelEn } from './en/babel.en'

const IMG = 'images/abenteuer/babel/'
const G = 'images/abenteuer/spiele/babel/'
const REC = 'audio/abenteuer/babel/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Wer fehlt im Zug?": eine Reihe von Menschen vor dem Etappenbild 1, eine Staubwolke zieht vorbei, jemand fehlt (Bildauftrag B10).
 * Die sechs Plätze (Fußpunkte, Prozent des Etappenbildes 1, Figurenbreite 14 %) sind die Messwerte aus `fehlt/fehlt-messung.json`. Der Hintergrund wird im Spiel unscharf und heller gezeichnet
 * (das Etappenbild ist selbst voller Menschen). Der Junge (Figur 3) steht auf 80 % verkleinert; es gibt nur ein Kind (das Zopfmädchen hat der Bildgenerator abgelehnt, Figur 6 ist eine junge Frau).
 */
const FEHLT: MissingGame = {
  background: `${IMG}etappe-bild-01.webp`,
  cloud: `${G}fehlt/wolke.webp`,
  people: [
    { id: 'mensch-1', image: `${G}fehlt/mensch-1.webp`, label: 'Mann mit blauem Kopftuch' },
    { id: 'mensch-2', image: `${G}fehlt/mensch-2.webp`, label: 'Frau mit ockerfarbenem Tuch und Wasserkrug' },
    { id: 'mensch-3', image: `${G}fehlt/mensch-3.webp`, label: 'Junge mit rotem Tuch', scale: 0.8 },
    { id: 'mensch-4', image: `${G}fehlt/mensch-4.webp`, label: 'Mann mit olivgrünem Tuch und großem Bündel' },
    { id: 'mensch-5', image: `${G}fehlt/mensch-5.webp`, label: 'Frau in Blau mit Korb' },
    { id: 'mensch-6', image: `${G}fehlt/mensch-6.webp`, label: 'junge Frau mit Zopf' }
  ],
  personWidth: 14,
  slots: [[14, 91], [28.5, 91], [43, 91], [57.5, 91], [72, 91], [86.5, 91]],
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
 * Ofen (Mund des linken Brennofens), Plätze (Fußpunkte, Figurenbreite 16 %) und Stapel sind die Messwerte aus `kette/kette-messung.json` (Prozent des Etappenbildes 2; die Plätze sind gegenüber
 * dem ersten Messwert des Bildgenerators verschoben). Der Hintergrund wird im Spiel unscharf gezeichnet, weil das Etappenbild sehr voll ist.
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
      slots: [[30, 94], [46, 94], [62, 94]],
      source: [48.5, 25.5],
      sink: [90.6, 80]
    },
    {
      hint: 'Jetzt kommen auch Pechtöpfe, und eine Person mehr hilft.',
      people: 4,
      items: ['brick', 'pitch', 'brick', 'brick', 'pitch', 'pitch', 'brick', 'pitch'],
      slots: [[30, 94], [46, 94], [62, 94], [78, 94]],
      source: [48.5, 25.5],
      sink: [90.6, 80]
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

/**
 * Etappe 4, "Nebel wegwischen": Abendnebel über dem Etappenbild 4 (Bildauftrag B13); Runde 1 der Turm, Runde 2 die Menschen im Vordergrund (Prozent des Etappenbildes, am Bild gemessen:
 * `wischen/wischen-messung.json`; die Stadt mit Gassen gibt es im Bild nicht). Der Nebel ist die voll deckende Fassung (`nebel-deckend`), die die Bild-Sitzung aus dem gemalten Nebel auf
 * eine einfarbige warme Fläche gerechnet hat, weil der gemalte Nebel nur zu 96 % deckte.
 */
const WISCHEN: WipeGame = {
  background: `${IMG}etappe-bild-04.webp`,
  mist: `${G}wischen/nebel-deckend.webp`,
  rounds: [
    { hint: 'Wische den Nebel vom Turm.', region: { x: 24, y: 5, w: 53, h: 50 } },
    { hint: 'Jetzt die Menschen.', region: { x: 14, y: 40, w: 80, h: 58 } }
  ]
}

/**
 * Etappe 6, "Wegen nachfahren": vier Wege führen vom unfertigen Turm in die Ebene (Bildauftrag B14, Fassung B: ein Bild mit allen vier Wegen); Runde 1 zwei Wege (die zwei unteren, breiten),
 * Runde 2 alle vier. Die Wegpunkte (Prozent des Bildes, vom Turm zum Ziel) sind die Messwerte aus `spur/wege-b-messung.json`, die Wegbreite `r` ist für die schmalste Stelle gemessen und für Kinderfinger
 * auf mindestens 2,5 % der Bildbreite erhöht.
 */
const SPUR: TraceGame = {
  scene: `${G}spur/wege-b.webp`,
  walker: `${G}spur/wanderer.webp`,
  rounds: [
    {
      hint: 'Fahre die beiden Wege nach.',
      paths: [
        { id: 'palmen', points: [[38, 50.5], [33, 52], [27, 54], [23.5, 57], [23.5, 60], [26, 64], [29, 68], [30, 72], [29, 76], [25, 79.5], [20, 81.5]], r: 3, goal: 'palmen' },
        { id: 'huegel', points: [[63, 51], [69, 53], [75, 55.5], [79, 58.5], [80, 62], [78, 65], [75, 68], [73.5, 71], [75, 74], [79, 77], [84, 79]], r: 3, goal: 'huegel' }
      ]
    },
    {
      hint: 'Jetzt vier Wege in alle Richtungen.',
      paths: [
        { id: 'berge', points: [[38, 41], [34, 39], [32.5, 36], [33, 33], [34, 30], [32, 27.5], [27, 25.5], [21, 23.5], [17, 21.5], [17, 19.5], [20, 17.5], [21, 16]], r: 2.5, goal: 'berge' },
        { id: 'fluss', points: [[63, 43], [69, 42], [74, 40], [75, 37], [75, 34], [77, 31.5], [82, 29.5], [85, 27.5], [86, 25.5], [85, 24.5]], r: 2.5, goal: 'fluss' },
        { id: 'palmen', points: [[38, 50.5], [33, 52], [27, 54], [23.5, 57], [23.5, 60], [26, 64], [29, 68], [30, 72], [29, 76], [25, 79.5], [20, 81.5]], r: 3, goal: 'palmen' },
        { id: 'huegel', points: [[63, 51], [69, 53], [75, 55.5], [79, 58.5], [80, 62], [78, 65], [75, 68], [73.5, 71], [75, 74], [79, 77], [84, 79]], r: 3, goal: 'huegel' }
      ]
    }
  ]
}

export const babel: Journey = {
  id: 'babel',
  title: 'Der Turm von Babel',
  subtitle: 'Eine Stadt und ein Turm',
  age: '8-10',
  downloadMb: 11, // gut 10,5 MB gezählt nach der neuen Karte (vier Stücke zusammen 4,7 MB) am 20.10.2026 (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Der Turm (Stufenturm aus Lehmziegeln) in der Ebene im Morgenlicht
  // Geschenk-Ausmalbild: der Turm aus Ziegeln mit vielen Bauleuten bei Sonnenaufgang (unvollendet, friedlich)
  gift: { title: 'Der Turm aus Ziegeln', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v2) mit Stationen und Perlenweg aus fertig/messdaten.json und babelPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v2-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.1262, y: 0.5218, d: 0.0339 },
      { x: 0.2442, y: 0.5461, d: 0.0339 },
      { x: 0.3987, y: 0.54, d: 0.0339 },
      { x: 0.5702, y: 0.6129, d: 0.0339 },
      { x: 0.7418, y: 0.5461, d: 0.0339 },
      { x: 0.8528, y: 0.534, d: 0.0339 }
    ],
    exam: { x: 0.9538, y: 0.534, d: 0.0339 },
    path: BABEL_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Eine Sprache',
      ref: '1. Mose 11,1–2',
      audio: `${REC}geschichte-01-v2.mp3`,
      text: [
        'Seit der großen Flut sind viele Jahre vergangen. Aus Noahs Familie sind immer mehr Menschen geworden, und noch immer sprechen sie alle dieselbe Sprache. Wenn einer etwas ruft, versteht ihn jeder, und jedes Wort bedeutet für alle dasselbe.',
        'Eines Tages brechen sie auf und ziehen miteinander weiter, die Großen und die Kleinen, Familien mit ihren Kindern, mit Eseln und Schafen und schweren Bündeln auf dem Rücken. Unterwegs erzählen sie und lachen und singen, und keiner muss den anderen fragen, was er meint.',
        'Schließlich erreichen sie eine weite, flache Ebene im Land Schinar. So viel Platz gibt es hier, dass alle nebeneinander wohnen können, und so lassen sie sich dort nieder.'
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
      audio: `${REC}geschichte-02-v2.mp3`,
      text: [
        'In der Ebene von Schinar liegen keine großen Steine herum, aber es gibt reichlich Lehm. Da haben die Menschen eine gute Idee. „Kommt“, sagen sie zueinander, „wir formen Ziegel und brennen sie im Feuer!“',
        'Gleich gehen sie an die Arbeit. Sie graben den Lehm aus dem Boden, kneten ihn und drücken ihn in Formen aus Holz. Dann lassen sie die Ziegel erst in der Sonne trocknen und brennen sie anschließend im Ofen, bis sie hart und fest sind. Bald liegen ganze Stapel davon in der Ebene.',
        'Von nun an bauen sie mit Ziegeln statt mit Steinen. Und statt Mörtel nehmen sie Pech, das schwarz und klebrig ist und die Ziegel fest zusammenhält. Es ist viel zu tun, aber alle packen gemeinsam mit an, und weil sie einander verstehen, geht ihnen die Arbeit leicht von der Hand. Was einer vorschlägt, das setzen die anderen sofort um.'
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
      audio: `${REC}geschichte-03-v2.mp3`,
      text: [
        'Als die ersten Häuser stehen, haben die Menschen einen neuen Plan. „Kommt“, rufen sie, „wir bauen uns eine Stadt und einen Turm, dessen Spitze bis an den Himmel reicht!“',
        'Sie wollen sich damit einen Namen machen, damit alle von ihnen sprechen und jeder sieht, wie groß und stark sie sind. Und sie wollen auf keinen Fall zerstreut werden, sondern für immer beisammenbleiben. Dabei hat Gott den Menschen nach der Flut gesagt, sie sollen sich über die Erde ausbreiten. Aber die Menschen in Schinar haben etwas anderes vor.',
        'Dann beginnt der Bau. Tag für Tag tragen sie Ziegel herbei und stapeln sie aufeinander, und Stufe um Stufe wächst der Turm in die Höhe. Rundherum entstehen Häuser und Gassen, und wer vorbeikommt, bleibt stehen und schaut zu dem Turm hinauf.'
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
      audio: `${REC}geschichte-04-v2.mp3`,
      text: [
        'Der Turm ragt schon hoch über die Dächer der Stadt, und die Menschen sind stolz auf ihr Werk. Da kommt Gott herab, um sich die Stadt und den Turm anzusehen, die die Menschen bauen.',
        'Gott sieht: Es ist ein einziges Volk, und alle sprechen dieselbe Sprache. Gott sieht auch, was sie vorhaben, nämlich sich einen großen Namen zu machen und niemals auseinanderzugehen. Und das ist erst der Anfang von dem, was sie tun. Wenn sie so weitermachen, wird ihnen bald nichts mehr unmöglich sein, was sie sich vornehmen.',
        'Unten in der Stadt wird es Abend. Die Menschen arbeiten noch eine Weile und rufen einander zu, und keiner von ihnen ahnt, dass Gott zu ihnen herabgekommen ist.'
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
      audio: `${REC}geschichte-05-v2.mp3`,
      text: [
        'Da sagt Gott: „Ich will hinabgehen und ihre Sprache verwirren, damit keiner mehr den anderen versteht.“',
        'Und so geschieht es. Ein Mann ruft seinem Nachbarn etwas zu, aber der versteht ihn nicht, denn er hört nur fremde Wörter. Die Bauleute fragen und zeigen auf die Ziegel, sie schütteln den Kopf und fragen noch einmal, aber keiner begreift, was der andere meint. Wo vorher alle an einem Strang gezogen haben, redet nun jeder anders.',
        'Nun können sie nicht mehr gemeinsam planen und nicht mehr gemeinsam bauen. Die Menschen packen ihre Bündel und ziehen davon, auf vielen verschiedenen Wegen, denn Gott verteilt sie von dort über die ganze Erde. Die Stadt bauen sie nicht mehr fertig.'
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
      audio: `${REC}geschichte-06-v2.mp3`,
      text: [
        'Darum bekommt die Stadt den Namen Babel. Das erinnert an das Wort für „verwirren“, denn dort hat Gott die Sprache aller Menschen verwirrt.',
        'Von dort aus verteilt Gott die Menschen über die ganze Erde. Auf vielen Wegen gehen sie auseinander, Familien mit ihren Kindern, mit Eseln und Kamelen und Bündeln, jede Gruppe in ihre eigene Richtung.',
        'Hinter ihnen bleibt die weite Ebene zurück, mit der Stadt und dem Turm, der unfertig im Morgenlicht steht. Doch das ist nicht das Ende der Geschichte. Aus den vielen Familien werden viele Völker, jedes mit seiner eigenen Sprache, und so füllt sich die Erde mit Menschen, genau wie Gott es nach der Flut gesagt hat.'
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
