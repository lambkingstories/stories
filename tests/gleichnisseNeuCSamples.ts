/**
 * Sample data for the tests of the two games of the stages 11 and 12 of "Geschichten von Jesus" (`baugrund`, `einladen`): the same shape as the real data, with made-up places.
 * The real data (measured on the painted pictures) are tested in `gleichnisseData.test.ts`.
 */
import type { GroundGame, InviteGame, NeuSprite } from '@/utils/gleichnisseNeuC'

export const S = (image: string, w = 15): NeuSprite => ({ image: `x/${image}.webp`, label: image, w })

export const GROUND: GroundGame = {
  background: 'x/tal.webp',
  tray: { x: 12, y: 96, w: 22 },
  sprites: {
    rock: S('Fels', 14),
    sand: S('Sand', 14),
    covered: S('Sand unter Sand', 14),
    house: S('Haus', 18),
    tilted: S('Haus schief', 18),
    mallet: S('Hammer', 8),
    puff: S('Staub', 9),
    spark: S('Funken', 7),
    rain: S('Regen', 100),
    water: S('Wasser', 100),
    wind: S('Wind', 100)
  },
  rounds: [
    {
      hint: 'Klopfe den Boden ab.',
      mark: true,
      plots: [
        { id: 'a', x: 45, y: 58, w: 14, ground: 'rock' },
        { id: 'b', x: 66, y: 46, w: 14, ground: 'sand' },
        { id: 'c', x: 82, y: 72, w: 14, ground: 'sand' },
        { id: 'd', x: 46, y: 86, w: 14, ground: 'sand' }
      ]
    },
    {
      hint: 'Du hast nur vier Klopfer.',
      mark: false,
      knocks: 4,
      plots: [
        { id: 'a', x: 32, y: 48, w: 14, ground: 'sand' },
        { id: 'b', x: 50, y: 40, w: 14, ground: 'sand' },
        { id: 'c', x: 68, y: 52, w: 14, ground: 'rock', hidden: true },
        { id: 'd', x: 86, y: 40, w: 12, ground: 'sand' },
        { id: 'e', x: 56, y: 70, w: 14, ground: 'sand' },
        { id: 'f', x: 84, y: 82, w: 14, ground: 'rock', hidden: true }
      ]
    }
  ]
}

const seats = Array.from({ length: 12 }, (_, i) => ({ x: 9 + i * 7.6, y: 93 }))
const guest = (id: string, seatsN: 1 | 2 = 1) => ({
  wait: S(`${id} winkt`, seatsN === 2 ? 17 : 13),
  sit: S(`${id} sitzt`, seatsN === 2 ? 15 : 11),
  seats: seatsN
})

export const INVITE: InviteGame = {
  tableSeats: seats,
  table: { ...S('Tisch', 100), x: 50, y: 100 },
  sprites: {
    g1: guest('Frau mit Korb'),
    g2: guest('Mann am Stock'),
    g3: guest('Mann mit Wanderstab'),
    g4: guest('Junge'),
    g5: guest('Alte Frau'),
    g6: guest('Mann mit Krug'),
    g7: guest('Wanderer'),
    g8: guest('Hirtenjunge'),
    g9: guest('Baeuerin'),
    g10: guest('Fischer'),
    pair: guest('Mutter mit Kind', 2)
  },
  servant: { ...S('Diener', 11), x: 90, y: 62 },
  lamp: { off: S('Lampe aus', 5), on: S('Lampe an', 5), y: 80 },
  hedge: S('Hecke', 24),
  fence: S('Zaun', 24),
  rounds: [
    {
      hint: 'Tippe die Gäste an, die dir zuwinken.',
      scene: 'x/stadt.webp',
      show: 5000,
      gap: 3000,
      atOnce: 2,
      spots: [
        { x: 14, y: 62 },
        { x: 30, y: 44 },
        { x: 46, y: 62 },
        { x: 62, y: 44 },
        { x: 76, y: 62 }
      ],
      guests: [
        { sprite: 'g1', spot: 0 },
        { sprite: 'g2', spot: 1 },
        { sprite: 'g3', spot: 2 },
        { sprite: 'g4', spot: 3 },
        { sprite: 'g5', spot: 4 },
        { sprite: 'g6', spot: 0 }
      ]
    },
    {
      hint: 'Jetzt hinaus auf die Landstraßen.',
      scene: 'x/land.webp',
      show: 3500,
      gap: 2500,
      atOnce: 3,
      spots: [
        { x: 12, y: 60, cover: 'hedge' },
        { x: 27, y: 44, cover: 'fence' },
        { x: 42, y: 62, cover: 'hedge' },
        { x: 57, y: 44, cover: 'fence' },
        { x: 70, y: 62, cover: 'hedge' },
        { x: 84, y: 44, cover: 'fence' }
      ],
      guests: [
        { sprite: 'g7', spot: 0, hidden: true },
        { sprite: 'g8', spot: 1, hidden: true },
        { sprite: 'pair', spot: 2, hidden: true },
        { sprite: 'g9', spot: 3, hidden: true },
        { sprite: 'g10', spot: 4, hidden: true }
      ]
    }
  ]
}
