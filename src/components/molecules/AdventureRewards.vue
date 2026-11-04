<script setup lang="ts">
/**
 * "What the stars give you": the account at the end of a stage (and of the exam) of an adventure, all in one place. It says how many
 * stars the adventure holds so far, how many are still missing for the collector card, whether the mini game of this stage is open,
 * how far the next bonus game is, and how near the cup is. Nothing is a button: the child only reads where it stands.
 * Everything is worked out from the progress, so the same lines are right after every try.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useAdventure from '@/use/useAdventure'
import { REWARD_GAMES } from '@/data/adventures/rewardGames'
import { journeys as allJourneys } from '@/data/adventures'
import { BIG_GAMES } from '@/data/bigGames'
import { CARD_ART } from '@/data/cardArt'
import { MAX_STARS, maxPoints, medalFor, pointsOf, stageStarsOf, starsOf } from '@/utils/adventureScore'
import { bigGameStates, nextBigGame, totalStars } from '@/utils/bigGames'
import { albumCards, albumSetCard } from '@/utils/collection'
import { prependBaseUrl } from '@/utils/function'
import type { Journey, Medal } from '@/types/adventure'

const props = defineProps<{ journey: Journey; stageId?: number }>()
const { t } = useI18n({ useScope: 'global' })
const adv = useAdventure()

const ui = (name: string) => prependBaseUrl(`images/abenteuer/ui/${name}.webp`)
const progress = computed(() => adv.progressOf(props.journey.id))
const playable = computed(() => props.journey.stages.filter((s) => !s.soon))

// the stars of this adventure
const starsNow = computed(() => starsOf(progress.value))
const starsMax = computed(() => playable.value.length * MAX_STARS)
const starsMissing = computed(() => Math.max(0, starsMax.value - starsNow.value))
const stageNow = computed(() => (props.stageId !== undefined ? stageStarsOf(adv.stageOf(props.journey.id, props.stageId)) : 0))

// the collector card: one per adventure, won with all three stars in every stage
const set = computed(() =>
  albumSetCard(
    props.journey,
    albumCards(props.journey, (id) => adv.stageOf(props.journey.id, id))
  )
)
// a card that is not won yet shows its back; a won one shows the hero of the adventure
const cardPicture = computed(() => (set.value.have ? prependBaseUrl(CARD_ART[props.journey.id]?.front ?? props.journey.medal) : ui('karte-rueckseite')))

// the mini game of this stage (it moves into the game room with three stars), and how many the adventure holds
const miniIds = computed(() => (REWARD_GAMES[props.journey.id] ?? []).filter((id) => props.journey.stages.some((s) => s.id === id && !s.soon)))
const miniOpenCount = computed(() => miniIds.value.filter((id) => stageStarsOf(adv.stageOf(props.journey.id, id)) >= MAX_STARS).length)
const miniStage = computed(() => (props.stageId !== undefined && miniIds.value.includes(props.stageId) ? props.journey.stages.find((s) => s.id === props.stageId) : undefined))
const miniOpen = computed(() => stageNow.value >= MAX_STARS)

// the bonus games hang on the stars of all adventures together
const allStars = computed(() => totalStars(allJourneys, adv.progressOf))
const nextBonus = computed(() => nextBigGame(BIG_GAMES, allStars.value))
const bonusOpenCount = computed(() => bigGameStates(BIG_GAMES, allStars.value).filter((s) => s.open).length)

// the cup: gold from 90 %, silver from 75 %, bronze from 50 % of the points of stars and exam answers
const points = computed(() => pointsOf(progress.value))
const pointsMax = computed(() => maxPoints(props.journey))
const cupNow = computed<Medal | null>(() => (progress.value?.exam ? medalFor(points.value, pointsMax.value) : null))
const nextCup = computed<{ medal: Medal; missing: number } | null>(() => {
  const steps: [Medal, number][] = [
    ['bronze', 0.5],
    ['silver', 0.75],
    ['gold', 0.9]
  ]
  for (const [medal, share] of steps) {
    const need = Math.ceil(pointsMax.value * share - 1e-9)
    if (points.value < need) return { medal, missing: need - points.value }
  }
  return null
})
const cupName = (m: Medal) => t(`app.adventure.medal_${m}`)

interface Row {
  key: string
  icon: string
  /** Shown as a small card picture, not as a round symbol. */
  isCard?: boolean
  title: string
  text: string
  hint?: string
  /** The bar: value of max, with its label. */
  bar?: { value: number; max: number; label: string }
  /** What the row stands for is reached. */
  done: boolean
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []

  out.push({
    key: 'stars',
    icon: ui('stern-gold-3'),
    title: t('app.adventure.rStars'),
    text: starsMissing.value === 0 ? t('app.adventure.rStarsAll') : t('app.adventure.rStarsMissing', { n: starsMissing.value }, starsMissing.value),
    bar: { value: starsNow.value, max: starsMax.value, label: t('app.adventure.rOf', { n: starsNow.value, max: starsMax.value }) },
    done: starsMissing.value === 0
  })

  out.push({
    key: 'card',
    icon: cardPicture.value,
    isCard: true,
    title: t('app.adventure.rCard'),
    text: set.value.have ? t('app.adventure.rCardHave') : t('app.adventure.rCardNeed', { n: starsMissing.value }, starsMissing.value),
    hint: set.value.have ? undefined : t('app.adventure.rCardHint'),
    done: set.value.have
  })

  if (miniStage.value) {
    out.push({
      key: 'mini',
      icon: prependBaseUrl('images/icons/spielzimmer-4.webp'),
      title: t('app.adventure.rMini'),
      text: miniOpen.value ? t('app.adventure.rMiniHave', { title: miniStage.value.title }) : t('app.adventure.rMiniNeed', { n: MAX_STARS - stageNow.value, title: miniStage.value.title }, MAX_STARS - stageNow.value),
      done: miniOpen.value
    })
  } else if (miniIds.value.length) {
    out.push({
      key: 'mini',
      icon: prependBaseUrl('images/icons/spielzimmer-4.webp'),
      title: t('app.adventure.rMini'),
      text: t('app.adventure.rMiniNone'),
      bar: { value: miniOpenCount.value, max: miniIds.value.length, label: t('app.adventure.rMiniCount', { n: miniOpenCount.value, max: miniIds.value.length }) },
      done: false
    })
  }

  if (nextBonus.value) {
    out.push({
      key: 'bonus',
      icon: ui('stern-gold-1'),
      title: t('app.adventure.rBonus'),
      text: t('app.adventure.rBonusNext', { n: nextBonus.value.missing, game: t(`app.bigGames.${nextBonus.value.game.id}.title`) }, nextBonus.value.missing),
      bar: { value: allStars.value, max: nextBonus.value.game.at, label: t('app.adventure.rOf', { n: allStars.value, max: nextBonus.value.game.at }) },
      done: false
    })
  } else if (BIG_GAMES.length) {
    out.push({ key: 'bonus', icon: ui('stern-gold-1'), title: t('app.adventure.rBonus'), text: t('app.adventure.rBonusAll', { n: bonusOpenCount.value }, bonusOpenCount.value), done: true })
  }

  if (pointsMax.value > 0 && props.journey.exam.length) {
    const examDone = !!progress.value?.exam
    const medal = cupNow.value
    const text = medal
      ? nextCup.value
        ? t('app.adventure.rCupHave', { cup: cupName(medal) }) + ' ' + t('app.adventure.rCupNext', { n: nextCup.value.missing, cup: cupName(nextCup.value.medal) }, nextCup.value.missing)
        : t('app.adventure.rCupGold')
      : nextCup.value
        ? t('app.adventure.rCupNext', { n: nextCup.value.missing, cup: cupName(nextCup.value.medal) }, nextCup.value.missing)
        : t('app.adventure.rCupGold')
    out.push({
      key: 'cup',
      icon: ui(`pokal-${(medal ?? nextCup.value?.medal ?? 'gold') === 'silver' ? 'silber' : (medal ?? nextCup.value?.medal ?? 'gold')}`),
      title: t('app.adventure.rCup'),
      text,
      hint: examDone ? undefined : t('app.adventure.rCupAfterExam'),
      bar: { value: points.value, max: pointsMax.value, label: t('app.adventure.rPoints', { n: points.value, max: pointsMax.value }) },
      done: medal === 'gold'
    })
  }
  return out
})
</script>

<template lang="pug">
  section(class="rw" :aria-label="t('app.adventure.rHead')")
    h3(class="rw-head")
      AdventureStars(:stars="3" :size="22" class="rw-head-stars")
      span {{ t('app.adventure.rHead') }}
    ul(class="rw-list")
      li(v-for="r in rows" :key="r.key" class="rw-row" :class="[`rw-${r.key}`, { 'is-done': r.done }]")
        span(class="rw-icon" :class="{ 'is-card': r.isCard }")
          img(
            :src="r.icon"
            alt=""
            draggable="false"
          )
        span(class="rw-body")
          span(class="rw-title")
            | {{ r.title }}
            span(v-if="r.done" class="rw-ok" aria-hidden="true") ✓
          span(class="rw-text") {{ r.text }}
          span(v-if="r.hint" class="rw-hint") {{ r.hint }}
          span(v-if="r.bar" class="rw-bar-wrap")
            span(class="rw-bar" aria-hidden="true")
              span(class="rw-fill" :style="{ width: Math.round(Math.min(1, r.bar.max ? r.bar.value / r.bar.max : 1) * 100) + '%' }")
            span(class="rw-bar-label") {{ r.bar.label }}
</template>

<style scoped lang="sass">
.rw
  margin: 16px 0 6px
  text-align: left

.rw-head
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  margin: 0 0 12px
  font-size: 1.2rem
  font-weight: 800
  color: var(--lk-text)

.rw-list
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: 10px

.rw-row
  display: flex
  align-items: flex-start
  gap: 12px
  padding: 12px 14px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.6)
  border: 2px solid rgba(212, 168, 62, 0.35)
  min-width: 0

  &.is-done
    background: rgba(255, 244, 196, 0.85)
    border-color: #d4a83e
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.35)

.rw-icon
  flex: 0 0 auto
  width: 48px
  height: 48px
  display: flex
  align-items: center
  justify-content: center

  img
    max-width: 100%
    max-height: 100%
    object-fit: contain

  &.is-card
    width: 40px
    height: 60px
    margin: -2px 4px 0 0

    img
      width: 100%
      height: 100%
      border-radius: 6px
      object-fit: cover
      border: 2px solid #d4a83e
      box-shadow: 0 2px 6px rgba(80, 50, 0, 0.3)

.rw-body
  display: flex
  flex-direction: column
  gap: 3px
  min-width: 0
  flex: 1 1 auto

.rw-title
  display: flex
  align-items: center
  gap: 8px
  font-weight: 800
  font-size: 1.05rem
  color: var(--lk-text)

.rw-ok
  display: inline-flex
  align-items: center
  justify-content: center
  width: 22px
  height: 22px
  border-radius: 50%
  background: #d4a83e
  color: #fff
  font-size: 0.85rem
  line-height: 1

.rw-text
  font-size: 1rem
  line-height: 1.35
  color: var(--lk-text)
  overflow-wrap: anywhere

.rw-hint
  font-size: 0.9rem
  line-height: 1.3
  color: var(--lk-muted)

.rw-bar-wrap
  display: flex
  align-items: center
  gap: 10px
  margin-top: 6px

.rw-bar
  flex: 1 1 auto
  height: 12px
  border-radius: 999px
  background: rgba(120, 90, 20, 0.16)
  overflow: hidden

.rw-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #f3c94b, #d4a83e)
  transition: width 0.7s ease

.rw-bar-label
  flex: 0 0 auto
  font-size: 0.9rem
  font-weight: 800
  color: var(--lk-muted)

@media (prefers-reduced-motion: reduce)
  .rw-fill
    transition: none
</style>
