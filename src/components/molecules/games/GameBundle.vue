<script setup lang="ts">
/**
 * Pack the bundle (Mark 6,8-9): Jesus sends the Twelve out two by two and tells them to take nothing for the journey except a staff, to wear sandals and not to put on two shirts; no bread, no bag, no money in the belt.
 * Things lie on a cloth (every thing has its name written under it). A tap on a thing that Jesus allowed sends it flying into the bundle; a tap on a thing that is not allowed makes it wobble and gives it a cross (a mistake,
 * the thing stays). The round is done when everything that is allowed lies in the bundle. Round 1: staff, sandals, bread, money bag; round 2: shirt, bag, second shirt, staff. After fifteen seconds without a tap the button
 * "Help me pack" packs the next allowed thing. The arithmetic is in `utils/wunderGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { bundleDone, bundleHelpTarget, bundleStep } from '@/utils/wunderGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BundleGame } from '@/types/adventure'

const props = defineProps<{ game: BundleGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every allowed thing of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.items.filter((i) => i.allowed).length, 0))

const TICK = 0.1
const IDLE_SECONDS = 15
/** The colours that stand in for the pictures of the things until they are painted. */
const COLOURS = ['#b98b52', '#8b6b3d', '#c9a24a', '#7f9a6a', '#a77b86', '#6f8fa8', '#c9835a']

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const packed = ref<number[]>([])
const wobble = ref<number | null>(null)
const crossAt = ref<number | null>(null)
const misses = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const thingOf = (id: string) => props.game.things.find((x) => x.id === id)
const colourOf = (id: string) => COLOURS[Math.max(0, props.game.things.findIndex((x) => x.id === id)) % COLOURS.length]
const roundGoal = computed(() => current.value.items.filter((i) => i.allowed).length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function tick() {
  if (finished.value || between.value) return
  idle.value += TICK
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function pick(i: number) {
  if (between.value || finished.value || packed.value.includes(i)) return
  const item = current.value.items[i]
  if (!item) return
  idle.value = 0
  if (bundleStep(item.allowed) === 'wrong') {
    misses.value++
    play('wrong')
    say(t('app.adventure.bundleWrong'))
    wobble.value = i
    crossAt.value = i
    later(() => {
      if (wobble.value === i) wobble.value = null
      if (crossAt.value === i) crossAt.value = null
    }, 900)
    return
  }
  packed.value = [...packed.value, i]
  progress.mark()
  play('sack')
  message.value = ''
  if (!bundleDone(packed.value, current.value.items)) return
  between.value = true
  later(() => {
    say(t('app.adventure.bundleRound'), 0)
    play('right')
  }, 600)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => {
    round.value++
    packed.value = []
    between.value = false
    message.value = ''
  }, 2200)
}

function helpMe() {
  const i = bundleHelpTarget(packed.value, current.value.items)
  if (i >= 0) pick(i)
}

/** Where a thing lies: on the cloth, or (when packed) at the bundle. */
function placeOf(i: number) {
  const item = current.value.items[i]!
  const at = packed.value.includes(i) ? props.game.bundle : item
  return { left: `${at.x}%`, top: `${at.y}%` }
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.bundleField')"
      )
        div(
          class="gm-disciple"
          :style="{ left: `${game.disciple.x}%`, top: `${game.disciple.y}%`, width: `${game.disciple.w}%` }"
          role="img"
          :aria-label="game.disciple.label"
        )
          GameImage(:src="game.disciple.image" :ratio="0.6" colour="#7b6a9a" :label="game.disciple.label")
        div(
          class="gm-bundle"
          :style="{ left: `${game.bundle.x}%`, top: `${game.bundle.y}%`, width: `${game.bundle.w}%` }"
          role="img"
          :aria-label="t('app.adventure.bundleBundle', { n: packed.length })"
        )
          GameImage(:src="game.bundle.image" :ratio="1" colour="#d8c28a" :label="game.bundle.label")
          span(class="gm-badge" aria-hidden="true") {{ packed.length }} / {{ roundGoal }}
        button(
          v-for="(item, i) in current.items"
          :key="`${round}-${i}`"
          type="button"
          class="gm-thing"
          :class="{ wobble: wobble === i, packed: packed.includes(i) }"
          :style="{ ...placeOf(i), width: `${thingOf(item.thing)?.w ?? 16}%` }"
          :aria-label="thingOf(item.thing)?.label ?? item.thing"
          :disabled="between || packed.includes(i)"
          @click="pick(i)"
        )
          GameImage(:src="thingOf(item.thing)?.image ?? ''" :ratio="1" :colour="colourOf(item.thing)" :label="item.thing")
          span(class="gm-name" aria-hidden="true") {{ thingOf(item.thing)?.label }}
          span(v-if="crossAt === i" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.bundleCount', { n: doneCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.bundleHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.bundleDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #a98558
  background-size: cover
  background-position: center

.gm-disciple
  position: absolute
  display: block
  min-width: 44px
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-bundle
  position: absolute
  display: block
  min-width: 56px
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.45))

.gm-badge
  position: absolute
  right: -6px
  top: -8px
  padding: 0 7px
  border-radius: 999px
  border: 2px solid #fff
  background: #5f4f35
  color: #fff6dc
  font-weight: 900
  font-size: 0.8rem
  line-height: 1.4

// a thing on the cloth: at least 44 pixels, with its name under it
.gm-thing
  position: absolute
  display: block
  min-width: 56px
  min-height: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 3
  transition: left 560ms ease-in, top 560ms ease-in, opacity 560ms ease-in, scale 560ms ease-in
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &.wobble
    animation: gm-wobble 500ms ease-in-out

  &.packed
    opacity: 0
    scale: 0.4
    pointer-events: none

.gm-name
  display: block
  margin: 2px auto 0
  width: max-content
  max-width: 130%
  padding: 0 6px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.92)
  color: #3f321b
  font-weight: 800
  font-size: 0.78rem
  line-height: 1.25

.gm-cross
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

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

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  20%
    rotate: -8deg
  40%
    rotate: 8deg
  60%
    rotate: -5deg
  80%
    rotate: 5deg

@media (prefers-reduced-motion: reduce)
  .gm-thing
    transition: none

  .gm-thing.wobble
    animation: none
</style>
