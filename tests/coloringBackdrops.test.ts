import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BACKDROPS, isBackdropId } from '@/data/coloringBackdrops'

describe('backdrops', () => {
  it('starts with the plain light and offers a table, a meadow and the beach', () => {
    expect(BACKDROPS[0]!.id).toBe('plain')
    expect(BACKDROPS.map((b) => b.id)).toEqual(['plain', 'oak', 'meadow', 'sand'])
  })

  it('has a picture and a thumbnail for each backdrop except the plain one, and the files exist', () => {
    for (const b of BACKDROPS) {
      if (b.id === 'plain') {
        expect(b.image).toBe('')
        continue
      }
      for (const url of [b.image, b.thumb]) {
        expect(url).toMatch(/images\/ausmalen-bg\/[a-z-]+\.webp$/)
        const file = url.slice(url.indexOf('images/'))
        expect(existsSync(resolve(__dirname, '../public', file)), file).toBe(true)
      }
    }
  })

  it('knows its own ids', () => {
    for (const b of BACKDROPS) expect(isBackdropId(b.id)).toBe(true)
    expect(isBackdropId('moon')).toBe(false)
    expect(isBackdropId(null)).toBe(false)
  })
})
