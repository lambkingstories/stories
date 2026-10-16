import { describe, expect, it } from 'vitest'
import messages from '@/i18n/app'

type Tree = { [key: string]: Tree | string | unknown }

/** All paths of a message tree, e.g. `app.coloring.tip_flat`. */
function paths(tree: Tree, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(tree)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') out.push(...paths(v as Tree, p))
    else out.push(p)
  }
  return out
}

describe('app texts in both languages', () => {
  const en = new Set(paths((messages.en as Tree).app as Tree, 'app'))
  const de = new Set(paths((messages.de as Tree).app as Tree, 'app'))

  it('has every German text in English too, and the other way round', () => {
    const missingEn = [...de].filter((k) => !en.has(k))
    const missingDe = [...en].filter((k) => !de.has(k))
    expect(missingEn, 'missing in English').toEqual([])
    expect(missingDe, 'missing in German').toEqual([])
  })

  it('does not leave German in the English coloring texts', () => {
    const coloring = ((messages.en as Tree).app as Tree).coloring as Record<string, unknown>
    const german = /[äöüß]|\b(Farbe|Bild|Malen|Ausmal|Werkzeug|Stift|Pinsel|Blatt|Seite|Hintergrund)\w*/i
    const flat = paths(coloring as Tree, 'coloring')
    const bad: string[] = []
    for (const p of flat) {
      const value = p.split('.').slice(1).reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], coloring)
      if (typeof value === 'string' && german.test(value)) bad.push(`${p}: ${value}`)
    }
    expect(bad).toEqual([])
  })
})
