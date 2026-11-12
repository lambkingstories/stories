/**
 * Abenteuer "Die Bergpredigt" (Matthäus 4,25 bis 7,29 ohne das Haus auf dem Felsen, Mt 7,24–27, das in "Geschichten von Jesus" Etappe 11 steht; id `bergpredigt`) für 7 bis 10 Jahre: 9 Etappen,
 * Untertitel "Von den Seligpreisungen bis zur goldenen Regel". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Jesus kommt mit Gesicht vor (immer dasselbe Gesicht); Gott der Vater ist nie im Bild, die Schlange (Etappe 8) und die Verfolgung (Etappe 3) stehen nur im Text. Kein Kreuz, kein Blut, keine Waffen.
 * Die Texte stehen so da, wie der Entwurf sie hat (Luther 1912, kindgerecht erzählt). Merkvers: Matthäus 7,7 (Lückenvers in Etappe 8).
 * Quelle der Texte: D:/Claude/Abenteuer-Bergpredigt/ENTWURF_Bergpredigt.md, Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Antons Regel 5.11.2026: höchstens zwei bekannte Spiele, nie hintereinander): 2 Wem gilt das Wort? (selig, neu), 4 Wohin gehört das Licht? (scheffel, neu), 6 Ausmalen (ausmalen, bekannt),
 * 7 Schau genau hin (nahblick, neu), 8 Lückenvers (lueckenvers, bekannt, Merkvers Mt 7,7); die Etappen 1, 3, 5 und 9 nur Fragen.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/bergpredigt/, images/abenteuer/spiele/bergpredigt/<spiel>/, audio/abenteuer/bergpredigt/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 * ERZEUGT von D:/Claude/Abenteuer-Bergpredigt/tools/bauen_bergpredigt.py: nicht von Hand ändern.
 */
import type { Journey, VerseGame } from '@/types/adventure'
import type { BlessedGame, LightStandGame, NearViewGame } from '@/utils/bergpredigtNeu'
import { josef } from './josef'
import { BERGPREDIGT_PATH } from './bergpredigtPath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { bergpredigtEn } from './en/bergpredigt.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/bergpredigt/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/bergpredigt/'

const G = 'images/abenteuer/spiele/bergpredigt/'

/**
 * Etappe 2, "Wem gilt das Wort?" (neu, `selig`, Mt 5,3–6): vier Zuhörer auf der Hangwiese; das Kind gibt jedem, was Jesus ihm zusagt (Tor des Himmelreichs, Tuch, Stück Land, Brot und Krug).
 * Runde 1: der Satz steht da, seine Gabe liegt allein und leuchtet; Runde 2: sechs Gaben für vier Menschen (Truhe und Königsmantel gehören keinem), am Ende die vier Sätze noch einmal.
 * Die Sätze sind die Sätze der Etappe 2 (aus dem Entwurf gelesen). Die Zuordnung Zuhörer zu Wort ist Ausgestaltung (Prüfbericht D). Lagen VORLÄUFIG, am gemalten Bild nachmessen (tools/_massen_bergpredigt.json).
 * Bilder (`spiele/bergpredigt/selig/`): `wiese`, `mann-leer`, `frau-traenen`, `hirte`, `junger-mann` (je 320 × 360), `gabe-himmelreich|trost|land|brot`, `ablenker-truhe|mantel` (je 200 × 200), `korb` (240 × 200), `leuchten` (400 × 400).
 */
const SELIG: BlessedGame = {
  background: `${G}selig/wiese.webp`,
  ratio: 1.5,
  peopleRatio: 0.889,
  people: [
    { id: 'mann-leer', image: `${G}selig/mann-leer.webp`, label: 'der Mann mit den leeren Händen', x: 34, y: 80, w: 25 },
    { id: 'frau-traenen', image: `${G}selig/frau-traenen.webp`, label: 'die Frau, die sich über die Augen wischt', x: 69, y: 70, w: 21 },
    { id: 'hirte', image: `${G}selig/hirte.webp`, label: 'der Hirte mit seinem Stab', x: 12, y: 64, w: 20 },
    { id: 'junger-mann', image: `${G}selig/junger-mann.webp`, label: 'der junge Mann, der sich weit vorbeugt', x: 52, y: 58, w: 17 }
  ],
  gifts: [
    { id: 'gabe-himmelreich', image: `${G}selig/gabe-himmelreich.webp`, label: 'das offene Tor des Himmelreichs', caption: 'Himmelreich', forPerson: 'mann-leer' },
    { id: 'gabe-trost', image: `${G}selig/gabe-trost.webp`, label: 'ein weiches Tuch', caption: 'Trost', forPerson: 'frau-traenen' },
    { id: 'gabe-land', image: `${G}selig/gabe-land.webp`, label: 'ein Stück grünes Land', caption: 'Land', forPerson: 'hirte' },
    { id: 'gabe-brot', image: `${G}selig/gabe-brot.webp`, label: 'Brot und ein Krug Wasser', caption: 'Satt werden', forPerson: 'junger-mann' },
    { id: 'ablenker-truhe', image: `${G}selig/ablenker-truhe.webp`, label: 'eine Truhe mit Goldstücken', caption: 'Goldtruhe' },
    { id: 'ablenker-mantel', image: `${G}selig/ablenker-mantel.webp`, label: 'ein Königsmantel', caption: 'Königsmantel' }
  ],
  basket: `${G}selig/korb.webp`,
  glow: `${G}selig/leuchten.webp`,
  sentences: [
    { personId: 'mann-leer', text: 'Selig sind, die arm sind vor Gott. Denn das Himmelreich gehört ihnen.' },
    { personId: 'frau-traenen', text: 'Selig sind, die Leid tragen. Denn sie sollen getröstet werden.' },
    { personId: 'hirte', text: 'Selig sind die Sanftmütigen. Denn sie werden das Land besitzen.' },
    { personId: 'junger-mann', text: 'Selig sind, die Hunger und Durst haben nach dem, was recht ist. Denn sie sollen satt werden.' }
  ],
  rounds: [
    { hint: 'Gib jedem Zuhörer, was Jesus ihm zusagt.', mode: 'sentence', order: ['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'] },
    { hint: 'Wer bekommt welche Gabe? Zwei Gaben bleiben übrig.', mode: 'free', order: ['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'] }
  ]
}

/**
 * Etappe 4, "Wohin gehört das Licht?" (neu, `scheffel`, Mt 5,15–16): eine Stube im Querschnitt; Runde 1: die Lampe brennt unter einem Korb auf dem Tisch, das Kind hebt den Korb ab und stellt die Lampe
 * auf den Leuchter; Runde 2: fünf Menschen an verschiedenen Orten, die Lampe kann auf dem Boden, auf dem Tisch oder auf dem Leuchter stehen, nur der Leuchter erreicht alle. Das Licht ist ein weicher Kreis
 * (`radius` in Prozent der Bildbreite); die dunkle und die helle Stube sind dasselbe Bild (ohne dunkle Fassung dunkelt der Code die helle ab). Lagen VORLÄUFIG, am gemalten Bild nachmessen.
 * Bilder (`spiele/bergpredigt/scheffel/`): `stube-klein-dunkel|hell`, `stube-gross-dunkel|hell` (je 1500 × 1000), `korb` (360 × 260), `lampe-aus|an` (je 160 × 140), `leuchter` (200 × 520), `person-mutter|kind|grossvater|vater|maedchen` (je 220 × 320).
 */
const SCHEFFEL: LightStandGame = {
  ratio: 1.5,
  peopleRatio: 0.688,
  basket: `${G}scheffel/korb.webp`,
  lampOff: `${G}scheffel/lampe-aus.webp`,
  lampOn: `${G}scheffel/lampe-an.webp`,
  lampW: 8,
  stand: { image: `${G}scheffel/leuchter.webp`, w: 11 },
  rooms: [
    {
      hint: 'Hebe den Korb ab und stelle die Lampe auf den Leuchter.',
      bright: `${G}scheffel/stube-klein-hell.webp`,
      dark: `${G}scheffel/stube-klein-dunkel.webp`,
      people: [
        { id: 'mutter', image: `${G}scheffel/person-mutter.webp`, label: 'Die Mutter', x: 44, y: 82, w: 19 },
        { id: 'kind', image: `${G}scheffel/person-kind.webp`, label: 'Das Kind', x: 86, y: 92, w: 21 }
      ],
      spots: [{ id: 'boden', x: 72, y: 87, radius: 24 }, { id: 'tisch', x: 31, y: 58.5, radius: 24 }, { id: 'leuchter', x: 64, y: 44, radius: 36 }], basket: { x: 31, y: 60.3, w: 12 }
    },
    {
      hint: 'Stelle die Lampe so hin, dass alle im Haus ihr Licht sehen.',
      bright: `${G}scheffel/stube-gross-hell.webp`,
      dark: `${G}scheffel/stube-gross-dunkel.webp`,
      people: [
        { id: 'grossvater', image: `${G}scheffel/person-grossvater.webp`, label: 'Der Großvater', x: 27, y: 66, w: 15 },
        { id: 'maedchen', image: `${G}scheffel/person-maedchen.webp`, label: 'Das Mädchen', x: 9, y: 80, w: 18 },
        { id: 'kind', image: `${G}scheffel/person-kind.webp`, label: 'Das Kind', x: 21, y: 94, w: 21 },
        { id: 'vater', image: `${G}scheffel/person-vater.webp`, label: 'Der Vater', x: 62, y: 78, w: 19 },
        { id: 'mutter', image: `${G}scheffel/person-mutter.webp`, label: 'Die Mutter', x: 89, y: 82, w: 19 }
      ],
      spots: [{ id: 'boden', x: 45, y: 88, radius: 29 }, { id: 'tisch', x: 40, y: 60, radius: 26 }, { id: 'leuchter', x: 52, y: 36, radius: 52 }]
    }
  ]
}

/**
 * Etappe 7, "Schau genau hin" (neu, `nahblick`, Mt 6,28): ein Kranz aus Olivenzweigen als Blickfenster über der Blumenwiese (keine Lupe aus Glas: Anachronismus, Entscheidung der Leitung); deckt er
 * mindestens die Hälfte einer Blüte (`minCover`), zeigt er sie ganz nah, und auf manchen Blüten sitzt ein Gast, der sonst nicht zu sehen ist. Runde 1: drei Blüten links (die anderen unter dem Dunst),
 * zwei Gäste; Runde 2: alle sieben Blüten, vier Gäste. Die Gäste sind Ausgestaltung (Prüfbericht D). Lagen VORLÄUFIG, am gemalten Bild nachmessen.
 * Bilder (`spiele/bergpredigt/nahblick/`): `wiese` (1500 × 1000), `nah-1` … `nah-7` (je 700 × 700), `gast-biene|marienkaefer|schmetterling|grille` (je 300 × 300), `kranz` (700 × 700), `dunst` (1500 × 1000).
 */
const NAHBLICK: NearViewGame = {
  background: `${G}nahblick/wiese.webp`,
  ratio: 1.5,
  haze: `${G}nahblick/dunst.webp`,
  wreath: { image: `${G}nahblick/kranz.webp`, w: 28, minCover: 0.5 },
  blooms: [
    { id: 'b1', x: 8.3, y: 31.5, w: 14.5, nearImage: `${G}nahblick/nah-1.webp`, spot: { nx: 66, ny: 69, nw: 45 } },
    { id: 'b2', x: 22.8, y: 52.5, w: 20, nearImage: `${G}nahblick/nah-2.webp`, spot: { nx: 34, ny: 69, nw: 45 } },
    { id: 'b3', x: 35, y: 30, w: 16.5, nearImage: `${G}nahblick/nah-3.webp`, spot: { nx: 66, ny: 69, nw: 45 } },
    { id: 'b4', x: 49.7, y: 50.2, w: 21.5, nearImage: `${G}nahblick/nah-4.webp`, spot: { nx: 34, ny: 69, nw: 45 } },
    { id: 'b5', x: 62.7, y: 30, w: 12, nearImage: `${G}nahblick/nah-5.webp`, spot: { nx: 66, ny: 69, nw: 45 } },
    { id: 'b6', x: 75.7, y: 53.7, w: 19, nearImage: `${G}nahblick/nah-6.webp`, spot: { nx: 34, ny: 69, nw: 45 } },
    { id: 'b7', x: 89.7, y: 32.2, w: 17, nearImage: `${G}nahblick/nah-7.webp`, spot: { nx: 66, ny: 69, nw: 45 } }
  ],
  guests: [
    { id: 'biene', image: `${G}nahblick/gast-biene.webp`, label: 'Eine Biene' },
    { id: 'marienkaefer', image: `${G}nahblick/gast-marienkaefer.webp`, label: 'Ein Marienkäfer' },
    { id: 'schmetterling', image: `${G}nahblick/gast-schmetterling.webp`, label: 'Ein Schmetterling' },
    { id: 'grille', image: `${G}nahblick/gast-grille.webp`, label: 'Eine Grille' }
  ],
  rounds: [
    { hint: 'Fahre mit dem Kranz über die Blumen und finde, wer in den Blüten sitzt.', bloomIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'], hidden: ['b4', 'b5', 'b6', 'b7'], sits: [{ bloomId: 'b1', guestId: 'biene' }, { bloomId: 'b3', guestId: 'marienkaefer' }] },
    { hint: 'Schau jede Blüte genau an. Vier Gäste sitzen auf der Wiese.', bloomIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'], hidden: [], sits: [{ bloomId: 'b2', guestId: 'schmetterling' }, { bloomId: 'b4', guestId: 'biene' }, { bloomId: 'b6', guestId: 'grille' }, { bloomId: 'b7', guestId: 'marienkaefer' }] }
  ]
}

/**
 * Etappe 8, "Lückenvers" (bekannt 2, Mt 7,7, der Merkvers): der Vers steht im Wortlaut von Luther 1912. Tafel und Blatt wie in allen Abenteuern (aus `spiele/pfingsten/lueckenvers/` kopiert),
 * Hintergrund `hintergrund/vers-hintergrund` (die Wiese im Abendlicht, lange Schatten, ohne Menschen).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Setze das fehlende Wort in den Vers.', parts: ['Bittet, so wird euch ', '.'], words: ['gegeben', 'verboten', 'versprochen'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Suchet, so werdet ihr ', '; klopfet an, so wird euch ', '.'], words: ['finden', 'aufgetan', 'verlieren', 'zugeschlossen'], answers: [0, 1] }
  ]
}

export const bergpredigt: Journey = {
  id: 'bergpredigt',
  title: 'Die Bergpredigt',
  subtitle: 'Von den Seligpreisungen bis zur goldenen Regel',
  age: '8-10',
  downloadMb: 13, // GESCHÄTZT (noch nicht alle Dateien in public/); messen: alle Dateien von journeyFiles(bergpredigt), aufgerundet
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: Lilien auf dem Feld (eine Wiese mit Lilien und anderen Blumen, ein Vogel im Flug, im Hintergrund der Berg und die Stadt auf dem Hügel; ohne Menschen, ohne Schrift; Konturzeichnung)
  gift: { title: 'Lilien auf dem Feld', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell): ein einziger Berg und der Tag, der darüber läuft, vom Pfad am Fuß des Berges bis zum Abstieg ins Tal;
  // Stationen aus ergebnis/panorama-v6/map-bergpredigt-v6.json, Perlenweg aus bergpredigtPath.ts
  map: {
    images: [1, 2, 3].map((n) => `images/abenteuer/bergpredigt/karte-pano-v6-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0958, y: 0.6857, d: 0.0339 },
      { x: 0.1966, y: 0.6159, d: 0.0339 },
      { x: 0.2974, y: 0.6584, d: 0.0339 },
      { x: 0.4441, y: 0.6705, d: 0.0339 },
      { x: 0.5292, y: 0.6808, d: 0.0339 },
      { x: 0.6149, y: 0.6705, d: 0.0339 },
      { x: 0.7339, y: 0.7373, d: 0.0339 },
      { x: 0.8457, y: 0.7373, d: 0.0339 },
      { x: 0.9173, y: 0.7494, d: 0.0339 }
    ],
    exam: { x: 0.9839, y: 0.7282, d: 0.0339 },
    path: BERGPREDIGT_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-morgen-v1.mp3',
      title: 'Auf den Berg',
      ref: 'Matthäus 4,25 bis 5,2',
      text: [
        'Viele Menschen laufen hinter Jesus her. Sie kommen aus Galiläa und aus Jerusalem, aus Judäa und von der anderen Seite des Jordans. Manche haben einen weiten Weg hinter sich.',
        'Als Jesus die vielen Leute sieht, steigt er auf einen Berg. Der Pfad ist schmal, und sie gehen hintereinander hinauf, die Kinder an der Hand.',
        'Oben liegt eine Wiese. Jesus setzt sich ins Gras, und seine Jünger kommen zu ihm und setzen sich dicht neben ihn. Ringsum lassen sich die Leute nieder, Alte und Junge, Mütter mit ihren Kindern auf dem Schoß.',
        'Der Wind streicht durchs Gras. Dann wird es still. Jesus öffnet den Mund und beginnt zu sprechen.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin steigt Jesus, als er die vielen Menschen sieht?', options: ['auf einen Berg', 'in ein Boot', 'auf einen Turm'], answer: 0 },
        { q: 'Wer setzt sich dicht neben Jesus ins Gras?', options: ['seine Jünger', 'die Soldaten', 'die Priester'], answer: 0 },
        { q: 'Was tut Jesus, als es still wird?', options: ['Er öffnet den Mund und beginnt zu sprechen.', 'Er singt ein Lied.', 'Er geht den Berg wieder hinunter.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-morgen-v1.mp3',
      title: 'Selig sind',
      ref: 'Matthäus 5,3–6',
      text: [
        'Jesus blickt in die Gesichter. Ganz vorn sitzt ein Mann und hält die leeren Hände im Schoß.',
        '„Selig sind, die arm sind vor Gott“, sagt Jesus. „Denn das Himmelreich gehört ihnen.“',
        'Eine Frau in der zweiten Reihe wischt sich über die Augen. „Selig sind, die Leid tragen. Denn sie sollen getröstet werden.“',
        'Am Rand lehnt ein Hirte auf seinem Stab und hört ruhig zu. „Selig sind die Sanftmütigen. Denn sie werden das Land besitzen.“',
        'Ganz hinten sitzt ein junger Mann weit vorgebeugt, als wollte er kein Wort verpassen. „Selig sind, die Hunger und Durst haben nach dem, was recht ist. Denn sie sollen satt werden.“'
      ],
      // Spiel: Wem gilt das Wort? (selig, neu)
      task: { kind: 'selig', hint: 'Gib jedem Zuhörer, was Jesus ihm zusagt.', blessed: SELIG },
      questions: [
        { q: 'Worauf lehnt sich der Hirte am Rand?', options: ['auf seinen Stab', 'auf einen Baum', 'auf eine Mauer'], answer: 0 },
        { q: 'Wer wischt sich über die Augen?', options: ['eine Frau in der zweiten Reihe', 'ein Kind ganz vorn', 'der Hirte am Rand'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-morgen-v1.mp3',
      title: 'Seid fröhlich und getrost',
      ref: 'Matthäus 5,7–12',
      text: [
        'Die Sonne steigt höher, und Jesus spricht weiter. In der Menge flüstert keiner mehr.',
        '„Selig sind die Barmherzigen. Denn sie werden Barmherzigkeit erfahren.“',
        'Ein kleines Mädchen in der ersten Reihe sieht Jesus die ganze Zeit ins Gesicht. „Selig sind, die reinen Herzens sind. Denn sie werden Gott schauen.“',
        '„Selig sind die Friedfertigen. Denn sie werden Gottes Kinder heißen. Selig sind, die verfolgt werden, weil sie tun, was recht ist. Denn das Himmelreich gehört ihnen.“',
        'Jesus sieht zu seinen Jüngern hin. „Selig seid ihr, wenn euch die Leute um meinetwillen beschimpfen und Böses über euch reden, das nicht wahr ist. Seid fröhlich und getrost! Im Himmel wird es euch reich belohnt werden.“'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie werden die Friedfertigen heißen?', options: ['Gottes Kinder', 'Gottes Boten', 'Gottes Knechte'], answer: 0 },
        { q: 'Wer sieht Jesus die ganze Zeit ins Gesicht?', options: ['ein kleines Mädchen', 'ein alter Hirte', 'ein junger Fischer'], answer: 0 },
        { q: 'Wie sollen die Jünger sein, wenn man sie beschimpft?', options: ['fröhlich und getrost', 'zornig und laut', 'traurig und still'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-v2.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-wiese-v1.mp3',
      title: 'Salz und Licht',
      ref: 'Matthäus 5,13–16',
      text: [
        'Jesus sieht seine Jünger an, einen nach dem anderen. „Ihr seid das Salz der Erde“, sagt er. „Wenn das Salz seine Kraft verliert, womit soll man es wieder salzig machen?“',
        'Dann zeigt er über die Wiese hinweg. Auf dem Hügel gegenüber liegt eine Stadt, weiß in der Mittagssonne. „Ihr seid das Licht der Welt. Es kann die Stadt, die auf einem Berge liegt, nicht verborgen sein.“',
        'Jesus spricht leiser. „Niemand zündet ein Licht an und stülpt einen Korb darüber. Man stellt es auf den Leuchter, dann leuchtet es allen im Haus.“',
        '„So lasst euer Licht leuchten vor den Menschen“, sagt er. „Dann sehen sie, was ihr Gutes tut, und loben euren Vater im Himmel.“',
        'Drüben auf dem Hügel blitzt ein Fenster in der Sonne.'
      ],
      // Spiel: Wohin gehört das Licht? (scheffel, neu)
      task: { kind: 'scheffel', hint: 'Befreie die Lampe und stelle sie dorthin, wo alle im Haus ihr Licht sehen.', lightStand: SCHEFFEL },
      questions: [
        { q: 'Was liegt auf dem Hügel gegenüber?', options: ['eine Stadt', 'ein Zelt', 'ein Wald'], answer: 0 },
        { q: 'Wen sollen die Menschen loben, wenn sie das Gute sehen?', options: ['den Vater im Himmel', 'die Jünger', 'den König'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-wiese-v1.mp3',
      title: 'Unser Vater',
      ref: 'Matthäus 6,6 und 6,8–13',
      text: [
        'Es ist still geworden auf der Wiese. Nur der Wind ist zu hören. Jesus spricht vom Beten.',
        '„Wenn du betest, dann geh in deine kleine Kammer und schließ die Tür zu. Bete dort zu deinem Vater, der im Verborgenen ist. Dein Vater sieht dich auch dort.“',
        '„Euer Vater weiß, was ihr braucht, noch ehe ihr ihn bittet. Darum sollt ihr so beten:“',
        '„Unser Vater in dem Himmel! Dein Name werde geheiligt. Dein Reich komme. Dein Wille geschehe auf Erden wie im Himmel.“',
        '„Unser täglich Brot gib uns heute. Und vergib uns unsere Schuld, wie wir unseren Schuldigern vergeben. Und führe uns nicht in Versuchung, sondern erlöse uns von dem Übel. Denn dein ist das Reich und die Kraft und die Herrlichkeit in Ewigkeit. Amen.“',
        'Lange spricht keiner ein Wort.'
      ],
      // nur Fragen (Gebet)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin soll man gehen, wenn man ganz für sich zu seinem Vater beten will?', options: ['in seine kleine Kammer', 'auf den Marktplatz', 'auf den höchsten Berg'], answer: 0 },
        { q: 'Was weiß der Vater, noch ehe die Menschen ihn bitten?', options: ['was sie brauchen', 'wo sie wohnen', 'wie weit der Weg ist'], answer: 0 },
        { q: 'Worum bitten die Menschen im Vaterunser für heute?', options: ['um das tägliche Brot', 'um ein neues Haus', 'um viel Geld'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-wiese-v1.mp3',
      title: 'Seht die Vögel',
      ref: 'Matthäus 6,25–26',
      text: [
        'Der Mittag ist vorbei. Über der Wiese ziehen Vögel durch die Luft, und Jesus sieht ihnen nach.',
        '„Sorgt euch nicht um euer Leben“, sagt er, „was ihr essen und trinken werdet. Und sorgt euch nicht um euren Leib, was ihr anziehen werdet. Ist nicht das Leben mehr als das Essen und der Leib mehr als die Kleidung?“',
        '„Seht die Vögel unter dem Himmel an. Sie säen nicht, sie ernten nicht, und sie sammeln nichts in Scheunen. Und euer Vater im Himmel gibt ihnen doch zu essen.“',
        'Ein kleiner Vogel landet im Gras, ganz nah bei den Kindern. Er pickt einmal und fliegt wieder auf. „Seid ihr nicht viel mehr wert als sie?“'
      ],
      // Spiel: Ausmalen (ausmalen, bekannt)
      task: { kind: 'ausmalen', hint: 'Male die Vögel unter dem Himmel aus.', image: `${G}ausmalen/etappe-06.webp` },
      questions: [
        { q: 'Was tun die Vögel nicht?', options: ['Sie säen nicht und ernten nicht.', 'Sie fliegen nicht.', 'Sie singen nicht.'], answer: 0 },
        { q: 'Wer gibt den Vögeln zu essen?', options: ['euer Vater im Himmel', 'der Bauer', 'der König'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-wiese-v1.mp3',
      title: 'Schaut die Lilien',
      ref: 'Matthäus 6,28–30 und 6,34',
      text: [
        'Zwischen den Gräsern blühen Blumen, rote und gelbe und weiße. Jesus streicht mit der Hand über sie hin.',
        '„Und warum sorgt ihr euch um Kleidung? Schaut die Lilien auf dem Feld an, wie sie wachsen. Sie arbeiten nicht, und sie spinnen keinen Faden.“',
        '„Aber ich sage euch: Auch Salomo in all seiner Pracht war nicht so schön gekleidet wie eine von ihnen.“',
        '„Das Gras auf dem Feld steht heute da und wird morgen in den Ofen geworfen. Und Gott kleidet es doch so. Sollte er nicht viel mehr euch kleiden?“',
        '„Darum sorgt nicht um den morgigen Tag. Der morgige Tag wird für sich selber sorgen.“',
        'Ein Windstoß biegt die Blumen, und eine Biene summt weiter von Blüte zu Blüte.'
      ],
      // Spiel: Schau genau hin (nahblick, neu)
      task: { kind: 'nahblick', hint: 'Schau durch den Zweigkranz genau hin und finde, wer in den Blumen sitzt.', nearView: NAHBLICK },
      questions: [
        { q: 'Wer war in all seiner Pracht nicht so schön gekleidet wie eine Lilie?', options: ['Salomo', 'der Hirte', 'ein Jünger'], answer: 0 },
        { q: 'Was geschieht morgen mit dem Gras, das heute auf dem Feld steht?', options: ['Es wird in den Ofen geworfen.', 'Es wird abgemäht und verkauft.', 'Es wird auf den Berg getragen.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-abend-v1.mp3',
      title: 'Bittet',
      ref: 'Matthäus 7,7–11',
      text: [
        'Die Schatten werden länger. Jesus sieht zu den Vätern und Müttern hin.',
        '„Bittet, so wird euch gegeben; suchet, so werdet ihr finden; klopfet an, so wird euch aufgetan.“',
        'Nahe bei Jesus sitzt ein Vater, sein kleiner Sohn hat den Kopf an seine Schulter gelegt. „Welcher unter euch gibt seinem Sohn einen Stein, wenn der ihn um Brot bittet?“, fragt Jesus. „Oder eine Schlange, wenn er um einen Fisch bittet?“',
        'Der Vater lächelt und schüttelt den Kopf.',
        '„Ihr seid nicht ohne Fehler, und doch gebt ihr euren Kindern gute Gaben. Wie viel mehr wird euer Vater im Himmel Gutes geben denen, die ihn bitten!“'
      ],
      // Spiel: Lückenvers (lueckenvers, bekannt, Merkvers Mt 7,7)
      task: { kind: 'lueckenvers', hint: 'Setze das fehlende Wort in den Vers.', verse: VERS },
      questions: [
        { q: 'Was gibt kein Vater seinem Sohn, wenn der ihn um Brot bittet?', options: ['einen Stein', 'eine Münze', 'einen Becher'], answer: 0 },
        { q: 'Wer wird Gutes geben denen, die ihn bitten?', options: ['euer Vater im Himmel', 'der Hirte', 'der Nachbar'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      music: 'audio/abenteuer/bergpredigt/musik-abend-v1.mp3',
      title: 'Alles, was ihr wollt',
      ref: 'Matthäus 7,12 und 7,28 bis 8,1',
      text: [
        'Die Sonne steht tief über dem Land. Die Schatten der Menschen fallen lang über die Wiese.',
        '„Alles nun, was ihr wollt, dass euch die Leute tun sollen, das tut ihr ihnen auch“, sagt Jesus.',
        'Jesus spricht noch weiter. Dann hat er seine Rede vollendet. Es bleibt lange still. Die Menschen sitzen noch da und sehen Jesus an. Sie staunen über seine Worte. Denn er hat gesprochen wie einer, der Macht hat, und nicht wie ihre Schriftgelehrten.',
        'Langsam stehen sie auf und gehen den Berg hinunter, die Mütter mit den Kindern an der Hand. Jesus geht mit ihnen hinab, und viele folgen ihm. Drüben auf dem Hügel gehen in der Stadt die ersten Lichter an.'
      ],
      // nur Fragen
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was sollen die Menschen den anderen tun?', options: ['was sie sich selbst von ihnen wünschen', 'was die anderen zuerst getan haben', 'was der König befiehlt'], answer: 0 },
        { q: 'Worüber staunen die Menschen?', options: ['über seine Worte', 'über ein Feuer am Himmel', 'über ein Wunder am See'], answer: 0 },
        { q: 'Was geht in der Stadt auf dem Hügel an?', options: ['die ersten Lichter', 'die Stadttore', 'ein großer Markt'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wohin steigt Jesus, als er die vielen Menschen sieht?', options: ['auf einen Berg', 'in ein Boot', 'auf einen Turm'], answer: 0 },
    { q: 'Wie werden die Friedfertigen heißen?', options: ['Gottes Kinder', 'Gottes Boten', 'Gottes Knechte'], answer: 0 },
    { q: 'Was liegt auf dem Hügel gegenüber?', options: ['eine Stadt', 'ein Zelt', 'ein Wald'], answer: 0 },
    { q: 'Was weiß der Vater, noch ehe die Menschen ihn bitten?', options: ['was sie brauchen', 'wo sie wohnen', 'wie weit der Weg ist'], answer: 0 },
    { q: 'Wer war in all seiner Pracht nicht so schön gekleidet wie eine Lilie?', options: ['Salomo', 'der Hirte', 'ein Jünger'], answer: 0 },
    { q: 'Was geht in der Stadt auf dem Hügel an, als es Abend wird?', options: ['die ersten Lichter', 'die Stadttore', 'ein großer Markt'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of bergpredigt.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-vK.mp3"; K is the version, a re-recorded story gets a new number); until a recording is made the app reads with the voice of the device.
// stage -> version of the file in public/audio/abenteuer/bergpredigt/ (written by bauen_bergpredigt.py from the files that exist)
const RECORDING_VERSION: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 1, 8: 2, 9: 2 }
for (const s of bergpredigt.stages) {
  const version = RECORDING_VERSION[s.id]
  const file = version ? `audio/abenteuer/bergpredigt/geschichte-${String(s.id).padStart(2, '0')}-v${version}.mp3` : undefined
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria; they follow one another at random (a stage with its own `music` plays exactly that piece)
bergpredigt.music = [
  'audio/abenteuer/bergpredigt/musik-morgen-v1.mp3',
  'audio/abenteuer/bergpredigt/musik-abend-v1.mp3',
  'audio/abenteuer/bergpredigt/musik-wiese-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(bergpredigt, bergpredigtEn)
