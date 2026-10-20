/**
 * Abenteuer "Abraham" (1. Mose 12; 13; 15; 16; 17; 18; 21; 22; 23; 24) für 8 bis 10 Jahre: 11 Etappen, Untertitel "Gott ruft, Gott hält Wort". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Abraham/ENTWURF_Abraham.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Kamele beladen (neu), 2 Zählen (alt), 3 Sternbild nachlegen (neu), 6 Wasser für die Gäste
 * (neu im Einsatz: die gebaute Gieß-Mechanik), 8 Puzzle (alt), 9 nur Quiz. Die Etappen 4, 5, 7, 10 und 11 (Ausbau auf 11 Etappen, Etappenplan v2) haben bis zum Einbau
 * ihrer Spiele und Bilder eine Quiz-Aufgabe (PLATZHALTER) und ein vorhandenes Etappenbild; die Karte (6 Stationen) bleibt unverändert, wie bei Jakob.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/abraham/, images/abenteuer/spiele/abraham/<spiel>/, audio/abenteuer/abraham/.
 *
 * STAND 20.10.2026: alle Bilder der Etappen 1 bis 3, 6, 8 und 9 (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder) und die Messwerte sind eingebaut; Aufnahmen siehe `audio` der Etappen (eine Etappe ohne `audio` hat noch keine).
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BalanceGame, ConstellationGame, CountGroup, Journey, SilverGame, WaterGame } from '@/types/adventure'
import { ABRAHAM_PATH } from './abrahamPath'
import { localize } from './localize'
import { abrahamEn } from './en/abraham.en'

const IMG = 'images/abenteuer/abraham/'
const G = 'images/abenteuer/spiele/abraham/'
const REC = 'audio/abenteuer/abraham/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 10, "Passend bezahlen": Silberstücke in drei Größen werden auf ein Tuch gelegt, bis es genau vierhundert sind (Bildauftrag A22; Hintergrund = das Etappenbild 10). Runde 1 mit sichtbarer
 * Summe (200, 100, 100, 50, 50, 25, 25), Runde 2 ohne (150, 125, 100, 75, 75, 50, 25); jede Runde hat mindestens einen Weg, und alle Stücke zusammen sind mehr als vierhundert.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `silber/tuch.webp` 720 × 300, `silber-klein.webp` 110 × 70, `silber-mittel.webp` 150 × 90, `silber-gross.webp` 200 × 120,
 * `beutel.webp` 240 × 240, alle transparent.
 */
const SILBER: SilverGame = {
  background: `${IMG}etappe-bild-05.webp`,
  cloth: `${G}silber/tuch.webp`,
  purse: `${G}silber/beutel.webp`,
  pieces: [
    { id: 'a-200', image: `${G}silber/silber-gross.webp`, value: 200 },
    { id: 'a-100x', image: `${G}silber/silber-mittel.webp`, value: 100 },
    { id: 'a-100y', image: `${G}silber/silber-mittel.webp`, value: 100 },
    { id: 'a-50x', image: `${G}silber/silber-klein.webp`, value: 50 },
    { id: 'a-50y', image: `${G}silber/silber-klein.webp`, value: 50 },
    { id: 'a-25x', image: `${G}silber/silber-klein.webp`, value: 25 },
    { id: 'a-25y', image: `${G}silber/silber-klein.webp`, value: 25 },
    { id: 'b-150', image: `${G}silber/silber-gross.webp`, value: 150 },
    { id: 'b-125', image: `${G}silber/silber-mittel.webp`, value: 125 },
    { id: 'b-100', image: `${G}silber/silber-mittel.webp`, value: 100 },
    { id: 'b-75x', image: `${G}silber/silber-mittel.webp`, value: 75 },
    { id: 'b-75y', image: `${G}silber/silber-mittel.webp`, value: 75 },
    { id: 'b-50', image: `${G}silber/silber-klein.webp`, value: 50 },
    { id: 'b-25', image: `${G}silber/silber-klein.webp`, value: 25 }
  ],
  rounds: [
    { hint: 'Bezahle das Land mit genau vierhundert Silberstücken. Die Summe auf dem Tuch hilft dir.', price: 400, pieces: ['a-200', 'a-100x', 'a-100y', 'a-50x', 'a-50y', 'a-25x', 'a-25y'], showSum: true },
    { hint: 'Noch einmal vierhundert. Jetzt rechnest du selbst.', price: 400, pieces: ['b-150', 'b-125', 'b-100', 'b-75x', 'b-75y', 'b-50', 'b-25'], showSum: false }
  ]
}

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
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v2 mit elf Orten) mit Stationen und Perlenweg aus fertig/messdaten.json und abrahamPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v2-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0202, y: 0.625, d: 0.0339 },
      { x: 0.104, y: 0.5218, d: 0.0339 },
      { x: 0.1877, y: 0.5825, d: 0.0339 },
      { x: 0.2715, y: 0.6432, d: 0.0339 },
      { x: 0.3553, y: 0.5825, d: 0.0339 },
      { x: 0.4491, y: 0.5947, d: 0.0339 },
      { x: 0.5349, y: 0.5825, d: 0.0339 },
      { x: 0.6187, y: 0.5765, d: 0.0339 },
      { x: 0.7025, y: 0.5825, d: 0.0339 },
      { x: 0.7862, y: 0.6068, d: 0.0339 },
      { x: 0.87, y: 0.6068, d: 0.0339 }
    ],
    exam: { x: 0.974, y: 0.5158, d: 0.0339 },
    path: ABRAHAM_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Der Ruf',
      ref: '1. Mose 12,1–9',
      audio: `${REC}geschichte-01-v2.mp3`,
      text: [
        'Nach dem Turm von Babel haben sich die Menschen über die ganze Erde verteilt, aber Gott hat sie nicht aus den Augen verloren. In der Stadt Haran wohnt ein Mann namens Abram mit seiner Frau Sarai, und gerade ihn ruft Gott, damit durch ihn etwas ganz Neues beginnt.',
        'Eines Tages spricht Gott zu ihm: „Zieh fort aus deinem Land, weg von deiner Verwandtschaft und aus dem Haus deines Vaters, in das Land, das ich dir zeigen werde. Ich will dich zu einem großen Volk machen und dich segnen, und du sollst selbst ein Segen sein. Durch dich sollen alle Familien auf der Erde gesegnet werden.“',
        'Abram fragt nicht lange nach dem Wohin. Er vertraut Gott und bricht auf, obwohl er schon fünfundsiebzig Jahre alt ist. Seine Frau Sarai geht mit ihm und sein Neffe Lot, dazu alle Leute, die zu ihnen gehören, und alles, was sie besitzen, nehmen sie mit.',
        'So ziehen sie in das Land Kanaan hinein, bis zu den großen Bäumen bei Sichem. Dort spricht Gott zu Abram: „Dieses Land will ich deinen Nachkommen geben.“ Da baut Abram einen Altar, um Gott zu danken. Dann wandert er weiter zu den Bergen bei Bethel, schlägt sein Zelt auf, baut noch einen Altar und betet zu Gott.'
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
      audio: `${REC}geschichte-02-v2.mp3`,
      text: [
        'Abram ist reich geworden, und auch Lot hat große Herden und viele Zelte. Doch das Land ist zu klein für sie beide. Schon bald gibt es Streit zwischen den Hirten von Abram und den Hirten von Lot.',
        'Als Abram das hört, geht er zu Lot und sagt: „Es soll kein Streit sein zwischen dir und mir und zwischen unseren Hirten, denn wir gehören doch zu einer Familie. Das ganze Land liegt vor dir. Lass uns auseinandergehen. Such dir aus, wohin du ziehen willst, und ich gehe in die andere Richtung.“ Dabei ist Abram der Ältere, und trotzdem darf Lot zuerst wählen.',
        'Lot schaut sich um. Er sieht die weite Ebene am Fluss Jordan, grün und gut bewässert, so schön wie ein Garten Gottes. Lot wählt diese Ebene und zieht mit seinen Herden nach Osten, und er schlägt seine Zelte in der Nähe der Stadt Sodom auf. Die Menschen in Sodom sind allerdings böse vor Gott.',
        'Abram bleibt im Land Kanaan. Da sagt Gott zu ihm: „Schau dich um, nach Norden und Süden, nach Osten und Westen! Das ganze Land, das du siehst, will ich dir und deinen Nachkommen für immer geben. Sie werden so viele sein wie der Staub auf der Erde.“ Da zieht Abram weiter und stellt sein Zelt bei den großen Eichen von Mamre auf.'
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
      audio: `${REC}geschichte-03-v2.mp3`,
      text: [
        'Viele Jahre sind vergangen, und Abram und Sarai haben immer noch kein Kind. Eines Tages kommt Gottes Wort zu Abram: „Fürchte dich nicht, Abram! Ich bin dein Schutz, und ich werde dich reich belohnen.“',
        'Abram antwortet traurig: „Herr, was willst du mir schon geben? Ich habe keinen Sohn. Wenn ich sterbe, wird einer meiner Knechte alles bekommen, was ich habe.“ Aber Gott sagt: „Nein, nicht dieser Knecht soll dein Erbe sein, sondern dein eigener Sohn.“',
        'Dann führt Gott Abram hinaus unter den Nachthimmel. „Sieh zum Himmel“, sagt er, „und zähle die Sterne, wenn du es kannst!“ Abram schaut hinauf. Der Himmel funkelt von unzähligen Sternen. „So viele sollen deine Nachkommen sein“, sagt Gott.',
        'Abram kann sie nicht zählen, so viele sind es. Doch er glaubt, was Gott ihm verspricht, obwohl er und Sarai alt sind und noch immer kein Kind haben. Und Gott rechnet ihm dieses Vertrauen als Gerechtigkeit an: In Gottes Augen steht Abram richtig vor ihm.'
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
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Hagar und der Brunnen',
      ref: '1. Mose 16',
      text: [
        'Viele Jahre sind seit Gottes Versprechen vergangen, und Abram und Sarai haben immer noch kein Kind. Sarai hat eine Magd aus Ägypten, die Hagar heißt. Weil Sarai selbst keine Kinder bekommen kann, gibt sie Hagar ihrem Mann, in der Hoffnung, dass Hagar ihm ein Kind schenkt.',
        'Bald erwartet Hagar tatsächlich ein Kind. Doch zwischen den beiden Frauen gibt es Streit, und Hagar läuft in ihrer Not davon, mitten in die Wüste. Erschöpft setzt sie sich an einen Brunnen am Weg.',
        'Aber Gott hat Hagar gesehen. Ein Bote Gottes findet sie am Brunnen und fragt: „Hagar, woher kommst du, und wohin gehst du?“ „Ich laufe vor Sarai davon“, antwortet sie. Da sagt der Bote: „Kehr zu ihr zurück. Du wirst einen Sohn bekommen, und du sollst ihn Ismael nennen, das bedeutet: Gott hört. Denn Gott hat gehört, wie schlecht es dir geht.“',
        'Hagar ist tief bewegt. „Du bist ein Gott, der mich sieht“, sagt sie, denn nun weiß sie, dass Gott sie nicht vergessen hat. Von da an trägt der Brunnen einen besonderen Namen: Brunnen des Lebendigen, der mich sieht. Hagar geht zurück und bekommt ihren Sohn, und Abram nennt ihn Ismael.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo findet der Bote Gottes die flüchtige Hagar?', options: ['an einem Brunnen in der Wüste', 'in einem Zelt', 'auf einem hohen Berg'], answer: 0 },
        { q: 'Wie nennt Hagar Gott?', options: ['ein Gott, der mich sieht', 'ein Gott, der schläft', 'ein Gott, der weit weg wohnt'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Der Bund und die neuen Namen',
      ref: '1. Mose 17,1–8.15–19',
      text: [
        'Dreizehn Jahre später, Abram ist jetzt neunundneunzig Jahre alt, spricht Gott wieder zu ihm: „Ich bin der allmächtige Gott. Geh deinen Weg vor mir und lebe so, wie es mir gefällt. Ich will einen Bund mit dir schließen, ein festes Versprechen, und dich sehr zahlreich machen.“',
        'Da wirft sich Abram vor Gott zu Boden. Gott sagt: „Du sollst nicht mehr Abram heißen, sondern Abraham, denn ich mache dich zum Vater vieler Völker. Mein Versprechen gilt für dich und alle deine Nachkommen, für immer: Ich will euer Gott sein, und das Land Kanaan soll euch gehören.“',
        'Auch Sarai bekommt einen neuen Namen. „Sie soll Sara heißen“, sagt Gott. „Ich will sie segnen, und sie wird einen Sohn bekommen. Aus ihr sollen Völker werden.“',
        'Abraham muss lachen, so überrascht ist er. „Kann ein Mann mit hundert Jahren noch Vater werden?“, denkt er, „und Sara ist neunzig!“ Doch Gott sagt: „Ja, Sara wird dir einen Sohn schenken. Den sollst du Isaak nennen, und mit ihm will ich meinen Bund halten.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Welchen neuen Namen bekommt Abram?', options: ['Abraham', 'Isaak', 'Ismael'], answer: 0 },
        { q: 'Wie alt ist Abram, als Gott ihm den neuen Namen gibt?', options: ['neunundneunzig Jahre', 'fünfundsiebzig Jahre', 'zwanzig Jahre'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Besuch bei den Eichen',
      ref: '1. Mose 18,1–15',
      audio: `${REC}geschichte-06-v3.mp3`,
      text: [
        'Inzwischen hat Gott Abram und Sarai neue Namen gegeben: Abram heißt jetzt Abraham, das bedeutet „Vater vieler“, und Sarai heißt Sara. Beide sind sehr alt geworden.',
        'Es ist heißer Mittag. Abraham sitzt am Eingang seines Zeltes bei den großen Eichen von Mamre, als Gott ihn besucht. Er blickt auf und sieht auf einmal drei Männer vor sich stehen.',
        'Sofort läuft er ihnen entgegen und verneigt sich tief. „Bleibt doch bei mir“, bittet er, „ich lasse Wasser bringen, damit ihr eure Füße waschen könnt, und ruht euch unter dem Baum aus. Ich hole auch einen Bissen Brot.“ Dann eilt er zu Sara ins Zelt: „Schnell, back Brot für unsere Gäste!“ Und er sucht ein junges Kalb aus.',
        'Als alles bereit ist, stellt Abraham Brot, Butter, Milch und Fleisch vor die Männer. „Wo ist Sara, deine Frau?“, fragen sie. „Drinnen im Zelt“, antwortet er. Da sagt einer von ihnen: „In einem Jahr komme ich wieder zu dir, dann hat Sara einen Sohn.“',
        'Sara steht hinter der Zelttür und hört es. Sie lacht leise: „Ich bin doch viel zu alt dafür!“ „Warum lacht Sara?“, fragt der Gast. „Ist für Gott irgendetwas zu schwer?“ Sara erschrickt: „Ich habe nicht gelacht.“ Doch er antwortet: „Doch, du hast gelacht.“'
      ],
      task: { kind: 'giessen', hint: 'Fülle den Krug am Brunnen und gieße das Wasser in die Schüsseln der Gäste.', water: GIESSEN },
      questions: [
        { q: 'Was stellt Abraham den Gästen vor?', options: ['Brot, Butter, Milch und Fleisch', 'Fisch und Datteln', 'nur Wasser'], answer: 0 },
        { q: 'Was tut Sara, als sie hört, dass sie einen Sohn bekommt?', options: ['Sie lacht leise.', 'Sie weint.', 'Sie singt.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Abraham bittet für Sodom',
      ref: '1. Mose 18,16–33',
      text: [
        'Zwei der drei Männer machen sich auf den Weg nach Sodom, und Abraham begleitet sie ein Stück. Doch Gott selbst bleibt bei ihm stehen und sagt: „Aus Abraham soll ein großes Volk werden, und durch ihn sollen alle Völker gesegnet werden. Darum will ich ihm nicht verschweigen, was ich vorhabe. Ich habe gehört, wie schlimm es in Sodom zugeht, und will selbst nachsehen.“',
        'Abraham tritt nahe an Gott heran und fragt mutig: „Willst du die Guten mit den Bösen verderben? Vielleicht leben fünfzig gute Menschen in der Stadt. Willst du ihnen nicht verzeihen?“ Gott antwortet: „Wenn ich in Sodom fünfzig gute Menschen finde, will ich die ganze Stadt verschonen.“',
        'Aber Abraham fragt noch einmal, ganz vorsichtig: „Verzeih mir, dass ich so viel frage. Und wenn es nur fünfundvierzig sind? Oder vierzig? Oder dreißig? Oder zwanzig?“ Und jedes Mal antwortet Gott: „Dann will ich die Stadt auch um ihretwillen verschonen.“',
        'Zuletzt fragt Abraham: „Und wenn es nur zehn gute Menschen sind?“ „Auch um der Zehn willen will ich die Stadt nicht verderben“, sagt Gott. Dann geht Gott weg, und Abraham kehrt heim in sein Zelt. Später denkt Gott an Abraham und bringt Lot in Sicherheit.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele gute Menschen reichen Gott zuletzt, um die Stadt zu verschonen?', options: ['zehn', 'fünfzig', 'hundert'], answer: 0 },
        { q: 'Wen bringt Gott in Sicherheit?', options: ['Lot', 'Hagar', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Isaak',
      ref: '1. Mose 21,1–7',
      audio: `${REC}geschichte-08-v2.mp3`,
      text: [
        'Ein Jahr geht ins Land, und dann geschieht genau das, was Gott versprochen hat: Sara bekommt einen Sohn, zu der Zeit, die Gott genannt hat. Fünfundzwanzig Jahre sind vergangen, seit Abraham damals von Haran aufgebrochen ist, und nun ist er hundert Jahre alt.',
        'Abraham gibt dem Kind den Namen, den Gott ihm genannt hat: Isaak. Das bedeutet „er lacht“, und besser könnte kein Name zu dieser Geschichte passen.',
        'Sara hält ihren Sohn im Arm und sagt: „Gott hat mir ein Lachen geschenkt. Jeder, der davon hört, wird mit mir lachen.“ Und sie fügt hinzu: „Wer hätte Abraham je gesagt, dass Sara einmal ein Kind an ihrer Brust haben wird? Und nun habe ich ihm doch einen Sohn geboren, obwohl er schon so alt ist.“',
        'Nun liegt ein Baby im Zelt, auf das die beiden so lange gewartet haben. Sara lacht, Abraham lacht, und beide wissen: Gott hat sein Wort gehalten.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Familienbild zusammen.', puzzle: { image: `${G}puzzle/familie.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wie nennt Abraham seinen Sohn?', options: ['Isaak', 'Lot', 'Abram'], answer: 0 },
        { q: 'Wie alt ist Abraham, als Isaak geboren wird?', options: ['hundert Jahre', 'fünfzig Jahre', 'zwanzig Jahre'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Gott sorgt',
      ref: '1. Mose 22,1–19',
      text: [
        'Isaak ist ein Junge geworden, da will Gott sehen, ob Abraham ihm ganz vertraut. „Abraham!“, ruft er. „Hier bin ich.“ „Nimm Isaak, deinen Sohn, den du so lieb hast, und geh mit ihm in das Land Morija. Dort sollst du ihn mir auf einem Berg opfern.“ Das ist eine schwere Prüfung, aber Abraham vertraut Gott.',
        'Am nächsten Morgen lädt er Holz auf seinen Esel und geht mit Isaak und zwei Knechten los. Am dritten Tag sieht er den Berg und lässt die Knechte mit dem Esel zurück: „Der Junge und ich gehen hinauf, um zu beten, und dann kommen wir wieder zu euch.“',
        'Auf dem Weg fragt Isaak: „Vater, wo ist das Tier für das Opfer?“ „Mein Sohn“, antwortet Abraham, „Gott wird selbst für das Opfertier sorgen.“',
        'Oben baut Abraham einen Altar. Da ruft eine Stimme vom Himmel: „Abraham! Tu dem Jungen nichts! Jetzt weiß ich, dass du Gott vertraust.“ Abraham sieht einen Widder, der sich mit den Hörnern in einem Gebüsch verfangen hat. Den bringt er Gott als Opfer, an Isaaks Stelle. Isaak ist gerettet, und Abraham nennt den Ort „Gott sorgt“.',
        'Noch einmal ruft die Stimme: „Weil du mir deinen Sohn nicht verweigert hast, will ich dich segnen. Deine Nachkommen sollen so zahlreich sein wie die Sterne, und durch sie sollen alle Völker gesegnet werden.“'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was antwortet Abraham auf Isaaks Frage nach dem Opfertier?', options: ['Gott wird dafür sorgen.', 'Ich habe es vergessen.', 'Wir kaufen es unterwegs.'], answer: 0 },
        { q: 'Was sieht Abraham im Gebüsch?', options: ['einen Widder', 'einen Hirsch', 'einen Esel'], answer: 0 },
        { q: 'Was verspricht Gott Abraham zum Schluss?', options: ['Durch seine Nachkommen sollen alle Völker gesegnet werden.', 'Er soll König über Kanaan werden.', 'Er soll nach Ägypten ziehen.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 10,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Saras Grab',
      ref: '1. Mose 23',
      text: [
        'Viele Jahre sind vergangen. Sara ist hundertsiebenundzwanzig Jahre alt, als sie in Hebron stirbt, und Abraham trauert um sie. Dann steht er auf und geht zu den Männern der Stadt: „Ich bin ein Fremder und Gast bei euch. Gebt mir ein Stück Land, damit ich meine Frau begraben kann.“',
        'Die Männer antworten freundlich: „Du bist ein Mann, den Gott groß gemacht hat. Begrabe deine Frau in dem schönsten unserer Gräber, keiner von uns wird es dir verweigern.“ Abraham verneigt sich und bittet um die Höhle Machpela am Rand eines Feldes, die einem Mann namens Ephron gehört.',
        'Ephron will sie ihm schenken, mit dem ganzen Feld. Aber Abraham will nichts geschenkt, er will das Land bezahlen. „Nimm mein Geld“, sagt er. Da nennt Ephron den Preis: vierhundert Silberstücke. Abraham wiegt das Silber ab und gibt es ihm, vor allen Zeugen.',
        'Nun gehören das Feld und die Höhle als Grab Abraham. Dort begräbt er Sara. Es ist das erste Stück Land, das Abraham in Kanaan besitzt, in dem Land, das Gott ihm und seinen Nachkommen versprochen hat.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'silber', hint: 'Bezahle das Land mit genau vierhundert Silberstücken.', silver: SILBER },
      questions: [
        { q: 'Wie bekommt Abraham das Land für Saras Grab?', options: ['Er bezahlt es mit Silber.', 'Er bekommt es geschenkt.', 'Er nimmt es sich einfach.'], answer: 0 },
        { q: 'Wozu braucht Abraham dieses Stück Land?', options: ['als Grab für Sara', 'als Weide für seine Herden', 'für ein neues Haus'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 11,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Eine Frau für Isaak',
      ref: '1. Mose 24',
      text: [
        'Abraham ist nun sehr alt, und Isaak soll eine Frau aus der eigenen Verwandtschaft bekommen. Darum schickt Abraham seinen ältesten Knecht mit zehn Kamelen in das ferne Land seiner Familie. „Gott wird seinen Boten vor dir hergehen lassen“, sagt er, „und du wirst dort eine Frau für meinen Sohn finden.“',
        'Am Abend kommt der Knecht an einen Brunnen vor der Stadt, lässt die Kamele niederknien und betet: „Gott, hilf mir! Wenn ein Mädchen kommt und ich sie um einen Schluck Wasser bitte, und sie sagt: ‚Trink, ich will auch deine Kamele tränken‘, dann soll sie die Richtige sein.“',
        'Er hat noch nicht zu Ende gebetet, da kommt Rebekka mit dem Krug auf der Schulter zum Brunnen. Sie reicht ihm zu trinken und sagt: „Ich schöpfe auch für deine Kamele, bis sie genug haben.“ Der Knecht schaut ihr still zu.',
        'Der Knecht dankt Gott und erzählt Rebekkas Familie, was geschehen ist. Ihr Vater und ihr Bruder Laban sagen: „Das kommt von Gott.“ Und Rebekka sagt: „Ja, ich gehe mit.“',
        'Als die Karawane in Kanaan ankommt, ist Isaak am Abend auf dem Feld, um nachzudenken. Er blickt auf und sieht die Kamele kommen. Rebekka wird seine Frau, er hat sie lieb, und nach dem Tod seiner Mutter wird er wieder froh.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen schickt Abraham in das Land seiner Familie?', options: ['seinen ältesten Knecht', 'seinen Sohn Isaak', 'seinen Neffen Lot'], answer: 0 },
        { q: 'Woran erkennt der Knecht die richtige Frau?', options: ['Sie gibt auch den Kamelen zu trinken.', 'Sie trägt einen roten Schleier.', 'Sie singt am Brunnen.'], answer: 0 }
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
