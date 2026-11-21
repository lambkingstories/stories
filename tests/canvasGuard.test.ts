/**
 * No game may look squeezed or stretched (Anton and a tester, 21.11.2026, an iPhone turned sideways): the picture of every game canvas is made new as soon as the box of the
 * canvas has another size than the picture. The guard is tested here; that every game uses it is read from the sources.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import useCanvasGuard, { GUARD_WATCH_MS, canvasIsStale } from '@/use/useCanvasGuard'

const canvasOf = (width: number, height: number) => Object.assign(document.createElement('canvas'), { width, height })

describe('canvasIsStale', () => {
  it('is false when the picture has the size of the box (times the density, at most 2)', () => {
    expect(canvasIsStale(canvasOf(844, 390), { width: 844, height: 390 }, 1)).toBe(false)
    expect(canvasIsStale(canvasOf(1688, 780), { width: 844, height: 390 }, 2)).toBe(false)
    expect(canvasIsStale(canvasOf(1688, 780), { width: 844, height: 390 }, 3)).toBe(false)
  })
  it('is true when the box turned (the picture is still the old shape)', () => {
    expect(canvasIsStale(canvasOf(390, 844), { width: 844, height: 390 }, 1)).toBe(true)
    expect(canvasIsStale(canvasOf(932, 430), { width: 390, height: 844 }, 1)).toBe(true)
  })
  it('does not count a box without a size (not shown yet)', () => {
    expect(canvasIsStale(canvasOf(100, 100), { width: 0, height: 0 }, 1)).toBe(false)
  })
  it('allows a pixel of rounding', () => {
    expect(canvasIsStale(canvasOf(844, 390), { width: 844.4, height: 389.6 }, 1)).toBe(false)
  })
})

describe('the guard', () => {
  let rect = { width: 844, height: 390 }
  beforeEach(() => {
    vi.useFakeTimers()
    rect = { width: 844, height: 390 }
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ ...rect, x: 0, y: 0, top: 0, left: 0, right: rect.width, bottom: rect.height, toJSON: () => ({}) }) as DOMRect)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function setup() {
    const remake = vi.fn()
    const canvas = ref<HTMLCanvasElement | null>(null)
    const Comp = defineComponent({
      setup() {
        useCanvasGuard(canvas, () => {
          remake()
          // the game sets the picture to the size of the box
          if (canvas.value) {
            canvas.value.width = Math.round(rect.width)
            canvas.value.height = Math.round(rect.height)
          }
        })
        return () => h('canvas', { ref: canvas, width: 844, height: 390 })
      }
    })
    const w = mount(Comp, { attachTo: document.body })
    return { remake, w }
  }

  it('does nothing while the picture fits', () => {
    const { remake, w } = setup()
    vi.advanceTimersByTime(GUARD_WATCH_MS * 4)
    expect(remake).not.toHaveBeenCalled()
    w.unmount()
  })

  it('makes the picture new when the box has another shape (a turned phone), also without any event', () => {
    const { remake, w } = setup()
    rect = { width: 390, height: 844 }
    vi.advanceTimersByTime(GUARD_WATCH_MS + 10)
    expect(remake).toHaveBeenCalledTimes(1)
    // and once it is right, it leaves it alone
    vi.advanceTimersByTime(GUARD_WATCH_MS * 4)
    expect(remake).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('looks again a moment after a resize or a turn, when the new size was not there at the first look', () => {
    const { remake, w } = setup()
    // the phone is turned: the event comes, but the box still has the old size
    window.dispatchEvent(new Event('orientationchange'))
    expect(remake).not.toHaveBeenCalled()
    // a moment later the new size is there
    rect = { width: 390, height: 844 }
    vi.advanceTimersByTime(130)
    expect(remake).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('stops watching when the game is left', () => {
    const { remake, w } = setup()
    w.unmount()
    rect = { width: 390, height: 844 }
    vi.advanceTimersByTime(GUARD_WATCH_MS * 4)
    expect(remake).not.toHaveBeenCalled()
  })
})

describe('every game with a canvas uses the guard', () => {
  const dir = resolve(process.cwd(), 'src/components/molecules/games')
  const games = readdirSync(dir).filter((f) => /^BigGame.*\.vue$/.test(f) && readFileSync(resolve(dir, f), 'utf8').includes('<canvas') === false)
  const withCanvas = readdirSync(dir).filter((f) => /^BigGame.*\.vue$/.test(f) && /canvas\(|<canvas/.test(readFileSync(resolve(dir, f), 'utf8')))

  it('finds the ten games', () => {
    expect(withCanvas.length).toBeGreaterThanOrEqual(10)
    expect(games).toBeDefined()
  })
  it.each(withCanvas)('%s', (file) => {
    const s = readFileSync(resolve(dir, file), 'utf8')
    expect(s).toMatch(/useCanvasGuard\(canvas, \(\) => (resize|layout)\(\)/)
  })
})
