<script setup lang="ts">
/**
 * The table of the family games, in the light look of the app (Anton, 17.11.2026; before: an old map on a dark walnut table). Every family game
 * (quiz, activity, who am I, order race, Bible bingo, memory, word journey) is played on it, with the pieces of `Map*.vue` (parchment, bronze
 * medallion, answer coins, travel tokens, brass button: the painted game material stays). The board is the soft background of the app, the text
 * on it is dark (`--mp-cream`, the old name, now holds the ink of the board). It fills the whole screen (also above the tab bar), has a quiet
 * round back button and an optional small title.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useMusic from '@/use/useMusic'
import useSoundSettings, { DEFAULT_MUSIC, DEFAULT_SFX } from '@/use/useSoundSettings'

withDefaults(defineProps<{ title?: string; back?: boolean }>(), { title: '', back: true })
const emit = defineEmits<{ back: [] }>()
const { t } = useI18n({ useScope: 'global' })

// the background music of the family games, with a switch for the music and one for the little sounds (the same ones as in the sound window)
const music = useMusic()
const sound = useSoundSettings()
onMounted(() => music.playFamily())
onBeforeUnmount(() => music.stop('game'))
const toggleMusic = () => sound.setMusicVolume(sound.musicVolume.value > 0 ? 0 : DEFAULT_MUSIC)
const toggleSfx = () => sound.setSfxVolume(sound.sfxVolume.value > 0 ? 0 : DEFAULT_SFX)
</script>

<template lang="pug">
  div(class="mt")
    header(class="mt-top")
      button(v-if="back" type="button" class="mt-back" :aria-label="t('app.read.back')" @click="emit('back')")
        span(aria-hidden="true") ‹
      h1(v-if="title" class="mt-title") {{ title }}
      div(class="mt-actions")
        slot(name="actions")
        button(type="button" :class="['mt-round', { 'is-off': sound.musicVolume.value <= 0 }]" :aria-pressed="sound.musicVolume.value > 0" :aria-label="t('app.family.musicSwitch')" @click="toggleMusic")
          svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
            path(d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round")
            path(v-if="sound.musicVolume.value <= 0" d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round")
        button(type="button" :class="['mt-round', { 'is-off': sound.sfxVolume.value <= 0 }]" :aria-pressed="sound.sfxVolume.value > 0" :aria-label="t('app.family.soundSwitch')" @click="toggleSfx")
          svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
            path(d="M4 9v6h4l5 4V5L8 9H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round")
            path(v-if="sound.sfxVolume.value > 0" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round")
            path(v-else d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round")
    div(class="mt-body")
      slot
</template>

<style scoped lang="sass">
.mt
  --mp-ink: #3a2812
  --mp-ink-soft: #6b5230
  --mp-gold: #e2bd66
  --mp-gold-deep: #a9802d
  // the ink of the board (text lying directly on the light background); the parchment pieces keep their own brown ink
  --mp-cream: #1f3a36
  --mp-board: #1f3a36
  --mp-night: #1c130a
  --mp-serif: 'Cormorant Garamond', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif
  position: fixed
  inset: 0
  z-index: 60
  display: flex
  flex-direction: column
  overflow: hidden
  background: var(--lk-bg, #edf3f1)
  color: var(--mp-board)

.mt-top
  position: relative
  z-index: 2
  display: flex
  align-items: center
  gap: 12px
  padding: max(10px, env(safe-area-inset-top)) 14px 6px

.mt-back, .mt-round
  flex: none
  display: grid
  place-items: center
  width: 44px
  height: 44px
  border-radius: 50%
  border: 1px solid var(--lk-line, #c9dad5)
  background: var(--lk-surface, #fff)
  box-shadow: var(--lk-shadow, 0 2px 6px rgba(0, 0, 0, 0.12))
  color: var(--mp-board)
  font: inherit
  font-size: 2rem
  line-height: 1
  padding-bottom: 4px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.mt-round
  padding: 0
  font-size: 1rem
  color: var(--mp-board)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-off
    background: var(--lk-surface-2, #e4eeeb)
    color: var(--lk-muted, #7d948f)

.mt-title
  flex: 1
  min-width: 0
  margin: 0
  font-size: 1.3rem
  font-weight: 800
  color: var(--mp-board)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.mt-actions
  margin-left: auto
  display: flex
  gap: 8px

@media (max-width: 440px)
  .mt-top
    gap: 8px
    padding-left: 10px
    padding-right: 10px

  .mt-title
    font-size: 1.1rem

  .mt-actions
    gap: 6px

.mt-body
  position: relative
  z-index: 1
  flex: 1
  min-height: 0
  overflow-y: auto
  overflow-x: hidden
  // a card that is turned (3D) reaches over the board for a moment: the scroll bar must not come and go and push the whole board aside
  scrollbar-gutter: stable both-edges
  -webkit-overflow-scrolling: touch
  padding: 4px 14px max(18px, env(safe-area-inset-bottom))
</style>
