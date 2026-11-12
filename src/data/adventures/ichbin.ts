/**
 * Abenteuer "Jesus erzählt von sich" (Johannes 3, 4 und 10 mit Matthäus 16,13–20 und 17,1–13; id `ichbin`) für 8 bis 10 Jahre: 14 Etappen, Untertitel "Was Jesus über sich sagt". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Jesus kommt mit Gesicht vor (immer dasselbe Gesicht); nur Gott der Vater ist nie im Bild, seine Stimme (Mt 17,5) und seine Hand (Joh 10,29) stehen nur im Text. Kein Wolf und kein Dieb im Bild, kein Kreuz, kein Blut,
 * keine Steine in Händen. Die Texte stehen so da, wie der Entwurf sie hat (Luther 1912, kindgerecht umgeschrieben, keine Stelle weggelassen).
 * Quelle der Texte: D:/Claude/Abenteuer-IchBin/ENTWURF_IchBin.md, Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander; ernste Etappen nur Fragen): 2 Woher weht der Wind? (wehen, neu), 3 Lückenvers (bekannt, Merkvers Joh 3,16),
 * 7 Von Haus zu Haus (weitersagen, bekannt), 12 Der Ruf des Hirten (hirtenruf, neu); alle anderen Etappen nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/ichbin/, images/abenteuer/spiele/ichbin/<spiel>/, audio/abenteuer/ichbin/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-IchBin/tools/bauen_ichbin.py: nicht von Hand ändern.
 */
import type { Journey, VerseGame } from '@/types/adventure'
import type { TellGame } from '@/utils/weihnachtenNeu'
import type { BreezeGame, HerdCallGame } from '@/utils/ichbinNeu'
import { josef } from './josef'
import { ICHBIN_PATH } from './ichbinPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { ichbinEn } from './en/ichbin.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/ichbin/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/ichbin/'

const G = 'images/abenteuer/spiele/ichbin/'

/** Texte des Spiels "Von Haus zu Haus", die statt der Texte von Weihnachten gelten (Feld `texts` von `TellGame`, siehe ANMELDUNG.md Punkt 10). */
type TellTexts = { field?: string; walkers?: string; keys?: string; helpUndo?: string; done?: string }

/**
 * Etappe 2, "Woher weht der Wind?" (neu, `wehen`, Joh 3,8): ein Hof bei Nacht; der Wind wird nie gezeigt, nur was er bewegt (Flamme, Tuch, Zweig, Gras, Blatt); das Kind tippt unten die Tafel
 * "links", "still" oder "rechts". Runde 1: vier Böen (Ende rechts, links, links, rechts), Runde 2: fünf Böen, in dreien dreht der Wind in der Mitte (es zählt das Ende), eine ist ganz still.
 * Lagen (Ankerpunkte in Prozent des Bildes) VORLÄUFIG, am gemalten Bild nachmessen. Bilder (`spiele/ichbin/wehen/`): `hof`, `flamme-still|links|rechts`, `tuch-still|links|rechts`, `zweig`, `gras`, `blatt`,
 * `tafel-links|still|rechts`.
 */
const WEHEN: BreezeGame = {
  background: `${G}wehen/hof.webp`,
  ratio: 1.5,
  things: [
    { id: 'flamme', kind: 'flame', label: 'die Flamme der Lampe', x: 74.5, y: 60, w: 10, ratio: 0.667, image: `${G}wehen/flamme-still.webp`, images: { left: `${G}wehen/flamme-links.webp`, right: `${G}wehen/flamme-rechts.webp` } },
    { id: 'tuch', kind: 'cloth', label: 'ein Tuch an der Leine', x: 50, y: 33.5, w: 34, ratio: 1.231, image: `${G}wehen/tuch-still.webp`, images: { left: `${G}wehen/tuch-links.webp`, right: `${G}wehen/tuch-rechts.webp` } },
    { id: 'zweig', kind: 'twig', label: 'ein Olivenzweig', x: 76, y: 30, w: 20, ratio: 1.2, image: `${G}wehen/zweig.webp` },
    { id: 'gras', kind: 'grass', label: 'Gras', x: 30, y: 99, w: 22, ratio: 1.231, image: `${G}wehen/gras.webp` },
    { id: 'blatt', kind: 'leaf', label: 'ein Blatt', x: 36, y: 57, w: 6, ratio: 1, image: `${G}wehen/blatt.webp` }
  ],
  tablets: { left: `${G}wehen/tafel-links.webp`, still: `${G}wehen/tafel-still.webp`, right: `${G}wehen/tafel-rechts.webp` },
  tabletW: 24,
  rounds: [
    { hint: 'Du siehst den Wind nicht. Schau, was er bewegt, und tippe, wohin er weht.', ask: 'blown', gusts: [{ dir: 'right', ms: 2500 }, { dir: 'left', ms: 2500 }, { dir: 'left', ms: 2500 }, { dir: 'right', ms: 2500 }] },
    { hint: 'Der Wind dreht sich. Tippe, wohin er zuletzt weht, oder auf die Ruhe.', ask: 'now', gusts: [{ dir: 'left', turnTo: 'right', ms: 2600 }, { dir: 'left', ms: 2500 }, { dir: 'right', turnTo: 'left', ms: 2600 }, { dir: 'calm', ms: 2500 }, { dir: 'left', turnTo: 'right', ms: 2600 }] }
  ]
}

/**
 * Etappe 3, "Lückenvers" (bekannt 1, Joh 3,16, der Merkvers): der Vers steht im Wortlaut von Luther 1912 (der Etappentext sagt "einzigen Sohn", der Vers "eingeborenen Sohn": im Prüfbericht als D vermerkt).
 * Tafel und Blatt wie in allen Abenteuern (aus `spiele/pfingsten/lueckenvers/` kopiert), Hintergrund `hintergrund/vers-hintergrund` (Nachthimmel mit Sternen über den Dächern von Jerusalem).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Setze das fehlende Wort in den Vers.', parts: ['Also hat Gott die ', ' geliebt, dass er seinen eingeborenen Sohn gab.'], words: ['Welt', 'Nacht', 'Stadt'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Also hat Gott die Welt geliebt, dass er seinen eingeborenen ', ' gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige ', ' haben.'], words: ['Sohn', 'Leben', 'Knecht', 'Brot'], answers: [0, 1] }
  ]
}

/**
 * Etappe 7, "Von Haus zu Haus" (bekannt 2, `weitersagen`, Joh 4,28–30): das Dorf Sichar von oben (4:3, ein leerer Platz); die Frau geht vom Brunnen (ihr Krug steht daneben, Joh 4,28) von Haus zu Haus,
 * die Wege dürfen sich nicht kreuzen. Runde 1: drei Häuser, Runde 2: fünf Häuser, in denen man stecken bleiben kann. Die Namen der Häuser (Töpfer, Weber, Bäcker …) dienen nur der Beschriftung zum Vorlesen,
 * die Bibel nennt keine. `texts` ersetzt die Texte des Spiels, die sonst von Weihnachten sind (Hirten, Bethlehem, Lk 2,17); das Feld braucht den Eintrag in `TellGame` (ANMELDUNG.md Punkt 10).
 * Bilder (`spiele/ichbin/weitersagen/`): `dorf` (1200 × 900), `pfad`, `frau` (ohne Krug), `brunnen` und `haus-1` … `haus-5` (je 340 × 290).
 */
const WEITERSAGEN: TellGame & { texts?: TellTexts } = {
  background: `${G}weitersagen/dorf.webp`,
  path: `${G}weitersagen/pfad.webp`,
  walker: `${G}weitersagen/frau.webp`,
  walkerW: 9,
  texts: {
    field: 'Das Dorf Sichar von oben. Die Frau steht am Brunnen.',
    walkers: 'Die Frau',
    keys: 'Mit den Pfeiltasten wählst du ein Haus, mit Enter geht die Frau hin. Die Rücktaste nimmt den letzten Weg zurück.',
    helpUndo: 'Von hier geht es nicht weiter. Die Frau geht einen Weg zurück.',
    done: 'Kommt, seht einen Menschen, der mir gesagt hat alles, was ich getan habe, ob er nicht Christus sei!'
  },
  rounds: [
    {
      hint: 'Führe die Frau von Haus zu Haus. Die Wege dürfen sich nicht kreuzen.',
      start: { image: `${G}weitersagen/brunnen.webp`, name: 'Der Brunnen mit dem Krug', x: 50, y: 96, w: 26 },
      houses: [
        { image: `${G}weitersagen/haus-1.webp`, name: 'Das Haus des Töpfers', x: 16, y: 64, w: 26 },
        { image: `${G}weitersagen/haus-2.webp`, name: 'Das Haus des Webers', x: 84, y: 64, w: 26 },
        { image: `${G}weitersagen/haus-3.webp`, name: 'Das Haus des Bäckers', x: 50, y: 34, w: 26 }
      ]
    },
    {
      hint: 'Jetzt sind es mehr Häuser. Überlege, in welcher Reihenfolge die Frau geht, damit sie nicht stecken bleibt.',
      start: { image: `${G}weitersagen/brunnen.webp`, name: 'Der Brunnen mit dem Krug', x: 50, y: 96, w: 24 },
      houses: [
        { image: `${G}weitersagen/haus-1.webp`, name: 'Das Haus des Töpfers', x: 16, y: 33, w: 24 },
        { image: `${G}weitersagen/haus-2.webp`, name: 'Das Haus des Webers', x: 50, y: 33, w: 24 },
        { image: `${G}weitersagen/haus-3.webp`, name: 'Das Haus des Bäckers', x: 84, y: 33, w: 24 },
        { image: `${G}weitersagen/haus-4.webp`, name: 'Das Haus des Schreiners', x: 16, y: 64, w: 24 },
        { image: `${G}weitersagen/haus-5.webp`, name: 'Das Haus des Müllers', x: 84, y: 64, w: 24 }
      ]
    }
  ]
}

/**
 * Etappe 12, "Der Ruf des Hirten" (neu, `hirtenruf`, Joh 10,3–5): die Morgenweide mit Dunst; Runde 1: das Kind tippt den Hirten, der Klangring wächst mit jedem Tippen innerhalb von zwei Sekunden
 * (30, 55, 85 Prozent der Bildbreite), die Schafe im Ring kommen zu ihren Plätzen (kein Fehler möglich); Runde 2: zwei Rufer im Nebel, vier Schafe laufen zu EINEM von ihnen, das Kind tippt den Hirten
 * (Hirte links, rechts, links; im 2. Durchgang laufen die Schafe zögernd, im 3. steht der Fremde näher an den Schafen). Der Hirte ist nicht Jesus. Lagen VORLÄUFIG, am gemalten Bild nachmessen.
 * Bilder (`spiele/ichbin/hirtenruf/`): `weide`, `nebel-1`, `nebel-2`, `hirte`, `fremder`, `schaf-1` … `schaf-3`, `schaf-1-hoert` … `schaf-3-hoert`, `ring`.
 */
const HIRTENRUF: HerdCallGame = {
  background: `${G}hirtenruf/weide.webp`,
  ratio: 1.5,
  fog: [`${G}hirtenruf/nebel-1.webp`, `${G}hirtenruf/nebel-2.webp`],
  fogTop: [24, 38],
  ring: `${G}hirtenruf/ring.webp`,
  shepherd: { image: `${G}hirtenruf/hirte.webp`, x: 14, y: 46, w: 15 },
  stranger: { image: `${G}hirtenruf/fremder.webp` },
  figureRatio: 0.667,
  sheepRatio: 1.222,
  sheep: [
    { id: 's1', image: `${G}hirtenruf/schaf-1.webp`, hearing: `${G}hirtenruf/schaf-1-hoert.webp`, x: 30, y: 54, w: 14, near: 0 },
    { id: 's2', image: `${G}hirtenruf/schaf-2.webp`, hearing: `${G}hirtenruf/schaf-2-hoert.webp`, x: 28, y: 62, w: 15, near: 0 },
    { id: 's3', image: `${G}hirtenruf/schaf-3.webp`, hearing: `${G}hirtenruf/schaf-3-hoert.webp`, x: 50, y: 58, w: 13, near: 1 },
    { id: 's4', image: `${G}hirtenruf/schaf-1.webp`, hearing: `${G}hirtenruf/schaf-1-hoert.webp`, x: 58, y: 64, w: 14, near: 1 },
    { id: 's5', image: `${G}hirtenruf/schaf-2.webp`, hearing: `${G}hirtenruf/schaf-2-hoert.webp`, x: 88, y: 56, w: 11.5, near: 2 },
    { id: 's6', image: `${G}hirtenruf/schaf-3.webp`, hearing: `${G}hirtenruf/schaf-3-hoert.webp`, x: 90, y: 66, w: 12.5, near: 2 }
  ],
  slots: [
    { x: 30, y: 50, w: 14 },
    { x: 44, y: 56, w: 14 },
    { x: 54, y: 70, w: 14 },
    { x: 38, y: 76, w: 14 },
    { x: 22, y: 74, w: 14 },
    { x: 12, y: 64, w: 14 }
  ],
  radii: [30, 55, 85],
  flock: [
    { x: 38, y: 83, w: 15 },
    { x: 50, y: 79, w: 14 },
    { x: 62, y: 83, w: 15 },
    { x: 50, y: 90, w: 16 }
  ],
  sides: { left: { x: 11, y: 60, w: 17 }, right: { x: 89, y: 60, w: 17 } },
  gather: {
    left: [{ x: 22, y: 72, w: 14 }, { x: 30, y: 80, w: 15 }, { x: 20, y: 86, w: 15 }, { x: 32, y: 92, w: 15 }],
    right: [{ x: 78, y: 72, w: 14 }, { x: 70, y: 80, w: 15 }, { x: 80, y: 86, w: 15 }, { x: 68, y: 92, w: 15 }]
  },
  nearShift: 22,
  rounds: [
    { hint: 'Tippe auf den Hirten. Jeder Ruf reicht ein Stück weiter.', mode: 'radius' },
    { hint: 'Schau, wohin die Schafe laufen, und tippe auf den Hirten.', mode: 'who', trials: [{ shepherdSide: 'left', delay: 3600 }, { shepherdSide: 'right', hesitant: true, delay: 3600 }, { shepherdSide: 'left', strangerNear: true, delay: 3600 }] }
  ]
}

const MUSIK_NACHT = 'audio/abenteuer/ichbin/musik-nacht-v1.mp3'
const MUSIK_BRUNNEN = 'audio/abenteuer/ichbin/musik-brunnen-v1.mp3'
const MUSIK_HIRTE = 'audio/abenteuer/ichbin/musik-hirte-v1.mp3'

export const ichbin: Journey = {
  id: 'ichbin',
  title: 'Jesus erzählt von sich',
  subtitle: 'Was Jesus über sich sagt',
  age: '8-10',
  downloadMb: 17, // gemessen: alle Dateien von journeyFiles(ichbin) = 16,26 MB (Bilder, Karte, Spielbilder, Musik, deutsche Aufnahmen), aufgerundet
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: Der Krug am Brunnen (ein Steinbrunnen mit Seil, ein Tonkrug auf dem Rand, ein Schaf davor, ein Olivenbaum; ohne Menschen, ohne Schrift; Konturzeichnung)
  gift: { title: 'Der Krug am Brunnen', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in fünf Stücken, 16000 × 1648 px, OpenAI-Bildmodell): von Jerusalem bei Nacht über Sichar und Cäsarea Philippi auf den Berg, dann zur Hirtenweide und zurück nach Jerusalem im Winter;
  // Stationen aus ergebnis/panorama/map-ichbin.json, Perlenweg aus ichbinPath.ts
  map: {
    images: [1, 2, 3, 4, 5].map((n) => `images/abenteuer/ichbin/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 16000 / 1648,
    widthPx: 16000,
    stages: [
      { x: 0.0612, y: 0.7221, d: 0.0210 },
      { x: 0.1206, y: 0.6250, d: 0.0210 },
      { x: 0.1737, y: 0.5461, d: 0.0210 },
      { x: 0.2594, y: 0.7160, d: 0.0210 },
      { x: 0.3094, y: 0.7282, d: 0.0210 },
      { x: 0.3425, y: 0.6614, d: 0.0210 },
      { x: 0.3825, y: 0.6432, d: 0.0210 },
      { x: 0.4450, y: 0.6917, d: 0.0210 },
      { x: 0.5300, y: 0.7100, d: 0.0210 },
      { x: 0.6525, y: 0.6432, d: 0.0210 },
      { x: 0.6850, y: 0.5158, d: 0.0210 },
      { x: 0.7225, y: 0.7160, d: 0.0210 },
      { x: 0.7950, y: 0.5461, d: 0.0210 },
      { x: 0.9337, y: 0.5340, d: 0.0210 }
    ],
    exam: { x: 0.9812, y: 0.7160, d: 0.0210 },
    path: ICHBIN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      music: MUSIK_NACHT,
      title: 'Der Besuch bei Nacht',
      ref: 'Johannes 3,1–7',
      text: [
        'Es ist Nacht in Jerusalem. Nikodemus ist ein Pharisäer und einer von den Obersten im Volk. Er kommt zu Jesus.',
        '„Meister“, sagt er, „wir wissen, dass du ein Lehrer bist, den Gott geschickt hat. Niemand kann die Wunder tun, die du tust, wenn Gott nicht bei ihm ist.“',
        'Jesus antwortet ihm: „Ich sage dir die Wahrheit. Wenn jemand nicht von neuem geboren wird, kann er das Reich Gottes nicht sehen.“',
        'Nikodemus fragt: „Wie kann ein Mensch geboren werden, wenn er alt ist? Er kann doch nicht noch einmal in den Leib seiner Mutter zurück und geboren werden!“',
        'Jesus antwortet: „Ich sage dir die Wahrheit. Wenn jemand nicht aus Wasser und Geist geboren wird, kann er nicht in das Reich Gottes kommen. Was vom Fleisch geboren wird, ist Fleisch. Was vom Geist geboren wird, ist Geist. Wundere dich nicht, dass ich dir gesagt habe: Ihr müsst von neuem geboren werden.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wann kommt Nikodemus zu Jesus?', options: ['in der Nacht', 'am Mittag', 'am frühen Morgen'], answer: 0 },
        { q: 'Was muss jemand nach Jesu Worten sein, um das Reich Gottes zu sehen?', options: ['von neuem geboren', 'ein Pharisäer', 'sehr reich'], answer: 0 },
        { q: 'Was fragt Nikodemus?', options: ['wie ein alter Mensch geboren werden kann', 'wo Jesus wohnt', 'wann das Reich Gottes kommt'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      music: MUSIK_NACHT,
      title: 'Wie der Wind',
      ref: 'Johannes 3,8–15',
      text: [
        '„Der Wind weht, wohin er will. Du hörst ihn rauschen, aber du weißt nicht, woher er kommt und wohin er geht. So ist es mit jedem, der aus dem Geist geboren ist.“',
        'Nikodemus fragt: „Wie kann das sein?“',
        'Jesus antwortet: „Du bist ein Lehrer in Israel und weißt das nicht? Ich sage dir die Wahrheit: Wir reden von dem, was wir wissen, und erzählen, was wir gesehen haben. Aber ihr nehmt es nicht an.“',
        '„Ich habe euch von Dingen auf der Erde gesagt, und ihr glaubt es nicht. Wie wollt ihr glauben, wenn ich euch von Dingen im Himmel sage?“',
        '„Niemand ist in den Himmel hinaufgestiegen außer dem, der vom Himmel herabgekommen ist, dem Menschensohn, der im Himmel ist.“',
        '„Mose hat in der Wüste eine Schlange hoch aufgerichtet. So muss der Menschensohn erhöht werden, damit alle, die an ihn glauben, das ewige Leben haben.“'
      ],
      // Spiel: Woher weht der Wind? (wehen, neu)
      task: { kind: 'wehen', hint: 'Du siehst den Wind nicht. Schau, was er bewegt, und tippe, wohin er weht.', breeze: WEHEN },
      questions: [
        { q: 'Was weiß Nikodemus vom Wind nicht?', options: ['woher er kommt und wohin er geht', 'wie schnell er weht', 'wann er aufhört'], answer: 0 },
        { q: 'Was hat Mose in der Wüste hoch aufgerichtet?', options: ['eine Schlange', 'einen Stab', 'ein Zelt'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      music: MUSIK_NACHT,
      title: 'So sehr hat Gott die Welt geliebt',
      ref: 'Johannes 3,16–21',
      text: [
        '„So sehr hat Gott die Welt geliebt, dass er seinen einzigen Sohn gab. Alle, die an ihn glauben, sollen nicht verloren gehen, sondern das ewige Leben haben.“',
        '„Gott hat seinen Sohn nicht in die Welt geschickt, um sie zu verurteilen. Durch ihn soll die Welt gerettet werden.“',
        '„Wenn jemand an ihn glaubt, wird er nicht verurteilt. Wenn jemand nicht glaubt, ist er schon verurteilt, denn er glaubt nicht an den Namen von Gottes einzigem Sohn.“',
        '„Das Licht ist in die Welt gekommen. Aber die Menschen haben die Dunkelheit mehr geliebt als das Licht, denn ihre Taten waren böse.“',
        '„Wenn jemand Böses tut, hasst er das Licht und kommt nicht zum Licht, damit seine Taten nicht ans Licht kommen. Wenn aber jemand die Wahrheit tut, kommt er zum Licht, damit sichtbar wird: Seine Taten sind in Gott getan.“'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt, Merkvers Joh 3,16)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Wozu hat Gott seinen Sohn in die Welt geschickt?', options: ['damit die Welt gerettet wird', 'damit die Welt verurteilt wird', 'damit die Welt Angst bekommt'], answer: 0 },
        { q: 'Was haben die Menschen mehr geliebt als das Licht?', options: ['die Dunkelheit', 'das Feuer', 'die Sterne'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      music: MUSIK_BRUNNEN,
      title: 'Gib mir zu trinken',
      ref: 'Johannes 4,1–9',
      text: [
        'Jesus erfährt, dass die Pharisäer gehört haben: Er macht mehr Jünger und tauft mehr als Johannes der Täufer. Jesus tauft nicht selbst, seine Jünger taufen. Da verlässt Jesus das Land Judäa und zieht wieder nach Galiläa. Er muss durch Samarien reisen.',
        'Es ist Mittag. Jesus ist müde von der Reise. In der Stadt Sichar setzt er sich an Jakobs Brunnen. Seine Jünger sind in die Stadt gegangen, um Essen zu kaufen.',
        'Da kommt eine Frau aus Samarien, um Wasser zu schöpfen. Jesus sagt zu ihr: „Gib mir zu trinken!“',
        'Die Frau fragt: „Du bist ein Jude, und ich bin eine Frau aus Samarien. Wie kannst du mich um etwas zu trinken bitten?“ Juden und Samariter haben sonst nichts miteinander zu tun.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin setzt sich Jesus?', options: ['an einen Brunnen', 'unter einen Baum', 'auf eine Mauer'], answer: 0 },
        { q: 'Wohin sind die Jünger gegangen?', options: ['in die Stadt, um Essen zu kaufen', 'an den See, um zu fischen', 'zum Tempel, um zu beten'], answer: 0 },
        { q: 'Was sagt Jesus zu der Frau?', options: ['Gib mir zu trinken!', 'Zeig mir den Weg!', 'Bring mir Brot!'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      music: MUSIK_BRUNNEN,
      title: 'Lebendiges Wasser',
      ref: 'Johannes 4,10–15',
      text: [
        'Jesus antwortet ihr: „Wenn du wüsstest, was Gott dir schenken will, und wer es ist, der zu dir sagt: Gib mir zu trinken, dann würdest du ihn bitten, und er gäbe dir lebendiges Wasser.“',
        'Die Frau sagt: „Herr, du hast nichts, womit du schöpfen könntest, und der Brunnen ist tief. Woher willst du lebendiges Wasser nehmen? Bist du größer als unser Vater Jakob, der uns diesen Brunnen gegeben hat? Er hat daraus getrunken, er selbst, seine Kinder und seine Tiere.“',
        'Jesus antwortet: „Wenn jemand von diesem Wasser trinkt, bekommt er wieder Durst. Wenn aber jemand von dem Wasser trinkt, das ich gebe, wird er nie mehr Durst haben. Es wird in ihm zu einer Quelle werden, die bis ins ewige Leben sprudelt.“',
        'Die Frau sagt: „Herr, gib mir dieses Wasser! Dann habe ich keinen Durst mehr und muss nicht mehr herkommen und schöpfen.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Welches Wasser will Jesus der Frau geben?', options: ['lebendiges Wasser', 'Wasser aus dem Fluss', 'Wasser vom Berg'], answer: 0 },
        { q: 'Was sagt die Frau über den Brunnen?', options: ['Er ist tief.', 'Er ist leer.', 'Er ist neu.'], answer: 0 },
        { q: 'Was möchte die Frau nicht mehr müssen?', options: ['herkommen und schöpfen', 'weit reisen', 'Essen kaufen'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      music: MUSIK_BRUNNEN,
      title: 'Die Frau und ihr Leben',
      ref: 'Johannes 4,16–24',
      text: [
        'Jesus sagt zu der Frau: „Geh hin, ruf deinen Mann und komm wieder her!“ Die Frau antwortet: „Ich habe keinen Mann.“',
        'Jesus sagt: „Du hast recht gesagt. Fünf Männer hast du gehabt, und der, den du jetzt hast, ist nicht dein Mann.“',
        'Die Frau sagt: „Herr, ich sehe, dass du ein Prophet bist. Unsere Vorfahren haben auf diesem Berg zu Gott gebetet. Ihr aber sagt, in Jerusalem sei der Ort, an dem man beten soll.“',
        'Jesus sagt: „Glaube mir, Frau: Es kommt die Zeit, da werdet ihr den Vater weder auf diesem Berg noch in Jerusalem anbeten. Ihr betet an, was ihr nicht kennt. Wir kennen, was wir anbeten, denn das Heil kommt von den Juden.“',
        '„Aber es kommt die Zeit, und sie ist schon jetzt da: Die wirklichen Beter werden den Vater im Geist und in der Wahrheit anbeten. Denn der Vater sucht solche Beter. Gott ist Geist, und wer ihn anbetet, muss ihn im Geist und in der Wahrheit anbeten.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt Jesus über die Männer der Frau?', options: ['Sie hat fünf Männer gehabt.', 'Sie hat drei Männer gehabt.', 'Sie hat sieben Männer gehabt.'], answer: 0 },
        { q: 'Wofür hält die Frau Jesus?', options: ['für einen Propheten', 'für einen König', 'für einen Händler'], answer: 0 },
        { q: 'Wo haben die Vorfahren der Frau zu Gott gebetet?', options: ['auf diesem Berg', 'in Jerusalem', 'am See'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      music: MUSIK_BRUNNEN,
      title: 'Ich bin es',
      ref: 'Johannes 4,25–34',
      text: [
        'Die Frau sagt: „Ich weiß, dass der Messias kommt, der Christus heißt. Wenn er kommt, wird er uns alles sagen.“',
        'Jesus sagt zu ihr: „Ich bin es, der mit dir redet.“',
        'Da kommen seine Jünger zurück. Sie wundern sich, dass er mit einer Frau redet. Aber niemand fragt ihn: „Was redest du mit ihr?“',
        'Die Frau lässt ihren Krug stehen und geht in die Stadt. Sie sagt zu den Leuten: „Kommt, seht einen Mann, der mir alles gesagt hat, was ich getan habe. Ist er vielleicht der Christus?“ Da gehen sie aus der Stadt hinaus und kommen zu ihm.',
        'Inzwischen bitten die Jünger Jesus: „Meister, iss!“ Er sagt zu ihnen: „Ich habe eine Speise zu essen, die ihr nicht kennt.“ Die Jünger fragen einander: „Hat ihm jemand zu essen gebracht?“ Jesus sagt: „Meine Speise ist, den Willen dessen zu tun, der mich gesandt hat, und sein Werk zu vollenden.“'
      ],
      // Spiel: Von Haus zu Haus (weitersagen, bekannt)
      task: { kind: 'weitersagen', hint: 'Führe die Frau von Haus zu Haus. Die Wege dürfen sich nicht kreuzen.', tell: WEITERSAGEN },
      questions: [
        { q: 'Was lässt die Frau stehen?', options: ['ihren Krug', 'ihren Mantel', 'ihren Stab'], answer: 0 },
        { q: 'Was sagt Jesus, als die Frau vom Messias spricht?', options: ['Ich bin es, der mit dir redet.', 'Er ist noch nicht gekommen.', 'Er kommt bald.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      music: MUSIK_BRUNNEN,
      title: 'Die Felder sind weiß',
      ref: 'Johannes 4,35–42',
      text: [
        'Jesus sagt zu den Jüngern: „Sagt ihr nicht: Es sind noch vier Monate, dann kommt die Ernte? Seht, ich sage euch: Hebt eure Augen auf und seht auf die Felder! Sie sind schon weiß zur Ernte.“',
        '„Wer erntet, bekommt Lohn und sammelt Frucht für das ewige Leben, damit sich der, der sät, und der, der erntet, miteinander freuen. Einer sät, ein anderer erntet.“',
        '„Ich habe euch geschickt, zu ernten, was ihr nicht erarbeitet habt. Andere haben gearbeitet, und ihr seid in ihre Arbeit gekommen.“',
        'Viele Samariter aus der Stadt glauben an Jesus, weil die Frau gesagt hat: „Er hat mir alles gesagt, was ich getan habe.“ Sie kommen zu ihm und bitten ihn, bei ihnen zu bleiben. Er bleibt zwei Tage dort. Noch viel mehr glauben wegen seiner Worte.',
        'Sie sagen zu der Frau: „Wir glauben nicht mehr nur wegen deiner Rede. Wir haben ihn selbst gehört und wissen: Er ist wirklich der Christus, der Retter der Welt.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie sind die Felder nach Jesu Worten?', options: ['schon weiß zur Ernte', 'noch grün', 'ganz leer'], answer: 0 },
        { q: 'Wie lange bleibt Jesus bei den Samaritern?', options: ['zwei Tage', 'eine Woche', 'eine Nacht'], answer: 0 },
        { q: 'Warum glauben noch mehr Samariter?', options: ['Sie haben Jesus selbst gehört.', 'Sie haben ein Wunder gesehen.', 'Sie haben einen Brief bekommen.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      music: MUSIK_NACHT,
      title: 'Wer sagt ihr, dass ich bin?',
      ref: 'Matthäus 16,13–20',
      text: [
        'Jesus kommt mit seinen Jüngern in die Gegend der Stadt Cäsarea Philippi. Dort fragt er sie: „Wer sagen die Leute, dass der Menschensohn sei?“',
        'Sie antworten: „Manche sagen, du bist Johannes der Täufer, andere, du bist Elia, wieder andere, du bist Jeremia oder einer der Propheten.“',
        'Jesus fragt sie: „Wer sagt denn ihr, dass ich bin?“',
        'Simon Petrus antwortet: „Du bist der Christus, der Sohn des lebendigen Gottes!“',
        'Jesus sagt zu ihm: „Du bist gesegnet, Simon, Sohn des Jona. Das hat dir kein Mensch gesagt, sondern mein Vater im Himmel.“',
        '„Und ich sage dir: Du bist Petrus, und auf diesen Felsen will ich meine Gemeinde bauen. Die Tore des Totenreichs werden sie nicht überwältigen.“',
        '„Ich will dir die Schlüssel des Himmelreichs geben. Was du auf der Erde bindest, soll auch im Himmel gebunden sein, und was du auf der Erde löst, soll auch im Himmel gelöst sein.“',
        'Dann verbietet Jesus den Jüngern, jemandem zu sagen, dass er der Christus ist.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was fragt Jesus seine Jünger zuerst?', options: ['Wer die Leute sagen, dass er sei', 'Wohin sie gehen wollen', 'Was sie essen möchten'], answer: 0 },
        { q: 'Was antwortet Petrus?', options: ['Du bist der Christus, der Sohn des lebendigen Gottes.', 'Du bist ein Prophet wie Elia.', 'Du bist ein Lehrer in Israel.'], answer: 0 },
        { q: 'Worauf will Jesus seine Gemeinde bauen?', options: ['auf diesen Felsen', 'auf einen Berg', 'auf ein Haus'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      music: MUSIK_NACHT,
      title: 'Auf dem Berg',
      ref: 'Matthäus 17,1–5',
      text: [
        'Sechs Tage später nimmt Jesus Petrus, Jakobus und dessen Bruder Johannes mit sich. Er führt sie allein auf einen hohen Berg.',
        'Dort wird Jesus vor ihren Augen verwandelt. Sein Gesicht leuchtet wie die Sonne, und seine Kleider werden weiß wie das Licht. Mose und Elia erscheinen den Jüngern und reden mit Jesus.',
        'Petrus sagt zu Jesus: „Herr, hier ist es gut. Wenn du willst, machen wir hier drei Hütten, dir eine, Mose eine und Elia eine.“',
        'Während er noch redet, kommt eine helle Wolke und überschattet sie. Eine Stimme aus der Wolke sagt: „Dies ist mein lieber Sohn, an dem ich Wohlgefallen habe. Auf ihn sollt ihr hören!“'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen nimmt Jesus mit auf den Berg?', options: ['Petrus, Jakobus und Johannes', 'Petrus, Andreas und Thomas', 'alle seine Jünger'], answer: 0 },
        { q: 'Was geschieht mit Jesus auf dem Berg?', options: ['Sein Gesicht leuchtet wie die Sonne.', 'Er wird unsichtbar.', 'Er schläft ein.'], answer: 0 },
        { q: 'Was sagt die Stimme aus der Wolke über Jesus?', options: ['Er ist mein lieber Sohn.', 'Er ist ein Prophet.', 'Er ist ein Lehrer.'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      music: MUSIK_NACHT,
      title: 'Steht auf und fürchtet euch nicht',
      ref: 'Matthäus 17,6–13',
      text: [
        'Als die Jünger das hören, fallen sie auf ihr Gesicht und fürchten sich sehr. Jesus kommt zu ihnen, berührt sie und sagt: „Steht auf und fürchtet euch nicht!“ Als sie aufschauen, sehen sie niemanden außer Jesus allein.',
        'Sie gehen vom Berg hinab. Jesus befiehlt ihnen: „Erzählt niemandem von dem, was ihr gesehen habt, bis der Menschensohn von den Toten auferstanden ist.“',
        'Die Jünger fragen ihn: „Warum sagen die Schriftgelehrten, Elia müsse zuerst kommen?“',
        'Jesus antwortet: „Elia kommt zuerst und bringt alles in Ordnung. Aber ich sage euch: Elia ist schon gekommen, und sie haben ihn nicht erkannt, sondern mit ihm getan, was sie wollten. So wird auch der Menschensohn von ihnen leiden müssen.“',
        'Da verstehen die Jünger, dass er von Johannes dem Täufer gesprochen hat.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt Jesus zu den Jüngern, die auf ihrem Gesicht liegen?', options: ['Steht auf und fürchtet euch nicht!', 'Bleibt liegen!', 'Lauft schnell weg!'], answer: 0 },
        { q: 'Wen sehen die Jünger, als sie aufschauen?', options: ['niemanden außer Jesus', 'Mose und Elia', 'eine Wolke'], answer: 0 },
        { q: 'Wen meint Jesus mit Elia, der schon gekommen ist?', options: ['Johannes den Täufer', 'Mose', 'Petrus'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      music: MUSIK_HIRTE,
      title: 'Er ruft sie beim Namen',
      ref: 'Johannes 10,1–10',
      text: [
        'Jesus sagt zu den Leuten: „Ich sage euch die Wahrheit: Wenn jemand nicht durch die Tür in den Schafstall geht, sondern woanders hineinsteigt, ist er ein Dieb und ein Räuber. Der Hirte der Schafe aber geht durch die Tür hinein.“',
        '„Ihm macht der Türhüter auf, und die Schafe hören seine Stimme. Er ruft seine Schafe mit ihrem Namen und führt sie hinaus.“',
        '„Dann geht er vor ihnen her, und die Schafe folgen ihm, denn sie kennen seine Stimme. Einem Fremden folgen sie nicht, sondern laufen vor ihm weg, denn sie kennen die Stimme der Fremden nicht.“',
        'Die Leute verstehen nicht, was Jesus ihnen damit sagen will.',
        'Da sagt Jesus wieder zu ihnen: „Ich bin die Tür zu den Schafen. Alle, die vor mir gekommen sind, sind Diebe und Räuber, aber die Schafe haben nicht auf sie gehört. Wenn jemand durch mich hineingeht, wird er gerettet werden. Er wird ein- und ausgehen und Weide finden.“',
        '„Ein Dieb kommt nur, um zu stehlen und zu zerstören. Ich bin gekommen, damit sie das Leben haben, und zwar mehr als genug.“'
      ],
      // Spiel: Der Ruf des Hirten (hirtenruf, neu)
      task: { kind: 'hirtenruf', hint: 'Tippe auf den Hirten. Jeder Ruf reicht ein Stück weiter.', herdCall: HIRTENRUF },
      questions: [
        { q: 'Wie geht der Hirte in den Schafstall?', options: ['durch die Tür', 'über die Mauer', 'durch den Zaun'], answer: 0 },
        { q: 'Was tut der Hirte, wenn er die Schafe hinausgeführt hat?', options: ['Er geht vor ihnen her.', 'Er geht hinter ihnen her.', 'Er trägt sie alle.'], answer: 0 }
      ]
    },
    {
      id: 13,
      image: `${PICS}etappe-bild-13.webp`,
      music: MUSIK_HIRTE,
      title: 'Ich bin der gute Hirte',
      ref: 'Johannes 10,11–18',
      text: [
        'Jesus sagt: „Ich bin der gute Hirte. Der gute Hirte gibt sein Leben für die Schafe. Ein bezahlter Arbeiter, dem die Schafe nicht gehören, sieht den Wolf kommen. Er lässt die Schafe allein und läuft weg, und der Wolf fängt einige und jagt die anderen auseinander. Der Arbeiter läuft weg, denn er wird nur bezahlt, und die Schafe sind ihm gleichgültig.“',
        '„Ich bin der gute Hirte. Ich kenne meine Schafe, und meine Schafe kennen mich, so wie mein Vater mich kennt und ich den Vater kenne. Ich gebe mein Leben für die Schafe.“',
        '„Ich habe noch andere Schafe, die sind nicht in diesem Stall. Auch sie muss ich herführen. Sie werden meine Stimme hören, und dann gibt es eine Herde und einen Hirten.“',
        '„Darum liebt mich mein Vater, weil ich mein Leben gebe, um es wieder zu nehmen. Niemand nimmt es mir, ich gebe es von mir aus. Ich habe die Macht, es zu geben, und die Macht, es wieder zu nehmen. Diesen Auftrag habe ich von meinem Vater bekommen.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was gibt der gute Hirte für die Schafe?', options: ['sein Leben', 'sein Geld', 'seinen Stab'], answer: 0 },
        { q: 'Was tut der bezahlte Arbeiter, als er den Wolf kommen sieht?', options: ['Er läuft weg.', 'Er kämpft mit dem Wolf.', 'Er ruft den Hirten.'], answer: 0 },
        { q: 'Was sagt Jesus über die anderen Schafe?', options: ['Auch sie muss er herführen.', 'Sie sollen draußen bleiben.', 'Sie gehören einem Fremden.'], answer: 0 }
      ]
    },
    {
      id: 14,
      image: `${PICS}etappe-bild-14.webp`,
      music: MUSIK_HIRTE,
      title: 'Aus meiner Hand',
      ref: 'Johannes 10,19–30',
      text: [
        'Wegen dieser Worte streiten die Leute wieder. Viele sagen: „Er hat einen bösen Geist und redet Unsinn.“ Andere sagen: „Kann ein böser Geist Blinden die Augen öffnen?“',
        'Es ist Winter in Jerusalem, und die Stadt feiert das Fest der Tempelweihe. Jesus geht im Tempel umher, in der Halle Salomos. Da stellen sich die Leute um ihn herum und fragen: „Wie lange sollen wir noch warten? Bist du der Christus? Dann sag es uns frei heraus!“',
        'Jesus antwortet: „Ich habe es euch gesagt, und ihr glaubt nicht. Die Werke, die ich im Namen meines Vaters tue, zeigen, wer ich bin. Aber ihr glaubt nicht, denn ihr gehört nicht zu meinen Schafen, wie ich euch gesagt habe.“',
        '„Meine Schafe hören meine Stimme, und ich kenne sie, und sie folgen mir. Ich gebe ihnen das ewige Leben. Sie werden nie verloren gehen, und niemand wird sie mir aus der Hand reißen. Mein Vater, der sie mir gegeben hat, ist größer als alles. Niemand kann sie aus der Hand meines Vaters reißen. Ich und der Vater sind eins.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo geht Jesus im Tempel umher?', options: ['in der Halle Salomos', 'im Hof der Frauen', 'am Brunnen in Sichar'], answer: 0 },
        { q: 'Was wollen die Leute von Jesus wissen?', options: ['ob er der Christus ist', 'wo er wohnt', 'wann das Fest zu Ende ist'], answer: 0 },
        { q: 'Was sagt Jesus über seine Schafe?', options: ['Niemand wird sie ihm aus der Hand reißen.', 'Sie müssen allein zurechtkommen.', 'Sie dürfen nicht zu ihm kommen.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wozu hat Gott seinen Sohn in die Welt geschickt?', options: ['damit die Welt gerettet wird', 'damit die Welt verurteilt wird', 'damit die Welt Angst bekommt'], answer: 0 },
    { q: 'Welches Wasser will Jesus der Frau am Brunnen geben?', options: ['lebendiges Wasser', 'Wasser aus dem Fluss', 'Wasser vom Berg'], answer: 0 },
    { q: 'Was sagt Jesus, als die Frau vom Messias spricht?', options: ['Ich bin es, der mit dir redet.', 'Er ist noch nicht gekommen.', 'Er kommt bald.'], answer: 0 },
    { q: 'Was antwortet Petrus auf die Frage, wer Jesus ist?', options: ['Du bist der Christus, der Sohn des lebendigen Gottes.', 'Du bist ein Prophet wie Elia.', 'Du bist ein Lehrer in Israel.'], answer: 0 },
    { q: 'Was sagt die Stimme aus der Wolke über Jesus?', options: ['Er ist mein lieber Sohn.', 'Er ist ein Prophet.', 'Er ist ein Lehrer.'], answer: 0 },
    { q: 'Was sagt Jesus über seine Schafe?', options: ['Niemand wird sie ihm aus der Hand reißen.', 'Sie müssen allein zurechtkommen.', 'Sie dürfen nicht zu ihm kommen.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of ichbin.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-vK.mp3"; K is the version, a re-recorded story gets a new number); until a recording is made the app reads with the voice of the device.
// stage -> version of the file in public/audio/abenteuer/ichbin/ (written by bauen_ichbin.py from the files that exist)
const RECORDING_VERSION: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 1, 6: 1, 7: 2, 8: 1, 9: 2, 10: 1, 11: 2, 12: 3, 13: 2, 14: 1 }
for (const s of ichbin.stages) {
  const version = RECORDING_VERSION[s.id]
  const file = version ? `audio/abenteuer/ichbin/geschichte-${String(s.id).padStart(2, '0')}-v${version}.mp3` : undefined
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria; they follow one another at random
ichbin.music = [
  'audio/abenteuer/ichbin/musik-nacht-v1.mp3',
  'audio/abenteuer/ichbin/musik-brunnen-v1.mp3',
  'audio/abenteuer/ichbin/musik-hirte-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(ichbin, ichbinEn)
