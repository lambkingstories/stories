/**
 * The little sounds of the adventures (button taps, right and wrong answers, stars, the games, the lights on the map). They are soft marimba tones in the key of the bead
 * sound (D major pentatonic), built and levelled by script (`lambking-design/ton-neu/werkzeug/ton_bauen.py`), and kept short. The sounds are loaded when they are first needed and played through one audio context, which
 * is woken by the first touch (phones keep a page silent until then). A switch (`enabled`) turns all of them off and is remembered.
 */
import { computed } from 'vue'
import useSoundSettings, { DEFAULT_MUSIC, DEFAULT_SFX } from '@/use/useSoundSettings'
import { prependBaseUrl } from '@/utils/function'
import { SFX_FILE, type SfxName } from '@/utils/sfxFiles'

export type { SfxName }

const settings = useSoundSettings()
/** The speaker switch: the sounds are on while the sounds or the music are not set to 0 (the two sliders of the sound window). */
const enabled = computed(() => settings.sfxVolume.value > 0 || settings.musicVolume.value > 0)
/** The time of the last sound (`performance.now()`), so that a button tick is not added to a button that has its own sound. */
let lastPlayAt = 0

/** How loud each sound is next to the others (the files are levelled to the bead sound, which is played at 0.45). */
const GAIN: Record<SfxName, number> = { tap: 0.45, right: 0.45, wrong: 0.45, star: 0.45, fanfare: 0.45, flip: 0.45, basket: 0.45, sack: 0.45, snap: 0.45, bead: 0.45, found: 0.45, caravan: 0.45, coin: 0.45, button: 0.4, result: 0.45, trophy: 0.45 }

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
      const res = await fetch(prependBaseUrl(`audio/abenteuer/${SFX_FILE[name]}.mp3`))
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
  if (settings.sfxVolume.value <= 0) return
  lastPlayAt = performance.now()
  wakeOnTouch()
  const c = context()
  if (!c) return
  void load(name).then((buf) => {
    if (!buf || settings.sfxVolume.value <= 0 || c.state === 'closed') return
    try {
      const src = c.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = rate
      const gain = c.createGain()
      gain.gain.value = Math.min(1, GAIN[name] * volume * settings.sfxVolume.value)
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
  if (settings.sfxVolume.value <= 0) return
  wakeOnTouch()
  for (const n of names) void load(n)
}

/** The speaker button's quick switch: everything off, or back to the usual volumes. */
function setEnabled(on: boolean) {
  if (!on) {
    settings.setSfxVolume(0)
    settings.setMusicVolume(0)
  } else {
    if (settings.sfxVolume.value <= 0) settings.setSfxVolume(DEFAULT_SFX)
    if (settings.musicVolume.value <= 0) settings.setMusicVolume(DEFAULT_MUSIC)
  }
}

/** True when a sound was started at or after the time `t` (`performance.now()`): the click that was being handled has its own sound. */
const playedSince = (t: number) => lastPlayAt >= t

export default function useSfx() {
  return { enabled, play, preload, setEnabled, toggle: () => setEnabled(!enabled.value), playedSince }
}
