<script setup lang="ts">
/**
 * Familien-Spiele v2: the two round buttons "music on/off" and "sounds on/off" (the same settings as in the sound window of the app), for the bar of a
 * game (`FamilyGameBar`). 48 px, white line symbols; `tone="light"` (standard) is for a bar in the colour of the game.
 */
import { useI18n } from 'vue-i18n'
import useSoundSettings, { DEFAULT_MUSIC, DEFAULT_SFX } from '@/use/useSoundSettings'

const { t } = useI18n({ useScope: 'global' })
const sound = useSoundSettings()
const toggleMusic = () => sound.setMusicVolume(sound.musicVolume.value > 0 ? 0 : DEFAULT_MUSIC)
const toggleSfx = () => sound.setSfxVolume(sound.sfxVolume.value > 0 ? 0 : DEFAULT_SFX)
</script>

<template lang="pug">
  div(class="fam-snd")
    button(type="button" :class="['fam-snd-btn', 'fam-snd-music', { 'is-off': sound.musicVolume.value <= 0 }]" :aria-pressed="sound.musicVolume.value > 0" :aria-label="t('app.family.musicSwitch')" @click="toggleMusic")
      svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
        path(d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round")
        path(v-if="sound.musicVolume.value <= 0" d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round")
    button(type="button" :class="['fam-snd-btn', 'fam-snd-sfx', { 'is-off': sound.sfxVolume.value <= 0 }]" :aria-pressed="sound.sfxVolume.value > 0" :aria-label="t('app.family.soundSwitch')" @click="toggleSfx")
      svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
        path(d="M4 9v6h4l5 4V5L8 9H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round")
        path(v-if="sound.sfxVolume.value > 0" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round")
        path(v-else d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round")
</template>

<style scoped lang="sass">
.fam-snd
  display: flex
  gap: 8px

.fam-snd-btn
  flex: none
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: 1.5px solid rgba(255, 255, 255, 0.4)
  border-radius: 50%
  background: rgba(255, 255, 255, 0.18)
  color: var(--fam-on-accent)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &.is-off
    background: rgba(0, 0, 0, 0.18)
    opacity: 0.85
</style>
