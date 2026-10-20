<script setup lang="ts">
/**
 * Bake flatbreads: at the camp fire in Gilgal flat stones lie hot in the embers, and balls of dough wait. The child drags a ball onto a free stone (or taps the ball and then the stone): it
 * becomes a pale raw flatbread. After a few seconds it is golden (a tick shows it, and the text under it says "ready"): a tap turns it and puts it on the stack. A tap on a raw one only
 * says "not yet". If it lies too long it gets too dark (a cross, a dull sound, a mistake); a tap clears the stone, and the dough is given back, so the number of flatbreads to turn always
 * comes true. Round 1: six flatbreads on three stones, round 2: nine on five stones, a little quicker. Putting the dough on a stone has no clock. The state is `bakeState` in
 * `utils/josuaGames.ts`; the state always stands as a word under the flatbread, too, not only as a colour.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { bakeState, type BakeState } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BakeGame } from '@/types/adventure'

const props = defineProps<{ game: BakeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every flatbread of every round that is turned
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.dough, 0))

interface Pan {
  /** when the dough was put on the stone (ms) */
  since: number
  /** it has been too dark already (counted once) */
  burnt: boolean
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const stones = computed(() => props.game.stonesAt.slice(0, current.value.stones))
/** What lies on each stone (`null` = free). */
const pans = reactive<(Pan | null)[]>([])
const resetPans = () => pans.splice(0, pans.length, ...Array.from({ length: current.value.stones }, () => null))
resetPans()
const turned = ref(0)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<number | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 1, 4))

const now = ref(Date.now())
const timer = window.setInterval(() => {
  now.value = Date.now()
  pans.forEach((p, i) => {
    if (p && !p.burnt && !between.value && !finished.value && stateOf(i) === 'dunkel') burn(i)
  })
}, 100)
onBeforeUnmount(() => window.clearInterval(timer))

const ageOf = (i: number) => (pans[i] ? (now.value - pans[i]!.since) / 1000 : 0)
function stateOf(i: number): BakeState {
  return bakeState(ageOf(i), current.value.goldenFrom, current.value.goldenTo)
}
/** The dough that is left to put on a stone: what has to be turned, less what is turned and what lies on a stone and is not burnt. */
const doughLeft = computed(() => current.value.dough - turned.value - pans.filter((p) => p && !p.burnt).length)

function burn(i: number) {
  const p = pans[i]
  if (!p || p.burnt) return
  p.burnt = true
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.bakeDark')
  flash.value = i
  later(() => {
    if (flash.value === i) flash.value = null
  }, 900)
}

function putDough(index: number) {
  if (between.value || finished.value || index < 0 || index >= pans.length) return
  if (pans[index]) {
    message.value = t('app.adventure.bakeTaken')
    return
  }
  if (doughLeft.value <= 0) return
  pans[index] = { since: Date.now(), burnt: false }
  now.value = Date.now()
  message.value = ''
  play('tap')
}

/** A tap on a flatbread: golden is turned, raw has to wait, dark is cleared away. */
function touch(i: number) {
  if (between.value || finished.value || !pans[i]) return
  const st = stateOf(i)
  if (st === 'roh') {
    message.value = t('app.adventure.bakeRaw')
    return
  }
  if (st === 'golden') {
    pans[i] = null
    turned.value++
    progress.mark()
    play('snap')
    message.value = ''
    if (turned.value >= current.value.dough) roundOver()
    return
  }
  pans[i] = null
  message.value = ''
  play('tap')
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    turned.value = 0
    resetPans()
    between.value = false
    message.value = ''
  }, 1800)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((_id, target) => putDough(Number(target.replace('stone-', ''))))
/** A tap on a stone: with dough in the hand it puts the dough there; else a flatbread on it is touched. */
function stoneTap(i: number) {
  if (pans[i] && selected.value === null) touch(i)
  else tapPlace(`stone-${i}`)
}
const labelOf = (i: number) => t(`app.adventure.bake${stateOf(i) === 'roh' ? 'StateRaw' : stateOf(i) === 'golden' ? 'StateGolden' : 'StateDark'}`)
const imageOf = (i: number) => (stateOf(i) === 'roh' ? props.game.raw : stateOf(i) === 'golden' ? props.game.golden : props.game.dark)
const colourOf = (i: number) => (stateOf(i) === 'roh' ? '#efe2c0' : stateOf(i) === 'golden' ? '#d9a441' : '#5b3a22')
const tray = computed(() => Array.from({ length: Math.max(0, doughLeft.value) }, (_, k) => `dough-${k}`))
const at = (p: [number, number]) => ({ left: `${p[0]}%`, top: `${p[1]}%` })
</script>

<template lang="pug">
  div(class="bk")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="bk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="bk-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="bk-field" role="group" :aria-label="t('app.adventure.bakeField', { n: turned, total: current.dough })" :style="{ backgroundImage: `url(${src(game.background)})` }")
        template(v-if="!between")
          div(
            v-for="(s, i) in stones"
            :key="`${round}-s-${i}`"
            class="bk-stone"
            :class="{ ready: selected !== null && !pans[i] }"
            :style="at(s)"
            :data-drop="`stone-${i}`"
            role="button"
            tabindex="0"
            :aria-label="pans[i] ? `${t('app.adventure.bakeStone', { n: i + 1 })}: ${labelOf(i)}` : t('app.adventure.bakeStone', { n: i + 1 })"
            @click="stoneTap(i)"
            @keydown.enter.space.prevent="stoneTap(i)"
          )
            span(v-if="pans[i]" class="bk-bread" :class="stateOf(i)")
              GameImage(:src="imageOf(i)" :colour="colourOf(i)" round)
              span(class="bk-word") {{ labelOf(i) }}
              GameMark(v-if="stateOf(i) === 'golden'" kind="good" class="bk-mark")
              GameMark(v-else-if="stateOf(i) === 'dunkel'" kind="bad" class="bk-mark")
        span(class="bk-stack" :style="at(game.stackAt)" aria-hidden="true")
          GameImage(:src="game.stack" :ratio="260 / 200" colour="#b88f55")
          span(class="bk-stack-n") {{ turned }}
      p(class="bk-fb" role="status") {{ message }}
      div(class="bk-tray" role="group" :aria-label="t('app.adventure.bakeTray')")
        div(
          v-for="id in tray"
          :key="`${round}-${id}`"
          class="bk-dough"
          :class="{ chosen: selected === id, lifted: dragging === id }"
          :style="dragStyle(id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.bakeDough')"
          @pointerdown="down($event, id)"
          @keydown.enter.space.prevent="toggleSelect(id)"
        )
          GameImage(:src="game.dough" colour="#f3e6c4" round)
      p(class="bk-count") {{ t('app.adventure.bakeCount', { n: turned, total: current.dough }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.bakeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.bk
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.bk-round
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

.bk-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.bk-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a6a48
  background-size: cover
  background-position: center

// a hot stone: round, the flatbread lies on it
.bk-stone
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  width: 17%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  cursor: pointer

  &.ready
    box-shadow: 0 0 0 4px rgba(255, 214, 90, 0.95)

.bk-bread
  position: relative
  display: block
  width: 100%

  &.dunkel
    filter: grayscale(0.2)

.bk-word
  position: absolute
  left: 50%
  bottom: -26px
  transform: translateX(-50%)
  padding: 0 8px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  white-space: nowrap
  color: #3f321b

.bk-mark
  position: absolute
  top: -8px
  right: -8px

.bk-stack
  position: absolute
  display: block
  width: 17%
  transform: translate(-50%, -50%)
  pointer-events: none

.bk-stack-n
  position: absolute
  left: 50%
  top: -10px
  transform: translateX(-50%)
  min-width: 30px
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  border: 2px solid #d4a83e
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.bk-fb
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

.bk-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 66px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.bk-dough
  width: 52px
  padding: 3px
  border-radius: 50%
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

.bk-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
