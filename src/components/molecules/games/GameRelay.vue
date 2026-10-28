<script setup lang="ts">
/**
 * Leave room between the herds: Jacob sends his gifts ahead along the road and tells the servants: "Leave a space between the herds". The next herd waits at the start of the road. The
 * child taps "Go" and the herd walks along the road. A light band behind the herd that walks shows how much room is good. If "Go" is tapped before the herd in front has gone far enough
 * (`gapOk`), the herd that was sent too close stays at the start: red, a cross, a dull sound, a mistake. Sending late is no mistake, the herds wait as long as they like (there is no clock).
 * Round 1: three herds, wide gap, slow; round 2: five herds, narrower gap, a little faster. The end gives `mistakeStars(mistakes, 2, 4)`. The arithmetic is in `utils/jakobGames2.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { gapOk, positionAt } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { isStagePicture, softOf } from '@/utils/gameBackground'
import type { RelayGame, RelayHerd } from '@/types/adventure'

const props = defineProps<{ game: RelayGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every herd that is sent, in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.herds.length, 0))

/** One step of the walk in seconds. */
const TICK = 0.05
/** Stand-in colours of the herds until the pictures are there. */
const COLOURS = ['#c9b37d', '#e8e2d0', '#b58a5a']

interface Sent {
  n: number
  id: string
  /** the way gone, in percent of the road (0 to 100) */
  pos: number
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const sent = ref<Sent[]>([])
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)

const herdOf = (id: string): RelayHerd | undefined => props.game.herds.find((h) => h.id === id)
const colourOf = (id: string) => COLOURS[Math.max(0, props.game.herds.findIndex((h) => h.id === id)) % COLOURS.length]
const stars = computed(() => mistakeStars(mistakes.value, 2, 4))
/** The herds that wait, the first of them stands at the start of the road. */
const waiting = computed(() => current.value.herds.slice(sent.value.length))
/** The herd that stands at the start (its id), or an empty text. */
const nextId = computed(() => waiting.value[0] ?? '')
const walking = computed(() => sent.value.filter((s) => s.pos < 100))
/** How far the herd that was sent last has come (100 when it is there or none was sent). */
const lastPos = computed(() => (sent.value.length ? Math.min(100, sent.value[sent.value.length - 1]!.pos) : 100))

function tick() {
  if (between.value || finished.value) return
  const speed = current.value.speed * 100 * TICK
  for (const s of sent.value) if (s.pos < 100) s.pos = Math.min(100, s.pos + speed)
  if (sent.value.length === current.value.herds.length && sent.value.every((s) => s.pos >= 100)) roundOver()
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 800)
}

/** "Go": the next herd walks, if there is room enough between it and the one in front. */
function go() {
  if (between.value || finished.value || !waiting.value.length) return
  if (!gapOk(lastPos.value, 0, current.value.minGap)) {
    mistakes.value++
    play('wrong')
    message.value = t('app.adventure.relayClose')
    flashOn('bad')
    return
  }
  sent.value.push({ n: sent.value.length, id: nextId.value, pos: 0 })
  progress.mark()
  play('tap')
  message.value = ''
  flashOn('good')
}

function roundOver() {
  if (lastRound.value) {
    between.value = true
    later(() => {
      finished.value = true
      play('star')
    }, 600)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    sent.value = []
    between.value = false
    message.value = ''
  }, 1500)
}

/** The place of a herd on the road (percent of the picture), its feet. */
const at = (pos: number) => positionAt(props.game.road, pos / 100)
const style = (herd: string, pos: number) => {
  const p = at(pos)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${herdOf(herd)?.w ?? 15}%`, zIndex: String(Math.round(p.y)) }
}
/** A herd is a troop of `copies` animals side by side (the same picture, a little apart): the numbers 0 to copies - 1. */
const copiesOf = (herd: string) => Array.from({ length: herdOf(herd)?.copies ?? 1 }, (_, i) => i)
const copyStyle = (herd: string, c: number) => {
  const n = herdOf(herd)?.copies ?? 1
  if (n <= 1) return { left: '0%', width: '100%', bottom: '0%' }
  // the animals share the width of the herd, each half as wide as the herd, the middle ones a little higher
  return { left: `${(c * 50) / (n - 1)}%`, width: '50%', bottom: `${c % 2 === 1 ? 14 : 0}%` }
}
/** The road as a soft line (drawn by the app). */
const roadPoints = computed(() => props.game.road.map(([x, y]) => `${x},${y / 1.5}`).join(' '))
const flashStyle = computed(() => {
  const p = at(0)
  return { left: `${p.x}%`, top: `${p.y}%` }
})
/** The light band behind the herd that was sent last: as long as the room that has to stay free. */
const band = computed(() => {
  if (!sent.value.length || lastPos.value >= 100) return ''
  const to = lastPos.value
  const from = Math.max(0, to - current.value.minGap)
  const points: string[] = []
  for (let i = 0; i <= 12; i++) {
    const p = at(from + ((to - from) * i) / 12)
    points.push(`${p.x},${p.y / 1.5}`)
  }
  return points.join(' ')
})
</script>

<template lang="pug">
  div(class="rl")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="rl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="rl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="rl-field game-soft" role="group" :aria-label="t('app.adventure.relayField', { n: sent.length, total: current.herds.length })" :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }")
        //- a painted backdrop has its own road: the soft line of the app is drawn only over a stage picture
        svg(v-if="isStagePicture(game.background)" class="rl-road" viewBox="0 0 100 66.667" preserveAspectRatio="none" aria-hidden="true")
          polyline(:points="roadPoints")
        svg(class="rl-band" viewBox="0 0 100 66.667" preserveAspectRatio="none" aria-hidden="true")
          polyline(v-if="band" :points="band")
        template(v-if="!between")
          span(v-if="nextId" :key="`${round}-wait`" class="rl-herd waiting" :style="style(nextId, 0)" aria-hidden="true")
            span(v-for="c in copiesOf(nextId)" :key="c" class="rl-copy" :style="copyStyle(nextId, c)")
              GameImage(:src="herdOf(nextId)?.image ?? ''" :ratio="1" :colour="colourOf(nextId)" round)
          span(v-for="s in walking" :key="`${round}-${s.n}`" class="rl-herd" :style="style(s.id, s.pos)" aria-hidden="true")
            span(v-for="c in copiesOf(s.id)" :key="c" class="rl-copy" :style="copyStyle(s.id, c)")
              GameImage(:src="herdOf(s.id)?.image ?? ''" :ratio="1" :colour="colourOf(s.id)" round)
        GameMark(v-if="flash" :kind="flash" class="rl-mark" :style="flashStyle")
      p(class="rl-fb" role="status") {{ message }}
      AdvButton(tone="gold" class="rl-go" :disabled="between || !waiting.length" @click="go") {{ t('app.adventure.relayGo') }}
      p(class="rl-count") {{ t('app.adventure.relayCount', { n: sent.length, total: current.herds.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.relayDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.rl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.rl-round
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

.rl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.rl-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cbbd8f
  background-size: cover
  background-position: center

// the room that has to stay free behind the herd
.rl-band
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

  polyline
    fill: none
    stroke: rgba(255, 252, 225, 0.65)
    stroke-width: 14
    stroke-linecap: round
    stroke-linejoin: round
    vector-effect: non-scaling-stroke

// a herd stands with its feet on the road
// the road: a soft light line under the herds
.rl-road
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

  polyline
    fill: none
    stroke: rgba(255, 244, 205, 0.4)
    stroke-width: 22
    stroke-linecap: round
    stroke-linejoin: round
    vector-effect: non-scaling-stroke

.rl-herd
  position: absolute
  display: block
  aspect-ratio: 5 / 3
  transform: translate(-50%, -100%)
  pointer-events: none

.rl-copy
  position: absolute
  display: block

  &.waiting
    filter: drop-shadow(0 0 4px rgba(255, 214, 90, 0.95))

.rl-mark
  position: absolute
  transform: translate(-50%, -190%)
  z-index: 100

.rl-fb
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

.rl-go
  align-self: center
  min-height: 56px

.rl-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
