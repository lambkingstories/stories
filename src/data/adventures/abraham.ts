/**
 * Abenteuer "Abraham" (1. Mose 12; 13; 15; 18; 21; 22) für 8 bis 10 Jahre: 6 Etappen, Untertitel "Gott ruft, Gott hält Wort". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Abraham/ENTWURF_Abraham.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Kamele beladen (neu), 2 Zählen (alt), 3 Sternbild nachlegen (neu), 4 Wasser für die Gäste
 * (neu im Einsatz: die gebaute Gieß-Mechanik), 5 Puzzle (alt), 6 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/abraham/, images/abenteuer/spiele/abraham/<spiel>/, audio/abenteuer/abraham/.
 *
 * STAND 20.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte und Vorlese-Aufnahmen (Deutsch und Englisch) sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BalanceGame, ConstellationGame, CountGroup, Journey, WaterGame } from '@/types/adventure'
import { ABRAHAM_PATH } from './abrahamPath'
import { localize } from './localize'
import { abrahamEn } from './en/abraham.en'

const IMG = 'images/abenteuer/abraham/'
const G = 'images/abenteuer/spiele/abraham/'
const REC = 'audio/abenteuer/abraham/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Kamele beladen": ein Kamel mit zwei Körben vor dem Etappenbild 1, Pakete in drei Gewichten (Bildauftrag A10). Jede Runde hat zwei Kamele; jedes ist lösbar
 * (die Pakete eines Kamels lassen sich in zwei gleich schwere Hälften teilen). Das Kamel ist das aus Noah (Kopie unter `waage/`, Bildauftrag A10).
 * Die Körbe hängen an der Flanke des Kamels (`baskets`: Prozent des Kamelbildes, Oberkante des Korbs, nach dem Aussehen des Noah-Kamels gesetzt, am Handy zu prüfen).
 * Die Pakete haben drei verschieden große Bilder (das Gewicht ist an der Größe zu erkennen, die App skaliert sie nicht auf gleiche Größe).
 */
const WAAGE: BalanceGame = {
  background: `${IMG}etappe-bild-01.webp`,
  camel: `${G}waage/kamel.webp`,
  basket: `${G}waage/korb.webp`,
  baskets: [[28, 45], [64, 45]],
  packs: [
    { id: 'klein-1', image: `${G}waage/sack-klein.webp`, weight: 1, label: 'kleiner Sack' },
    { id: 'klein-2', image: `${G}waage/sack-klein.webp`, weight: 1, label: 'kleiner Sack' },
    { id: 'klein-3', image: `${G}waage/sack-klein.webp`, weight: 1, label: 'kleiner Sack' },
    { id: 'schlauch-1', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'schlauch-2', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'schlauch-3', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'schlauch-4', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'gross-1', image: `${G}waage/sack-gross.webp`, weight: 3, label: 'großer Sack' },
    { id: 'gross-2', image: `${G}waage/sack-gross.webp`, weight: 3, label: 'großer Sack' },
    { id: 'gross-3', image: `${G}waage/sack-gross.webp`, weight: 3, label: 'großer Sack' }
  ],
  rounds: [
    {
      hint: 'Verteile die drei Pakete auf beide Seiten.',
      camels: [{ packs: ['klein-1', 'schlauch-1', 'gross-1'] }, { packs: ['klein-2', 'klein-3', 'schlauch-2'] }]
    },
    {
      hint: 'Jetzt sind es mehr und schwerere Pakete.',
      camels: [{ packs: ['klein-1', 'schlauch-1', 'schlauch-2', 'gross-1', 'schlauch-3'] }, { packs: ['gross-2', 'gross-3', 'klein-2', 'schlauch-4', 'klein-3'] }]
    }
  ]
}

/**
 * Etappe 2, "Zählen": die Herden Abrams und Lots auf dem Hügel (Schafe, Ziegen, Kamele), alle zusammen gezählt. Das Zählspiel hat nur eine Szene (keine Runden).
 * Die Tiere sind die aus Noah (Kopien unter `zaehlen/`); Hintergrund ist das Etappenbild 2.
 */
const ZAEHLEN_GRUPPEN: CountGroup[] = [
  { image: `${G}zaehlen/schaf.webp`, count: 6 },
  { image: `${G}zaehlen/ziege.webp`, count: 4 },
  { image: `${G}zaehlen/kamel.webp`, count: 3 }
]

/**
 * Etappe 3, "Sternbild nachlegen": ein Rahmen am Nachthimmel (Etappenbild 3); der Stern ist der Goldstern der Oberfläche, Rahmen und Vorbild macht die App.
 * Der Rahmen (Prozent des Etappenbildes 3) liegt auf dem freien Nachthimmel rechts von Abrahams Kopf und Hand (Milchstraße), oberhalb der Berge; das Vorbild steht klein links oben.
 */
const STERNBILD: ConstellationGame = {
  background: `${IMG}etappe-bild-03.webp`,
  star: 'images/abenteuer/ui/stern-gold-1.webp',
  frame: { x: 54, y: 3, w: 44, h: 32 },
  rounds: [
    { hint: 'Das Vorbild bleibt sichtbar: vier Sterne.', showAlways: true, targets: [[18, 72], [42, 28], [68, 58], [86, 20]] },
    { hint: 'Schau gut hin: Das Vorbild verschwindet. Sechs Sterne.', showAlways: false, targets: [[10, 62], [26, 24], [48, 48], [60, 14], [76, 66], [90, 30]] }
  ]
}

/**
 * Etappe 4, "Wasser für die Gäste": Krug am Brunnen füllen, Waschschüsseln der drei Gäste füllen (Bildauftrag A11, gebaute Gieß-Mechanik). Runde 1 drei Schüsseln
 * mit einem Krug, Runde 2 drei tiefe Schüsseln mit zwei Krügen (andere Ids, gleiche Plätze).
 * Der Brunnen (`river`: Ecke x, y, Breite, Höhe) und die drei Plätze der Schüsseln (Mitte x, Fußpunkt y, Breite; vor den drei Sitzplätzen) sind die Messwerte aus `giessen/eichen-messung.json`.
 */
const GIESSEN: WaterGame = {
  scene: `${G}giessen/eichen.webp`,
  river: { x: 0, y: 44, w: 30, h: 26 },
  jugEmpty: `${G}giessen/krug-leer.webp`,
  jugFull: `${G}giessen/krug-voll.webp`,
  plants: [
    { id: 'schuessel-1', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Schüssel für den ersten Gast', x: 45, y: 75, w: 18, need: 1 },
    { id: 'schuessel-2', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Schüssel für den zweiten Gast', x: 66, y: 75, w: 18, need: 1 },
    { id: 'schuessel-3', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Schüssel für den dritten Gast', x: 87, y: 75, w: 18, need: 1 },
    { id: 'tief-1', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Tiefe Schüssel für den ersten Gast', x: 45, y: 75, w: 18, need: 2 },
    { id: 'tief-2', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Tiefe Schüssel für den zweiten Gast', x: 66, y: 75, w: 18, need: 2 },
    { id: 'tief-3', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Tiefe Schüssel für den dritten Gast', x: 87, y: 75, w: 18, need: 2 }
  ],
  rounds: [
    { hint: 'Jede Schüssel braucht einen Krug.', plants: ['schuessel-1', 'schuessel-2', 'schuessel-3'] },
    { hint: 'Die tiefen Schüsseln brauchen zwei Krüge.', plants: ['tief-1', 'tief-2', 'tief-3'] }
  ]
}

export const abraham: Journey = {
  id: 'abraham',
  title: 'Abraham',
  subtitle: 'Gott ruft, Gott hält Wort',
  age: '8-10',
  downloadMb: 8, // 8,0 MB gezählt am 20.10.2026 (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Abraham und das Zelt unter dem Sternenhimmel (Ruhe, Verheißung)
  // Geschenk-Ausmalbild: Abraham und Sara vor dem Zelt unter dem Sternenhimmel, mit Schafen, friedlich
  gift: { title: 'Abraham und Sara vor dem Zelt unter dem Sternenhimmel', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 4850 × 836 px) mit Stationen und Perlenweg aus fertig/messdaten.json und abrahamPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 4850 / 836,
    widthPx: 4850,
    stages: [
      { x: 0.0536, y: 0.6459, d: 0.0351 },
      { x: 0.2577, y: 0.628, d: 0.0351 },
      { x: 0.3711, y: 0.628, d: 0.0351 },
      { x: 0.5216, y: 0.6459, d: 0.0351 },
      { x: 0.8268, y: 0.6459, d: 0.0351 },
      { x: 0.9031, y: 0.634, d: 0.0351 }
    ],
    exam: { x: 0.9835, y: 0.6459, d: 0.0351 },
    path: ABRAHAM_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Der Ruf',
      ref: '1. Mose 12,1–9',
      audio: `${REC}geschichte-01-v1.mp3`,
      text: [
        'Als sich die Menschen nach Babel über die ganze Erde verteilt haben, ruft Gott einen einzelnen Mann. Er heißt Abram und wohnt mit seiner Frau Sarai in Haran.',
        'Gott sagt zu ihm: „Geh aus deinem Land, weg von deiner Familie und aus dem Haus deines Vaters, in das Land, das ich dir zeigen werde. Ich will dich zu einem großen Volk machen und dich segnen. Und durch dich sollen alle Familien auf der Erde gesegnet werden.“',
        'Abram vertraut Gott und macht sich auf den Weg. Er ist fünfundsiebzig Jahre alt. Sarai geht mit ihm und sein Neffe Lot, dazu die Knechte und Hirten mit den Schafen, den Ziegen und den Kamelen. Ein langer Zug macht sich auf, mit allem, was sie besitzen.',
        'Sie ziehen in das Land Kanaan. Bei den großen Bäumen von Sichem sagt Gott: „Dieses Land will ich deinen Nachkommen geben.“ Da baut Abram einen Altar, um Gott zu danken. Später baut er noch einen bei Bethel und schlägt dort sein Zelt auf. Dann zieht er weiter nach Süden.'
      ],
      task: { kind: 'waage', hint: 'Lege die Pakete so in die Körbe, dass das Kamel gerade steht.', balance: WAAGE },
      questions: [
        { q: 'Wohin soll Abram ziehen?', options: ['in das Land, das Gott ihm zeigt', 'zurück nach Hause', 'ans Meer'], answer: 0 },
        { q: 'Wer zieht mit Abram und Sarai?', options: ['Lot', 'ein König', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Abram und Lot',
      ref: '1. Mose 13',
      audio: `${REC}geschichte-02-v1.mp3`,
      text: [
        'Abram ist reich geworden an Schafen, Ziegen und Kamelen, und auch Lot hat große Herden. Aber das Land ist nicht groß genug für beide. Bald gibt es Streit zwischen ihren Hirten.',
        'Da sagt Abram zu Lot: „Es soll kein Streit sein zwischen dir und mir und zwischen unseren Hirten. Wir gehören doch zur selben Familie! Lass uns getrennte Wege gehen. Such du dir zuerst aus, wohin du ziehen willst.“',
        'Lot schaut sich um. Er sieht die weite Ebene am Fluss Jordan. Sie ist grün und gut bewässert, wie ein Garten Gottes. Lot wählt diese Ebene und zieht mit seinen Herden dorthin. So gehen die beiden in Frieden auseinander.',
        'Abram bleibt im Land Kanaan. Da sagt Gott zu ihm: „Schau dich um, nach allen Seiten! Das ganze Land, das du siehst, will ich dir und deinen Nachkommen geben. Sie werden so viele sein wie der Staub auf der Erde.“ Abram stellt sein Zelt bei den großen Eichen von Mamre auf und baut dort einen Altar für Gott.'
      ],
      task: { kind: 'zaehlen', hint: 'Tippe die Tiere an und zähle sie.', count: 13, image: '', question: 'Wie viele Tiere sind es zusammen?', background: `${IMG}etappe-bild-02.webp`, groups: ZAEHLEN_GRUPPEN },
      questions: [
        { q: 'Warum können Abram und Lot nicht zusammenbleiben?', options: ['Das Land ist für beide Herden zu klein.', 'Sie haben sich verirrt.', 'Es ist zu kalt.'], answer: 0 },
        { q: 'Wer darf sich zuerst ein Land aussuchen?', options: ['Lot', 'Abram', 'die Hirten'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Die Sterne',
      ref: '1. Mose 15,1–6',
      audio: `${REC}geschichte-03-v1.mp3`,
      text: [
        'Abram und Sarai sind alt geworden, und noch immer haben sie kein Kind. Abram sitzt vor seinem Zelt und wartet auf das, was Gott versprochen hat.',
        'Da spricht Gott zu ihm: „Fürchte dich nicht, Abram! Ich bin dein Schutz.“ Abram antwortet traurig: „Ich habe keinen Sohn. Wer soll einmal alles bekommen, was ich habe? Vielleicht einer meiner Knechte?“ Gott sagt: „Nein. Dein eigener Sohn soll dein Erbe sein.“',
        'Dann führt Gott Abram aus dem Zelt hinaus in die Nacht. „Sieh zum Himmel“, sagt er, „und zähle die Sterne, wenn du kannst!“ Abram schaut hinauf. Der Himmel funkelt, so viele Sterne sind da. „So viele sollen deine Nachkommen sein“, sagt Gott.',
        'Abram kann sie nicht zählen. Aber er glaubt Gott, was er ihm versprochen hat. Das ist gut in Gottes Augen.'
      ],
      task: { kind: 'sternbild', hint: 'Setze die Sterne so, wie du sie im Vorbild siehst.', constellation: STERNBILD },
      questions: [
        { q: 'Was soll Abram in der Nacht zählen?', options: ['die Sterne', 'die Schafe', 'die Zelte'], answer: 0 },
        { q: 'Wie viele Nachkommen verspricht Gott Abram?', options: ['so viele wie Sterne am Himmel', 'nur einen', 'keinen'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Besuch bei den Eichen',
      ref: '1. Mose 18,1–15',
      audio: `${REC}geschichte-04-v1.mp3`,
      text: [
        'Inzwischen hat Gott Abram und Sarai neue Namen gegeben. Abram heißt jetzt Abraham, das bedeutet „Vater vieler“, und Sarai heißt Sara. Beide sind sehr alt geworden.',
        'Es ist Mittag, und die Sonne brennt heiß. Abraham sitzt am Eingang seines Zeltes bei den großen Eichen von Mamre. Dort besucht ihn Gott, so erzählt die Bibel. Abraham sieht drei Männer vor sich stehen, Reisende in staubigen Mänteln.',
        'Er läuft ihnen entgegen und verneigt sich. „Bleibt doch bei mir“, sagt er, „ich hole Wasser für eure Füße, und ihr ruht euch unter dem Baum aus.“ Er ruft Sara: „Schnell, back Brot!“ Er holt ein junges Kalb. Dann stellt er Brot, Butter, Milch und das Fleisch vor seine Gäste und bleibt unter dem Baum bei ihnen, während sie essen.',
        '„Wo ist Sara, deine Frau?“, fragen die Männer. „Drinnen im Zelt“, sagt Abraham. Da sagt einer: „In einem Jahr komme ich wieder. Dann hat Sara einen Sohn.“ Sara hört es hinter der Zelttür. Sie lacht leise in sich hinein: „Ich bin doch viel zu alt!“',
        '„Warum lacht Sara?“, fragt der Gast. „Ist für Gott etwas zu schwer?“ Sara erschrickt und sagt: „Ich habe nicht gelacht.“ Aber er antwortet: „Doch, du hast gelacht.“'
      ],
      task: { kind: 'giessen', hint: 'Fülle den Krug am Brunnen und gieße das Wasser in die Schüsseln der Gäste.', water: GIESSEN },
      questions: [
        { q: 'Was stellt Abraham den Gästen vor?', options: ['Brot, Butter, Milch und Fleisch', 'Fisch und Datteln', 'nur Wasser'], answer: 0 },
        { q: 'Was tut Sara, als sie hört, dass sie einen Sohn bekommt?', options: ['Sie lacht leise.', 'Sie weint.', 'Sie singt.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Isaak',
      ref: '1. Mose 21,1–7',
      audio: `${REC}geschichte-05-v1.mp3`,
      text: [
        'Ein Jahr vergeht. Dann geschieht, was Gott versprochen hat: Sara bekommt einen Sohn, genau zu der Zeit, die Gott gesagt hat. Abraham ist hundert Jahre alt.',
        'Abraham gibt dem Kind den Namen, den Gott ihm genannt hat: Isaak. Das bedeutet „er lacht“.',
        'Sara hält ihren Sohn im Arm und sagt: „Gott hat mir ein Lachen geschenkt. Jeder, der davon hört, wird mit mir lachen.“ Und sie sagt: „Wer hätte Abraham je gesagt, dass Sara Kinder bekommt? Und nun habe ich ihm doch einen Sohn geboren, als er alt war.“',
        'Im Zelt liegt nun ein Baby. Sara lacht, und Abraham lacht. Gott hat Wort gehalten.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Familienbild zusammen.', puzzle: { image: `${G}puzzle/familie.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wie nennt Abraham seinen Sohn?', options: ['Isaak', 'Lot', 'Abram'], answer: 0 },
        { q: 'Wie alt ist Abraham, als Isaak geboren wird?', options: ['hundert Jahre', 'fünfzig Jahre', 'zwanzig Jahre'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Gott sorgt',
      ref: '1. Mose 22,1–14',
      audio: `${REC}geschichte-06-v1.mp3`,
      text: [
        'Isaak ist ein Junge geworden. Da prüft Gott Abraham, denn er will sehen, ob Abraham ihm ganz vertraut. „Abraham!“, ruft Gott. „Hier bin ich.“ Gott sagt: „Nimm Isaak, deinen Sohn, den du so lieb hast, und geh mit ihm in das Land Morija. Auf einem Berg, den ich dir zeige, sollst du ihn mir opfern.“ Das ist eine schwere Prüfung. Aber Abraham kennt Gott, der immer Wort gehalten hat.',
        'Früh am nächsten Morgen belädt Abraham seinen Esel mit Holz und geht mit Isaak und zwei Knechten los. Am dritten Tag sieht er den Berg. „Bleibt hier mit dem Esel“, sagt er zu den Knechten. „Der Junge und ich gehen hinauf, und wir kommen wieder zu euch zurück.“',
        'Isaak trägt das Holz auf den Schultern. „Vater“, fragt er, „wo ist das Tier für das Opfer?“ Abraham antwortet: „Mein Sohn, Gott wird selbst für das Opfertier sorgen.“',
        'Oben baut Abraham einen Altar und legt das Holz bereit. Da ruft eine Stimme vom Himmel: „Abraham! Abraham!“ Er antwortet: „Hier bin ich.“ „Tu dem Jungen nichts! Nun weiß ich, dass du Gott vertraust.“ Abraham blickt auf und sieht einen Widder, der sich mit den Hörnern im Gebüsch verfangen hat. Den bringt er Gott als Opfer, an Isaaks Stelle. Isaak steht gesund neben ihm. Abraham nennt den Ort „Gott sorgt“.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was trägt Isaak auf dem Weg den Berg hinauf?', options: ['das Holz', 'das Wasser', 'das Zelt'], answer: 0 },
        { q: 'Was antwortet Abraham auf Isaaks Frage nach dem Opfertier?', options: ['Gott wird dafür sorgen.', 'Ich habe es vergessen.', 'Wir kaufen es unterwegs.'], answer: 0 },
        { q: 'Was sieht Abraham im Gebüsch?', options: ['einen Widder', 'einen Hirsch', 'einen Esel'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Wohin ruft Gott Abram?', options: ['in ein Land, das Gott ihm zeigt', 'zurück nach Haran', 'ans Meer'], answer: 0 },
    { q: 'Wer wählt zuerst, als sich Abram und Lot trennen?', options: ['Lot', 'Abram', 'die Hirten'], answer: 0 },
    { q: 'Wie viele Nachkommen verspricht Gott Abram in der Sternennacht?', options: ['so viele wie Sterne am Himmel', 'nur zwölf', 'so viele wie Schafe'], answer: 0 },
    { q: 'Was tut Sara, als die Gäste ihr einen Sohn versprechen?', options: ['Sie lacht leise.', 'Sie weint.', 'Sie läuft weg.'], answer: 0 },
    { q: 'Wie heißt der Sohn von Abraham und Sara?', options: ['Isaak', 'Lot', 'Eliezer'], answer: 0 },
    { q: 'Wer sorgt für das Opfertier auf dem Berg?', options: ['Gott', 'Isaak', 'die Knechte'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(abraham, abrahamEn)
