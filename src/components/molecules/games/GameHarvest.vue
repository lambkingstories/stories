<script setup lang="ts">
/**
 * The harvest: ripe things lie in the field of the estate; each tap sends one into the basket. Stones and thorns do not belong
 * in a basket: tapping one is a mistake. When everything ripe is in the basket the game is won.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HarvestGame } from '@/types/adventure'

const props = defineProps<{ game: HarvestGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.count)

interface Thing {
  key: number
  src: string
  x: number
  y: number
  w: number
  weed: boolean
  /** Rotation for a hand-placed look. */
  r: number
}

/** Places on a loose grid (a deterministic scatter); the bottom middle is the basket's. */
const things = computed<Thing[]>(() => {
  const n = props.game.count + props.game.weeds.length
  const cols = 4
  const rows = Math.ceil((n + 2) / cols)
  const cells: { c: number; r: number }[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ c, r })
  // the basket stands in the last row, in the two middle columns
  const free = cells.filter((cell) => !(cell.r === rows - 1 && (cell.c === 1 || cell.c === 2)))
  let seed = n * 4421 + 17
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[free[i], free[j]] = [free[j]!, free[i]!]
  }
  const out: Thing[] = []
  for (let i = 0; i < n; i++) {
    const cell = free[i % free.length]!
    const weed = i >= props.game.count
    const list = weed ? props.game.weeds : props.game.fruits
    const src = list[(weed ? i - props.game.count : i) % list.length]!
    out.push({
      key: i,
      src: prependBaseUrl(src),
      x: ((cell.c + 0.5 + (rnd() - 0.5) * 0.4) / cols) * 100,
      y: 12 + ((cell.r + 0.5 + (rnd() - 0.5) * 0.3) / rows) * 74,
      w: weed ? 15 : 17,
      weed,
      r: (rnd() - 0.5) * 24
    })
  }
  return out
})

const basket = computed(() => prependBaseUrl(props.game.basket))
const field = computed(() => prependBaseUrl(props.game.field))
const taken = reactive<Record<number, boolean>>({})
const flying = reactive<Record<number, { dx: number; dy: number }>>({})
const shaking = ref<number | null>(null)
const mistakes = ref(0)
const got = computed(() => Object.keys(taken).length)
const finished = computed(() => got.value >= props.game.count)
const stars = computed(() => mistakeStars(mistakes.value))
const area = ref<HTMLElement | null>(null)
const bump = ref(false)

/** Where the basket's middle is, as a share of the field. */
const BASKET = { x: 50, y: 84 }

function tap(th: Thing) {
  if (taken[th.key] || flying[th.key] || finished.value) return
  if (th.weed) {
    mistakes.value++
    play('wrong')
    shaking.value = th.key
    later(() => {
      if (shaking.value === th.key) shaking.value = null
    }, 450)
    return
  }
  progress.mark()
  const box = area.value
  const w = box?.clientWidth ?? 300
  const h = box?.clientHeight ?? 400
  flying[th.key] = { dx: ((BASKET.x - th.x) / 100) * w, dy: ((BASKET.y - th.y) / 100) * h }
  later(() => {
    taken[th.key] = true
    play('basket')
    bump.value = true
    later(() => (bump.value = false), 200)
  }, 540)
}

const style = (th: Thing) => {
  const f = flying[th.key]
  return {
    left: `${th.x}%`,
    top: `${th.y}%`,
    width: `${th.w}%`,
    '--r': `${th.r}deg`,
    '--delay': `${(th.key % 9) * 60}ms`,
    ...(f ? { '--dx': `${f.dx}px`, '--dy': `${f.dy}px` } : {})
  }
}
</script>

<template lang="pug">
  div(class="hv")
    div(v-if="!finished" ref="area" class="hv-field" :style="{ backgroundImage: `url(${field})` }")
      template(v-for="th in things" :key="th.key")
        button(
          v-if="!taken[th.key]"
          type="button"
          class="hv-thing"
          :class="{ weed: th.weed, fly: !!flying[th.key], shake: shaking === th.key }"
          :style="style(th)"
          :aria-label="th.weed ? t('app.adventure.harvestWeed') : t('app.adventure.harvestFruit')"
          @click="tap(th)"
        )
          img(:src="th.src" alt="" draggable="false")
      div(class="hv-basket" :class="{ bump }")
        img(:src="basket" alt="" draggable="false")
        span(class="hv-count") {{ got }} / {{ game.count }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.harvestDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hv-field
  position: relative
  width: min(100%, 340px)
  aspect-ratio: 3 / 4
  margin: 0 auto
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #6b4a22 center / cover no-repeat
  overflow: hidden
  box-shadow: 0 10px 24px -12px rgba(60, 40, 10, 0.6)

.hv-thing
  position: absolute
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%) rotate(var(--r, 0deg))
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  animation: hv-grow 420ms cubic-bezier(0.2, 1.4, 0.4, 1) var(--delay, 0ms) backwards
  transition: transform 520ms ease-in, opacity 520ms ease-in

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 3px 3px rgba(30, 18, 5, 0.45))

  // into the basket
  &.fly
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.4) rotate(var(--r, 0deg))
    opacity: 0.85
    pointer-events: none
    z-index: 5

  &.shake
    animation: hv-shake 420ms ease-in-out

    img
      filter: drop-shadow(0 0 5px #d63031) drop-shadow(0 0 12px #d63031)

  // the right ones glow green on their way into the basket
  &.fly img
    filter: drop-shadow(0 0 6px #2fae54) drop-shadow(0 0 14px #2fae54)

.hv-basket
  position: absolute
  left: 50%
  top: 84%
  width: 34%
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: scale 160ms ease-out

  &.bump
    scale: 1.08

  img
    display: block
    width: 100%
    height: auto
    filter: drop-shadow(0 5px 5px rgba(30, 18, 5, 0.5))

.hv-count
  position: absolute
  left: 50%
  bottom: -6px
  transform: translateX(-50%)
  min-width: 64px
  white-space: nowrap
  padding: 2px 10px
  border-radius: 999px
  background: #4a3208
  color: #fff3cf
  text-align: center
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 1rem
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35)

@keyframes hv-grow
  from
    opacity: 0
    scale: 0.2

@keyframes hv-shake
  0%, 100%
    transform: translate(-50%, -50%) rotate(var(--r, 0deg))
  25%
    transform: translate(calc(-50% - 7px), -50%) rotate(-8deg)
  75%
    transform: translate(calc(-50% + 7px), -50%) rotate(8deg)

@media (prefers-reduced-motion: reduce)
  .hv-thing
    animation: none
</style>
