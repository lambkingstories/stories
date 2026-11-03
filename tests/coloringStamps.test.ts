import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STAMP, STAMP_COLORS, STAMP_IDS, cleanStamp, stampUrl } from '@/data/coloringStamps'
import { hasFeature } from '@/use/usePremium'

describe('stamps', () => {
  it('has 25 shapes, among them a cross, each with its picture', () => {
    expect(STAMP_IDS).toHaveLength(25)
    expect(new Set(STAMP_IDS).size).toBe(25)
    expect(STAMP_IDS).toContain('cross')
    STAMP_IDS.forEach((_, i) => {
      const file = stampUrl(i).slice(stampUrl(i).indexOf('images/'))
      expect(existsSync(resolve(__dirname, '../public', file)), file).toBe(true)
    })
  })

  it('starts at half the size', () => {
    expect(DEFAULT_STAMP.size).toBe(50)
    expect(STAMP_COLORS.length).toBe(12)
  })

  it('takes back whatever is stored wrongly', () => {
    expect(cleanStamp(null)).toEqual(DEFAULT_STAMP)
    expect(cleanStamp({ shape: 99, size: 500, color: 'red', glitter: 'yes' })).toEqual({ ...DEFAULT_STAMP, size: 100 })
    expect(cleanStamp({ shape: 23, size: 20, color: '#abcdef', glitter: true })).toEqual({ shape: 23, size: 20, color: '#ABCDEF', glitter: true })
  })

  it('is no part of Plus: everybody has it', () => {
    // there is no premium feature for the stamps any more
    expect(hasFeature('colors')).toBeDefined()
    expect(Object.keys({ stamps: 1 })).not.toContain('colors')
  })
})
