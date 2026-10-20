/**
 * Abenteuer "Adam und Eva" (1. Mose 1–3) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Der Garten Eden". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Adam-Eva/ENTWURF_Adam-Eva.md (Entwurf v1 der Text-Sitzung), Plan: ETAPPENPLAN.md. Die richtige Antwort steht in den
 * Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Kein Spiel dieses Abenteuers kommt in Josef oder Noah vor (Anton, 20.10.2026): jede Etappe hat ein eigenes, neues Spiel, Etappe 7 ist nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/adam-eva/, images/abenteuer/spiele/adam-eva/<spiel>/, audio/abenteuer/adam-eva/.
 *
 * STAND: Etappen noch `soon` (nicht spielbar), bis die Bilder (Panorama, Etappenbilder, Medaille, Spielbilder) und die Vorlese-Aufnahmen eingebaut sind.
 * Zahlen, die aus Messdateien der Bilder kommen, sind mit PLATZHALTER markiert und werden beim Einbau durch die gemessenen ersetzt.
 */
import type { ChannelGame, EchoGame, HerdGame, Journey, LightGame, MirrorGame, OrderGame, SowGame, VerseGame } from '@/types/adventure'
import { ADAM_EVA_PATH } from './adamEvaPath'
import { CHANNEL_GRID_1, CHANNEL_GRID_2 } from './adamEvaChannels'
import { localize } from './localize'
import { adamEvaEn } from './en/adamEva.en'

const IMG = 'images/abenteuer/adam-eva/'
const G = 'images/abenteuer/spiele/adam-eva/'
const REC = 'audio/abenteuer/adam-eva/'
/** Alle Etappen sind noch nicht spielbar; beim Einbau der Bilder und Töne auf `false` setzen. */
const SOON = true

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
 * Die Tiere kommen aus den Noah-Bildern (unter neuen Namen in `hueten/`). PLATZHALTER: Start, Ruheplatz und Teich kommen aus `hueten/wiese-messung.json`.
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
      start: { x: 26, y: 88 },
      rest: { x: 70, y: 30, r: 12 }
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
      start: { x: 60, y: 90 },
      rest: { x: 28, y: 22, r: 12 },
      obstacle: { x: 46, y: 58, r: 10 }
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
    { hint: 'Runde 1: Ziehe das passende Blatt in die Lücke.', parts: ['Gott formt aus dem Boden alle ', ' des Feldes und alle Vögel des Himmels.'], words: ['Tiere', 'Steine', 'Wolken'], answers: [0] },
    { hint: 'Runde 2: Jetzt fehlen zwei Wörter.', parts: ['Adam gibt allen Tieren Namen, dem ', ', den ', ' und den wilden Tieren.'], words: ['Vieh', 'Vögeln', 'Fischen', 'Blumen'], answers: [0, 1] }
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
 * für Runde 1). PLATZHALTER: x, y, w, h kommen aus `saeen/acker-messung.json`.
 */
const SAEEN: SowGame = {
  field: `${G}saeen/acker.webp`,
  bag: `${G}saeen/beutel.webp`,
  seed: `${G}saeen/same.webp`,
  sprout: [`${G}saeen/sproessling-1.webp`, `${G}saeen/sproessling-2.webp`],
  vane: `${G}saeen/fahne.webp`,
  furrows: [
    { id: 'f1', x: 30, y: 74, w: 34, h: 7 },
    { id: 'f2', x: 70, y: 74, w: 34, h: 7 },
    { id: 'f3', x: 30, y: 56, w: 32, h: 6 },
    { id: 'f4', x: 70, y: 56, w: 32, h: 6 },
    { id: 'f5', x: 30, y: 40, w: 30, h: 5 },
    { id: 'f6', x: 70, y: 40, w: 30, h: 5 }
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
  downloadMb: 1, // beim Einbau neu zählen (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Der Garten Eden (Lichtung mit Strom, Bäumen und warmem Morgenlicht, ohne Menschen)
  // Geschenk-Ausmalbild: Adam und Eva im Garten mit den Tieren, im Hintergrund der Baum des Lebens (nur Geschenk, nicht mehr Aufgabe der Etappe 9)
  gift: { title: 'Adam und Eva im Garten', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 4938 × 822 px) mit Stationen und Perlenweg aus den Messdaten von fertig/messdaten.json und adamEvaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 4938 / 822,
    widthPx: 4938,
    stages: [
      { x: 0.0668, y: 0.5718, d: 0.0339 },
      { x: 0.1904, y: 0.5596, d: 0.0339 },
      { x: 0.3098, y: 0.5718, d: 0.0339 },
      { x: 0.405, y: 0.6326, d: 0.0339 },
      { x: 0.5164, y: 0.6265, d: 0.0339 },
      { x: 0.6197, y: 0.6387, d: 0.0339 },
      { x: 0.7088, y: 0.6326, d: 0.0339 },
      { x: 0.7797, y: 0.6387, d: 0.0339 },
      { x: 0.8505, y: 0.6326, d: 0.0339 }
    ],
    exam: { x: 0.9518, y: 0.6204, d: 0.0339 },
    path: ADAM_EVA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Am Anfang',
      ref: '1. Mose 1,1–13',
      audio: `${REC}geschichte-01-v1.mp3`,
      text: [
        'Am Anfang schafft Gott Himmel und Erde. Noch ist die Erde leer und dunkel, Finsternis liegt über dem Wasser, und Gottes Geist schwebt darüber. Dann spricht Gott: „Es werde Licht!“ Und es wird Licht.',
        'Gott sieht das Licht an, und es ist gut. Er trennt das Licht von der Finsternis. Das Licht nennt er Tag, die Finsternis nennt er Nacht. Es wird Abend, und es wird Morgen: der erste Tag.',
        'Am zweiten Tag spricht Gott wieder. Zwischen dem Wasser unten und dem Wasser oben spannt sich eine weite Wölbung. Gott nennt sie Himmel. Wieder wird es Abend und Morgen: der zweite Tag.',
        'Am dritten Tag lässt Gott das Wasser sich an einem Ort sammeln. Trockenes Land wird sichtbar. Das Land nennt er Erde, das Wasser nennt er Meer. Dann sagt er: „Die Erde soll grün werden!“ Gras wächst, Kräuter mit Samen und Bäume mit Früchten, jedes nach seiner Art. Gott sieht es an, und es ist gut.'
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
      audio: `${REC}geschichte-02-v1.mp3`,
      text: [
        'Am vierten Tag spricht Gott: „Am Himmel sollen Lichter leuchten! Sie sollen Tag und Nacht trennen und die Zeiten anzeigen, die Tage und die Jahre.“',
        'Gott macht zwei große Lichter, die Sonne für den Tag und den Mond für die Nacht. Dazu macht er die Sterne. Er setzt sie an den Himmel, damit sie auf die Erde leuchten. Gott sieht es an, und es ist gut. Es wird Abend und Morgen: der vierte Tag.',
        'Am fünften Tag soll das Wasser von Leben wimmeln, und in der Luft sollen Vögel fliegen. Gott macht die großen Meerestiere und alles, was sich im Wasser regt, und alle Vögel, jedes nach seiner Art. Gott sieht sie an, und es ist gut.',
        'Und Gott segnet sie. Sie sollen viele werden und das Meer füllen, und auch die Vögel sollen sich auf der Erde vermehren. Es wird Abend und Morgen: der fünfte Tag.'
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
      audio: `${REC}geschichte-03-v1.mp3`,
      text: [
        'Am sechsten Tag spricht Gott noch einmal. Jetzt soll auch das Land voller Leben sein. Er macht das Vieh, die wilden Tiere und alles, was am Boden kriecht, jedes nach seiner Art. Gott sieht sie an, und es ist gut.',
        'Dann sagt Gott: „Ich will Menschen machen, die mir ähnlich sind.“ Und er schafft den Menschen als sein Bild, als Mann und als Frau.',
        'Gott segnet sie. Sie sollen viele werden und die Erde füllen, und er vertraut ihnen die Erde und alle Tiere an. Zu essen gibt er ihnen Pflanzen mit Samen und Bäume mit Früchten. Den Tieren gibt er das grüne Kraut.',
        'Gott sieht alles an, was er gemacht hat. Es ist sehr gut. Es wird Abend und Morgen: der sechste Tag.',
        'So sind Himmel und Erde fertig. Am siebten Tag ruht Gott von seiner Arbeit. Er segnet diesen Tag und macht ihn zu einem besonderen Tag.'
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
      audio: `${REC}geschichte-04-v1.mp3`,
      text: [
        'Nun erzählt die Bibel genauer, wie es mit dem Menschen anfing. Gott nimmt Erde vom Boden und formt daraus einen Menschen: Adam. Dann haucht er ihm seinen Atem in die Nase, und Adam beginnt zu leben.',
        'Im Osten legt Gott einen Garten an, den Garten Eden, und setzt Adam hinein. Aus dem Boden lässt er Bäume wachsen, schön anzusehen und gut zu essen. In der Mitte des Gartens stehen zwei besondere Bäume: der Baum des Lebens und der Baum der Erkenntnis von Gut und Böse.',
        'Ein Strom fließt durch den Garten und gibt ihm Wasser. Danach teilt er sich in vier Flüsse.',
        'Adam soll den Garten bearbeiten und auf ihn aufpassen. Gott sagt zu ihm: „Du darfst von allen Bäumen im Garten essen. Nur vom Baum der Erkenntnis von Gut und Böse darfst du nicht essen. Wenn du davon isst, musst du sterben.“'
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
      audio: `${REC}geschichte-05-v1.mp3`,
      text: [
        'Adam lebt im Garten und hat alles, was er braucht. Und doch sagt Gott: „Es ist nicht gut, dass der Mensch allein ist. Ich will ihm eine Hilfe machen, die zu ihm passt.“',
        'Gott formt aus dem Boden alle Tiere des Feldes und alle Vögel des Himmels und bringt sie zu Adam. Er will sehen, wie Adam sie nennt. Und wie Adam jedes Tier nennt, so soll es heißen.',
        'Adam gibt allen Tieren Namen, dem Vieh, den Vögeln und den wilden Tieren. Eines nach dem anderen kommt zu ihm. Er sieht sie sich an und findet für jedes einen Namen. Aber unter allen ist keines, das wirklich zu ihm passt.'
      ],
      task: { kind: 'lueckenvers', hint: 'Setze die fehlenden Wörter in den Satz.', verse: VERS },
      questions: [
        { q: 'Was sagt Gott über Adam?', options: ['Es ist nicht gut, dass er allein ist.', 'Es ist gut, dass er allein ist.', 'Er soll bald weiterziehen.'], answer: 0 },
        { q: 'Was fehlt Adam, obwohl er alle Tiere kennt?', options: ['jemand, der zu ihm passt', 'ein Haus', 'ein Boot'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Eva',
      ref: '1. Mose 2,21–25',
      audio: `${REC}geschichte-06-v1.mp3`,
      text: [
        'Da lässt Gott einen tiefen Schlaf auf Adam fallen. Adam schläft ruhig. Gott nimmt eine seiner Rippen und verschließt die Stelle wieder. Aus der Rippe baut Gott eine Frau.',
        'Dann bringt Gott die Frau zu Adam. Adam freut sich: „Endlich! Sie gehört zu mir wie ein Stück von mir selbst.“ Die Frau heißt Eva.',
        'Darum verlässt ein Mann später Vater und Mutter und hält sich zu seiner Frau, und die beiden gehören zusammen. So ist es auch bei Adam und Eva. Sie sind gern beieinander, und sie schämen sich nicht voreinander.'
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
      audio: `${REC}geschichte-07-v1.mp3`,
      text: [
        'Im Garten lebt auch die Schlange. Sie ist klüger als alle anderen Tiere, leise und listig. Eines Tages spricht sie Eva an: „Hat Gott wirklich gesagt, ihr dürft von keinem Baum im Garten essen?“',
        'Eva antwortet: „Wir dürfen von den Früchten der Bäume essen. Nur von dem Baum in der Mitte des Gartens hat Gott gesagt: Esst nicht davon, rührt ihn nicht an, sonst müsst ihr sterben.“',
        'Die Schlange sagt: „Nein, ihr werdet nicht sterben. Gott weiß, dass euch die Augen aufgehen, wenn ihr davon esst. Dann seid ihr wie Gott und wisst, was gut und böse ist.“',
        'Eva sieht den Baum an. Seine Früchte sehen gut aus, und klug sollen sie auch machen. Sie nimmt eine Frucht und isst. Sie gibt auch Adam davon, der bei ihr ist, und er isst.',
        'Da gehen den beiden die Augen auf. Sie merken, was sie getan haben, und sie schämen sich. Sie flechten Feigenblätter zusammen und machen sich Schurze daraus.'
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
      audio: `${REC}geschichte-08-v1.mp3`,
      text: [
        'Am Abend, als ein kühler Wind weht, hören Adam und Eva Gott im Garten gehen. Da verstecken sie sich zwischen den Bäumen.',
        'Gott ruft: „Adam, wo bist du?“ Adam antwortet: „Ich habe dich gehört und mich gefürchtet. Darum habe ich mich versteckt.“',
        'Gott fragt, ob Adam von dem Baum gegessen hat, von dem er nicht essen sollte. Adam sagt: „Die Frau, die du mir gegeben hast, gab mir davon.“ Eva sagt: „Die Schlange hat mich getäuscht.“ Beide schieben die Schuld auf einen anderen.',
        'Gott sagt ihnen, was jetzt anders wird: Das Leben wird schwerer. Adam muss hart arbeiten, damit der Acker ihm Brot gibt, und Dornen und Disteln wachsen darauf. Auch für Eva wird es mühsam. Die Welt ist nicht mehr so heil wie im Garten.',
        'Aber Gott lässt die beiden nicht allein. Adam sagt zu seiner Frau: „Du wirst die Mutter aller Menschen sein.“ Und Gott macht Adam und Eva Kleider aus Fell und zieht sie ihnen an. So sorgt er für sie.'
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
      audio: `${REC}geschichte-09-v1.mp3`,
      text: [
        'Nun ist nicht mehr alles wie vorher. Gott sagt: „Der Mensch soll nicht auch noch vom Baum des Lebens essen und für immer so bleiben.“',
        'So schickt Gott Adam und Eva aus dem Garten Eden hinaus. Sie sollen draußen den Boden bearbeiten, aus dem Adam genommen ist. Still gehen sie den Weg hinaus, und der Garten bleibt hinter ihnen. Im Osten des Gartens stellt Gott Cherubim auf, mächtige Engel, und ein flammendes Schwert. Sie bewachen den Weg zum Baum des Lebens.',
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
