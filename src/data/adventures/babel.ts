/**
 * Abenteuer "Der Turm von Babel" (1. Mose 11,1–9) für 8 bis 10 Jahre: 6 Etappen, Untertitel "Eine Stadt und ein Turm". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Babel/ENTWURF_Babel-v3.md (zweitgeprüft, 90 bis 145 Wörter je Etappe wie bei Noah und Josef, eingebaut am 21.10.2026), Plan: ETAPPENPLAN-v3.md.
 * Deutsche Aufnahmen zu den neuen Texten: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht (die englische App liest mit der Gerätestimme).
 * Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Alle fünf Spiele dieses Abenteuers sind neu (keines in Josef, Noah oder Adam und Eva), Etappe 5 ist nur Quiz; jedes Spiel hat höchstens zwei Runden.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/babel/, images/abenteuer/spiele/babel/<spiel>/, audio/abenteuer/babel/.
 *
 * STAND 21.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder) und Messwerte sind eingebaut, die Etappen sind spielbar. Die Etappenbilder 3 und 6 werden neu gemalt: dann Messwerte der Spiele 3 und 6 neu ablesen.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { ChainGame, Journey, MissingGame, StackGame, TraceGame, WipeGame } from '@/types/adventure'
import { BABEL_PATH } from './babelPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { babelEn } from './en/babel.en'

const IMG = 'images/abenteuer/babel/'
const G = 'images/abenteuer/spiele/babel/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Wer fehlt im Zug?": eine Reihe von Menschen vor dem Etappenbild 1, eine Staubwolke zieht vorbei, jemand fehlt (Bildauftrag B10).
 * Plan v3: zwei Runden mit je zwei Aufgaben (Runde 1 vier Menschen, einer fehlt; Runde 2 sechs Menschen, zwei fehlen).
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
        { row: ['mensch-5', 'mensch-2', 'mensch-6', 'mensch-1'], gone: ['mensch-2'] }
      ]
    },
    {
      hint: 'Jetzt fehlen zwei.',
      tasks: [
        { row: ['mensch-1', 'mensch-2', 'mensch-3', 'mensch-4', 'mensch-5', 'mensch-6'], gone: ['mensch-2', 'mensch-5'] },
        { row: ['mensch-6', 'mensch-4', 'mensch-2', 'mensch-1', 'mensch-3', 'mensch-5'], gone: ['mensch-4', 'mensch-3'] }
      ]
    }
  ]
}

/**
 * Etappe 2, "Ziegelkette": Bauleute reichen Ziegel und Pechtöpfe vom Ofen zum Stapel (Bildauftrag B11, Hintergrund Etappenbild 2). Plan v3: Runde 1 vier Ziegel, Runde 2 sechs Teile (Ziegel und Pechtöpfe gemischt).
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
      items: ['brick', 'pitch', 'brick', 'brick', 'pitch', 'pitch'],
      slots: [[30, 94], [46, 94], [62, 94], [78, 94]],
      source: [48.5, 25.5],
      sink: [90.6, 80]
    }
  ]
}

/** Etappe 3, "Stufenturm stapeln": ein Lehmziegelblock gleitet am Balken hin und her, ein Tipp setzt ihn auf die Stufe (Bildauftrag B12, Hintergrund Etappenbild 3). Plan v3: Runde 1 drei Stufen, Runde 2 vier. */
const STAPELN: StackGame = {
  background: `${IMG}etappe-bild-03.webp`,
  block: `${G}stapeln/stufe.webp`,
  beam: `${G}stapeln/balken.webp`,
  rounds: [
    { hint: 'Tippe, wenn der Block über der Stufe ist.', layers: 3, baseWidth: 52, shrink: 0.08, speed: 0.18 },
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
 * Etappe 6, "Wegen nachfahren": Wege führen vom unfertigen Turm in die Ebene (Bildauftrag B14, Fassung B: ein Bild mit den Wegen); Plan v3: Runde 1 zwei Wege (die zwei unteren, breiten),
 * Runde 2 drei (der vierte, der Flussweg, entfällt; das Bild `wege-b.webp` zeigt ihn noch, bis es mit dem neuen Etappenbild 6 neu gemalt und neu gemessen wird). Die Wegpunkte (Prozent des Bildes, vom Turm zum Ziel) sind die Messwerte aus `spur/wege-b-messung.json`, die Wegbreite `r` ist für die schmalste Stelle gemessen und für Kinderfinger
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
      hint: 'Jetzt drei Wege in verschiedene Richtungen.',
      paths: [
        { id: 'berge', points: [[38, 41], [34, 39], [32.5, 36], [33, 33], [34, 30], [32, 27.5], [27, 25.5], [21, 23.5], [17, 21.5], [17, 19.5], [20, 17.5], [21, 16]], r: 2.5, goal: 'berge' },
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
      text: [
        'Nach der großen Flut hat Gott zu Noah und seinen Söhnen gesagt: „Füllt die Erde!“ Nun werden ihre Familien immer größer, und bald leben viele Menschen auf der Erde.',
        'Sie alle sprechen dieselbe Sprache. Wenn einer etwas ruft, versteht ihn jeder, und jedes Wort bedeutet für alle dasselbe.',
        'Eines Tages ziehen sie gemeinsam nach Osten, Familien mit ihren Bündeln, in einem langen Zug. Sie reden miteinander, und keiner muss fragen, was der andere meint. Schließlich finden sie eine weite, flache Ebene im Land Sinear.',
        'Hier ist Platz genug für alle. Sie lassen sich nieder und wohnen nebeneinander.'
      ],
      task: { kind: 'fehlt', hint: 'Schau gut hin: Wer fehlt im Zug?', missing: FEHLT },
      questions: [
        { q: 'Welche Sprache sprechen die Menschen am Anfang?', options: ['alle dieselbe', 'jede Familie eine andere', 'gar keine'], answer: 0 },
        { q: 'Was finden die Menschen im Land Sinear?', options: ['eine weite Ebene', 'einen hohen Berg', 'einen tiefen Wald'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Ziegel und Pech',
      ref: '1. Mose 11,3',
      text: [
        'Eines Tages hat einer eine Idee. „Wohlauf“, ruft er, „lasst uns Ziegel streichen und brennen!“ „Ja, das machen wir!“, rufen die anderen.',
        'Sie graben Lehm aus dem Boden und formen ihn zu Ziegeln. Dann brennen sie die Ziegel im Feuer. Wer einen fertigen Ziegel in die Hand nimmt, spürt: Der weiche Lehm ist hart geworden wie Stein.',
        'Statt Mörtel nehmen sie Pech. Es ist schwarz und klebrig und hält die Ziegel fest zusammen.',
        'Alle packen mit an, und jeder versteht den anderen sofort. Was einer vorschlägt, das tun die anderen.'
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
      text: [
        'Die Menschen wollen mehr als nur ein paar Häuser. „Wohlauf“, sagen sie, „lasst uns eine Stadt bauen und einen Turm, dessen Spitze bis an den Himmel reicht!“',
        '„Wir wollen uns einen Namen machen“, rufen sie, „sonst werden wir über die ganze Erde zerstreut.“',
        'Sie fangen gleich an, alle helfen mit. Ziegel um Ziegel schleppen sie herbei. Es entstehen Häuser und Gassen, und Reihe um Reihe wächst der Turm in die Höhe.',
        'Immer wieder blicken die Menschen zu ihm hinauf. Er ist höher als alles andere in der Stadt, und man kann ihn schon von weitem sehen.'
      ],
      task: { kind: 'stapeln', hint: 'Setze die Stufen des Turms Stück für Stück.', stack: STAPELN },
      questions: [
        { q: 'Wie hoch soll der Turm reichen?', options: ['bis an den Himmel', 'bis zur Stadtmauer', 'bis zum Meer'], answer: 0 },
        { q: 'Was wollen sich die Menschen machen?', options: ['einen Namen', 'einen Schatz', 'einen Garten'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Gott sieht den Bau',
      ref: '1. Mose 11,5–6',
      text: [
        'Der Turm wächst und wächst, höher als alle Häuser. Da kommt Gott herab, um zu sehen, was die Menschen bauen, die Stadt und den Turm.',
        'Gott sieht die vielen Menschen, die miteinander arbeiten und sich gut verstehen. „Es ist ein Volk, und alle haben eine Sprache“, sagt er. „Das ist erst der Anfang. Nichts wird ihnen unmöglich sein, was sie sich vornehmen.“',
        'Unten in der Stadt wird es Abend, und die Sonne färbt den Turm golden. Die Bauleute rufen einander zu, und jeder versteht jedes Wort. Noch ein Weilchen arbeiten sie weiter.'
      ],
      task: { kind: 'wischen', hint: 'Wische den Nebel weg, damit man Turm und Stadt sieht.', wipe: WISCHEN },
      questions: [
        { q: 'Wer kommt herab, um die Stadt und den Turm anzusehen?', options: ['Gott', 'ein Engel', 'der König'], answer: 0 },
        { q: 'Was sieht Gott über die Menschen?', options: ['Sie sind ein Volk und haben eine Sprache.', 'Sie streiten sich.', 'Sie sind schon fertig.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Viele Sprachen',
      ref: '1. Mose 11,7–8',
      text: [
        'Da spricht Gott: „Auf, lasst uns hinabgehen und ihre Sprache verwirren, damit keiner mehr versteht, was der andere sagt.“',
        'Und so geschieht es. Ein Mann ruft seinem Nachbarn etwas zu, doch der schaut ihn nur ratlos an. Die Wörter klingen fremd, als kämen sie aus einem anderen Land.',
        'Die Bauleute zeigen auf die Ziegel, schütteln die Köpfe, fragen und deuten. Aber keiner versteht den anderen, so sehr sie sich auch bemühen.',
        'Sie können nicht mehr gemeinsam planen. Der Bau hört auf, Werkzeug und Ziegel liegen still, und der Turm bleibt unfertig stehen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was verwirrt Gott?', options: ['ihre Sprache', 'ihre Wege', 'ihre Ziegel'], answer: 0 },
        { q: 'Was geschieht mit dem Bau?', options: ['Die Menschen hören auf zu bauen.', 'Die Menschen bauen schneller.', 'Die Menschen bauen einen zweiten Turm.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Der Name Babel',
      ref: '1. Mose 11,8–9',
      text: [
        'Von dort aus zerstreut Gott die Menschen in alle Länder. Sie packen ihre Bündel und gehen auseinander, Familie für Familie, auf vielen Wegen in alle Richtungen. Manche winken einander noch zu.',
        'Hinter ihnen bleibt die Stadt zurück, und der Turm steht unfertig im Morgenlicht. Niemand baut mehr weiter.',
        'Darum heißt die Stadt Babel, das klingt wie das Wort für „Verwirrung“. Denn dort hat Gott die Sprache aller Menschen verwirrt.',
        'Aus den vielen Familien werden viele Völker. In allen Ländern der Erde leben nun Menschen, und jedes Volk spricht seine eigene Sprache.'
      ],
      task: { kind: 'spur', hint: 'Fahre die Wege mit dem Finger nach.', trace: SPUR },
      questions: [
        { q: 'Wie heißt die Stadt?', options: ['Babel', 'Eden', 'Ur'], answer: 0 },
        { q: 'Woran erinnert der Name Babel?', options: ['an das Wort für „Verwirrung“', 'an das Wort für „Ziegel“', 'an das Wort für „Turm“'], answer: 0 }
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
    { q: 'Wie heißt die Stadt am Ende?', options: ['Babel', 'Eden', 'Ur'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, text version 3 = files "-v3"); there are no English ones yet, so the English app reads with the voice of the device
for (const s of babel.stages) {
  const file = `audio/abenteuer/babel/geschichte-${String(s.id).padStart(2, '0')}-v3.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(babel, babelEn)
