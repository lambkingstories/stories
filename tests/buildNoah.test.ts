import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { noah } from '@/data/adventures/noah'
import { journeyFiles } from '@/utils/journeyFiles'
import { NOAH_ONLY_DIRS, stripNoahFiles } from '../vite.config.noah'

const inNoahDir = (f: string) => NOAH_ONLY_DIRS.some((d) => f.startsWith(`${d}/`))

describe('a build without Noah ships nothing of Noah', () => {
  it('every file that only Noah uses (pictures, game pictures, recordings, music) lies in a folder that the normal build removes', () => {
    const josef = new Set(journeys.flatMap((j) => journeyFiles(j)))
    const only = journeyFiles(noah).filter((f) => !josef.has(f))
    expect(only.length).toBeGreaterThan(50)
    const leaks = only.filter((f) => !inNoahDir(f))
    expect(leaks, `files of Noah outside the folders that are removed: ${leaks.join(', ')}`).toEqual([])
  })

  it('every folder of the pictures and recordings with "noah" in its name is on the list', () => {
    const found: string[] = []
    for (const base of ['public/images/abenteuer', 'public/audio/abenteuer', 'public/images/abenteuer/spiele']) {
      for (const n of readdirSync(base)) if (/noah/i.test(n) && !n.includes('.')) found.push(`${base.replace('public/', '')}/${n}`)
    }
    expect(found.length).toBeGreaterThanOrEqual(3)
    for (const d of found) expect(NOAH_ONLY_DIRS, d).toContain(d)
  })

  it('nothing the other journeys use is on the list (the folders of Noah are not used by Josef)', () => {
    for (const j of journeys) for (const f of journeyFiles(j)) expect(inNoahDir(f), `${j.id}: ${f}`).toBe(false)
  })

  it('the list of folders exists in the project (a renamed folder has to be changed here, too)', () => {
    for (const d of NOAH_ONLY_DIRS) expect(existsSync(`public/${d}`), d).toBe(true)
  })

  it('removing takes the folders of Noah out of a build and leaves everything else (the recordings and the pictures of Josef, the sounds)', () => {
    const out = mkdtempSync(join(tmpdir(), 'lk-build-'))
    try {
      const keep = ['images/abenteuer/josef/etappe-01.webp', 'audio/abenteuer/josef/geschichte-01.mp3', 'audio/abenteuer/klang-stern.mp3', 'images/abenteuer/spiele/wimmel/a.webp']
      const drop = ['audio/abenteuer/noah/geschichte-01.mp3', 'images/abenteuer/spiele/wimmel-noah/a.webp', 'images/abenteuer/noah/etappe-01.webp', 'images/abenteuer/spiele/altar/altar-v2.webp']
      for (const f of [...keep, ...drop]) {
        mkdirSync(join(out, f, '..'), { recursive: true })
        writeFileSync(join(out, f), 'x')
      }
      stripNoahFiles(out)
      for (const f of keep) expect(existsSync(join(out, f)), f).toBe(true)
      for (const f of drop) expect(existsSync(join(out, f)), f).toBe(false)
      // a second time (nothing there any more) is no error
      expect(() => stripNoahFiles(out)).not.toThrow()
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  })
})
