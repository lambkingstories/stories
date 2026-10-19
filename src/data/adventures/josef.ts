/**
 * Adventure "Josef" for 5 to 8 years: twelve stages, retold from 1. Mose 37–50 (draft v1, read and approved by Anton on
 * 14.10.2026; source file `D:/Claude/Abenteuer-Josef/Josef_Reise_5-8_Entwurf_v1.md`). The Bible passages 42–44 and 46–47 are still
 * to be checked. In the data the right answer of a question is listed first (`answer: 0`); the options are shuffled when shown.
 */
import type { Journey, PaintJob, PaintZone } from '@/types/adventure'
import { JOSEF_PATH } from './josefPath'
import { localize } from './localize'
import { josefEn } from './en/josef.en'

const IMG = 'images/abenteuer/josef/'
const G = 'images/abenteuer/spiele/'

/**
 * Etappe 6 und 11, Ausmalen: die Elemente des Bildes, über die die Zusatzbedingungen sprechen (je ein Punkt mitten in jeder geschlossenen Fläche des
 * Strichbildes, am Bild gemessen: Abenteuer-Noah/SPIELE/ausmalen-*-zonen.json, Bild-Sitzung). Bei jedem Start werden drei Aufgaben (für verschiedene Elemente) aus dem Pool gezogen; jede erfüllte Aufgabe ist ein Stern.
 */
const AUSMALEN_6_ZONEN: Record<string, PaintZone> = {
  lichtstrahl: { seeds: [[69.14, 46.55], [57.93, 41.83], [49.64, 37.76]] },
  krug: { seeds: [[88.57, 77.83], [88.79, 68.77], [88.21, 71.88]] },
  gewand: { seeds: [[47.71, 65.61], [23.64, 48.96], [62.21, 51.63], [55.36, 50.4], [27.71, 52.44], [26.86, 56.51], [24.93, 59.67], [30.71, 58.44]] },
  teppich: { seeds: [[20.43, 79.43], [32.86, 79.0]] },
  fenster: { seeds: [[86.64, 7.02], [80.29, 7.61], [92.86, 8.03]] }
}
const AUSMALEN_6_AUFGABEN: PaintJob[] = [
  { zone: 'lichtstrahl', color: 'yellow', hint: 'Male den Lichtstrahl gelb.' },
  { zone: 'krug', color: 'brown', hint: 'Male den Krug braun.' },
  { zone: 'gewand', tool: 'watercolor', hint: 'Male Josefs Gewand mit Wasserfarbe.' },
  { zone: 'gewand', tool: 'felt', hint: 'Male Josefs Gewand mit dem Filzstift.' },
  { zone: 'teppich', tool: 'pencil', hint: 'Male den Teppich mit Buntstift.' },
  { zone: 'fenster', tool: 'chalk', hint: 'Male das Fenster mit Kreide.' }
]
const AUSMALEN_11_ZONEN: Record<string, PaintZone> = {
  himmel: { seeds: [[17.0, 11.4], [69.9, 1.5]] },
  gewand: { seeds: [[69.1, 90.0], [66.6, 45.5]] },
  rock: { seeds: [[31.3, 93.4], [33.1, 62.4], [35.6, 61.8]] },
  krug: { seeds: [[5.2, 75.0], [6.9, 69.7], [9.0, 74.0], [3.9, 72.6], [3.9, 65.2], [6.6, 85.3]] },
  saeulen: { seeds: [[10.2, 16.1], [5.2, 16.5], [13.2, 12.7], [9.0, 8.4], [7.6, 10.9], [8.4, 6.0], [8.6, 1.8], [23.5, 11.9], [23.5, 19.4], [22.9, 6.3], [24.6, 5.0], [93.8, 8.2], [93.7, 10.7], [90.9, 1.8]] }
}
const AUSMALEN_11_AUFGABEN: PaintJob[] = [
  { zone: 'himmel', color: 'blue', hint: 'Male den Himmel blau.' },
  { zone: 'krug', color: 'brown', hint: 'Male den großen Krug braun.' },
  { zone: 'gewand', tool: 'watercolor', hint: 'Male Josefs Gewand mit Wasserfarbe.' },
  { zone: 'gewand', tool: 'pencil', hint: 'Male Josefs Gewand mit Buntstift.' },
  { zone: 'rock', tool: 'felt', hint: 'Male den Rock des Jungen mit dem Filzstift.' },
  { zone: 'rock', tool: 'chalk', hint: 'Male den Rock des Jungen mit Kreide.' },
  { zone: 'saeulen', tool: 'pencil', hint: 'Male die Säulen mit Buntstift.' },
  { zone: 'saeulen', tool: 'chalk', hint: 'Male die Säulen mit Kreide.' }
]

export const josef: Journey = {
  id: 'josef',
  title: 'Josef',
  subtitle: 'Vom Lieblingssohn zum Herrn von Ägypten',
  age: '8-10',
  downloadMb: 17,
  medal: 'images/abenteuer/ui/medaille-josef.webp',
  /** A picture for the card on the start page and the choice of the journeys. */
  cover: `${IMG}reise.webp`,
  gift: { title: 'Josef im bunten Rock', image: `${IMG}geschenk.webp` },
  // one painted map, 9824 x 1632 px (OpenArt, GPT Image 2, 4K, three parts that join seamlessly, no symbols in it), cut into four pieces that lie side by side.
  // The 13 stations (spots on open ground next to their places) are in `panorama-openart2/stationen-final.json`; every gold ring is 336 px wide.
  // The dotted way is found by `scripts/measure-josef-panorama-path.py` along the roads of the painting.
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-${n}.webp`),
    ring: `${IMG}medaillon-ring.webp`,
    aspect: 9824 / 1632,
    stages: [
      { x: 0.0621, y: 0.4473, d: 0.0342 },
      { x: 0.1425, y: 0.3738, d: 0.0342 },
      { x: 0.2474, y: 0.4841, d: 0.0342 },
      { x: 0.3176, y: 0.5944, d: 0.0342 },
      { x: 0.4092, y: 0.6373, d: 0.0342 },
      { x: 0.468, y: 0.3738, d: 0.0342 },
      { x: 0.5477, y: 0.4228, d: 0.0342 },
      { x: 0.6230, y: 0.4534, d: 0.0342 },
      { x: 0.6718, y: 0.6127, d: 0.0342 },
      { x: 0.7940, y: 0.5147, d: 0.0342 },
      { x: 0.8439, y: 0.6556, d: 0.0342 },
      { x: 0.9131, y: 0.4902, d: 0.0342 }
    ],
    exam: { x: 0.9742, y: 0.5821, d: 0.0342 },
    path: JOSEF_PATH
  },
  stages: [
    {
      id: 1,
      title: 'Der Lieblingssohn',
      ref: '1. Mose 37,1–4',
      text: [
        'Josef ist siebzehn Jahre alt. Er wohnt mit seinem Vater Jakob und seinen Brüdern im Land Kanaan, und wie die großen Brüder hütet er die Schafe.',
        'Jakob hat Josef lieber als alle seine anderen Söhne, denn Josef ist der Sohn, der ihm im Alter geboren wurde. Eines Tages schenkt er ihm einen bunten Rock. So einen hat keiner der Brüder. Josef zieht ihn an und freut sich.',
        'Die Brüder sehen den Rock. Sie sehen auch, wie der Vater Josef anschaut. Da wird ihnen heiß im Bauch vor Neid. Sie können kein freundliches Wort mehr mit Josef reden, und bald hassen sie ihn.'
      ],
      task: { kind: 'puzzle', hint: 'Setze den bunten Rock zusammen.', puzzle: { image: `${G}puzzle/rock.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was schenkt Jakob dem Josef?', options: ['einen bunten Rock', 'einen Hirtenstab', 'ein Lamm'], answer: 0 },
        { q: 'Warum hat Jakob Josef lieber als seine anderen Söhne?', options: ['Er wurde ihm im Alter geboren', 'Er arbeitet am meisten', 'Er ist der Stärkste'], answer: 0 }
      ]
    },
    {
      id: 2,
      title: 'Die Träume',
      ref: '1. Mose 37,5–11',
      text: [
        'Eines Nachts hat Josef einen Traum. Am Morgen erzählt er ihn den Brüdern: „Wir haben auf dem Feld Korn in Garben gebunden. Meine Garbe richtete sich auf und blieb stehen. Eure Garben standen im Kreis darum und verneigten sich vor ihr.“',
        '„Willst du etwa unser König werden und über uns herrschen?“, fragen die Brüder. Der Traum und seine Worte machen sie noch zorniger.',
        'Nicht lange danach träumt Josef noch einmal. „Die Sonne, der Mond und elf Sterne haben sich vor mir verneigt“, erzählt er. Sogar sein Vater schüttelt den Kopf: „Sollen wir alle vor dir niederfallen?“',
        'Die Brüder werden eifersüchtig auf Josef. Aber Jakob vergisst den Traum nicht.'
      ],
      task: { kind: 'zaehlen', hint: 'Tippe die Sterne am Nachthimmel an und zähle sie.', count: 11, image: 'images/abenteuer/ui/stern-gold-{n}.webp', imageOff: 'images/abenteuer/ui/stern-aus-{n}.webp', background: `${IMG}himmel.webp` },
      questions: [
        { q: 'Was verbeugte sich im ersten Traum?', options: ['Garben', 'Schafe', 'Kamele'], answer: 0 },
        { q: 'Wer fragt: „Sollen wir alle vor dir niederfallen?“', options: ['Josefs Vater', 'Ruben', 'ein Händler'], answer: 0 }
      ]
    },
    {
      id: 3,
      title: 'Die Brüder',
      ref: '1. Mose 37,12–24',
      text: [
        'Die Brüder hüten die Schafe weit weg von zu Hause. Jakob sagt zu Josef: „Geh und sieh nach, ob es ihnen gut geht.“ Josef macht sich auf den weiten Weg. Auf dem Feld findet ihn ein Mann und zeigt ihm, wo die Brüder jetzt sind: in Dotan.',
        'Die Brüder entdecken ihn schon von Weitem. „Seht, da kommt der Träumer!“, rufen sie. Sie sind so wütend auf ihn, dass sie ihn loswerden wollen. Als Josef ankommt, nehmen sie ihm den bunten Rock weg und werfen ihn in eine tiefe Grube, in der kein Wasser ist.',
        'Nur Ruben, der älteste Bruder, will Josef helfen. „Tut ihm nichts an!“, sagt er. Er hofft, Josef später zum Vater zurückzubringen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin schickt Jakob den Josef?', options: ['zu den Brüdern', 'zum Markt', 'nach Ägypten'], answer: 0 },
        { q: 'Wer will Josef helfen?', options: ['Ruben', 'Juda', 'Benjamin'], answer: 0 },
        { q: 'Was nehmen die Brüder ihm weg?', options: ['den bunten Rock', 'die Schuhe', 'das Essen'], answer: 0 }
      ]
    },
    {
      id: 4,
      title: 'Auf dem Weg nach Ägypten',
      ref: '1. Mose 37,25–36',
      text: [
        'Die Brüder setzen sich zum Essen. Da sehen sie eine lange Karawane mit vielen Kamelen. Die Händler sind auf dem Weg nach Ägypten und haben duftendes Harz, Balsam und Myrrhe geladen.',
        'Juda sagt: „Wir wollen Josef nicht töten. Er ist doch unser Bruder. Verkaufen wir ihn lieber.“ Die anderen sind einverstanden. Für zwanzig Silberstücke geht Josef mit der Karawane nach Ägypten.',
        'Den bunten Rock bringen die Brüder zu ihrem Vater, aber sie sagen ihm nicht die Wahrheit. Jakob erkennt den Rock und weint um seinen Sohn. Seine Kinder wollen ihn trösten, doch er lässt sich nicht trösten. Viele Tage lang trauert er.',
        'Weit weg in Ägypten kauft ein Mann namens Potifar den Josef. Er ist ein Hauptmann des Königs, des Pharao.'
      ],
      task: {
        kind: 'weg',
        hint: 'Folge den Spuren der Karawane. Schau dir die Wege genau an.',
        way: {
          walker: `${G}weg/karawane.webp`,
          scenes: [
            { image: `${G}weg/weg-v2-1.webp`, goal: 'right' },
            { image: `${G}weg/weg-v2-2.webp`, goal: 'left' },
            { image: `${G}weg/weg-v2-3.webp`, goal: 'left' },
            { image: `${G}weg/weg-v2-4.webp`, goal: 'right' },
            // the last fork has three ways
            { image: `${G}weg/weg-v2-5.webp`, goal: 'middle', paths: 3 }
          ]
        }
      },
      questions: [
        { q: 'Wer schlägt vor, Josef zu verkaufen?', options: ['Juda', 'Ruben', 'Jakob'], answer: 0 },
        { q: 'Wer kauft Josef in Ägypten?', options: ['Potifar', 'der Pharao', 'Juda'], answer: 0 }
      ]
    },
    {
      id: 5,
      title: 'Bei Potifar',
      ref: '1. Mose 39,1–6',
      text: [
        'In Ägypten ist Josef nun ein Diener in Potifars Haus. Er ist fremd im Land und weit weg von seiner Familie. Doch er ist nicht allein: Gott ist bei ihm. Was Josef anpackt, gelingt, und Potifar sieht das mit eigenen Augen.',
        'Er macht Josef zu seinem Verwalter. Josef darf auf alles aufpassen, im Haus und auf dem Feld. Alles, was Potifar besitzt, vertraut er ihm an.',
        'Und Gott segnet Potifars Haus, weil Josef dort arbeitet. Potifar muss sich um nichts mehr kümmern, nur noch um sein Essen.'
      ],
      task: {
        kind: 'ernten',
        hint: 'Tippe die Früchte und das Gemüse von Potifars Feldern an. Steine und Dornen gehören nicht in den Korb.',
        harvest: {
          field: `${G}ernten/feld.webp`,
          basket: `${G}ernten/korb.webp`,
          fruits: ['traube', 'granat', 'melone', 'feige', 'garbe', 'lauch', 'moehre', 'dattel', 'zwiebel'].map((n) => `${G}ernten/${n}.webp`),
          // more thistles than stones: a stone is easy to see, a thistle between the fruit takes a closer look
          weeds: ['distel', 'dornbusch', 'stein', 'dornenzweig', 'stachelfrucht', 'distel'].map((n) => `${G}ernten/${n}.webp`),
          count: 14
        }
      },
      questions: [
        { q: 'Wer ist bei Josef in Ägypten?', options: ['Gott', 'niemand', 'sein Bruder'], answer: 0 },
        { q: 'Wozu macht Potifar den Josef?', options: ['zu seinem Verwalter', 'zu seinem Koch', 'zu seinem Wächter'], answer: 0 }
      ]
    },
    {
      id: 6,
      title: 'Im Gefängnis',
      ref: '1. Mose 39,7–23',
      text: [
        'Dann geschieht etwas Schlimmes. Potifars Frau erzählt ihrem Mann eine Lüge über Josef. Josef hat nichts Böses getan, aber Potifar glaubt der Lüge und wird zornig.',
        'Er lässt Josef ins Gefängnis bringen, wo die Gefangenen des Königs sitzen. Der Verwalter eines großen Hauses ist nun ein Gefangener, und das, obwohl er unschuldig ist.',
        'Doch auch dort ist Gott bei Josef. Der Aufseher im Gefängnis mag ihn und vertraut ihm. Bald darf Josef sich um alle Gefangenen kümmern, und was er anpackt, gelingt.'
      ],
      task: { kind: 'ausmalen', hint: 'Male das Bild voll aus.', image: `${IMG}etappe-06.webp`, zones: AUSMALEN_6_ZONEN, jobs: AUSMALEN_6_AUFGABEN, jobCount: 3 },
      questions: [
        { q: 'Warum kommt Josef ins Gefängnis?', options: ['Potifar glaubt einer Lüge', 'Josef hat etwas gestohlen', 'Josef ist weggelaufen'], answer: 0 },
        { q: 'Wer vertraut Josef im Gefängnis?', options: ['der Aufseher', 'Potifar', 'der Pharao'], answer: 0 }
      ]
    },
    {
      id: 7,
      title: 'Zwei Träume im Gefängnis',
      ref: '1. Mose 40',
      text: [
        'Im Gefängnis sitzen bald auch zwei Diener des Pharao: sein Mundschenk, der ihm den Wein einschenkt, und sein Bäcker. Beide haben den Pharao verärgert, und Josef soll sich um sie kümmern. Eines Morgens sind sie ganz traurig. „Wir hatten einen Traum“, sagen sie, „und keiner kann ihn deuten.“ Josef sagt: „Gott kann Träume deuten. Erzählt mir davon.“',
        'Der Mundschenk träumt von einem Weinstock mit drei Zweigen. Die Trauben werden reif, und er drückt sie in den Becher des Pharao. „Nach drei Tagen darfst du wieder zum Pharao zurück“, sagt Josef. „Bitte denk dann an mich! Ich habe nichts Unrechtes getan.“',
        'Dem Bäcker sagt Josef, dass sein Traum etwas Trauriges bedeutet. Es geschieht, wie Josef es gesagt hat. Der Mundschenk darf wieder zum Pharao, aber er vergisst den Josef, und Josef bleibt im Gefängnis.'
      ],
      task: {
        kind: 'memory',
        hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.',
        memory: {
          back: `${G}memory/rueck.webp`,
          // every picture is on two cards; the line tells what it is in the story (only things that are in the text)
          pairs: [
            { image: `${G}memory/wein.webp`, text: 'Der Weinstock: Davon träumt der Mundschenk.' },
            { image: `${G}memory/becher.webp`, text: 'Der Becher des Pharao: In ihn drückt der Mundschenk die Trauben aus.' },
            { image: `${G}memory/schenk.webp`, text: 'Der Mundschenk: Er schenkt dem Pharao den Wein ein.' },
            { image: `${G}memory/pharao.webp`, text: 'Der Pharao: Zu ihm darf der Mundschenk zurück.' },
            { image: `${G}memory/josef.webp`, text: 'Josef: Er deutet die Träume.' },
            { image: `${G}memory/gott.webp`, text: 'Gott: Er kann Träume deuten, sagt Josef.' }
          ]
        }
      },
      questions: [
        { q: 'Was sagt Josef dem Mundschenk?', options: ['Nach drei Tagen darfst du wieder zum Pharao zurück.', 'Du bleibst für immer im Gefängnis.', 'Du bekommst einen Sack voll Gold.'], answer: 0 },
        { q: 'Worum bittet Josef den Mundschenk?', options: ['an ihn zu denken', 'ihm Essen zu bringen', 'ihm einen neuen Rock zu schenken'], answer: 0 }
      ]
    },
    {
      id: 8,
      title: 'Der Traum des Pharao',
      ref: '1. Mose 41,1–32',
      text: [
        'Zwei Jahre später hat der Pharao selbst einen Traum. Er steht am Nil, und sieben dicke, schöne Kühe steigen aus dem Wasser und grasen am Ufer. Dann kommen sieben dünne, hässliche Kühe und fressen die dicken auf. Der Pharao wacht auf und schläft wieder ein. Er träumt von sieben vollen Ähren, und sieben dünne Ähren verschlingen sie.',
        'Am Morgen ist der Pharao unruhig. Er lässt alle Weisen des Landes rufen, aber keiner kann den Traum deuten. Da fällt dem Mundschenk der Josef wieder ein. Josef wird aus dem Gefängnis geholt, er bekommt frische Kleider und tritt vor den Pharao.',
        '„Nicht ich kann das deuten“, sagt er, „aber Gott gibt dem Pharao die Antwort.“ Beide Träume bedeuten dasselbe: Es kommen sieben gute Jahre mit viel Ernte. Danach kommen sieben Jahre mit Hunger.'
      ],
      task: {
        kind: 'zaehlen',
        hint: 'Tippe jede Kuh an und zähle mit: die dicken und die dünnen.',
        count: 14,
        image: '',
        question: 'Wie viele Kühe sind es zusammen?',
        background: `${G}kuehe/wiese.webp`,
        groups: [
          { image: `${G}kuehe/dick-{n}.webp`, imageOff: `${G}kuehe/dick-aus-{n}.webp`, count: 7 },
          { image: `${G}kuehe/duenn-{n}.webp`, imageOff: `${G}kuehe/duenn-aus-{n}.webp`, count: 7 }
        ]
      },
      questions: [
        { q: 'Wer gibt dem Pharao die Antwort?', options: ['Gott', 'die Weisen', 'der Mundschenk'], answer: 0 },
        { q: 'Was kommt nach den sieben guten Jahren?', options: ['sieben Jahre mit Hunger', 'sieben Jahre mit Regen', 'ein großes Fest'], answer: 0 }
      ]
    },
    {
      id: 9,
      title: 'Die Vorratshäuser',
      ref: '1. Mose 41,33–57',
      text: [
        'Josef sagt dem Pharao auch, was zu tun ist: „Such einen klugen Mann und setze ihn über das Land. Er soll in den guten Jahren viel Getreide sammeln, damit es in den Hungerjahren reicht.“',
        'Der Pharao antwortet: „Wer wäre klüger als du? Gottes Geist ist in dir.“ Er macht Josef zum Herrn über ganz Ägypten. Er gibt ihm seinen Siegelring, feine Kleider und eine goldene Kette. Josef ist inzwischen dreißig Jahre alt. Als Siebzehnjähriger wurde er nach Ägypten verkauft, nun steht er neben dem Pharao und regiert das Land.',
        'Josef sammelt in den guten Jahren so viel Getreide, dass man es nicht mehr zählen kann. Dann kommen die Hungerjahre, und nicht nur in Ägypten. Josef öffnet die Vorratshäuser. Menschen aus vielen Ländern kommen nach Ägypten, um Brot zu kaufen.'
      ],
      task: {
        kind: 'sortieren',
        hint: 'Ziehe jeden Getreidesack in das Vorratshaus mit der gleichen Farbe oder Form.',
        sort: {
          perBin: 2,
          bins: ['rot', 'blau', 'gruen'].map((c) => ({ id: c, house: `${G}sortieren/haus-${c}.webp`, sack: `${G}sortieren/sack-${c}.webp` })),
          // three rounds, each harder: first the color helps, then only the shape on the sack is left, last the sacks are many and the colors of the houses are gone, too
          rounds: [
            { perBin: 1, hint: 'Runde 1: Ziehe jeden Sack in das Vorratshaus mit der gleichen Farbe.' },
            { perBin: 2, graySacks: true, hint: 'Runde 2: Die Farbe fehlt! Schau auf die Form auf dem Sack und suche sie am Vorratshaus.' },
            { perBin: 2, graySacks: true, grayHouses: true, hint: 'Runde 3: Jetzt fehlen alle Farben. Nur die Formen helfen dir.' }
          ]
        }
      },
      questions: [
        { q: 'Was gibt der Pharao dem Josef?', options: ['einen Siegelring', 'eine silberne Krone', 'ein Schwert'], answer: 0 },
        { q: 'Wozu sammelt Josef das Getreide?', options: ['für die Hungerjahre', 'für ein Fest des Pharao', 'für die Reise nach Kanaan'], answer: 0 }
      ]
    },
    {
      id: 10,
      title: 'Die Brüder kommen',
      ref: '1. Mose 42–44',
      text: [
        'Auch im Land Kanaan gibt es kaum noch Brot. Jakob schickt zehn seiner Söhne nach Ägypten, um Getreide zu kaufen. Nur Benjamin, den Jüngsten, behält er bei sich, denn er hat Angst, dass ihm etwas zustößt.',
        'Die Brüder stehen vor dem Herrn von Ägypten und verneigen sich tief vor ihm. Sie ahnen nicht, dass er Josef ist. Josef erkennt sie sofort. Er redet streng mit ihnen und hält sie für Spione. „Bringt euren jüngsten Bruder zu mir“, sagt er, „dann glaube ich euch.“ Simeon muss bei ihm bleiben, bis sie wiederkommen.',
        'Als der Hunger zu Hause nicht aufhört, lässt Jakob sie noch einmal ziehen. Juda verspricht ihm, auf Benjamin aufzupassen, und diesmal ist Benjamin dabei. Josef lädt die Brüder zum Essen in sein Haus ein.',
        'Dann lässt Josef seinen silbernen Becher in Benjamins Sack legen. Als der Becher gefunden wird, sagt Josef: „Benjamin soll bei mir bleiben. Ihr anderen dürft in Frieden zu eurem Vater ziehen.“ Da tritt Juda vor. „Lass mich an seiner Stelle bleiben“, bittet er. „Ich will nicht, dass mein Vater noch einmal so traurig wird.“'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen behält Jakob bei sich zu Hause?', options: ['Benjamin', 'Ruben', 'Juda'], answer: 0 },
        { q: 'Wofür hält Josef die Brüder zuerst?', options: ['für Spione', 'für Freunde', 'für Nachbarn'], answer: 0 },
        { q: 'Wer bietet an, für Benjamin zu bleiben?', options: ['Juda', 'Ruben', 'Jakob'], answer: 0 }
      ]
    },
    {
      id: 11,
      title: 'Josef gibt sich zu erkennen',
      ref: '1. Mose 45,1–15',
      text: [
        'Nach Judas Worten kann Josef nicht mehr an sich halten. Er schickt alle Diener hinaus, damit er mit seinen Brüdern allein ist. Er weint so laut, dass man es im ganzen Haus hört. „Ich bin Josef!“, sagt er. „Lebt mein Vater noch?“ Die Brüder erschrecken so sehr, dass sie kein Wort herausbringen.',
        '„Kommt näher zu mir“, sagt Josef freundlich. „Ich bin euer Bruder, den ihr nach Ägypten verkauft habt. Seid nicht traurig und macht euch keine Vorwürfe. Gott hat mich vor euch hergeschickt, damit er Menschen am Leben erhält.“',
        'Dann umarmt Josef Benjamin, und beide weinen. Er küsst auch alle anderen Brüder. Alle weinen. Und endlich reden die Brüder mit ihm.'
      ],
      task: { kind: 'ausmalen', hint: 'Male das Bild voll aus.', image: `${IMG}etappe-11.webp`, zones: AUSMALEN_11_ZONEN, jobs: AUSMALEN_11_AUFGABEN, jobCount: 3 },
      questions: [
        { q: 'Wonach fragt Josef gleich nach seinem Namen?', options: ['ob sein Vater noch lebt', 'ob sie Hunger haben', 'ob Benjamin gesund ist'], answer: 0 },
        { q: 'Wer hat Josef nach Ägypten geschickt, sagt er?', options: ['Gott', 'der Pharao', 'die Händler'], answer: 0 }
      ]
    },
    {
      id: 12,
      title: 'Wiedersehen',
      ref: '1. Mose 45,16–28; 46,1–4.28–30; 47,28; 50,15–21',
      text: [
        'Der Pharao freut sich über Josefs Brüder. „Holt euren Vater und alle eure Familien“, sagt er. „Ihr sollt das Beste vom Land bekommen.“ Josef gibt ihnen Wagen und Essen mit auf den Weg und sagt: „Streitet nicht unterwegs!“',
        'Zu Hause sagen die Brüder: „Josef lebt! Er ist der Herr über ganz Ägypten.“ Jakob kann es zuerst nicht glauben. Doch als er die Wagen sieht, wird er wieder froh. „Josef lebt noch! Ich will ihn sehen, bevor ich sterbe“, sagt er.',
        'Jakob bricht mit seiner ganzen Familie auf. In der Nacht spricht Gott zu ihm: „Fürchte dich nicht, nach Ägypten zu ziehen. Ich gehe mit dir.“ Als Josef seinen Vater kommen sieht, fährt er ihm entgegen, fällt ihm um den Hals und weint lange.',
        'Siebzehn Jahre lebt Jakob noch in Ägypten, dann stirbt er. Die Brüder bekommen Angst, dass Josef sich jetzt rächt. Doch Josef sagt: „Fürchtet euch nicht! Ihr wolltet mir Böses tun, aber Gott hat es zum Guten gewendet.“ Er spricht freundlich mit ihnen und tröstet sie.'
      ],
      task: {
        kind: 'wimmelbild',
        hint: 'Finde die elf Brüder auf der Straße nach Ägypten. Manche verstecken sich!',
        count: 11,
        find: {
          scene: `${G}wimmel/strasse.webp`,
          // the middle of the feet and the width, in percent of the scene
          finds: [
            { image: `${G}wimmel/bruder-1.webp`, x: 9, y: 50, w: 12 },
            { image: `${G}wimmel/bruder-2.webp`, x: 40, y: 38, w: 8 },
            { image: `${G}wimmel/bruder-3.webp`, x: 60, y: 50, w: 12 },
            { image: `${G}wimmel/bruder-4.webp`, x: 84, y: 40, w: 11 },
            { image: `${G}wimmel/bruder-5.webp`, x: 22, y: 66, w: 13 },
            { image: `${G}wimmel/bruder-6.webp`, x: 59, y: 69, w: 14 },
            { image: `${G}wimmel/bruder-7.webp`, x: 46, y: 78, w: 15 },
            { image: `${G}wimmel/bruder-8.webp`, x: 12, y: 86, w: 15 },
            { image: `${G}wimmel/bruder-9.webp`, x: 89, y: 82, w: 15 },
            { image: `${G}wimmel/bruder-10.webp`, x: 28, y: 27, w: 8 },
            { image: `${G}wimmel/bruder-11.webp`, x: 62, y: 93, w: 15 }
          ],
          // in front of some of them, so that only a part of them looks out
          covers: [
            { image: `${G}wimmel/busch.webp`, x: 7, y: 54, w: 20 },
            { image: `${G}wimmel/faesser.webp`, x: 62, y: 55, w: 24 },
            { image: `${G}wimmel/fels.webp`, x: 86, y: 44, w: 20 },
            { image: `${G}wimmel/kruege.webp`, x: 18, y: 71, w: 18 },
            { image: `${G}wimmel/heu.webp`, x: 74, y: 71, w: 26 },
            { image: `${G}wimmel/busch2.webp`, x: 11, y: 91, w: 22 },
            { image: `${G}wimmel/dorn.webp`, x: 91, y: 87, w: 22 },
            { image: `${G}wimmel/palme.webp`, x: 25, y: 31, w: 16 },
            { image: `${G}wimmel/busch.webp`, x: 63, y: 98, w: 24 }
          ]
        }
      },
      questions: [
        { q: 'Was tut Josef, als er seinen Vater sieht?', options: ['er fällt ihm um den Hals', 'er wendet sich ab', 'er verneigt sich vor ihm'], answer: 0 },
        { q: 'Was sagt Josef nach Jakobs Tod zu den Brüdern?', options: ['„Fürchtet euch nicht!“', '„Geht fort!“', '„Gebt mir Silber!“'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was schenkt Jakob dem Josef?', options: ['einen bunten Rock', 'ein Schwert', 'ein Boot'], answer: 0 },
    { q: 'Wohin bringt die Karawane Josef?', options: ['nach Ägypten', 'nach Hause', 'ans Meer'], answer: 0 },
    { q: 'Wer ist in Ägypten bei Josef?', options: ['Gott', 'niemand', 'der Mundschenk'], answer: 0 },
    { q: 'Was sammelt Josef in den guten Jahren?', options: ['Getreide', 'Silber', 'Schafe'], answer: 0 },
    { q: 'Wer bietet an, für Benjamin zu bleiben?', options: ['Juda', 'Ruben', 'Jakob'], answer: 0 },
    { q: 'Wie endet die Geschichte?', options: ['Josef verzeiht seinen Brüdern', 'Josef bleibt im Gefängnis', 'Die Brüder gehen fort'], answer: 0 }
  ]
}

// one painted picture per stage (3:2), shown on the stage page
for (const s of josef.stages) {
  const nn = String(s.id).padStart(2, '0')
  // stage 10: Joseph wears the blue-and-white striped headcloth, so that his brothers do not know him (19.10.2026)
  s.image = s.id === 10 ? `${IMG}etappe-bild-10-v2.webp` : `${IMG}etappe-bild-${nn}.webp`
  // the story read aloud by a speech model (scripts/tts-gemini.py)
  s.audio = `audio/abenteuer/josef/geschichte-${nn}-v3.mp3`
}

// the background music of this journey (calm pieces made with Google's Lyria 3.5, see the skill `lambking-abenteuer-skill`, ton.md): they follow one another at random
josef.music = [
  'audio/abenteuer/josef/musik-huegel-v1.mp3',
  'audio/abenteuer/josef/musik-nil-v1.mp3',
  'audio/abenteuer/josef/musik-hoffnung-v1.mp3',
  'audio/abenteuer/josef/musik-wanderung-v1.mp3'
]

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(josef, josefEn)
