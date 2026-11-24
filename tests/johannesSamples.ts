/**
 * Sample data of the three new games of "Johannes der Täufer" (`johannes`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/johannes.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through. The places are made so that the checks hold; they are not the places of the painted pictures.
 */
import type { GestureGame, GiveAwayGame, PointGame } from '@/utils/johannesNeu'

const G = 'images/abenteuer/spiele/johannes/'

export const GESTURE: GestureGame = {
  background: `${G}gebaerde/vorhof.webp`,
  ratio: 1.5,
  zacharias: { image: `${G}gebaerde/zacharias.webp`, x: 24, y: 96, w: 24, ratio: 0.677 },
  crowd: { puzzled: `${G}gebaerde/volk-ratlos.webp`, understood: `${G}gebaerde/volk-versteht.webp`, x: 69, y: 96, w: 48, ratio: 2.143 },
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

export const GIVE: GiveAwayGame = {
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
  layout: { personW: 17, feetY: 78, matW: 17, matY: 89, pieceW: 11, pieceY: 85 },
  rounds: [
    { hint: 'Wer zwei Röcke hat, gibt einen dem Nachbarn. Bald hat jeder einen.', item: 'rock', start: [2, 1, 0, 1] },
    { hint: 'Jetzt geht es um Brot. Wer mehr als ein Brot hat, gibt eines weiter.', item: 'brot', start: [0, 0, 4, 0, 1] }
  ]
}

export const POINT: PointGame = {
  background: `${G}zeigen/ufer-weit.webp`,
  ratio: 1.5,
  rounds: [
    {
      hint: 'Am nächsten Tag: Wer kommt zu Johannes? Tippe den Mann an, auf den er zeigt.',
      johannes: { image: `${G}zeigen/johannes-zeigt-1.webp`, x: 16, y: 94, w: 22, ratio: 0.743 },
      tip: { x: 27, y: 57 },
      angle: 20,
      tolerance: 7,
      men: [
        { id: 'jesus', image: `${G}zeigen/jesus-geht.webp`, label: 'ein Mann in cremeweißer Tunika und rotbraunem Mantel', x: 63, y: 53.3, w: 12, ratio: 0.565, flip: true },
        { id: 'fischer', image: `${G}zeigen/mann-fischer.webp`, label: 'ein Fischer mit Netz auf der Schulter', x: 51, y: 95, w: 12, ratio: 0.524 },
        { id: 'bauer', image: `${G}zeigen/mann-bauer.webp`, label: 'ein Bauer mit Korb', x: 37, y: 48.2, w: 12, ratio: 0.524 }
      ],
      right: 'jesus'
    },
    {
      hint: 'Am Tag darauf: Auf wen zeigt Johannes jetzt?',
      johannes: { image: `${G}zeigen/johannes-zeigt-2.webp`, x: 16, y: 94, w: 22, ratio: 0.743 },
      tip: { x: 27, y: 60 },
      angle: -10,
      tolerance: 7,
      men: [
        { id: 'jesus', image: `${G}zeigen/jesus-geht.webp`, label: 'ein Mann in cremeweißer Tunika und rotbraunem Mantel', x: 61, y: 84.9, w: 12, ratio: 0.565 },
        { id: 'hirte', image: `${G}zeigen/mann-hirte.webp`, label: 'ein Hirte mit Stab', x: 57, y: 46.8, w: 12, ratio: 0.524 },
        { id: 'traeger', image: `${G}zeigen/mann-traeger.webp`, label: 'ein Wasserträger mit Tonkrug', x: 43, y: 98.8, w: 12, ratio: 0.524 },
        { id: 'fischer', image: `${G}zeigen/mann-fischer.webp`, label: 'ein Fischer mit Netz auf der Schulter', x: 34, y: 59, w: 12, ratio: 0.524 }
      ],
      right: 'jesus',
      disciples: { image: `${G}zeigen/juenger.webp`, x: 30, y: 95, w: 13, ratio: 0.656, follow: { x: 8, y: -3 } }
    }
  ]
}
