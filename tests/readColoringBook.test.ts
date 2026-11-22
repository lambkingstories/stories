/**
 * Reading a coloring book (Anton 22.11.2026): a button "read" next to "paint", the book big and turned like a real book (BookFlip, upright pages), the painted pages as they
 * were painted. The putting together of a painted page is tested with its size; the rest is read from the sources (a canvas cannot be drawn in jsdom).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPOSE_MAX_SIDE, composeColoringPage, composedSize } from '@/utils/composeColoringPage'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')

describe('the size of a painted page', () => {
  it('is the size of the line art when that is not too large', () => {
    expect(composedSize(900, 1200)).toEqual({ w: 900, h: 1200 })
  })
  it('is shrunk to the limit, keeping the shape', () => {
    const s = composedSize(2800, 3733)
    expect(Math.max(s.w, s.h)).toBe(COMPOSE_MAX_SIDE)
    expect(s.w / s.h).toBeCloseTo(2800 / 3733, 2)
  })
  it('is never zero', () => {
    expect(composedSize(0, 0)).toEqual({ w: 1, h: 1 })
  })
})

describe('the coloring book view', () => {
  const s = read('views/app/AppColoringBookView.vue')
  it('has a button to read the book next to the one to paint', () => {
    expect(s).toContain('data-test="read-book"')
    expect(s).toContain("t('app.coloring.read')")
  })
  it('reads with the page-turning book, with the cover first and the shape of the pages', () => {
    expect(s).toContain('BookFlip(v-if="reading" :pages="readPages" :ratio="readRatio"')
    expect(s).toContain('if (coverUrl.value) list.push(coverUrl.value)')
  })
  it('puts the words of a page before its picture (upright: words, then picture; sideways: words left, picture right)', () => {
    const textAt = s.indexOf('list.push({ text: { no: i + 1')
    const pictureAt = s.indexOf('list.push(shown)')
    expect(textAt).toBeGreaterThan(0)
    expect(pictureAt).toBeGreaterThan(textAt)
  })
  it('has paint and read side by side in one row, the page arrows at the ends of the strip', () => {
    expect(s).toMatch(/div\(class="bk-row bk-actions"\)\s+button\(type="button" class="bk-primary"[\s\S]*?button\(type="button" class="bk-read"/)
    expect(s).toContain('div(class="bk-stripbar")')
  })
  it('puts a painted page together with its painting, and only the open pages are read', () => {
    expect(s).toContain('composeColoringPage(line, blob)')
    expect(s).toContain('Math.min(pages.value.length, allowed.value)')
  })
  it('lets the pictures go when the reading is closed or the view is left', () => {
    expect(s).toContain('URL.revokeObjectURL(u)')
    expect(s).toMatch(/onBeforeUnmount\(\(\) => \{[\s\S]*closeReader\(\)/)
  })
})

describe('putting a painted page together', () => {
  afterEach(() => vi.restoreAllMocks())

  it('draws the painting first on white and the line art on top, multiplied, and gives a new picture address', async () => {
    const calls: string[] = []
    const ctx = {
      fillStyle: '',
      globalCompositeOperation: 'source-over',
      fillRect: vi.fn(() => calls.push('white')),
      drawImage: vi.fn((img: { id: string }) => calls.push(`${img.id}:${ctx.globalCompositeOperation}`))
    }
    const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/jpeg' })) }
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? canvas : Object.getPrototypeOf(document).createElement.call(document, tag))) as never)
    class FakeImage {
      id = ''
      naturalWidth = 1100
      naturalHeight = 1467
      width = 1100
      height = 1467
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(v: string) {
        this.id = v.startsWith('blob:layer') ? 'paint' : 'line'
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    let n = 0
    vi.stubGlobal('URL', { createObjectURL: () => (n++ === 0 ? 'blob:layer-1' : `blob:made-${n}`), revokeObjectURL: vi.fn() })

    const url = await composeColoringPage('blob:line-art', new Blob(['p'], { type: 'image/png' }))
    expect(calls).toEqual(['white', 'paint:source-over', 'line:multiply'])
    expect(Math.max(canvas.width, canvas.height)).toBe(COMPOSE_MAX_SIDE)
    expect(url).toMatch(/^blob:made-/)
    vi.unstubAllGlobals()
  })
})
