<script setup lang="ts">
/**
 * A collection card: a thin gold frame, the painted hero picture of the adventure (the picture is the card), its name and the three stars; the back
 * shows the hero at the end of the story. The card is only drawn here. Its turn, its tilt and the glint that runs over it come from the page that
 * holds it, as the CSS variables `--rx`, `--ry` (degrees; `--ry` is the turn of the card, 0 = front, 180 = back) and `--mx`, `--my` (percent).
 * The glint is a light that makes the colours glow (it never covers the picture with a veil): a rainbow foil in a band and a thin white sheen.
 */
import { prependBaseUrl } from '@/utils/function'

withDefaults(
  defineProps<{
    title: string
    image?: string
    /** The Bible passage (back of the card). */
    reference?: string
    /** The name of the journey (kept for the card without a picture on its back). */
    journeyTitle?: string
    stars?: number
    /** The card of an adventure: a stronger rainbow foil. */
    special?: boolean
    /** The picture of the back: the hero at the end of the story (without it the back shows the crowned lamb). */
    backImage?: string
    /** The picture is a painted hero picture that fills the card (else it is a medal on a blue ground). */
    art?: boolean
    /** The card is shown from its back. */
    flipped?: boolean
    /** A finger is turning the card right now: no easing. */
    dragging?: boolean
    /** Without tilt and glint (the small cards in the album). */
    still?: boolean
  }>(),
  {
    stars: 3,
    special: false,
    art: false,
    backImage: undefined,
    flipped: false,
    dragging: false,
    still: false,
    image: undefined,
    reference: undefined,
    journeyTitle: undefined
  }
)

const ui = (f: string) => prependBaseUrl(`images/abenteuer/ui/${f}`)
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : '')
</script>

<template lang="pug">
  div(:class="['cc', { 'is-special': special, 'is-flipped': flipped, 'is-still': still, 'is-dragging': dragging, 'has-art': art }]")
    div(class="cc-turn")
      //- front
      div(class="cc-face cc-front")
        div(class="cc-window")
          span(class="cc-pic")
            img(:src="pic(image)" alt="" draggable="false" loading="lazy")
          span(v-if="art" class="cc-sparks" aria-hidden="true")
          span(class="cc-plate")
            span(v-if="special && !art" class="cc-kicker") {{ $t('app.collection.special') }}
            span(class="cc-title") {{ title }}
          span(class="cc-stars" aria-hidden="true")
            span(v-for="n in 3" :key="n" :class="['cc-star', { 'is-on': n <= stars }]") ★
        img(class="cc-frame" :src="ui('karte-rahmen.webp')" alt="" draggable="false")
        span(class="cc-shine" aria-hidden="true")
      //- back
      div(:class="['cc-face', 'cc-back', { 'has-back-art': !!backImage }]")
        template(v-if="backImage")
          //- the hero at the end of the story, in the same frame as the front
          div(class="cc-window")
            span(class="cc-pic")
              img(:src="pic(backImage)" alt="" draggable="false" loading="lazy")
            span(class="cc-sparks" aria-hidden="true")
            span(class="cc-plate")
              span(class="cc-title") {{ title }}
              span(v-if="reference" class="cc-back-ref2") {{ reference }}
          img(class="cc-frame" :src="ui('karte-rahmen.webp')" alt="" draggable="false")
        template(v-else)
          img(class="cc-back-img" :src="ui('karte-rueckseite.webp')" alt="" draggable="false")
          div(class="cc-back-text")
            span(class="cc-back-title") {{ title }}
            span(v-if="reference" class="cc-back-ref") {{ reference }}
            span(v-if="journeyTitle" class="cc-back-journey") {{ journeyTitle }}
        span(class="cc-shine" aria-hidden="true")
</template>

<style scoped lang="sass">
// The card is 2:3 and everything in it is sized by its width (container units), so it looks the same small or large.
// The window of the thin gold frame (where the content sits), as shares of the card:
$wx: 2.6%
$wy: 1.6%
$ww: 94.8%
$wh: 96.8%

.cc
  container-type: inline-size
  position: relative
  aspect-ratio: 2 / 3
  width: 100%
  perspective: 1100px

.cc-turn
  position: absolute
  inset: 0
  transform-style: preserve-3d
  // `--ry` is the turn of the card: 0 shows the front, 180 the back (the page that holds the card sets it, a finger can drag it)
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))
  transition: transform 0.38s cubic-bezier(0.2, 0.8, 0.25, 1)

.is-dragging .cc-turn, .is-still .cc-turn
  transition: none

.cc-face
  position: absolute
  inset: 0
  border-radius: 5cqw
  overflow: hidden
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  box-shadow: 0 1.5cqw 4cqw rgba(30, 20, 5, 0.38)

.cc-back
  transform: rotateY(180deg)

.cc-frame, .cc-back-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: fill
  pointer-events: none
  user-select: none

.cc-window
  position: absolute
  left: $wx
  top: $wy
  width: $ww
  height: $wh
  display: flex
  flex-direction: column
  background: linear-gradient(180deg, #fdf6e1 0%, #f3e4b8 100%)
  color: #3a2a0c

.cc-pic
  display: block
  flex: 0 0 62%
  overflow: hidden
  background: #1d2f55

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.is-special .cc-pic
  background: radial-gradient(circle at 50% 45%, #3b5aa5 0%, #162646 80%)

  img
    object-fit: contain
    padding: 4cqw

// a painted hero picture fills the whole window; only a slim foot carries the name, the picture stays bright
.has-art .cc-window, .has-back-art .cc-window
  background: #0f1a36

.has-art .cc-pic, .has-back-art .cc-pic
  position: absolute
  inset: 0
  flex: none

  img
    width: 100%
    height: 100%
    object-fit: cover
    object-position: 50% 30%
    padding: 0
    // the picture moves a little against the frame when the card is tilted
    transform: scale(1.07) translate(calc((50 - var(--mx, 50)) * 0.14%), calc((40 - var(--my, 40)) * 0.1%))
    transition: transform 0.12s ease-out

.has-art .cc-plate, .has-back-art .cc-plate
  position: absolute
  left: 0
  right: 0
  bottom: 0
  padding: 9cqw 4cqw 3cqw
  // a light foot: it only darkens the last strip of the picture a little
  background: linear-gradient(0deg, rgba(8, 14, 34, 0.62) 0%, rgba(8, 14, 34, 0.34) 55%, rgba(8, 14, 34, 0) 100%)
  color: #fff3cf

.has-art .cc-title, .has-back-art .cc-title
  font-size: 7.2cqw
  line-height: 1.1
  -webkit-line-clamp: 1
  text-shadow: 0 0.5cqw 1.4cqw rgba(0, 0, 0, 0.75)

.has-art .cc-stars
  position: absolute
  left: 0
  right: 0
  bottom: 0.6cqw
  padding: 0
  gap: 1cqw
  // the stars sit on the foot, under the name: the plate leaves the room
  transform: translateY(-0.4cqw)

.has-art .cc-plate
  padding-bottom: 11cqw

.has-art .cc-star
  font-size: 5.6cqw
  color: rgba(255, 255, 255, 0.3)

  &.is-on
    color: #ffd24a
    text-shadow: 0 0.3cqw 0.8cqw rgba(0, 0, 0, 0.55)

// fine golden flecks that drift and twinkle over the picture
.cc-sparks
  position: absolute
  inset: 0
  pointer-events: none
  mix-blend-mode: screen
  opacity: 0.5
  background-image: radial-gradient(circle, rgba(255, 240, 180, 0.95) 0 1.2px, transparent 2.4px), radial-gradient(circle, rgba(255, 255, 255, 0.85) 0 1px, transparent 2px)
  background-size: 38px 52px, 61px 83px
  background-position: 0 0, 20px 30px
  animation: cc-twinkle 4.5s ease-in-out infinite

.is-still .cc-sparks
  animation: none
  opacity: 0.3

@keyframes cc-twinkle
  50%
    opacity: 0.15
    background-position: 8px 16px, 30px 48px

@media (prefers-reduced-motion: reduce)
  .cc-sparks
    animation: none

.cc-back-ref2
  display: block
  font-size: 4.6cqw
  font-weight: 700
  color: #f5c84a
  text-shadow: 0 0.5cqw 1.2cqw rgba(0, 0, 0, 0.7)

.cc-plate
  flex: 1 1 auto
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 0.6cqw
  padding: 1.5cqw 3cqw 0
  text-align: center

.cc-kicker
  font-size: 4.4cqw
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #a06a00

.cc-title
  font-size: 7.4cqw
  font-weight: 800
  line-height: 1.12
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.cc-stars
  display: flex
  justify-content: center
  gap: 1.5cqw
  padding: 0 0 3cqw
  line-height: 1

.cc-star
  font-size: 9cqw
  color: rgba(120, 90, 30, 0.25)

  &.is-on
    color: #e8a600
    text-shadow: 0 0.4cqw 0.8cqw rgba(120, 70, 0, 0.45)

.cc-back-text
  position: absolute
  left: $wx + 6%
  right: $wx + 6%
  bottom: $wy + 7%
  display: flex
  flex-direction: column
  align-items: center
  gap: 1.2cqw
  padding: 4cqw 3cqw
  border-radius: 4cqw
  background: rgba(14, 24, 52, 0.78)
  border: 0.5cqw solid rgba(240, 190, 70, 0.8)
  color: #fff3cf
  text-align: center

.cc-back-title
  font-size: 7.6cqw
  font-weight: 800
  line-height: 1.15

.cc-back-ref
  font-size: 6cqw
  font-weight: 700
  color: #f5c84a

.cc-back-journey
  font-size: 5cqw
  opacity: 0.85

// The glint: light that brings the colours out. It never greys the picture: the rainbow foil only lifts the colours inside a band (soft light),
// and a thin white sheen runs on its edge. Both follow --mx / --my, so the light moves with the finger and with the tilt of the phone.
.cc-shine
  position: absolute
  inset: 0
  pointer-events: none
  overflow: hidden
  border-radius: inherit

  // the rainbow foil, strong inside the band, nothing outside
  &::before
    content: ''
    position: absolute
    inset: 0
    background: linear-gradient(115deg, #ff5f9e, #ffd04a, #6bff9c, #4fd5ff, #b080ff, #ff5f9e) calc(var(--mx, 50) * 1%) 0 / 280% 100%
    mix-blend-mode: soft-light
    opacity: 0.95
    -webkit-mask-image: linear-gradient(115deg, transparent calc(var(--mx, 50) * 1% - 34%), #000 calc(var(--mx, 50) * 1%), transparent calc(var(--mx, 50) * 1% + 34%))
    mask-image: linear-gradient(115deg, transparent calc(var(--mx, 50) * 1% - 34%), #000 calc(var(--mx, 50) * 1%), transparent calc(var(--mx, 50) * 1% + 34%))

  // the sheen: a narrow white streak and a small bright spot where the light hits
  &::after
    content: ''
    position: absolute
    inset: 0
    background: linear-gradient(115deg, transparent calc(var(--mx, 50) * 1% - 9%), rgba(255, 255, 255, 0.55) calc(var(--mx, 50) * 1%), transparent calc(var(--mx, 50) * 1% + 9%)), radial-gradient(circle at calc(var(--mx, 50) * 1%) calc(var(--my, 40) * 1%), rgba(255, 255, 255, 0.32), transparent 22%)
    mix-blend-mode: screen
    opacity: 0.85

.is-special .cc-shine::before
  opacity: 1

.is-still .cc-shine
  opacity: 0.55
</style>
