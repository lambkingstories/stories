<script setup lang="ts">
/**
 * The points of the end of an adventure, worked out in front of the child (Anton, 17.11.2026: "why 29 of 33 above and 27 of 27 below?"):
 * the stars of the stages and the right answers of the exam are two rows with a bar each, and they add up to the points of the cup
 * (stars + right answers = points). Under the sum it says how many points are missing for the next cup.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useAdventure from '@/use/useAdventure'
import { MAX_STARS, maxPoints, medalFor, pointsOf, starsOf } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import type { Journey, Medal } from '@/types/adventure'

const props = defineProps<{ journey: Journey }>()
const { t } = useI18n({ useScope: 'global' })
const adv = useAdventure()

const ui = (name: string) => prependBaseUrl(`images/abenteuer/ui/${name}.webp`)
const progress = computed(() => adv.progressOf(props.journey.id))
const starsNow = computed(() => starsOf(progress.value))
const starsMax = computed(() => props.journey.stages.filter((s) => !s.soon).length * MAX_STARS)
const examCorrect = computed(() => progress.value?.exam?.correct ?? 0)
const examMax = computed(() => props.journey.exam.length)
const points = computed(() => pointsOf(progress.value))
const pointsMax = computed(() => maxPoints(props.journey))
const cup = computed<Medal | null>(() => medalFor(points.value, pointsMax.value))
const next = computed<{ medal: Medal; missing: number } | null>(() => {
  const steps: [Medal, number][] = [['bronze', 0.5], ['silver', 0.75], ['gold', 0.9]]
  for (const [medal, share] of steps) {
    const need = Math.ceil(pointsMax.value * share - 1e-9)
    if (points.value < need) return { medal, missing: need - points.value }
  }
  return null
})
const pct = (v: number, max: number) => Math.round(Math.min(1, max ? v / max : 0) * 100) + '%'
</script>

<template lang="pug">
  section(class="ep" data-test="exam-points" :aria-label="t('app.bigGames.result.pointsHead')")
    h3(class="ep-head") {{ t('app.bigGames.result.pointsHead') }}
    div(class="ep-row")
      img(:src="ui('stern-gold-3')" alt="" class="ep-icon" draggable="false")
      span(class="ep-body")
        span(class="ep-line")
          span(class="ep-name") {{ t('app.bigGames.result.starsRow') }}
          strong(class="ep-val") {{ t('app.adventure.rOf', { n: starsNow, max: starsMax }) }}
        span(class="ep-bar" aria-hidden="true")
          span(class="ep-fill" :style="{ width: pct(starsNow, starsMax) }")
    div(class="ep-row")
      img(:src="ui('check')" alt="" class="ep-icon" draggable="false")
      span(class="ep-body")
        span(class="ep-line")
          span(class="ep-name") {{ t('app.bigGames.result.examRow') }}
          strong(class="ep-val") {{ t('app.bigGames.result.examRowText', { n: examCorrect, max: examMax }) }}
        span(class="ep-bar" aria-hidden="true")
          span(class="ep-fill" :style="{ width: pct(examCorrect, examMax) }")
    div(class="ep-sum")
      span(class="ep-sum-text") {{ t('app.adventure.statsTotal', { n: points, max: pointsMax }) }}
      span(v-if="next" class="ep-next") {{ t('app.adventure.rCupNext', { n: next.missing, cup: t(`app.adventure.medal_${next.medal}`) }, next.missing) }}
      span(v-else-if="cup === 'gold'" class="ep-next") {{ t('app.adventure.rCupGold') }}
</template>

<style scoped lang="sass">
.ep
  display: flex
  flex-direction: column
  gap: 10px
  margin: 14px 0
  padding: 14px
  border: 1px solid var(--lk-line)
  border-radius: 20px
  background: var(--lk-surface)
  text-align: left

.ep-head
  margin: 0
  font-size: 1rem
  font-weight: 800
  color: var(--lk-text)

.ep-row
  display: flex
  align-items: center
  gap: 12px

.ep-icon
  flex: none
  width: 36px
  height: 36px
  object-fit: contain

.ep-body
  flex: 1 1 auto
  min-width: 0
  display: flex
  flex-direction: column
  gap: 5px

.ep-line
  display: flex
  justify-content: space-between
  gap: 8px
  font-size: 0.98rem
  color: var(--lk-text)

.ep-val
  font-weight: 800
  white-space: nowrap

.ep-bar
  display: block
  height: 8px
  border-radius: 999px
  background: var(--lk-track, #dfe9e6)
  overflow: hidden

.ep-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-gold, #e6b840)

.ep-sum
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding-top: 10px
  border-top: 1px dashed var(--lk-line)

.ep-sum-text
  font-size: 1.15rem
  font-weight: 800
  color: var(--lk-text)

.ep-next
  font-size: 0.92rem
  font-weight: 600
  color: var(--lk-muted)
</style>
