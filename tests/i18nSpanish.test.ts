import { describe, expect, it } from 'vitest'
import app from '../src/i18n/app'
import spanish from '../src/i18n/app.es'

type Tree = Record<string, unknown>

function flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof value === 'string') out[prefix] = value
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out))
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value as Tree)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  return out
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()

const en = flatten((app as Tree).en)
const es = flatten((spanish as Tree).es)

describe('Spanish screens', () => {
  it('has every text of the English screens', () => {
    const missing = Object.keys(en).filter((k) => !(k in es))
    expect(missing).toEqual([])
  })

  it('has no text that does not exist in English', () => {
    const extra = Object.keys(es).filter((k) => !(k in en))
    // the name of the language itself is only here
    expect(extra.filter((k) => k !== 'app.language.spanish')).toEqual([])
  })

  it('keeps every placeholder of the English text', () => {
    const broken = Object.keys(en)
      .filter((k) => k in es)
      .filter((k) => placeholders(en[k]!).join() !== placeholders(es[k]!).join())
    expect(broken).toEqual([])
  })

  it('keeps the plural bars', () => {
    const bars = (s: string) => (s.match(/\|/g) ?? []).length
    const broken = Object.keys(en)
      .filter((k) => k in es)
      .filter((k) => bars(en[k]!) !== bars(es[k]!))
    expect(broken).toEqual([])
  })

  it('has no empty text', () => {
    expect(Object.entries(es).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([])
  })
})
