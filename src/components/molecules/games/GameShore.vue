<script setup lang="ts">
/**
 * Shells before the wave: seen from above, dry sand lies at the top of the beach and the sea at the bottom. A wave (a painted strip of foam under a tint of water) runs up the beach and back. The child taps the
 * shells that lie on the dry sand and they jump into the bucket. When the front of the wave reaches a shell that is still there, it is washed away (a mistake, quiet) and comes back higher up in the dry sand, so the
 * game always goes on. Round 1: five shells, a slow wave; round 2: seven shells, a faster wave that reaches higher. With "reduce motion" the wave is slower. The wave is `waveFront`, `isWashed`, `respawnY` in `utils/jonaGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { isWashed, respawnY, waveFront } from '@/utils/jonaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ShoreGame } from '@/types/adventure'

const props = defineProps<{ game: ShoreGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every shell of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.shells.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const taken = reactive<Record<number, boolean>>({})
/** Where each shell lies now (a washed-away shell lies higher up afterwards). */
const pos = reactive<Record<number, { x: number; y: number }>>({})
const washed = reactive<Record<number, number>>({})
const washes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(washes.value, 2, 5))
const count = computed(() => Object.keys(taken).length)

function layOut() {
  for (const k of Object.keys(pos)) delete pos[Number(k)]
  for (const k of Object.keys(taken)) delete taken[Number(k)]
  for (const k of Object.keys(washed)) delete washed[Number(k)]
  current.value.shells.forEach((s, i) => (pos[i] = { x: s.x, y: s.y }))
}
layOut()

// the clock of the wave (ms since the round began); with "reduce motion" it is slower
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** The wave comes after this many ms, so that the child can look at the beach first. */
const LEAD = 2200
const now = ref(0)
let startedAt = Date.now()
const roundTimes = computed(() => ({ periodMs: current.value.periodMs * (reduced ? 1.6 : 1), high: current.value.high, low: current.value.low }))
const front = computed(() => waveFront(now.value, roundTimes.value))

function tick() {
  now.value = Math.max(0, Date.now() - startedAt - LEAD)
  if (between.value || finished.value) return
  const f = waveFront(now.value, roundTimes.value)
  current.value.shells.forEach((_, i) => {
    const p = pos[i]
    if (!p || taken[i] || !isWashed(p.y, f)) return
    // the wave has got it: it comes back higher up, in the dry sand
    washes.value++
    washed[i] = (washed[i] ?? 0) + 1
    p.y = respawnY(current.value, i)
    play('wrong')
    message.value = t('app.adventure.shoreWashed')
  })
}
const timer = window.setInterval(tick, 60)
onBeforeUnmount(() => window.clearInterval(timer))

function take(i: number) {
  if (between.value || finished.value || taken[i]) return
  const p = pos[i]
  if (!p || isWashed(p.y, front.value)) return
  taken[i] = true
  progress.mark()
  play('basket')
  message.value = ''
  if (count.value >= current.value.shells.length) roundOver()
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.shoreRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    layOut()
    startedAt = Date.now()
    now.value = 0
    between.value = false
    message.value = ''
  }, 2200)
}

const shellImage = (kind: number) => props.game.shells[kind % props.game.shells.length] ?? ''
const foamStyle = computed(() => ({ top: `${front.value}%` }))
const waterStyle = computed(() => ({ top: `${front.value}%` }))
</script>

<template lang="pug">
  div(class="sh")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sh-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sh-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="sh-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="sh-water" :style="waterStyle" aria-hidden="true")
        span(class="sh-foam" :style="foamStyle" aria-hidden="true")
          GameImage(:src="game.foam" :ratio="8" colour="#ffffff")
        span(class="sh-bucket" aria-hidden="true")
          GameImage(:src="game.bucket" colour="#b88f55")
        template(v-for="(s, i) in current.shells" :key="`${round}-${i}`")
          button(
            v-if="pos[i]"
            type="button"
            class="sh-shell"
            :class="{ taken: taken[i], washed: washed[i] }"
            :style="{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }"
            :disabled="taken[i] || between"
            :aria-label="taken[i] ? t('app.adventure.shoreTaken') : t('app.adventure.shoreShell', { n: i + 1 })"
            @click="take(i)"
          )
            GameImage(:src="shellImage(s.kind)" colour="#f0d9c0" round)
        span(v-if="message === t('app.adventure.shoreWashed')" class="sh-cross" aria-hidden="true")
          GameMark(kind="bad")
      p(class="sh-fb" role="status") {{ message }}
      p(class="sh-count") {{ t('app.adventure.shoreCount', { n: count, total: current.shells.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shoreDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sh
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe2bd
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sh-round
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

.sh-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sh-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #e8d4a0
  background-size: cover
  background-position: center

// the sea that the wave brings up the beach: a light tint of water under the foam
.sh-water
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: block
  background: rgba(70, 160, 200, 0.5)
  pointer-events: none

.sh-foam
  position: absolute
  left: 0
  right: 0
  display: block
  margin-top: -3%
  pointer-events: none

.sh-bucket
  position: absolute
  left: 3%
  top: 3%
  display: block
  width: 15%
  pointer-events: none

// a shell: big enough for a thumb; it jumps up and away into the bucket when it is taken
.sh-shell
  position: absolute
  width: 13%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  transition: transform 450ms ease-in, opacity 450ms ease-in
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -10px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 50%

  &.taken
    opacity: 0
    pointer-events: none
    transform: translate(-260%, -330%) scale(0.5)

.sh-cross
  position: absolute
  right: 4%
  top: 4%
  display: block
  pointer-events: none

.sh-fb
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

.sh-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@media (prefers-reduced-motion: reduce)
  .sh-shell
    transition: none
</style>
