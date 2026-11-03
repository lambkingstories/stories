import { describe, expect, it } from 'vitest'
import { clearWhereChanged, coverMaskPixels } from '@/utils/stickerCover'

const px = (r: number, g: number, b: number, a: number) => [r, g, b, a]

describe('coverMaskPixels', () => {
  it('is solid wherever the sprite has colour, and empty elsewhere', () => {
    const sprite = new Uint8ClampedArray([...px(10, 20, 30, 255), ...px(0, 0, 0, 0), ...px(5, 5, 5, 120), ...px(9, 9, 9, 3)])
    const mask = coverMaskPixels(sprite)
    expect([mask[3], mask[7], mask[11], mask[15]]).toEqual([255, 0, 255, 0])
  })
})

describe('clearWhereChanged', () => {
  const mask = () => new Uint8ClampedArray([...px(0, 0, 0, 255), ...px(0, 0, 0, 255), ...px(0, 0, 0, 0)])

  it('takes the mask away exactly where the paint changed', () => {
    const before = new Uint8ClampedArray([...px(1, 1, 1, 255), ...px(2, 2, 2, 255), ...px(0, 0, 0, 0)])
    const after = new Uint8ClampedArray([...px(1, 1, 1, 255), ...px(9, 2, 2, 255), ...px(7, 7, 7, 255)])
    const m = mask()
    expect(clearWhereChanged(m, before, after)).toBe(true)
    expect([m[3], m[7], m[11]]).toEqual([255, 0, 0])
  })

  it('leaves the mask alone when the paint is the same', () => {
    const same = new Uint8ClampedArray([...px(1, 1, 1, 255), ...px(2, 2, 2, 255), ...px(0, 0, 0, 0)])
    const m = mask()
    expect(clearWhereChanged(m, same, new Uint8ClampedArray(same))).toBe(false)
    expect([m[3], m[7]]).toEqual([255, 255])
  })

  it('a paint stroke outside the stickers changes nothing of the mask', () => {
    const before = new Uint8ClampedArray([...px(1, 1, 1, 255), ...px(2, 2, 2, 255), ...px(0, 0, 0, 0)])
    const after = new Uint8ClampedArray([...px(1, 1, 1, 255), ...px(2, 2, 2, 255), ...px(200, 0, 0, 255)])
    const m = mask()
    expect(clearWhereChanged(m, before, after)).toBe(false)
    expect([m[3], m[7], m[11]]).toEqual([255, 255, 0])
  })
})
