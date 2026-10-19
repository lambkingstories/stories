/**
 * How loud the music and the little sounds of the adventures are. Two sliders (0 to 100 per cent, 0 = off) in the sound window of the
 * map and of a stage; the values are remembered on the device. The music starts rather quiet (many find it too loud), the sounds at full.
 */
import { ref } from 'vue'

const MUSIC_KEY = 'lk-music-volume'
const SFX_KEY = 'lk-sfx-volume'
export const DEFAULT_MUSIC = 0.4
export const DEFAULT_SFX = 1

const clamp = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)
function read(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : clamp(Number(raw))
  } catch {
    return fallback
  }
}
function save(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v))
  } catch {
    // not remembered in a private window
  }
}

const musicVolume = ref(read(MUSIC_KEY, DEFAULT_MUSIC))
const sfxVolume = ref(read(SFX_KEY, DEFAULT_SFX))

export default function useSoundSettings() {
  return {
    musicVolume,
    sfxVolume,
    setMusicVolume(v: number) {
      musicVolume.value = clamp(v)
      save(MUSIC_KEY, musicVolume.value)
    },
    setSfxVolume(v: number) {
      sfxVolume.value = clamp(v)
      save(SFX_KEY, sfxVolume.value)
    }
  }
}
