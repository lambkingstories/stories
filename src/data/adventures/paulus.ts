/**
 * Abenteuer "Paulus" (Apostelgeschichte 9–18) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Vom Verfolger zum Boten". Entstanden nach dem Skill "LambKing Abenteuer Skill", Nr. 31 der Gesamtreise (Teil 1; Teil 2 ist Nr. 32 "Bis nach Rom").
 * Jesus ist nie im Bild (vor Damaskus nur Licht vom Himmel). Gott der Vater, Engel, der Heilige Geist als Gestalt und Lichtgestalten sind nie im Bild; der Mann aus Mazedonien nur im Text (Bild 6b: Paulus schläft).
 * Stephanus nur in einem Satz (Etappe 1); Schläge und Gefängnis in Philippi werden ruhig erzählt (Etappe 8, nur Fragen).
 * Quelle der Texte: D:/Claude/Abenteuer-Paulus/ENTWURF_Paulus.md (Luther 1912 von bibeltext.com gelesen, nacherzählt), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 nur Fragen, 2 Durch die Gassen (neu, gerade), 3 Korb abseilen (bekannt), 4 Saulus wiederfinden (neu, wiederfinden),
 * 5 Segel stellen (neu, segel), 6 Türen der Karte (bekannt, weg), 7 Purpur färben (neu, purpur), 8 nur Fragen, 9 Die Werkstatt (neu, werkstatt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/paulus/, images/abenteuer/spiele/paulus/<spiel>/, audio/abenteuer/paulus/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Paulus/tools/bauen_paulus.py: nicht von Hand ändern.
 */
import type { Journey, LowerGame, WayGame } from '@/types/adventure'
import type { RefindGame, SailGame, StreetGame } from '@/utils/paulusNeuA'
import type { DyeGame, TentShopGame } from '@/utils/paulusNeuB'
import { josef } from './josef'
import { PAULUS_PATH } from './paulusPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { paulusEn } from './en/paulus.en'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/paulus/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/paulus/'

const G = 'images/abenteuer/spiele/paulus/'

/**
 * Etappe 2, "Durch die Gassen" (neu, `gerade`, Apg 9,11.17): Damaskus von oben (3:4), unten das Haus des Hananias, oben die Gerade und das Haus des Judas. Esel, Kamele, Ochsenkarren, Träger
 * und eine kleine Herde ziehen quer über die Gassen; Hananias geht Platz für Platz hinauf, nur in eine Lücke. Nie ein Zusammenstoß: das Tier bleibt stehen, der Treiber hebt die Hand, Hananias tritt zurück.
 * Runde 1: zwei Querstraßen und die Gerade, langsam; Runde 2: vier Querstraßen in beiden Richtungen, auf der Geraden zwei Spuren. Abschlussbild `sehen` (Hananias legt Saulus die Hände auf).
 * Linien (Fußlinien der Pflasterstreifen von `stadt`) und Breiten am gemalten Bild gemessen (tools/_massen_paulus.json; `core` = bemalter Anteil der Spritebreite). Bilder: `gerade/stadt`, `esel`, `kamel`, `karren`, `traeger`, `ziegen`, `hananias-steht`, `hananias-geht`, `luecke`, `sehen`.
 * Verkehr, Tiere und Stadtplan sind Ausgestaltung; die Bibel nennt nur die Gasse „die Gerade“ und das Haus des Judas.
 */
const GERADE: StreetGame = {
  city: `${G}gerade/stadt.webp`,
  things: [
    { id: 'esel', image: `${G}gerade/esel.webp`, w: 28, core: 0.52 },
    { id: 'kamel', image: `${G}gerade/kamel.webp`, w: 28, core: 0.62 },
    { id: 'karren', image: `${G}gerade/karren.webp`, w: 28, core: 0.7 },
    { id: 'traeger', image: `${G}gerade/traeger.webp`, w: 28, core: 0.72 },
    { id: 'ziegen', image: `${G}gerade/ziegen.webp`, w: 22, core: 0.97 }
  ],
  walker: { stand: `${G}gerade/hananias-steht.webp`, walk: `${G}gerade/hananias-geht.webp` },
  walkerW: 13.5,
  walkerCore: 0.55,
  walkerX: 50,
  gapLight: `${G}gerade/luecke.webp`,
  finale: `${G}gerade/sehen.webp`,
  stepMs: 500,
  rounds: [
    {
      hint: 'Führe Hananias über die Gassen zum Haus des Judas. Geh nur, wenn der Weg frei ist.',
      lanes: [
        { y: 78.7, dir: 1, speed: 7, items: ['esel', 'karren'], gap: 34, offset: 0 },
        { y: 46.9, dir: -1, speed: 8, items: ['kamel', 'ziegen'], gap: 34, offset: 20 },
        { y: 22.5, dir: 1, speed: 7, items: ['traeger', 'esel'], gap: 36, offset: 40 }
      ],
      safe: [94, 68, 39, 9.5]
    },
    {
      hint: 'Jetzt sind es mehr Gassen, und die Tiere kommen von beiden Seiten. Auf der Geraden gibt es zwei Spuren.',
      lanes: [
        { y: 78.7, dir: 1, speed: 9, items: ['esel', 'karren', 'ziegen'], gap: 32, offset: 0 },
        { y: 61.8, dir: -1, speed: 10, items: ['kamel', 'traeger'], gap: 34, offset: 30 },
        { y: 46.9, dir: 1, speed: 11, items: ['karren', 'esel', 'kamel'], gap: 32, offset: 15 },
        { y: 32.8, dir: -1, speed: 9, items: ['ziegen', 'esel', 'traeger'], gap: 32, offset: 45 },
        { y: 22.5, dir: 1, speed: 12, items: ['kamel', 'traeger', 'esel'], gap: 34, offset: 10 },
        { y: 17.5, dir: -1, speed: 10, items: ['karren', 'ziegen'], gap: 34, offset: 60 }
      ],
      safe: [94, 68, 54, 39, 27.5, 9.5]
    }
  ]
}

/**
 * Etappe 3, "Korb abseilen" (bekannt 1, `abseilen` wie bei Rahab, Apg 9,25): die Stadtmauer von Damaskus bei Nacht; statt der Männer am roten Seil hängt der Korb mit Saulus am Seil.
 * Halten = der Korb sinkt; kommt die Wache mit der Fackel unten vorbei, loslassen. Dass eine Wache an der Mauer entlanggeht, ist Ausgestaltung (die Bibel: sie bewachten die Tore, 9,24).
 * Tempo und Runden wie bei Josua (Runde 2: die Wache kommt zweimal). Fenster (Laterne) am gemalten Bild gemessen; `ground` 99, weil der Korb nur 65 % der Spritehöhe füllt (Korbboden bei etwa 85 %, am Fuß der Mauer). Bilder: `abseilen/mauer`, `korb-am-seil-a`, `korb-am-seil-b`, `wache`.
 * Die Sätze des Feldes und des Endes stehen in `texts` (Saulus im Korb), nicht die von Josua (rotes Seil, Männer).
 */
const ABSEILEN: LowerGame = {
  background: `${G}abseilen/mauer.webp`,
  men: [
    { id: 'a', image: `${G}abseilen/korb-am-seil-a.webp`, w: 16 },
    { id: 'b', image: `${G}abseilen/korb-am-seil-b.webp`, w: 16 }
  ],
  guard: `${G}abseilen/wache.webp`,
  window: [13, 14],
  ground: 99,
  road: 94,
  guardSpeed: 12,
  lightRadius: 16,
  warnLead: 24,
  knots: 4,
  rounds: [
    { hint: 'Halte das Seil gedrückt, dann sinkt der Korb. Lass los, wenn die Wache kommt.', man: 'a', descentMs: 8000, passes: 1, gapMs: 1500 },
    { hint: 'Noch einmal hinab, und jetzt kommt die Wache zweimal.', man: 'b', descentMs: 15000, passes: 2, gapMs: 1500 }
  ],
  texts: { field: 'Die Stadtmauer von Damaskus: Der Korb wird hinabgelassen', done: 'Saulus ist sicher unten.' }
}

/**
 * Etappe 4, "Saulus wiederfinden" (neu, `wiederfinden`, Apg 11,25–26): erst zeigt ein gemalter Rahmen Saulus (4 bzw. 3 Sekunden), dann gehen Leute durch eine Gasse in Tarsus am Fluss.
 * Drei sehen ihm sehr ähnlich (grauer Bart, brauner Mantel, weißer Turban), drei ganz anders. Das Kind tippt Saulus an; Barnabas hat ihn gefunden (Bild `gefunden`). Wie Barnabas suchte, sagt die Bibel nicht.
 * Reihen und Breiten am gemalten Bild gesetzt (tools/_massen_paulus.json). Bilder: `wiederfinden/tarsus`, `barnabas`, `erinnerung-rahmen`, `saulus-bild`, die sieben Leute, `gefunden`.
 */
const WIEDER: RefindGame = {
  street: `${G}wiederfinden/tarsus.webp`,
  barnabas: `${G}wiederfinden/barnabas.webp`,
  frame: `${G}wiederfinden/erinnerung-rahmen.webp`,
  portrait: `${G}wiederfinden/saulus-bild.webp`,
  found: `${G}wiederfinden/gefunden.webp`,
  people: [
    { id: 'saulus-geht', image: `${G}wiederfinden/saulus-geht.webp`, name: 'Ein Mann mit schwarzem Bart und grauem Mantel, ohne Kopfbedeckung', saul: true },
    { id: 'mann-1', image: `${G}wiederfinden/mann-1.webp`, name: 'Ein Mann mit grauem Bart und grauem Mantel' },
    { id: 'mann-2', image: `${G}wiederfinden/mann-2.webp`, name: 'Ein Mann mit schwarzem Bart und braunem Mantel' },
    { id: 'mann-3', image: `${G}wiederfinden/mann-3.webp`, name: 'Ein Mann mit schwarzem Bart, grauem Mantel und weißem Turban' },
    { id: 'mann-4', image: `${G}wiederfinden/mann-4.webp`, name: 'Ein dicker Händler in einem gestreiften Gewand' },
    { id: 'frau-1', image: `${G}wiederfinden/frau-1.webp`, name: 'Eine Frau mit einem Wasserkrug' },
    { id: 'kind-1', image: `${G}wiederfinden/kind-1.webp`, name: 'Ein Junge mit einem Korb voll Feigen' }
  ],
  lanes: [{ y: 86, dir: 1 }, { y: 96, dir: -1 }],
  personW: 14,
  barnabasW: 14,
  rounds: [
    {
      hint: 'Merk dir, wie Saulus aussieht. Tippe ihn an, wenn er in Tarsus vorbeikommt.',
      show: 4000,
      again: 2500,
      walkers: [
        { id: 'mann-1', lane: 0, at: 0, dur: 9000 },
        { id: 'frau-1', lane: 0, at: 2600, dur: 9000 },
        { id: 'saulus-geht', lane: 0, at: 5200, dur: 9000 },
        { id: 'mann-2', lane: 0, at: 7800, dur: 9000 }
      ]
    },
    {
      hint: 'Jetzt gehen mehr Leute vorbei, in zwei Reihen. Drei sehen Saulus sehr ähnlich.',
      show: 3000,
      again: 2500,
      walkers: [
        { id: 'mann-1', lane: 0, at: 0, dur: 8000 },
        { id: 'mann-2', lane: 1, at: 1200, dur: 8500 },
        { id: 'mann-3', lane: 0, at: 2400, dur: 8000 },
        { id: 'frau-1', lane: 1, at: 3800, dur: 8500 },
        { id: 'saulus-geht', lane: 0, at: 4800, dur: 8000 },
        { id: 'mann-4', lane: 1, at: 6400, dur: 8500 },
        { id: 'kind-1', lane: 0, at: 7200, dur: 8000 }
      ]
    }
  ]
}

/**
 * Etappe 5, "Segel stellen" (neu, `segel`, Apg 13,4): das Meer von oben, in der Mitte das Schiff mit Barnabas, Saulus und Johannes; das Segel dreht sich um den Mast (ziehen, Knöpfe oder Pfeiltasten).
 * Steht es im Wind (bis 25 Grad daneben): voll und schnell; bis 50 Grad halb; sonst schlaff. Länger als drei Sekunden schlaff = ein Fehler (einmal je Wind). Runde 1 drei Windwechsel, Runde 2 fünf und zwei Böen.
 * Abschlussbild `zypern` (Hafen von Salamis, 13,5). Wind, Segelstellung und Hafen sind Ausgestaltung. Mast, Segel und Drehwinkel am gemalten Bild gemessen (tools/_massen_paulus.json).
 * Bilder: `segel/meer`, `schiff`, `segel-voll`, `segel-halb`, `segel-schlaff`, `wimpel`, `welle`, `moewe`, `leiste`, `schiffchen`, `zypern`.
 */
const SEGEL: SailGame = {
  sea: `${G}segel/meer.webp`,
  ship: `${G}segel/schiff.webp`,
  sails: { full: `${G}segel/segel-voll.webp`, half: `${G}segel/segel-halb.webp`, slack: `${G}segel/segel-schlaff.webp` },
  pennant: `${G}segel/wimpel.webp`,
  wave: `${G}segel/welle.webp`,
  gull: `${G}segel/moewe.webp`,
  strip: `${G}segel/leiste.webp`,
  shipMini: `${G}segel/schiffchen.webp`,
  finale: `${G}segel/zypern.webp`,
  mast: { x: 49.5, y: 26 },
  shipW: 50,
  sailW: 44,
  sailRing: { x: 50.5, y: 7 },
  sailTurn: -180,
  pennantTurn: -90,
  full: 25,
  half: 50,
  slackMs: 3000,
  keyStep: 15,
  warnMs: 1000,
  rounds: [
    { hint: 'Dreh das Segel so, dass der Wind es füllt, und segle nach Zypern.', winds: [{ t: 0, dir: 90 }, { t: 8000, dir: 45 }, { t: 16000, dir: 120 }, { t: 24000, dir: 75 }], gusts: [], duration: 30000 },
    { hint: 'Jetzt dreht der Wind öfter. Bei einer Windbö musst du nichts drehen.', winds: [{ t: 0, dir: 60 }, { t: 6000, dir: 120 }, { t: 12000, dir: 45 }, { t: 18000, dir: 150 }, { t: 24000, dir: 90 }, { t: 30000, dir: 30 }], gusts: [9000, 21000], duration: 36000 }
  ]
}

/**
 * Etappe 6, "Türen der Karte" (bekannt 2, `weg` wie bei Josef und Salomo, Apg 16,6–11): drei Gabelungen in der Ansicht der Wanderer (Paulus, Silas, Timotheus von hinten).
 * 1 Galatien: links der Weg nach Asien mit geschlossenem Holztor, rechts offen nach Mysien; 2 Mysien: links hinab nach Troas, rechts nach Bithynien mit geschlossenem Tor;
 * 3 Troas: drei Wege, in der Mitte der Steg zum Schiff nach Mazedonien. Das Tor ist ein Bild für „ward ihnen gewehrt“ (16,6–7), kein Licht, keine Gestalt.
 * Bilder: `weg/gabelung-1..3`, `wanderer`.
 */
const WEG: WayGame = {
  walker: `${G}weg/wanderer.webp`,
  texts: {
    hint: 'Gabelung {n} von {total}: Such den Weg, der offen ist.',
    right: 'Dieser Weg ist offen.',
    wrong: 'Hier lässt der Geist sie nicht weiter. Such den anderen Weg.',
    done: 'Troas! Und nun hinüber nach Mazedonien.'
  },
  scenes: [
    { image: `${G}weg/gabelung-1.webp`, goal: 'right' },
    { image: `${G}weg/gabelung-2.webp`, goal: 'left' },
    { image: `${G}weg/gabelung-3.webp`, goal: 'middle', paths: 3 }
  ]
}

/**
 * Etappe 7, "Purpur färben" (neu, `purpur`, Apg 16,14): Lydias Hof am Fluss; zwei Bottiche (links rot-violett, rechts blau-violett), der linke rund mit einer Tonschale als Zeichen, der rechte eckig mit einem Holztäfelchen (nicht nur Farbe; keine Schnecken, Entscheidung der Leitung).
 * Ein weißes Tuch wird eingetaucht, bis es dem Muster des Kunden gleicht; je Bottich höchstens zweimal, jedes Eintauchen ist endgültig. Runde 1: zwei Muster aus einem Bottich; Runde 2: drei gemischte.
 * Alle neun Farben des Tuchs sind EIN gemalter Bogen (`tuch-rXbY`, `muster-rXbY`); die App färbt nichts. Lydia ist Purpurkrämerin (Händlerin); das Färben in ihrem Hof ist Ausgestaltung.
 * Lagen am gemalten Bild gesetzt (tools/_massen_paulus.json). Bilder: `purpur/hof`, `tuch-r0b0..r2b2`, `muster-r0b0..r2b2`, `zeichen-rot` (runde Tonschale), `zeichen-blau` (eckiges Holztäfelchen), `kunde-1..3` und `-froh`, `knopf-fertig`.
 */
const PURPUR: DyeGame = {
  yard: `${G}purpur/hof.webp`,
  cloths: [[`${G}purpur/tuch-r0b0.webp`, `${G}purpur/tuch-r0b1.webp`, `${G}purpur/tuch-r0b2.webp`], [`${G}purpur/tuch-r1b0.webp`, `${G}purpur/tuch-r1b1.webp`, `${G}purpur/tuch-r1b2.webp`], [`${G}purpur/tuch-r2b0.webp`, `${G}purpur/tuch-r2b1.webp`, `${G}purpur/tuch-r2b2.webp`]],
  samples: [[`${G}purpur/muster-r0b0.webp`, `${G}purpur/muster-r0b1.webp`, `${G}purpur/muster-r0b2.webp`], [`${G}purpur/muster-r1b0.webp`, `${G}purpur/muster-r1b1.webp`, `${G}purpur/muster-r1b2.webp`], [`${G}purpur/muster-r2b0.webp`, `${G}purpur/muster-r2b1.webp`, `${G}purpur/muster-r2b2.webp`]],
  signs: { red: `${G}purpur/zeichen-rot.webp`, blue: `${G}purpur/zeichen-blau.webp` },
  customers: [
    { image: `${G}purpur/kunde-1.webp`, happy: `${G}purpur/kunde-1-froh.webp`, name: 'Eine Kundin aus Philippi' },
    { image: `${G}purpur/kunde-2.webp`, happy: `${G}purpur/kunde-2-froh.webp`, name: 'Ein Kunde aus Philippi' },
    { image: `${G}purpur/kunde-3.webp`, happy: `${G}purpur/kunde-3-froh.webp`, name: 'Eine alte Kundin aus Philippi' }
  ],
  peg: `${G}purpur/knopf-fertig.webp`,
  vats: { red: { x: 21, y: 85, w: 28 }, blue: { x: 50.5, y: 83, w: 29 } },
  customer: { x: 89, y: 94, w: 15 },
  cloth: { x: 68, y: 56, w: 16 },
  maxDips: 2,
  rounds: [
    { hint: 'Färbe jedes Tuch genau wie das Muster. Jedes Eintauchen macht die Farbe kräftiger.', orders: [{ red: 1, blue: 0, customer: 0 }, { red: 0, blue: 2, customer: 1 }] },
    { hint: 'Jetzt mischt sich die Farbe aus beiden Bottichen. Schau genau auf das Muster.', orders: [{ red: 1, blue: 1, customer: 2 }, { red: 2, blue: 1, customer: 0 }, { red: 1, blue: 2, customer: 1 }] }
  ]
}

/**
 * Etappe 9, "Die Werkstatt" (neu, `werkstatt`, Apg 18,3): die Werkstatt in Korinth mit drei Tischen (zuschneiden bei Aquila, nähen bei Priszilla, Seile bei Paulus); jedes Stück geht der Reihe nach
 * von Tisch zu Tisch und am Ende zu den fertigen Zelten. Runde 1: zwei Stücke nacheinander; Runde 2: vier, bis zu drei zugleich unterwegs. Abschlussbild `sabbat` (18,4).
 * Arbeitsschritte, Werkzeuge und wer an welchem Tisch steht, sind Ausgestaltung; die Bibel sagt „gleiches Handwerk“ (Luther 1912 „Teppichmacher“, KJV „tentmakers“).
 * Lagen am gemalten Bild gesetzt (tools/_massen_paulus.json). Bilder: `werkstatt/werkstatt`, `sabbat`, `tisch-*`, `aquila-*`, `priszilla-*`, `paulus-*`, `stueck-*`, `stoffballen`, `zelt-fertig`.
 */
const WERKSTATT: TentShopGame = {
  shop: `${G}werkstatt/werkstatt.webp`,
  finale: `${G}werkstatt/sabbat.webp`,
  pieces: [`${G}werkstatt/stueck-roh.webp`, `${G}werkstatt/stueck-zugeschnitten.webp`, `${G}werkstatt/stueck-genaeht.webp`, `${G}werkstatt/stueck-fertig.webp`],
  bale: `${G}werkstatt/stoffballen.webp`,
  tent: `${G}werkstatt/zelt-fertig.webp`,
  tables: [
    { id: 'cut', image: `${G}werkstatt/tisch-schneiden.webp`, worker: { a: `${G}werkstatt/aquila-1.webp`, b: `${G}werkstatt/aquila-2.webp`, happy: `${G}werkstatt/aquila-froh.webp` }, name: 'Der Tisch zum Zuschneiden, bei Aquila', x: 30 },
    { id: 'sew', image: `${G}werkstatt/tisch-naehen.webp`, worker: { a: `${G}werkstatt/priszilla-1.webp`, b: `${G}werkstatt/priszilla-2.webp`, happy: `${G}werkstatt/priszilla-froh.webp` }, name: 'Der Tisch zum Nähen, bei Priszilla', x: 51 },
    { id: 'rope', image: `${G}werkstatt/tisch-seile.webp`, worker: { a: `${G}werkstatt/paulus-1.webp`, b: `${G}werkstatt/paulus-2.webp`, happy: `${G}werkstatt/paulus-froh.webp` }, name: 'Der Tisch für die Seile, bei Paulus', x: 72 }
  ],
  workMs: 2000,
  tableY: 92,
  tableW: 19,
  workerW: 14,
  pieceW: 12,
  rounds: [
    { hint: 'Bring jedes Stück zum richtigen Tisch: erst zuschneiden, dann nähen, dann die Seile.', pieces: 2, overlap: false },
    { hint: 'Jetzt kommen vier Stücke, und neuer Stoff kommt schon, wenn der erste Tisch frei ist.', pieces: 4, overlap: true }
  ]
}

export const paulus: Journey = {
  id: 'paulus',
  title: 'Paulus',
  subtitle: 'Vom Verfolger zum Boten',
  age: '8-10',
  downloadMb: 16, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: die Stadtmauer von Damaskus bei Nacht, der Korb mit Saulus am Seil, Mond und Sterne (Konturzeichnung)
  gift: { title: 'Im Korb über die Mauer', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): Damaskus, Jerusalem, Antiochia und Seleuzia, Zypern, Kleinasien und Troas, Philippi (Fluss, Gefängnis), Korinth;
  // Stationen aus ergebnis/panorama/map-paulus.json, Perlenweg aus paulusPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/paulus/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0746, y: 0.4854, d: 0.0339 },
      { x: 0.1300, y: 0.6735, d: 0.0339 },
      { x: 0.2349, y: 0.4248, d: 0.0339 },
      { x: 0.3800, y: 0.5218, d: 0.0339 },
      { x: 0.5131, y: 0.3883, d: 0.0339 },
      { x: 0.6139, y: 0.4988, d: 0.0339 },
      { x: 0.7913, y: 0.6978, d: 0.0339 },
      { x: 0.8760, y: 0.6857, d: 0.0339 },
      { x: 0.9254, y: 0.3762, d: 0.0339 }
    ],
    exam: { x: 0.9819, y: 0.6068, d: 0.0339 },
    path: PAULUS_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Licht auf dem Weg',
      ref: 'Apostelgeschichte 9,1–9',
      text: [
        'In Jerusalem lebt ein junger Mann mit Namen Saulus. Saulus war dabei, als man Stephanus tötete. Danach geht er in die Häuser der Gemeinde, holt Männer und Frauen heraus und bringt sie ins Gefängnis.',
        'Nun will Saulus auch nach Damaskus. Der Hohepriester gibt ihm Briefe mit. Wer dort an Jesus glaubt, den soll Saulus gefesselt nach Jerusalem bringen.',
        'Kurz vor Damaskus umstrahlt ihn plötzlich ein Licht vom Himmel. Saulus fällt auf die Erde und hört eine Stimme: „Saul, Saul, was verfolgst du mich?“ „Herr, wer bist du?“, fragt er. „Ich bin Jesus, den du verfolgst“, sagt die Stimme. „Steh auf und geh in die Stadt. Dort wird man dir sagen, was du tun sollst.“',
        'Die Männer, die mit ihm reisen, stehen starr da. Sie hören die Stimme, aber sie sehen niemanden. Saulus steht auf. Er öffnet die Augen und sieht nichts. Da nehmen sie ihn bei der Hand und führen ihn nach Damaskus. Drei Tage lang kann er nicht sehen, und er isst nichts und trinkt nichts.'
      ],
      // nur Fragen (ernste Wende)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was umstrahlt Saulus kurz vor Damaskus?', options: ['ein Licht vom Himmel', 'ein Feuer aus dem Wald', 'ein Sturm aus der Wüste'], answer: 0 },
        { q: 'Was fragt die Stimme?', options: ['„Saul, Saul, was verfolgst du mich?“', '„Saul, wohin gehst du so früh?“', '„Saul, warum schläfst du hier?“'], answer: 0 },
        { q: 'Wie lange kann Saulus nicht sehen?', options: ['drei Tage', 'sieben Tage', 'einen Tag'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Hananias',
      ref: 'Apostelgeschichte 9,10–19',
      text: [
        'In Damaskus wohnt ein Jünger mit Namen Hananias. In einer Erscheinung ruft ihn der Herr: „Hananias!“ „Hier bin ich, Herr“, antwortet er. „Geh in die Gasse, die die Gerade heißt“, sagt der Herr. „Frag im Haus des Judas nach Saulus aus Tarsus. Er betet. Er hat in einer Erscheinung gesehen, wie ein Mann mit Namen Hananias hereinkommt und die Hand auf ihn legt, damit er wieder sehen kann.“',
        '„Herr“, antwortet Hananias, „ich habe von vielen gehört, wie viel Böses dieser Mann deinen Leuten in Jerusalem getan hat.“ Doch der Herr sagt: „Geh hin! Ich habe ihn ausgewählt. Er soll meinen Namen zu den Völkern tragen, zu Königen und zum Volk Israel.“',
        'Da geht Hananias hin und kommt in das Haus. Er legt Saulus die Hände auf und sagt: „Lieber Bruder Saul, der Herr hat mich gesandt, Jesus, der dir auf dem Weg erschienen ist. Du sollst wieder sehen und mit dem Heiligen Geist erfüllt werden.“',
        'Sofort fällt es Saulus wie Schuppen von den Augen, und er kann wieder sehen. Er steht auf und lässt sich taufen. Dann isst er etwas und kommt wieder zu Kräften.'
      ],
      // Spiel: Durch die Gassen (gerade, neu)
      task: { kind: 'gerade', hint: 'Führe Hananias über die Gassen zum Haus des Judas. Geh nur, wenn der Weg frei ist.', straightStreet: GERADE },
      questions: [
        { q: 'In welche Gasse soll Hananias gehen?', options: ['in die Gasse, die die Gerade heißt', 'in die Gasse am Stadttor', 'in die Gasse der Töpfer'], answer: 0 },
        { q: 'Was fällt Saulus von den Augen?', options: ['etwas wie Schuppen', 'ein dunkles Tuch', 'ein Tropfen Öl'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Im Korb über die Mauer',
      ref: 'Apostelgeschichte 9,19–26',
      text: [
        'Saulus bleibt eine Zeit lang bei den Jüngern in Damaskus. Bald erzählt er in den Synagogen von Jesus: „Er ist Gottes Sohn.“ Alle, die ihn hören, staunen. „Ist das nicht der Mann, der in Jerusalem alle verfolgt hat, die den Namen Jesus anrufen?“',
        'Saulus redet immer kräftiger. Er zeigt den Juden in Damaskus, dass Jesus der Christus ist. Nach vielen Tagen beschließen einige von ihnen, ihn zu töten. Tag und Nacht bewachen sie die Tore der Stadt.',
        'Aber Saulus erfährt von ihrem Plan. In der Nacht nehmen ihn die Jünger mit an die Stadtmauer. Sie setzen ihn in einen Korb und lassen ihn durch eine Öffnung in der Mauer hinab.',
        'Unten steigt Saulus aus dem Korb. Er ist draußen vor der Stadt und macht sich auf den Weg nach Jerusalem.'
      ],
      // Spiel: Korb abseilen (abseilen, bekannt)
      task: { kind: 'abseilen', hint: 'Lass den Korb mit Saulus hinab, aber nur, wenn keine Wache da ist.', lower: ABSEILEN },
      questions: [
        { q: 'Was sagt Saulus in den Synagogen über Jesus?', options: ['Er ist Gottes Sohn.', 'Er ist ein Fischer.', 'Er ist ein Lehrer aus Rom.'], answer: 0 },
        { q: 'Wann bringen die Jünger Saulus an die Mauer?', options: ['in der Nacht', 'am Mittag', 'am frühen Abend'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Barnabas steht zu ihm',
      ref: 'Apostelgeschichte 9,26–30; 11,22–26',
      text: [
        'Saulus kommt nach Jerusalem und möchte zu den Jüngern gehören. Aber sie haben alle Angst vor ihm. Sie glauben nicht, dass er wirklich ein Jünger ist.',
        'Da nimmt Barnabas ihn mit und bringt ihn zu den Aposteln. Er erzählt ihnen, wie Saulus auf dem Weg den Herrn gesehen hat und dass der Herr mit ihm geredet hat. Und er erzählt, wie Saulus in Damaskus mutig im Namen Jesu gepredigt hat. Nun bleibt Saulus bei ihnen und geht in Jerusalem ein und aus. Doch einige wollen ihn töten. Da bringen ihn die Brüder nach Cäsarea und schicken ihn weiter nach Tarsus.',
        'Nach einer Weile schickt die Gemeinde Barnabas nach Antiochia. Dort glauben viele Menschen an den Herrn, und Barnabas freut sich.',
        'Dann zieht Barnabas nach Tarsus, um Saulus zu suchen. Als er ihn findet, nimmt er ihn mit nach Antiochia. Ein ganzes Jahr lang lehren die beiden dort viele Menschen. In Antiochia nennt man die Jünger zum ersten Mal Christen.'
      ],
      // Spiel: Saulus wiederfinden (wiederfinden, neu)
      task: { kind: 'wiederfinden', hint: 'Merk dir, wie Saulus aussieht. Tippe ihn an, wenn er in Tarsus vorbeikommt.', refind: WIEDER },
      questions: [
        { q: 'Wer bringt Saulus zu den Aposteln?', options: ['Barnabas', 'Hananias', 'Stephanus'], answer: 0 },
        { q: 'Wie nennt man die Jünger in Antiochia zum ersten Mal?', options: ['Christen', 'Galiläer', 'Pilger'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Ausgesandt',
      ref: 'Apostelgeschichte 13,1–6.9; 4,36',
      text: [
        'Die Gemeinde in Antiochia hat Propheten und Lehrer. Barnabas und Saulus gehören dazu, und noch drei andere Männer. Einmal dienen sie dem Herrn und fasten, das heißt, sie essen eine Zeit lang nichts. Da sagt der Heilige Geist: „Sondert mir Barnabas und Saulus aus für das Werk, zu dem ich sie berufen habe.“',
        'Die Gemeinde fastet und betet. Dann legen sie den beiden die Hände auf und lassen sie ziehen.',
        'Barnabas und Saulus gehen nach Seleuzia ans Meer. Dort steigen sie auf ein Schiff und segeln zur Insel Zypern. Von dieser Insel kommt Barnabas. Ein Mann mit Namen Johannes ist als Helfer dabei.',
        'In der Stadt Salamis verkündigen sie das Wort Gottes in den Synagogen. Dann ziehen sie über die ganze Insel. Saulus hat noch einen zweiten Namen: Paulus. In der Apostelgeschichte heißt er von da an Paulus.'
      ],
      // Spiel: Segel stellen (segel, neu)
      task: { kind: 'segel', hint: 'Dreh das Segel so, dass der Wind es füllt, und segle nach Zypern.', sailTrim: SEGEL },
      questions: [
        { q: 'Wen soll die Gemeinde für das Werk aussondern?', options: ['Barnabas und Saulus', 'Petrus und Johannes', 'Hananias und Judas'], answer: 0 },
        { q: 'Wohin segeln die beiden?', options: ['zur Insel Zypern', 'nach Ägypten', 'nach Rom'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Der Ruf nach Mazedonien',
      ref: 'Apostelgeschichte 15,40; 16,1–11',
      text: [
        'Einige Zeit später zieht Paulus wieder los, diesmal mit Silas. In der Stadt Lystra kommt ein Jünger mit Namen Timotheus dazu.',
        'Sie wandern durch Phrygien und das Land Galatien. Aber der Heilige Geist will nicht, dass sie in der Provinz Asien das Wort verkündigen. An der Grenze von Mysien wollen sie nach Bithynien reisen. Doch der Geist lässt es nicht zu.',
        'So ziehen sie an Mysien vorbei und kommen hinab nach Troas ans Meer. In der Nacht hat Paulus eine Erscheinung. Ein Mann aus Mazedonien steht da und bittet ihn: „Komm herüber nach Mazedonien und hilf uns!“',
        'Sofort machen sie sich bereit für die Reise. Sie sind gewiss, dass der Herr sie gerufen hat, den Menschen dort die gute Nachricht zu bringen. Von Troas fahren sie mit dem Schiff hinüber.'
      ],
      // Spiel: Türen der Karte (weg, bekannt)
      task: { kind: 'weg', hint: 'Such an jeder Gabelung den Weg, der offen ist.', way: WEG },
      questions: [
        { q: 'Wohin lässt der Geist sie nicht reisen?', options: ['nach Bithynien', 'nach Troas', 'nach Galatien'], answer: 0 },
        { q: 'Worum bittet der Mann aus Mazedonien?', options: ['Komm herüber und hilf uns!', 'Bleib in Troas und ruh dich aus!', 'Geh zurück nach Antiochia!'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Lydia am Fluss',
      ref: 'Apostelgeschichte 16,12–15',
      text: [
        'Paulus und seine Begleiter kommen nach Philippi. Das ist die wichtigste Stadt in diesem Teil von Mazedonien. Einige Tage bleiben sie dort.',
        'Am Sabbat gehen sie vor die Stadt hinaus an den Fluss. Dort kommen Menschen zum Beten zusammen. Paulus und die anderen setzen sich und reden mit den Frauen, die gekommen sind.',
        'Eine von ihnen heißt Lydia. Sie stammt aus der Stadt Thyatira und handelt mit Purpur, einer kostbaren Farbe für Stoffe. Lydia ehrt Gott. Sie hört zu, und der Herr öffnet ihr das Herz. Sie achtet genau auf das, was Paulus sagt.',
        'Lydia lässt sich taufen, zusammen mit allen, die in ihrem Haus leben. Dann bittet sie: „Wenn ihr meint, dass ich an den Herrn glaube, dann kommt in mein Haus und bleibt da.“ Sie lässt nicht nach, bis die Männer mitkommen.'
      ],
      // Spiel: Purpur färben (purpur, neu)
      task: { kind: 'purpur', hint: 'Färbe jedes Tuch genau wie das Muster. Jedes Eintauchen macht die Farbe kräftiger.', dye: PURPUR },
      questions: [
        { q: 'Womit handelt Lydia?', options: ['mit Purpur', 'mit Gewürzen', 'mit Fischen'], answer: 0 },
        { q: 'Wo reden Paulus und die anderen mit Lydia?', options: ['draußen am Fluss', 'auf dem Markt', 'im Hafen'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Lieder um Mitternacht',
      ref: 'Apostelgeschichte 16,16–34',
      text: [
        'In Philippi hat Paulus im Namen Jesu einer Magd geholfen, mit der ihre Herren viel Geld verdient haben. Nun ist es damit vorbei. Da werden die Herren zornig auf Paulus und Silas. Sie bringen die beiden vor die Obersten der Stadt. Die Obersten lassen Paulus und Silas schlagen und ins Gefängnis werfen. Der Aufseher sperrt sie ganz innen ein und legt ihre Füße in einen Holzblock.',
        'Um Mitternacht beten Paulus und Silas und singen Loblieder für Gott. Die anderen Gefangenen hören ihnen zu. Auf einmal kommt ein großes Erdbeben. Der Grund unter dem Gefängnis bebt, alle Türen gehen auf, und allen fallen die Fesseln ab.',
        'Der Aufseher wacht auf und sieht die offenen Türen. Er meint, die Gefangenen seien fort. Doch Paulus ruft laut: „Wir sind alle hier!“ Der Aufseher lässt ein Licht bringen, läuft hinein und fällt zitternd vor Paulus und Silas nieder. „Was muss ich tun, damit ich gerettet werde?“, fragt er.',
        '„Glaube an den Herrn Jesus Christus, so wirst du und dein Haus gerettet“, antworten sie. Noch in der Nacht wäscht er ihnen die Wunden. Er und alle in seinem Haus lassen sich taufen. Dann deckt er ihnen den Tisch und freut sich mit allen in seinem Haus.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was tun Paulus und Silas um Mitternacht?', options: ['Sie beten und singen Loblieder.', 'Sie schlafen fest im Stroh.', 'Sie rufen laut um Hilfe.'], answer: 0 },
        { q: 'Was ruft Paulus dem Aufseher zu?', options: ['„Wir sind alle hier!“', '„Lass uns sofort hinaus!“', '„Bring uns etwas zu essen!“'], answer: 0 },
        { q: 'Was fragt der Aufseher?', options: ['„Was muss ich tun, damit ich gerettet werde?“', '„Wer hat die Türen aufgemacht?“', '„Wann kommt der Morgen?“'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Zeltmacher in Korinth',
      ref: 'Apostelgeschichte 18,1–5',
      text: [
        'Später kommt Paulus in die Stadt Korinth. Dort trifft er einen Juden mit Namen Aquila. Er stammt aus Pontus und ist vor kurzem mit seiner Frau Priszilla aus Italien gekommen. Der Kaiser Klaudius hat nämlich allen Juden befohlen, Rom zu verlassen.',
        'Paulus geht zu den beiden. Aquila und Priszilla sind Zeltmacher, und Paulus hat dasselbe Handwerk. Darum bleibt er bei ihnen, und sie machen zusammen Zelte.',
        'An jedem Sabbat geht Paulus in die Synagoge. Dort redet er mit Juden und Griechen und will sie überzeugen.',
        'Dann kommen Silas und Timotheus aus Mazedonien nach Korinth. Nun bezeugt Paulus den Juden, dass Jesus der Christus ist.'
      ],
      // Spiel: Die Werkstatt (werkstatt, neu)
      task: { kind: 'werkstatt', hint: 'Bring jedes Stück zum richtigen Tisch: erst zuschneiden, dann nähen, dann die Seile.', tentShop: WERKSTATT },
      questions: [
        { q: 'Woher sind Aquila und Priszilla gekommen?', options: ['aus Italien', 'aus Ägypten', 'aus Damaskus'], answer: 0 },
        { q: 'Wann geht Paulus in die Synagoge?', options: ['an jedem Sabbat', 'jeden Morgen', 'einmal im Jahr'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was umstrahlt Saulus kurz vor Damaskus?', options: ['ein Licht vom Himmel', 'ein Regenbogen', 'ein Feuer auf dem Berg'], answer: 0 },
    { q: 'Wer legt Saulus in Damaskus die Hände auf?', options: ['Hananias', 'Barnabas', 'Silas'], answer: 0 },
    { q: 'Wie kommt Saulus aus Damaskus hinaus?', options: ['in einem Korb über die Mauer', 'auf einem Pferd durch das Tor', 'mit einem Schiff über den Fluss'], answer: 0 },
    { q: 'Wer bittet Paulus in der Nacht, nach Mazedonien zu kommen?', options: ['ein Mann aus Mazedonien', 'ein Kapitän aus Troas', 'ein König aus Rom'], answer: 0 },
    { q: 'Was antworten Paulus und Silas dem Aufseher?', options: ['Glaube an den Herrn Jesus Christus.', 'Lass uns frei.', 'Bring uns nach Rom.'], answer: 0 },
    { q: 'Welches Handwerk haben Paulus, Aquila und Priszilla?', options: ['Sie machen Zelte.', 'Sie bauen Schiffe.', 'Sie backen Brot.'], answer: 0 }
  ]
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of paulus.stages) {
  const file = `audio/abenteuer/paulus/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria (the road to Damascus, the sail to Cyprus, by the river at Philippi); they follow one another at random
paulus.music = [
  'audio/abenteuer/paulus/musik-damaskus-v1.mp3',
  'audio/abenteuer/paulus/musik-zypern-v1.mp3',
  'audio/abenteuer/paulus/musik-philippi-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(paulus, paulusEn)
