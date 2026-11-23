/**
 * Sample data of the three new games of "Simson" (`simson`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/simson.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through. The places are made so that the checks hold; they are not the places of the painted pictures.
 */
import type { AvoidGame, GateLiftGame, RiddleGame } from '@/utils/simsonNeu'

const G = 'images/abenteuer/spiele/simson/'

export const AVOID: AvoidGame = {
  background: `${G}meiden/tisch.webp`,
  ratio: 1.5,
  basket: { image: `${G}meiden/korb.webp`, box: { x: 18, y: 72, w: 26, h: 30 } },
  cloth: { image: `${G}meiden/tuch.webp`, box: { x: 80, y: 74, w: 30, h: 24 } },
  woman: { image: `${G}meiden/frau-hof.webp`, x: 50, y: 46, w: 15 },
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

export const RIDDLE: RiddleGame = {
  background: `${G}raetsel/tafel.webp`,
  ratio: 1.5,
  step: `${G}raetsel/stufe.webp`,
  stepRatio: 3,
  glow: `${G}raetsel/glanz.webp`,
  ladder: { x: 74, y: 96, w: 38 },
  rounds: [
    {
      hint: 'Was ist am süßesten? Lege es ganz nach oben.',
      quality: 'sweet',
      ladderLabel: 'am süßesten',
      cards: [
        { id: 'karte-brot', image: `${G}raetsel/karte-brot.webp`, label: 'Brot' },
        { id: 'karte-trauben', image: `${G}raetsel/karte-trauben.webp`, label: 'Trauben' },
        { id: 'karte-honig', image: `${G}raetsel/karte-honig.webp`, label: 'Honig' }
      ],
      mix: ['karte-trauben', 'karte-honig', 'karte-brot']
    },
    {
      hint: 'Wer ist am stärksten? Lege ihn ganz nach oben.',
      quality: 'strong',
      ladderLabel: 'am stärksten',
      cards: [
        { id: 'karte-hase', image: `${G}raetsel/karte-hase.webp`, label: 'Hase' },
        { id: 'karte-schaf', image: `${G}raetsel/karte-schaf.webp`, label: 'Schaf' },
        { id: 'karte-esel', image: `${G}raetsel/karte-esel.webp`, label: 'Esel' },
        { id: 'karte-loewe', image: `${G}raetsel/karte-loewe.webp`, label: 'Löwe' }
      ],
      mix: ['karte-esel', 'karte-hase', 'karte-loewe', 'karte-schaf']
    }
  ]
}

export const GATE: GateLiftGame = {
  background: `${G}torheben/nacht.webp`,
  ratio: 1.5,
  strong: { image: `${G}torheben/simson.webp`, x: 17, y: 97, w: 24, ratio: 0.808 },
  shoulder: { x: 19, y: 62, step: 6, w: 20 },
  rounds: [
    {
      hint: 'Hebe die Teile des Tores aus. Was noch hält, lässt sich nicht anheben.',
      parts: [
        { id: 'riegel', image: `${G}torheben/riegel.webp`, label: 'Der Riegel', x: 57, y: 50, w: 30, ratio: 5.833, holds: [] },
        { id: 'fluegel-links', image: `${G}torheben/fluegel-links.webp`, label: 'Die linke Tür', x: 50, y: 60, w: 13, ratio: 0.484, holds: ['riegel'] },
        { id: 'fluegel-rechts', image: `${G}torheben/fluegel-rechts.webp`, label: 'Die rechte Tür', x: 64, y: 60, w: 13, ratio: 0.484, holds: ['riegel'] }
      ]
    },
    {
      hint: 'Das große Tor: Hebe alle Teile aus, eines nach dem anderen.',
      parts: [
        { id: 'riegel', image: `${G}torheben/riegel.webp`, label: 'Der Riegel', x: 58, y: 47, w: 34, ratio: 5.833, holds: [] },
        { id: 'fluegel-links', image: `${G}torheben/fluegel-links.webp`, label: 'Die linke Tür', x: 50.5, y: 59, w: 15, ratio: 0.484, holds: ['riegel'] },
        { id: 'fluegel-rechts', image: `${G}torheben/fluegel-rechts.webp`, label: 'Die rechte Tür', x: 65.5, y: 59, w: 15, ratio: 0.484, holds: ['riegel'] },
        { id: 'pfosten-links', image: `${G}torheben/pfosten-links.webp`, label: 'Der linke Pfosten', x: 40, y: 57, w: 6, ratio: 0.2, holds: ['fluegel-links'] },
        { id: 'pfosten-rechts', image: `${G}torheben/pfosten-rechts.webp`, label: 'Der rechte Pfosten', x: 76, y: 57, w: 6, ratio: 0.2, holds: ['fluegel-rechts'] }
      ]
    }
  ]
}
