<script setup lang="ts">
/**
 * The "read aloud" button of a story. When the stage has a recording (`audio`, a path below `public/`) that is played; until the
 * recordings are made, the device's own voice reads the text (the speech synthesis of the phone, nothing is sent from the app). A
 * second tap stops it, and leaving the screen stops it too.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import useSoundSettings from '@/use/useSoundSettings'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ text: string[]; audio?: string }>()
const { t, locale } = useI18n({ useScope: 'global' })

const { voiceVolume } = useSoundSettings()
const playing = ref(false)
let player: HTMLAudioElement | null = null
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
const available = computed(() => !!props.audio || !!synth)
const icon = prependBaseUrl('images/abenteuer/ui/ton-an.webp')

function stop() {
  playing.value = false
  if (player) {
    player.pause()
    player = null
  }
  synth?.cancel()
}

function speak() {
  if (!synth) return
  const lang = locale.value === 'en' ? 'en-US' : 'de-DE'
  const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)))
  const parts = props.text.filter(Boolean)
  let i = 0
  const next = () => {
    if (!playing.value || i >= parts.length) {
      playing.value = false
      return
    }
    const u = new SpeechSynthesisUtterance(parts[i++]!)
    u.lang = lang
    u.rate = 0.88
    u.pitch = 1.05
    u.volume = voiceVolume.value
    if (voices[0]) u.voice = voices[0]
    u.onend = next
    u.onerror = () => (playing.value = false)
    synth.speak(u)
  }
  synth.cancel()
  next()
}

function toggle() {
  if (playing.value) {
    stop()
    return
  }
  playing.value = true
  if (props.audio) {
    player = new Audio(prependBaseUrl(props.audio))
    player.volume = voiceVolume.value
    player.onended = () => (playing.value = false)
    player.onerror = () => {
      player = null
      speak()
    }
    void player.play().catch(() => {
      player = null
      speak()
    })
    return
  }
  speak()
}

// the slider of the sound window works while the voice is speaking
watch(voiceVolume, (v) => {
  if (player) player.volume = v
})
onBeforeUnmount(stop)
</script>

<template lang="pug">
  div(v-if="available" class="ra")
    AdvButton(tone="blau" small :aria-pressed="playing" @click="toggle")
      img(:src="icon" alt="" class="ra-icon" draggable="false")
      | {{ playing ? t('app.adventure.readStop') : t('app.adventure.readAloud') }}
</template>

<style scoped lang="sass">
.ra
  display: flex
  justify-content: center
  margin: 0 0 14px

.ra-icon
  display: inline-block
  width: 22px
  height: 22px
  margin: -4px 8px -4px 0
  vertical-align: middle
</style>
