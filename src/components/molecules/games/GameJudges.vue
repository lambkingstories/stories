<script setup lang="ts">
/**
 * Share the cases (Exodus 18,22): Jethro advises Moses to let honest men judge the small cases and to bring only the great ones to him. Three men who judge and Moses stand in the court; under the picture lie the cases
 * (little pictures of a quarrel). The child taps a case and then the man who should decide it: a small case goes to any of the three men, a great one (many people, a well, a pasture) goes to Moses. A wrong seat is a
 * dull sound, a cross and a word (the case stays in the tray). Round 1 has four cases, round 2 six. The arithmetic is in `utils/wuesteGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { caseStep, casesDone } from '@/utils/wuesteGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { JudgeCase, JudgesGame } from '@/types/adventure'

const props = defineProps<{ game: JudgesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every case of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.cases.length, 0))

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The case that is chosen (its id), and where each decided case went (case id -> seat id). */
const picked = ref<string | null>(null)
const placed = reactive<Record<string, string>>({})
const crossAt = ref<string | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const caseOf = (id: string): JudgeCase | undefined => props.game.cases.find((c) => c.id === id)
const tray = computed(() => current.value.cases.filter((id) => !placed[id]))
const decided = computed(() => current.value.cases.length - tray.value.length)
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
/** The decided cases at a seat (their ids), shown as small pictures above the man. */
const atSeat = (seat: string) => current.value.cases.filter((id) => placed[id] === seat)

function choose(id: string) {
  if (between.value || finished.value) return
  picked.value = picked.value === id ? null : id
  play('tap')
  message.value = picked.value ? '' : message.value
}

function tapSeat(seatId: string) {
  if (between.value || finished.value) return
  const id = picked.value
  if (!id) {
    message.value = t('app.adventure.judgesPick')
    return
  }
  const c = caseOf(id)
  const seat = props.game.seats.find((s) => s.id === seatId)
  if (!c || !seat) return
  const res = caseStep(c.weight, !!seat.moses)
  if (res !== 'ok') {
    misses.value++
    play('wrong')
    message.value = res === 'tooHeavy' ? t('app.adventure.judgesTooHeavy') : t('app.adventure.judgesTooLight')
    crossAt.value = seatId
    later(() => {
      if (crossAt.value === seatId) crossAt.value = null
    }, 900)
    return
  }
  placed[id] = seatId
  picked.value = null
  progress.mark()
  play('snap')
  message.value = ''
  if (!casesDone(decided.value, current.value.cases.length)) return
  between.value = true
  message.value = t('app.adventure.judgesRoundDone')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => {
    round.value++
    for (const k of Object.keys(placed)) delete placed[k]
    between.value = false
    message.value = ''
  }, 2400)
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
        :aria-label="t('app.adventure.judgesField')"
      )
        button(
          v-for="s in game.seats"
          :key="s.id"
          type="button"
          class="gm-seat"
          :class="{ ready: !!picked }"
          :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }"
          :aria-label="s.label"
          :disabled="between"
          @click="tapSeat(s.id)"
        )
          span(class="gm-got")
            img(v-for="id in atSeat(s.id)" :key="id" :src="src(caseOf(id)?.image ?? '')" alt="" draggable="false")
          img(class="gm-man" :src="src(s.image)" alt="" draggable="false")
          span(v-if="crossAt === s.id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.judgesTray')")
        button(
          v-for="id in tray"
          :key="`${round}-${id}`"
          type="button"
          class="gm-case"
          :class="{ on: picked === id }"
          :style="{ width: `${game.caseW}%` }"
          :aria-pressed="picked === id"
          :aria-label="caseOf(id)?.label"
          :disabled="between"
          @click="choose(id)"
        )
          img(:src="src(caseOf(id)?.image ?? '')" alt="" draggable="false")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.judgesCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.judgesDone')" @next="emit('done', stars)")
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
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9a46a
  background-size: cover
  background-position: center

.gm-seat
  position: absolute
  display: block
  min-width: 70px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

  &.ready
    animation: gm-nudge 1.4s ease-in-out infinite

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

.gm-man
  display: block
  width: 100%
  height: auto
  pointer-events: none

// the cases that were decided stand in a little row above the man
.gm-got
  position: absolute
  left: 50%
  bottom: 100%
  display: flex
  gap: 2px
  width: 150%
  justify-content: center
  transform: translateX(-50%)
  pointer-events: none

  img
    display: block
    width: 36%
    height: auto

.gm-cross
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 64px

.gm-case
  min-width: 72px
  padding: 3px
  border-radius: 50%
  border: 3px solid #d4a83e
  background: rgba(255, 246, 220, 0.9)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &.on
    border-color: #2f6b3f
    background: #fff
    transform: scale(1.08)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

  img
    display: block
    width: 100%
    height: auto
    border-radius: 50%
    pointer-events: none

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

@keyframes gm-nudge
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3px

@media (prefers-reduced-motion: reduce)
  .gm-seat.ready
    animation: none
</style>
