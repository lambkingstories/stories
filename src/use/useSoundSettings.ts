/**
 * How loud the music, the little sounds and the reading voice of the adventures are. Three sliders (0 to 100 per cent, 0 = off) in the sound
 * window of the map and of a stage; the values are remembered on the device. The music starts rather quiet (many find it too loud), the sounds
 * and the voice at full.
 */
import { ref } from 'vue'

const MUSIC_KEY = 'lk-music-volume'
const SFX_KEY = 'lk-sfx-volume'
const VOICE_KEY = 'lk-voice-volume'
export const DEFAULT_MUSIC = 0.4
export const DEFAULT_SFX = 1
export const DEFAULT_VOICE = 1

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
const voiceVolume = ref(read(VOICE_KEY, DEFAULT_VOICE))

export default function useSoundSettings() {
  return {
    musicVolume,
    sfxVolume,
    voiceVolume,
    setMusicVolume(v: number) {
      musicVolume.value = clamp(v)
      save(MUSIC_KEY, musicVolume.value)
    },
    setSfxVolume(v: number) {
      sfxVolume.value = clamp(v)
      save(SFX_KEY, sfxVolume.value)
    },
    setVoiceVolume(v: number) {
      voiceVolume.value = clamp(v)
      save(VOICE_KEY, voiceVolume.value)
    }
  }
}
