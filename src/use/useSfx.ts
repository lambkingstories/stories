/**
 * The little sounds of the adventures (button taps, right and wrong answers, stars, the games, the lights on the map). They were made
 * by a sound model and are kept short. The sounds are loaded when they are first needed and played through one audio context, which
 * is woken by the first touch (phones keep a page silent until then). A switch (`enabled`) turns all of them off and is remembered.
 */
import { ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'

export type SfxName =
  | 'tap'
  | 'right'
  | 'wrong'
  | 'star'
  | 'fanfare'
  | 'flip'
  | 'basket'
  | 'sack'
  | 'snap'
  | 'bead'
  | 'found'
  | 'caravan'
  | 'coin'

const KEY = 'lk-sound'
const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

const enabled = ref(read())
/** How loud each sound is next to the others (the files are levelled, this is for taste). */
const GAIN: Record<SfxName, number> = { tap: 0.55, right: 0.8, wrong: 0.7, star: 0.7, fanfare: 0.8, flip: 0.7, basket: 0.8, sack: 0.8, snap: 0.8, bead: 0.45, found: 0.8, caravan: 0.5, coin: 0.7 }

let ctx: AudioContext | null = null
const buffers = new Map<SfxName, AudioBuffer | Promise<AudioBuffer | null>>()
let listening = false

function context(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

/** Phones start the audio context only after a touch: the first one wakes it. */
function wakeOnTouch() {
  if (listening || typeof window === 'undefined') return
  listening = true
  const wake = () => {
    void context()?.resume()
  }
  window.addEventListener('pointerdown', wake, { passive: true })
  window.addEventListener('keydown', wake, { passive: true })
}

async function load(name: SfxName): Promise<AudioBuffer | null> {
  const c = context()
  if (!c) return null
  const have = buffers.get(name)
  if (have) return have
  const job = (async () => {
    try {
      const res = await fetch(prependBaseUrl(`audio/abenteuer/${name}.mp3`))
      const data = await res.arrayBuffer()
      const buf = await c.decodeAudioData(data)
      buffers.set(name, buf)
      return buf
    } catch {
      buffers.delete(name)
      return null
    }
  })()
  buffers.set(name, job)
  return job
}

/** `rate` plays the sound higher (above 1) or lower: a bell ticking up a little scale while things are counted. */
function play(name: SfxName, volume = 1, rate = 1) {
  if (!enabled.value) return
  wakeOnTouch()
  const c = context()
  if (!c) return
  void load(name).then((buf) => {
    if (!buf || !enabled.value || c.state === 'closed') return
    try {
      const src = c.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = rate
      const gain = c.createGain()
      gain.gain.value = Math.min(1, GAIN[name] * volume)
      src.connect(gain)
      gain.connect(c.destination)
      void c.resume().then(() => src.start())
    } catch {
      // a sound that does not play is not a problem
    }
  })
}

/** Loads sounds in advance (a game does this when it opens, so the first tap is not late). */
function preload(names: SfxName[]) {
  if (!enabled.value) return
  wakeOnTouch()
  for (const n of names) void load(n)
}

function setEnabled(on: boolean) {
  enabled.value = on
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // not remembered in a private window
  }
}

export default function useSfx() {
  return { enabled, play, preload, setEnabled, toggle: () => setEnabled(!enabled.value) }
}
