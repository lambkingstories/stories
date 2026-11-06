/**
 * Abenteuer "Pfingsten" (Apostelgeschichte 1–12) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Ihr werdet meine Zeugen sein" (Apg 1,8). Entstanden nach dem Skill "LambKing Abenteuer Skill", Nr. 30 der Gesamtreise.
 * Jesus mit Gesicht nur in Etappe 1 (ohne Heiligenschein, ohne Lichtkranz). Gott der Vater, Engel, der Heilige Geist als Gestalt und Lichtgestalten sind nie im Bild; Engel nur im Text.
 * Ananias und Saphira (Apg 5) und Stephanus (Apg 6–7) sind nicht aufgenommen; die Gefangenschaft wird ruhig erzählt.
 * Quelle der Texte: D:/Claude/Abenteuer-Pfingsten/ENTWURF_Pfingsten.md (Luther 1912 von bibeltext.com gelesen, nacherzählt), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Bis an das Ende der Erde (neu, zeugen), 2 Jeder hört es (neu, sprachen), 3 Lückenvers (bekannt),
 * 4 Körbe füllen (neu, koerbe), 5 Springen und loben (neu, huepfen), 6 nur Fragen, 7 Den Wagen einholen (neu, wagen), 8 Wimmelbild (bekannt), 9 Durchs Tor spähen (neu, spaehen).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/pfingsten/, images/abenteuer/spiele/pfingsten/<spiel>/, audio/abenteuer/pfingsten/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Pfingsten/tools/bauen_pfingsten.py: nicht von Hand ändern.
 */
import type { FindGame, Journey, VerseGame } from '@/types/adventure'
import type { FillGame, TonguesGame, WitnessGame } from '@/utils/pfingstenNeuA'
import type { ChariotGame, HopGame, PeekGame } from '@/utils/pfingstenNeuB'
import { josef } from './josef'
import { PFINGSTEN_PATH } from './pfingstenPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { pfingstenEn } from './en/pfingsten.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/pfingsten/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/pfingsten/'

const G = 'images/abenteuer/spiele/pfingsten/'

/**
 * Etappe 1, "Bis an das Ende der Erde" (neu, `zeugen`, Apg 1,8): die gemalte Karte von oben (quadratisch), die App legt vier goldene Ringe darüber. Runde 1: die vier Ortsbilder in der
 * Reihenfolge des Verses in die Ringe legen; Runde 2: das Licht von Jerusalem aus Ring für Ring nach außen ziehen und am Rand des nächsten Rings loslassen.
 * Mitte und Ringradien in Prozent (am gemalten Bild gemessen 6.11.2026: tools/_massen_pfingsten.json, Kontrolle ergebnis/kontrolle-masse/zeugen-ringe.jpg). Bilder: `zeugen/karte`, `ring`, `licht`, `ort-*`.
 */
const ZEUGEN: WitnessGame = {
  map: `${G}zeugen/karte.webp`,
  ring: `${G}zeugen/ring.webp`,
  light: `${G}zeugen/licht.webp`,
  centre: { x: 52, y: 47 },
  rings: [13, 25, 36, 46],
  band: 4,
  placeW: 13,
  places: [
    { id: 'ort-jerusalem', image: `${G}zeugen/ort-jerusalem.webp`, name: 'Jerusalem' },
    { id: 'ort-judaea', image: `${G}zeugen/ort-judaea.webp`, name: 'Judäa' },
    { id: 'ort-samarien', image: `${G}zeugen/ort-samarien.webp`, name: 'Samarien' },
    { id: 'ort-ende', image: `${G}zeugen/ort-ende.webp`, name: 'Das Ende der Erde' }
  ],
  rounds: [
    { hint: 'Bring die Botschaft von Jerusalem aus Ring für Ring bis an das Ende der Erde.', mode: 'order' },
    { hint: 'Zieh das Licht bis zum nächsten Ring und lass los.', mode: 'stretch' }
  ]
}

/**
 * Etappe 2, "Jeder hört es" (neu, `sprachen`, Apg 2,5–11): die gemalte Karte der Länder (3:2, ohne Schrift), jedes Land mit einem großen Wahrzeichen; die Gäste aus der Leiste auf ihr Land ziehen.
 * Die sieben Völker sind die des Etappentexts (Parther, Meder, Mesopotamien, Ägypten, Rom, Kreta, Arabien). Runde 1: vier Gäste mit kleinem Heimatbild, Runde 2: alle sieben ohne.
 * Kreise der Länder in Prozent (vorläufig, am gemalten Bild nachmessen: tools/_massen_pfingsten.json). Bilder: `sprachen/karte`, `gast-*`, `heimat-*`, `ohr`.
 */
const SPRACHEN: TonguesGame = {
  map: `${G}sprachen/karte.webp`,
  ratio: 1.5,
  ear: `${G}sprachen/ohr.webp`,
  guestW: 10,
  lands: [
    { id: 'aegypten', x: 14, y: 74, r: 11, home: `${G}sprachen/heimat-aegypten.webp`, name: 'Ägypten' },
    { id: 'kreta', x: 19, y: 43, r: 9, home: `${G}sprachen/heimat-kreta.webp`, name: 'Kreta' },
    { id: 'arabien', x: 78, y: 77, r: 12, home: `${G}sprachen/heimat-arabien.webp`, name: 'Arabien' },
    { id: 'rom', x: 15, y: 14, r: 10, home: `${G}sprachen/heimat-rom.webp`, name: 'Rom' },
    { id: 'mesopotamien', x: 82, y: 43, r: 9, home: `${G}sprachen/heimat-mesopotamien.webp`, name: 'Mesopotamien' },
    { id: 'parther', x: 88, y: 16, r: 9, home: `${G}sprachen/heimat-parther.webp`, name: 'Das Land der Parther' },
    { id: 'meder', x: 53, y: 16, r: 11, home: `${G}sprachen/heimat-meder.webp`, name: 'Das Land der Meder' }
  ],
  guests: [
    { id: 'aegypten', land: 'aegypten', image: `${G}sprachen/gast-aegypten.webp`, name: 'Ein Gast aus Ägypten' },
    { id: 'kreta', land: 'kreta', image: `${G}sprachen/gast-kreta.webp`, name: 'Ein Gast aus Kreta' },
    { id: 'arabien', land: 'arabien', image: `${G}sprachen/gast-arabien.webp`, name: 'Ein Gast aus Arabien' },
    { id: 'rom', land: 'rom', image: `${G}sprachen/gast-rom.webp`, name: 'Ein Gast aus Rom' },
    { id: 'mesopotamien', land: 'mesopotamien', image: `${G}sprachen/gast-mesopotamien.webp`, name: 'Ein Gast aus Mesopotamien' },
    { id: 'parther', land: 'parther', image: `${G}sprachen/gast-parther.webp`, name: 'Ein Gast aus dem Land der Parther' },
    { id: 'meder', land: 'meder', image: `${G}sprachen/gast-meder.webp`, name: 'Ein Gast aus dem Land der Meder' }
  ],
  rounds: [
    { hint: 'Bring jeden Gast zu dem Land, aus dem er kommt.', guests: ['aegypten', 'kreta', 'arabien', 'rom'], showHome: true },
    { hint: 'Jetzt sind es sieben Gäste, und die kleinen Bilder fehlen. Schau auf die Kleider und auf das, was sie in der Hand halten.', guests: ['parther', 'meder', 'mesopotamien', 'aegypten', 'rom', 'kreta', 'arabien'], showHome: false }
  ]
}

/**
 * Etappe 3, "Lückenvers" (bekannt 1, Apg 2,32): der Satz steht wörtlich im Etappentext (Luther 1912 „des sind wir alle Zeugen“ ist dort „dafür sind wir alle Zeugen“). Tafel und Blatt wie in allen
 * Abenteuern (aus `spiele/heilung/lueckenvers/` kopiert, Ostern hat keinen Lückenvers mehr), Hintergrund `hintergrund/vers-hintergrund` (Morgenlicht über den Dächern Jerusalems).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Diesen Jesus hat Gott auferweckt, dafür sind wir alle ', '.'], words: ['Zeugen', 'Kinder', 'Knechte'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Diesen ', ' hat Gott ', ', dafür sind wir alle Zeugen.'], words: ['Jesus', 'auferweckt', 'Mose', 'gesandt'], answers: [0, 1] }
  ]
}

/**
 * Etappe 4, "Körbe füllen" (neu, `koerbe`, Apg 2,45; 4,35): ein Hof in Jerusalem am Abend; die Familien brauchen 1, 2, 3 (Runde 1) bzw. 2, 3, 4, 5 Brote (Runde 2), die Gaben zählen 1, 2, 3 oder 5.
 * Jede Gabe, die mehr bringt, als die Familie braucht, springt zurück (Fehler); Gaben im Korb kann man zurücknehmen. Bilder: `koerbe/hof`, `brot`, `korb-2`, `korb-3`, `korb-5`, `korb-leer`,
 * `familie-1..4` und `-froh`, `zeichen-brot`, `zeichen-leer`.
 */
const KOERBE: FillGame = {
  yard: `${G}koerbe/hof.webp`,
  basket: `${G}koerbe/korb-leer.webp`,
  markFull: `${G}koerbe/zeichen-brot.webp`,
  markEmpty: `${G}koerbe/zeichen-leer.webp`,
  gifts: [
    { size: 1, image: `${G}koerbe/brot.webp`, name: 'Ein Fladenbrot' },
    { size: 2, image: `${G}koerbe/korb-2.webp`, name: 'Ein kleiner Korb' },
    { size: 3, image: `${G}koerbe/korb-3.webp`, name: 'Ein großer Korb' },
    { size: 5, image: `${G}koerbe/korb-5.webp`, name: 'Ein Sack voll Brot' }
  ],
  families: [
    { image: `${G}koerbe/familie-1.webp`, happy: `${G}koerbe/familie-1-froh.webp`, name: 'Die alte Frau' },
    { image: `${G}koerbe/familie-2.webp`, happy: `${G}koerbe/familie-2-froh.webp`, name: 'Der Vater mit seinem Kind' },
    { image: `${G}koerbe/familie-3.webp`, happy: `${G}koerbe/familie-3-froh.webp`, name: 'Die Mutter mit zwei Kindern' },
    { image: `${G}koerbe/familie-4.webp`, happy: `${G}koerbe/familie-4-froh.webp`, name: 'Die große Familie' }
  ],
  rounds: [
    { hint: 'Verteile die Gaben so, dass jede Familie genug hat.', families: [{ family: 0, need: 1 }, { family: 1, need: 2 }, { family: 2, need: 3 }], gifts: [1, 1, 2, 2] },
    { hint: 'Jetzt sind es vier Familien und mehr Gaben. Keine Familie soll zu viel bekommen, und am Ende bleibt nichts übrig.', families: [{ family: 0, need: 2 }, { family: 1, need: 3 }, { family: 2, need: 4 }, { family: 3, need: 5 }], gifts: [1, 1, 2, 2, 3, 5] }
  ]
}

/**
 * Etappe 5, "Springen und loben" (neu, `huepfen`, Apg 3,8): die Tempelmauer von der Seite (3:1, ohne Stufen), die App baut die Treppe aus zwei Stufenbildern (`n` niedrig, `h` hoch, `L` Absatz);
 * kleiner oder großer Sprung je nach der nächsten Stufe, in Runde 2 auf dem Absatz „loben“. Kein Zeitdruck, kein Sturz. Lage der Treppe in Prozent (am Tempelbild gesetzt: endet links vor der Schönen Tür; tools/_massen_pfingsten.json).
 * Bilder: `huepfen/tempel`, `stufe-niedrig`, `stufe-hoch`, `mann-steht`, `mann-springt`, `mann-lobt`, `knopf-klein`, `knopf-gross`, `knopf-loben`.
 */
const HUEPFEN: HopGame = {
  temple: `${G}huepfen/tempel.webp`,
  low: `${G}huepfen/stufe-niedrig.webp`,
  high: `${G}huepfen/stufe-hoch.webp`,
  man: { stand: `${G}huepfen/mann-steht.webp`, jump: `${G}huepfen/mann-springt.webp`, praise: `${G}huepfen/mann-lobt.webp` },
  buttons: { small: `${G}huepfen/knopf-klein.webp`, big: `${G}huepfen/knopf-gross.webp`, praise: `${G}huepfen/knopf-loben.webp` },
  from: 10,
  to: 80,
  unit: 4,
  manH: 28,
  rounds: [
    { hint: 'Spring mit dem Mann die Stufen zum Tempel hinauf.', steps: ['n', 'n', 'h', 'n', 'h', 'n'] },
    { hint: 'Jetzt ist die Treppe länger. Auf einem Absatz bleibt er stehen und lobt Gott.', steps: ['n', 'h', 'n', 'n', 'L', 'h', 'n', 'h', 'L', 'n', 'h', 'n'] }
  ]
}

/**
 * Etappe 7, "Den Wagen einholen" (neu, `wagen`, Apg 8,29–30): die Wüstenstraße nach Gaza von der Seite, zwei endlose Streifen (`fern`, `nah`), der Wagen fährt je nach Tempo vor und zurück.
 * Philippus (ziehen oder Pfeiltasten) bleibt im Lichtfleck am Fenster, bis die Schriftrolle voll ist; vor den Pferden ist ein Fehler. Runde 1 gleichmäßig 8 s, Runde 2 wechselndes Tempo 12 s.
 * Größen und Lagen in Prozent des Feldes (am gemalten Wagen gemessen: Fenster 3–33 %, Pferdeköpfe ab 90 % der Wagenbreite; tools/_massen_pfingsten.json). Bilder: `wagen/fern`, `nah`, `wagen-1`, `wagen-2`, `philippus-1`, `philippus-2`, `zone`, `rolle`, `rolle-offen`, `einsteigen`.
 */
const WAGEN: ChariotGame = {
  far: `${G}wagen/fern.webp`,
  near: `${G}wagen/nah.webp`,
  wagon: [`${G}wagen/wagen-1.webp`, `${G}wagen/wagen-2.webp`],
  runner: [`${G}wagen/philippus-1.webp`, `${G}wagen/philippus-2.webp`],
  zone: `${G}wagen/zone.webp`,
  scroll: `${G}wagen/rolle.webp`,
  scrollOpen: `${G}wagen/rolle-offen.webp`,
  finale: `${G}wagen/einsteigen.webp`,
  wagonW: 42,
  wagonY: 26,
  wagonX: 30,
  swing: 14,
  runnerW: 11,
  runnerY: 8,
  window: { from: 0.03, to: 0.33 },
  horses: 0.9,
  rounds: [
    { hint: 'Lauf mit Philippus neben dem Wagen her und bleib am Fenster.', speed: [{ t: 0, v: 1 }], fill: 8000 },
    { hint: 'Jetzt fährt der Wagen mal schneller, mal langsamer. Bleib am Fenster, aber lauf nicht vor die Pferde.', speed: [{ t: 0, v: 1 }, { t: 3000, v: 1.6 }, { t: 6000, v: 0.6 }, { t: 8000, v: 0.2 }, { t: 9500, v: 1.3 }], fill: 12000 }
  ]
}

/**
 * Etappe 8, "Wimmelbild" (bekannt 2, Apg 10,11–12): das Dach in Joppe mit dem großen Leinentuch voller Tiere (Hochformat 3:4); gesucht werden vier, die nur einmal im Bild vorkommen:
 * ein Kamel, ein Hase, ein Rabe, eine Eidechse (Apg 10,12 nennt keine Arten; Auswahl nach 3. Mose 11, Ausgestaltung). Alle vier sitzen im Tuch, je eine Tuchfalte (`verdecker-1`) deckt ein Tier halb
 * (Krug, Korb und Brüstung sind schon ins Dach gemalt, ihre Sprites werden nicht gebraucht). Lagen am gemalten Bild gesetzt (tools/_massen_pfingsten.json, Kontrolle ergebnis/kontrolle-masse/wimmel.jpg). Bilder: `wimmel/szene`, `figur-1..4`, `verdecker-1`.
 */
const WIMMEL: FindGame = {
  labels: ['Ein Kamel', 'Ein Hase', 'Ein Rabe', 'Eine Eidechse'],
  doneText: 'Du hast alle vier Tiere im großen Tuch gefunden.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 74, y: 57, w: 18 },
    { image: `${G}wimmel/figur-2.webp`, x: 53, y: 21, w: 13 },
    { image: `${G}wimmel/figur-3.webp`, x: 8, y: 32, w: 11 },
    { image: `${G}wimmel/figur-4.webp`, x: 33, y: 47, w: 13 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 81, y: 58.5, w: 12 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 59.5, y: 22, w: 7 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 3, y: 33, w: 8 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 39.5, y: 48.5, w: 9 }
  ]
}

/**
 * Etappe 9, "Durchs Tor spähen" (neu, `spaehen`, Apg 12,13–16): die nächtliche Gasse hinter dem Hoftor, das Tor von innen mit freigestellten Ritzen; Leute gehen vorbei, manche klopfen.
 * Nur bei Petrus tippen. Runde 1: drei breite Ritzen, fünf Leute; Runde 2: fünf schmale Ritzen, acht Leute. Die Bibel sagt, Rhode erkennt Petrus an der Stimme (12,14); das Schauen ist Ausgestaltung des Spiels.
 * Ritzen per Alphakanal am Tor gemessen, Leute 88 % hoch bei 50 % (tools/_massen_pfingsten.json). Bilder: `spaehen/gasse`, `tor-innen-1`, `tor-innen-2`, die Leute, `rhode-horcht`, `rhode-laeuft`, `merkmal-*`, `tor-offen`.
 */
const SPAEHEN: PeekGame = {
  lane: `${G}spaehen/gasse.webp`,
  open: `${G}spaehen/tor-offen.webp`,
  rhode: { listen: `${G}spaehen/rhode-horcht.webp`, run: `${G}spaehen/rhode-laeuft.webp` },
  marks: [`${G}spaehen/merkmal-bart.webp`, `${G}spaehen/merkmal-tunika.webp`, `${G}spaehen/merkmal-mantel.webp`],
  walkMs: 5000,
  wait: 3000,
  personH: 88,
  stopX: 50,
  people: [
    { id: 'petrus', image: `${G}spaehen/petrus.webp`, name: 'Petrus', peter: true },
    { id: 'mann-1', image: `${G}spaehen/mann-1.webp`, name: 'Ein Mann mit Lockenbart und roter Tunika' },
    { id: 'mann-2', image: `${G}spaehen/mann-2.webp`, name: 'Ein Mann ohne Bart mit blaugrauer Tunika und braunem Mantel' },
    { id: 'mann-3', image: `${G}spaehen/mann-3.webp`, name: 'Ein alter Mann mit langem grauem Bart und Stab' },
    { id: 'mann-4', image: `${G}spaehen/mann-4.webp`, name: 'Ein Mann mit Lockenbart und Wasserkrug, ohne Mantel' },
    { id: 'frau-1', image: `${G}spaehen/frau-1.webp`, name: 'Eine Frau mit Kopftuch und Korb' },
    { id: 'junge-1', image: `${G}spaehen/junge-1.webp`, name: 'Ein Junge mit einer kleinen Lampe' }
  ],
  rounds: [
    {
      hint: 'Rhode hört Petrus’ Stimme. Schau mit ihr durch die Ritzen und tippe, wenn er wirklich vor dem Tor steht.',
      gate: `${G}spaehen/tor-innen-1.webp`,
      slits: [{ x: 25, w: 6.3 }, { x: 47, w: 6.3 }, { x: 71.7, w: 6.3 }],
      people: [{ id: 'frau-1' }, { id: 'mann-1', stop: true }, { id: 'junge-1' }, { id: 'mann-2', stop: true }, { id: 'petrus', stop: true }]
    },
    {
      hint: 'Die Ritzen sind schmal. Tippe nur, wenn es wirklich Petrus ist.',
      gate: `${G}spaehen/tor-innen-2.webp`,
      slits: [{ x: 20.9, w: 2.2 }, { x: 34.9, w: 2.2 }, { x: 49.1, w: 2.2 }, { x: 63.2, w: 2.2 }, { x: 77.4, w: 2.2 }],
      people: [{ id: 'junge-1' }, { id: 'mann-3', stop: true }, { id: 'mann-1' }, { id: 'frau-1' }, { id: 'mann-4', stop: true }, { id: 'mann-2', stop: true }, { id: 'mann-1', stop: true }, { id: 'petrus', stop: true }]
    }
  ]
}

export const pfingsten: Journey = {
  id: 'pfingsten',
  title: 'Pfingsten',
  subtitle: 'Ihr werdet meine Zeugen sein',
  age: '8-10',
  downloadMb: 16, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: das große Leinentuch mit vielen Tieren über dem Dach in Joppe am Meer, ohne Menschen (Konturzeichnung)
  gift: { title: 'Das Tuch mit den Tieren', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Ölberg nach Jerusalem (Obergemach, Platz, Häuser, Tempel, Rat), die Straße nach Gaza, Joppe und Cäsarea,
  // zuletzt Jerusalem bei Nacht mit dem Haus der Maria; Stationen aus ergebnis/panorama/map-pfingsten.json, Perlenweg aus pfingstenPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/pfingsten/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1008, y: 0.6189, d: 0.0339 },
      { x: 0.1905, y: 0.5461, d: 0.0339 },
      { x: 0.3145, y: 0.2427, d: 0.0339 },
      { x: 0.3710, y: 0.6553, d: 0.0339 },
      { x: 0.4990, y: 0.6493, d: 0.0339 },
      { x: 0.5665, y: 0.6614, d: 0.0339 },
      { x: 0.7379, y: 0.6917, d: 0.0339 },
      { x: 0.7893, y: 0.3155, d: 0.0339 },
      { x: 0.9002, y: 0.6129, d: 0.0339 }
    ],
    exam: { x: 0.9829, y: 0.5947, d: 0.0339 },
    path: PFINGSTEN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Bis an das Ende der Erde',
      ref: 'Apostelgeschichte 1,3–14',
      text: [
        'Vierzig Tage lang zeigt sich Jesus nach seiner Auferstehung den Aposteln und redet mit ihnen vom Reich Gottes. „Geht nicht fort aus Jerusalem“, sagt er zu ihnen. „Wartet auf das, was der Vater versprochen hat. Johannes hat mit Wasser getauft. Ihr aber sollt mit dem Heiligen Geist getauft werden, nicht lange nach diesen Tagen.“',
        'Dann sagt er: „Ihr werdet die Kraft des Heiligen Geistes empfangen. Und ihr werdet meine Zeugen sein in Jerusalem, in ganz Judäa und Samarien und bis an das Ende der Erde.“',
        'Als er das gesagt hat, wird er vor ihren Augen emporgehoben, und eine Wolke nimmt ihn auf. Während sie ihm nachsehen, stehen zwei Männer in weißen Kleidern bei ihnen. „Ihr Männer von Galiläa, was steht ihr da und seht zum Himmel?“, fragen sie. „Dieser Jesus wird so wiederkommen, wie ihr ihn habt zum Himmel fahren sehen.“',
        'Die Apostel gehen vom Ölberg zurück nach Jerusalem und steigen hinauf ins Obergemach. Dort bleiben sie beieinander und beten, zusammen mit den Frauen, mit Maria, der Mutter Jesu, und mit seinen Brüdern.'
      ],
      // Spiel: Bis an das Ende der Erde (zeugen, neu)
      task: { kind: 'zeugen', hint: 'Bring die Botschaft von Jerusalem aus Ring für Ring bis an das Ende der Erde.', witness: ZEUGEN },
      questions: [
        { q: 'Wovon wird Jesus vor den Augen der Apostel aufgenommen?', options: ['von einer Wolke', 'von einem Feuerwagen', 'von einem Sturmwind'], answer: 0 },
        { q: 'Wer betet mit den Aposteln im Obergemach?', options: ['Maria, die Mutter Jesu', 'Pilatus und seine Frau', 'die Hirten aus Bethlehem'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Pfingsten',
      ref: 'Apostelgeschichte 2,1–13',
      text: [
        'Es ist der Pfingsttag, und die Jünger sind alle beieinander in einem Haus. Auf einmal kommt vom Himmel ein Brausen wie von einem gewaltigen Wind und erfüllt das ganze Haus. Dann erscheinen ihnen Zungen wie von Feuer, die sich verteilen, und auf jeden von ihnen setzt sich eine. Sie werden alle voll des Heiligen Geistes und fangen an, in anderen Sprachen zu reden, so wie der Geist es ihnen gibt.',
        'In Jerusalem wohnen fromme Juden aus vielen Völkern. Als das Brausen zu hören ist, läuft eine große Menge zusammen. Jeder hört die Jünger in seiner eigenen Sprache reden. „Sind das nicht alles Leute aus Galiläa?“, fragen sie verwundert. „Wie kommt es, dass jeder von uns sie in der Sprache hört, in der er geboren ist?“',
        'Da stehen Parther und Meder, Leute aus Mesopotamien und Ägypten, Gäste aus Rom, Kreter und Araber. „Wir hören sie in unseren Sprachen von den großen Taten Gottes reden“, sagen sie.',
        '„Was soll das werden?“, fragen sie einander. Andere aber spotten: „Die sind voll süßen Weins.“'
      ],
      // Spiel: Jeder hört es (sprachen, neu)
      task: { kind: 'sprachen', hint: 'Bring jeden Gast zu dem Land, aus dem er kommt.', tongues: SPRACHEN },
      questions: [
        { q: 'Was erfüllt das ganze Haus?', options: ['ein Brausen wie von einem gewaltigen Wind', 'ein heller Gesang von vielen Leuten', 'ein starker Regen über dem Dach'], answer: 0 },
        { q: 'Was setzt sich auf jeden der Jünger?', options: ['eine Zunge wie von Feuer', 'ein Kranz aus Blumen', 'ein Tropfen aus Öl'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Petrus predigt',
      ref: 'Apostelgeschichte 2,14–41',
      text: [
        'Da tritt Petrus mit den elf anderen Aposteln vor die Menge und ruft laut: „Ihr Leute von Jerusalem, hört mir zu! Diese Männer sind nicht betrunken, es ist ja erst die dritte Stunde des Tages. Hier geschieht, was der Prophet Joel gesagt hat. Gott spricht: Ich will von meinem Geist ausgießen auf alle Menschen.“',
        'Dann erzählt Petrus von Jesus von Nazareth. „Gott hat durch ihn Wunder und Zeichen unter euch getan, das wisst ihr selbst. Ihr habt ihn gekreuzigt. Diesen Jesus hat Gott auferweckt, dafür sind wir alle Zeugen. Nun hat er den Heiligen Geist ausgegossen, wie ihr hier seht und hört.“',
        'Die Worte gehen den Leuten durchs Herz. „Was sollen wir tun?“, fragen sie Petrus und die anderen Apostel. „Kehrt um“, antwortet Petrus, „und jeder von euch lasse sich taufen auf den Namen Jesu Christi zur Vergebung der Sünden. Dann werdet ihr die Gabe des Heiligen Geistes empfangen. Dieses Versprechen gilt euch und euren Kindern und allen, die fern sind.“',
        'Viele nehmen sein Wort gern an und lassen sich taufen. An diesem Tag kommen etwa dreitausend Menschen dazu.'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Was fragen die Leute Petrus und die anderen Apostel?', options: ['Was sollen wir tun?', 'Wo ist euer Haus?', 'Wann kommt der König?'], answer: 0 },
        { q: 'Wie viele Menschen kommen an diesem Tag dazu?', options: ['etwa dreitausend', 'etwa dreihundert', 'etwa dreißig'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Sie teilen alles',
      ref: 'Apostelgeschichte 2,42–47; 4,32–37',
      text: [
        'Die neue Gemeinde in Jerusalem bleibt fest beieinander. Sie hören, was die Apostel lehren, sie halten Gemeinschaft, sie brechen das Brot und beten. Und durch die Apostel geschehen viele Wunder und Zeichen.',
        'Alle, die glauben, halten zusammen, und was sie haben, gehört allen gemeinsam. Jeden Tag sind sie einmütig im Tempel. In den Häusern brechen sie das Brot und essen miteinander, fröhlich und mit schlichtem Herzen. Sie loben Gott, und das ganze Volk ist ihnen freundlich gesinnt. Und jeden Tag fügt der Herr neue Menschen zur Gemeinde hinzu.',
        'Unter ihnen leidet keiner Mangel. Manche, die Äcker oder Häuser haben, verkaufen sie, bringen das Geld und legen es den Aposteln zu Füßen. Davon bekommt jeder so viel, wie er braucht.',
        'Einer von ihnen heißt Joses, ein Levit von der Insel Zypern. Die Apostel nennen ihn Barnabas, das heißt Sohn des Trostes. Barnabas hat einen Acker. Er verkauft ihn, bringt das Geld und legt es den Aposteln zu Füßen.'
      ],
      // Spiel: Körbe füllen (koerbe, neu)
      task: { kind: 'koerbe', hint: 'Verteile die Gaben so, dass jede Familie genug hat.', fill: KOERBE },
      questions: [
        { q: 'Wo brechen sie das Brot und essen miteinander?', options: ['in den Häusern', 'auf dem Feld', 'im Palast des Königs'], answer: 0 },
        { q: 'Was tut Barnabas mit seinem Acker?', options: ['Er verkauft ihn und bringt das Geld.', 'Er sät Weizen darauf.', 'Er baut ein Haus darauf.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Gold und Silber habe ich nicht',
      ref: 'Apostelgeschichte 3,1–10',
      text: [
        'Eines Nachmittags gehen Petrus und Johannes hinauf zum Tempel. Es ist die neunte Stunde, die Zeit für das Gebet. Am Tor, das die Schöne Tür heißt, sitzt ein Mann, der von Geburt an gelähmt ist. Jeden Tag tragen ihn Leute dorthin. Dort bittet er alle, die in den Tempel gehen, um ein Almosen, eine kleine Gabe. Auch Petrus und Johannes bittet er.',
        'Petrus und Johannes sehen ihn an. „Sieh uns an!“, sagt Petrus. Der Mann sieht sie an und wartet, dass er etwas von ihnen bekommt.',
        '„Gold und Silber habe ich nicht“, sagt Petrus. „Was ich aber habe, das gebe ich dir: Im Namen Jesu Christi von Nazareth steh auf und geh umher!“ Er nimmt ihn bei der rechten Hand und richtet ihn auf. Sofort werden seine Füße und Knöchel fest.',
        'Der Mann springt auf, er kann stehen und gehen. Er geht mit ihnen in den Tempel, läuft umher, springt und lobt Gott. Das ganze Volk sieht ihn, und die Leute staunen. Ist das nicht der Mann, der immer an der Schönen Tür gesessen und gebettelt hat?'
      ],
      // Spiel: Springen und loben (huepfen, neu)
      task: { kind: 'huepfen', hint: 'Spring mit dem Mann die Stufen zum Tempel hinauf.', hop: HUEPFEN },
      questions: [
        { q: 'Wo sitzt der gelähmte Mann jeden Tag?', options: ['an der Schönen Tür des Tempels', 'am Brunnen vor der Stadt', 'am Ufer des Sees'], answer: 0 },
        { q: 'Was hat Petrus nicht?', options: ['Gold und Silber', 'Brot und Wasser', 'Schuhe und Mantel'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Wir können es nicht lassen',
      ref: 'Apostelgeschichte 4,1–31',
      text: [
        'Petrus und Johannes reden noch zum Volk, da kommen die Priester, der Hauptmann des Tempels und die Sadduzäer. Es ärgert sie, dass die Apostel sagen, Jesus sei von den Toten auferstanden. Sie sperren die beiden bis zum Morgen ein.',
        'Am Morgen fragt der Rat: „In welchem Namen habt ihr das getan?“ Petrus ist voll des Heiligen Geistes und antwortet: „Im Namen Jesu Christi von Nazareth steht dieser Mann gesund vor euch. Gott hat Jesus von den Toten auferweckt. Und es ist in keinem andern Heil.“',
        'Der geheilte Mann steht dabei, und keiner kann etwas dagegen sagen. Darum verbieten sie den beiden, je wieder im Namen Jesu zu reden. Doch Petrus und Johannes antworten: „Wir können es ja nicht lassen, von dem zu reden, was wir gesehen und gehört haben.“',
        'Der Rat droht ihnen und lässt sie gehen. Die beiden gehen zu den anderen, und alle beten zusammen: „Herr, sieh ihr Drohen an und gib deinen Knechten, dass sie dein Wort ohne Furcht reden.“ Da bewegt sich der Ort, an dem sie versammelt sind. Sie werden voll des Heiligen Geistes und reden das Wort Gottes frei heraus.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was ärgert die Priester und die Sadduzäer?', options: ['dass die Apostel sagen, Jesus sei auferstanden', 'dass die Apostel im Tempel Brot verkaufen', 'dass die Apostel zu laut singen'], answer: 0 },
        { q: 'Was verbietet der Rat den beiden?', options: ['im Namen Jesu zu reden', 'in den Tempel zu gehen', 'miteinander das Brot zu brechen'], answer: 0 },
        { q: 'Was antworten Petrus und Johannes?', options: ['Wir können es nicht lassen, davon zu reden.', 'Wir wollen ab jetzt schweigen.', 'Wir gehen zurück nach Galiläa.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Philippus und der Kämmerer',
      ref: 'Apostelgeschichte 8,26–40',
      text: [
        'Philippus erzählt in einer Stadt in Samarien von Christus. Eines Tages schickt ihn der Engel des Herrn nach Süden, auf die einsame Straße von Jerusalem nach Gaza.',
        'Dort fährt ein Kämmerer aus Äthiopien in seinem Wagen, der Schatzmeister der Königin Kandake. Er kommt vom Anbeten aus Jerusalem und liest im Propheten Jesaja. Der Geist sagt zu Philippus: „Geh hin und halte dich zu diesem Wagen!“',
        'Philippus läuft hin. „Verstehst du auch, was du liest?“, fragt er. „Wie kann ich, wenn mich niemand anleitet?“, sagt der Kämmerer und lässt ihn aufsteigen. Er liest gerade: „Wie ein Lamm vor seinem Scherer still ist, so hat er seinen Mund nicht aufgetan.“ Von diesem Wort aus erzählt ihm Philippus die gute Nachricht von Jesus.',
        'Sie kommen an ein Wasser. „Was hindert mich, dass ich mich taufen lasse?“, fragt der Kämmerer. „Glaubst du von ganzem Herzen, so kann es geschehen“, sagt Philippus. „Ich glaube, dass Jesus Christus Gottes Sohn ist“, antwortet der Kämmerer. Sie steigen beide ins Wasser, und Philippus tauft ihn. Danach nimmt der Geist des Herrn Philippus fort. Der Kämmerer zieht fröhlich seine Straße.'
      ],
      // Spiel: Den Wagen einholen (wagen, neu)
      task: { kind: 'wagen', hint: 'Lauf mit Philippus neben dem Wagen her und bleib am Fenster.', chariot: WAGEN },
      questions: [
        { q: 'Was liest der Mann in seinem Wagen?', options: ['den Propheten Jesaja', 'die Briefe der Königin', 'eine Liste ihrer Schätze'], answer: 0 },
        { q: 'Was möchte der Kämmerer, als sie an ein Wasser kommen?', options: ['sich taufen lassen', 'die Pferde tränken', 'sich ausruhen und schlafen'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Das Tuch mit den Tieren',
      ref: 'Apostelgeschichte 10',
      text: [
        'In Cäsarea wohnt ein Hauptmann mit Namen Kornelius, der Gott fürchtet. In einer Erscheinung sagt ein Engel Gottes zu ihm: „Lass Simon Petrus aus Joppe holen.“ Kornelius schickt drei Männer los.',
        'Am nächsten Tag betet Petrus in Joppe um die Mittagszeit auf dem Dach. Da sieht er den Himmel offen. Etwas wie ein großes leinenes Tuch wird an vier Zipfeln herabgelassen, voll mit vierfüßigen Tieren, Kriechtieren und Vögeln. „Steh auf, Petrus, schlachte und iss!“, sagt eine Stimme. „O nein, Herr“, antwortet Petrus, „ich habe noch nie etwas Unreines gegessen.“ Die Stimme sagt: „Was Gott rein gemacht hat, das nenne du nicht unrein.“ Das geschieht dreimal.',
        'Da stehen schon die Männer des Kornelius vor der Tür. Der Geist sagt zu Petrus: „Geh mit ihnen und zweifle nicht.“',
        'Bei Kornelius in Cäsarea sagt Petrus: „Gott hat mir gezeigt, dass ich niemanden unrein nennen darf.“ Dann hört er Kornelius zu und sagt: „Nun erfahre ich, dass Gott die Person nicht ansieht. In jedem Volk ist ihm angenehm, wer ihn fürchtet und recht tut.“ Während Petrus von Jesus erzählt, kommt der Heilige Geist auf alle, die zuhören. Und Petrus lässt sie taufen.'
      ],
      // Spiel: Wimmelbild (wimmelbild, bekannt)
      task: { kind: 'wimmelbild', hint: 'Finde die Tiere im großen Tuch.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Wer ist Kornelius?', options: ['ein Hauptmann in Cäsarea', 'ein Fischer in Joppe', 'ein Priester im Tempel'], answer: 0 },
        { q: 'Was kommt auf alle, die Petrus zuhören?', options: ['der Heilige Geist', 'ein großer Sturm', 'ein tiefer Schlaf'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Rhode an der Tür',
      ref: 'Apostelgeschichte 12,1–17',
      text: [
        'König Herodes lässt Petrus gefangen nehmen. Vier Gruppen von je vier Soldaten bewachen ihn im Gefängnis. Die Gemeinde aber betet ohne Aufhören für ihn zu Gott.',
        'In der Nacht schläft Petrus zwischen zwei Soldaten, mit zwei Ketten gebunden. Da kommt der Engel des Herrn, und ein Licht scheint in der Zelle. „Steh schnell auf!“, sagt er, und die Ketten fallen von Petrus’ Händen. „Wirf deinen Mantel um und folge mir!“ Petrus folgt ihm und meint, er sehe nur ein Traumbild. Das eiserne Tor zur Stadt geht von selbst auf. Nach einer Gasse ist der Engel fort.',
        'Petrus geht zum Haus von Maria, der Mutter des Johannes Markus, wo viele beten. Er klopft an das Hoftor. Eine Magd mit Namen Rhode horcht. Sie erkennt die Stimme von Petrus, und vor lauter Freude macht sie das Tor nicht auf. Sie läuft hinein und ruft: „Petrus steht vor dem Tor!“ „Du bist nicht bei Sinnen“, sagen die anderen. Aber Rhode bleibt dabei.',
        'Petrus klopft weiter. Als sie endlich aufmachen, können sie es kaum fassen. Er winkt ihnen, still zu sein, und erzählt, wie der Herr ihn aus dem Gefängnis geführt hat.'
      ],
      // Spiel: Durchs Tor spähen (spaehen, neu)
      task: { kind: 'spaehen', hint: 'Rhode hört Petrus’ Stimme. Schau mit ihr durch die Ritzen und tippe, wenn er wirklich vor dem Tor steht.', peek: SPAEHEN },
      questions: [
        { q: 'Was tut die Gemeinde, während Petrus im Gefängnis ist?', options: ['Sie betet ohne Aufhören für ihn.', 'Sie schläft ruhig in ihren Häusern.', 'Sie verlässt heimlich die Stadt.'], answer: 0 },
        { q: 'Warum macht Rhode das Tor nicht auf?', options: ['vor lauter Freude', 'vor lauter Angst', 'weil sie den Schlüssel sucht'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sollen die Apostel empfangen, sagt Jesus vor der Wolke?', options: ['die Kraft des Heiligen Geistes', 'ein großes Haus in Jerusalem', 'ein Schiff für die Reise'], answer: 0 },
    { q: 'Wie hört an Pfingsten jeder in der Menge die Jünger reden?', options: ['in seiner eigenen Sprache', 'nur ganz leise und flüsternd', 'gar nicht, weil es zu laut ist'], answer: 0 },
    { q: 'Was sagt Petrus zu dem gelähmten Mann an der Schönen Tür?', options: ['Gold und Silber habe ich nicht.', 'Komm morgen wieder.', 'Ich habe heute keine Zeit.'], answer: 0 },
    { q: 'Wer liest im Wagen den Propheten Jesaja?', options: ['ein Kämmerer aus Äthiopien', 'ein Hauptmann aus Cäsarea', 'eine Magd aus Jerusalem'], answer: 0 },
    { q: 'Was hat Gott Petrus mit dem Tuch gezeigt?', options: ['dass er niemanden unrein nennen darf', 'dass er wieder Fischer werden soll', 'dass er nach Ägypten reisen soll'], answer: 0 },
    { q: 'Wer erkennt Petrus an der Stimme, als er am Tor klopft?', options: ['Rhode', 'Barnabas', 'Kornelius'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of pfingsten.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9])
for (const s of pfingsten.stages) {
  const file = `audio/abenteuer/pfingsten/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the music of its own is not made yet: until then the general pieces play (journeyFiles puts them into the pack)

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(pfingsten, pfingstenEn)
