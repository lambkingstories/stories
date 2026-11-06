<script setup lang="ts">
/**
 * Dye the purple (Acts 16,14: Lydia, "a seller of purple"). Lydia's yard by the river: two stone vats, the left with red-violet purple, the right with blue-violet purple; each vat is
 * marked by its own sign (the round vat by a round clay bowl, the square vat by a square wooden tablet), so that they are never told apart by colour only. A customer holds up a sample. Below hangs a white cloth.
 * The child taps a vat (or chooses it with the left and right arrow keys and dips with Enter): the cloth goes in and comes out stronger (the next painted colour of the cloth).
 * Each vat at most twice; a third dip into the same vat does not go (the vat wobbles, "It cannot get any stronger", no mistake). Every dip is final, the cloth never gets lighter.
 * With the button "done" (a wooden peg and the word) the cloth goes onto the line: it matches the sample = the customer smiles, a tick; otherwise a cross and
 * "The colour does not match the sample", a mistake, and a new white cloth comes. Round 1: two customers, each sample from one vat only; round 2: three, each mixed from both.
 * "Help me" after fifteen seconds shows next to the sample the two signs with how often the cloth goes into each vat. Less motion: no wobbling, no fading.
 * Nothing is dyed or drawn by the app: every colour is a painted picture (cut from one painted sheet). Stars: `osterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { dyeDip, dyeMatches } from '@/utils/paulusNeuB'
import type { DyeColour, DyeGame } from '@/utils/paulusNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: DyeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.orders.length, 0))

const IDLE_SECONDS = 15
const VATS = ['red', 'blue'] as const
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const oi = ref(0)
const order = computed(() => current.value.orders[Math.min(oi.value, current.value.orders.length - 1)]!)
const colour = ref<DyeColour>({ red: 0, blue: 0 })
const chosen = ref<'red' | 'blue'>('red')
const wobble = ref<'red' | 'blue' | null>(null)
const dipping = ref<'red' | 'blue' | null>(null)
const happy = ref(false)
const helping = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const customer = computed(() => props.game.customers[order.value.customer]!)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad') {
  mark.value = kind
  later(() => {
    if (mark.value === kind) mark.value = null
  }, 900)
}

function tick() {
  if (finished.value) return
  later(tick, 250)
  if (!between.value) idle.value += 0.25
}
later(tick, 250)

function dip(vat: 'red' | 'blue') {
  if (between.value || finished.value || dipping.value) return
  idle.value = 0
  chosen.value = vat
  const r = dyeDip(colour.value, vat, props.game.maxDips)
  if (r.full) {
    wobble.value = vat
    later(() => (wobble.value = null), 600)
    say(t('app.adventure.dyeFull'), 2200)
    return
  }
  dipping.value = vat
  play('snap')
  later(
    () => {
      colour.value = r.colour
      dipping.value = null
      say(t('app.adventure.dyeDipped'), 1600)
    },
    still ? 50 : 500
  )
}

function finish() {
  if (between.value || finished.value || dipping.value) return
  idle.value = 0
  if (colour.value.red === 0 && colour.value.blue === 0) {
    say(t('app.adventure.dyeEmpty'), 2400)
    return
  }
  if (!dyeMatches(colour.value, order.value)) {
    mistakes.value++
    play('wrong')
    flash('bad')
    say(t('app.adventure.dyeWrong'), 2400)
    between.value = true
    later(() => {
      colour.value = { red: 0, blue: 0 }
      between.value = false
      say(t('app.adventure.dyeNew'), 2000)
    }, 1200)
    return
  }
  progress.mark()
  play('right')
  flash('good')
  happy.value = true
  helping.value = false
  between.value = true
  say(t('app.adventure.dyeRight'), 2000)
  later(() => {
    happy.value = false
    colour.value = { red: 0, blue: 0 }
    if (oi.value < current.value.orders.length - 1) {
      oi.value++
      between.value = false
      idle.value = 0
      return
    }
    say(t('app.adventure.dyeAll'), 0)
    if (lastRound.value) {
      later(() => {
        play('star')
        finished.value = true
      }, 1800)
      return
    }
    later(() => say(t('app.adventure.gameNext'), 0), 900)
    later(() => {
      round.value++
      oi.value = 0
      between.value = false
      idle.value = 0
      message.value = ''
    }, 2400)
  }, 1800)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    chosen.value = e.key === 'ArrowLeft' ? 'red' : 'blue'
    say(t(chosen.value === 'red' ? 'app.adventure.dyeRed' : 'app.adventure.dyeBlue'), 2000)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    dip(chosen.value)
  }
}

/** "Help me": the signs with how often the cloth goes into each vat. */
function helpMe() {
  idle.value = 0
  helping.value = true
  say(t('app.adventure.dyeHelpSay'), 4000)
}

const clothPic = computed(() => props.game.cloths[colour.value.red]?.[colour.value.blue] ?? '')
const samplePic = computed(() => props.game.samples[order.value.red]?.[order.value.blue] ?? '')
const spot = (s: { x: number; y: number; w: number }) => ({ left: `${s.x}%`, bottom: `${100 - s.y}%`, width: `${s.w}%` })
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      p(class="gm-count") {{ t('app.adventure.dyeCount', { n: oi + (happy ? 1 : 0), total: current.orders.length }) }}
      div(
        class="gm-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.dyeField')"
        :style="{ backgroundImage: `url(${src(game.yard)})` }"
        @keydown="onKey"
      )
        button(
          v-for="v in VATS"
          :key="v"
          type="button"
          class="gm-vat"
          :class="{ chosen: chosen === v, wobble: wobble === v, dipping: dipping === v }"
          :data-vat="v"
          :style="spot(game.vats[v])"
          :aria-label="t(v === 'red' ? 'app.adventure.dyeRed' : 'app.adventure.dyeBlue')"
          @click="dip(v)"
        )
          span(class="gm-sign")
            GameImage(:src="game.signs[v]" :ratio="1" colour="#d8c8b0" :label="`zeichen-${v === 'red' ? 'rot' : 'blau'}`")
        div(class="gm-customer" :style="spot(game.customer)" role="img" :aria-label="t('app.adventure.dyeSample', { name: customer.name })")
          GameImage(:src="happy ? customer.happy : customer.image" :ratio="240 / 360" colour="#a88a6a" :label="`kunde-${order.customer + 1}`")
          span(class="gm-sample" :data-sample="`${order.red}-${order.blue}`")
            GameImage(:src="samplePic" :ratio="1" colour="#7a3a6a" :label="`muster-r${order.red}b${order.blue}`")
          span(v-if="helping" class="gm-recipe" role="group" :aria-label="t('app.adventure.dyeHelpSay')")
            span(class="gm-step")
              GameImage(:src="game.signs.red" :ratio="1" colour="#d8c8b0" label="zeichen-rot")
              span {{ t('app.adventure.dyeTimes', { n: order.red }) }}
            span(class="gm-step")
              GameImage(:src="game.signs.blue" :ratio="1" colour="#d8c8b0" label="zeichen-blau")
              span {{ t('app.adventure.dyeTimes', { n: order.blue }) }}
        div(class="gm-cloth" :style="spot(game.cloth)" role="img" :aria-label="t('app.adventure.dyeCloth', { red: colour.red, blue: colour.blue })" :data-colour="`${colour.red}-${colour.blue}`")
          GameImage(:src="clothPic" :ratio="1" colour="#f4efe6" :label="`tuch-r${colour.red}b${colour.blue}`")
          span(v-if="mark" class="gm-mark")
            GameMark(:kind="mark")
      div(class="gm-buttons")
        AdvButton(tone="gold" :disabled="between" @click="finish")
          span(class="gm-peg")
            GameImage(:src="game.peg" :ratio="1" colour="#c9a46a" label="knopf-fertig")
          | {{ t('app.adventure.dyeFinish') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping" tone="blau" @click="helpMe") {{ t('app.adventure.dyeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.dyeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.gm-hint, .gm-count
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c49a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the vat itself is painted on the yard; the button lies over it, with its sign as its mark
.gm-vat
  position: absolute
  display: flex
  align-items: flex-end
  justify-content: center
  min-width: 44px
  min-height: 44px
  aspect-ratio: 1.3
  padding: 0
  border: 3px solid transparent
  border-radius: 40%
  background: none
  transform: translateX(-50%)
  cursor: pointer

  &.chosen, &:focus-visible
    border-color: #fff6dc

  &.wobble
    animation: gm-wobble 300ms ease-in-out 2

  &.dipping
    border-style: dashed

.gm-sign
  display: block
  width: 42%
  margin-bottom: -8%
  padding: 3px
  border-radius: 50%
  background: rgba(255, 246, 220, 0.9)

.gm-customer
  position: absolute
  transform: translateX(-50%)
  pointer-events: none

.gm-sample
  position: absolute
  left: -38%
  top: 22%
  width: 46%
  padding: 3px
  border-radius: 10px
  background: rgba(255, 246, 220, 0.94)

.gm-recipe
  position: absolute
  left: -42%
  top: 62%
  display: flex
  flex-direction: column
  gap: 3px
  width: 54%

.gm-step
  display: flex
  align-items: center
  gap: 3px
  padding: 2px 4px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.96)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

  :deep(.gi)
    width: 26px
    flex: 0 0 26px

.gm-cloth
  position: absolute
  transform: translateX(-50%)
  pointer-events: none
  transition: opacity 300ms ease

.gm-mark
  position: absolute
  top: 0
  right: -16px
  display: block

.gm-buttons
  display: flex
  justify-content: center

.gm-peg
  display: inline-block
  width: 28px
  margin-right: 6px
  vertical-align: middle

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

@keyframes gm-wobble
  0%, 100%
    margin-left: 0
  30%
    margin-left: -5px
  70%
    margin-left: 5px

.still .gm-vat.wobble
  animation: none

@media (prefers-reduced-motion: reduce)
  .gm-vat.wobble
    animation: none
  .gm-cloth
    transition: none
</style>
