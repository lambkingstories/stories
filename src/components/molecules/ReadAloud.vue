<script setup lang="ts">
/**
 * The "read aloud" button of a story. It plays the recording of the stage (`audio`, a path below `public/`). A stage without a recording
 * has no button: the robotic voice of the device is not used any more (Anton, 4.11.2026: only the best quality in the app). A second tap
 * stops the voice, and leaving the screen stops it too.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import useSoundSettings from '@/use/useSoundSettings'
import usePremium from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'

// `plusOnly`: the read-aloud button of a book in the reading area comes with LambKing Plus; in the adventures (which sit behind
// Plus as a whole) it is free.
const props = defineProps<{ text: string[]; audio?: string; plusOnly?: boolean }>()
const { t } = useI18n({ useScope: 'global' })
const { hasFeature, showUpsell } = usePremium()

const { voiceVolume } = useSoundSettings()
const playing = ref(false)
let player: HTMLAudioElement | null = null
const available = computed(() => !!props.audio)
const icon = prependBaseUrl('images/abenteuer/ui/ton-an.webp')

function stop() {
  playing.value = false
  if (player) {
    player.pause()
    player = null
  }
}

function toggle() {
  if (playing.value) {
    stop()
    return
  }
  // always allowed until the subscription is on (see `usePremium`)
  if (props.plusOnly && !hasFeature('readAloud')) {
    showUpsell('readAloud')
    return
  }
  playing.value = true
  if (props.audio) {
    player = new Audio(prependBaseUrl(props.audio))
    player.volume = voiceVolume.value
    player.onended = () => (playing.value = false)
    player.onerror = () => stop()
    void player.play().catch(() => stop())
  }
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
