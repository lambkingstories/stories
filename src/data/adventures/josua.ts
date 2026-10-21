/**
 * Abenteuer "Josua" (Josua 1–6 und 24) für 8 bis 10 Jahre: 10 Etappen, Untertitel "Mut für das neue Land". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Josua/ENTWURF_Josua.md (Phase 1, 20.10.2026), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Plan v3 vom 21.10.2026, höchstens zwei Runden je Spiel, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Unter dem Flachs verstecken (neu), 3 Am Seil herablassen (neu),
 * 4 Durch den Jordan (neu, ersetzt "Im Gleichschritt"), 5 Memory (alt), 6 Fladen backen (neu), 7 nur Quiz, 8 Ruhe bewahren (neu), 9 nur Quiz, 10 Lückenvers (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/josua/, images/abenteuer/spiele/josua/<spiel>/, audio/abenteuer/josua/.
 *
 * STAND 21.10.2026 (Plan v3): alle Spiele sind gebaut (die Bilder der Spiele fehlen noch, bis dahin stehen Platzhalter, siehe `NOT_PAINTED_YET` in `utils/journeyFiles.ts`); die Etappen 7 und 9 bleiben Quiz. Die Etappenbilder sind noch die von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit den ersten zehn Stationen (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Deutsche Vorlese-Aufnahmen: geschichte-NN-v3.mp3 (Gemini, Stimme Achernar, 21.10.2026, nicht gehört); Englisch noch nicht, die englische App liest mit der Gerätestimme. Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { BakeGame, CrossGame, HideGame, HushGame, Journey, LowerGame, MemoryGame, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { JOSUA_PATH } from './josuaPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { josuaEn } from './en/josua.en'

// Etappenbilder (vorläufig Variante a der neuen Bilder; Anton wählt später a/b): `images/abenteuer/josua/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/josua/'
const G = 'images/abenteuer/spiele/josua/'

/**
 * Etappe 8, "Ruhe bewahren": am Wegrand sitzen vier Tiere, über denen kleine Lärmwolken wachsen; ein Tippen beruhigt das Tier, bevor die Wolke laut ist (Bildauftrag JO35; Hintergrund = das Etappenbild 8, von der App
 * weichgezeichnet). Plan v3: vier feste Plätze (Fußpunkt und Breite in Bildschirm-Prozent am unteren Rand) mit Kamel (Ersatz für den Esel: der Generator hat den Esel abgelehnt), Gans, Ziege, Lamm. Runde 1 fünf Beruhigungen, höchstens zwei Wolken zugleich, 4 Sekunden bis laut;
 * Runde 2 acht, höchstens zwei Wolken, 3 Sekunden. Es gibt nur ein Wolkenbild, die App zeigt es in drei Größen. Die Reihenfolge der Wolken ist aus dem Startwert `seed` immer dieselbe.
 * Bilder (gemalt, 21.10.2026): `still/kamel.webp`, `gans.webp`, `ziege.webp`, `lamm.webp` je 220 × 220, `wolke.webp` 120 × 100 (alle transparent).
 */
const STILL: HushGame = {
  background: `${PICS}etappe-bild-08.webp`,
  clouds: [`${G}still/wolke.webp`, `${G}still/wolke.webp`, `${G}still/wolke.webp`],
  spots: [
    { id: 'platz-1', animal: 'kamel', image: `${G}still/kamel.webp`, x: 15, y: 90, w: 14 },
    { id: 'platz-2', animal: 'gans', image: `${G}still/gans.webp`, x: 38, y: 90, w: 14 },
    { id: 'platz-3', animal: 'ziege', image: `${G}still/ziege.webp`, x: 62, y: 90, w: 14 },
    { id: 'platz-4', animal: 'lamm', image: `${G}still/lamm.webp`, x: 85, y: 90, w: 14 }
  ],
  rounds: [
    { hint: 'Das Volk geht still um die Stadt. Tippe ein Tier an, bevor seine Lärmwolke groß wird.', calms: 5, maxClouds: 2, grow: 4, seed: 11 },
    { hint: 'Noch einmal, mit mehr Tieren.', calms: 8, maxClouds: 2, grow: 3, seed: 23 }
  ]
}

/**
 * Etappe 2, "Unter dem Flachs verstecken": die Männer liegen in Mäntel gewickelt auf dem Dach (Draufsicht), Flachsbündel werden darüber gelegt, bis nichts mehr herausschaut (Bildauftrag JO30; eigener Hintergrund
 * `verstecken/dach.webp`, 3:4). Die Größen der Bündel sind in Prozent der Dachbreite (in beide Richtungen), die Männer in Prozent des Bildes. Plan v3: es gibt nur ein Flachsbild (`flachs.webp`), die App zeigt es in
 * drei Größen (groß 30 %, mittel 21,7 %, klein 15 %). Runde 1 ein Mann, drei Bündel (zwei große, ein kleines), Runde 2 zwei Männer, fünf Bündel (drei große, ein mittleres, ein kleines). Beide Runden sind lösbar (Test).
 * Die Lage der Männer ist am gemalten Dach angesehen (die Männer liegen frei auf der leeren Fläche, es gibt keine Messdatei).
 * Bilder (gemalt, 21.10.2026): `verstecken/dach.webp` 900 × 1200, `mann-a.webp`, `mann-b.webp` je 360 × 150, `flachs.webp` 360 × 130, `boten.webp` 220 × 160 (alle außer dem Dach transparent).
 */
const VERSTECKEN: HideGame = {
  background: `${G}verstecken/dach.webp`,
  messenger: `${G}verstecken/boten.webp`,
  men: [
    { id: 'mann-a', image: `${G}verstecken/mann-a.webp`, x: 10, y: 24, w: 30, h: 9.375 },
    { id: 'mann-b', image: `${G}verstecken/mann-b.webp`, x: 52, y: 60, w: 30, h: 9.375 }
  ],
  bundles: [
    { id: 'gross-1', image: `${G}verstecken/flachs.webp`, w: 30, h: 10.8 },
    { id: 'gross-2', image: `${G}verstecken/flachs.webp`, w: 30, h: 10.8 },
    { id: 'gross-3', image: `${G}verstecken/flachs.webp`, w: 30, h: 10.8 },
    { id: 'mittel-1', image: `${G}verstecken/flachs.webp`, w: 21.7, h: 10 },
    { id: 'klein-1', image: `${G}verstecken/flachs.webp`, w: 15, h: 9.2 }
  ],
  rounds: [
    { hint: 'Rahab versteckt den Mann unter dem Flachs. Lege die Bündel über ihn.', men: ['mann-a'], bundles: ['gross-1', 'gross-2', 'klein-1'] },
    { hint: 'Jetzt liegen zwei Männer auf dem Dach. Tippe ein Bündel an, dann dreht es sich.', men: ['mann-a', 'mann-b'], bundles: ['gross-1', 'gross-2', 'gross-3', 'mittel-1', 'klein-1'] }
  ]
}

/**
 * Etappe 6, "Fladen backen": Teigkugeln werden auf heiße Steine gelegt, werden zum Fladen, sind eine Weile goldbraun (Antippen wendet sie) und werden dann zu dunkel (Bildauftrag JO34; eigener Hintergrund
 * `backen/feuerstelle.webp`). Plan v3: Runde 1 vier Fladen auf drei Steinen (golden von 2,5 bis 6,0 Sekunden), Runde 2 sechs Fladen auf vier Steinen (2,2 bis 5,0). Die Kugel in der Schale ist der rohe Fladen
 * (`dough` fehlt), die gewendeten zählt die App an einer festen Stelle (kein Stapelbild). Die vier Steine (Prozent des Bildes) sind am gemalten Bild abgelesen (`backen-messung.json`, Variante a: hinten links, hinten rechts, vorne links, vorne rechts).
 * Bilder (gemalt, 21.10.2026): `backen/feuerstelle.webp` 1200 × 900, `fladen-roh.webp`, `fladen-gold.webp`, `fladen-dunkel.webp` je 200 × 200 (die drei transparent).
 */
const BACKEN: BakeGame = {
  background: `${G}backen/feuerstelle.webp`,
  raw: `${G}backen/fladen-roh.webp`,
  golden: `${G}backen/fladen-gold.webp`,
  dark: `${G}backen/fladen-dunkel.webp`,
  stonesAt: [[37.9, 46.8], [63.1, 47], [35.8, 60], [65.4, 60.3]],
  rounds: [
    { hint: 'Lege Teig auf die heißen Steine. Wende den Fladen, wenn er goldbraun ist.', dough: 4, stones: 3, goldenFrom: 2.5, goldenTo: 6 },
    { hint: 'Jetzt mehr Steine und mehr Fladen.', dough: 6, stones: 4, goldenFrom: 2.2, goldenTo: 5 }
  ]
}

/**
 * Etappe 3, "Am Seil herablassen": ein Mann hängt am Seil aus dem Fenster in der Stadtmauer und schwingt im Wind hin und her; ein Tippen, wenn er von der Mauer wegschwingt, lässt ihn einen Schritt tiefer
 * (Bildauftrag JO31; eigener Hintergrund `abseilen/mauer.webp`, die Mauer steht links). Plan v3: Runde 1 ein Mann, vier Schritte, ruhiger Wind (3,4 s je Schwung, 12°, frei ab 2°); Runde 2 der zweite Mann, fünf Schritte,
 * stärkerer Wind (2,8 s, 14°, frei ab 4°). Fenster und Boden (Prozent des Bildes) sind am gemalten Bild abgelesen (`abseilen-messung.json`).
 * Bilder (gemalt, 21.10.2026): `abseilen/mauer.webp` 900 × 1200, `mann-am-seil-a.webp`, `mann-am-seil-b.webp` je 160 × 560 (transparent, das Seil gehört zum Bild).
 */
const ABSEILEN: LowerGame = {
  background: `${G}abseilen/mauer.webp`,
  men: [
    { id: 'a', image: `${G}abseilen/mann-am-seil-a.webp`, w: 16 },
    { id: 'b', image: `${G}abseilen/mann-am-seil-b.webp`, w: 16 }
  ],
  window: [20.2, 13.5],
  ground: 91,
  rounds: [
    { hint: 'Tippe, wenn der Mann von der Mauer wegschwingt. Dann sinkt er einen Schritt.', man: 'a', steps: 4, period: 3.4, amplitude: 12, threshold: 2 },
    { hint: 'Der zweite Mann kommt, der Wind ist stärker.', man: 'b', steps: 5, period: 2.8, amplitude: 14, threshold: 4 }
  ]
}

/** Etappe 10, "Lückenvers": zwei Sätze aus dem Text der Etappe; die Wörter sind kurze Blätter (das richtige zuerst, `answers` zeigt auf sie). Tafel und Blatt sind die aus Adam und Eva, kopiert. Hintergrund ist das Etappenbild 10, von der App weichgezeichnet (`soft`). */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-10.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Ich aber und mein Haus, wir wollen Gott ', '.'], words: ['dienen', 'vergessen', 'verlassen'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Dieser Stein soll ', ' sein, denn er hat alle ', ' gehört, die Gott zu uns gesprochen hat.'], words: ['Zeuge', 'Worte', 'Zeichen', 'Steine'], answers: [0, 1] }
  ]
}

/** Etappe 5, "Erinnerungs-Memory": fünf Paare aus den Etappen 1 bis 5 (das Seil entfällt); zu jedem Treffer ein Satz aus dem Text. Bilder (gemalt, 21.10.2026): `memory/karte-*.webp` und `rueck.webp`, je 256 × 256 (Bildauftrag JO33). */
const MEMORY: MemoryGame = {
  back: `${G}memory/rueck.webp`,
  pairs: [
    { image: `${G}memory/karte-buch.webp`, text: 'Die Schriftrolle: Gott spricht zu Josua: „Sei mutig und stark! Ich bin mit dir.“' },
    { image: `${G}memory/karte-flachs.webp`, text: 'Das Flachsbündel: Darunter hat Rahab die Männer versteckt.' },
    { image: `${G}memory/karte-schnur.webp`, text: 'Die rote Schnur am Fenster: Wer im Haus bleibt, dem geschieht nichts.' },
    { image: `${G}memory/karte-lade.webp`, text: 'Die Lade des Bundes: Die Priester tragen sie voran in den Jordan.' },
    { image: `${G}memory/karte-stein.webp`, text: 'Der Stein: Zwölf Steine erinnern an den Weg durch den Jordan.' }
  ]
}

/**
 * Etappe 4, "Durch den Jordan": die goldene Truhe mit den Priestern steht am linken Ufer, das Kind zieht sie in die Flussmitte (Runde 1), je weiter sie kommt, desto trockener wird das Flussbett; danach schickt
 * jedes Antippen eine von drei Gruppen des Volkes über das trockene Bett ans andere Ufer (Runde 2). Kein Fehler, kein Zeitdruck (Bildauftrag JO32; eigene Szene `jordan/fluss.webp`). Alle Orte sind Prozent des Bildes
 * und am gemalten Bild abgelesen und mit den Sprites zusammen angesehen (`jordan-messung-b.json`, Landung leicht nach rechts verschoben, damit alle drei Gruppen auf dem Gras landen): Truhe `start` und `middle`, die wartenden Gruppen `groups`, die Landung `farBank`.
 * Bilder (gemalt, 21.10.2026): `jordan/fluss.webp` 1200 × 900, `lade.webp` 360 × 300, `volk.webp` 360 × 280 (die zwei transparent).
 */
const JORDAN: CrossGame = {
  background: `${G}jordan/fluss.webp`,
  chest: `${G}jordan/lade.webp`,
  group: `${G}jordan/volk.webp`,
  start: [18, 46],
  middle: [54, 46],
  groups: [[13, 38], [13, 48], [13, 58]],
  farBank: [94, 42],
  rounds: [{ hint: 'Ziehe die goldene Truhe ins Wasser.' }, { hint: 'Jetzt geht das Volk hinüber. Tippe die Gruppen an.' }]
}

export const josua: Journey = {
  id: 'josua',
  title: 'Josua',
  subtitle: 'Mut für das neue Land',
  age: '8-10',
  downloadMb: 11, // etwa 10 bis 11 MB gerechnet am 21.10.2026 mit der neuen Karte v3 (vier Stücke zusammen 5,5 MB, ohne die noch fehlenden Bilder und Aufnahmen)
  medal: 'images/abenteuer/josua/medaille-v2.webp', // Die Posaune von Jericho (Widderhorn vor der Stadtmauer, Goldring)
  // Geschenk-Ausmalbild: Die Posaunen von Jericho (sieben Priester mit Widderhörnern auf dem Weg zur Stadtmauer, Konturzeichnung)
  gift: { title: 'Die Posaunen von Jericho', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, Codex-Panorama v3 mit zehn Orten und dem Ziel) mit Stationen und Perlenweg aus josuaPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/josua/karte-pano-v3-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0262, y: 0.2609, d: 0.0339 },
      { x: 0.1574, y: 0.4612, d: 0.0339 },
      { x: 0.2372, y: 0.534, d: 0.0339 },
      { x: 0.3633, y: 0.267, d: 0.0339 },
      { x: 0.4138, y: 0.5461, d: 0.0339 },
      { x: 0.5117, y: 0.6007, d: 0.0339 },
      { x: 0.5786, y: 0.3944, d: 0.0339 },
      { x: 0.7216, y: 0.5825, d: 0.0339 },
      { x: 0.8276, y: 0.534, d: 0.0339 },
      { x: 0.9144, y: 0.625, d: 0.0339 }
    ],
    exam: { x: 0.983, y: 0.3762, d: 0.0339 },
    path: JOSUA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      title: 'Ein neuer Anführer',
      ref: 'Josua 1,1–11',
      text: [
        'Mose, der Diener Gottes, ist gestorben. Das Volk Israel steht am Fluss Jordan, und auf der anderen Seite liegt das Land, das Gott ihm versprochen hat.',
        'Da spricht Gott zu Josua, dem neuen Anführer: „Mein Diener Mose ist gestorben. Nun führe du das Volk in das Land, das ich ihm gebe.“',
        'Und Gott verspricht: „Ich bin mit dir, wie ich mit Mose war. Sei mutig und stark! Fürchte dich nicht, denn ich verlasse dich nie.“',
        'Josua ruft die Hauptleute: „Geht durch das Lager und sagt dem Volk: Macht Vorrat bereit! In drei Tagen ziehen wir über den Jordan.“'
      ],
      // Spiel: Proviant packen (packen, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'quiz', hint: 'Diese Etappe ist ruhig. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt Gott zu Josua?', options: ['„Ich bin mit dir.“', '„Geh allein.“', '„Kehre um.“'], answer: 0 },
        { q: 'Wer führt das Volk nach Moses Tod?', options: ['Josua', 'Aaron', 'Barak'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
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
      image: `${PICS}etappe-bild-03.webp`,
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
      image: `${PICS}etappe-bild-04.webp`,
      title: 'Der Jordan',
      ref: 'Josua 3,1–17',
      text: [
        'Nun steht das Volk am Jordan. Es ist Erntezeit, und der Fluss ist so voll, dass er über die Ufer tritt.',
        '„Seht auf die goldene Truhe, die Lade des Bundes“, sagt Josua. „Priester tragen sie vor euch her. Daran merkt ihr, dass ein lebendiger Gott unter euch ist.“',
        'Die Priester gehen mit der Lade voran. Sobald ihre Füße das Wasser berühren, hört der Fluss auf zu fließen. Das Wasser bleibt oben stehen, und unten wird das Flussbett trocken.',
        'Die Priester bleiben mitten im Jordan stehen, und das ganze Volk geht trocken hindurch, bis alle drüben sind.'
      ],
      // Spiel: Im Gleichschritt (schritt, neu); das Etappenbild ist noch das von Josef
      task: { kind: 'jordan', hint: 'Bringe die Lade und das Volk durch den Jordan.', cross: JORDAN },
      questions: [
        { q: 'Wer trägt die goldene Truhe voran?', options: ['die Priester', 'die Kundschafter', 'die Kinder'], answer: 0 },
        { q: 'Was geschieht, als die Füße der Priester ins Wasser kommen?', options: ['Das Wasser bleibt stehen.', 'Das Wasser steigt.', 'Der Fluss wird breiter.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
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
      image: `${PICS}etappe-bild-06.webp`,
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
      image: `${PICS}etappe-bild-07.webp`,
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
      image: `${PICS}etappe-bild-08.webp`,
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
      image: `${PICS}etappe-bild-09.webp`,
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
      image: `${PICS}etappe-bild-10.webp`,
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

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of josua.stages) {
  if (st.task.hush) st.task.hush.background = st.image
  if (st.task.verse) st.task.verse.background = st.image
}

// the German recordings of the stories (voice Achernar, text version 3 = files "-v3"); there are no English ones yet, so the English app reads with the voice of the device
for (const s of josua.stages) {
  const file = `audio/abenteuer/josua/geschichte-${String(s.id).padStart(2, '0')}-v3.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(josua, josuaEn)
