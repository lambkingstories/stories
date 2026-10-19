import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { noah } from '@/data/adventures/noah'
import { journeyFiles } from '@/utils/journeyFiles'
import { adamEva } from '@/data/adventures/adamEva'
import { ADAM_ONLY_DIRS, NOAH_ONLY_DIRS, stripAdamFiles, stripNoahFiles } from '../vite.config.noah'

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

const inAdamDir = (f: string) => ADAM_ONLY_DIRS.some((d) => f.startsWith(`${d}/`))

describe('a build without Adam und Eva ships nothing of it', () => {
  it('every file that only Adam und Eva uses (pictures, game pictures, recordings, music) lies in a folder that the normal build removes', () => {
    const others = new Set([...journeys, noah].flatMap((j) => journeyFiles(j)))
    // (the general music pieces and the sounds belong to the app: they stay in every build)
    const app = /^audio\/abenteuer\/(klang|musik)-/
    const only = journeyFiles(adamEva).filter((f) => !others.has(f) && !app.test(f))
    expect(only.length).toBeGreaterThan(0)
    const leaks = only.filter((f) => !inAdamDir(f))
    expect(leaks, `files of Adam und Eva outside the folders that are removed: ${leaks.join(', ')}`).toEqual([])
  })

  it('the folders of Adam are only below the three places that belong to it, and no folder with "adam" in its name is missing from the list', () => {
    expect([...ADAM_ONLY_DIRS].sort()).toEqual(['audio/abenteuer/adam-eva', 'images/abenteuer/adam-eva', 'images/abenteuer/spiele/adam-eva'])
    const found: string[] = []
    for (const base of ['public/images/abenteuer', 'public/audio/abenteuer', 'public/images/abenteuer/spiele']) {
      for (const n of readdirSync(base)) if (/adam/i.test(n) && !n.includes('.')) found.push(`${base.replace('public/', '')}/${n}`)
    }
    for (const d of found) expect(ADAM_ONLY_DIRS, d).toContain(d)
  })

  it('nothing the other journeys use is on the list of Adam; the folders of Noah and of Adam are different', () => {
    for (const j of [...journeys, noah]) for (const f of journeyFiles(j)) expect(inAdamDir(f), `${j.id}: ${f}`).toBe(false)
    for (const d of ADAM_ONLY_DIRS) expect(NOAH_ONLY_DIRS).not.toContain(d)
  })

  it('removing takes the folders of Adam out of a build and leaves everything else (Josef, Noah, the sounds); removing Noah leaves Adam alone', () => {
    const out = mkdtempSync(join(tmpdir(), 'lk-build-adam-'))
    try {
      const adam = ['audio/abenteuer/adam-eva/geschichte-01-v1.mp3', 'images/abenteuer/adam-eva/etappe-bild-01.webp', 'images/abenteuer/spiele/adam-eva/reihenfolge/a.webp']
      const keep = ['images/abenteuer/josef/etappe-01.webp', 'audio/abenteuer/noah/geschichte-01.mp3', 'images/abenteuer/noah/etappe-01.webp', 'audio/abenteuer/klang-stern.mp3', 'images/abenteuer/spiele/wimmel/a.webp']
      const write = (files: string[]) => {
        for (const f of files) {
          mkdirSync(join(out, f, '..'), { recursive: true })
          writeFileSync(join(out, f), 'x')
        }
      }
      write([...adam, ...keep])
      stripAdamFiles(out)
      for (const f of adam) expect(existsSync(join(out, f)), f).toBe(false)
      for (const f of keep) expect(existsSync(join(out, f)), f).toBe(true)
      // the other way: Noah removed, Adam stays
      write(adam)
      stripNoahFiles(out)
      for (const f of adam) expect(existsSync(join(out, f)), f).toBe(true)
      stripAdamFiles(out)
      expect(() => stripAdamFiles(out)).not.toThrow()
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  })
})
