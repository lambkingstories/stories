/**
 * The reader of the digital picture book (`BookFlip`): two pages at a time when the phone lies on its side (the cover alone on the right), one page when it
 * stands upright, a leaf that turns, the page kept when the phone is turned, and nothing but a back button on top.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import BookFlip from '@/components/molecules/BookFlip.vue'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const pages = Array.from({ length: 7 }, (_, i) => `p/seite-${i + 1}.webp`)

function size(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })
  window.dispatchEvent(new Event('resize'))
}

const open = () => mount(BookFlip, { global: { plugins: [i18n] }, props: { pages }, attachTo: document.body })
type Reader = { go: (d: 1 | -1) => void }
const go = (w: ReturnType<typeof open>, d: 1 | -1) => (w.vm as unknown as Reader).go(d)
const src = (sel: string) => document.body.querySelector(`${sel} img`)?.getAttribute('src') ?? null
const turn = (ms = 1000) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => setTimeout(() => cb(0), 0) as unknown as number)
  size(900, 400)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('BookFlip, lying on its side', () => {
  it('shows the cover alone on the right, then the pages two by two', async () => {
    const w = open()
    expect(src('.bf-right')).toBe('p/seite-1.webp')
    expect(src('.bf-left')).toBeNull()
    go(w, 1)
    await turn()
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    expect(src('.bf-right')).toBe('p/seite-3.webp')
    go(w, 1)
    await turn()
    go(w, 1)
    await turn()
    // 7 pages: the spreads are 2/3, 4/5 and 6/7
    expect(src('.bf-left')).toBe('p/seite-6.webp')
    expect(src('.bf-right')).toBe('p/seite-7.webp')
    // the end: nothing happens
    go(w, 1)
    expect(document.body.querySelector('.bf-leaf')).toBeNull()
    w.unmount()
  })

  it('the page turns like a leaf: the old right page is its front, the new left page its back, and the new right page lies underneath', async () => {
    const w = open()
    go(w, 1)
    await turn(10)
    const leaf = document.body.querySelector<HTMLElement>('.bf-leaf')!
    expect(leaf.classList.contains('is-right')).toBe(true)
    expect(leaf.querySelector('.bf-front img')?.getAttribute('src')).toBe('p/seite-1.webp')
    expect(leaf.querySelector('.bf-rear img')?.getAttribute('src')).toBe('p/seite-2.webp')
    expect(src('.bf-right')).toBe('p/seite-3.webp')
    expect(leaf.style.transform).toContain('-180deg')
    // no second turn while the leaf is on its way
    go(w, 1)
    await turn()
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    // and back
    go(w, -1)
    await turn(10)
    expect(document.body.querySelector('.bf-leaf')!.classList.contains('is-left')).toBe(true)
    await turn()
    expect(src('.bf-right')).toBe('p/seite-1.webp')
    w.unmount()
  })

  it('has only a back button, and it asks to close; the arrow keys and a tap on an edge turn the page', async () => {
    const w = open()
    expect(document.body.querySelectorAll('button')).toHaveLength(1)
    document.body.querySelector<HTMLButtonElement>('.bf-back')!.click()
    expect(w.emitted('close')).toHaveLength(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await turn()
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    await w.find('.bf-root').trigger('click', { clientX: 20 })
    await turn()
    expect(src('.bf-right')).toBe('p/seite-1.webp')
    // the middle does nothing
    await w.find('.bf-root').trigger('click', { clientX: 450 })
    expect(document.body.querySelector('.bf-leaf')).toBeNull()
    w.unmount()
  })
})

describe('BookFlip, standing upright', () => {
  it('shows one page as large as the screen allows and keeps the page when the phone is turned', async () => {
    const w = open()
    go(w, 1)
    await turn()
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    size(400, 800)
    await turn(10)
    expect(document.body.querySelector('.bf-single')).not.toBeNull()
    expect(src('.bf-single')).toBe('p/seite-2.webp')
    const book = document.body.querySelector<HTMLElement>('.bf-book')!
    expect(book.style.width).toBe('400px')
    expect(book.style.height).toBe('400px')
    go(w, 1)
    await turn(10)
    // the old page swings away to the left, the next one lies underneath
    expect(document.body.querySelector('.bf-leaf .bf-front img')?.getAttribute('src')).toBe('p/seite-2.webp')
    expect(src('.bf-single')).toBe('p/seite-3.webp')
    await turn()
    expect(src('.bf-single')).toBe('p/seite-3.webp')
    go(w, -1)
    await turn(10)
    expect(document.body.querySelector('.bf-leaf .bf-front img')?.getAttribute('src')).toBe('p/seite-2.webp')
    await turn()
    expect(src('.bf-single')).toBe('p/seite-2.webp')
    // back on its side: page 2 is the left page of the spread 2/3
    size(900, 400)
    await turn(10)
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    w.unmount()
  })

  it('changes the page at once where the person wants less movement', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    const w = open()
    go(w, 1)
    await turn(0)
    expect(document.body.querySelector('.bf-leaf')).toBeNull()
    expect(src('.bf-left')).toBe('p/seite-2.webp')
    w.unmount()
  })
})
