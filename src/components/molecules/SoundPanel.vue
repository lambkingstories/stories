<script setup lang="ts">
/**
 * The speaker button of the adventures. A tap opens a little window with two sliders, one for the music and one for the sounds
 * (louder, quieter, all the way to the left = off). The values are remembered (`useSoundSettings`). Used on the map and on every stage.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useSfx from '@/use/useSfx'
import useSoundSettings from '@/use/useSoundSettings'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useSoundSettings()
const { play } = useSfx()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const allOff = computed(() => musicVolume.value <= 0 && sfxVolume.value <= 0)
const icon = computed(() => prependBaseUrl(`images/abenteuer/ui/${allOff.value ? 'ton-aus' : 'ton-an'}.webp`))
const percent = (v: number) => Math.round(v * 100)

function onMusic(e: Event) {
  setMusicVolume(Number((e.target as HTMLInputElement).value) / 100)
}
function onSfx(e: Event) {
  setSfxVolume(Number((e.target as HTMLInputElement).value) / 100)
}
// when the slider of the sounds is let go, one sound plays so that the child hears how loud it is
function previewSfx() {
  play('tap')
}

function outside(e: Event) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function key(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
watch(open, (on) => {
  if (on) {
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
  } else {
    document.removeEventListener('pointerdown', outside)
    document.removeEventListener('keydown', key)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  document.removeEventListener('keydown', key)
})
</script>

<template lang="pug">
  span(ref="root" class="sp")
    button(type="button" class="sp-btn" :aria-expanded="open" :aria-label="t('app.adventure.soundPanel')" @click="open = !open")
      img(:src="icon" alt="" draggable="false")
    div(v-if="open" class="sp-pop" role="dialog" :aria-label="t('app.adventure.soundPanel')")
      label(class="sp-row")
        span(class="sp-name") {{ t('app.adventure.soundMusic') }}
        span(class="sp-val") {{ musicVolume <= 0 ? t('app.adventure.soundZero') : `${percent(musicVolume)} %` }}
        input(type="range" min="0" max="100" step="5" :value="percent(musicVolume)" :aria-label="t('app.adventure.soundMusic')" @input="onMusic")
      label(class="sp-row")
        span(class="sp-name") {{ t('app.adventure.soundSfx') }}
        span(class="sp-val") {{ sfxVolume <= 0 ? t('app.adventure.soundZero') : `${percent(sfxVolume)} %` }}
        input(type="range" min="0" max="100" step="5" :value="percent(sfxVolume)" :aria-label="t('app.adventure.soundSfx')" @input="onSfx" @change="previewSfx")
</template>

<style scoped lang="sass">
.sp
  position: relative
  display: inline-block
  pointer-events: auto

.sp-btn
  width: 44px
  height: 44px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 3px 0 rgba(88, 58, 16, 0.55)) drop-shadow(0 5px 5px rgba(40, 25, 5, 0.3))
  transition: translate 80ms ease-out, filter 80ms ease-out

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &:active
    translate: 0 3px
    filter: drop-shadow(0 1px 0 rgba(88, 58, 16, 0.55))

.sp-pop
  // fixed and centred under the top bar: the button sits at the left on the map and at the right on a stage, a window anchored to it would leave the screen
  position: fixed
  top: calc(max(env(safe-area-inset-top, 0px), 8px) + 62px)
  left: 50%
  translate: -50% 0
  z-index: 40
  width: min(290px, 84vw)
  padding: 12px 16px 6px
  border-radius: 18px
  background: var(--lk-surface, #fff)
  color: var(--lk-text, #2b2b3a)
  box-shadow: 0 8px 28px rgba(30, 20, 5, 0.35)
  border: 1px solid rgba(120, 90, 40, 0.3)

.sp-row
  display: grid
  grid-template-columns: 1fr auto
  align-items: center
  row-gap: 2px
  padding-bottom: 10px

  input
    grid-column: 1 / -1
    width: 100%
    height: 44px
    margin: 0
    accent-color: var(--lk-primary, #1d6b6b)
    cursor: pointer

.sp-name
  font-weight: 700
  font-size: 1.05rem

.sp-val
  font-size: 1rem
  font-weight: 600
  color: var(--lk-muted, #667)

@media (prefers-reduced-motion: reduce)
  .sp-btn
    transition: none
</style>
