<script setup lang="ts">
/**
 * Up the tree (Luke 19,4). The sycomore tree stands upright (3:4); Zacchaeus waits at the foot of the trunk. On every height two branches grow from the trunk, one to the left and one to the right:
 * a thick green one with leaves (it carries) and a thin dry one with a bend. A tap on the strong branch lets Zacchaeus climb onto it and the next height shows; a tap on the weak one makes it creak and wobble,
 * Zacchaeus holds on and stays where he is (no fall), a cross and a word: a mistake without loss (each height counts once). At the top the view down the road shows, the round is done.
 * Round 1 has three heights, round 2 four. The branches are buttons (at least 44 pixels), so the keyboard works, too; nothing is shown by colour alone (cross, tick, words).
 * The branch pictures are painted growing to the right from the trunk; on the left they are mirrored. Stars: `zachaeusStars(mistakes, rounds)` in `utils/zachaeusGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { climbAtTop, climbBranchX, climbJudge, climbSpot, zachaeusStars } from '@/utils/zachaeusGames'
import type { Side } from '@/utils/zachaeusGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ClimbGame } from '@/types/adventure'

const props = defineProps<{ game: ClimbGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every height of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.levels.length, 0))

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** How many heights of this round Zacchaeus has climbed. */
const climbed = ref(0)
/** The heights of this round on which the weak branch was tapped (each counts once). */
const wrongLevels = ref<number[]>([])
const creak = ref<{ level: number; n: number } | null>(null)
const atTop = ref(false)
const solved = ref(0)
const mistakes = ref(0)
const finished = ref(false)
const busy = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => zachaeusStars(mistakes.value, props.game.rounds.length))
const total = computed(() => current.value.levels.length)
const spot = computed(() => climbSpot(props.game, current.value, climbed.value))
const climberStyle = computed(() => ({ left: `${spot.value.x}%`, top: `${spot.value.y}%`, width: `${props.game.climber.w}%` }))
const sides: Side[] = ['l', 'r']

/** The branches that are drawn: the strong ones that were climbed already, and both of the height that comes next. */
const shown = computed(() => current.value.levels.flatMap((lv, i) => (i < climbed.value ? [{ level: i, side: lv.strong, strong: true, open: false }] : i === climbed.value && !atTop.value ? sides.map((s) => ({ level: i, side: s, strong: s === lv.strong, open: true })) : [])))
const branchStyle = (level: number, side: Side) => ({ left: `${climbBranchX(props.game, side)}%`, top: `${current.value.levels[level]!.y}%`, width: `${props.game.strong.w}%` })
const branchLabel = (level: number, side: Side) => t(side === 'l' ? 'app.adventure.climbBranchL' : 'app.adventure.climbBranchR', { n: level + 1 })

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The round is solved: then the next round or the end. */
function solve() {
  solved.value++
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    climbed.value = 0
    wrongLevels.value = []
    creak.value = null
    atTop.value = false
    busy.value = false
    message.value = ''
  }, 2800)
}

function tap(level: number, side: Side) {
  if (busy.value || atTop.value || finished.value || level !== climbed.value) return
  const lv = current.value.levels[level]!
  if (climbJudge(lv.strong, side) === 'creak') {
    if (!wrongLevels.value.includes(level)) {
      wrongLevels.value = [...wrongLevels.value, level]
      mistakes.value++
    }
    creak.value = { level, n: (creak.value?.n ?? 0) + 1 }
    play('wrong')
    say(t('app.adventure.climbCreak'))
    return
  }
  climbed.value++
  creak.value = null
  progress.mark()
  play('snap')
  if (climbAtTop(current.value, climbed.value)) {
    busy.value = true
    play('right')
    later(() => {
      atTop.value = true
      say(t('app.adventure.climbTop'), 0)
    }, 600)
    solve()
    return
  }
  say(t('app.adventure.climbUp'), 1400)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-tree"
        :style="{ backgroundImage: `url(${src(game.tree)})` }"
        role="group"
        :aria-label="t('app.adventure.climbField')"
      )
        template(v-for="b in shown" :key="`${round}-${b.level}-${b.side}`")
          button(
            v-if="b.open"
            type="button"
            class="gm-branch"
            :class="[b.side, { creak: creak && creak.level === b.level && !b.strong }]"
            :style="branchStyle(b.level, b.side)"
            :aria-label="branchLabel(b.level, b.side)"
            :disabled="busy"
            @click="tap(b.level, b.side)"
          )
            span(:key="creak && creak.level === b.level && !b.strong ? creak.n : 0" class="gm-branch-in")
              GameImage(:src="b.strong ? game.strong.image : game.weak.image" :ratio="2.4" :colour="b.strong ? '#6f8f3a' : '#9b7b52'" :label="b.strong ? game.strong.label : game.weak.label")
            span(v-if="!b.strong && wrongLevels.includes(b.level)" class="gm-mark" aria-hidden="true")
              GameMark(kind="bad")
          div(v-else class="gm-branch done" :class="b.side" :style="branchStyle(b.level, b.side)" aria-hidden="true")
            span(class="gm-branch-in")
              GameImage(:src="game.strong.image" :ratio="2.4" colour="#6f8f3a" :label="game.strong.label")
        div(
          :key="`climber-${round}`"
          class="gm-climber"
          :class="{ hold: creak !== null }"
          :style="climberStyle"
          role="img"
          :aria-label="game.climber.label"
        )
          span(:key="creak ? creak.n : 0" class="gm-climber-in")
            GameImage(:src="game.climber.image" :ratio="0.6" colour="#2f4f8a" :label="game.climber.label")
        div(v-if="atTop" class="gm-view" role="img" :aria-label="t('app.adventure.climbView')")
          GameImage(:src="game.view" :ratio="1.5" colour="#c9b27a" :label="t('app.adventure.climbView')")
          span(class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.climbHeight', { n: climbed, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.climbDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

// the tree stands upright: as wide as fits, never higher than most of the screen
.gm-tree
  position: relative
  width: min(100%, calc(68vh * 3 / 4))
  align-self: center
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #a9b98a
  background-size: cover
  background-position: center

// a branch: grows from the trunk outwards; the picture grows to the right, on the left it is mirrored
.gm-branch
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.35))
  z-index: 2

  &.l .gm-branch-in
    transform: scaleX(-1)

  &.done
    pointer-events: none
    z-index: 1

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &:disabled
    cursor: default

.gm-branch-in
  display: block

.gm-branch.creak .gm-branch-in
  animation: gm-creak 480ms ease-in-out

.gm-branch.l.creak .gm-branch-in
  animation-name: gm-creak-l

.gm-climber
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  transition: left 520ms ease, top 520ms ease
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.45))

.gm-climber-in
  display: block

.gm-climber.hold .gm-climber-in
  animation: gm-hold 360ms ease-in-out

// the view from the top: the picture of the road lies over the tree
.gm-view
  position: absolute
  left: 4%
  right: 4%
  top: 50%
  transform: translateY(-50%)
  z-index: 5
  border-radius: 12px
  overflow: hidden
  border: 3px solid #fff6dc
  box-shadow: 0 6px 18px rgba(40, 25, 5, 0.45)
  animation: gm-rise 420ms ease-out both

.gm-mark
  position: absolute
  right: -4px
  top: -8px
  z-index: 6
  pointer-events: none

.gm-view .gm-mark
  right: 6px
  top: 6px

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@keyframes gm-creak
  0%, 100%
    rotate: 0deg
  20%
    rotate: 7deg
  45%
    rotate: -4deg
  70%
    rotate: 3deg

@keyframes gm-creak-l
  0%, 100%
    transform: scaleX(-1) rotate(0deg)
  20%
    transform: scaleX(-1) rotate(7deg)
  45%
    transform: scaleX(-1) rotate(-4deg)
  70%
    transform: scaleX(-1) rotate(3deg)

@keyframes gm-hold
  0%, 100%
    translate: 0 0
  30%
    translate: -3px 0
  60%
    translate: 3px 0

@keyframes gm-rise
  from
    opacity: 0
    transform: translateY(-40%)
  to
    opacity: 1
    transform: translateY(-50%)

// less motion: nothing wobbles, Zacchaeus does not glide
@media (prefers-reduced-motion: reduce)
  .gm-branch.creak .gm-branch-in, .gm-climber.hold .gm-climber-in, .gm-view
    animation: none

  .gm-climber
    transition: none
</style>
