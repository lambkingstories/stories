/**
 * The colour box of the painting screen: at the bottom edge, or (a phone held wide) a strip at the side that scrolls up and down.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import messages from '@/i18n/app'
import ColoringShelf from '@/components/molecules/ColoringShelf.vue'
import { PENCIL_BASE } from '@/data/coloringKits'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

function shelf(side?: 'left' | 'right' | null, open = true) {
  return mount(ColoringShelf, {
    global: { plugins: [i18n] },
    props: {
      variant: 'pencil',
      items: PENCIL_BASE,
      extra: [],
      rainbow: null,
      color: PENCIL_BASE[0]!.color,
      customActive: false,
      open,
      arrowIcon: '/arrow.webp',
      ...(side === undefined ? {} : { side })
    }
  })
}

describe('ColoringShelf', () => {
  it('is the box at the bottom edge without a side', () => {
    const w = shelf()
    expect(w.find('.sh').classes()).not.toContain('is-side')
    expect(w.find('.sh').classes()).toContain('is-pencil')
  })

  it('is a strip at the right edge when the tool bar is on the left, and the other way round', () => {
    const right = shelf('right')
    expect(right.find('.sh').classes()).toEqual(expect.arrayContaining(['is-side', 'side-right']))
    const left = shelf('left')
    expect(left.find('.sh').classes()).toEqual(expect.arrayContaining(['is-side', 'side-left']))
  })

  it('keeps a button with a name for every colour and one tab that folds the box, also as a strip', () => {
    const w = shelf('right')
    expect(w.findAll('.sh-item').length).toBe(PENCIL_BASE.length)
    for (const b of w.findAll('.sh-item')) expect(b.attributes('aria-label')).toBeTruthy()
    expect(w.findAll('.sh-tab').length).toBe(1)
  })

  it('tells the parent when the tab is tapped and when a colour is chosen', async () => {
    const w = shelf('left')
    await w.find('.sh-tab').trigger('click')
    expect(w.emitted('toggle')).toHaveLength(1)
    await w.findAll('.sh-item')[2]!.trigger('click')
    expect(w.emitted('pick-color')?.[0]).toEqual([PENCIL_BASE[2]!.color])
  })

  it('shows folded as collapsed', () => {
    expect(shelf('right', false).find('.sh').classes()).toContain('collapsed')
  })
})
