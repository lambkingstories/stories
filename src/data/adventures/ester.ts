/**
 * Abenteuer "Ester" (Ester 1–10) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Die Königin, die ihr Volk rettet". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 30.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Ester/ENTWURF_Ester.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md.
 * Gemildert erzählt: Hamans Plan ("vernichten", Etappe 4 nur Quiz), die Strafe der Türhüter, Hamans Ende ("der Pfahl wird sein eigener", Etappe 8 nur Quiz, nie im Bild), die Kämpfe am Schluss ("stehen für ihr Leben ein").
 * Das Buch Ester nennt Gott nie beim Namen; der Text erfindet deshalb kein Wort Gottes und kein Gebet.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Das Fest schmücken (neu), 2 Puzzle (alt), 3 Memory (alt), 4 nur Quiz, 5 Lückenvers (alt), 6 Reihenfolge (alt), 7 Den Mann ehren (neu), 8 nur Quiz, 9 Wimmelbild (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/ester/, images/abenteuer/spiele/ester/<spiel>/, audio/abenteuer/ester/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { DecorGame, FindGame, HonorGame, Journey, MemoryGame, OrderGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { ESTER_PATH } from './esterPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { esterEn } from './en/ester.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/ester/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/ester/'

const G = 'images/abenteuer/spiele/ester/'

/**
 * Etappe 5, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Salomo (kopiert). Hintergrund ist der gemalte Hof des Palastes (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Und wer ', ', ob du nicht um dieser Zeit willen zur königlichen Würde gekommen bist?“'], words: ['weiß', 'sagt', 'zählt'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Fastet für mich, dass ihr nicht esset und trinket in ', ' Tagen, weder Tag noch ', '.“'], words: ['drei', 'Nacht', 'zehn', 'Abend'], answers: [0, 1] }
  ]
}

/**
 * Etappe 6, "Vor den König" (alte Mechanik, Reihenfolge legen): Ester zieht ihre königlichen Kleider an, tritt in den inneren Hof, der König streckt das goldene Zepter aus, Ester lädt den König und Haman zum Mahl ein.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S35): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'kleider', image: `${G}reihenfolge/karte-1.webp`, label: 'Ester zieht ihre königlichen Kleider an' },
    { id: 'hof', image: `${G}reihenfolge/karte-2.webp`, label: 'Ester tritt in den inneren Hof' },
    { id: 'zepter', image: `${G}reihenfolge/karte-3.webp`, label: 'Der König streckt das goldene Zepter aus' },
    { id: 'mahl', image: `${G}reihenfolge/karte-4.webp`, label: 'Ester lädt den König und Haman zum Mahl ein' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['hof', 'zepter', 'mahl'] },
    { hint: 'Runde 2: Jetzt mit dem Ankleiden und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['kleider', 'hof', 'zepter', 'mahl'] }
  ]
}

/**
 * Etappe 3, "Memory" (alte Mechanik): die sechs Dinge der neuen Königin (Salbe, Gewürze, Krone, Fest, Geschenke, Chronik); die Rückseite zeigt eine goldene Krone (Bildauftrag S34, ein Bogen mit den sechs Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-salbe.webp`, text: 'Die Salbe: Ein Jahr lang wird jede Frau mit Salben und Duftölen vorbereitet.' },
    { image: `${G}memory/karte-gewuerze.webp`, text: 'Die Gewürze: Auch Gewürze gehören zur Vorbereitung.' },
    { image: `${G}memory/karte-krone.webp`, text: 'Die Krone: Der König setzt Ester die Krone aufs Haupt.' },
    { image: `${G}memory/karte-fest.webp`, text: 'Das Fest: Der König gibt ein großes Fest für Ester.' },
    { image: `${G}memory/karte-geschenk.webp`, text: 'Die Geschenke: Der König schenkt reich.' },
    { image: `${G}memory/karte-chronik.webp`, text: 'Die Chronik: Mordechais Hilfe wird in die Chronik des Königs geschrieben.' }
  ]
}

/**
 * Etappe 1, "Das Fest schmücken" (neu): der Festgarten des Palastes in Susa (gemaltes Bild) wartet auf seinen Schmuck, der in einer Reihe darunter liegt. Das Kind zieht ein Ding (oder tippt es an und tippt den Platz) an seinen Ort.
 * Runde 1: drei Tücher an die drei Säulen, "weiß, rot und blau" von links nach rechts, wie der Text es sagt. Runde 2: der Boden aus vier Marmorarten, "grün, weiß, gelb und schwarz". Runde 3: die goldenen Becher auf den langen Tisch;
 * jeder Becher sieht anders aus, darum nimmt der Tisch einen Becher, der genauso aussieht wie ein schon stehender, nicht an (ein Zwilling, ein Fehler). Ein Ding am falschen Platz springt zurück (Kreuz, Fehler).
 * Bilder (Bildauftrag S31): `schmuecken/halle.webp` 1200 × 900, `tuch-1..3.webp`, `stein-1..4.webp`, `becher-1..5.webp` (aus je einem Bogen geschnitten, Magenta-Schnitt).
 */
const SCHMUECKEN: DecorGame = {
  background: `${G}schmuecken/halle.webp`,
  rounds: [
    {
      hint: 'Hänge die Tücher an die Säulen: erst weiß, dann rot, dann blau, von links nach rechts.',
      mode: 'order',
      slots: [{ x: 17, y: 19, w: 14 }, { x: 50, y: 19, w: 14 }, { x: 83, y: 19, w: 14 }],
      items: [{ image: `${G}schmuecken/tuch-2.webp`, key: 'rot' }, { image: `${G}schmuecken/tuch-3.webp`, key: 'blau' }, { image: `${G}schmuecken/tuch-1.webp`, key: 'weiss' }],
      want: ['weiss', 'rot', 'blau'],
      ghostW: 14
    },
    {
      hint: 'Lege den Boden: grün, weiß, gelb und schwarz, von links nach rechts.',
      mode: 'order',
      slots: [{ x: 20, y: 89, w: 18 }, { x: 40, y: 89, w: 18 }, { x: 60, y: 89, w: 18 }, { x: 80, y: 89, w: 18 }],
      items: [{ image: `${G}schmuecken/stein-3.webp`, key: 'gelb' }, { image: `${G}schmuecken/stein-1.webp`, key: 'gruen' }, { image: `${G}schmuecken/stein-4.webp`, key: 'schwarz' }, { image: `${G}schmuecken/stein-2.webp`, key: 'weiss' }],
      want: ['gruen', 'weiss', 'gelb', 'schwarz'],
      ghostW: 18
    },
    {
      hint: 'Stelle die goldenen Becher auf den Tisch. Jeder Becher sieht anders aus.',
      mode: 'distinct',
      slots: [{ x: 25, y: 59, w: 14 }, { x: 37.5, y: 59, w: 14 }, { x: 50, y: 59, w: 14 }, { x: 62.5, y: 59, w: 14 }, { x: 75, y: 59, w: 14 }],
      items: [
        { image: `${G}schmuecken/becher-3.webp`, key: 'b3' },
        { image: `${G}schmuecken/becher-1.webp`, key: 'b1' },
        { image: `${G}schmuecken/becher-3.webp`, key: 'b3' },
        { image: `${G}schmuecken/becher-5.webp`, key: 'b5' },
        { image: `${G}schmuecken/becher-2.webp`, key: 'b2' },
        { image: `${G}schmuecken/becher-4.webp`, key: 'b4' }
      ],
      ghostW: 14
    }
  ]
}

/**
 * Etappe 7, "Den Mann ehren" (neu): Haman nennt für den Mann, den der König ehren will, königliche Kleider, ein Pferd des Königs und eine Krone. In drei Runden findet das Kind das Genannte: Runde 1 die Kleider, Runde 2 etwas für den Kopf,
 * Runde 3 das Tier; je vier Dinge liegen in einer Reihe, nur eines hat Haman genannt. Das Richtige fliegt in einen Rahmen im Bild, ein falsches wird durchgestrichen (ein Fehler, es kann nicht noch einmal gewählt werden).
 * Am Ende zeigt die Straße von Susa Mordechai auf dem Pferd des Königs, von Haman geführt.
 * Bilder (Bildauftrag S32): `ehren/hof.webp` und `umzug.webp` 1200 × 900, `kleid-1..4.webp`, `kopf-1..4.webp`, `tier-1..4.webp` (aus je einem Bogen geschnitten).
 */
const EHREN: HonorGame = {
  background: `${G}ehren/hof.webp`,
  parade: `${G}ehren/umzug.webp`,
  rounds: [
    {
      hint: 'Haman nennt zuerst die Kleider des Königs. Tippe das königliche Gewand an.',
      choices: [
        { image: `${G}ehren/kleid-2.webp`, right: false, label: 'Schlichtes braunes Wollgewand' },
        { image: `${G}ehren/kleid-4.webp`, right: false, label: 'Grüner Hirtenmantel' },
        { image: `${G}ehren/kleid-1.webp`, right: true, label: 'Königliches blau-weißes Gewand' },
        { image: `${G}ehren/kleid-3.webp`, right: false, label: 'Graues Sacktuch' }
      ]
    },
    {
      hint: 'Dann nennt er etwas für den Kopf: die Krone. Tippe sie an.',
      choices: [
        { image: `${G}ehren/kopf-1.webp`, right: true, label: 'Goldene Krone' },
        { image: `${G}ehren/kopf-4.webp`, right: false, label: 'Strohhut' },
        { image: `${G}ehren/kopf-2.webp`, right: false, label: 'Olivenkranz' },
        { image: `${G}ehren/kopf-3.webp`, right: false, label: 'Helles Kopftuch' }
      ]
    },
    {
      hint: 'Zuletzt nennt er ein Tier: das Pferd des Königs. Tippe es an.',
      choices: [
        { image: `${G}ehren/tier-2.webp`, right: false, label: 'Grauer Esel' },
        { image: `${G}ehren/tier-4.webp`, right: false, label: 'Ochse' },
        { image: `${G}ehren/tier-3.webp`, right: false, label: 'Kamel' },
        { image: `${G}ehren/tier-1.webp`, right: true, label: 'Das Pferd des Königs' }
      ]
    }
  ]
}

/**
 * Etappe 9, "Wimmelbild" (alte Mechanik): das festlich geschmückte Susa im Hochformat (Bildauftrag S36) mit sechs Boten auf jungen Maultieren, die den Brief in alle Länder tragen; manche stehen hinter Marktständen, Teppichen und Körben.
 * Bilder: `wimmel/szene.webp`, `bote-1..6.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Bote 1', 'Bote 2', 'Bote 3', 'Bote 4', 'Bote 5', 'Bote 6'],
  doneText: 'Du hast alle sechs Boten gefunden, die den Brief in alle Länder tragen!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/bote-1.webp`, x: 58, y: 57, w: 13 },
    { image: `${G}wimmel/bote-2.webp`, x: 77, y: 58, w: 13 },
    { image: `${G}wimmel/bote-3.webp`, x: 66, y: 71, w: 16 },
    { image: `${G}wimmel/bote-4.webp`, x: 87, y: 73, w: 17 },
    { image: `${G}wimmel/bote-5.webp`, x: 60, y: 88, w: 21 },
    { image: `${G}wimmel/bote-6.webp`, x: 48, y: 66, w: 15 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 49, y: 68, w: 15 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 88, y: 75, w: 20 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 66, y: 72, w: 18 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 60, y: 91, w: 20 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 80, y: 66, w: 14 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 52, y: 76, w: 14 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 74, y: 86, w: 13 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 94, y: 62, w: 12 }
  ]
}

export const ester: Journey = {
  id: 'ester',
  title: 'Ester',
  subtitle: 'Die Königin, die ihr Volk rettet',
  age: '8-10',
  downloadMb: 15, // gemessen 15 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: Königin Ester mit dem goldenen Zepter (Konturzeichnung)
  gift: { title: 'Königin Ester', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus esterPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/ester/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0715, y: 0.5722, d: 0.0339 },
      { x: 0.1833, y: 0.6584, d: 0.0339 },
      { x: 0.2583, y: 0.6729, d: 0.0339 },
      { x: 0.4701, y: 0.6729, d: 0.0339 },
      { x: 0.5689, y: 0.6729, d: 0.0339 },
      { x: 0.6298, y: 0.6511, d: 0.0339 },
      { x: 0.6808, y: 0.7227, d: 0.0339 },
      { x: 0.7748, y: 0.7154, d: 0.0339 },
      { x: 0.9224, y: 0.7439, d: 0.0339 }
    ],
    exam: { x: 0.9800, y: 0.6657, d: 0.0339 },
    path: ESTER_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Das Fest in Susa',
      ref: 'Ester 1',
      text: [
        'Ahasveros ist König über hundertsiebenundzwanzig Länder, von Indien bis nach Kusch. In seinem Palast in Susa gibt er ein Fest, das hundertachtzig Tage dauert. Alle Fürsten und Diener sollen sehen, wie reich er ist.',
        'Danach lädt er das ganze Volk von Susa ein, sieben Tage lang in den Garten des Palastes. Weiße, rote und blaue Tücher hängen zwischen den Marmorsäulen. Der Boden ist aus grünem, weißem, gelbem und schwarzem Marmor. Der Wein kommt in goldenen Bechern, und jeder Becher sieht anders aus.',
        'Am siebten Tag lässt der König die Königin Waschti rufen. Sie soll mit ihrer Krone kommen, damit alle sehen, wie schön sie ist. Aber Waschti kommt nicht. Da wird der König zornig, und auf den Rat seiner Fürsten soll sie nie wieder vor ihn treten.'
      ],
      // Spiel: Das Fest schmücken (schmuecken, neu)
      task: { kind: 'schmuecken', hint: 'Schmücke den Festgarten, wie der Text es sagt.', decor: SCHMUECKEN },
      questions: [
        { q: 'Wie lange dauert das große Fest des Königs für die Fürsten?', options: ['hundertachtzig Tage', 'sieben Tage', 'drei Tage'], answer: 0 },
        { q: 'Welche Farben haben die Tücher zwischen den Säulen?', options: ['weiß, rot und blau', 'gelb und grün', 'schwarz und braun'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Hadassa, die Ester heißt',
      ref: 'Ester 2,1–11',
      text: [
        'Der König sucht eine neue Königin. Seine Diener holen junge Frauen aus dem ganzen Land in den Palast von Susa. Die Frau, die dem König am besten gefällt, soll an Waschtis Stelle Königin werden.',
        'In Susa lebt ein Jude namens Mordechai. Man hat ihn einst aus Jerusalem weggeführt. Er hat ein Mädchen bei sich aufgenommen, das weder Vater noch Mutter hat: Hadassa, die auch Ester heißt, die Tochter seines Onkels. Sie ist schön und freundlich.',
        'Auch Ester kommt in den Palast, zu Hegai, der über die Frauen wacht. Er mag sie gern und gibt ihr sieben Mägde und den besten Platz im Haus. Ester sagt niemandem, aus welchem Volk sie kommt, denn Mordechai hat es ihr geboten. Er geht jeden Tag vor dem Hof auf und ab und will wissen, wie es ihr geht.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Palasttor zusammen.', puzzle: { image: `${G}puzzle/tor.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wer hat Ester bei sich aufgenommen?', options: ['Mordechai', 'der König', 'Hegai'], answer: 0 },
        { q: 'Wie viele Mägde gibt Hegai ihr?', options: ['sieben', 'drei', 'zwölf'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Die neue Königin',
      ref: 'Ester 2,12–23',
      text: [
        'Ein ganzes Jahr lang wird jede junge Frau mit Salben, Duftölen und Gewürzen auf den König vorbereitet. Dann darf sie sich aussuchen, was sie mit in den Palast nehmen will. Ester wünscht sich nichts als das, was Hegai ihr rät. Alle, die sie sehen, haben sie gern.',
        'Der König gewinnt Ester lieber als alle anderen. Er setzt ihr die Krone auf und macht sie zur Königin. Dann gibt er ein großes Fest für sie und schenkt reich.',
        'Mordechai sitzt am Tor des Königs. Dort hört er, dass zwei Türhüter dem König schaden wollen. Er sagt es Ester, und Ester sagt es dem König in Mordechais Namen. Man forscht nach, und es stimmt. Die beiden Männer werden bestraft, und Mordechais Hilfe wird in die Chronik des Königs geschrieben.'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Was setzt der König Ester auf den Kopf?', options: ['die Krone', 'einen Kranz', 'einen Schleier'], answer: 0 },
        { q: 'Wer hört am Tor, dass zwei Türhüter dem König schaden wollen?', options: ['Mordechai', 'Hegai', 'Ester'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Hamans Plan',
      ref: 'Ester 3',
      text: [
        'Der König macht einen Mann namens Haman zum höchsten Fürsten im Reich. Alle Diener am Tor werfen sich vor ihm nieder, so hat es der König befohlen. Nur Mordechai tut es nicht. Er hat ihnen gesagt, dass er ein Jude ist.',
        'Da packt Haman der Zorn. Mordechai allein zu bestrafen, ist ihm zu wenig. Er will das ganze Volk der Juden vernichten, überall im Reich. Er lässt das Los werfen, um einen Tag dafür zu bestimmen.',
        'Dann geht Haman zum König. „Es gibt ein Volk in deinem Reich, das andere Gesetze hat“, sagt er. „Gib den Befehl, es zu vernichten.“ Der König gibt Haman seinen Siegelring. Läufer tragen die Briefe in alle Länder. Der König und Haman sitzen beim Wein, aber die Stadt Susa ist voller Angst.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wozu hat der König alle Diener am Tor verpflichtet?', options: ['vor Haman niederzufallen', 'Haman Geschenke zu bringen', 'Haman zu dienen'], answer: 0 },
        { q: 'Wer wirft sich nicht vor Haman nieder?', options: ['Mordechai', 'Hegai', 'Ester'], answer: 0 },
        { q: 'Wem gibt der König seinen Siegelring?', options: ['Haman', 'Mordechai', 'Ester'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Wer weiß, wozu?',
      ref: 'Ester 4',
      text: [
        'Als Mordechai von dem Befehl hört, zerreißt er seine Kleider. Er zieht einen Sack an, streut sich Asche aufs Haupt und klagt laut mitten in der Stadt. In allen Ländern weinen und fasten viele Juden.',
        'Ester erschrickt, als ihre Mägde ihr davon erzählen. Sie schickt Hathach zu Mordechai, um zu erfahren, was geschehen ist. Mordechai gibt ihm den Befehl in Abschrift mit. „Geh zum König und bitte für dein Volk“, lässt er ihr sagen.',
        'Ester antwortet: „Wer unaufgefordert zum König geht, muss sterben. Nur wenn der König das goldene Zepter ausstreckt, bleibt er am Leben. Ich bin schon dreißig Tage nicht gerufen worden.“ Mordechai lässt ihr sagen: „Wer weiß, ob du nicht gerade für diese Zeit Königin geworden bist?“ Da sagt Ester: „Fastet drei Tage für mich. Dann gehe ich zum König.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Was tut Mordechai, als er von dem Befehl hört?', options: ['Er zerreißt seine Kleider und zieht einen Sack an.', 'Er geht zum König.', 'Er verlässt die Stadt.'], answer: 0 },
        { q: 'Wen schickt Ester zu Mordechai?', options: ['Hathach', 'Hegai', 'Haman'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Vor dem König',
      ref: 'Ester 5',
      text: [
        'Am dritten Tag zieht Ester ihre königlichen Kleider an. Sie tritt in den inneren Hof des Palastes. Der König sitzt auf seinem Thron und sieht sie stehen. Da streckt er ihr das goldene Zepter entgegen, und Ester berührt die Spitze.',
        '„Was ist dir, Königin Ester?“, fragt der König. „Was willst du? Auch die Hälfte des Reiches soll dir gehören.“ Ester sagt nur: „Der König und Haman sollen heute zu dem Mahl kommen, das ich vorbereitet habe.“',
        'Beim Mahl fragt der König noch einmal. Doch Ester lädt beide für den nächsten Tag zu einem zweiten Mahl ein. Haman geht froh nach Hause, aber am Tor sieht er Mordechai. Der steht nicht vor ihm auf. Da lässt Haman einen hohen Pfahl für Mordechai aufrichten.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was streckt der König Ester entgegen?', options: ['das goldene Zepter', 'seine Krone', 'einen Brief'], answer: 0 },
        { q: 'Wen lädt Ester zum Mahl ein?', options: ['den König und Haman', 'Mordechai und Hegai', 'den König und Hathach'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Die schlaflose Nacht',
      ref: 'Ester 6',
      text: [
        'In dieser Nacht kann der König nicht schlafen. Er lässt sich die Chronik vorlesen. Dort steht, dass Mordechai ihn vor den zwei Türhütern gerettet hat. „Welche Ehre haben wir ihm dafür erwiesen?“, fragt der König. „Keine“, sagen seine Diener.',
        'Gerade steht Haman im Hof, um den König um Mordechais Bestrafung zu bitten. Der König lässt ihn hereinrufen. „Was soll man mit dem Mann tun, den der König ehren will?“, fragt er. Haman denkt: Wer sollte das sein, wenn nicht ich? „Man soll ihm königliche Kleider bringen, ein Pferd des Königs und eine Krone“, sagt er. „Ein Fürst soll ihn durch die Stadt führen und rufen: So ehrt man den Mann, den der König ehren will.“',
        '„Tu es gleich“, sagt der König, „mit Mordechai, dem Juden am Tor.“ Haman gehorcht und führt Mordechai selbst durch die Stadt. Danach eilt er heim, den Kopf verhüllt.'
      ],
      // Spiel: Den Mann ehren (ehren, neu)
      task: { kind: 'ehren', hint: 'Finde, was Haman für den Mann nennt, den der König ehren will.', honor: EHREN },
      questions: [
        { q: 'Was lässt sich der König in der schlaflosen Nacht vorlesen?', options: ['die Chronik', 'einen Brief', 'Lieder'], answer: 0 },
        { q: 'Wen will der König ehren?', options: ['Mordechai', 'Haman', 'Hathach'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Das Mahl der Königin',
      ref: 'Ester 7',
      text: [
        'Am zweiten Tag sitzen der König und Haman wieder bei Ester zu Tisch. „Was wünschst du dir, Königin Ester?“, fragt der König. „Auch die Hälfte des Reiches soll dir gehören.“',
        'Da antwortet Ester: „Wenn ich Gnade bei dir gefunden habe, König, dann schenke mir mein Leben und das meines Volkes. Wir sind verkauft, um vernichtet zu werden.“ „Wer wagt das?“, ruft der König. Ester sagt: „Der Feind ist dieser böse Haman.“ Haman erschrickt.',
        'Der König steht zornig auf und geht in den Garten. Haman bittet Ester um sein Leben. Als der König zurückkommt, ist sein Zorn nicht vorbei. Man verhüllt Haman das Gesicht. Der Pfahl, den Haman für Mordechai errichtet hat, wird sein eigener. Danach legt sich der Zorn des Königs.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Worum bittet Ester den König?', options: ['um ihr Leben und das ihres Volkes', 'um Gold', 'um ein neues Haus'], answer: 0 },
        { q: 'Wen nennt Ester den Feind?', options: ['Haman', 'Hegai', 'Hathach'], answer: 0 },
        { q: 'Wohin geht der König, als er zornig wird?', options: ['in den Garten', 'auf den Markt', 'zum Tor'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Licht und Freude',
      ref: 'Ester 8–9',
      text: [
        'Der König gibt Ester das Haus Hamans. Mordechai tritt vor ihn und bekommt den Siegelring. Ester fällt dem König zu Füßen und fleht ihn weinend an. Da streckt der König das goldene Zepter aus. „Wie kann ich zusehen, wie mein Volk umkommt?“, fragt sie.',
        'Ein Befehl des Königs darf nicht zurückgenommen werden. Darum schreiben die Schreiber einen neuen Brief, in der Sprache jedes Volkes. Die Juden dürfen ihr Leben schützen. Reitende Boten auf jungen Maultieren tragen ihn in alle Länder.',
        'Mordechai geht in blauen und weißen Kleidern vom König, mit goldener Krone und purpurnem Mantel. Susa jubelt. Den Juden ist Licht und Freude und Wonne und Ehre gekommen. Am Tag, an dem man sie überfallen wollte, stehen sie für ihr Leben ein, und niemand kann ihnen widerstehen. Danach feiern sie das Purimfest. Sie schicken einander Geschenke und geben den Armen davon ab.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde die sechs Boten, die den Brief in alle Länder tragen.', count: 6, find: WIMMEL },
      questions: [
        { q: 'Wer trägt den neuen Brief in alle Länder?', options: ['reitende Boten auf Maultieren', 'Schiffe', 'Brieftauben'], answer: 0 },
        { q: 'Was gibt der König Mordechai?', options: ['den Siegelring', 'ein Schwert', 'Silber'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Von Indien bis nach Kusch: Über wie viele Länder ist Ahasveros König?', options: ['über hundertsiebenundzwanzig', 'über sieben', 'über dreißig'], answer: 0 },
    { q: 'Welchen anderen Namen hat Hadassa?', options: ['Ester', 'Waschti', 'Hegai'], answer: 0 },
    { q: 'Was setzt der König Ester aufs Haupt?', options: ['die Krone', 'einen Schleier', 'einen Kranz'], answer: 0 },
    { q: 'Wie lange sollen die Juden für Ester fasten?', options: ['drei Tage', 'einen Tag', 'zwölf Tage'], answer: 0 },
    { q: 'Was streckt der König Ester entgegen, als sie vor ihn tritt?', options: ['das goldene Zepter', 'sein Schwert', 'einen Brief'], answer: 0 },
    { q: 'Wie heißt das Fest, das die Juden feiern?', options: ['Purim', 'Pessach', 'Laubhüttenfest'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of ester.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of ester.stages) {
  const file = `audio/abenteuer/ester/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the feast in Susa, the courage of the queen, light and joy); they follow one another at random
ester.music = [
  'audio/abenteuer/ester/musik-fest-v2.mp3',
  'audio/abenteuer/ester/musik-mut-v2.mp3',
  'audio/abenteuer/ester/musik-freude-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(ester, esterEn)
