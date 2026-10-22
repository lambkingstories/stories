<script setup lang="ts">
/**
 * Cargo overboard: in the storm the cargo of the ship (crates, barrels, sacks) slides to and fro on the deck (a calm sine, the ship rocks a little). The child taps a piece and it flies into the sea
 * with a splash; the ship lies higher in the water with every piece that is gone. A tap on the empty deck is a small mistake (a cross, quiet). Round 1: four pieces, slow slides; round 2:
 * six pieces, faster slides. Nothing can be lost; with "reduce motion" the cargo stands still. The positions are `slideX`, `shipRise` and `hitsPiece` in `utils/jonaGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { shipRise, slideX } from '@/utils/jonaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { OverboardGame } from '@/types/adventure'

const props = defineProps<{ game: OverboardGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every piece of cargo of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.pieces.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const thrown = reactive<Record<number, boolean>>({})
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const miss = ref<{ x: number; k: number } | null>(null)
let missKey = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 3, 8))
const count = computed(() => Object.keys(thrown).length)
const rise = computed(() => shipRise(count.value, current.value.pieces.length))

// the clock of the slides (ms since the round began); with "reduce motion" nothing slides
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const now = ref(0)
let startedAt = Date.now()
const timer = window.setInterval(() => {
  now.value = Date.now() - startedAt
}, 60)
onBeforeUnmount(() => window.clearInterval(timer))

const kindOf = (id: string) => props.game.kinds.find((k) => k.id === id) ?? props.game.kinds[0]!
const xOf = (i: number) => {
  const p = current.value.pieces[i]!
  return slideX(now.value, p.x, reduced ? 0 : p.amp, p.periodMs, p.phase ?? 0)
}

function pick(i: number) {
  if (between.value || finished.value || thrown[i]) return
  thrown[i] = true
  progress.mark()
  play('basket')
  message.value = ''
  if (count.value >= current.value.pieces.length) roundOver()
}

/** A tap on the empty deck (the pieces are buttons and do not come here). */
function deckTap(e: MouseEvent) {
  if (between.value || finished.value) return
  if (e.target instanceof Element && e.target.closest('.ob-piece')) return
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return
  misses.value++
  play('wrong')
  message.value = t('app.adventure.overboardEmpty')
  const k = ++missKey
  miss.value = { x: ((e.clientX - r.left) / r.width) * 100, k }
  later(() => {
    if (miss.value?.k === k) miss.value = null
  }, 800)
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.overboardRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(thrown)) delete thrown[Number(k)]
    startedAt = Date.now()
    now.value = 0
    between.value = false
    message.value = ''
  }, 2200)
}

const shipStyle = computed(() => ({ left: `${props.game.shipBox.x}%`, top: `${props.game.shipBox.y}%`, width: `${props.game.shipBox.w}%` }))
const groupStyle = computed(() => ({ transform: `translateY(${-rise.value * 5}%)` }))
</script>

<template lang="pug">
  div(class="ob")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ob-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ob-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(ref="field" class="ob-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="ob-rise" :style="groupStyle")
          div(class="ob-rock")
            span(class="ob-ship" :style="shipStyle" aria-hidden="true")
              GameImage(:src="game.ship" :ratio="2" colour="#6b4a2a")
            div(class="ob-deck" :style="{ top: `${game.deck.y}%`, height: `${game.deck.h}%` }" @click="deckTap")
              button(
                v-for="(p, i) in current.pieces"
                :key="`${round}-${i}`"
                type="button"
                class="ob-piece"
                :class="{ gone: thrown[i] }"
                :style="{ left: `${xOf(i)}%`, width: `${kindOf(p.kind).w}%` }"
                :disabled="thrown[i] || between"
                :aria-label="thrown[i] ? t('app.adventure.overboardGone') : t('app.adventure.overboardPiece', { n: i + 1 })"
                @click.stop="pick(i)"
              )
                GameImage(:src="kindOf(p.kind).image" colour="#a8793e")
          span(v-if="miss" :key="miss.k" class="ob-miss" :style="{ left: `${miss.x}%`, top: `${game.deck.y}%` }" aria-hidden="true")
            GameMark(kind="bad")
      p(class="ob-fb" role="status") {{ message }}
      p(class="ob-count") {{ t('app.adventure.overboardCount', { n: count, total: current.pieces.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.overboardDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ob
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #cbd6dc
  box-shadow: inset 0 0 18px rgba(30, 50, 70, 0.25)

.ob-round
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

.ob-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ob-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #3c5f78
  background-size: cover
  background-position: center

// the whole ship rises when the cargo is gone, and rocks a little (not with "reduce motion")
.ob-rise
  position: absolute
  inset: 0
  transition: transform 700ms ease-out

.ob-rock
  position: absolute
  inset: 0
  transform-origin: 50% 70%
  animation: ob-rock 2600ms ease-in-out infinite

.ob-ship
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.ob-deck
  position: absolute
  left: 0
  right: 0
  cursor: pointer

// a piece of cargo: its middle slides, its lower edge stands on the deck line; big enough for a thumb
.ob-piece
  position: absolute
  bottom: 0
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translateX(-50%)
  transition: transform 650ms ease-in, opacity 650ms ease-in
  -webkit-tap-highlight-color: transparent

  // the tap area is bigger than the picture (a finger is bigger than a barrel)
  &::after
    content: ''
    position: absolute
    inset: -12px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

  &.gone
    opacity: 0
    pointer-events: none
    transform: translate(-50%, 140%) rotate(40deg)

.ob-miss
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.ob-fb
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

.ob-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes ob-rock
  0%, 100%
    transform: rotate(-2.2deg)
  50%
    transform: rotate(2.2deg)

@media (prefers-reduced-motion: reduce)
  .ob-rock
    animation: none

  .ob-rise,
  .ob-piece
    transition: none
</style>
