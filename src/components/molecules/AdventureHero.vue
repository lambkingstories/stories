<script setup lang="ts">
/**
 * The picture at the top of the adventure page: a painted landscape with a winding path (the journey), and on it the real elements of the
 * app: the medals of the adventures along the path (big near, small far), the lamb at the start and the compass in the sky. The landscape
 * is painted, the rest is laid over it, so the medals are always the ones of the adventures that exist. The picture keeps the shape of
 * the painting (16:9), so the places in percent always lie on the path.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'
import { medalThumb, onThumbError } from '@/utils/medalThumb'

interface Slot {
  /** Middle of the element in percent of the width and of the height of the picture. */
  x: number
  y: number
  /** Width in percent of the width of the picture. */
  s: number
}

// the places were chosen on the painting (the big valley): the medals lie on the bends of the path, near ones are bigger than far ones
const IMAGE = 'images/bg/abenteuer-reise.webp'
const MEDALS: Slot[] = [{ x: 58, y: 79, s: 15 }, { x: 35, y: 63, s: 12 }, { x: 55, y: 55, s: 10.5 }, { x: 77, y: 44, s: 9 }, { x: 84, y: 31, s: 7.5 }, { x: 93, y: 29, s: 6 }]
const LAMB: Slot = { x: 80, y: 86, s: 11 }
const COMPASS: Slot = { x: 91, y: 12, s: 9 }

const props = defineProps<{ medals: string[] }>()

// the golden beads that tie the places together: a soft curve from the lamb through the medals (the picture is 160 x 90 units, so beads stay round)
const way = computed(() => {
  const pts = [LAMB, ...MEDALS.slice(0, props.medals.length)].map((p) => [p.x * 1.6, p.y * 0.9] as const)
  if (pts.length < 2) return ''
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`
  }
  return d
})

// The picture and everything on it appear together: first the painted landscape with a soft sky colour, and when the landscape and the small medals
// have loaded (or after a short wait) the medals, the lamb and the compass fade in at once, so nothing pops in one by one.
const loaded = ref(0)
const ready = ref(false)
let timer = 0
const need = computed(() => 1 + props.medals.length + 2)
function one() {
  loaded.value++
  if (loaded.value >= need.value) ready.value = true
}
onMounted(() => {
  timer = window.setTimeout(() => {
    ready.value = true
  }, 1800)
})
onBeforeUnmount(() => window.clearTimeout(timer))

const spot = (p: Slot) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}%` })
const placed = computed(() => MEDALS.slice(0, props.medals.length).map((p, i) => ({ src: props.medals[i]!, thumb: medalThumb(props.medals[i]!), style: spot(p) })))
</script>

<template lang="pug">
  div(:class="['ah', { 'is-ready': ready }]")
    img(:src="prependBaseUrl(IMAGE)" alt="" class="ah-bg" draggable="false" fetchpriority="high" decoding="async" @load="one" @error="one")
    svg(v-if="way" class="ah-way" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true")
      path(:d="way" class="ah-bead ah-bead-edge")
      path(:d="way" class="ah-bead ah-bead-gold")
    img(v-for="(m, i) in placed" :key="i" :src="prependBaseUrl(m.thumb)" alt="" class="ah-el ah-medal" :style="m.style" draggable="false" decoding="async" @load="one" @error="(e) => { onThumbError(e, prependBaseUrl(m.src)); one() }")
    img(:src="prependBaseUrl('images/icons/navi/abenteuer.webp')" alt="" class="ah-el ah-compass" :style="spot(COMPASS)" draggable="false" @load="one" @error="one")
    img(:src="prependBaseUrl('images/logo/lk-lamm.webp')" alt="" class="ah-el ah-lamb" :style="spot(LAMB)" draggable="false" @load="one" @error="one")
    slot
</template>

<style scoped lang="sass">
.ah
  position: relative
  aspect-ratio: 16 / 9
  overflow: hidden
  // while the landscape loads: the colour of the sky and the grass, not an empty hole
  background: linear-gradient(180deg, #9cc7ea 0%, #cfe3ee 38%, #8fae5c 62%, #6c8c3f 100%)

// everything that lies on the landscape waits for the others and fades in with them
.ah-el, .ah-way
  opacity: 0
  transition: opacity 0.45s ease-out

.is-ready .ah-el, .is-ready .ah-way
  opacity: 1

.ah-bg
  opacity: 0
  transition: opacity 0.35s ease-out

.is-ready .ah-bg
  opacity: 1

.ah-bg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover

.ah-way
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.ah-bead
  fill: none
  stroke-linecap: round

.ah-bead-edge
  stroke: #6b4306
  stroke-width: 1.9
  stroke-dasharray: 0 3.4

.ah-bead-gold
  stroke: #f7c943
  stroke-width: 1.3
  stroke-dasharray: 0 3.4

.ah-el
  position: absolute
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  user-select: none

.ah-medal
  aspect-ratio: 1
  object-fit: contain
  filter: drop-shadow(0 3px 5px rgba(40, 24, 4, 0.45))

.ah-compass
  filter: drop-shadow(0 2px 4px rgba(40, 24, 4, 0.4))

.ah-lamb
  filter: drop-shadow(0 3px 4px rgba(40, 24, 4, 0.4))
</style>
