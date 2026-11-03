import { describe, expect, it } from 'vitest'
import { isHiddenBook } from '@/data/hiddenBooks'

describe('hidden books', () => {
  it('leaves out "Die Schöpfung der Welt" and nothing else', () => {
    expect(isHiddenBook('ba-01-die-schoepfung-der-welt')).toBe(true)
    expect(isHiddenBook('ba-02-gott-erschafft-die-welt')).toBe(false)
    expect(isHiddenBook('ba-1-buntstift-schoepfung')).toBe(false)
  })
})
