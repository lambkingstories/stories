<script setup lang="ts">
/**
 * "Carry it home" (Luke 15,5-6). The shepherd has found his sheep and carries it home on his shoulders. The pasture is seen from the side and moves past him; he walks by himself.
 * Rocks, brooks and thornbushes lie on the path: a tap (on the field or on the button "Jump", or Space, Enter, the up arrow key) makes him jump. When his feet touch an obstacle
 * he stumbles (a mistake: a cross and "Oops! The sheep holds on tight."), waits a moment and climbs over it. At the end the house stands with his friends and neighbours: the round is won.
 * Round 2 is quicker and has more obstacles, among them wider brooks (jump earlier). The button "Help me" comes after fifteen seconds and jumps over the next two obstacles.
 * The background repeats (every second copy mirrored). With reduced motion the figures do not sway. The arithmetic is `utils/gleichnisseNeu.ts`; stars: `osterStars(mistakes)`.
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
import { carryAutoJump, carryJump, carryLift, carryStart, carryStep } from '@/utils/gleichnisseNeu'
import type { CarryGame, CarryObstacle, CarryState } from '@/utils/gleichnisseNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: CarryGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.obstacles.length + 1, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const HELP_OBSTACLES = 2

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<CarryState>(carryStart())
const helpUntil = ref(-1)
const hitIndex = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let hitSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function arrive() {
  progress.mark()
  between.value = true
  helpUntil.value = -1
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.carryHomeArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    st.value = carryStart()
    hitIndex.value = -1
    helpUntil.value = -1
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function loop() {
  if (!finished.value && !between.value) {
    if (helpUntil.value >= 0) {
      if (st.value.passed >= helpUntil.value) helpUntil.value = -1
      else if (carryAutoJump(props.game, current.value, st.value)) st.value = carryJump(st.value)
    }
    const res = carryStep(props.game, current.value, st.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'hit') {
        mistakes.value++
        play('wrong')
        say(t('app.adventure.carryHomeHit'), 2600)
        hitIndex.value = ev.index
        const id = ++hitSeq
        later(() => {
          if (hitSeq === id) hitIndex.value = -1
        }, 1400)
      } else if (ev.type === 'passed') {
        progress.mark()
      } else if (ev.type === 'land') {
        play('tap')
      }
    }
    if (st.value.arrived) arrive()
    else if (helpUntil.value < 0) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function jump(e?: Event) {
  if (e && 'button' in e && (e as MouseEvent).button > 0) return
  if (finished.value || between.value) return
  e?.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  helpUntil.value = -1
  st.value = carryJump(st.value)
}
function onKey(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') jump(e)
}

function helpMe() {
  idle.value = 0
  helpUntil.value = st.value.passed + HELP_OBSTACLES
  say(t('app.adventure.carryHomeHelping'), 3200)
}

// ---- looks: the way moves past the shepherd (`camera` is how far the left edge of the field lies along the way)
const g = computed(() => props.game)
const camera = computed(() => st.value.d - g.value.heroAt)
const tiles = computed(() => {
  const first = Math.floor(camera.value / 100)
  return [first, first + 1].map((k) => ({ k, left: k * 100 - camera.value, mirror: Math.abs(k) % 2 === 1 }))
})
const lift = computed(() => carryLift(st.value, g.value.jump))
const heroStyle = computed(() => ({ left: `${g.value.heroAt}%`, top: `${g.value.road - lift.value * g.value.height}%`, width: `${g.value.hero.w}%`, zIndex: 30 }))
const onScreen = (x: number, w: number) => x + w / 2 > -2 && x - w / 2 < 102
const obstacleStyle = (o: CarryObstacle) => ({ left: `${o.at - camera.value}%`, top: `${g.value.road + (g.value.sink?.[o.kind] ?? 0)}%`, width: `${o.w}%`, zIndex: 20 })
const homeX = computed(() => current.value.home - camera.value)
const homeStyle = computed(() => ({ left: `${homeX.value}%`, top: `${g.value.road}%`, width: `${g.value.home.w}%`, zIndex: 10 }))
const walking = computed(() => !st.value.arrived && st.value.pause <= 0 && st.value.air === null && !between.value)
const passedCount = computed(() => st.value.passed)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.carryHomeField')"
        @pointerdown="jump($event)"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(v-for="tile in tiles" :key="tile.k" class="gm-tile" :class="{ mirror: tile.mirror }" :style="{ left: `${tile.left}%`, backgroundImage: `url(${prependBaseUrl(game.background)})` }" aria-hidden="true")
        div(v-if="onScreen(homeX, game.home.w)" class="gm-fig" :style="homeStyle" role="img" :aria-label="game.home.label")
          GameImage(:src="game.home.image" :ratio="1" colour="#b8a27a" :label="game.home.label")
          span(v-if="st.arrived" class="gm-mark")
            GameMark(kind="good")
        template(v-for="(o, k) in current.obstacles" :key="`o-${round}-${k}`")
          div(v-if="onScreen(o.at - camera, o.w)" class="gm-fig" :class="{ hit: hitIndex === k }" :style="obstacleStyle(o)" role="img" :aria-label="game.labels[o.kind]")
            GameImage(:src="game.sprites[o.kind]" :ratio="1" :colour="o.kind === 'brook' ? '#5a8fb8' : o.kind === 'thorn' ? '#5d6b3a' : '#9b9184'" :label="game.labels[o.kind]")
            span(v-if="hitIndex === k" class="gm-mark")
              GameMark(kind="bad")
        div(class="gm-fig gm-hero" :class="{ walking }" :style="heroStyle" role="img" :aria-label="game.hero.label")
          span(class="gm-bob")
            GameImage(:src="game.hero.image" :ratio="1" colour="#8a6a4a" :label="game.hero.label")
      button(type="button" class="gm-jump" :disabled="between" @pointerdown.stop="jump($event)" @keydown="onKey" @contextmenu.prevent) {{ t('app.adventure.carryHomeJump') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.carryHomeCount', { n: passedCount, total: current.obstacles.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpUntil < 0" tone="gold" @click="helpMe") {{ t('app.adventure.carryHomeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.carryHomeDone')" @next="emit('done', stars)")
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
  background-color: #a9b77a
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the pasture: one copy of the picture per field width, every second one mirrored (the edges meet)
.gm-tile
  position: absolute
  top: 0
  width: 100.4%
  height: 100%
  background-size: 100% 100%
  pointer-events: none

  &.mirror
    transform: scaleX(-1)

.gm-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))

  &.hit
    animation: gm-shake 500ms ease-in-out 2

.gm-bob
  display: block

.gm-hero.walking .gm-bob
  animation: gm-step 380ms ease-in-out infinite

.gm-mark
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-jump
  align-self: center
  min-width: 200px
  min-height: 56px
  padding: 8px 22px
  border-radius: 999px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1.1rem
  color: #4a3a18
  touch-action: none
  cursor: pointer

  &:disabled
    opacity: 0.5
    cursor: default

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

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3%

@keyframes gm-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -5deg
  75%
    rotate: 5deg

@media (prefers-reduced-motion: reduce)
  .gm-hero.walking .gm-bob, .gm-fig.hit
    animation: none
</style>
