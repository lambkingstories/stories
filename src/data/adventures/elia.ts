/**
 * Abenteuer "Elia" (1. Könige 17–19, 2. Könige 2) für 8 bis 10 Jahre: 9 Etappen, Untertitel "Das Feuer, der Regen und das stille Sausen". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 23.10.2026).
 * Quelle der Texte: D:/Claude/Abenteuer-Elia/ENTWURF_Elia.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Prüfung: PRUEFBERICHT-BIBELTREUE-2026-10-22.md (und die Nachprüfung vom 23.10.2026),
 * Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md. Nicht erzählt: die Hinrichtung der Baals-Propheten, Isebels Mordbefehle, Elias Todeswunsch, Nabots Weinberg, die Bären.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, höchstens zwei alte Mechaniken): 1 Raben im Anflug (neu), 2 Gießen (alt), 3 nur Quiz, 4 In zwei Höhlen (neu), 5 Lückenvers (alt), 6 nur Quiz, 7 Wolken zum Regnen bringen (neu),
 * 8 Das stille Sausen (neu), 9 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/elia/, images/abenteuer/spiele/elia/<spiel>/, audio/abenteuer/elia/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CavesGame, Journey, RainGame, RavensGame, VerseGame, WaterGame, WhisperGame } from '@/types/adventure'
import { josef } from './josef'
import { ELIA_PATH } from './eliaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { eliaEn } from './en/elia.en'

// Etappenbilder (Variante a der neuen Bilder; Anton wählt auf der Vorschau-Seite a/b): `images/abenteuer/elia/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/elia/'

const G = 'images/abenteuer/spiele/elia/'

/**
 * Etappe 1, "Raben im Anflug": das Tal am Bach Krit, Elia sitzt links auf seinem Felsen; Raben fliegen von rechts nach links, das Kind tippt die mit Brot oder Fleisch an (sie landen auf der Felsplatte rechts neben Elia),
 * nicht die mit einem Zweig oder mit leerem Schnabel (neu). Runde 1 der Morgen (vier Raben, langsam), Runde 2 der Abend (sechs Raben, etwas schneller). Bilder (Bildauftrag E30): `raben/tal.webp` 1200 × 900,
 * `rabe-brot/fleisch/zweig/leer.webp` (Sprites auf gleich großen durchsichtigen Flächen 420 × 320), `brot.webp`, `fleisch.webp`. Die Felsplatte, auf der das Essen liegt, hat ihre Oberfläche bei 74 % der Höhe, von 55 bis 97 % der Breite.
 */
const RABEN: RavensGame = {
  background: `${G}raben/tal.webp`,
  ravens: { bread: `${G}raben/rabe-brot.webp`, meat: `${G}raben/rabe-fleisch.webp`, twig: `${G}raben/rabe-zweig.webp`, empty: `${G}raben/rabe-leer.webp` },
  food: { bread: `${G}raben/brot.webp`, meat: `${G}raben/fleisch.webp` },
  rock: { x: 60, y: 74, step: 9, w: 8 },
  ravenW: 21,
  rounds: [
    {
      hint: 'Morgen: Tippe die Raben an, die Brot oder Fleisch bringen.',
      flights: [
        { kind: 'bread', y: 24, at: 0, dur: 9500 },
        { kind: 'twig', y: 36, at: 2800, dur: 9500 },
        { kind: 'meat', y: 15, at: 5400, dur: 9500 },
        { kind: 'bread', y: 30, at: 8200, dur: 9500 }
      ]
    },
    {
      hint: 'Abend: Es kommen mehr Raben. Tippe nur die mit Essen an.',
      flights: [
        { kind: 'bread', y: 20, at: 0, dur: 8000 },
        { kind: 'empty', y: 36, at: 1700, dur: 8000 },
        { kind: 'meat', y: 14, at: 3300, dur: 8000 },
        { kind: 'twig', y: 29, at: 4800, dur: 8000 },
        { kind: 'bread', y: 23, at: 6300, dur: 8000 },
        { kind: 'meat', y: 34, at: 7800, dur: 8000 }
      ]
    }
  ]
}

/**
 * Etappe 2, "Gießen" (alte Mechanik, hier mit Öl): das Kind füllt am großen Vorratskrug der Witwe den kleinen Krug mit Öl und füllt die Schalen (Bildauftrag E34). Der Vorratskrug (`river`: Ecke x, y, Breite, Höhe) steht links im Hof bei 3–31 % der Breite und 40–68 % der Höhe;
 * die drei Plätze der Schalen (Mitte x, Fußpunkt y, Breite) liegen auf dem Steinboden bei 75 % der Höhe. Bilder: `giessen/hof.webp` 900 × 1200, `krug-leer/voll.webp` (200 × 240), `schale.webp`, `schale-voll.webp` (220 × 140).
 */
const GIESSEN: WaterGame = {
  scene: `${G}giessen/hof.webp`,
  river: { x: 0, y: 38, w: 34, h: 34 },
  jugEmpty: `${G}giessen/krug-leer.webp`,
  jugFull: `${G}giessen/krug-voll.webp`,
  texts: {
    river: 'Der große Ölkrug: den kleinen Krug füllen',
    fillFirst: 'Fülle den Krug zuerst am großen Ölkrug.',
    enough: 'Diese Schale ist schon voll.',
    once: 'Gut! Diese Schale ist tief: noch ein Krug.',
    done: 'Alle Schalen sind voll, und der große Krug ist nicht leer geworden.'
  },
  plants: [
    { id: 'schale-1', small: `${G}giessen/schale.webp`, grown: `${G}giessen/schale-voll.webp`, label: 'Erste Schale', x: 45, y: 75, w: 19, need: 1 },
    { id: 'schale-2', small: `${G}giessen/schale.webp`, grown: `${G}giessen/schale-voll.webp`, label: 'Zweite Schale', x: 66, y: 75, w: 19, need: 1 },
    { id: 'schale-3', small: `${G}giessen/schale.webp`, grown: `${G}giessen/schale-voll.webp`, label: 'Dritte Schale', x: 87, y: 75, w: 19, need: 1 },
    { id: 'tief-1', small: `${G}giessen/schale.webp`, grown: `${G}giessen/schale-voll.webp`, label: 'Erste tiefe Schale', x: 45, y: 75, w: 19, need: 2 },
    { id: 'tief-2', small: `${G}giessen/schale.webp`, grown: `${G}giessen/schale-voll.webp`, label: 'Zweite tiefe Schale', x: 66, y: 75, w: 19, need: 2 }
  ],
  rounds: [
    { hint: 'Hole Öl aus dem großen Krug und fülle die Schalen. Der große Krug wird nicht leer.', plants: ['schale-1', 'schale-2', 'schale-3'] },
    { hint: 'Die tiefen Schalen brauchen zwei Krüge.', plants: ['tief-1', 'tief-2'] }
  ]
}

/**
 * Etappe 4, "In zwei Höhlen": acht Propheten warten im Hof vor zwei Höhlen; das Kind bringt jeden in eine der beiden, in beide müssen gleich viele (neu). Runde 1 vier Propheten (zwei und zwei), Runde 2 acht (vier und vier).
 * Bilder (Bildauftrag E31): `hoehlen/hang.webp` 1200 × 900 (die Höhlenmünder bei 25 und 75 Prozent der Breite, 34–57 Prozent der Höhe; der Hof ab 58 Prozent), `prophet-1..8.webp` (aus EINEM Bogen geschnitten,
 * gleicher Maßstab, auf gleich großen durchsichtigen Flächen 200 × 400).
 */
const HOEHLEN: CavesGame = {
  background: `${G}hoehlen/hang.webp`,
  prophets: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `prophet-${n}`, image: `${G}hoehlen/prophet-${n}.webp`, label: `Prophet ${n}` })),
  caves: [
    { x: 25, y: 45, w: 17, h: 24 },
    { x: 75.5, y: 45, w: 17, h: 23 }
  ],
  yard: { x0: 16, x1: 84, y: 82, row: 16, w: 14 },
  rounds: [
    { hint: 'Bringe die Propheten in die zwei Höhlen, in jede gleich viele.', count: 4 },
    { hint: 'Jetzt sind es mehr. Wieder in jede Höhle gleich viele.', count: 8 }
  ]
}

/**
 * Etappe 5, "Lückenvers" (alte Mechanik): Elias Frage und sein Wort an das Volk aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Daniel, kopiert. Hintergrund ist das Etappenbild 5, von der App weichgezeichnet (`soft`).
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-05.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Wie lange hinkt ihr auf beiden ', '?“'], words: ['Seiten', 'Wegen', 'Bergen'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Ist der Herr ', ', so folgt ihm ', '.“'], words: ['Gott', 'nach', 'Baal', 'vor'], answers: [0, 1] }
  ]
}

/**
 * Etappe 7, "Wolken zum Regnen bringen": der Gipfel des Karmel über dem Meer, trocken und leer; Runde 1 eine winzige Wolke wie eine Hand steigt aus dem Meer (zwei Tipps lassen sie wachsen und regnen), Runde 2 sechs Wolken ziehen
 * herein, jede muss einmal angetippt werden, bevor sie vorbeigezogen ist (neu). Mit jedem Regen wird das trockene Bild in das grüne überblendet. Bilder (Bildauftrag E32): `regen/karmel-trocken.webp` und `karmel-gruen.webp`
 * (je 1200 × 900, derselbe Aufbau, der Horizont bei 45 Prozent der Höhe, drei Krüge unten: leer und voll), `wolke-1/2/3.webp` (eng zugeschnitten, 114 / 322 / 548 px breit, also 9,5 / 27 / 46 Prozent von 1200), `tropfen.webp` (Magenta freigestellt).
 */
const REGEN: RainGame = {
  dry: `${G}regen/karmel-trocken.webp`,
  green: `${G}regen/karmel-gruen.webp`,
  clouds: [`${G}regen/wolke-1.webp`, `${G}regen/wolke-2.webp`, `${G}regen/wolke-3.webp`],
  cloudW: [9.5, 27, 46],
  drops: `${G}regen/tropfen.webp`,
  sea: { x: 62, y: 44 },
  rounds: [
    { hint: 'Eine winzige Wolke steigt aus dem Meer. Tippe sie zweimal an.', mode: 'grow', clouds: [{ y: 44, at: 0, dur: 0 }] },
    {
      hint: 'Sechs Wolken ziehen herein. Tippe jede an, bevor sie vorbeigezogen ist.',
      mode: 'pass',
      clouds: [
        { y: 14, at: 0, dur: 11000 },
        { y: 26, at: 2600, dur: 11000 },
        { y: 16, at: 5200, dur: 11000 },
        { y: 28, at: 7800, dur: 11000 },
        { y: 12, at: 10400, dur: 11000 },
        { y: 24, at: 13000, dur: 11000 }
      ]
    }
  ]
}

/**
 * Etappe 8, "Das stille Sausen": der Berg Horeb mit der Höhle, Elia steht am Eingang; zuerst braust ein Wind, dann bebt die Erde, dann brennt ein Feuer (Gott war nicht darin: ein Tipp darauf ist ein Fehler), dann kommt
 * das leise, weiche Licht, nur das tippt das Kind an (neu). Runde 2: andere Reihenfolge, länger, längere Stille vor dem leisen Sausen. Bilder (Bildauftrag E33): `sausen/horeb.webp` 1200 × 900 (die Höhle bei 20–40 Prozent der Breite,
 * der Boden vor dem Eingang bei 70 Prozent der Höhe), `elia-steht.webp` und `elia-verhuellt.webp` (aus EINEM Bogen, Sprites auf gleich großen Flächen 360 × 640), `wirbel.webp`, `flammen.webp`, `feder.webp` (hell auf Schwarz, die App
 * mischt mit `screen`), `risse.webp` (freigestellt).
 */
const SAUSEN: WhisperGame = {
  background: `${G}sausen/horeb.webp`,
  standing: `${G}sausen/elia-steht.webp`,
  veiled: `${G}sausen/elia-verhuellt.webp`,
  elia: { x: 31, y: 72, w: 17 },
  wind: `${G}sausen/wirbel.webp`,
  fire: `${G}sausen/flammen.webp`,
  cracks: `${G}sausen/risse.webp`,
  feather: `${G}sausen/feder.webp`,
  rounds: [
    { hint: 'Warte. Tippe nur auf das leise Sausen.', order: ['wind', 'quake', 'fire'], loudMs: 3000, gapMs: 800, silenceMs: 2000 },
    { hint: 'Noch einmal: Warte. Die lauten Dinge kommen in einer anderen Reihenfolge.', order: ['fire', 'wind', 'quake'], loudMs: 4000, gapMs: 600, silenceMs: 2800 }
  ]
}

export const elia: Journey = {
  id: 'elia',
  title: 'Elia',
  subtitle: 'Das Feuer, der Regen und das stille Sausen',
  age: '8-10',
  downloadMb: 12, // vorläufig; nach dem Bau messen (der Test sagt die echte Größe)
  medal: `${PICS}medaille-v3.webp`, // Medaille (Antons Wahl auf der Auswahlseite; bis dahin Entwurf 1)
  // Geschenk-Ausmalbild: Die Geschichte von Elia in einem Bild (Konturzeichnung)
  gift: { title: 'Elia und die Raben', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, OpenAI-Bildmodell gpt-image-2.5-sunburst, Qualität max, mit neun Orten und dem Ziel) mit Stationen und Perlenweg aus eliaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/elia/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0888, y: 0.6432, d: 0.0339 },
      { x: 0.1968, y: 0.6432, d: 0.0339 },
      { x: 0.2927, y: 0.6432, d: 0.0339 },
      { x: 0.4239, y: 0.6462, d: 0.0339 },
      { x: 0.5046, y: 0.6462, d: 0.0339 },
      { x: 0.5652, y: 0.6462, d: 0.0339 },
      { x: 0.7317, y: 0.6462, d: 0.0339 },
      { x: 0.8160, y: 0.6462, d: 0.0339 },
      { x: 0.8730, y: 0.6462, d: 0.0339 }
    ],
    exam: { x: 0.9740, y: 0.6432, d: 0.0339 },
    path: ELIA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Kein Regen, und die Raben',
      ref: '1. Könige 17,1–7',
      text: [
        'Elia ist ein Prophet Gottes. Er tritt vor den König Ahab. „So wahr Gott lebt, dem ich diene“, sagt er. „In diesen Jahren wird es weder Tau noch Regen geben, wenn ich es nicht sage.“',
        'Dann spricht Gott zu Elia: „Geh weg von hier und verbirg dich am Bach Krit. Aus dem Bach sollst du trinken. Und ich habe den Raben geboten, dass sie dich versorgen.“',
        'Elia geht hin und setzt sich an den Bach. Die Raben bringen ihm Brot und Fleisch, am Morgen und am Abend. Er trinkt aus dem Bach. Nach einiger Zeit aber vertrocknet der Bach, denn es regnet nicht im Land.'
      ],
      // Spiel: Raben im Anflug (raben, neu)
      task: { kind: 'raben', hint: 'Tippe die Raben an, die Brot bringen.', ravens: RABEN },
      questions: [
        { q: 'Wer bringt Elia Brot und Fleisch?', options: ['die Raben', 'die Hirten', 'die Engel'], answer: 0 },
        { q: 'Warum vertrocknet der Bach?', options: ['Es regnet nicht im Land.', 'Ein Damm wird gebaut.', 'Elia trinkt ihn leer.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Die Witwe von Zarpat',
      ref: '1. Könige 17,8–16',
      text: [
        'Da spricht Gott wieder zu Elia: „Geh nach Zarpat. Dort habe ich einer Witwe geboten, dass sie dich versorgt.“ Am Stadttor von Zarpat steht eine Frau und liest Holz auf. Elia bittet sie um Wasser und um einen Bissen Brot.',
        'Die Frau sagt: „Ich habe kein Brot. Ich habe nur eine Handvoll Mehl im Topf und ein wenig Öl im Krug. Davon will ich für mich und meinen Sohn ein letztes Essen backen.“',
        '„Fürchte dich nicht“, sagt Elia. „Backe zuerst ein kleines Brot für mich. Denn so spricht Gott: Das Mehl im Topf soll nicht ausgehen, und dem Ölkrug soll nichts fehlen, bis es wieder regnet.“ Die Frau tut, was Elia sagt. Und das Mehl und das Öl gehen nicht aus, viele Tage lang.'
      ],
      // Spiel: Gießen (giessen, alt 1 von 2)
      task: { kind: 'giessen', hint: 'Hole Öl aus dem großen Krug und fülle die Schalen. Er wird nicht leer.', water: GIESSEN },
      questions: [
        { q: 'Was hat die Witwe noch im Haus?', options: ['eine Handvoll Mehl und ein wenig Öl', 'viele Brote', 'einen vollen Weinschlauch'], answer: 0 },
        { q: 'Was verspricht Elia im Namen Gottes?', options: ['Mehl und Öl gehen nicht aus.', 'Es regnet morgen.', 'Der Sohn wird König.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Der Sohn der Witwe',
      ref: '1. Könige 17,17–24',
      text: [
        'Nach einiger Zeit wird der Sohn der Witwe sehr krank. Es wird so schlimm, dass er nicht mehr atmet. Die Mutter ruft verzweifelt: „Du Mann Gottes, bist du zu mir gekommen, damit mein Sohn sterben muss?“',
        'Elia sagt: „Gib mir deinen Sohn.“ Er nimmt ihn von ihrem Schoß, trägt ihn hinauf in sein Zimmer und legt ihn auf sein Bett.',
        'Dann ruft er zu Gott: „Herr, mein Gott, lass die Seele dieses Kindes wieder zu ihm kommen!“ Dreimal beugt er sich über das Kind und bittet Gott.',
        'Gott hört Elia, und das Kind wird wieder lebendig. Elia bringt es hinunter zu seiner Mutter. „Sieh, dein Sohn lebt!“ „Nun weiß ich, dass du ein Mann Gottes bist“, sagt die Frau. „Und Gottes Wort in deinem Mund ist wahr.“'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin trägt Elia den kranken Jungen?', options: ['hinauf in sein Zimmer', 'in den Garten', 'zum Stadttor'], answer: 0 },
        { q: 'Wie oft beugt sich Elia über das Kind?', options: ['dreimal', 'einmal', 'siebenmal'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Elia und Obadja',
      ref: '1. Könige 18,1–16',
      text: [
        'Lange hat es nicht geregnet, schon im dritten Jahr, und im Land herrscht große Not. Da spricht Gott zu Elia: „Geh hin und zeig dich Ahab. Ich will es regnen lassen.“ Der König ruft seinen Hofmeister Obadja. Beide sollen Wasser und Gras für die Pferde suchen, jeder auf einem anderen Weg.',
        'Obadja fürchtet Gott sehr. Als die Königin Isebel die Propheten Gottes verfolgte, hat er hundert von ihnen versteckt, fünfzig in einer Höhle und fünfzig in einer anderen, und hat sie mit Brot und Wasser versorgt.',
        'Auf dem Weg steht plötzlich Elia vor ihm. Obadja wirft sich auf den Boden: „Bist du nicht mein Herr Elia?“ „Ja“, sagt Elia. „Geh zu deinem Herrn und sag: Elia ist hier.“ Obadja hat Angst. Aber Elia verspricht: „So wahr Gott lebt: Ich zeige mich Ahab heute.“'
      ],
      // Spiel: In zwei Höhlen (hoehlen, neu)
      task: { kind: 'hoehlen', hint: 'Bringe die Propheten in zwei Höhlen, in jede gleich viele.', caves: HOEHLEN },
      questions: [
        { q: 'Wie viele Propheten versteckt Obadja?', options: ['hundert', 'zwölf', 'vierhundertfünfzig'], answer: 0 },
        { q: 'Womit versorgt Obadja die Propheten?', options: ['mit Brot und Wasser', 'mit Fisch und Wein', 'mit Honig und Datteln'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Auf dem Karmel',
      ref: '1. Könige 18,17–29',
      text: [
        'Ahab sieht Elia und ruft: „Bist du es, der Israel ins Unglück stürzt?“ „Nicht ich“, sagt Elia, „sondern du, weil ihr Gottes Gebote verlassen habt und dem Baal nachlauft.“ Auf Elias Wort lässt Ahab ganz Israel auf den Berg Karmel kommen, und mit ihnen vierhundertfünfzig Propheten des Baal.',
        'Elia tritt vor das Volk: „Wie lange hinkt ihr auf beiden Seiten? Ist der Herr Gott, so folgt ihm nach. Ist aber Baal Gott, so folgt ihm.“ Das Volk antwortet nichts.',
        'Elia schlägt vor: Zwei Stiere, zwei Altäre, und kein Feuer daran. „Der Gott, der mit Feuer antwortet, der ist Gott.“ „Das ist gut“, rufen alle.',
        'Die Propheten des Baal rufen vom Morgen bis zum Mittag: „Baal, erhöre uns!“ Aber es kommt keine Antwort. Da ruft Elia ihnen zu: „Ruft lauter! Vielleicht schläft er.“ Doch niemand antwortet.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt 2 von 2)
      task: { kind: 'lueckenvers', hint: 'Ziehe die fehlenden Wörter in Elias Frage.', verse: VERS },
      questions: [
        { q: 'Auf welchen Berg kommt ganz Israel zusammen?', options: ['auf den Karmel', 'auf den Horeb', 'auf den Sinai'], answer: 0 },
        { q: 'Woran soll das Volk erkennen, wer Gott ist?', options: ['Der Gott, der mit Feuer antwortet.', 'Der Gott mit dem größten Altar.', 'Der Gott, den der König wählt.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Das Feuer fällt',
      ref: '1. Könige 18,30–39',
      text: [
        'Nun ruft Elia das Volk zu sich. Er baut den zerbrochenen Altar Gottes wieder auf, aus zwölf Steinen, für die zwölf Stämme Israels. Er zieht einen Graben um den Altar, schichtet das Holz auf und legt den Stier darauf.',
        '„Füllt vier Krüge mit Wasser und gießt es über das Opfer und das Holz!“, sagt er. Man tut es. „Tut es noch einmal!“ Und noch ein drittes Mal. Das Wasser läuft um den Altar, und auch der Graben wird voll.',
        'Dann betet Elia: „Herr, Gott Abrahams, Isaaks und Israels, lass heute erkennen, dass du Gott bist. Erhöre mich, damit dieses Volk erkennt, dass du, Herr, Gott bist.“',
        'Da fällt Feuer vom Himmel. Es verzehrt das Opfer, das Holz, die Steine und die Erde und leckt das Wasser im Graben auf. Alle Leute fallen auf ihr Gesicht: „Der Herr ist Gott! Der Herr ist Gott!“'
      ],
      // nur Quiz (ernst, nichts wird gespielt)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Aus wie vielen Steinen baut Elia den Altar?', options: ['aus zwölf', 'aus sieben', 'aus drei'], answer: 0 },
        { q: 'Was tut Elia, bevor er betet?', options: ['Er lässt dreimal Wasser über das Opfer gießen.', 'Er zündet das Holz an.', 'Er schickt das Volk fort.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Der Regen kommt',
      ref: '1. Könige 18,41–46',
      text: [
        'Elia sagt zu Ahab: „Geh hinauf, iss und trink, denn es rauscht, als wollte es sehr regnen.“ Elia aber steigt auf den Gipfel des Karmel, beugt sich zur Erde und legt sein Gesicht zwischen die Knie.',
        'Zu seinem Diener sagt er: „Geh hinauf und schau zum Meer!“ Der Diener schaut. „Da ist nichts“, sagt er. „Geh noch einmal!“, sagt Elia. So geht der Diener siebenmal.',
        'Beim siebten Mal ruft er: „Eine kleine Wolke steigt aus dem Meer auf, nicht größer als eine Männerhand!“ Da sagt Elia: „Sag Ahab: Spann an und fahre hinab, damit der Regen dich nicht aufhält!“',
        'Ehe man sich versieht, wird der Himmel schwarz von Wolken und Wind, und ein großer Regen kommt. Ahab fährt nach Jesreel, und Elia läuft vor seinem Wagen her.'
      ],
      // Spiel: Wolken zum Regnen bringen (regen, neu)
      task: { kind: 'regen', hint: 'Tippe die Wolken an. Sie bringen den Regen.', rain: REGEN },
      questions: [
        { q: 'Wie oft schickt Elia den Diener zum Meer?', options: ['siebenmal', 'dreimal', 'zwölfmal'], answer: 0 },
        { q: 'Wie groß ist die erste Wolke?', options: ['nicht größer als eine Männerhand', 'so groß wie ein Berg', 'so groß wie ein Schiff'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Das stille Sausen',
      ref: '1. Könige 19,1–18',
      text: [
        'Königin Isebel droht Elia. Da bekommt er Angst und flieht in die Wüste. Dort setzt er sich unter einen Wacholderstrauch, müde und mutlos, und schläft ein. Ein Engel rührt ihn an: „Steh auf und iss!“ Neben ihm liegen Brot und eine Kanne Wasser.',
        'Elia isst und trinkt. Gestärkt geht er vierzig Tage und Nächte bis zum Berg Horeb und bleibt dort in einer Höhle.',
        'Gott sagt: „Geh hinaus und tritt auf den Berg!“ Zuerst kommt ein großer, starker Wind, der Felsen zerbricht. Aber Gott ist nicht im Wind. Dann kommt ein Erdbeben, aber Gott ist nicht im Erdbeben. Dann kommt ein Feuer, aber Gott ist nicht im Feuer.',
        'Nach dem Feuer kommt ein stilles, sanftes Sausen. Elia hört es, verhüllt sein Gesicht mit dem Mantel und tritt an den Eingang der Höhle. Da fragt Gott: „Was machst du hier, Elia?“'
      ],
      // Spiel: Das stille Sausen (sausen, neu)
      task: { kind: 'sausen', hint: 'Warte. Tippe nur auf das leise Sausen.', whisper: SAUSEN },
      questions: [
        { q: 'Wie lange geht Elia bis zum Berg Horeb?', options: ['vierzig Tage und Nächte', 'drei Tage', 'sieben Tage'], answer: 0 },
        { q: 'Was kommt vor dem stillen Sausen?', options: ['Wind, Erdbeben und Feuer', 'Regen, Hagel und Schnee', 'Donner, Blitz und Flut'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Elisa und der feurige Wagen',
      ref: '1. Könige 19,19–21; 2. Könige 2,1–15',
      text: [
        'Gott schickt Elia, einen Nachfolger zu suchen. Elia findet Elisa auf dem Feld beim Pflügen und wirft ihm seinen Mantel über. Elisa verlässt seine Rinder, verabschiedet sich von seinen Eltern und folgt Elia, um ihm zu dienen.',
        'Später gehen die beiden zum Jordan. Dreimal sagt Elia: „Bleib doch hier.“ Dreimal antwortet Elisa: „So wahr Gott lebt: Ich verlasse dich nicht.“ Elia schlägt mit seinem Mantel aufs Wasser. Es teilt sich, und beide gehen trocken hindurch.',
        'Plötzlich kommt ein feuriger Wagen mit feurigen Pferden und trennt die beiden. Elia fährt im Sturm in den Himmel. „Mein Vater, mein Vater!“, ruft Elisa.',
        'Elisa hebt Elias Mantel auf und schlägt aufs Wasser: „Wo ist nun Gott, der Gott Elias?“ Da teilt sich das Wasser, und Elisa geht hindurch. Die Propheten rufen: „Der Geist Elias ruht auf Elisa!“'
      ],
      // nur Quiz (Etappe 9 beschließt das Abenteuer)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was wirft Elia über Elisa?', options: ['seinen Mantel', 'seinen Stab', 'sein Schwert'], answer: 0 },
        { q: 'Was trennt Elia und Elisa am Jordan?', options: ['ein feuriger Wagen mit feurigen Pferden', 'eine hohe Mauer', 'ein breiter Fluss'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wer bringt Elia am Bach Brot und Fleisch?', options: ['die Raben', 'die Hirten', 'die Engel'], answer: 0 },
    { q: 'Was geht im Haus der Witwe nicht aus?', options: ['Mehl und Öl', 'Wasser und Brot', 'Holz und Feuer'], answer: 0 },
    { q: 'Wie viele Propheten versteckt Obadja in den Höhlen?', options: ['hundert', 'zwölf', 'sieben'], answer: 0 },
    { q: 'Aus wie vielen Steinen baut Elia den Altar auf dem Karmel?', options: ['aus zwölf', 'aus sieben', 'aus drei'], answer: 0 },
    { q: 'Wie oft geht der Diener zum Meer, bis er die Wolke sieht?', options: ['siebenmal', 'dreimal', 'zwölfmal'], answer: 0 },
    { q: 'Was kommt nach dem Feuer am Horeb?', options: ['ein stilles, sanftes Sausen', 'ein großer Regen', 'ein Erdbeben'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of elia.stages) {
  if (st.task.verse) st.task.verse.background = st.image ?? st.task.verse.background
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set([8, 9])
for (const s of elia.stages) {
  const file = `audio/abenteuer/elia/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the fire on Carmel, the rain, the still small sound); they follow one another at random
elia.music = [
  'audio/abenteuer/elia/musik-karmel-v1.mp3',
  'audio/abenteuer/elia/musik-regen-v1.mp3',
  'audio/abenteuer/elia/musik-stille-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(elia, eliaEn)
