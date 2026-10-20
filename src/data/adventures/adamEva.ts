/**
 * Abenteuer "Adam und Eva" (1. Mose 1–3) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Der Garten Eden". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Adam-Eva/ENTWURF_Adam-Eva.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den
 * Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Kein Spiel dieses Abenteuers kommt in Josef oder Noah vor (Anton, 20.10.2026): jede Etappe hat ein eigenes, neues Spiel, Etappe 7 ist nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/adam-eva/, images/abenteuer/spiele/adam-eva/<spiel>/, audio/abenteuer/adam-eva/.
 *
 * STAND 20.10.2026: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte, Vorlese-Aufnahmen (Deutsch und Englisch) und Musik sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { ChannelGame, EchoGame, HerdGame, Journey, LightGame, MirrorGame, OrderGame, SowGame, VerseGame } from '@/types/adventure'
import { ADAM_EVA_PATH } from './adamEvaPath'
import { CHANNEL_GRID_1, CHANNEL_GRID_2 } from './adamEvaChannels'
import { localize } from './localize'
import { adamEvaEn } from './en/adamEva.en'

const IMG = 'images/abenteuer/adam-eva/'
const G = 'images/abenteuer/spiele/adam-eva/'
const REC = 'audio/abenteuer/adam-eva/'
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
        { x: 37.5, y: 32.8, w: 8 }, { x: 61.9, y: 35.1, w: 8 }, { x: 26.6, y: 39.8, w: 8 }, { x: 79.7, y: 40.8, w: 8 }
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

/** Etappe 4, "Kanäle drehen": zwei Gärten (4 x 3 und 5 x 4), siehe `adamEvaChannels.ts`; die Kacheln und Pflanzen kommen aus Bildauftrag 11. */
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
    { hint: 'Runde 2: Der Strom teilt sich. Leite das Wasser zu allen vier Bäumen.', grid: CHANNEL_GRID_2 }
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

/** Etappe 6, "Spiegeln": links ein Muster aus Blütensteinen, rechts wird es gespiegelt ergänzt (6 und 12 Steine). Hintergrund ist das Etappenbild 6. */
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
    { hint: 'Runde 2: Das Muster ist größer und hat mehr Farben.', cols: 3, rows: 4, left: [['rot', 'gelb', 'blau'], ['blau', 'rot', 'gelb'], ['gelb', 'blau', 'rot'], ['rot', 'rot', 'blau']] }
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
    { hint: 'Runde 1: Höre oder schau gut zu: Der Ruf leuchtet auch. Tippe die Blüten in derselben Reihenfolge an.', calls: [[0, 1, 2], [2, 1, 3], [1, 3, 0, 2]] },
    { hint: 'Runde 2: Der Ruf ist länger. Du kannst ihn jederzeit noch einmal hören und sehen.', calls: [[0, 2, 1, 3], [3, 1, 2, 0, 2], [1, 0, 3, 2, 1, 3]] }
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
    { hint: 'Runde 1: Die Furchen sind nah. Ziehe zurück und lass los.', furrows: ['f1', 'f2', 'f3', 'f4'], wind: 0 },
    { hint: 'Runde 2: Die Furchen sind weiter weg, und ein leichter Wind weht.', furrows: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'], wind: 0.4 }
  ]
}

export const adamEva: Journey = {
  id: 'adam-eva',
  title: 'Adam und Eva',
  subtitle: 'Der Garten Eden',
  age: '8-10',
  downloadMb: 15, // gut 14 MB gezählt nach der neuen Karte (vier Stücke zusammen 5,6 MB) am 20.10.2026 (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Der Garten Eden (Lichtung mit Strom, Bäumen und warmem Morgenlicht, ohne Menschen)
  // Geschenk-Ausmalbild: Adam und Eva im Garten mit den Tieren, im Hintergrund der Baum des Lebens (nur Geschenk, nicht mehr Aufgabe der Etappe 9)
  gift: { title: 'Adam und Eva im Garten', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v2) mit Stationen und Perlenweg aus den Messdaten von fertig/messdaten.json und adamEvaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-v2-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0343, y: 0.6432, d: 0.0339 },
      { x: 0.2019, y: 0.6068, d: 0.0339 },
      { x: 0.3018, y: 0.6311, d: 0.0339 },
      { x: 0.3866, y: 0.6311, d: 0.0339 },
      { x: 0.5198, y: 0.534, d: 0.0339 },
      { x: 0.6157, y: 0.6068, d: 0.0339 },
      { x: 0.7045, y: 0.6432, d: 0.0339 },
      { x: 0.8034, y: 0.6371, d: 0.0339 },
      { x: 0.8942, y: 0.6311, d: 0.0339 }
    ],
    exam: { x: 0.979, y: 0.4976, d: 0.0339 },
    path: ADAM_EVA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Am Anfang',
      ref: '1. Mose 1,1–13',
      audio: `${REC}geschichte-01-v2.mp3`,
      text: [
        'Ganz am Anfang schafft Gott Himmel und Erde. Die Erde ist leer und dunkel, Finsternis liegt über dem Wasser, und Gottes Geist schwebt darüber. Da spricht Gott: „Es werde Licht!“ Und es wird Licht.',
        'Gott sieht, dass das Licht gut ist. Er trennt es von der Finsternis und gibt beiden einen Namen: Das Licht nennt er Tag, und die Finsternis nennt er Nacht. Dann wird es Abend, und es wird Morgen. Das ist der erste Tag.',
        'Am zweiten Tag spricht Gott noch einmal. Zwischen dem Wasser unten und dem Wasser oben spannt er eine weite Wölbung aus und nennt sie Himmel. Wieder wird es Abend und Morgen: der zweite Tag.',
        'Am dritten Tag lässt Gott das Wasser sich an einem Ort sammeln, und trockenes Land wird sichtbar. Das Land nennt er Erde und das Wasser Meer. Dann spricht er: „Die Erde soll grün werden!“ Da wächst Gras, da wachsen Kräuter mit Samen und Bäume mit Früchten, jedes nach seiner Art. Gott sieht es an, und es ist gut.'
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
      audio: `${REC}geschichte-02-v2.mp3`,
      text: [
        'Am vierten Tag spricht Gott: „Am Himmel sollen Lichter leuchten! Sie sollen den Tag von der Nacht trennen und die Zeiten anzeigen, die Tage und die Jahre.“',
        'Und so geschieht es: Gott macht zwei große Lichter, die Sonne für den Tag und den Mond für die Nacht, und dazu die Sterne. Er setzt sie an den Himmel, damit sie auf die Erde leuchten, und er sieht, dass es gut ist. Dann wird es Abend und Morgen: der vierte Tag.',
        'Am fünften Tag soll das Wasser von Leben wimmeln, und in der Luft sollen Vögel fliegen. Gott macht die großen Meerestiere und alles, was sich im Wasser regt, und dazu alle Vögel, jedes nach seiner Art. Er sieht sie an, und es ist gut.',
        'Und Gott segnet sie. Sie sollen viele werden und das Meer füllen, und auch die Vögel sollen sich auf der Erde vermehren. Dann wird es Abend und Morgen: der fünfte Tag.'
      ],
      task: { kind: 'lichter', hint: 'Tippe die Lichter am Himmel an, bis er strahlt.', lights: LICHTER },
      questions: [
        { q: 'Wofür sind die Lichter am Himmel da?', options: ['Sie trennen Tag und Nacht.', 'Sie wärmen die Tiere.', 'Sie bewässern den Garten.'], answer: 0 },
        { q: 'Was sagt Gott zu den Tieren im Wasser und in der Luft?', options: ['Sie sollen viele werden.', 'Sie sollen still sein.', 'Sie sollen weiterziehen.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Tiere und Menschen',
      ref: '1. Mose 1,24–2,3',
      audio: `${REC}geschichte-03-v2.mp3`,
      text: [
        'Am sechsten Tag soll auch das Land voller Leben sein. Gott spricht, und es entstehen das Vieh, die wilden Tiere und alles, was am Boden kriecht, jedes nach seiner Art. Gott sieht sie an, und es ist gut.',
        'Dann spricht Gott: „Ich will Menschen machen, die mir ähnlich sind.“ Und er schafft den Menschen als sein Bild, als Mann und als Frau.',
        'Gott segnet sie. Sie sollen viele werden und die Erde füllen, und er vertraut ihnen die Erde und alle Tiere an. Zu essen gibt er ihnen die Pflanzen mit Samen und die Bäume mit Früchten, und den Tieren gibt er das grüne Kraut.',
        'Gott sieht alles an, was er gemacht hat, und es ist sehr gut. Dann wird es Abend und Morgen: der sechste Tag.',
        'So sind Himmel und Erde mit allem, was darin lebt, fertig. Am siebten Tag ruht Gott von seiner Arbeit. Er segnet diesen Tag und macht ihn zu einem besonderen Tag.'
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
      audio: `${REC}geschichte-04-v2.mp3`,
      text: [
        'Nun erzählt die Bibel noch einmal genauer, wie es mit dem Menschen anfing. Gott nimmt Erde vom Boden und formt daraus einen Menschen: Adam. Dann haucht er ihm seinen Atem in die Nase, und Adam beginnt zu leben.',
        'Im Osten legt Gott einen Garten an, den Garten Eden, und setzt Adam hinein. Er lässt Bäume aus dem Boden wachsen, die schön anzusehen sind und von denen man gut essen kann. In der Mitte des Gartens aber stehen zwei besondere Bäume: der Baum des Lebens und der Baum der Erkenntnis von Gut und Böse.',
        'Mitten durch den Garten fließt ein Strom und gibt ihm Wasser. Danach teilt er sich in vier Flüsse.',
        'Adam soll den Garten bearbeiten und auf ihn aufpassen. Und Gott sagt zu ihm: „Du darfst von allen Bäumen im Garten essen. Nur vom Baum der Erkenntnis von Gut und Böse darfst du nicht essen, denn wenn du davon isst, musst du sterben.“'
      ],
      task: { kind: 'kanaele', hint: 'Drehe die Kanalstücke, bis das Wasser zu den Bäumen fließt.', channels: KANAELE },
      questions: [
        { q: 'Woraus formt Gott den Menschen?', options: ['aus Erde', 'aus Wasser', 'aus Holz'], answer: 0 },
        { q: 'Von welchem Baum darf Adam nicht essen?', options: ['vom Baum der Erkenntnis', 'vom Baum des Lebens', 'von den Feigenbäumen'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Adam gibt den Tieren Namen',
      ref: '1. Mose 2,18–20',
      audio: `${REC}geschichte-05-v3.mp3`,
      text: [
        'Adam lebt im Garten und hat alles, was er braucht. Und doch sagt Gott: „Es ist nicht gut, dass der Mensch allein ist. Ich will ihm eine Hilfe machen, die zu ihm passt.“',
        'Gott hat alle Tiere des Feldes und alle Vögel des Himmels gemacht. Nun will er sehen, wie Adam sie nennt, und so, wie Adam jedes Tier nennt, so soll es heißen.',
        'Adam gibt dem Vieh, den Vögeln und den wilden Tieren Namen. Er sieht sich die Tiere an und findet für jedes einen Namen. Aber unter ihnen ist keines, das wirklich zu ihm passt und ihm eine Hilfe sein kann.'
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
      audio: `${REC}geschichte-06-v2.mp3`,
      text: [
        'Da lässt Gott einen tiefen Schlaf auf Adam fallen. Während Adam ruhig schläft, nimmt Gott eine seiner Rippen und verschließt die Stelle wieder. Aus der Rippe baut er eine Frau.',
        'Dann bringt Gott die Frau zu Adam, und Adam freut sich: „Endlich! Sie gehört zu mir wie ein Stück von mir selbst.“ Die Frau heißt Eva.',
        'Darum verlässt ein Mann später Vater und Mutter und hält sich zu seiner Frau, und die beiden gehören zusammen. So ist es auch bei Adam und Eva: Sie sind gern beieinander, und sie schämen sich nicht voreinander.'
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
      audio: `${REC}geschichte-07-v2.mp3`,
      text: [
        'Im Garten lebt auch die Schlange, klüger und listiger als alle anderen Tiere. Eines Tages spricht sie Eva an: „Hat Gott wirklich gesagt, ihr dürft von keinem Baum im Garten essen?“',
        'Eva antwortet: „Wir dürfen von den Früchten der Bäume essen. Nur von dem Baum in der Mitte des Gartens hat Gott gesagt: Esst nicht davon, rührt ihn nicht an, sonst müsst ihr sterben.“',
        'Doch die Schlange sagt: „Nein, ihr werdet nicht sterben. Gott weiß, dass euch die Augen aufgehen, sobald ihr davon esst. Dann seid ihr wie Gott und wisst, was gut und böse ist.“',
        'Eva sieht den Baum an. Seine Früchte sehen gut aus, und klug sollen sie auch machen. Da nimmt sie eine Frucht und isst, und sie gibt auch Adam davon, der bei ihr ist, und er isst.',
        'Im selben Augenblick gehen den beiden die Augen auf. Sie merken, was sie getan haben, und sie schämen sich. Darum flechten sie Feigenblätter zusammen und machen sich Schurze daraus.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer spricht Eva an?', options: ['die Schlange', 'Adam', 'ein Vogel'], answer: 0 },
        { q: 'Was hat Gott über den Baum in der Mitte des Gartens gesagt?', options: ['Esst nicht davon, sonst müsst ihr sterben.', 'Esst viel davon.', 'Pflanzt noch einen.'], answer: 0 },
        { q: 'Was tun die beiden, nachdem ihnen die Augen aufgegangen sind?', options: ['Sie flechten Feigenblätter zusammen.', 'Sie bauen ein Boot.', 'Sie pflücken Datteln.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-08.webp`,
      title: 'Wo bist du?',
      ref: '1. Mose 3,8–21',
      audio: `${REC}geschichte-08-v2.mp3`,
      text: [
        'Am Abend, als ein kühler Wind durch den Garten weht, hören Adam und Eva Gott im Garten gehen. Da verstecken sie sich zwischen den Bäumen.',
        'Aber Gott ruft: „Adam, wo bist du?“ Adam antwortet: „Ich habe dich gehört und mich gefürchtet. Darum habe ich mich versteckt.“',
        'Gott fragt, ob Adam von dem Baum gegessen hat, von dem er nicht essen sollte. Adam sagt: „Die Frau, die du mir gegeben hast, gab mir davon.“ Und Eva sagt: „Die Schlange hat mich getäuscht.“ So schieben beide die Schuld auf einen anderen.',
        'Dann sagt Gott ihnen, was nun anders wird: Das Leben wird schwerer. Adam muss hart arbeiten, damit der Acker ihm Brot gibt, und auf dem Acker wachsen Dornen und Disteln. Auch für Eva wird es mühsam. Die Welt ist nicht mehr so heil wie im Garten.',
        'Aber Gott lässt die beiden nicht allein. Adam nennt seine Frau Eva, denn sie wird die Mutter aller Menschen sein. Und Gott macht Adam und Eva Kleider aus Fell und zieht sie ihnen an. So sorgt er für sie.'
      ],
      task: { kind: 'echo', hint: 'Hör oder schau gut zu und antworte mit denselben Blüten.', echo: RUF },
      questions: [
        { q: 'Wann hören Adam und Eva Gott im Garten?', options: ['am Abend', 'am Morgen', 'mitten in der Nacht'], answer: 0 },
        { q: 'Was sagt Gott über das Leben, das jetzt kommt?', options: ['Es wird schwerer.', 'Es wird leichter.', 'Es bleibt wie im Garten.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-09.webp`,
      title: 'Der Weg aus dem Garten',
      ref: '1. Mose 3,22–24; 4,1',
      audio: `${REC}geschichte-09-v2.mp3`,
      text: [
        'Nun ist nicht mehr alles wie vorher. Gott sagt: „Der Mensch soll nicht auch noch vom Baum des Lebens essen und für immer so bleiben.“',
        'Darum schickt Gott Adam und Eva aus dem Garten Eden hinaus. Draußen sollen sie den Boden bearbeiten, aus dem Adam genommen ist. Still gehen die beiden den Weg hinaus, und der Garten bleibt hinter ihnen zurück. Im Osten des Gartens stellt Gott Cherubim auf, mächtige Engel, und ein flammendes Schwert, das sich hin und her bewegt. Sie bewachen den Weg zum Baum des Lebens.',
        'Aber Adam und Eva sind nicht allein. Gott hat ihnen Kleider aus Fell gemacht, und er hilft ihnen auch draußen. Später bekommt Eva einen Sohn und nennt ihn Kain. „Ich habe einen Sohn bekommen“, sagt sie, „mit Gottes Hilfe.“'
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

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(adamEva, adamEvaEn)
