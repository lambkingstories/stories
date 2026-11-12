/**
 * The fixed piece of a stage (`AdventureStage.music`): the map and the mini game play exactly this piece and never one of the journey's
 * random list; without it nothing changes. "Jesus erzählt von sich" gives every stage its piece (night, well, shepherd).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ichbin } from '@/data/adventures/ichbin'

class FakeContext {
  currentTime = 0
  state = 'running'
  destination = {}
  createGain() {
    const param = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} }
    return { gain: param, connect: () => {}, disconnect: () => {} }
  }
  createBufferSource() {
    return { buffer: null, connect: () => {}, addEventListener: () => {}, start: () => {}, stop: () => {} }
  }
  async decodeAudioData() {
    return { duration: 30 }
  }
  async resume() {}
  async suspend() {}
}

let fetched: string[] = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetModules()
  fetched = []
  localStorage.clear()
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      fetched.push(String(url))
      return { arrayBuffer: async () => new ArrayBuffer(8) }
    })
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function setup() {
  const { default: useMusic } = await import('@/use/useMusic')
  const { default: useSoundSettings } = await import('@/use/useSoundSettings')
  const settings = useSoundSettings()
  settings.setMusicVolume(0.4)
  return useMusic()
}
const settle = () => vi.advanceTimersByTimeAsync(50)
const LIST = ['audio/abenteuer/x/musik-a.mp3', 'audio/abenteuer/x/musik-b.mp3', 'audio/abenteuer/x/musik-c.mp3']

describe('the fixed piece of a stage', () => {
  it('the map plays exactly the fixed piece, never one of the list', async () => {
    for (let round = 0; round < 6; round++) {
      fetched = []
      vi.resetModules()
      const music = await setup()
      music.playMap(LIST, 'audio/abenteuer/x/musik-fest.mp3')
      await settle()
      expect(fetched).toHaveLength(1)
      expect(fetched[0]).toContain('musik-fest.mp3')
    }
  })

  it('the mini game plays the fixed piece as well', async () => {
    const music = await setup()
    music.playGame('memory', LIST, 'audio/abenteuer/x/musik-fest.mp3')
    await settle()
    expect(fetched).toHaveLength(1)
    expect(fetched[0]).toContain('musik-fest.mp3')
  })

  it('without a fixed piece the list stays in play (other adventures do not change)', async () => {
    const music = await setup()
    music.playMap(LIST)
    await settle()
    expect(fetched).toHaveLength(1)
    expect(LIST.some((f) => fetched[0]!.includes(f.split('/').pop()!))).toBe(true)
  })

  it('"Jesus erzählt von sich": every stage has its piece, night 1-3 and 9-11, well 4-8, shepherd 12-14, all in the journey list', () => {
    const piece = ichbin.stages.map((s) => s.music?.split('/').pop())
    expect(piece).toEqual([
      ...Array(3).fill('musik-nacht-v1.mp3'),
      ...Array(5).fill('musik-brunnen-v1.mp3'),
      ...Array(3).fill('musik-nacht-v1.mp3'),
      ...Array(3).fill('musik-hirte-v1.mp3')
    ])
    for (const s of ichbin.stages) expect(ichbin.music).toContain(s.music)
  })
})
