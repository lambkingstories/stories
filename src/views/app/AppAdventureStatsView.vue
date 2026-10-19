<script setup lang="ts">
/**
 * The statistics of a journey: opened by tapping the cup on the map, at any time. For every stage the stars it earned, the questions of
 * the exam, the sum, the cup (and how many points are missing for the next one), and the present. A stage that was not solved well can be
 * played again from here (the new result replaces the old one); the way back from it leads to this page, and the cup is updated, with
 * the celebration once more when a better cup was won. The present opens the painting program; "back" there comes back to this page.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import SoundPanel from '@/components/molecules/SoundPanel.vue'
import { journeyById } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import useButtonSounds from '@/use/useButtonSounds'
import useCelebration from '@/use/useCelebration'
import { clearViaStats, markViaStats, medalRank, nextMedal, takeMedalBefore } from '@/utils/adventureStats'
import { maxPoints, medalFor, pointsOf, stageStarsOf } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const adv = useAdventure()
const { celebrate } = useCelebration()
useButtonSounds()

const journey = computed(() => journeyById(String(route.params.journeyId))!)
const progress = computed(() => adv.progressOf(journey.value?.id ?? ''))
const ui = (name: string) => prependBaseUrl(`images/abenteuer/ui/${name}.webp`)

const rows = computed(() =>
  (journey.value?.stages ?? [])
    .filter((s) => !s.soon)
    .map((s) => {
      const st = progress.value?.stages[s.id]
      const stars = stageStarsOf(st)
      return { id: s.id, title: s.title, stars, done: !!st?.done, again: !!st?.done && stars < 3 }
    })
)
const points = computed(() => pointsOf(progress.value))
const max = computed(() => (journey.value ? maxPoints(journey.value) : 0))
const exam = computed(() => progress.value?.exam)
const medal = computed(() => (exam.value ? medalFor(points.value, max.value) : null))
const next = computed(() => (exam.value ? nextMedal(points.value, max.value) : null))
const cup = computed(() => (medal.value ? ui(`pokal-${medal.value === 'silver' ? 'silber' : medal.value}`) : ''))
const examAgain = computed(() => !!exam.value && exam.value.correct < exam.value.total)

/** Play a stage (or the exam) again from here: the way back comes to this page, and the cup of now is remembered to see whether a better one is won. */
function again(stageKey: string) {
  markViaStats(journey.value.id, stageKey, medal.value)
  void router.push({ name: 'app-adventure-stage', params: { journeyId: journey.value.id, stageId: stageKey } })
}

function openGift() {
  const g = journey.value?.gift
  if (g) void router.push({ name: 'app-coloring', query: { source: prependBaseUrl(g.image), type: 'image', ret: `stats:${journey.value.id}` } })
}

function toMap() {
  void router.push({ name: 'app-adventure-map', params: { journeyId: journey.value.id } })
}

onMounted(() => {
  clearViaStats()
  // back from a stage that was played again: a better cup than before is celebrated once more
  const before = takeMedalBefore()
  if (before !== undefined && medalRank(medal.value) > medalRank(before)) celebrate(medal.value)
})
</script>

<template lang="pug">
  div(v-if="journey" class="stats")
    header(class="stats-head")
      AppHeader
      div(class="stats-head-body")
        div(class="stats-top")
          button(type="button" class="stats-back lk-btn lk-btn--outline lk-btn--small" :aria-label="t('app.adventure.backToMap')" @click="toMap")
            ZIconography(name="chevron-left" :size="20")
            span {{ t('app.adventure.backToMap') }}
          SoundPanel
        p(class="stats-kind") {{ journey.title }}
        h1(class="stats-title") {{ t('app.adventure.statsTitle') }}

    main(class="stats-body")
      section(class="stats-card stats-cup")
        img(v-if="cup" :src="cup" alt="" class="stats-cup-img" :class="`cup-${medal}`" draggable="false")
        p(v-if="medal" class="stats-medal") {{ t(`app.adventure.medal_${medal}`) }}
        p(v-else class="stats-line") {{ exam ? t('app.adventure.noMedal') : t('app.adventure.statsNoExam') }}
        p(class="stats-total") {{ t('app.adventure.statsTotal', { n: points, max }) }}
        p(v-if="next" class="stats-line stats-next") {{ t('app.adventure.statsNext', { medal: t(`app.adventure.medal_${next.medal}`), n: next.missing }) }}
        div(class="stats-actions")
          AdvButton(v-if="medal" tone="gold" @click="openGift") {{ t('app.adventure.gift', { title: journey.gift.title }) }}

      section(class="stats-card")
        ol(class="stats-list")
          li(v-for="r in rows" :key="r.id" class="stats-row" :class="{ open: !r.done }")
            span(class="stats-n") {{ r.id }}
            span(class="stats-name") {{ r.title }}
            AdventureStars(:stars="r.stars" :size="26" class="stats-stars")
            button(v-if="r.again" type="button" class="stats-again lk-btn lk-btn--outline lk-btn--small" :aria-label="`${t('app.adventure.statsAgain')}: ${r.title}`" @click="again(String(r.id))") {{ t('app.adventure.statsAgain') }}
          li(class="stats-row stats-exam" :class="{ open: !exam }")
            span(class="stats-n") ★
            span(class="stats-name") {{ t('app.adventure.exam') }}
            span(v-if="exam" class="stats-score") {{ t('app.adventure.examRight', { n: exam.correct, total: exam.total }) }}
            span(v-else class="stats-score stats-quiet") {{ t('app.adventure.statsNotYet') }}
            button(v-if="examAgain" type="button" class="stats-again lk-btn lk-btn--outline lk-btn--small" :aria-label="`${t('app.adventure.statsAgain')}: ${t('app.adventure.exam')}`" @click="again('pruefung')") {{ t('app.adventure.statsAgain') }}
        p(class="stats-sum") {{ t('app.adventure.statsTotal', { n: points, max }) }}
</template>

<style scoped lang="sass">
.stats
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px))

.stats-head-body
  max-width: 640px
  margin: 0 auto
  padding: 0 16px

.stats-top
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.stats-back
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

.stats-kind
  margin: 14px 0 0
  color: var(--lk-muted)
  font-size: 1.1rem

.stats-title
  margin: 4px 0 8px
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1.9rem
  line-height: 1.12

.stats-body
  max-width: 640px
  margin: 0 auto
  padding: 6px 16px 0
  display: flex
  flex-direction: column
  gap: 14px

.stats-card
  padding: 18px 16px
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.stats-cup
  display: flex
  flex-direction: column
  align-items: center
  text-align: center

.stats-cup-img
  display: block
  width: min(46%, 180px)
  height: auto

.stats-medal
  margin: 6px 0 0
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1.5rem

.stats-total
  margin: 6px 0 0
  font-weight: 800
  font-size: 1.2rem

.stats-line
  margin: 6px 0 0
  font-weight: 600
  color: var(--lk-muted)
  font-size: 1rem

.stats-actions
  display: flex
  justify-content: center
  margin-top: 12px

.stats-list
  margin: 0
  padding: 0
  list-style: none

.stats-row
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: 6px 10px
  padding: 8px 0
  border-bottom: 1px solid var(--lk-line)

  &:last-child
    border-bottom: 0

  &.open
    opacity: 0.8

.stats-n
  flex: none
  width: 28px
  height: 28px
  border-radius: 50%
  display: inline-flex
  align-items: center
  justify-content: center
  background: #e8c874
  color: #4a3208
  font-weight: 800
  font-size: 1rem

.stats-name
  flex: 1 1 40%
  min-width: 0
  font-weight: 700
  font-size: 1rem
  line-height: 1.2

.stats-score
  font-weight: 700
  font-size: 1rem
  text-align: right

.stats-quiet
  color: var(--lk-muted)

.stats-again
  flex: none
  min-height: 44px
  padding: 0 12px

.stats-sum
  margin: 10px 0 0
  text-align: right
  font-weight: 800
  font-size: 1.1rem
</style>
