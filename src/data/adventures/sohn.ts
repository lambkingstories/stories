/**
 * Abenteuer "Der verlorene Sohn" (Lukas 15,11–32; id `sohn`) für 8 bis 10 Jahre: 7 Etappen, Untertitel "Das Gleichnis vom Vater und seinen zwei Söhnen". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Jesus kommt weder im Text noch im Bild vor (die Geschichte wird ohne Rahmen erzählt). Gott, Engel und Lichtgestalten sind nie im Bild. Keine Huren, kein Prassen mit Dirnen: im Text nur "gibt sein Geld mit vollen Händen aus";
 * die Schweine nur ruhig; das Kalb wird nur geholt und ein Essen bereitet (nichts wird geschlachtet gezeigt oder gesagt).
 * Quelle der Texte: D:/Claude/Abenteuer-Sohn/ENTWURF_Sohn.md (Luther 1912 von bibeltext.com gelesen, nacherzählt), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 1 Das Bündel packen (packen, bekannt), 2 und 3 nur Fragen, 4 Lückenvers (bekannt),
 * 5 Wer kommt da? (neu, ausschau), 6 Hand in Hand (neu, reigen), 7 nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/sohn/, images/abenteuer/spiele/sohn/<spiel>/, audio/abenteuer/sohn/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Sohn/tools/bauen_sohn.py: nicht von Hand ändern.
 */
import type { Journey, PackGame, VerseGame } from '@/types/adventure'
import type { LookoutGame } from '@/utils/sohnNeuA'
import type { DanceGame } from '@/utils/sohnNeuB'
import { josef } from './josef'
import { SOHN_PATH } from './sohnPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { sohnEn } from './en/sohn.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/sohn/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/sohn/'

const G = 'images/abenteuer/spiele/sohn/'

/**
 * Etappe 1, "Das Bündel packen" (bekannt 1, Lk 15,13a): ein Leinentuch auf dem Pflaster im Hof des Vaters; sechs Dinge allgemeines Reisegepäck (keine Aussage der Bibel, im Prüfbericht D), ein Tippen dreht ein Stück.
 * Runde 1: Raster 3 × 2 (vier Dinge, alle 6 Zellen voll), Runde 2: Raster 4 × 3 (alle sechs Dinge, 10 von 12 Zellen). Die Fläche des Tuchs (area, Prozent) ist vorläufig, am gemalten Bild nachmessen.
 * Bilder: `hintergrund/packen-hintergrund`, `packen/tuch` (4:3), `geldbeutel`, `kopftuch`, `mantel`, `sandalen`, `decke`, `wasserschlauch`.
 */
const BUENDEL: PackGame = {
  background: `${G}hintergrund/packen-hintergrund.webp`,
  basket: `${G}packen/tuch.webp`,
  items: [
    { id: 'geldbeutel', image: `${G}packen/geldbeutel.webp`, w: 1, h: 1, label: 'Geldbeutel' },
    { id: 'kopftuch', image: `${G}packen/kopftuch.webp`, w: 1, h: 1, label: 'Kopftuch' },
    { id: 'mantel', image: `${G}packen/mantel.webp`, w: 2, h: 1, label: 'Mantel' },
    { id: 'sandalen', image: `${G}packen/sandalen.webp`, w: 2, h: 1, label: 'Sandalen' },
    { id: 'decke', image: `${G}packen/decke.webp`, w: 1, h: 2, label: 'Decke' },
    { id: 'wasserschlauch', image: `${G}packen/wasserschlauch.webp`, w: 1, h: 2, label: 'Wasserschlauch' }
  ],
  area: { x: 24, y: 40, w: 52, h: 58.5 },
  rounds: [
    { hint: 'Packe das Bündel, ein Tippen dreht ein Stück.', cols: 3, rows: 2, items: ['geldbeutel', 'mantel', 'decke', 'kopftuch'] },
    { hint: 'Jetzt kommt alles mit: auch die Sandalen und der Wasserschlauch.', cols: 4, rows: 3, items: ['geldbeutel', 'kopftuch', 'mantel', 'sandalen', 'decke', 'wasserschlauch'] }
  ]
}

/**
 * Etappe 4, "Lückenvers" (bekannt 2, Lk 15,18): der Satz steht wörtlich im Etappentext („Ich will mich aufmachen und zu meinem Vater gehen“, Luther 1912). Tafel und Blatt wie in allen Abenteuern
 * (aus `spiele/heilung/lueckenvers/` kopiert), Hintergrund `hintergrund/vers-hintergrund` (Weg zwischen Hügeln im Morgenlicht, Wegweiser ohne Schrift).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Setze das fehlende Wort in den Vers.', parts: ['Ich will mich ', ' und zu meinem Vater gehen.'], words: ['aufmachen', 'hinlegen', 'verstecken'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Ich will mich ', ' und zu meinem ', ' gehen.'], words: ['aufmachen', 'Vater', 'schlafen', 'Bruder'], answers: [0, 1] }
  ]
}

/**
 * Etappe 5, "Wer kommt da?" (neu, `ausschau`, Lk 15,20): der Blick vom Hoftor die lange Straße hinab; Wanderer wachsen aus dem Dunst (erst klein, blass und weich, dann klar und farbig), das Kind tippt auf den Sohn,
 * sobald es ihn erkennt. Kein Zeitdruck: der Sohn bleibt vor dem Tor stehen und wartet, die anderen gehen am Tor seitlich ab. Runde 1: vier Wanderer, Runde 2: sechs, schneller, dazu ein junger Mann in bunter Tunika.
 * Bahnen (Fußpunkt und Breite in Prozent, vom Horizont zum Tor) und Wandererbreiten VORLÄUFIG, am gemalten Bild nachmessen. Die Merkmale des Sohnes (mager, barfuß, zerrissene Tunika) sind nur Spielhilfe und Bild,
 * keine Aussage der Bibel. Bilder: `ausschau/strasse`, `sohn`, `haendler`, `frau`, `hirte`, `bauer`, `jungmann`, `halo`.
 */
const AUSSCHAU: LookoutGame = {
  background: `${G}ausschau/strasse.webp`,
  halo: `${G}ausschau/halo.webp`,
  ratio: 1.5,
  haloW: 24,
  walkers: [
    { id: 'haendler', name: 'ein Händler', look: 'ein Händler mit einem beladenen Esel', image: `${G}ausschau/haendler.webp`, ratio: 1.17 },
    { id: 'frau', name: 'eine Frau mit Krug', look: 'eine Frau mit einem Krug auf dem Kopf', image: `${G}ausschau/frau.webp`, ratio: 0.67 },
    { id: 'sohn', name: 'der Sohn', look: 'ein Mann allein, barfuß, in zerrissenem Gewand, mit einem kleinen Bündel', image: `${G}ausschau/sohn.webp`, ratio: 0.67 },
    { id: 'hirte', name: 'ein Hirte', look: 'ein Hirte mit drei Schafen', image: `${G}ausschau/hirte.webp`, ratio: 1.33 },
    { id: 'bauer', name: 'ein Bauer', look: 'ein Bauer mit einer Hacke', image: `${G}ausschau/bauer.webp`, ratio: 0.67 },
    { id: 'jungmann', name: 'ein junger Mann', look: 'ein junger Mann in bunter Tunika, mit Sandalen', image: `${G}ausschau/jungmann.webp`, ratio: 0.67 }
  ],
  lanes: [
    { from: { x: 54, y: 47, w: 4 }, to: { x: 28, y: 94, w: 21 } },
    { from: { x: 56, y: 46.5, w: 4 }, to: { x: 52, y: 94, w: 21 } },
    { from: { x: 58, y: 47, w: 4 }, to: { x: 76, y: 94, w: 21 } }
  ],
  rounds: [
    { hint: 'Halte Ausschau und tippe auf den Sohn, sobald du ihn erkennst.', son: 'sohn', order: [{ walker: 'haendler', lane: 0, delay: 0, dur: 17000 }, { walker: 'frau', lane: 2, delay: 4000, dur: 15000 }, { walker: 'sohn', lane: 1, delay: 9000, dur: 19000 }, { walker: 'hirte', lane: 0, delay: 18000, dur: 15000 }] },
    { hint: 'Jetzt kommen sechs. Schau genau hin.', son: 'sohn', order: [{ walker: 'bauer', lane: 2, delay: 0, dur: 11000 }, { walker: 'haendler', lane: 0, delay: 2000, dur: 12000 }, { walker: 'sohn', lane: 1, delay: 8000, dur: 14000 }, { walker: 'jungmann', lane: 2, delay: 12000, dur: 10000 }, { walker: 'frau', lane: 0, delay: 15000, dur: 11000 }, { walker: 'hirte', lane: 2, delay: 23000, dur: 10000 }] }
  ]
}

/**
 * Etappe 6, "Hand in hand" (neu, `reigen`, Lk 15,24–25): der Festhof am Abend, die Tänzer stehen, das Kind verbindet sie mit goldenen Bändern (ziehen oder zwei Tipps), zwei Hände für jeden, bis alle ein Ring sind;
 * dann dreht sich der Ring zweimal. Runde 1 (`neighbours`): sechs Tänzer, nur wer nebeneinander steht; Runde 2 (`free`): zehn Tänzer, beliebig, aber keine Kreuzung, höchstens zwei Hände, kein zu früh geschlossener Ring.
 * Plätze (Mitte des Körpers, Prozent), Größen und Handreichweite VORLÄUFIG, am gemalten Bild nachmessen. Bilder: `reigen/festhof`, `tanzer-1` … `tanzer-8`, `sohn-fest`, `vater-fest`, `band`, `leier`, `noten-1` … `noten-3`.
 */
const REIGEN: DanceGame = {
  background: `${G}reigen/festhof.webp`,
  band: `${G}reigen/band.webp`,
  notes: [`${G}reigen/noten-1.webp`, `${G}reigen/noten-2.webp`, `${G}reigen/noten-3.webp`],
  lyre: `${G}reigen/leier.webp`,
  lyreAt: { x: 31, y: 56, w: 9 },
  ratio: 1.5,
  dancerW: 14,
  dancerRatio: 0.81,
  handR: 5.6,
  bandH: 3.4,
  hopMs: 500,
  dancers: [
    { id: 'vater', name: 'der Vater', image: `${G}reigen/vater-fest.webp` },
    { id: 'sohn', name: 'der jüngere Sohn', image: `${G}reigen/sohn-fest.webp` },
    { id: 'g1', name: 'Gast 1', image: `${G}reigen/tanzer-1.webp` },
    { id: 'g2', name: 'Gast 2', image: `${G}reigen/tanzer-2.webp` },
    { id: 'g3', name: 'Gast 3', image: `${G}reigen/tanzer-3.webp` },
    { id: 'g4', name: 'Gast 4', image: `${G}reigen/tanzer-4.webp` },
    { id: 'g5', name: 'Gast 5', image: `${G}reigen/tanzer-5.webp` },
    { id: 'g6', name: 'Gast 6', image: `${G}reigen/tanzer-6.webp` },
    { id: 'g7', name: 'Gast 7', image: `${G}reigen/tanzer-7.webp` },
    { id: 'g8', name: 'Gast 8', image: `${G}reigen/tanzer-8.webp` }
  ],
  rounds: [
    { hint: 'Verbinde die Tänzer, bis sich alle an den Händen halten.', mode: 'neighbours', places: [{ id: 'vater', x: 35.5, y: 52 }, { id: 'sohn', x: 64.5, y: 52 }, { id: 'g1', x: 79, y: 66 }, { id: 'g2', x: 64.5, y: 80 }, { id: 'g3', x: 35.5, y: 80 }, { id: 'g4', x: 21, y: 66 }], order: ['vater', 'sohn', 'g1', 'g2', 'g3', 'g4'] },
    { hint: 'Reiche jedem Tänzer zwei Hände, bis ein großer Ring entsteht.', mode: 'free', places: [{ id: 'g5', x: 22, y: 47 }, { id: 'g1', x: 41, y: 45 }, { id: 'vater', x: 59, y: 45 }, { id: 'g6', x: 78, y: 47 }, { id: 'g3', x: 92.5, y: 66 }, { id: 'g8', x: 78, y: 84 }, { id: 'sohn', x: 59, y: 85 }, { id: 'g2', x: 41, y: 85 }, { id: 'g7', x: 22, y: 84 }, { id: 'g4', x: 7.5, y: 66 }], order: ['g5', 'g1', 'vater', 'g6', 'g3', 'g8', 'sohn', 'g2', 'g7', 'g4'] }
  ]
}

export const sohn: Journey = {
  id: 'sohn',
  title: 'Der verlorene Sohn',
  subtitle: 'Das Gleichnis vom Vater und seinen zwei Söhnen',
  age: '8-10',
  downloadMb: 11, // grob geschätzt (Bilder, Karte, Spielbilder, Musik, Aufnahmen), die Leitung misst nach dem Einbau nach
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: Kleid, Ring und Schuhe (ein gefaltetes Festkleid, ein Ring und ein Paar Sandalen auf einem Kissen, Olivenzweig als Rahmen; ohne Menschen, ohne Schrift; Konturzeichnung)
  gift: { title: 'Kleid, Ring und Schuhe', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): vom Hofgut des Vaters in die Ferne, zum Schweinefeld und auf dem Rückweg zum Fest und zum Feldrand;
  // Stationen aus ergebnis/panorama-fest/map-sohn.json (Panorama mit dem Fest mit Freunden, Lk 15,13), Perlenweg aus sohnPath.ts
  map: {
    images: ['images/abenteuer/sohn/karte-pano-v2-1.webp', 'images/abenteuer/sohn/karte-pano-v2-2.webp', 'images/abenteuer/sohn/karte-pano-v1-3.webp'],
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.1300, y: 0.6675, d: 0.0339 },
      { x: 0.2520, y: 0.7646, d: 0.0339 },
      { x: 0.3891, y: 0.7221, d: 0.0339 },
      { x: 0.5494, y: 0.5461, d: 0.0339 },
      { x: 0.6300, y: 0.5947, d: 0.0339 },
      { x: 0.7581, y: 0.6857, d: 0.0339 },
      { x: 0.9073, y: 0.6007, d: 0.0339 }
    ],
    exam: { x: 0.9808, y: 0.6857, d: 0.0339 },
    path: SOHN_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Gib mir meinen Teil',
      ref: 'Lukas 15,11–13a',
      text: [
        'Ein Mann hat zwei Söhne und einen großen Hof. Eines Tages geht der jüngere Sohn zu seinem Vater.',
        '„Vater“, sagt der jüngere Sohn, „gib mir schon jetzt, was mir später gehören soll. Meinen Teil von allem, was du hast.“',
        'Der Vater teilt alles, was er hat, unter den beiden Söhnen auf. Der ältere Sohn bleibt beim Vater.',
        'Nicht lange danach sammelt der jüngere Sohn alles zusammen, was ihm gehört. Er schnürt sein Bündel und zieht los, weit weg in ein fernes Land.'
      ],
      // Spiel: Das Bündel packen (packen, bekannt)
      task: { kind: 'packen', hint: 'Packe das Bündel für die weite Reise.', pack: BUENDEL },
      questions: [
        { q: 'Was bittet der jüngere Sohn seinen Vater?', options: ['Er soll ihm seinen Teil geben.', 'Er soll mit ihm verreisen.', 'Er soll ihm ein Haus bauen.'], answer: 0 },
        { q: 'Wohin zieht der jüngere Sohn?', options: ['in ein fernes Land', 'auf einen hohen Berg', 'in die Stadt Jerusalem'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02-v2.webp`,
      title: 'Im fernen Land',
      ref: 'Lukas 15,13b–14',
      text: [
        'Im fernen Land gibt der jüngere Sohn sein Geld mit vollen Händen aus. Er gönnt sich alles, was er will.',
        'Der jüngere Sohn zählt nach, einmal und noch einmal. Sein Beutel wird leichter und leichter, bis kein einziges Geldstück mehr darin ist.',
        'Da kommt eine große Hungersnot über das ganze Land. Brot ist knapp, und alles wird teuer.',
        'Der jüngere Sohn hat kein Geld mehr, nicht einmal für ein Stück Brot. Jetzt fängt er an, Hunger zu leiden.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was macht der jüngere Sohn mit seinem Geld?', options: ['Er gibt es ganz aus.', 'Er schenkt es den Armen.', 'Er vergräbt es im Acker.'], answer: 0 },
        { q: 'Was kommt über das ganze Land?', options: ['eine große Hungersnot', 'ein langer Krieg', 'eine große Flut'], answer: 0 },
        { q: 'Wie geht es dem jüngeren Sohn, als das Geld weg ist?', options: ['Er fängt an, Hunger zu leiden.', 'Er wird König des Landes.', 'Er kauft sich ein Haus.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Bei den Schweinen',
      ref: 'Lukas 15,15–16',
      text: [
        'Der jüngere Sohn braucht Arbeit und etwas zu essen. Er geht zu einem Mann des Landes und bleibt bei ihm.',
        'Der Mann schickt den jüngeren Sohn auf sein Feld. Dort soll er die Schweine hüten.',
        'Die Schweine drängen sich am Trog und fressen. Der Sohn sitzt am Zaun und sieht ihnen zu.',
        'Er hat so großen Hunger, dass er am liebsten selbst von dem Futter essen würde. Aber niemand gibt ihm etwas.'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer schickt den jüngeren Sohn auf das Feld?', options: ['ein Mann des Landes', 'sein Vater', 'sein Bruder'], answer: 0 },
        { q: 'Welche Arbeit bekommt er?', options: ['Er hütet Schweine.', 'Er pflügt den Acker.', 'Er baut ein Haus.'], answer: 0 },
        { q: 'Was möchte der jüngere Sohn am liebsten essen?', options: ['das Futter der Schweine', 'das Brot des Königs', 'die Trauben vom Weinberg'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Ich will mich aufmachen',
      ref: 'Lukas 15,17–20a',
      text: [
        'Da denkt der Sohn nach. „Die Arbeiter meines Vaters haben alle Brot genug“, sagt er sich. „Und ich verhungere hier!“',
        '„Ich will mich aufmachen und zu meinem Vater gehen.“',
        'Und das will er seinem Vater sagen: „Vater, ich habe Unrecht getan, gegen Gott und gegen dich. Ich bin es nicht mehr wert, dein Sohn zu heißen. Mach mich zu einem deiner Arbeiter.“',
        'Dann steht der Sohn auf. Er lässt die Schweine und das Feld hinter sich und geht nach Hause, zu seinem Vater.'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Wer hat bei seinem Vater Brot genug?', options: ['die Arbeiter', 'die Schweine', 'der Mann des Landes'], answer: 0 },
        { q: 'Worum will der Sohn seinen Vater bitten?', options: ['Mach mich zu einem deiner Arbeiter.', 'Gib mir noch mehr Geld.', 'Schick mich wieder fort.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Der Vater sieht ihn',
      ref: 'Lukas 15,20b–21',
      text: [
        'Der Sohn geht und geht, die lange Straße entlang. Das Haus seines Vaters ist noch weit weg, da sieht ihn der Vater schon.',
        'Dem Vater wird das Herz weich vor Mitleid. Er läuft los, dem Sohn entgegen.',
        'Er fällt dem Sohn um den Hals und küsst ihn.',
        '„Vater“, sagt der Sohn, „ich habe Unrecht getan, gegen Gott und gegen dich. Ich bin es nicht mehr wert, dein Sohn zu heißen.“'
      ],
      // Spiel: Wer kommt da? (ausschau, neu)
      task: { kind: 'ausschau', hint: 'Halte Ausschau und tippe auf den Sohn, sobald du ihn erkennst.', lookout: AUSSCHAU },
      questions: [
        { q: 'Wo ist der Sohn, als sein Vater ihn sieht?', options: ['noch weit weg vom Haus', 'schon im Hof', 'vor der Haustür'], answer: 0 },
        { q: 'Was tut der Vater, als er seinen Sohn sieht?', options: ['Er läuft ihm entgegen und küsst ihn.', 'Er schließt das Tor zu.', 'Er schickt einen Diener.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Kleid, Ring und Schuhe',
      ref: 'Lukas 15,22–25a',
      text: [
        'Aber der Vater ruft seine Diener: „Schnell, holt das beste Kleid und zieht es meinem Sohn an!“',
        '„Gebt ihm einen Ring für die Hand und Schuhe für die Füße!“',
        '„Holt auch das fette Kalb aus dem Stall und bereitet ein Essen. Wir wollen essen und feiern! Denn dieser mein Sohn war tot und ist wieder lebendig geworden. Er war verloren und ist gefunden worden.“',
        'Und sie fangen an zu feiern. Im Haus klingt Musik, und die Leute tanzen im Kreis.'
      ],
      // Spiel: Hand in Hand (reigen, neu)
      task: { kind: 'reigen', hint: 'Verbinde die Tänzer, bis sich alle an den Händen halten.', dance: REIGEN },
      questions: [
        { q: 'Was bekommt der Sohn?', options: ['ein Kleid, einen Ring und Schuhe', 'einen Hut, einen Gürtel und Handschuhe', 'einen Stab, einen Sack und eine Kette'], answer: 0 },
        { q: 'Warum wollen sie feiern?', options: ['Der Sohn war verloren und ist gefunden.', 'Der Sohn hat viel Geld gebracht.', 'Der Sohn hat ein Haus gebaut.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Der ältere Bruder',
      ref: 'Lukas 15,25–32',
      text: [
        'Der ältere Sohn ist draußen auf dem Feld. Als er sich dem Haus nähert, hört er Musik und Tanz. Er ruft einen Diener zu sich.',
        '„Was ist da los?“, fragt der ältere Sohn.',
        '„Dein Bruder ist gekommen“, sagt der Diener. „Dein Vater gibt ein großes Essen, weil dein Bruder gesund wieder da ist.“',
        'Da wird der ältere Sohn zornig. Er will nicht ins Haus gehen. Der Vater kommt heraus und bittet ihn, ins Haus zu kommen.',
        '„So viele Jahre arbeite ich für dich“, sagt der ältere Sohn. „Nie habe ich getan, was du verboten hast. Aber mir hast du nie eine junge Ziege geschenkt, damit ich mit meinen Freunden feiern kann. Und für diesen deinen Sohn, der sein ganzes Geld ausgegeben hat, machst du eine große Feier!“',
        '„Mein Sohn“, sagt der Vater, „du bist immer bei mir, und alles, was mir gehört, gehört auch dir. Wir müssen uns freuen. Denn dieser dein Bruder war tot und ist wieder lebendig geworden. Er war verloren und ist wieder gefunden.“'
      ],
      // nur Fragen (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo ist der ältere Sohn, als die Feier beginnt?', options: ['auf dem Feld', 'im Haus', 'in der Stadt'], answer: 0 },
        { q: 'Warum wird der ältere Sohn zornig?', options: ['Für seinen Bruder gibt es eine Feier.', 'Der Vater schickt ihn weg.', 'Das Essen ist kalt.'], answer: 0 },
        { q: 'Was sagt der Vater zu ihm?', options: ['Du bist immer bei mir, und alles, was mir gehört, gehört auch dir.', 'Du darfst nicht mitfeiern.', 'Du musst morgen wieder aufs Feld.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was gibt der Vater dem jüngeren Sohn, als er darum bittet?', options: ['seinen Teil von allem, was er hat', 'ein Pferd und einen Wagen', 'einen Brief an den König'], answer: 0 },
    { q: 'Was kommt über das ferne Land, als das Geld weg ist?', options: ['eine große Hungersnot', 'ein langer Regen', 'ein großer Krieg'], answer: 0 },
    { q: 'Welche Arbeit bekommt der Sohn im fernen Land?', options: ['Er hütet Schweine.', 'Er fischt im See.', 'Er baut ein Haus.'], answer: 0 },
    { q: 'Was beschließt der Sohn?', options: ['Er will zu seinem Vater zurückgehen.', 'Er will noch weiter fortgehen.', 'Er will ein reicher Händler werden.'], answer: 0 },
    { q: 'Was tut der Vater, als er seinen Sohn von weitem sieht?', options: ['Er läuft ihm entgegen.', 'Er schließt das Tor zu.', 'Er schickt einen Diener.'], answer: 0 },
    { q: 'Was sagt der Vater zum älteren Sohn?', options: ['Du bist immer bei mir, und alles, was mir gehört, gehört auch dir.', 'Du darfst nicht mitfeiern.', 'Du musst morgen wieder aufs Feld.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of sohn.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of sohn.stages) {
  const file = `audio/abenteuer/sohn/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria (the farm in the morning, the dry land, the feast in the courtyard); they follow one another at random
sohn.music = [
  'audio/abenteuer/sohn/musik-aufbruch-v1.mp3',
  'audio/abenteuer/sohn/musik-fest-v1.mp3',
  'audio/abenteuer/sohn/musik-heimweg-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(sohn, sohnEn)
