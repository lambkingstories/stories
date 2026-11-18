/**
 * The target drawings for `bezalel-design.ts`: one per level. `kinds` are the pieces of the level (L large triangle, M medium, S small, Q square,
 * P parallelogram); `rows` is the drawing (see the head of bezalel-design.ts). The search finds the tangram figure that comes nearest.
 */
export interface Target {
  id: string
  kinds: string
  rows: string[]
  width?: number
  /** Weight of the left-right symmetry (default 0.6). */
  sym?: number
  /** Weight of a short outline (default 0.2). */
  compact?: number
}

export const TARGETS: Target[] = [
  // ── chapter 1: the wood (3 to 7 pieces)
  { id: 'l01', kinds: 'SSQ', rows: ['##'] }, // the board
  { id: 'l02', kinds: 'SSQP', rows: ['###'] }, // the bar
  { id: 'l03', kinds: 'SSMP', rows: ['.d#', 'd#.'] }, // the carrying pole
  { id: 'l04', kinds: 'LMPQ', rows: ['.#.', '.#.', '###'] }, // the pillar
  { id: 'l05', kinds: 'SSMQ', rows: ['d##a'] }, // the moulding
  { id: 'l06', kinds: 'LMQP', rows: ['b#a', '.##'] }, // the chest
  { id: 'l07', kinds: 'LLMQ', rows: ['####', '#..#'] }, // the table
  { id: 'l08', kinds: 'LLMPQ', rows: ['a.b', '###', '###'] }, // the incense altar
  { id: 'l09', kinds: 'LMQPSS', rows: ['###', '###'] }, // the wall
  { id: 'l10', kinds: 'LLMQPSS', rows: ['a..b', '####', '####'] }, // the altar of burnt offering
  // ── chapter 2: gold, silver, bronze
  { id: 'l11', kinds: 'LMPQS', rows: ['.##', '.#.', '##.'] }, // the hook
  { id: 'l12', kinds: 'LMPQS', rows: ['###', '.#.', '.#.', '.d.'] }, // the peg
  { id: 'l13', kinds: 'LMQPSS', rows: ['#..#', '####', '.##.'] }, // the bowl
  { id: 'l14', kinds: 'LMQPSS', rows: ['##.', '###', '###'] }, // the jug
  { id: 'l15', kinds: 'LMQPSS', rows: ['..#.', '####', '.###'] }, // the lamp
  { id: 'l16', kinds: 'LLMQPS', rows: ['####', '####'] }, // the socket
  { id: 'l17', kinds: 'LLMSSQP', rows: ['b#a', '#.#', 'd#c'] }, // the ring
  { id: 'l18', kinds: 'LLMSSQP', rows: ['d##a', '####'] }, // the lid
  { id: 'l19', kinds: 'LLMSSQP', rows: ['#...#', '#####', '.###.'] }, // the basin
  { id: 'l20', kinds: 'LLMSSQP', rows: ['..#..', '#.#.#', '#####'], sym: 1.6 }, // the lampstand (the chosen figure comes from the search "l20c": rows ['#.#.#', '#.#.#', '.###.', '..#..'], see choices.json)
  // ── chapter 3: the fabrics
  { id: 'l21', kinds: 'LLMSSQP', rows: ['####', '####'] }, // the carpet
  { id: 'l22', kinds: 'LLMSSQP', rows: ['.ba.', '####', '.###'] }, // the tent cloth
  { id: 'l23', kinds: 'LLMSSQP', rows: ['.#.#.', '#####', '..#..'] }, // the pelt
  { id: 'l24', kinds: 'LLMSSQP', rows: ['b##a', '#..#', 'd##c'] }, // the yarn
  { id: 'l25', kinds: 'LLMSSQP', rows: ['.#.', '.#.', '###', '.#.', '.#.'] }, // the spindle
  { id: 'l26', kinds: 'LLMSSQP', rows: ['#####', '#.#.#'] }, // the curtain
  { id: 'l27', kinds: 'LLMSSQP', rows: ['#.#', '###', '###'] }, // the shoulder garment
  { id: 'l28', kinds: 'LLMSSQP', rows: ['b#a', '###', 'd#c'] }, // the breastpiece
  { id: 'l29', kinds: 'LLMSSQP', rows: ['#####', 'a.b.a'] }, // the hem
  { id: 'l30', kinds: 'LLMSSQP', rows: ['.##', '.#.', '###', '.#.', '##.'] }, // the belt
  // ── chapter 4: the whole tabernacle (always seven pieces)
  { id: 'l31', kinds: 'LLMSSQP', rows: ['#.#.#', '#####'] }, // the row of pillars
  { id: 'l32', kinds: 'LLMSSQP', rows: ['####', '#..#', '#..#'] }, // the entrance
  { id: 'l33', kinds: 'LLMSSQP', rows: ['###', '#.#', '###'] }, // the courtyard
  { id: 'l34', kinds: 'LLMSSQP', rows: ['.ba.', '####', 'b##a'] }, // the holy place
  { id: 'l35', kinds: 'LLMSSQP', rows: ['###', '###', '##.'] }, // the most holy place
  { id: 'l36', kinds: 'LLMSSQP', rows: ['.ba.', 'b##a', '####'] }, // the dwelling
  { id: 'l37', kinds: 'LLMSSQP', rows: ['.##.', '####', '.##.'] }, // the showbread
  { id: 'l38', kinds: 'LLMSSQP', rows: ['.#.', '.#.', '###', '###'] }, // the anointing oil
  { id: 'l39', kinds: 'LLMSSQP', rows: ['#..', '##.', '###', '##.'] }, // the setting up
  { id: 'l40', kinds: 'LLMSSQP', rows: ['..d.', '.ba.', '####', '.##.'] } // the finished work
]
