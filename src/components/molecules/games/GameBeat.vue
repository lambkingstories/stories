<script setup lang="ts">
/**
 * Miriam's drum: on the shore stands a big hand drum. From the outside golden rings draw in towards the drum, one after the other. The child taps the drum when a ring reaches it: the drum sounds
 * and shines, a tick. A ring that is let go fades away (no mistake, no sound). A tap with no ring near is a dull sound, a cross and a mistake. The rings come at an even beat (round 1: eight rings,
 * 72 beats a minute; round 2: twelve rings, 90 beats a minute, with two small pauses where a ring is missing). A round ends when the last ring has gone by; whoever has missed some may play it once more
 * (not a must). There is no sound needed: the rings and the shining of the drum say everything, and the sounds are an addition. The key space taps the drum. With reduced motion the rings do not draw in, they
 * appear at the drum and shine there; the tap is "now". The timing is `ringTimes`, `ringFor` and `judge` in `utils/moseGames.ts`; the tones of the drum (`pauke`, `pauke-dumpf`) are still to come, until then
 * the sounds `bead` and `wrong` stand in.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { ringFor, ringTimes } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { BeatGame } from '@/types/adventure'

const props = defineProps<{ game: BeatGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const ringsOf = (r: { pattern: (0 | 1)[] }) => r.pattern.filter((p) => p === 1).length
// the whole task: every ring of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + ringsOf(r), 0))

/** How long a ring takes to draw in (seconds), the time before the first ring arrives, how long a ring fades after it was missed, and the window of a hit. */
const TRAVEL = 1.6
const LEAD = 2
const FADE = 0.6
const WINDOW = 0.25

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const times = computed(() => ringTimes(current.value.bpm, current.value.pattern, LEAD))
const phase = ref<'ready' | 'play' | 'over'>('ready')
const startAt = ref(0)
const hit = ref<boolean[]>([])
const best = ref(0)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const shine = ref(false)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 3, 7))
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clock = ref(0)
const nowS = () => Date.now() / 1000
const timer = window.setInterval(() => {
  if (phase.value !== 'play') return
  clock.value = nowS() - startAt.value
  const last = times.value[times.value.length - 1] ?? 0
  if (clock.value > last + FADE + 0.2) endRound()
}, 40)
onBeforeUnmount(() => window.clearInterval(timer))

function start() {
  if (phase.value === 'play' || between.value || finished.value) return
  hit.value = times.value.map(() => false)
  startAt.value = nowS()
  clock.value = 0
  message.value = ''
  phase.value = 'play'
}

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 500)
}

/** A tap on the drum. */
function tap() {
  if (phase.value === 'ready') return
  if (phase.value !== 'play') return
  const at = nowS() - startAt.value
  const i = ringFor(times.value, hit.value, at, WINDOW)
  if (i >= 0) {
    hit.value = hit.value.map((h, k) => (k === i ? true : h))
    const n = hit.value.filter(Boolean).length
    if (n > best.value) {
      progress.mark()
      best.value = n
    }
    play('bead')
    shine.value = true
    later(() => {
      shine.value = false
    }, 300)
    flashOn('good')
    message.value = ''
    return
  }
  mistakes.value++
  play('wrong')
  flashOn('bad')
  message.value = t('app.adventure.beatMiss')
}

function endRound() {
  if (phase.value !== 'play') return
  phase.value = 'over'
  const all = hit.value.every(Boolean)
  if (all) {
    play('star')
    message.value = t('app.adventure.beatRight')
    later(next, 1600)
    return
  }
  message.value = t('app.adventure.beatAgain')
}

/** The next round (or the end). */
function next() {
  best.value = 0
  message.value = ''
  if (lastRound.value) {
    finished.value = true
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    phase.value = 'ready'
    between.value = false
    message.value = ''
  }, 1300)
}

/** "Once more": the same round again; the progress counts only the rings beyond the best try so far. */
function again() {
  phase.value = 'ready'
  message.value = ''
}

function key(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  // the drum itself takes the key too; the other buttons keep it for their own click
  if (e.key !== ' ' || (target?.tagName === 'BUTTON' && !target.classList.contains('bt-drum'))) return
  e.preventDefault()
  if (phase.value === 'ready') start()
  else tap()
}

/** Where a ring is on its way: 0 far away, 1 at the drum; missed rings fade; hit rings are gone. */
function ringState(i: number) {
  const arrive = times.value[i] ?? 0
  const p = 1 - (arrive - clock.value) / TRAVEL
  if (hit.value[i]) return null
  if (p < 0) return null
  if (clock.value > arrive + FADE) return null
  const missed = clock.value > arrive + WINDOW
  if (still) return p > 0.7 ? { scale: 1.3, opacity: missed ? 0.3 : 1, missed } : null
  return { scale: 3.2 - 2.2 * Math.min(1, p), opacity: missed ? Math.max(0, 1 - (clock.value - arrive - WINDOW) / (FADE - WINDOW)) * 0.6 : Math.min(1, p * 1.4), missed }
}
const visible = computed(() => times.value.map((_, i) => ({ i, s: ringState(i) })).filter((r) => r.s !== null) as { i: number; s: { scale: number; opacity: number; missed: boolean } }[])
const countHit = computed(() => hit.value.filter(Boolean).length)
const totalRings = computed(() => times.value.length)
</script>

<template lang="pug">
  div(class="bt" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="bt-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="bt-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="bt-field game-soft" role="group" :aria-label="t('app.adventure.beatField', { n: countHit, total: totalRings })" :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }")
        button(type="button" class="bt-drum" :class="{ shine }" :aria-label="t('app.adventure.beatDrum')" :disabled="phase !== 'play'" @pointerdown.prevent="tap")
          GameImage(:src="game.drum" colour="#c9895a" round)
          span(v-for="r in visible" :key="`${round}-${r.i}`" class="bt-ring" :class="{ missed: r.s.missed }" :style="{ transform: `translate(-50%, -50%) scale(${r.s.scale})`, opacity: String(r.s.opacity) }" aria-hidden="true")
            GameImage(:src="game.ring" colour="#f0c43a" round)
        GameMark(v-if="flash" :kind="flash" class="bt-mark")
      p(class="bt-fb" role="status") {{ message }}
      div(class="bt-actions")
        AdvButton(v-if="phase === 'ready'" tone="gold" class="bt-go" :disabled="between" @click.stop="start") {{ t('app.adventure.beatStart') }}
        template(v-else-if="phase === 'over' && countHit < totalRings")
          AdvButton(tone="gold" @click.stop="again") {{ t('app.adventure.beatAgainButton') }}
          AdvButton(tone="blau" @click.stop="next") {{ t('app.adventure.beatOn') }}
      p(class="bt-count") {{ t('app.adventure.beatCount', { n: best, total: totalRings }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.beatDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.bt
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.bt-round
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

.bt-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.bt-field
  position: relative
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fb4c9
  background-size: cover
  background-position: center

// the drum: big, round, a thumb target; the rings draw in over it
.bt-drum
  position: relative
  width: 38%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &.shine
    filter: drop-shadow(0 0 14px rgba(255, 224, 120, 1))

  &:disabled
    cursor: default

.bt-ring
  position: absolute
  left: 50%
  top: 50%
  display: block
  width: 100%
  pointer-events: none

  &.missed
    filter: grayscale(0.6)

.bt-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 8

.bt-fb
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

.bt-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 56px

.bt-go
  min-height: 56px

.bt-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
