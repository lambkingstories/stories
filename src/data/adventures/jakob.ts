/**
 * Abenteuer "Jakob" (1. Mose 25,19–34; 27; 28,10–22; 29–31; 32; 33,1–11; 35; 37,1–4) für 8 bis 10 Jahre: 12 Etappen (Ausbau am 20.10.2026, 1. Mose 25 bis 37), Untertitel "Ein Weg mit Umwegen". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Jakob/ENTWURF_Jakob-v3.md (zweitgeprüft, 90 bis 145 Wörter je Etappe wie bei Noah und Josef, eingebaut am 21.10.2026), Plan: ETAPPENPLAN-v3.md.
 * Deutsche Aufnahmen zu den neuen Texten: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht (die englische App liest mit der Gerätestimme).
 * Die Spielaufgaben der Etappen sind noch die von vor v3 (die Spiele folgen nach SPIELE/ENTWURF-v3.md). Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Die Suppe kochen, bevor Esau kommt (neu), 2 nur Quiz, 3 Treppe zusammenschieben (neu), 4 Brunnen kurbeln (neu),
 * 5 Morgenrot halten (neu), 6 Puzzle (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/jakob/, images/abenteuer/spiele/jakob/<spiel>/, audio/abenteuer/jakob/.
 *
 * STAND 20.10.2026 (Ausbau auf 12 Etappen): Die Etappen 5 bis 9 und 12 haben bis zum Einbau ihrer Spiele und Bilder eine Quiz-Aufgabe (PLATZHALTER) und ein vorhandenes Etappenbild; die Karte (6 Stationen) bleibt unverändert.
 * Davor: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder) und Messwerte sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CairnGame, CatchGame, CrankGame, CycleGame, GuessGame, HoldGame, Journey, RelayGame, RingGame, SlideGame, StewGame } from '@/types/adventure'
import { JAKOB_PATH } from './jakobPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { jakobEn } from './en/jakob.en'

const IMG = 'images/abenteuer/jakob/'
const G = 'images/abenteuer/spiele/jakob/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Die Suppe kochen, bevor Esau kommt" (ersetzt das Zählen; Entwurf SPIELE/ENTWURF-linsensuppe.md, Bildauftrag J35): ein Topf steht auf dem Feuerplatz vor Isaaks Zelt, oben auf dem Weg von den Feldern erscheint
 * der kleine Esau und geht in etwa 32 Sekunden zum Zelt; das Kind tippt Linsen, Wasser und zweimal Holz an (oder zieht sie auf den Topf), in freier Reihenfolge, bis die Suppe dampft. Eine Runde, kein Fehler, nichts geht verloren:
 * ist Esau zuerst da, beginnt alles nach zwei Sekunden von vorn, und Esau geht dann sechs Sekunden langsamer (höchstens 50). Dass die Suppe fertig sein soll, bevor Esau kommt, ist eine Spielidee (steht nicht in der Bibel).
 * Bilder (J35, noch nicht gemalt, 21.10.2026): `suppe/szene.webp` (3 : 4, ohne Figuren), `topf-leer`, `topf-linsen`, `topf-wasser`, `topf-suppe`, `scheite`, `flamme`, `dampf`, `linsenschale`, `wasserkrug`, `holz`, `esau` (alle
 * außer der Szene transparent). Bis sie da sind, zeigt das Spiel einfarbige Platzhalter (`GameImage`, Ordner in `NOT_PAINTED_YET`). VORLÄUFIGE Lagen (Prozent der Szene): Topf, Quellen und Esaus Weg nach dem Entwurf; am fertigen Bild zu messen.
 */
const SUPPE: StewGame = {
  hint: 'Koche die Suppe, bevor Esau da ist: tippe Linsen, Wasser und Holz an.',
  scene: `${G}suppe/szene.webp`,
  pot: { empty: `${G}suppe/topf-leer.webp`, lentils: `${G}suppe/topf-linsen.webp`, water: `${G}suppe/topf-wasser.webp`, soup: `${G}suppe/topf-suppe.webp` },
  logs: `${G}suppe/scheite.webp`,
  flame: `${G}suppe/flamme.webp`,
  steam: `${G}suppe/dampf.webp`,
  sources: {
    bowl: { image: `${G}suppe/linsenschale.webp`, at: [18, 88] },
    jug: { image: `${G}suppe/wasserkrug.webp`, at: [50, 90] },
    wood: { image: `${G}suppe/holz.webp`, at: [82, 88] }
  },
  esau: `${G}suppe/esau.webp`,
  potAt: [50, 66],
  path: [[82, 10], [72, 17], [76, 26], [64, 33], [54, 39], [42, 45], [32, 52]],
  walkMs: 32000,
  slowerMs: 6000,
  maxWalkMs: 50000,
  simmerMs: 2500
}

/**
 * Etappe 3, "Treppe zusammenschieben": das Etappenbild 3 (Nachtlandschaft mit der Himmelsleiter) wird von der App in Kacheln geschnitten und gemischt (`scramble`, mit festem
 * `seed`), eine Kachel fehlt. Plan v3: Runde 1 2 × 2 (drei Kacheln), Runde 2 3 × 2 (fünf Kacheln). Es ist kein Spielbild neu zu malen; das Bild ist das Etappenbild und folgt, wenn es ersetzt wird.
 */
const SCHIEBEN: SlideGame = {
  image: `${IMG}etappe-bild-03.webp`,
  rounds: [
    { hint: 'Schiebe eine Kachel in die freie Lücke.', cols: 2, rows: 2, moves: 8, seed: 7 },
    { hint: 'Jetzt sind es mehr Kacheln.', cols: 3, rows: 2, moves: 14, seed: 11 }
  ]
}

/**
 * Etappe 4, "Brunnen kurbeln": der Brunnen mit einer Kurbel, einem Eimer am Seil und einem Trog (Bildaufträge J10 und J34). Plan v3: Runde 1 ein Eimer, Runde 2 zwei. Der Hintergrund ist die eigene Szene
 * `kurbel/brunnen.webp` (Auftrag J34, gemalt am 21.10.2026). Die Plätze (Kurbelmitte, Seil x und Eimer oben/unten, Trog Mitte x, y und Breite; Prozent der Szene) sind am gemalten Bild
 * abgelesen und mit den Sprites zusammen angesehen (`kurbel-messung-j34-b.json`; Kurbel am linken Pfosten, Eimer unter der Rolle, Trog auf dem freien Boden rechts). Die Sprites `kurbel`, `eimer`, `trog-leer`, `trog-voll` sind die aus J10.
 */
const KURBEL: CrankGame = {
  background: `${G}kurbel/brunnen.webp`,
  crank: `${G}kurbel/kurbel.webp`,
  bucket: `${G}kurbel/eimer.webp`,
  troughEmpty: `${G}kurbel/trog-leer.webp`,
  troughFull: `${G}kurbel/trog-voll.webp`,
  crankAt: [8.5, 36],
  bucketAt: [27.5, 34, 46],
  troughAt: [75, 76, 32],
  rounds: [
    { hint: 'Hole einen Eimer Wasser für die Schafe.', buckets: 1 },
    { hint: 'Jetzt brauchen die Schafe zwei Eimer.', buckets: 2 }
  ]
}

/**
 * Etappe 5, "Morgenrot halten": das Flussufer bei Nacht (Etappenbild 10; VORLÄUFIG noch das alte Flussufer-Bild, bis Codex das neue „Ringen am Fluss“ malt (J05d); danach Lage und Weg des Lichts neu messen; von der App abgedunkelt und aufgehellt) mit einem sanften Licht (Bildauftrag J11); kein Gegner, keine Gestalt.
 * Runde 1 bleibt das Licht stehen (10 Sekunden Halten), Runde 2 wandert es das Ufer entlang (15 Sekunden). Lage und Weg des Lichts sind die Messwerte aus `halten/halten-messung.json` (Prozent des alten Etappenbildes, im Ufersand vor Jakobs Füßen, von links nach rechts).
 */
const HALTEN: HoldGame = {
  background: `${IMG}etappe-bild-10.webp`,
  spark: `${G}halten/funke.webp`,
  start: [22, 89],
  rounds: [
    { hint: 'Lege den Finger auf das Licht und halte es.', seconds: 10 },
    { hint: 'Jetzt wandert das Licht am Ufer: geh mit.', seconds: 15, path: [[22, 89], [29, 92], [36, 94], [43, 95], [50, 95], [57, 95], [64, 94], [71, 93]] }
  ]
}

/**
 * Etappe 5, "Jahreszeiten fortsetzen": eine Reihe von Plätzen, in der die vier Zeichen der Jahreszeiten Jahr für Jahr wiederkehren, einige Plätze sind leer (Bildauftrag J30; Hintergrund = das
 * Etappenbild, von der App weichgezeichnet). Ein Jahr ist eine Reihe von vier Plätzen. Plan v3: Runde 1 zwei Jahre (8 Plätze) mit zwei Lücken in der Mitte, Runde 2 drei Jahre (12 Plätze) mit drei Lücken,
 * die letzte am Ende der Reihe. Zusammen 5 Lücken.
 * Bilder (gemalt, 21.10.2026): `jahre/fruehling.webp`, `sommer.webp`, `herbst.webp`, `winter.webp`, je 160 × 160, transparent.
 */
const JAHRE: CycleGame = {
  background: '',
  tokens: [
    { id: 'fruehling', image: `${G}jahre/fruehling.webp`, label: 'Frühling: ein Zweig mit Blüten' },
    { id: 'sommer', image: `${G}jahre/sommer.webp`, label: 'Sommer: eine Sonne mit Ähren' },
    { id: 'herbst', image: `${G}jahre/herbst.webp`, label: 'Herbst: fallende Blätter' },
    { id: 'winter', image: `${G}jahre/winter.webp`, label: 'Winter: eine Regenwolke mit Tropfen' }
  ],
  rounds: [
    { hint: 'Zwei Jahre vergehen. Welches Zeichen fehlt?', cycle: ['fruehling', 'sommer', 'herbst', 'winter'], length: 8, gaps: [2, 5] },
    { hint: 'Die Jahre vergehen. Setze die fehlenden Zeichen ein, auch am Ende.', cycle: ['fruehling', 'sommer', 'herbst', 'winter'], length: 12, gaps: [6, 9, 11] }
  ]
}

/**
 * Etappe 8, "Steinhaufen zu zweit": Jakob und Laban schieben ihre großen Steine gemeinsam in die Mitte, dort legt sich ein kleiner Stein auf den Haufen (Bildauftrag J32; Hintergrund = das Etappenbild,
 * von der App weichgezeichnet). Plan v3: Runde 1 zwei Steine mit drei Schritten, Runde 2 vier Steine mit drei Schritten. Der kleine Stein ist der große auf die Hälfte verkleinert (kein eigenes Bild).
 * Mitte und Startplätze sind Bildschirm-Prozent der Spielfläche.
 * Bilder (gemalt, 21.10.2026): `bund/stein-links.webp`, `stein-rechts.webp` je 220 × 180, transparent.
 */
const BUND: CairnGame = {
  background: '',
  stoneLeft: `${G}bund/stein-links.webp`,
  stoneRight: `${G}bund/stein-rechts.webp`,
  centre: [50, 72],
  leftStart: [14, 66],
  rightStart: [86, 66],
  rounds: [
    { hint: 'Schiebt die beiden Steine zusammen in die Mitte. Tippe abwechselnd links und rechts.', stones: 2, steps: 3 },
    { hint: 'Noch einmal, jetzt mit vier Steinen.', stones: 4, steps: 3 }
  ]
}

/**
 * Etappe 12, "Zwölferkreis": die Söhne werden auf die Plätze rund um den Altar gestellt (Bildauftrag J33; Hintergrund = das Etappenbild, von der App weichgezeichnet). Plan v3: die Plätze sind als blasse
 * Ringe zu sehen (wie die Stunden einer Uhr, der erste oben), jeder Sohn rastet am nächsten freien Platz ein. Runde 1 vier Söhne (jeder dritte Platz), Runde 2 zwölf. Mitte und Radius sind Bildschirm-Prozent
 * der Spielfläche (der Radius der Breite). Die zwei Söhne `sohn-a` und `sohn-b` werden wechselnd mehrfach benutzt.
 * Bilder (gemalt, 21.10.2026): `kreis/sohn-a.webp`, `sohn-b.webp` je 100 × 160, `kreis/altar.webp` 260 × 200, transparent.
 */
const KREIS: RingGame = {
  background: '',
  altar: `${G}kreis/altar.webp`,
  tokens: [`${G}kreis/sohn-a.webp`, `${G}kreis/sohn-b.webp`],
  centre: [50, 58],
  radius: 22,
  rounds: [
    { hint: 'Stelle die vier Söhne auf die Plätze rund um den Altar.', count: 4, tolerance: 30 },
    { hint: 'Jetzt alle zwölf. Jeder hat seinen Platz.', count: 12, tolerance: 26 }
  ]
}

/**
 * Etappe 6, "Kinder zum Zelt rufen": die Kinder der Familie laufen auf der Wiese umher, ein Tippen schickt eines zum Zelt (Bildauftrag J31; Hintergrund = das Etappenbild, von der App weichgezeichnet).
 * Plan v3: Runde 1 drei Kinder, Runde 2 fünf Kinder (die drei Bilder wechseln sich ab), beide langsam. Das Zelt steht am rechten Rand der Spielfläche, die Wiese ist das untere Drittel (Bildschirm-Prozent).
 * Bilder (gemalt, 21.10.2026): `fangen/kind-1.webp` bis `kind-3.webp`, je 120 × 180, und `fangen/zelt.webp`, transparent.
 */
const FANGEN: CatchGame = {
  background: '',
  kids: [1, 2, 3].map((n) => ({ id: `kind-${n}`, image: `${G}fangen/kind-${n}.webp`, w: 7 })),
  tent: [88, 58],
  tentImage: `${G}fangen/zelt.webp`,
  field: { x: 6, y: 62, w: 70, h: 30 },
  rounds: [
    { hint: 'Tippe die Kinder an. Jedes läuft zum Zelt.', kids: ['kind-1', 'kind-2', 'kind-3'], speed: 0.04 },
    { hint: 'Die Familie wächst. Rufe noch fünf Kinder.', kids: ['kind-1', 'kind-2', 'kind-3', 'kind-1', 'kind-2'], speed: 0.04 }
  ]
}

/**
 * Etappe 9, "Herden mit Abstand losschicken": die Herden ziehen als Geschenke voraus, zwischen zwei Herden soll Raum bleiben (Hintergrund = das Etappenbild, von der App weichgezeichnet). Plan v3:
 * Runde 1 drei Herden (Ziegen, Schafe, Kamele), Runde 2 vier (Ziegen, Schafe, Kamele, Ziegen); Band 25 % und 20 % der Straße, Tempo 0,10 und 0,12. Eine Herde ist ein Trupp aus drei Tieren
 * (`copies: 3`) mit dem vorhandenen Tierbild aus `schaetzen/`; die Straße `road` (Bildschirm-Prozent) malt die App als weiche Linie. Es ist kein Bild neu zu malen.
 */
const STAFFEL: RelayGame = {
  background: '',
  herds: [
    { id: 'ziegen', image: `${G}schaetzen/ziege.webp`, w: 16, copies: 3 },
    { id: 'schafe', image: `${G}schaetzen/schaf.webp`, w: 16, copies: 3 },
    { id: 'kamele', image: `${G}schaetzen/kamel.webp`, w: 18, copies: 3 }
  ],
  road: [[6, 88], [28, 82], [48, 80], [66, 72], [82, 64], [94, 58]],
  rounds: [
    { hint: 'Schicke die Herden nacheinander los. Lass Raum zwischen ihnen.', herds: ['ziegen', 'schafe', 'kamele'], minGap: 25, speed: 0.1 },
    { hint: 'Noch vier Herden. Der Raum darf etwas enger sein.', herds: ['ziegen', 'schafe', 'kamele', 'ziegen'], minGap: 20, speed: 0.12 }
  ]
}

/**
 * Etappe 7, "Herden schätzen": zwei Herden auf der weiten Weide (Hintergrund = das Etappenbild der Etappe, unten gesetzt), Schaf, Ziege und Kamel aus Noah (Kopien unter `schaetzen/`, kein Bild
 * neu zu malen). Plan v3: Runde 1 vergleicht zweimal (welche Herde ist größer), Runde 2 schätzt zweimal (aus drei Bereichen); zusammen 4 Aufgaben; die Tiere stehen nach festem `seed` (immer gleich). Die Weide `region` ist PLATZHALTER,
 * bis die Messdatei des Etappenbildes da ist.
 */
const SCHAETZEN: GuessGame = {
  background: '',
  animals: [
    { id: 'schaf', image: `${G}schaetzen/schaf.webp`, w: 6 },
    { id: 'ziege', image: `${G}schaetzen/ziege.webp`, w: 6 },
    { id: 'kamel', image: `${G}schaetzen/kamel.webp`, w: 8 }
  ],
  region: { x: 8, y: 52, w: 84, h: 40 },
  rounds: [
    {
      hint: 'Welche Herde ist größer? Tippe auf sie.',
      mode: 'compare',
      tasks: [
        { a: { animal: 'schaf', count: 12 }, b: { animal: 'ziege', count: 30 }, seed: 1 },
        { a: { animal: 'ziege', count: 25 }, b: { animal: 'schaf', count: 14 }, seed: 2 }
      ]
    },
    {
      hint: 'Wie viele Tiere sind es etwa? Wähle, was am besten passt.',
      mode: 'range',
      tasks: [
        { a: { animal: 'schaf', count: 11 }, ranges: [[5, 15], [20, 40], [50, 70]], seed: 4 },
        { a: { animal: 'ziege', count: 58 }, ranges: [[5, 15], [20, 40], [50, 70]], seed: 5 }
      ]
    }
  ]
}

export const jakob: Journey = {
  id: 'jakob',
  title: 'Jakob',
  subtitle: 'Ein Weg mit Umwegen',
  age: '8-10',
  downloadMb: 14, // 13,6 MB gezählt am 21.10.2026 mit den neuen Etappenbildern und der Karte v3 (zwei Etappenbilder sind noch die alten bis zu den neuen von Codex)
  medal: `${IMG}medaille.webp`, // Jakob und die Himmelsleiter (Treppe aus Steinen im Sternenlicht)
  // Geschenk-Ausmalbild: Jakob und die Himmelsleiter im Traum (Treppe aus Steinen, Sterne, Tiere der Herde schlafend, friedlich)
  gift: { title: 'Jakob und die Himmelsleiter im Traum', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v3 mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus jakobPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v3-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0232, y: 0.6311, d: 0.0339 },
      { x: 0.1009, y: 0.6189, d: 0.0339 },
      { x: 0.1716, y: 0.5158, d: 0.0339 },
      { x: 0.2352, y: 0.6311, d: 0.0339 },
      { x: 0.323, y: 0.6129, d: 0.0339 },
      { x: 0.437, y: 0.2184, d: 0.0339 },
      { x: 0.4703, y: 0.6493, d: 0.0339 },
      { x: 0.5904, y: 0.3277, d: 0.0339 },
      { x: 0.6712, y: 0.3034, d: 0.0339 },
      { x: 0.7065, y: 0.6129, d: 0.0339 },
      { x: 0.8377, y: 0.2913, d: 0.0339 },
      { x: 0.9104, y: 0.6311, d: 0.0339 }
    ],
    exam: { x: 0.9841, y: 0.3762, d: 0.0339 },
    path: JAKOB_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Zwillinge',
      ref: '1. Mose 25,19–34',
      text: [
        'Isaak und seine Frau Rebekka bekommen Zwillinge. Der Erste ist rot und behaart, er heißt Esau. Der Zweite hält bei der Geburt die Ferse seines Bruders fest, darum nennen sie ihn Jakob.',
        'Die beiden wachsen heran. Esau wird ein Jäger und streift gern über das Feld. Jakob bleibt lieber bei den Zelten.',
        'Eines Tages kommt Esau müde und hungrig heim. Jakob hat gerade rote Linsen gekocht. „Lass mich von dem roten Gericht essen“, bittet Esau, „ich verhungere!“',
        'Jakob antwortet: „Dann verkaufe mir heute dein Erstgeburtsrecht.“ Das ist der besondere Platz des Ältesten in der Familie. „Was nützt es mir, wenn ich verhungere?“, sagt Esau. Er isst, steht auf und geht fort. Sein Vorrecht ist ihm nicht wichtig.'
      ],
      task: { kind: 'suppe', hint: SUPPE.hint, stew: SUPPE },
      questions: [
        { q: 'Was gibt Esau für das Linsengericht her?', options: ['sein Erstgeburtsrecht', 'sein Zelt', 'seinen Bogen'], answer: 0 },
        { q: 'Was hält Jakob bei der Geburt fest?', options: ['die Ferse seines Bruders', 'die Hand seines Vaters', 'den Stab seiner Mutter'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Der Segen',
      ref: '1. Mose 27,1–45',
      text: [
        'Isaak ist alt geworden und kann kaum noch sehen. Er ruft Esau: „Geh auf die Jagd und koche mir mein Lieblingsessen. Dann will ich dich segnen.“',
        'Aber Rebekka hat zugehört. Sie hilft Jakob, sich als Esau zu verkleiden, und schickt ihn mit dem Essen zum Vater.',
        '„Wer bist du?“, fragt Isaak. „Ich bin Esau“, sagt Jakob. Das ist nicht wahr. Isaak tastet nach seinen Händen und wundert sich: „Die Stimme ist Jakobs Stimme, aber die Hände sind Esaus Hände.“ Doch er segnet ihn: Gott soll ihm viel Gutes schenken.',
        'Als Esau heimkommt, versteht er alles und weint laut. Der Segen ist schon vergeben. Esau ist traurig und wütend, und Jakob muss fliehen. Rebekka schickt ihn zu ihrem Bruder Laban. Jakob packt sein Bündel und geht, weit weg von zu Hause.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer kann kaum noch sehen?', options: ['Isaak', 'Laban', 'Esau'], answer: 0 },
        { q: 'Wohin muss Jakob danach gehen?', options: ['zu Laban', 'zu Esau', 'ans Meer'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Die Himmelsleiter',
      ref: '1. Mose 28,10–19',
      text: [
        'Jakob ist allein unterwegs. Als es dunkel wird, legt er sich draußen hin und schiebt sich einen Stein unter den Kopf.',
        'Da träumt er von einer Treppe, die von der Erde bis in den Himmel reicht. Engel Gottes steigen auf ihr hinauf und herab.',
        'Und Gott spricht: „Ich bin der Gott deiner Väter Abraham und Isaak. Dieses Land will ich dir geben. Ich bin mit dir und will dich behüten, wohin du auch gehst. Ich bringe dich wieder heim und verlasse dich nicht.“',
        'Jakob wacht auf. „Wie heilig ist dieser Ort!“, ruft er. „Gott ist hier, und ich habe es nicht gewusst.“ Er stellt den Stein auf, der sein Kopfkissen war, und nennt den Ort Bethel, das heißt Haus Gottes.'
      ],
      task: { kind: 'schieben', hint: 'Schiebe die Kacheln, bis die Treppe zum Himmel wieder ganz ist.', slide: SCHIEBEN },
      questions: [
        { q: 'Was nimmt Jakob als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
        { q: 'Was sagt Gott zu Jakob?', options: ['„Ich bin mit dir.“', '„Geh zurück zu Esau.“', '„Bleib für immer hier.“'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Am Brunnen',
      ref: '1. Mose 29,1–14',
      text: [
        'Jakob erreicht das Land seiner Verwandten. Auf einem Feld liegt ein Brunnen mit einem schweren Stein, und Hirten warten dort mit ihren Schafen. „Wir können den Stein erst wegrollen, wenn alle Herden da sind“, sagen sie.',
        'Da kommt Rahel mit den Schafen ihres Vaters Laban. Jakob stemmt den Stein ganz allein vom Brunnen und tränkt ihre Schafe.',
        'Dann sagt er ihr, wer er ist: „Ich bin dein Verwandter, der Sohn von Rebekka.“ Er küsst sie zur Begrüßung und weint vor Freude. Rahel läuft heim und erzählt es ihrem Vater.',
        'Laban kommt gelaufen, umarmt Jakob und nimmt ihn mit in sein Haus. Nach der langen Wanderung hat Jakob einen Ort gefunden, an dem er bleiben darf.'
      ],
      task: { kind: 'kurbel', hint: 'Drehe die Kurbel mit dem Finger im Kreis.', crank: KURBEL },
      questions: [
        { q: 'Was liegt auf dem Brunnen, den Jakob findet?', options: ['ein schwerer Stein', 'ein Holzdeckel', 'ein Tuch'], answer: 0 },
        { q: 'Wer kommt mit den Schafen zum Brunnen?', options: ['Rahel', 'Lea', 'Rebekka'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Sieben Jahre für Rahel',
      ref: '1. Mose 29,15–30',
      text: [
        'Jakob bleibt bei Laban und hilft ihm bei den Herden. „Du sollst nicht umsonst arbeiten“, sagt Laban. „Was willst du als Lohn?“',
        'Jakob hat Rahel lieb. „Ich diene dir sieben Jahre für Rahel“, sagt er. Laban ist einverstanden. Die sieben Jahre vergehen Jakob wie wenige Tage, so lieb hat er sie.',
        'Dann feiern sie Hochzeit, doch am Morgen merkt Jakob, dass Laban ihn getäuscht hat. Er hat ihm nicht Rahel gegeben, sondern ihre ältere Schwester Lea. „Warum hast du das getan?“, fragt Jakob. „Bei uns heiratet die Ältere zuerst“, sagt Laban.',
        '„Diene mir noch einmal sieben Jahre“, sagt Laban, „dann bekommst du auch Rahel.“ Jakob stimmt zu und bleibt.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'jahre', hint: 'Ziehe die Jahreszeiten in die Lücken, Jahr für Jahr.', cycle: JAHRE },
      questions: [
        { q: 'Wie viele Jahre dient Jakob zuerst für Rahel?', options: ['sieben', 'zwei', 'zwanzig'], answer: 0 },
        { q: 'Wen bekommt Jakob zuerst zur Frau?', options: ['Lea', 'Rahel', 'Rebekka'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Die große Familie',
      ref: '1. Mose 29,31 bis 30,24',
      text: [
        'Jakob hat Rahel lieber als Lea. Aber Gott sieht, dass Lea traurig ist, und schenkt ihr einen Sohn. „Gott hat mein Elend gesehen“, sagt Lea und nennt ihn Ruben.',
        'Danach bekommt sie noch mehr Söhne, und beim vierten ruft sie: „Jetzt will ich Gott danken!“ Er heißt Juda.',
        'Rahel aber hat kein Kind. Das macht sie traurig, denn ihre Schwester hat so viele. Sie wartet und betet, Jahr um Jahr.',
        'Endlich schenkt Gott auch ihr einen Sohn. „Gott hat meine Schande von mir genommen“, sagt Rahel glücklich und nennt ihn Josef. Jakobs Zelte sind nun voller Kinder.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'fangen', hint: 'Tippe die Kinder an, sie laufen zum Zelt.', catch: FANGEN },
      questions: [
        { q: 'Was ruft Lea, als Juda geboren wird?', options: ['„Jetzt will ich Gott danken!“', '„Nun will ich schlafen!“', '„Ich will fortgehen!“'], answer: 0 },
        { q: 'Wie heißt Rahels Sohn?', options: ['Josef', 'Ruben', 'Juda'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-07.webp`,
      title: 'Die Herden wachsen',
      ref: '1. Mose 30,25 bis 31,16',
      text: [
        'Jakob arbeitet viele Jahre bei Laban, und Gott segnet ihn. Er wird sehr reich, und seine Herden mit Schafen, Ziegen und Kamelen werden immer größer.',
        '„Lass mich heimziehen“, bittet er Laban. Doch Laban will ihn nicht gehen lassen, denn er hat gemerkt: Gott segnet ihn wegen Jakob. Jakob sieht es: Bald schaut Laban nicht mehr freundlich.',
        'Da spricht Gott zu Jakob: „Zieh wieder in das Land deiner Väter. Ich will mit dir sein.“',
        'Jakob ruft Rahel und Lea aufs Feld und erzählt es ihnen. „Tu alles, was Gott dir gesagt hat“, sagen die beiden. Da macht sich Jakob bereit.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'schaetzen', hint: 'Vergleiche die Herden und schätze, wie viele Tiere es sind.', guess: SCHAETZEN },
      questions: [
        { q: 'Was bittet Jakob den Laban?', options: ['ihn heimziehen zu lassen', 'ihm mehr Schafe zu geben', 'ihm ein Zelt zu bauen'], answer: 0 },
        { q: 'Was sagt Gott zu Jakob?', options: ['„Zieh wieder in das Land deiner Väter.“', '„Bleibe bei Laban.“', '„Baue eine Stadt.“'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-08.webp`,
      title: 'Der Weg nach Hause',
      ref: '1. Mose 31,17–55',
      text: [
        'Jakob lädt seine Frauen und Kinder auf die Kamele, treibt die Herden zusammen und zieht heimlich los. Laban ist gerade weit weg bei seinen Schafen.',
        'Nach sieben Tagen holt Laban ihn im Bergland ein. Aber in der Nacht davor hat Gott im Traum zu Laban gesprochen: „Hüte dich, hart mit Jakob zu reden!“',
        '„Warum bist du heimlich fortgegangen?“, fragt Laban. „Zwanzig Jahre habe ich dir gedient“, sagt Jakob. „Wäre Gott nicht bei mir gewesen, du hättest mich mit leeren Händen fortgeschickt.“',
        'Dann schließen die beiden Frieden. Sie legen Steine zu einem Haufen auf und essen daneben. „Dieser Haufen sei Zeuge zwischen mir und dir“, sagt Laban. Am nächsten Morgen küsst er seine Töchter und Enkel, segnet sie und zieht heim.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'bund', hint: 'Schiebe die Steine von Jakob und Laban gemeinsam in die Mitte.', cairn: BUND },
      questions: [
        { q: 'Wer spricht im Traum zu Laban?', options: ['Gott', 'Jakob', 'Isaak'], answer: 0 },
        { q: 'Wofür steht der Steinhaufen zwischen Jakob und Laban?', options: ['Er soll Zeuge ihres Friedens sein.', 'Er ist ein Haus für Laban.', 'Er ist ein Grab.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-09.webp`,
      title: 'Engel und Geschenke',
      ref: '1. Mose 32,1–21',
      text: [
        'Jakob zieht weiter. Da begegnen ihm Engel Gottes. „Hier ist Gottes Lager!“, ruft er.',
        'Dann kommen Boten, die er zu seinem Bruder vorausgeschickt hat: „Esau zieht dir entgegen, mit vierhundert Männern.“ Jakob fürchtet sich sehr.',
        'Er betet: „Gott, du hast gesagt, du willst mir Gutes tun. Ich bin zu klein für alles, was du mir geschenkt hast. Errette mich von der Hand meines Bruders!“',
        'Dann sucht Jakob Geschenke für Esau aus: Herden von Ziegen, Schafen und Kamelen. Seine Knechte sollen sie vor ihm hertreiben. „Lasst Raum zwischen einer Herde und der anderen“, sagt er. Vielleicht wird Esau freundlich sein, wenn er die Geschenke sieht.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'staffel', hint: 'Schicke die Herden mit Abstand los.', relay: STAFFEL },
      questions: [
        { q: 'Wem begegnet Jakob unterwegs?', options: ['Engeln Gottes', 'Räubern', 'Hirten'], answer: 0 },
        { q: 'Was tut Jakob, als er von Esaus Männern hört?', options: ['Er betet zu Gott.', 'Er läuft davon.', 'Er baut eine Mauer.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 10,
      image: `${IMG}etappe-bild-10.webp`,
      title: 'Der Kampf am Fluss',
      ref: '1. Mose 32,23–32',
      text: [
        'In der Nacht bringt Jakob seine Familie über den Fluss Jabbok. Er selbst bleibt allein zurück. Da ringt ein Mann mit ihm, bis der Morgen kommt, und berührt dabei seine Hüfte. Seitdem tut sie ihm weh.',
        '„Lass mich los“, sagt der Mann, „der Morgen bricht an.“ „Ich lasse dich nicht“, sagt Jakob, „du segnest mich denn!“',
        '„Du sollst nicht mehr Jakob heißen, sondern Israel“, sagt der Mann, „denn du hast mit Gott und mit Menschen gerungen und nicht aufgegeben.“ Und er segnet ihn.',
        'Die Sonne geht auf. „Ich habe Gott von Angesicht gesehen“, sagt Jakob, „und lebe noch.“ Er geht weiter und hinkt, aber er hat einen neuen Namen und Gottes Segen.'
      ],
      task: { kind: 'halten', hint: 'Halte das Licht fest, bis der Morgen kommt.', hold: HALTEN },
      questions: [
        { q: 'An welchem Fluss ist Jakob in dieser Nacht?', options: ['am Jabbok', 'am Jordan', 'am Nil'], answer: 0 },
        { q: 'Welchen neuen Namen bekommt Jakob?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 11,
      image: `${IMG}etappe-bild-11.webp`,
      title: 'Wiedersehen',
      ref: '1. Mose 33,1–11',
      text: [
        'Am Morgen sieht Jakob Esau kommen, mit vierhundert Männern. Er geht ihm allein voran und verneigt sich tief.',
        'Da läuft Esau ihm entgegen! Er umarmt Jakob, fällt ihm um den Hals und küsst ihn. Beide weinen vor Freude.',
        '„Wer sind die da bei dir?“, fragt Esau, als er die Frauen und Kinder sieht. „Die Kinder, die Gott mir geschenkt hat“, sagt Jakob.',
        'Dann bietet Jakob ihm seine Herden als Geschenk an. „Ich habe genug, mein Bruder“, sagt Esau. Aber Jakob bittet: „Nimm es doch! Dein Gesicht zu sehen ist, als sähe ich Gottes Gesicht, so freundlich bist du zu mir.“ Da nimmt Esau das Geschenk an. Der Streit der Brüder ist vorbei.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Wiedersehen zusammen.', puzzle: { image: `${G}puzzle/wiedersehen.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was tut Esau, als er Jakob sieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er läuft weg.', 'Er schickt ihn fort.'], answer: 0 },
        { q: 'Was bietet Jakob seinem Bruder an?', options: ['seine Herden als Geschenk', 'sein Zelt', 'seinen Stab'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 12,
      image: `${IMG}etappe-bild-12.webp`,
      title: 'Zwölf Söhne',
      ref: '1. Mose 35,1–18; 35,22–26; 37,1–4',
      text: [
        'Gott sagt zu Jakob: „Zieh nach Bethel und baue dort einen Altar.“ Jakob zieht mit seiner ganzen Familie hin und baut dort den Altar. Gott spricht noch einmal zu ihm: „Du sollst Israel heißen.“',
        'Auf dem Weg wird Benjamin geboren, und seine Mutter Rahel stirbt dabei. Jakob ist sehr traurig und stellt einen Stein auf ihr Grab.',
        'Nun hat Jakob zwölf Söhne, und aus ihnen soll ein großes Volk werden, wie Gott es versprochen hat. Am liebsten hat er Josef, den Sohn seines Alters.',
        'Josef ist siebzehn Jahre alt und hütet mit seinen Brüdern die Schafe. Jakob hat ihn so lieb, dass er ihm einen bunten Rock machen lässt.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'kreis', hint: 'Stelle die zwölf Söhne gleichmäßig um den Altar.', ring: KREIS },
      questions: [
        { q: 'Wohin zieht Jakob auf Gottes Wort?', options: ['nach Bethel', 'nach Haran', 'nach Ägypten'], answer: 0 },
        { q: 'Welchen Sohn hat Jakob am liebsten?', options: ['Josef', 'Benjamin', 'Ruben'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Was gibt Esau für einen Teller Linsen her?', options: ['sein Erstgeburtsrecht', 'sein Zelt', 'seinen Bogen'], answer: 0 },
    { q: 'Was nimmt Jakob in Bethel als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
    { q: 'Wen trifft Jakob am Brunnen?', options: ['Rahel', 'Lea', 'Rebekka'], answer: 0 },
    { q: 'Wer spricht im Traum zu Laban?', options: ['Gott', 'Jakob', 'Isaak'], answer: 0 },
    { q: 'Welchen neuen Namen bekommt Jakob am Fluss?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 },
    { q: 'Welchen Sohn hat Jakob am liebsten?', options: ['Josef', 'Benjamin', 'Ruben'], answer: 0 }
  ]

}

// the game of a stage lies on the picture of the stage (it follows when the stage picture is replaced)
for (const s of jakob.stages) {
  const t = s.task
  for (const g of [t.guess, t.cycle, t.cairn, t.ring, t.catch, t.relay]) if (g) g.background = s.image
}

// the German recordings of the stories (voice Achernar, text version 3 = files "-v3"); there are no English ones yet, so the English app reads with the voice of the device
for (const s of jakob.stages) {
  const file = `audio/abenteuer/jakob/geschichte-${String(s.id).padStart(2, '0')}-v3.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (skill `lambking-abenteuer-skill`, ton.md); they follow one another at random
jakob.music = [
  'audio/abenteuer/jakob/musik-brunnen-v1.mp3',
  'audio/abenteuer/jakob/musik-herde-v1.mp3',
  'audio/abenteuer/jakob/musik-reise-v1.mp3'
]

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(jakob, jakobEn)
