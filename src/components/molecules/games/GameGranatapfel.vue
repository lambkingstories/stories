<script setup lang="ts">
/**
 * "Pomegranates" (1 Kings 7,17-20). Hiram makes two pillars of bronze; on the capitals there is lily work, a network of chains and two rows of pomegranates round about, two hundred on each capital.
 * At the capital hangs a chain: the first things show a pattern (pomegranate, lily, chain link …), the rest of the hooks are empty. A tap on an empty hook hangs a thing there, a second tap changes it
 * to the next kind, and so on (Enter or Space on a hook does the same; the arrow keys go from hook to hook). When every hook is full, the button "Check" looks at the chain: the right things stay
 * (a tick), the wrong ones come off again (a cross), and a check with a wrong thing is a mistake. Round 2 has two chains and three kinds. The button "Help me" comes after fifteen seconds and hangs one
 * right thing. The arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
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
import { pomCheck, pomCycle, pomKinds, pomOpen, pomPattern, pomX } from '@/utils/salomoNeu'
import type { PomGame, PomKind, PomRound } from '@/utils/salomoNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PomGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + pomOpen(r).length, 0))

const IDLE_SECONDS = 15

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const startHung = (r: PomRound) => r.rows.map((row) => pomPattern(row).map((k, i) => (row.given.includes(i) ? k : null)))
const startLocked = (r: PomRound) => r.rows.map((row) => Array.from({ length: row.length }, (_, i) => row.given.includes(i)))
const hung = ref<(PomKind | null)[][]>(startHung(current.value))
const locked = ref<boolean[][]>(startLocked(current.value))
const marks = ref<Record<string, 'good' | 'bad'>>({})
const checking = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function tickIdle() {
  if (!finished.value && !between.value) idle.value += 0.25
  later(tickIdle, 250)
}
later(tickIdle, 250)

const allFull = computed(() => hung.value.every((row) => row.every((k) => k !== null)))
const kindName = (k: PomKind) => props.game.items[k].label

function tapHook(ri: number, i: number) {
  if (between.value || checking.value || locked.value[ri]?.[i]) return
  idle.value = 0
  const next = pomCycle(current.value, hung.value[ri]![i] ?? null)
  hung.value = hung.value.map((row, r) => (r === ri ? row.map((k, j) => (j === i ? next : k)) : row))
  play('tap')
}

function check() {
  if (between.value || checking.value || !allFull.value) return
  idle.value = 0
  const res = pomCheck(current.value, hung.value)
  const m: Record<string, 'good' | 'bad'> = {}
  let wrong = 0
  res.forEach((row, ri) =>
    row.forEach((ok, i) => {
      if (locked.value[ri]![i]) return
      m[`${ri}:${i}`] = ok ? 'good' : 'bad'
      if (ok) progress.mark()
      else wrong++
    })
  )
  marks.value = m
  locked.value = locked.value.map((row, ri) => row.map((l, i) => l || res[ri]![i]!))
  if (wrong === 0) {
    play('right')
    say(t('app.adventure.pomegranatesRight'), 0)
    roundDone()
    return
  }
  mistakes.value++
  play('wrong')
  say(t('app.adventure.pomegranatesWrong', { n: wrong }), 3200)
  checking.value = true
  later(() => {
    hung.value = hung.value.map((row, ri) => row.map((k, i) => (locked.value[ri]![i] ? k : null)))
    marks.value = {}
    checking.value = false
  }, 1400)
}

function roundDone() {
  between.value = true
  later(() => play('bead'), 160)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    hung.value = startHung(current.value)
    locked.value = startLocked(current.value)
    marks.value = {}
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function helpMe() {
  idle.value = 0
  for (let ri = 0; ri < current.value.rows.length; ri++) {
    const row = current.value.rows[ri]!
    const want = pomPattern(row)
    const i = want.findIndex((_, j) => !locked.value[ri]![j])
    if (i < 0) continue
    hung.value = hung.value.map((r, k) => (k === ri ? r.map((x, j) => (j === i ? want[i]! : x)) : r))
    locked.value = locked.value.map((r, k) => (k === ri ? r.map((x, j) => x || j === i) : r))
    marks.value = { [`${ri}:${i}`]: 'good' }
    progress.mark()
    say(t('app.adventure.pomegranatesHelping', { thing: kindName(want[i]!) }), 3600)
    if (locked.value.every((r) => r.every(Boolean))) {
      say(t('app.adventure.pomegranatesRight'), 0)
      roundDone()
    }
    return
  }
}

/** The arrow keys go from hook to hook (left and right along a chain, up and down between the chains). */
async function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null
  const ri = Number(el?.dataset.row)
  const i = Number(el?.dataset.hook)
  if (!Number.isFinite(ri) || !Number.isFinite(i)) return
  const rows = current.value.rows
  let to: [number, number] | null = null
  if (e.key === 'ArrowRight') to = [ri, Math.min(rows[ri]!.length - 1, i + 1)]
  else if (e.key === 'ArrowLeft') to = [ri, Math.max(0, i - 1)]
  else if (e.key === 'ArrowDown') to = [Math.min(rows.length - 1, ri + 1), i]
  else if (e.key === 'ArrowUp') to = [Math.max(0, ri - 1), i]
  if (!to) return
  e.preventDefault()
  await nextTick()
  const [r, h] = to
  field.value?.querySelector<HTMLElement>(`[data-row="${r}"][data-hook="${Math.min(h, rows[r]!.length - 1)}"]`)?.focus()
}

const g = computed(() => props.game)
const hookStyle = (ri: number, i: number) => {
  const row = current.value.rows[ri]!
  return { left: `${pomX(g.value, row, i)}%`, top: `${row.y}%`, width: `${g.value.slotW}%` }
}
const hookLabel = (ri: number, i: number) => {
  const k = hung.value[ri]?.[i]
  const where = t('app.adventure.pomegranatesHook', { n: i + 1, row: ri + 1 })
  return k ? `${where}: ${kindName(k)}` : `${where}: ${t('app.adventure.pomegranatesEmpty')}`
}
const thingImage = (ri: number, i: number) => {
  const k = hung.value[ri]?.[i]
  return k ? props.game.items[k].image : ''
}
const thingLabel = (ri: number, i: number) => {
  const k = hung.value[ri]?.[i]
  return k ? kindName(k) : ''
}
const markOf = (ri: number, i: number): 'good' | 'bad' => marks.value[`${ri}:${i}`] ?? 'good'
const legend = computed(() => pomKinds(current.value))
const openLeft = computed(() => locked.value.reduce((n, row) => n + row.filter((l) => !l).length, 0))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.pomegranatesField')"
        @keydown="onKey"
        @contextmenu.prevent
      )
        template(v-for="(row, ri) in current.rows" :key="`row-${round}-${ri}`")
          button(
            v-for="i in row.length"
            :key="`h-${round}-${ri}-${i}`"
            type="button"
            class="gm-hook"
            :class="{ given: row.given.includes(i - 1), locked: locked[ri]?.[i - 1] }"
            :style="hookStyle(ri, i - 1)"
            :data-row="ri"
            :data-hook="i - 1"
            :aria-label="hookLabel(ri, i - 1)"
            :aria-disabled="locked[ri]?.[i - 1] ? 'true' : undefined"
            @click="tapHook(ri, i - 1)"
          )
            span(class="gm-hooksprite")
              GameImage(:src="game.hook.image" :ratio="1" colour="#a87a3a")
            span(v-if="hung[ri]?.[i - 1]" class="gm-thing" :class="{ swing: marks[`${ri}:${i - 1}`] === 'bad' }")
              GameImage(:src="thingImage(ri, i - 1)" :ratio="0.7" :colour="hung[ri]?.[i - 1] === 'granat' ? '#b0402e' : '#b8892a'" :label="thingLabel(ri, i - 1)")
            span(v-if="marks[`${ri}:${i - 1}`]" class="gm-mark")
              GameMark(:kind="markOf(ri, i - 1)")
      div(class="gm-legend" aria-hidden="true")
        span(v-for="k in legend" :key="k" class="gm-leg")
          span(class="gm-legimg")
            GameImage(:src="game.items[k].image" :ratio="0.7" colour="#b8892a")
          span {{ kindName(k) }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.pomegranatesCount', { n: openLeft }) }}
      button(type="button" class="gm-check" :disabled="!allFull || between || checking" @click="check") {{ t('app.adventure.pomegranatesCheck') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !checking" tone="gold" @click="helpMe") {{ t('app.adventure.pomegranatesHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.pomegranatesDone')" @next="emit('done', stars)")
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
  background-color: #8a6a3a
  background-size: 100% 100%
  -webkit-touch-callout: none

// a hook: the button reaches from the hook down over the thing that hangs on it
.gm-hook
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  aspect-ratio: 0.62
  padding: 0
  border: 2px dashed rgba(255, 246, 220, 0.75)
  border-radius: 12px
  background: rgba(40, 25, 10, 0.18)
  transform: translate(-50%, 0)
  cursor: pointer

  &.locked
    border-style: solid
    border-color: transparent
    background: none
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

.gm-hooksprite
  position: absolute
  left: 30%
  top: 0
  width: 40%
  pointer-events: none

.gm-thing
  position: absolute
  left: 4%
  top: 18%
  width: 92%
  pointer-events: none
  transform-origin: 50% 0
  filter: drop-shadow(0 3px 3px rgba(40, 20, 5, 0.4))

  &.swing
    animation: gm-swing 450ms ease-in-out 3

.gm-mark
  position: absolute
  left: 50%
  top: 55%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-legend
  display: flex
  justify-content: center
  gap: 14px
  flex-wrap: wrap

.gm-leg
  display: flex
  align-items: center
  gap: 6px
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-legimg
  display: block
  width: 30px

.gm-check
  align-self: center
  min-width: 180px
  min-height: 52px
  padding: 8px 22px
  border-radius: 999px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1.1rem
  color: #4a3a18
  cursor: pointer

  &:disabled
    opacity: 0.5
    cursor: default

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

@keyframes gm-swing
  0%, 100%
    rotate: 0deg
  25%
    rotate: -12deg
  75%
    rotate: 12deg

@media (prefers-reduced-motion: reduce)
  .gm-thing.swing
    animation: none
</style>
