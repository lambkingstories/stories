/**
 * Abenteuer "Mose" (2. Mose 1–20, 32–34 und 40,34–38) für 8 bis 10 Jahre: 15 Etappen, Untertitel "Der Weg in die Freiheit". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Mose/ENTWURF_Mose.md (Phase 1, 20.10.2026, zweiter Durchgang am selben Abend), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Körbchen flechten (neu), 3 nur Quiz, 4 Dem Leuchten nachgehen (neu), 5 Unterschiede finden (neu),
 * 6 Lückenvers (alt), 7 Wimmelbild (alt), 8 nur Quiz, 9 nur Quiz, 10 Packen (neu), 11 Mirjams Pauke (neu), 12 Manna sammeln (neu), 13 Worte ordnen (neu), 14 nur Quiz, 15 Der Wolke folgen (neu).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/mose/, images/abenteuer/spiele/mose/<spiel>/, audio/abenteuer/mose/.
 *
 * STAND 21.10.2026 (Phase 2a, Daten und Spiele; Bilder Platzhalter): Die zehn Spieletappen haben ihr Spiel, die ernsten Etappen 1, 3, 8, 9 und 14 bleiben Quiz; die Etappenbilder sind noch die von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit fünfzehn Stationen und dem Ziel (PLATZHALTER bis eigenes Bild: das eigene Panorama); Medaille und Geschenk sind die eigenen von Mose.
 * Deutsche Vorlese-Aufnahmen: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht, die englische App liest mit der Gerätestimme (Liste der Aufnahmen: D:/Claude/Abenteuer-Mose/NEUAUFNAHME-Mose.md).
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BeatGame, CloudGame, DiffGame, FindGame, GlowGame, Journey, MannaGame, PackGame, VerseGame, WeaveGame, WordsGame } from '@/types/adventure'
import { josef } from './josef'
import { MOSE_PATH } from './mosePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { moseEn } from './en/mose.en'

// Etappenbilder (vorläufig Variante a der neuen Bilder; Anton wählt später a/b): `images/abenteuer/mose/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/mose/'

const G = 'images/abenteuer/spiele/mose/'

/**
 * Etappe 13, "Worte ordnen": die Wörter eines Satzes liegen in gemischter Folge auf Steinplättchen und werden der Reihe nach in den Satzstreifen gelegt (Bildauftrag M37; Hintergrund = das Etappenbild der Etappe,
 * von der App weichgezeichnet, Mischung immer gleich und nie in der richtigen Ordnung). Plan v3: zwei Runden mit je zwei Sätzen, alle wörtlich im Text der Etappe (auch englisch); Runde 1 kurze, Runde 2 längere.
 * Bilder (gemalt, 21.10.2026): `worte/stein.webp` 260 × 110 (leer, das Wort schreibt die App), `worte/streifen.webp` 900 × 160 (leer), beide transparent.
 */
const WORTE: WordsGame = {
  background: `${PICS}etappe-bild-04.webp`,
  chip: `${G}worte/stein.webp`,
  strip: `${G}worte/streifen.webp`,
  rounds: [
    { hint: 'Lege die Wörter in der richtigen Reihenfolge in den Streifen.', sentences: ['Du sollst nicht töten.', 'Ehre Vater und Mutter.'] },
    { hint: 'Jetzt längere Sätze.', sentences: ['Du sollst keine anderen Götter neben mir haben.', 'Ich bin dein Gott, der dich aus Ägypten befreit hat.'] }
  ]
}

/**
 * Etappe 5, "Unterschiede finden": zwei Bilder des Lagers am Berg Gottes, das rechte hat einige kleine Dinge mehr; das Kind tippt rechts, was links fehlt (Bildauftrag M32; zwei eigene Grundbilder). Plan v3: Runde 1 drei
 * große Dinge, Runde 2 vier kleinere (zusammen sieben, jedes Ding ein anderes Bild). Lagen (Mitte und Breite, Prozent des Bildes) sind am gemalten Bild abgelesen und mit den Dingen zusammen angesehen (`unterschied-messung.json`; Runde 1 `lager-1`, Runde 2 `lager-2-b`).
 * Bilder (gemalt, 21.10.2026): `unterschied/lager-1.webp`, `lager-2.webp` je 900 × 675 (ohne die Zusatzdinge), sieben Sprites höchstens 160 px: `stab`, `krug`, `buendel`, `korb`,
 * `brot`, `schuhe`, `vogel` (transparent).
 */
const UNTERSCHIED: DiffGame = {
  rounds: [
    {
      hint: 'Das rechte Lager hat ein paar Dinge mehr. Tippe, was links fehlt.',
      base: `${G}unterschied/lager-1.webp`,
      items: [
        { image: `${G}unterschied/stab.webp`, x: 22, y: 64, w: 12 },
        { image: `${G}unterschied/krug.webp`, x: 48, y: 74, w: 10 },
        { image: `${G}unterschied/buendel.webp`, x: 76, y: 62, w: 12 }
      ]
    },
    {
      hint: 'Noch einmal, mit kleineren Dingen.',
      base: `${G}unterschied/lager-2.webp`,
      items: [
        { image: `${G}unterschied/korb.webp`, x: 18, y: 70, w: 9 },
        { image: `${G}unterschied/brot.webp`, x: 36, y: 48, w: 8 },
        { image: `${G}unterschied/schuhe.webp`, x: 68, y: 54, w: 7 },
        { image: `${G}unterschied/vogel.webp`, x: 80, y: 68, w: 8 }
      ]
    }
  ]
}

/**
 * Etappe 12, "Manna sammeln": Tag für Tag werden Körnchen in Krüge gesammelt (vier Körnchen füllen einen Krug), an einem gewöhnlichen Tag zwei Krüge, am sechsten Tag vier, am siebten Tag ruht man (Bildauftrag M36;
 * Hintergrund = das Etappenbild 12, von der App weichgezeichnet). Plan v3: Runde 1 zwei gewöhnliche Tage, Runde 2 ein gewöhnlicher Tag, der doppelte Tag und der Ruhetag (zusammen 5 Tage). Es gibt zwei Körnchenbilder.
 * Bilder (gemalt, 21.10.2026): `manna/koernchen-1.webp`, `koernchen-2.webp` je 90 × 90, `krug-leer.webp`, `krug-voll.webp` je 220 × 220, `bewohner.webp` 260 × 260 (alle transparent).
 */
const MANNA: MannaGame = {
  background: `${PICS}etappe-bild-12.webp`,
  flakes: [`${G}manna/koernchen-1.webp`, `${G}manna/koernchen-2.webp`],
  jar: `${G}manna/krug-leer.webp`,
  jarFull: `${G}manna/krug-voll.webp`,
  dwellers: `${G}manna/bewohner.webp`,
  flakesPerJar: 4,
  rounds: [
    { hint: 'Sammle zwei Krüge voll und tippe dann „Genug“.', days: [{ jars: 2 }, { jars: 2 }] },
    { hint: 'Am sechsten Tag sammelst du doppelt, am siebten liegt nichts auf dem Boden.', days: [{ jars: 2 }, { jars: 4 }, { jars: 0 }] }
  ]
}

/**
 * Etappe 15, "Der Wolke folgen": die Säule hebt sich (das Volk bricht auf) oder bleibt (das Volk bleibt); ringsum treiben Dinge, die nichts damit zu tun haben; das Kind antwortet, wenn es sicher ist, die Szene
 * wiederholt sich, bis es antwortet (Bildauftrag M38; eigene Szenen für Tag und Nacht). Plan v3: Runde 1 drei Fragen am Tag (Vögel als Ablenkung), Runde 2 drei in der Nacht (Feuersäule als Lichtsäule, ohne Gesicht und ohne
 * Gestalt; Funken als Ablenkung). Eine falsch beantwortete Frage kommt am Ende der Runde noch einmal. Nie dreimal dasselbe hintereinander (Test). Der Rauch entfällt.
 * Bilder (gemalt, 21.10.2026): `wolke/tag.webp`, `nacht.webp` je 1000 × 750 (ohne Säule), `saeule-tag.webp`, `saeule-nacht.webp` je 220 × 640 (transparent), `vogel.webp`, `funken.webp` (transparent).
 */
const WOLKE: CloudGame = {
  dayScene: `${G}wolke/tag.webp`,
  nightScene: `${G}wolke/nacht.webp`,
  pillarDay: `${G}wolke/saeule-tag.webp`,
  pillarNight: `${G}wolke/saeule-nacht.webp`,
  extras: { birds: `${G}wolke/vogel.webp`, sparks: `${G}wolke/funken.webp` },
  rounds: [
    {
      hint: 'Hebt sich die Säule, bricht das Volk auf; bleibt sie stehen, bleibt es.',
      mode: 'day',
      trials: [
        { pillar: 'rises', distractors: ['birds'] },
        { pillar: 'stays', distractors: ['birds'] },
        { pillar: 'rises', distractors: [] }
      ]
    },
    {
      hint: 'Jetzt ist es Nacht, Funken sind kein Zeichen.',
      mode: 'night',
      trials: [
        { pillar: 'stays', distractors: ['sparks'] },
        { pillar: 'stays', distractors: [] },
        { pillar: 'rises', distractors: ['sparks'] }
      ]
    }
  ]
}

/**
 * Etappe 2, "Körbchen flechten": das Rohr läuft Reihe für Reihe abwechselnd vor und hinter den senkrechten Stäben; das Kind tippt die Felder, in denen es vor dem Stab läuft (Bildauftrag M30; Hintergrund = das Etappenbild 2,
 * von der App weichgezeichnet). Plan v3: Runde 1 drei Reihen, vier Stäbe, jede Reihe beginnt vor dem ersten Stab (6 Felder); Runde 2 vier Reihen, fünf Stäbe, jede Reihe beginnt andersherum als die darunter (10 Felder). Zusammen 16 Felder.
 * Bilder (gemalt, 21.10.2026): `flechten/stab.webp`, `rohr-vorn.webp`, `rohr-hinten.webp`, `reihe-aktiv.webp` je 192 × 192 (Kachel, transparent), `koerbchen-fertig.webp` 600 × 600.
 */
const FLECHTEN: WeaveGame = {
  background: `${PICS}etappe-bild-02.webp`,
  tiles: { stake: `${G}flechten/stab.webp`, front: `${G}flechten/rohr-vorn.webp`, behind: `${G}flechten/rohr-hinten.webp`, active: `${G}flechten/reihe-aktiv.webp` },
  done: `${G}flechten/koerbchen-fertig.webp`,
  rounds: [
    { hint: 'Tippe die Felder, in denen das Rohr vor dem Stab läuft.', stakes: 4, rows: 3, pattern: 'same' },
    { hint: 'Jetzt beginnt jede Reihe andersherum.', stakes: 5, rows: 4, pattern: 'alternate' }
  ]
}

/**
 * Etappe 4, "Dem Leuchten nachgehen": Mose wird über einen dämmrigen Hang geführt, auf ein Leuchten zu, das heller wird, je näher er kommt; unter etwa 7 % der Bildbreite ist er da und der Busch leuchtet (Bildauftrag M31;
 * ein Hang für beide Runden). Es gibt keinen Fehler; nach 20 Sekunden ohne Fortschritt zeigt ein Tipp Funken in Richtung des Busches (zählt als Tipp). Plan v3: Runde 1 der Busch steht offen am Hang, Runde 2 legt `felsen-vorn.webp`
 * über denselben Hang und der Busch liegt hinter den Felsen, nur der Schein dringt durch die Lücken. Gott ist nicht im Bild und spricht nicht im Spiel. Start und Busch (Prozent des Bildes) sind am gemalten Bild abgelesen (`leuchten-messung.json`, Hang und Felsen Variante b): Runde 1 von links unten nach rechts oben, Runde 2 von rechts oben zum Busch hinter den Felsen (zwei Lücken, Alpha der Felsen dort 1 bis 2 von 255).
 * Bilder (gemalt, 21.10.2026): `leuchten/hang.webp` 1000 × 750 (ohne Busch), `busch.webp` 400 × 400, `mose.webp` 220 × 300, `felsen-vorn.webp` 1000 × 750 (transparent).
 */
const LEUCHTEN: GlowGame = {
  walker: `${G}leuchten/mose.webp`,
  bush: `${G}leuchten/busch.webp`,
  rounds: [
    { hint: 'Führe Mose über den Hang, dort leuchtet etwas.', background: `${G}leuchten/hang.webp`, start: [18, 76], target: [74, 39], threshold: 7 },
    { hint: 'Jetzt verdecken Felsen das Licht.', background: `${G}leuchten/hang.webp`, start: [78, 38], target: [34, 74], threshold: 7, cover: `${G}leuchten/felsen-vorn.webp` }
  ]
}

/**
 * Etappe 11, "Mirjams Pauke": der Danktanz am Ufer (2. Mose 15,20f), nicht die Rettung; kein Heer, kein Wasser über Menschen (Bildauftrag M35). Goldene Ringe ziehen sich auf die Pauke zu, das Kind tippt, wenn ein Ring
 * sie erreicht (Fenster ± 0,25 s, `judge` in `utils/moseGames.ts`). Ein ausgelassener Ring verblasst ohne Fehler; ein Tipp ohne Ring in der Nähe ist ein Fehler. Kein Zeitdruck: die Runde endet, wenn der letzte Ring vorbei ist,
 * wer zu wenige trifft, darf es noch einmal versuchen. Plan v3: Runde 1 sechs Ringe, 72 Schläge je Minute; Runde 2 neun Schläge mit zwei Pausen (sieben Ringe), 80 Schläge. Zusammen 6 + 7 = 13 Ringe.
 * Der Hintergrund ist das Etappenbild 11, von der App weichgezeichnet. Bilder (gemalt, 21.10.2026): `takt/pauke.webp` 500 × 500 (transparent), `takt/ring.webp` 512 × 512 (transparent). Töne `pauke.mp3`
 * und `pauke-dumpf.mp3` sind noch nicht da (Ton-Agent); bis dahin klingen `bead` und `wrong`.
 */
const TAKT: BeatGame = {
  background: `${PICS}etappe-bild-11.webp`,
  drum: `${G}takt/pauke.webp`,
  ring: `${G}takt/ring.webp`,
  rounds: [
    { hint: 'Tippe die Pauke, wenn ein Ring sie erreicht.', bpm: 72, pattern: [1, 1, 1, 1, 1, 1] },
    { hint: 'Jetzt fehlt manchmal ein Ring.', bpm: 80, pattern: [1, 1, 0, 1, 1, 1, 0, 1, 1] }
  ]
}

/**
 * Etappe 6, "Lass mein Volk ziehen" (Lückenvers, alte Mechanik): zwei Sätze aus dem Text der Etappe; die Wörter sind kurze Blätter (`answers` zeigt auf die richtigen, Ablenkwörter stehen
 * dabei). Runde 1: der Auftrag an den Pharao (2. Mose 5,1), zwei Lücken; Runde 2: Gottes Versprechen (6,6f), drei Lücken. Zusammen 2 + 3 = 5 Lücken. Tafel und Blatt sind die aus Adam und Eva, kopiert nach `lueckenvers/`.
 * Hintergrund ist das Etappenbild 6, von der App weichgezeichnet (`soft`); keine neuen Bilder.
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-06.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Lass mein ', ' ziehen, damit es mir in der ', ' ein Fest feiert!'], words: ['Volk', 'Wüste', 'Land', 'Stadt'], answers: [0, 1] },
    { hint: 'Jetzt fehlen drei Wörter.', parts: ['Ich will euch aus der schweren Arbeit ', ' und euch ', '. Ihr sollt mein Volk sein, und ich will euer ', ' sein.'], words: ['herausführen', 'retten', 'Gott', 'König', 'Hirte'], answers: [0, 1, 2] }
  ]
}

/**
 * Etappe 7, "Frösche in der Backstube" (Wimmelbild, alte Mechanik): in Pharaos Haus (Backstube mit Ofen und Backtrog, darunter die Schlafkammer) sitzen sieben kleine, freundliche Frösche, vier davon halb hinter Dingen
 * (Verdecker). Komisch und ruhig, ohne Ekel: kein toter Frosch, kein Gestank, kein Blut (Bildauftrag M33; eigene Szene `wimmel/szene.webp`). Plan v3: drei Froschbilder und drei Verdeckerbilder, die sich wiederholen.
 * Die Lagen (Mitte der Unterkante und Breite, Prozent der Szene) sind am gemalten Bild abgelesen (`wimmel-messung.json`; die vier Verdecker sind so weit nach unten gesetzt, dass jeder Frosch noch zu einem Drittel bis zur Hälfte herausschaut).
 * Bilder (gemalt, 21.10.2026): `wimmel/szene.webp` 1100 × 1467, `frosch-a.webp`, `frosch-b.webp`, `frosch-c.webp` je ca. 140–190 breit (transparent), `decke-a.webp`, `decke-b.webp`, `decke-c.webp` je 330 breit (transparent).
 */
const WIMMEL: FindGame = {
  labels: Array.from({ length: 7 }, () => 'Frosch'),
  doneText: 'Du hast alle sieben Frösche gefunden!',
  scene: `${G}wimmel/szene.webp`,
  finds: [
    { image: `${G}wimmel/frosch-a.webp`, x: 13, y: 25.5, w: 13 },
    { image: `${G}wimmel/frosch-c.webp`, x: 47, y: 24.7, w: 13 },
    { image: `${G}wimmel/frosch-b.webp`, x: 87, y: 35.7, w: 13 },
    { image: `${G}wimmel/frosch-c.webp`, x: 65, y: 79, w: 13 },
    { image: `${G}wimmel/frosch-a.webp`, x: 84, y: 91, w: 13 },
    { image: `${G}wimmel/frosch-c.webp`, x: 25, y: 94, w: 13 },
    { image: `${G}wimmel/frosch-a.webp`, x: 76, y: 55, w: 13 }
  ],
  covers: [
    { image: `${G}wimmel/decke-a.webp`, x: 65, y: 83.5, w: 28 },
    { image: `${G}wimmel/decke-c.webp`, x: 84, y: 95.5, w: 28 },
    { image: `${G}wimmel/decke-b.webp`, x: 25, y: 98.5, w: 20 },
    { image: `${G}wimmel/decke-b.webp`, x: 76, y: 60.5, w: 20 }
  ]
}

/**
 * Etappe 10, "Der Auszug": Teig, Gefäße aus Silber und Gold und Kleider kommen in ein Tragetuch (2. Mose 12,34–36), Form und Platz statt Gewicht (Bildauftrag M14). Das Spiel ist das vorhandene "Packen" (Josua 1), hier nur Daten: ein Tuch
 * statt des Korbs, ein Tippen dreht ein gelegtes Stück. Ein Feld ist 100 Pixel. Runde 1: 4 × 3 Felder mit drei Stücken (3 × 2, 2 × 2, 1 × 2); Runde 2: 5 × 4 Felder mit fünf Stücken (3 × 2, 2 × 2, 2 × 3, 1 × 2, 1 × 2); beide
 * füllen das Tuch genau und sind lösbar (Test). Das Tuch (`area`, Prozent des Etappenbildes) ist das auf die Stoffmitte zugeschnittene Tuchbild (680 × 490, Seitenverhältnis 1,39), der Bereich füllt die Spielfläche entsprechend (Prozent der Spielfläche).
 * Bilder (gemalt, 21.10.2026): `packen/tuch.webp` 900 × 675, `teigtrog.webp` 200 × 200, `silberkrug.webp`, `goldkrug.webp` je 100 × 200, `kleiderbuendel.webp` 300 × 200, `tuchbuendel.webp` 200 × 300 (alle transparent).
 */
const AUSZUG: PackGame = {
  background: `${PICS}etappe-bild-10.webp`,
  basket: `${G}packen/tuch.webp`,
  items: [
    { id: 'kleiderbuendel', image: `${G}packen/kleiderbuendel.webp`, w: 3, h: 2, label: 'Kleiderbündel' },
    { id: 'teigtrog', image: `${G}packen/teigtrog.webp`, w: 2, h: 2, label: 'Teigtrog' },
    { id: 'tuchbuendel', image: `${G}packen/tuchbuendel.webp`, w: 2, h: 3, label: 'Tücherbündel' },
    { id: 'silberkrug', image: `${G}packen/silberkrug.webp`, w: 1, h: 2, label: 'Silberkrug' },
    { id: 'goldkrug', image: `${G}packen/goldkrug.webp`, w: 1, h: 2, label: 'Goldkrug' }
  ],
  area: { x: 20, y: 26, w: 60, h: 64.8 },
  rounds: [
    { hint: 'Packe das Tragetuch, ein Tippen dreht ein Stück.', cols: 4, rows: 3, items: ['kleiderbuendel', 'teigtrog', 'silberkrug'] },
    { hint: 'Jetzt mehr Stücke und kein Platz übrig.', cols: 5, rows: 4, items: ['kleiderbuendel', 'teigtrog', 'tuchbuendel', 'silberkrug', 'goldkrug'] }
  ]
}

export const mose: Journey = {
  id: 'mose',
  title: 'Mose',
  subtitle: 'Der Weg in die Freiheit',
  age: '8-10',
  downloadMb: 13, // gemessen am 21.10.2026 mit den eigenen Etappenbildern (Variante a) und der eigenen Karte; ohne die noch fehlenden Aufnahmen
  medal: 'images/abenteuer/mose/medaille-v2.webp', // Der brennende Dornbusch (Busch mit Flamme aus Licht, Sandalen und Hirtenstab, Goldring)
  // Geschenk-Ausmalbild: Der Weg durch das Meer (Mose mit erhobenem Stab, zwei Wasserwände, trockener Weg, Familie mit Kindern, Esel und Lamm, Wolkensäule hinter dem Volk, Konturzeichnung im Querformat 1536 × 1024)
  gift: { title: 'Der Weg durch das Meer', image: 'images/abenteuer/mose/geschenk.webp' },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v3 mit fünfzehn Orten und dem Ziel) mit Stationen und Perlenweg aus mosePath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/mose/karte-pano-v3-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0505, y: 0.6311, d: 0.0339 },
      { x: 0.109, y: 0.2427, d: 0.0339 },
      { x: 0.1716, y: 0.625, d: 0.0339 },
      { x: 0.2422, y: 0.2549, d: 0.0339 },
      { x: 0.2725, y: 0.6432, d: 0.0339 },
      { x: 0.3734, y: 0.3641, d: 0.0339 },
      { x: 0.4289, y: 0.6189, d: 0.0339 },
      { x: 0.5046, y: 0.1396, d: 0.0339 },
      { x: 0.5501, y: 0.6311, d: 0.0339 },
      { x: 0.6258, y: 0.1517, d: 0.0339 },
      { x: 0.6762, y: 0.6068, d: 0.0339 },
      { x: 0.7822, y: 0.6493, d: 0.0339 },
      { x: 0.8579, y: 0.1942, d: 0.0339 },
      { x: 0.9084, y: 0.6311, d: 0.0339 },
      { x: 0.9487, y: 0.6432, d: 0.0339 }
    ],
    exam: { x: 0.9881, y: 0.3762, d: 0.0339 },
    path: MOSE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Schifra und Pua',
      ref: '2. Mose 1,1–21',
      text: [
        'Die Nachkommen Jakobs leben in Ägypten, und es werden immer mehr. Da kommt ein neuer König an die Macht, der Pharao. Er kennt Josef nicht und hat Angst vor dem großen Volk.',
        'Darum macht der Pharao die Israeliten zu Arbeitern. Sie müssen aus Lehm Ziegel formen und für ihn bauen. Die Arbeit ist schwer, aber das Volk wächst trotzdem weiter.',
        'Da befiehlt der Pharao den Hebammen Schifra und Pua: „Wenn ein Junge geboren wird, lasst ihn nicht am Leben!“',
        'Aber Schifra und Pua fürchten Gott. Sie tun nicht, was der Pharao sagt, und lassen die Jungen leben. Dafür segnet Gott die beiden Frauen.'
      ],
      // Bleibt Quiz (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißen die zwei Hebammen?', options: ['Schifra und Pua', 'Sara und Hagar', 'Lea und Rahel'], answer: 0 },
        { q: 'Warum tun die Hebammen nicht, was der Pharao sagt?', options: ['Sie fürchten Gott.', 'Sie haben keine Zeit.', 'Sie kennen den Pharao nicht.'], answer: 0 },
        { q: 'Was müssen die Israeliten für den Pharao machen?', options: ['Ziegel formen', 'Schiffe bauen', 'Brunnen graben'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      title: 'Das Körbchen im Schilf',
      ref: '2. Mose 2,1–10',
      text: [
        'Der Pharao hat befohlen, alle neugeborenen Jungen der Israeliten in den Nil zu werfen. Eine Mutter versteckt ihr Baby drei Monate lang.',
        'Dann kann sie es nicht länger verstecken. Sie legt das Baby in ein Körbchen aus Schilf und stellt es ins Schilf am Ufer. Seine Schwester bleibt in der Nähe und schaut zu.',
        'Da kommt die Tochter des Pharao zum Nil. Sie entdeckt das Körbchen und öffnet es. Das Baby weint, und sie hat Mitleid.',
        '„Soll ich eine Frau holen, die das Kind stillt?“, fragt die Schwester. So wird die Mutter die Amme. Später nimmt die Tochter des Pharao den Jungen zu sich und nennt ihn Mose, denn sie hat ihn aus dem Wasser gezogen.'
      ],
      // Spiel gebaut: Körbchen flechten (flechten, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'flechten', hint: 'Flechte das Körbchen aus Schilfrohr.', weave: FLECHTEN },
      questions: [
        { q: 'Wo legt die Mutter ihr Baby hin?', options: ['in ein Körbchen im Schilf', 'in ein Boot', 'in eine Höhle'], answer: 0 },
        { q: 'Wie nennt die Tochter des Pharao den Jungen?', options: ['Mose', 'Aaron', 'Gerschom'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Flucht nach Midian',
      ref: '2. Mose 2,11–25',
      text: [
        'Mose wächst am Hof des Pharao auf. Als er groß ist, sieht er, wie schwer sein Volk arbeiten muss. Da schlägt ein Ägypter einen Israeliten. Mose erschlägt den Ägypter und versteckt ihn im Sand.',
        'Der Pharao erfährt davon und will Mose ergreifen. Da flieht Mose in das Land Midian und setzt sich dort an einen Brunnen.',
        'Sieben Töchter des Priesters Jitro kommen, um die Schafe ihres Vaters zu tränken. Hirten wollen sie vertreiben, aber Mose hilft ihnen. Jitro lädt Mose ein. Mose bleibt bei ihnen und heiratet Jitros Tochter Zippora.',
        'Weit weg in Ägypten stöhnen die Israeliten unter ihrer Arbeit und schreien zu Gott. Gott hört ihr Schreien und denkt an sein Versprechen an Abraham, Isaak und Jakob.'
      ],
      // Bleibt Quiz (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin flieht Mose?', options: ['nach Midian', 'nach Babel', 'nach Kanaan'], answer: 0 },
        { q: 'Was hört Gott in Ägypten?', options: ['das Schreien seines Volkes', 'ein Lied der Hirten', 'das Rauschen des Nils'], answer: 0 },
        { q: 'Wie viele Töchter des Priesters kommen zum Brunnen?', options: ['sieben', 'zwei', 'zwölf'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der brennende Dornbusch',
      ref: '2. Mose 3,1–15',
      text: [
        'Mose hütet die Schafe seines Schwiegervaters Jitro. Er führt sie durch die Wüste bis zum Berg Horeb.',
        'Da sieht er einen Busch, der brennt, aber nicht verbrennt. „Das muss ich mir ansehen“, denkt Mose und geht näher.',
        'Aus dem Busch ruft eine Stimme: „Mose, Mose! Zieh deine Schuhe aus, denn der Ort, auf dem du stehst, ist heiliger Boden. Ich bin der Gott Abrahams, Isaaks und Jakobs.“ Da verhüllt Mose sein Gesicht, denn er fürchtet sich, Gott anzuschauen.',
        '„Ich habe das Elend meines Volkes gesehen“, sagt Gott. „Ich sende dich zum Pharao, damit du mein Volk aus Ägypten führst.“ Mose zweifelt: „Wer bin ich?“ „Ich will mit dir sein“, antwortet Gott. Mose fragt: „Was soll ich dem Volk sagen, wie du heißt?“ Gott antwortet: „ICH WERDE SEIN, DER ICH SEIN WERDE.“'
      ],
      // Spiel gebaut: Dem Leuchten nachgehen (leuchten, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'leuchten', hint: 'Geh dem Leuchten nach.', glow: LEUCHTEN },
      questions: [
        { q: 'Was ist mit dem Busch besonders?', options: ['Er brennt, aber verbrennt nicht.', 'Er wächst in einer Nacht.', 'Er ist aus Gold.'], answer: 0 },
        { q: 'Was soll Mose tun, weil der Boden heilig ist?', options: ['seine Schuhe ausziehen', 'sich verstecken', 'ein Feuer löschen'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Mose und Aaron',
      ref: '2. Mose 4,1–31',
      text: [
        'Mose zweifelt: „Die Leute werden mir nicht glauben.“ Da zeigt Gott ihm ein Zeichen. Der Stab in Moses Hand wird zur Schlange und dann wieder zum Stab.',
        '„Ich kann nicht gut reden“, sagt Mose. „Wer hat den Menschen den Mund gemacht?“, fragt Gott. „Ich will mit deinem Mund sein und dir sagen, was du reden sollst.“ Aber Mose bittet: „Schick lieber einen anderen!“ Da wird Gott zornig. „Dein Bruder Aaron kann gut reden. Er soll für dich sprechen.“',
        'Mose zieht mit seiner Familie nach Ägypten. Am Berg Gottes kommt ihm Aaron entgegen, und die beiden Brüder umarmen sich.',
        'Gemeinsam rufen sie die Ältesten Israels zusammen. Aaron erzählt, was Gott gesagt hat. Die Ältesten glauben ihnen, und als sie hören, dass Gott ihr Elend gesehen hat, fallen sie nieder und beten an.'
      ],
      // Spiel gebaut: Unterschiede finden (unterschied, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'unterschied', hint: 'Finde, was im rechten Bild mehr ist.', diff: UNTERSCHIED },
      questions: [
        { q: 'Was sagt Mose, als Gott ihn sendet?', options: ['„Ich kann nicht gut reden.“', '„Ich bin zu müde.“', '„Ich kenne den Weg nicht.“'], answer: 0 },
        { q: 'Wer soll für Mose sprechen?', options: ['sein Bruder Aaron', 'Jitro', 'Josua'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Lass mein Volk ziehen',
      ref: '2. Mose 5,1 bis 6,9',
      text: [
        'Mose und Aaron gehen zum Pharao. „So spricht Gott: Lass mein Volk ziehen, damit es mir in der Wüste ein Fest feiert!“',
        'Der Pharao wird hart: „Wer ist Gott? Ich kenne ihn nicht. Ich lasse Israel nicht ziehen!“ Und er macht die Arbeit noch schwerer: Die Israeliten müssen jetzt ihr Stroh für die Ziegel selbst suchen. Die Menschen sind mutlos.',
        'Mose geht zu Gott.',
        'Aber Gott sagt zu Mose: „Ich will euch aus der schweren Arbeit herausführen und euch retten. Ihr sollt mein Volk sein, und ich will euer Gott sein.“ Mose erzählt es dem Volk, doch vor lauter Not hören sie nicht zu.'
      ],
      // Spiel gebaut: Lückenvers (lueckenvers, alt); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'lueckenvers', hint: 'Setze die fehlenden Wörter in den Satz.', verse: VERS },
      questions: [
        { q: 'Was müssen die Israeliten jetzt selbst tun?', options: ['ihr Stroh für die Ziegel suchen', 'ihr Wasser holen', 'ihre Zelte bauen'], answer: 0 },
        { q: 'Was verspricht Gott dem Volk?', options: ['Er will es retten.', 'Er will es bestrafen.', 'Er will es vergessen.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Die Frösche',
      ref: '2. Mose 7,14 bis 8,15',
      text: [
        'Zuerst wird das Wasser im Nil zu Blut. Aber der Pharao bleibt hart und lässt das Volk nicht ziehen.',
        'Dann kommen Frösche aus dem Nil. Sie hüpfen in die Häuser, in die Backstube und in die Schlafkammer, bis überall Frösche sind.',
        'Da ruft der Pharao Mose: „Bitte Gott, dass er die Frösche wegnimmt. Dann lasse ich das Volk ziehen.“ Mose betet, und Gott tut, worum er bittet: Die Frösche sterben in den Häusern, in den Höfen und auf den Feldern.',
        'Als der Pharao sieht, dass die Plage vorbei ist, wird er wieder hart. Er hält sein Wort nicht und lässt das Volk nicht ziehen.'
      ],
      // Spiel gebaut: Wimmelbild: Frösche (wimmelbild, alt); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'wimmelbild', hint: 'Finde die Frösche in der Backstube.', count: 7, find: WIMMEL },
      questions: [
        { q: 'Was geschieht zuerst mit dem Wasser im Nil?', options: ['Es wird zu Blut.', 'Es wird zu Eis.', 'Es versiegt.'], answer: 0 },
        { q: 'Was verspricht der Pharao, wenn die Frösche weg sind?', options: ['Er will das Volk ziehen lassen.', 'Er will Mose belohnen.', 'Er will einen neuen Palast bauen.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      title: 'Finsternis und Licht',
      ref: '2. Mose 9,1 bis 10,29',
      text: [
        'Danach kommen noch mehr Plagen über das Land. Ein schwerer Hagel zerstört die Ernte und trifft Menschen und Tiere, die draußen sind. Heuschrecken fressen, was übrig bleibt. Doch der Pharao bleibt hart.',
        'Dann spricht Gott zu Mose: „Strecke deine Hand zum Himmel aus!“ Mose tut es, und es wird finster in ganz Ägypten. Die Dunkelheit ist so dicht, dass man sie fast greifen kann.',
        'Drei Tage lang sehen die Ägypter einander nicht. Niemand steht von seinem Platz auf.',
        'Aber bei den Israeliten ist es hell in ihren Wohnungen. Der Pharao will das Volk trotzdem nicht ziehen lassen.'
      ],
      // Bleibt Quiz (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie lange ist es finster in Ägypten?', options: ['drei Tage', 'sieben Tage', 'eine Nacht'], answer: 0 },
        { q: 'Wo ist es hell?', options: ['bei den Israeliten', 'im Palast des Pharao', 'auf dem Berg'], answer: 0 },
        { q: 'Was tut Mose, bevor es finster wird?', options: ['Er streckt seine Hand zum Himmel aus.', 'Er baut ein Haus.', 'Er singt ein Lied.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die Nacht des Passah',
      ref: '2. Mose 11,1 bis 12,32',
      text: [
        'Gott sagt zu Mose: „Noch eine Plage schicke ich über Ägypten. Danach lässt der Pharao euer Volk ziehen.“ Mose sagt den Israeliten, wie sie sich vorbereiten sollen.',
        'Am Abend essen die Familien das Passahmahl mit Lamm und Fladenbrot. Dabei sind sie reisefertig. Sie tragen Gürtel um die Hüften und Schuhe an den Füßen und halten den Stab in der Hand.',
        'Jede Familie streicht Blut vom Lamm an die Türpfosten und oben an die Schwelle. Gott hat gesagt: „Wenn ich das Blut sehe, gehe ich an euch vorüber.“ In der Nacht sterben in Ägypten alle Erstgeborenen, und ein großes Klagen geht durch das Land. Bei den Israeliten aber bleibt es still.',
        'Noch in derselben Nacht ruft der Pharao Mose und Aaron. „Zieht fort, ihr und alle Israeliten!“, sagt er.'
      ],
      // Bleibt Quiz (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie essen die Israeliten das Passahmahl?', options: ['reisefertig', 'schlafend', 'tanzend'], answer: 0 },
        { q: 'Was sagt Gott zu den Häusern der Israeliten?', options: ['Ich gehe an euch vorüber.', 'Ich zerstöre sie.', 'Ich sehe sie nicht.'], answer: 0 },
        { q: 'Was sagt der Pharao zuletzt?', options: ['„Zieht fort!“', '„Bleibt hier!“', '„Kommt morgen wieder!“'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      title: 'Der Auszug',
      ref: '2. Mose 12,33 bis 13,22',
      text: [
        'Die Ägypter drängen das Volk zur Eile. Die Israeliten packen ihren Teig noch ungesäuert in Tücher. So tragen sie ihn auf der Schulter.',
        'Die Ägypter schenken ihnen Silber- und Goldgefäße und Kleider. So ziehen die Israeliten aus Ägypten fort, sehr viele, mit ihren Schafen und Rindern.',
        'Mose nimmt die Gebeine Josefs mit. Das hat Josef einst von seinen Brüdern gewünscht: „Gott wird sich euer annehmen. Dann nehmt meine Gebeine mit.“',
        'Gott selbst zeigt ihnen den Weg. Am Tag geht eine Wolkensäule vor ihnen her, und in der Nacht leuchtet ihnen eine Feuersäule.'
      ],
      // Spiel gebaut: Packen (packen, vorhandene Mechanik aus Josua); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'packen', hint: 'Packe das Tragetuch für den Auszug.', pack: AUSZUG },
      questions: [
        { q: 'Wessen Gebeine nimmt Mose mit?', options: ['die Gebeine Josefs', 'die Gebeine Jakobs', 'die Gebeine Abrahams'], answer: 0 },
        { q: 'Was zeigt dem Volk den Weg?', options: ['eine Wolkensäule am Tag und eine Feuersäule bei Nacht', 'ein Stern', 'ein Hirte mit einer Laterne'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11.webp`,
      title: 'Das Wunder am Meer',
      ref: '2. Mose 14,1 bis 15,21',
      text: [
        'Das Volk steht am Meer, und hinter ihm kommt das Heer des Pharao. Die Israeliten haben Angst.',
        '„Fürchtet euch nicht!“, ruft Mose. „Steht fest und seht zu! Gott wird für euch streiten, und ihr werdet still sein.“',
        'Die Wolkensäule stellt sich zwischen das Volk und das Heer. Mose streckt seine Hand über das Meer aus, und ein starker Ostwind teilt das Wasser. Rechts und links steht es wie eine Mauer, und das Volk geht trocken mitten hindurch.',
        'Das Heer des Pharao jagt dem Volk ins Meer nach. Da fällt das Wasser wieder zusammen und bedeckt die Wagen und die Reiter, und keiner von ihnen bleibt übrig. Auf der anderen Seite schlägt Mirjam, die Schwester von Mose und Aaron, die Pauke. „Singt Gott ein Lied!“, ruft sie, und die Frauen tanzen hinter ihr her.'
      ],
      // Spiel gebaut: Mirjams Pauke (takt, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'takt', hint: 'Spiele mit Mirjam auf der Pauke.', beat: TAKT },
      questions: [
        { q: 'Was sagt Mose zum Volk am Meer?', options: ['„Fürchtet euch nicht!“', '„Lauft zurück!“', '„Baut Boote!“'], answer: 0 },
        { q: 'Was teilt das Wasser?', options: ['ein starker Wind', 'ein Netz', 'ein Stab aus Gold'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12.webp`,
      title: 'Brot vom Himmel',
      ref: '2. Mose 15,22 bis 16,36',
      text: [
        'In der Wüste bekommt das Volk Hunger, und die Menschen murren. Da sagt Gott zu Mose: „Ich will euch Brot vom Himmel regnen lassen.“',
        'Am Morgen liegt etwas Weißes wie Reif auf dem Boden, lauter kleine Körner. „Was ist das?“, fragen die Menschen. „Das ist das Brot, das Gott euch gibt“, sagt Mose. Sie nennen es Manna.',
        'Jeder sammelt, so viel er braucht, und es reicht für alle. Es schmeckt süß wie Brot mit Honig.',
        'Gott hat gesagt: „Sammelt am sechsten Tag doppelt, denn am siebten Tag ruht ihr.“ Und so geschieht es: Es gibt am sechsten Tag doppelt so viel, und am siebten Tag liegt nichts auf dem Boden.'
      ],
      // Spiel gebaut: Manna sammeln (manna, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'manna', hint: 'Sammle jeden Tag so viel Manna, wie ihr braucht.', manna: MANNA },
      questions: [
        { q: 'Was liegt am Morgen auf dem Boden?', options: ['etwas Weißes wie Reif', 'Schnee', 'Gold'], answer: 0 },
        { q: 'Wie viel sammeln die Menschen an einem gewöhnlichen Tag?', options: ['so viel, wie sie brauchen', 'so viel sie tragen können', 'nur einen Krug voll'], answer: 0 }
      ]
    },
    {
      id: 13,
      image: `${PICS}etappe-bild-13.webp`,
      title: 'Die zehn Gebote',
      ref: '2. Mose 19,1 bis 20,21',
      text: [
        'Das Volk kommt zum Berg Sinai. Gott sagt: „Hört ihr auf mich, so sollt ihr mein Eigentum sein.“ „Alles, was Gott gesagt hat, wollen wir tun“, antwortet das Volk.',
        'Eine dichte Wolke liegt auf dem Berg, es donnert, und eine Posaune klingt. Das Volk steht unten am Berg, und Gott spricht: „Ich bin dein Gott, der dich aus Ägypten befreit hat.“',
        'Zuerst sagt Gott, wie die Menschen mit ihm leben sollen: „Du sollst keine anderen Götter neben mir haben. Du sollst dir kein Bild machen. Du sollst meinen Namen nicht missbrauchen. Halte den Ruhetag heilig.“',
        'Dann sagt Gott, wie die Menschen miteinander leben sollen: „Ehre Vater und Mutter. Du sollst nicht töten. Du sollst die Ehe nicht brechen und nicht stehlen. Du sollst nichts Falsches über deinen Nächsten sagen und nicht begehren, was einem anderen gehört.“ Das Volk bekommt Angst und tritt zurück.'
      ],
      // Spiel gebaut: Worte ordnen (worte, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'worte', hint: 'Lege die Wörter zu Gottes Worten zusammen.', words: WORTE },
      questions: [
        { q: 'Was antwortet das Volk Gott am Berg?', options: ['„Alles, was Gott gesagt hat, wollen wir tun.“', '„Wir wollen weiterziehen.“', '„Wir brauchen das nicht.“'], answer: 0 },
        { q: 'Was liegt auf dem Berg Sinai?', options: ['eine dichte Wolke', 'tiefer Schnee', 'ein Zelt'], answer: 0 }
      ]
    },
    {
      id: 14,
      image: `${PICS}etappe-bild-14.webp`,
      title: 'Das goldene Kalb',
      ref: '2. Mose 32,1–34 (gekürzt)',
      text: [
        'Das Volk hat Gott versprochen, zu tun, was er sagt. Doch Mose bleibt lange auf dem Berg, und die Menschen werden ungeduldig. „Mach uns Götter, die vor uns hergehen!“, bitten sie Aaron.',
        'Aaron sammelt ihren Goldschmuck ein und macht daraus ein goldenes Kalb. „Das sind deine Götter“, sagen die Menschen. Sie feiern ein Fest vor dem Kalb.',
        'Gott sagt es Mose, und Mose bittet für das Volk. Er geht mit den zwei Steintafeln den Berg hinab, sieht das Kalb und wird zornig. Er zerbricht die Tafeln.',
        'Am nächsten Tag geht Mose wieder zu Gott und bittet: „Vergib ihnen!“ Gott hört auf Mose und führt sein Volk weiter. Aber die Sünde bleibt nicht ohne Folgen: Gott straft das Volk, weil es das Kalb gemacht hat.'
      ],
      // Bleibt Quiz (ernste Etappe)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was macht Aaron aus dem Gold?', options: ['ein Kalb', 'eine Krone', 'ein Zelt'], answer: 0 },
        { q: 'Was bittet Mose für das Volk?', options: ['dass Gott ihnen vergibt', 'dass Gott sie bestraft', 'dass Gott sie verlässt'], answer: 0 }
      ]
    },
    {
      id: 15,
      image: `${PICS}etappe-bild-15.webp`,
      title: 'Gott geht mit',
      ref: '2. Mose 33,7–17; 34,1–4.29; 40,34–38',
      text: [
        'Mose baut außerhalb des Lagers ein Zelt auf. Wenn er hineingeht, steht die Wolkensäule am Eingang, und Gott spricht mit ihm wie ein Freund mit seinem Freund. Die Menschen stehen vor ihren Zelten, sehen zu und verneigen sich.',
        '„Mein Angesicht soll vorangehen“, verspricht Gott. „Ich will dich leiten.“',
        'Mose haut zwei neue Steintafeln zurecht, und Gott schreibt seine Worte darauf. Da ruft Gott seinen Namen aus: „Barmherzig und gnädig und geduldig und von großer Gnade und Treue!“ Als Mose vom Berg kommt, leuchtet sein Gesicht.',
        'Später bedeckt die Wolke das heilige Zelt, das Mose für Gott aufgerichtet hat. Hebt sich die Wolke, bricht das Volk auf; bleibt sie stehen, bleibt das Volk. Am Tag zeigt die Wolke den Weg, und in der Nacht leuchtet Feuer in ihr.'
      ],
      // Spiel gebaut: Der Wolke folgen (wolke, neu); die Spielbilder stehen als Platzhalter, bis sie gemalt sind; das Etappenbild ist noch das von Josef
      task: { kind: 'wolke', hint: 'Folge der Wolke: Breche auf, wenn sie sich hebt.', cloud: WOLKE },
      questions: [
        { q: 'Was zeigt dem Volk den Weg?', options: ['die Wolke über dem Zelt', 'ein Vogel', 'ein Hirtenstab'], answer: 0 },
        { q: 'Wo steht das Zelt, in dem Gott mit Mose spricht?', options: ['außerhalb des Lagers', 'mitten im Lager', 'auf dem Sinai'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißen die zwei Hebammen?', options: ['Schifra und Pua', 'Sara und Hagar', 'Lea und Rahel'], answer: 0 },
    { q: 'Wo legt die Mutter ihr Baby hin?', options: ['in ein Körbchen im Schilf', 'in ein Boot', 'in eine Höhle'], answer: 0 },
    { q: 'Was ist mit dem Busch besonders, den Mose sieht?', options: ['Er brennt, aber verbrennt nicht.', 'Er wächst in einer Nacht.', 'Er ist aus Gold.'], answer: 0 },
    { q: 'Was teilt das Wasser am Meer?', options: ['ein starker Wind', 'ein Netz', 'ein Stab aus Gold'], answer: 0 },
    { q: 'Was antwortet das Volk Gott am Berg?', options: ['„Alles, was Gott gesagt hat, wollen wir tun.“', '„Wir wollen weiterziehen.“', '„Wir brauchen das nicht.“'], answer: 0 },
    { q: 'Was zeigt dem Volk den Weg?', options: ['die Wolke über dem Zelt', 'ein Vogel', 'ein Hirtenstab'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of mose.stages) {
  const t = st.task
  if (t.weave) t.weave.background = st.image
  if (t.verse) t.verse.background = st.image
  if (t.pack) t.pack.background = st.image
  if (t.beat) t.beat.background = st.image
  if (t.manna) t.manna.background = st.image
  if (t.words) t.words.background = st.image
}

// the German recordings of the stories (voice Achernar, text version 3 = files "-v3"); there are no English ones yet, so the English app reads with the voice of the device
// BIBELTREUE 21.10.2026: the texts of these stages were changed after the check against the Bible (Luther 1912), so the old recording no longer fits: no `audio` until the re-recording
// (the list: D:/Claude/Abenteuer-Mose/NEUAUFNAHME-BIBELTREUE-2026-10-21.md; then new files "-v4" and the stage leaves this list); the app reads with the voice of the device meanwhile
export const MOSE_TO_RERECORD: readonly number[] = [4, 5, 7, 9, 11, 13, 14, 15]
for (const s of mose.stages) {
  const file = `audio/abenteuer/mose/geschichte-${String(s.id).padStart(2, '0')}-v3.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || MOSE_TO_RERECORD.includes(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three calm pieces made with Google's Lyria 3.5 (skill `lambking-abenteuer-skill`, ton.md); they follow one another at random
mose.music = [
  'audio/abenteuer/mose/musik-nil-v1.mp3',
  'audio/abenteuer/mose/musik-meer-v1.mp3',
  'audio/abenteuer/mose/musik-sinai-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(mose, moseEn)
