<script setup lang="ts">
/**
 * Decorate the feast: the garden court of the palace in Susa stands ready (a painted picture) and the things for the feast wait in a row under it. The child drags a thing (or taps it and then taps a
 * place) to its place. Round 1: three cloths for the three pillars, "white, red and blue" from left to right, as the text says. Round 2: the floor of four kinds of marble, "green, white, yellow and black".
 * Round 3: the golden cups on the long table, and every cup looks different, so a cup that is just like one on the table is refused (it is a twin). A thing on a wrong place or a refused cup springs back
 * (a cross, a mistake); letting go beside the places is no mistake. The arithmetic is in `utils/esterGames.ts`; the places are percent of the picture.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { decorDone, decorPlace, placeAt } from '@/utils/esterGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DecorGame } from '@/types/adventure'

const props = defineProps<{ game: DecorGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every place of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.slots.length, 0))

const round = ref(0)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
/** For each place of the round the thing that lies on it (-1 = empty). */
const taken = ref<number[]>(props.game.rounds[0]!.slots.map(() => -1))
const selected = ref(-1)
const drag = reactive<{ item: number; x: number; y: number; moved: number }>({ item: -1, x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
const crossAt = ref<{ x: number; y: number } | null>(null)
const bounce = ref(-1)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
/** The things that stay on the picture: the ones of the finished rounds and of this round. */
const stack = ref<{ x: number; y: number; w: number; image: string }[]>([])
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.slots.length, 0))
const doneCount = computed(() => progress.parts.value)
/** The picture of the thing in the hand. */
const ghostImage = computed(() => (drag.item >= 0 ? src(current.value.items[drag.item]?.image ?? '') : ''))

const itemUsed = (i: number): boolean => taken.value.includes(i)
const placedKeys = (): string[] => taken.value.filter((x) => x >= 0).map((x) => current.value.items[x]!.key)

function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function down(e: PointerEvent, i: number) {
  if (between.value || finished.value || itemUsed(i)) return
  const p = toPercent(e)
  if (!p) return
  message.value = ''
  drag.item = i
  drag.x = p.x
  drag.y = p.y
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (drag.item < 0) return
  const p = toPercent(e)
  if (!p) return
  drag.x = p.x
  drag.y = p.y
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (drag.item < 0) return
  const i = drag.item
  const moved = drag.moved
  drag.item = -1
  if (moved < 8) {
    // a tap: the thing is picked up, the next tap on a place puts it down
    selected.value = selected.value === i ? -1 : i
    return
  }
  const p = toPercent(e)
  if (p) put(i, placeAt(p, current.value.slots), p)
}

function tapSlot(s: number) {
  if (selected.value < 0 || between.value || finished.value) return
  const c = current.value.slots[s]!
  put(selected.value, s, { x: c.x, y: c.y })
}
/** A tap on the picture puts the picked-up thing on the nearest free place (neighbouring places overlap on a small screen, so the finger decides). */
function fieldClick(e: MouseEvent) {
  if (e.detail === 0 || selected.value < 0 || between.value || finished.value) return
  const p = toPercent(e)
  if (!p) return
  const free = current.value.slots.map((s, i) => ({ ...s, i })).filter((s) => taken.value[s.i]! < 0)
  const k = placeAt(p, free)
  if (k >= 0) tapSlot(free[k]!.i)
}

function put(item: number, slot: number, at: { x: number; y: number }) {
  if (slot < 0) {
    selected.value = -1
    return
  }
  const it = current.value.items[item]!
  const s = current.value.slots[slot]!
  const r = decorPlace(current.value.mode, current.value.want, placedKeys(), slot, it.key, taken.value[slot]! >= 0)
  selected.value = -1
  if (r !== 'ok') {
    misses.value++
    play('wrong')
    message.value = r === 'twin' ? t('app.adventure.decorTwin') : r === 'taken' ? t('app.adventure.decorTaken') : t('app.adventure.decorWrong')
    crossAt.value = { x: at.x, y: at.y }
    bounce.value = item
    later(() => {
      crossAt.value = null
      bounce.value = -1
    }, 900)
    return
  }
  taken.value[slot] = item
  stack.value.push({ x: s.x, y: s.y, w: s.w, image: it.image })
  progress.mark()
  play('snap')
  message.value = ''
  if (decorDone(taken.value)) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.decorReady')
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  message.value = t('app.adventure.decorRoundDone')
  later(() => {
    round.value++
    taken.value = current.value.slots.map(() => -1)
    selected.value = -1
    between.value = false
    message.value = ''
  }, 1700)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})` }"
          role="img"
          :aria-label="t('app.adventure.decorHall')"
          @click="fieldClick"
        )
          //- the things that already lie in place
          img(v-for="(d, di) in stack" :key="`d${di}`" class="gm-done" :src="src(d.image)" alt="" :style="{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%` }")
          //- the free places of this round
          template(v-for="(s, si) in current.slots" :key="`s${si}`")
            button(
              v-if="taken[si] < 0"
              type="button"
              class="gm-slot"
              :class="{ hint: selected >= 0 }"
              :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${Math.max(s.w, 9)}%` }"
              :aria-label="t('app.adventure.decorSlot', { n: si + 1 })"
              @click="tapSlot(si)"
            )
          span(v-if="crossAt" class="gm-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
            GameMark(kind="bad")
        //- the things that wait
        div(class="gm-tray")
          button(
            v-for="(f, fi) in current.items"
            :key="`f${fi}`"
            type="button"
            class="gm-wait"
            :class="{ gone: itemUsed(fi), sel: selected === fi, held: drag.item === fi, bounce: bounce === fi }"
            :aria-label="t('app.adventure.decorThing', { n: fi + 1 })"
            :disabled="itemUsed(fi)"
            @pointerdown.prevent="down($event, fi)"
          )
            img(:src="src(f.image)" alt="" draggable="false")
        //- the thing in the hand
        img(v-if="drag.item >= 0 && drag.moved >= 8" class="gm-ghost" :src="ghostImage" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%`, width: `${current.ghostW}%` }")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.decorCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.decorDone')" @next="emit('done', stars)")
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

.gm-wrap
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  touch-action: none

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

.gm-slot
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 50%
  background: rgba(255, 233, 150, 0.14)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  cursor: pointer
  pointer-events: none
  z-index: 90

  &.hint
    background: rgba(255, 233, 150, 0.34)

.gm-done
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 70px

.gm-wait
  width: 76px
  height: 76px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  transition: opacity 200ms ease, transform 200ms ease

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &.gone
    opacity: 0.18
    cursor: default

  &.sel
    border-color: #2f7bd6
    transform: scale(1.1)
    box-shadow: 0 0 0 3px rgba(47, 123, 214, 0.35)

  &.held
    opacity: 0.45

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 9
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

.gm-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

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

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)
  60%
    transform: translateY(2px)

@media (prefers-reduced-motion: reduce)
  .gm-wait
    transition: none
    &.bounce
      animation: none
</style>
