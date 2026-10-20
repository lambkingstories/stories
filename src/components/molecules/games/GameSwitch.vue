<script setup lang="ts">
/**
 * Who goes home? Seen from above, the path forks: to the left lies the camp (tents), to the right the way home (houses). The men come down the path one after the other and stop at the fork; over
 * the front man a bubble shows what he wants: a house (he wants to go home) or a horn (he stays). The child sets the switch: the left lever sends him into the camp, the right lever sends him home
 * (also the arrow keys). The right way: the man walks off (a tick, soft steps). The wrong way: he shakes his head kindly and stays (a cross, a dull sound, a mistake). The signs are only an aid of
 * the game, nobody is shown up as afraid. Round 1: six men, the bubble stays. Round 2: eight men, two wait in a short queue, the bubble goes away after two seconds; a tap on the man shows it again
 * (no penalty). The men wait as long as they like. The way is `route` in `utils/gideonGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { route, type Lever } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SwitchGame } from '@/types/adventure'

const props = defineProps<{ game: SwitchGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every man of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.men.length, 0))

/** How long a man needs to walk off (ms), and stand-in colours of the three men. */
const WALK_MS = 700
const COLOURS = ['#a9774e', '#7f8f5f', '#b99a58']

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
/** The number of the man at the fork, and who has left (walking off counts as left). */
const front = ref(0)
const walking = ref<{ n: number; dir: Lever } | null>(null)
const showBubble = ref(true)
const shaking = ref(false)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const total = computed(() => current.value.men.length)
const waiting = computed(() => Array.from({ length: current.value.queue }, (_, k) => front.value + k).filter((n) => n < total.value))
const manOf = (n: number) => props.game.men[n % props.game.men.length]
const wants = (n: number) => current.value.men[n]

let hideTimer = 0
function bubbleShown() {
  showBubble.value = true
  const ms = current.value.hideBubbleMs
  window.clearTimeout(hideTimer)
  if (ms) hideTimer = window.setTimeout(() => (showBubble.value = false), ms)
}
bubbleShown()
onBeforeUnmount(() => window.clearTimeout(hideTimer))

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 800)
}

function set(lever: Lever) {
  if (between.value || finished.value || walking.value || front.value >= total.value) return
  const n = front.value
  if (route(wants(n)!, lever)) {
    walking.value = { n, dir: lever }
    progress.mark()
    play('caravan')
    message.value = ''
    flashOn('good')
    later(() => {
      walking.value = null
      front.value++
      if (front.value >= total.value) roundOver()
      else bubbleShown()
    }, WALK_MS)
    return
  }
  mistakes.value++
  play('wrong')
  flashOn('bad')
  shaking.value = true
  later(() => {
    shaking.value = false
  }, 600)
  message.value = t('app.adventure.switchWrong')
}

function roundOver() {
  window.clearTimeout(hideTimer)
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 800)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    front.value = 0
    between.value = false
    message.value = ''
    bubbleShown()
  }, 1700)
}

function key(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') set('left')
  else if (e.key === 'ArrowRight') set('right')
  else return
  e.preventDefault()
}

const fork = computed(() => props.game.fork)
/** Where a man stands: the front man at the fork, the one behind a little further up the path; a man who walks off goes to the left or to the right. */
function manStyle(n: number) {
  const k = n - front.value
  const w = walking.value
  const base = { left: `${fork.value[0]}%`, top: `${fork.value[1] - k * 13}%`, width: `${manOf(n)?.w ?? 14}%` }
  if (w && w.n === n) return { ...base, left: `${fork.value[0] + (w.dir === 'left' ? -34 : 34)}%`, top: `${fork.value[1] + 10}%` }
  return base
}
const bubbleImage = (n: number) => (wants(n) === 'home' ? props.game.bubbleHome : props.game.bubbleHorn)
const bubbleLabel = (n: number) => t(wants(n) === 'home' ? 'app.adventure.switchBubbleHome' : 'app.adventure.switchBubbleHorn')
</script>

<template lang="pug">
  div(class="sw" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sw-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="sw-field" role="group" :aria-label="t('app.adventure.switchField', { n: front, total })" :style="{ backgroundImage: `url(${src(game.background)})` }")
        template(v-if="!between")
          div(
            v-for="n in waiting"
            :key="`${round}-${n}`"
            class="sw-man"
            :class="{ shake: shaking && n === front, away: walking && walking.n === n, left: walking && walking.n === n && walking.dir === 'left', right: walking && walking.n === n && walking.dir === 'right' }"
            :style="manStyle(n)"
            role="button"
            tabindex="0"
            :aria-label="n === front && showBubble ? bubbleLabel(n) : t('app.adventure.switchMan')"
            @click="n === front && bubbleShown()"
            @keydown.enter.space.prevent="n === front && bubbleShown()"
          )
            GameImage(:src="manOf(n)?.image ?? ''" :ratio="140 / 220" :colour="COLOURS[n % COLOURS.length]")
            span(v-if="n === front && showBubble && !walking" class="sw-bubble")
              GameImage(:src="bubbleImage(n)" :colour="wants(n) === 'home' ? '#f3c94a' : '#c9d6e8'" round)
        GameMark(v-if="flash" :kind="flash" class="sw-mark")
      p(class="sw-fb" role="status") {{ message }}
      div(class="sw-levers")
        button(type="button" class="sw-lever" :disabled="between || !!walking" @click="set('left')")
          GameImage(:src="game.leverLeft" colour="#a9774e" round class="sw-lever-img")
          span {{ t('app.adventure.switchLeft') }}
        button(type="button" class="sw-lever" :disabled="between || !!walking" @click="set('right')")
          GameImage(:src="game.leverRight" colour="#7f8f5f" round class="sw-lever-img")
          span {{ t('app.adventure.switchRight') }}
      p(class="sw-count") {{ t('app.adventure.switchCount', { n: front, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.switchDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.sw-round
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

.sw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sw-field
  position: relative
  width: 100%
  max-width: 380px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c4b58a
  background-size: cover
  background-position: center

// a man stands with his feet at the place; walking off, he slides to the left or the right
.sw-man
  position: absolute
  transform: translate(-50%, -100%)
  cursor: pointer
  transition: left 650ms ease-in, top 650ms ease-in, opacity 650ms ease-in
  z-index: 3

  &.away
    opacity: 0.1

  &.shake
    animation: sw-shake 500ms ease-in-out

.sw-bubble
  position: absolute
  left: 50%
  bottom: 100%
  display: block
  width: 82%
  transform: translateX(-50%)
  pointer-events: none

.sw-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 6

.sw-fb
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

// the two levers of the switch: big, side by side, a thumb each
.sw-levers
  display: flex
  gap: 10px
  justify-content: center

.sw-lever
  flex: 1
  max-width: 190px
  min-height: 80px
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 6px 8px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #fff3cf
  color: #3f321b
  font-family: inherit
  font-weight: 800
  font-size: 1rem
  cursor: pointer
  touch-action: manipulation

  &:disabled
    opacity: 0.6

.sw-lever-img
  width: 44px

.sw-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes sw-shake
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(calc(-50% - 6px), -100%)
  75%
    transform: translate(calc(-50% + 6px), -100%)

@media (prefers-reduced-motion: reduce)
  .sw-man
    transition: none

    &.shake
      animation: none
</style>
