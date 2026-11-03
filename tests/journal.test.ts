import { beforeEach, describe, expect, it } from 'vitest'
import useJournal, { MAX_TEXT } from '../src/use/useJournal'

describe('journal', () => {
  beforeEach(() => {
    localStorage.clear()
    const j = useJournal()
    for (const e of [...j.entries.value]) j.remove(e.id)
  })

  it('keeps an entry and lists the newest first', () => {
    const j = useJournal()
    expect(j.add('erster', null, 1000)).toBe(true)
    expect(j.add('zweiter', null, 2000)).toBe(true)
    expect(j.entries.value.map((e) => e.text)).toEqual(['zweiter', 'erster'])
  })

  it('makes no entry without a word and without a drawing', () => {
    const j = useJournal()
    expect(j.add('   ', null)).toBe(false)
    expect(j.count.value).toBe(0)
    expect(j.add('', 'data:image/jpeg;base64,AAAA')).toBe(true)
  })

  it('cuts a text that is too long', () => {
    const j = useJournal()
    j.add('x'.repeat(MAX_TEXT + 50))
    expect(j.entries.value[0]!.text).toHaveLength(MAX_TEXT)
  })

  it('removes an entry', () => {
    const j = useJournal()
    j.add('weg', null, 5)
    j.remove(j.entries.value[0]!.id)
    expect(j.count.value).toBe(0)
  })

  it('is stored on the device', () => {
    useJournal().add('bleibt', null, 7)
    expect(JSON.parse(localStorage.getItem('lk-journal-v1')!)[0].text).toBe('bleibt')
  })
})
