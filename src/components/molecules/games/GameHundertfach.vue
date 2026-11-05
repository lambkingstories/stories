<script setup lang="ts">
/**
 * "A hundredfold" (Matthew 13,8.23). The plowed field by the lake; on it stand ears of grain on the good land (small, middle, big: thirty, sixty, a hundred grains)
 * and the seed that brought nothing: a withered sprout on the rock, a stalk choked in the thorns, the bird on the path. A tap on an ear of the good land turns it into its grains:
 * the number stands over it and the grains fly into the sack. A tap on the rock, the thorns or the path is a mistake (a cross and the word of the story why it brought nothing).
 * Round 2 asks for the order of the Bible: first the hundredfold, then the sixtyfold, then the thirtyfold (another ear is a mistake, "First the ears with a hundred grains").
 * The plants are buttons (Tab, the arrow keys go to the nearest plant, Enter or Space takes it). The button "Help me" comes after fifteen seconds and shows the next ear.
 * With reduced motion the grains do not fly. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/gleichnisseNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { YIELD_GRAINS, neuNeighbour, yieldDone, yieldGoodPlants, yieldHint, yieldTap } from '@/utils/gleichnisseNeu'
import type { NeuDir, YieldGame, YieldKind, YieldPlant } from '@/utils/gleichnisseNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: YieldGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + yieldGoodPlants(r).length, 0))

const IDLE_SECONDS = 15
const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const harvested = ref<boolean[]>(current.value.plants.map(() => false))
/** the plants that were already counted as a mistake in this round (a wrong place counts once) */
const counted = new Set<number>()
const mistakes = ref(0)
const grains = ref(0)
const marks = ref<Record<number, 'good' | 'bad'>>({})
const flying = ref<number[]>([])
const hinted = ref(-1)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const focusIndex = ref(0)
const plantEls = ref<HTMLElement[]>([])
const setPlantEl = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) plantEls.value[i] = el
}
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))
const goodCount = computed(() => yieldGoodPlants(current.value).length)
const takenCount = computed(() => yieldGoodPlants(current.value).filter((i) => harvested.value[i]).length)

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// the clock of "Help me" (only while the round goes on)
function tickIdle() {
  if (!finished.value && !between.value) idle.value++
  later(tickIdle, 1000)
}
later(tickIdle, 1000)

const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const WHY: Record<string, string> = { rock: 'app.adventure.yieldGameRock', thorn: 'app.adventure.yieldGameThorn', path: 'app.adventure.yieldGamePath' }

function tap(i: number) {
  if (finished.value || between.value) return
  idle.value = 0
  focusIndex.value = i
  const verdict = yieldTap(current.value, harvested.value, i)
  if (verdict.kind === 'already') return
  if (verdict.kind === 'bad' || verdict.kind === 'order') {
    if (!counted.has(i)) {
      counted.add(i)
      mistakes.value++
    }
    play('wrong')
    marks.value = { ...marks.value, [i]: 'bad' }
    later(() => {
      if (marks.value[i] === 'bad') {
        const m = { ...marks.value }
        delete m[i]
        marks.value = m
      }
    }, 1600)
    say(verdict.kind === 'bad' ? t(WHY[verdict.why]!) : t('app.adventure.yieldGameOrder', { n: YIELD_GRAINS[verdict.want] }))
    return
  }
  // an ear of the good land: it turns into its grains
  const next = harvested.value.slice()
  next[i] = true
  harvested.value = next
  hinted.value = -1
  marks.value = { ...marks.value, [i]: 'good' }
  progress.mark()
  play('right')
  say(t('app.adventure.yieldGameGrains', { n: verdict.grains }), 2000)
  flying.value = [...flying.value, i]
  later(
    () => {
      flying.value = flying.value.filter((k) => k !== i)
      grains.value += verdict.grains
      play('sack')
    },
    reduced ? 0 : 700
  )
  if (yieldDone(current.value, next)) later(roundDone, reduced ? 300 : 1000)
}

function roundDone() {
  between.value = true
  play('bead')
  say(t('app.adventure.yieldGameRoundDone', { n: grains.value }), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    harvested.value = current.value.plants.map(() => false)
    counted.clear()
    marks.value = {}
    flying.value = []
    hinted.value = -1
    idle.value = 0
    focusIndex.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function helpMe() {
  idle.value = 0
  const i = yieldHint(current.value, harvested.value)
  if (i === null) return
  hinted.value = i
  focusIndex.value = i
  void nextTick(() => plantEls.value[i]?.focus({ preventScroll: true }))
  say(t('app.adventure.yieldGameHelped'), 3200)
}

function onKey(e: KeyboardEvent, i: number) {
  const dirs: Record<string, NeuDir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = dirs[e.key]
  if (d === undefined) return
  e.preventDefault()
  const k = neuNeighbour(current.value.plants, i, d, ratio.value)
  if (k === null) return
  focusIndex.value = k
  plantEls.value[k]?.focus({ preventScroll: true })
}

// ---- looks
const spriteOf = (p: YieldPlant) => props.game.sprites[p.kind]
const z = (y: number) => Math.round(y * 10) + 10
const plantStyle = (p: YieldPlant) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${spriteOf(p).w}%`, zIndex: z(p.y) })
const sackStyle = computed(() => ({ left: `${props.game.sack.x}%`, top: `${props.game.sack.y}%`, width: `${props.game.sack.w}%`, zIndex: z(props.game.sack.y) }))
/** a flying heap starts at the ear and lands in the sack (CSS moves it) */
const grainStyle = (p: YieldPlant, i: number) => {
  const at = flying.value.includes(i) && flown.value.includes(i) ? { x: props.game.sack.x, y: props.game.sack.y - props.game.sack.w * ratio.value * 0.6 } : { x: p.x, y: p.y - spriteOf(p).w * ratio.value * 0.5 }
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.grain.w}%` }
}
const flown = ref<number[]>([])
// a moment after a heap appears it is sent to the sack (so that the move is seen)
function launch() {
  const fresh = flying.value.filter((i) => !flown.value.includes(i))
  if (fresh.length) flown.value = [...flown.value.filter((i) => flying.value.includes(i)), ...fresh]
  later(launch, 60)
}
later(launch, 60)
const label = (p: YieldPlant, i: number) => {
  const s = spriteOf(p).label
  if (harvested.value[i]) return t('app.adventure.yieldGameTaken', { thing: s, n: YIELD_GRAINS[p.kind] })
  return s
}
const colour: Record<YieldKind, string> = { y30: '#c9a54a', y60: '#c29a3a', y100: '#b88d2c', rock: '#9b9184', thorn: '#5d6b3a', path: '#c8b48a' }
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.field)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.yieldGameField')"
      )
        div(class="gm-sack" :style="sackStyle" role="img" :aria-label="game.sack.label")
          GameImage(:src="game.sack.image" :ratio="1" colour="#b39b6b" :label="game.sack.label")
        template(v-for="(p, i) in current.plants" :key="`p-${round}-${i}`")
          button(
            :ref="(el) => setPlantEl(el, i)"
            type="button"
            class="gm-plant"
            :class="{ taken: harvested[i], hinted: hinted === i }"
            :style="plantStyle(p)"
            :tabindex="focusIndex === i ? 0 : -1"
            :aria-label="label(p, i)"
            :aria-disabled="harvested[i] || between ? 'true' : undefined"
            @click="tap(i)"
            @keydown="onKey($event, i)"
          )
            GameImage(:src="spriteOf(p).image" :ratio="1" :colour="colour[p.kind]" :label="spriteOf(p).label")
            span(v-if="harvested[i]" class="gm-num" aria-hidden="true") {{ YIELD_GRAINS[p.kind] }}
            span(v-if="marks[i]" class="gm-mark")
              GameMark(:kind="marks[i]")
          div(v-if="flying.includes(i)" class="gm-grain" :style="grainStyle(p, i)" aria-hidden="true")
            GameImage(:src="game.grain.image" :ratio="1" colour="#d9b24a" :label="game.grain.label")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.yieldGameCount', { n: grains, taken: takenCount, total: goodCount }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.yieldGameHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.yieldGameDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
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
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6b3e22
  background-size: cover
  background-position: center

// a plant stands on its foot (the point of the data is the middle of its foot)
.gm-plant
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: none
  background: none
  transform: translate(-50%, -100%)
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  &.taken
    opacity: 0.45
    cursor: default

  &.hinted
    animation: gm-nod 900ms ease-in-out infinite

.gm-sack
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))

.gm-num
  position: absolute
  left: 50%
  top: 8%
  transform: translateX(-50%)
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-weight: 900
  font-size: 1.05rem
  line-height: 1.4
  color: #4a3a18

.gm-grain
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2000
  transition: left 600ms ease-in, top 600ms ease-in

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-nod
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -6%

// less motion: nothing nods, the grains do not fly
@media (prefers-reduced-motion: reduce)
  .gm-plant.hinted
    animation: none
    outline: 3px dashed #fff6dc
    outline-offset: 2px

  .gm-grain
    transition: none
</style>
