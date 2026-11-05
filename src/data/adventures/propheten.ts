/**
 * Abenteuer "Der König kommt" (Jesaja 9; 11; 53 und Micha 4; 5; Matthäus 2,1-6) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Was die Propheten sagen". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 30.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Propheten/ENTWURF_Propheten.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-10-30.md.
 * Gemildert erzählt: Jesaja 9,8 ff., 11,4, 11,10-16, Micha 5,5 ff.; Jesaja 53 nur als Quiz und ohne ein Leiden im Bild. Jesus wird weder gezeigt noch genannt; die einzige Brücke ist Matthäus 2,1-6.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Spielplan 5.11.2026: höchstens zwei bekannte, nie hintereinander): 1 Puzzle (bekannt), 2 Namen-Laternen (neu), 3 Wimmelbild (bekannt), 4 Der Spross (neu), 5 nur Quiz, 6 Frieden unter den Tieren (neu), 7 nur Quiz, 8 Die Schmiede (neu), 9 Wege zum Zion (neu).
 * Die Daten der drei neuesten Spiele erzeugt tools/neue_spiele_propheten.py (Typen und Prüfer: src/utils/prophetenNeu.ts).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/propheten/, images/abenteuer/spiele/propheten/<spiel>/, audio/abenteuer/propheten/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { FindGame, ForgeGame, Journey, PeaceGame } from '@/types/adventure'
import type { LanternGame, ShootGame, ZionGame } from '@/utils/prophetenNeu'
import { josef } from './josef'
import { PROPHETEN_PATH } from './prophetenPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { prophetenEn } from './en/propheten.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/propheten/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/propheten/'

const G = 'images/abenteuer/spiele/propheten/'

/**
 * Etappe 2, "Namen-Laternen" (neu, `laternen`, Jesaja 9,5): Laternen steigen in den Abendhimmel über Galiläa. Die Laternen mit einem Namen des Kindes fängt das Kind durch Antippen;
 * eine Laterne ohne Namen ist ein Fehler. Runde 1 in beliebiger Reihenfolge, Runde 2 schneller, mit mehr Laternen ohne Namen und in der Reihenfolge des Verses.
 * Die Namen (wie in der Etappe und bei Luther 1912: Wunderbar, Rat, Held, Ewig-Vater, Friedefürst) stehen als Schrift der App auf einem Schild, nicht im Bild.
 * Bilder (Bildauftrag S100): `laternen/nacht.webp` 900 × 1200, `laternen/laterne-1..4.webp` (3:4, ein Bogen mit Magenta-Schnitt).
 */
const LATERNEN: LanternGame = {
  background: `${G}laternen/nacht.webp`,
  designs: [1, 2, 3, 4].map((n) => `${G}laternen/laterne-${n}.webp`),
  names: ['Wunderbar', 'Rat', 'Held', 'Ewig-Vater', 'Friedefürst'],
  lanes: [12, 31, 50, 69, 88],
  w: 15,
  rounds: [
    {
      hint: 'Fange die Laternen, auf denen ein Name des Kindes steht. Tippe sie an.',
      rise: 9000,
      loop: 15000,
      order: false,
      sway: 1,
      lanterns: [
        { name: 0, lane: 1, at: 0, design: 0 },
        { name: -1, lane: 3, at: 1200, design: 1 },
        { name: 1, lane: 4, at: 2600, design: 2 },
        { name: 2, lane: 0, at: 4200, design: 3 },
        { name: -1, lane: 2, at: 5600, design: 0 },
        { name: 3, lane: 3, at: 7200, design: 1 },
        { name: -1, lane: 1, at: 8800, design: 2 },
        { name: 4, lane: 2, at: 10400, design: 3 }
      ]
    },
    {
      hint: 'Jetzt in der Reihenfolge des Verses: zuerst Wunderbar, dann Rat, Held, Ewig-Vater und Friedefürst.',
      rise: 7000,
      loop: 11000,
      order: true,
      sway: 1.5,
      lanterns: [
        { name: 0, lane: 2, at: 0, design: 0 },
        { name: -1, lane: 0, at: 1000, design: 1 },
        { name: 3, lane: 4, at: 2000, design: 2 },
        { name: -1, lane: 1, at: 3000, design: 3 },
        { name: 1, lane: 3, at: 4000, design: 0 },
        { name: -1, lane: 2, at: 5000, design: 1 },
        { name: 4, lane: 0, at: 6000, design: 2 },
        { name: -1, lane: 4, at: 7000, design: 3 },
        { name: 2, lane: 1, at: 8000, design: 0 },
        { name: -1, lane: 3, at: 9000, design: 1 },
        { name: -1, lane: 0, at: 10000, design: 2 }
      ]
    }
  ]
}

/**
 * Etappe 4, "Der Spross" (neu, `spross`, Jesaja 11,1): aus dem Baumstumpf wächst ein junger Trieb von allein nach oben; das Kind lenkt ihn (Finger auf dem Bild, zwei Knöpfe oder Pfeiltasten)
 * an den Steinen vorbei zum Licht. Ein Stein berührt ist ein Fehler (je Stein einmal); der Trieb gleitet am Stein entlang oder wartet. Runde 1 drei Steine, Runde 2 sechs.
 * Steine: Mitte in Prozent des Bildes, `r` = Sperrkreis in Prozent der Breite; `route` = Weg der Hilfe. Bilder (Bildauftrag S101): `spross/boden.webp` 900 × 1200,
 * `spross/stein-1..3.webp`, `spross/stiel.webp`, `spross/spitze.webp`.
 */
const SPROSS: ShootGame = {
  background: `${G}spross/boden.webp`,
  stem: `${G}spross/stiel.webp`,
  tip: `${G}spross/spitze.webp`,
  stones: [1, 2, 3].map((n) => `${G}spross/stein-${n}.webp`),
  start: { x: 50, y: 84 },
  light: { x: 50, y: 6 },
  lightR: 10,
  stoneScale: 1.15,
  rounds: [
    {
      hint: 'Lenke den jungen Trieb an den Steinen vorbei zum Licht.',
      stones: [
        { x: 50, y: 63, r: 8, image: 0 },
        { x: 28, y: 42, r: 8, image: 1 },
        { x: 68, y: 24, r: 8, image: 2 }
      ],
      route: [{ x: 72, y: 64 }, { x: 46, y: 30 }]
    },
    {
      hint: 'Jetzt liegen mehr Steine im Weg. Lenke den Trieb wieder zum Licht.',
      stones: [
        { x: 50, y: 64, r: 8, image: 0 },
        { x: 16, y: 48, r: 8, image: 1 },
        { x: 84, y: 48, r: 8, image: 2 },
        { x: 56, y: 31.5, r: 8, image: 1 },
        { x: 24, y: 16.5, r: 7.5, image: 2 },
        { x: 78, y: 16.5, r: 7.5, image: 0 }
      ],
      route: [{ x: 33, y: 66 }, { x: 31, y: 37.5 }]
    }
  ]
}

/**
 * Etappe 9, "Wege zum Zion" (neu, `zionwege`, Micha 4,1-2.6-7): eine Landkarte aus Wegplatten, oben der Berg Zion. Ein Tipp dreht eine Platte um eine Vierteldrehung;
 * wer einen Weg zum Zion hat, bekommt einen Haken. Erst je vier Drehungen über der Bestzahl (`par`) sind ein Fehler. Runde 1: 4 × 4 mit drei Menschen, Runde 2: 5 × 5 mit vier.
 * Karte: `.` Feld, `Z` Berg Zion, `I` gerade, `L` Ecke, `T` T-Stück, `E` Wegende; `start`/`solution`: Vierteldrehungen im Uhrzeigersinn. Lösbarkeit und `par` prüft `zionPathsProblems`.
 * Bilder (Bildauftrag S102): `zionwege/gerade`, `ecke`, `t`, `ende`, `zion`, `feld-1..4` (256 × 256, ein Bogen 3 × 3), `zionwege/mensch-1..4` (ein Bogen mit Magenta-Schnitt).
 */
const ZIONWEGE: ZionGame = {
  tiles: {
    straight: `${G}zionwege/gerade.webp`,
    corner: `${G}zionwege/ecke.webp`,
    tee: `${G}zionwege/t.webp`,
    end: `${G}zionwege/ende.webp`,
    zion: `${G}zionwege/zion.webp`,
    fields: [1, 2, 3, 4].map((n) => `${G}zionwege/feld-${n}.webp`)
  },
  people: [1, 2, 3, 4].map((n) => `${G}zionwege/mensch-${n}.webp`),
  rounds: [
    {
      hint: 'Tippe auf die Wegplatten, dann drehen sie sich. Bau jedem Menschen einen Weg zum Berg Zion.',
      rows: ['.Z..', 'LTTL', 'ILEE', 'E...'],
      start: ['0000', '0033', '1101', '1000'],
      solution: ['0000', '1202', '2122', '2000'],
      par: 12,
      people: [{ r: 3, c: 0, image: 0 }, { r: 2, c: 2, image: 1 }, { r: 2, c: 3, image: 2 }]
    },
    {
      hint: 'Jetzt warten vier Menschen. Bau allen einen Weg zum Berg Zion.',
      rows: ['..Z..', '.LTL.', 'ET.IL', '.IETE', '.LE..'],
      start: ['00000', '03130', '22013', '01201', '02300'],
      solution: ['00000', '01220', '31023', '02321', '00100'],
      par: 19,
      people: [{ r: 2, c: 0, image: 0 }, { r: 4, c: 2, image: 3 }, { r: 3, c: 2, image: 1 }, { r: 3, c: 4, image: 2 }]
    }
  ]
}

/**
 * Etappe 6, "Frieden unter den Tieren" (neu): auf einer Wiese des heiligen Berges stehen vier Tiere, vor denen man sich fürchten würde (Wolf, Leopard, junger Löwe, Bär), und darunter wartet ein Streifen mit den Tieren, die nach Jesaja 11,6-9
 * bei ihnen wohnen (Lamm, Zicklein, Kalb, Kuh). Das Kind tippt je ein Tier jeder Art an: das richtige Paar kommt zusammen (das Tier läuft zum anderen und beide bleiben beieinander); ein falsches Paar ist ein Fehler (Kreuz).
 * Runde 1 mit der Liste der Paare über dem Bild, Runde 2 ohne Liste und mit anderer Reihenfolge des Streifens. Am Ende kommt der kleine Knabe herein ("ein kleiner Knabe wird sie leiten").
 * Bilder (Bildauftrag S33): `friede/wiese.webp` 1200 × 900, `wolf`, `leopard`, `loewe`, `baer`, `lamm`, `zicklein`, `kalb`, `kuh` (ein Bogen mit Magenta-Schnitt), `knabe.webp`.
 */
const FRIEDE: PeaceGame = {
  background: `${G}friede/wiese.webp`,
  animals: [
    { id: 'wolf', image: `${G}friede/wolf.webp`, label: 'Wolf', w: 20 },
    { id: 'leopard', image: `${G}friede/leopard.webp`, label: 'Leopard', w: 21 },
    { id: 'loewe', image: `${G}friede/loewe.webp`, label: 'Löwe', w: 19 },
    { id: 'baer', image: `${G}friede/baer.webp`, label: 'Bär', w: 18 },
    { id: 'lamm', image: `${G}friede/lamm.webp`, label: 'Lamm', w: 14 },
    { id: 'zicklein', image: `${G}friede/zicklein.webp`, label: 'Zicklein', w: 13 },
    { id: 'kalb', image: `${G}friede/kalb.webp`, label: 'Kalb', w: 16 },
    { id: 'kuh', image: `${G}friede/kuh.webp`, label: 'Kuh', w: 18 }
  ],
  pairs: [
    { predator: 'wolf', prey: 'lamm' },
    { predator: 'leopard', prey: 'zicklein' },
    { predator: 'loewe', prey: 'kalb' },
    { predator: 'baer', prey: 'kuh' }
  ],
  spots: [{ x: 12, y: 64 }, { x: 62, y: 64 }, { x: 12, y: 82 }, { x: 62, y: 82 }],
  stripY: 98,
  boy: `${G}friede/knabe.webp`,
  boyW: 10,
  rounds: [
    { hint: 'Bringe die Tiere zusammen, wie Jesaja es sagt. Die Liste oben hilft dir: Tippe ein Tier an und dann sein Gegenstück.', showList: true, preyOrder: ['kuh', 'lamm', 'kalb', 'zicklein'] },
    { hint: 'Noch einmal, jetzt ohne Liste: Wer wohnt bei wem?', showList: false, preyOrder: ['kalb', 'zicklein', 'kuh', 'lamm'] }
  ]
}

/**
 * Etappe 8, "Die Schmiede" (neu): in einer Dorfschmiede liegt eine Waffe auf dem Amboss (Schwert, Speerspitze). Das Kind tippt dreimal auf den Amboss (der Hammer schwingt), das Metall glüht, und es wählt, was daraus wird:
 * aus dem Schwert eine Pflugschar, aus dem Speer eine Sichel (Micha 4,3). Ein falsches Werkzeug ist ein Fehler (Kreuz). Vier Runden: Schwert, Speer, dann beide noch einmal ohne den Hinweis auf den Text.
 * Bilder (Bildauftrag S34): `schmieden/schmiede.webp` 1200 × 900, `schwert`, `speer`, `pflugschar`, `sichel`, `hammer`, `glut` (ein Bogen mit Magenta-Schnitt).
 */
const SCHMIEDE: ForgeGame = {
  background: `${G}schmieden/schmiede.webp`,
  items: [
    { id: 'schwert', image: `${G}schmieden/schwert.webp`, label: 'Schwert', w: 40 },
    { id: 'speer', image: `${G}schmieden/speer.webp`, label: 'Speer', w: 30 },
    { id: 'pflugschar', image: `${G}schmieden/pflugschar.webp`, label: 'Pflugschar', w: 28 },
    { id: 'sichel', image: `${G}schmieden/sichel.webp`, label: 'Sichel', w: 28 },
    { id: 'hammer', image: `${G}schmieden/hammer.webp`, label: 'Hammer', w: 28 },
    { id: 'glut', image: `${G}schmieden/glut.webp`, label: 'Glühendes Metall', w: 34 }
  ],
  hot: 'glut',
  hammer: 'hammer',
  anvil: { x: 47, y: 60 },
  itemW: 28,
  rounds: [
    { hint: 'Schlage dreimal auf den Amboss. Dann wähle, was aus dem Schwert werden soll, wie Micha es sagt.', item: 'schwert', result: 'pflugschar', options: ['sichel', 'pflugschar', 'hammer'], hits: 3 },
    { hint: 'Jetzt liegt eine Speerspitze auf dem Amboss. Was wird daraus?', item: 'speer', result: 'sichel', options: ['pflugschar', 'hammer', 'sichel'], hits: 3 },
    { hint: 'Noch einmal ein Schwert. Denke an Michas Worte.', item: 'schwert', result: 'pflugschar', options: ['hammer', 'sichel', 'pflugschar'], hits: 3 },
    { hint: 'Zum Schluss wieder die Speerspitze.', item: 'speer', result: 'sichel', options: ['sichel', 'hammer', 'pflugschar'], hits: 3 }
  ]
}

/**
 * Etappe 3, "Wimmelbild" (alte Mechanik): die kleine Stadt Bethlehem im Hochformat (Bildauftrag S35) mit vielen Menschen und Schafen; gesucht werden fünf Lämmer mit Band oder Glöckchen, einige stehen hinter Stroh, Mauer, Baum und Krügen.
 * Bilder: `wimmel/szene.webp`, `laemmer-1..5.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Lamm mit rotem Band', 'Lamm mit gelbem Band', 'Lamm mit blauem Band', 'Lamm mit grünem Band', 'Lamm mit Glöckchen'],
  doneText: 'Du hast alle fünf Lämmer gefunden, die roten, blauen, gelben und grünen und das mit dem Glöckchen!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/laemmer-1.webp`, x: 90, y: 22, w: 13 },
    { image: `${G}wimmel/laemmer-2.webp`, x: 16, y: 72, w: 13 },
    { image: `${G}wimmel/laemmer-3.webp`, x: 24, y: 38, w: 13 },
    { image: `${G}wimmel/laemmer-4.webp`, x: 66, y: 94, w: 13 },
    { image: `${G}wimmel/laemmer-5.webp`, x: 40, y: 46, w: 13 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 88, y: 21, w: 20 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 14, y: 70, w: 26 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 24, y: 36, w: 24 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 66, y: 93, w: 20 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 70, y: 48, w: 16 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 40, y: 44, w: 22 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 88, y: 45, w: 22 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 30, y: 80, w: 16 }
  ]
}

export const propheten: Journey = {
  id: 'propheten',
  title: 'Der König kommt',
  subtitle: 'Was die Propheten sagen',
  age: '8-10',
  downloadMb: 15, // gemessen 14,4 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: Löwe und Lamm mit dem kleinen Knaben (Konturzeichnung)
  gift: { title: 'Löwe und Lamm', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus prophetenPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/propheten/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0537, y: 0.3677, d: 0.0339 },
      { x: 0.1185, y: 0.3732, d: 0.0339 },
      { x: 0.2316, y: 0.5795, d: 0.0339 },
      { x: 0.3931, y: 0.6068, d: 0.0339 },
      { x: 0.4967, y: 0.3677, d: 0.0339 },
      { x: 0.6001, y: 0.6353, d: 0.0339 },
      { x: 0.6982, y: 0.6408, d: 0.0339 },
      { x: 0.7705, y: 0.3677, d: 0.0339 },
      { x: 0.8982, y: 0.6408, d: 0.0339 }
    ],
    exam: { x: 0.9733, y: 0.3677, d: 0.0339 },
    path: PROPHETEN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Das große Licht',
      ref: 'Jesaja 9,1–4',
      text: [
        'Der Prophet Jesaja spricht zum Volk. In Sebulon und Naftali, in Galiläa am Weg zum Meer, sind Menschen in Angst. Es ist dunkel um sie geworden. „Aber es wird nicht dunkel bleiben“, sagt Jesaja.',
        '„Das Volk, das im Finstern wandelt, sieht ein großes Licht“, ruft er. „Über denen, die im finsteren Land wohnen, scheint es hell.“',
        'Dann spricht Jesaja zu Gott: „Du machst ihre Freude groß, wie man sich freut in der Ernte. Du zerbrichst das schwere Joch auf ihrer Schulter und den Stecken ihres Treibers, wie damals zur Zeit Midians.“'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Licht über dem Land zusammen.', puzzle: { image: `${G}puzzle/licht.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wo sind die Menschen in Angst?', options: ['in Sebulon und Naftali', 'in Ägypten', 'in Babel'], answer: 0 },
        { q: 'Was sieht das Volk, das im Finstern wandelt?', options: ['ein großes Licht', 'einen hohen Turm', 'ein großes Heer'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Ein Kind ist uns geboren',
      ref: 'Jesaja 9,5–7',
      text: [
        'Jesaja ruft dem Volk noch etwas Großes zu. Alle Rüstungen der Krieger, die mit lautem Lärm marschieren, werden verbrannt und vom Feuer verzehrt.',
        '„Denn uns ist ein Kind geboren“, sagt er, „ein Sohn ist uns gegeben. Die Herrschaft liegt auf seiner Schulter.“ Er nennt die Namen des Kindes: Wunderbar, Rat, Held, Ewig-Vater, Friedefürst.',
        'Seine Herrschaft wird groß werden. Des Friedens wird kein Ende sein auf dem Stuhl Davids und in seinem Königreich. Er wird es festigen mit Recht und Gerechtigkeit, von nun an bis in Ewigkeit. Der Eifer des Herrn Zebaoth wird das tun.'
      ],
      // Spiel: Namen-Laternen (laternen, neu)
      task: { kind: 'laternen', hint: 'Fange die Laternen mit den Namen des Kindes.', lanterns: LATERNEN },
      questions: [
        { q: 'Was geschieht mit den Rüstungen der Krieger?', options: ['Sie werden verbrannt.', 'Sie werden verkauft.', 'Sie werden vergraben.'], answer: 0 },
        { q: 'Auf wessen Stuhl wird des Friedens kein Ende sein?', options: ['auf dem Stuhl Davids', 'auf dem Stuhl des Pharao', 'auf dem Stuhl Sauls'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Bethlehem',
      ref: 'Micha 5,2; Matthäus 2,1–6',
      text: [
        'Auch der Prophet Micha spricht von einem Herrscher. „Und du, Bethlehem Ephrata“, spricht der Herr durch Micha, „du bist klein unter den Städten in Juda. Aus dir soll mir kommen, der in Israel Herr sein soll.“ Sein Ausgang ist von Anfang an und von Ewigkeit her. In Bethlehem hütete David einst die Schafe seines Vaters.',
        'Viele hundert Jahre später fragen Weise aus dem Morgenland in Jerusalem nach dem neugeborenen König. König Herodes ruft die Hohenpriester und Schriftgelehrten zusammen. Er fragt sie, wo der neue König geboren werden soll.',
        '„Zu Bethlehem“, antworten sie, „denn so hat es der Prophet geschrieben.“'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde die fünf Lämmer in Bethlehem: Eins hat ein rotes, eins ein blaues, eins ein gelbes und eins ein grünes Band, und eins trägt ein Glöckchen.', count: 5, find: WIMMEL },
      questions: [
        { q: 'Wie nennt der Herr durch Micha die Stadt Bethlehem?', options: ['klein unter den Städten in Juda', 'die größte Stadt im Land', 'die Hauptstadt des Königs'], answer: 0 },
        { q: 'Wen ruft König Herodes zusammen?', options: ['die Hohenpriester und Schriftgelehrten', 'die Hirten', 'die Soldaten'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Ein Zweig aus dem Stamm Isais',
      ref: 'Jesaja 11,1–5',
      text: [
        'Jesaja spricht vom Stamm Isais. Isai ist der Vater von König David. „Es wird eine Rute aufgehen von dem Stamm Isais“, sagt er, ein junger Trieb. „Ein Zweig aus seiner Wurzel wird Frucht bringen.“',
        'Auf diesem Zweig wird der Geist des Herrn ruhen. Es ist der Geist der Weisheit und des Verstandes. Es ist der Geist des Rates und der Stärke. Es ist der Geist der Erkenntnis und der Furcht des Herrn.',
        'Jesaja spricht von dem Zweig wie von einem Menschen. Er wird nicht richten nach dem, was seine Augen sehen. Er wird nicht urteilen nach dem, was seine Ohren hören. Mit Gerechtigkeit wird er den Armen Recht schaffen, den Elenden im Land. Gerechtigkeit wird der Gurt um seine Hüften sein.'
      ],
      // Spiel: Der Spross (spross, neu)
      task: { kind: 'spross', hint: 'Lenke den Trieb aus dem Baumstumpf zum Licht.', shootGrow: SPROSS },
      questions: [
        { q: 'Wer ist Isai?', options: ['der Vater von König David', 'ein Prophet', 'ein König von Babel'], answer: 0 },
        { q: 'Was wird aus dem Stamm Isais aufgehen?', options: ['eine Rute und ein Zweig', 'eine Mauer', 'ein Zelt'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Der Knecht Gottes',
      ref: 'Jesaja 53,1–6',
      text: [
        'Jesaja spricht von einem Knecht Gottes. Er wächst auf wie ein Zweig in dürrem Land. Er hat keine schöne Gestalt, die uns gefällt. „Wir hielten nichts von ihm“, sagt Jesaja. „Man wandte das Gesicht vor ihm ab. Er war verachtet und voller Schmerzen.“',
        '„Aber er trug unsere Krankheit und lud unsere Schmerzen auf sich. Wir meinten, Gott habe ihn geschlagen. Aber er ist um unserer Sünde willen verwundet. Die Strafe liegt auf ihm, damit wir Frieden haben. Durch seine Wunden sind wir geheilt.“',
        '„Wir gingen alle in die Irre wie Schafe“, sagt Jesaja, „ein jeder sah auf seinen Weg. Aber der Herr warf unser aller Sünde auf ihn.“'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie beschreibt Jesaja den Knecht Gottes?', options: ['verachtet und voller Schmerzen', 'reich und mächtig', 'stark wie ein Krieger'], answer: 0 },
        { q: 'Womit vergleicht Jesaja die Menschen?', options: ['mit Schafen, die in die Irre gehen', 'mit Vögeln im Wind', 'mit Wölfen im Wald'], answer: 0 },
        { q: 'Was liegt auf dem Knecht, damit wir Frieden haben?', options: ['die Strafe', 'die Krone', 'das Gold'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Wolf und Lamm',
      ref: 'Jesaja 11,6–9',
      text: [
        'Jesaja sagt weiter, wie es sein wird. „Die Wölfe werden bei den Lämmern wohnen“, sagt er, „und die Parder, das sind Leoparden, werden bei den Böcken liegen.“',
        'Kalb und junger Löwe werden miteinander gehen, und ein kleiner Knabe wird sie treiben. Kühe und Bären werden zusammen weiden, und ihre Jungen werden beieinander liegen. Der Löwe wird Stroh fressen wie der Ochse. Ein Säugling wird seine Freude haben am Loch der Otter. Die Otter ist eine giftige Schlange.',
        '„Man wird niemandem Schaden tun auf meinem ganzen heiligen Berg“, spricht der Herr durch Jesaja. „Denn das Land wird voll Erkenntnis des Herrn sein, wie Wasser das Meer bedeckt.“'
      ],
      // Spiel: Frieden unter den Tieren (friede, neu)
      task: { kind: 'friede', hint: 'Bringe die Tiere zusammen, wie Jesaja es sagt.', peace: FRIEDE },
      questions: [
        { q: 'Bei wem werden die Wölfe wohnen?', options: ['bei den Lämmern', 'bei den Adlern', 'bei den Füchsen'], answer: 0 },
        { q: 'Was wird der Löwe nach Jesajas Worten fressen?', options: ['Stroh', 'Fleisch', 'Fische'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Wie ein Lamm',
      ref: 'Jesaja 53,7–12',
      text: [
        'Jesaja spricht noch einmal von dem Knecht. Er wird gequält, aber er tut seinen Mund nicht auf. Er ist still wie ein Lamm, das man wegführt, und wie ein Schaf vor dem, der es schert.',
        'Er stirbt, obwohl er niemandem Unrecht getan hat und kein falsches Wort in seinem Mund war. Man gibt ihm sein Grab bei den Gottlosen und bei den Reichen.',
        'Aber der Herr wollte es so. Der Knecht gibt sein Leben hin als Opfer für die Schuld. Dann wird er lange leben, und durch ihn wird gelingen, was der Herr vorhat. Nach seiner Mühe wird er sich freuen und die Fülle haben. „Er, mein Knecht, der Gerechte, wird viele gerecht machen“, sagt der Herr. Er hat die Sünde vieler getragen und für die Übeltäter gebeten.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie verhält sich der Knecht, als er gequält wird?', options: ['Er bleibt still wie ein Lamm.', 'Er schreit laut.', 'Er wehrt sich mit Gewalt.'], answer: 0 },
        { q: 'Hat der Knecht jemandem Unrecht getan?', options: ['Nein, niemandem.', 'Ja, vielen.', 'Ja, dem König.'], answer: 0 },
        { q: 'Für wen hat er gebeten?', options: ['für die Übeltäter', 'für die Soldaten', 'für die Engel'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Schwerter zu Pflugscharen',
      ref: 'Micha 4,1–4',
      text: [
        'Micha sagt, wie es in den letzten Tagen sein wird. Der Berg mit dem Haus des Herrn wird höher sein als alle Berge. Viele Völker werden hinlaufen und rufen: „Kommt, wir gehen hinauf zum Haus des Gottes Jakobs! Er wird uns seine Wege lehren, und wir wollen auf seiner Straße gehen!“',
        'Der Herr wird unter den Völkern Recht sprechen. Dann werden sie ihre Schwerter zu Pflugscharen schmieden und ihre Spieße zu Sicheln. Kein Volk wird mehr das Schwert gegen ein anderes erheben. Niemand wird mehr lernen zu kämpfen.',
        '„Ein jeder wird unter seinem Weinstock und Feigenbaum wohnen ohne Furcht“, sagt Micha. Und Micha fügt hinzu: „Der Mund des Herrn Zebaoth hat es geredet.“'
      ],
      // Spiel: Die Schmiede (schmieden, neu)
      task: { kind: 'schmieden', hint: 'Schmiede aus den Waffen Werkzeuge für die Felder.', forge: SCHMIEDE },
      questions: [
        { q: 'Was machen die Völker aus ihren Schwertern?', options: ['Pflugscharen', 'Becher', 'Mauern'], answer: 0 },
        { q: 'Was machen sie aus ihren Spießen?', options: ['Sicheln', 'Hämmer', 'Nägel'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Der Friede und der König',
      ref: 'Micha 4,6–7; 5,4–5',
      text: [
        'Micha sagt, was der Herr tun wird. „Zu der Zeit will ich die Lahmen sammeln und die Verstoßenen zusammenbringen“, spricht der Herr. „Die Lahmen werden Erben haben, und aus den Verstoßenen mache ich ein großes Volk.“ Der Herr wird König über sie sein auf dem Berg Zion. Das gilt von nun an bis in Ewigkeit.',
        'Und noch einmal spricht Micha vom Herrscher aus Bethlehem. Er wird auftreten und weiden in der Kraft des Herrn und im Namen des Herrn, seines Gottes. Sie werden wohnen, und er wird groß sein, so weit die Welt reicht.',
        '„Und er wird unser Friede sein“, sagt Micha.'
      ],
      // Spiel: Wege zum Zion (zionwege, neu)
      task: { kind: 'zionwege', hint: 'Dreh die Wegplatten, bis alle einen Weg zum Berg Zion haben.', zionPaths: ZIONWEGE },
      questions: [
        { q: 'Wen will der Herr nach Michas Worten sammeln?', options: ['die Lahmen und die Verstoßenen', 'nur die Reichen', 'nur die Krieger'], answer: 0 },
        { q: 'Was sagt Micha über den Herrscher aus Bethlehem?', options: ['Er wird unser Friede sein.', 'Er wird uns reich machen.', 'Er wird eine Stadt bauen.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sieht das Volk, das im Finstern wandelt?', options: ['ein großes Licht', 'einen hohen Turm', 'ein großes Heer'], answer: 0 },
    { q: 'Aus welcher Stadt soll der Herrscher kommen, sagt Micha?', options: ['aus Bethlehem', 'aus Jericho', 'aus Susa'], answer: 0 },
    { q: 'Wer ist Isai?', options: ['der Vater von König David', 'der Bruder von Mose', 'ein König von Babel'], answer: 0 },
    { q: 'Womit vergleicht Jesaja die Menschen, die in die Irre gehen?', options: ['mit Schafen', 'mit Vögeln', 'mit Wölfen'], answer: 0 },
    { q: 'Was wird der Löwe nach Jesajas Worten fressen?', options: ['Stroh', 'Fleisch', 'Fische'], answer: 0 },
    { q: 'Was machen die Völker aus ihren Schwertern?', options: ['Pflugscharen', 'Becher', 'Mauern'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of propheten.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of propheten.stages) {
  const file = `audio/abenteuer/propheten/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the great light, the branch and the shepherd, peace among the animals); they follow one another at random
propheten.music = [
  'audio/abenteuer/propheten/musik-licht-v2.mp3',
  'audio/abenteuer/propheten/musik-zweig-v2.mp3',
  'audio/abenteuer/propheten/musik-frieden-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(propheten, prophetenEn)
