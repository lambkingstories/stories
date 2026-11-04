/**
 * Abenteuer "Die letzte Woche" (Matthäus 21 bis 27) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Von Jerusalem bis zum Grab". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 4.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Die Passion (Etappen 7 bis 11) wird ruhig erzählt und nur gefragt, nicht gespielt; kein Blut, keine Wunden, keine Nägel, keine Dornen im Text oder Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-LetzteWoche/ENTWURF_LetzteWoche.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend): 1 Weg bereiten (neu, bereiten), 2 Wimmelbild (alt), 3 Lückenvers (alt), 4 Lampen füllen (neu, lampen),
 * 5 Wem helfen? (neu, helfen), 6 Reihenfolge (alt), 7 bis 11 nur Quiz, 12 Puzzle (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/letztewoche/, images/abenteuer/spiele/letztewoche/<spiel>/, audio/abenteuer/letztewoche/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-LetzteWoche/tools/bauen_letztewoche.py: nicht von Hand ändern.
 */
import type { FindGame, Journey, OrderGame, VerseGame, PrepareGame, OilLampGame, HelpGame } from '@/types/adventure'
import { josef } from './josef'
import { LETZTEWOCHE_PATH } from './letztewochePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { letztewocheEn } from './en/letztewoche.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/letztewoche/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/letztewoche/'

const G = 'images/abenteuer/spiele/letztewoche/'

/**
 * Etappe 3, "Lückenvers" (alte Mechanik): das zweite Gebot aus dem Text der Etappe (Matthäus 22,39) in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 27 (kopiert). Hintergrund: ein Olivenzweig mit Früchten (Bildauftrag). Die Sätze stehen wörtlich im Etappentext (das Bauskript prüft es).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Du sollst deinen ', ' lieben wie dich selbst.'], words: ['Nächsten', 'Mantel', 'Tempel'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Du sollst deinen Nächsten ', ' wie dich ', '.'], words: ['lieben', 'selbst', 'vergessen', 'verkaufen'], answers: [0, 1] }
  ]
}

/**
 * Etappe 6, "Das letzte Mahl" (alte Mechanik, Reihenfolge legen): die Jünger bereiten den Tisch, Jesus sitzt mit den Zwölf am Tisch, Jesus bricht das Brot, sie gehen hinaus zum Ölberg.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'tisch', image: `${G}reihenfolge/karte-1.webp`, label: 'Die Jünger bereiten den Tisch im Saal im Obergeschoss' },
    { id: 'mahl', image: `${G}reihenfolge/karte-2.webp`, label: 'Jesus sitzt mit den Zwölf am Tisch' },
    { id: 'brot', image: `${G}reihenfolge/karte-3.webp`, label: 'Jesus bricht das Brot und gibt es den Jüngern' },
    { id: 'oelberg', image: `${G}reihenfolge/karte-4.webp`, label: 'Die Jünger gehen mit Jesus singend hinaus zum Ölberg' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['mahl', 'brot', 'oelberg'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang im Saal und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['tisch', 'mahl', 'brot', 'oelberg'] }
  ]
}

/**
 * Etappe 1, "Den Weg bereiten" (neu, `bereiten`, Mt 21,7-8): die leere Straße am Ölberg (3:2) mit fünf kahlen Stellen; Mäntel und Zweige werden auf die kahlen Stellen gelegt (ziehen oder erst den Stapel, dann die Stelle antippen),
 * die Eselin mit Jesus geht jeweils ein Stück weiter, die Menschen am Rand rufen Hosianna; ein Stein auf der Straße wackelt und springt zurück (Fehler). Runde 1 drei Stellen, Runde 2 fünf (die Eselin geht langsam von selbst weiter
 * und wartet an der kahlen Stelle). Bilder (Bildauftrag): `bereiten/strasse` (3:2), `eselin`, `mantel-1..3`, `zweig-1..2`, `stein`, `menschen`, `tor`.
 */
const BEREITEN: PrepareGame = {
  road: `${G}bereiten/strasse.webp`,
  donkey: { image: `${G}bereiten/eselin.webp`, label: 'Jesus auf der Eselin, das Fohlen läuft neben ihr', x: 9, y: 80, w: 21 },
  cloaks: [{ image: `${G}bereiten/mantel-1.webp`, label: 'Ein roter Mantel', w: 12 }, { image: `${G}bereiten/mantel-2.webp`, label: 'Ein blauer Mantel', w: 12 }, { image: `${G}bereiten/mantel-3.webp`, label: 'Ein ockerfarbener Mantel', w: 12 }],
  branches: [{ image: `${G}bereiten/zweig-1.webp`, label: 'Ein Palmzweig', w: 12 }, { image: `${G}bereiten/zweig-2.webp`, label: 'Ein Olivenzweig', w: 12 }],
  stone: { image: `${G}bereiten/stein.webp`, label: 'Ein Feldstein', w: 9 },
  crowd: { image: `${G}bereiten/menschen.webp`, label: 'Jubelnde Menschen mit Palmzweigen am Rand', x: 50, y: 57, w: 44 },
  gate: { image: `${G}bereiten/tor.webp`, label: 'Das Stadttor von Jerusalem', x: 93, y: 100, w: 14 },
  spots: [{ x: 12, y: 66 }, { x: 32, y: 66 }, { x: 50, y: 66 }, { x: 69, y: 66 }, { x: 88, y: 66 }],
  field: 16,
  rounds: [
    { hint: 'Decke die drei kahlen Stellen mit Mänteln und Zweigen.', fields: 3 },
    { hint: 'Jetzt sind es fünf Stellen. Die Eselin wartet an jeder kahlen Stelle.', fields: 5, slow: true }
  ]
}

/**
 * Etappe 4, "Die Lampen füllen" (neu, `lampen`, Mt 25,1-13): Nacht vor dem Hochzeitshaus (3:2); eine große Tonlampe mit goldener Marke, daneben der Ölkrug. Den Krug halten gießt Öl, loslassen beendet: genau an der Marke brennt die Lampe,
 * zu wenig und sie flackert und geht aus (man gießt weiter), zu viel und das Öl läuft über (Fehler). Die Marken sind Prozent der Höhe der Glasöffnung (von unten). Runde 1 drei Lampen, Runde 2 drei mit schmalerer Toleranz;
 * am Ende stehen sechs brennende Lampen in einer Reihe. Bilder (Bildauftrag): `lampen/nacht` (3:2), `lampen-reihe` (3:2), `lampe`, `lampe-brennt`, `lampe-aus`, `oel`, `marke`, `krug`.
 */
const LAMPEN: OilLampGame = {
  night: `${G}lampen/nacht.webp`,
  row: `${G}lampen/lampen-reihe.webp`,
  lamp: { image: `${G}lampen/lampe.webp`, label: 'Eine leere Tonlampe', x: 46, y: 95, w: 42 },
  lit: { image: `${G}lampen/lampe-brennt.webp`, label: 'Die Lampe brennt', w: 42 },
  out: { image: `${G}lampen/lampe-aus.webp`, label: 'Die Lampe ist ausgegangen, ein dünner Rauchfaden steigt auf', w: 42 },
  oil: { image: `${G}lampen/oel.webp`, label: 'Öl', w: 20 },
  mark: { image: `${G}lampen/marke.webp`, label: 'Eine goldene Marke', w: 19 },
  jug: { image: `${G}lampen/krug.webp`, label: 'Ein Krug mit Öl', x: 80, y: 93, w: 21 },
  glass: { x: 38.1, y: 56.7, w: 23.6, h: 26.7 },
  rounds: [
    { hint: 'Halte den Krug und lass los, wenn das Öl die Marke erreicht.', marks: [60, 80, 45] },
    { hint: 'Jetzt musst du noch genauer treffen.', marks: [70, 50, 85], tolerance: 7 }
  ]
}

/**
 * Etappe 5, "Wem helfen?" (neu, `helfen`, Mt 25,35-36): eine Dorfstraße (3:2) mit sechs Menschen, die etwas brauchen (hungrig, durstig, fremd, frierend, krank, im Gefängnis); die Karte mit dem, was sie brauchen, wird zu ihm gezogen
 * (oder erst die Karte, dann der Mensch angetippt). Richtig: der Mensch lächelt, die Karte bleibt bei ihm; falsch: die Karte wackelt und springt zurück (Fehler). Runde 1 hungrig, durstig, fremd; Runde 2 frierend, krank, Gefangener.
 * Bilder (Bildauftrag): `helfen/dorf` (3:2), `mensch-<name>` und `mensch-<name>-froh` (gleich große Sprites), `karte-brot|krug|tuer|mantel|besuch-bett|besuch-gitter` (3:4).
 */
const HELFEN: HelpGame = {
  village: `${G}helfen/dorf.webp`,
  ratio: 0.91,
  people: [
    { id: 'hunger', image: `${G}helfen/mensch-hunger.webp`, glad: `${G}helfen/mensch-hunger-froh.webp`, label: 'Ein hungriger Mann', x: 9, y: 95, w: 16, card: `${G}helfen/karte-brot.webp`, cardLabel: 'Brot' },
    { id: 'durst', image: `${G}helfen/mensch-durst.webp`, glad: `${G}helfen/mensch-durst-froh.webp`, label: 'Eine durstige Frau', x: 40, y: 95, w: 20, card: `${G}helfen/karte-krug.webp`, cardLabel: 'Ein Krug mit Wasser' },
    { id: 'fremd', image: `${G}helfen/mensch-fremd.webp`, glad: `${G}helfen/mensch-fremd-froh.webp`, label: 'Ein fremder Reisender mit Bündel vor einer Tür', x: 24, y: 95, w: 20, card: `${G}helfen/karte-tuer.webp`, cardLabel: 'Eine offene Tür mit Lampe' },
    { id: 'frieren', image: `${G}helfen/mensch-frieren.webp`, glad: `${G}helfen/mensch-frieren-froh.webp`, label: 'Ein frierender Mann ohne Mantel', x: 56, y: 95, w: 20, card: `${G}helfen/karte-mantel.webp`, cardLabel: 'Ein Mantel' },
    { id: 'krank', image: `${G}helfen/mensch-krank.webp`, glad: `${G}helfen/mensch-krank-froh.webp`, label: 'Eine kranke Frau im Bett', x: 72, y: 95, w: 17, card: `${G}helfen/karte-besuch-bett.webp`, cardLabel: 'Besuch am Bett mit Tuch und Schale' },
    { id: 'gefangen', image: `${G}helfen/mensch-gefangen.webp`, glad: `${G}helfen/mensch-gefangen-froh.webp`, label: 'Ein Gefangener hinter einem kleinen Gitterfenster', x: 88, y: 95, w: 19, card: `${G}helfen/karte-besuch-gitter.webp`, cardLabel: 'Besuch am Gitter mit einem Korb' }
  ],
  rounds: [
    { hint: 'Bringe dem Hungrigen, dem Durstigen und dem Fremden, was sie brauchen.', people: ['hunger', 'durst', 'fremd'] },
    { hint: 'Jetzt der Frierende, die Kranke und der Gefangene.', people: ['frieren', 'krank', 'gefangen'] }
  ]
}

/**
 * Etappe 2, "Wimmelbild" (alte Mechanik): der Vorhof des Tempels mit Säulen, Steinplatten und Tischen am Rand (Hochformat 3:4, Bildauftrag); gesucht werden vier aus Matthäus 21,12-16:
 * Jesus, ein Kind mit Palmzweig, ein Taubenhändler mit Käfig und ein Blinder mit Stab. Einige stehen hinter einer Säule mit Tuch, einem Käfigstapel, einem Tonkrug oder einem umgestoßenen Tisch.
 * Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Jesus', 'Ein Kind mit Palmzweig', 'Ein Taubenhändler mit Käfig', 'Ein Blinder mit Stab'],
  doneText: 'Du hast alle gefunden: Jesus, das Kind, den Taubenhändler und den Blinden.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 30, y: 90, w: 12 },
    { image: `${G}wimmel/figur-2.webp`, x: 72, y: 93, w: 10 },
    { image: `${G}wimmel/figur-3.webp`, x: 84, y: 70, w: 14 },
    { image: `${G}wimmel/figur-4.webp`, x: 46, y: 64, w: 12 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 72, y: 94, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 46, y: 66, w: 14 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 58, y: 88, w: 9 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 30, y: 91, w: 18 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 84, y: 72, w: 17 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 70, y: 52, w: 9 }
  ]
}

export const letztewoche: Journey = {
  id: 'letztewoche',
  title: 'Die letzte Woche',
  subtitle: 'Von Jerusalem bis zum Grab',
  age: '8-10',
  downloadMb: 18, // wird nach dem Bau gemessen (Bilder, Karte, Spielbilder, Musik, Aufnahmen), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v3.webp`, // Medaille 3 (Anton 5.11.2026)
  // Geschenk-Ausmalbild: der Palmzweig mit Mantel und der Eselin mit Fohlen (Konturzeichnung)
  gift: { title: 'Der Palmzweig', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Ölberg durch Jerusalem hinaus nach Golgatha und zum Grab, mit Stationen und Perlenweg aus letztewochePath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/letztewoche/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1159, y: 0.7373, d: 0.0339 },
      { x: 0.1855, y: 0.7433, d: 0.0339 },
      { x: 0.2540, y: 0.7494, d: 0.0339 },
      { x: 0.3649, y: 0.3883, d: 0.0339 },
      { x: 0.4133, y: 0.6068, d: 0.0339 },
      { x: 0.4788, y: 0.1820, d: 0.0339 },
      { x: 0.5484, y: 0.4248, d: 0.0339 },
      { x: 0.6300, y: 0.2184, d: 0.0339 },
      { x: 0.6905, y: 0.2002, d: 0.0339 },
      { x: 0.7712, y: 0.1517, d: 0.0339 },
      { x: 0.8397, y: 0.2852, d: 0.0339 },
      { x: 0.9093, y: 0.2124, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.4854, d: 0.0339 },
    path: LETZTEWOCHE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der König auf dem Esel',
      ref: 'Matthäus 21,1–11',
      text: [
        'Jesus und seine Jünger sind fast in Jerusalem. Am Ölberg schickt Jesus zwei Jünger voraus. „Geht in das Dorf dort vorn“, sagt er. „Ihr findet eine Eselin, die angebunden ist, und ihr Fohlen bei ihr. Bindet sie los und bringt sie zu mir. Und wenn jemand fragt, dann sagt: Der Herr braucht sie.“',
        'Die Jünger gehen, und alles ist so, wie Jesus es gesagt hat. Sie legen ihre Mäntel auf die Eselin, und Jesus setzt sich darauf. So hat es der Prophet vorausgesagt: „Dein König kommt zu dir, sanftmütig, auf einem Esel.“',
        'Auf der Straße breiten viele Leute ihre Mäntel vor ihm aus. Andere schneiden Zweige von den Bäumen und streuen sie auf den Weg. Alle rufen: „Hosianna dem Sohn Davids! Gelobt sei, der da kommt im Namen des Herrn!“',
        'Die ganze Stadt gerät in Aufregung. „Wer ist das?“, fragen die Leute. „Das ist Jesus, der Prophet aus Nazareth in Galiläa“, sagen die anderen.'
      ],
      // Spiel: Weg bereiten (bereiten, neu)
      task: { kind: 'bereiten', hint: 'Lege Mäntel und Zweige auf den Weg. Steine gehören nicht auf die Straße.', prepare: BEREITEN },
      questions: [
        { q: 'Wohin schickt Jesus die zwei Jünger?', options: ['in ein Dorf, um eine Eselin und ihr Fohlen zu holen', 'zum Fischen', 'zum Tempel'], answer: 0 },
        { q: 'Was legen die Leute auf den Weg?', options: ['ihre Mäntel und Zweige von den Bäumen', 'Steine', 'Blumenkörbe'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Im Tempel',
      ref: 'Matthäus 21,12–17',
      text: [
        'Jesus geht in den Tempel. Im Vorhof stehen Tische, an denen Geld gewechselt wird, und Händler verkaufen Tauben. Da wirft Jesus die Tische um und schickt die Händler hinaus. „Es steht geschrieben: Mein Haus soll ein Haus des Gebets sein“, sagt er. „Ihr aber macht eine Räuberhöhle daraus.“',
        'Dann kommen Blinde und Lahme zu ihm in den Tempel, und Jesus macht sie gesund.',
        'Im Tempel sind auch Kinder, und sie rufen laut: „Hosianna dem Sohn Davids!“ Die Hohenpriester und Schriftgelehrten sehen die Wunder und hören die Kinder, und sie ärgern sich. „Hörst du, was die rufen?“, fragen sie.',
        '„Ja“, sagt Jesus. „Habt ihr nie gelesen: Aus dem Mund der Kinder hast du dir Lob bereitet?“ Am Abend verlässt er die Stadt und geht nach Bethanien.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde Jesus, ein Kind, einen Taubenhändler und einen Blinden im Tempelhof.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Was verkaufen die Händler im Tempel?', options: ['Tauben', 'Schafwolle', 'Brot'], answer: 0 },
        { q: 'Wer kommt zu Jesus in den Tempel?', options: ['Blinde und Lahme', 'Soldaten', 'Fischer'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das wichtigste Gebot',
      ref: 'Matthäus 22,34–40',
      text: [
        'Wieder kommen Leute zu Jesus, die ihn prüfen wollen. Ein Schriftgelehrter, der sich mit Gottes Gesetz gut auskennt, tritt vor ihn. „Meister“, fragt er, „welches ist das wichtigste Gebot?“',
        'Jesus antwortet ihm: „Du sollst den Herrn, deinen Gott, lieben von ganzem Herzen, von ganzer Seele und mit deinem ganzen Denken. Das ist das wichtigste und größte Gebot.“',
        'Dann sagt er: „Das zweite aber ist ihm gleich: Du sollst deinen Nächsten lieben wie dich selbst. An diesen beiden Geboten hängt alles, was im Gesetz und bei den Propheten steht.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Wort in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wen fragt der Schriftgelehrte?', options: ['Jesus', 'Pilatus', 'einen Hirten'], answer: 0 },
        { q: 'Was ist das wichtigste Gebot?', options: ['Gott lieben von ganzem Herzen', 'Früh aufstehen', 'Nie lachen'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Die zehn Lampen',
      ref: 'Matthäus 25,1–13',
      text: [
        'Jesus erzählt ein Gleichnis. Zehn junge Frauen warten auf einen Bräutigam. Jede hat eine Lampe. Fünf von ihnen sind klug und fünf unvernünftig. Die Unvernünftigen nehmen zu ihren Lampen kein Öl mit. Die Klugen aber nehmen Öl in Krügen mit.',
        'Der Bräutigam lässt auf sich warten, und die jungen Frauen werden müde und schlafen ein. Mitten in der Nacht ruft jemand: „Der Bräutigam kommt! Geht ihm entgegen!“',
        'Alle stehen auf und machen ihre Lampen bereit. Die Lampen der fünf Unvernünftigen gehen aus. „Gebt uns von eurem Öl“, bitten sie. „Dann reicht es nicht für uns alle“, sagen die Klugen. „Geht zu den Händlern und kauft euch welches.“',
        'Während sie fort sind, kommt der Bräutigam. Die bereit sind, gehen mit ihm in den Saal zur Hochzeit, und die Tür wird zugemacht. „Darum wacht“, sagt Jesus, „denn ihr wisst weder Tag noch Stunde, wann der Menschensohn kommt.“'
      ],
      // Spiel: Lampen füllen (lampen, neu)
      task: { kind: 'lampen', hint: 'Halte den Krug und lass ihn los, wenn das Öl die goldene Marke erreicht.', lamps: LAMPEN },
      questions: [
        { q: 'Wie viele junge Frauen warten auf den Bräutigam?', options: ['zehn', 'drei', 'zwölf'], answer: 0 },
        { q: 'Was nehmen die Klugen mit?', options: ['Öl in Krügen', 'Brot', 'Nichts'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Was ihr getan habt',
      ref: 'Matthäus 25,31–40',
      text: [
        'Jesus erzählt davon, wie es einmal sein wird, wenn er, der Menschensohn, als König kommt. Zu den Gerechten wird der König sagen: „Kommt her, ihr Gesegneten meines Vaters! Das Reich ist für euch bereit. Denn ich war hungrig, und ihr habt mir zu essen gegeben. Ich war durstig, und ihr habt mir zu trinken gegeben. Ich war fremd, und ihr habt mich aufgenommen.“',
        '„Ich war nackt, und ihr habt mich gekleidet. Ich war krank, und ihr habt mich besucht. Ich war im Gefängnis, und ihr seid zu mir gekommen.“',
        'Die Gerechten fragen erstaunt: „Herr, wann haben wir dich hungrig gesehen und dir zu essen gegeben?“',
        'Der König antwortet: „Was ihr einem von meinen geringsten Brüdern getan habt, das habt ihr mir getan.“'
      ],
      // Spiel: Wem helfen? (helfen, neu)
      task: { kind: 'helfen', hint: 'Wer braucht was? Bringe jedem, was er braucht.', help: HELFEN },
      questions: [
        { q: 'Was hat der König gebraucht?', options: ['Essen, Trinken und Kleidung', 'Gold', 'ein Schwert'], answer: 0 },
        { q: 'Was haben die Gerechten für den Kranken getan?', options: ['Sie haben ihn besucht.', 'Sie sind weggelaufen.', 'Sie haben ihn ausgelacht.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Das letzte Mahl',
      ref: 'Matthäus 26,14–30',
      text: [
        'Einer von den Zwölfen, Judas Iskariot, geht zu den Hohenpriestern. „Was gebt ihr mir, wenn ich Jesus an euch ausliefere?“, fragt er. Sie bieten ihm dreißig Silbermünzen.',
        'Am ersten Tag des Passafestes bereiten die Jünger das Mahl vor. Am Abend setzt sich Jesus mit den Zwölfen zu Tisch. „Einer von euch wird mich verraten“, sagt er. Die Jünger sind sehr betrübt, und einer nach dem anderen fragt: „Herr, bin ich\'s?“',
        'Dann nimmt Jesus das Brot, dankt, bricht es und gibt es den Jüngern. „Nehmt und esst“, sagt er, „das ist mein Leib.“ Er nimmt den Kelch, dankt und gibt ihn ihnen. „Trinkt alle daraus. Das ist mein Blut des neuen Bundes, das für viele vergossen wird zur Vergebung der Sünden.“',
        'Nach dem Lobgesang gehen sie hinaus zum Ölberg.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Bringe die vier Bilder in die richtige Reihenfolge.', order: REIHENFOLGE },
      questions: [
        { q: 'Was bietet man Judas für den Verrat?', options: ['dreißig Silbermünzen', 'einen Esel', 'ein Haus'], answer: 0 },
        { q: 'Was tut Jesus mit dem Brot?', options: ['Er dankt, bricht es und gibt es den Jüngern.', 'Er wirft es weg.', 'Er versteckt es.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Im Garten Gethsemane',
      ref: 'Matthäus 26,36–46',
      text: [
        'Nach dem Mahl kommt Jesus mit den Jüngern in einen Garten, der Gethsemane heißt. „Setzt euch hier“, sagt er, „während ich dort bete.“ Petrus, Jakobus und Johannes nimmt er mit. Jesus wird traurig, und ihm ist bange. „Meine Seele ist betrübt bis an den Tod“, sagt er. „Bleibt hier und wacht mit mir.“',
        'Er geht ein Stück weiter, wirft sich auf die Erde und betet: „Mein Vater, wenn es möglich ist, dann lass diesen Kelch an mir vorübergehen. Aber nicht, wie ich will, sondern wie du willst.“',
        'Als er zu den Jüngern zurückkommt, schlafen sie. „Könnt ihr nicht eine Stunde mit mir wachen?“, fragt er. „Der Geist ist willig, aber das Fleisch ist schwach.“',
        'Noch zweimal geht Jesus beten, mit denselben Worten. Beim zweiten Mal findet er die Jünger wieder schlafend, ihre Augen sind voller Schlaf. „Steht auf, wir gehen“, sagt er. „Seht, der mich ausliefert, ist da.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt der Garten?', options: ['Gethsemane', 'Eden', 'Jericho'], answer: 0 },
        { q: 'Was tut Jesus im Garten?', options: ['Er betet.', 'Er schläft.', 'Er baut ein Haus.'], answer: 0 },
        { q: 'Was tun die Jünger, als Jesus zurückkommt?', options: ['Sie schlafen.', 'Sie singen.', 'Sie laufen weg.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Jesus wird festgenommen',
      ref: 'Matthäus 26,47–56',
      text: [
        'Noch während Jesus spricht, kommt Judas, einer der Zwölf. Mit ihm kommt eine große Schar Männer mit Schwertern und Stangen, die von den Hohenpriestern und Ältesten geschickt sind. Judas hat ihnen ein Zeichen verabredet: „Wen ich küsse, der ist es. Den nehmt fest.“',
        'Judas geht gleich zu Jesus. „Sei gegrüßt, Rabbi!“, sagt er und küsst ihn. „Mein Freund“, sagt Jesus, „wozu bist du gekommen?“ Da treten die Männer heran, packen Jesus und nehmen ihn fest.',
        'Einer von den Jüngern greift zum Schwert. „Steck dein Schwert weg“, sagt Jesus.',
        'Dann sagt er zu der Schar: „Täglich habe ich bei euch im Tempel gelehrt, und ihr habt mich nicht festgenommen.“ Da verlassen ihn alle Jünger und fliehen.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer führt die Schar zu Jesus?', options: ['Judas', 'Petrus', 'Pilatus'], answer: 0 },
        { q: 'Woran erkennen die Männer Jesus?', options: ['Judas küsst ihn.', 'Er trägt eine Krone.', 'Er ruft laut.'], answer: 0 },
        { q: 'Was sagt Jesus zu dem Jünger mit dem Schwert?', options: ['Steck dein Schwert weg.', 'Schlag zu.', 'Lauf davon.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Der Hahn kräht',
      ref: 'Matthäus 26,33–35.69–75',
      text: [
        'Petrus hatte zu Jesus gesagt: „Auch wenn alle an dir irre werden, ich nie.“ Aber Jesus hatte ihm geantwortet: „In dieser Nacht, noch ehe der Hahn kräht, wirst du mich dreimal verleugnen.“',
        'Petrus ist Jesus von Weitem gefolgt und sitzt jetzt draußen im Hof des Hohenpriesters. Eine Magd kommt zu ihm. „Du warst auch mit diesem Jesus aus Galiläa“, sagt sie. „Ich weiß nicht, was du meinst“, sagt Petrus vor allen.',
        'Als er zum Tor geht, sieht ihn eine andere Magd. „Der war auch mit Jesus von Nazareth!“ „Ich kenne den Menschen nicht“, sagt Petrus. Bald darauf sagen die Umstehenden: „Du gehörst auch zu ihnen. Man hört es an deiner Sprache.“ Und zum dritten Mal sagt Petrus: „Ich kenne den Menschen nicht!“',
        'Da kräht ein Hahn. Petrus denkt an Jesu Worte, geht hinaus und weint bitterlich.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo sitzt Petrus?', options: ['im Hof des Hohenpriesters', 'auf einem Boot', 'im Tempel'], answer: 0 },
        { q: 'Was sagt Petrus zu den Leuten?', options: ['Ich kenne den Menschen nicht.', 'Ich bin sein Freund.', 'Ich bin der König.'], answer: 0 },
        { q: 'Was geschieht, als Petrus es zum dritten Mal sagt?', options: ['Ein Hahn kräht.', 'Es regnet.', 'Die Tür geht auf.'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Vor Pilatus',
      ref: 'Matthäus 27,11–26',
      text: [
        'Am Morgen bringen die Hohenpriester und Ältesten Jesus zu dem römischen Statthalter Pilatus. „Bist du der König der Juden?“, fragt Pilatus. „Du sagst es“, antwortet Jesus. Sie erheben viele Vorwürfe gegen ihn, aber Jesus sagt kein Wort. Pilatus wundert sich sehr.',
        'Zum Fest lässt der Statthalter immer einen Gefangenen frei, den das Volk will. Damals ist ein bekannter Gefangener da, der heißt Barabbas. „Wen soll ich freilassen?“, fragt Pilatus. „Barabbas oder Jesus?“ Er weiß, dass die Hohenpriester Jesus aus Neid ausgeliefert haben. Seine Frau lässt ihm sagen: „Lass die Finger von diesem Gerechten.“',
        'Aber die Hohenpriester überreden das Volk. „Barabbas!“, rufen die Leute. „Und Jesus?“, fragt Pilatus. „Kreuzige ihn!“, rufen sie.',
        'Da wäscht Pilatus sich vor allen die Hände: „Ich bin unschuldig am Tod dieses Gerechten.“ Er gibt Barabbas frei. Jesus aber übergibt er den Soldaten, damit er gekreuzigt wird.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer ist Pilatus?', options: ['der römische Statthalter', 'ein Fischer', 'ein Jünger'], answer: 0 },
        { q: 'Was sagt Jesus zu den Vorwürfen?', options: ['Er sagt kein Wort.', 'Er ruft laut.', 'Er läuft weg.'], answer: 0 },
        { q: 'Wen gibt Pilatus frei?', options: ['Barabbas', 'Petrus', 'Judas'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11-b.webp`,
      title: 'Auf dem Hügel Golgatha',
      ref: 'Matthäus 27, Auswahl',
      text: [
        'Soldaten führen Jesus aus der Stadt hinaus. Unterwegs zwingen sie einen Mann, Jesu Kreuz zu tragen. Er heißt Simon und kommt aus Kyrene. Auf einem Hügel, der Golgatha heißt, kreuzigen sie Jesus, und mit ihm zwei Räuber, einen rechts und einen links. Über ihm steht: Dies ist Jesus, der Juden König.',
        'Um die Mittagszeit wird es finster über dem ganzen Land, und die Finsternis dauert drei Stunden. Um die neunte Stunde ruft Jesus laut: „Mein Gott, mein Gott, warum hast du mich verlassen?“ Dann ruft er noch einmal laut und stirbt.',
        'Im selben Augenblick reißt im Tempel der Vorhang von oben bis unten in zwei Stücke, die Erde bebt, und die Felsen spalten sich. Der Hauptmann und die Soldaten bei ihm erschrecken sehr. „Wirklich, dieser war Gottes Sohn!“, sagen sie. Von ferne sehen viele Frauen zu, die Jesus aus Galiläa gefolgt sind.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer trägt Jesu Kreuz ein Stück des Weges?', options: ['Simon aus Kyrene', 'Petrus', 'Pilatus'], answer: 0 },
        { q: 'Was geschieht um die Mittagszeit?', options: ['Es wird finster über dem Land.', 'Es schneit.', 'Ein Fest beginnt.'], answer: 0 },
        { q: 'Was sagt der Hauptmann?', options: ['Wirklich, dieser war Gottes Sohn!', 'Das war ein Irrtum.', 'Wir gehen heim.'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12-b.webp`,
      title: 'Das Grab',
      ref: 'Matthäus 27,57–66',
      text: [
        'Es wird Abend. Ein reicher Mann aus Arimatäa kommt zu Pilatus. Er heißt Josef und ist auch ein Jünger Jesu. Er bittet um den Leib Jesu, und Pilatus erlaubt es.',
        'Josef wickelt ihn in ein sauberes Leinentuch und legt ihn in sein eigenes Grab, das er in den Felsen hat hauen lassen. Er wälzt einen großen Stein vor den Eingang und geht fort. Maria Magdalena und die andere Maria bleiben und setzen sich gegenüber dem Grab.',
        'Am nächsten Tag gehen die Hohenpriester und Pharisäer zu Pilatus. „Dieser Verführer hat gesagt: Nach drei Tagen werde ich auferstehen“, sagen sie. „Lass das Grab bewachen, damit seine Jünger ihn nicht stehlen.“ „Ihr habt Wächter“, sagt Pilatus, „geht und sichert es, so gut ihr könnt.“ Sie versiegeln den Stein und stellen die Wächter davor.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Garten zusammen.', puzzle: { image: `${G}puzzle/garten.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wer bittet Pilatus um den Leib Jesu?', options: ['Josef aus Arimatäa', 'Judas', 'Barabbas'], answer: 0 },
        { q: 'Wohin legt Josef Jesus?', options: ['in sein eigenes Grab im Felsen', 'in ein Boot', 'in den Tempel'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was legen die Leute auf den Weg?', options: ['ihre Mäntel und Zweige von den Bäumen', 'Steine', 'Blumenkörbe'], answer: 0 },
    { q: 'Was nehmen die Klugen mit?', options: ['Öl in Krügen', 'Brot', 'Nichts'], answer: 0 },
    { q: 'Was haben die Gerechten für den Kranken getan?', options: ['Sie haben ihn besucht.', 'Sie sind weggelaufen.', 'Sie haben ihn ausgelacht.'], answer: 0 },
    { q: 'Was bietet man Judas für den Verrat?', options: ['dreißig Silbermünzen', 'einen Esel', 'ein Haus'], answer: 0 },
    { q: 'Was geschieht, als Petrus es zum dritten Mal sagt?', options: ['Ein Hahn kräht.', 'Es regnet.', 'Die Tür geht auf.'], answer: 0 },
    { q: 'Wer bittet Pilatus um den Leib Jesu?', options: ['Josef aus Arimatäa', 'Judas', 'Barabbas'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of letztewoche.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of letztewoche.stages) {
  const file = `audio/abenteuer/letztewoche/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the entry into Jerusalem, the garden at night, the tomb in the evening light); they follow one another at random
letztewoche.music = [
  'audio/abenteuer/letztewoche/musik-einzug-v1.mp3',
  'audio/abenteuer/letztewoche/musik-garten-v1.mp3',
  'audio/abenteuer/letztewoche/musik-grab-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(letztewoche, letztewocheEn)
