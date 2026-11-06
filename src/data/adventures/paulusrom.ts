/**
 * Abenteuer "Bis nach Rom" (Apostelgeschichte 17–28) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Paulus reist in die Hauptstadt der Welt". Entstanden nach dem Skill "LambKing Abenteuer Skill", Nr. 32 der Gesamtreise.
 * Gott, Engel, Jesus und Lichtgestalten sind nie im Bild (der Engel aus Apg 27,23 und die Stimme des Herrn stehen nur im Text; im Spiel "Reihenfolge" ist das Licht vor Damaskus ohne Gestalt gemalt).
 * Nicht gruselig: der Sturz des Eutychus, der Plan der vierzig Männer, der Sturm und die Otter kommen in keinem Bild vor; Etappe 3 und 6 sind ernst und nur Fragen.
 * Quelle der Texte: D:/Claude/Abenteuer-PaulusRom/ENTWURF_PaulusRom.md (Luther 1912 von bibeltext.com gelesen, nacherzählt), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Wimmelbild (bekannt), 2 Schatten an der Wand (neu, wandschatten), 3 nur Fragen, 4 Ein Ort für zwei (neu, beiseite),
 * 5 Reihenfolge (bekannt), 6 nur Fragen, 7 Bretter ans Ufer (neu, bretter), 8 Reisig zusammenraffen (neu, reisig), 9 Alle aufnehmen (neu, besuch).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/paulusrom/, images/abenteuer/spiele/paulusrom/<spiel>/, audio/abenteuer/paulusrom/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-PaulusRom/tools/bauen_paulusrom.py: nicht von Hand ändern.
 */
import type { FindGame, Journey, OrderGame } from '@/types/adventure'
import type { PlanksGame, QuietSpotGame, WallShadowGame } from '@/utils/paulusromNeuA'
import type { BrushwoodGame, VisitorsGame } from '@/utils/paulusromNeuB'
import { josef } from './josef'
import { PAULUSROM_PATH } from './paulusromPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { paulusromEn } from './en/paulusrom.en'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/paulusrom/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/paulusrom/'

const G = 'images/abenteuer/spiele/paulusrom/'

/**
 * Etappe 1, "Wimmelbild" (bekannt 1, Apg 17,16.23): der Markt von Athen von schräg oben (Hochformat 3:4) voller bekleideter Götterbilder; gesucht werden vier Altäre, der schlichte mit der
 * leeren Tafel ist der "Dem unbekannten Gott" (die Aufschrift steht nur in der Schlusszeile, nicht im Bild). Vier Altäre sind Ausgestaltung. Lagen am gemalten Bild gesetzt
 * (tools/_massen_paulusrom.json). Bilder: `wimmel/szene`, `figur-1..4`, `verdecker-1..4`.
 */
const WIMMEL: FindGame = {
  labels: ['Ein kleiner Altar mit Blumen', 'Ein runder Altar mit einer Rauchschale', 'Der schlichte Altar mit der leeren Tafel', 'Ein Altar aus Marmor mit einem Lorbeerkranz'],
  doneText: 'Du hast alle vier Altäre gefunden. Auf dem schlichten stand: Dem unbekannten Gott.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 38, y: 60, w: 16 },
    { image: `${G}wimmel/figur-2.webp`, x: 80, y: 58, w: 16 },
    { image: `${G}wimmel/figur-3.webp`, x: 36, y: 87, w: 16 },
    { image: `${G}wimmel/figur-4.webp`, x: 62, y: 92, w: 16 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 49, y: 62, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 78.5, y: 60, w: 14 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 28, y: 88, w: 18 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 70, y: 93, w: 20 }
  ]
}

/**
 * Etappe 2, "Schatten an der Wand" (neu, `wandschatten`, Apg 20,8): das Obergemach in Troas bei Nacht (3:2, ohne Menschen), viele Lampen werfen die Schatten der Zuhörer an die helle Wand.
 * Runde 1: vier Menschen mit sehr verschiedener Form, jeder Schatten einmal, unverändert; Runde 2: sechs Menschen, darunter ähnliche Formen (alter Mann und Mann mit Rolle, Frau mit Krug und
 * Mutter mit Kind, Mädchen mit Zopf und Junge mit Korb), die Schatten größer oder gedreht (die Lampe steht näher oder auf der anderen Seite). Eutychus sitzt wach im Fenster, der Sturz kommt nicht vor.
 * Lagen am gemalten Bild gesetzt (tools/_massen_paulusrom.json). Bilder: `wandschatten/raum`, `person-*`, `schatten-*`.
 */
const WANDSCHATTEN: WallShadowGame = {
  room: `${G}wandschatten/raum.webp`,
  wall: { x: 50, base: 74, h: 48 },
  rowY: 97,
  personW: 18,
  people: [
    { id: 'paulus', image: `${G}wandschatten/person-paulus.webp`, shadow: `${G}wandschatten/schatten-paulus.webp`, name: 'Paulus', shadowName: 'Schatten eines Mannes mit erhobener Hand' },
    { id: 'frau-krug', image: `${G}wandschatten/person-frau-krug.webp`, shadow: `${G}wandschatten/schatten-frau-krug.webp`, name: 'Die Frau mit dem Krug', shadowName: 'Schatten mit einem Krug auf der Schulter' },
    { id: 'alter-stock', image: `${G}wandschatten/person-alter-stock.webp`, shadow: `${G}wandschatten/schatten-alter-stock.webp`, name: 'Der alte Mann mit dem Stock', shadowName: 'Schatten mit gebeugtem Rücken und Stock' },
    { id: 'maedchen-zopf', image: `${G}wandschatten/person-maedchen-zopf.webp`, shadow: `${G}wandschatten/schatten-maedchen-zopf.webp`, name: 'Das Mädchen mit dem Zopf', shadowName: 'Schatten mit langem Zopf' },
    { id: 'mann-rolle', image: `${G}wandschatten/person-mann-rolle.webp`, shadow: `${G}wandschatten/schatten-mann-rolle.webp`, name: 'Der Mann mit der Schriftrolle', shadowName: 'Schatten mit einer Rolle unter dem Arm' },
    { id: 'mutter-kind', image: `${G}wandschatten/person-mutter-kind.webp`, shadow: `${G}wandschatten/schatten-mutter-kind.webp`, name: 'Die Mutter mit dem Kind', shadowName: 'Schatten mit einem Kind auf dem Arm' },
    { id: 'junge-korb', image: `${G}wandschatten/person-junge-korb.webp`, shadow: `${G}wandschatten/schatten-junge-korb.webp`, name: 'Der Junge mit dem Brotkorb', shadowName: 'Schatten mit einem Korb' },
    { id: 'eutychus', image: `${G}wandschatten/person-eutychus.webp`, shadow: `${G}wandschatten/schatten-eutychus.webp`, name: 'Eutychus im Fenster', shadowName: 'Schatten eines jungen Mannes mit angezogenen Knien' }
  ],
  rounds: [
    { hint: 'Schau dir den Schatten an der Wand an und tippe auf den, der ihn wirft.', people: ['paulus', 'frau-krug', 'alter-stock', 'eutychus'], shadows: [{ id: 'frau-krug', scale: 1, flip: false }, { id: 'eutychus', scale: 1, flip: false }, { id: 'paulus', scale: 1, flip: false }, { id: 'alter-stock', scale: 1, flip: false }] },
    { hint: 'Jetzt sind es sechs Zuhörer, und manche Schatten sind größer oder gedreht. Die Lampe steht anders.', people: ['mann-rolle', 'frau-krug', 'alter-stock', 'mutter-kind', 'maedchen-zopf', 'junge-korb'], shadows: [{ id: 'alter-stock', scale: 1.3, flip: false }, { id: 'mutter-kind', scale: 1, flip: true }, { id: 'maedchen-zopf', scale: 1.3, flip: true }, { id: 'mann-rolle', scale: 1, flip: true }, { id: 'junge-korb', scale: 1.3, flip: false }] }
  ]
}

/**
 * Etappe 4, "Ein Ort für zwei" (neu, `beiseite`, Apg 23,19): der Innenhof des römischen Lagers von schräg oben (4:3, ohne Menschen); das Kind zieht den Oberhauptmann mit dem jungen Mann an eine Stelle,
 * die kein Soldat hört. Runde 1: drei Soldaten, Hörkreise immer sichtbar, zwei große freie Stellen; Runde 2: fünf Soldaten, größere Kreise, die erst nahe am Soldaten erscheinen, eine freie Stelle (hinter dem Brunnen).
 * Soldaten ohne Waffe in der Hand, die vierzig Männer und ihr Plan kommen nicht vor. Lagen am gemalten Bild gesetzt (tools/_massen_paulusrom.json). Bilder: `beiseite/hof`, `soldat-1..5`, `paar`, `paar-reden`, `hoerkreis`.
 */
const BEISEITE: QuietSpotGame = {
  yard: `${G}beiseite/hof.webp`,
  ratio: 1.33,
  soldiers: [`${G}beiseite/soldat-1.webp`, `${G}beiseite/soldat-2.webp`, `${G}beiseite/soldat-3.webp`, `${G}beiseite/soldat-4.webp`, `${G}beiseite/soldat-5.webp`],
  pair: `${G}beiseite/paar.webp`,
  pairTalk: `${G}beiseite/paar-reden.webp`,
  ring: `${G}beiseite/hoerkreis.webp`,
  soldierW: 15,
  pairW: 18,
  pairR: 7,
  rounds: [
    { hint: 'Bring die beiden an einen Ort, wo keiner zuhört.', showRings: 'always', start: { x: 8, y: 86 }, soldiers: [{ sprite: 1, x: 35, y: 42, r: 15 }, { sprite: 2, x: 80, y: 64, r: 15 }, { sprite: 3, x: 48, y: 80, r: 15 }], blocks: [{ x: 68.4, y: 40.8, r: 9 }, { x: 8, y: 34, r: 8 }, { x: 95, y: 12, r: 10 }, { x: 16, y: 64, r: 9 }, { x: 95, y: 88, r: 9 }, { x: 12, y: 15, r: 2.5 }, { x: 25, y: 22, r: 2.5 }, { x: 38, y: 20, r: 2.5 }, { x: 50, y: 19, r: 2.5 }, { x: 62, y: 17, r: 2.5 }, { x: 74, y: 16, r: 2.5 }, { x: 84, y: 15, r: 2.5 }] },
    { hint: 'Jetzt sind es mehr Soldaten, und die Ringe zeigen sich erst, wenn du nah herankommst. Schau auf die Soldaten.', showRings: 'near', start: { x: 8, y: 86 }, soldiers: [{ sprite: 1, x: 31, y: 72, r: 18 }, { sprite: 2, x: 86, y: 47, r: 20 }, { sprite: 3, x: 30, y: 31, r: 20 }, { sprite: 4, x: 60, y: 61, r: 18 }, { sprite: 5, x: 55, y: 37, r: 18 }], blocks: [{ x: 68.4, y: 40.8, r: 9 }, { x: 8, y: 34, r: 8 }, { x: 95, y: 12, r: 10 }, { x: 16, y: 64, r: 9 }, { x: 95, y: 88, r: 9 }, { x: 12, y: 15, r: 2.5 }, { x: 25, y: 22, r: 2.5 }, { x: 38, y: 20, r: 2.5 }, { x: 50, y: 19, r: 2.5 }, { x: 62, y: 17, r: 2.5 }, { x: 74, y: 16, r: 2.5 }, { x: 84, y: 15, r: 2.5 }] }
  ]
}

/**
 * Etappe 5, "Reihenfolge" (bekannt 2, Apg 26): Paulus erzählt sein Leben vor Agrippa. Runde 1 vier Karten mit Punkten (Pharisäer, Licht vor Damaskus, Predigt, Agrippa), Runde 2 alle fünf ohne Punkte
 * (dazu die Briefe der Hohenpriester, 26,10.12). Das Licht ist ohne Gestalt gemalt, keine Gefängnis- oder Gewaltbilder. Bilder: `reihenfolge/karte-*.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'pharisaeer', image: `${G}reihenfolge/karte-pharisaeer.webp`, label: 'Saulus mit der Schriftrolle im Tempel von Jerusalem' },
    { id: 'briefe', image: `${G}reihenfolge/karte-briefe.webp`, label: 'Saulus bekommt versiegelte Briefe von den Hohenpriestern' },
    { id: 'licht', image: `${G}reihenfolge/karte-licht.webp`, label: 'Ein helles Licht auf der Straße nach Damaskus' },
    { id: 'predigt', image: `${G}reihenfolge/karte-predigt.webp`, label: 'Paulus erzählt Menschen verschiedener Völker auf einem Platz' },
    { id: 'agrippa', image: `${G}reihenfolge/karte-agrippa.webp`, label: 'Paulus vor König Agrippa im Saal' }
  ],
  rounds: [
    { hint: 'Leg die Bilder aus dem Leben von Paulus in die richtige Reihenfolge. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['pharisaeer', 'licht', 'predigt', 'agrippa'] },
    { hint: 'Jetzt kommt noch ein Bild dazu, und die Punkte fehlen. Was kam zuerst, was danach?', numbered: false, cards: ['pharisaeer', 'briefe', 'licht', 'predigt', 'agrippa'] }
  ]
}

/**
 * Etappe 7, "Bretter ans Ufer" (neu, `bretter`, Apg 27,44): die Bucht am frühen Morgen von schräg oben (Hochformat 3:4, ohne Menschen), unten das Schiff auf der Sandbank, oben der Strand, links und rechts Felsen,
 * im Wasser helle Schaumstreifen; das Kind wählt die Stelle an der Bordwand, an der das Brett ins Wasser kommt, und die gemalte Strömung trägt es ans Ufer oder zu den Felsen (dort dreht ein Wirbel es sanft zurück).
 * Niemand geht unter. Runde 1: vier Bretter, drei Bahnen (zwei zum Strand); Runde 2: sechs Bretter und Stücke, vier Bahnen (zwei zum Strand, zwei zu den Felsen; das Bild hat nur vier Bahnen mit getrenntem Anfang). Bahnen und Bordwand am gemalten Bild abgelesen (
 * tools/_massen_paulusrom.json). Bilder: `bretter/bucht`, `brett-1..4`, `stueck-1..2`, `an-land-1..6`, `alle-an-land`.
 */
const BRETTER: PlanksGame = {
  bay: `${G}bretter/bucht.webp`,
  ratio: 0.75,
  finale: `${G}bretter/alle-an-land.webp`,
  items: [
    { id: 'brett-1', image: `${G}bretter/brett-1.webp`, ashore: `${G}bretter/an-land-1.webp`, name: 'Ein Seemann auf einem Brett' },
    { id: 'brett-2', image: `${G}bretter/brett-2.webp`, ashore: `${G}bretter/an-land-2.webp`, name: 'Ein Soldat ohne Waffe auf einem Brett' },
    { id: 'brett-3', image: `${G}bretter/brett-3.webp`, ashore: `${G}bretter/an-land-3.webp`, name: 'Ein bärtiger Gefangener auf einem Brett' },
    { id: 'brett-4', image: `${G}bretter/brett-4.webp`, ashore: `${G}bretter/an-land-4.webp`, name: 'Ein älterer Reisender auf einem Brett' },
    { id: 'stueck-1', image: `${G}bretter/stueck-1.webp`, ashore: `${G}bretter/an-land-5.webp`, name: 'Ein Mensch auf einem Lukendeckel' },
    { id: 'stueck-2', image: `${G}bretter/stueck-2.webp`, ashore: `${G}bretter/an-land-6.webp`, name: 'Ein Mensch auf einem großen Fass' }
  ],
  paths: [
    { start: 17, ends: 'rocks', points: [{ x: 17, y: 62 }, { x: 20, y: 51 }, { x: 28, y: 35 }, { x: 22, y: 27 }, { x: 12, y: 24 }] },
    { start: 34, ends: 'shore', points: [{ x: 34, y: 62 }, { x: 30, y: 52 }, { x: 39, y: 38 }, { x: 38, y: 24 }, { x: 35, y: 15 }] },
    { start: 54, ends: 'shore', points: [{ x: 54, y: 62 }, { x: 47, y: 48 }, { x: 49, y: 33 }, { x: 48, y: 22 }, { x: 49, y: 15 }] },
    { start: 71, ends: 'rocks', points: [{ x: 71, y: 62 }, { x: 61, y: 45 }, { x: 66, y: 31 }, { x: 80, y: 20 }, { x: 88, y: 17 }] }
  ],
  rail: { y: 62, from: 12, to: 80 },
  boardW: 22,
  ashoreW: 12,
  rounds: [
    { hint: 'Lass jedes Brett dort ins Wasser, wo die Wellen es ans Ufer tragen.', boards: ['brett-1', 'brett-2', 'brett-3', 'brett-4'], paths: [1, 2, 3] },
    { hint: 'Jetzt sind es sechs Bretter, und nur zwei schmale Streifen führen ans Ufer. Schau genau hin.', boards: ['brett-1', 'brett-2', 'brett-3', 'brett-4', 'stueck-1', 'stueck-2'], paths: [0, 1, 2, 3] }
  ]
}

/**
 * Etappe 8, "Reisig zusammenraffen" (neu, `reisig`, Apg 28,2–3): der Strand von Malta im Regen (3:2), links die Feuerstelle (vier Größen), rechts liegen Haufen trockener Zweige, Steine, Muscheln, Tang und nasses Holz.
 * Das Kind zieht mit dem Finger eine geschlossene Schlinge um mindestens zwei Reisighaufen, ohne etwas einzuschließen, das nicht brennt. Runde 1: drei Bündel; Runde 2: vier Bündel mit engen Schlingen,
 * das Feuer steht wegen des Regens wieder auf Stufe 2. Die Otter kommt nicht vor. Lagen am gemalten Bild gesetzt (tools/_massen_paulusrom.json). Bilder: `reisig/strand`, `feuer-1..4`, `reisig-1..4`, `stein-1..3`,
 * `muschel`, `tang`, `nasses-holz`, `buendel`, `paulus-buendel`, `spur-punkt`, `am-feuer`.
 */
const REISIG: BrushwoodGame = {
  beach: `${G}reisig/strand.webp`,
  fire: [`${G}reisig/feuer-1.webp`, `${G}reisig/feuer-2.webp`, `${G}reisig/feuer-3.webp`, `${G}reisig/feuer-4.webp`],
  fireAt: { x: 19, y: 76 },
  fireW: 30,
  bundle: `${G}reisig/buendel.webp`,
  paulus: `${G}reisig/paulus-buendel.webp`,
  paulusAt: { x: 40, y: 94 },
  paulusW: 13,
  dot: `${G}reisig/spur-punkt.webp`,
  finale: `${G}reisig/am-feuer.webp`,
  closeDist: 8,
  rounds: [
    {
      hint: 'Zieh mit dem Finger einen Kreis um das trockene Reisig.',
      bundles: 3,
      fireStart: 1,
      things: [
      { id: 'reisig-1', image: `${G}reisig/reisig-1.webp`, x: 55, y: 50, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-2', image: `${G}reisig/reisig-2.webp`, x: 67, y: 52, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-3', image: `${G}reisig/reisig-3.webp`, x: 56, y: 80, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-4', image: `${G}reisig/reisig-4.webp`, x: 68, y: 84, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-1b', image: `${G}reisig/reisig-1.webp`, x: 85, y: 50, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-2b', image: `${G}reisig/reisig-2.webp`, x: 90, y: 70, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'stein-1', image: `${G}reisig/stein-1.webp`, x: 80, y: 78, w: 10, dry: false, name: 'Ein Stein' },
      { id: 'stein-2', image: `${G}reisig/stein-2.webp`, x: 60, y: 66, w: 10, dry: false, name: 'Ein Stein' },
      { id: 'muschel', image: `${G}reisig/muschel.webp`, x: 92, y: 90, w: 10, dry: false, name: 'Eine Muschel' }
      ]
    },
    {
      hint: 'Jetzt liegt das Reisig zwischen Steinen und nassem Holz. Zieh den Kreis eng.',
      bundles: 4,
      fireStart: 2,
      things: [
      { id: 'reisig-1', image: `${G}reisig/reisig-1.webp`, x: 52, y: 46, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-2', image: `${G}reisig/reisig-2.webp`, x: 65, y: 46, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-3', image: `${G}reisig/reisig-3.webp`, x: 81, y: 46, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-4', image: `${G}reisig/reisig-4.webp`, x: 94, y: 46, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-1b', image: `${G}reisig/reisig-1.webp`, x: 52, y: 78, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-2b', image: `${G}reisig/reisig-2.webp`, x: 65, y: 78, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-3b', image: `${G}reisig/reisig-3.webp`, x: 81, y: 78, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'reisig-4b', image: `${G}reisig/reisig-4.webp`, x: 94, y: 78, w: 11, dry: true, name: 'Trockenes Reisig' },
      { id: 'stein-1', image: `${G}reisig/stein-1.webp`, x: 58, y: 62, w: 10, dry: false, name: 'Ein Stein' },
      { id: 'stein-2', image: `${G}reisig/stein-2.webp`, x: 73, y: 70, w: 10, dry: false, name: 'Ein Stein' },
      { id: 'stein-3', image: `${G}reisig/stein-3.webp`, x: 88, y: 62, w: 10, dry: false, name: 'Ein Stein' },
      { id: 'tang', image: `${G}reisig/tang.webp`, x: 73, y: 90, w: 11, dry: false, name: 'Nasser Seetang' },
      { id: 'nasses-holz', image: `${G}reisig/nasses-holz.webp`, x: 73, y: 54, w: 11, dry: false, name: 'Nasses Treibholz' },
      { id: 'muschel', image: `${G}reisig/muschel.webp`, x: 56, y: 94, w: 10, dry: false, name: 'Eine Muschel' }
      ]
    }
  ]
}

/**
 * Etappe 9, "Alle aufnehmen" (neu, `besuch`, Apg 28,16.20.30): die Wohnung in Rom von schräg oben (4:3, ohne Menschen) mit vier gemalten Matten für den Hocker des Soldaten. Eine leichte Kette hält Paulus beim Soldaten
 * (28,20); das Kind setzt den Soldaten so, dass die Kette bis zum Gast reicht. Runde 1: drei Gäste, drei Plätze, ein erster Tipp zeigt den Kreis der Kette; Runde 2: fünf Gäste, vier Plätze, ohne Kreis, zweimal kommen
 * zwei Gäste zugleich und nur ein Platz reicht zu beiden. Dass die Kette am Soldaten hängt, ist Ausgestaltung. Lagen am gemalten Bild gesetzt (tools/_massen_paulusrom.json). Bilder: `besuch/wohnung`, `soldat-hocker`, `soldat-traegt`,
 * `paulus-steht`, `paulus-geht`, `paulus-redet`, `kette`, `reichweite`, `gast-1..6`, `gast-1..6-hoert`, `alle-hoeren`.
 */
const BESUCH: VisitorsGame = {
  room: `${G}besuch/wohnung.webp`,
  ratio: 1.33,
  soldier: { sit: `${G}besuch/soldat-hocker.webp`, carry: `${G}besuch/soldat-traegt.webp` },
  paulus: { stand: `${G}besuch/paulus-steht.webp`, walk: `${G}besuch/paulus-geht.webp`, talk: `${G}besuch/paulus-redet.webp` },
  chain: `${G}besuch/kette.webp`,
  reach: `${G}besuch/reichweite.webp`,
  finale: `${G}besuch/alle-hoeren.webp`,
  guests: [
    { id: 'aeltester', image: `${G}besuch/gast-1.webp`, listening: `${G}besuch/gast-1-hoert.webp`, name: 'Ein jüdischer Ältester' },
    { id: 'mutter', image: `${G}besuch/gast-2.webp`, listening: `${G}besuch/gast-2-hoert.webp`, name: 'Eine Mutter mit Kind' },
    { id: 'soldat', image: `${G}besuch/gast-3.webp`, listening: `${G}besuch/gast-3-hoert.webp`, name: 'Ein römischer Soldat ohne Waffe' },
    { id: 'haendler', image: `${G}besuch/gast-4.webp`, listening: `${G}besuch/gast-4-hoert.webp`, name: 'Ein Händler' },
    { id: 'jungmann', image: `${G}besuch/gast-5.webp`, listening: `${G}besuch/gast-5-hoert.webp`, name: 'Ein junger Mann' },
    { id: 'alte-frau', image: `${G}besuch/gast-6.webp`, listening: `${G}besuch/gast-6-hoert.webp`, name: 'Eine alte Frau' }
  ],
  stools: [{ x: 12, y: 85 }, { x: 52, y: 75 }, { x: 87, y: 67 }, { x: 62, y: 49 }],
  beside: { x: 7, y: -3 },
  chainLen: 28,
  soldierW: 18,
  paulusW: 15,
  guestW: 15,
  standOff: 8,
  rounds: [
    { hint: 'Stell den Hocker des Soldaten so hin, dass Paulus jeden Gast erreicht.', showReach: true, stools: [0, 1, 2], visits: [{ arrivals: [{ guest: 0, at: { x: 34, y: 90 } }] }, { arrivals: [{ guest: 1, at: { x: 64, y: 58 } }] }, { arrivals: [{ guest: 2, at: { x: 92, y: 84 } }] }] },
    { hint: 'Jetzt ist der Kreis der Kette nicht mehr zu sehen, und manchmal kommen zwei Gäste zugleich. Ein Platz reicht zu beiden.', showReach: false, stools: [0, 1, 2, 3], visits: [{ arrivals: [{ guest: 3, at: { x: 36, y: 88 } }] }, { arrivals: [{ guest: 4, at: { x: 30, y: 62 } }, { guest: 5, at: { x: 68, y: 70 } }] }, { arrivals: [{ guest: 0, at: { x: 84, y: 54 } }, { guest: 1, at: { x: 92, y: 88 } }] }] }
  ]
}

export const paulusrom: Journey = {
  id: 'paulusrom',
  title: 'Bis nach Rom',
  subtitle: 'Paulus reist in die Hauptstadt der Welt',
  age: '8-10',
  downloadMb: 17, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: das Schiff vor Malta (Konturzeichnung, ohne Menschen, ohne Schlange)
  gift: { title: 'Das Schiff vor Malta', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, Bildmodell von Antons Codex bzw. OpenAI-API nur fürs Panorama): eine Seereise von Ost nach West, Athen, Troas, Milet, Jerusalem, Cäsarea,
  // das Meer im Sturm, die Bucht, Malta, Rom; Stationen aus ergebnis/panorama/map-paulusrom.json (bzw. tools/_stationen_paulusrom.json), Perlenweg aus paulusromPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/paulusrom/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0645, y: 0.2609, d: 0.0339 },
      { x: 0.2278, y: 0.4976, d: 0.0339 },
      { x: 0.3367, y: 0.4126, d: 0.0339 },
      { x: 0.4506, y: 0.6614, d: 0.0339 },
      { x: 0.5806, y: 0.2670, d: 0.0339 },
      { x: 0.6512, y: 0.2245, d: 0.0339 },
      { x: 0.7006, y: 0.3155, d: 0.0339 },
      { x: 0.7661, y: 0.2731, d: 0.0339 },
      { x: 0.9224, y: 0.3398, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.2549, d: 0.0339 },
    path: PAULUSROM_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Dem unbekannten Gott',
      ref: 'Apostelgeschichte 17,16–34',
      text: [
        'Noch bevor Paulus nach Korinth kommt, ist er in Athen. Dort wartet er auf seine Freunde Silas und Timotheus. Er sieht, wie voll die Stadt von Götterbildern ist. Das ärgert ihn sehr. Jeden Tag redet er in der Synagoge und auf dem Markt.',
        'Einige Gelehrte streiten mit ihm. „Was will dieser Schwätzer sagen?“, spotten die einen. Andere meinen, er bringe fremde Götter, denn er erzählt von Jesus und von der Auferstehung. Auf dem Gerichtsplatz fragen sie: „Was ist das für eine neue Lehre?“',
        'Paulus stellt sich mitten auf den Platz. „Ihr Männer von Athen“, sagt er, „in eurer Stadt habe ich einen Altar gefunden. Darauf steht: Dem unbekannten Gott. Von ihm erzähle ich euch. Gott hat die Welt gemacht und alles, was darin ist. Er wohnt nicht in Tempeln, die Menschen gebaut haben. Er gibt allen Leben und Atem. Er ist nicht fern von einem jeden unter uns.“',
        'Als sie von der Auferstehung der Toten hören, lachen einige über ihn. Andere sagen: „Wir wollen dich ein andermal weiter hören.“ Einige aber glauben, unter ihnen Dionysius, einer aus dem Rat, und eine Frau namens Damaris.'
      ],
      // Spiel: Wimmelbild (wimmelbild, bekannt)
      task: { kind: 'wimmelbild', hint: 'Such zwischen den vielen Götterbildern von Athen die Altäre.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Was steht auf dem Altar, den Paulus findet?', options: ['Dem unbekannten Gott', 'Dem großen König', 'Dem Gott des Meeres'], answer: 0 },
        { q: 'Wer glaubt nach der Rede von Paulus?', options: ['Dionysius und Damaris', 'Petrus und Johannes', 'Felix und Festus'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Eutychus im Fenster',
      ref: 'Apostelgeschichte 20,7–12',
      text: [
        'Einige Jahre später ist Paulus mit seinen Begleitern in der Stadt Troas. Am ersten Tag der Woche kommen die Jünger zusammen, um das Brot zu brechen. Paulus will am nächsten Morgen weiterreisen. Darum redet er lange, bis Mitternacht. Oben im Obergemach brennen viele Lampen.',
        'Ein junger Mann mit Namen Eutychus sitzt im Fenster. Paulus redet und redet, und Eutychus wird immer müder. Er sinkt in einen tiefen Schlaf und fällt vom dritten Stock hinunter. Als sie ihn unten aufheben, ist er gestorben.',
        'Paulus geht hinab, legt sich über ihn und schließt ihn in die Arme. „Macht kein Getümmel“, sagt er zu den anderen. „Seine Seele ist in ihm.“',
        'Dann steigt Paulus wieder hinauf, bricht das Brot und isst. Er redet noch lange mit ihnen, bis der Tag anbricht, und zieht dann weiter. Eutychus aber bringen sie lebendig herein, und alle sind sehr getröstet.'
      ],
      // Spiel: Schatten an der Wand (wandschatten, neu)
      task: { kind: 'wandschatten', hint: 'Schau dir den Schatten an der Wand an und tippe auf den, der ihn wirft.', wallShadows: WANDSCHATTEN },
      questions: [
        { q: 'Wo sitzt Eutychus, während Paulus redet?', options: ['im Fenster', 'auf der Treppe', 'neben der Tür'], answer: 0 },
        { q: 'Was sagt Paulus, als er Eutychus in den Armen hält?', options: ['Seine Seele ist in ihm.', 'Tragt ihn schnell nach Hause.', 'Holt einen Arzt aus der Stadt.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Abschied in Milet',
      ref: 'Apostelgeschichte 20,13–38',
      text: [
        'Paulus fährt mit dem Schiff weiter. Er möchte zum Pfingstfest in Jerusalem sein. In der Hafenstadt Milet lässt er die Ältesten der Gemeinde aus Ephesus zu sich rufen.',
        '„Ihr wisst, wie ich die ganze Zeit bei euch gewesen bin“, sagt er. „Ich habe euch alles verkündigt, was gut für euch ist. Jetzt fahre ich nach Jerusalem und weiß nicht, was mir dort begegnen wird. Aber mein Leben ist mir nicht so wichtig. Ich will meinen Lauf mit Freuden vollenden.“',
        '„Ihr werdet mein Gesicht nicht mehr sehen. Gebt acht auf euch und auf die ganze Herde. Silber, Gold oder Kleider habe ich von keinem verlangt. Mit diesen Händen habe ich für mich und meine Begleiter gearbeitet. Denkt an das Wort des Herrn Jesus: Geben ist seliger als Nehmen.“',
        'Danach kniet Paulus nieder und betet mit ihnen allen. Sie weinen sehr, fallen ihm um den Hals und küssen ihn. Am meisten schmerzt sie sein Wort, dass sie ihn nicht mehr sehen werden. Dann bringen sie ihn zum Schiff.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen lässt Paulus nach Milet rufen?', options: ['die Ältesten der Gemeinde aus Ephesus', 'die Fischer aus dem Hafen', 'die Soldaten des Kaisers'], answer: 0 },
        { q: 'Welches Wort von Jesus gibt Paulus ihnen mit?', options: ['Geben ist seliger als Nehmen.', 'Nehmen ist besser als Geben.', 'Jeder sorgt für sich allein.'], answer: 0 },
        { q: 'Was tut Paulus, bevor er zum Schiff geht?', options: ['Er kniet nieder und betet mit ihnen allen.', 'Er singt ein Lied am Strand.', 'Er feiert ein großes Fest.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der Neffe des Paulus',
      ref: 'Apostelgeschichte 21,27–23,24',
      text: [
        'In Jerusalem packen einige Leute Paulus im Tempel, und die ganze Stadt gerät in Aufruhr. Der Oberhauptmann nimmt ihn mit in das Lager der Soldaten. In der Nacht steht der Herr bei ihm und sagt: „Sei getrost, Paulus! Du musst auch in Rom von mir erzählen.“',
        'Am Morgen schließen mehr als vierzig Männer einen Bund gegen Paulus. Sie schwören, nichts zu essen und zu trinken, bis Paulus nicht mehr lebt. Auf dem Weg zum Rat wollen sie ihm auflauern.',
        'Aber der Sohn von Paulus\' Schwester hört von dem Plan. Er geht in das Lager und sagt es Paulus. Paulus ruft einen Hauptmann: „Bring diesen jungen Mann zum Oberhauptmann. Er hat ihm etwas zu sagen.“ Der Oberhauptmann nimmt ihn bei der Hand, geht mit ihm an einen Ort, wo sie allein sind, und fragt: „Was hast du mir zu sagen?“ Da erzählt der junge Mann alles: „Trau ihnen nicht!“',
        '„Sag niemandem, dass du mir das erzählt hast“, sagt der Oberhauptmann und lässt ihn gehen. In der Nacht lässt er viele Soldaten und Reiter bereitmachen. Auf einem Reittier bringen sie Paulus sicher nach Cäsarea zu Felix, dem Statthalter.'
      ],
      // Spiel: Ein Ort für zwei (beiseite, neu)
      task: { kind: 'beiseite', hint: 'Bring die beiden an einen Ort, wo keiner zuhört.', quietSpot: BEISEITE },
      questions: [
        { q: 'Wer hört von dem Plan der Männer?', options: ['der Sohn von Paulus\' Schwester', 'der Hohepriester im Tempel', 'der Statthalter Felix'], answer: 0 },
        { q: 'Wohin bringen die Soldaten Paulus in der Nacht?', options: ['nach Cäsarea zu Felix', 'nach Athen zu den Gelehrten', 'nach Troas zu den Jüngern'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Vor König Agrippa',
      ref: 'Apostelgeschichte 24,27–26,32',
      text: [
        'Zwei Jahre lang bleibt Paulus in Cäsarea gefangen. Dann kommt Festus als neuer Statthalter. „Ich berufe mich auf den Kaiser“, sagt Paulus. „Zum Kaiser sollst du ziehen“, antwortet Festus. Bald darauf kommen König Agrippa und Bernice mit großer Pracht in den Saal, und Paulus wird hereingebracht.',
        '„Du darfst für dich reden“, sagt Agrippa. Paulus streckt die Hand aus und erzählt von seinem Leben. „Von Jugend auf habe ich in Jerusalem gelebt, als strenger Pharisäer. Ich meinte, ich müsste viel gegen den Namen Jesu tun. Viele von der Gemeinde habe ich ins Gefängnis gebracht.“',
        '„Auf dem Weg nach Damaskus sah ich mitten am Tag ein Licht vom Himmel, heller als die Sonne. Ich hörte eine Stimme: Saul, Saul, was verfolgst du mich? Ich bin Jesus, den du verfolgst. Steh auf! Ich sende dich zu den Völkern, damit sie von der Finsternis zum Licht kommen.“',
        '„Paulus, du bist von Sinnen!“, ruft Festus. „Ich bin nicht von Sinnen“, antwortet Paulus. Agrippa sagt: „Es fehlt nicht viel, und du überredest mich, dass ich ein Christ werde.“ Danach sagen sie: „Dieser Mann hat nichts getan, wofür er gefangen sein müsste.“'
      ],
      // Spiel: Reihenfolge (reihenfolge, bekannt)
      task: { kind: 'reihenfolge', hint: 'Leg die Bilder aus dem Leben von Paulus in die richtige Reihenfolge.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sieht Paulus auf dem Weg nach Damaskus?', options: ['ein Licht vom Himmel, heller als die Sonne', 'einen Wagen aus Gold auf der Straße', 'einen großen Sturm über dem Meer'], answer: 0 },
        { q: 'Was sagt Agrippa zu Paulus?', options: ['Es fehlt nicht viel, und du überredest mich.', 'Du musst noch heute die Stadt verlassen.', 'Ich schenke dir ein Haus in Cäsarea.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Sturm auf dem Meer',
      ref: 'Apostelgeschichte 27,1–26',
      text: [
        'Nun soll Paulus mit dem Schiff nach Italien fahren. Ein Hauptmann mit Namen Julius bewacht ihn und andere Gefangene, und er ist freundlich zu Paulus. Oft ist ihnen der Wind entgegen. Bei Kreta warnt Paulus: „Liebe Männer, diese Fahrt wird viel Schaden bringen.“ Aber der Hauptmann glaubt dem Steuermann mehr.',
        'Kurz darauf fällt ein starker Wind über das Schiff her, der Nordost. Das Schiff kann nicht gegen den Wind fahren, und sie lassen es treiben. Mit Seilen binden sie es von unten zusammen. Am nächsten Tag werfen sie Ladung ins Meer, am dritten Tag die Geräte des Schiffs.',
        'Viele Tage lang sehen sie weder Sonne noch Sterne. Lange hat keiner etwas gegessen, und sie haben keine Hoffnung mehr. Da tritt Paulus mitten unter sie.',
        '„Seid unverzagt!“, sagt er. „Keiner von uns wird umkommen, nur das Schiff. Heute Nacht stand der Engel Gottes bei mir und sprach: Fürchte dich nicht, Paulus! Du musst vor den Kaiser treten. Alle, die mit dir fahren, hat Gott dir geschenkt. Ich glaube Gott, es wird so geschehen. Wir werden auf eine Insel stoßen.“'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer bewacht Paulus auf der Fahrt nach Italien?', options: ['ein Hauptmann mit Namen Julius', 'König Agrippa mit seinen Dienern', 'der Steuermann des Schiffs'], answer: 0 },
        { q: 'Was sehen sie viele Tage lang nicht?', options: ['die Sonne und die Sterne', 'die Segel anderer Schiffe', 'die Lichter von Rom'], answer: 0 },
        { q: 'Was sagt Paulus zu allen auf dem Schiff?', options: ['Seid unverzagt!', 'Springt alle ins Meer!', 'Fahrt zurück nach Kreta!'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Alle kommen an Land',
      ref: 'Apostelgeschichte 27,27–44',
      text: [
        'In der vierzehnten Nacht merken die Seeleute, dass Land nahe ist. Sie lassen das Lot hinab: zwanzig Klafter tief, ein Stück weiter nur noch fünfzehn. Hinten am Schiff werfen sie vier Anker aus und wünschen, dass es Tag wird.',
        'Als es hell wird, sagt Paulus zu allen: „Esst etwas! Seit vierzehn Tagen habt ihr nichts gegessen. Keinem von euch wird ein Haar vom Kopf fallen.“ Er nimmt Brot, dankt Gott vor allen, bricht es und fängt an zu essen. Da fassen sie alle wieder Mut und essen auch. Zweihundertsechsundsiebzig Menschen sind auf dem Schiff.',
        'Am Tag sehen sie eine Bucht mit einem flachen Ufer. Sie kappen die Anker, ziehen das Segel hoch und fahren darauf zu. Doch das Schiff läuft auf Grund. Vorn bleibt es fest stecken, hinten zerbrechen es die Wellen.',
        'Der Hauptmann Julius will Paulus retten. „Wer schwimmen kann, springt zuerst ins Wasser und schwimmt an Land“, befiehlt er. Die anderen halten sich an Brettern und an Stücken vom Schiff fest. So kommen sie alle gerettet an Land.'
      ],
      // Spiel: Bretter ans Ufer (bretter, neu)
      task: { kind: 'bretter', hint: 'Lass jedes Brett dort ins Wasser, wo die Wellen es ans Ufer tragen.', planks: BRETTER },
      questions: [
        { q: 'Was tut Paulus mit dem Brot?', options: ['Er dankt Gott, bricht es und isst.', 'Er wirft es ins Meer.', 'Er versteckt es im Schiff.'], answer: 0 },
        { q: 'Woran halten sich die fest, die nicht schwimmen können?', options: ['an Brettern und Stücken vom Schiff', 'an einem langen Seil vom Ufer', 'an den Mähnen der Pferde'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Malta',
      ref: 'Apostelgeschichte 28,1–10',
      text: [
        'Erst am Ufer erfahren sie, dass die Insel Malta heißt. Die Leute der Insel sind sehr freundlich zu ihnen. Es regnet, und es ist kalt. Darum zünden sie ein Feuer an und nehmen alle bei sich auf.',
        'Paulus rafft einen Haufen Reisig zusammen und legt es aufs Feuer. Da kriecht wegen der Hitze eine Otter heraus, eine Schlange, und hängt sich an seine Hand. Die Leute sehen es und sagen untereinander: „Dieser Mann hat gewiss etwas Schlimmes getan.“ Paulus aber schüttelt das Tier ins Feuer, und ihm geschieht nichts.',
        'Die Leute warten, dass seine Hand anschwillt oder dass er umfällt. Sie warten lange, doch nichts geschieht. Da denken sie ganz anders über ihn und sagen, er sei ein Gott.',
        'In der Nähe wohnt Publius, der Oberste der Insel. Er nimmt sie auf und sorgt drei Tage lang freundlich für sie. Sein Vater liegt krank mit Fieber. Paulus geht zu ihm hinein, betet, legt ihm die Hände auf und macht ihn gesund. Da kommen auch die anderen Kranken der Insel und lassen sich gesund machen.'
      ],
      // Spiel: Reisig zusammenraffen (reisig, neu)
      task: { kind: 'reisig', hint: 'Zieh mit dem Finger einen Kreis um das trockene Reisig.', brushwood: REISIG },
      questions: [
        { q: 'Warum zünden die Leute ein Feuer an?', options: ['wegen des Regens und der Kälte', 'um Fische zu braten', 'um den Schiffen ein Zeichen zu geben'], answer: 0 },
        { q: 'Was tut Paulus beim Vater von Publius?', options: ['Er betet und legt ihm die Hände auf.', 'Er kocht ihm eine warme Suppe.', 'Er singt ihm ein Lied vor.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Unverboten in Rom',
      ref: 'Apostelgeschichte 28,10–31',
      text: [
        'Nach drei Monaten fahren sie mit einem anderen Schiff weiter. Die Leute von Malta laden ihnen alles auf, was sie brauchen. In Puteoli finden sie Brüder und bleiben sieben Tage bei ihnen. Dann ziehen sie nach Rom.',
        'Die Brüder in Rom hören, dass Paulus kommt. Sie gehen ihm weit entgegen, bis Forum Appii und Tres Tabernae. Als Paulus sie sieht, dankt er Gott und fasst neuen Mut.',
        'In Rom darf Paulus wohnen, wo er will, mit einem Soldaten, der ihn bewacht. Er trägt eine Kette. An einem Tag kommen viele Leute zu ihm. Von früh am Morgen bis zum Abend erzählt er ihnen von Jesus, aus dem Gesetz des Mose und aus den Propheten. Einige glauben, was er sagt, andere nicht.',
        'Zwei Jahre lang bleibt Paulus in seiner gemieteten Wohnung. Er nimmt alle auf, die zu ihm kommen. Er predigt das Reich Gottes und lehrt von dem Herrn Jesus mit aller Freudigkeit unverboten.'
      ],
      // Spiel: Alle aufnehmen (besuch, neu)
      task: { kind: 'besuch', hint: 'Stell den Hocker des Soldaten so hin, dass Paulus jeden Gast erreicht.', visitors: BESUCH },
      questions: [
        { q: 'Wer geht Paulus vor Rom weit entgegen?', options: ['die Brüder aus Rom', 'die Soldaten des Kaisers', 'die Leute von Malta'], answer: 0 },
        { q: 'Wie lange bleibt Paulus in seiner Wohnung in Rom?', options: ['zwei Jahre', 'zwei Tage', 'zwanzig Jahre'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was steht auf dem Altar in Athen?', options: ['Dem unbekannten Gott', 'Dem großen König', 'Dem Gott des Meeres'], answer: 0 },
    { q: 'Wer schläft in Troas im Fenster ein?', options: ['Eutychus', 'Timotheus', 'Dionysius'], answer: 0 },
    { q: 'Wer erzählt dem Oberhauptmann von dem bösen Plan?', options: ['der Sohn von Paulus\' Schwester', 'König Agrippa', 'der Hohepriester'], answer: 0 },
    { q: 'Vor welchem König erzählt Paulus von seinem Leben?', options: ['vor König Agrippa', 'vor König Salomo', 'vor König David'], answer: 0 },
    { q: 'Wer von den Menschen auf dem Schiff kommt an Land?', options: ['alle', 'nur die Seeleute', 'nur die Soldaten'], answer: 0 },
    { q: 'Wie lehrt Paulus in Rom von dem Herrn Jesus?', options: ['mit aller Freudigkeit unverboten', 'leise und nur heimlich', 'nur nachts bei geschlossener Tür'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of paulusrom.stages) {
  const file = `audio/abenteuer/paulusrom/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria (the market of Athens, the wide sea, evening in Rome); they follow one another at random
paulusrom.music = [
  'audio/abenteuer/paulusrom/musik-athen-v1.mp3',
  'audio/abenteuer/paulusrom/musik-meer-v1.mp3',
  'audio/abenteuer/paulusrom/musik-rom-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(paulusrom, paulusromEn)
