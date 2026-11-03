/**
 * Abenteuer "Geschichten von Jesus" (Matthäus 13, Lukas 10 und 15) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Vom Sämann bis zum verlorenen Sohn". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 3.11.2026).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Gleichnisse/ENTWURF_Gleichnisse.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung, Anton 1.11.2026: neu und zur Szene passend): 1 Lückenvers (alt), 2 Wimmelbild (alt), 3 Reihenfolge (alt), 4 Der Schatz im Acker (neu, graben), 5 nur Quiz, 6 Puzzle (alt),
 * 7 Memory (alt), 8 Weg (alt, ohne Schilder), 9 Die verlorene Münze (neu, muenze), 10 Lückenvers (alt), 11 Der Vater läuft ihm entgegen (neu, entgegen), 12 nur Quiz.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/gleichnisse/, images/abenteuer/spiele/gleichnisse/<spiel>/, audio/abenteuer/gleichnisse/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CoinGame, DigGame, FindGame, Journey, MeetGame, MemoryGame, OrderGame, VerseGame, WayGame } from '@/types/adventure'
import { josef } from './josef'
import { GLEICHNISSE_PATH } from './gleichnissePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { gleichnisseEn } from './en/gleichnisse.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/gleichnisse/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/gleichnisse/'

const G = 'images/abenteuer/spiele/gleichnisse/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 22 (kopiert). Hintergrund ist das gemalte Ufer mit dem Acker am Hang (Bildauftrag). Die Sätze stehen wörtlich im Etappentext (das Bauskript prüft es).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Einige Körner fielen auf den Weg. Da kamen die ', ' und fraßen sie auf.“'], words: ['Vögel', 'Fische', 'Schafe'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Andere aber fielen auf gutes ', '. Sie brachten ', ', manche hundertfach, manche sechzigfach und manche dreißigfach.“'], words: ['Land', 'Frucht', 'Steine', 'Dornen'], answers: [0, 1] }
  ]
}

/**
 * Etappe 10, "Lückenvers" (alte Mechanik): zwei Sätze des Sohnes aus dem Text der Etappe; Tafel, Blatt und Hintergrund wie in Etappe 1 (ein eigener Hintergrund `hintergrund/vers-hintergrund-2.webp` ist möglich).
 */
const VERS2: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Bei meinem Vater haben sogar die Arbeiter ', ' genug, und ich verhungere hier!“'], words: ['Brot', 'Wasser', 'Arbeit'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Ich will mich ', ' und zu meinem ', ' gehen.'], words: ['aufmachen', 'Vater', 'verkaufen', 'Bruder'], answers: [0, 1] }
  ]
}

/**
 * Etappe 3, "Das kleinste Korn" (alte Mechanik, Reihenfolge legen): Senfkorn in die Erde, Spross, Strauch, Baum mit Vögeln.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'korn', image: `${G}reihenfolge/karte-1.webp`, label: 'Ein Mann legt ein winziges Senfkorn in die Erde' },
    { id: 'spross', image: `${G}reihenfolge/karte-2.webp`, label: 'Ein kleiner grüner Spross wächst' },
    { id: 'strauch', image: `${G}reihenfolge/karte-3.webp`, label: 'Der Strauch wird groß' },
    { id: 'baum', image: `${G}reihenfolge/karte-4.webp`, label: 'Ein Baum mit Vögeln im Geäst' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['spross', 'strauch', 'baum'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang beim Senfkorn und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['korn', 'spross', 'strauch', 'baum'] }
  ]
}

/**
 * Etappe 7, "Memory" (alte Mechanik): sechs Dinge aus der Geschichte vom Samariter (Ölkrug, Weinschlauch, Verbandsrolle, Esel, Herberge, zwei Silbermünzen); die Rückseite zeigt einen Olivenzweig (Bildauftrag).
 * Bilder: `memory/karte-1..6.webp` (in dieser Reihenfolge), `memory/rueckseite.webp`.
 */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueckseite.webp`,
  pairs: [
    { image: `${G}memory/karte-1.webp`, text: 'Der Ölkrug: Der Samariter gießt Öl auf die Wunden des Mannes.' },
    { image: `${G}memory/karte-2.webp`, text: 'Der Weinschlauch: Auch Wein gießt er darauf.' },
    { image: `${G}memory/karte-3.webp`, text: 'Die Verbandsrolle: Der Samariter verbindet den Verletzten.' },
    { image: `${G}memory/karte-4.webp`, text: 'Der Esel: Auf dem Tier des Samariters kommt der Verletzte zur Herberge.' },
    { image: `${G}memory/karte-5.webp`, text: 'Die Herberge: Dort kümmert sich der Samariter um ihn.' },
    { image: `${G}memory/karte-6.webp`, text: 'Die zwei Silbermünzen: Sie gibt der Samariter dem Wirt.' }
  ]
}

/**
 * Etappe 8, "Weg" (alte Mechanik, ohne Schilder): der Hirte sucht sein Schaf; an drei Gabelungen mit je drei Wegen tippt das Kind den Weg, auf dem im Bild ein Hinweis auf das Schaf liegt
 * (Wollflocken am Dornenstrauch, Hufspuren, ein dunkles Ohr hinter dem Felsen). Der richtige Weg: links, in der Mitte, rechts. Bilder (Bildauftrag): `weg/gabel-1..3.webp`, `weg/hirte.webp`.
 */
const WEG: WayGame = {
  walker: `${G}weg/hirte.webp`,
  texts: {
    hint: 'Weggabelung {n} von {total}: Tippe auf den Weg, auf dem eine Spur des Schafes liegt.',
    right: 'Richtig! Hier ist eine Spur des Schafes.',
    wrong: 'Hier ist keine Spur. Der Hirte kehrt um.',
    done: 'Der Hirte hat sein Schaf gefunden!'
  },
  scenes: [
    { image: `${G}weg/gabel-1.webp`, goal: 'left', paths: 3 },
    { image: `${G}weg/gabel-2.webp`, goal: 'middle', paths: 3 },
    { image: `${G}weg/gabel-3.webp`, goal: 'right', paths: 3 }
  ]
}

/**
 * Etappe 4, "Der Schatz im Acker" (neu, `graben`, Mt 13,44-46): Runde 1 zwölf Erdhaufen auf dem Acker (4 x 3), unter einem liegt die Truhe; ein leeres Loch zeigt mit einem Pfeil zur Truhe (kein Verlust).
 * Runde 2 fünf Perlen auf dem Marktstand des Kaufmanns: die kostbarste ist die größte, runde, weiße (`perle-1`). Bilder (Bildauftrag): `graben/acker.webp`, `haufen`, `loch`, `truhe`, `truhe-offen`, `stand.webp`, `perle-1..5`.
 */
const GRABEN: DigGame = {
  field: `${G}graben/acker.webp`,
  mound: { image: `${G}graben/haufen.webp`, label: 'Ein Erdhaufen', w: 14 },
  hole: { image: `${G}graben/loch.webp`, label: 'Ein Loch im Acker', w: 14 },
  chest: { image: `${G}graben/truhe.webp`, label: 'Eine Truhe mit Eisenband', w: 16 },
  chestOpen: { image: `${G}graben/truhe-offen.webp`, label: 'Die offene Truhe mit Münzen', w: 18 },
  stall: `${G}graben/stand.webp`,
  pearls: [
    { image: `${G}graben/perle-1.webp`, label: 'Die größte, runde, weiß schimmernde Perle', w: 13 },
    { image: `${G}graben/perle-2.webp`, label: 'Eine kleinere Perle', w: 9 },
    { image: `${G}graben/perle-3.webp`, label: 'Eine graue Perle', w: 9 },
    { image: `${G}graben/perle-4.webp`, label: 'Eine schiefe Perle', w: 9 },
    { image: `${G}graben/perle-5.webp`, label: 'Eine kleine, matte Perle', w: 9 }
  ],
  rounds: [
    { kind: 'field', hint: 'Grabe nach dem Schatz. Der Pfeil im Loch zeigt dir den Weg.', treasure: [2, 1], cells: [[18, 28], [40, 28], [62, 28], [84, 28], [18, 55], [40, 55], [62, 55], [84, 55], [18, 82], [40, 82], [62, 82], [84, 82]] },
    { kind: 'pearls', hint: 'Tippe auf die kostbarste Perle.', best: 2, slots: [[14, 62], [32, 62], [50, 62], [68, 62], [86, 62]] }
  ]
}

/**
 * Etappe 9, "Die verlorene Münze" (neu, `muenze`, Lk 15,8-10): der dunkle Raum im Steinhaus, ein Tipp auf das Öllämpchen macht ihn hell, der Staub auf dem Boden wird mit dem Finger als Besen weggefegt (Raster wie beim Wischspiel);
 * ist die Stelle der Münze zu 60 % frei, blitzt sie auf, ein Tipp hebt sie auf (sie fliegt der Frau in die Hand). Runde 2: kleinerer Raum, zwei Lockvögel (Messingdeckel, Kiesel). Bilder (Bildauftrag):
 * `muenze/raum-1.webp`, `raum-2.webp`, `lampe`, `muenze`, `frau`, `besen`, `deckel`, `kiesel`.
 */
const MUENZE: CoinGame = {
  lamp: { image: `${G}muenze/lampe.webp`, label: 'Das Öllämpchen', w: 9, x: 20, y: 62 },
  coin: { image: `${G}muenze/muenze.webp`, label: 'Eine Silbermünze', w: 6 },
  woman: { image: `${G}muenze/frau.webp`, label: 'Die Frau, kniend, mit offener Hand', w: 16, x: 88, y: 96 },
  broom: { image: `${G}muenze/besen.webp`, label: 'Ein Besen', w: 12 },
  lid: { image: `${G}muenze/deckel.webp`, label: 'Ein glänzender Messingdeckel', w: 8 },
  pebble: { image: `${G}muenze/kiesel.webp`, label: 'Ein glänzender Kiesel', w: 6 },
  rounds: [
    { hint: 'Zünde das Licht an und fege den Staub weg. Wo liegt die Münze?', room: `${G}muenze/raum-1.webp`, coin: [58, 62] },
    { hint: 'Ein kleinerer Raum mit mehr Möbeln. Manches glänzt, ist aber keine Münze.', room: `${G}muenze/raum-2.webp`, coin: [32, 72], decoys: [{ kind: 'lid', x: 64, y: 50 }, { kind: 'pebble', x: 48, y: 82 }] }
  ]
}

/**
 * Etappe 11, "Der Vater läuft ihm entgegen" (neu, `entgegen`, Lk 15,20-24): Runde 1 die Landstraße, zwei große Füße als Knöpfe, der Vater läuft zwölf Schritte, wenn man abwechselnd links und rechts tippt, und fällt dem Sohn um den Hals;
 * Runde 2 der Hof, Kleid, Ring und Schuhe werden zum Sohn gezogen. Bilder (Bildauftrag): `entgegen/weg.webp`, `hof.webp`, `vater`, `sohn`, `umarmung`, `sohn-lumpen`, `sohn-kleid`, `sohn-fertig`, `kleid`, `ring`, `schuhe`.
 */
const ENTGEGEN: MeetGame = {
  road: `${G}entgegen/weg.webp`,
  yard: `${G}entgegen/hof.webp`,
  father: { image: `${G}entgegen/vater.webp`, label: 'Der Vater im Tor des Hofguts', w: 12, x: 80, y: 82 },
  son: { image: `${G}entgegen/sohn.webp`, label: 'Der Sohn, müde, in zerrissenen Kleidern', w: 11, x: 14, y: 86 },
  embrace: { image: `${G}entgegen/umarmung.webp`, label: 'Vater und Sohn in Umarmung', w: 18 },
  meet: 34,
  steps: 12,
  ragged: { image: `${G}entgegen/sohn-lumpen.webp`, label: 'Der Sohn in zerrissenen Kleidern', w: 20, x: 50, y: 92 },
  robed: { image: `${G}entgegen/sohn-kleid.webp`, label: 'Der Sohn im neuen Kleid', w: 20 },
  dressed: { image: `${G}entgegen/sohn-fertig.webp`, label: 'Der Sohn mit Kleid, Ring und Schuhen', w: 20 },
  gifts: [
    { id: 'kleid', image: `${G}entgegen/kleid.webp`, label: 'Das Kleid', w: 10 },
    { id: 'ring', image: `${G}entgegen/ring.webp`, label: 'Der Ring', w: 10 },
    { id: 'schuhe', image: `${G}entgegen/schuhe.webp`, label: 'Die Schuhe', w: 10 }
  ],
  rounds: [
    { kind: 'run', hint: 'Tippe abwechselnd auf die Füße, damit der Vater zu seinem Sohn läuft.' },
    { kind: 'gifts', hint: 'Ziehe das Kleid, den Ring und die Schuhe zum Sohn.' }
  ]
}

/**
 * Etappe 2, "Wimmelbild" (alte Mechanik): der breite Acker am Hang mit Weg, Felsen, Dornenhecke und gutem Feld (Bildauftrag); gesucht werden vier Dinge aus dem Gleichnis vom Sämann (Mt 13,3-8):
 * ein Vogel auf dem Weg, ein Fels, ein Dornenbusch und eine reife Ähre. Einige stehen hinter Sträuchern, Ähren, einem Krug und einem Sack. Bilder: `wimmel/szene.webp`, `figur-1..4.webp`, `verdecker-1..4.webp`.
 */
const WIMMEL: FindGame = {
  labels: ['Der Vogel auf dem Weg', 'Der Fels', 'Der Dornenbusch', 'Die reife Ähre'],
  doneText: 'Du hast alles gefunden, was in der Geschichte vom Sämann vorkommt: den Vogel, den Felsen, den Dornenbusch und die Ähre.',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/figur-1.webp`, x: 30, y: 90, w: 12 },
    { image: `${G}wimmel/figur-2.webp`, x: 72, y: 93, w: 15 },
    { image: `${G}wimmel/figur-3.webp`, x: 84, y: 70, w: 14 },
    { image: `${G}wimmel/figur-4.webp`, x: 46, y: 64, w: 9 }
  ],
  covers: [
    { image: `${G}wimmel/verdecker-1.webp`, x: 72, y: 94, w: 22 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 46, y: 66, w: 12 },
    { image: `${G}wimmel/verdecker-3.webp`, x: 58, y: 88, w: 9 },
    { image: `${G}wimmel/verdecker-4.webp`, x: 30, y: 91, w: 18 },
    { image: `${G}wimmel/verdecker-1.webp`, x: 84, y: 72, w: 17 },
    { image: `${G}wimmel/verdecker-2.webp`, x: 70, y: 52, w: 9 }
  ]
}

export const gleichnisse: Journey = {
  id: 'gleichnisse',
  title: 'Geschichten von Jesus',
  subtitle: 'Vom Sämann bis zum verlorenen Sohn',
  age: '8-10',
  downloadMb: 18, // wird nach dem Bau gemessen (Bilder, Karte, Spielbilder, Musik, Aufnahmen), ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: der große Senfbaum mit Vögeln und einem Beet (Konturzeichnung)
  gift: { title: 'Der Senfbaum', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell, Qualität max, mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus gleichnissePath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/gleichnisse/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0968, y: 0.6371, d: 0.0339 },
      { x: 0.1462, y: 0.5947, d: 0.0339 },
      { x: 0.2016, y: 0.7100, d: 0.0339 },
      { x: 0.3508, y: 0.5461, d: 0.0339 },
      { x: 0.4234, y: 0.5704, d: 0.0339 },
      { x: 0.5081, y: 0.5977, d: 0.0339 },
      { x: 0.6179, y: 0.5856, d: 0.0339 },
      { x: 0.6714, y: 0.6007, d: 0.0339 },
      { x: 0.7389, y: 0.5947, d: 0.0339 },
      { x: 0.8347, y: 0.6735, d: 0.0339 },
      { x: 0.8871, y: 0.6735, d: 0.0339 },
      { x: 0.9365, y: 0.6553, d: 0.0339 }
    ],
    exam: { x: 0.9829, y: 0.6857, d: 0.0339 },
    path: GLEICHNISSE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Der Sämann geht aufs Feld',
      ref: 'Matthäus 13,1–8',
      text: [
        'Am Ufer des Sees drängen sich so viele Menschen, dass Jesus in ein Boot steigt. Er setzt sich, und alle hören ihm vom Strand aus zu.',
        'Jesus erzählt eine Geschichte. „Ein Sämann ging aufs Feld, um zu säen“, sagt er. „Einige Körner fielen auf den Weg. Da kamen die Vögel und fraßen sie auf.“',
        '„Andere fielen auf felsigen Boden, wo kaum Erde war. Sie gingen schnell auf, doch die Sonne verbrannte sie, denn sie hatten keine Wurzeln. Wieder andere fielen unter die Dornen, und die Dornen erstickten sie.“',
        '„Andere aber fielen auf gutes Land. Sie brachten Frucht, manche hundertfach, manche sechzigfach und manche dreißigfach.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wo sitzt Jesus, als er erzählt?', options: ['in einem Boot', 'auf einem Berg', 'in einem Haus'], answer: 0 },
        { q: 'Was geschieht mit den Körnern auf dem Weg?', options: ['Die Vögel fressen sie.', 'Sie wachsen schnell.', 'Der Wind weht sie fort.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Wer Ohren hat',
      ref: 'Matthäus 13,9–11.18–23',
      text: [
        '„Wer Ohren hat zu hören, der höre!“, ruft Jesus der Menge zu. Danach treten die Jünger zu ihm. „Warum erzählst du ihnen in Geschichten?“, fragen sie. „Euch ist es gegeben, das Geheimnis des Himmelreichs zu verstehen“, antwortet Jesus. „So hört nun ihr die Geschichte vom Sämann.“',
        '„Der Same ist das Wort vom Himmelreich. Der Weg, das sind die Menschen, die es hören und nicht verstehen. Dann geht es wieder verloren. Im felsigen Boden hat das Wort keine Wurzeln. Wenn es schwer wird, geben sie schnell auf.“',
        '„Bei den Dornen ersticken die Sorgen dieser Welt und der Reichtum, der täuscht, das Wort. Das gute Land aber sind die Menschen, die das Wort hören, verstehen und Frucht bringen.“'
      ],
      // Spiel: Wimmelbild (wimmelbild, alt)
      task: { kind: 'wimmelbild', hint: 'Suche auf dem Acker: Finde, was in der Geschichte vorkommt.', count: 4, find: WIMMEL },
      questions: [
        { q: 'Was bedeutet der Same in der Geschichte?', options: ['das Wort vom Himmelreich', 'das Wetter', 'das Geld'], answer: 0 },
        { q: 'Wer ist das gute Land?', options: ['Menschen, die das Wort hören, verstehen und Frucht bringen', 'Menschen, die schnell aufgeben', 'Menschen, die nie zuhören'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das kleinste Korn',
      ref: 'Matthäus 13,31–33',
      text: [
        'Jesus erzählt noch eine Geschichte. „Das Himmelreich ist wie ein Senfkorn“, sagt er. „Ein Mann nimmt es und sät es auf seinen Acker.“',
        '„Es ist das kleinste unter allen Samenkörnern. Wenn es aber wächst, ist es größer als alle Gemüsepflanzen und wird ein Baum.“',
        '„Die Vögel kommen und wohnen in seinen Zweigen“, sagt Jesus.',
        'Dann sagt er: „Das Himmelreich ist auch wie ein Sauerteig. Eine Frau mischt ihn unter drei Scheffel Mehl, bis der ganze Teig durchsäuert ist.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagt Jesus über das Senfkorn?', options: ['Es ist das kleinste unter allen Samenkörnern.', 'Es ist größer als ein Apfel.', 'Es ist so groß wie eine Faust.'], answer: 0 },
        { q: 'Was wird aus dem Senfkorn?', options: ['ein Baum', 'eine Blume', 'ein Stein'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der Schatz im Acker',
      ref: 'Matthäus 13,44–46',
      text: [
        'Später, im Haus, erzählt Jesus seinen Jüngern weiter. „Das Himmelreich ist wie ein Schatz, der in einem Acker vergraben liegt. Ein Mann findet ihn und deckt ihn wieder zu.“',
        'Voll Freude geht er hin, verkauft alles, was er hat, und kauft den Acker.',
        '„Und das Himmelreich ist wie ein Kaufmann, der schöne Perlen sucht“, sagt Jesus. „Als er eine ganz kostbare Perle findet, geht er hin, verkauft alles, was er hat, und kauft sie.“'
      ],
      // Spiel: Der Schatz im Acker (graben, neu)
      task: { kind: 'graben', hint: 'Tippe auf den Acker und grabe nach dem Schatz.', dig: GRABEN },
      questions: [
        { q: 'Wo liegt der Schatz?', options: ['im Acker', 'im Haus', 'im See'], answer: 0 },
        { q: 'Was tut der Mann vor Freude?', options: ['Er verkauft alles und kauft den Acker.', 'Er läuft davon.', 'Er verschenkt den Schatz.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Wer ist mein Nächster?',
      ref: 'Lukas 10,25–30',
      text: [
        'Ein Schriftgelehrter steht auf und will Jesus prüfen. „Meister“, fragt er, „was muss ich tun, damit ich das ewige Leben bekomme?“',
        '„Was steht im Gesetz geschrieben?“, fragt Jesus zurück. Der Mann antwortet: „Du sollst Gott lieben von ganzem Herzen und deinen Nächsten wie dich selbst.“ „Das ist richtig“, sagt Jesus. „Tu das, dann wirst du leben.“',
        'Doch der Schriftgelehrte fragt weiter: „Und wer ist mein Nächster?“ Da erzählt Jesus: „Ein Mann ging von Jerusalem nach Jericho hinab. Unterwegs überfielen ihn Räuber. Sie nahmen ihm alles weg und ließen ihn verletzt am Weg liegen.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was fragt der Schriftgelehrte zuletzt?', options: ['Wer ist mein Nächster?', 'Wo liegt Jericho?', 'Wann kommt der König?'], answer: 0 },
        { q: 'Welchen Weg geht der Mann in der Geschichte?', options: ['von Jerusalem nach Jericho', 'von Nazareth nach Bethlehem', 'von Kapernaum nach Nain'], answer: 0 },
        { q: 'Was tun die Räuber?', options: ['Sie nehmen ihm alles weg.', 'Sie geben ihm Brot.', 'Sie bringen ihn nach Hause.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Sie gehen vorbei',
      ref: 'Lukas 10,31–34',
      text: [
        'Jesus erzählt weiter. Zufällig kommt ein Priester dieselbe Straße hinunter. Ein Priester dient im Tempel. Er sieht den Verletzten am Weg liegen und geht vorbei. Dann kommt ein Levit, auch ein Diener des Tempels. Er sieht den Mann und geht ebenfalls weiter.',
        'Dann kommt ein Samariter, der auf Reisen ist. Er sieht den Mann am Weg, und er hat Mitleid mit ihm.',
        'Er geht zu ihm hin und verbindet seine Wunden. Er gießt Öl und Wein darauf.'
      ],
      // Spiel: Puzzle (puzzle, alt)
      task: { kind: 'puzzle', hint: 'Setze das Bild von der Straße nach Jericho zusammen.', puzzle: { image: `${G}puzzle/strasse.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Wer geht zuerst vorbei?', options: ['ein Priester', 'ein Soldat', 'ein Hirte'], answer: 0 },
        { q: 'Was tut der Samariter, als er den Mann sieht?', options: ['Er hat Mitleid und geht zu ihm.', 'Er geht schnell weiter.', 'Er ruft die Räuber.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Pflege ihn',
      ref: 'Lukas 10,34–37',
      text: [
        'Jesus erzählt weiter. Der Samariter hebt den Verletzten auf sein Tier und bringt ihn in eine Herberge. Dort kümmert er sich um ihn.',
        'Am nächsten Tag reist er weiter. Er gibt dem Wirt zwei Silbermünzen. „Pflege ihn“, sagt er. „Wenn es mehr kostet, bezahle ich es, wenn ich zurückkomme.“',
        'Dann fragt Jesus den Schriftgelehrten: „Wer von den dreien war der Nächste von dem, der unter die Räuber fiel?“ „Der, der Erbarmen mit ihm hatte“, antwortet der Mann.',
        '„Dann geh hin und tu das auch“, sagt Jesus.'
      ],
      // Spiel: Memory (memory, alt)
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Wohin bringt der Samariter den Verletzten?', options: ['in eine Herberge', 'nach Jerusalem', 'zum Priester'], answer: 0 },
        { q: 'Was gibt er dem Wirt?', options: ['zwei Silbermünzen', 'seinen Mantel', 'einen Esel'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Das verlorene Schaf',
      ref: 'Lukas 15,1–7',
      text: [
        'Viele Zöllner und Sünder kommen zu Jesus, um ihm zuzuhören. Die Pharisäer und Schriftgelehrten murren: „Dieser nimmt die Sünder an und isst mit ihnen.“',
        'Da erzählt Jesus: „Wer von euch hat hundert Schafe und verliert eins? Lässt er nicht die neunundneunzig zurück und sucht das eine, bis er es findet?“',
        '„Wenn er es gefunden hat, legt er es voll Freude auf seine Schultern. Er ruft seine Freunde und Nachbarn: ‚Freut euch mit mir! Ich habe mein Schaf gefunden.‘ Ich sage euch: So ist im Himmel Freude über einen Sünder, der umkehrt.“'
      ],
      // Spiel: Weg ohne Schilder (weg, alt)
      task: { kind: 'weg', hint: 'Finde den Weg, auf dem der Hirte das verlorene Schaf sucht.', way: WEG },
      questions: [
        { q: 'Wie viele Schafe hat der Hirte?', options: ['hundert', 'zehn', 'zwölf'], answer: 0 },
        { q: 'Was tut er, als ein Schaf fehlt?', options: ['Er sucht es, bis er es findet.', 'Er wartet zu Hause.', 'Er kauft ein neues.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die verlorene Münze',
      ref: 'Lukas 15,8–10',
      text: [
        '„Oder eine Frau hat zehn Silbermünzen“, erzählt Jesus weiter. „Eine davon verliert sie. Nun hat sie nur noch neun.“',
        '„Da zündet sie ein Licht an und kehrt das ganze Haus. Sie sucht mit großem Eifer, bis sie die Münze findet.“',
        '„Wenn sie die Münze gefunden hat, ruft sie ihre Freundinnen und Nachbarinnen: ‚Freut euch mit mir! Ich habe die Münze gefunden, die ich verloren hatte.‘ Ich sage euch: Auch vor den Engeln Gottes ist Freude über einen Sünder, der umkehrt.“'
      ],
      // Spiel: Die verlorene Münze (muenze, neu)
      task: { kind: 'muenze', hint: 'Fege den Staub weg und finde die Münze.', coin: MUENZE },
      questions: [
        { q: 'Wie viele Silbermünzen hat die Frau?', options: ['zehn', 'fünf', 'hundert'], answer: 0 },
        { q: 'Wie sucht die Frau die Münze?', options: ['Sie zündet ein Licht an und kehrt das Haus.', 'Sie geht auf den Markt.', 'Sie wartet bis zum Morgen.'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Ich will mich aufmachen',
      ref: 'Lukas 15,11–18',
      text: [
        '„Ein Mann hatte zwei Söhne“, erzählt Jesus. Der jüngere sagt: „Vater, gib mir mein Erbe.“ Der Vater teilt sein Gut unter den Söhnen auf. Wenig später packt der Jüngere alles zusammen und zieht in ein fernes Land. Dort gibt er sein ganzes Geld aus.',
        'Dann kommt eine große Hungersnot. Der Sohn hütet bei einem Mann des Landes die Schweine. Er hat so großen Hunger, dass er gern vom Schweinefutter äße, aber niemand gibt ihm etwas.',
        'Da denkt er nach: „Bei meinem Vater haben sogar die Arbeiter Brot genug, und ich verhungere hier! Ich will mich aufmachen und zu meinem Vater gehen. Ich will sagen: Vater, ich habe mich versündigt gegen den Himmel und vor dir.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS2 },
      questions: [
        { q: 'Wohin zieht der jüngere Sohn?', options: ['in ein fernes Land', 'auf einen Berg', 'in die Stadt Jerusalem'], answer: 0 },
        { q: 'Welche Arbeit bekommt er?', options: ['Er hütet Schweine.', 'Er fischt im See.', 'Er baut ein Haus.'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Der Vater läuft ihm entgegen',
      ref: 'Lukas 15,20–24',
      text: [
        'Jesus erzählt weiter. Der Sohn macht sich auf den Weg nach Hause. Als er noch weit weg ist, sieht ihn sein Vater schon. Er hat Mitleid mit ihm. Er läuft dem Sohn entgegen, fällt ihm um den Hals und küsst ihn.',
        '„Vater“, sagt der Sohn, „ich habe mich versündigt gegen den Himmel und vor dir. Ich bin es nicht mehr wert, dein Sohn zu heißen.“',
        'Aber der Vater ruft seinen Knechten zu: „Holt das beste Kleid und zieht es ihm an! Gebt ihm einen Ring an die Hand und Schuhe an die Füße! Wir wollen essen und fröhlich sein. Mein Sohn war tot und lebt wieder, er war verloren und ist gefunden.“'
      ],
      // Spiel: Der Vater läuft ihm entgegen (entgegen, neu)
      task: { kind: 'entgegen', hint: 'Tippe abwechselnd auf die Füße, damit der Vater zu seinem Sohn läuft.', meet: ENTGEGEN },
      questions: [
        { q: 'Wer sieht den Sohn zuerst von weitem?', options: ['sein Vater', 'sein Bruder', 'ein Knecht'], answer: 0 },
        { q: 'Was tut der Vater, als er seinen Sohn sieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er schickt ihn fort.', 'Er schließt die Tür.'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Der ältere Bruder',
      ref: 'Lukas 15,25–32',
      text: [
        'Jesus erzählt weiter. Der ältere Sohn ist noch auf dem Feld. Als er sich dem Haus nähert, hört er Musik und Tanz. Er ruft einen Knecht und fragt, was los ist. „Dein Bruder ist heimgekommen“, sagt der Knecht. „Dein Vater hat ein Fest für ihn gegeben.“',
        'Da wird der ältere Sohn zornig und will nicht ins Haus gehen. Der Vater kommt heraus und bittet ihn. Der Sohn antwortet: „So viele Jahre diene ich dir, und nie hast du mir ein Böckchen gegeben, damit ich mit meinen Freunden feiere. Und für diesen deinen Sohn, der dein Geld verschleudert hat, machst du ein Fest!“',
        '„Mein Sohn“, sagt der Vater, „du bist immer bei mir, und alles, was mein ist, gehört auch dir. Wir wollen uns freuen. Dein Bruder war tot und lebt wieder, er war verloren und ist gefunden.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo ist der ältere Sohn, als das Fest beginnt?', options: ['auf dem Feld', 'im Haus', 'in der Stadt'], answer: 0 },
        { q: 'Warum wird er zornig?', options: ['Für seinen Bruder gibt es ein Fest.', 'Der Vater schickt ihn weg.', 'Das Essen ist kalt.'], answer: 0 },
        { q: 'Was sagt der Vater zu ihm?', options: ['Du bist immer bei mir, und alles, was mein ist, gehört auch dir.', 'Geh weg!', 'Bleib draußen.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was geschieht mit den Körnern, die auf den Weg fallen?', options: ['Die Vögel fressen sie.', 'Sie wachsen hundertfach.', 'Der Regen spült sie fort.'], answer: 0 },
    { q: 'Was wird aus dem kleinen Senfkorn?', options: ['ein großer Baum', 'eine Blume', 'ein Stein'], answer: 0 },
    { q: 'Was tut der Mann, der den Schatz im Acker findet?', options: ['Er verkauft alles und kauft den Acker.', 'Er läuft davon.', 'Er verschenkt den Schatz.'], answer: 0 },
    { q: 'Wer hilft dem überfallenen Mann?', options: ['ein Samariter', 'ein Priester', 'ein Levit'], answer: 0 },
    { q: 'Wie sucht die Frau ihre verlorene Münze?', options: ['Sie zündet ein Licht an und kehrt das Haus.', 'Sie gräbt im Garten.', 'Sie wartet bis zum Morgen.'], answer: 0 },
    { q: 'Was tut der Vater, als er seinen Sohn von weitem sieht?', options: ['Er läuft ihm entgegen.', 'Er schließt die Tür.', 'Er schickt einen Knecht.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of gleichnisse.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of gleichnisse.stages) {
  const file = `audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the field by the lake, the road to Jericho, the feast of the father); they follow one another at random
gleichnisse.music = [
  'audio/abenteuer/gleichnisse/musik-acker-v1.mp3',
  'audio/abenteuer/gleichnisse/musik-strasse-v1.mp3',
  'audio/abenteuer/gleichnisse/musik-fest-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(gleichnisse, gleichnisseEn)
