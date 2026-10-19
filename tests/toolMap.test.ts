import { describe, expect, it } from 'vitest'
import { buildRegionMap } from '@/utils/coloringRegions'
import { gridSize, TOOL_CODES, ToolMap, zoneCells } from '@/utils/toolMap'

/** A picture on a small grid: RGBA with `cells` painted in one colour. */
const W = 20
const H = 10
const blank = () => new Uint8ClampedArray(W * H * 4)
const painted = (cells: number[], rgb: [number, number, number] = [200, 30, 30]) => {
  const px = blank()
  for (const c of cells) px.set([...rgb, 255], c * 4)
  return px
}
const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i)

describe('the tool map of a painted picture', () => {
  it('writes the tool of an action where the picture changed and is painted', () => {
    const m = new ToolMap(W, H)
    m.record(TOOL_CODES.pencil, blank(), painted(range(0, 40)))
    expect([...m.codes.slice(0, 40)].every((c) => c === TOOL_CODES.pencil)).toBe(true)
    expect(m.codes[40]).toBe(0)
  })

  it('the paint that is visible now counts: a place painted over belongs to the tool that painted it last', () => {
    const m = new ToolMap(W, H)
    const first = painted(range(0, 40), [200, 30, 30])
    m.record(TOOL_CODES.pencil, blank(), first)
    // the felt-tip marker goes over the first 20 cells (another colour) and over 20 new ones
    const second = painted(range(20, 60), [30, 30, 200])
    second.set(first.slice(0, 20 * 4), 0)
    m.record(TOOL_CODES.felt, first, second)
    expect(m.codes[10]).toBe(TOOL_CODES.pencil)
    expect(m.codes[30]).toBe(TOOL_CODES.felt)
    expect(m.codes[50]).toBe(TOOL_CODES.felt)
  })

  it('a stroke that changes nothing writes nothing', () => {
    const m = new ToolMap(W, H)
    const px = painted(range(0, 40))
    m.record(TOOL_CODES.pencil, blank(), px)
    m.record(TOOL_CODES.felt, px, px)
    expect(m.codes[5]).toBe(TOOL_CODES.pencil)
  })

  it('the eraser clears the places that are bare again and leaves the rest', () => {
    const m = new ToolMap(W, H)
    const full = painted(range(0, 40))
    m.record(TOOL_CODES.pencil, blank(), full)
    m.record(0, full, painted(range(20, 40)))
    expect(m.codes[10]).toBe(0)
    expect(m.codes[30]).toBe(TOOL_CODES.pencil)
  })

  it('undo and redo go along with the picture; a new action after an undo ends the redo line', () => {
    const m = new ToolMap(W, H)
    const a = painted(range(0, 20))
    m.record(TOOL_CODES.pencil, blank(), a)
    const b = painted(range(0, 40), [30, 30, 200])
    m.record(TOOL_CODES.felt, a, b)
    expect(m.codes[30]).toBe(TOOL_CODES.felt)
    expect(m.undo()).toBe(true)
    expect(m.codes[30]).toBe(0)
    expect(m.codes[5]).toBe(TOOL_CODES.pencil)
    expect(m.redo()).toBe(true)
    expect(m.codes[30]).toBe(TOOL_CODES.felt)
    m.undo()
    m.record(TOOL_CODES.chalk, a, painted(range(0, 30), [10, 200, 10]))
    expect(m.redo()).toBe(false)
    expect(m.undo()).toBe(true)
    expect(m.undo()).toBe(true)
    expect(m.undo()).toBe(false)
    expect([...m.codes].every((c) => c === 0)).toBe(true)
  })

  it('keeps as many steps as the history of the picture (40)', () => {
    const m = new ToolMap(W, H)
    let before = blank()
    for (let i = 0; i < 45; i++) {
      const after = painted([i])
      m.record(TOOL_CODES.pencil, before, after)
      before = after
    }
    let n = 0
    while (m.undo()) n++
    expect(n).toBe(40)
  })

  it('a loaded picture is a new beginning: nothing to undo', () => {
    const m = new ToolMap(W, H)
    m.record(TOOL_CODES.pencil, blank(), painted([1]))
    m.rebase()
    expect(m.undo()).toBe(false)
    expect(m.codes[1]).toBe(TOOL_CODES.pencil)
  })

  it('is kept with the saved picture and read back; a picture of another size starts without it', () => {
    const m = new ToolMap(W, H)
    m.record(TOOL_CODES.watercolor, blank(), painted(range(5, 77)))
    const text = m.encode()
    expect(text.length).toBeLessThan(80)
    const back = ToolMap.decode(text, W, H)!
    expect([...back.codes]).toEqual([...m.codes])
    expect(ToolMap.decode(text, W + 1, H)).toBeNull()
    expect(ToolMap.decode(null, W, H)).toBeNull()
    expect(ToolMap.decode('20:10:garbage', W, H)).toBeNull()
    expect(ToolMap.decode('20:10:0x5', W, H)).toBeNull()
  })

  it('the grid is as coarse as needed: 240 cells along the longer side', () => {
    expect(gridSize(1400, 1867)).toEqual({ w: 180, h: 240 })
    expect(gridSize(1000, 500)).toEqual({ w: 240, h: 120 })
  })
})

describe('the zones of a picture: the closed fields of the line art', () => {
  /** A line art of 100 x 100: a frame with a wall in the middle makes a left and a right room. */
  const frame: [number, number, number, number][] = [[10, 10, 89, 12], [10, 87, 89, 89], [10, 10, 12, 89], [87, 10, 89, 89], [48, 10, 51, 89]]
  const art = () => {
    const data = new Uint8ClampedArray(100 * 100 * 4).fill(255)
    for (const [x0, y0, x1, y1] of frame) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) data.set([0, 0, 0, 255], (y * 100 + x) * 4)
    return { data, width: 100, height: 100 }
  }
  const map = buildRegionMap(art(), 1, 1)

  it('a point inside a field takes the whole field, and only that one', () => {
    const left = zoneCells(map, [[30, 50]], 50, 50)
    expect(left[25 * 50 + 15]).toBe(1)
    expect(left[25 * 50 + 35]).toBe(0)
    expect(left[0]).toBe(0)
  })

  it('a zone of two fields: one point in each; a point on an outline takes the field next to it; a point in no field takes nothing', () => {
    const both = zoneCells(map, [[30, 50], [70, 50]], 50, 50)
    expect(both[25 * 50 + 15]).toBe(1)
    expect(both[25 * 50 + 35]).toBe(1)
    expect(zoneCells(map, [[12, 50]], 50, 50)[25 * 50 + 15]).toBe(1)
    expect(zoneCells(map, [], 50, 50).every((c) => c === 0)).toBe(true)
  })
})
