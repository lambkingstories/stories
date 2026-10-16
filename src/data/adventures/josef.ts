/**
 * Adventure "Josef" for 5 to 8 years: twelve stages, retold from 1. Mose 37–50 (draft v1, read and approved by Anton on
 * 14.10.2026; source file `D:/Claude/Abenteuer-Josef/Josef_Reise_5-8_Entwurf_v1.md`). The Bible passages 42–44 and 46–47 are still
 * to be checked. In the data the right answer of a question is listed first (`answer: 0`); the options are shuffled when shown.
 */
import type { Journey } from '@/types/adventure'
import { JOSEF_PATH } from './josefPath'

const IMG = 'images/abenteuer/josef/'
const G = 'images/abenteuer/spiele/'

export const josef: Journey = {
  id: 'josef',
  title: 'Josef',
  subtitle: 'Vom Lieblingssohn zum Herrn von Ägypten',
  age: '5-8',
  downloadMb: 16,
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
      { x: 0.4805, y: 0.2451, d: 0.0342 },
      { x: 0.5242, y: 0.4228, d: 0.0342 },
      { x: 0.6230, y: 0.4534, d: 0.0342 },
      { x: 0.6718, y: 0.6127, d: 0.0342 },
      { x: 0.7940, y: 0.5147, d: 0.0342 },
      { x: 0.8439, y: 0.6556, d: 0.0342 },
      { x: 0.9131, y: 0.4902, d: 0.0342 }
    ],
    exam: { x: 0.9548, y: 0.5882, d: 0.0342 },
    path: JOSEF_PATH
  },
  stages: [
    {
      id: 1,
      title: 'Der Lieblingssohn',
      ref: '1. Mose 37,1–4',
      text: [
        'Josef ist siebzehn Jahre alt. Er wohnt mit seinem Vater Jakob und seinen Brüdern im Land Kanaan, und wie die großen Brüder hütet er die Schafe.',
        'Jakob hat Josef lieber als alle seine anderen Söhne. Eines Tages schenkt er ihm einen bunten Rock. So einen hat keiner der Brüder. Josef zieht ihn an und freut sich.',
        'Die Brüder sehen den Rock. Sie sehen auch, wie der Vater Josef anschaut. Da wird ihnen heiß im Bauch vor Neid. Sie wollen nicht mehr freundlich mit Josef reden.'
      ],
      task: { kind: 'puzzle', hint: 'Setze den bunten Rock zusammen.', puzzle: { image: `${G}puzzle/rock.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was schenkt Jakob dem Josef?', options: ['einen bunten Rock', 'einen Hirtenstab', 'ein Lamm'], answer: 0 },
        { q: 'Wie fühlen sich die Brüder?', options: ['neidisch', 'fröhlich', 'müde'], answer: 0 }
      ]
    },
    {
      id: 2,
      title: 'Die Träume',
      ref: '1. Mose 37,5–11',
      text: [
        'In einer Nacht hat Josef einen Traum. Am Morgen erzählt er ihn den Brüdern: „Wir haben auf dem Feld Korn in Garben gebunden. Meine Garbe stand aufrecht da. Eure Garben standen im Kreis darum und haben sich vor ihr verbeugt.“',
        '„Willst du etwa unser König werden?“, fragen die Brüder. Sie ärgern sich noch mehr über ihn.',
        'Bald darauf träumt Josef noch einmal. „Die Sonne, der Mond und elf Sterne haben sich vor mir verneigt“, erzählt er. Sogar sein Vater schüttelt den Kopf: „Sollen wir alle vor dir niederfallen?“ Aber Jakob vergisst den Traum nicht.'
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
        'Die Brüder hüten die Schafe weit weg von zu Hause. Jakob sagt zu Josef: „Geh und sieh nach, ob es ihnen gut geht.“ Josef macht sich auf den weiten Weg. Ein Mann zeigt ihm, wo die Brüder jetzt sind: in Dotan.',
        'Die Brüder entdecken ihn schon von Weitem. „Seht, da kommt der Träumer!“, rufen sie. Sie sind so wütend, dass sie ihm nichts Gutes tun wollen. Als Josef ankommt, nehmen sie ihm den bunten Rock weg und werfen ihn in eine tiefe Grube, in der kein Wasser ist.',
        'Nur Ruben, der älteste Bruder, will Josef helfen. „Tut ihm nichts an!“, sagt er. Er hofft, ihn später zum Vater zurückzubringen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe wird nur erzählt. Beantworte die Fragen.' },
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
        'Den bunten Rock bringen die Brüder zu ihrem Vater, aber sie sagen ihm nicht die Wahrheit. Jakob erkennt den Rock und weint um seinen Sohn. Er weint viele Tage lang, und niemand kann ihn trösten.',
        'In Ägypten kauft ein Mann namens Potifar den Josef. Er ist ein Hauptmann des Königs, des Pharao.'
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
        { q: 'Wohin zieht die Karawane?', options: ['nach Ägypten', 'nach Hause', 'ans Meer'], answer: 0 },
        { q: 'Wer kauft Josef in Ägypten?', options: ['Potifar', 'der Pharao', 'Juda'], answer: 0 }
      ]
    },
    {
      id: 5,
      title: 'Bei Potifar',
      ref: '1. Mose 39,1–6',
      text: [
        'In Ägypten ist Josef nun ein Diener. Doch er ist nicht allein: Gott ist bei ihm. Was Josef anpackt, gelingt.',
        'Potifar merkt das. Er macht Josef zum Verwalter in seinem Haus. Josef darf auf alles aufpassen, im Haus und auf dem Feld. Und Gott segnet Potifars Haus, weil Josef dort arbeitet. Potifar muss sich um nichts mehr kümmern, nur noch um sein Essen.'
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
      questions: [{ q: 'Wer ist bei Josef in Ägypten?', options: ['Gott', 'niemand', 'sein Bruder'], answer: 0 }]
    },
    {
      id: 6,
      title: 'Im Gefängnis',
      ref: '1. Mose 39,7–23 (gekürzt)',
      text: [
        'Dann geschieht etwas Schlimmes. Jemand erzählt eine Lüge über Josef. Er hat nichts Böses getan, aber Potifar glaubt der Lüge und wird zornig. Er lässt Josef ins Gefängnis bringen, wo die Gefangenen des Königs sitzen.',
        'Doch auch dort ist Gott bei Josef. Der Aufseher im Gefängnis mag ihn und vertraut ihm. Josef darf sich um alle Gefangenen kümmern.'
      ],
      task: { kind: 'ausmalen', hint: 'Male Josef im Gefängnis aus. Das Licht fällt durch das Fenster.', image: `${IMG}etappe-06.webp` },
      questions: [
        { q: 'Ist Gott auch im Gefängnis bei Josef?', options: ['ja', 'nein'], answer: 0 },
        { q: 'Wer vertraut Josef im Gefängnis?', options: ['der Aufseher', 'Potifar', 'der Pharao'], answer: 0 }
      ]
    },
    {
      id: 7,
      title: 'Zwei Träume im Gefängnis',
      ref: '1. Mose 40',
      text: [
        'Im Gefängnis sitzen auch zwei Diener des Pharao: sein Mundschenk, der ihm den Wein einschenkt, und sein Bäcker. Eines Morgens sind beide ganz traurig. „Wir hatten einen Traum“, sagen sie, „und keiner kann ihn deuten.“ Josef sagt: „Gott kann Träume deuten. Erzählt mir davon.“',
        'Der Mundschenk träumt von einem Weinstock mit drei Zweigen. Die Trauben werden reif, und er drückt sie in den Becher des Pharao. „Nach drei Tagen darfst du wieder zum Pharao zurück“, sagt Josef. „Bitte denk dann an mich!“',
        'Dem Bäcker sagt Josef, dass sein Traum etwas Trauriges bedeutet. Es geschieht, wie Josef es gesagt hat. Der Mundschenk aber vergisst den Josef.'
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
        { q: 'Wer deutet die Träume?', options: ['Gott durch Josef', 'die Wache', 'der Bäcker'], answer: 0 }
      ]
    },
    {
      id: 8,
      title: 'Der Traum des Pharao',
      ref: '1. Mose 41,1–32',
      text: [
        'Zwei Jahre später hat der Pharao selbst einen Traum. Sieben dicke, schöne Kühe stehen am Nil. Dann kommen sieben dünne, hässliche Kühe und fressen die dicken auf. Der Pharao wacht auf und schläft wieder ein. Er träumt von sieben vollen Ähren, und sieben dünne Ähren verschlingen sie.',
        'Keiner im ganzen Land kann den Traum deuten. Da fällt dem Mundschenk der Josef wieder ein. Josef wird aus dem Gefängnis geholt. „Nicht ich kann das deuten“, sagt er, „aber Gott gibt dem Pharao die Antwort.“',
        'Josef sagt: „Es kommen sieben gute Jahre mit viel Ernte. Danach kommen sieben Jahre mit Hunger.“'
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
        'Josef sagt dem Pharao auch, was zu tun ist: „Such einen klugen Mann. Er soll in den guten Jahren viel Getreide sammeln, damit es in den Hungerjahren reicht.“',
        'Der Pharao antwortet: „Wer wäre klüger als du? Gottes Geist ist in dir.“ Er macht Josef zum Herrn über ganz Ägypten. Er gibt ihm seinen Siegelring, feine Kleider und eine goldene Kette. Josef ist dreißig Jahre alt.',
        'Josef sammelt in den guten Jahren so viel Getreide, dass man es nicht mehr zählen kann. Dann kommen die Hungerjahre. Josef öffnet die Vorratshäuser. Menschen aus vielen Ländern kommen nach Ägypten, um Brot zu kaufen.'
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
        { q: 'Was gibt der Pharao dem Josef?', options: ['einen Siegelring', 'ein Schwert', 'ein Schaf'], answer: 0 },
        { q: 'Wozu sammelt Josef das Getreide?', options: ['für die Hungerjahre', 'zum Spielen', 'für ein Fest'], answer: 0 }
      ]
    },
    {
      id: 10,
      title: 'Die Brüder kommen',
      ref: '1. Mose 42–44 (gekürzt, noch zu prüfen)',
      text: [
        'Auch im Land Kanaan gibt es kein Brot mehr. Jakob schickt zehn seiner Söhne nach Ägypten, um Getreide zu kaufen. Nur Benjamin, den Jüngsten, behält er bei sich.',
        'Die Brüder stehen vor dem Herrn von Ägypten und verneigen sich tief vor ihm. Sie ahnen nicht, dass er Josef ist. Josef erkennt sie sofort. Er redet streng mit ihnen und stellt sie auf die Probe. Später müssen sie noch einmal kommen, und diesmal bringen sie Benjamin mit.',
        'Josef lässt einen silbernen Becher in Benjamins Sack legen. Er sagt: „Benjamin muss bei mir bleiben.“ Da tritt Juda vor. „Lass mich an seiner Stelle bleiben“, bittet er. „Ich will nicht, dass mein Vater noch einmal so traurig wird.“'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Beantworte die Fragen.' },
      questions: [
        { q: 'Wer bleibt bei Jakob zu Hause?', options: ['Benjamin', 'Ruben', 'Juda'], answer: 0 },
        { q: 'Was tun die Brüder vor Josef?', options: ['sie verneigen sich', 'sie rennen weg', 'sie lachen'], answer: 0 },
        { q: 'Wer bietet an, für Benjamin zu bleiben?', options: ['Juda', 'Ruben', 'Jakob'], answer: 0 }
      ]
    },
    {
      id: 11,
      title: 'Josef gibt sich zu erkennen',
      ref: '1. Mose 45,1–15',
      text: [
        'Da kann Josef nicht mehr an sich halten. Er schickt alle Diener hinaus. Er weint so laut, dass man es im ganzen Haus hört. „Ich bin Josef!“, sagt er. „Lebt mein Vater noch?“ Die Brüder erschrecken so sehr, dass sie kein Wort herausbringen.',
        '„Kommt näher zu mir“, sagt Josef freundlich. „Ich bin euer Bruder, den ihr nach Ägypten verkauft habt. Seid nicht traurig und macht euch keine Vorwürfe. Gott hat mich vor euch hergeschickt, damit er Menschen am Leben erhält.“',
        'Dann umarmt Josef Benjamin und küsst alle seine Brüder. Alle weinen. Und endlich reden die Brüder mit ihm.'
      ],
      task: { kind: 'ausmalen', hint: 'Male Josef und seine Brüder aus.', image: `${IMG}etappe-11.webp` },
      questions: [
        { q: 'Was ruft Josef zuerst?', options: ['„Ich bin Josef!“', '„Geht weg!“', '„Wer seid ihr?“'], answer: 0 },
        { q: 'Wer hat Josef nach Ägypten geschickt, sagt er?', options: ['Gott', 'der Pharao', 'die Händler'], answer: 0 }
      ]
    },
    {
      id: 12,
      title: 'Wiedersehen',
      ref: '1. Mose 45,16–28; 46,28–30; 50,15–21 (46 noch zu prüfen)',
      text: [
        'Der Pharao freut sich über Josefs Brüder. „Holt euren Vater und alle eure Familien“, sagt er. „Ihr sollt das Beste vom Land bekommen.“ Josef gibt ihnen Wagen und Essen mit auf den Weg.',
        'Zu Hause sagen die Brüder: „Josef lebt! Er ist der Herr über ganz Ägypten.“ Jakob kann es zuerst nicht glauben. Doch als er die Wagen sieht, wird er wieder froh. „Josef lebt noch! Ich will ihn sehen, bevor ich sterbe“, sagt er.',
        'Als Josef seinen Vater sieht, fällt er ihm um den Hals und weint lange. Später, nach Jakobs Tod, haben die Brüder Angst vor Josef. Er sagt: „Fürchtet euch nicht! Ihr wolltet mir Böses tun, aber Gott hat es zum Guten gewendet.“'
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
        { q: 'Wer ist Jakob für Josef?', options: ['sein Vater', 'sein Onkel', 'sein Freund'], answer: 0 },
        { q: 'Was sagt Josef zu den Brüdern?', options: ['„Fürchtet euch nicht!“', '„Geht fort!“', '„Gebt mir Silber!“'], answer: 0 }
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
  s.image = `${IMG}etappe-bild-${nn}.webp`
  // the story read aloud by a speech model (scripts/tts-gemini.py)
  s.audio = `audio/abenteuer/josef/geschichte-${nn}.mp3`
}
