<script setup lang="ts">
/**
 * Load the camels: a camel stands in the morning light and two baskets hang at its sides. Packs lie below: sacks and water skins in three weights (the weight is
 * shown as dots on the pack). The child taps a pack and then a basket (or taps a pack in a basket to take it out again). The camel leans to the heavier side; when
 * all the packs are in the baskets and both sides weigh the same, it stands straight (a tick) and the next camel comes. Nothing is lost and there is no clock;
 * a camel that is not even yet only leans on, in a friendly way. "Tip" lets one pack blink and says which basket it belongs in (the tip counts, `mistakeStars`).
 * Two camels in each of two rounds; every camel can be balanced (the data is tested). The arithmetic is in `utils/abrahamGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { isBalanced, tip, type Side } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BalanceGame, BalancePack } from '@/types/adventure'

const props = defineProps<{ game: BalanceGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every camel of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.camels.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const camelNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const camel = computed(() => current.value.camels[Math.min(camelNo.value, current.value.camels.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const lastCamel = computed(() => camelNo.value >= current.value.camels.length - 1)

const packOf = (id: string) => props.game.packs.find((p) => p.id === id)
/** The packs of this camel, in the order of the data. */
const packs = computed<BalancePack[]>(() => camel.value.packs.map(packOf).filter((p): p is BalancePack => !!p))
/** Where every pack lies: in the left basket, in the right basket, or still on the ground (`null`). */
const sides = reactive<Record<string, Side | null>>({})
function resetSides() {
  for (const k of Object.keys(sides)) delete sides[k]
  for (const p of packs.value) sides[p.id] = null
}
resetSides()

const selected = ref<string | null>(null)
const tipFor = ref<{ id: string; side: Side } | null>(null)
const hints = ref(0)
const between = ref(false)
const finished = ref(false)
const done = ref(false)
const message = ref('')
const flash = ref<'good' | null>(null)
const stars = computed(() => mistakeStars(hints.value, 0, 2))

const inBasket = (side: string) => packs.value.filter((p) => sides[p.id] === side)
const onGround = computed(() => packs.value.filter((p) => !sides[p.id]))
const weightOf = (side: string) => inBasket(side).reduce((n, p) => n + p.weight, 0)
const allPlaced = computed(() => packs.value.length > 0 && onGround.value.length === 0)
/** The camel leans to the heavier side: a few degrees for every unit of difference, never more than a gentle lean. */
const lean = computed(() => Math.max(-9, Math.min(9, (weightOf('right') - weightOf('left')) * 3)))
const baskets = computed(() => props.game.baskets ?? [[27, 50], [73, 50]])
const src = (p: string) => prependBaseUrl(p)

function pickPack(id: string) {
  if (done.value || between.value || finished.value) return
  tipFor.value = null
  if (sides[id]) {
    // a pack in a basket goes back to the ground
    sides[id] = null
    selected.value = null
    message.value = ''
    play('tap')
    return
  }
  selected.value = selected.value === id ? null : id
  message.value = ''
  play('tap')
}

function putIn(side: string) {
  if (done.value || between.value || finished.value) return
  const id = selected.value
  if (!id) {
    message.value = t('app.adventure.balancePickFirst')
    return
  }
  sides[id] = side === 'left' ? 'left' : 'right'
  selected.value = null
  tipFor.value = null
  play('sack')
  check()
}

function check() {
  if (!allPlaced.value) {
    message.value = ''
    return
  }
  if (isBalanced(inBasket('left').map((p) => p.weight), inBasket('right').map((p) => p.weight))) {
    done.value = true
    progress.mark()
    play('snap')
    flash.value = 'good'
    message.value = t('app.adventure.balanceStraight')
    later(() => (flash.value = null), 900)
    later(nextCamel, 1300)
  } else {
    message.value = t('app.adventure.balanceUneven')
  }
}

function nextCamel() {
  if (!lastCamel.value) {
    camelNo.value++
    reset()
    return
  }
  if (lastRound.value) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    camelNo.value = 0
    between.value = false
    reset()
  }, 1500)
}

function reset() {
  resetSides()
  selected.value = null
  tipFor.value = null
  done.value = false
  message.value = ''
}

/** "Tip": the pack that is not where it belongs blinks, and the line says which basket it goes in. */
function giveTip() {
  if (done.value || between.value || finished.value) return
  const t0 = tip(packs.value.map((p) => p.weight), packs.value.map((p) => sides[p.id] ?? null))
  if (!t0) return
  hints.value++
  const pack = packs.value[t0.index]!
  tipFor.value = { id: pack.id, side: t0.side }
  selected.value = null
  message.value = t('app.adventure.balanceTipText', { side: t(t0.side === 'left' ? 'app.adventure.balanceLeftDative' : 'app.adventure.balanceRightDative') })
  play('tap')
  later(() => {
    if (tipFor.value?.id === pack.id) tipFor.value = null
  }, 4000)
}

const dots = (p: BalancePack) => '●'.repeat(p.weight)
const basketStyle = (side: number) => {
  const b = baskets.value[side] ?? [50, 50]
  return { left: `${b[0]}%`, top: `${b[1]}%` }
}
const countDone = computed(() => rounds.value.slice(0, round.value).reduce((n, r) => n + r.camels.length, 0) + camelNo.value + (done.value ? 1 : 0))
const total = computed(() => rounds.value.reduce((n, r) => n + r.camels.length, 0))
</script>

<template lang="pug">
  div(class="bl")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="bl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="bl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="bl-field" role="group" :aria-label="t('app.adventure.balanceField')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="bl-camel" :class="{ straight: done }" :style="{ transform: `rotate(${done ? 0 : lean}deg)` }")
          img(:src="src(game.camel)" alt="" draggable="false" class="bl-body")
          button(
            v-for="(side, k) in ['left', 'right']"
            :key="side"
            type="button"
            class="bl-basket"
            :class="{ ready: !!selected, tip: tipFor?.side === side }"
            :style="basketStyle(k)"
            :disabled="done || between"
            :aria-label="t(side === 'left' ? 'app.adventure.balanceBasketLeft' : 'app.adventure.balanceBasketRight', { n: weightOf(side) })"
            @click="putIn(side)"
          )
            img(:src="src(game.basket)" alt="" draggable="false" class="bl-basket-img")
            span(class="bl-load" aria-hidden="true")
              img(v-for="p in inBasket(side)" :key="p.id" :src="src(p.image)" alt="" draggable="false" :class="`w${p.weight}`")
        GameMark(v-if="flash" kind="good" class="bl-mark")
      p(class="bl-fb" role="status") {{ message }}
      div(class="bl-tray" role="group" :aria-label="t('app.adventure.balanceTray')")
        button(
          v-for="p in packs"
          :key="p.id"
          type="button"
          class="bl-pack"
          :class="[`w${p.weight}`, { chosen: selected === p.id, away: !!sides[p.id], blink: tipFor?.id === p.id }]"
          :disabled="done || between"
          :aria-pressed="selected === p.id"
          :aria-label="t('app.adventure.balancePack', { name: p.label, n: p.weight })"
          @click="pickPack(p.id)"
        )
          img(:src="src(p.image)" alt="" draggable="false")
          span(class="bl-dots" aria-hidden="true") {{ dots(p) }}
      div(class="bl-actions")
        AdvButton(tone="blau" small :disabled="done || between" @click="giveTip") {{ t('app.adventure.balanceTip') }}
      p(class="bl-count") {{ t('app.adventure.balanceCount', { n: countDone, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.balanceFinished')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.bl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.bl-round
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

.bl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.bl-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center

// the camel and its two baskets lean together; they turn about the feet of the camel
.bl-camel
  position: absolute
  left: 22%
  bottom: 4%
  width: 56%
  transform-origin: 50% 100%
  transition: transform 500ms ease-in-out

.bl-body
  display: block
  width: 100%
  height: auto
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(60, 40, 10, 0.5))

// a basket hangs at the side of the camel: its top edge is at the place of the data
.bl-basket
  position: absolute
  width: 30%
  min-width: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translateX(-50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.ready
    filter: drop-shadow(0 0 8px rgba(255, 222, 120, 0.95))

  &.tip
    animation: bl-blink 700ms ease-in-out 4

.bl-basket-img
  display: block
  width: 100%
  height: auto
  pointer-events: none

// what lies in a basket: the packs sit in it, side by side
.bl-load
  position: absolute
  left: 6%
  right: 6%
  bottom: 38%
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-end
  gap: 2px
  pointer-events: none

  // the weight is told by the size of the picture: the three kinds are not drawn equally big
  img
    width: 30%
    height: auto

    &.w2
      width: 34%

    &.w3
      width: 44%

.bl-mark
  position: absolute
  top: 10px
  right: 12px

.bl-fb
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

.bl-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 84px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.bl-pack
  position: relative
  width: 56px
  min-height: 64px

  &.w2
    width: 62px

  &.w3
    width: 78px

  padding: 4px
  border: 2px solid rgba(150, 100, 30, 0.6)
  border-radius: 12px
  background: rgba(255, 246, 220, 0.85)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  // a pack that lies in a basket is only a faint place holder in the tray (it can be tapped there to take it out)
  &.away
    opacity: 0.4

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

  &.blink
    animation: bl-blink-pack 700ms ease-in-out 4

  &:disabled
    cursor: default

// the weight of a pack as dots
.bl-dots
  display: block
  text-align: center
  font-size: 0.8rem
  line-height: 1
  letter-spacing: 1px
  color: #5a3a12

.bl-actions
  display: flex
  justify-content: center

.bl-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes bl-blink
  0%, 100%
    transform: translateX(-50%) scale(1)
  50%
    transform: translateX(-50%) scale(1.07)

@keyframes bl-blink-pack
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.1)

@media (prefers-reduced-motion: reduce)
  .bl-camel
    transition: none

  .bl-basket.tip,
  .bl-pack.blink
    animation: none
</style>
