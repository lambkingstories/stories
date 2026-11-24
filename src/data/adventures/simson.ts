/**
 * Abenteuer "Simson" (Richter 13 bis 16 in Auswahl; id `simson`) für 7 bis 10 Jahre: 11 Etappen. Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Kindgerecht erzählt (Anton, 23.11.2026): kein Ausstechen der Augen, keine Rache-Worte, keine Zahl der Toten; die Hochzeit mit der Philisterin, Askalon, die Füchse und der Eselskinnbacken
 * sind weggelassen (ETAPPENPLAN.md). Der Engel des HERRN erscheint in den Etappen 1 und 2; Gott der Vater ist nie im Bild. Kein Blut, keine Waffen; der Löwe wird nur erzählt.
 * Die Texte stehen so da, wie der Entwurf sie hat (Luther 1912, kindgerecht erzählt). Merkvers: Richter 13,24b (Lückenvers in Etappe 4).
 * Quelle der Texte: D:/Claude/Abenteuer-Simson/ENTWURF_Simson.md, Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 2 Was soll sie meiden? (meiden, neu), 4 Lückenvers (lueckenvers, bekannt, Merkvers Ri 13,24b),
 * 5 Süß und stark (raetsel, neu), 6 Ausmalen (ausmalen, bekannt), 7 Das Tor ausheben (torheben, neu); die Etappen 1, 3 und die ernsten 8 bis 11 nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/simson/, images/abenteuer/spiele/simson/<spiel>/, audio/abenteuer/simson/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Simson/tools/bauen_simson.py: nicht von Hand ändern.
 */
import type { Journey, PaintJob, PaintZone, VerseGame } from '@/types/adventure'
import type { AvoidGame, GateLiftGame, RiddleGame } from '@/utils/simsonNeu'
import { josef } from './josef'
import { SIMSON_PATH } from './simsonPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { simsonEn } from './en/simson.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/simson/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/simson/'
const G = 'images/abenteuer/spiele/simson/'

/**
 * Etappe 2, "Was soll sie meiden?" (neu, `meiden`, Ri 13,4.13–14): der Hof vor Manoachs Haus; das Kind legt in den Korb, was die Frau essen und trinken darf, und legt beiseite (auf das Tuch),
 * was der Engel verboten hat. Runde 1: vier Krüge (Wasser, Milch, Wein, starkes Getränk); Runde 2: sechs Speisen, davon kommen Trauben, Rosinen und Traubensaft vom Weinstock
 * (4. Mose 6,3–4, Luther 1912: „frische noch dürre Weinbeeren“, „nichts, das aus Weinbeeren gemacht wird“). „Unreines“ kommt im Spiel nicht vor. Lagen am gemalten Bild gemessen (tools/_massen_simson.json).
 * Bilder (`spiele/simson/meiden/`): `tisch` (1500 × 1000), `korb` (320 × 240), `tuch` (360 × 200), `frau-hof` (320 × 360), die zehn Dinge (je 200 × 200).
 */
const MEIDEN: AvoidGame = {
  background: `${G}meiden/tisch.webp`,
  ratio: 1.5,
  basket: { image: `${G}meiden/korb.webp`, box: { x: 20, y: 86, w: 24, h: 26 } },
  cloth: { image: `${G}meiden/tuch.webp`, box: { x: 80, y: 87, w: 30, h: 25 } },
  woman: { image: `${G}meiden/frau-hof.webp`, x: 46, y: 62, w: 16 },
  womanRatio: 0.889,
  items: [
    { id: 'wasser', image: `${G}meiden/wasser.webp`, label: 'ein Krug mit Wasser', kind: 'darf' },
    { id: 'milch', image: `${G}meiden/milch.webp`, label: 'ein Krug mit Milch', kind: 'darf' },
    { id: 'wein', image: `${G}meiden/wein.webp`, label: 'ein Becher Wein', kind: 'nicht' },
    { id: 'starkes', image: `${G}meiden/starkes.webp`, label: 'ein Krug mit starkem Getränk', kind: 'nicht' },
    { id: 'brot', image: `${G}meiden/brot.webp`, label: 'ein Fladenbrot', kind: 'darf' },
    { id: 'feigen', image: `${G}meiden/feigen.webp`, label: 'Feigen', kind: 'darf' },
    { id: 'oliven', image: `${G}meiden/oliven.webp`, label: 'eine Schale Oliven', kind: 'darf' },
    { id: 'trauben', image: `${G}meiden/trauben.webp`, label: 'Trauben', kind: 'nicht' },
    { id: 'rosinen', image: `${G}meiden/rosinen.webp`, label: 'eine Schale Rosinen', kind: 'nicht', vine: true },
    { id: 'traubensaft', image: `${G}meiden/traubensaft.webp`, label: 'ein Krug Traubensaft', kind: 'nicht', vine: true }
  ],
  rounds: [
    { hint: 'Was darf die Frau trinken? Der Engel hat Wein und starkes Getränk verboten.', itemIds: ['wasser', 'wein', 'milch', 'starkes'] },
    { hint: 'Was darf die Frau essen? Alles, was vom Weinstock kommt, soll sie meiden.', itemIds: ['brot', 'trauben', 'feigen', 'rosinen', 'oliven', 'traubensaft'] }
  ]
}

/**
 * Etappe 4, "Lückenvers" (bekannt 1, Ri 13,24b, der Merkvers): der Vers steht im Wortlaut von Luther 1912. Tafel und Blatt wie in allen Abenteuern (aus `spiele/bergpredigt/lueckenvers/` kopiert),
 * Hintergrund `hintergrund/vers-hintergrund` (Hügel zwischen Zora und Eschtaol, Morgenlicht, ohne Menschen, ohne Tiere).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Setze das fehlende Wort in den Vers.', parts: ['Und der Knabe wuchs, und der HERR ', ' ihn.'], words: ['segnete', 'vergaß', 'verjagte'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Und der ', ' wuchs, und der HERR ', ' ihn.'], words: ['Knabe', 'segnete', 'Löwe', 'vergaß'], answers: [0, 1] }
  ]
}

/**
 * Etappe 5, "Süß und stark" (neu, `raetsel`, Ri 14,14.18): Karten auf eine Treppe legen, von oben nach unten: das Süßeste (Runde 1: Brot, Trauben, Honig) und das Stärkste (Runde 2: Hase, Schaf,
 * Esel, Löwe) ganz nach oben. Der Löwe ist eine ruhige Karte (stehend, Maul geschlossen); das Spiel sagt nie, woher der Honig war. Lagen am gemalten Bild gemessen (tools/_massen_simson.json).
 * Bilder (`spiele/simson/raetsel/`): `tafel` (1500 × 1000), `stufe` (420 × 140), `glanz` (400 × 400), sieben Karten (je 220 × 220).
 */
const RAETSEL: RiddleGame = {
  background: `${G}raetsel/tafel.webp`,
  ratio: 1.5,
  step: `${G}raetsel/stufe.webp`,
  stepRatio: 3,
  glow: `${G}raetsel/glanz.webp`,
  ladder: { x: 77, y: 96, w: 38 },
  rounds: [
    {
      hint: 'Was ist am süßesten? Lege es ganz nach oben.',
      quality: 'sweet',
      ladderLabel: 'am süßesten',
      cards: [{ id: 'karte-brot', image: `${G}raetsel/karte-brot.webp`, label: 'Brot' }, { id: 'karte-trauben', image: `${G}raetsel/karte-trauben.webp`, label: 'Trauben' }, { id: 'karte-honig', image: `${G}raetsel/karte-honig.webp`, label: 'Honig' }],
      mix: ['karte-trauben', 'karte-honig', 'karte-brot']
    },
    {
      hint: 'Wer ist am stärksten? Lege ihn ganz nach oben.',
      quality: 'strong',
      ladderLabel: 'am stärksten',
      cards: [{ id: 'karte-hase', image: `${G}raetsel/karte-hase.webp`, label: 'Hase' }, { id: 'karte-schaf', image: `${G}raetsel/karte-schaf.webp`, label: 'Schaf' }, { id: 'karte-esel', image: `${G}raetsel/karte-esel.webp`, label: 'Esel' }, { id: 'karte-loewe', image: `${G}raetsel/karte-loewe.webp`, label: 'Löwe' }],
      mix: ['karte-esel', 'karte-hase', 'karte-loewe', 'karte-schaf']
    }
  ]
}

/**
 * Etappe 6, "Ausmalen" (bekannt 2, Ri 15,19): Strichbild für Zehnjährige (v2, 24.11.2026): Simson kniet an der Quelle von Lehi und trinkt aus den Händen; Felsen, Wasser, Ölbaum, Wolken, Vogel, Gras.
 * Zonen am Strichbild gemessen (Saatpunkte in Prozent, tools/zonen_aus6_v2.py); bei jedem Start werden drei Aufgaben aus dem Pool gezogen.
 */
const AUSMALEN_ZONEN: Record<string, PaintZone> = {
  himmel: { seeds: [[21.6, 5.3]] },
  wolken: { seeds: [[35.3, 5.7], [5.7, 12.2], [2.8, 21], [52.1, 2.4]] },
  vogel: { seeds: [[12.7, 6.4]] },
  felsen: { seeds: [[94.1, 39.8], [49, 52.8], [84.8, 60.8], [75.5, 74], [85, 29.3], [79.9, 48.4], [67.2, 29.3], [58.3, 23.5], [62.9, 44.6], [74.9, 63.7]] },
  wasser: { seeds: [[60.7, 93.3]] },
  stamm: { seeds: [[95.3, 13.4], [92.9, 62.6], [83.1, 35.9]] },
  laub: { seeds: [[83, 25.1], [91.8, 18.5], [77.1, 13], [82.5, 3.4], [93.9, 9.1], [94.8, 22.8], [63.6, 24.5], [75.9, 7.4], [87.4, 9.3], [97.7, 21.6]] },
  gras: { seeds: [[9.3, 65.6], [81.5, 66.9], [94.1, 75.6], [87.6, 81.9], [98, 97], [35.3, 95.7], [8.9, 98.5], [17, 98]] }
}
const AUSMALEN_AUFGABEN: PaintJob[] = [
  { zone: 'himmel', color: 'blue', hint: 'Male den Himmel blau.' },
  { zone: 'wasser', color: 'blue', hint: 'Male das Wasser der Quelle blau.' },
  { zone: 'felsen', color: 'brown', hint: 'Male die Felsen braun.' },
  { zone: 'gras', color: 'green', hint: 'Male das Gras grün.' },
  { zone: 'laub', color: 'green', hint: 'Male das Laub des Ölbaums grün.' },
  { zone: 'stamm', color: 'brown', hint: 'Male den Stamm des Ölbaums braun.' },
  { zone: 'vogel', tool: 'felt', hint: 'Male den Vogel mit dem Filzstift.' },
  { zone: 'wolken', tool: 'chalk', hint: 'Male die Wolken mit Kreide.' },
  { zone: 'wasser', tool: 'watercolor', hint: 'Male das Wasser der Quelle mit Wasserfarbe.' }
]

/**
 * Etappe 7, "Das Tor ausheben" (neu, `torheben`, Ri 16,3): das Stadttor von Gaza bei Nacht; was noch hält, lässt sich nicht anheben: zuerst der Riegel, dann eine Tür, dann ihr Pfosten.
 * Jedes freie Teil wandert auf Simsons Schultern. Die Reihenfolge ist Spielregel, keine Bibelaussage (Simson trägt alles zusammen fort, samt Riegel). Keine Wächter, keine Waffen.
 * Runde 1: das kleine Tor (Riegel, zwei Türen), Runde 2: das große Tor (dazu zwei Pfosten). Lagen am gemalten Bild gemessen (Faktor 0,63 der Teile auf dem 1500 px breiten Hintergrund:
 * die zwei Türen füllen die Bogenöffnung; tools/_massen_simson.json). Simson steht rechts vom Tor und schaut nach links zum Tor.
 * Bilder (`spiele/simson/torheben/`): `nacht-v2` (1500 × 1000), `riegel-v2` (658 × 106), `fluegel-links|rechts-v2` (je 296 × 620), `pfosten-links|rechts-v2` (je 120 × 695), `simson-links-v5` (420 × 520).
 */
const TORHEBEN: GateLiftGame = {
  background: `${G}torheben/nacht-v2.webp`,
  ratio: 1.5,
  strong: { image: `${G}torheben/simson-links-v5.webp`, x: 83, y: 81, w: 14.3, ratio: 0.808 },
  shoulder: { x: 83, y: 60, step: 5, w: 18 },
  rounds: [
    {
      hint: 'Hebe die Teile des Tores aus. Was noch hält, lässt sich nicht anheben.',
      parts: [
        { id: 'riegel', image: `${G}torheben/riegel-v2.webp`, label: 'Der Riegel', x: 51.4, y: 58, w: 27.6, ratio: 6.208, holds: [] },
        { id: 'fluegel-links', image: `${G}torheben/fluegel-links-v2.webp`, label: 'Die linke Tür', x: 45.3, y: 60.5, w: 12.43, ratio: 0.477, holds: ['riegel'] },
        { id: 'fluegel-rechts', image: `${G}torheben/fluegel-rechts-v2.webp`, label: 'Die rechte Tür', x: 57.5, y: 60.5, w: 12.43, ratio: 0.477, holds: ['riegel'] }
      ]
    },
    {
      hint: 'Das große Tor: Hebe alle Teile aus, eines nach dem anderen.',
      parts: [
        { id: 'riegel', image: `${G}torheben/riegel-v2.webp`, label: 'Der Riegel', x: 51.4, y: 58, w: 27.6, ratio: 6.208, holds: [] },
        { id: 'fluegel-links', image: `${G}torheben/fluegel-links-v2.webp`, label: 'Die linke Tür', x: 45.3, y: 60.5, w: 12.43, ratio: 0.477, holds: ['riegel'] },
        { id: 'fluegel-rechts', image: `${G}torheben/fluegel-rechts-v2.webp`, label: 'Die rechte Tür', x: 57.5, y: 60.5, w: 12.43, ratio: 0.477, holds: ['riegel'] },
        { id: 'pfosten-links', image: `${G}torheben/pfosten-links-v2.webp`, label: 'Der linke Pfosten', x: 36.7, y: 58.2, w: 5.04, ratio: 0.173, holds: ['fluegel-links'] },
        { id: 'pfosten-rechts', image: `${G}torheben/pfosten-rechts-v2.webp`, label: 'Der rechte Pfosten', x: 66.2, y: 58.2, w: 5.04, ratio: 0.173, holds: ['fluegel-rechts'] }
      ]
    }
  ]
}

export const simson: Journey = {
  id: 'simson',
  title: 'Simson',
  subtitle: 'Vom Engel in Zora bis zum Haus in Gaza',
  age: '8-10',
  downloadMb: 14, // gemessen 24.11.2026: alle Dateien von journeyFiles(simson) = 13,04 MB, aufgerundet
  medal: `${PICS}medaille-v4.webp`, // Medaille 4 (24.11.2026: junger Bart, Simson am Tor, für Zehnjährige; Antons frühere Wahl war Medaille 1)
  // Geschenk-Ausmalbild (v2, 24.11.2026, für Zehnjährige): Simson trägt das Tor von Gaza auf die Höhe vor Hebron (Konturzeichnung; Stadt Gaza mit leerem Torbogen, Morgensonne, Ölbäume, Weinberge)
  gift: { title: 'Simson trägt das Tor', image: `${PICS}geschenk-v2.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): eine Landschaft Israels und der Philisterküste, von Zora über Timna, Lehi, Gaza und den Bach Sorek
  // bis zum Hügel zwischen Zora und Eschtaol; Stationen aus ergebnis/panorama/map-simson.json, Perlenweg aus simsonPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/simson/karte-pano-v4-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0444, y: 0.7706, d: 0.0339 },
      { x: 0.1411, y: 0.3398, d: 0.0339 },
      { x: 0.2167, y: 0.7646, d: 0.0339 },
      { x: 0.3024, y: 0.4612, d: 0.0339 },
      { x: 0.4153, y: 0.7888, d: 0.0339 },
      { x: 0.4637, y: 0.3034, d: 0.0339 },
      { x: 0.5847, y: 0.5097, d: 0.0339 },
      { x: 0.7016, y: 0.3519, d: 0.0339 },
      { x: 0.7762, y: 0.7403, d: 0.0339 },
      { x: 0.8468, y: 0.1942, d: 0.0339 },
      { x: 0.9073, y: 0.7646, d: 0.0339 }
    ],
    exam: { x: 0.9556, y: 0.2791, d: 0.0339 },
    path: SIMSON_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      music: 'audio/abenteuer/simson/musik-zora-v1.mp3',
      title: 'Der Engel kommt',
      ref: 'Richter 13,1–5',
      text: [
        'Die Israeliten tun, was dem HERRN nicht gefällt. Da gibt der HERR sie vierzig Jahre lang in die Hand der Philister.',
        'In Zora wohnt ein Mann, der heißt Manoach. Er gehört zum Stamm Dan. Seine Frau hat keine Kinder.',
        'Eines Tages erscheint der Engel des HERRN der Frau. „Bisher hast du keine Kinder“, sagt er. „Aber du wirst einen Sohn bekommen.“',
        '„Hüte dich“, sagt der Engel. „Trink keinen Wein und kein starkes Getränk, und iss nichts Unreines.“',
        '„Auf den Kopf deines Sohnes darf nie ein Schermesser kommen. Er gehört Gott, von Mutterleib an. Er wird anfangen, Israel aus der Hand der Philister zu retten.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt der Mann, der in Zora wohnt?', options: ['Manoach', 'Gideon', 'Barak'], answer: 0 },
        { q: 'Wem erscheint der Engel des HERRN?', options: ['der Frau', 'einem Hirten', 'den Philistern'], answer: 0 },
        { q: 'Was darf nie auf den Kopf ihres Sohnes kommen?', options: ['ein Schermesser', 'eine Krone', 'ein Kranz'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      music: 'audio/abenteuer/simson/musik-zora-v1.mp3',
      title: 'Manoach fragt',
      ref: 'Richter 13,6–14',
      text: [
        'Die Frau erzählt es ihrem Mann Manoach. „Ein Mann Gottes ist zu mir gekommen“, sagt sie. „Er sah aus wie ein Engel Gottes.“',
        'Da betet Manoach: „Ach, HERR, lass den Mann Gottes noch einmal zu uns kommen. Er soll uns lehren, was wir mit dem Knaben tun sollen.“',
        'Gott hört auf Manoach. Der Engel kommt wieder zu der Frau, als sie auf dem Feld sitzt. Manoach ist nicht bei ihr, und sie läuft und holt ihn.',
        '„Bist du der Mann, der mit meiner Frau geredet hat?“, fragt Manoach. „Ja“, sagt der Engel. „Wenn eintrifft, was du gesagt hast“, fragt Manoach, „wie soll der Knabe leben, und was soll er tun?“',
        '„Sie soll nichts essen, was vom Weinstock kommt“, sagt der Engel. „Wein und starkes Getränk soll sie nicht trinken, und nichts Unreines soll sie essen. Alles, was ich ihr geboten habe, soll sie halten.“'
      ],
      // Spiel: Was soll sie meiden? (meiden, neu)
      task: { kind: 'meiden', hint: 'Lege in den Korb, was die Frau essen und trinken darf. Das andere lege beiseite.', avoid: MEIDEN },
      questions: [
        { q: 'Wo sitzt die Frau, als der Engel wieder zu ihr kommt?', options: ['auf dem Feld', 'im Haus', 'am Brunnen'], answer: 0 },
        { q: 'Worum betet Manoach?', options: ['Der Mann Gottes soll noch einmal kommen.', 'Die Philister sollen gehen.', 'Es soll regnen.'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03-v6.webp`,
      music: 'audio/abenteuer/simson/musik-zora-v1.mp3',
      title: 'Auf dem Felsen',
      ref: 'Richter 13,15–23',
      text: [
        '„Bleib doch“, sagt Manoach zum Engel. „Wir wollen dir ein Ziegenböcklein zubereiten.“ „Ich esse nicht von deiner Speise“, antwortet der Engel. „Willst du aber dem HERRN ein Brandopfer bringen, so tu es.“ Manoach weiß nicht, dass es der Engel des HERRN ist.',
        '„Wie heißt du?“, fragt Manoach. „Wir wollen dich preisen, wenn eintrifft, was du gesagt hast.“ „Warum fragst du nach meinem Namen?“, sagt der Engel. „Er ist wunderbar.“',
        'Manoach opfert ein Ziegenböcklein auf einem Felsen. Die Flamme fährt vom Altar zum Himmel, und der Engel fährt in der Flamme mit hinauf. Manoach und seine Frau fallen mit dem Gesicht auf die Erde.',
        'Der Engel erscheint ihnen nicht mehr. Da erkennt Manoach, dass es der Engel des HERRN war. „Wir müssen sterben“, sagt er, „denn wir haben Gott gesehen.“ „Wenn der HERR uns töten wollte“, antwortet seine Frau, „hätte er unser Opfer nicht angenommen.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sagt der Engel zu Manoach, als der nach seinem Namen fragt?', options: ['Er ist wunderbar.', 'Er ist ein Königsname.', 'Er ist ein Hirtenname.'], answer: 0 },
        { q: 'Wo opfert Manoach das Ziegenböcklein?', options: ['auf einem Felsen', 'auf dem Dach', 'am Bach'], answer: 0 },
        { q: 'Was sagt die Frau zu Manoach?', options: ['Der HERR hat unser Opfer angenommen.', 'Der Engel kommt morgen wieder.', 'Wir gehen nach Gaza.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-v5.webp`,
      music: 'audio/abenteuer/simson/musik-timna-v1.mp3',
      title: 'Simson und der Löwe',
      ref: 'Richter 13,24–25; 14,5–9',
      text: [
        'Die Frau bekommt einen Sohn und nennt ihn Simson. Der Knabe wächst, und der HERR segnet ihn. Der Geist des HERRN fängt an, ihn zu treiben, im Lager Dan zwischen Zora und Eschtaol.',
        'Später geht Simson mit seinem Vater und seiner Mutter hinab nach Timna. An den Weinbergen kommt ihm ein junger Löwe brüllend entgegen. Der Geist des HERRN kommt über Simson, und er überwältigt den Löwen. Er hat nichts in der Hand. Seinem Vater und seiner Mutter sagt er nicht, was er getan hat.',
        'Nach einigen Tagen kommt Simson wieder des Weges. Er geht ein Stück vom Weg ab und sieht nach dem toten Löwen. In dem Löwen ist ein Bienenschwarm, und da ist Honig. Simson nimmt den Honig in die Hand und isst im Gehen. Seinem Vater und seiner Mutter gibt er auch davon. Woher er den Honig hat, sagt er ihnen nicht.'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt, Merkvers Ri 13,24b)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Wohin gehen Simson und seine Eltern?', options: ['nach Timna', 'nach Gaza', 'nach Hebron'], answer: 0 },
        { q: 'Wem sagt Simson nicht, woher der Honig ist?', options: ['seinem Vater und seiner Mutter', 'seinen Brüdern', 'den Philistern'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05-v5.webp`,
      music: 'audio/abenteuer/simson/musik-timna-v1.mp3',
      title: 'Das Rätsel',
      ref: 'Richter 14,10–14.18a',
      text: [
        'In Timna macht Simson ein Fest, wie die jungen Männer dort es tun. Sieben Tage soll es dauern. Er sagt zu den Gästen: „Ich will euch ein Rätsel aufgeben. Ihr habt sieben Tage Zeit, es zu erraten.“',
        '„Gib dein Rätsel auf“, sagen sie. „Wir wollen es hören.“',
        'Simson sagt: „Speise ging von dem Fresser, und Süßigkeit ging von dem Starken.“',
        'Drei Tage lang raten die Gäste und finden die Lösung nicht.',
        'Am siebten Tag, noch ehe die Sonne untergeht, sagen die Männer der Stadt zu Simson: „Was ist süßer als Honig? Was ist stärker als ein Löwe?“',
        'Sie haben die Lösung nicht selbst gefunden. Jemand hat sie ihnen verraten.'
      ],
      // Spiel: Süß und stark (raetsel, neu)
      task: { kind: 'raetsel', hint: 'Lege die Karten in die Reihe: das Süßeste und das Stärkste ganz nach oben.', riddle: RAETSEL },
      questions: [
        { q: 'Wie viele Tage lang raten die Gäste, ohne die Lösung zu finden?', options: ['drei Tage', 'einen Tag', 'zehn Tage'], answer: 0 },
        { q: 'Wann kommen die Männer der Stadt zu Simson?', options: ['am siebten Tag, noch ehe die Sonne untergeht', 'am ersten Morgen', 'mitten in der Nacht'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06-v5.webp`,
      music: 'audio/abenteuer/simson/musik-timna-v1.mp3',
      title: 'Wasser aus der Höhle',
      ref: 'Richter 15,18–19',
      text: [
        'Die Philister ziehen nach Lehi, um Simson zu fangen. Da kommt der Geist des HERRN über ihn, und der HERR gibt ihm einen großen Sieg über die Philister. Danach dürstet ihn sehr.',
        'Er ruft den HERRN an: „Du hast durch die Hand deines Knechtes so große Rettung gegeben. Nun muss ich vor Durst sterben und den Philistern in die Hände fallen.“',
        'Da spaltet Gott eine Höhlung in Lehi, und Wasser kommt heraus. Simson trinkt. Sein Geist kommt wieder, und er wird frisch.',
        'Darum heißt die Quelle bis heute „Brunnen des Anrufers“.'
      ],
      // Spiel: Ausmalen (ausmalen, bekannt)
      task: { kind: 'ausmalen', hint: 'Male Simson an der Quelle aus.', image: `${G}ausmalen/etappe-06-v2.webp`, zones: AUSMALEN_ZONEN, jobs: AUSMALEN_AUFGABEN, jobCount: 3 },
      questions: [
        { q: 'Wo spaltet Gott die Höhlung?', options: ['in Lehi', 'in Gaza', 'in Zora'], answer: 0 },
        { q: 'Was tut Simson, als er so großen Durst hat?', options: ['Er ruft den HERRN an.', 'Er sucht Honig.', 'Er geht nach Hause.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07-v6.webp`,
      music: 'audio/abenteuer/simson/musik-timna-v1.mp3',
      title: 'Das Tor von Gaza',
      ref: 'Richter 16,1–3',
      text: [
        'Simson geht nach Gaza, in eine Stadt der Philister.',
        'Den Männern von Gaza wird gesagt: „Simson ist in die Stadt gekommen.“ Sie lauern ihm die ganze Nacht am Stadttor auf. Sie sind still und sagen: „Wartet bis zum Morgen.“',
        'Simson aber bleibt bis Mitternacht liegen. Da steht er auf und packt beide Türen des Stadttors samt den zwei Pfosten. Er hebt sie aus, mit dem Riegel, und legt sie auf seine Schultern.',
        'Er trägt sie hinauf auf die Höhe des Berges vor Hebron.'
      ],
      // Spiel: Das Tor ausheben (torheben, neu)
      task: { kind: 'torheben', hint: 'Hebe das Tor aus. Was noch hält, lässt sich nicht anheben.', gateLift: TORHEBEN },
      questions: [
        { q: 'Wann steht Simson auf?', options: ['um Mitternacht', 'am Morgen', 'am Abend'], answer: 0 },
        { q: 'Wohin trägt Simson die Türen?', options: ['auf die Höhe des Berges vor Hebron', 'an den Bach Sorek', 'nach Zora'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      music: 'audio/abenteuer/simson/musik-gaza-v1.mp3',
      title: 'Delila fragt',
      ref: 'Richter 16,4–14',
      text: [
        'Am Bach Sorek wohnt eine Frau, die heißt Delila. Simson hat sie lieb.',
        'Die Fürsten der Philister kommen zu ihr. „Überrede ihn“, sagen sie. „Finde heraus, woher seine große Kraft kommt und womit wir ihn binden können. Dann bekommst du von jedem von uns tausendeinhundert Silberstücke.“',
        'Delila fragt Simson: „Sage mir doch, woher kommt deine große Kraft? Womit kann man dich binden?“ Simson sagt: „Mit sieben frischen Bastseilen.“ Sie bindet ihn damit und ruft: „Die Philister kommen, Simson!“ Er zerreißt die Seile wie einen Faden.',
        'Noch zweimal fragt sie ihn, und zweimal sagt er etwas anderes. Beide Male ruft sie: „Die Philister kommen, Simson!“, und beide Male ist er frei.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo wohnt Delila?', options: ['am Bach Sorek', 'in Gaza', 'in Timna'], answer: 0 },
        { q: 'Was bekommt Delila von jedem Fürsten, wenn sie das Geheimnis findet?', options: ['tausendeinhundert Silberstücke', 'einen Esel', 'ein Schaf'], answer: 0 },
        { q: 'Was ruft Delila jedes Mal, wenn sie Simson gebunden hat?', options: ['Die Philister kommen, Simson!', 'Simson, lauf weg!', 'Simson, iss mit uns!'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09-v5.webp`,
      music: 'audio/abenteuer/simson/musik-gaza-v1.mp3',
      title: 'Das Geheimnis',
      ref: 'Richter 16,15–20',
      text: [
        '„Wie kannst du sagen, dass du mich lieb hast?“, sagt Delila. „Dreimal hast du mich getäuscht.“ Sie fragt ihn jeden Tag, bis er es nicht mehr aushält. Da sagt er ihr alles: „Nie ist ein Schermesser auf meinen Kopf gekommen. Ich gehöre Gott, von Mutterleib an. Wenn man mir die Haare schert, ist meine Kraft weg.“',
        'Delila lässt ihn auf ihrem Schoß einschlafen. Sie ruft einen Mann, der ihm die sieben Locken abschneidet. Dann ruft sie: „Die Philister kommen, Simson!“ Simson wacht auf und denkt: Ich reiße mich los, wie schon oft. Er weiß nicht, dass der HERR von ihm gewichen ist.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie oft hat Simson Delila schon getäuscht?', options: ['dreimal', 'einmal', 'siebenmal'], answer: 0 },
        { q: 'Wem gehört Simson von Mutterleib an?', options: ['Gott', 'den Philistern', 'Delila'], answer: 0 },
        { q: 'Was weiß Simson nicht, als er aufwacht?', options: ['dass der HERR von ihm gewichen ist', 'dass Delila weggegangen ist', 'dass es schon Abend ist'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10-v6.webp`,
      music: 'audio/abenteuer/simson/musik-gaza-v1.mp3',
      title: 'In Gaza',
      ref: 'Richter 16,21–27',
      text: [
        'Die Philister packen Simson. Sie binden ihn mit zwei Ketten aus Bronze und bringen ihn nach Gaza. Dort muss er im Gefängnis Korn mahlen. Sein Haar aber fängt wieder an zu wachsen.',
        'Die Fürsten der Philister feiern ein großes Fest für ihren Gott Dagon. „Holt Simson“, rufen sie. „Er soll vor uns spielen!“ Ein Junge führt Simson an der Hand zwischen die Säulen des großen Hauses. Das Haus ist voll. Auch auf dem Dach sind viele Menschen.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Womit binden die Philister Simson?', options: ['mit zwei Ketten aus Bronze', 'mit sieben Bastseilen', 'mit einem Strick'], answer: 0 },
        { q: 'Was muss Simson im Gefängnis tun?', options: ['Korn mahlen', 'Steine tragen', 'Wasser holen'], answer: 0 },
        { q: 'Wer führt Simson an der Hand zwischen die Säulen?', options: ['ein Junge', 'Delila', 'ein Fürst'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11-v6.webp`,
      // das zweite Bild unter dem Text (Begräbnis, Variante 11b v2)
      imageEnd: `${PICS}etappe-bild-11-b-v2.webp`,
      music: 'audio/abenteuer/simson/musik-gaza-v1.mp3',
      title: 'Das Haus',
      ref: 'Richter 16,25b–31',
      text: [
        '„Lass mich die Säulen fühlen, auf denen das Haus steht“, sagt Simson zu dem Jungen. „Ich will mich anlehnen.“',
        'Simson ruft zum HERRN: „Herr, denk an mich. Gib mir noch einmal Kraft, Gott, nur dieses eine Mal.“ Dann fasst er die beiden mittleren Säulen, die eine mit der rechten, die andere mit der linken Hand, und stemmt sich dagegen. Das Haus stürzt ein. Auch Simson stirbt dabei.',
        'Seine Brüder und die ganze Familie holen ihn, tragen ihn hinauf und begraben ihn im Grab seines Vaters Manoach. Zwanzig Jahre lang war er Richter in Israel.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Worum bittet Simson den HERRN?', options: ['um noch einmal Kraft', 'um Wasser', 'um ein Fest'], answer: 0 },
        { q: 'Wo wird Simson begraben?', options: ['im Grab seines Vaters Manoach', 'am Bach Sorek', 'in Gaza'], answer: 0 },
        { q: 'Wie lange war Simson Richter in Israel?', options: ['zwanzig Jahre', 'vierzig Jahre', 'sieben Jahre'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wem erscheint der Engel des HERRN?', options: ['der Frau', 'einem Hirten', 'den Philistern'], answer: 0 },
    { q: 'Wo opfert Manoach das Ziegenböcklein?', options: ['auf einem Felsen', 'auf dem Dach', 'am Bach'], answer: 0 },
    { q: 'Wohin gehen Simson und seine Eltern?', options: ['nach Timna', 'nach Gaza', 'nach Hebron'], answer: 0 },
    { q: 'Wohin trägt Simson die Türen des Stadttors?', options: ['auf die Höhe des Berges vor Hebron', 'an den Bach Sorek', 'nach Zora'], answer: 0 },
    { q: 'Wem gehört Simson von Mutterleib an?', options: ['Gott', 'den Philistern', 'Delila'], answer: 0 },
    { q: 'Wo wird Simson begraben?', options: ['im Grab seines Vaters Manoach', 'am Bach Sorek', 'in Gaza'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of simson.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-vK.mp3"; K is the version, a re-recorded story gets a new number); until a recording is made the app reads with the voice of the device.
// stage -> version of the file in public/audio/abenteuer/simson/ (written by bauen_simson.py from the files that exist and ergebnis/geltend.json)
const RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 4, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 6, 9: 2, 10: 2, 11: 2 }
for (const s of simson.stages) {
  const version = RECORDING_VERSION[s.id]
  const file = version ? `audio/abenteuer/simson/geschichte-${String(s.id).padStart(2, '0')}-v${version}.mp3` : undefined
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria; they follow one another at random (a stage with its own `music` plays exactly that piece)
simson.music = [
  'audio/abenteuer/simson/musik-zora-v1.mp3',
  'audio/abenteuer/simson/musik-timna-v1.mp3',
  'audio/abenteuer/simson/musik-gaza-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(simson, simsonEn)
