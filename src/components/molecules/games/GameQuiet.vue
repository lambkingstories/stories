<script setup lang="ts">
/**
 * Lay the stones quietly: on the building site of God's house a row of smooth blocks forms the foundation, with some gaps (a painted picture). Smooth stones wait on the left. The child pulls a stone with a finger to a gap and
 * lets go: it sinks into the gap with a soft sound. The stones are cut to size before they come, so nothing is hammered and nothing may clatter: a stone that is pulled too fast clacks (a cloud with a cross appears, the stone
 * jumps back to its place, a mistake). A small ear meter shows how loud the stone is right now (a bar and a word, never only a color). Round 1: one stone, round 2: two stones, round 3: three stones, each round a little
 * stricter. Letting go beside the gap is no mistake, the stone just goes back. The arithmetic is in `utils/salomoGames.ts`; the places are percent of the picture.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { gapAt, isLoud, loudness, quietSpeed, type QuietSample } from '@/utils/salomoGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { QuietGame } from '@/types/adventure'

const props = defineProps<{ game: QuietGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every stone
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.gaps.length, 0))

const round = ref(0)
const fieldEl = ref<HTMLElement | null>(null)
const filled = ref<boolean[]>(props.game.rounds[0]!.gaps.map(() => false))
/** For every stone of the round the gap it lies in (-1 while it waits). */
const laidGap = ref<number[]>(props.game.rounds[0]!.starts.map(() => -1))
const drag = reactive<{ stone: number; x: number; y: number; samples: QuietSample[] }>({ stone: -1, x: 0, y: 0, samples: [] })
const speed = ref(0)
const cloudAt = ref<{ x: number; y: number } | null>(null)
const backIndex = ref(-1)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const level = computed(() => (drag.stone >= 0 ? loudness(speed.value, current.value.max) : 0))
const meterWord = computed(() => [t('app.adventure.quietQuiet'), t('app.adventure.quietLouder'), t('app.adventure.quietLoud')][level.value]!)
const meterWidth = computed(() => `${drag.stone >= 0 ? Math.min(100, (speed.value / current.value.max) * 70) : 0}%`)
/** The picture of a stone: the pictures of the sheet one after the other. */
const stonePic = (i: number) => props.game.stones[i % props.game.stones.length]!

function toPercent(e: PointerEvent): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function down(e: PointerEvent, i: number) {
  if (between.value || finished.value || laidGap.value[i]! >= 0) return
  const p = toPercent(e)
  if (!p) return
  message.value = ''
  drag.stone = i
  drag.x = p.x
  drag.y = p.y
  drag.samples = [{ x: p.x, y: p.y, t: performance.now() }]
  speed.value = 0
  ;(fieldEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}

function move(e: PointerEvent) {
  if (drag.stone < 0) return
  const p = toPercent(e)
  if (!p) return
  drag.x = p.x
  drag.y = p.y
  drag.samples.push({ x: p.x, y: p.y, t: performance.now() })
  if (drag.samples.length > 40) drag.samples.splice(0, drag.samples.length - 40)
  speed.value = quietSpeed(drag.samples)
  if (isLoud(speed.value, current.value.max)) clack()
}

function clack() {
  const i = drag.stone
  misses.value++
  play('wrong')
  message.value = t('app.adventure.quietClack')
  cloudAt.value = { x: drag.x, y: drag.y }
  backIndex.value = i
  drag.stone = -1
  speed.value = 0
  later(() => {
    cloudAt.value = null
    backIndex.value = -1
  }, 900)
}

function up() {
  if (drag.stone < 0) return
  const i = drag.stone
  const at = { x: drag.x, y: drag.y }
  drag.stone = -1
  speed.value = 0
  const g = gapAt(at, current.value.gaps, filled.value)
  if (g < 0) {
    backIndex.value = i
    later(() => (backIndex.value = -1), 400)
    return
  }
  filled.value[g] = true
  laidGap.value[i] = g
  progress.mark()
  play('snap')
  message.value = t('app.adventure.quietLaid')
  if (filled.value.every(Boolean)) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1200)
    return
  }
  later(() => {
    round.value++
    filled.value = current.value.gaps.map(() => false)
    laidGap.value = current.value.starts.map(() => -1)
    between.value = false
    message.value = ''
  }, 1700)
}

const isLaid = (i: number) => (laidGap.value[i] ?? -1) >= 0

/** Where a stone is drawn: in the hand while it is pulled, else on its waiting place, or in its gap. */
function stoneStyle(i: number) {
  const base = current.value.starts[i]!
  let x = base.x
  let y = base.y
  const g = laidGap.value[i]!
  if (g >= 0) {
    x = current.value.gaps[g]!.x
    y = current.value.gaps[g]!.y
  } else if (drag.stone === i) {
    x = drag.x
    y = drag.y
  }
  return { left: `${x}%`, top: `${y}%`, width: `${props.game.stoneW}%` }
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-meter" role="status")
        span(class="gm-ear" aria-hidden="true") 👂
        span(class="gm-bar" aria-hidden="true")
          span(class="gm-fill" :class="`l${level}`" :style="{ width: meterWidth }")
        span(class="gm-word") {{ meterWord }}
      div(
        ref="fieldEl"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.quietSite')"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @contextmenu.prevent
      )
        //- the gaps of the foundation (a soft golden edge)
        span(v-for="(g, gi) in current.gaps" :key="`g${gi}`" class="gm-gap" :class="{ filled: filled[gi] }" :style="{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%` }" aria-hidden="true")
        //- the stones
        button(
          v-for="(s, i) in current.starts"
          :key="`s${i}`"
          type="button"
          class="gm-stone"
          :class="{ held: drag.stone === i, back: backIndex === i, laid: isLaid(i) }"
          :style="stoneStyle(i)"
          :aria-label="t('app.adventure.quietStone', { n: i + 1 })"
          :disabled="isLaid(i)"
          @pointerdown.prevent="down($event, i)"
        )
          img(:src="src(stonePic(i))" alt="" draggable="false")
        span(v-if="cloudAt" class="gm-cloud" :style="{ left: `${cloudAt.x}%`, top: `${cloudAt.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.quietDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-meter
  display: flex
  align-items: center
  gap: 8px
  align-self: center
  padding: 4px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #3f321b

.gm-ear
  font-size: 1.2rem

.gm-bar
  position: relative
  display: block
  width: 120px
  height: 12px
  border-radius: 999px
  background: rgba(95, 79, 53, 0.25)
  overflow: hidden

.gm-fill
  display: block
  height: 100%
  border-radius: 999px
  background: #7fae5a
  transition: width 90ms linear

  &.l1
    background: #e0a43a

  &.l2
    background: #c85a3a

.gm-word
  min-width: 4.4em
  font-size: 0.95rem

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6a5a48
  background-size: cover
  background-position: center
  touch-action: none

.gm-gap
  position: absolute
  display: block
  aspect-ratio: 1 / 0.7
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 233, 150, 0.9)
  border-radius: 8px
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  pointer-events: none

  &.filled
    border-style: solid
    opacity: 0.35

.gm-stone
  position: absolute
  display: block
  padding: 0
  margin: 0
  min-width: 44px
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: grab
  touch-action: none
  transition: left 280ms ease, top 280ms ease

  &.held
    z-index: 6
    cursor: grabbing
    transition: none
    filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

  &.laid
    z-index: 2
    cursor: default
    transition: left 380ms ease, top 380ms ease

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

.gm-cloud
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .gm-stone
    transition: none
  .gm-fill
    transition: none
</style>
