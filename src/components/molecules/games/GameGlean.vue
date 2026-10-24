<script setup lang="ts">
/**
 * Ears behind the reapers: a golden field with three stubble lanes. In each lane stand a few clumps of barley; a reaper walks along the lane from the left to the right, cuts the clumps one after the other and an ear stays
 * lying where a clump fell. The child taps the lying ears: they fly into Ruth's basket. A tap on a clump that still stands is a mistake (a cross, the clump stays). An ear that is not picked up is no mistake,
 * it just stays lying (the round ends when every ear is in the basket or a little after the last reaper has left). Round 1 has two reapers and six ears, slow; round 2 three reapers and nine ears, a little faster.
 * The first reaper begins a moment after the picture is there, never at once. Where a reaper is and whether a clump is cut is `reaperX` and `isCut` in `utils/rutGames.ts`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { earCount, gleanRoundOver, isCut, reaperX } from '@/utils/rutGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GleanGame } from '@/types/adventure'

const props = defineProps<{ game: GleanGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every ear of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + earCount(r.reapers), 0))

/** The time between the picture standing there and the first reaper entering. */
const LEAD_MS = 2200
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** With "reduce motion" the reapers take half as long again to cross. */
const SLOW = reduced ? 1.5 : 1

const round = ref(0)
const elapsed = ref(-LEAD_MS)
const picked = ref<Set<string>>(new Set())
const pickedTotal = ref(0)
/** The ears on their way to the basket: where they are now, and whether they fade. */
const flying = reactive<Record<string, { x: number; y: number; fade: boolean }>>({})
const wrong = ref<{ key: string; k: number } | null>(null)
let wrongKey = 0
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const reapers = computed(() => props.game.rounds[round.value]!.reapers.map((r) => ({ ...r, dur: r.dur * SLOW })))
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const inBasket = ref(0)

let last = Date.now()
const timer = window.setInterval(() => {
  const now = Date.now()
  const dt = Math.min(250, now - last)
  last = now
  if (between.value || finished.value) return
  elapsed.value += dt
  if (gleanRoundOver(elapsed.value, reapers.value, picked.value.size)) roundOver()
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

const laneY = (lane: number) => props.game.lanes[Math.min(lane, props.game.lanes.length - 1)]!

/** The reapers that are in the picture now, with their place. */
const walkers = computed(() =>
  reapers.value
    .map((r, i) => ({ i, x: reaperX(elapsed.value, r), y: laneY(r.lane), sprite: props.game.reapers[r.sprite % props.game.reapers.length]!, lane: r.lane }))
    .filter((w): w is { i: number; x: number; y: number; sprite: string; lane: number } => w.x !== null && w.x < 108)
)

/** Every clump of the round: where it stands, and whether it is still standing or has fallen and left an ear. */
const clumps = computed(() =>
  reapers.value.flatMap((r, i) => {
    const rx = reaperX(elapsed.value, r)
    return r.clumps.map((x, j) => ({ key: `${i}-${j}`, x, y: laneY(r.lane), lane: r.lane, standing: !isCut(x, rx), n: i + j }))
  })
)
const standing = computed(() => clumps.value.filter((c) => c.standing))
const lying = computed(() => clumps.value.filter((c) => !c.standing && !picked.value.has(c.key)))
const swarm = computed(() => Object.entries(flying).map(([key, f]) => ({ key, ...f })))
const clumpSprite = (n: number) => props.game.clumps[n % props.game.clumps.length]!
const earSprite = (n: number) => props.game.ears[n % props.game.ears.length]!
const flyingSprite = (key: string) => earSprite(clumps.value.find((x) => x.key === key)?.n ?? 0)

function tapEar(key: string, x: number, y: number) {
  if (between.value || finished.value || picked.value.has(key)) return
  picked.value = new Set(picked.value).add(key)
  pickedTotal.value++
  progress.mark()
  play('basket')
  message.value = ''
  flying[key] = { x, y, fade: false }
  const b = props.game.basketPos
  nextTick(() => {
    flying[key] = { x: b.x, y: b.y - 4, fade: false }
  })
  later(() => {
    if (flying[key]) flying[key]!.fade = true
    inBasket.value++
  }, 650)
  later(() => {
    delete flying[key]
  }, 1200)
}

function tapClump(key: string) {
  if (between.value || finished.value) return
  misses.value++
  play('wrong')
  message.value = t('app.adventure.gleanWait')
  const k = ++wrongKey
  wrong.value = { key, k }
  later(() => {
    if (wrong.value?.k === k) wrong.value = null
  }, 800)
}

function roundOver() {
  between.value = true
  const got = picked.value.size
  message.value = got > 0 ? t('app.adventure.gleanRound_over', { n: got }) : t('app.adventure.gleanNone')
  if (round.value + 1 >= props.game.rounds.length) {
    later(() => {
      finished.value = true
    }, 1500)
    return
  }
  later(() => {
    round.value++
    elapsed.value = -LEAD_MS
    picked.value = new Set()
    for (const k of Object.keys(flying)) delete flying[k]
    last = Date.now()
    between.value = false
    message.value = ''
  }, 1700)
}

const hint = computed(() => props.game.rounds[round.value]!.hint)
</script>

<template lang="pug">
  div(class="gl")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      div(class="gl-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the clumps that still stand (a tap on them is a mistake)
        button(
          v-for="c in standing"
          :key="`clump-${round}-${c.key}`"
          type="button"
          class="gl-clump"
          :style="{ left: `${c.x}%`, top: `${c.y}%`, width: `${game.clumpW}%`, zIndex: 10 + c.lane }"
          :aria-label="t('app.adventure.gleanClump')"
          @click="tapClump(c.key)"
        )
          GameImage(:src="clumpSprite(c.n)" colour="#c9a45c")
          span(v-if="wrong && wrong.key === c.key" :key="wrong.k" class="gl-miss" aria-hidden="true")
            GameMark(kind="bad")
        //- the ears that lie where a clump has fallen
        button(
          v-for="c in lying"
          :key="`ear-${round}-${c.key}`"
          type="button"
          class="gl-ear"
          :style="{ left: `${c.x}%`, top: `${c.y}%`, width: `${game.earW}%`, zIndex: 10 + c.lane }"
          :aria-label="t('app.adventure.gleanEar')"
          @click="tapEar(c.key, c.x, c.y)"
        )
          GameImage(:src="earSprite(c.n)" colour="#e0b84a")
        span(
          v-for="f in swarm"
          :key="`fly-${round}-${f.key}`"
          class="gl-flying"
          :class="{ fade: f.fade }"
          :style="{ left: `${f.x}%`, top: `${f.y}%`, width: `${game.earW}%` }"
          aria-hidden="true"
        )
          GameImage(:src="flyingSprite(f.key)" colour="#e0b84a")
        //- the reapers
        span(
          v-for="w in walkers"
          :key="`reaper-${round}-${w.i}`"
          class="gl-reaper"
          :style="{ left: `${w.x}%`, top: `${w.y}%`, width: `${game.reaperW}%`, zIndex: 10 + w.lane }"
          aria-hidden="true"
        )
          GameImage(:src="w.sprite" colour="#8a6a3a")
        //- Ruth's basket
        span(class="gl-basket" :style="{ left: `${game.basketPos.x}%`, top: `${game.basketPos.y}%`, width: `${game.basketPos.w}%` }" aria-hidden="true")
          GameImage(:src="game.basket" colour="#8a6a3a")
          span(class="gl-count") {{ inBasket }}
      p(class="gl-hint") {{ hint }}
      p(class="gl-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gleanDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.gl-round
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

.gl-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// a clump or an ear is a button: its picture keeps its size, only the area to tap grows
.gl-clump,
.gl-ear
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -10px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

.gl-reaper
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.gl-flying
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 40
  transition: left 600ms ease-out, top 600ms ease-out, opacity 450ms ease

  &.fade
    opacity: 0

.gl-basket
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 30

.gl-count
  position: absolute
  right: 6%
  top: 18%
  min-width: 26px
  padding: 0 7px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.96)
  border: 2px solid #d4a83e
  text-align: center
  font-weight: 900
  font-size: 1rem
  color: #5f4f35

.gl-miss
  position: absolute
  left: 50%
  top: -10%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gl-fb
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
  .gl-flying
    transition: none
</style>
