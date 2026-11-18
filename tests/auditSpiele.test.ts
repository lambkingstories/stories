/**
 * Findings of the audit of the games (18 Nov 2026), each one kept as a small test so it cannot come back.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BIG_GAMES } from '../src/data/bigGames'
import { TIMELINE } from '../src/data/adventures/timeline'
import rawApp from '../src/i18n/app'
import { maxStarsOf } from '../src/utils/bigGames'

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
const game = (id: string) => BIG_GAMES.find((g) => g.id === id)!

describe('the tile of the memory shows what can be won in this build', () => {
  it('follows the number of boards (three stars each), the other games keep their number', () => {
    expect(maxStarsOf(game('memory'), 9)).toBe(27)
    expect(maxStarsOf(game('memory'), 0)).toBe(0)
    expect(maxStarsOf(game('david'), 9)).toBe(30)
    expect(maxStarsOf(game('bogen'), 9)).toBe(132)
  })

  it('with every adventure of the time line the memory has the number of the list of games', () => {
    expect(maxStarsOf(game('memory'), TIMELINE.length)).toBe(game('memory').maxStars)
  })

  it('the game room asks for it', () => {
    expect(src('src/components/molecules/MyRewards.vue')).toContain('maxStarsOf(s.game, memoryBoards)')
  })
})

describe('the pause buttons are at least 44 px and do not shrink in the row of the screen', () => {
  const rule = (file: string, selector: string) => {
    const text = src(file).replace(/\r/g, '')
    const at = text.indexOf(`\n${selector}\n`)
    expect(at, `${selector} in ${file}`).toBeGreaterThan(-1)
    return text.slice(at, text.indexOf('\n\n', at + 2))
  }
  it('David', () => {
    const css = rule('src/components/molecules/games/BigGameDavid.vue', '.dg-btn')
    expect(css).toMatch(/flex: 0 0 44px/)
    expect(css).toMatch(/width: 44px/)
    expect(css).toMatch(/height: 44px/)
  })
  it('Elia', () => {
    const css = rule('src/components/molecules/games/BigGameElia.vue', '.eg-btn')
    expect(css).toMatch(/flex: 0 0 44px/)
    expect(css).toMatch(/width: 44px/)
    expect(css).toMatch(/height: 44px/)
  })
})

describe('one spelling of the name Goliat in the german texts of David', () => {
  it('level name, story, task, hints and the end all say Goliat', () => {
    const david = (rawApp as unknown as { de: { app: { bigGames: { david: Record<string, unknown> } } } }).de.app.bigGames.david
    // the keys (tipGoliath, wonGoliath) keep their names, only the words count
    const all = Object.values(david).flat(2).filter((v) => typeof v === 'string').join(' ')
    expect(all).toContain('Goliat')
    expect(all).not.toMatch(/Goliath/)
  })
})

