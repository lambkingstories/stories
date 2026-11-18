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

describe('english texts of the order race read right', () => {
  it('"in the right place" and a plain question about the turns', () => {
    const order = (rawApp as unknown as { en: { app: { order: Record<string, string> } } }).en.app.order
    expect(order.someRight).toBe('{n} of {total} in the right place')
    expect(order.rounds).not.toMatch(/on turn/)
  })
})

describe('the result line about the stones of Nehemias Mauer makes sense in every language', () => {
  it('says how many stones were used and how many are enough, not "6 of 4"', () => {
    const texts = src('src/i18n/bigGames/nehemia.ts')
    const lines = [...texts.matchAll(/lineSteady: '([^']*)'/g)].map((m) => m[1]!)
    expect(lines).toHaveLength(3)
    for (const l of lines) {
      expect(l).toContain('{have}')
      expect(l).toContain('{need}')
      expect(l).not.toMatch(/\{have\} (von|of|de) \{need\}/)
    }
  })
})

describe('the touch areas of the table of the family games are at least 44 px (also on a narrow phone)', () => {
  /** Every `width`/`height` in pixels that is written for a selector (in any media block) of a sass file. */
  const sizes = (file: string, selectorStart: string): number[] => {
    const lines = src(file).replace(/\r/g, '').split('\n')
    const out: number[] = []
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]!.trim().startsWith(selectorStart)) continue
      const indent = lines[i]!.length - lines[i]!.trimStart().length
      for (let j = i + 1; j < lines.length && (lines[j]!.trim() === '' || lines[j]!.length - lines[j]!.trimStart().length > indent); j++) {
        const m = lines[j]!.match(/^\s*(width|height|min-width|min-height):\s*(\d+)px/)
        if (m) out.push(Number(m[2]))
      }
    }
    return out
  }
  it('the back, music and sound buttons keep 44 px', () => {
    const all = sizes('src/components/molecules/map/MapTable.vue', '.mt-back, .mt-round')
    expect(all.length).toBeGreaterThanOrEqual(2)
    for (const n of all) expect(n).toBeGreaterThanOrEqual(44)
  })
  it('the figure button and the name field of a player are 44 px high', () => {
    expect(sizes('src/components/molecules/map/MapSeats.vue', '.ms-own')).toEqual(expect.arrayContaining([44, 44]))
    expect(sizes('src/components/molecules/map/MapSeats.vue', '.ms-input')).toContain(44)
  })
})

describe('the table of the family games keeps clear of the notch when the phone is held wide', () => {
  it('top bar and body leave room for the left and the right safe area', () => {
    const css = src('src/components/molecules/map/MapTable.vue')
    expect(css).toContain('env(safe-area-inset-left)')
    expect(css).toContain('env(safe-area-inset-right)')
    expect(css).not.toMatch(/padding-left: 10px/)
  })
})

describe('the order race: the choice of the adventure is a 44 px field', () => {
  it('no fixed 40 px height', () => {
    const css = src('src/views/app/AppFamilyOrderView.vue').replace(/\r/g, '')
    const at = css.indexOf('\n.fo-select\n')
    expect(at).toBeGreaterThan(-1)
    const block = css.slice(at, css.indexOf('\n\n', at + 2))
    expect(block).toMatch(/min-height: 44px/)
    expect(block).not.toMatch(/\n  height: 40px/)
  })
})

describe('english text of the way to the next game wish', () => {
  it('reads "1 more star until the next game wish", not "Still 1 star to"', () => {
    const big = (rawApp as unknown as { en: { app: { bigGames: { nextGame: string } } } }).en.app.bigGames
    expect(big.nextGame).toBe('1 more star until the next game wish. | {n} more stars until the next game wish.')
  })
})

describe('the Wortreise held wide: buttons of 44 px and a hint that is not cut off', () => {
  const css = () => src('src/views/app/AppFamilyWortreiseView.vue').replace(/\r/g, '')
  it('the buttons under the wheel are 44 px high', () => {
    expect(css()).not.toMatch(/\.wr-act\n\s+min-width: 0\n\s+height: 42px/)
    expect(css()).toMatch(/\.wr-act\n\s+min-width: 0\n\s+height: 44px/)
  })
  it('the line of the message wraps to two lines instead of ending in dots', () => {
    const text = css()
    const at = text.indexOf('  .wr-msg-t\n')
    const block = text.slice(at, text.indexOf('\n\n', at))
    expect(block).not.toMatch(/text-overflow: ellipsis/)
    expect(block).toMatch(/-webkit-line-clamp: 2/)
  })
})

describe('David: the card of the pause and of the end of a round fits a phone held wide (360 px high)', () => {
  const vue = () => src('src/components/molecules/games/BigGameDavid.vue').replace(/\r/g, '')
  it('the buttons of both cards stand in the wrapping row', () => {
    const text = vue()
    for (const marker of ["AdvButton(@click=\"paused = false\")", "AdvButton(v-if=\"outcome.phase === 'won' && level < GOLIATH_LEVEL\""]) {
      const at = text.indexOf(marker)
      expect(at, marker).toBeGreaterThan(-1)
      expect(text.slice(Math.max(0, at - 80), at)).toContain('div(class="dg-menu-buttons")')
    }
  })
  it('a rule for low screens makes the card tighter and the buttons narrower', () => {
    const text = vue()
    const at = text.indexOf('@media (max-height: 460px)')
    expect(at).toBeGreaterThan(-1)
    const block = text.slice(at, at + 400)
    expect(block).toContain('.dg-card')
    expect(block).toMatch(/min-width: 0/)
  })
})

describe('David does not repaint the whole picture 60 times a second behind a menu', () => {
  it('while nothing plays the picture is repainted at most every 250 ms (measured in the browser: 360 sprites a second before, a few now)', () => {
    const text = src('src/components/molecules/games/BigGameDavid.vue').replace(/\r/g, '')
    expect(text).toContain('const IDLE_DRAW_MS = 250')
    const at = text.indexOf('function frame(now: number)')
    const frame = text.slice(at, text.indexOf('\n}\n', at))
    expect(frame).toMatch(/running \|\| now - lastDraw >= IDLE_DRAW_MS/)
    // a canvas that was resized is empty: it is painted again at once
    expect(text.slice(text.indexOf('function resize()'), text.indexOf('/** One step of the whole game'))).toContain('lastDraw = 0')
  })
})

