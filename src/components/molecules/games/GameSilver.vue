<script setup lang="ts">
/**
 * Pay exactly: at the gate of the city lies a cloth, below it lie heaps of silver of three sizes; on each the app writes its worth. The price is called ("four hundred"). The child
 * drags pieces onto the cloth (or taps a piece and then the cloth); a tap on a piece on the cloth takes it back. "Pay" checks: exactly the price is right (green, a tick, the purse is
 * given away); too little or too much is a cross with one friendly sentence, the pieces stay where they are, and it counts as a mistake. In round 1 the sum on the cloth is shown, in
 * round 2 the child reckons it alone. There is no clock. The arithmetic is `total`, `isExact` in `utils/abrahamGames.ts`. From the keyboard: Enter puts a piece on the cloth or takes
 * it back, the key B pays.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { isExact, total } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SilverGame, SilverPiece } from '@/types/adventure'

const props = defineProps<{ game: SilverGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every round has to be paid
progress.setGoal(props.game.rounds.length)

/** The size of a heap in the picture: small (up to 50), middle (up to 125) or big; the width on the screen and the shape of the picture file. */
const SIZES = [
  { upTo: 50, width: 68, ratio: 110 / 70 },
  { upTo: 125, width: 92, ratio: 150 / 90 },
  { upTo: Infinity, width: 118, ratio: 200 / 120 }
]
const sizeOf = (value: number) => SIZES.find((s) => value <= s.upTo)!

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const piecesOf = computed<SilverPiece[]>(() => current.value.pieces.map((id) => props.game.pieces.find((p) => p.id === id)).filter((p): p is SilverPiece => !!p))
/** The pieces that lie on the cloth, in the order they were laid. */
const onCloth = ref<string[]>([])
const inTray = computed(() => piecesOf.value.filter((p) => !onCloth.value.includes(p.id)))
const laid = computed(() => onCloth.value.map((id) => piecesOf.value.find((p) => p.id === id)).filter((p): p is SilverPiece => !!p))
const sum = computed(() => total(laid.value.map((p) => p.value)))
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const paid = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))
const src = (p: string) => prependBaseUrl(p)

function lay(id: string) {
  if (between.value || finished.value || onCloth.value.includes(id)) return
  onCloth.value = [...onCloth.value, id]
  message.value = ''
  play('tap')
}
function back(id: string) {
  if (between.value || finished.value) return
  onCloth.value = onCloth.value.filter((x) => x !== id)
  message.value = ''
  play('tap')
}

function pay() {
  if (between.value || finished.value) return
  if (!laid.value.length) {
    message.value = t('app.adventure.silverEmpty')
    return
  }
  const values = laid.value.map((p) => p.value)
  if (isExact(values, current.value.price)) {
    paid.value = true
    flash.value = 'good'
    message.value = t('app.adventure.silverRight')
    progress.mark()
    play('star')
    roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  flash.value = 'bad'
  message.value = sum.value < current.value.price ? t('app.adventure.silverLess') : t('app.adventure.silverMore')
  later(() => {
    if (flash.value === 'bad') flash.value = null
  }, 900)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1200)
    return
  }
  between.value = true
  later(() => {
    round.value++
    onCloth.value = []
    paid.value = false
    flash.value = null
    between.value = false
    message.value = ''
  }, 1800)
}

function key(e: KeyboardEvent) {
  if (e.key === 'b' || e.key === 'B') {
    e.preventDefault()
    pay()
  }
}

const { dragging, selected, down, tapPlace, dragStyle } = useDragDrop((id) => lay(id))
const label = (p: SilverPiece) => t('app.adventure.silverPiece', { n: p.value })
</script>

<template lang="pug">
  div(class="sv" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sv-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sv-hint") {{ current.hint }}
      div(class="sv-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="sv-price")
          span(class="sv-purse" :class="{ gone: paid }")
            GameImage(:src="game.purse" colour="#a9825a" round)
          span(class="sv-price-text") {{ t('app.adventure.silverPrice', { n: current.price }) }}
        p(v-if="current.showSum" class="sv-sum" role="status") {{ t('app.adventure.silverSum', { n: sum }) }}
        div(
          class="sv-cloth"
          :class="{ ready: selected !== null, 'flash-good': flash === 'good', 'flash-bad': flash === 'bad' }"
          data-drop="cloth"
          role="group"
          :aria-label="t('app.adventure.silverCloth', { n: laid.length })"
          @click="tapPlace('cloth')"
        )
          GameImage(:src="game.cloth" :ratio="720 / 300" colour="#efe6cc" class="sv-cloth-img")
          div(class="sv-laid")
            div(
              v-for="p in laid"
              :key="p.id"
              class="sv-piece on"
              :style="{ width: `${sizeOf(p.value).width}px` }"
              role="button"
              tabindex="0"
              :aria-label="label(p)"
              @click.stop="back(p.id)"
              @keydown.enter.space.prevent.stop="back(p.id)"
            )
              GameImage(:src="p.image" :ratio="sizeOf(p.value).ratio" colour="#c3c9d2")
              span(class="sv-value") {{ p.value }}
          GameMark(v-if="flash" :kind="flash" class="sv-mark")
      p(class="sv-fb" role="status") {{ message }}
      div(class="sv-tray" role="group" :aria-label="t('app.adventure.silverTray')")
        div(
          v-for="p in inTray"
          :key="p.id"
          class="sv-piece"
          :class="{ chosen: selected === p.id, lifted: dragging === p.id }"
          :style="{ width: `${sizeOf(p.value).width}px`, ...dragStyle(p.id) }"
          role="button"
          tabindex="0"
          :aria-label="label(p)"
          @pointerdown="down($event, p.id)"
          @keydown.enter.space.prevent="lay(p.id)"
        )
          GameImage(:src="p.image" :ratio="sizeOf(p.value).ratio" colour="#c3c9d2")
          span(class="sv-value") {{ p.value }}
      AdvButton(tone="gold" class="sv-pay" :disabled="between" @click="pay") {{ t('app.adventure.silverPay') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.silverDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sv
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sv-round
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

.sv-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sv-field
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  padding: 10px 8px 14px
  min-height: 230px
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdbf95
  background-size: cover
  background-position: center

.sv-price
  display: flex
  align-items: center
  gap: 10px
  padding: 4px 14px 4px 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)

.sv-purse
  display: block
  width: 44px
  transition: opacity 600ms ease, transform 600ms ease

  &.gone
    opacity: 0
    transform: translateX(40px)

.sv-price-text
  font-weight: 800
  font-size: 1.1rem
  color: #3f321b

.sv-sum
  margin: 0
  padding: 2px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.sv-cloth
  position: relative
  width: 100%
  max-width: 420px
  min-height: 140px
  cursor: pointer

  &.ready
    filter: drop-shadow(0 0 6px rgba(255, 214, 90, 0.95))

  &.flash-good
    filter: drop-shadow(0 0 8px rgba(60, 160, 70, 0.95))

  &.flash-bad
    filter: drop-shadow(0 0 8px rgba(200, 50, 50, 0.95))

.sv-cloth-img
  position: absolute
  inset: 0

.sv-laid
  position: relative
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 6px
  min-height: 140px
  padding: 18px 22px

.sv-mark
  position: absolute
  top: -10px
  right: -6px

.sv-fb
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

.sv-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 10px
  min-height: 80px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.sv-piece
  position: relative
  padding: 3px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.on
    background: transparent
    border-color: transparent
    cursor: pointer

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

// the worth is written by the app on the heap
.sv-value
  position: absolute
  left: 50%
  top: 50%
  transform: translate(-50%, -50%)
  padding: 0 6px
  border-radius: 8px
  background: rgba(255, 252, 235, 0.85)
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  pointer-events: none

.sv-pay
  align-self: center
  min-height: 56px
</style>
