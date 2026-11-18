/**
 * The open coloring book (`ColoringSpread`): the words of the page on the left, the picture on the right; a turn lays the leaf over and then goes to the
 * next page; on an upright screen the page changes at once; a tap on the picture goes on to painting.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import ColoringSpread from '@/components/molecules/ColoringSpread.vue'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const pages = Array.from({ length: 4 }, (_, i) => ({ n: i + 1, url: `p/${i + 1}.webp`, title: `Bild ${i + 1}`, reference: `1. Mose ${i + 1}`, text: `Text ${i + 1}` }))

function size(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })
  window.dispatchEvent(new Event('resize'))
}

const open = (index = 0, locked: number[] = []) =>
  mount(ColoringSpread, {
    global: { plugins: [i18n] },
    props: { pages, index, lineOf: (p: (typeof pages)[number]) => p.url, layerOf: () => '', isLocked: (i: number) => locked.includes(i), prepare: async () => {} },
    attachTo: document.body
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => setTimeout(() => cb(0), 0) as unknown as number)
  size(1000, 600)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('ColoringSpread', () => {
  it('shows the words on the left and the picture on the right', () => {
    const w = open(1)
    expect(w.find('.sp-left').text()).toContain('Bild 2')
    expect(w.find('.sp-left').text()).toContain('1. Mose 2')
    expect(w.find('.sp-left').text()).toContain('Text 2')
    expect(w.find('.sp-right img.sp-line').attributes('src')).toBe('p/2.webp')
  })

  it('turns a leaf and then asks for the next page', async () => {
    const w = open(0)
    ;(w.vm as unknown as { flip: (i: number) => Promise<void> }).flip(1)
    await vi.advanceTimersByTimeAsync(20)
    expect(w.find('.sp-leaf').exists()).toBe(true)
    // while it turns the old words stay on the left and the new picture lies on the right
    expect(w.find('.sp-left').text()).toContain('Bild 1')
    expect(w.find('.sp-right img.sp-line').attributes('src')).toBe('p/2.webp')
    expect(w.emitted('go')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1000)
    expect(w.emitted('go')).toEqual([[1]])
    expect(w.find('.sp-leaf').exists()).toBe(false)
  })

  it('turns back with the leaf on the left side', async () => {
    const w = open(2)
    ;(w.vm as unknown as { flip: (i: number) => Promise<void> }).flip(1)
    await vi.advanceTimersByTimeAsync(20)
    expect(w.find('.sp-leaf').classes()).toContain('is-back')
    expect(w.find('.sp-left').text()).toContain('Bild 2')
    await vi.advanceTimersByTimeAsync(1000)
    expect(w.emitted('go')).toEqual([[1]])
  })

  it('does not turn beyond the first and the last page', async () => {
    const w = open(0)
    const vm = w.vm as unknown as { flip: (i: number) => Promise<void> }
    await vm.flip(-1)
    await vm.flip(9)
    await vi.advanceTimersByTimeAsync(1000)
    expect(w.emitted('go')).toBeUndefined()
  })

  it('changes the page at once on an upright screen', async () => {
    size(400, 800)
    const w = open(0)
    await w.vm.$nextTick()
    expect(w.find('.sp-book').classes()).toContain('is-stacked')
    await (w.vm as unknown as { flip: (i: number) => Promise<void> }).flip(1)
    expect(w.find('.sp-leaf').exists()).toBe(false)
    expect(w.emitted('go')).toEqual([[1]])
  })

  it('goes on to painting with a tap on the picture', async () => {
    const w = open(0)
    await w.find('.sp-right').trigger('click')
    expect(w.emitted('paint')).toHaveLength(1)
  })

  it('shows none of the words of a locked page (no title, no Bible passage, no text), only veiled bars', () => {
    const w = open(1, [1])
    const left = w.find('.sp-left')
    expect(left.text()).not.toContain('Bild 2')
    expect(left.text()).not.toContain('1. Mose 2')
    expect(left.text()).not.toContain('Text 2')
    expect(left.html()).not.toContain('Text 2')
    expect(left.findAll('.sp-bar').length).toBeGreaterThan(3)
    // the number of the page stays, and an open page still shows its words
    expect(left.text()).toContain('2')
    const open1 = open(0, [1])
    expect(open1.find('.sp-left').text()).toContain('Text 1')
    expect(open1.find('.sp-left .sp-bar').exists()).toBe(false)
  })

  it('lays a bright veil over a locked picture (no grey blur copies)', () => {
    const w = open(1, [1])
    expect(w.find('.sp-right .sp-veil').exists()).toBe(true)
    expect(w.findAll('.sp-right img.sp-line')).toHaveLength(1)
    expect(open(0, [1]).find('.sp-right .sp-veil').exists()).toBe(false)
  })

  it('marks a locked picture with the Plus sign, not with a lock', () => {
    const w = open(1, [1])
    expect(w.find('.sp-lock').exists()).toBe(true)
    expect(w.find('.sp-lock').text()).toContain('Plus')
    expect(w.text()).not.toContain('🔒')
  })
})
