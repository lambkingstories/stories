import { describe, expect, it } from 'vitest'
import { splitForSpeech } from '../src/utils/deviceVoice'

describe('device voice: pieces of text', () => {
  it('cuts after sentences and keeps every word', () => {
    const text = 'Es war einmal ein Igel. Er wollte umarmt werden! Doch wer traut sich? Niemand.'
    const out = splitForSpeech(text, 40)
    expect(out.every((p) => p.length <= 40)).toBe(true)
    expect(out.join(' ').replace(/\s+/g, ' ')).toBe(text)
  })

  it('puts a paragraph break between pieces', () => {
    expect(splitForSpeech('Eins.\n\nZwei.', 240)).toEqual(['Eins.', 'Zwei.'])
  })

  it('cuts a sentence that is too long at a comma, then at a space', () => {
    const long = 'Der kleine Igel ging durch den Wald, über die Wiese, am Bach entlang und immer weiter bis zum Abend ohne anzuhalten'
    const out = splitForSpeech(long, 40)
    expect(out.length).toBeGreaterThan(2)
    expect(out.every((p) => p.length <= 41)).toBe(true)
    expect(out.join(' ').replace(/\s+/g, ' ')).toBe(long)
  })

  it('gives nothing for an empty text', () => {
    expect(splitForSpeech('  \n ')).toEqual([])
  })
})
