<script setup lang="ts">
/**
 * The way game: the caravan stands where the trail forks, and the child taps the branch that leads to the goal (Egypt). The right
 * way lets the caravan walk off along it and the next picture comes; the wrong way lets it start and turn back, and counts as a
 * mistake. There are no signposts: the child has to see in the picture which way the caravan went (tracks, dust, palms in the distance).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { WayGame } from '@/types/adventure'

const props = defineProps<{ game: WayGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const scene = ref(0)
const mistakes = ref(0)
/** `left` / `right` while the caravan walks on the right way, `back-left` / `back-right` when it turns back. */
const walking = ref<'' | 'left' | 'right' | 'middle' | 'back-left' | 'back-right' | 'back-middle'>('')
const note = ref('')
const finished = ref(false)
const stars = computed(() => mistakeStars(mistakes.value, 0, 2))
const current = computed(() => props.game.scenes[scene.value])
const sceneSrc = computed(() => prependBaseUrl(current.value?.image ?? ''))
const walkerSrc = computed(() => prependBaseUrl(props.game.walker))
const busy = computed(() => walking.value !== '')
/** A fork with three ways has a middle one, too. */
const threeWays = computed(() => current.value?.paths === 3)
/** The picture glows green for the right way and red for the wrong one. */
const verdict = computed(() => (walking.value === '' ? '' : walking.value.startsWith('back') ? 'bad' : 'good'))

function choose(side: 'left' | 'right' | 'middle') {
  const c = current.value
  if (!c || busy.value) return
  if (side === c.goal) {
    note.value = t('app.adventure.wayRight')
    progress.mark()
    walking.value = side
    play('caravan')
    later(() => {
      walking.value = ''
      note.value = ''
      if (scene.value + 1 >= props.game.scenes.length) finished.value = true
      else scene.value++
    }, 1500)
    return
  }
  mistakes.value++
  play('wrong')
  note.value = t('app.adventure.wayWrong')
  walking.value = side === 'left' ? 'back-left' : side === 'right' ? 'back-right' : 'back-middle'
  later(() => {
    walking.value = ''
    note.value = ''
  }, 1900)
}

</script>

<template lang="pug">
  div(class="way")
    template(v-if="!finished && current")
      div(class="way-scene" :class="verdict")
        img(:src="sceneSrc" alt="" class="way-bg" draggable="false")
        img(:src="walkerSrc" alt="" class="way-walker" :class="[walking ? `go-${walking}` : '']" draggable="false")
        button(type="button" class="way-hit left" :class="{ three: threeWays }" :disabled="busy" :aria-label="t('app.adventure.wayLeft')" @click="choose('left')")
        button(v-if="threeWays" type="button" class="way-hit middle three" :disabled="busy" :aria-label="t('app.adventure.wayMiddle')" @click="choose('middle')")
        button(type="button" class="way-hit right" :class="{ three: threeWays }" :disabled="busy" :aria-label="t('app.adventure.wayRight2')" @click="choose('right')")
      p(class="way-note" :class="{ bad: walking.startsWith('back') }" role="status") {{ note || t('app.adventure.wayHint', { n: scene + 1, total: game.scenes.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wayDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.way
  display: flex
  flex-direction: column
  gap: 10px

.way-scene
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  border-radius: 18px
  overflow: hidden
  border: 3px solid #d4a83e
  box-shadow: 0 10px 24px -12px rgba(60, 40, 10, 0.6)
  transition: border-color 200ms, box-shadow 200ms

  &.good
    border-color: #2fae54
    box-shadow: 0 0 0 4px rgba(47, 174, 84, 0.55), 0 0 26px 6px rgba(47, 174, 84, 0.7)

  &.bad
    border-color: #d63031
    box-shadow: 0 0 0 4px rgba(214, 48, 49, 0.55), 0 0 26px 6px rgba(214, 48, 49, 0.7)

.way-bg
  display: block
  width: 100%
  height: 100%
  object-fit: cover

// the caravan starts at the bottom of the fork and walks up the branch that was tapped
.way-walker
  position: absolute
  left: 50%
  top: 90%
  width: 38%
  height: auto
  transform: translate(-50%, -100%)
  transform-origin: 50% 100%
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.4))
  transition: transform 1300ms ease-in-out, opacity 400ms ease-in

  &.go-right
    transform: translate(18%, -240%) scale(0.32)
    opacity: 0.9

  &.go-left
    transform: translate(-118%, -240%) scale(0.32) scaleX(-1)
    opacity: 0.9

  &.go-middle
    transform: translate(-50%, -270%) scale(0.32)
    opacity: 0.9

  &.go-back-middle
    animation: way-back-middle 1800ms ease-in-out

  &.go-back-right
    animation: way-back-right 1800ms ease-in-out

  &.go-back-left
    animation: way-back-left 1800ms ease-in-out

.way-hit
  position: absolute
  top: 8%
  bottom: 30%
  width: 42%
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  border-radius: 24px

  &.left
    left: 2%

  &.right
    right: 2%

  // three ways: three zones of a third each
  &.three
    width: 31%

  &.three.left
    left: 1%

  &.three.right
    right: 1%

  &.middle
    left: 34.5%

  &:active:not(:disabled)
    background: rgba(255, 240, 170, 0.25)

.way-note
  margin: 0
  min-height: 1.6em
  text-align: center
  font-weight: 700
  font-size: 1.05rem
  color: #2f6b3f

  &.bad
    color: #a93d2e

@keyframes way-back-middle
  0%
    transform: translate(-50%, -100%)
  45%
    transform: translate(-50%, -190%) scale(0.6)
  55%
    transform: translate(-50%, -190%) scale(0.6) scaleX(-1)
  100%
    transform: translate(-50%, -100%)

@keyframes way-back-right
  0%
    transform: translate(-50%, -100%)
  45%
    transform: translate(2%, -180%) scale(0.6)
  55%
    transform: translate(2%, -180%) scale(0.6) scaleX(-1)
  92%
    transform: translate(-50%, -100%) scaleX(-1)
  100%
    transform: translate(-50%, -100%)

@keyframes way-back-left
  0%
    transform: translate(-50%, -100%)
  6%
    transform: translate(-50%, -100%) scaleX(-1)
  45%
    transform: translate(-102%, -180%) scale(0.6) scaleX(-1)
  55%
    transform: translate(-102%, -180%) scale(0.6)
  100%
    transform: translate(-50%, -100%)

@media (prefers-reduced-motion: reduce)
  // the sheep and the way stand where they go instead of moving there
  .way-scene,
  .way-walker,
  .way-walker.go-back-middle,
  .way-walker.go-back-right,
  .way-walker.go-back-left
    animation: none
    transition: none
</style>
