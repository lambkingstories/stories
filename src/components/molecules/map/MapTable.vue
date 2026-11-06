<script setup lang="ts">
/**
 * The table of the family games: an old map of the lands of the Bible on a dark walnut table in the light of a lamp. Every family game
 * (quiz, activity, who am I, order race, Bible bingo, memory) is played on it, with the pieces of `Map*.vue` (parchment, bronze medallion,
 * answer coins, travel tokens, brass button). It fills the whole screen (also above the tab bar), has a quiet round back button and an
 * optional small title, and turns with the phone: one picture for upright, one for sideways.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { prependBaseUrl } from '@/utils/function'
import useMusic from '@/use/useMusic'
import useSoundSettings, { DEFAULT_MUSIC, DEFAULT_SFX } from '@/use/useSoundSettings'

withDefaults(defineProps<{ title?: string; back?: boolean }>(), { title: '', back: true })
const emit = defineEmits<{ back: [] }>()
const { t } = useI18n({ useScope: 'global' })
const img = (n: string) => `url(${prependBaseUrl(`images/familie/karte/${n}.webp`)})`
const bgHigh = img('karte-hoch')
const bgWide = img('karte-quer')

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
    div(class="mt-bg mt-bg--high" :style="{ backgroundImage: bgHigh }")
    div(class="mt-bg mt-bg--wide" :style="{ backgroundImage: bgWide }")
    div(class="mt-shade")
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
  --mp-cream: #f6ead0
  --mp-night: #1c130a
  --mp-serif: 'Cormorant Garamond', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif
  position: fixed
  inset: 0
  z-index: 60
  display: flex
  flex-direction: column
  overflow: hidden
  background: var(--mp-night)
  color: var(--mp-cream)
  font-family: var(--mp-serif)

.mt-bg
  position: absolute
  inset: 0
  background-size: cover
  background-position: center
  background-color: #6d5230

.mt-bg--wide
  display: none

@media (orientation: landscape)
  .mt-bg--high
    display: none
  .mt-bg--wide
    display: block

// a soft dark edge and the warm lamp at the upper left, so that pieces and text stand out from the map
.mt-shade
  position: absolute
  inset: 0
  pointer-events: none
  background: radial-gradient(120% 90% at 50% 45%, rgba(20, 12, 4, 0) 40%, rgba(20, 12, 4, 0.55) 100%), radial-gradient(60% 40% at 8% 0%, rgba(255, 190, 90, 0.22), rgba(255, 190, 90, 0) 70%)

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
  border: 2px solid #f3d98a
  background: radial-gradient(circle at 35% 30%, #c79a45, #7d5a22 70%, #4d3513)
  box-shadow: 0 0 0 2px rgba(28, 18, 6, 0.9), 0 3px 8px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 240, 190, 0.7)
  color: #fff3cf
  font: inherit
  font-size: 2rem
  line-height: 1
  padding-bottom: 4px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.mt-round
  padding: 0
  font-size: 1rem
  color: #fff3cf
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-off
    background: radial-gradient(circle at 35% 30%, #6c5a3e, #3d3220 70%)
    color: #cdbd98

.mt-title
  flex: 1
  min-width: 0
  margin: 0
  font-size: 1.25rem
  font-weight: 700
  letter-spacing: 0.14em
  text-transform: uppercase
  color: var(--mp-cream)
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.mt-actions
  margin-left: auto
  display: flex
  gap: 8px

.mt-body
  position: relative
  z-index: 1
  flex: 1
  min-height: 0
  overflow-y: auto
  overflow-x: hidden
  -webkit-overflow-scrolling: touch
  padding: 4px 14px max(18px, env(safe-area-inset-bottom))
</style>
