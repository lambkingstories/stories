/**
 * The soft background music of the adventures. Every journey has its own pieces (`Journey.music`, a list of files), so that Josef sounds
 * different from Noah; a journey without them gets the general pieces (one mood-fitting piece per game). The music plays on the map and
 * in the mini games only (never while a story is read, and not on the star page). With the journey's own list the pieces follow one
 * another in random order, never the same one twice in a row, and are crossfaded softly. The general pieces are seamless loops: a
 * file of one round plus a ring-out, the next round starts exactly one round-length later through the audio clock (an mp3 on its
 * own cannot be looped without a gap). The volume is the music slider of the sound window (0 = off); the music fades in and out and
 * rests while the app is not in view.
 */
import { watch } from 'vue'
import useSoundSettings from '@/use/useSoundSettings'
import { prependBaseUrl } from '@/utils/function'
import { MAP_MUSIC, moodOfGame, pickGameMusic, type MusicPiece } from '@/utils/sfxFiles'

/** One piece: a seamless loop of `loop` seconds (general pieces), or a whole piece that is crossfaded into the next one. */
interface Track {
  src: string
  loop?: number
}
interface Wish {
  kind: 'map' | 'game'
  pool: Track[]
}

const asTrack = (p: MusicPiece): Track => ({ src: `audio/abenteuer/${p.file}.mp3`, loop: p.loop })

/** The slider at 100 per cent plays at this gain (the files lie at -24 dB, the sounds at about -15 dB). */
const SCALE = 0.6
const FADE_IN = 1.5
const FADE_OUT = 0.7
/** The crossfade between two pieces of a journey list (seconds). */
const CROSSFADE = 5

interface Running {
  wish: Wish
  gain: GainNode
  sources: AudioBufferSourceNode[]
  /** Every source that was ever started for this piece and has not ended yet (`sources` forgets the old ones). */
  alive: Set<AudioBufferSourceNode>
  timer: number
}

/** Remembers a started source until it ends, so a stop reaches every one of them. */
function track(r: Running, src: AudioBufferSourceNode) {
  r.alive.add(src)
  src.addEventListener('ended', () => r.alive.delete(src), { once: true })
}

const { musicVolume } = useSoundSettings()
let ctx: AudioContext | null = null
const buffers = new Map<string, Promise<AudioBuffer | null>>()
let running: Running | null = null
let wanted: Wish | null = null
let lastSrc: string | undefined
let hooked = false

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

function load(src: string): Promise<AudioBuffer | null> {
  const have = buffers.get(src)
  if (have) return have
  const c = context()
  if (!c) return Promise.resolve(null)
  const job = (async () => {
    try {
      const res = await fetch(prependBaseUrl(src))
      return await c.decodeAudioData(await res.arrayBuffer())
    } catch {
      buffers.delete(src)
      return null
    }
  })()
  buffers.set(src, job)
  return job
}

/**
 * Ends a piece. Normally it fades out softly; `hard` (the slider at 0, the child wants silence) cuts it at once: the gain goes to 0 and
 * every source is stopped right away, nothing depends on a timer that a resting app might not run.
 */
function halt(r: Running, hard = false) {
  const c = ctx
  window.clearTimeout(r.timer)
  if (!c) return
  if (hard) {
    try {
      r.gain.gain.cancelScheduledValues(c.currentTime)
      r.gain.gain.setValueAtTime(0, c.currentTime)
    } catch {
      // the stop below is what counts
    }
    const all = new Set([...r.sources, ...r.alive])
    all.forEach((src) => {
      try {
        src.stop()
      } catch {
        // already stopped
      }
    })
    try {
      r.gain.disconnect()
    } catch {
      // already disconnected
    }
    return
  }
  try {
    r.gain.gain.cancelScheduledValues(c.currentTime)
    r.gain.gain.setValueAtTime(r.gain.gain.value, c.currentTime)
    r.gain.gain.linearRampToValueAtTime(0, c.currentTime + FADE_OUT)
    window.setTimeout(() => {
      new Set([...r.sources, ...r.alive]).forEach((s) => {
        try {
          s.stop()
        } catch {
          // already stopped
        }
      })
      r.gain.disconnect()
    }, FADE_OUT * 1000 + 100)
  } catch {
    // a music that does not stop smoothly is not a problem
  }
}

/** A random piece of the pool, never the one that played last (when there is a choice). */
function choose(pool: Track[]): Track {
  const pick = pool.length > 1 ? pool.filter((t) => t.src !== lastSrc) : pool
  return pick[Math.min(pick.length - 1, Math.floor(Math.random() * pick.length))]!
}

async function begin(w: Wish) {
  const c = context()
  if (!c) return
  const first = choose(w.pool)
  const buf = await load(first.src)
  // the wish may have changed while the file was loading
  if (!buf || wanted !== w || musicVolume.value <= 0 || running?.wish === w) return
  if (running) halt(running)
  lastSrc = first.src
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(musicVolume.value * SCALE, c.currentTime + FADE_IN)
  gain.connect(c.destination)
  const r: Running = { wish: w, gain, sources: [], alive: new Set(), timer: 0 }
  running = r
  void c.resume()
  if (first.loop) seamless(r, first.loop, buf)
  else playlist(r, buf)
}

/** A general piece: round after round, the ring-out of one runs into the next. */
function seamless(r: Running, loop: number, buf: AudioBuffer) {
  const c = ctx!
  let at = c.currentTime + 0.1
  const schedule = () => {
    if (running !== r || !ctx) return
    // never more than one round ahead (the clock stands still while the app rests)
    if (at - ctx.currentTime <= loop) {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(r.gain)
      src.start(at)
      track(r, src)
      r.sources.push(src)
      if (r.sources.length > 3) r.sources.shift()
      at += loop
    }
    r.timer = window.setTimeout(schedule, Math.max(500, (at - ctx.currentTime - 3) * 1000))
  }
  schedule()
}

/** The pieces of a journey: each fades in and out and overlaps the next; the next one is chosen at random (not the one just played). */
function playlist(r: Running, firstBuf: AudioBuffer) {
  const c = ctx!
  let at = c.currentTime + 0.1
  const place = (b: AudioBuffer) => {
    const d = b.duration
    const xf = Math.min(CROSSFADE, d / 3)
    const seg = c.createGain()
    seg.gain.setValueAtTime(0, at)
    seg.gain.linearRampToValueAtTime(1, at + xf)
    seg.gain.setValueAtTime(1, at + d - xf)
    seg.gain.linearRampToValueAtTime(0, at + d)
    seg.connect(r.gain)
    const src = c.createBufferSource()
    src.buffer = b
    src.connect(seg)
    src.start(at)
    track(r, src)
    r.sources.push(src)
    if (r.sources.length > 4) r.sources.shift()
    at += d - xf
  }
  const wait = () => Math.max(1000, (at - c.currentTime - 10) * 1000)
  const next = async () => {
    if (running !== r) return
    // the clock stands still while the app rests: do not pile up pieces
    if (at - c.currentTime > 20) {
      r.timer = window.setTimeout(next, 2000)
      return
    }
    const pick = choose(r.wish.pool)
    const b = await load(pick.src)
    if (running !== r) return
    if (!b) {
      r.timer = window.setTimeout(next, 5000)
      return
    }
    lastSrc = pick.src
    place(b)
    r.timer = window.setTimeout(next, wait())
  }
  place(firstBuf)
  r.timer = window.setTimeout(next, wait())
}

function hook() {
  if (hooked || typeof window === 'undefined') return
  hooked = true
  // the slider: live volume; at 0 the music stops, above 0 it comes back
  watch(
    () => musicVolume.value,
    (v) => {
      if (v <= 0 && running) {
        halt(running, true)
        running = null
      } else if (v > 0 && running && ctx) {
        running.gain.gain.cancelScheduledValues(ctx.currentTime)
        running.gain.gain.setTargetAtTime(v * SCALE, ctx.currentTime, 0.08)
      } else if (v > 0 && wanted && !running) void begin(wanted)
    }
  )
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
  const wake = () => void ctx?.resume()
  window.addEventListener('pointerdown', wake, { passive: true })
}

function start(w: Wish) {
  hook()
  wanted = w
  if (musicVolume.value > 0) void begin(w)
}

const own = (music?: string[]): Track[] | undefined => (music?.length ? music.map((src) => ({ src })) : undefined)

/** The music of the map: the pieces of the journey, or the general map piece. */
function playMap(music?: string[]) {
  start({ kind: 'map', pool: own(music) ?? [asTrack(MAP_MUSIC)] })
}

/**
 * The music of a mini game (`kind` is the game: `puzzle`, `memory` ...): the journey's own pieces, or a general piece of the mood that
 * fits the game.
 */
function playGame(kind?: string, music?: string[]) {
  if (wanted?.kind === 'game' && running) return // a piece is already playing in this game
  const pool = own(music)
  if (pool) return start({ kind: 'game', pool })
  const piece = pickGameMusic(moodOfGame(kind), lastSrc?.replace(/^audio\/abenteuer\//, '').replace(/\.mp3$/, ''))
  start({ kind: 'game', pool: [asTrack(piece)] })
}

/**
 * Stops the music. With `only` ('map' or 'game') it stops just when that kind is the one playing (a view that closes later must not
 * stop the music of the next view).
 */
function stop(only?: 'map' | 'game') {
  if (only && wanted?.kind !== only) return
  wanted = null
  if (running) {
    halt(running)
    running = null
  }
}

export default function useMusic() {
  return { playMap, playGame, stop }
}
