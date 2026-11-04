<script setup lang="ts">
/**
 * Half to the poor (Luke 19,8). On the cloth of a stone table in the yard lies a row of equal silver coins. A wooden divider lies across the row: it is dragged with the finger (or moved coin by coin with
 * the two arrow buttons, or the arrow keys) and snaps between two coins. Left of it lies the part of Zacchaeus (his bowl), right of it the part of the poor (their bowl, and beside it a woman with a child and
 * an old man); the coins on the side of the poor are tinted golden. "Done" checks: exactly the middle is right, the coins roll into the two bowls and the poor are glad (a tick); otherwise the coins jingle and a
 * word with an arrow says where the divider must go (with the numbers of both sides); a mistake without loss (the same place twice counts once). "Help" shows the middle for a moment (then at most two stars).
 * Round 1 has ten coins, round 2 fourteen (some lie a little out of line). Nothing is shown by colour alone (arrows, tick, cross, numbers, names under the bowls).
 * Stars: `halveStars(mistakes, rounds, helped)` in `utils/zachaeusGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { halveCoinX, halveDividerX, halveJudge, halveSnap, halveStars, halveStep } from '@/utils/zachaeusGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HalveGame } from '@/types/adventure'

const props = defineProps<{ game: HalveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one part for every round that is solved
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const n = computed(() => current.value.coins)
/** How many coins lie left of the divider (the part of Zacchaeus). */
const k = ref(props.game.rounds[0]?.start ?? 1)
const rolled = ref(false)
const jingle = ref(0)
/** The places of the divider that were checked wrongly in this round (each counts once). */
const wrongAt = ref<number[]>([])
const arrow = ref<'toRight' | 'toLeft' | null>(null)
const mistakes = ref(0)
const helped = ref(false)
const helping = ref(false)
const solved = ref(0)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => halveStars(mistakes.value, props.game.rounds.length, helped.value))
const locked = computed(() => rolled.value || finished.value)
const field = ref<HTMLElement | null>(null)

const coinStyle = (i: number) => {
  const g = props.game
  if (rolled.value) {
    const bowl = i < k.value ? g.bowlSelf : g.bowlPoor
    // the coins lie in the bowl a little apart
    const spread = ((i % 5) - 2) * (bowl.w / 9)
    return { left: `${bowl.x + spread}%`, top: `${bowl.y - bowl.w * 0.35}%`, width: `${g.coin.w}%` }
  }
  return { left: `${halveCoinX(i, n.value, g.row)}%`, top: `${g.row.y + (current.value.offsets?.[i] ?? 0)}%`, width: `${g.coin.w}%` }
}
const dividerStyle = computed(() => ({ left: `${halveDividerX(k.value, n.value, props.game.row)}%`, top: `${props.game.row.y}%`, width: `${props.game.divider.w}%` }))
const middleStyle = computed(() => ({ left: `${halveDividerX(n.value / 2, n.value, props.game.row)}%`, top: `${props.game.row.y}%` }))
const spotStyle = (s: { x: number; y: number; w: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` })
const sideText = computed(() => t('app.adventure.halveSides', { left: k.value, right: n.value - k.value }))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function moveTo(next: number) {
  if (locked.value || next === k.value) return
  k.value = next
  arrow.value = null
  play('tap')
}
const step = (by: number) => moveTo(halveStep(k.value, by, n.value))

// ---- dragging the divider: the finger's place along the row decides the gap
let dragging = false
function onMove(e: PointerEvent) {
  if (!dragging || !field.value) return
  const box = field.value.getBoundingClientRect()
  if (box.width <= 0) return
  moveTo(halveSnap(((e.clientX - box.left) / box.width) * 100, n.value, props.game.row))
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent) {
  if (locked.value || e.button > 0) return
  e.preventDefault()
  dragging = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    step(1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    check()
  }
}

/** "Done": the middle or a word where to go. */
function check() {
  if (locked.value) return
  const verdict = halveJudge(k.value, n.value)
  if (verdict === 'right') {
    rolled.value = true
    arrow.value = null
    progress.mark()
    play('coin')
    later(() => play('right'), 500)
    say(t('app.adventure.halveDivided', { n: n.value / 2 }), 0)
    solve()
    return
  }
  if (!wrongAt.value.includes(k.value)) {
    wrongAt.value = [...wrongAt.value, k.value]
    mistakes.value++
  }
  arrow.value = verdict
  jingle.value++
  play('wrong')
  say(t(verdict === 'toRight' ? 'app.adventure.halveToRight' : 'app.adventure.halveToLeft', { left: k.value, right: n.value - k.value }), 3600)
}

function help() {
  if (locked.value) return
  helped.value = true
  helping.value = true
  say(t('app.adventure.halveHelpHint'), 3000)
  later(() => (helping.value = false), 3000)
}

function solve() {
  solved.value++
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    k.value = current.value.start
    rolled.value = false
    wrongAt.value = []
    arrow.value = null
    helping.value = false
    message.value = ''
  }, 2800)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.table)})` }"
        role="group"
        :aria-label="t('app.adventure.halveField')"
      )
        div(class="gm-bowl" :style="spotStyle(game.bowlSelf)" role="img" :aria-label="game.bowlSelf.label")
          GameImage(:src="game.bowlSelf.image" :ratio="2" colour="#8a6a3e" :label="game.bowlSelf.label")
          span(class="gm-name") {{ t('app.adventure.halveSelf') }}
        div(class="gm-bowl" :style="spotStyle(game.bowlPoor)" role="img" :aria-label="game.bowlPoor.label")
          GameImage(:src="game.bowlPoor.image" :ratio="2" colour="#8a6a3e" :label="game.bowlPoor.label")
          span(class="gm-name") {{ t('app.adventure.halvePoor') }}
        div(class="gm-poor" :class="{ glad: rolled }" :style="spotStyle(game.poor)" role="img" :aria-label="game.poor.label")
          GameImage(:src="game.poor.image" :ratio="0.8" colour="#b08a5a" :label="game.poor.label")
          span(v-if="rolled" class="gm-sparkle" aria-hidden="true") ✦ ✦
          span(v-if="rolled" class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
        span(
          v-for="i in n"
          :key="`${round}-${i}-${jingle}`"
          class="gm-coin"
          :class="{ poor: i - 1 >= k, rolled, jingle: jingle > 0 && !rolled }"
          :style="coinStyle(i - 1)"
          aria-hidden="true"
        )
          GameImage(:src="game.coin.image" :ratio="1" colour="#c9ccd2" round :label="game.coin.label")
        span(v-if="helping" class="gm-middle" :style="middleStyle" aria-hidden="true") ▼
        button(
          v-if="!rolled"
          type="button"
          class="gm-divider"
          :class="{ wrong: arrow !== null }"
          :style="dividerStyle"
          role="slider"
          :aria-label="game.divider.label"
          :aria-valuemin="1"
          :aria-valuemax="n - 1"
          :aria-valuenow="k"
          :aria-valuetext="sideText"
          @pointerdown="down"
          @keydown="onKey"
        )
          GameImage(:src="game.divider.image" :ratio="0.35" colour="#7a5530" :label="game.divider.label")
          span(v-if="arrow" class="gm-arrow" aria-hidden="true") {{ arrow === 'toRight' ? '→' : '←' }}
      div(class="gm-tools")
        button(type="button" class="gm-step" :aria-label="t('app.adventure.halveStepLeft')" :disabled="locked || k <= 1" @click="step(-1)") ◀
        AdvButton(:disabled="locked" @click="check") {{ t('app.adventure.halveCheck') }}
        button(type="button" class="gm-step" :aria-label="t('app.adventure.halveStepRight')" :disabled="locked || k >= n - 1" @click="step(1)") ▶
      div(class="gm-tools")
        AdvButton(tone="blau" small :disabled="locked" @click="help") {{ t('app.adventure.halveHelp') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.halveCount', { n: solved, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.halveDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
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
  background-color: #b9a77a
  background-size: cover
  background-position: center
  touch-action: none

// the bowls and the poor stand on their lower edge
.gm-bowl, .gm-poor
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-name
  position: absolute
  left: 50%
  bottom: -2px
  transform: translate(-50%, 100%)
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 0.85rem
  white-space: nowrap
  color: #3f321b

.gm-poor.glad
  animation: gm-hop 600ms ease-in-out 2

.gm-coin
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  transition: left 700ms ease-in, top 700ms ease-in, filter 200ms ease
  filter: drop-shadow(0 2px 1px rgba(40, 25, 5, 0.45))

  // the part of the poor is tinted golden (the divider and the names say it, too)
  &.poor
    filter: sepia(0.9) saturate(2.6) hue-rotate(-12deg) brightness(1.05) drop-shadow(0 2px 1px rgba(40, 25, 5, 0.45))

  &.jingle
    animation: gm-jingle 360ms ease-in-out

  &.rolled
    z-index: 3

.gm-divider
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: grab
  z-index: 4
  touch-action: none
  -webkit-tap-highlight-color: transparent
  transition: left 140ms ease
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.5))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 8px

.gm-arrow
  position: absolute
  left: 50%
  top: -6px
  display: flex
  align-items: center
  justify-content: center
  width: 34px
  height: 34px
  transform: translate(-50%, -100%)
  border-radius: 50%
  border: 2px solid #3f321b
  background: rgba(255, 250, 235, 0.96)
  color: #3f321b
  font-weight: 900
  font-size: 1.3rem

.gm-middle
  position: absolute
  transform: translate(-50%, -190%)
  z-index: 5
  font-size: 1.6rem
  color: #fff6dc
  text-shadow: 0 0 6px rgba(40, 25, 5, 0.8)
  animation: gm-blink 700ms ease-in-out infinite

.gm-sparkle
  position: absolute
  left: 50%
  top: -6px
  transform: translateX(-50%)
  color: #f5d76e
  font-weight: 900
  text-shadow: 0 0 4px rgba(40, 25, 5, 0.6)

.gm-mark
  position: absolute
  right: -6px
  top: -10px
  z-index: 6
  pointer-events: none

.gm-tools
  display: flex
  align-items: center
  justify-content: center
  gap: 12px

.gm-step
  min-width: 52px
  min-height: 48px
  border-radius: 999px
  border: 2px solid #d4a83e
  background: #fff6dc
  color: #3f321b
  font-size: 1.2rem
  font-weight: 900
  cursor: pointer

  &:disabled
    opacity: 0.45
    cursor: default

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

@keyframes gm-jingle
  0%, 100%
    rotate: 0deg
  30%
    rotate: -12deg
  65%
    rotate: 10deg

@keyframes gm-hop
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -6%

@keyframes gm-blink
  0%, 100%
    opacity: 0.35
  50%
    opacity: 1

// less motion: nothing jingles, hops or glides
@media (prefers-reduced-motion: reduce)
  .gm-coin.jingle, .gm-poor.glad, .gm-middle
    animation: none

  .gm-coin, .gm-divider
    transition: none
</style>
