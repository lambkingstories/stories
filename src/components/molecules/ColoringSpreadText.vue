<script setup lang="ts">
/** The left page of a coloring book that is lying open: the number of the page, its title, the Bible passage and the words that belong to the picture. */
import { useI18n } from 'vue-i18n'

defineProps<{ no: number; total: number; title: string; reference: string; text: string }>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="sp-text")
    p(class="sp-no") {{ t('app.coloring.pageOf', { n: no, total }) }}
    h2(class="sp-title") {{ title }}
    p(v-if="reference" class="sp-ref") {{ reference }}
    span(class="sp-rule" aria-hidden="true")
    p(v-if="text" class="sp-words") {{ text }}
</template>

<style scoped lang="sass">
.sp-text
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-start
  gap: 8px
  padding: clamp(14px, 5%, 36px) clamp(16px, 7%, 44px)
  overflow-y: auto
  scrollbar-width: none
  text-align: center
  color: #3a2c1a

  // centred while it fits, from the top when it is too long (nothing is cut off at the top)
  > :first-child
    margin-top: auto
  > :last-child
    margin-bottom: auto

.sp-no
  margin: 0
  font-size: 0.7rem
  font-weight: 800
  letter-spacing: 0.1em
  text-transform: uppercase
  color: #9a8466

.sp-title
  margin: 0
  font-family: 'Fraunces', Georgia, serif
  font-size: clamp(1.15rem, 3.2vw, 1.9rem)
  font-weight: 700
  line-height: 1.15

.sp-ref
  margin: 0
  font-size: clamp(0.8rem, 1.8vw, 1rem)
  font-weight: 800
  color: #8a5a1c

.sp-rule
  display: block
  width: 56px
  height: 3px
  border-radius: 3px
  background: linear-gradient(90deg, transparent, #d9b56a, transparent)

.sp-words
  margin: 0
  max-width: 34ch
  font-size: clamp(0.88rem, 2.1vw, 1.22rem)
  line-height: 1.5
  color: #4a3a24
  overflow-y: auto
  max-height: 100%
</style>
