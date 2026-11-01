/**
 * Die Daten von sieben weiteren neuen Spielen des Abenteuers "Das Volk in der Wüste" (`wueste.ts` nimmt sie in die Etappen 1, 4, 6, 9, 11, 12 und 14): Wasser holen, Genug!, Wachteln im Wind,
 * Aarons Stab, das Zeichen aus Bronze, der Eselin folgen und Josua einsetzen. Orte in Prozent des Bildes (4:3), `y` ist die Unterkante, `x` die Mitte, `w` die Breite. Die Texte stehen hier, damit das
 * englische Overlay (`en/wuesteGames2.en.ts`) sie wie alle anderen Texte übersetzt. Die Regeln stehen in `src/utils/wuesteGames2.ts`, die Bauteile heißen `GameJugs` usw.
 * Bilder: `images/abenteuer/spiele/wueste/<spiel>/` (Codex-Bilder, geschnitten mit `D:/Claude/Abenteuer-Wuestenvolk/tools/spiele_bilder_w2.py`).
 */
import type { CommissionGame, DonkeyGame, EnoughGame, JugsGame, QuailsGame, SerpentGame, StaffsGame } from '@/types/wuesteGames2'

const G = 'images/abenteuer/spiele/wueste/'
const p = (spiel: string, datei: string) => `${G}${spiel}/${datei}.webp`
const nums = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

/** Etappe 1: Wasser aus dem Felsen (2. Mose 17,6): Wasser am Felsen holen und den Durstigen bringen. */
export const KRUG: JugsGame = {
  background: p('krug', 'hintergrund'),
  spring: { image: p('krug', 'quelle'), x: 33, y: 46, w: 14, zone: { x1: 22, y1: 38, x2: 46, y2: 82 } },
  jug: { empty: p('krug', 'krug-leer'), full: p('krug', 'krug-voll'), w: 10, x: 38, y: 96 },
  people: [
    { id: 'alte', image: p('krug', 'mensch-1'), label: 'Die alte Frau', x: 52, y: 92, w: 13 },
    { id: 'vater', image: p('krug', 'mensch-2'), label: 'Der Vater', x: 63, y: 86, w: 13 },
    { id: 'mutter', image: p('krug', 'mensch-3'), label: 'Die Mutter mit dem Kind', x: 75, y: 92, w: 13 },
    { id: 'junge', image: p('krug', 'mensch-4'), label: 'Der Junge', x: 86, y: 86, w: 13 },
    { id: 'aeltester', image: p('krug', 'mensch-5'), label: 'Der Älteste', x: 95, y: 92, w: 13 }
  ],
  rounds: [
    { hint: 'Hole Wasser am Felsen und bringe es den Durstigen: Ziehe den Krug zum Felsen und dann zu einem Menschen. Tippen geht auch.', people: [0, 2, 4] },
    { hint: 'Jetzt haben alle Durst. Fülle den Krug noch einmal, so oft es nötig ist.', people: [0, 1, 2, 3, 4] }
  ],
  texts: {
    field: 'Der Felsen mit dem Spalt und die durstigen Menschen im Lager',
    empty: 'Der Krug ist leer. Hole erst Wasser am Felsen.',
    full: 'Der Krug ist schon voll. Bring ihn zu einem Menschen.',
    filled: 'Der Krug ist voll.',
    served: 'Das tut gut! Er trinkt das frische Wasser.',
    thirsty: '{name}: durstig',
    drank: '{name}: hat getrunken',
    jug: 'Der Krug',
    spring: 'Der Felsen mit dem Wasser',
    count: 'Menschen mit Wasser: {n} von {total}',
    done: 'Mose schlug auf den Felsen, und Wasser kam heraus. Das Volk konnte trinken.'
  }
}

/** Etappe 4: Das Zelt Gottes (2. Mose 36,5-7): Das Volk bringt mehr, als nötig ist; Mose lässt rufen: Genug! */
export const GENUG: EnoughGame = {
  background: p('genug', 'hintergrund'),
  gifts: nums(6).map((n) => ({ id: `gabe-${n}`, image: p('genug', `gabe-${n}`), w: 7 })),
  walkers: nums(4).map((n) => ({ id: `bringer-${n}`, image: p('genug', `bringer-${n}`), w: 12 })),
  path: { y: 90, toX: 54 },
  heap: { x: 66, y: 93, w: 36 },
  mose: { image: p('genug', 'mose'), x: 88, y: 92, w: 14 },
  rounds: [
    { hint: 'Die Leute bringen Gaben für das Zelt. Tippe auf Mose, sobald der Haufen die gestrichelte Linie erreicht.', need: 8, every: 1000, over: 3 },
    { hint: 'Noch einmal, jetzt kommen sie schneller. Wann ist es genug?', need: 12, every: 750, over: 3 }
  ],
  texts: {
    field: 'Der Bauplatz des Zeltes mit dem Haufen der Gaben und Mose',
    early: 'Es reicht noch nicht. Warte, bis der Haufen die Linie erreicht.',
    ok: 'Genug! Das Volk hört auf zu geben.',
    late: 'Es kam viel zu viel. Mose ruft jetzt selbst: Genug!',
    count: 'Gaben auf dem Haufen: {n}',
    moses: 'Mose: Genug rufen',
    done: 'Das Volk brachte mehr, als die Handwerker brauchten. Da ließ Mose rufen: Niemand soll mehr etwas bringen!'
  }
}

/** Etappe 6: Klagen und Wachteln (4. Mose 11,31-32): Ein Wind bringt Wachteln, das Volk sammelt sie. */
export const WACHTELN: QuailsGame = {
  background: p('wachteln', 'hintergrund'),
  quails: nums(4).map((n) => ({ id: `wachtel-${n}`, image: p('wachteln', `wachtel-${n}`), w: 13 })),
  basket: { image: p('wachteln', 'korb'), x: 12, y: 97, w: 16 },
  ground: { x1: 22, x2: 90, y1: 58, y2: 90 },
  rounds: [
    { hint: 'Ein Wind bringt Wachteln ins Lager. Tippe jede Wachtel an, dann springt sie in den Korb.', total: 8, every: 1100, stay: 4500 },
    { hint: 'Es kommen noch mehr. Sammle, so viele du schaffst.', total: 12, every: 800, stay: 3500 }
  ],
  texts: {
    field: 'Das Lager am Morgen, rings um die Zelte fallen Wachteln',
    caught: 'Eine Wachtel im Korb.',
    gone: 'Eine Wachtel ist weitergelaufen.',
    count: 'Wachteln im Korb: {n} von {total}',
    basket: 'Der Korb',
    quail: 'Eine Wachtel',
    done: 'Ein Wind brachte Wachteln vom Meer. Sie fielen rings um das Lager, und das Volk sammelte sie.'
  }
}

/** Etappe 9: Aarons Stab blüht (4. Mose 17): zwölf Stäbe über Nacht, am Morgen blüht nur einer. */
export const STAB: StaffsGame = {
  background: p('stab', 'hintergrund'),
  dry: nums(4).map((n) => p('stab', `stab-${n}`)),
  bloom: [p('stab', 'stab-knospen'), p('stab', 'stab-bluete'), p('stab', 'stab-mandeln')],
  w: 5,
  h: 36,
  bloomW: 9.5,
  pile: { x: 50, y: 95 },
  row: { y: 82, x1: 12, x2: 88 },
  aaron: 6,
  big: { x: 50, y: 96, w: 14, h: 76 },
  rounds: [
    { hint: 'Lege die zwölf Stäbe vor Gott nieder: Tippe auf jeden Stab, dann steht er in der Reihe.' },
    { hint: 'Am Morgen: Welcher Stab hat geblüht? Tippe auf ihn und sieh, was an ihm gewachsen ist.' }
  ],
  texts: {
    field: 'Das Zelt von innen mit der goldenen Lade und zwölf Stäben',
    staff: 'Stab {n} von {total}',
    aaron: 'Der Stab von Aaron',
    wrong: 'Dieser Stab ist trocken und kahl. Suche den, der geblüht hat.',
    night: 'Mose legt die Stäbe über Nacht vor Gott nieder.',
    found: 'Das ist der Stab von Aaron! Tippe auf ihn und sieh, was an ihm gewachsen ist.',
    stage: 'So wächst der Stab: Schritt {n} von 3.',
    count: 'Fortschritt: {n} von {total}',
    done: 'Aarons Stab hatte Blätter getrieben und Blüten, und an ihm hingen Mandeln.'
  }
}

/** Etappe 11: Die Schlange aus Bronze (4. Mose 21,8-9): Stange aufrichten, Menschen sehen zum Zeichen auf. Nur das Zeichen aus Bronze, keine lebende Schlange. */
export const SCHLANGE: SerpentGame = {
  background: p('schlange', 'hintergrund'),
  pole: { image: p('schlange', 'stange'), x: 52, y: 64, w: 7, ratio: 5 },
  people: [
    { id: 'mann', label: 'Der alte Mann', weak: p('schlange', 'schwach-1'), well: p('schlange', 'gesund-1'), x: 13, y: 94, w: 15 },
    { id: 'mutter', label: 'Die Mutter', weak: p('schlange', 'schwach-2'), well: p('schlange', 'gesund-2'), x: 28, y: 86, w: 15 },
    { id: 'junger', label: 'Der junge Mann', weak: p('schlange', 'schwach-3'), well: p('schlange', 'gesund-3'), x: 41, y: 94, w: 15 },
    { id: 'maedchen', label: 'Das Mädchen', weak: p('schlange', 'schwach-4'), well: p('schlange', 'gesund-4'), x: 66, y: 94, w: 15 },
    { id: 'bart', label: 'Der bärtige Mann', weak: p('schlange', 'schwach-5'), well: p('schlange', 'gesund-5'), x: 79, y: 86, w: 15 },
    { id: 'frau', label: 'Die ältere Frau', weak: p('schlange', 'schwach-6'), well: p('schlange', 'gesund-6'), x: 92, y: 94, w: 15 }
  ],
  rounds: [
    { hint: 'Richte die Stange auf: Ziehe sie oben nach oben, oder tippe sie an, bis sie gerade steht.' },
    { hint: 'Wer zum Zeichen aufsieht, bleibt am Leben. Tippe auf die Menschen im Lager.' }
  ],
  texts: {
    field: 'Der Lagerplatz mit der Stange und den Menschen',
    pole: 'Die Stange mit dem Zeichen aus Bronze',
    weak: '{name}: müde und schwach',
    well: '{name} sieht zum Zeichen hinauf.',
    lean: 'Die Stange ist noch nicht gerade. Versuche es noch einmal.',
    stands: 'Die Stange steht. Das Zeichen glänzt.',
    count: 'Fortschritt: {n} von {total}',
    done: 'Mose machte eine Schlange aus Bronze und richtete sie auf einer Stange auf. Wer zu ihr aufsah, blieb am Leben.'
  }
}

/** Etappe 12: Bileam und die Eselin (4. Mose 22,23-27): Die Eselin sieht das Licht auf dem Weg; dreimal weicht sie aus. Niemand wird geschlagen, das Licht ist nur Licht. */
export const ESELIN: DonkeyGame = {
  donkey: p('eselin', 'eselin'),
  light: p('eselin', 'licht'),
  steps: [
    {
      hint: 'Die Eselin sieht ein Licht auf dem Weg. Wohin weicht sie aus? Tippe darauf.',
      background: p('eselin', 'weg'),
      donkey: { x: 24, y: 72, w: 24 },
      light: { x: 60, y: 69, w: 10 },
      zone: { x1: 52, y1: 38, x2: 100, y2: 100 },
      label: 'Das Feld rechts',
      goTo: { x: 78, y: 88, rot: 0 },
      ok: 'Die Eselin geht ins Feld.'
    },
    {
      hint: 'Hier hat der Weg Mauern. Wohin drückt sich die Eselin?',
      background: p('eselin', 'gasse'),
      donkey: { x: 26, y: 58, w: 22 },
      light: { x: 66, y: 56, w: 10 },
      zone: { x1: 0, y1: 8, x2: 100, y2: 44 },
      label: 'Die Mauer',
      goTo: { x: 30, y: 50, rot: 0 },
      ok: 'Die Eselin drückt sich an die Mauer.'
    },
    {
      hint: 'Jetzt ist kein Platz mehr, nirgends. Was tut die Eselin? Tippe auf sie.',
      background: p('eselin', 'enge'),
      donkey: { x: 50, y: 95, w: 30 },
      light: { x: 52, y: 62, w: 9 },
      zone: { x1: 34, y1: 54, x2: 68, y2: 98 },
      label: 'Die Eselin',
      goTo: { x: 50, y: 97, rot: 12 },
      ok: 'Die Eselin legt sich unter Bileam nieder.'
    }
  ],
  texts: {
    field: 'Der Weg im Weinberg mit der Eselin und dem Licht',
    donkey: 'Die Eselin mit Bileam',
    light: 'Ein ruhiges Licht auf dem Weg',
    wrong: 'Dorthin geht die Eselin nicht. Sieh, wo das Licht steht.',
    eyes: 'Da öffnete Gott dem Bileam die Augen, und er verneigte sich.',
    count: 'Orte geschafft: {n} von {total}',
    done: 'Die Eselin sah den Engel Gottes zuerst. Bileam sah ihn nicht, bis Gott ihm die Augen öffnete.'
  }
}

/** Etappe 14: Seid mutig! (4. Mose 27,18-23): Josua vor Eleasar und vor das Volk stellen, Mose legt ihm die Hände auf. */
export const EINSETZEN: CommissionGame = {
  background: p('einsetzen', 'hintergrund'),
  mose: { image: p('einsetzen', 'mose'), blessing: p('einsetzen', 'mose-segnet'), x: 18, y: 90, w: 21 },
  eleasar: { image: p('einsetzen', 'eleasar'), x: 47, y: 82, w: 18 },
  community: { image: p('einsetzen', 'gemeinde'), x: 79, y: 86, w: 44 },
  joshua: { image: p('einsetzen', 'josua'), w: 19, start: { x: 31, y: 98 }, spot: { x: 59, y: 98 } },
  radius: 10,
  holdMs: 2200,
  rounds: [
    { hint: 'Führe Josua auf den Platz vor Eleasar und dem Volk: Ziehe ihn dorthin, oder tippe erst auf Josua und dann auf den Platz.' },
    { hint: 'Mose legt Josua die Hände auf: Halte den Finger auf Josua, bis der Balken voll ist.' }
  ],
  texts: {
    field: 'Der Platz vor dem Zelt mit Mose, Eleasar, Josua und dem Volk',
    joshua: 'Josua',
    spot: 'Der Platz vor Eleasar und dem Volk',
    wrong: 'Hier ist nicht der Platz. Stelle Josua vor Eleasar und vor das Volk.',
    placed: 'Josua steht vor Eleasar und vor dem ganzen Volk.',
    hold: 'Halte den Finger auf Josua, bis der Balken voll ist.',
    laid: 'Mose legt seine Hände auf Josua.',
    count: 'Fortschritt: {n} von {total}',
    done: 'Mose legte Josua die Hände auf und stellte ihn vor den Priester Eleasar und vor das ganze Volk.'
  }
}
