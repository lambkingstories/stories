import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The two store workflows (Android and iOS) must show the same adventures, and must never carry the flags of the test app (Anton 22/23 Nov 2026:
 * as many adventures as fit into the update; the size is the limit: Apple stops at 500 MB for the program file, see `lambking-release-leitung`).
 */
const read = (name: string) => readFileSync(`.github/workflows/${name}`, 'utf8')
const shown = (yml: string) => [...yml.matchAll(/^\s*VITE_SHOW_([A-Z]+):\s*"true"/gm)].map((m) => m[1]!).sort()

describe('store builds', () => {
  const android = read('android-build.yml')
  const ios = read('ios-build.yml')

  it('show the same adventures in Android and iOS', () => {
    expect(shown(android)).toEqual(shown(ios))
    expect(shown(android).length).toBeGreaterThan(0)
  })

  it('keep the adventures that were measured to fit (21 flags and Josef = 22: 431 MB of web files, the limit of Apple is 500 MB for the program file)', () => {
    // one more adventure costs 10-30 MB: raise this number only after measuring `du -sm dist` and keeping 30 MB of air under 500 MB
    expect(shown(android).length).toBeLessThanOrEqual(22)
  })

  it('never carry the flags of the test app', () => {
    for (const yml of [android, ios]) {
      expect(yml).not.toMatch(/^\s*VITE_PLUS_TEST:/m)
      expect(yml).not.toMatch(/^\s*VITE_LOCAL_TEST_BOOKS:/m)
      expect(yml).not.toMatch(/^\s*VITE_PREMIUM_PREVIEW:/m)
    }
  })

  it('have the purchases on', () => {
    for (const yml of [android, ios]) expect(yml).toMatch(/VITE_PREMIUM_TEASER:\s*"true"/)
  })
})
