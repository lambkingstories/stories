import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The two store workflows (Android and iOS) and the adventures they show.
 *
 *  - Android keeps the media of the adventures INSIDE the app: the size is the limit (Google warns that big apps are installed less, Anton wants a small main file), so its list
 *    stays short until Android has a way to keep the media outside (research of 24 Nov 2026).
 *  - iOS keeps the media NEXT TO the program (`media_split`, default `*`, proven on a real iPad on 24 Nov 2026): the 500 MB of Apple for the program file are no limit any more,
 *    so iOS shows all finished adventures. Without the split a long list would break the upload ("Invalid Executable Size").
 *  - Neither carries the flags of the test app.
 */
const read = (name: string) => readFileSync(`.github/workflows/${name}`, 'utf8')
const shown = (yml: string) => [...yml.matchAll(/^\s*VITE_SHOW_([A-Z]+):\s*"true"/gm)].map((m) => m[1]!).sort()

describe('store builds', () => {
  const android = read('android-build.yml')
  const ios = read('ios-build.yml')

  it('show on iOS everything that Android shows', () => {
    expect(shown(android).length).toBeGreaterThan(0)
    for (const id of shown(android)) expect(shown(ios)).toContain(id)
  })

  it('keep the list of Android short (22 flags and Josef = 23: about 447 MB of web files inside the app, twice for two processors)', () => {
    // one more adventure costs 10-30 MB inside the app: raise this number only with a decision of Anton and after measuring `du -sm dist`
    expect(shown(android).length).toBeLessThanOrEqual(22)
  })

  it('only let iOS show more than the 22 adventures that fit into the program file when the media are kept next to the program (the default of `media_split` is *)', () => {
    if (shown(ios).length > 22) expect(ios).toMatch(/media_split:[\s\S]*?default:\s*"\*"/)
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

  it('never put the test button into a build that is not a test (media_test is off by default)', () => {
    expect(ios).toMatch(/media_test:[\s\S]*?default:\s*false/)
  })
})

describe('the Android test build with the media pack (Play Asset Delivery)', () => {
  const pack = read('android-pack-build.yml')
  const ios = read('ios-build.yml')

  it('is a test: no store workflow, own version codes above the store builds, test button on', () => {
    expect(pack).toMatch(/VITE_MEDIA_SPLIT:\s*"\*"/)
    expect(pack).toMatch(/VITE_MEDIA_TEST:\s*"true"/)
    expect(pack).toMatch(/1000900 \+/)
    expect(pack).toContain('patch-android-assetpack.mjs')
  })

  it('shows every adventure that iOS shows (the media are outside the main file)', () => {
    expect(shown(pack)).toEqual(shown(ios))
  })
})
