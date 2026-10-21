/**
 * Abenteuer "Josua" (Josua 1–6 und 24) für 8 bis 10 Jahre: 10 Etappen, Untertitel "Mut für das neue Land". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Josua/ENTWURF_Josua.md (Phase 1, 20.10.2026), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Proviant packen (neu), 2 Unter dem Flachs verstecken (neu), 3 Am Seil herablassen (neu),
 * 4 Im Gleichschritt (neu), 5 Memory (alt), 6 Fladen backen (neu), 7 nur Quiz, 8 Ruhe bewahren (neu), 9 nur Quiz, 10 Lückenvers (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/josua/, images/abenteuer/spiele/josua/<spiel>/, audio/abenteuer/josua/.
 *
 * STAND 21.10.2026: alle acht Spiele sind gebaut (die Bilder der Spiele fehlen noch, bis dahin stehen Platzhalter, siehe `NOT_PAINTED_YET` in `utils/journeyFiles.ts`); die Etappen 7 und 9 bleiben Quiz. Die Etappenbilder sind noch die von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit den ersten zehn Stationen (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Vorlese-Aufnahmen gibt es noch nicht (`audio` fehlt): die App liest dann mit der Gerätestimme. Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BakeGame, HideGame, HushGame, Journey, LowerGame, MemoryGame, PackGame, StepGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { JOSUA_PATH } from './josuaPath'
import { localize } from './localize'
import { josuaEn } from './en/josua.en'

// PLATZHALTER bis zum eigenen Bild: die Etappenbilder von Josef (Ordner images/abenteuer/josef/); danach `images/abenteuer/josua/etappe-bild-NN.webp`
const PLACEHOLDER = 'images/abenteuer/josef/'
const G = 'images/abenteuer/spiele/josua/'

/**
 * Etappe 8, "Ruhe bewahren": am Wegrand sitzen Tiere, über denen kleine Lärmwolken wachsen; ein Tippen beruhigt das Tier, bevor die Wolke laut ist (Bildauftrag JO16; Hintergrund = das Etappenbild 8).
 * Sechs feste Plätze (Fußpunkt, Prozent des Bildes, Breite in Prozent). Runde 1 acht Beruhigungen, höchstens zwei Wolken zugleich, 4 Sekunden bis laut; Runde 2 zwölf, bis zu drei Wolken, 3 Sekunden. Die
 * Reihenfolge der Wolken ist aus dem Startwert `seed` immer dieselbe. Die Plätze sind vorläufig geschätzt, bis die Datei `still-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `still/esel.webp`, `gans.webp`, `ziege.webp`, `lamm.webp`, `hahn.webp`, `karren-krug.webp` je 220 × 220, `wolke-1.webp`, `wolke-2.webp`,
 * `wolke-3.webp` je 120 × 100 (alle transparent).
 */
const STILL: HushGame = {
  background: `${PLACEHOLDER}etappe-bild-08.webp`,
  clouds: [`${G}still/wolke-1.webp`, `${G}still/wolke-2.webp`, `${G}still/wolke-3.webp`],
  spots: [
    { id: 'platz-1', animal: 'esel', image: `${G}still/esel.webp`, x: 10, y: 86, w: 13 },
    { id: 'platz-2', animal: 'gans', image: `${G}still/gans.webp`, x: 26, y: 92, w: 13 },
    { id: 'platz-3', animal: 'ziege', image: `${G}still/ziege.webp`, x: 42, y: 88, w: 13 },
    { id: 'platz-4', animal: 'lamm', image: `${G}still/lamm.webp`, x: 58, y: 93, w: 13 },
    { id: 'platz-5', animal: 'hahn', image: `${G}still/hahn.webp`, x: 74, y: 87, w: 13 },
    { id: 'platz-6', animal: 'karren', image: `${G}still/karren-krug.webp`, x: 90, y: 94, w: 13 }
  ],
  rounds: [
    { hint: 'Das Volk geht still um die Stadt. Tippe ein Tier an, bevor seine Lärmwolke groß wird.', calms: 8, maxClouds: 2, grow: 4, seed: 11 },
    { hint: 'Noch einmal, jetzt mit mehr Wolken und etwas schneller.', calms: 12, maxClouds: 3, grow: 3, seed: 23 }
  ]
}

/**
 * Etappe 2, "Unter dem Flachs verstecken": die Männer liegen in Mäntel gewickelt auf dem Dach (Draufsicht), Flachsbündel werden darüber gelegt, bis nichts mehr herausschaut (Bildauftrag JO11; eigener Hintergrund
 * `verstecken/dach.webp`, 3:4). Die Größen der Bündel sind in Prozent der Dachbreite (in beide Richtungen), die Männer in Prozent des Bildes. Runde 1 ein Mann, drei Bündel (zwei große, ein kleines), Runde 2 zwei
 * Männer, fünf Bündel (drei große, ein mittleres, ein kleines). Beide Runden sind lösbar (Test). Die Lage der Männer ist vorläufig geschätzt, bis die Datei `verstecken-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `verstecken/dach.webp` 900 × 1200, `mann-a.webp`, `mann-b.webp` je 360 × 150, `flachs-gross.webp` 360 × 130, `flachs-mittel.webp` 260 × 120,
 * `flachs-klein.webp` 180 × 110, `boten.webp` 220 × 160 (alle außer dem Dach transparent).
 */
const VERSTECKEN: HideGame = {
  background: `${G}verstecken/dach.webp`,
  messenger: `${G}verstecken/boten.webp`,
  men: [
    { id: 'mann-a', image: `${G}verstecken/mann-a.webp`, x: 10, y: 24, w: 30, h: 9.375 },
    { id: 'mann-b', image: `${G}verstecken/mann-b.webp`, x: 52, y: 60, w: 30, h: 9.375 }
  ],
  bundles: [
    { id: 'gross-1', image: `${G}verstecken/flachs-gross.webp`, w: 30, h: 10.8 },
    { id: 'gross-2', image: `${G}verstecken/flachs-gross.webp`, w: 30, h: 10.8 },
    { id: 'gross-3', image: `${G}verstecken/flachs-gross.webp`, w: 30, h: 10.8 },
    { id: 'mittel-1', image: `${G}verstecken/flachs-mittel.webp`, w: 21.7, h: 10 },
    { id: 'klein-1', image: `${G}verstecken/flachs-klein.webp`, w: 15, h: 9.2 }
  ],
  rounds: [
    { hint: 'Rahab versteckt den Mann unter dem Flachs. Lege die Bündel über ihn, bis nichts mehr herausschaut.', men: ['mann-a'], bundles: ['gross-1', 'gross-2', 'klein-1'] },
    { hint: 'Jetzt liegen zwei Männer auf dem Dach, und die Bündel reichen nur knapp. Tippe ein Bündel an, dann dreht es sich.', men: ['mann-a', 'mann-b'], bundles: ['gross-1', 'gross-2', 'gross-3', 'mittel-1', 'klein-1'] }
  ]
}

/**
 * Etappe 6, "Fladen backen": Teigkugeln werden auf heiße Steine gelegt, werden zum Fladen, sind eine Weile goldbraun (Antippen wendet sie) und werden dann zu dunkel (Bildauftrag JO15; eigener Hintergrund
 * `backen/feuerstelle.webp`). Runde 1 sechs Fladen auf drei Steinen (golden von 2,5 bis 6,0 Sekunden), Runde 2 neun Fladen auf fünf Steinen (2,2 bis 5,0). Die Steine und der Stapel (Prozent des Bildes)
 * sind vorläufig geschätzt, bis die Datei `backen-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `backen/feuerstelle.webp` 1200 × 900, `teig.webp` 120 × 120, `fladen-roh.webp`, `fladen-gold.webp`, `fladen-dunkel.webp` je 200 × 200,
 * `stapel.webp` 260 × 200 (alle außer der Feuerstelle transparent).
 */
const BACKEN: BakeGame = {
  background: `${G}backen/feuerstelle.webp`,
  dough: `${G}backen/teig.webp`,
  raw: `${G}backen/fladen-roh.webp`,
  golden: `${G}backen/fladen-gold.webp`,
  dark: `${G}backen/fladen-dunkel.webp`,
  stack: `${G}backen/stapel.webp`,
  stonesAt: [[26, 56], [46, 50], [66, 56], [36, 74], [56, 72]],
  stackAt: [86, 70],
  rounds: [
    { hint: 'Lege Teig auf die heißen Steine. Wenn der Fladen goldbraun ist, tippe ihn an und wende ihn.', dough: 6, stones: 3, goldenFrom: 2.5, goldenTo: 6 },
    { hint: 'Jetzt mehr Steine und mehr Fladen. Die Zeit ist etwas kürzer.', dough: 9, stones: 5, goldenFrom: 2.2, goldenTo: 5 }
  ]
}

/**
 * Etappe 1, "Proviant packen": Dinge verschiedener Formen werden in das Raster eines Korbs gepackt, ein Tippen dreht sie (Bildauftrag JO10; Hintergrund = das Etappenbild). Ein Feld ist 96 Pixel. Runde 1: fünf Dinge
 * in 4 × 3 Feldern (10 von 12), Runde 2: sieben Dinge in 5 × 3 (14 von 15); beide Runden sind lösbar (Test). Der Korb (`area`, Prozent des Etappenbildes) ist vorläufig geschätzt, bis die Datei
 * `packen-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `packen/korb.webp` 960 × 480, `sack.webp` 192 × 192, `krug.webp` 96 × 192, `brote.webp` 192 × 96, `datteln.webp` 96 × 96, `feigen.webp` 96 × 96,
 * `schlauch.webp` 96 × 192 (alle transparent).
 */
const PACKEN: PackGame = {
  background: `${PLACEHOLDER}etappe-bild-01.webp`,
  basket: `${G}packen/korb.webp`,
  items: [
    { id: 'sack', image: `${G}packen/sack.webp`, w: 2, h: 2 },
    { id: 'krug-1', image: `${G}packen/krug.webp`, w: 1, h: 2 },
    { id: 'krug-2', image: `${G}packen/krug.webp`, w: 1, h: 2 },
    { id: 'brote', image: `${G}packen/brote.webp`, w: 2, h: 1 },
    { id: 'datteln', image: `${G}packen/datteln.webp`, w: 1, h: 1 },
    { id: 'feigen', image: `${G}packen/feigen.webp`, w: 1, h: 1 },
    { id: 'schlauch', image: `${G}packen/schlauch.webp`, w: 1, h: 2 }
  ],
  area: { x: 26, y: 40, w: 48, h: 46 },
  rounds: [
    { hint: 'Packe den Vorrat in den Korb. Tippe ein Ding im Korb an, dann dreht es sich.', cols: 4, rows: 3, items: ['sack', 'krug-1', 'brote', 'datteln', 'feigen'] },
    { hint: 'Jetzt mehr Vorrat und fast keine Lücke. Überlege gut, wie alles hineinpasst.', cols: 5, rows: 3, items: ['sack', 'krug-1', 'krug-2', 'brote', 'schlauch', 'datteln', 'feigen'] }
  ]
}

/**
 * Etappe 3, "Am Seil herablassen": ein Mann hängt am Seil aus dem Fenster in der Stadtmauer und schwingt im Wind hin und her; ein Tippen, wenn er von der Mauer wegschwingt, lässt ihn einen Schritt tiefer
 * (Bildauftrag JO12; eigener Hintergrund `abseilen/mauer.webp`, die Mauer steht links). Runde 1: ein Mann, fünf Schritte, ruhiger Wind (3,4 s je Schwung, 12°, frei ab 2°); Runde 2: der zweite Mann, sechs Schritte,
 * stärkerer Wind (2,8 s, 14°, frei ab 4°). Fenster und Boden (Prozent des Bildes) sind vorläufig geschätzt, bis die Datei `abseilen-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `abseilen/mauer.webp` 900 × 1200, `mann-am-seil-a.webp`, `mann-am-seil-b.webp` je 160 × 560 (transparent, das Seil gehört zum Bild).
 */
const ABSEILEN: LowerGame = {
  background: `${G}abseilen/mauer.webp`,
  men: [
    { id: 'a', image: `${G}abseilen/mann-am-seil-a.webp`, w: 16 },
    { id: 'b', image: `${G}abseilen/mann-am-seil-b.webp`, w: 16 }
  ],
  window: [38, 14],
  ground: 92,
  rounds: [
    { hint: 'Tippe, wenn der Mann von der Mauer wegschwingt. Dann sinkt er einen Schritt.', man: 'a', steps: 5, period: 3.4, amplitude: 12, threshold: 2 },
    { hint: 'Der zweite Mann kommt. Der Wind ist stärker, die freie Zeit kürzer.', man: 'b', steps: 6, period: 2.8, amplitude: 14, threshold: 4 }
  ]
}

/**
 * Etappe 4, "Im Gleichschritt": die Priester tragen die Lade durch das trockene Flussbett, das Kind tippt im Takt der Schritte (Bildauftrag JO13; eigener Hintergrund `schritt/flussbett.webp`).
 * Runde 1 acht Schritte bei 70 Schlägen je Minute (Toleranz 0,30 s), Runde 2 zwölf Schritte bei 90 (0,25 s). Der Kiesweg `path` (Prozent des Bildes, von unten nach oben) ist vorläufig
 * geschätzt, bis die Datei `schritt-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin steht ein Platzhalter): `schritt/flussbett.webp` 1200 × 900, `lade-getragen.webp` 480 × 320, `fussspur.webp` 80 × 120 (die letzten beiden transparent).
 */
const SCHRITT: StepGame = {
  background: `${G}schritt/flussbett.webp`,
  bearers: `${G}schritt/lade-getragen.webp`,
  print: `${G}schritt/fussspur.webp`,
  path: [[50, 92], [48, 80], [52, 68], [48, 56], [51, 44], [50, 32]],
  rounds: [
    { hint: 'Tippe im Takt der Schritte, wenn der Fuß aufsetzt.', bpm: 70, steps: 8, tolerance: 0.3 },
    { hint: 'Noch einmal, jetzt etwas schneller.', bpm: 90, steps: 12, tolerance: 0.25 }
  ]
}

/** Etappe 10, "Lückenvers": zwei Sätze aus dem Text der Etappe; die Wörter sind kurze Blätter (das richtige zuerst, `answers` zeigt auf sie). Tafel und Blatt sind die aus Adam und Eva, kopiert. Hintergrund ist das Etappenbild 10. */
const VERS: VerseGame = {
  background: `${PLACEHOLDER}etappe-bild-11.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Runde 1: Ziehe das passende Blatt in die Lücke.', parts: ['Ich aber und mein Haus, wir wollen Gott ', '.'], words: ['dienen', 'vergessen', 'verlassen'], answers: [0] },
    { hint: 'Runde 2: Jetzt fehlen zwei Wörter.', parts: ['Dieser Stein soll ', ' sein, denn er hat alle ', ' gehört, die Gott zu uns gesprochen hat.'], words: ['Zeuge', 'Worte', 'Zeichen', 'Steine'], answers: [0, 1] }
  ]
}

/** Etappe 5, "Erinnerungs-Memory": sechs Paare aus den Etappen 1 bis 5; zu jedem Treffer ein Satz aus dem Text. Bilder (noch nicht gemalt, bis dahin stehen Platzhalter): `memory/karte-*.webp` und `rueck.webp`, je 256 × 256. */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-buch.webp`, text: 'Die Schriftrolle: Gott spricht zu Josua: „Sei mutig und stark! Ich bin mit dir.“' },
    { image: `${G}memory/karte-flachs.webp`, text: 'Das Flachsbündel: Darunter hat Rahab die Männer versteckt.' },
    { image: `${G}memory/karte-schnur.webp`, text: 'Die rote Schnur am Fenster: Wer im Haus bleibt, dem geschieht nichts.' },
    { image: `${G}memory/karte-seil.webp`, text: 'Das Seil: An ihm lässt Rahab die Männer aus dem Fenster hinab.' },
    { image: `${G}memory/karte-lade.webp`, text: 'Die Lade des Bundes: Die Priester tragen sie voran in den Jordan.' },
    { image: `${G}memory/karte-stein.webp`, text: 'Der Stein: Zwölf Steine erinnern an den Weg durch den Jordan.' }
  ]
}

export const josua: Journey = {
  id: 'josua',
  title: 'Josua',
  subtitle: 'Mut für das neue Land',
  age: '8-10',
  downloadMb: 16, // PLATZHALTER: Größe mit den Bildern von Josef; wird mit den eigenen Bildern neu gemessen (der Test sagt die echte Größe)
  medal: josef.medal, // PLATZHALTER bis "Die Posaune von Jericho" (Widderhorn vor der Stadtmauer)
  // Geschenk-Ausmalbild: Die Posaunen von Jericho (sieben Priester mit Widderhörnern vor der ganzen Stadtmauer); PLATZHALTER bis zum eigenen Bild
  gift: { title: 'Die Posaunen von Jericho', image: josef.gift.image },
  // PLATZHALTER: die Karte von Josef (vier Stücke, 9824 × 1632 px) mit den ersten zehn Stationen und dem Perlenweg dorthin; Station 11 von Josef ist das Ziel (Prüfung)
  map: {
    images: josef.map.images,
    ring: josef.map.ring,
    aspect: josef.map.aspect,
    widthPx: josef.map.widthPx,
    stages: josef.map.stages.slice(0, 10),
    exam: josef.map.stages[10]!,
    path: JOSUA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PLACEHOLDER}etappe-bild-01.webp`,
      title: 'Ein neuer Anführer',
      ref: 'Josua 1,1–11',
      text: [
        'Mose, der Diener Gottes, ist gestorben. Das Volk Israel steht am Fluss Jordan, und auf der anderen Seite liegt das Land, das Gott ihm versprochen hat.',
        'Da spricht Gott zu Josua, dem neuen Anführer: „Mein Diener Mose ist gestorben. Nun führe du das Volk in das Land, das ich ihm gebe.“',
        'Und Gott verspricht: „Ich bin mit dir, wie ich mit Mose war. Sei mutig und stark! Fürchte dich nicht, denn ich verlasse dich nie.“',
        'Josua ruft die Hauptleute: „Geht durch das Lager und sagt dem Volk: Macht Vorrat bereit! In drei Tagen ziehen wir über den Jordan.“'
      ],
      // Spiel: Proviant packen (packen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'packen', hint: 'Packe den Vorrat so in den Korb, dass alles hineinpasst.', pack: PACKEN },
      questions: [
        { q: 'Was sagt Gott zu Josua?', options: ['„Ich bin mit dir.“', '„Geh allein.“', '„Kehre um.“'], answer: 0 },
        { q: 'Wer führt das Volk nach Moses Tod?', options: ['Josua', 'Aaron', 'Barak'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PLACEHOLDER}etappe-bild-02.webp`,
      title: 'Zwei Kundschafter',
      ref: 'Josua 2,1–7',
      text: [
        'Von Schittim aus schickt Josua heimlich zwei Männer los. Niemand soll es merken. Sie sollen sich die Stadt Jericho ansehen, die hinter einer hohen Mauer liegt.',
        'Die Kundschafter kommen in das Haus einer Frau namens Rahab. Es steht in der Stadtmauer.',
        'Aber der König von Jericho hört davon. Er schickt Boten zu Rahab: „Gib die Männer heraus!“',
        'Rahab hat die beiden längst auf dem Dach versteckt, unter Stängeln von Flachs. Sie sagt den Boten, die Männer seien schon fortgegangen. Da laufen die Boten los, und hinter ihnen schließt sich das Stadttor.'
      ],
      // Spiel: Unter dem Flachs verstecken (verstecken, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'verstecken', hint: 'Decke die Männer mit Flachsbündeln zu.', hide: VERSTECKEN },
      questions: [
        { q: 'Wohin schickt Josua zwei Männer?', options: ['nach Jericho', 'nach Ägypten', 'zum Berg Sinai'], answer: 0 },
        { q: 'Wer lässt die Männer suchen?', options: ['der König von Jericho', 'Rahab', 'Josua'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PLACEHOLDER}etappe-bild-03.webp`,
      title: 'Die rote Schnur',
      ref: 'Josua 2,8–24',
      text: [
        'Am Abend steigt Rahab zu den Männern auf das Dach. „Euer Gott ist Gott oben im Himmel und unten auf der Erde“, sagt sie. „Ich weiß, dass er euch dieses Land gibt. Bitte verschont auch meine Familie!“',
        'Die Männer versprechen es. Rahab lässt sie an einem Seil aus dem Fenster hinab, denn ihr Haus steht in der Stadtmauer. „Versteckt euch drei Tage im Gebirge“, rät sie.',
        '„Binde eine rote Schnur in dein Fenster“, sagen die Männer, „und hole deine Familie in dein Haus. Wer drinnen bleibt, dem geschieht nichts.“',
        'Rahab bindet die rote Schnur ins Fenster. Die Männer verstecken sich im Gebirge und gehen dann zurück zu Josua.'
      ],
      // Spiel: Am Seil herablassen (abseilen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'abseilen', hint: 'Lass den Mann am Seil hinab, wenn er von der Mauer wegschwingt.', lower: ABSEILEN },
      questions: [
        { q: 'Was sagt Rahab über Gott?', options: ['Er ist Gott im Himmel und auf der Erde.', 'Er wohnt nur in Jericho.', 'Er ist weit weg.'], answer: 0 },
        { q: 'Was bindet Rahab ins Fenster?', options: ['eine rote Schnur', 'ein weißes Tuch', 'eine Laterne'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PLACEHOLDER}etappe-bild-04.webp`,
      title: 'Der Jordan',
      ref: 'Josua 3,1–17',
      text: [
        'Nun steht das Volk am Jordan. Es ist Erntezeit, und der Fluss ist so voll, dass er über die Ufer tritt.',
        '„Seht auf die goldene Truhe, die Lade des Bundes“, sagt Josua. „Priester tragen sie vor euch her. Daran merkt ihr, dass ein lebendiger Gott unter euch ist.“',
        'Die Priester gehen mit der Lade voran. Sobald ihre Füße das Wasser berühren, hört der Fluss auf zu fließen. Das Wasser bleibt oben stehen, und unten wird das Flussbett trocken.',
        'Die Priester bleiben mitten im Jordan stehen, und das ganze Volk geht trocken hindurch, bis alle drüben sind.'
      ],
      // Spiel: Im Gleichschritt (schritt, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'schritt', hint: 'Tippe im Takt der Schritte.', step: SCHRITT },
      questions: [
        { q: 'Wer trägt die goldene Truhe voran?', options: ['die Priester', 'die Kundschafter', 'die Kinder'], answer: 0 },
        { q: 'Was geschieht, als die Füße der Priester ins Wasser kommen?', options: ['Das Wasser bleibt stehen.', 'Das Wasser steigt.', 'Der Fluss wird breiter.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PLACEHOLDER}etappe-bild-05.webp`,
      title: 'Zwölf Steine',
      ref: 'Josua 4,1–24',
      text: [
        'Als alle drüben sind, sagt Gott zu Josua: „Wähle zwölf Männer aus, aus jedem Stamm einen. Jeder soll einen Stein aus dem Flussbett holen.“',
        'Die zwölf Männer steigen in den Jordan und heben jeder einen Stein auf die Schulter. Sie tragen die Steine bis nach Gilgal, wo das Volk sein Lager aufschlägt.',
        'Dort stellt Josua die zwölf Steine auf. „Wenn eure Kinder euch einmal fragen: Was sollen diese Steine?, dann erzählt es ihnen“, sagt er.',
        '„Gott hat das Wasser des Jordan stillstehen lassen, bis wir hindurch waren. Diese Steine sollen uns immer daran erinnern.“'
      ],
      // Spiel: Erinnerungs-Memory (memory, alt); das Etappenbild ist noch das von Josef
      task: { kind: 'memory', hint: 'Finde die gleichen Karten. Merke dir, wo welche liegt.', memory: MEMORY },
      questions: [
        { q: 'Was tragen die zwölf Männer aus dem Fluss?', options: ['Steine', 'Krüge', 'Zweige'], answer: 0 },
        { q: 'Woran sollen die Steine erinnern?', options: ['dass Gott den Jordan stillstehen ließ', 'dass es Erntezeit ist', 'dass Jericho eine Mauer hat'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PLACEHOLDER}etappe-bild-06.webp`,
      title: 'Brot aus dem neuen Land',
      ref: 'Josua 5,1.10–12',
      text: [
        'Die Könige im Land hören, dass Gott den Jordan für Israel trocken gelegt hat, und sie verlieren den Mut. Das Volk aber feiert im Lager bei Gilgal am Abend das Passahfest. Es erinnert daran, wie Gott sein Volk aus Ägypten geführt hat.',
        'Am nächsten Tag essen die Menschen zum ersten Mal vom Getreide des Landes. Sie backen ungesäuertes Brot und rösten Körner.',
        'Und am nächsten Morgen kommt kein Manna mehr. Lange Zeit hat Gott sein Volk in der Wüste mit Manna satt gemacht.',
        'Jetzt wächst das Getreide im eigenen Land. Das Volk ist angekommen.'
      ],
      // Spiel: Fladen backen (backen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'backen', hint: 'Backe Fladen und wende sie, wenn sie goldbraun sind.', bake: BACKEN },
      questions: [
        { q: 'Wo feiert das Volk das Passahfest?', options: ['in Gilgal', 'in Jericho', 'in Ägypten'], answer: 0 },
        { q: 'Was hört am Morgen auf?', options: ['das Manna', 'der Regen', 'das Singen'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PLACEHOLDER}etappe-bild-07.webp`,
      title: 'Heiliger Boden',
      ref: 'Josua 5,13 bis 6,5',
      text: [
        'Josua ist allein draußen vor der Stadt Jericho. Da steht plötzlich ein Mann vor ihm. „Gehörst du zu uns oder zu unseren Feinden?“, fragt Josua.',
        '„Weder noch“, antwortet der Mann. „Ich bin der Fürst über das Heer Gottes.“ Da wirft sich Josua mit dem Gesicht zur Erde nieder und fragt: „Was befiehlt mir mein Herr?“',
        'Der Fürst sagt: „Zieh deine Schuhe aus, denn der Ort, auf dem du stehst, ist heilig.“ Und Josua zieht seine Schuhe aus.',
        'Dann sagt Gott Josua seinen Plan für Jericho. Sechs Tage lang soll das Volk einmal um die Stadt gehen, am siebten Tag siebenmal, und sieben Priester sollen dabei Posaunen blasen.'
      ],
      // nur Quiz (ernst bzw. ruhig, nichts wird gespielt); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ruhig und ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was soll Josua tun, weil der Ort heilig ist?', options: ['seine Schuhe ausziehen', 'sich verstecken', 'ein Feuer anzünden'], answer: 0 },
        { q: 'Was soll das Volk sechs Tage lang tun?', options: ['einmal am Tag um die Stadt gehen', 'die Stadt belagern', 'im Lager bleiben'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PLACEHOLDER}etappe-bild-08.webp`,
      title: 'Rund um die Stadt',
      ref: 'Josua 6,6–14',
      text: [
        'Am nächsten Morgen ordnet Josua den Zug. Die hohen Mauern von Jericho ragen vor ihnen auf. Sieben Priester gehen mit Posaunen voran, dahinter tragen andere die goldene Truhe, und das Volk folgt.',
        '„Ihr sollt keinen Laut machen“, sagt Josua. „Erst wenn ich sage: Ruft!, dürft ihr rufen.“',
        'Nur die Posaunen schallen, und man hört die Schritte der vielen Menschen. Sie gehen schweigend einmal rund um die Stadt, dann kehren sie ins Lager zurück.',
        'So geht es sechs Tage lang. Jeden Morgen derselbe Weg, jeden Abend zurück ins Lager. Jericho bleibt verschlossen.'
      ],
      // Spiel: Ruhe bewahren (still, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'still', hint: 'Beruhige die Tiere, bevor es laut wird.', hush: STILL },
      questions: [
        { q: 'Wie viele Priester gehen mit Posaunen voran?', options: ['sieben', 'zwölf', 'drei'], answer: 0 },
        { q: 'Wann dürfen die Menschen rufen?', options: ['wenn Josua „Ruft!“ sagt', 'sobald sie die Mauer sehen', 'am ersten Abend'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PLACEHOLDER}etappe-bild-09.webp`,
      title: 'Die Mauer fällt',
      ref: 'Josua 6,15–25',
      text: [
        'Am siebten Tag stehen alle früh auf. Siebenmal gehen sie um die Stadt, Priester, goldene Truhe und Volk.',
        'Beim siebten Mal ruft Josua: „Ruft! Gott hat euch die Stadt gegeben!“ Die Posaunen schallen, und das Volk ruft laut.',
        'Da stürzt die Mauer ein. Die Stadt Jericho ist gefallen.',
        'Josua erinnert die Kundschafter an ihr Versprechen: „Führt Rahab und ihre Familie aus dem Haus mit der roten Schnur, wie ihr es geschworen habt.“ So bleiben Rahab und alle, die zu ihr gehören, am Leben. Sie wohnt von nun an mitten unter dem Volk Israel.'
      ],
      // nur Quiz (ernst bzw. ruhig, nichts wird gespielt); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was geschieht mit der Mauer von Jericho?', options: ['Sie stürzt ein.', 'Sie wird bemalt.', 'Sie wächst weiter.'], answer: 0 },
        { q: 'Wer bleibt mit ihrer Familie am Leben?', options: ['Rahab', 'Barak', 'Debora'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PLACEHOLDER}etappe-bild-11.webp`,
      title: 'Der Stein unter der Eiche',
      ref: 'Josua 24,1.14–29',
      text: [
        'Viele Jahre später ist Josua alt geworden. Er ruft das ganze Volk nach Sichem zusammen.',
        '„Erwählt euch heute, wem ihr dienen wollt“, sagt Josua. „Ich aber und mein Haus, wir wollen Gott dienen.“',
        'Das Volk antwortet: „Wir wollen auch Gott dienen, denn er hat uns aus Ägypten geführt und uns bis hierher begleitet.“',
        'Da nimmt Josua einen großen Stein und stellt ihn unter der Eiche auf. „Dieser Stein soll Zeuge sein, denn er hat alle Worte gehört, die Gott zu uns gesprochen hat.“ Dann schickt er das Volk heim. Danach stirbt Josua, hundertzehn Jahre alt. In Sichem begraben die Israeliten auch die Gebeine Josefs, die sie damals aus Ägypten mitgebracht haben.'
      ],
      // Spiel: Lückenvers (lueckenvers, alt); das Etappenbild ist noch das von Josef
      task: { kind: 'lueckenvers', hint: 'Setze die fehlenden Wörter in den Satz.', verse: VERS },
      questions: [
        { q: 'Was sagt Josua über sich und sein Haus?', options: ['Sie wollen Gott dienen.', 'Sie wollen fortziehen.', 'Sie wollen Könige werden.'], answer: 0 },
        { q: 'Was stellt Josua unter der Eiche auf?', options: ['einen großen Stein', 'ein Zelt', 'einen Altar mit Feuer'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was sagt Gott zu Josua am Anfang?', options: ['„Ich bin mit dir.“', '„Geh allein.“', '„Kehre um.“'], answer: 0 },
    { q: 'Was bindet Rahab ins Fenster?', options: ['eine rote Schnur', 'ein weißes Tuch', 'eine Laterne'], answer: 0 },
    { q: 'Was geschieht, als die Füße der Priester ins Wasser kommen?', options: ['Das Wasser bleibt stehen.', 'Das Wasser steigt.', 'Der Fluss wird breiter.'], answer: 0 },
    { q: 'Was tragen die zwölf Männer aus dem Fluss?', options: ['Steine', 'Krüge', 'Zweige'], answer: 0 },
    { q: 'Was soll Josua tun, weil der Ort heilig ist?', options: ['seine Schuhe ausziehen', 'sich verstecken', 'ein Feuer anzünden'], answer: 0 },
    { q: 'Was sagt Josua über sich und sein Haus?', options: ['Sie wollen Gott dienen.', 'Sie wollen fortziehen.', 'Sie wollen Könige werden.'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(josua, josuaEn)
