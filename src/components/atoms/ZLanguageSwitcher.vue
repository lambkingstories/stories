<script setup lang="ts">
/**
 * Language switcher — two flags, the active one highlighted.
 *
 * Shared by the welcome screen (where a child hands the phone to a parent
 * who reads the other language) and the profile settings card, so the
 * "which language am I in" affordance looks the same in both places.
 *
 * Flags are inline SVG rather than emoji or image files: emoji regional
 * indicators don't render as flags on Windows/Chrome at all, and an inline
 * shape needs no network round-trip on the very first screen of the app.
 *
 * Writing goes through `setSettingValue('language', …)` only. App.vue owns
 * the single `userLanguage → i18n locale + localStorage` sync, so this
 * component deliberately doesn't touch `locale` itself.
 */
import { useI18n } from 'vue-i18n'
import { useId } from 'vue'
import useUser from '@/use/useUser'
import { SPANISH_ENABLED } from '@/utils/languages'

interface Props {
  /** Flag width in px; the 3:2 height follows. */
  size?: number
}

withDefaults(defineProps<Props>(), { size: 38 })

const emit = defineEmits<{ change: [locale: 'de' | 'en' | 'es'] }>()

const { t } = useI18n({ useScope: 'global' })
const { userLanguage, setSettingValue } = useUser()

// The Union Jack's counterchanged red diagonals need a clip path, and a
// hard-coded id would collide as soon as two switchers are mounted (welcome
// screen + an open profile card).
const ukClipId = `z-uk-clip-${useId()}`

function pick(code: 'de' | 'en' | 'es') {
  if (userLanguage.value === code) return
  setSettingValue('language', code)
  emit('change', code)
}
</script>

<template lang="pug">
  div(
    class="z-lang"
    role="group"
    :aria-label="t('app.language.aria')"
  )
    button(
      type="button"
      :class="['z-lang-btn', { 'is-active': userLanguage === 'en' }]"
      :style="{ width: size + 'px' }"
      :aria-label="t('app.language.english')"
      :aria-pressed="userLanguage === 'en'"
      :title="t('app.language.english')"
      @click="pick('en')"
    )
      //- Drawn on a 3:2 canvas rather than the Union Jack's official 2:1 so
      //- it fills the button box edge to edge — a 2:1 viewBox letterboxes
      //- inside a 3:2 box and leaves a dead strip above and below the flag,
      //- which the selection ring then has to wrap around.
      svg(viewBox="0 0 60 40" class="z-lang-flag" aria-hidden="true" focusable="false")
        clipPath(:id="ukClipId")
          path(d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z")
        path(d="M0,0 v40 h60 v-40 z" fill="#012169")
        path(d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" stroke-width="8")
        path(
          d="M0,0 L60,40 M60,0 L0,40"
          :clip-path="`url(#${ukClipId})`"
          stroke="#c8102e"
          stroke-width="5"
        )
        path(d="M30,0 v40 M0,20 h60" stroke="#ffffff" stroke-width="13")
        path(d="M30,0 v40 M0,20 h60" stroke="#c8102e" stroke-width="7.5")
    button(
      type="button"
      :class="['z-lang-btn', { 'is-active': userLanguage === 'de' }]"
      :style="{ width: size + 'px' }"
      :aria-label="t('app.language.german')"
      :aria-pressed="userLanguage === 'de'"
      :title="t('app.language.german')"
      @click="pick('de')"
    )
      //- 3:2 is the German flag's own ratio, so the bands fill the box.
      //- The 0.1 overlap on each band kills the hairline seams that
      //- sub-pixel rounding leaves between exactly-abutting rects.
      svg(viewBox="0 0 60 40" class="z-lang-flag" aria-hidden="true" focusable="false")
        rect(width="60" height="13.5" y="0" fill="#000000")
        rect(width="60" height="13.5" y="13.3" fill="#dd0000")
        rect(width="60" height="13.4" y="26.6" fill="#ffce00")
    button(
      v-if="SPANISH_ENABLED"
      type="button"
      :class="['z-lang-btn', { 'is-active': userLanguage === 'es' }]"
      :style="{ width: size + 'px' }"
      :aria-label="t('app.language.spanish')"
      :aria-pressed="userLanguage === 'es'"
      :title="t('app.language.spanish')"
      @click="pick('es')"
    )
      //- the flag of Spain: red, a yellow band twice as high, red
      svg(viewBox="0 0 60 40" class="z-lang-flag" aria-hidden="true" focusable="false")
        rect(width="60" height="10.1" y="0" fill="#c60b1e")
        rect(width="60" height="20.2" y="9.9" fill="#ffc400")
        rect(width="60" height="10.1" y="29.9" fill="#c60b1e")
</template>

<style scoped lang="sass">
$gold: #d4a83e
$navy: #15294a

.z-lang
  display: inline-flex
  align-items: center
  gap: 8px

// The button box IS the flag box — both flags are drawn on a 3:2 canvas, so
// the selection ring sits directly on the artwork's edge with no dead strip
// between them. Any ratio mismatch here reopens that gap.
.z-lang-btn
  position: relative
  display: inline-flex
  padding: 0
  border: none
  background: transparent
  border-radius: 5px
  cursor: pointer
  line-height: 0
  aspect-ratio: 3 / 2
  -webkit-tap-highlight-color: transparent
  // Unselected flags recede — but only partly: on the frosted white plaque
  // of the welcome screen a heavier dim made them read as disabled.
  filter: grayscale(0.55)
  opacity: 0.68
  transform: scale(0.95)
  transition: filter 180ms ease-out, opacity 180ms ease-out, transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover:not(.is-active)
    filter: grayscale(0.2)
    opacity: 0.9

  &:active
    transform: scale(0.9)

  &:focus-visible
    outline: 2px solid $gold
    outline-offset: 3px

  // Gold ring plus a navy halo — gold alone washes out against a white
  // backdrop, which is exactly what sits behind this on both screens.
  &.is-active
    filter: none
    opacity: 1
    transform: scale(1)
    box-shadow: 0 0 0 2px $gold, 0 0 0 3px rgba(21, 41, 74, 0.3), 0 3px 9px -3px rgba(10, 26, 48, 0.6)

.z-lang-flag
  width: 100%
  height: 100%
  display: block
  border-radius: inherit
  // Hairline so the white of the Union Jack keeps an edge against a light
  // background instead of dissolving into it.
  box-shadow: inset 0 0 0 1px rgba(21, 41, 74, 0.5)
</style>
