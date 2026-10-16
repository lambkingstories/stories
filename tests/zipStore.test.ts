import { describe, expect, it } from 'vitest'
import { crc32, unzip, zip } from '@/utils/zipStore'

const bytes = (s: string) => new TextEncoder().encode(s)

describe('zip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(bytes('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array())).toBe(0)
  })

  it('gives back the same files, names with umlauts included', async () => {
    const files = [
      { name: 'sicherung/index.json', data: bytes('{"a":1}') },
      { name: 'bilder/01-Schöpfung.png', data: new Uint8Array([0, 1, 2, 3, 250, 251, 252]) },
      { name: 'leer.txt', data: new Uint8Array() }
    ]
    const back = await unzip(zip(files))
    expect(back.map((f) => f.name)).toEqual(files.map((f) => f.name))
    expect(Array.from(back[1]!.data)).toEqual([0, 1, 2, 3, 250, 251, 252])
    expect(back[2]!.data.length).toBe(0)
  })

  it('refuses data that is not a ZIP', async () => {
    await expect(unzip(bytes('hello world, this is not a zip file at all'))).rejects.toThrow()
  })
})
