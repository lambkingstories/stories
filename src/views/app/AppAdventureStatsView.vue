<script setup lang="ts">
/**
 * The statistics of a journey: opened by tapping the cup on the map, at any time. For every stage the stars it earned, the questions of
 * the exam, the sum, the cup (and how many points are missing for the next one), and the present. A stage that was not solved well can be
 * played again from here (the new result replaces the old one); the way back from it leads to this page, and the cup is updated, with
 * the celebration once more when a better cup was won. The present opens the painting program; "back" there comes back to this page.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureRewards from '@/components/molecules/AdventureRewards.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import CollectionCard from '@/components/molecules/CollectionCard.vue'
import CollectionCardViewer from '@/components/molecules/CollectionCardViewer.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import SoundPanel from '@/components/molecules/SoundPanel.vue'
import { journeyById } from '@/data/adventures'
import { CARD_ART } from '@/data/cardArt'
import { memoryVerseOf } from '@/data/memoryVerses'
import { adventureLanguage } from '@/use/adventureLanguage'
import { albumCards, albumSetCard } from '@/utils/collection'
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

/** The overview of the end of an adventure (after the quiz): the child stays here, looks at the card, the picture and the stars, and leaves with "Done". */
const finale = computed(() => route.query.finale === '1')
const set = computed(() => albumSetCard(journey.value, albumCards(journey.value, (id) => adv.stageOf(journey.value.id, id))))
const art = computed(() => CARD_ART[journey.value?.id ?? ''])
const cardOpen = ref(false)
const verse = computed(() => memoryVerseOf(journey.value?.id ?? '', adventureLanguage.value) ?? undefined)
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : undefined)

/** The picture that was won: first it is shown big, and only "Color it" opens the painting program (the way back leads here again). */
const giftOpen = ref(false)
function colorGift() {
  const g = journey.value?.gift
  if (g) void router.push({ name: 'app-coloring', query: { source: prependBaseUrl(g.image), type: 'image', ret: `stats:${journey.value.id}${finale.value ? ':finale' : ''}` } })
}

function toMap() {
  void router.push({ name: 'app-adventure-map', params: { journeyId: journey.value.id } })
}
/** "Done": on to the map of the adventure, where the child may look around, and leave from there. */
function done() {
  void router.replace({ name: 'app-adventure-map', params: { journeyId: journey.value.id } })
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
          button(v-if="!finale" type="button" class="stats-back lk-btn lk-btn--outline lk-btn--small" :aria-label="t('app.adventure.backToMap')" @click="toMap")
            ZIconography(name="chevron-left" :size="20")
            span {{ t('app.adventure.backToMap') }}
          SoundPanel
        p(class="stats-kind") {{ journey.title }}
        h1(class="stats-title") {{ finale ? t('app.adventure.statsFinaleTitle') : t('app.adventure.statsTitle') }}
        p(v-if="finale" class="stats-sub") {{ t('app.adventure.statsFinaleSub') }}

    main(class="stats-body")
      section(class="stats-card stats-cup")
        img(v-if="cup" :src="cup" alt="" class="stats-cup-img" :class="`cup-${medal}`" draggable="false")
        p(v-if="medal" class="stats-medal") {{ t(`app.adventure.medal_${medal}`) }}
        p(v-else class="stats-line") {{ exam ? t('app.adventure.noMedal') : t('app.adventure.statsNoExam') }}
        p(class="stats-total") {{ t('app.adventure.statsTotal', { n: points, max }) }}
        p(v-if="next" class="stats-line stats-next") {{ t('app.adventure.statsNext', { medal: t(`app.adventure.medal_${next.medal}`), n: next.missing }) }}

      //- the collector card of the adventure: it glows, a tap shows it big
      section(v-if="set.have" class="stats-card stats-won" data-test="stats-card")
        h2(class="stats-h2") {{ t('app.adventure.statsCardTitle') }}
        button(type="button" class="stats-card-btn" :aria-label="journey.title" @click="cardOpen = true")
          CollectionCard(:title="journey.title" :image="pic(art?.front ?? journey.medal)" :back-image="pic(art?.back)" :art="!!art" special still)
        p(class="stats-line") {{ t('app.adventure.statsCardTap') }}

      //- the picture to color that the cup gave: shown first, colored on demand
      section(v-if="medal === 'gold'" class="stats-card stats-won" data-test="stats-gift")
        h2(class="stats-h2") {{ t('app.adventure.statsGiftTitle') }}
        button(type="button" class="stats-gift-btn" :aria-label="journey.gift.title" @click="giftOpen = true")
          img(:src="prependBaseUrl(journey.gift.image)" alt="" draggable="false")
        p(class="stats-line") {{ journey.gift.title }} · {{ t('app.adventure.statsGiftTap') }}

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

      //- what the stars, the answers and the cup unlocked and won: stars, card, mini game, bonus game, cup
      section(v-if="finale" class="stats-card" data-test="stats-rewards")
        h2(class="stats-h2") {{ t('app.adventure.statsRewards') }}
        AdventureRewards(:journey="journey" start-open)

      div(v-if="finale" class="stats-finish")
        AdvButton(tone="gold" data-test="stats-done" @click="done") {{ t('app.adventure.statsDone') }}

    CollectionCardViewer(
      v-if="cardOpen"
      :title="journey.title"
      :image="pic(art?.front ?? journey.medal)"
      :back-image="pic(art?.back)"
      :art="!!art"
      :reference="journey.subtitle"
      :journey-title="t('app.collection.setBack', { n: set.all })"
      :verse="verse"
      special
      @close="cardOpen = false"
    )

    //- the won picture, big, with "Color it" and "Back" under it
    div(v-if="giftOpen && medal === 'gold'" class="gp" role="dialog" aria-modal="true" :aria-label="journey.gift.title" data-test="gift-preview")
      div(class="gp-paper")
        img(:src="prependBaseUrl(journey.gift.image)" alt="" draggable="false")
      div(class="gp-actions")
        AdvButton(tone="gold" data-test="gift-color" @click="colorGift") {{ t('app.adventure.giftColor') }}
        AdvButton(tone="blau" data-test="gift-back" @click="giftOpen = false") {{ t('app.adventure.giftBack') }}
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

.stats-sub
  margin: 0 0 8px
  color: var(--lk-muted)
  font-size: 1.05rem

.stats-h2
  margin: 0 0 10px
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1.25rem
  text-align: center

.stats-won
  text-align: center

.stats-card-btn
  display: block
  width: min(62%, 240px)
  margin: 0 auto 8px
  padding: 0
  border: 0
  border-radius: 16px
  background: transparent
  cursor: pointer
  // the card glows: it is the thing that was just won
  animation: stats-glow 2.2s ease-in-out infinite alternate
  -webkit-tap-highlight-color: transparent

@keyframes stats-glow
  from
    filter: drop-shadow(0 0 6px rgba(255, 205, 60, 0.55))
  to
    filter: drop-shadow(0 0 22px rgba(255, 190, 40, 1))

.stats-gift-btn
  display: block
  width: min(78%, 320px)
  margin: 0 auto 8px
  padding: 10px
  border: 2px solid rgba(212, 168, 62, 0.6)
  border-radius: 14px
  background: #fffdf7
  box-shadow: var(--lk-shadow)
  cursor: pointer

  img
    display: block
    width: 100%
    height: auto
    border-radius: 6px

.stats-finish
  display: flex
  justify-content: center
  padding: 6px 0 12px

.gp
  position: fixed
  inset: 0
  z-index: 200
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 16px
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px))
  background: rgba(30, 24, 12, 0.88)

.gp-paper
  flex: 0 1 auto
  max-width: min(94vw, 640px)
  max-height: calc(100dvh - 140px)
  padding: 10px
  border-radius: 12px
  background: #fffdf7
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5)

  img
    display: block
    max-width: 100%
    max-height: calc(100dvh - 170px)
    object-fit: contain

.gp-actions
  display: flex
  gap: 12px
  flex-wrap: wrap
  justify-content: center

@media (prefers-reduced-motion: reduce)
  .stats-card-btn
    animation: none
    filter: drop-shadow(0 0 12px rgba(255, 190, 40, 0.8))

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
