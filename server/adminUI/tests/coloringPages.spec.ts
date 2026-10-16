import { describe, expect, it } from 'vitest'
import {
  alignToGerman,
  movePage,
  newColoringPage,
  pageOf,
  removePage,
  setPageField,
  sortFilesNaturally,
  titleFromFileName
} from '@/utils/coloringPages'
import { isColoringBook } from '@/utils/coloringBook'

const pages = () => [newColoringPage(1, 'a.webp', 'A'), newColoringPage(2, 'b.webp', 'B'), newColoringPage(3, 'c.webp', 'C')]

describe('coloring pages helpers', () => {
  it('sorts file names the way a person counts', () => {
    const names = sortFilesNaturally(['b10.png', 'b2.png', 'b1.png'].map((name) => ({ name }))).map((f) => f.name)
    expect(names).toEqual(['b1.png', 'b2.png', 'b10.png'])
  })

  it('makes a title from a file name, or none when it says nothing', () => {
    expect(titleFromFileName('003_arche-baut.png')).toBe('Arche baut')
    expect(titleFromFileName('007.png')).toBe('')
    expect(titleFromFileName('IMG_0042.webp')).toBe('IMG 0042')
  })

  it('moves and removes pages and numbers them again', () => {
    expect(movePage(pages(), 2, -1).map((p) => p.title)).toEqual(['A', 'C', 'B'])
    expect(movePage(pages(), 2, -1).map((p) => p.page)).toEqual([1, 2, 3])
    expect(movePage(pages(), 0, -1).map((p) => p.title)).toEqual(['A', 'B', 'C'])
    expect(removePage(pages(), 1).map((p) => [p.page, p.title])).toEqual([[1, 'A'], [2, 'C']])
  })

  it('matches the pages of another language by their picture', () => {
    const en = setPageField([], pages()[1]!, 'title', 'Land')
    expect(en).toEqual([{ page: 2, title: 'Land', text: '', image: 'b.webp', reference: '' }])
    expect(pageOf(en, pages()[1]!)?.title).toBe('Land')
    expect(pageOf(en, pages()[0]!)).toBeUndefined()
    // a field is set on the page that exists, not on a new one
    expect(setPageField(en, pages()[1]!, 'text', 'Grass').length).toBe(1)
  })

  it('puts the English pages in the order of the German ones and drops the ones without a picture', () => {
    const de = movePage(pages(), 2, -2) // C A B
    let en = setPageField([], pages()[0]!, 'title', 'a-en')
    en = setPageField(en, pages()[2]!, 'title', 'c-en')
    en = setPageField(en, { ...newColoringPage(9, 'gone.webp') }, 'title', 'x')
    expect(alignToGerman(en, de).map((p) => [p.page, p.title])).toEqual([[1, 'c-en'], [2, 'a-en']])
  })

  it('knows a coloring book by its kind, and an old one by its category', () => {
    expect(isColoringBook({ kind: 'coloring', category: 'Früchte' })).toBe(true)
    expect(isColoringBook({ kind: 'story', category: 'Ausmalbücher' })).toBe(false)
    expect(isColoringBook({ category: 'Ausmahlbücher' })).toBe(true)
  })
})
