<script setup lang="ts">
/**
 * "The wish cards" (1 Kings 3,5-14). At night in Gibeon God says to Solomon: "Ask what I shall give you." Picture cards float past through the night sky: riches, a long life, victory over the enemies and
 * a listening (obedient) heart. The child catches only the heart (a tap, or the arrow keys and Enter): it is what Solomon asked for. A tap on another card is a mistake (a cross and the word "Solomon did not ask
 * for that"); a card that floats away comes again in the next cycle. Round 2 is faster and wants more hearts. The button "Help me" comes after fifteen seconds: the cards float slowly for a while and the heart is shown.
 * With reduced motion the cards do not bob. The arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
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
import { WISH_CARD_RATIO, wishHint, wishShown, wishTap } from '@/utils/salomoNeu'
import type { WishGame, WishKind, WishShown } from '@/utils/salomoNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WishGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.need, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const HELP_SECONDS = 8
const SLOW = 0.45

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const time = ref(0)
const caught = ref(new Set<string>())
const wrongTapped = new Set<string>()
const flash = ref<{ key: string; kind: 'good' | 'bad' } | null>(null)
const hearts = ref(0)
const mistakes = ref(0)
const idle = ref(0)
const helpUntil = ref(-1)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const selected = ref(-1)
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let flashSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// a caught heart stays a moment (with its tick) before it is gone
const hidden = computed(() => {
  const f = flash.value
  if (!f || f.kind !== 'good') return caught.value
  const s = new Set(caught.value)
  s.delete(f.key)
  return s
})
const shown = computed<WishShown[]>(() => wishShown(props.game, current.value, time.value, hidden.value).sort((a, b) => a.x - b.x))
const helped = computed(() => (helpUntil.value >= 0 ? wishHint(shown.value) : null))

function loop() {
  if (!finished.value && !between.value) {
    const slow = helpUntil.value >= 0 && time.value < helpUntil.value
    if (helpUntil.value >= 0 && !slow) helpUntil.value = -1
    time.value += TICK * (slow ? SLOW : 1)
    if (!slow) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function blink(key: string, kind: 'good' | 'bad') {
  const id = ++flashSeq
  flash.value = { key, kind }
  later(() => {
    if (flashSeq === id) flash.value = null
  }, 900)
}

const WRONG_KEY: Record<Exclude<WishKind, 'heart'>, string> = { riches: 'wishCardsRiches', life: 'wishCardsLife', victory: 'wishCardsVictory' }

function tapCard(s: WishShown, e?: Event) {
  if (e && 'button' in e && (e as MouseEvent).button > 0) return
  e?.preventDefault()
  if (finished.value || between.value || caught.value.has(s.key)) return
  idle.value = 0
  if (wishTap(s.kind) === 'catch') {
    caught.value = new Set([...caught.value, s.key])
    hearts.value++
    progress.mark()
    play('right')
    blink(s.key, 'good')
    helpUntil.value = -1
    if (hearts.value >= current.value.need) roundDone()
    else say(t('app.adventure.wishCardsCaught', { n: hearts.value, total: current.value.need }))
    return
  }
  if (wrongTapped.has(s.key)) return
  wrongTapped.add(s.key)
  mistakes.value++
  play('wrong')
  blink(s.key, 'bad')
  say(t(`app.adventure.${WRONG_KEY[s.kind as Exclude<WishKind, 'heart'>]}`))
}

function roundDone() {
  between.value = true
  helpUntil.value = -1
  later(() => play('bead'), 160)
  say(t('app.adventure.wishCardsRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    time.value = 0
    caught.value = new Set()
    wrongTapped.clear()
    hearts.value = 0
    idle.value = 0
    selected.value = -1
    between.value = false
    message.value = ''
  }, 3000)
}

function onKey(e: KeyboardEvent) {
  const list = shown.value
  if (!list.length) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    selected.value = (selected.value + 1) % list.length
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    selected.value = (selected.value - 1 + list.length) % list.length
  } else if (e.key === 'Enter' || e.key === ' ') {
    const s = list[Math.max(0, Math.min(selected.value, list.length - 1))]
    if (s) tapCard(s, e)
  }
}

function helpMe() {
  idle.value = 0
  helpUntil.value = time.value + HELP_SECONDS * SLOW
  say(t('app.adventure.wishCardsHelping'), 3600)
}

const cardStyle = (s: WishShown) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${props.game.cardW}%` })
const label = (k: WishKind) => props.game.cards[k].label
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.wishCardsField')"
        @keydown="onKey"
        @contextmenu.prevent
      )
        button(
          v-for="(s, i) in shown"
          :key="s.key"
          type="button"
          class="gm-card"
          :class="{ sel: selected === i, helped: helped && helped.key === s.key, good: flash && flash.key === s.key && flash.kind === 'good', bad: flash && flash.key === s.key && flash.kind === 'bad' }"
          :style="cardStyle(s)"
          :aria-label="label(s.kind)"
          tabindex="-1"
          @pointerdown="tapCard(s, $event)"
        )
          span(class="gm-bob")
            GameImage(:src="game.cards[s.kind].image" :ratio="WISH_CARD_RATIO" :colour="s.kind === 'heart' ? '#c9535a' : '#d8c08a'" :label="label(s.kind)")
          span(v-if="flash && flash.key === s.key" class="gm-mark")
            GameMark(:kind="flash.kind")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.wishCardsCount', { n: hearts, total: current.need }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpUntil < 0" tone="gold" @click="helpMe") {{ t('app.adventure.wishCardsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wishCardsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
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
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1d2a4a
  background-size: 100% 100%
  touch-action: none
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-card
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  background: none
  transform: translate(-50%, -50%)
  cursor: pointer
  touch-action: none
  filter: drop-shadow(0 4px 6px rgba(0, 0, 20, 0.45))

  &.sel
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  &.helped
    outline: 4px solid #ffd76a
    outline-offset: 3px
    border-radius: 10px
    animation: gm-pulse 900ms ease-in-out infinite

  &.bad .gm-bob
    animation: gm-shake 450ms ease-in-out 2

  &.good
    transition: transform 600ms ease-in, opacity 600ms ease-in
    opacity: 0.4
    transform: translate(-50%, -50%) scale(1.25)

.gm-bob
  display: block
  animation: gm-float 2400ms ease-in-out infinite

.gm-mark
  position: absolute
  left: 50%
  top: 45%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

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

@keyframes gm-float
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -4%

@keyframes gm-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -6deg
  75%
    rotate: 6deg

@keyframes gm-pulse
  0%, 100%
    outline-color: #ffd76a
  50%
    outline-color: #fff6dc

@media (prefers-reduced-motion: reduce)
  .gm-bob, .gm-card.bad .gm-bob, .gm-card.helped
    animation: none
  .gm-card.good
    transition: none
</style>
