<script setup lang="ts">
/**
 * Fill and water: a stream runs through the garden. The child fills the clay jug at the stream (tap the stream, or drag the jug into it) and
 * then waters a plant (tap the plant, or drag the jug onto it): the little plant grows. Some trees are thirsty and need two jugs. A jug that
 * is empty at a plant ("fill it at the stream first") and a plant that has had enough are mistakes (a red cross, nothing is lost). Two rounds:
 * first a few plants, then more of them, with the thirsty trees.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { WaterGame, WaterPlant } from '@/types/adventure'

const props = defineProps<{ game: WaterGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const plantOf = (id: string) => props.game.plants.find((p) => p.id === id)
// the whole task: every jug that a plant of any round needs
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.plants.reduce((s, id) => s + (plantOf(id)?.need ?? 1), 0), 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const plants = computed<WaterPlant[]>(() => current.value.plants.map(plantOf).filter((p): p is WaterPlant => !!p))

/** How many jugs each plant of this round has had. */
const watered = reactive<Record<string, number>>({})
const jugFull = ref(false)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
const flash = ref<{ id: string; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const have = (p: WaterPlant) => watered[p.id] ?? 0
const isGrown = (p: WaterPlant) => have(p) >= p.need
const src = (path: string) => prependBaseUrl(path)

function flashOn(id: string, kind: 'good' | 'bad') {
  flash.value = { id, kind }
  later(() => {
    if (flash.value?.id === id) flash.value = null
  }, 900)
}

function wiggle(id: string) {
  wobble.value = id
  later(() => {
    if (wobble.value === id) wobble.value = null
  }, 450)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 700)
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(watered)) delete watered[k]
    jugFull.value = false
    message.value = ''
  }, 1500)
}

/** The jug is filled at the stream. */
function fill() {
  if (between.value || finished.value || jugFull.value) return
  jugFull.value = true
  message.value = ''
  play('basket')
}

/** The jug is poured over a plant. */
function pour(p: WaterPlant) {
  if (between.value || finished.value) return
  if (!jugFull.value) {
    mistakes.value++
    play('wrong')
    flashOn(p.id, 'bad')
    message.value = t('app.adventure.waterFillFirst')
    wiggle(p.id)
    return
  }
  if (isGrown(p)) {
    mistakes.value++
    play('wrong')
    flashOn(p.id, 'bad')
    message.value = t('app.adventure.waterEnough')
    wiggle(p.id)
    return
  }
  watered[p.id] = have(p) + 1
  jugFull.value = false
  progress.mark()
  play('right')
  flashOn(p.id, 'good')
  message.value = isGrown(p) ? t('app.adventure.fbRight') : t('app.adventure.waterOnceMore')
  if (plants.value.every(isGrown)) roundOver()
}

/** What a tap or a drop on a place does: the stream fills the jug, a plant is watered. */
function act(target: string) {
  if (target === 'river') fill()
  else {
    const p = plantOf(target)
    if (p) pour(p)
  }
}

const { dragging, selected, down, toggleSelect, dragStyle } = useDragDrop((_id, target) => act(target))
/** A tap on the stream or on a plant: the jug is not chosen first, the tap itself does it. */
function tapOn(target: string) {
  selected.value = null
  act(target)
}

const plantStyle = (p: WaterPlant) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` })
const riverStyle = computed(() => {
  const r = props.game.river
  return { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
})
</script>

<template lang="pug">
  div(class="wt")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="wt-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="wt-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="wt-field" :style="{ backgroundImage: `url(${src(game.scene)})` }")
        div(
          class="wt-river"
          :class="{ ready: selected !== null }"
          :style="riverStyle"
          data-drop="river"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.waterRiver')"
          @click="tapOn('river')"
          @keydown.enter.space.prevent="tapOn('river')"
        )
        div(
          v-for="p in plants"
          :key="`${round}-${p.id}`"
          class="wt-plant"
          :class="{ grown: isGrown(p), wobble: wobble === p.id, ready: selected !== null && !isGrown(p), 'flash-good': flash?.id === p.id && flash.kind === 'good', 'flash-bad': flash?.id === p.id && flash.kind === 'bad' }"
          :style="plantStyle(p)"
          :data-drop="p.id"
          role="button"
          tabindex="0"
          :aria-label="t(isGrown(p) ? 'app.adventure.waterPlantGrown' : 'app.adventure.waterPlantSmall', { name: p.label })"
          @click="tapOn(p.id)"
          @keydown.enter.space.prevent="tapOn(p.id)"
        )
          // the full picture lies over the empty one and fades in (the two are painted separately, a hard swap would jump)
          img(:src="src(p.small)" alt="" draggable="false" class="wt-img")
          img(:src="src(p.grown)" alt="" draggable="false" class="wt-img wt-over" :class="{ on: isGrown(p) }")
          span(v-if="p.need > 1" class="wt-drops" aria-hidden="true")
            span(v-for="d in p.need" :key="d" class="wt-drop" :class="{ on: d <= have(p) }")
          GameMark(v-if="flash?.id === p.id" :kind="flash.kind" class="wt-mark")
        div(
          class="wt-jug"
          :class="{ full: jugFull, chosen: selected === 'jug', lifted: dragging === 'jug' }"
          :style="dragStyle('jug')"
          role="button"
          tabindex="0"
          :aria-label="t(jugFull ? 'app.adventure.waterJugFull' : 'app.adventure.waterJugEmpty')"
          @pointerdown="down($event, 'jug')"
          @keydown.enter.space.prevent="toggleSelect('jug')"
        )
          img(:src="src(game.jugEmpty)" alt="" draggable="false")
          img(:src="src(game.jugFull)" alt="" draggable="false" class="wt-jug-full" :class="{ on: jugFull }")
      p(class="wt-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.waterDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wt
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #dcecc8
  box-shadow: inset 0 0 18px rgba(40, 70, 20, 0.25)

.wt-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 252, 232, 0.9)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.wt-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.9)

.wt-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-size: cover
  background-position: center
  touch-action: manipulation

.wt-river
  position: absolute
  cursor: pointer
  border-radius: 12px

  &.ready
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 14px 4px rgba(120, 190, 255, 0.8)

.wt-plant
  position: absolute
  transform: translate(-50%, -100%)
  cursor: pointer
  transition: transform 260ms ease-out

  &.ready
    animation: wt-ready 900ms ease-in-out infinite

  &.grown
    transform: translate(-50%, -100%) scale(1.04)

  &.wobble
    animation: wt-shake 420ms ease-in-out

  &.flash-good
    filter: drop-shadow(0 0 10px rgba(47, 174, 84, 0.95))

  &.flash-bad
    filter: drop-shadow(0 0 10px rgba(214, 48, 49, 0.95))

.wt-img
  display: block
  width: 100%
  height: auto
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 60, 20, 0.5))

// the picture that fades in over the first one (same place and size)
.wt-over
  position: absolute
  left: 0
  top: 0
  opacity: 0
  transition: opacity 450ms ease-in-out

  &.on
    opacity: 1

.wt-drops
  position: absolute
  left: 50%
  bottom: -6px
  display: flex
  gap: 4px
  transform: translateX(-50%)
  padding: 2px 6px
  border-radius: 999px
  background: rgba(255, 252, 232, 0.92)

.wt-drop
  width: 11px
  height: 11px
  border-radius: 50% 50% 50% 0
  transform: rotate(-45deg)
  border: 2px solid #3a86c8
  background: transparent

  &.on
    background: #3a86c8

.wt-mark
  position: absolute
  top: -6px
  right: -8px

.wt-jug
  position: absolute
  left: 4%
  bottom: 3%
  width: 20%
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 5px 5px rgba(40, 60, 20, 0.5))

  .wt-jug-full
    position: absolute
    left: 0
    top: 0
    opacity: 0
    transition: opacity 450ms ease-in-out

    &.on
      opacity: 1

  &.chosen
    transform: translateY(-4px) scale(1.06)

  &.lifted
    cursor: grabbing

.wt-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.94)

  &:empty
    display: none

@keyframes wt-ready
  0%, 100%
    transform: translate(-50%, -100%) scale(1)
  50%
    transform: translate(-50%, -100%) scale(1.04)

@keyframes wt-shake
  0%, 100%
    transform: translate(-50%, -100%) rotate(0)
  25%
    transform: translate(-54%, -100%) rotate(-3deg)
  75%
    transform: translate(-46%, -100%) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .wt-over,
  .wt-jug .wt-jug-full
    transition: none

  .wt-plant.ready,
  .wt-plant.wobble
    animation: none
</style>
