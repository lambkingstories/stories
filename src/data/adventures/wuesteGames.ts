/**
 * Die vier neuen Spiele des Abenteuers "Das Volk in der Wüste" (id `wueste`): Arme halten (Etappe 2), Fälle zuteilen (3), Trompetenzeichen (5), Traube tragen (7); ausgelagert aus `wueste.ts` (Lauf SPIELE, 1.11.2026).
 * Die Spiele der Etappen 1, 4, 6, 9, 11, 12 und 14 stehen in `wuesteGames2.ts` (Lauf W2). Etappen, Texte und Fragen stehen in `wueste.ts`; hier stehen nur die Daten dieser vier Spiele.
 * Bilder: `images/abenteuer/spiele/wueste/<spiel>/` (Bildaufträge S41, S42, S44, S46 in `D:/Claude/Abenteuer-Wuestenvolk/BILDAUFTRAEGE/`); Lagen und Maße: `D:/Claude/Abenteuer-Wuestenvolk/tools/_massen_wueste.json`.
 * Alle Sätze der Spiele stehen wörtlich im Text der Etappe oder in der Bibel (Luther 1912).
 */
import type { ArmsGame, GrapesGame, JudgesGame, SignalGame } from '@/types/adventure'

const G = 'images/abenteuer/spiele/wueste/'
const A = 'audio/abenteuer/wueste/'

/**
 * Etappe 2, "Die Arme des Mose" (NEU): Mose sitzt auf dem Stein, seine Arme sinken; Runde 1 mit dem Finger oben halten, Runde 2 tippen das Kind abwechselnd auf Aaron und Hur.
 * Bilder (Bildauftrag S41): `arme/hang.webp` 1200 × 900, `mose-1..3.webp` (Arme unten, halb, oben; 520 × 520 gleiche Fläche), `aaron.webp`, `hur.webp` (400 × 480).
 */
export const ARME: ArmsGame = {
  background: `${G}arme/hang.webp`,
  poses: [`${G}arme/mose-1.webp`, `${G}arme/mose-2.webp`, `${G}arme/mose-3.webp`],
  moses: { label: 'Mose auf seinem Stein', w: 60, x: 50, y: 93 },
  helpers: [
    { id: 'aaron', image: `${G}arme/aaron.webp`, label: 'Aaron', w: 28, x: 21, y: 95 },
    { id: 'hur', image: `${G}arme/hur.webp`, label: 'Hur', w: 28, x: 79, y: 95 }
  ],
  rounds: [
    { hint: 'Halte den Finger auf Mose. Solange seine Hände oben sind, hilft das dem Volk. Halte, bis die Sonne untergeht.', helpers: false, goal: 10, sink: 0.2 },
    { hint: 'Jetzt helfen Aaron und Hur. Tippe abwechselnd auf beide, damit die Hände oben bleiben.', helpers: true, goal: 12, sink: 0.28 }
  ]
}

/**
 * Etappe 3, "Fälle zuteilen" (NEU): Jitro rät, die kleinen Fälle sollen andere richten und nur die schweren zu Mose kommen. Drei Männer und Mose stehen auf dem Gerichtsplatz; vier, dann sechs Fälle.
 * Bilder (Bildauftrag S42): `richter/platz.webp` 1200 × 900, `richter-1..3.webp`, `mose.webp` (300 × 420), `fall-1..6.webp` (rund, 256 × 256; 1–4 klein, 5 und 6 schwer).
 */
export const RICHTER: JudgesGame = {
  background: `${G}richter/platz.webp`,
  seats: [
    { id: 'richter-1', image: `${G}richter/richter-1.webp`, label: 'Erster Richter', w: 24, x: 14.5, y: 91 },
    { id: 'richter-2', image: `${G}richter/richter-2.webp`, label: 'Zweiter Richter', w: 24, x: 37, y: 91 },
    { id: 'richter-3', image: `${G}richter/richter-3.webp`, label: 'Dritter Richter', w: 24, x: 59.5, y: 91 },
    { id: 'mose', image: `${G}richter/mose.webp`, label: 'Mose', w: 27, x: 85, y: 93, moses: true }
  ],
  cases: [
    { id: 'krug', image: `${G}richter/fall-1.webp`, label: 'Zwei Männer streiten um einen Krug', weight: 'small' },
    { id: 'lamm', image: `${G}richter/fall-2.webp`, label: 'Zwei Nachbarn streiten um ein Lamm', weight: 'small' },
    { id: 'feigen', image: `${G}richter/fall-3.webp`, label: 'Zwei Frauen streiten um einen Korb Feigen', weight: 'small' },
    { id: 'sandalen', image: `${G}richter/fall-4.webp`, label: 'Zwei Jungen streiten um ein Paar Sandalen', weight: 'small' },
    { id: 'brunnen', image: `${G}richter/fall-5.webp`, label: 'Zwei große Familien streiten um einen Brunnen', weight: 'great' },
    { id: 'weide', image: `${G}richter/fall-6.webp`, label: 'Zwei Gruppen streiten um eine große Weide', weight: 'great' }
  ],
  caseW: 22,
  rounds: [
    { hint: 'Tippe auf einen Fall und dann auf den, der ihn entscheiden soll. Die kleinen richten die Männer, die schweren gehören zu Mose.', cases: ['krug', 'lamm', 'brunnen', 'feigen'] },
    { hint: 'Noch einmal, mit mehr Fällen. Kleine Fälle zu den Männern, schwere zu Mose.', cases: ['sandalen', 'weide', 'krug', 'brunnen', 'lamm', 'feigen'] }
  ]
}

/**
 * Etappe 5, "Trompetenzeichen" (NEU): zwei silberne Trompeten (4. Mose 10): beide = alles versammelt sich, eine = die Anführer, ein anderes Blasen = Aufbruch. Runde 1 ein Zeichen je Frage, Runde 2 drei nacheinander.
 * Bilder (Bildauftrag S44): `signal/lager.webp` 1200 × 900, `priester.webp` (800 × 400, die beiden Priester), `antwort-alle/anfuehrer/aufbruch.webp` (rund, 300 × 300). Töne: `audio/abenteuer/wueste/trompete-*-v1.mp3`
 * (mit `tools/trompeten_synthese.py` erzeugt).
 */
export const SIGNAL: SignalGame = {
  background: `${G}signal/lager.webp`,
  priests: { image: `${G}signal/priester.webp`, label: 'Zwei Priester mit silbernen Trompeten', w: 58, x: 50, y: 101 },
  sounds: {
    all: { file: `${A}trompete-beide-v1.mp3`, seconds: 2.4 },
    leaders: { file: `${A}trompete-eine-v1.mp3`, seconds: 1.8 },
    break: { file: `${A}trompete-aufbruch-v1.mp3`, seconds: 2.4 }
  },
  choices: [
    { id: 'all', image: `${G}signal/antwort-alle.webp`, label: 'Das ganze Volk versammelt sich' },
    { id: 'leaders', image: `${G}signal/antwort-anfuehrer.webp`, label: 'Nur die Anführer kommen' },
    { id: 'break', image: `${G}signal/antwort-aufbruch.webp`, label: 'Das Lager bricht auf' }
  ],
  rounds: [
    { hint: 'Höre auf die silbernen Trompeten und tippe das Bild, das zum Zeichen passt.', questions: [['leaders'], ['break'], ['all']] },
    { hint: 'Jetzt kommen drei Zeichen nacheinander. Tippe die Bilder in derselben Reihenfolge.', questions: [['all', 'leaders', 'break'], ['break', 'all', 'leaders']] }
  ]
}

/**
 * Etappe 7, "Die Traube tragen" (NEU): zwei Kundschafter tragen die Riesentraube vom Bach Eschkol an einer Stange; das Kind hält die Stange gerade. Zwei Runden (Runde 2 mit Hügeln).
 * Bilder (Bildauftrag S46): `traube/weg.webp` 1200 × 900, `mann-hinten.webp`, `mann-vorn.webp` (300 × 420), `stange.webp` (900 × 300), `beere.webp` (80 × 80).
 */
export const TRAUBE: GrapesGame = {
  background: `${G}traube/weg.webp`,
  men: [
    { image: `${G}traube/mann-hinten.webp`, label: 'Der Kundschafter hinten', w: 20, x: 26.5, y: 88 },
    { image: `${G}traube/mann-vorn.webp`, label: 'Der Kundschafter vorn', w: 20, x: 74.5, y: 88 }
  ],
  pole: { image: `${G}traube/stange.webp`, label: 'Die Stange mit der Riesentraube', w: 56, x: 49.5, y: 67.8 },
  berry: { image: `${G}traube/beere.webp`, w: 4 },
  berries: 6,
  rounds: [
    { hint: 'Zwei Männer tragen die Traube an einer Stange. Halte die Stange gerade: Heb das Ende, das nach unten kippt.', seconds: 22, wobble: 0.9, hills: false },
    { hint: 'Jetzt geht der Weg über Hügel. Halte die Stange weiter gerade.', seconds: 24, wobble: 1, hills: true }
  ]
}
