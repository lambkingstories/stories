/**
 * Abenteuer "Weihnachten" (Lukas 1-2; Matthäus 1-2) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Die Geschichte von Jesu Geburt". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 31.10.2026). Das erste Abenteuer des Neuen Testaments:
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (hier als neugeborenes Kind, ohne Heiligenschein).
 * Quelle der Texte: D:/Claude/Abenteuer-Weihnachten/ENTWURF_Weihnachten.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfbericht: PRUEFBERICHT-BIBELTREUE-2026-10-31.md.
 * Nicht erzählt: der Kindermord in Bethlehem (Mt 2,16-18). Was die Bibel nicht sagt, steht nicht da: kein Ochse, kein Esel, kein Stall, keine Zahl der Weisen im Text.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung): 1 Lückenvers (alt), 2 nur Quiz, 3 Reihenfolge (alt), 4 Wimmelbild (alt), 5 Das Kind in die Krippe legen (neu), 6 Memory (alt), 7 Das Zeichen finden (neu), 8 Puzzle (alt), 9 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/weihnachten/, images/abenteuer/spiele/weihnachten/<spiel>/, audio/abenteuer/weihnachten/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CribGame, FindGame, Journey, MemoryGame, OrderGame, SignGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { WEIHNACHTEN_PATH } from './weihnachtenPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { weihnachtenEn } from './en/weihnachten.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/weihnachten/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/weihnachten/'

const G = 'images/abenteuer/spiele/weihnachten/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Salomo (kopiert). Hintergrund ist der gemalte Hof in Nazareth (Bildauftrag S30).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Siehe, ich bin des Herrn ', '. Mir geschehe, wie du gesagt hast.“'], words: ['Magd', 'König', 'Hirte'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Bei Gott ist ', ' ', '.“'], words: ['nichts', 'unmöglich', 'alles', 'schwer'], answers: [0, 1] }
  ]
}

/**
 * Etappe 3, "Josefs Traum" (alte Mechanik, Reihenfolge legen): Josef macht sich Sorgen, träumt, wacht auf, nimmt Maria zu sich.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag S36): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'denkt', image: `${G}reihenfolge/karte-1.webp`, label: 'Josef denkt nach und macht sich Sorgen' },
    { id: 'traum', image: `${G}reihenfolge/karte-2.webp`, label: 'Josef schläft und träumt' },
    { id: 'erwacht', image: `${G}reihenfolge/karte-3.webp`, label: 'Josef wacht auf' },
    { id: 'nimmt', image: `${G}reihenfolge/karte-4.webp`, label: 'Josef nimmt Maria zu sich' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['traum', 'erwacht', 'nimmt'] },
    { hint: 'Runde 2: Jetzt mit Josefs Sorgen und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['denkt', 'traum', 'erwacht', 'nimmt'] }
  ]
}

/**
 * Etappe 6, "Memory" (alte Mechanik): sechs Dinge der Hirten (Hirtenstab, Schaf, Laterne, Windeln, Krippe, Hürde); die Rückseite zeigt einen goldenen Stern (Bildauftrag S32, ein Bogen mit den sechs Dingen, vom Code geschnitten).
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-hirtenstab.webp`, text: 'Der Hirtenstab: Die Hirten hüten in der Nacht ihre Herde.' },
    { image: `${G}memory/karte-schaf.webp`, text: 'Das Schaf: Die Hirten hüten ihre Herde.' },
    { image: `${G}memory/karte-laterne.webp`, text: 'Die Laterne: Es ist Nacht auf dem Feld.' },
    { image: `${G}memory/karte-windeln.webp`, text: 'Die Windeln: Das Kind ist in Windeln gewickelt.' },
    { image: `${G}memory/karte-krippe.webp`, text: 'Die Krippe: Das Kind liegt in einer Krippe.' },
    { image: `${G}memory/karte-huerde.webp`, text: 'Die Hürde: Die Hirten sind auf dem Feld bei den Hürden.' }
  ]
}

/**
 * Etappe 5, "Das Kind in die Krippe legen" (neu): im einfachen Unterstand sitzen Maria und Josef (Bild). Runde 1: „Sie wickelt ihn in Windeln“: drei Stoffe (Windeln, Königsmantel, Tierfell); der richtige lässt das gewickelte Kind erscheinen.
 * Runde 2: „und legt ihn in eine Krippe“: drei Lager (Krippe, goldenes Bett, Korb); das richtige legt das Kind in die Krippe. Ein falsches ist ein Fehler (Kreuz). Das Kind hat ein friedliches Gesicht, keinen Heiligenschein.
 * Bilder (Bildauftrag S34): `krippe/stall.webp` 1200 × 900, `eltern.webp`, `windeln`, `koenigstuch`, `fell`, `krippe`, `bett`, `korb`, `kind`, `krippe-kind` (Bögen mit Magenta-Schnitt).
 */
const KRIPPE: CribGame = {
  background: `${G}krippe/stall.webp`,
  parents: `${G}krippe/eltern.webp`,
  parentsAt: { x: 28, y: 66 },
  parentsW: 30,
  baby: `${G}krippe/kind.webp`,
  babyAt: { x: 56, y: 66 },
  babyW: 18,
  manger: `${G}krippe/krippe-kind.webp`,
  mangerAt: { x: 62, y: 74 },
  mangerW: 34,
  items: [
    { id: 'windeln', image: `${G}krippe/windeln.webp`, label: 'Windeln', w: 20 },
    { id: 'koenigstuch', image: `${G}krippe/koenigstuch.webp`, label: 'Königsmantel', w: 20 },
    { id: 'fell', image: `${G}krippe/fell.webp`, label: 'Tierfell', w: 20 },
    { id: 'krippe', image: `${G}krippe/krippe.webp`, label: 'Krippe', w: 20 },
    { id: 'bett', image: `${G}krippe/bett.webp`, label: 'Goldenes Bett', w: 20 },
    { id: 'korb', image: `${G}krippe/korb.webp`, label: 'Korb', w: 20 }
  ],
  rounds: [
    { hint: 'Maria will das Kind wickeln. Womit wickelt sie es? Wähle den richtigen Stoff.', options: ['koenigstuch', 'windeln', 'fell'], right: 'windeln' },
    { hint: 'Nun legt Maria das Kind hin. Wohin legt sie es? Wähle das richtige Lager.', options: ['bett', 'korb', 'krippe'], right: 'krippe' }
  ]
}

/**
 * Etappe 7, "Das Zeichen finden" (neu): der Engel hat gesagt: „Ihr werdet das Kind finden, in Windeln gewickelt und in einer Krippe liegend.“ Die Hirten eilen durch Bethlehem im Morgenlicht. Auf der Straße stehen sechs Orte
 * (vier Häuser, ein leeres Haus, der Unterstand mit der Krippe, dem Kind, Maria und Josef). Das Kind tippt einen Ort an: die Hirten laufen hin; am falschen Ort fehlt das Zeichen (Kreuz, sie gehen zurück), am richtigen bleiben sie.
 * Drei Runden mit anderer Reihenfolge der Orte. Bilder (Bildauftrag S33): `zeichen/strasse.webp` 1200 × 900, `haus1..4`, `leer`, `stall`, `hirten` (Bögen mit Magenta-Schnitt).
 */
const ZEICHEN: SignGame = {
  background: `${G}zeichen/strasse.webp`,
  places: [
    { id: 'haus1', image: `${G}zeichen/haus1.webp`, label: 'Ein Haus voller Reisender' },
    { id: 'haus2', image: `${G}zeichen/haus2.webp`, label: 'Ein Gasthaus voller Gäste' },
    { id: 'haus3', image: `${G}zeichen/haus3.webp`, label: 'Ein Haus mit Wäsche' },
    { id: 'haus4', image: `${G}zeichen/haus4.webp`, label: 'Ein Haus mit einem Karren' },
    { id: 'leer', image: `${G}zeichen/leer.webp`, label: 'Ein leeres Haus' },
    { id: 'stall', image: `${G}zeichen/stall.webp`, label: 'Der Unterstand mit der Krippe' }
  ],
  slots: [{ x: 26, y: 57, w: 26 }, { x: 55, y: 57, w: 26 }, { x: 84, y: 57, w: 26 }, { x: 26, y: 89, w: 26 }, { x: 55, y: 89, w: 26 }, { x: 84, y: 89, w: 26 }],
  walker: `${G}zeichen/hirten.webp`,
  walkerW: 16,
  start: { x: 8, y: 99 },
  rounds: [
    { hint: 'Der Engel hat gesagt: Ihr werdet das Kind finden, in Windeln gewickelt und in einer Krippe liegend. Suche das Zeichen. Tippe einen Ort an.', order: ['haus1', 'stall', 'haus2', 'leer', 'haus3', 'haus4'], right: 'stall' },
    { hint: 'Noch einmal: Wo liegt das Kind in der Krippe? Die Orte stehen jetzt anders.', order: ['leer', 'haus3', 'haus4', 'stall', 'haus1', 'haus2'], right: 'stall' },
    { hint: 'Zum dritten Mal: Finde den Ort mit dem Zeichen.', order: ['haus4', 'haus1', 'leer', 'haus2', 'haus3', 'stall'], right: 'stall' }
  ]
}

/**
 * Etappe 4, "Wimmelbild" (alte Mechanik): die volle Straße am Stadttor von Bethlehem im Hochformat (Bildauftrag S35); gesucht werden Josef, Maria und drei andere Reisende, einige stehen hinter Karren, Fels, Baum und Marktstand.
 * Bilder: `wimmel/szene.webp`, `reisende-1..5.webp` (aus einem Bogen geschnitten), `verdecker-1..4.webp` (aus einem Bogen geschnitten).
 */
const WIMMEL: FindGame = {
  labels: ['Josef', 'Alter Mann mit Wanderstab', 'Maria', 'Mädchen mit Korb', 'Händler mit Tonkrug'],
  doneText: 'Du hast alle fünf Reisenden gefunden: Josef, Maria, den Händler, den alten Mann und das Mädchen mit dem Korb!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/reisende-1.webp`, x: 22, y: 57, w: 12 },
    { image: `${G}wimmel/reisende-2.webp`, x: 62, y: 75, w: 12 },
    { image: `${G}wimmel/reisende-3.webp`, x: 84, y: 41, w: 12 },
    { image: `${G}wimmel/reisende-4.webp`, x: 40, y: 93, w: 12 },
    { image: `${G}wimmel/reisende-5.webp`, x: 14, y: 81, w: 12 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 22, y: 56, w: 20 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 62, y: 74, w: 24 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 84, y: 40, w: 20 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 40, y: 92, w: 22 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 14, y: 80, w: 18 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 70, y: 52, w: 18 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 50, y: 40, w: 14 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 90, y: 78, w: 20 }
  ]
}

export const weihnachten: Journey = {
  id: 'weihnachten',
  title: 'Weihnachten',
  subtitle: 'Die Geschichte von Jesu Geburt',
  age: '8-10',
  downloadMb: 15, // gemessen 13,2 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: die Krippe mit dem Kind (Konturzeichnung)
  gift: { title: 'Die Krippe', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus weihnachtenPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/weihnachten/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0706, y: 0.5825, d: 0.0339 },
      { x: 0.1463, y: 0.6244, d: 0.0339 },
      { x: 0.2963, y: 0.6462, d: 0.0339 },
      { x: 0.4445, y: 0.6371, d: 0.0339 },
      { x: 0.5185, y: 0.6462, d: 0.0339 },
      { x: 0.6019, y: 0.6462, d: 0.0339 },
      { x: 0.7278, y: 0.6353, d: 0.0339 },
      { x: 0.8112, y: 0.6462, d: 0.0339 },
      { x: 0.9000, y: 0.6353, d: 0.0339 }
    ],
    exam: { x: 0.9705, y: 0.6408, d: 0.0339 },
    path: WEIHNACHTEN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der Engel kommt zu Maria',
      ref: 'Lukas 1,26–38',
      text: [
        'In der Stadt Nazareth in Galiläa wohnt eine junge Frau. Sie heißt Maria und ist mit Josef verlobt, einem Mann aus dem Haus Davids. Eines Tages kommt der Engel Gabriel zu ihr. „Sei gegrüßt, du Begnadete!“, sagt er. „Der Herr ist mit dir.“',
        'Maria erschrickt und fragt sich, was dieser Gruß bedeuten soll. „Fürchte dich nicht, Maria“, sagt der Engel. „Du wirst einen Sohn bekommen, und du sollst ihn Jesus nennen. Er wird groß sein und ein Sohn des Höchsten genannt werden. Sein Reich wird kein Ende haben.“',
        '„Wie soll das geschehen? Ich habe doch keinen Mann“, fragt Maria. Der Engel antwortet: „Der Heilige Geist wird über dich kommen. Darum wird das Kind Gottes Sohn genannt werden. Bei Gott ist nichts unmöglich.“ Da sagt Maria: „Siehe, ich bin des Herrn Magd. Mir geschehe, wie du gesagt hast.“ Dann geht der Engel von ihr.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wie heißt der Engel, der zu Maria kommt?', options: ['Gabriel', 'Michael', 'Raphael'], answer: 0 },
        { q: 'Wie soll Maria ihren Sohn nennen?', options: ['Jesus', 'Johannes', 'David'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Maria besucht Elisabeth',
      ref: 'Lukas 1,39–56',
      text: [
        'Maria macht sich eilig auf den Weg. Der Engel hat ihr gesagt, dass auch Elisabeth einen Sohn erwartet, obwohl sie schon alt ist. Maria geht ins Bergland von Juda, zum Haus des Priesters Zacharias, und grüßt Elisabeth, seine Frau. Als Elisabeth Marias Gruß hört, hüpft das Kind in ihrem Leib.',
        'Elisabeth wird vom Heiligen Geist erfüllt und ruft laut: „Gesegnet bist du unter den Frauen! Woher kommt mir die Ehre, dass die Mutter meines Herrn zu mir kommt?“ Und sie sagt: „Selig bist du, die du geglaubt hast!“',
        'Da lobt Maria Gott: „Meine Seele erhebt den Herrn, und mein Geist freut sich Gottes, meines Heilandes. Er hat große Dinge an mir getan. Die Hungrigen füllt er mit Gütern.“ Drei Monate bleibt Maria bei Elisabeth. Dann kehrt sie wieder heim.'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Zu wem geht Maria ins Bergland?', options: ['zu Elisabeth', 'zu Hanna', 'zu Rut'], answer: 0 },
        { q: 'Was tut das Kind in Elisabeths Leib, als sie Marias Gruß hört?', options: ['Es hüpft.', 'Es schreit.', 'Es schläft.'], answer: 0 },
        { q: 'Wie lange bleibt Maria bei Elisabeth?', options: ['drei Monate', 'drei Tage', 'ein Jahr'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Josefs Traum',
      ref: 'Matthäus 1,18–24',
      text: [
        'Maria soll Josefs Frau werden. Da merkt Josef, dass sie ein Kind erwartet. Er ist ein frommer Mann und will sie nicht bloßstellen. Darum denkt er daran, sich heimlich von ihr zu trennen.',
        'Während er noch darüber nachdenkt, erscheint ihm im Traum ein Engel des Herrn. „Josef, du Sohn Davids“, sagt er, „fürchte dich nicht, Maria zu dir zu nehmen. Das Kind kommt vom Heiligen Geist. Sie wird einen Sohn bekommen, und du sollst ihn Jesus nennen. Denn er wird sein Volk retten von ihren Sünden.“',
        'Josef wacht auf und tut, was der Engel des Herrn ihm gesagt hat. Er nimmt Maria zu sich.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was will Josef zuerst tun?', options: ['sich heimlich von Maria trennen', 'sofort mit Maria fortziehen', 'Maria zu seinen Eltern schicken'], answer: 0 },
        { q: 'Wie soll das Kind heißen, sagt der Engel?', options: ['Jesus', 'Josef', 'David'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Auf nach Bethlehem',
      ref: 'Lukas 2,1–5',
      text: [
        'Kaiser Augustus befiehlt, dass alle Menschen in seinem Reich gezählt werden. Es ist die allererste Zählung, und in Syrien ist damals Quirinius Statthalter. Jeder soll in seine Heimatstadt gehen und sich dort aufschreiben lassen.',
        'Auch Josef macht sich auf den Weg. Er stammt aus dem Haus Davids, darum muss er nach Bethlehem, in die Stadt Davids. Von Nazareth in Galiläa geht es hinauf ins jüdische Land.',
        'Josef will sich zusammen mit Maria aufschreiben lassen. Maria, seine Verlobte, geht mit ihm. Sie erwartet ihr Kind. Auch viele andere sind unterwegs, denn jeder geht in seine Stadt.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde Josef, Maria und drei andere Reisende auf der vollen Straße nach Bethlehem.', count: 5, find: WIMMEL },
      questions: [
        { q: 'Wer befiehlt, dass alle gezählt werden?', options: ['Kaiser Augustus', 'König Herodes', 'Pilatus'], answer: 0 },
        { q: 'In welche Stadt geht Josef?', options: ['nach Bethlehem', 'nach Jericho', 'nach Jerusalem'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Kein Raum in der Herberge',
      ref: 'Lukas 2,6–7.21',
      text: [
        'Als Josef und Maria in Bethlehem sind, kommt für Maria die Zeit der Geburt. Sie bekommt ihren ersten Sohn. Sie wickelt ihn in Windeln und legt ihn in eine Krippe. Denn sie haben sonst keinen Raum in der Herberge.',
        'Eine Krippe ist ein Futtertrog für Tiere. Eine Herberge ist ein Ort, an dem Gäste übernachten. Josef ist bei Maria und bei dem Kind.',
        'Am achten Tag bekommt der Junge seinen Namen. Er heißt Jesus. So hat es der Engel gesagt, noch ehe Maria das Kind erwartete. Josef und Maria tun, was ihnen gesagt wurde.'
      ],
      // Spiel: Das Kind in die Krippe legen (krippe, neu)
      task: { kind: 'krippe', hint: 'Hilf Maria, das Kind zu wickeln und in die Krippe zu legen.', crib: KRIPPE },
      questions: [
        { q: 'Wohin legt Maria das Kind?', options: ['in eine Krippe', 'in ein Bett', 'in einen Korb'], answer: 0 },
        { q: 'Warum liegt das Kind in einer Krippe?', options: ['Es ist kein Raum in der Herberge.', 'Es gefällt dem Kind dort.', 'Der Kaiser hat es befohlen.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Die Hirten und der Engel',
      ref: 'Lukas 2,8–14',
      text: [
        'Nicht weit von Bethlehem sind Hirten auf dem Feld bei den Hürden, den Pferchen für die Schafe. Sie hüten in der Nacht ihre Herde. Da tritt ein Engel des Herrn zu ihnen, und der Glanz des Herrn leuchtet um sie her. Die Hirten fürchten sich sehr.',
        '„Fürchtet euch nicht!“, sagt der Engel. „Ich verkünde euch große Freude, die allem Volk widerfahren wird. Heute ist euch der Heiland geboren, Christus, der Herr, in der Stadt Davids. Daran erkennt ihr ihn: Ihr werdet das Kind finden, in Windeln gewickelt und in einer Krippe liegend.“',
        'Auf einmal ist bei dem Engel eine große Schar von Engeln aus dem Himmel. Sie loben Gott: „Ehre sei Gott in der Höhe und Friede auf Erden bei den Menschen seines Wohlgefallens!“'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Was tun die Hirten in der Nacht?', options: ['Sie hüten ihre Herde.', 'Sie schlafen im Haus.', 'Sie ernten das Korn.'], answer: 0 },
        { q: 'Woran sollen die Hirten das Kind erkennen?', options: ['in Windeln gewickelt, in einer Krippe', 'mit einer Krone, auf einem Thron', 'in einem Königsmantel, im Palast'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Die Hirten bei der Krippe',
      ref: 'Lukas 2,15–20',
      text: [
        'Als die Engel weg sind, sagen die Hirten zueinander: „Kommt, wir gehen nach Bethlehem und sehen, was geschehen ist. Der Herr hat es uns gesagt.“',
        'Sie eilen hin. Sie finden Maria und Josef und das Kind, das in der Krippe liegt. Sie erzählen überall, was ihnen über dieses Kind gesagt worden ist. Alle, die es hören, wundern sich über das, was die Hirten sagen.',
        'Maria aber behält alle diese Worte und bewegt sie in ihrem Herzen. Die Hirten kehren um. Sie loben und preisen Gott für alles, was sie gehört und gesehen haben, so wie es ihnen gesagt worden war.'
      ],
      // Spiel: Das Zeichen finden (zeichen, neu)
      task: { kind: 'zeichen', hint: 'Finde den Ort mit dem Zeichen: das Kind in Windeln, in einer Krippe.', sign: ZEICHEN },
      questions: [
        { q: 'Was tun die Hirten, als die Engel weg sind?', options: ['Sie gehen nach Bethlehem.', 'Sie bleiben bei ihrer Herde.', 'Sie ziehen nach Jerusalem.'], answer: 0 },
        { q: 'Was behält Maria?', options: ['alle diese Worte in ihrem Herzen', 'ein Stück Wolle', 'die Windeln des Kindes'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Die Weisen und der Stern',
      ref: 'Matthäus 2,1–12',
      text: [
        'Zur Zeit des Königs Herodes kommen Weise aus dem Morgenland nach Jerusalem. „Wo ist der neugeborene König der Juden?“, fragen sie. „Wir haben seinen Stern gesehen und wollen ihn anbeten.“',
        'Herodes erschrickt. Er fragt die Hohenpriester und Schriftgelehrten, wo der Christus geboren werden soll. „In Bethlehem“, sagen sie. Da schickt Herodes die Weisen heimlich dorthin: „Wenn ihr das Kind findet, sagt es mir.“',
        'Der Stern, den die Weisen im Morgenland gesehen haben, geht vor ihnen her. Er bleibt über dem Haus stehen, wo das Kind ist. Sie finden es mit Maria, seiner Mutter. Sie fallen nieder und beten es an. Sie schenken ihm Gold, Weihrauch und Myrrhe. Gott sagt ihnen im Traum, dass sie nicht zu Herodes zurückgehen sollen. Auf einem anderen Weg ziehen sie heim.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Stern über Bethlehem zusammen.', puzzle: { image: `${G}puzzle/stern.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was haben die Weisen im Morgenland gesehen?', options: ['einen Stern', 'eine Wolke', 'eine Feuersäule'], answer: 0 },
        { q: 'Was schenken die Weisen dem Kind?', options: ['Gold, Weihrauch und Myrrhe', 'Brot, Wein und Öl', 'Wolle, Honig und Feigen'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Nach Ägypten und wieder heim',
      ref: 'Matthäus 2,13–15.19–23',
      text: [
        'Nachdem die Weisen weg sind, erscheint dem Josef im Traum ein Engel des Herrn. „Steh auf“, sagt er, „nimm das Kind und seine Mutter und flieh nach Ägypten. Bleib dort, bis ich es dir sage. Denn Herodes will das Kind suchen, um ihm etwas Böses zu tun.“',
        'Josef steht auf. Bei Nacht nimmt er das Kind und Maria und zieht nach Ägypten. Dort bleiben sie, bis Herodes gestorben ist.',
        'Dann erscheint der Engel dem Josef noch einmal im Traum. „Steh auf und zieh zurück in das Land Israel“, sagt er. Josef kommt mit dem Kind und Maria zurück. Doch in Judäa ist jetzt ein Sohn des Herodes König, und davor fürchtet sich Josef. Da sagt Gott ihm im Traum, wohin er gehen soll. So zieht er nach Galiläa. Dort wohnen sie in der Stadt Nazareth.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin flieht Josef mit Maria und dem Kind?', options: ['nach Ägypten', 'nach Babel', 'nach Rom'], answer: 0 },
        { q: 'Wie erfährt Josef, was er tun soll?', options: ['Ein Engel spricht im Traum zu ihm.', 'Ein Brief kommt zu ihm.', 'Die Weisen sagen es ihm.'], answer: 0 },
        { q: 'Wo wohnen sie am Ende?', options: ['in Nazareth', 'in Jerusalem', 'in Bethlehem'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißt der Engel, der zu Maria kommt?', options: ['Gabriel', 'Michael', 'Raphael'], answer: 0 },
    { q: 'Wie lange bleibt Maria bei Elisabeth?', options: ['drei Monate', 'drei Tage', 'ein Jahr'], answer: 0 },
    { q: 'In welche Stadt gehen Josef und Maria zur Zählung?', options: ['nach Bethlehem', 'nach Jericho', 'nach Jerusalem'], answer: 0 },
    { q: 'Wohin legt Maria das Kind?', options: ['in eine Krippe', 'in ein Bett', 'in einen Korb'], answer: 0 },
    { q: 'Was rufen die Engel, als sie Gott loben?', options: ['Ehre sei Gott in der Höhe', 'Kommt alle in den Tempel', 'Geht schnell nach Hause'], answer: 0 },
    { q: 'Was schenken die Weisen dem Kind?', options: ['Gold, Weihrauch und Myrrhe', 'Brot, Wein und Öl', 'Wolle, Honig und Feigen'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of weihnachten.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of weihnachten.stages) {
  const file = `audio/abenteuer/weihnachten/geschichte-${String(s.id).padStart(2, '0')}-${s.id === 1 ? 'v2' : 'v1'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (Nazareth, the shepherds in the field, the star); they follow one another at random
weihnachten.music = [
  'audio/abenteuer/weihnachten/musik-nazareth-v2.mp3',
  'audio/abenteuer/weihnachten/musik-hirten-v2.mp3',
  'audio/abenteuer/weihnachten/musik-stern-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(weihnachten, weihnachtenEn)
