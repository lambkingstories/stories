<script setup lang="ts">
/**
 * One page of the book that is read (`BookFlip`): a picture, or a page of words (the number of the page, its title, the Bible passage and the words that belong to the picture,
 * as on the left page of a coloring book lying open). Nothing is drawn for an empty page.
 */
import ColoringSpreadText from '@/components/molecules/ColoringSpreadText.vue'

export interface BookFlipText {
  no: number
  total: number
  title: string
  reference: string
  text: string
}
/** The last page of a look inside: the cover, a title, a few words and buttons (buy, store). */
export interface BookFlipEnd {
  cover: string
  title: string
  text?: string
  badge?: string
  note?: string
  buttons: { label: string; kind: 'primary' | 'outline' | 'link'; testid: string; disabled?: boolean; action: () => void }[]
}
/** A page: the address of a picture, the words of a text page, or the closing page of a look inside. */
export type BookFlipPage = string | { text: BookFlipText } | { end: BookFlipEnd }

defineProps<{ page: BookFlipPage | null | undefined }>()
</script>

<template lang="pug">
  img(v-if="typeof page === 'string' && page" :src="page" alt="" draggable="false")
  //- the closing page of a look inside; a tap on it does not turn the book away
  div(v-else-if="page && typeof page === 'object' && 'end' in page" class="bfp-sheet bfp-end" data-test="book-end-page")
    img(:src="page.end.cover" alt="" class="bfp-end-cover" draggable="false")
    span(v-if="page.end.badge" class="bfp-end-badge") {{ page.end.badge }}
    h2(class="bfp-end-title") {{ page.end.title }}
    p(v-if="page.end.text" class="bfp-end-text") {{ page.end.text }}
    button(
      v-for="b in page.end.buttons"
      :key="b.testid"
      type="button"
      :class="['bfp-end-btn', `is-${b.kind}`, b.testid]"
      :disabled="b.disabled"
      @click.stop="b.action()"
    ) {{ b.label }}
    p(v-if="page.end.note" class="bfp-end-note" role="status") {{ page.end.note }}
  div(v-else-if="page && typeof page === 'object' && 'text' in page" class="bfp-sheet" data-test="book-text-page")
    ColoringSpreadText(:no="page.text.no" :total="page.text.total" :title="page.text.title" :reference="page.text.reference" :text="page.text.text")
</template>

<style scoped lang="sass">
// the paper of a page of words: warm white with a darker edge at the spine side, like the left page of the open coloring book
.bfp-sheet
  position: absolute
  inset: 0
  overflow: hidden
  background: linear-gradient(90deg, #fffaf0 0%, #fffaf0 88%, #efe3cb 100%)

.bfp-end
  box-sizing: border-box
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2.2%
  padding: 5%
  text-align: center
  color: #2b1b4d
  overflow: hidden
  container-type: size

.bfp-end-cover
  display: block
  width: auto !important
  height: 24% !important
  border-radius: 8px
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25)

.bfp-end-badge
  padding: 2px 12px
  border-radius: 999px
  background: #f2b531
  font-weight: 800
  font-size: clamp(0.7rem, 3.4cqmin, 0.95rem)

.bfp-end-title
  margin: 0
  font-weight: 800
  font-size: clamp(1rem, 5.6cqmin, 1.7rem)
  line-height: 1.15

.bfp-end-text
  margin: 0
  font-size: clamp(0.82rem, 4.1cqmin, 1.1rem)
  line-height: 1.35

.bfp-end-btn
  min-height: 44px
  max-width: 92%
  padding: 6px 18px
  border: 2px solid #1d666a
  border-radius: 999px
  font-family: inherit
  font-weight: 800
  font-size: clamp(0.82rem, 4.1cqmin, 1.05rem)
  cursor: pointer
  background: transparent
  color: #1d666a
  -webkit-tap-highlight-color: transparent

  &.is-primary
    background: #1d666a
    color: #fff

  &.is-link
    min-height: 32px
    border: none
    text-decoration: underline
    font-weight: 700
    font-size: 0.8rem

  &:disabled
    opacity: 0.5

.bfp-end-note
  margin: 0
  font-size: clamp(0.72rem, 3.4cqmin, 0.9rem)
  color: #5a5470
</style>
