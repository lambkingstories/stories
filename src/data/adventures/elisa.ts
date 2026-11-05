/**
 * Abenteuer "Elisa und Naaman" (2. Könige 4–5) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Das Öl, das Brot und der Jordan". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 29.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Elisa/ENTWURF_Elisa.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md.
 * Nicht oder gemildert erzählt: Elisas Nachfolge und die Spottkinder (2. Kön 2), der Moabiterkrieg (3), Gehasis Habgier und seine Strafe (5,20–27). Der Tod des Jungen in Schunem wird nur kurz erzählt (Etappe 3 ist nur Quiz),
 * der "Tod im Topf" heißt "Gift im Topf", der Aussatz heißt "eine schlimme Hautkrankheit" und wird nie gemalt: Naaman ist nur müde und still, nach dem Bad strahlt seine gesunde Haut.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel vom 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Krüge füllen (neu), 2 Puzzle (bekannt), 3 nur Quiz, 4 Ernten (bekannt), 5 Die Handmühle (neu), 6 nur Quiz,
 * 7 Das Siegel (neu), 8 Siebenmal untertauchen (neu), 9 Erde für Naaman (neu). Die drei Spiele vom 5.11.2026 ersetzen Reihenfolge, Memory und Lückenvers; ihre Typen stehen in `@/utils/elisaNeu`.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/elisa/, images/abenteuer/spiele/elisa/<spiel>/, audio/abenteuer/elisa/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { DiveGame, HarvestGame, JarGame, Journey } from '@/types/adventure'
import type { EarthGame, MillGame, SealGame } from '@/utils/elisaNeu'
import { josef } from './josef'
import { ELISA_PATH } from './elisaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { elisaEn } from './en/elisa.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/elisa/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/elisa/'

const G = 'images/abenteuer/spiele/elisa/'
// gemeinsame Bilder der alten Spiele (Gemüse aus Josef)
const GS = 'images/abenteuer/spiele/'

/**
 * Etappe 4, "Gemüse ernten" (alte Mechanik, Ernten): ein Garten bei Gilgal im Hochformat (Bildauftrag S34); Gemüse (Lauch, Möhre, Zwiebel, Melone) kommt in den Korb, die wilden Ranken mit den gelben Früchten nicht.
 * Gemüse und Korb sind die gemeinsamen aus Josef (`images/abenteuer/spiele/ernten/`), Garten und Ranken sind neu.
 */
const ERNTEN: HarvestGame = {
  field: `${G}ernten/feld.webp`,
  basket: `${GS}ernten/korb.webp`,
  fruits: ['lauch', 'moehre', 'zwiebel', 'melone'].map((n) => `${GS}ernten/${n}.webp`),
  weeds: [1, 2, 3].map((n) => `${G}ernten/ranke-${n}.webp`),
  count: 10
}

/**
 * Etappe 1, "Krüge füllen" (neu): der Hof der Witwe (gemaltes Bild) mit einer Reihe leerer Tonkrüge (drei verschiedene Bilder) auf dem Boden; die Ölkanne (Bild) hängt darüber. Das Kind zieht die Kanne mit dem Finger über einen Krug:
 * er füllt sich mit goldenem Öl (ein Ölstand steigt im Krug). Ist der Krug voll, muss die Kanne zum nächsten; läuft weiter Öl in einen vollen Krug, läuft er über (ein Kreuz, ein Fehler, je Krug einmal).
 * Runde 1 drei Krüge, Runde 2 vier, Runde 3 fünf; nach dem letzten Krug "ist kein Krug mehr da" und das Öl hört auf. Loslassen lässt die Kanne dort hängen, wo sie ist (Pfeiltasten schieben sie in Schritten).
 * Bilder (Bildauftrag S31): `kruege/hof.webp` 1200 × 900, `krug-1..3.webp` (aus EINEM Bogen geschnitten, Magenta-Schnitt), `kanne.webp`.
 */
const KRUEGE: JarGame = {
  background: `${G}kruege/hof.webp`,
  jars: [1, 2, 3].map((n) => `${G}kruege/krug-${n}.webp`),
  jug: `${G}kruege/kanne.webp`,
  jugW: 15,
  jugStart: { x: 50, y: 20 },
  rounds: [
    {
      hint: 'Ziehe die Kanne über einen Krug. Wenn er voll ist, schiebe sie zum nächsten.',
      jars: [{ x: 26, y: 86, w: 18.26, sprite: 0, ms: 1500 }, { x: 50, y: 86, w: 22, sprite: 1, ms: 1700 }, { x: 74, y: 86, w: 12.32, sprite: 2, ms: 1900 }]
    },
    {
      hint: 'Jetzt vier Krüge. Lass kein Öl überlaufen.',
      jars: [{ x: 16, y: 87, w: 19, sprite: 1, ms: 1500 }, { x: 38, y: 87, w: 15.77, sprite: 0, ms: 1300 }, { x: 62, y: 87, w: 10.64, sprite: 2, ms: 1900 }, { x: 84, y: 87, w: 19, sprite: 1, ms: 1500 }]
    },
    {
      hint: 'Zuletzt fünf Krüge, kleine und große.',
      jars: [{ x: 12, y: 88, w: 8.96, sprite: 2, ms: 1600 }, { x: 31, y: 88, w: 16, sprite: 1, ms: 1500 }, { x: 50, y: 88, w: 13.28, sprite: 0, ms: 1300 }, { x: 69, y: 88, w: 16, sprite: 1, ms: 1500 }, { x: 88, y: 88, w: 8.96, sprite: 2, ms: 1600 }]
    }
  ]
}

/**
 * Etappe 8, "Siebenmal untertauchen" (neu): der Jordan (gemaltes Bild) mit Naaman bis zur Hüfte im Wasser (Bild). Unter dem Bild steht ein großer Knopf, der sagt, ob das Wasser ruhig ist. Das Kind tippt, wenn das Wasser ruhig ist:
 * Naaman taucht unter, kommt wieder herauf, und ein Wasserring läuft über das Wasser. Solange der Ring läuft, ist das Wasser nicht ruhig; wer dann tippt, taucht ihn zu früh (Kreuz, Fehler, der Tauchgang zählt nicht).
 * Nach sieben guten Tauchgängen kommt Naaman gesund mit erhobenen Armen herauf (zweites Bild). Tippen unter Wasser wird übergangen.
 * Bilder (Bildauftrag S32): `tauchen/jordan.webp` 1200 × 900, `naaman.webp`, `naaman-neu.webp` (gleiche Größe und Lage), `welle.webp`.
 */
const TAUCHEN: DiveGame = {
  background: `${G}tauchen/jordan.webp`,
  naaman: `${G}tauchen/naaman.webp`,
  naamanNew: `${G}tauchen/naaman-neu.webp`,
  ripple: `${G}tauchen/welle.webp`,
  pos: { x: 58, y: 70, w: 30 },
  ripplePos: { x: 58, y: 70, w: 46 },
  dips: 7,
  underMs: 900,
  calmMs: 1800,
  hint: 'Tippe, wenn das Wasser ruhig ist. Siebenmal taucht Naaman unter.'
}

/**
 * Etappe 5, "Die Handmühle" (neu, 5.11.2026): von oben eine Schilfmatte, darauf die Handmühle (unterer Stein, darüber der Läuferstein mit Griff und Loch), daneben die Schale und der offene Sack Gerste.
 * Das Kind dreht den Läufer mit kreisendem Finger (oder mit dem Knopf „Drehen“, den Pfeiltasten); jede Umdrehung mahlt Mehl, das in der Schale wächst. Runde 1: vier Umdrehungen, Korn genug.
 * Runde 2: sechs Umdrehungen; das Korn im Loch reicht nur anderthalb Umdrehungen (auf den Sack tippen schüttet nach), und wer zu schnell dreht, dem springen die Körner heraus (ein Fehler).
 * Logik und Prüfer: `src/utils/elisaNeu.ts` (handMillProblems). Bilder (Bildauftrag S40): `handmuehle/boden.webp`, `unterstein`, `laeufer`, `schale`, `mehl`, `sack`, `koerner`.
 */
const MUEHLE: MillGame = {
  background: `${G}handmuehle/boden.webp`,
  lower: `${G}handmuehle/unterstein.webp`,
  upper: `${G}handmuehle/laeufer.webp`,
  bowl: `${G}handmuehle/schale.webp`,
  flour: `${G}handmuehle/mehl.webp`,
  sack: `${G}handmuehle/sack.webp`,
  grain: `${G}handmuehle/koerner.webp`,
  mill: { x: 50, y: 50, w: 44 },
  upperW: 37,
  bowlAt: { x: 84, y: 70, w: 24 },
  sackAt: { x: 15, y: 72, w: 22 },
  flourW: 14,
  grainW: 7,
  rounds: [
    { hint: 'Lege den Finger auf den Mühlstein und dreh ihn im Kreis. Viermal herum, dann ist die Schale voll.', turns: 4, hopper: 0, maxSpeed: 0 },
    { hint: 'Jetzt mehr Mehl für die Leute. Sind die Körner im Loch alle, tippe auf den Sack. Und dreh ruhig, nicht zu schnell!', turns: 6, hopper: 1.5, maxSpeed: 1.6 }
  ]
}

/**
 * Etappe 7, "Das Siegel" (neu, 5.11.2026): von oben der Schreibtisch des Königs von Syrien mit dem gerollten Brief; auf dem Brief liegt rotes Wachs mit dem blassen Abdruck des Königssiegels (Löwe mit Stern).
 * Das Kind dreht das Siegel (mit dem Finger im Kreis, mit den Drehknöpfen oder den Pfeiltasten), bis es genau im Abdruck liegt, und drückt es dann fest („Siegeln“). Passt es nicht: ein Kreuz, ein Fehler.
 * Runde 1: zwei Siegel, 14 Grad Spielraum; Runde 2: drei Siegel, 7 Grad. Logik und Prüfer: `src/utils/elisaNeu.ts` (sealTurnProblems). Bilder (Bildauftrag S40): `siegel/tisch.webp`, `brief`, `wachs`, `siegel`.
 */
const SIEGEL: SealGame = {
  background: `${G}siegel/tisch.webp`,
  letter: `${G}siegel/brief.webp`,
  wax: `${G}siegel/wachs.webp`,
  seal: `${G}siegel/siegel.webp`,
  letterAt: { x: 50, y: 52, w: 92 },
  letterRatio: 4.76,
  waxW: 19,
  sealW: 17,
  rounds: [
    { hint: 'Dreh das Siegel mit dem Finger, bis der Löwe genau im Abdruck liegt. Dann tippe auf „Siegeln“.', tolerance: 14, spots: [{ x: 34, y: 52, angle: 0, start: 130 }, { x: 66, y: 52, angle: 300, start: 60 }] },
    { hint: 'Jetzt drei Siegel, und sie müssen noch genauer passen.', tolerance: 7, spots: [{ x: 25, y: 52, angle: 45, start: 250 }, { x: 50, y: 52, angle: 180, start: 20 }, { x: 75, y: 52, angle: 250, start: 130 }] }
  ]
}

/**
 * Etappe 9, "Erde für Naaman" (neu, 5.11.2026; 2. Kön 5,17 „dieser Erde Last, soviel zwei Maultiere tragen“): vor Elisas Haus stehen zwei Maultiere, unten auf dem Weg warten Säcke mit Erde (klein, mittel, groß).
 * Das Kind tippt einen Sack und dann ein Maultier (oder zieht den Sack hin); beide Maultiere sollen gleich viel tragen. Würde ein Maultier mehr als die Hälfte tragen: „Zu schwer!“, ein Kreuz, ein Fehler.
 * Ein Sack auf einem Maultier kann wieder heruntergenommen werden (kein Fehler). Runde 1 sechs Säcke, Runde 2 sieben. Logik und Prüfer: `src/utils/elisaNeu.ts` (earthLoadProblems).
 * Bilder (Bildauftrag S40): `naamanerde/weg.webp`, `maultier-1`, `maultier-2`, `sack-1..3`.
 */
const ERDE: EarthGame = {
  background: `${G}naamanerde/weg.webp`,
  mule: [`${G}naamanerde/maultier-1.webp`, `${G}naamanerde/maultier-2.webp`],
  sacks: [`${G}naamanerde/sack-1.webp`, `${G}naamanerde/sack-2.webp`, `${G}naamanerde/sack-3.webp`],
  sackRatio: [0.89, 0.95, 0.96],
  mules: [{ x: 27, y: 52, w: 30 }, { x: 73, y: 52, w: 30 }],
  muleRatio: 0.86,
  back: { x: 62, y: 46, w: 34 },
  sackY: 97,
  sackW: [7.5, 10.5, 13.5],
  loadScale: 0.6,
  rounds: [
    { hint: 'Tippe einen Sack an und dann ein Maultier. Jedes Maultier trägt die Hälfte.', sacks: [3, 1, 2, 2, 1, 3] },
    { hint: 'Jetzt sieben Säcke. Überlege gut, welcher Sack auf welches Maultier kommt.', sacks: [2, 3, 1, 2, 3, 2, 1] }
  ]
}

export const elisa: Journey = {
  id: 'elisa',
  title: 'Elisa und Naaman',
  subtitle: 'Das Öl, das Brot und der Jordan',
  age: '8-10',
  downloadMb: 17, // gemessen 17 MB (Bilder, Spielbilder, Aufnahmen deutsch und englisch, Musik), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: die Witwe, Elisa und die lange Reihe der Krüge (Konturzeichnung)
  gift: { title: 'Das Öl der Witwe', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus elisaPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/elisa/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0853, y: 0.5825, d: 0.0339 },
      { x: 0.1746, y: 0.6523, d: 0.0339 },
      { x: 0.2675, y: 0.5158, d: 0.0339 },
      { x: 0.4225, y: 0.5127, d: 0.0339 },
      { x: 0.5175, y: 0.5127, d: 0.0339 },
      { x: 0.5969, y: 0.6523, d: 0.0339 },
      { x: 0.7209, y: 0.5825, d: 0.0339 },
      { x: 0.8269, y: 0.5850, d: 0.0339 },
      { x: 0.8962, y: 0.5825, d: 0.0339 }
    ],
    exam: { x: 0.9689, y: 0.6068, d: 0.0339 },
    path: ELISA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Das Öl der Witwe',
      ref: '2. Könige 4,1–7',
      text: [
        'Eine Frau kommt weinend zu Elisa. „Mein Mann ist gestorben“, sagt sie. „Er hat Gott geehrt. Jetzt will der Mann, dem wir Geld schulden, meine beiden Söhne mitnehmen, damit sie für ihn arbeiten.“',
        '„Was hast du im Haus?“, fragt Elisa. „Nichts“, sagt die Frau, „nur einen kleinen Krug mit Öl.“ Da sagt Elisa: „Geh zu allen deinen Nachbarinnen und bitte sie um leere Gefäße, nicht zu wenige! Dann schließ die Tür hinter dir und deinen Söhnen und gieß das Öl in alle Gefäße.“',
        'Die Frau tut es. Ihre Söhne bringen ein Gefäß nach dem anderen, und sie gießt und gießt. Das Öl hört nicht auf zu fließen. Als alle Gefäße voll sind, sagt sie: „Bring mir noch eins!“ „Es ist keins mehr da“, sagt der Sohn. Da hört das Öl auf. Elisa sagt: „Verkauf das Öl und bezahl deine Schulden. Vom Rest könnt ihr leben.“'
      ],
      // Spiel: Krüge füllen (kruege, neu)
      task: { kind: 'kruege', hint: 'Gieße das Öl der Reihe nach in die Krüge. Läuft ein Krug über, schiebe die Kanne weiter.', jars: KRUEGE },
      questions: [
        { q: 'Was hat die Frau im Haus?', options: ['einen kleinen Krug mit Öl', 'einen Sack Mehl', 'einen Esel'], answer: 0 },
        { q: 'Was soll sie von den Nachbarinnen holen?', options: ['leere Gefäße', 'Brot', 'Geld'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Das Zimmer auf dem Dach',
      ref: '2. Könige 4,8–17',
      text: [
        'In Schunem wohnt eine reiche Frau. Immer wenn Elisa auf seinen Wegen dort vorbeikommt, lädt sie ihn zum Essen ein. Eines Tages sagt sie zu ihrem Mann: „Ich merke, dass dieser Mann Gottes heilig ist. Lass uns ihm oben ein kleines Zimmer bauen und ein Bett, einen Tisch, einen Stuhl und einen Leuchter hineinstellen. Dann kann er sich dort ausruhen, wenn er zu uns kommt.“',
        'So geschieht es. Als Elisa wiederkommt, schläft er in dem Zimmer. Er will der Frau danken und lässt sie rufen. Sein Diener Gehasi sagt: „Sie hat keinen Sohn, und ihr Mann ist alt.“',
        '„Um diese Zeit im nächsten Jahr“, sagt Elisa zu der Frau, „wirst du einen Sohn im Arm halten.“ Sie kann es kaum glauben. Doch es geschieht, wie Elisa gesagt hat.'
      ],
      // Spiel: Puzzle (puzzle, bekannt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Zimmer auf dem Dach zusammen.', puzzle: { image: `${G}puzzle/zimmer.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was baut die Frau für Elisa?', options: ['ein kleines Zimmer auf dem Dach', 'ein Zelt im Garten', 'einen Stall'], answer: 0 },
        { q: 'Was stellt sie in das Zimmer?', options: ['Bett, Tisch, Stuhl und Leuchter', 'Kisten und Säcke', 'einen Ofen'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Der Sohn der Frau',
      ref: '2. Könige 4,18–37',
      text: [
        'Der Sohn der Frau wächst heran. Eines Tages ist er bei seinem Vater auf dem Feld und ruft: „O mein Kopf, mein Kopf!“ Ein Diener trägt ihn zur Mutter. Sie hält ihn auf dem Schoß, und am Mittag stirbt er. Die Mutter legt ihn auf das Bett im Zimmer des Mannes Gottes und schließt die Tür.',
        'Dann lässt sie sich eine Eselin satteln. „Treib schnell und halte nicht an!“, sagt sie dem Knecht. Sie reitet zu Elisa auf den Berg Karmel. „Ich lasse dich nicht los“, sagt sie zu ihm.',
        'Elisa geht mit ihr. Im Haus schließt er die Tür und betet zu Gott. Er beugt sich über das Kind, bis es warm wird. Da niest der Junge siebenmal und öffnet die Augen. „Nimm deinen Sohn“, sagt Elisa. Die Mutter fällt vor ihm nieder und nimmt ihren Sohn in die Arme.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin reitet die Mutter?', options: ['zu Elisa auf den Berg Karmel', 'nach Jerusalem', 'ans Meer'], answer: 0 },
        { q: 'Was tut Elisa im Haus?', options: ['Er betet zu Gott.', 'Er singt ein Lied.', 'Er geht wieder fort.'], answer: 0 },
        { q: 'Wie oft niest der Junge?', options: ['siebenmal', 'einmal', 'zehnmal'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der Topf mit dem bitteren Gemüse',
      ref: '2. Könige 4,38–41',
      text: [
        'In Gilgal ist das Essen knapp. Elisa sitzt mit den Prophetenschülern zusammen. „Setz den großen Topf auf“, sagt er zu seinem Diener, „und koch ein Gemüse für die Männer.“',
        'Einer von ihnen geht aufs Feld, um Kräuter zu sammeln. Er findet eine wilde Ranke mit Früchten und füllt sein Kleid damit. Er schneidet sie in den Topf, denn niemand kennt sie.',
        'Als die Männer essen wollen, rufen sie: „Mann Gottes, im Topf ist Gift!“ Es schmeckt so bitter, dass sie es nicht essen können. Elisa sagt: „Bringt Mehl!“ Er streut das Mehl in den Topf und sagt: „Schüttet es den Männern vor.“ Nun können alle essen, und es schadet ihnen nicht.'
      ],
      // Spiel: Ernten (ernten, bekannt)
      task: { kind: 'ernten', hint: 'Tippe das Gemüse an. Die wilden Früchte gehören nicht in den Korb.', harvest: ERNTEN },
      questions: [
        { q: 'Wo kocht Elisa das Gemüse?', options: ['in einem großen Topf', 'auf einem Stein', 'am Fluss'], answer: 0 },
        { q: 'Was ist an dem Gemüse nicht in Ordnung?', options: ['Es ist bitter.', 'Es ist zu heiß.', 'Es ist zu klein.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Zwanzig Brote',
      ref: '2. Könige 4,42–44',
      text: [
        'Ein Mann kommt aus Baal-Schalischa zu Elisa. Er bringt zwanzig Gerstenbrote und frisches Getreide in seinem Gewand. Es ist das Erste von seiner Ernte, und er schenkt es dem Mann Gottes.',
        '„Gib es den Leuten zu essen“, sagt Elisa zu seinem Diener. Der Diener schaut auf die Brote und dann auf die Männer. „Wie soll ich das hundert Männern geben?“, fragt er.',
        'Aber Elisa sagt noch einmal: „Gib es den Leuten, damit sie essen. Denn so spricht Gott: Sie werden essen, und es wird noch etwas übrig bleiben.“ Der Diener teilt die Brote aus. Alle Männer essen, und sie werden satt. Und es bleibt noch Brot übrig, wie Gott gesagt hat.'
      ],
      // Spiel: Die Handmühle (handmuehle, neu 5.11.2026)
      task: { kind: 'handmuehle', hint: 'Mahle das frische Korn: Dreh den Mühlstein im Kreis, bis die Schale voll Mehl ist.', handMill: MUEHLE },
      questions: [
        { q: 'Woher kommt der Mann mit den Broten?', options: ['aus Baal-Schalischa', 'aus Damaskus', 'aus Gilgal'], answer: 0 },
        { q: 'Wie viele Brote bringt er?', options: ['zwanzig', 'zwei', 'zweihundert'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Das Mädchen aus Israel',
      ref: '2. Könige 5,1–4',
      text: [
        'In Syrien lebt ein hoher Feldhauptmann, er heißt Naaman. Der König schätzt ihn sehr, und viele Menschen achten ihn, denn durch ihn hat Gott den Syrern schon oft geholfen. Aber Naaman ist krank. Er hat eine schlimme Hautkrankheit.',
        'In seinem Haus arbeitet ein junges Mädchen. Syrische Soldaten haben es einmal aus dem Land Israel mitgenommen, und nun dient es Naamans Frau. Das Mädchen sagt zu ihr: „Wenn mein Herr doch zu dem Propheten in Samaria ginge! Der würde ihn gesund machen.“',
        'Naaman hört davon. Er geht zu seinem König und erzählt ihm, was das Mädchen aus Israel gesagt hat.'
      ],
      // nur Quiz
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was ist Naaman von Beruf?', options: ['Feldhauptmann', 'Bäcker', 'Hirte'], answer: 0 },
        { q: 'Woher kommt das Mädchen?', options: ['aus dem Land Israel', 'aus Ägypten', 'aus Babylon'], answer: 0 },
        { q: 'Wen soll Naaman nach dem Rat des Mädchens besuchen?', options: ['den Propheten in Samaria', 'den König von Tyrus', 'einen Arzt in Damaskus'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Der Brief und die Geschenke',
      ref: '2. Könige 5,5–10',
      text: [
        'Der König von Syrien sagt: „Zieh hin! Ich schreibe einen Brief an den König von Israel.“ Naaman nimmt zehn Zentner Silber, sechstausend Goldstücke und zehn Festkleider mit. So reist er nach Samaria.',
        'Der König von Israel liest den Brief und erschrickt. „Bin ich Gott?“, ruft er. „Wie soll ich einen Menschen gesund machen?“ Er reißt seine Kleider ein. Doch Elisa hört davon und lässt ihm sagen: „Warum bist du so erschrocken? Lass ihn zu mir kommen. Dann merkt er, dass es einen Propheten in Israel gibt.“',
        'Naaman fährt mit seinen Pferden und Wagen vor Elisas Haus. Elisa kommt nicht heraus. Er schickt einen Boten: „Geh und wasch dich siebenmal im Jordan. Dann wirst du gesund.“'
      ],
      // Spiel: Das Siegel (siegel, neu 5.11.2026)
      task: { kind: 'siegel', hint: 'Dreh das Siegel des Königs, bis es genau in den Abdruck passt. Dann drück es fest.', sealTurn: SIEGEL },
      questions: [
        { q: 'Was schreibt der König von Syrien?', options: ['einen Brief', 'ein Lied', 'ein Gesetz'], answer: 0 },
        { q: 'Wohin fährt Naaman?', options: ['nach Samaria', 'nach Ägypten', 'nach Babel'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Siebenmal im Jordan',
      ref: '2. Könige 5,11–14',
      text: [
        'Naaman wird zornig und fährt weg. „Ich dachte, er kommt zu mir heraus!“, sagt er. „Er soll Gott anrufen, mit der Hand über die kranke Stelle fahren und mich heilen. Sind die Flüsse bei Damaskus nicht besser als alle Wasser in Israel? Dort könnte ich mich auch waschen!“',
        'Da kommen seine Diener zu ihm. „Lieber Vater“, sagen sie, „wenn der Prophet etwas Schweres von dir verlangt hätte, würdest du es tun. Warum nicht dieses Leichte: Wasch dich, dann wirst du gesund?“',
        'Naaman hört auf sie. Er steigt in den Jordan und taucht siebenmal unter, wie der Mann Gottes gesagt hat. Da wird seine Haut wieder rein und weich wie die Haut eines Kindes.'
      ],
      // Spiel: Siebenmal untertauchen (tauchen, neu)
      task: { kind: 'tauchen', hint: 'Tippe, wenn das Wasser ruhig ist. Siebenmal taucht Naaman unter.', dive: TAUCHEN },
      questions: [
        { q: 'Warum wird Naaman zornig?', options: ['Elisa kommt nicht heraus.', 'Der Weg ist zu weit.', 'Das Wasser ist kalt.'], answer: 0 },
        { q: 'Wer redet mit Naaman, damit er hört?', options: ['seine Diener', 'seine Soldaten', 'der König'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Naamans Dank',
      ref: '2. Könige 5,15–19',
      text: [
        'Naaman kehrt mit seinem ganzen Gefolge zu Elisa zurück. Diesmal tritt er vor ihn. „Jetzt weiß ich“, sagt er, „dass es keinen Gott gibt auf der ganzen Erde außer in Israel. Bitte nimm ein Geschenk von mir an.“',
        'Aber Elisa sagt: „So wahr Gott lebt, ich nehme nichts.“ Naaman bittet ihn noch einmal, doch Elisa bleibt dabei.',
        'Da sagt Naaman: „Dann gib mir wenigstens so viel Erde mit, wie zwei Maultiere tragen können. Dein Knecht will keinem anderen Gott mehr opfern, nur noch dem Herrn.“ Elisa sagt zu ihm: „Zieh hin in Frieden!“ Und Naaman fährt mit seinen Wagen nach Hause.'
      ],
      // Spiel: Erde für Naaman (naamanerde, neu 5.11.2026)
      task: { kind: 'naamanerde', hint: 'Lade die Säcke mit Erde auf die zwei Maultiere. Beide sollen gleich viel tragen.', earthLoad: ERDE },
      questions: [
        { q: 'Was erkennt Naaman?', options: ['Es gibt nur in Israel einen Gott.', 'Der Jordan ist ein kalter Fluss.', 'Elisa ist ein reicher Mann.'], answer: 0 },
        { q: 'Was nimmt Elisa von Naaman an?', options: ['nichts', 'das Silber', 'die Festkleider'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was gießt die Frau in die vielen Gefäße?', options: ['Öl', 'Wasser', 'Milch'], answer: 0 },
    { q: 'Was baut die Frau aus Schunem für Elisa?', options: ['ein kleines Zimmer auf dem Dach', 'ein Zelt', 'eine Schule'], answer: 0 },
    { q: 'Wie oft niest der Junge, bevor er die Augen öffnet?', options: ['siebenmal', 'zweimal', 'zehnmal'], answer: 0 },
    { q: 'Was gibt Elisa in den Topf mit dem bitteren Gemüse?', options: ['Mehl', 'Honig', 'Fleisch'], answer: 0 },
    { q: 'Wer rät Naaman, zum Propheten zu gehen?', options: ['ein junges Mädchen aus Israel', 'der König', 'sein Sohn'], answer: 0 },
    { q: 'Wie oft soll sich Naaman im Jordan waschen?', options: ['siebenmal', 'dreimal', 'zehnmal'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of elisa.stages) {
  const file = `audio/abenteuer/elisa/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (oil and bread, the way to Samaria, the Jordan); they follow one another at random
elisa.music = [
  'audio/abenteuer/elisa/musik-oel-v2.mp3',
  'audio/abenteuer/elisa/musik-samaria-v2.mp3',
  'audio/abenteuer/elisa/musik-jordan-v2.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(elisa, elisaEn)
