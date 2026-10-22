/**
 * Abenteuer "Adam und Eva" (1. Mose 1–3) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Der Garten Eden". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Adam-Eva/ENTWURF_Adam-Eva-v3.md (zweitgeprüft, 90 bis 145 Wörter je Etappe wie bei Noah und Josef, eingebaut am 21.10.2026), Plan: ETAPPENPLAN-v3.md.
 * Deutsche Aufnahmen zu den neuen Texten: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht (die englische App liest mit der Gerätestimme).
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen. Jedes Spiel hat höchstens zwei Runden (Plan v3).
 * Kein Spiel dieses Abenteuers kommt in Josef oder Noah vor (Anton, 20.10.2026): jede Etappe hat ein eigenes, neues Spiel, Etappe 7 ist nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/adam-eva/, images/abenteuer/spiele/adam-eva/<spiel>/, audio/abenteuer/adam-eva/.
 *
 * STAND 21.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte und Musik sind eingebaut, die Etappen sind spielbar. Die Etappenbilder 3 und 4 werden neu gemalt; die Spiele 3 und 4 liegen auf eigenen Szenenbildern und bleiben davon unberührt.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { ChannelGame, EchoGame, HerdGame, Journey, LightGame, MirrorGame, OrderGame, SowGame, VerseGame } from '@/types/adventure'
import { ADAM_EVA_PATH } from './adamEvaPath'
import { CHANNEL_GRID_1, CHANNEL_GRID_2 } from './adamEvaChannels'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { adamEvaEn } from './en/adamEva.en'

const IMG = 'images/abenteuer/adam-eva/'
const G = 'images/abenteuer/spiele/adam-eva/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/** Etappe 1, "Reihenfolge legen": vier Bilder der ersten drei Schöpfungstage in der Reihenfolge der Erzählung (Bildauftrag 08). */
const ORDER: OrderGame = {
  cards: [
    { id: 'licht', image: `${G}reihenfolge/schritt-1.webp`, label: 'Dunkelheit, aus der warmes Licht bricht' },
    { id: 'himmel', image: `${G}reihenfolge/schritt-2.webp`, label: 'Der Himmel über dem Wasser' },
    { id: 'land', image: `${G}reihenfolge/schritt-3.webp`, label: 'Trockenes Land taucht aus dem Meer auf' },
    { id: 'pflanzen', image: `${G}reihenfolge/schritt-4.webp`, label: 'Gras und Bäume wachsen' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['licht', 'himmel', 'pflanzen'] },
    { hint: 'Runde 2: Jetzt ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['licht', 'himmel', 'land', 'pflanzen'] }
  ]
}

/**
 * Etappe 2, "Lichter sammeln": ein helles Bild (Sterne, Mond, Meer, Fische, Vögel), das die App abdunkelt; die 14 Lichter sind Orte in diesem Bild.
 * Die Orte x, y kommen aus `lichter/himmel-messung.json` (Bildauftrag 09, am Bild geprüft; Mond und die fünf größten Sterne in Runde 1, die acht kleinen in Runde 2).
 * w ist die Größe des Tippfelds und des Leuchtens, nicht der gemessene Durchmesser (der Mond misst 22 %, die kleinen Sterne 2,5 %): zwischen 8 und 12 % begrenzt.
 */
const LICHTER: LightGame = {
  scene: `${G}lichter/himmel.webp`,
  rounds: [
    {
      hint: 'Runde 1: Tippe jedes Licht an, das aufleuchtet.',
      together: 1,
      spots: [
        { x: 80.3, y: 12.7, w: 12 }, { x: 14.7, y: 7.8, w: 9 }, { x: 43.9, y: 9.4, w: 8 },
        { x: 21.4, y: 24.7, w: 9 }, { x: 53.9, y: 27.2, w: 8 }, { x: 84.7, y: 31.5, w: 8 }
      ]
    },
    {
      hint: 'Runde 2: Jetzt leuchten mehrere zugleich, und sie sind kleiner.',
      together: 3,
      spots: [
        { x: 9.3, y: 17.4, w: 8 }, { x: 39.7, y: 19.4, w: 8 }, { x: 64.5, y: 22.4, w: 8 }, { x: 12.0, y: 34.0, w: 8 },
        { x: 37.5, y: 32.8, w: 8 }, { x: 61.9, y: 35.1, w: 8 }
      ]
    }
  ]
}

/**
 * Etappe 3, "Hüten": ein Leittier mit seiner Herde; Runde 1 zum Schatten der Bäume, Runde 2 zur Wasserstelle, ein Teich liegt im Weg (Bildauftrag 14).
 * Die Tiere kommen aus den Noah-Bildern (Kopien in `hueten/`). Start, Ruheplatz und Teich sind die Messwerte aus `hueten/wiese-messung.json` (am Bild geprüft): Runde 1 vom
 * freien Stück rechts unten (start1) zum schattigen Hain rechts (ruhe1), Runde 2 von links unten (start2) zum Seeufer links oben (ruhe2), der flache Teich in der Mitte liegt im Weg
 * (Kreis, auf Radius 17 verkleinert; der Ruheplatz des Seeufers ist auf 8,5 vergrößert, damit der Finger ihn gut trifft und der Teich nicht überlappt).
 */
const HUETEN: HerdGame = {
  scene: `${G}hueten/wiese.webp`,
  rounds: [
    {
      hint: 'Runde 1: Ziehe das Leittier zum Ruheplatz. Die anderen folgen ihm.',
      leader: { id: 'schaf', image: `${G}hueten/schaf.webp`, label: 'Schaf', w: 13 },
      followers: [
        { id: 'schaf-2', image: `${G}hueten/schaf.webp`, label: 'Schaf', w: 12 },
        { id: 'schaf-3', image: `${G}hueten/schaf.webp`, label: 'Schaf', w: 12 },
        { id: 'schaf-4', image: `${G}hueten/schaf.webp`, label: 'Schaf', w: 12 }
      ],
      start: { x: 73, y: 81 },
      rest: { x: 71, y: 28.5, r: 9 }
    },
    {
      hint: 'Runde 2: Jetzt liegt ein Teich im Weg. Ziehe das Leittier um den Teich herum zur Wasserstelle.',
      leader: { id: 'hirsch', image: `${G}hueten/hirsch.webp`, label: 'Hirsch', w: 15 },
      followers: [
        { id: 'hirschkuh', image: `${G}hueten/hirschkuh.webp`, label: 'Hirschkuh', w: 14 },
        { id: 'ziege', image: `${G}hueten/ziege.webp`, label: 'Ziege', w: 12 },
        { id: 'schaf', image: `${G}hueten/schaf.webp`, label: 'Schaf', w: 12 },
        { id: 'hirsch-2', image: `${G}hueten/hirsch.webp`, label: 'Hirsch', w: 14 }
      ],
      start: { x: 30, y: 82 },
      rest: { x: 35, y: 29, r: 8.5 },
      obstacle: { x: 47, y: 46.5, r: 17 }
    }
  ]
}

/** Etappe 4, "Kanäle drehen": zwei Gärten (beide 4 x 3, mit zwei und mit drei Pflanzen), siehe `adamEvaChannels.ts`; die Kacheln und Pflanzen kommen aus Bildauftrag 11. */
const KANAELE: ChannelGame = {
  tiles: {
    straight: `${G}kanaele/gerade.webp`,
    corner: `${G}kanaele/kurve.webp`,
    tee: `${G}kanaele/gabel.webp`,
    source: `${G}kanaele/quelle.webp`,
    empty: `${G}kanaele/leer.webp`,
    goal: `${G}kanaele/leer.webp`
  },
  wet: {
    straight: `${G}kanaele/gerade-nass.webp`,
    corner: `${G}kanaele/kurve-nass.webp`,
    tee: `${G}kanaele/gabel-nass.webp`,
    source: `${G}kanaele/quelle-nass.webp`
  },
  goals: {
    feige: { label: 'Feigenbaum', wilted: `${G}kanaele/ziel-feige.webp`, bloom: `${G}kanaele/ziel-feige-bluete.webp` },
    granatapfel: { label: 'Granatapfelbaum', wilted: `${G}kanaele/ziel-granatapfel.webp`, bloom: `${G}kanaele/ziel-granatapfel-bluete.webp` },
    dattel: { label: 'Dattelpalme', wilted: `${G}kanaele/ziel-dattel.webp`, bloom: `${G}kanaele/ziel-dattel-bluete.webp` },
    wein: { label: 'Weinrebe', wilted: `${G}kanaele/ziel-wein.webp`, bloom: `${G}kanaele/ziel-wein-bluete.webp` }
  },
  rounds: [
    { hint: 'Runde 1: Tippe ein Kanalstück an, um es zu drehen. Leite das Wasser zu den Bäumen.', grid: CHANNEL_GRID_1 },
    { hint: 'Runde 2: Der Strom teilt sich. Leite das Wasser zu allen drei Bäumen.', grid: CHANNEL_GRID_2 }
  ]
}

/** Etappe 5, "Lückenvers": Sätze aus dem Text der Etappe; die Wörter sind kurze Blätter (die richtigen zuerst, `answers` zeigt auf sie). Hintergrund ist das Etappenbild 5. */
const VERS: VerseGame = {
  background: `${IMG}etappe-bild-05.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Runde 1: Ziehe das passende Blatt in die Lücke.', parts: ['Gott hat alle ', ' des Feldes und alle Vögel des Himmels gemacht.'], words: ['Tiere', 'Steine', 'Wolken'], answers: [0] },
    { hint: 'Runde 2: Jetzt fehlen zwei Wörter.', parts: ['Adam gibt dem ', ', den ', ' und den wilden Tieren Namen.'], words: ['Vieh', 'Vögeln', 'Fischen', 'Blumen'], answers: [0, 1] }
  ]
}

/** Etappe 6, "Spiegeln": links ein Muster aus Blütensteinen, rechts wird es gespiegelt ergänzt (6 und 9 Steine). Hintergrund ist das Etappenbild 6. */
const SPIEGELN: MirrorGame = {
  background: `${IMG}etappe-bild-06.webp`,
  empty: `${G}spiegeln/leer.webp`,
  stones: [
    { id: 'rot', image: `${G}spiegeln/stein-rot.webp`, label: 'roter Blütenstein (Rose)' },
    { id: 'gelb', image: `${G}spiegeln/stein-gelb.webp`, label: 'gelber Blütenstein (Sonnenblume)' },
    { id: 'blau', image: `${G}spiegeln/stein-blau.webp`, label: 'blauer Blütenstein (Glockenblume)' }
  ],
  rounds: [
    { hint: 'Runde 1: Setze die Blüten so, dass beide Hälften gleich aussehen.', cols: 2, rows: 3, left: [['rot', 'gelb'], ['gelb', 'gelb'], ['rot', 'rot']] },
    { hint: 'Runde 2: Das Muster ist größer und hat mehr Farben.', cols: 3, rows: 3, left: [['rot', 'gelb', 'blau'], ['blau', 'rot', 'gelb'], ['gelb', 'blau', 'rot']] }
  ]
}

/** Etappe 8, "Ruf und Antwort": vier Klangblüten mit vier Tonhöhen (Marimba, Pentatonik); das Leuchten macht die App. Hintergrund ist das Etappenbild 8. */
const RUF: EchoGame = {
  background: `${IMG}etappe-bild-08.webp`,
  notes: [
    { id: 'bluete-1', image: `${G}echo/bluete-1.webp`, rate: 1 },
    { id: 'bluete-2', image: `${G}echo/bluete-2.webp`, rate: 1.1225 },
    { id: 'bluete-3', image: `${G}echo/bluete-3.webp`, rate: 1.2599 },
    { id: 'bluete-4', image: `${G}echo/bluete-4.webp`, rate: 1.4983 }
  ],
  rounds: [
    { hint: 'Runde 1: Höre oder schau gut zu: Der Ruf leuchtet auch. Tippe die Blüten in derselben Reihenfolge an.', calls: [[0, 1, 2], [1, 3, 0, 2]] },
    { hint: 'Runde 2: Der Ruf ist länger. Du kannst ihn jederzeit noch einmal hören und sehen.', calls: [[0, 2, 1, 3], [3, 1, 2, 0, 2]] }
  ]
}

/**
 * Etappe 9, "Säen": Samen im Bogen in die Furchen, in Runde 2 mit Wind (Bildauftrag 13). Die Furchen sind von vorn nach hinten sortiert (die vier nächsten
 * für Runde 1). x, y, w, h sind die Mitte und Größe der sechs langen Furchen aus `saeen/acker-messung.json` (am Bild geprüft); die hinteren drei sind nur 4 bis 5 % hoch,
 * ihre Trefferfläche ist auf 7 % vergrößert (der Samen soll großzügig treffen). Ein Samen sät die Furche an der Stelle, wo er landet.
 */
const SAEEN: SowGame = {
  field: `${G}saeen/acker.webp`,
  bag: `${G}saeen/beutel.webp`,
  seed: `${G}saeen/same.webp`,
  sprout: [`${G}saeen/sproessling-1.webp`, `${G}saeen/sproessling-2.webp`],
  vane: `${G}saeen/fahne.webp`,
  furrows: [
    { id: 'f1', x: 50, y: 78.5, w: 90, h: 9 },
    { id: 'f2', x: 50, y: 66.2, w: 91, h: 7.4 },
    { id: 'f3', x: 50, y: 56.2, w: 91, h: 7 },
    { id: 'f4', x: 50, y: 46.7, w: 90, h: 7 },
    { id: 'f5', x: 50, y: 38.7, w: 89, h: 7 },
    { id: 'f6', x: 50, y: 32.1, w: 87, h: 7 }
  ],
  rounds: [
    { hint: 'Runde 1: Die Furchen sind nah. Ziehe zurück und lass los.', furrows: ['f1', 'f2', 'f3'], wind: 0 },
    { hint: 'Runde 2: Eine Furche mehr, und ein leichter Wind weht.', furrows: ['f1', 'f2', 'f3', 'f4'], wind: 0.2 }
  ]
}

export const adamEva: Journey = {
  id: 'adam-eva',
  title: 'Adam und Eva',
  subtitle: 'Der Garten Eden',
  age: '8-10',
  downloadMb: 15, // gut 14 MB gezählt nach der neuen Karte (vier Stücke zusammen 5,6 MB) am 20.10.2026 (der Test sagt die echte Größe)
  medal: `${IMG}medaille-v3.webp`, // Der Garten Eden (Lichtung mit Strom, Bäumen und warmem Morgenlicht, ohne Menschen)
  // Geschenk-Ausmalbild: Adam und Eva im Garten mit den Tieren, im Hintergrund der Baum des Lebens (nur Geschenk, nicht mehr Aufgabe der Etappe 9)
  gift: { title: 'Adam und Eva im Garten', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v3) mit Stationen und Perlenweg aus adamEvaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v3-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0454, y: 0.6129, d: 0.0339 },
      { x: 0.114, y: 0.2609, d: 0.0339 },
      { x: 0.3331, y: 0.2002, d: 0.0339 },
      { x: 0.4602, y: 0.6311, d: 0.0339 },
      { x: 0.5349, y: 0.2549, d: 0.0339 },
      { x: 0.6207, y: 0.3398, d: 0.0339 },
      { x: 0.8074, y: 0.2549, d: 0.0339 },
      { x: 0.8377, y: 0.6189, d: 0.0339 },
      { x: 0.8912, y: 0.182, d: 0.0339 }
    ],
    exam: { x: 0.9871, y: 0.2609, d: 0.0339 },
    path: ADAM_EVA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Am Anfang',
      ref: '1. Mose 1,1–13',
      text: [
        'Ganz am Anfang schafft Gott Himmel und Erde. Die Erde ist leer und öde, und Finsternis liegt über dem Wasser.',
        'Da spricht Gott: „Es werde Licht!“ Und es wird Licht. Gott nennt das Licht Tag und die Finsternis Nacht. Es wird Abend und Morgen: der erste Tag.',
        'Am zweiten Tag spannt Gott eine weite Wölbung aus und nennt sie Himmel. Wieder wird es Abend und Morgen.',
        'Am dritten Tag sammelt Gott das Wasser an einem Ort, und trockenes Land wird sichtbar. „Die Erde soll grün werden!“, spricht er. Da wachsen Gras und Kräuter und Bäume mit Früchten, und Gott sieht, dass es gut ist.'
      ],
      task: { kind: 'reihenfolge', hint: 'Lege die Bilder in die Reihenfolge der Geschichte.', order: ORDER },
      questions: [
        { q: 'Was spricht Gott, damit es hell wird?', options: ['„Es werde Licht!“', '„Es werde Tag!“', '„Es werde warm!“'], answer: 0 },
        { q: 'Wie nennt Gott das Licht?', options: ['Tag', 'Nacht', 'Himmel'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Sonne, Mond und Sterne',
      ref: '1. Mose 1,14–23',
      text: [
        'Am vierten Tag spricht Gott: „Am Himmel sollen Lichter leuchten! Sie sollen den Tag von der Nacht trennen und die Zeiten anzeigen.“',
        'Und so geschieht es. Gott macht zwei große Lichter, die Sonne für den Tag und den Mond für die Nacht, und dazu die Sterne. Er sieht, dass es gut ist.',
        'Am fünften Tag spricht Gott: „Das Wasser soll von Leben wimmeln, und Vögel sollen fliegen!“ Da gibt es große Meerestiere und kleine Fische und Vögel in der Luft.',
        'Gott segnet sie: „Seid fruchtbar und werdet viele!“ Dann wird es Abend und Morgen: der fünfte Tag.'
      ],
      task: { kind: 'lichter', hint: 'Tippe die Lichter am Himmel an, bis er strahlt.', lights: LICHTER },
      questions: [
        { q: 'Wofür sind die Lichter am Himmel da?', options: ['Sie trennen Tag und Nacht.', 'Sie wärmen die Tiere.', 'Sie bewässern den Garten.'], answer: 0 },
        { q: 'Was sagt Gott zu den Tieren im Wasser und in der Luft?', options: ['„Seid fruchtbar und werdet viele!“', '„Seid still!“', '„Zieht weiter!“'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Tiere und Menschen',
      ref: '1. Mose 1,24 bis 2,3',
      text: [
        'Am sechsten Tag soll auch das Land voller Leben sein. Gott spricht, und es entstehen das Vieh, die wilden Tiere und alles, was am Boden kriecht. Gott sieht, dass es gut ist.',
        'Dann sagt Gott: „Lasst uns Menschen machen als unser Bild!“ Und er schafft den Menschen, als Mann und als Frau.',
        'Gott segnet sie und sagt: „Seid fruchtbar und füllt die Erde! Herrscht über die Fische im Meer, über die Vögel am Himmel und über alle Tiere!“ Zu essen gibt er ihnen die Pflanzen mit Samen und die Bäume mit Früchten.',
        'Gott sieht alles an, was er gemacht hat: Es ist sehr gut. Am siebten Tag ruht Gott von seiner Arbeit. Er segnet diesen Tag und macht ihn zu einem besonderen Tag.'
      ],
      task: { kind: 'hueten', hint: 'Führe die Herde mit dem Finger sanft zum Ruheplatz.', herd: HUETEN },
      questions: [
        { q: 'Was tut Gott am siebten Tag?', options: ['Er ruht von seiner Arbeit.', 'Er macht neue Tiere.', 'Er baut einen Garten.'], answer: 0 },
        { q: 'Was sagt Gott über alles, was er gemacht hat?', options: ['Es ist sehr gut.', 'Es ist fast fertig.', 'Es ist noch zu leer.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Der Garten Eden',
      ref: '1. Mose 2,4–17',
      text: [
        'Nun erzählt die Bibel noch einmal, wie es mit dem Menschen anfing. Gott nimmt Erde und formt daraus Adam. Dann haucht er ihm Atem in die Nase, und Adam beginnt zu leben.',
        'Im Osten legt Gott einen Garten an, den Garten Eden. Dort wachsen Bäume mit schönen Früchten. Ein Strom, der in Eden entspringt, bewässert den Garten. In der Mitte stehen zwei besondere Bäume: der Baum des Lebens und der Baum der Erkenntnis von Gut und Böse.',
        'Gott setzt Adam in den Garten, damit er ihn pflegt. „Du darfst von allen Bäumen essen“, sagt Gott. „Nur vom Baum der Erkenntnis nicht, denn wenn du davon isst, musst du sterben.“'
      ],
      task: { kind: 'kanaele', hint: 'Drehe die Kanalstücke, bis das Wasser zu den Bäumen fließt.', channels: KANAELE },
      questions: [
        { q: 'Woraus formt Gott Adam?', options: ['aus Erde', 'aus Wasser', 'aus Holz'], answer: 0 },
        { q: 'Von welchem Baum darf Adam nicht essen?', options: ['vom Baum der Erkenntnis', 'vom Baum des Lebens', 'von den Feigenbäumen'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Adam gibt den Tieren Namen',
      ref: '1. Mose 2,18–20',
      text: [
        'Adam lebt im Garten und hat alles, was er braucht. Und doch sagt Gott: „Es ist nicht gut, dass der Mensch allein ist. Ich will ihm eine Hilfe machen, die zu ihm passt.“',
        'Gott hat alle Tiere des Feldes und alle Vögel des Himmels gemacht. Nun führt er sie zu Adam und will sehen, wie Adam sie nennt.',
        'Adam gibt dem Vieh, den Vögeln und den wilden Tieren Namen. Er sieht sich jedes Tier an und findet einen Namen dafür.',
        'Aber unter all den Tieren ist keines, das wirklich zu ihm passt und ihm eine Hilfe sein kann. Adam ist noch allein.'
      ],
      task: { kind: 'lueckenvers', hint: 'Setze die fehlenden Wörter in den Satz.', verse: VERS },
      questions: [
        { q: 'Was sagt Gott über Adam?', options: ['Es ist nicht gut, dass er allein ist.', 'Es ist gut, dass er allein ist.', 'Er soll bald weiterziehen.'], answer: 0 },
        { q: 'Was fehlt Adam, obwohl er den Tieren Namen gibt?', options: ['jemand, der zu ihm passt', 'ein Haus', 'ein Boot'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Eva',
      ref: '1. Mose 2,21–25',
      text: [
        'Da lässt Gott einen tiefen Schlaf auf Adam fallen. Während Adam ruhig schläft, nimmt Gott eine seiner Rippen. Er verschließt die Stelle wieder und baut aus der Rippe eine Frau.',
        'Dann führt Gott die Frau zu Adam, und Adam freut sich: „Das ist Bein von meinem Bein und Fleisch von meinem Fleisch!“ Nun ist er nicht mehr allein.',
        'Darum verlässt ein Mann später Vater und Mutter und hält sich zu seiner Frau, und die beiden gehören zusammen.',
        'Adam und die Frau sind gern beieinander. Sie sind nackt, und sie schämen sich nicht voreinander.'
      ],
      task: { kind: 'spiegeln', hint: 'Ergänze die andere Seite, so dass beide Seiten zusammenpassen.', mirror: SPIEGELN },
      questions: [
        { q: 'Was tut Gott mit Adam, bevor er die Frau baut?', options: ['Er lässt ihn tief schlafen.', 'Er schickt ihn fort.', 'Er zeigt ihm die Sterne.'], answer: 0 },
        { q: 'Woraus baut Gott die Frau?', options: ['aus einer Rippe von Adam', 'aus Staub und Wasser', 'aus einem Stück Holz'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-07.webp`,
      title: 'Die Schlange',
      ref: '1. Mose 3,1–7',
      text: [
        'Im Garten lebt auch die Schlange, listiger als alle anderen Tiere. Sie fragt die Frau: „Sollte Gott wirklich gesagt haben: Ihr dürft von keinem Baum im Garten essen?“',
        '„Wir dürfen von den Früchten der Bäume essen“, antwortet die Frau. „Nur von dem Baum in der Mitte hat Gott gesagt: Esst nicht davon, rührt ihn nicht an, sonst müsst ihr sterben.“ Doch die Schlange sagt: „Ihr werdet nicht sterben. Gott weiß: Wenn ihr davon esst, gehen euch die Augen auf, und ihr werdet sein wie Gott und wissen, was gut und böse ist.“',
        'Die Frau sieht den Baum an. Seine Früchte sehen schön aus, und klug sollen sie auch machen. Sie nimmt eine Frucht, isst und gibt auch Adam davon, der bei ihr ist. Und auch er isst.',
        'Da gehen den beiden die Augen auf. Sie merken, dass sie nackt sind. Sie flechten Feigenblätter zusammen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer spricht die Frau im Garten an?', options: ['die Schlange', 'Adam', 'ein Vogel'], answer: 0 },
        { q: 'Was tun die beiden, nachdem ihnen die Augen aufgegangen sind?', options: ['Sie flechten Feigenblätter zusammen.', 'Sie bauen ein Boot.', 'Sie pflücken Datteln.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-08.webp`,
      title: 'Wo bist du?',
      ref: '1. Mose 3,8–21',
      text: [
        'Als der Tag kühl geworden ist, weht ein Wind durch den Garten. Adam und seine Frau hören Gott im Garten gehen und verstecken sich zwischen den Bäumen.',
        '„Adam, wo bist du?“, ruft Gott. „Ich habe dich gehört und mich gefürchtet“, antwortet Adam. „Darum habe ich mich versteckt.“',
        'Gott fragt, ob Adam von dem verbotenen Baum gegessen hat. Adam sagt, die Frau habe ihm davon gegeben, und die Frau sagt, die Schlange habe sie getäuscht. Zur Schlange sagt Gott: „Einer von den Nachkommen der Frau wird dir den Kopf zertreten.“ Weil Adam gegessen hat, sagt Gott, wird die Arbeit auf dem Acker nun mühsam, bis er wieder zu Erde wird, von der er genommen ist.',
        'Adam nennt seine Frau Eva, denn sie wird die Mutter aller sein, die leben. Und Gott macht Adam und Eva Kleider aus Fell und zieht sie ihnen an.'
      ],
      task: { kind: 'echo', hint: 'Hör oder schau gut zu und antworte mit denselben Blüten.', echo: RUF },
      questions: [
        { q: 'Wen hören Adam und seine Frau im Garten gehen?', options: ['Gott', 'die Schlange', 'einen Engel'], answer: 0 },
        { q: 'Was macht Gott für Adam und Eva?', options: ['Kleider aus Fell', 'ein Haus aus Holz', 'einen neuen Garten'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-09.webp`,
      title: 'Der Weg aus dem Garten',
      ref: '1. Mose 3,22–24',
      text: [
        'Gott sagt: „Nun weiß der Mensch, was gut und böse ist. Er soll nicht auch noch vom Baum des Lebens essen und für immer leben.“',
        'So schickt Gott Adam und Eva aus dem Garten Eden hinaus. Draußen sollen sie den Boden bearbeiten, aus dem Adam genommen ist.',
        'Im Osten des Gartens stellt Gott Cherubim auf. Sie bewachen mit einem flammenden Schwert den Weg zum Baum des Lebens.',
        'Still gehen Adam und Eva den Weg hinaus. Sie tragen die Kleider aus Fell, die Gott ihnen gemacht hat. Der Garten bleibt hinter ihnen zurück, und vor ihnen liegt das weite Land.'
      ],
      task: { kind: 'saeen', hint: 'Ziehe den Samenbeutel zurück und lass los. Die Samen fallen in die Furchen.', sow: SAEEN },
      questions: [
        { q: 'Wer bewacht den Weg zum Baum des Lebens?', options: ['Cherubim mit einem flammenden Schwert', 'die Schlange', 'Adam'], answer: 0 },
        { q: 'Wohin gehen Adam und Eva am Ende?', options: ['aus dem Garten hinaus', 'zurück zu den Tieren', 'auf einen hohen Berg'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Was spricht Gott, damit es hell wird?', options: ['„Es werde Licht!“', '„Es werde Tag!“', '„Es werde warm!“'], answer: 0 },
    { q: 'Was tut Gott am siebten Tag?', options: ['Er ruht von seiner Arbeit.', 'Er macht neue Tiere.', 'Er baut einen Garten.'], answer: 0 },
    { q: 'Von welchem Baum darf Adam nicht essen?', options: ['vom Baum der Erkenntnis', 'vom Baum des Lebens', 'von den Feigenbäumen'], answer: 0 },
    { q: 'Woraus baut Gott die Frau?', options: ['aus einer Rippe von Adam', 'aus Staub und Wasser', 'aus einem Stück Holz'], answer: 0 },
    { q: 'Was macht Gott für Adam und Eva?', options: ['Kleider aus Fell', 'ein Haus aus Holz', 'einen neuen Garten'], answer: 0 },
    { q: 'Wohin gehen Adam und Eva am Ende?', options: ['aus dem Garten hinaus', 'zurück zu den Tieren', 'auf einen hohen Berg'], answer: 0 }
  ]
}

// the background music of this journey (calm pieces made with Google's Lyria 3.5, ton.md of the skill `lambking-abenteuer-skill`): they follow one another at random
adamEva.music = [
  'audio/abenteuer/adam-eva/musik-licht-v1.mp3',
  'audio/abenteuer/adam-eva/musik-garten-v1.mp3',
  'audio/abenteuer/adam-eva/musik-strom-v1.mp3',
  'audio/abenteuer/adam-eva/musik-abend-v1.mp3'
]

// the German recordings of the stories (voice Achernar); there are no English ones yet, so the English app reads with the voice of the device
// Bibeltreue-Korrektur 21.10.2026: the texts of these stages were changed (see NEUAUFNAHME-BIBELTREUE-2026-10-21.md in the adventure folder) and recorded again as "-v4"; the others are "-v3".
const RECORDED_AGAIN = [3, 7, 8]
for (const s of adamEva.stages) {
  const file = `audio/abenteuer/adam-eva/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.includes(s.id) ? 'v4' : 'v3'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(adamEva, adamEvaEn)
