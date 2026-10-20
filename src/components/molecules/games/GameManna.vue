<script setup lang="ts">
/**
 * Gather manna: in the desert lie small white grains. At the tent two people live; at the side stands a row of empty jars. The child taps grains; they go into the next jar (four grains fill a
 * jar). When enough is gathered (two jars on a usual day, four on the sixth day) the child taps "Enough". Too much or too little: a hint "Today we need ..." and a mistake, the day does not count
 * yet and the child may empty the jars by tapping them (the grains lie on the ground again). On the seventh day nothing lies on the ground and the child taps "Day of rest". Round 1: three
 * usual days; round 2: day 4 and 5 usual, day 6 double, day 7 rest. There is no clock. The day is `dayOk` in `utils/moseGames.ts`. From the keyboard: Tab to a grain, Enter gathers it; the key G is "Enough".
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { dayOk } from '@/utils/moseGames'
import { scatter } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MannaGame } from '@/types/adventure'

const props = defineProps<{ game: MannaGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every day of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.days.length, 0))

/** The place of the grains on the ground (percent of the picture) and a spare jar more than the most any day needs. */
const GROUND = { x: 8, y: 52, w: 62, h: 38 }
const SPARE = 1

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const dayNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const day = computed(() => current.value.days[Math.min(dayNo.value, current.value.days.length - 1)]!)
const per = computed(() => props.game.flakesPerJar)
const maxJars = computed(() => Math.max(...props.game.rounds.flatMap((r) => r.days.map((d) => d.jars))) + SPARE)
/** The number of the day over the whole game (day 4 is the first day of round 2). */
const number = computed(() => rounds.value.slice(0, round.value).reduce((n, r) => n + r.days.length, 0) + dayNo.value + 1)
const rest = computed(() => day.value.jars === 0)
/** The grains on the ground: where they lie, which are gathered. */
const places = computed(() => (rest.value ? [] : scatter(maxJars.value * per.value, number.value * 7 + 3, GROUND)))
const gathered = ref<number[]>([])
const collected = computed(() => gathered.value.length)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const complete = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))

const onGround = computed(() => places.value.map((p, i) => ({ ...p, i })).filter((p) => !gathered.value.includes(p.i)))
const fill = (jar: number) => Math.min(per.value, Math.max(0, collected.value - jar * per.value))
const jars = computed(() => Array.from({ length: maxJars.value }, (_, k) => k))

function gather(i: number) {
  if (between.value || finished.value || complete.value || gathered.value.includes(i) || collected.value >= maxJars.value * per.value) return
  gathered.value = [...gathered.value, i]
  play('bead')
  message.value = ''
}

/** A tap on a jar empties it and the jars after it; the grains lie on the ground again. */
function empty(jar: number) {
  if (between.value || finished.value || complete.value) return
  if (collected.value <= jar * per.value) return
  gathered.value = gathered.value.slice(0, jar * per.value)
  play('tap')
  message.value = ''
}

function enough() {
  if (between.value || finished.value || complete.value) return
  if (dayOk(day.value, collected.value, per.value)) {
    complete.value = true
    flash.value = 'good'
    progress.mark()
    play('star')
    message.value = t(rest.value ? 'app.adventure.mannaRestRight' : 'app.adventure.mannaRight')
    later(nextDay, 1500)
    return
  }
  mistakes.value++
  flash.value = 'bad'
  play('wrong')
  message.value = rest.value ? t('app.adventure.mannaNeedRest') : day.value.jars === 1 ? t('app.adventure.mannaNeedOne') : t('app.adventure.mannaNeed', { n: day.value.jars })
  later(() => {
    flash.value = null
  }, 900)
}

function nextDay() {
  complete.value = false
  flash.value = null
  gathered.value = []
  message.value = ''
  if (dayNo.value < current.value.days.length - 1) {
    dayNo.value++
    return
  }
  if (lastRound.value) {
    finished.value = true
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    dayNo.value = 0
    between.value = false
    message.value = ''
  }, 1400)
}

function key(e: KeyboardEvent) {
  if (e.key === 'g' || e.key === 'G') {
    e.preventDefault()
    enough()
  }
}

const countDone = computed(() => number.value - 1 + (complete.value ? 1 : 0))
const total = computed(() => rounds.value.reduce((n, r) => n + r.days.length, 0))
const flakeImage = (i: number) => props.game.flakes[i % props.game.flakes.length] ?? ''
</script>

<template lang="pug">
  div(class="mn" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="mn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="mn-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      p(class="mn-day") {{ t('app.adventure.mannaDay', { n: number }) }}
      div(class="mn-jars" role="group" :aria-label="t('app.adventure.mannaJars')")
        button(
          v-for="k in jars"
          :key="`${round}-${dayNo}-j-${k}`"
          type="button"
          class="mn-jar"
          :class="{ full: fill(k) === per, partial: fill(k) > 0 && fill(k) < per }"
          :aria-label="t('app.adventure.mannaJar', { n: k + 1, fill: fill(k), per })"
          @click="empty(k)"
        )
          GameImage(:src="fill(k) === per ? game.jarFull : game.jar" :ratio="1" colour="#c98a5a" round)
          span(class="mn-fill") {{ fill(k) }}
      div(class="mn-field" role="group" :aria-label="t('app.adventure.mannaField')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="mn-dwellers" aria-hidden="true")
          GameImage(:src="game.dwellers" :ratio="1" colour="#4a4252")
        template(v-if="!between")
          button(
            v-for="f in onGround"
            :key="`${round}-${dayNo}-f-${f.i}`"
            type="button"
            class="mn-flake"
            :style="{ left: `${f.x}%`, top: `${f.y}%` }"
            :aria-label="t('app.adventure.mannaFlake')"
            @click="gather(f.i)"
          )
            GameImage(:src="flakeImage(f.i)" colour="#fffdf3" round)
        GameMark(v-if="flash" :kind="flash" class="mn-mark")
      p(class="mn-fb" role="status") {{ message }}
      AdvButton(tone="gold" class="mn-enough" :disabled="between || complete" @click="enough") {{ rest ? t('app.adventure.mannaRest') : t('app.adventure.mannaEnough') }}
      p(class="mn-count") {{ t('app.adventure.mannaCount', { n: countDone, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.mannaDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.mn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.mn-round
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

.mn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.mn-day
  margin: 0
  align-self: center
  padding: 2px 18px
  border-radius: 999px
  background: #3f321b
  color: #fff6dc
  font-weight: 900
  font-size: 1.2rem

.mn-jars
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

.mn-jar
  position: relative
  width: 56px
  padding: 3px
  border-radius: 12px
  border: 2px solid rgba(150, 100, 30, 0.6)
  background: rgba(255, 246, 220, 0.9)
  cursor: pointer
  touch-action: manipulation

  &.full
    box-shadow: 0 0 0 3px rgba(255, 224, 120, 0.95)

.mn-fill
  position: absolute
  right: 2px
  bottom: 2px
  min-width: 20px
  padding: 0 4px
  border-radius: 8px
  background: rgba(255, 252, 238, 0.95)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.mn-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d7bf86
  background-size: cover
  background-position: center

.mn-dwellers
  position: absolute
  right: 4%
  top: 18%
  display: block
  width: 20%
  pointer-events: none

// a grain: small to look at, a thumb to tap
.mn-flake
  position: absolute
  display: block
  width: 44px
  height: 44px
  margin: -22px 0 0 -22px
  padding: 10px
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.mn-mark
  position: absolute
  top: 8px
  left: 8px
  z-index: 6

.mn-fb
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

.mn-enough
  align-self: center
  min-height: 56px

.mn-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
