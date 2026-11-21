<script setup lang="ts">
/**
 * The round flags on top of a shelf: the languages in which the shelf has books, the chosen one ringed. Nothing is drawn when the shelf has one language only.
 * A tap changes the language of the content for the whole app (`useContentLanguage`): the shelf then shows only the books that exist in that language.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FlagIcon from '@/components/atoms/FlagIcon.vue'
import useContentLanguage, { languagesOf, type HasLanguages } from '@/use/useContentLanguage'

const props = defineProps<{ books: readonly HasLanguages[] }>()
const { t } = useI18n({ useScope: 'global' })
const { setLang, shelfLanguage } = useContentLanguage()

const languages = computed(() => languagesOf(props.books))
const current = computed(() => shelfLanguage(props.books))
const name = (l: 'de' | 'en') => (l === 'de' ? t('app.language.german') : t('app.language.english'))
</script>

<template lang="pug">
  div(v-if="languages.length > 1" class="cls" role="radiogroup" :aria-label="t('app.language.shelf')" data-test="content-language")
    button(
      v-for="l in languages"
      :key="l"
      type="button"
      role="radio"
      :aria-checked="current === l"
      :aria-label="name(l)"
      :title="name(l)"
      :data-lang="l"
      :class="['cls-btn', { 'is-on': current === l }]"
      @click="setLang(l)"
    )
      FlagIcon(:lang="l")
</template>

<style scoped lang="sass">
.cls
  display: flex
  align-items: center
  gap: 10px

// a round flag: the flag fills the whole circle (no gap above or below, the sides are cut as in a round badge), the chosen one has a ring outside of it
.cls-btn
  position: relative
  flex: none
  width: 38px
  height: 38px
  padding: 0
  border: 0
  border-radius: 50%
  background: transparent
  cursor: pointer
  overflow: visible
  opacity: 0.55
  transition: opacity 120ms, transform 120ms, box-shadow 120ms

  // the flag itself: a disc without a border, filled to the edge
  svg
    display: block
    width: 100%
    height: 100%
    border-radius: 50%

  &.is-on
    opacity: 1
    transform: scale(1.06)
    box-shadow: 0 0 0 3px var(--lk-accent, #1f6f68)

  // a touch area of 44 px around the 38 px disc (the rule of the app)
  &::after
    content: ''
    position: absolute
    inset: -3px

  &:focus-visible
    outline: 3px solid var(--lk-accent, #1f6f68)
    outline-offset: 4px
</style>
