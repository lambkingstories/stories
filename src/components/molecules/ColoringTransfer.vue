<script setup lang="ts">
/**
 * The short, calm "transfer" between choosing a coloring book and the painting program (Anton, 18.11.2026): the cover of the book glides down to the
 * paint shelf and the words say "Dein Malbuch kommt in die Mal-App". After about one and a half seconds (a tap on the screen is quicker) it says `done`,
 * and the caller opens the painting program, where the book stands on the shelf. Whoever asks the system for less motion sees only a soft fade.
 * It makes no sound. Nothing here paints; the book is put on the shelf by the caller.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { prependBaseUrl } from '@/utils/function'
import { onImgFallback } from '@/utils/placeholder'

const props = withDefaults(defineProps<{
  cover: string
  title: string
  /** The book was on the paint shelf before: the words say that it is waiting there. */
  already?: boolean
  /** How long the transfer lasts without a tap. */
  duration?: number
}>(), { already: false, duration: 1500 })
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n({ useScope: 'global' })
const appSymbol = prependBaseUrl('images/icons/navi/malen.webp')

let finished = false
let timer: ReturnType<typeof setTimeout> | undefined
function finish() {
  if (finished) return
  finished = true
  clearTimeout(timer)
  emit('done')
}

onMounted(() => {
  timer = setTimeout(finish, props.duration)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template lang="pug">
  button(type="button" class="ct" data-test="transfer" :style="{ '--ct-ms': duration + 'ms' }" :aria-label="t('app.coloring.transferSkip')" @click="finish")
    span(class="ct-stage")
      span(class="ct-book")
        img(:src="cover" :alt="title" draggable="false" @error="onImgFallback")
      span(class="ct-shelf" aria-hidden="true")
        span(class="ct-board")
        span(class="ct-app")
          img(:src="appSymbol" alt="" draggable="false")
    span(class="ct-title") {{ title }}
    span(class="ct-text" role="status") {{ already ? t('app.coloring.transferThere') : t('app.coloring.transferMoving') }}
</template>

<style scoped lang="sass">
.ct
  position: fixed
  inset: 0
  z-index: 1200
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  padding: 24px 24px calc(24px + env(safe-area-inset-bottom, 0px))
  border: 0
  background: var(--lk-bg)
  color: var(--lk-text)
  text-align: center
  font-family: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  animation: ct-fade 240ms ease-out both

.ct-stage
  position: relative
  display: block
  width: min(60vw, 240px)
  height: min(80vw, 320px)
  // room under the board for the symbol of the painting program
  margin-bottom: 78px

// the cover: it glides down toward the paint shelf and gets smaller
.ct-book
  position: absolute
  left: 0
  right: 0
  top: 0
  display: block
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 6px 14px 14px 6px
  background: #f1ece2
  box-shadow: 0 20px 30px -14px rgba(60, 40, 10, 0.6), 0 2px 5px rgba(60, 40, 10, 0.28)
  z-index: 2
  transform-origin: 50% 100%
  animation: ct-glide var(--ct-ms) cubic-bezier(0.5, 0, 0.2, 1) 220ms both

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

.ct-shelf
  position: absolute
  left: -14%
  right: -14%
  top: calc(100% - 4px)
  z-index: 1
  display: flex
  flex-direction: column
  align-items: center
  animation: ct-shelf-in 420ms ease-out both

.ct-board
  display: block
  width: 100%
  height: 12px
  border-radius: 8px
  background: var(--lk-shelf)

// the symbol of the painting program stands at the shelf, where the book goes
.ct-app
  display: grid
  place-items: center
  width: 58px
  height: 58px
  margin-top: 8px
  border-radius: 50%
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

  img
    width: 40px
    height: 40px
    object-fit: contain

.ct-title
  max-width: 24rem
  font-size: 1.15rem
  font-weight: 800
  line-height: 1.25

.ct-text
  max-width: 24rem
  color: var(--lk-muted)
  font-size: 1.05rem
  line-height: 1.35

@keyframes ct-fade
  from
    opacity: 0
  to
    opacity: 1

@keyframes ct-shelf-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes ct-glide
  0%
    transform: translateY(0) scale(1)
    opacity: 1
  70%
    opacity: 1
  100%
    transform: translateY(6px) scale(0.42)
    opacity: 0.9

@media (prefers-reduced-motion: reduce)
  .ct-book
    animation: none

  .ct-shelf
    animation: none
</style>
