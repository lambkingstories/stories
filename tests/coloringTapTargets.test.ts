/**
 * Everything a finger has to hit in the painting area is at least 48 x 48 px (Anton's rule, 18.11.2026): the buttons of the top bar (also on a phone), the arrows of
 * the pages, "fold away" of the tool bar, the page numbers and "Gedruckt bestellen" of a book, the small round buttons over a picture. Read from the style sheets.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf-8').split(String.fromCharCode(13)).join('')

/** The declarations of the first rule with exactly this selector (sass, indented). */
function rule(src: string, selector: string): string {
  const at = src.indexOf('\n' + selector + '\n')
  expect(at, selector).toBeGreaterThan(-1)
  const rest = src.slice(at + selector.length + 2)
  const end = rest.search(/\n[^\s]/)
  return end < 0 ? rest : rest.slice(0, end)
}
const px = (block: string, prop: string) => Number(new RegExp(`(?:^|\\n)\\s*${prop}:\\s*(\\d+)px`).exec(block)?.[1] ?? 0)

describe('48 px for a finger', () => {
  const view = read('views/app/AppColoringView.vue')
  const book = read('views/app/AppColoringBookView.vue')
  const menu = read('components/molecules/ColoringMenu.vue')
  const bar = read('components/molecules/ColoringToolbar.vue')

  it('the buttons of the top bar and the arrows of the pages', () => {
    for (const sel of ['.ac-btn', '.ac-pg-btn']) {
      const b = rule(view, sel)
      expect(px(b, 'width'), sel).toBeGreaterThanOrEqual(48)
      expect(px(b, 'height'), sel).toBeGreaterThanOrEqual(48)
    }
  })

  it('no smaller button sizes are set for phones (the old rule made them 36 px)', () => {
    const phones = view.slice(view.indexOf('@media (max-width: 520px)'), view.indexOf('// ── Finished picture, awards'))
    expect(phones).not.toMatch(/\.ac-btn\s*\n\s+width:\s*3\d/)
    expect(phones).not.toMatch(/\.ac-pg-btn\s*\n\s+width:\s*[23]\d/)
    const flat = view.slice(view.indexOf('@media (max-height: 450px) and (orientation: landscape)\n  .ac-top'))
    expect(flat).not.toMatch(/\.ac-btn\s*\n\s+width:\s*4[0-7]/)
    expect(flat).not.toMatch(/\.ac-pg-btn\s*\n\s+width:\s*[23]\d/)
  })

  it('"fold away" of the tool bar, also where the other buttons are tighter', () => {
    const b = bar.slice(bar.indexOf('.tb .tb-btn.tb-collapse'))
    expect(px(b, 'width')).toBeGreaterThanOrEqual(48)
    expect(px(b, 'height')).toBeGreaterThanOrEqual(48)
  })

  it('the page numbers, the arrows and "Gedruckt bestellen" of a book', () => {
    for (const sel of ['.bk-btn', '.bk-nav', '.bk-thumb']) {
      const b = rule(book, sel)
      expect(px(b, 'width'), sel).toBeGreaterThanOrEqual(48)
      expect(px(b, 'height'), sel).toBeGreaterThanOrEqual(48)
    }
    expect(px(rule(book, '.bk-link'), 'min-height')).toBeGreaterThanOrEqual(48)
  })

  it('the round buttons over a picture of the menu (take a book off the shelf, delete a picture)', () => {
    for (const sel of ['.ac-bigbook-remove', '.ac-work-del']) {
      const b = rule(menu, sel)
      expect(px(b, 'width'), sel).toBeGreaterThanOrEqual(48)
      expect(px(b, 'height'), sel).toBeGreaterThanOrEqual(48)
    }
  })
})
