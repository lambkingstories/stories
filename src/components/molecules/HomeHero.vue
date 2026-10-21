<script setup lang="ts">
/**
 * The welcome "iPad" of the start page: a wide frame with a few slides (welcome, support us, the shop, later the
 * sponsors). Every slide is a picture with a calm text panel next to it (phone: below it), so the text never lies on
 * a busy picture. The slides scroll sideways with the finger (scroll snap), run on by themselves and stop for a while
 * once the child has touched them.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'

export interface HeroSlide {
  /** Tells the page which actions belong to the slide. */
  id?: string
  image: string
  title: string
  /** A short line in the accent colour between the title and the text (the slogan). */
  slogan?: string
  text: string
}

const props = withDefaults(defineProps<{ slides: HeroSlide[]; intervalMs?: number; label?: string }>(), {
  intervalMs: 8000,
  label: ''
})

const track = ref<HTMLElement | null>(null)
const index = ref(0)
let timer: number | null = null
let pausedUntil = 0

function width(): number {
  return track.value?.clientWidth || 1
}

function onScroll() {
  if (!track.value) return
  index.value = Math.min(props.slides.length - 1, Math.max(0, Math.round(track.value.scrollLeft / width())))
}

function goTo(i: number, smooth = true) {
  if (!track.value) return
  const n = props.slides.length
  const to = ((i % n) + n) % n
  track.value.scrollTo({ left: to * width(), behavior: smooth ? 'smooth' : 'auto' })
  index.value = to
}

/** The child touched the slides: no automatic advance for a while. */
function pause() {
  pausedUntil = Date.now() + 25000
}

onMounted(() => {
  if (props.slides.length < 2) return
  timer = window.setInterval(() => {
    if (Date.now() < pausedUntil || document.hidden) return
    goTo(index.value + 1)
  }, props.intervalMs)
})

onBeforeUnmount(() => {
  if (timer != null) clearInterval(timer)
})
</script>

<template lang="pug">
  section(class="hero" :aria-label="label")
    div(
      ref="track"
      class="hero-track"
      @scroll.passive="onScroll"
      @pointerdown="pause"
      @touchstart.passive="pause"
    )
      article(v-for="(s, i) in slides" :key="i" class="hero-slide")
        div(class="hero-img-wrap")
          img(
            :src="s.image"
            alt=""
            class="hero-img"
            draggable="false"
            decoding="async"
            loading="eager"
          )
        div(:class="['hero-copy', { 'has-lamb': i === 0 }]")
          LkCompanion(v-if="i === 0" class="hero-lamb" pose="sitzen" :size="84")
          h2(class="hero-title") {{ s.title }}
          p(v-if="s.slogan" class="hero-slogan") {{ s.slogan }}
          p(class="hero-text") {{ s.text }}
          div(class="hero-actions")
            slot(name="actions" :index="i" :id="s.id")
    div(v-if="slides.length > 1" class="hero-dots")
      button(
        v-for="(s, i) in slides"
        :key="i"
        type="button"
        :class="['hero-dot', { 'is-active': index === i }]"
        :aria-label="`${i + 1} / ${slides.length}`"
        :aria-current="index === i ? 'true' : undefined"
        @click="pause(); goTo(i)"
      )
</template>

<style scoped lang="sass">
// A card in the colour of the theme: the picture on top, text below. The dots sit at the right end of the text part.
.hero
  position: relative
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-panel)
  background: var(--lk-surface)
  overflow: hidden
  box-shadow: var(--lk-shadow)

.hero-track
  display: flex
  // all slides are as high as the highest one, so the card does not jump when it is swiped
  align-items: stretch
  overflow-x: auto
  scroll-snap-type: x mandatory
  scrollbar-width: none
  overscroll-behavior-x: contain
  touch-action: pan-x pan-y
  -webkit-overflow-scrolling: touch

  &::-webkit-scrollbar
    display: none

.hero-slide
  flex: 0 0 100%
  scroll-snap-align: start
  display: flex
  flex-direction: column

.hero-img-wrap
  aspect-ratio: 4 / 3.5
  background: var(--lk-surface-2)
  overflow: hidden

.hero-img
  display: block
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none
  -webkit-user-select: none
  user-select: none

.hero-copy
  position: relative
  // the text panel lies over the lower edge of the picture
  margin-top: -32px
  padding: 20px 18px 40px
  border-radius: var(--lk-r-group) var(--lk-r-group) 0 0
  background: var(--lk-surface)
  display: flex
  flex-direction: column
  gap: 4px
  flex: 1
  color: var(--lk-text)

.hero-lamb
  position: absolute
  right: 16px
  // the lamb sits on the upper edge of the text panel and never covers the title
  top: -80px

.hero-title
  margin: 0
  font-weight: 800
  font-size: 1.55rem
  line-height: 1.15

.hero-slogan
  margin: 2px 0 4px
  font-weight: 800
  font-size: 1.12rem
  letter-spacing: 0.02em
  color: var(--lk-accent)

.hero-text
  margin: 0
  font-size: 1.02rem
  line-height: 1.4
  color: var(--lk-muted)

.hero-actions
  display: flex
  flex-wrap: wrap
  gap: 10px
  margin-top: 8px

  &:empty
    display: none

.hero-dots
  position: absolute
  left: 0
  right: 0
  bottom: 8px
  display: flex
  justify-content: center
  gap: 0
  pointer-events: none

// 44 px tap area around a small dot
.hero-dot
  pointer-events: auto
  position: relative
  width: 28px
  height: 30px
  border: none
  background: transparent
  padding: 0
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: 9px
    height: 9px
    margin: -4.5px 0 0 -4.5px
    border-radius: 999px
    background: var(--lk-track)
    transition: width 200ms ease-out, margin 200ms ease-out, background-color 200ms ease-out

  &.is-active::after
    width: 22px
    margin-left: -11px
    background: var(--lk-accent)

// tablet / wide: picture left, text right
@media (min-width: 720px)
  .hero-slide
    flex-direction: row
    align-items: stretch

  .hero-img-wrap
    flex: 0 0 58%
    aspect-ratio: auto
    min-height: 300px

  .hero-copy
    margin-top: 0
    border-radius: 0
    flex: 1
    justify-content: center
    padding: 24px 28px 44px
    gap: 10px

    // the card ends at its upper edge here, so the lamb sits inside the card and the text starts below it
    &.has-lamb
      padding-top: 108px

  .hero-lamb
    top: 14px

  .hero-title
    font-size: 2rem

  .hero-text
    font-size: 1.15rem
</style>
