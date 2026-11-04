/**
 * Abenteuer "Zachäus und Lazarus" (Lukas 19,1-10 und Johannes 11,1-45) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Jesus kehrt ein und ruft den Freund heraus". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 4.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Zachaeus/ENTWURF_Zachaeus.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend): 1 Wimmelbild (alt), 2 Auf den Baum (neu, klettern), 3 Lückenvers (alt), 4 Die Hälfte den Armen (neu, halbieren),
 * 5 Reihenfolge (alt), 6 nur Quiz, 7 Puzzle (alt), 8 nur Quiz, 9 Löst ihn auf (neu, loesen).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/zachaeus/, images/abenteuer/spiele/zachaeus/<spiel>/, audio/abenteuer/zachaeus/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Zachaeus/tools/bauen_zachaeus.py: nicht von Hand ändern.
 */
import type { ClimbGame, FindGame, HalveGame, Journey, OrderGame, UnwrapGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { ZACHAEUS_PATH } from './zachaeusPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { zachaeusEn } from './en/zachaeus.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/zachaeus/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/zachaeus/'

const G = 'images/abenteuer/spiele/zachaeus/'

/**
 * Etappe 3, "Lückenvers" (alte Mechanik): der Ruf Jesu an Zachäus aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 25 (kopiert). Hintergrund: ein Maulbeerzweig mit Blättern und Feigen (Bildauftrag). Die Sätze stehen wörtlich im Etappentext (das Bauskript prüft es).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Zachäus“, sagt er, „steig schnell ', '!“'], words: ['herunter', 'hinauf', 'weiter'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Denn ich muss heute in deinem ', ' ', '.“'], words: ['Haus', 'einkehren', 'Garten', 'schlafen'], answers: [0, 1] }
  ]
}

/**
 * Etappe 5, "Der Freund ist krank" (alte Mechanik, Reihenfolge legen): Lazarus liegt krank, der Bote läuft zu Jesus, Jesus wartet mit den Jüngern, Jesus bricht nach Bethanien auf.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (3:2).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'krank', image: `${G}reihenfolge/karte-1.webp`, label: 'Lazarus liegt krank im Haus, Maria und Marta sind bei ihm' },
    { id: 'bote', image: `${G}reihenfolge/karte-2.webp`, label: 'Ein Bote läuft die Straße entlang zu Jesus' },
    { id: 'warten', image: `${G}reihenfolge/karte-3.webp`, label: 'Jesus bleibt mit den Jüngern noch dort, wo er ist' },
    { id: 'aufbruch', image: `${G}reihenfolge/karte-4.webp`, label: 'Jesus geht mit den Jüngern nach Bethanien' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['bote', 'warten', 'aufbruch'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang im Haus in Bethanien und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['krank', 'bote', 'warten', 'aufbruch'] }
  ]
}

/**
 * Etappe 2, "Auf den Baum" (neu, `klettern`, Lk 19,4): der Maulbeerbaum im Hochformat, auf jeder Höhe zwei Äste zur Wahl (der starke grüne trägt, der dünne trockene knackt und wackelt,
 * Zachäus hält sich fest und bleibt, kein Sturz); oben der Blick auf die Straße. Runde 1 drei Höhen, Runde 2 vier. Bilder (Bildauftrag): `klettern/baum.webp` (3:4), `ast-stark`, `ast-schwach`, `zachaeus`, `ausblick.webp` (3:2).
 */
const KLETTERN: ClimbGame = {
  tree: `${G}klettern/baum.webp`,
  view: `${G}klettern/ausblick.webp`,
  climber: { image: `${G}klettern/zachaeus.webp`, label: 'Zachäus am Stamm', w: 21 },
  strong: { image: `${G}klettern/ast-stark.webp`, label: 'Ein dicker, grüner Ast mit Blättern', w: 48 },
  weak: { image: `${G}klettern/ast-schwach.webp`, label: 'Ein dünner, trockener Ast mit einem Knick', w: 48 },
  trunk: 50,
  branches: [29, 71],
  start: 94,
  rounds: [
    { hint: 'Klettere nach oben. Wähle immer den starken Ast.', levels: [{ strong: 'r', y: 70 }, { strong: 'l', y: 46 }, { strong: 'r', y: 22 }] },
    { hint: 'Jetzt ist der Baum höher. Wähle wieder den starken Ast.', levels: [{ strong: 'l', y: 74 }, { strong: 'l', y: 56 }, { strong: 'r', y: 38 }, { strong: 'l', y: 20 }] }
  ]
}

/**
 * Etappe 4, "Die Hälfte den Armen" (neu, `halbieren`, Lk 19,8): eine Reihe gleich großer Silbermünzen auf dem Tuch des Steintischs; der Teiler wird gezogen (oder mit den Pfeilknöpfen geschoben)
 * und rastet zwischen zwei Münzen ein, links liegt der Teil für Zachäus, rechts der für die Armen (golden getönt). "Fertig" prüft: genau die Mitte rollt die Münzen in die Schalen,
 * sonst zeigt ein Pfeil, wohin der Teiler muss. Runde 1 zehn Münzen, Runde 2 vierzehn (einige leicht versetzt). Bilder (Bildauftrag): `halbieren/tisch.webp`, `muenze`, `teiler`,
 * `schale-zachaeus`, `schale-arme`, `arme`.
 */
const HALBIEREN: HalveGame = {
  table: `${G}halbieren/tisch.webp`,
  coin: { image: `${G}halbieren/muenze.webp`, label: 'Eine Silbermünze', w: 5 },
  divider: { image: `${G}halbieren/teiler.webp`, label: 'Der hölzerne Teiler', w: 5 },
  bowlSelf: { image: `${G}halbieren/schale-zachaeus.webp`, label: 'Die Schale für Zachäus', x: 24, y: 90, w: 20 },
  bowlPoor: { image: `${G}halbieren/schale-arme.webp`, label: 'Die Schale für die Armen', x: 66, y: 90, w: 20 },
  poor: { image: `${G}halbieren/arme.webp`, label: 'Eine Frau mit Kind und ein alter Mann', x: 90, y: 96, w: 16 },
  row: { y: 50, from: 12, to: 88 },
  rounds: [
    { hint: 'Teile die Münzen genau in der Mitte. Die Hälfte ist für die Armen.', coins: 10, start: 2 },
    { hint: 'Jetzt sind es mehr Münzen. Teile wieder genau in der Mitte.', coins: 14, start: 11, offsets: [0, 0, -3, 0, 2, 0, 0, -2, 0, 0, 3, 0, 0, -2] }
  ]
}

/**
 * Etappe 9, "Löst ihn auf" (neu, `loesen`, Joh 11,44): Lazarus steht am Eingang der Höhle im Morgenlicht; über ihm liegen fünf Leinenstreifen (Hände, Füße, Körper, Arme, Kopf), jeder mit einem losen Ende.
 * Am Ende ziehen (oder es dreimal antippen) wickelt den Streifen ab, er fällt zu Boden; das Kopftuch geht erst, wenn zwei andere ab sind. Am Ende hebt Lazarus die Hand, und Maria läuft herbei.
 * Kein Fehler möglich. Bilder (Bildauftrag): `loesen/szene.webp`, `lazarus`, `lazarus-frei`, `streifen-1..5`, `maria`.
 */
const LOESEN: UnwrapGame = {
  scene: `${G}loesen/szene.webp`,
  lazarus: { image: `${G}loesen/lazarus.webp`, label: 'Lazarus am Eingang der Höhle', x: 52, y: 96, w: 26 },
  free: { image: `${G}loesen/lazarus-frei.webp`, label: 'Lazarus, frei, mit erhobener Hand', w: 26 },
  maria: { image: `${G}loesen/maria.webp`, label: 'Maria läuft mit offenen Armen herbei', x: 26, y: 96, w: 22, from: -14 },
  hint: 'Ziehe an den Tüchern, bis Lazarus frei ist.',
  strips: [
    { id: 1, image: `${G}loesen/streifen-1.webp`, label: 'Das Tuch an den Händen', x: 43, y: 66, w: 11, end: [37, 73], dir: [-1, 0.3] },
    { id: 2, image: `${G}loesen/streifen-2.webp`, label: 'Das Tuch an den Füßen', x: 52, y: 90, w: 12, end: [60, 94], dir: [1, 0.3] },
    { id: 3, image: `${G}loesen/streifen-3.webp`, label: 'Das Tuch um den Körper', x: 52, y: 68, w: 16, end: [62, 77], dir: [1, 0.3] },
    { id: 4, image: `${G}loesen/streifen-4.webp`, label: 'Das Tuch um die Arme', x: 52, y: 58, w: 20, end: [64, 63], dir: [1, 0.1] },
    { id: 5, image: `${G}loesen/streifen-5.webp`, label: 'Das Tuch am Kopf', x: 52, y: 38, w: 18, end: [63, 32], dir: [1, -0.6], needs: 2 }
  ]
}

/**
 * Etappe 1, "Wimmelbild" (alte Mechanik): die Straße in Jericho mit Palmen, Marktständen und Körben (Hochformat 3:4, Bildauftrag); gesucht werden vier aus Lukas 19,1-3:
 * Zachäus (klein, mit Geldbeutel), Jesus, ein Kind auf den Schultern eines Mannes und ein beladener Esel. Einige stehen hinter einem Marktstand, einer Palme, einem Korbstapel und einem Tonkrug.
 * Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Zachäus, klein, mit Geldbeutel', 'Jesus', 'Das Kind auf den Schultern', 'Der beladene Esel'],
  doneText: 'Du hast alle gefunden: Zachäus, Jesus, das Kind auf den Schultern und den Esel.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 22, y: 76, w: 11 },
    { image: `${G}wimmel/figur-2.webp`, x: 60, y: 56, w: 9 },
    { image: `${G}wimmel/figur-3.webp`, x: 86, y: 84, w: 12 },
    { image: `${G}wimmel/figur-4.webp`, x: 44, y: 80, w: 13 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 18, y: 95, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 60, y: 57, w: 11 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 44, y: 82, w: 13 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 22, y: 78, w: 13 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 87, y: 85, w: 20 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 76, y: 62, w: 10 }
  ]
}

export const zachaeus: Journey = {
  id: 'zachaeus',
  title: 'Zachäus und Lazarus',
  subtitle: 'Jesus kehrt ein und ruft den Freund heraus',
  age: '8-10',
  downloadMb: 16, // wird nach dem Bau gemessen (Bilder, Karte, Spielbilder, Musik, Aufnahmen), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v3.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: der Maulbeerbaum mit breiten Ästen, Feigen und Vögeln (Konturzeichnung)
  gift: { title: 'Der Maulbeerbaum', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): von Jericho durch die Wüste Judäas hinauf nach Bethanien, mit Stationen und Perlenweg aus zachaeusPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/zachaeus/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0766, y: 0.6735, d: 0.0339 },
      { x: 0.1462, y: 0.3398, d: 0.0339 },
      { x: 0.1966, y: 0.7464, d: 0.0339 },
      { x: 0.3075, y: 0.7160, d: 0.0339 },
      { x: 0.4516, y: 0.6978, d: 0.0339 },
      { x: 0.6472, y: 0.5461, d: 0.0339 },
      { x: 0.7006, y: 0.3762, d: 0.0339 },
      { x: 0.7843, y: 0.3337, d: 0.0339 },
      { x: 0.8720, y: 0.3701, d: 0.0339 }
    ],
    exam: { x: 0.9728, y: 0.5340, d: 0.0339 },
    path: ZACHAEUS_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der kleine Zachäus',
      ref: 'Lukas 19,1–3',
      text: [
        'Jesus kommt nach Jericho und geht durch die Stadt. Überall laufen die Leute zusammen, denn alle wollen ihn sehen.',
        'In Jericho wohnt ein Mann, der Zachäus heißt. Er ist ein Oberster der Zöllner, also ein Chef über andere Zöllner, und er ist reich. Auch er möchte unbedingt wissen, wer dieser Jesus ist.',
        'Aber Zachäus ist klein. Die Menge schiebt sich die Straße entlang, und vor ihm stehen nur Rücken und Schultern. So sehr er sich auch streckt, er kann Jesus nicht sehen.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde Zachäus in der Menge, und dazu Jesus, das Kind und den Esel.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Was ist Zachäus von Beruf?', options: ['Er ist ein Oberster der Zöllner.', 'Er ist Hirte.', 'Er ist Fischer.'], answer: 0 },
        { q: 'Warum sieht Zachäus Jesus nicht?', options: ['Er ist klein, und die Menge ist im Weg.', 'Er hat die Augen zu.', 'Jesus ist schon fort.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Auf den Baum',
      ref: 'Lukas 19,4',
      text: [
        'Zachäus hat eine Idee. Er rennt der Menge voraus, denn er weiß, an welcher Stelle Jesus vorbeikommen wird.',
        'Dort steht ein Maulbeerbaum mit breiten Ästen. Zachäus klettert hinauf, von Ast zu Ast, bis er über allen Köpfen sitzt, denn von dort oben will er Jesus sehen. Der reiche, wichtige Mann hält sich am Stamm fest und schaut die Straße hinunter.',
        'Unten drängen sich die Leute heran, und niemand schaut nach oben. Zachäus wartet zwischen den Blättern, ganz still. Gleich muss Jesus kommen.'
      ],
      // Spiel: Auf den Baum (klettern, neu)
      task: { kind: 'klettern', hint: 'Steige von Ast zu Ast. Wähle immer den starken Ast.', climb: KLETTERN },
      questions: [
        { q: 'Wohin klettert Zachäus?', options: ['auf einen Maulbeerbaum', 'auf ein Dach', 'auf einen Felsen'], answer: 0 },
        { q: 'Warum klettert er hinauf?', options: ['Er will Jesus sehen.', 'Er will sich verstecken.', 'Er will Früchte pflücken.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Steig eilend herunter',
      ref: 'Lukas 19,5–7',
      text: [
        'Jesus kommt an die Stelle. Er bleibt stehen und schaut hinauf in den Baum. „Zachäus“, sagt er, „steig schnell herunter! Denn ich muss heute in deinem Haus einkehren.“',
        'Es wird still um den Baum, und alle Augen gehen nach oben. Zachäus klettert eilig hinunter. Er nimmt Jesus mit großer Freude bei sich auf.',
        'Die Leute in der Menge aber murren. „Bei einem Sünder kehrt er ein!“, sagen sie. Jesus geht mit Zachäus in sein Haus.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Was sagt Jesus zu Zachäus?', options: ['Steig schnell herunter, ich muss heute in deinem Haus einkehren.', 'Geh nach Hause.', 'Bleib auf dem Baum.'], answer: 0 },
        { q: 'Wie nimmt Zachäus Jesus auf?', options: ['mit Freude', 'mit Angst', 'gar nicht'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Heute ist Heil geschehen',
      ref: 'Lukas 19,8–10',
      text: [
        'Zachäus aber tritt vor Jesus hin. Der Mann, der eben noch auf dem Baum saß, steht jetzt aufrecht vor ihm. „Herr“, sagt er, „die Hälfte von allem, was ich habe, gebe ich den Armen. Und wenn ich jemanden betrogen habe, gebe ich ihm das Vierfache zurück.“',
        'Jesus antwortet ihm: „Heute ist diesem Haus Heil widerfahren, denn auch er ist ein Sohn Abrahams.“',
        'Dann sagt Jesus zu allen, die zuhören: „Der Menschensohn ist gekommen, um zu suchen und zu retten, was verloren ist.“'
      ],
      // Spiel: Die Hälfte den Armen (halbieren, neu)
      task: { kind: 'halbieren', hint: 'Teile die Münzen genau in der Mitte.', halve: HALBIEREN },
      questions: [
        { q: 'Was will Zachäus den Armen geben?', options: ['die Hälfte von allem, was er hat', 'nichts', 'nur eine Münze'], answer: 0 },
        { q: 'Wie viel gibt er zurück, wenn er jemanden betrogen hat?', options: ['das Vierfache', 'nichts', 'die Hälfte'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Der Freund ist krank',
      ref: 'Johannes 11,1–6.11–15',
      text: [
        'In Bethanien, einem Dorf bei Jerusalem, wohnen Maria und Marta mit ihrem Bruder Lazarus. Lazarus ist krank. Die Schwestern schicken einen Boten zu Jesus. „Herr, der, den du lieb hast, ist krank“, lassen sie ihm sagen.',
        'Jesus hat Marta, Maria und Lazarus lieb. Als er die Nachricht hört, bleibt er noch zwei Tage dort, wo er ist.',
        'Dann sagt er zu seinen Jüngern: „Lazarus, unser Freund, schläft. Ich gehe hin, um ihn aufzuwecken.“ Die Jünger meinen, er spricht vom Schlaf. Da sagt Jesus es offen: „Lazarus ist gestorben. Lasst uns zu ihm gehen.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Bringe die vier Bilder in die richtige Reihenfolge.', order: REIHENFOLGE },
      questions: [
        { q: 'Wo wohnen Maria, Marta und Lazarus?', options: ['in Bethanien', 'in Jericho', 'in Nazareth'], answer: 0 },
        { q: 'Was lassen die Schwestern Jesus sagen?', options: ['Der, den du lieb hast, ist krank.', 'Komm sofort zum Fest.', 'Wir brauchen ein Boot.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Ich bin die Auferstehung',
      ref: 'Johannes 11,17–27',
      text: [
        'Als Jesus nach Bethanien kommt, liegt Lazarus schon vier Tage im Grab. Viele Menschen sind zu Marta und Maria gekommen, um sie zu trösten.',
        'Marta hört, dass Jesus kommt, und geht ihm entgegen. Maria bleibt im Haus. „Herr, wärst du hier gewesen, dann wäre mein Bruder nicht gestorben“, sagt Marta. „Aber ich weiß: Was du von Gott bittest, das gibt Gott dir.“',
        '„Dein Bruder wird auferstehen“, sagt Jesus. „Ich weiß“, sagt Marta, „am Jüngsten Tag wird er auferstehen.“',
        '„Ich bin die Auferstehung und das Leben“, sagt Jesus. „Wer an mich glaubt, der wird leben, auch wenn er stirbt. Glaubst du das?“ „Ja, Herr“, antwortet Marta. „Ich glaube, dass du der Christus bist, der Sohn Gottes.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie lange liegt Lazarus schon im Grab, als Jesus kommt?', options: ['vier Tage', 'einen Tag', 'zwei Tage'], answer: 0 },
        { q: 'Wer geht Jesus zuerst entgegen?', options: ['Marta', 'Maria', 'Thomas'], answer: 0 },
        { q: 'Was sagt Jesus über sich?', options: ['Ich bin die Auferstehung und das Leben.', 'Ich bin ein Fischer.', 'Ich bin der König von Jericho.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Jesus weint',
      ref: 'Johannes 11,28–37',
      text: [
        'Marta geht zurück und ruft ihre Schwester leise zur Seite. „Der Meister ist da und ruft dich.“ Maria steht schnell auf und geht zu ihm. Die Trauergäste im Haus folgen ihr.',
        'Als Maria zu Jesus kommt, fällt sie ihm zu Füßen. „Herr, wärst du hier gewesen, dann wäre mein Bruder nicht gestorben“, sagt sie. Sie weint, und die Menschen um sie herum weinen auch. Jesus ist tief bewegt und betrübt.',
        '„Wo habt ihr ihn hingelegt?“, fragt er. „Herr, komm und sieh es!“, antworten sie. Da kommen Jesus die Tränen. „Seht, wie lieb er ihn gehabt hat!“, sagen die Leute.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild von Bethanien zusammen.', puzzle: { image: `${G}puzzle/strasse.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wohin fällt Maria, als sie Jesus sieht?', options: ['ihm zu Füßen', 'auf die Straße', 'in den Garten'], answer: 0 },
        { q: 'Was kommt Jesus, als sie ihm den Weg zum Grab zeigen wollen?', options: ['die Tränen', 'Er lacht.', 'Er geht fort.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Hebt den Stein ab',
      ref: 'Johannes 11,38–42',
      text: [
        'Jesus kommt zum Grab. Es ist eine Höhle im Felsen, und ein Stein liegt davor. „Hebt den Stein ab!“, sagt Jesus.',
        'Marta sagt: „Herr, er liegt schon vier Tage dort.“ Jesus antwortet ihr: „Habe ich dir nicht gesagt: Wenn du glaubst, wirst du die Herrlichkeit Gottes sehen?“',
        'Da heben die Männer den Stein ab. Jesus blickt zum Himmel auf. „Vater, ich danke dir, dass du mich gehört hast. Ich weiß, dass du mich immer hörst. Aber wegen der Menschen, die hier stehen, sage ich es: Sie sollen glauben, dass du mich gesandt hast.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was liegt vor dem Grab?', options: ['ein Stein', 'ein Teppich', 'ein Baum'], answer: 0 },
        { q: 'Was sagt Jesus zu den Männern?', options: ['Hebt den Stein ab!', 'Lasst das Grab zu.', 'Geht nach Hause.'], answer: 0 },
        { q: 'Wohin blickt Jesus, als er betet?', options: ['zum Himmel', 'auf den Boden', 'zu den Bergen'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Lazarus, komm heraus',
      ref: 'Johannes 11,43–45',
      text: [
        'Jesus ruft mit lauter Stimme: „Lazarus, komm heraus!“',
        'Da kommt der Verstorbene aus der Höhle. Seine Füße und Hände sind mit Grabtüchern umwickelt, und sein Gesicht ist mit einem Tuch verhüllt. Alle stehen still und schauen, und keiner sagt ein Wort.',
        'Jesus sagt zu den Menschen: „Löst ihn auf und lasst ihn gehen!“',
        'Viele von denen, die zu Maria gekommen sind und gesehen haben, was Jesus getan hat, glauben an ihn.'
      ],
      // Spiel: Löst ihn auf (loesen, neu)
      task: { kind: 'loesen', hint: 'Wickle die Grabtücher ab.', unwrap: LOESEN },
      questions: [
        { q: 'Was ruft Jesus mit lauter Stimme?', options: ['Lazarus, komm heraus!', 'Geht nach Hause!', 'Schließt das Grab!'], answer: 0 },
        { q: 'Was sagt Jesus zu den Menschen?', options: ['Löst ihn auf und lasst ihn gehen!', 'Lauft weg!', 'Holt den Stein zurück!'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Warum klettert Zachäus auf den Baum?', options: ['Er will Jesus sehen.', 'Er will Feigen essen.', 'Er will sich verstecken.'], answer: 0 },
    { q: 'Was sagt Jesus zu Zachäus?', options: ['Steig schnell herunter, ich muss heute in deinem Haus einkehren.', 'Geh nach Hause.', 'Bleib dort oben.'], answer: 0 },
    { q: 'Was will Zachäus den Armen geben?', options: ['die Hälfte von allem, was er hat', 'nichts', 'nur eine Münze'], answer: 0 },
    { q: 'Wo wohnen Maria, Marta und Lazarus?', options: ['in Bethanien', 'in Jericho', 'in Nazareth'], answer: 0 },
    { q: 'Was sagt Jesus zu Marta über sich?', options: ['Ich bin die Auferstehung und das Leben.', 'Ich bin ein Fischer.', 'Ich bin ein Zöllner.'], answer: 0 },
    { q: 'Was ruft Jesus vor dem Grab?', options: ['Lazarus, komm heraus!', 'Geht nach Hause!', 'Schließt das Grab!'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of zachaeus.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([4, 5, 6, 7, 8, 9])
for (const s of zachaeus.stages) {
  const file = `audio/abenteuer/zachaeus/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the road to Jericho, the house in Bethany, at the grave in the morning light); they follow one another at random
zachaeus.music = [
  'audio/abenteuer/zachaeus/musik-jericho-v1.mp3',
  'audio/abenteuer/zachaeus/musik-bethanien-v1.mp3',
  'audio/abenteuer/zachaeus/musik-morgen-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(zachaeus, zachaeusEn)
