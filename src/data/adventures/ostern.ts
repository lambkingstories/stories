/**
 * Abenteuer "Ostern" (Lukas 24, Johannes 20 und 21) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Jesus lebt". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 5.11.2026), Nr. 29 der Gesamtreise.
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein, ohne Lichtkranz, ohne sichtbare Male an den Händen). Gott der Vater, Engel und Lichtgestalten sind nie im Bild.
 * Der Ton ist hell und froh, aber leise: die Menschen verstehen nach und nach. Kein Kreuz im Bild, kein Blut, keine Wunden, kein Leichnam; die Leinentücher liegen flach gefaltet im leeren Grab.
 * Quelle der Texte: D:/Claude/Abenteuer-Ostern/ENTWURF_Ostern.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend): 1 Wimmelbild (alt), 2 Lückenvers (alt), 3 Weg (alt), 4 Reihenfolge (alt), 5 Puzzle (alt), 6 Memory (alt),
 * 7 Das Netz zur Rechten (neu, fischzug), 8 Die Lämmer führen (neu, weiden), 9 Lückenvers (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/ostern/, images/abenteuer/spiele/ostern/<spiel>/, audio/abenteuer/ostern/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Ostern/tools/bauen_ostern.py: nicht von Hand ändern.
 */
import type { FindGame, Journey, MemoryGame, OrderGame, VerseGame, WayGame, FischzugGame, GrazeGame } from '@/types/adventure'
import { josef } from './josef'
import { OSTERN_PATH } from './osternPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { osternEn } from './en/ostern.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/ostern/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/ostern/'

const G = 'images/abenteuer/spiele/ostern/'

/**
 * Etappe 2, "Lückenvers" (alte Mechanik): der Ruf der Maria Magdalena aus dem Text der Etappe (Johannes 20,18) in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 28 (kopiert). Hintergrund: Morgensonne über einem Garten mit Olivenzweig (Bildauftrag). Die Sätze stehen wörtlich im Etappentext (das Bauskript prüft es).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Ich habe den Herrn ', '!'], words: ['gesehen', 'gehört', 'vergessen'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Ich habe den ', ' ', '!'], words: ['Herrn', 'gesehen', 'Gärtner', 'gehört'], answers: [0, 1] }
  ]
}

/**
 * Etappe 9, "Lückenvers" (alte Mechanik): das Wort Jesu an die Jünger (Lukas 24,48) aus dem Text der Etappe in zwei Runden; Tafel, Blatt und Hintergrund wie in Etappe 2.
 */
const VERS2: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Ihr aber seid ', ' von alledem.'], words: ['Zeugen', 'Fischer', 'Boten'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Ihr aber seid Zeugen ', ' ', '.'], words: ['von', 'alledem', 'über', 'allem'], answers: [0, 1] }
  ]
}

/**
 * Etappe 3, "Weg" (alte Mechanik, ohne Schilder): die zwei Jünger gehen nach Emmaus; an drei Gabelungen mit je drei Wegen tippt das Kind den Weg, an dessen Ende ein Dorf mit einem Rauchfaden aus dem Schornstein liegt.
 * Der richtige Weg: links, rechts, in der Mitte. Bilder (Bildauftrag): `weg/gabel-1..3.webp`, `weg/wanderer.webp`.
 */
const WEG: WayGame = {
  walker: `${G}weg/wanderer.webp`,
  texts: {
    hint: 'Weggabelung {n} von {total}: Tippe auf den Weg, an dessen Ende ein Dorf mit Rauch liegt.',
    right: 'Richtig! Dort liegt ein Dorf mit Rauch.',
    wrong: 'Hier ist kein Dorf. Die Jünger kehren um.',
    done: 'Die beiden Jünger sind in Emmaus angekommen!'
  },
  scenes: [
    { image: `${G}weg/gabel-1.webp`, goal: 'left', paths: 3 },
    { image: `${G}weg/gabel-2.webp`, goal: 'right', paths: 3 },
    { image: `${G}weg/gabel-3.webp`, goal: 'middle', paths: 3 }
  ]
}

/**
 * Etappe 4, "Das Brot in Emmaus" (alte Mechanik, Reihenfolge legen): zwei Jünger gehen nach Emmaus, ein Fremder geht mit und erzählt, am Tisch bricht er das Brot, die beiden laufen zurück nach Jerusalem.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'weg', image: `${G}reihenfolge/karte-1.webp`, label: 'Zwei Jünger gehen traurig auf der Landstraße nach Emmaus' },
    { id: 'fremder', image: `${G}reihenfolge/karte-2.webp`, label: 'Ein Fremder geht mit ihnen und erzählt, die Jünger hören zu' },
    { id: 'brot', image: `${G}reihenfolge/karte-3.webp`, label: 'Am Tisch bricht Jesus das Brot, die beiden sehen ihn staunend an' },
    { id: 'zurueck', image: `${G}reihenfolge/karte-4.webp`, label: 'Die beiden laufen in der Dämmerung strahlend zurück nach Jerusalem' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['fremder', 'brot', 'zurueck'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang auf der Landstraße und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['weg', 'fremder', 'brot', 'zurueck'] }
  ]
}

/**
 * Etappe 6, "Memory" (alte Mechanik): sechs Dinge aus den Geschichten dieser Reise (der Stein, das Leinentuch, das Brot, der gebratene Fisch, das Netz, das Kohlenfeuer); die Rückseite zeigt ein Muster aus Olivenzweigen (Bildauftrag).
 * Bilder: `memory/karte-1..6.webp` (in dieser Reihenfolge), `memory/rueckseite.webp`. Die Texte sagen nur, was im Text der Etappen steht.
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueckseite.webp`,
  pairs: [
    { image: `${G}memory/karte-1.webp`, text: 'Der Stein: Maria Magdalena sieht, dass er vom Grab weggerollt ist.' },
    { image: `${G}memory/karte-2.webp`, text: 'Das Leinentuch: Die Jünger sehen die Leinentücher im Grab liegen.' },
    { image: `${G}memory/karte-3.webp`, text: 'Das Brot: In Emmaus erkennen die zwei Jünger Jesus, als er es bricht.' },
    { image: `${G}memory/karte-4.webp`, text: 'Der gebratene Fisch: Jesus isst ein Stück davon vor den Jüngern.' },
    { image: `${G}memory/karte-5.webp`, text: 'Das Netz: Es ist voll großer Fische und reißt nicht.' },
    { image: `${G}memory/karte-6.webp`, text: 'Das Kohlenfeuer: Am Ufer liegen Fisch und Brot darauf.' }
  ]
}

/**
 * Etappe 7, "Das Netz zur Rechten" (neu, `fischzug`, Joh 21,6): der See am frühen Morgen (3:2, leer), unten links das Boot mit den sieben Fischern, dunkle Fischschatten schwimmen in Schwärmen. Der Finger zieht von dort einen
 * gestrichelten Kreis (so groß wie das Netz) aufs Wasser und lässt los: das Netz fliegt, sinkt, und alle Fische, deren Mitte im Kreis liegt, sind gefangen und fliegen in den Korb oben rechts; ein Wurf ohne Fang ist ein Fehler.
 * Runde 1 fünf Fische, drei Würfe, vier genügen; Runde 2 acht Fische in zwei Schwärmen, vier Würfe, sechs genügen. Am Ende liegt das volle Netz am Ufer (`fang`). Lagen und Größen sind Prozent des Bildes (Startwerte, die Leitung stellt sie
 * am echten Bild ein: `tools/_massen_ostern.json`). Bilder (Bildauftrag): `fischzug/see` (3:2), `boot`, `netz` (rund), `fisch-1..3`, `korb`, `fang` (3:2).
 */
const FISCHZUG: FischzugGame = {
  lake: `${G}fischzug/see.webp`,
  boat: { image: `${G}fischzug/boot.webp`, label: 'Das Boot mit den sieben Fischern', w: 26, x: 17, y: 97 },
  net: { image: `${G}fischzug/netz.webp`, label: 'Das Netz', w: 24 },
  fish: [
    { image: `${G}fischzug/fisch-1.webp`, label: 'Ein Fisch', w: 9 },
    { image: `${G}fischzug/fisch-2.webp`, label: 'Ein Fisch', w: 9 },
    { image: `${G}fischzug/fisch-3.webp`, label: 'Ein Fisch', w: 9 }
  ],
  basket: { image: `${G}fischzug/korb.webp`, label: 'Der Fischkorb', w: 10, x: 91, y: 24 },
  full: `${G}fischzug/fang.webp`,
  area: { left: 8, top: 32, right: 92, bottom: 78 },
  rounds: [
    { hint: 'Zieh das Netz dorthin, wo die Fische schwimmen, und lass los.', fish: 5, throws: 3, goal: 4 },
    { hint: 'Jetzt sind es zwei Schwärme. Zieh das Netz dorthin, wo die meisten Fische schwimmen.', fish: 8, throws: 4, goal: 6, schools: 2 }
  ]
}

/**
 * Etappe 8, "Die Lämmer führen" (neu, `weiden`, Joh 21,15-17): eine grüne Hanglandschaft über dem See (3:2); das Kind führt den Hirten (ziehen, antippen oder Pfeiltasten), die Tiere in der Nähe schließen sich an und laufen ihm nach.
 * Er führt sie in den Pferch mit dem offenen Tor; ein Dornbusch hält ein Tier auf (Fehler), der Hirte geht zu ihm und es folgt dann auf einem Umweg. In Runde 2 fließt ein Bach durch die Wiese: Tiere und Hirte gehen nur über den Steg.
 * Runde 1 "Weide meine Lämmer!" (vier Lämmer), Runde 2 "Weide meine Schafe!" (zwei Lämmer, zwei Schafe, mit Bach). Der Titel der zweiten Runde steht wie im Text der Etappe (Luther 1912: "Weide meine Schafe!").
 * Lagen und Größen sind Prozent des Bildes (Startwerte, die Leitung stellt sie am echten Bild ein: `tools/_massen_ostern.json`; Pferch-Innenfläche, Bachband und Stegspur am Bild messen).
 * Bilder (Bildauftrag): `weiden/wiese` (3:2, leer), `wiese-bach` (dieselbe Wiese mit Bach), `hirte`, `lamm-1`, `lamm-2`, `schaf`, `dornen`, `pferch`, `steg`.
 */
const WEIDEN: GrazeGame = {
  meadow: `${G}weiden/wiese.webp`,
  meadowStream: `${G}weiden/wiese-bach.webp`,
  hirte: { image: `${G}weiden/hirte.webp`, label: 'Der Hirte', w: 13, x: 8, y: 72 },
  kinds: [
    { id: 'lamm-1', image: `${G}weiden/lamm-1.webp`, label: 'Ein Lamm', w: 9 },
    { id: 'lamm-2', image: `${G}weiden/lamm-2.webp`, label: 'Ein Lamm', w: 9 },
    { id: 'schaf', image: `${G}weiden/schaf.webp`, label: 'Ein Schaf', w: 11, speed: 17 }
  ],
  thorn: { image: `${G}weiden/dornen.webp`, label: 'Ein Dornbusch', w: 13 },
  pen: { image: `${G}weiden/pferch.webp`, label: 'Der Pferch mit dem offenen Tor', w: 24, x: 88, y: 88, area: { left: 78, top: 58, right: 97, bottom: 86 } },
  bridge: { image: `${G}weiden/steg.webp`, label: 'Der Steg über den Bach', w: 12, x: 50, y: 56 },
  stream: { from: 46, to: 54, top: 40, bottom: 56 },
  rounds: [
    {
      title: 'Weide meine Lämmer!',
      hint: 'Führe die Lämmer zur Weide: Geh voran, und weich den Dornen aus.',
      animals: ['lamm-1', 'lamm-1', 'lamm-2', 'lamm-2'],
      starts: [{ x: 22, y: 66 }, { x: 27, y: 76 }, { x: 32, y: 64 }, { x: 36, y: 74 }],
      thorns: [{ x: 55, y: 72 }],
      stream: false
    },
    {
      title: 'Weide meine Schafe!',
      hint: 'Jetzt fließt ein Bach durch die Wiese. Führe die Tiere über den Steg und weich den Dornen aus.',
      animals: ['lamm-1', 'lamm-2', 'schaf', 'schaf'],
      starts: [{ x: 24, y: 64 }, { x: 28, y: 76 }, { x: 32, y: 62 }, { x: 36, y: 76 }],
      thorns: [{ x: 66, y: 70 }],
      stream: true
    }
  ]
}

/**
 * Etappe 1, "Wimmelbild" (alte Mechanik): der Garten im Morgengrauen mit dem Felsengrab, einem Olivenbaum, einer niedrigen Mauer und einer Blumenwiese (Hochformat 3:4, Bildauftrag); gesucht werden vier aus Johannes 20,1-10:
 * Maria Magdalena, Petrus, der andere Jünger und die flach gefalteten Leinentücher. Einige stehen hinter einem Olivenstamm, einem Mauerstück, einem Busch oder einem Felsbrocken (die ersten vier Verdecker decken je einen Gesuchten).
 * Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Maria Magdalena', 'Petrus', 'Der andere Jünger', 'Die Leinentücher'],
  doneText: 'Du hast alles gefunden: Maria Magdalena, Petrus, den anderen Jünger und die Leinentücher.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 22, y: 88, w: 22 },
    { image: `${G}wimmel/figur-2.webp`, x: 70, y: 82, w: 22 },
    { image: `${G}wimmel/figur-3.webp`, x: 46, y: 64, w: 17 },
    { image: `${G}wimmel/figur-4.webp`, x: 84, y: 93, w: 20 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 22, y: 90, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 70, y: 84, w: 18 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 46, y: 66, w: 14 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 84, y: 94, w: 14 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 58, y: 90, w: 12 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 30, y: 66, w: 10 }
  ]
}

export const ostern: Journey = {
  id: 'ostern',
  title: 'Ostern',
  subtitle: 'Jesus lebt',
  age: '8-10',
  downloadMb: 16, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: der Fischzug (ein Boot auf dem See bei Sonnenaufgang, ein volles Netz mit Fischen, ein Kohlenfeuer am Ufer; Konturzeichnung)
  gift: { title: 'Der Fischzug', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Garten mit dem Felsengrab über die Straße nach Emmaus und den Saal in Jerusalem an den See und zum Hügel bei Bethanien, mit Stationen und Perlenweg aus osternPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/ostern/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0625, y: 0.6007, d: 0.0339 },
      { x: 0.2167, y: 0.6371, d: 0.0339 },
      { x: 0.3357, y: 0.5400, d: 0.0339 },
      { x: 0.4556, y: 0.6493, d: 0.0339 },
      { x: 0.5302, y: 0.6584, d: 0.0339 },
      { x: 0.6038, y: 0.6644, d: 0.0339 },
      { x: 0.6774, y: 0.5977, d: 0.0339 },
      { x: 0.8216, y: 0.7282, d: 0.0339 },
      { x: 0.9133, y: 0.5097, d: 0.0339 }
    ],
    exam: { x: 0.9829, y: 0.4854, d: 0.0339 },
    path: OSTERN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01-b.webp`,
      title: 'Das Grab ist leer',
      ref: 'Johannes 20,1–10',
      text: [
        'Es ist der erste Tag der Woche und noch finster, als Maria Magdalena zum Grab kommt. Der große Stein vor dem Eingang ist weggerollt. Maria läuft zu Simon Petrus und zu dem anderen Jünger, den Jesus liebhat. „Sie haben den Herrn aus dem Grab weggenommen“, ruft sie, „und wir wissen nicht, wohin sie ihn gelegt haben!“',
        'Da laufen die beiden Männer los, und der andere Jünger ist schneller als Petrus. Er kommt als Erster am Grab an, bückt sich und schaut hinein. Er sieht die Leinentücher liegen, aber er geht nicht hinein.',
        'Dann kommt Petrus und geht gleich in das Grab. Die Leinentücher liegen da. Das Tuch, das um Jesu Kopf gebunden war, liegt nicht dabei, sondern zusammengewickelt an einem besonderen Platz. Nun geht auch der andere Jünger hinein. Er sieht es und glaubt. Aus der Schrift wissen sie noch nicht, dass Jesus von den Toten auferstehen muss. Die beiden gehen wieder nach Hause.'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Finde Maria Magdalena, Petrus, den anderen Jünger und die Leinentücher im Garten.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Wer kommt früh zum Grab?', options: ['Maria Magdalena', 'Pilatus', 'ein Hirte'], answer: 0 },
        { q: 'Was ist mit dem Stein vor dem Grab?', options: ['Er ist weggerollt.', 'Er liegt noch davor.', 'Er ist zerbrochen.'], answer: 0 },
        { q: 'Was sehen die Jünger im Grab?', options: ['die Leinentücher', 'einen Schatz', 'ein Feuer'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Maria!',
      ref: 'Johannes 20,11–18',
      text: [
        'Maria steht draußen vor dem Grab und weint. Unter Tränen schaut sie hinein. Dort sitzen zwei Engel in weißen Kleidern. „Frau, warum weinst du?“, fragen sie. „Sie haben meinen Herrn weggenommen“, sagt Maria, „und ich weiß nicht, wohin sie ihn gelegt haben.“',
        'Da dreht sie sich um und sieht jemanden stehen. Es ist Jesus, aber sie weiß es nicht. „Frau, warum weinst du? Wen suchst du?“, fragt er. Maria hält ihn für den Gärtner. „Herr, wenn du ihn weggetragen hast, dann sag mir, wohin du ihn gelegt hast. Ich will ihn holen.“',
        '„Maria!“, sagt Jesus. Da wendet sie sich ihm zu. „Rabbuni!“, ruft sie, das heißt Meister. „Geh zu meinen Brüdern“, sagt Jesus, „und sag ihnen: Ich gehe hinauf zu meinem Vater und zu eurem Vater, zu meinem Gott und zu eurem Gott.“',
        'Maria Magdalena geht zu den Jüngern. „Ich habe den Herrn gesehen!“, erzählt sie, und sie sagt ihnen, was er zu ihr gesagt hat.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Wort in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wofür hält Maria den Mann am Grab?', options: ['für den Gärtner', 'für einen Soldaten', 'für einen Händler'], answer: 0 },
        { q: 'Was ruft Jesus?', options: ['Maria!', 'Petrus!', 'Thomas!'], answer: 0 },
        { q: 'Wohin schickt Jesus Maria?', options: ['zu den Jüngern, seinen Brüdern', 'zum Tempel', 'zum See'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Zwei Wanderer',
      ref: 'Lukas 24,13–27',
      text: [
        'Am selben Tag gehen zwei Jünger nach Emmaus, einem Dorf ein Stück von Jerusalem entfernt. Einer von ihnen heißt Kleopas. Unterwegs reden sie über alles, was in diesen Tagen geschehen ist.',
        'Da kommt Jesus selbst dazu und geht mit ihnen, aber sie erkennen ihn nicht. „Worüber redet ihr unterwegs?“, fragt er. Traurig bleiben die beiden stehen.',
        '„Du bist wohl der Einzige in Jerusalem, der nicht weiß, was dort geschehen ist“, sagt Kleopas. „Was denn?“, fragt Jesus. „Das mit Jesus von Nazareth“, sagen sie. „Er war ein Prophet, mächtig in Taten und Worten. Er wurde gekreuzigt. Wir hatten gehofft, dass er Israel erlöst. Heute früh waren Frauen am Grab. Sie haben seinen Leib nicht gefunden und sagen, er lebe.“',
        '„Musste der Christus nicht das alles leiden und dann in seine Herrlichkeit gehen?“, fragt Jesus. Und er erklärt ihnen, was in der ganzen Schrift von ihm steht, von Mose an und durch alle Propheten.'
      ],
      // Spiel: Weg (weg, alt)
      task: { kind: 'weg', hint: 'Finde den Weg nach Emmaus.', way: WEG },
      questions: [
        { q: 'Wohin gehen die zwei Jünger?', options: ['nach Emmaus', 'nach Bethlehem', 'ans Meer'], answer: 0 },
        { q: 'Wer geht mit ihnen, ohne dass sie ihn erkennen?', options: ['Jesus', 'Petrus', 'ein Hirte'], answer: 0 },
        { q: 'Was erklärt Jesus ihnen?', options: ['was in der Schrift von ihm steht', 'wie man Fische fängt', 'den Weg nach Jerusalem'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-b.webp`,
      title: 'Das Brot in Emmaus',
      ref: 'Lukas 24,28–35',
      text: [
        'Die beiden kommen nah an das Dorf, in das sie wollen. Jesus tut so, als ginge er weiter. Aber sie bitten ihn: „Bleib bei uns! Es wird Abend, und der Tag geht zu Ende.“ Da geht er mit hinein, um bei ihnen zu bleiben.',
        'Am Tisch nimmt Jesus das Brot, dankt, bricht es und gibt es ihnen. Da werden ihre Augen geöffnet, und sie erkennen ihn. Aber er verschwindet vor ihnen. „Brannte nicht unser Herz“, sagen sie zueinander, „als er unterwegs mit uns redete und uns die Schrift öffnete?“',
        'Noch in derselben Stunde stehen sie auf und gehen zurück nach Jerusalem. Dort sind die Jünger versammelt. „Der Herr ist wirklich auferstanden“, sagen die ihnen, „und Simon ist er erschienen!“ Da erzählen die beiden, was auf dem Weg geschehen ist und woran sie ihn erkannt haben: Er hat das Brot gebrochen.'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagen die beiden zu Jesus vor dem Dorf?', options: ['Bleib bei uns!', 'Geh weiter!', 'Wir kennen dich nicht.'], answer: 0 },
        { q: 'Woran erkennen sie Jesus?', options: ['Er bricht das Brot.', 'Er singt ein Lied.', 'Er zeigt ihnen ein Netz.'], answer: 0 },
        { q: 'Wohin gehen die beiden danach?', options: ['zurück nach Jerusalem', 'nach Nazareth', 'zum See'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05-b.webp`,
      title: 'Friede sei mit euch',
      ref: 'Lukas 24,36–43; Johannes 20,19–20',
      text: [
        'In Jerusalem reden die Jünger noch darüber, was die beiden aus Emmaus erzählt haben. Es ist Abend, und die Türen sind verschlossen, denn sie haben Angst. Plötzlich steht Jesus mitten unter ihnen. „Friede sei mit euch!“, sagt er.',
        'Die Jünger erschrecken und fürchten sich. Sie meinen, sie sehen einen Geist. „Warum seid ihr so erschrocken?“, fragt Jesus. „Seht meine Hände und meine Füße: Ich bin es selbst! Fasst mich an und seht: Ein Geist hat kein Fleisch und keine Knochen, wie ihr seht, dass ich sie habe.“ Und er zeigt ihnen seine Hände. Da werden die Jünger froh, dass sie den Herrn sehen.',
        'Aber vor lauter Freude können sie es noch nicht glauben und wundern sich. „Habt ihr etwas zu essen?“, fragt Jesus. Sie geben ihm ein Stück gebratenen Fisch. Er nimmt es und isst es vor ihren Augen.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Saal zusammen.', puzzle: { image: `${G}puzzle/saal.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was sagt Jesus, als er mitten unter die Jünger tritt?', options: ['Friede sei mit euch!', 'Fürchtet euch!', 'Geht nach Hause!'], answer: 0 },
        { q: 'Was meinen die Jünger zuerst?', options: ['Sie meinen, sie sehen einen Geist.', 'Sie meinen, sie sehen einen Gärtner.', 'Sie meinen, sie sehen einen Soldaten.'], answer: 0 },
        { q: 'Was isst Jesus vor ihnen?', options: ['ein Stück gebratenen Fisch', 'ein Stück Brot', 'eine Schale Trauben'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Thomas',
      ref: 'Johannes 20,24–29',
      text: [
        'Thomas, einer von den Zwölfen, den man Zwilling nennt, war nicht dabei, als Jesus zu den Jüngern kam. „Wir haben den Herrn gesehen!“, erzählen sie ihm. Aber Thomas antwortet: „Ich glaube es nicht, wenn ich ihn nicht selbst sehe.“',
        'Acht Tage später sind die Jünger wieder im Haus beieinander, und diesmal ist Thomas bei ihnen. Die Türen sind verschlossen. Da tritt Jesus mitten unter sie. „Friede sei mit euch!“, sagt er.',
        'Dann wendet er sich an Thomas. „Sieh meine Hände“, sagt er, „und sei nicht ungläubig, sondern gläubig!“',
        'Thomas antwortet: „Mein Herr und mein Gott!“',
        '„Du glaubst, weil du mich gesehen hast“, sagt Jesus. „Selig sind, die nicht sehen und doch glauben!“'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Wer war nicht dabei, als Jesus zu den Jüngern kam?', options: ['Thomas', 'Petrus', 'ein Hirte'], answer: 0 },
        { q: 'Was sagt Thomas den anderen Jüngern?', options: ['Ich glaube es nicht, wenn ich ihn nicht selbst sehe.', 'Ich glaube euch sofort.', 'Ich will nichts davon hören.'], answer: 0 },
        { q: 'Was sagt Thomas zu Jesus?', options: ['Mein Herr und mein Gott!', 'Ich kenne dich nicht!', 'Geh weg!'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07-b.webp`,
      title: 'Der Fischzug am See',
      ref: 'Johannes 21,1–14',
      text: [
        'Danach zeigt sich Jesus seinen Jüngern noch einmal, am See von Tiberias. Sieben von ihnen sind dort beieinander, unter ihnen Simon Petrus und Thomas. „Ich gehe fischen“, sagt Petrus. „Wir kommen mit“, sagen die anderen. Die ganze Nacht fangen sie nichts.',
        'Am Morgen steht jemand am Ufer, aber die Jünger wissen nicht, dass es Jesus ist. „Kinder, habt ihr nichts zu essen?“, ruft er. „Nein“, rufen sie zurück. „Werft das Netz auf der rechten Seite des Bootes aus“, sagt er, „dann werdet ihr etwas fangen.“ Sie werfen es aus und können es vor lauter Fischen nicht mehr einziehen.',
        '„Es ist der Herr!“, sagt der Jünger, den Jesus liebhat, zu Petrus. Da zieht Petrus sich den Mantel über und springt ins Wasser. Die anderen kommen im Boot nach. Am Ufer brennt ein Kohlenfeuer, und Fisch und Brot liegen darauf. „Bringt von den Fischen, die ihr gefangen habt“, sagt Jesus. Petrus zieht das Netz an Land, hundertdreiundfünfzig große Fische, und das Netz reißt nicht. „Kommt und esst!“, sagt Jesus, und er gibt ihnen Brot und Fisch.'
      ],
      // Spiel: Das Netz zur Rechten (fischzug, neu)
      task: { kind: 'fischzug', hint: 'Wirf das Netz dorthin, wo die Fische schwimmen.', fischzug: FISCHZUG },
      questions: [
        { q: 'Was fangen die Jünger in der Nacht?', options: ['nichts', 'sehr viele Fische', 'nur kleine Fische'], answer: 0 },
        { q: 'Wohin sollen sie das Netz werfen?', options: ['auf die rechte Seite des Bootes', 'auf die linke Seite des Bootes', 'ans Ufer'], answer: 0 },
        { q: 'Was tut Petrus, als er hört: Es ist der Herr?', options: ['Er springt ins Wasser.', 'Er versteckt sich im Boot.', 'Er läuft in die Berge.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Weide meine Lämmer',
      ref: 'Johannes 21,15–19',
      text: [
        'Das Essen am Kohlenfeuer ist vorbei. Da wendet sich Jesus an Simon Petrus. „Simon, Sohn des Jona“, fragt er, „hast du mich lieb, mehr als diese hier?“ „Ja, Herr“, antwortet Petrus, „du weißt, dass ich dich liebhabe.“ „Weide meine Lämmer!“, sagt Jesus.',
        'Noch einmal fragt er: „Simon, Sohn des Jona, hast du mich lieb?“ „Ja, Herr, du weißt, dass ich dich liebhabe.“ „Weide meine Schafe!“, sagt Jesus.',
        'Zum dritten Mal fragt er: „Simon, Sohn des Jona, hast du mich lieb?“ Petrus wird traurig, weil Jesus ihn zum dritten Mal fragt. „Herr, du weißt alles“, sagt er, „du weißt, dass ich dich liebhabe.“ „Weide meine Schafe!“, sagt Jesus.',
        'Dann sagt er zu Petrus: „Folge mir nach!“'
      ],
      // Spiel: Die Lämmer führen (weiden, neu)
      task: { kind: 'weiden', hint: 'Führe die Lämmer zur Weide.', graze: WEIDEN },
      questions: [
        { q: 'Was fragt Jesus Petrus?', options: ['Hast du mich lieb?', 'Willst du zurück nach Hause?', 'Hast du Hunger?'], answer: 0 },
        { q: 'Was sagt Jesus, als Petrus zum dritten Mal geantwortet hat?', options: ['Weide meine Schafe!', 'Fange Fische!', 'Geh nach Hause!'], answer: 0 },
        { q: 'Was sagt Jesus zum Schluss zu Petrus?', options: ['Folge mir nach!', 'Bleib hier am Feuer!', 'Fahre zurück zum Boot!'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Ihr seid Zeugen',
      ref: 'Lukas 24,44–53',
      text: [
        'Jesus sagt zu seinen Jüngern: „Alles muss erfüllt werden, was über mich im Gesetz des Mose, in den Propheten und in den Psalmen geschrieben steht.“ Dann öffnet er ihnen das Verständnis, sodass sie die Schrift verstehen.',
        '„So steht es geschrieben“, sagt er. „Der Christus muss leiden und am dritten Tag von den Toten auferstehen. In seinem Namen soll allen Völkern Umkehr und Vergebung der Sünden verkündet werden, und das beginnt in Jerusalem. Ihr aber seid Zeugen von alledem. Ich will auf euch senden, was mein Vater verheißen hat. Bleibt in der Stadt Jerusalem, bis ihr mit der Kraft aus der Höhe ausgerüstet werdet.“',
        'Dann führt Jesus sie hinaus bis nach Bethanien. Er hebt die Hände und segnet sie. Während er sie segnet, verlässt er sie und fährt auf in den Himmel. Die Jünger beten ihn an und gehen mit großer Freude zurück nach Jerusalem. Dort sind sie jeden Tag im Tempel und loben Gott.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Wort in die Lücke.', verse: VERS2 },
      questions: [
        { q: 'Wohin führt Jesus die Jünger?', options: ['bis nach Bethanien', 'auf den Berg bei Tiberias', 'zum Grab im Garten'], answer: 0 },
        { q: 'Was tut Jesus dort mit erhobenen Händen?', options: ['Er segnet sie.', 'Er ruft Soldaten.', 'Er baut ein Zelt.'], answer: 0 },
        { q: 'Wie gehen die Jünger nach Jerusalem zurück?', options: ['mit großer Freude', 'mit Angst', 'traurig und schweigend'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was ist mit dem Stein vor dem Grab?', options: ['Er ist weggerollt.', 'Er liegt noch davor.', 'Er ist zerbrochen.'], answer: 0 },
    { q: 'Wer geht mit ihnen, ohne dass sie ihn erkennen?', options: ['Jesus', 'Petrus', 'ein Hirte'], answer: 0 },
    { q: 'Woran erkennen sie Jesus?', options: ['Er bricht das Brot.', 'Er singt ein Lied.', 'Er zeigt ihnen ein Netz.'], answer: 0 },
    { q: 'Was sagt Thomas zu Jesus?', options: ['Mein Herr und mein Gott!', 'Ich kenne dich nicht!', 'Geh weg!'], answer: 0 },
    { q: 'Wohin sollen sie das Netz werfen?', options: ['auf die rechte Seite des Bootes', 'auf die linke Seite des Bootes', 'ans Ufer'], answer: 0 },
    { q: 'Was sagt Jesus zum Schluss zu Petrus?', options: ['Folge mir nach!', 'Bleib hier am Feuer!', 'Fahre zurück zum Boot!'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of ostern.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
// stages whose German recording is to be made again (listed here while the new file is not in; the old file stays in the folder). Empty: nothing is waiting.
const TO_RERECORD = new Set<number>([])
for (const s of ostern.stages) {
  const file = `audio/abenteuer/ostern/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) || TO_RERECORD.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the garden in the morning light, the way to Emmaus, breakfast at the lake); they follow one another at random
ostern.music = [
  'audio/abenteuer/ostern/musik-garten-v1.mp3',
  'audio/abenteuer/ostern/musik-emmaus-v1.mp3',
  'audio/abenteuer/ostern/musik-see-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(ostern, osternEn)
