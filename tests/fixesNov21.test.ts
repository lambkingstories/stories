/**
 * Four things Anton found on 21.11.2026: the quiz button below the edge, the shadow of the book that flickered, David's sling squeezed on an iPhone turned sideways,
 * and "My coloring books" at the very top of the painting menu. The files are read as text (a layout cannot be measured in jsdom).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')

describe('painting menu', () => {
  it('shows "My coloring books" above the painting that was painted last', () => {
    const s = read('components/molecules/ColoringMenu.vue')
    const books = s.indexOf('id="ac-h-books"')
    expect(books).toBeGreaterThan(0)
    for (const other of ['id="ac-h-continue"', 'id="ac-h-first"', 'id="ac-h-exhibition"', 'id="ac-h-free"', 'id="ac-h-works"']) {
      expect(s.indexOf(other)).toBeGreaterThan(books)
    }
  })
})

describe('book of the shop', () => {
  it('has no shadow that fades in and out next to the turning leaf', () => {
    const s = read('components/molecules/BookFlip.vue')
    expect(s).not.toMatch(/\.bf-face\s*\n(?:.*\n)*?\s+&::after/)
    expect(s).not.toContain('.bf-rear::after')
    const spine = s.slice(s.indexOf('.bf-spine'), s.indexOf('.bf-single'))
    expect(spine).not.toContain('transition')
  })
})

describe('quiz', () => {
  it('keeps the verdict and the button at the lower edge when the phone is held upright', () => {
    const s = read('views/app/AppFamilyQuizView.vue')
    expect(s).toMatch(/@media \(orientation: portrait\)\s+\.fq-reveal\s+position: sticky\s+bottom:/)
  })
})

describe("David's sling", () => {
  it('checks the size of the canvas in every frame and listens to the turning of the phone', () => {
    const s = read('components/molecules/games/BigGameDavid.vue')
    expect(s).toContain('function keepSize()')
    expect(s).toMatch(/function frame\(now: number\) \{\s*raf = requestAnimationFrame\(frame\)\s*keepSize\(\)/)
    expect(s).toContain("window.addEventListener('orientationchange', resize)")
    expect(s).toContain("window.visualViewport?.addEventListener('resize', resize)")
  })

  it('keeps the sheep and the stones in one row on every screen (the pictures get narrower, they do not break into rows)', () => {
    const s = read('components/molecules/games/BigGameDavid.vue')
    const group = s.slice(s.indexOf('.dg-hud-group'), s.indexOf('.dg-menu-buttons'))
    expect(group).toContain('flex-wrap: nowrap')
    expect(group).toContain('object-fit: contain')
    expect(group).not.toContain('flex-wrap: wrap')
  })
})
