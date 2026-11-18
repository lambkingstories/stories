/** The long titles of the coloring books are split into series, volume and name; the books stand in two age groups. */
import { describe, expect, it } from 'vitest'
import { coloringAgeGroup, groupColoringBooks, shortColoringTitle, splitColoringTitle, type TitledCard } from '@/utils/coloringTitles'

describe('splitting a title', () => {
  it('takes the series and the volume off "Reihe: Band 1 - Name"', () => {
    expect(splitColoringTitle('Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt')).toEqual({
      series: 'Bibelgeschichten zum Ausmalen',
      volume: 1,
      name: 'Die Schöpfung - Gott macht die Welt'
    })
    expect(splitColoringTitle('Bibelgeschichten zum Ausmalen: Band 10 - Ostern - Jesus lebt!')).toMatchObject({ volume: 10, name: 'Ostern - Jesus lebt!' })
  })

  it('takes them off "Reihe: Name (Band 2)", too', () => {
    expect(splitColoringTitle('Mit Buntstift durch die Bibel: Noah, die Arche und der Regenbogen (Band 2)')).toEqual({
      series: 'Mit Buntstift durch die Bibel',
      volume: 2,
      name: 'Noah, die Arche und der Regenbogen'
    })
    expect(shortColoringTitle('Mit Buntstift durch die Bibel: Josef – Gott lässt dich nicht allein (Band 4)')).toBe('Josef – Gott lässt dich nicht allein')
  })

  it('works in English and Spanish, and for the old "Buch 01 –" books', () => {
    expect(splitColoringTitle('Bible Stories to Color: Volume 10 - Easter - Jesus Is Alive!')).toMatchObject({ series: 'Bible Stories to Color', volume: 10, name: 'Easter - Jesus Is Alive!' })
    expect(splitColoringTitle('Historias para colorear: Tomo 3 - David')).toMatchObject({ volume: 3, name: 'David' })
    expect(splitColoringTitle('Buch 01 – Die Schöpfung der Welt')).toEqual({ series: '', volume: 0, name: 'Die Schöpfung der Welt' })
  })

  it('leaves a title without such parts as it is', () => {
    expect(splitColoringTitle('Noah und die Arche')).toEqual({ series: '', volume: 0, name: 'Noah und die Arche' })
    expect(splitColoringTitle('Frage: was nun?')).toMatchObject({ name: 'Frage: was nun?' })
  })
})

describe('the age group', () => {
  it('follows the badge "ab N Jahren"', () => {
    expect(coloringAgeGroup({ badges: ['ab 5 Jahren', 'Ausmalen'] })).toBe('from5')
    expect(coloringAgeGroup({ badges: ['ab 4 Jahren'] })).toBe('from5')
    expect(coloringAgeGroup({ badges: ['ab 6 Jahren'] })).toBe('from5')
    expect(coloringAgeGroup({ badges: ['Ausmalen', 'ab 9 Jahren'] })).toBe('from9')
    expect(coloringAgeGroup({ badges: ['Ages 9 and up'] })).toBe('from9')
  })

  it('falls back to the series of the title', () => {
    expect(coloringAgeGroup({ badges: [] }, 'Bibelgeschichten zum Ausmalen: Band 6 - David')).toBe('from9')
    expect(coloringAgeGroup({}, 'Mit Buntstift durch die Bibel: Mose (Band 5)')).toBe('from5')
    expect(coloringAgeGroup({ badges: null })).toBe('from5')
  })
})

describe('the groups', () => {
  const card = (bookId: string, title: string, group: 'from5' | 'from9', released = 0): TitledCard => ({ bookId, released, group, parts: splitColoringTitle(title) })
  const list = [
    card('b10', 'Bibelgeschichten zum Ausmalen: Band 10 - Ostern', 'from9', 4),
    card('m5', 'Mit Buntstift durch die Bibel: Mose (Band 5)', 'from5', 13),
    card('b1', 'Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung', 'from9', 1),
    card('m2', 'Mit Buntstift durch die Bibel: Noah (Band 2)', 'from5', 10),
    card('old', 'Buch 01 – Die Schöpfung der Welt', 'from5', 1)
  ]

  it('puts "Ab 5 Jahren" before "Ab 9 Jahren", the volumes rising, and gives each group its series as the heading', () => {
    const sections = groupColoringBooks(list)
    expect(sections.map((s) => s.group)).toEqual(['from5', 'from9'])
    expect(sections[0]!.cards.map((c) => c.bookId)).toEqual(['old', 'm2', 'm5'])
    expect(sections[1]!.cards.map((c) => c.bookId)).toEqual(['b1', 'b10'])
    expect(sections[0]!.series).toBe('Mit Buntstift durch die Bibel')
    expect(sections[1]!.series).toBe('Bibelgeschichten zum Ausmalen')
  })

  it('leaves out an empty group and has no common heading for mixed series', () => {
    expect(groupColoringBooks(list.filter((c) => c.group === 'from9')).map((s) => s.group)).toEqual(['from9'])
    const mixed = groupColoringBooks([card('x', 'A: Name (Band 1)', 'from5'), card('y', 'B: Name (Band 1)', 'from5')])
    expect(mixed[0]!.series).toBe('')
    expect(groupColoringBooks([])).toEqual([])
  })
})
