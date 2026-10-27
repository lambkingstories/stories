<script setup lang="ts">
/**
 * Protect the flock: David stands in the pasture with his staff and three lambs graze around him. From the left or the right edge a lion or a bear walks slowly toward one of the lambs (the animals are painted calm and curious,
 * nothing is fought). The child moves David (a drag, or a tap on the place) to the lamb that is in danger. When David stands near it, the beast stops, hesitates and trots back to the edge (a part done). If the beast reaches
 * the lamb before David is there, the lamb runs frightened to David and comes back later (one mistake), and the beast goes away too. Round 1 sends a lion, then a bear; round 2 sends two beasts almost together from the two sides.
 * The arithmetic is in `utils/davidGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { guards, RETREAT_MS, threatPos, threatProgress } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ShepherdGame } from '@/types/adventure'

const props = defineProps<{ game: ShepherdGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every beast that comes
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.threats.length, 0))

const TICK = 50
/** The time before the first beast may start: the child first sees the pasture (ms). */
const LEAD_IN = 1500
/** How far in front of the lamb a beast stops (percent of the picture width). */
const STOP_BEFORE = 17
/** How long a frightened lamb stays near David (ms). */
const FRIGHT_MS = 1700

type Mode = 'wait' | 'approach' | 'retreat' | 'done'
interface Beast {
  mode: Mode
  from: { x: number; y: number }
  retreatAt: number
  retreatFrom: { x: number; y: number }
}

const round = ref(0)
const elapsed = ref(0)
const david = ref({ x: props.game.davidStart.x, y: props.game.davidStart.y })
const dragging = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const crossAt = ref<{ x: number; y: number } | null>(null)
const frightened = reactive<Record<number, boolean>>({})
const fieldEl = ref<HTMLElement | null>(null)
const beasts = ref<Beast[]>([])
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 4))
const davidStyle = computed(() => ({ left: `${david.value.x}%`, top: `${david.value.y}%`, width: `${props.game.davidW}%` }))

function startRound() {
  elapsed.value = 0
  beasts.value = current.value.threats.map((th) => ({ mode: 'wait' as Mode, from: { ...props.game.edge[th.from] }, retreatAt: 0, retreatFrom: { x: 0, y: 0 } }))
  for (const k of Object.keys(frightened)) frightened[Number(k)] = false
}
startRound()

const timer = window.setInterval(tick, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

/** Where the beast `k` stands right now (percent of the picture), null while it is not in the picture. */
function beastPos(k: number): { x: number; y: number } | null {
  const b = beasts.value[k]
  const th = current.value.threats[k]
  if (!b || !th || b.mode === 'wait' || b.mode === 'done') return null
  const lamb = props.game.lambPos[th.lamb]!
  const stop = { x: lamb.x + (th.from === 'left' ? -STOP_BEFORE : STOP_BEFORE), y: lamb.y }
  if (b.mode === 'approach') return threatPos(b.from, stop, threatProgress(elapsed.value, LEAD_IN + th.delay, th.dur))
  const back = Math.max(0, Math.min(1, (elapsed.value - b.retreatAt) / RETREAT_MS))
  return threatPos(b.retreatFrom, props.game.edge[th.from], back)
}
function beastStyle(k: number) {
  const th = current.value.threats[k]!
  const p = beastPos(k)
  if (!p) return { display: 'none' }
  const b = beasts.value[k]!
  // the pictures look to the left: a beast that comes from the left walks to the right (mirrored), and turns round when it goes back
  const towardsRight = th.from === 'left' ? b.mode === 'approach' : b.mode === 'retreat'
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.animalW[th.animal]}%`, transform: `translate(-50%, -100%) scaleX(${towardsRight ? -1 : 1})` }
}
function lambStyle(i: number) {
  const base = props.game.lambPos[i]!
  const near = frightened[i] ? { x: david.value.x + (i % 2 === 0 ? -6 : 6), y: david.value.y } : base
  return { left: `${near.x}%`, top: `${near.y}%`, width: `${props.game.lambW}%` }
}

function tick() {
  if (between.value || finished.value) return
  elapsed.value += TICK
  current.value.threats.forEach((th, k) => {
    const b = beasts.value[k]
    if (!b) return
    if (b.mode === 'wait' && elapsed.value >= LEAD_IN + th.delay) b.mode = 'approach'
    if (b.mode === 'approach') {
      const p = threatProgress(elapsed.value, LEAD_IN + th.delay, th.dur)
      const lamb = props.game.lambPos[th.lamb]!
      if (p >= 0.3 && guards(david.value, lamb, props.game.guard)) {
        turnBack(k, true)
      } else if (p >= 1) {
        turnBack(k, false)
      }
    }
    if (b.mode === 'retreat' && elapsed.value - b.retreatAt >= RETREAT_MS) {
      b.mode = 'done'
      progress.mark()
      checkRound()
    }
  })
}

/** The beast `k` turns back: stopped by David (`safe`) or after it reached the lamb. */
function turnBack(k: number, safe: boolean) {
  const b = beasts.value[k]!
  const p = beastPos(k)!
  b.retreatFrom = p
  b.retreatAt = elapsed.value
  b.mode = 'retreat'
  const th = current.value.threats[k]!
  if (safe) {
    play('tap')
    message.value = t('app.adventure.shepherdSafe')
    return
  }
  misses.value++
  play('wrong')
  message.value = t('app.adventure.shepherdRun')
  crossAt.value = { x: props.game.lambPos[th.lamb]!.x, y: props.game.lambPos[th.lamb]!.y - 14 }
  frightened[th.lamb] = true
  later(() => {
    frightened[th.lamb] = false
    crossAt.value = null
  }, FRIGHT_MS)
}

function checkRound() {
  if (!beasts.value.every((b) => b.mode === 'done')) return
  between.value = true
  play('star')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    between.value = false
    message.value = ''
    startRound()
  }, 1500)
}

function toPercent(e: PointerEvent): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return {
    x: Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)),
    y: Math.max(40, Math.min(97, ((e.clientY - r.top) / r.height) * 100))
  }
}
function down(e: PointerEvent) {
  if (between.value || finished.value) return
  dragging.value = true
  const p = toPercent(e)
  if (p) david.value = p
}
function move(e: PointerEvent) {
  if (!dragging.value) return
  const p = toPercent(e)
  if (p) david.value = p
}
function up() {
  dragging.value = false
}
function keydown(e: KeyboardEvent) {
  const dx = e.key === 'ArrowLeft' ? -3 : e.key === 'ArrowRight' ? 3 : 0
  const dy = e.key === 'ArrowUp' ? -3 : e.key === 'ArrowDown' ? 3 : 0
  if (!dx && !dy) return
  e.preventDefault()
  david.value = { x: Math.max(4, Math.min(96, david.value.x + dx)), y: Math.max(40, Math.min(97, david.value.y + dy)) }
}
</script>

<template lang="pug">
  div(class="gp")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gp-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gp-hint") {{ current.hint }}
      div(
        ref="fieldEl"
        class="gp-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @pointerdown.prevent="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @contextmenu.prevent
      )
        //- the lambs (a frightened one runs to David)
        span(
          v-for="(l, i) in game.lambPos"
          :key="`lamb-${i}`"
          class="gp-lamb"
          :class="{ scared: frightened[i] }"
          :style="lambStyle(i)"
          role="img"
          :aria-label="t('app.adventure.shepherdLamb', { n: i + 1 })"
        )
          GameImage(:src="game.lambs[i % game.lambs.length]" colour="#f2efe6")
        //- the beasts
        span(
          v-for="(th, k) in current.threats"
          :key="`beast-${round}-${k}`"
          class="gp-beast"
          :style="beastStyle(k)"
          role="img"
          :aria-label="t(th.animal === 0 ? 'app.adventure.shepherdLion' : 'app.adventure.shepherdBear')"
        )
          GameImage(:src="game.animals[th.animal]" colour="#b07a3a")
        span(v-if="crossAt" class="gp-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
        //- David: drag him to the lamb in danger
        button(
          type="button"
          class="gp-david"
          :class="{ drag: dragging }"
          :style="davidStyle"
          :aria-label="t('app.adventure.shepherdDavid')"
          @keydown="keydown"
        )
          GameImage(:src="game.david" colour="#8a6a3a")
      p(class="gp-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shepherdDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gp
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

.gp-round
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

.gp-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gp-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center
  cursor: pointer
  touch-action: none

// every figure stands with the middle of its foot at left/top
.gp-lamb
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: left 700ms ease, top 700ms ease
  z-index: 3

.gp-beast
  position: absolute
  display: block
  pointer-events: none
  z-index: 4

.gp-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gp-david
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  transform: translate(-50%, -100%)
  transition: left 250ms ease, top 250ms ease
  -webkit-tap-highlight-color: transparent
  z-index: 5

  &.drag
    cursor: grabbing
    transition: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.gp-fb
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
  .gp-lamb, .gp-david
    transition: none
</style>
