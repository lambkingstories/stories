import { describe, expect, it } from 'vitest'
import { isHiddenBook, isHiddenBookOrSeries, isHiddenSeries } from '@/data/hiddenBooks'

describe('hidden books and series', () => {
  it('hides the series "Gute Nacht Lilly" with all its books, and nothing else', () => {
    expect(isHiddenSeries('gute-nacht-lilly')).toBe(true)
    expect(isHiddenSeries('die-tiere-von-talheim')).toBe(false)
    expect(isHiddenSeries(undefined)).toBe(false)
    expect(isHiddenBookOrSeries({ bookId: 'gl-13-wer-hat-die-welt-erfunden', bookSeriesId: 'gute-nacht-lilly' })).toBe(true)
    expect(isHiddenBookOrSeries({ bookId: 'tt-01-ein-neuer-tag', bookSeriesId: 'die-tiere-von-talheim' })).toBe(false)
  })

  it('still hides the single book "Die Schöpfung der Welt"', () => {
    expect(isHiddenBook('ba-01-die-schoepfung-der-welt')).toBe(true)
    expect(isHiddenBookOrSeries({ bookId: 'ba-01-die-schoepfung-der-welt', bookSeriesId: 'bibelgeschichten-zum-ausmalen' })).toBe(true)
  })
})
