<script setup lang="ts">
/**
 * Find the differences: two pictures of the camp at the mountain of God lie side by side (one above the other on a narrow phone). The right one is the same camp with some small things more (a
 * staff, a jar, a bundle, a sheep, ...). The child taps in the right picture the things that are missing on the left. A hit shines green with a tick and the place is shown on the left as a dashed
 * circle; a tap on nothing is a cross (a mistake). After more than three empty taps in a row a hint says where to look (free). No clock, no contest. Round 1: four bigger things, round 2: six smaller
 * ones. The hit is `diffAt` in `utils/moseGames.ts`. From the keyboard: Tab to the things, Enter.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { diffAt } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DiffGame } from '@/types/adventure'

const props = defineProps<{ game: DiffGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every extra thing of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.items.length, 0))

/** Empty taps in a row after which the hint shows; stand-in colours of the things until their pictures are there. */
const HINT_AFTER = 3
const COLOURS = ['#c9895a', '#6f9fc2', '#b58ac4', '#e0c25a', '#7fb069', '#c98a8a', '#9aa5b5', '#d9a441', '#7fc4b8', '#b0805a']

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const taken = reactive<boolean[]>([])
const reset = () => taken.splice(0, taken.length, ...current.value.items.map(() => false))
reset()
const count = computed(() => taken.filter(Boolean).length)
const misses = ref(0)
const row = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const cross = ref<{ x: number; y: number; k: number } | null>(null)
const panel = ref<HTMLElement | null>(null)
let crossKey = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 6))

function find(i: number) {
  if (between.value || finished.value || taken[i]) return
  taken[i] = true
  row.value = 0
  progress.mark()
  play('found')
  message.value = t('app.adventure.diffRight')
  if (taken.every(Boolean)) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1100)
    return
  }
  between.value = true
  later(() => {
    round.value++
    reset()
    between.value = false
    message.value = ''
  }, 1700)
}

/** A tap in the right picture: the nearest thing that is not found yet, or nothing. */
function tap(e: MouseEvent) {
  if (between.value || finished.value) return
  const r = panel.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  const p = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  const i = diffAt(current.value.items, p, taken)
  if (i >= 0) {
    find(i)
    return
  }
  misses.value++
  row.value++
  play('wrong')
  message.value = row.value > HINT_AFTER ? t('app.adventure.diffLook') : t('app.adventure.diffMiss')
  const k = ++crossKey
  cross.value = { ...p, k }
  later(() => {
    if (cross.value?.k === k) cross.value = null
  }, 800)
}

const place = (it: { x: number; y: number; w: number }) => ({ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%` })
const ring = (it: { x: number; y: number; w: number }) => ({ left: `${it.x}%`, top: `${it.y}%`, width: `${Math.max(it.w + 4, 10)}%` })
</script>

<template lang="pug">
  div(class="df")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="df-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="df-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="df-pair")
        figure(class="df-fig")
          div(class="df-pic" role="img" :aria-label="t('app.adventure.diffLeft')" :style="{ backgroundImage: `url(${src(current.base)})` }")
            span(v-for="(it, i) in current.items" :key="`l-${round}-${i}`" v-show="taken[i]" class="df-ring dashed" :style="ring(it)" aria-hidden="true")
        figure(class="df-fig")
          div(ref="panel" class="df-pic right" :style="{ backgroundImage: `url(${src(current.base)})` }" role="group" :aria-label="t('app.adventure.diffRightPic')" @click="tap")
            button(
              v-for="(it, i) in current.items"
              :key="`r-${round}-${i}`"
              type="button"
              class="df-thing"
              :class="{ found: taken[i] }"
              :style="place(it)"
              :aria-label="taken[i] ? t('app.adventure.diffFound') : t('app.adventure.diffThing', { n: i + 1 })"
              @click.stop="find(i)"
            )
              GameImage(:src="it.image" :colour="COLOURS[i % COLOURS.length]")
              span(v-if="taken[i]" class="df-ring solid" aria-hidden="true")
              GameMark(v-if="taken[i]" kind="good" class="df-mark")
            span(v-if="cross" :key="cross.k" class="df-cross" :style="{ left: `${cross.x}%`, top: `${cross.y}%` }" aria-hidden="true")
              GameMark(kind="bad")
      p(class="df-fb" role="status") {{ message }}
      p(class="df-count") {{ t('app.adventure.diffCount', { n: count, total: current.items.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.diffDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.df
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.df-round
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

.df-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.df-pair
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
  gap: 10px

.df-fig
  margin: 0

.df-pic
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 12px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center

  &.right
    cursor: crosshair
    touch-action: manipulation

// the things are anchored by their middle
.df-thing
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  min-width: 44px
  min-height: 44px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.df-ring
  position: absolute
  display: block
  aspect-ratio: 1
  border-radius: 50%
  transform: translate(-50%, -50%)
  pointer-events: none

  &.dashed
    border: 3px dashed rgba(255, 255, 255, 0.95)
    box-shadow: 0 0 6px rgba(40, 30, 10, 0.6)

  &.solid
    left: 50%
    top: 50%
    width: 120%
    border: 3px solid #2fae54
    box-shadow: 0 0 8px rgba(60, 200, 90, 0.9)

.df-mark
  position: absolute
  top: -14px
  right: -14px

.df-cross
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none

.df-fb
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

.df-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
