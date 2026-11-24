/**
 * Abenteuer "Johannes der Täufer" (Lukas 1 und 3, Johannes 1 und 3, Matthäus 11 und 14; id `johannes`) für 7 bis 10 Jahre: 10 Etappen. Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Luther 1912 kindgerecht erzählt; weggelassen (ETAPPENPLAN.md): Maria und Elisabeth, der Auftritt mit dem Kamelhaar und die Rede an die Pharisäer, die Taufe Jesu (alles in "Weihnachten" und "Taufe"),
 * Herodias und die Art von Johannes' Tod (Etappe 10 endet mit dem Satz "Später starb Johannes ..."). Der Engel Gabriel erscheint in den Etappen 1 und 2; Gott der Vater und die Taube sind nie im Bild.
 * Kein Blut, keine Waffen, keine Soldaten, keine Fesseln; Herodes ist nie im Bild. Merkvers: Lukas 1,80a (Lückenvers in Etappe 4).
 * Quelle der Texte: D:/Claude/Abenteuer-Johannes/ENTWURF_Johannes.md, Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 2 Zeige es ihnen (gebaerde, neu), 4 Lückenvers (lueckenvers, bekannt, Merkvers Lk 1,80a),
 * 6 Wer zwei hat, gibt ab (abgeben, neu), 8 Wohin zeigt Johannes? (zeigen, neu), 9 Ausmalen (ausmalen, bekannt); die Etappen 1, 3, 5, 7 und die ernste 10 nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/johannes/, images/abenteuer/spiele/johannes/<spiel>/, audio/abenteuer/johannes/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Johannes/tools/bauen_johannes.py: nicht von Hand ändern.
 */
import type { Journey, PaintJob, PaintZone, VerseGame } from '@/types/adventure'
import type { GestureGame, GiveAwayGame, PointGame } from '@/utils/johannesNeu'
import { josef } from './josef'
import { JOHANNES_PATH } from './johannesPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { johannesEn } from './en/johannes.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/johannes/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/johannes/'
const G = 'images/abenteuer/spiele/johannes/'

/**
 * Etappe 2, "Zeige es ihnen" (neu, `gebaerde`, Lk 1,21–22): der Vorplatz des Tempels; Zacharias kann nicht reden, das Kind spricht für ihn mit den Händen und wählt unter drei Karten die Haltung,
 * die das Volk versteht (Runde 1: er hat etwas gesehen, Runde 2: er kann nicht sprechen). Welche Zeichen Zacharias machte, steht nicht in der Bibel: die vier Haltungen und ihre Bedeutung sind
 * eine Spielregel. Lagen: VORLÄUFIG, am gemalten Bild nachzumessen (tools/_massen_johannes.json).
 * Bilder (`spiele/johannes/gebaerde/`): `vorhof` (1500 × 1000), `zacharias` und `zeichen-sehen|mund|bauch|schlaf` (je 420 × 620), `volk-ratlos|versteht` (je 900 × 420).
 */
const GEBAERDE: GestureGame = {
  background: `${G}gebaerde/vorhof.webp`,
  ratio: 1.5,
  zacharias: { image: `${G}gebaerde/zacharias.webp`, x: 22, y: 93, w: 22, ratio: 0.677 },
  crowd: { puzzled: `${G}gebaerde/volk-ratlos.webp`, understood: `${G}gebaerde/volk-versteht.webp`, x: 68, y: 92, w: 50, ratio: 2.143 },
  poses: [
    { id: 'sehen', image: `${G}gebaerde/zeichen-sehen.webp`, label: 'Hand über den Augen, Blick nach oben' },
    { id: 'mund', image: `${G}gebaerde/zeichen-mund.webp`, label: 'Hand auf dem Mund' },
    { id: 'bauch', image: `${G}gebaerde/zeichen-bauch.webp`, label: 'Hand auf dem Bauch' },
    { id: 'schlaf', image: `${G}gebaerde/zeichen-schlaf.webp`, label: 'Kopf auf den gefalteten Händen' }
  ],
  rounds: [
    { hint: 'Zeige dem Volk: Du hast im Tempel etwas gesehen.', right: 'sehen', cards: ['bauch', 'sehen', 'schlaf'] },
    { hint: 'Zeige dem Volk: Du kannst nicht sprechen.', right: 'mund', cards: ['schlaf', 'bauch', 'mund'] }
  ]
}

/**
 * Etappe 4, "Lückenvers" (bekannt 1, Lk 1,80a, der Merkvers): der Vers steht im Wortlaut von Luther 1912. Tafel und Blatt wie in allen Abenteuern (aus `spiele/simson/lueckenvers/` kopiert),
 * Hintergrund `hintergrund/vers-hintergrund` (Dorfrand im Bergland von Judäa, Morgenlicht, ohne Menschen, ohne Tiere).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Setze das fehlende Wort in den Vers.', parts: ['Und das Kindlein wuchs und ward ', ' im Geist.'], words: ['stark', 'müde', 'traurig'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Und das ', ' wuchs und ward stark im ', '.'], words: ['Kindlein', 'Geist', 'Vöglein', 'Wasser'], answers: [0, 1] }
  ]
}

/**
 * Etappe 6, "Wer zwei hat, gibt ab" (neu, `abgeben`, Lk 3,11): am Jordanufer stehen Menschen in einer Reihe, jeder hat Röcke (Runde 1) oder Brote (Runde 2) auf seiner Matte, manche nichts. Wer mehr
 * als eins hat, reicht eins dem NACHBARN, bis jeder genau eins hat. „Nur zum Nachbarn“ und „es reicht genau“ sind Spielregeln, keine Bibelworte; Zöllner und Soldaten kommen im Spiel nicht vor.
 * Lagen: VORLÄUFIG, am gemalten Bild nachzumessen (tools/_massen_johannes.json).
 * Bilder (`spiele/johannes/abgeben/`): `ufer` (1500 × 1000), `person-1…5` (je 260 × 420), `matte` (260 × 70), `rock` (200 × 160), `brot` (160 × 120).
 */
const ABGEBEN: GiveAwayGame = {
  background: `${G}abgeben/ufer.webp`,
  ratio: 1.5,
  persons: [
    { image: `${G}abgeben/person-1.webp`, label: 'ein alter Mann mit Kopftuch und Stab' },
    { image: `${G}abgeben/person-2.webp`, label: 'eine junge Frau mit Kopftuch' },
    { image: `${G}abgeben/person-3.webp`, label: 'ein Hirte mit Wollmantel' },
    { image: `${G}abgeben/person-4.webp`, label: 'eine Frau mittleren Alters mit Kopftuch' },
    { image: `${G}abgeben/person-5.webp`, label: 'ein Junge von etwa zwölf Jahren' }
  ],
  personRatio: 0.619,
  mat: `${G}abgeben/matte.webp`,
  matRatio: 3.714,
  items: { rock: `${G}abgeben/rock.webp`, brot: `${G}abgeben/brot.webp` },
  itemRatio: { rock: 1.25, brot: 1.333 },
  layout: { personW: 18, feetY: 83, matW: 17, matY: 93, pieceW: 10, pieceY: 91 },
  rounds: [
    { hint: 'Wer zwei Röcke hat, gibt einen dem Nachbarn. Bald hat jeder einen.', item: 'rock', start: [2, 1, 0, 1] },
    { hint: 'Jetzt geht es um Brot. Wer mehr als ein Brot hat, gibt eines weiter.', item: 'brot', start: [0, 0, 4, 0, 1] }
  ]
}

/**
 * Etappe 8, "Wohin zeigt Johannes?" (neu, `zeigen`, Joh 1,29.35–37): Johannes steht auf einer Anhöhe am Jordan und zeigt mit dem ausgestreckten Arm; das Kind verlängert die Linie in Gedanken über
 * das Wasser und tippt den Mann an, auf den er zeigt (Jesus; die anderen Männer sind Ausstattung, keiner trägt ein Tier). Runde 2: zwei Jünger schauen mit und gehen Jesus nach. Dass Johannes mit dem Arm
 * zeigt, steht nicht in den Versen (das Bild des Plans). Fingerspitze und Armwinkel: VORLÄUFIG, am gemalten Bild nachzumessen (tools/_massen_johannes.json).
 * Bilder (`spiele/johannes/zeigen/`): `ufer-weit` (1500 × 1000), `johannes-zeigt-1|2` (je 520 × 700), `juenger` (420 × 640), `jesus-geht` (260 × 460), `mann-fischer|bauer|hirte|traeger` (je 220 × 420).
 */
const ZEIGEN: PointGame = {
  background: `${G}zeigen/ufer-weit.webp`,
  ratio: 1.5,
  rounds: [
    {
      hint: 'Am nächsten Tag: Wer kommt zu Johannes? Tippe den Mann an, auf den er zeigt.',
      johannes: { image: `${G}zeigen/johannes-zeigt-1.webp`, x: 12, y: 92, w: 15, ratio: 0.743 },
      tip: { x: 17.1, y: 65.1 },
      angle: 30,
      tolerance: 7,
      men: [
        { id: 'jesus', image: `${G}zeigen/jesus-geht.webp`, label: 'ein Mann in cremeweißer Tunika und rotbraunem Mantel', x: 55, y: 46.9, w: 11, ratio: 0.565 },
        { id: 'fischer', image: `${G}zeigen/mann-fischer.webp`, label: 'ein Fischer mit Netz auf der Schulter', x: 38, y: 40, w: 11, ratio: 0.524 },
        { id: 'bauer', image: `${G}zeigen/mann-bauer.webp`, label: 'ein Bauer mit Korb', x: 45, y: 82, w: 11, ratio: 0.524 }
      ],
      right: 'jesus'
    },
    {
      hint: 'Am Tag darauf: Auf wen zeigt Johannes jetzt?',
      johannes: { image: `${G}zeigen/johannes-zeigt-2.webp`, x: 15, y: 76, w: 15, ratio: 0.743 },
      tip: { x: 20.3, y: 56 },
      angle: -3,
      tolerance: 7,
      men: [
        { id: 'jesus', image: `${G}zeigen/jesus-geht.webp`, label: 'ein Mann in cremeweißer Tunika und rotbraunem Mantel', x: 46, y: 72.6, w: 11, ratio: 0.565 },
        { id: 'hirte', image: `${G}zeigen/mann-hirte.webp`, label: 'ein Hirte mit Stab', x: 60, y: 50, w: 11, ratio: 0.524 },
        { id: 'traeger', image: `${G}zeigen/mann-traeger.webp`, label: 'ein Wasserträger mit Tonkrug', x: 30, y: 50, w: 11, ratio: 0.524 },
        { id: 'fischer', image: `${G}zeigen/mann-fischer.webp`, label: 'ein Fischer mit Netz auf der Schulter', x: 47, y: 41, w: 11, ratio: 0.524 }
      ],
      right: 'jesus',
      disciples: { image: `${G}zeigen/juenger.webp`, x: 31, y: 86, w: 13, ratio: 0.656, follow: { x: 6, y: -3 } }
    }
  ]
}

/**
 * Etappe 9, "Ausmalen" (bekannt 2, Joh 3,23): Strichbild „Die Quellen von Änon“ (Quellen und Wasserläufe zu einem flachen Becken, Palmen, Schilf, Felsen, Hügel, Sonne, Wolken, ein Vogel; keine
 * Menschen, keine Schrift). Zonen am Strichbild gemessen (Saatpunkte in Prozent, tools/zonen_aus9_johannes.py, tools/_zonen_johannes.json); bei jedem Start werden drei Aufgaben aus dem Pool gezogen.
 */
const AUSMALEN_ZONEN: Record<string, PaintZone> = {
  himmel: { seeds: [[49.1, 5.1]] },
  sonne: { seeds: [[67.7, 9.1]] },
  wolken: { seeds: [[29.2, 19.3], [58.3, 20.3]] },
  wasser: { seeds: [[57, 81.4], [31.9, 80.9], [71.1, 57.1]] },
  gewand: { seeds: [[44.7, 66.8], [42.7, 39.7], [47.9, 47.8]] },
  baum: { seeds: [[2.6, 15.3]] },
  felsen: { seeds: [[86.9, 81], [92, 64.3], [89.4, 73.8]] },
  huegel: { seeds: [[60.7, 35.7], [21.9, 35.2], [29.2, 32.5]] },
  palmen: { seeds: [[86.1, 5.2], [86, 10.3], [82.5, 16.4], [86.3, 16], [88.1, 21.6]] }
}
const AUSMALEN_AUFGABEN: PaintJob[] = [
  { zone: 'himmel', color: 'blue', hint: 'Male den Himmel blau.' },
  { zone: 'wasser', tool: 'watercolor', hint: 'Male das Wasser mit Wasserfarbe.' },
  { zone: 'sonne', color: 'yellow', hint: 'Male die Sonne gelb.' },
  { zone: 'wolken', tool: 'chalk', hint: 'Male die Wolken mit Kreide.' },
  { zone: 'gewand', color: 'brown', hint: 'Male das Gewand von Johannes braun.' },
  { zone: 'baum', color: 'brown', hint: 'Male den Baumstamm braun.' },
  { zone: 'felsen', color: 'orange', hint: 'Male den Felsen rechts orange.' },
  { zone: 'huegel', color: 'orange', hint: 'Male die fernen Hügel orange.' },
  { zone: 'palmen', color: 'green', hint: 'Male die Palmenblätter grün.' }
]

export const johannes: Journey = {
  id: 'johannes',
  title: 'Johannes der Täufer',
  subtitle: 'Vom Engel im Tempel bis ins Gefängnis',
  age: '8-10',
  downloadMb: 14, // gemessen 24.11.2026: alle 103 Dateien von journeyFiles(johannes) = 13,22 MB, aufgerundet
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild (Variante b, Leitung 24.11.2026): Johannes ruft am Jordan mit der Hand am Mund, drei winzige Menschen fern; Konturzeichnung
  gift: { title: 'Johannes ruft am Jordan', image: `${PICS}geschenk-b.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): von Tempel und Bergland von Judäa durch die Wüste an den Jordan, nach Bethabara und Änon bis zum Gefängnis;
  // Stationen aus ergebnis/panorama-<Fassung>/map-johannes*.json, Perlenweg aus johannesPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/johannes/karte-pano-v1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0403, y: 0.7828, d: 0.0339 },
      { x: 0.1895, y: 0.2852, d: 0.0339 },
      { x: 0.2671, y: 0.5947, d: 0.0339 },
      { x: 0.3256, y: 0.3155, d: 0.0339 },
      { x: 0.4990, y: 0.4733, d: 0.0339 },
      { x: 0.5827, y: 0.2002, d: 0.0339 },
      { x: 0.6149, y: 0.7585, d: 0.0339 },
      { x: 0.6754, y: 0.2913, d: 0.0339 },
      { x: 0.8165, y: 0.6857, d: 0.0339 },
      { x: 0.9093, y: 0.3883, d: 0.0339 }
    ],
    exam: { x: 0.9577, y: 0.7524, d: 0.0339 },
    path: JOHANNES_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      music: 'audio/abenteuer/johannes/musik-tempel-v1.mp3',
      title: 'Der Engel im Tempel',
      ref: 'Lukas 1,5–16',
      text: [
        'Zacharias ist Priester. Er und seine Frau Elisabeth sind fromm und halten alle Gebote des HERRN. Sie haben kein Kind, und beide sind alt geworden.',
        'Eines Tages ist Zacharias an der Reihe, im Tempel zu räuchern. Draußen steht das Volk und betet. Da erscheint ihm ein Engel des HERRN. Er steht rechts am Räucheraltar. Zacharias erschrickt, und die Furcht kommt über ihn.',
        '„Fürchte dich nicht, Zacharias“, sagt der Engel. „Dein Gebet ist erhört. Deine Frau Elisabeth wird dir einen Sohn gebären, und du sollst ihn Johannes nennen.“',
        '„Du wirst Freude und Wonne haben, und viele werden sich über seine Geburt freuen. Er wird groß sein vor dem HERRN. Wein und starkes Getränk wird er nicht trinken. Schon im Mutterleib wird der Heilige Geist ihn erfüllen. Und viele aus Israel wird er zu Gott, ihrem HERRN, zurückführen.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was ist Zacharias von Beruf?', options: ['Priester', 'Hirte', 'Fischer'], answer: 0 },
        { q: 'Wo steht das Volk, während Zacharias im Tempel ist?', options: ['draußen', 'auf dem Dach', 'am Fluss'], answer: 0 },
        { q: 'Was wird der Sohn nicht trinken?', options: ['Wein und starkes Getränk', 'Milch und Honig', 'Wasser und Saft'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02-v2.webp`,
      music: 'audio/abenteuer/johannes/musik-tempel-v1.mp3',
      title: 'Zacharias muss schweigen',
      ref: 'Lukas 1,18–25',
      text: [
        'Zacharias fragt den Engel: „Woran soll ich das erkennen? Ich bin alt, und meine Frau ist betagt.“',
        '„Ich bin Gabriel, der vor Gott steht“, antwortet der Engel. „Ich bin gesandt, dir das zu verkünden. Du wirst verstummen und nicht reden können bis zu dem Tag, an dem das geschieht. Du hast meinen Worten nicht geglaubt. Sie werden erfüllt zu ihrer Zeit.“',
        'Draußen wartet das Volk und wundert sich, dass Zacharias so lange im Tempel bleibt. Als er herauskommt, kann er nicht mit ihnen reden. Er winkt ihnen zu. Sie merken, dass er im Tempel etwas gesehen hat.',
        'Als seine Dienstzeit zu Ende ist, geht er heim. Danach erwartet Elisabeth ein Kind und hält sich fünf Monate verborgen. „So hat der HERR an mir getan“, sagt sie. „Er hat mich angesehen und mir die Schande vor den Menschen genommen.“'
      ],
      // Spiel: Zeige es ihnen (gebaerde, neu)
      task: { kind: 'gebaerde', hint: 'Zacharias kann nicht reden. Zeige dem Volk mit den Händen, was er sagen will.', gestures: GEBAERDE },
      questions: [
        { q: 'Wie heißt der Engel?', options: ['Gabriel', 'Michael', 'Raphael'], answer: 0 },
        { q: 'Wie lange hält Elisabeth sich verborgen?', options: ['fünf Monate', 'drei Tage', 'ein Jahr'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      music: 'audio/abenteuer/johannes/musik-tempel-v1.mp3',
      title: 'Wie soll das Kind heißen?',
      ref: 'Lukas 1,57–66',
      text: [
        'Elisabeth bekommt einen Sohn. Die Nachbarn und Verwandten hören, wie gütig der HERR zu ihr gewesen ist, und freuen sich mit ihr.',
        'Am achten Tag kommen sie zum Kind. Sie wollen es nach seinem Vater nennen: Zacharias. Aber seine Mutter sagt: „Nein, er soll Johannes heißen.“ „Niemand in deiner Verwandtschaft heißt so“, sagen sie, und sie winken dem Vater zu: Wie will er das Kind nennen?',
        'Zacharias verlangt ein Täfelchen und schreibt darauf: „Er heißt Johannes.“ Alle staunen. Im selben Augenblick wird sein Mund aufgetan, und er redet und lobt Gott.',
        'Furcht und Staunen kommen über die Nachbarn, und im ganzen Bergland von Judäa erzählt man davon. Alle, die es hören, fragen sich: „Was wird wohl aus diesem Kind werden?“ Denn die Hand des HERRN ist mit ihm.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie wollen die Nachbarn das Kind zuerst nennen?', options: ['Zacharias', 'Gabriel', 'Elia'], answer: 0 },
        { q: 'Worauf schreibt Zacharias den Namen?', options: ['auf ein Täfelchen', 'auf ein Tuch', 'in den Sand'], answer: 0 },
        { q: 'Was tut Zacharias, als sein Mund aufgetan wird?', options: ['Er lobt Gott.', 'Er geht in den Tempel.', 'Er läuft fort.'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04.webp`,
      music: 'audio/abenteuer/johannes/musik-tempel-v1.mp3',
      title: 'Das Lied des Zacharias',
      ref: 'Lukas 1,67–80',
      text: [
        'Zacharias wird vom Heiligen Geist erfüllt. Er spricht: „Gelobt sei der HERR, der Gott Israels! Er hat sein Volk besucht und erlöst.“',
        'Dann spricht er zu dem Kind: „Und du, Kindlein, wirst ein Prophet des Höchsten heißen. Du wirst vor dem HERRN hergehen und seinen Weg bereiten.“',
        'Das Kind wächst und wird stark im Geist. Johannes lebt in der Wüste, bis die Zeit kommt, in der er vor das Volk Israel treten soll.'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt, Merkvers Lk 1,80a)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Was wird das Kind nach den Worten seines Vaters heißen?', options: ['Prophet des Höchsten', 'König von Israel', 'Priester im Tempel'], answer: 0 },
        { q: 'Wo lebt Johannes, bis er vor das Volk treten soll?', options: ['in der Wüste', 'in Jerusalem', 'am Meer'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      music: 'audio/abenteuer/johannes/musik-stimme-v1.mp3',
      title: 'Eine Stimme ruft',
      ref: 'Lukas 3,1–6',
      text: [
        'Viele Jahre sind vergangen. Johannes, der Sohn des Zacharias, ist in der Wüste. Da kommt das Wort Gottes zu ihm.',
        'Er geht in die ganze Gegend um den Jordan. Er sagt den Menschen, dass sie umkehren und neu anfangen sollen. Wer umkehrt und sich taufen lässt, steigt zu ihm in den Jordan, und Gott vergibt ihm, was er falsch gemacht hat.',
        'So steht es beim Propheten Jesaja: „Eine Stimme ruft in der Wüste: Bereitet den Weg des HERRN und macht seine Steige richtig! Alle Täler sollen voll werden, alle Berge und Hügel niedriger. Was krumm ist, soll gerade werden, und was uneben ist, soll eben werden. Und alle Menschen werden den Heiland Gottes sehen.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo ist Johannes, als das Wort Gottes zu ihm kommt?', options: ['in der Wüste', 'im Tempel', 'in Nazareth'], answer: 0 },
        { q: 'Was ruft die Stimme in der Wüste?', options: ['Bereitet den Weg des HERRN!', 'Baut eine Mauer!', 'Zündet ein Feuer an!'], answer: 0 },
        { q: 'Was soll mit allen Tälern geschehen?', options: ['Sie sollen voll werden.', 'Sie sollen austrocknen.', 'Sie sollen verschwinden.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      music: 'audio/abenteuer/johannes/musik-stimme-v1.mp3',
      title: 'Was sollen wir tun?',
      ref: 'Lukas 3,10–14',
      text: [
        'Die Leute fragen Johannes: „Was sollen wir denn tun?“ Er antwortet: „Wer zwei Röcke hat, soll einen davon dem geben, der keinen hat. Und wer zu essen hat, soll es ebenso machen.“',
        'Auch Zöllner kommen, die von den Leuten Geld für Zoll und Steuern einsammeln. „Meister, was sollen denn wir tun?“, fragen sie. „Verlangt nicht mehr, als euch festgesetzt ist“, sagt Johannes.',
        'Auch Soldaten fragen ihn: „Und was sollen wir tun?“ Johannes sagt: „Tut niemandem Gewalt oder Unrecht an, und seid zufrieden mit eurem Lohn.“'
      ],
      // Spiel: Wer zwei hat, gibt ab (abgeben, neu)
      task: { kind: 'abgeben', hint: 'Wer zwei hat, gibt einen ab. Reiche weiter, bis jeder einen hat.', giveAway: ABGEBEN },
      questions: [
        { q: 'Wer kommt außer den Leuten auch zu Johannes und fragt?', options: ['die Zöllner', 'die Fischer', 'die Priester'], answer: 0 },
        { q: 'Was sagt Johannes den Zöllnern?', options: ['Verlangt nicht mehr, als euch festgesetzt ist.', 'Zahlt mehr Steuern.', 'Geht nach Hause.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      music: 'audio/abenteuer/johannes/musik-stimme-v1.mp3',
      title: 'Wer bist du?',
      ref: 'Johannes 1,19–28',
      text: [
        'Johannes tauft in Bethabara, auf der anderen Seite des Jordans. Aus Jerusalem schickt man Priester und Leviten zu ihm. „Wer bist du?“, fragen sie.',
        'Johannes sagt offen: „Ich bin nicht der Christus.“ „Was denn? Bist du Elia?“ „Ich bin es nicht.“ „Bist du der Prophet?“ „Nein!“',
        '„Wer bist du dann?“, fragen sie. „Wir müssen denen Antwort geben, die uns gesandt haben. Was sagst du von dir selbst?“ Johannes antwortet: „Ich bin eine Stimme, die in der Wüste ruft: Richtet den Weg des HERRN! So hat es der Prophet Jesaja gesagt.“',
        '„Warum taufst du dann?“, fragen sie. „Ich taufe mit Wasser“, sagt Johannes. „Aber mitten unter euch steht einer, den ihr nicht kennt. Er kommt nach mir. Ich bin nicht wert, dass ich ihm die Schuhriemen löse.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Woher kommen die Priester und Leviten?', options: ['aus Jerusalem', 'aus Nazareth', 'aus Bethlehem'], answer: 0 },
        { q: 'Was sagt Johannes von sich selbst?', options: ['Ich bin eine Stimme in der Wüste.', 'Ich bin der Prophet.', 'Ich bin Elia.'], answer: 0 },
        { q: 'Wessen Schuhriemen ist Johannes nicht wert zu lösen?', options: ['des Mannes, der nach ihm kommt', 'des Königs', 'der Priester'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      music: 'audio/abenteuer/johannes/musik-stimme-v1.mp3',
      title: 'Siehe, das ist Gottes Lamm',
      ref: 'Johannes 1,29–37',
      text: [
        'Am nächsten Tag sieht Johannes Jesus zu sich kommen. „Siehe, das ist Gottes Lamm, das der Welt Sünde trägt!“, ruft er.',
        'Johannes erzählt: „Ich sah, dass der Geist wie eine Taube vom Himmel herabfuhr und auf ihm blieb. Ich kannte ihn nicht.“',
        '„Aber der mich gesandt hat, mit Wasser zu taufen, sagte zu mir: Auf wen du den Geist herabfahren und bleiben siehst, der tauft mit dem Heiligen Geist. Ich habe es gesehen und bezeuge: Dieser ist Gottes Sohn.“',
        'Am Tag darauf steht Johannes wieder dort, und zwei seiner Jünger sind bei ihm. Jesus geht vorüber. „Siehe, das ist Gottes Lamm!“, sagt Johannes. Die beiden Jünger hören es und folgen Jesus nach.'
      ],
      // Spiel: Wohin zeigt Johannes? (zeigen, neu)
      task: { kind: 'zeigen', hint: 'Johannes zeigt auf einen Mann. Tippe den Mann an, auf den er zeigt.', pointing: ZEIGEN },
      questions: [
        { q: 'Wie nennt Johannes Jesus?', options: ['Gottes Lamm', 'Gottes Hirte', 'Gottes Engel'], answer: 0 },
        { q: 'Wer folgt Jesus nach?', options: ['zwei Jünger des Johannes', 'die Priester aus Jerusalem', 'die Zöllner'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09-v2.webp`,
      music: 'audio/abenteuer/johannes/musik-aenon-v1.mp3',
      title: 'Er muss wachsen',
      ref: 'Johannes 3,22–30',
      text: [
        'Danach kommt Jesus mit seinen Jüngern ins jüdische Land und bleibt dort, und es wird getauft. Auch Johannes tauft noch, in Änon bei Salim, denn dort ist viel Wasser. Noch sitzt Johannes nicht im Gefängnis.',
        'Seine Jünger kommen zu ihm. „Meister“, sagen sie, „der bei dir war auf der anderen Seite des Jordans, von dem du Zeugnis gegeben hast, der tauft jetzt, und alle laufen zu ihm.“',
        'Johannes antwortet: „Ein Mensch kann nichts nehmen, es werde ihm denn gegeben vom Himmel. Ihr seid meine Zeugen, dass ich gesagt habe: Ich bin nicht der Christus, sondern vor ihm her gesandt.“',
        '„Wer die Braut hat, der ist der Bräutigam. Der Freund des Bräutigams aber steht da, hört ihm zu und freut sich sehr über die Stimme des Bräutigams. Diese meine Freude ist nun erfüllt. Er muss wachsen, ich aber muss abnehmen.“'
      ],
      // Spiel: Ausmalen (ausmalen, bekannt)
      task: { kind: 'ausmalen', hint: 'Male die Quellen von Änon aus.', image: `${G}ausmalen/etappe-09.webp`, zones: AUSMALEN_ZONEN, jobs: AUSMALEN_AUFGABEN, jobCount: 3 },
      questions: [
        { q: 'Warum tauft Johannes in Änon?', options: ['Dort ist viel Wasser.', 'Dort steht der Tempel.', 'Dort wohnt seine Mutter.'], answer: 0 },
        { q: 'Was sagt Johannes über den, zu dem alle laufen?', options: ['Er muss wachsen.', 'Er muss schweigen.', 'Er muss weggehen.'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10.webp`,
      music: 'audio/abenteuer/johannes/musik-aenon-v1.mp3',
      title: 'Im Gefängnis',
      ref: 'Matthäus 11,2–11; 14,3.12',
      text: [
        'Johannes sitzt im Gefängnis. Herodes, der Fürst in Galiläa, hat ihn festnehmen lassen, weil Johannes ihm gesagt hatte, was nicht recht war. Dort hört er von den Werken des Christus und schickt zwei seiner Jünger zu Jesus: „Bist du der, der da kommen soll, oder sollen wir auf einen anderen warten?“',
        'Jesus antwortet: „Sagt Johannes, was ihr seht und hört: Blinde sehen, Lahme gehen, Aussätzige werden rein, Taube hören, Tote stehen auf, und den Armen wird die gute Nachricht gesagt. Und selig ist, wer sich nicht an mir ärgert.“',
        'Zu den Leuten sagt Jesus über Johannes: „Was seid ihr hinausgegangen in die Wüste zu sehen? Einen Propheten? Ja, ich sage euch: Er ist mehr als ein Prophet. Unter allen, die von Frauen geboren sind, ist keiner größer als Johannes der Täufer.“',
        'Später starb Johannes, und seine Jünger kamen, begruben ihn und sagten es Jesus.'
      ],
      // nur Fragen (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was lässt Johannes Jesus fragen?', options: ['Bist du der, der da kommen soll?', 'Wo wohnst du?', 'Wann kommst du zu mir?'], answer: 0 },
        { q: 'Was sagt Jesus den Boten?', options: ['Blinde sehen, und Lahme gehen.', 'Die Berge werden niedriger.', 'Der Tempel steht noch.'], answer: 0 },
        { q: 'Was sagt Jesus über Johannes?', options: ['Er ist mehr als ein Prophet.', 'Er ist ein König.', 'Er ist ein Hirte.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißt der Engel, der Zacharias das Kind verspricht?', options: ['Gabriel', 'Michael', 'Raphael'], answer: 0 },
    { q: 'Worauf schreibt Zacharias den Namen seines Sohnes?', options: ['auf ein Täfelchen', 'auf ein Tuch', 'in den Sand'], answer: 0 },
    { q: 'Was ruft die Stimme in der Wüste?', options: ['Bereitet den Weg des HERRN!', 'Baut eine Mauer!', 'Zündet ein Feuer an!'], answer: 0 },
    { q: 'Was sagt Johannes von sich selbst?', options: ['Ich bin eine Stimme in der Wüste.', 'Ich bin der Prophet.', 'Ich bin Elia.'], answer: 0 },
    { q: 'Wie nennt Johannes Jesus?', options: ['Gottes Lamm', 'Gottes Hirte', 'Gottes Engel'], answer: 0 },
    { q: 'Was sagt Jesus über Johannes?', options: ['Er ist mehr als ein Prophet.', 'Er ist ein König.', 'Er ist ein Hirte.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of johannes.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-vK.mp3"; K is the version, a re-recorded story gets a new number); until a recording is made the app reads with the voice of the device.
// stage -> version of the file in public/audio/abenteuer/johannes/ (written by bauen_johannes.py from the files that exist and ergebnis/geltend.json)
const RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 3, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3 }
for (const s of johannes.stages) {
  const version = RECORDING_VERSION[s.id]
  const file = version ? `audio/abenteuer/johannes/geschichte-${String(s.id).padStart(2, '0')}-v${version}.mp3` : undefined
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria; they follow one another at random (a stage with its own `music` plays exactly that piece)
johannes.music = [
  'audio/abenteuer/johannes/musik-tempel-v1.mp3',
  'audio/abenteuer/johannes/musik-stimme-v1.mp3',
  'audio/abenteuer/johannes/musik-aenon-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(johannes, johannesEn)
