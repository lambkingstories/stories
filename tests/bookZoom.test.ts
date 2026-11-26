/**
 * Enlarging in the digital book: two fingers enlarge and shrink the page (a double tap in the middle does it too); an enlarged page is moved with one finger and
 * does not turn; turning the phone or a page goes back to the whole page.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import BookFlip from '@/components/molecules/BookFlip.vue'
import { ZOOM_MAX, ZOOM_TAP, clampZoom, zoomAround } from '@/utils/bookZoom'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const pages = Array.from({ length: 7 }, (_, i) => `p/seite-${i + 1}.webp`)
const room = { w: 400, h: 800, bw: 400, bh: 533 }

function size(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })
  window.dispatchEvent(new Event('resize'))
}

const open = () => mount(BookFlip, { global: { plugins: [i18n] }, props: { pages, ratio: 0.75 }, attachTo: document.body })
type Reader = { zoom: { s: number; x: number; y: number }; page: number }
const vm = (w: ReturnType<typeof open>) => w.vm as unknown as Reader
const tap = async (w: ReturnType<typeof open>, x: number, y = 400) => w.find('.bf-root').trigger('click', { clientX: x, clientY: y })
const fingers = (list: [number, number][]) => list.map(([clientX, clientY]) => ({ clientX, clientY }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(10_000)
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => setTimeout(() => cb(0), 0) as unknown as number)
  size(400, 800)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('magnifier arithmetic', () => {
  it('stays between the whole page and four times, and the page cannot be pushed off the screen', () => {
    expect(clampZoom({ s: 0.3, x: 50, y: 50 }, room)).toEqual({ s: 1, x: 0, y: 0 })
    expect(clampZoom({ s: 99, x: 0, y: 0 }, room).s).toBe(ZOOM_MAX)
    const z = clampZoom({ s: 2, x: 5000, y: -5000 }, room)
    expect(z.x).toBe((400 * 2 - 400) / 2)
    expect(z.y).toBe(-(533 * 2 - 800) / 2)
  })

  it('keeps the place under the finger when it enlarges', () => {
    const z = zoomAround({ s: 1, x: 0, y: 0 }, 2, 60, 40, { w: 400, h: 400, bw: 400, bh: 400 })
    // the point 60/40 right of and below the middle: 60 - 2 * 60 = -60
    expect(z).toEqual({ s: 2, x: -60, y: -40 })
  })
})

const pinch = async (w: ReturnType<typeof open>, from: number, to: number) => {
  const root = w.find('.bf-root')
  await root.trigger('touchstart', { touches: fingers([[200 - from / 2, 400], [200 + from / 2, 400]]) })
  await root.trigger('touchmove', { touches: fingers([[200 - to / 2, 400], [200 + to / 2, 400]]) })
  await root.trigger('touchend', { touches: [], changedTouches: fingers([[200 + to / 2, 400]]) })
}

describe('enlarging in the reader', () => {
  it('two fingers apart enlarge, two fingers together shrink back to the whole page, never smaller', async () => {
    const w = open()
    await pinch(w, 100, 300)
    expect(vm(w).zoom.s).toBeCloseTo(3, 5)
    expect(w.find('.bf-zoom').attributes('style')).toContain('scale(3)')
    vi.setSystemTime(20_000)
    await pinch(w, 300, 200)
    expect(vm(w).zoom.s).toBeCloseTo(2, 5)
    vi.setSystemTime(30_000)
    await pinch(w, 300, 40)
    expect(vm(w).zoom).toMatchObject({ s: 1, x: 0, y: 0 })
    expect(vm(w).page).toBe(0)
    w.unmount()
  })

  it('a double tap in the middle enlarges; enlarged, a tap at the edge does not turn the page', async () => {
    const w = open()
    await tap(w, 200)
    await tap(w, 200)
    expect(vm(w).zoom.s).toBe(ZOOM_TAP)
    vi.setSystemTime(20_000)
    await tap(w, 390)
    await vi.advanceTimersByTimeAsync(1000)
    expect(vm(w).page).toBe(0)
    // a double tap goes back to the whole page
    vi.setSystemTime(30_000)
    await tap(w, 200)
    await tap(w, 200)
    expect(vm(w).zoom.s).toBe(1)
    w.unmount()
  })

  it('a tap at the edge of the whole page still turns at once', async () => {
    const w = open()
    await tap(w, 390)
    await vi.advanceTimersByTimeAsync(1000)
    expect(vm(w).page).toBe(1)
    w.unmount()
  })

  it('two fingers enlarge, one finger moves, and a swipe on an enlarged page does not turn it', async () => {
    const w = open()
    const root = w.find('.bf-root')
    await root.trigger('touchstart', { touches: fingers([[150, 400], [250, 400]]) })
    await root.trigger('touchmove', { touches: fingers([[100, 400], [300, 400]]) })
    expect(vm(w).zoom.s).toBeCloseTo(2, 5)
    await root.trigger('touchend', { touches: [], changedTouches: fingers([[300, 400]]) })
    const before = vm(w).zoom.x
    await root.trigger('touchstart', { touches: fingers([[300, 400]]) })
    await root.trigger('touchmove', { touches: fingers([[200, 400]]) })
    await root.trigger('touchend', { touches: [], changedTouches: fingers([[200, 400]]) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(vm(w).zoom.x).toBeLessThan(before)
    expect(vm(w).page).toBe(0)
    w.unmount()
  })

  it('goes back to the whole page when the phone is turned', async () => {
    const w = open()
    await pinch(w, 100, 300)
    size(800, 400)
    await w.vm.$nextTick()
    expect(vm(w).zoom.s).toBe(1)
    w.unmount()
  })
})
