/**
 * The music slider of the sound window: at 0 the music must really stop (it fades out and every scheduled piece is stopped), above 0
 * it comes back. Tested against a small fake of the Web Audio API that records what the music code does with it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface FakeParam {
  value: number
  events: { kind: string; value: number; at: number }[]
  setValueAtTime(v: number, at: number): void
  linearRampToValueAtTime(v: number, at: number): void
  setTargetAtTime(v: number, at: number): void
  cancelScheduledValues(at: number): void
}
const gains: { gain: FakeParam; connected: boolean }[] = []
const sources: { started: number[]; stopped: boolean }[] = []

function param(): FakeParam {
  const p: FakeParam = {
    value: 1,
    events: [],
    setValueAtTime(v, at) {
      p.value = v
      p.events.push({ kind: 'set', value: v, at })
    },
    linearRampToValueAtTime(v, at) {
      p.events.push({ kind: 'ramp', value: v, at })
    },
    setTargetAtTime(v, at) {
      p.events.push({ kind: 'target', value: v, at })
    },
    cancelScheduledValues() {
      p.events = []
    }
  }
  return p
}

class FakeContext {
  currentTime = 0
  state = 'running'
  destination = {}
  createGain() {
    const g = { gain: param(), connected: true }
    gains.push(g)
    return Object.assign({}, { gain: g.gain, connect: () => {}, disconnect: () => (g.connected = false) })
  }
  createBufferSource() {
    const s = { started: [] as number[], stopped: false }
    sources.push(s)
    return {
      buffer: null,
      connect: () => {},
      addEventListener: () => {},
      start: (at: number) => s.started.push(at),
      stop: () => (s.stopped = true)
    }
  }
  async decodeAudioData() {
    return { duration: 30 }
  }
  async resume() {}
  async suspend() {}
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetModules()
  gains.length = 0
  sources.length = 0
  localStorage.clear()
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
  vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function setup() {
  const { default: useMusic } = await import('@/use/useMusic')
  const { default: useSoundSettings } = await import('@/use/useSoundSettings')
  return { music: useMusic(), settings: useSoundSettings() }
}

/** Lets the loading of the file and the scheduling run. */
async function settle() {
  await vi.advanceTimersByTimeAsync(50)
}

describe('the music slider', () => {
  it('plays at the volume of the slider and ends with the slider at 0: faded out, all pieces stopped, nothing left connected', async () => {
    const { music, settings } = await setup()
    settings.setMusicVolume(0.4)
    music.playMap(['audio/abenteuer/noah/musik-a.mp3', 'audio/abenteuer/noah/musik-b.mp3'])
    await settle()
    expect(sources.length).toBeGreaterThan(0)
    expect(gains[0]!.connected).toBe(true)

    settings.setMusicVolume(0)
    // silence is immediate: no timer has run yet, and the gain is 0, every source stopped, nothing left connected
    await Promise.resolve()
    expect(gains[0]!.gain.value).toBe(0)
    expect(gains[0]!.connected).toBe(false)
    expect(sources.every((s) => s.stopped)).toBe(true)

    // and it stays silent: nothing new is scheduled for the next minutes
    const before = sources.length
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(sources.length).toBe(before)
  })

  it('a general piece (seamless loop) stops at 0 as well and starts again when the slider is moved up', async () => {
    const { music, settings } = await setup()
    settings.setMusicVolume(0.4)
    music.playMap()
    await settle()
    const first = sources.length
    expect(first).toBeGreaterThan(0)

    settings.setMusicVolume(0)
    await Promise.resolve()
    expect(sources.every((s) => s.stopped)).toBe(true)
    const stoppedAt = sources.length
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    expect(sources.length).toBe(stoppedAt)

    settings.setMusicVolume(0.5)
    await settle()
    expect(sources.length).toBeGreaterThan(stoppedAt)
  })

  it('moving the slider to 0 while the file is still loading never starts the music', async () => {
    const { music, settings } = await setup()
    settings.setMusicVolume(0.4)
    music.playMap()
    settings.setMusicVolume(0)
    await settle()
    await vi.advanceTimersByTimeAsync(5000)
    expect(sources.length).toBe(0)
  })

  it('a game that asks for music while the slider is at 0 stays silent', async () => {
    const { music, settings } = await setup()
    settings.setMusicVolume(0)
    music.playGame('memory')
    music.playMap()
    await settle()
    expect(sources.length).toBe(0)
  })

  it('the slider still stops the music after the view that started it is gone (the watcher must not die with that view)', async () => {
    const { defineComponent, h, onMounted } = await import('vue')
    const { mount } = await import('@vue/test-utils')
    const { music, settings } = await setup()
    settings.setMusicVolume(0.4)
    // the music is asked for in `onMounted`, as the map of an adventure does
    const Map = defineComponent({
      setup() {
        onMounted(() => music.playMap(['audio/abenteuer/noah/musik-a.mp3', 'audio/abenteuer/noah/musik-b.mp3']))
        return () => h('div')
      }
    })
    const view = mount(Map)
    await settle()
    expect(sources.length).toBeGreaterThan(0)

    // the child leaves the map (another view, the first one is unmounted) while the music goes on
    view.unmount()
    await Promise.resolve()
    expect(sources.some((s) => !s.stopped)).toBe(true)

    settings.setMusicVolume(0)
    await Promise.resolve()
    expect(sources.every((s) => s.stopped)).toBe(true)
    expect(gains[0]!.connected).toBe(false)
  })
})
