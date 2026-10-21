/**
 * Abenteuer "Abraham" (1. Mose 11 bis 24) für 8 bis 10 Jahre: 12 Etappen (Plan v3 vom 21.10.2026), Untertitel "Gott ruft, Gott hält Wort". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Abraham/ENTWURF_Abraham-v3.md (zweitgeprüft, 90 bis 145 Wörter je Etappe wie bei Noah und Josef), Plan: ETAPPENPLAN-v3.md, Spiele: SPIELE/ENTWURF-v3.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (höchstens zwei Runden je Spiel, höchstens zwei alte Mechaniken): 1 Kamele beladen, 2 Zählen (alt), 3 Sternbild, 4 Wohin fliegen die Vögel?, 5 Das Licht durch die Ringe, 6 Wasser für
 * die Gäste, 8 Puzzle (alt), 10 Passend bezahlen, 12 Ins Weite schauen (Fokus-Regler); 7 Sodom, 9 Gott sorgt und 11 Der Knecht am Brunnen sind nur Quiz.
 * Deutsche Aufnahmen zu den neuen Texten: geschichte-NN-v4.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht (die englische App liest mit der Gerätestimme).
 * Die Etappenbilder sind noch die alten sechs (`etappe-bild-01..06`), die Karte hat 12 Platzhalter-Stationen auf der alten Karte mit elf Orten; beides ersetzen die neuen Bilder und das neue Panorama.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/abraham/, images/abenteuer/spiele/abraham/<spiel>/, audio/abenteuer/abraham/.
 *
 * Das Abenteuer ist nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BalanceGame, BirdsGame, ConstellationGame, CountGroup, FocusGame, Journey, RingsGame, SilverGame, WaterGame } from '@/types/adventure'
import { ABRAHAM_PATH } from './abrahamPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { abrahamEn } from './en/abraham.en'

const IMG = 'images/abenteuer/abraham/'
const G = 'images/abenteuer/spiele/abraham/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst). */
const SOON = false

/**
 * Etappe 5, "Das Licht durch die Ringe": Ringe liegen ineinander um eine Nabe mit goldenem Stern, jeder hat oben eine Lücke, wenn er richtig steht; das Kind dreht sie in Zwölfteln, bis das Licht durch
 * alle Lücken scheint (Bildauftrag A31; Hintergrund = das Etappenbild 5, von der App abgedunkelt). Plan v3: Runde 1 zwei Ringe, Runde 2 drei Ringe, jeder allein (keine Kopplung mehr), zusammen 5 Ringe.
 * Der Strahl ist kein Bild, die App malt ihn als Farbverlauf. Die Startstellungen sind Zwölftel (1 bis 11, nie 0) und lösbar (Test).
 * Bilder (gemalt, 21.10.2026): `ringe/ring-1.webp` 900 × 900, `ring-2.webp` 740, `ring-3.webp` 580 (alle quadratisch, transparent, Lücke oben), `nabe.webp` 240 × 240.
 */
const RINGE: RingsGame = {
  background: `${IMG}etappe-bild-03.webp`,
  rings: [`${G}ringe/ring-1.webp`, `${G}ringe/ring-2.webp`, `${G}ringe/ring-3.webp`],
  hub: `${G}ringe/nabe.webp`,
  rounds: [
    { hint: 'Drehe jeden Ring, bis seine Lücke oben ist. Dann scheint das Licht hindurch.', start: [3, 7], couple: [] },
    { hint: 'Jetzt sind es drei Ringe. Drehe sie, bis das Licht hindurchscheint.', start: [4, 9, 2], couple: [] }
  ]
}

/**
 * Etappe 4, "Wohin fliegen die Vögel?": Vögel fliegen auf das Wasser in der Wüste zu, ihre gestrichelten Flugbahnen enden in der Luft; das Kind tippt dorthin, wo sie sich treffen (Bildauftrag A30;
 * eigener Hintergrund `voegel/wueste.webp`, damit Hagar und der Brunnen des Etappenbildes nicht stören). Positionen in Prozent des Bildes (4 : 3). Plan v3: zwei Runden mit je zwei Aufgaben, kein Ablenker;
 * Runde 1 je zwei Vögel (Bahnen zu 60 % gezeichnet), Runde 2 je drei Vögel (zu 40 %). Es gibt nur ein Vogelbild (beide Flügelstellungen zeigen es), zusammen 4 Quellen.
 * Bilder (gemalt, 21.10.2026): `voegel/wueste.webp` 1200 × 900, `vogel.webp` 140 × 100 (transparent), `quelle.webp` 240 × 170 (transparent).
 */
const VOEGEL: BirdsGame = {
  background: `${G}voegel/wueste.webp`,
  bird: [`${G}voegel/vogel.webp`, `${G}voegel/vogel.webp`],
  spring: `${G}voegel/quelle.webp`,
  radius: 8,
  rounds: [
    {
      hint: 'Die Vögel fliegen zum Wasser. Tippe dorthin, wo sich ihre Wege treffen.',
      tasks: [
        { target: [30, 72], birds: [{ from: [10, 12], shown: 0.6 }, { from: [58, 10], shown: 0.6 }] },
        { target: [64, 76], birds: [{ from: [30, 10], shown: 0.6 }, { from: [92, 16], shown: 0.6 }] }
      ]
    },
    {
      hint: 'Jetzt fliegen drei Vögel zu jeder Quelle. Tippe dorthin, wo sich ihre Wege treffen.',
      tasks: [
        { target: [42, 70], birds: [{ from: [8, 12], shown: 0.4 }, { from: [46, 6], shown: 0.4 }, { from: [90, 20], shown: 0.4 }] },
        { target: [70, 74], birds: [{ from: [20, 10], shown: 0.4 }, { from: [55, 5], shown: 0.4 }, { from: [96, 24], shown: 0.4 }] }
      ]
    }
  ]
}

/**
 * Etappe 10, "Passend bezahlen": Silberstücke in drei Größen werden auf ein Tuch gelegt, bis es genau vierhundert sind (Bildauftrag A32; Hintergrund = das Etappenbild 10). Plan v3: Runde 1 mit sichtbarer
 * Summe (200, 100, 100, 50, 50), Runde 2 ohne (150, 100, 100, 75, 75; nach Werten gibt es nur eine Lösung: 150 + 100 + 75 + 75). Es gibt nur ein Stückbild, die App zeigt es in drei Größen
 * (klein bis 50, mittel bis 125, groß darüber); der Beutel entfällt. Alle Stücke zusammen sind mehr als vierhundert.
 * Bilder (gemalt, 21.10.2026): `silber/tuch.webp` 720 × 300 und `silber-stueck.webp` 150 × 100, beide transparent.
 */
const SILBER: SilverGame = {
  background: `${IMG}etappe-bild-05.webp`,
  cloth: `${G}silber/tuch.webp`,
  pieces: [
    { id: 'a-200', image: `${G}silber/silber-stueck.webp`, value: 200 },
    { id: 'a-100x', image: `${G}silber/silber-stueck.webp`, value: 100 },
    { id: 'a-100y', image: `${G}silber/silber-stueck.webp`, value: 100 },
    { id: 'a-50x', image: `${G}silber/silber-stueck.webp`, value: 50 },
    { id: 'a-50y', image: `${G}silber/silber-stueck.webp`, value: 50 },
    { id: 'b-150', image: `${G}silber/silber-stueck.webp`, value: 150 },
    { id: 'b-100x', image: `${G}silber/silber-stueck.webp`, value: 100 },
    { id: 'b-100y', image: `${G}silber/silber-stueck.webp`, value: 100 },
    { id: 'b-75x', image: `${G}silber/silber-stueck.webp`, value: 75 },
    { id: 'b-75y', image: `${G}silber/silber-stueck.webp`, value: 75 }
  ],
  rounds: [
    { hint: 'Lege Silberstücke auf das Tuch: genau vierhundert. Die Summe hilft dir.', price: 400, pieces: ['a-200', 'a-100x', 'a-100y', 'a-50x', 'a-50y'], showSum: true },
    { hint: 'Noch einmal vierhundert. Jetzt rechnest du selbst.', price: 400, pieces: ['b-150', 'b-100x', 'b-100y', 'b-75x', 'b-75y'], showSum: false }
  ]
}

/**
 * Etappe 1, "Kamele beladen": ein Kamel mit zwei Körben vor dem Etappenbild 1, Pakete in drei Gewichten (Bildauftrag A10). Plan v3: jede Runde hat nur ein Kamel (vorher zwei); jedes ist lösbar
 * (die Pakete lassen sich in zwei gleich schwere Hälften teilen): Runde 1 drei Pakete (1 + 2 | 3), Runde 2 fünf Pakete (zusammen 10, je 5). Das Kamel ist das aus Noah (Kopie unter `waage/`, Bildauftrag A10).
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
    { id: 'schlauch-1', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'schlauch-2', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'schlauch-3', image: `${G}waage/schlauch.webp`, weight: 2, label: 'Wasserschlauch' },
    { id: 'gross-1', image: `${G}waage/sack-gross.webp`, weight: 3, label: 'großer Sack' }
  ],
  rounds: [
    { hint: 'Verteile die drei Pakete auf beide Seiten.', camels: [{ packs: ['klein-1', 'schlauch-1', 'gross-1'] }] },
    { hint: 'Jetzt sind es mehr und schwerere Pakete.', camels: [{ packs: ['klein-1', 'schlauch-1', 'schlauch-2', 'gross-1', 'schlauch-3'] }] }
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
 * Etappe 6, "Wasser für die Gäste": Krug am Brunnen füllen, Waschschüsseln der Gäste füllen (Bildauftrag A11, gebaute Gieß-Mechanik). Plan v3: Runde 1 drei Schüsseln
 * mit einem Krug, Runde 2 nur zwei tiefe Schüsseln mit je zwei Krügen (andere Ids, gleiche Plätze); zusammen 3 + 4 = 7 Krüge.
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
    { id: 'tief-2', small: `${G}giessen/schuessel.webp`, grown: `${G}giessen/schuessel-voll.webp`, label: 'Tiefe Schüssel für den zweiten Gast', x: 66, y: 75, w: 18, need: 2 }
  ],
  rounds: [
    { hint: 'Jede Schüssel braucht einen Krug.', plants: ['schuessel-1', 'schuessel-2', 'schuessel-3'] },
    { hint: 'Die tiefen Schüsseln brauchen zwei Krüge.', plants: ['tief-1', 'tief-2'] }
  ]
}

/**
 * Etappe 12, "Ins Weite schauen": ein Bild liegt zuerst unscharf da, das Kind schiebt einen Regler, bis es scharf ist (Bildauftrag A33; ein Fehler ist nicht möglich, kein Zeitdruck). Runde 1 die ferne
 * Karawane im Abendfeld (scharf bei 70 % des Reglers), Runde 2 Rebekka auf dem Kamel nah (scharf bei 30 %). Das Bild ist 3 : 2; die App malt die Unschärfe, ein Rasten gilt innerhalb von 8 % der Reglerlänge.
 * Bilder (gemalt, 21.10.2026): `fokus/ferne.webp` und `fokus/nahe.webp`, je 1200 × 800 (Vollbild).
 */
const FOKUS: FocusGame = {
  rounds: [
    { hint: 'Ziehe den Regler, bis das Bild scharf ist. Was kommt dort in der Ferne?', image: `${G}fokus/ferne.webp`, sharpAt: 70 },
    { hint: 'Und jetzt ganz nah: Ziehe den Regler, bis das Bild scharf ist.', image: `${G}fokus/nahe.webp`, sharpAt: 30 }
  ]
}

export const abraham: Journey = {
  id: 'abraham',
  title: 'Abraham',
  subtitle: 'Gott ruft, Gott hält Wort',
  age: '8-10',
  downloadMb: 11, // 11,2 MB gezählt am 21.10.2026 mit der neuen Karte v3 (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Abraham und das Zelt unter dem Sternenhimmel (Ruhe, Verheißung)
  // Geschenk-Ausmalbild: Abraham und Sara vor dem Zelt unter dem Sternenhimmel, mit Schafen, friedlich
  gift: { title: 'Abraham und Sara vor dem Zelt unter dem Sternenhimmel', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v3 mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus abrahamPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v3-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0888, y: 0.2852, d: 0.0339 },
      { x: 0.1574, y: 0.267, d: 0.0339 },
      { x: 0.2422, y: 0.2306, d: 0.0339 },
      { x: 0.3129, y: 0.5704, d: 0.0339 },
      { x: 0.3835, y: 0.5461, d: 0.0339 },
      { x: 0.4794, y: 0.6371, d: 0.0339 },
      { x: 0.5339, y: 0.4794, d: 0.0339 },
      { x: 0.5854, y: 0.2063, d: 0.0339 },
      { x: 0.6762, y: 0.4612, d: 0.0339 },
      { x: 0.757, y: 0.5461, d: 0.0339 },
      { x: 0.8478, y: 0.625, d: 0.0339 },
      { x: 0.9144, y: 0.6311, d: 0.0339 }
    ],
    exam: { x: 0.983, y: 0.5461, d: 0.0339 },
    path: ABRAHAM_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Der Ruf',
      ref: '1. Mose 11,27–12,4',
      text: [
        'Die Stadt Ur ist groß und alt. Ihre Häuser sind aus Lehmziegeln gebaut, und mitten in der Stadt ragt ein hoher Stufenturm in den Himmel. Hier wohnt Abram mit seiner Frau Sarai und seinem Neffen Lot. Ein Kind haben Abram und Sarai nicht.',
        'Eines Tages spricht Gott zu Abram: „Zieh fort aus deinem Land und aus dem Haus deines Vaters. Geh in das Land, das ich dir zeigen will. Ich mache dich zu einem großen Volk und segne dich. Durch dich sollen alle Menschen gesegnet werden.“',
        'Wohin Gott ihn führt, weiß Abram nicht. Aber er vertraut Gott. Er packt alles zusammen, was er besitzt. Fünfundsiebzig Jahre ist Abram alt, als er sich mit Sarai und Lot auf den Weg macht.'
      ],
      task: { kind: 'waage', hint: 'Lege die Pakete so in die Körbe, dass das Kamel gerade steht.', balance: WAAGE },
      questions: [
        { q: 'Wohin soll Abram ziehen?', options: ['in das Land, das Gott ihm zeigt', 'zurück zu seinem Vater', 'ans Meer'], answer: 0 },
        { q: 'Was verspricht Gott Abram?', options: ['Er macht ihn zu einem großen Volk und segnet ihn.', 'Er schenkt ihm eine Burg.', 'Er macht ihn zum König von Ur.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Abram und Lot',
      ref: '1. Mose 13',
      text: [
        'Abram ist reich geworden, und auch Lot hat viele Schafe, Rinder und Zelte. Doch das Land ist zu klein für beide Herden. Ihre Hirten fangen an zu streiten.',
        'Da sagt Abram zu Lot: „Wir wollen keinen Streit, wir sind doch eine Familie. Such dir aus, wohin du ziehen willst. Gehst du nach links, gehe ich nach rechts.“',
        'Lot schaut ins Tal hinab. Dort fließt der Jordan durch eine grüne Ebene, so schön wie ein Garten. Lot zieht mit seinen Herden dorthin. Abram bleibt im Land Kanaan.',
        'Da spricht Gott zu Abram: „Sieh dich um, nach allen Seiten. Das ganze Land, das du siehst, will ich dir und deinen Nachkommen geben. Sie werden so zahlreich sein wie der Staub auf der Erde.“'
      ],
      task: { kind: 'zaehlen', hint: 'Tippe die Tiere an und zähle sie.', count: 13, image: '', question: 'Wie viele Tiere sind es zusammen?', background: `${IMG}etappe-bild-02.webp`, groups: ZAEHLEN_GRUPPEN },
      questions: [
        { q: 'Warum können Abram und Lot nicht zusammenbleiben?', options: ['Das Land ist für beide Herden zu klein.', 'Sie haben sich verirrt.', 'Es ist zu kalt.'], answer: 0 },
        { q: 'Wer darf zuerst auswählen, wohin er zieht?', options: ['Lot', 'Abram', 'die Hirten'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Die Sterne',
      ref: '1. Mose 15,1–7',
      text: [
        'Abram und Sarai sind alt geworden, und sie haben immer noch kein Kind. Das macht Abram traurig. Da spricht Gott zu ihm: „Fürchte dich nicht, Abram! Ich beschütze dich und will dich reich beschenken.“',
        '„Herr, was willst du mir schon geben?“, fragt Abram. „Ich habe keinen Sohn. Ein Knecht aus meinem Haus wird alles erben.“ „Nein“, sagt Gott, „dein eigener Sohn soll dein Erbe sein.“',
        'Dann führt Gott ihn hinaus in die Nacht. „Sieh zum Himmel und zähle die Sterne, wenn du es kannst“, sagt er. „So viele Nachkommen sollst du haben.“ Abram schaut hinauf, doch es sind viel zu viele Sterne zum Zählen.',
        'Abram glaubt Gott, und Gott sieht, dass Abram ihm vertraut. „Ich habe dich aus Ur geführt“, erinnert er ihn, „um dir dieses Land zu geben.“'
      ],
      task: { kind: 'sternbild', hint: 'Setze die Sterne so, wie du sie im Vorbild siehst.', constellation: STERNBILD },
      questions: [
        { q: 'Was soll Abram in der Nacht zählen?', options: ['die Sterne', 'die Schafe', 'die Zelte'], answer: 0 },
        { q: 'Wie viele Nachkommen verspricht Gott Abram?', options: ['so viele wie Sterne am Himmel', 'nur einen', 'zwölf'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Hagar und der Brunnen',
      ref: '1. Mose 16',
      text: [
        'Viele Jahre sind vergangen, und Sarai hat noch immer kein Kind. Sie hat eine Magd aus Ägypten, die Hagar heißt. „Vielleicht bekomme ich durch Hagar ein Kind“, sagt Sarai zu Abram, und er ist einverstanden. Bald erwartet Hagar ein Baby.',
        'Doch zwischen den beiden Frauen gibt es Streit, und Hagar läuft davon, mitten in die Wüste. Erschöpft setzt sie sich an einen Brunnen.',
        'Da spricht ein Bote Gottes sie an: „Hagar, woher kommst du, und wohin gehst du?“ „Ich laufe vor Sarai davon“, sagt sie. „Geh zurück“, sagt der Bote. „Du wirst einen Sohn bekommen. Nenne ihn Ismael, das heißt: Gott hört. Denn Gott hat gehört, wie traurig du bist.“',
        'Hagar ist tief bewegt. „Du bist ein Gott, der mich sieht“, sagt sie, denn sie weiß jetzt: Gott hat sie nicht vergessen. Hagar geht zurück, und ihr Sohn wird geboren.'
      ],
      task: { kind: 'voegel', hint: 'Die Vögel fliegen zum Wasser. Tippe dorthin, wo sich ihre Wege treffen.', birds: VOEGEL },
      questions: [
        { q: 'Wo setzt sich Hagar hin, als sie davongelaufen ist?', options: ['an einen Brunnen in der Wüste', 'unter eine Palme am Meer', 'auf einen hohen Berg'], answer: 0 },
        { q: 'Was bedeutet der Name Ismael?', options: ['Gott hört', 'Gott lacht', 'Gott schenkt'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Der Bund und die neuen Namen',
      ref: '1. Mose 17,1–19',
      text: [
        'Abram ist neunundneunzig Jahre alt, als Gott wieder zu ihm spricht: „Ich schließe einen Bund mit dir, ein festes Versprechen. Ich will dein Gott sein und der Gott deiner Nachkommen, für immer. Du sollst der Vater vieler Völker werden.“ Da wirft sich Abram vor Gott zu Boden.',
        '„Darum sollst du nicht mehr Abram heißen, sondern Abraham“, sagt Gott. „Das bedeutet: Vater vieler. Und Sarai soll Sara heißen. Ich will sie segnen, und sie wird dir einen Sohn schenken.“',
        'Abraham muss lachen. „Ich bin fast hundert Jahre alt, und Sara ist neunzig“, denkt er. „Wie soll das gehen?“ Aber Gott sagt: „Doch, Sara bekommt einen Sohn. Den sollst du Isaak nennen.“'
      ],
      task: { kind: 'ringe', hint: 'Drehe die Ringe, bis das Licht hindurchscheint.', rings: RINGE },
      questions: [
        { q: 'Welchen neuen Namen gibt Gott dem Abram?', options: ['Abraham', 'Isaak', 'Ismael'], answer: 0 },
        { q: 'Wie soll der Sohn heißen, den Sara bekommt?', options: ['Isaak', 'Lot', 'Ismael'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Besuch bei den Eichen',
      ref: '1. Mose 18,1–15',
      text: [
        'Es ist heiß am Mittag, und Abraham sitzt am Eingang seines Zeltes unter den großen Eichen von Mamre. Gott besucht ihn. Als Abraham aufblickt, stehen drei Männer vor ihm.',
        'Abraham läuft ihnen entgegen und verneigt sich tief. „Bleibt bei mir“, sagt er. „Ruht euch unter dem Baum aus, ich hole Wasser für eure Füße und etwas zu essen.“ Schnell bittet er Sara, Brot zu backen.',
        'Dann stellt Abraham Brot, Milch und Fleisch vor die Gäste. „Wo ist Sara, deine Frau?“, fragen sie. „Im Zelt“, sagt er. Da sagt einer: „In einem Jahr komme ich wieder, dann hat Sara einen Sohn.“',
        'Sara steht hinter der Zelttür und hört es. Sie lacht leise: „Ich bin doch viel zu alt!“ Aber der Gast fragt: „Ist für Gott etwas zu schwer?“'
      ],
      task: { kind: 'giessen', hint: 'Fülle den Krug am Brunnen und gieße das Wasser in die Schüsseln der Gäste.', water: GIESSEN },
      questions: [
        { q: 'Was stellt Abraham den Gästen vor?', options: ['Brot, Milch und Fleisch', 'Fisch und Datteln', 'nur Wasser'], answer: 0 },
        { q: 'Was tut Sara, als sie das Versprechen hört?', options: ['Sie lacht leise.', 'Sie weint.', 'Sie singt.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Abraham bittet für Sodom',
      ref: '1. Mose 18,16–33',
      text: [
        'Die Männer stehen auf und gehen weiter, und Abraham begleitet sie ein Stück. Da sagt Gott: „Ich habe gehört, wie schlimm es in der Stadt Sodom zugeht. Ich will selbst nachsehen.“',
        'Abraham tritt vor Gott und fragt mutig: „Willst du die guten Menschen mit den bösen bestrafen? Vielleicht gibt es fünfzig gute Menschen in der Stadt.“ „Dann verschone ich die ganze Stadt um der fünfzig willen“, sagt Gott.',
        'Abraham fragt noch einmal, ganz bescheiden: „Und wenn es nur vierzig sind? Oder dreißig? Oder zwanzig?“ Jedes Mal antwortet Gott: „Auch ihretwegen verschone ich die Stadt.“ Zuletzt fragt Abraham: „Und wenn es nur zehn sind?“ „Auch um der zehn willen“, sagt Gott.',
        'Dann geht Gott weg, und Abraham kehrt heim. Gott hat ihm zugehört, und später denkt er an Abraham und bringt Lot in Sicherheit.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
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
      text: [
        'Ein Jahr vergeht. Dann geschieht, was Gott versprochen hat: Sara bekommt einen Sohn, und Abraham ist hundert Jahre alt. Er nennt das Kind Isaak, so wie Gott es gesagt hat.',
        'Isaak bedeutet: Er lacht. Besser kann kein Name passen, denn Sara hält ihr Baby im Arm und strahlt.',
        '„Gott hat mir ein Lachen geschenkt“, sagt sie. „Alle, die davon hören, werden mit mir lachen. Wer hätte gedacht, dass ich noch ein Kind bekomme? Und jetzt habe ich Abraham einen Sohn geboren!“',
        'Nun lacht Sara, und Abraham lacht auch. Sie haben so lange gewartet, und Gott hat sein Wort gehalten.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Familienbild zusammen.', puzzle: { image: `${G}puzzle/familie.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wie nennt Abraham seinen Sohn?', options: ['Isaak', 'Lot', 'Ismael'], answer: 0 },
        { q: 'Was bedeutet der Name Isaak?', options: ['Er lacht.', 'Er läuft.', 'Er singt.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Gott sorgt',
      ref: '1. Mose 22,1–19',
      text: [
        'Isaak ist ein Junge geworden. Da will Gott sehen, ob Abraham ihm ganz vertraut: „Nimm Isaak, deinen Sohn, den du liebst, und geh mit ihm in das Land Morija. Dort sollst du ihn mir auf einem Berg opfern.“',
        'Am Morgen lädt Abraham Holz auf seinen Esel und geht mit Isaak und zwei Knechten los. Nach drei Tagen sieht er den Berg. „Bleibt hier“, sagt er zu den Knechten. „Der Junge und ich gehen hinauf und beten, dann kommen wir zurück.“',
        'Isaak trägt das Holz. „Vater, wo ist das Opfertier?“, fragt er. „Mein Sohn“, sagt Abraham, „Gott wird selbst dafür sorgen.“',
        'Oben ruft eine Stimme vom Himmel: „Abraham! Tu dem Jungen nichts! Jetzt weiß ich, dass du Gott vertraust.“ Da sieht Abraham einen Widder im Gebüsch und bringt ihn an Isaaks Stelle. Isaak ist gerettet. Und Gott verspricht: „Durch deine Nachkommen sollen alle Völker gesegnet werden.“'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was antwortet Abraham auf Isaaks Frage nach dem Opfertier?', options: ['Gott wird dafür sorgen.', 'Wir kaufen eines unterwegs.', 'Ich habe es vergessen.'], answer: 0 },
        { q: 'Was sieht Abraham im Gebüsch?', options: ['einen Widder', 'einen Hirsch', 'einen Esel'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 10,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Saras Grab',
      ref: '1. Mose 23',
      text: [
        'Sara ist gestorben, und Abraham weint um sie. Dann steht er auf und geht zu den Männern der Stadt Hebron.',
        '„Ich bin fremd bei euch und besitze kein Stück Land“, sagt er. „Gebt mir einen Platz, wo ich Sara begraben kann.“ Die Männer antworten freundlich: „Du bist ein von Gott gesegneter Mann. Begrabe deine Frau in unserem schönsten Grab.“',
        'Abraham verneigt sich und bittet um die Höhle Machpela am Rand eines Feldes. Sie gehört Ephron, und der will sie ihm schenken. Aber Abraham sagt: „Nein, ich will sie bezahlen.“ Vor allen Zeugen wiegt er vierhundert Silberstücke ab.',
        'Nun gehört Abraham ein Stück Land in Kanaan: Feld, Bäume und Höhle. Dort begräbt er Sara. Es ist der erste Platz im versprochenen Land, der ihm gehört.'
      ],
      task: { kind: 'silber', hint: 'Lege Silberstücke auf das Tuch: genau vierhundert.', silver: SILBER },
      questions: [
        { q: 'Wie bekommt Abraham die Höhle für Saras Grab?', options: ['Er bezahlt sie mit Silber.', 'Er bekommt sie geschenkt.', 'Er tauscht sie gegen Schafe.'], answer: 0 },
        { q: 'Wem gehört die Höhle zuerst?', options: ['Ephron', 'Lot', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 11,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Der Knecht am Brunnen',
      ref: '1. Mose 24,1–27',
      text: [
        'Abraham ist alt, und Isaak ist erwachsen. Isaak soll eine Frau aus Abrahams Verwandtschaft bekommen. Darum ruft Abraham seinen ältesten Knecht: „Zieh in das Land meiner Familie. Gott wird dir den Weg zeigen.“',
        'Der Knecht reist mit zehn Kamelen. Am Abend kommt er an einen Brunnen vor der Stadt und lässt die Tiere niederknien. Er betet: „Gott, hilf mir! Ich bitte ein Mädchen um Wasser. Wenn es sagt: Trink, ich gebe auch deinen Kamelen zu trinken – dann ist sie die Richtige.“',
        'Da kommt Rebekka mit einem Krug auf der Schulter. Sie gibt dem Fremden zu trinken und sagt: „Ich schöpfe auch für deine Kamele, bis sie genug haben.“ Sie läuft hin und her zum Brunnen. Der Knecht schaut ihr still zu.',
        'Er hat noch nicht zu Ende gebetet, da ist Gottes Antwort schon da. Der Knecht verneigt sich und dankt Gott.'
      ],
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen schickt Abraham in das Land seiner Familie?', options: ['seinen ältesten Knecht', 'seinen Sohn Isaak', 'seinen Neffen Lot'], answer: 0 },
        { q: 'Woran erkennt der Knecht die richtige Frau?', options: ['Sie gibt auch den Kamelen zu trinken.', 'Sie trägt einen roten Schleier.', 'Sie singt am Brunnen.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 12,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Isaak und Rebekka',
      ref: '1. Mose 24,28–67',
      text: [
        'Der Knecht geht mit Rebekka zu ihrer Familie und erzählt alles. Ihr Vater und ihr Bruder Laban sagen: „Das kommt von Gott.“ Am nächsten Morgen fragen sie Rebekka: „Willst du mit diesem Mann ziehen?“ „Ja“, sagt sie, „ich gehe.“',
        'Rebekka setzt sich auf ein Kamel und reist in das Land Kanaan. Isaak ist an diesem Abend draußen auf dem Feld und betet. Er blickt auf und sieht Kamele kommen.',
        'Auch Rebekka sieht ihn. „Wer ist der Mann dort auf dem Feld?“, fragt sie den Knecht. „Das ist mein Herr Isaak“, sagt er. Da verhüllt sich Rebekka mit ihrem Mantel.',
        'Isaak führt Rebekka in das Zelt seiner Mutter Sara. Er hat sie lieb, und sie wird seine Frau. Nach dem Tod seiner Mutter ist er wieder getröstet.'
      ],
      task: { kind: 'fokus', hint: 'Ziehe den Regler, bis das Bild scharf ist.', focus: FOKUS },
      questions: [
        { q: 'Was antwortet Rebekka, als man sie fragt, ob sie mitziehen will?', options: ['Ja, ich gehe.', 'Nein, ich bleibe.', 'Ich weiß es nicht.'], answer: 0 },
        { q: 'Was macht Isaak, als die Kamele kommen?', options: ['Er ist draußen auf dem Feld und betet.', 'Er schläft im Zelt.', 'Er hütet die Schafe.'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Aus welcher Stadt ruft Gott Abram?', options: ['aus Ur', 'aus Babel', 'aus Ägypten'], answer: 0 },
    { q: 'Wer darf zuerst auswählen, als sich Abram und Lot trennen?', options: ['Lot', 'Abram', 'die Hirten'], answer: 0 },
    { q: 'Wie nennt Hagar Gott am Brunnen?', options: ['ein Gott, der mich sieht', 'ein Gott, der schläft', 'ein Gott, der weit weg wohnt'], answer: 0 },
    { q: 'Was tut Sara, als die Gäste ihr einen Sohn versprechen?', options: ['Sie lacht leise.', 'Sie weint.', 'Sie läuft weg.'], answer: 0 },
    { q: 'Wie viele gute Menschen reichen Gott, um Sodom zu verschonen?', options: ['zehn', 'fünfzig', 'hundert'], answer: 0 },
    { q: 'Wer sorgt für das Opfertier auf dem Berg?', options: ['Gott', 'Isaak', 'die Knechte'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, text version 3 = files "-v4"); there are no English ones yet, so the English app reads with the voice of the device
for (const s of abraham.stages) {
  const file = `audio/abenteuer/abraham/geschichte-${String(s.id).padStart(2, '0')}-v4.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (skill `lambking-abenteuer-skill`, ton.md); they follow one another at random
abraham.music = [
  'audio/abenteuer/abraham/musik-wueste-v1.mp3',
  'audio/abenteuer/abraham/musik-sterne-v1.mp3',
  'audio/abenteuer/abraham/musik-aufbruch-v1.mp3'
]

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(abraham, abrahamEn)
