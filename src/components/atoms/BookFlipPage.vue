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
/** A page: the address of a picture, or the words of a text page. */
export type BookFlipPage = string | { text: BookFlipText }

defineProps<{ page: BookFlipPage | null | undefined }>()
</script>

<template lang="pug">
  img(v-if="typeof page === 'string' && page" :src="page" alt="" draggable="false")
  div(v-else-if="page && typeof page === 'object'" class="bfp-sheet" data-test="book-text-page")
    ColoringSpreadText(:no="page.text.no" :total="page.text.total" :title="page.text.title" :reference="page.text.reference" :text="page.text.text")
</template>

<style scoped lang="sass">
// the paper of a page of words: warm white with a darker edge at the spine side, like the left page of the open coloring book
.bfp-sheet
  position: absolute
  inset: 0
  overflow: hidden
  background: linear-gradient(90deg, #fffaf0 0%, #fffaf0 88%, #efe3cb 100%)
</style>
