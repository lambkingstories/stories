/**
 * Abenteuer "Der König kommt" (Jesaja 9; 11; 53 und Micha 4; 5; Matthäus 2,1-6) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Was die Propheten sagen". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 30.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Propheten/ENTWURF_Propheten.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-10-30.md.
 * Gemildert erzählt: Jesaja 9,8 ff., 11,4, 11,10-16, Micha 5,5 ff.; Jesaja 53 nur als Quiz und ohne ein Leiden im Bild. Jesus wird weder gezeigt noch genannt; die einzige Brücke ist Matthäus 2,1-6.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Puzzle (alt), 2 Lückenvers (alt), 3 Wimmelbild (alt), 4 Reihenfolge (alt), 5 nur Quiz, 6 Frieden unter den Tieren (neu), 7 nur Quiz, 8 Die Schmiede (neu), 9 Memory (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/propheten/, images/abenteuer/spiele/propheten/<spiel>/, audio/abenteuer/propheten/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { FindGame, ForgeGame, Journey, MemoryGame, OrderGame, PeaceGame, VerseGame } from '@/types/adventure'
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
 * Etappe 2, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Salomo (kopiert). Hintergrund ist der gemalte Hof auf dem Hügel von Jerusalem (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Denn uns ist ein Kind ', ', ein Sohn ist uns gegeben.“'], words: ['geboren', 'gefunden', 'verloren'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Des Friedens wird kein ', ' sein auf dem ', ' Davids.“'], words: ['Ende', 'Stuhl', 'Anfang', 'Turm'], answers: [0, 1] }
  ]
}

/**
 * Etappe 4, "Ein Zweig aus dem Stamm Isais" (alte Mechanik, Reihenfolge legen): ein Baumstumpf, aus dem ein junger Zweig wächst: Stumpf, erster Trieb, junger Zweig, Zweig mit Früchten.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S36): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'stumpf', image: `${G}reihenfolge/karte-1.webp`, label: 'Der alte Baumstumpf' },
    { id: 'trieb', image: `${G}reihenfolge/karte-2.webp`, label: 'Ein erster junger Trieb' },
    { id: 'zweig', image: `${G}reihenfolge/karte-3.webp`, label: 'Ein Zweig mit vielen Blättern' },
    { id: 'frucht', image: `${G}reihenfolge/karte-4.webp`, label: 'Ein starker Zweig mit Früchten' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge, wie der Zweig wächst. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['trieb', 'zweig', 'frucht'] },
    { hint: 'Runde 2: Jetzt mit dem Baumstumpf und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['stumpf', 'trieb', 'zweig', 'frucht'] }
  ]
}

/**
 * Etappe 9, "Memory" (alte Mechanik): sechs Dinge aus Michas Worten (Hirtenstab, Krone, Pflugschar, Sichel, Traube, Feige); die Rückseite zeigt eine goldene Sonne (Bildauftrag S32, ein Bogen mit den sechs Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-hirtenstab.webp`, text: 'Der Hirtenstab: Er wird auftreten und weiden.' },
    { image: `${G}memory/karte-krone.webp`, text: 'Die Krone: Der Herr wird König über sie sein.' },
    { image: `${G}memory/karte-pflugschar.webp`, text: 'Die Pflugschar: Aus Schwertern werden Pflugscharen.' },
    { image: `${G}memory/karte-sichel.webp`, text: 'Die Sichel: Aus Spießen werden Sicheln.' },
    { image: `${G}memory/karte-traube.webp`, text: 'Die Traube: Ein jeder wird unter seinem Weinstock wohnen.' },
    { image: `${G}memory/karte-feige.webp`, text: 'Die Feige: Ein jeder wird unter seinem Feigenbaum wohnen.' }
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
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
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
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge, wie der Zweig wächst.', order: REIHENFOLGE },
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
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
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
