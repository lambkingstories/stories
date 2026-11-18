import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEVELS } from '../src/utils/bezalelLevels'
import { BIG_GAMES } from '../src/data/bigGames'

const dir = resolve(process.cwd(), 'public/images/spiele-gross/bezalel')

describe('the pictures of Bezalels Werkstatt', () => {
  it('every object, material, background, chapter picture and the tile exist', () => {
    const need = [
      ...LEVELS.map((l) => l.picture),
      ...['holz', 'gold', 'silber', 'bronze', 'blau', 'purpur', 'karmesin', 'leinen'].map((t) => `tex-${t}`),
      'werkstatt-quer', 'werkstatt-hoch', 'kachel', 'kap-1', 'kap-2', 'kap-3', 'kap-4'
    ]
    for (const n of need) expect(existsSync(resolve(dir, `${n}.webp`)), n).toBe(true)
  })

  it('every level has its own picture', () => {
    expect(new Set(LEVELS.map((l) => l.picture)).size).toBe(LEVELS.length)
  })

  it('the pictures together are under 12 MB and the tile is the one of the registry', () => {
    const total = readdirSync(dir).reduce((n, f) => n + statSync(resolve(dir, f)).size, 0)
    expect(total).toBeLessThan(12 * 1024 * 1024)
    const game = BIG_GAMES.find((g) => g.id === 'bezalel')!
    expect(existsSync(resolve(process.cwd(), 'public', game.image))).toBe(true)
    expect(game.maxStars).toBe(LEVELS.length * 3)
  })
})
