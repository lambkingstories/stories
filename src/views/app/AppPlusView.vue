<script setup lang="ts">
/**
 * The page about LambKing Plus, meant for parents (it is reached from the window for parents and from the slide on the start page).
 * Made to show off what Plus brings (Anton, 18.11.2026: "the advantages must be clear, beautiful and distinct"): the whole title picture with the
 * promise on it, four big colourful cards for what Plus brings, then the two prices with the buttons, what stays free as a list of ticks, why it
 * exists, and the small print the stores ask for. In the test build a switch lets Anton try the app with Plus on and off.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import usePremium, { PLUS_TEST } from '@/use/usePremium'
import { introRuns, plusOffer, PLUS_FAMILY } from '@/data/plus'
import { MANAGE_URL, TERMS_URL } from '@/data/plusProducts'
import usePurchases from '@/use/usePurchases'
import { isIOS } from '@/utils/platform'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { plusOn, setTestPlus } = usePremium()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-main' })
}

const { status, prices, available, loadPlusProducts, buyPlus, restoreAll, resetPurchaseStatus } = usePurchases()
onMounted(() => {
  resetPurchaseStatus()
  void loadPlusProducts()
})
/** The price of a plan in the money of the store, as long as the store has not answered the text of the page. */
const priceOf = (plan: 'year' | 'month' | 'familyYear' | 'familyMonth') => prices.value[plan] ?? plusOffer[plan]
const manageUrl = computed(() => (isIOS ? MANAGE_URL.ios : MANAGE_URL.android))
const busy = computed(() => status.value === 'purchasing')

const img = (path: string) => prependBaseUrl(`images/${path}.webp`)
/** What Plus brings, as four big cards (the texts are `app.plus.card<N>Title` / `card<N>Text`): the painted symbol of the part of the app and its own colour. */
const cards = [
  { n: 1, icon: img('icons/navi/abenteuer'), tone: 'gold' },
  { n: 2, icon: img('icons/navi/malen'), tone: 'rose' },
  { n: 3, icon: img('icons/kacheln/kachel-familie-c'), tone: 'blue' },
  { n: 4, icon: img('icons/navi/lesen'), tone: 'teal' }
]
/** What stays free for ever, as a list of ticks (texts that exist in all languages). */
const FREE = ['app.plus.plusFree1', 'app.plus.plusFree2', 'app.plus.plusFree3', 'app.plus.plusFree4', 'app.plus.area2Free2', 'app.plus.area4Free1']
const hero = img('bg/willkommen-plus-3')
</script>

<template lang="pug">
  div(class="app-page plus-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    LkPageHead(:title="t('app.plus.title')" :subtitle="t('app.plus.subtitle')" :lamb="false" @back="goBack")

    section(class="section-wrap plus-body")
      //- the whole title picture (nothing lies on the lamb), the golden Plus sign in its corner, the promise under it
      div(class="plus-hero")
        img(:src="hero" alt="" draggable="false")
        PlusBadge(class="plus-hero-badge")
      p(v-if="plusOn" class="plus-hero-line is-on" role="status") {{ t('app.plus.stateOn') }}
      p(v-else class="plus-hero-line") {{ t('app.plus.lead') }}

      //- what Plus brings: big colourful cards
      h2(class="plus-h") {{ t('app.plus.getsTitle') }}
      div(class="plus-cards")
        article(v-for="c in cards" :key="c.n" :class="['plus-card', 'is-' + c.tone]")
          span(class="plus-card-icon")
            img(:src="c.icon" alt="" draggable="false")
          div(class="plus-card-text")
            h3 {{ t(`app.plus.card${c.n}Title`) }}
            p {{ t(`app.plus.card${c.n}Text`) }}

      //- the prices with the buttons (what the stores ask for stays together: price, period, the buttons)
      h2(class="plus-h") {{ t('app.plus.priceTitle') }}
      div(class="plus-plans")
        div(class="plus-plan is-year")
          span(class="plus-badge") {{ t('app.plus.cheaper') }}
          span(class="plus-plan-name") {{ t('app.plus.priceYear') }}
          strong(v-if="introRuns()" class="plus-plan-price")
            s(class="plus-old") {{ priceOf('year') }}
            span(class="plus-new") {{ plusOffer.introPrice }}
          strong(v-else class="plus-plan-price") {{ priceOf('year') }}
          button(v-if="available" type="button" class="lk-btn lk-btn--full lk-btn--small" :disabled="busy" @click="buyPlus('year')") {{ t('app.plus.chooseYear') }}
        div(class="plus-plan")
          span(class="plus-plan-name") {{ t('app.plus.priceMonth') }}
          strong(class="plus-plan-price") {{ priceOf('month') }}
          button(v-if="available" type="button" class="lk-btn lk-btn--outline lk-btn--full lk-btn--small" :disabled="busy" @click="buyPlus('month')") {{ t('app.plus.chooseMonth') }}
      p(v-if="introRuns()" class="plus-intro") {{ t('app.plus.priceIntro', { intro: plusOffer.introPrice, year: plusOffer.year }) }}
      p(v-if="!available && !PLUS_TEST" class="plus-soon") {{ t('app.plus.webHint') }}
      p(v-else-if="!available" class="plus-soon") {{ t('app.plus.soon') }}

      //- what stays free: a list of ticks
      section(class="plus-free")
        h2(class="plus-free-title") {{ t('app.plus.freeTitle') }}
        ul(class="plus-free-list")
          li(v-for="k in FREE" :key="k")
            span(class="plus-tick" aria-hidden="true") ✓
            span {{ t(k) }}

      //- the family: up to five people, one price (switched off in the Android build for now)
      template(v-if="PLUS_FAMILY")
        h3(class="plus-family-title") {{ t('app.plus.familyTitle') }}
        p(class="plus-family-text") {{ t('app.plus.familyText') }}
        div(class="plus-plans")
          div(class="plus-plan is-year")
            span(class="plus-badge") {{ t('app.plus.familySave') }}
            span(class="plus-plan-name") {{ t('app.plus.familyYear') }}
            strong(v-if="introRuns() && plusOffer.familyIntroPrice" class="plus-plan-price")
              s(class="plus-old") {{ priceOf('familyYear') }}
              span(class="plus-new") {{ plusOffer.familyIntroPrice }}
            strong(v-else class="plus-plan-price") {{ priceOf('familyYear') }}
            button(v-if="available" type="button" class="lk-btn lk-btn--full lk-btn--small" :disabled="busy" @click="buyPlus('familyYear')") {{ t('app.plus.chooseFamilyYear') }}
          div(class="plus-plan")
            span(class="plus-plan-name") {{ t('app.plus.familyMonth') }}
            strong(class="plus-plan-price") {{ priceOf('familyMonth') }}
            button(v-if="available" type="button" class="lk-btn lk-btn--outline lk-btn--full lk-btn--small" :disabled="busy" @click="buyPlus('familyMonth')") {{ t('app.plus.chooseFamilyMonth') }}
        p(v-if="introRuns() && plusOffer.familyIntroPrice" class="plus-intro") {{ t('app.plus.priceIntro', { intro: plusOffer.familyIntroPrice, year: plusOffer.familyYear }) }}
        p(class="plus-note") {{ t('app.plus.familyHow') }}

      //- why it exists, short
      div(class="plus-why")
        h2(class="plus-why-title") {{ t('app.plus.whyTitle') }}
        p {{ t('app.plus.whyShort') }}

      //- the small print
      p(class="plus-note") {{ t('app.plus.priceBook') }}: {{ plusOffer.book }}. {{ t('app.plus.priceNote') }}
      router-link(:to="{ name: 'app-features' }" class="plus-link plus-more") {{ t('app.features.title') }}

      //- the rest of the purchase (only in the app from the store): every button asks the parental gate first
      div(v-if="available" class="plus-buy")
        button(type="button" class="lk-btn lk-btn--outline lk-btn--small plus-restore" :disabled="busy" @click="restoreAll")
          | {{ t('app.plus.restore') }}
        p(v-if="status !== 'idle'" class="plus-status" role="status") {{ t(`app.plus.status_${status}`) }}
        p(class="plus-terms") {{ t('app.plus.renewal') }}
        div(class="plus-links")
          button(type="button" class="plus-link" @click="openExternal(manageUrl)") {{ t('app.plus.manage') }}
          button(type="button" class="plus-link" @click="router.push({ name: 'app-legal' })") {{ t('app.plus.privacy') }}
          button(type="button" class="plus-link" @click="openExternal(TERMS_URL)") {{ t('app.plus.terms') }}

      //- only in the test build: try the app with and without Plus
      div(v-if="PLUS_TEST" class="plus-test lk-panel")
        h3(class="plus-test-title") {{ t('app.plus.testTitle') }}
        p(class="plus-test-text") {{ t('app.plus.testText') }}
        button(type="button" class="lk-btn lk-btn--full" :class="plusOn ? 'lk-btn--outline' : ''" @click="setTestPlus(!plusOn)")
          | {{ plusOn ? t('app.plus.testOff') : t('app.plus.testOn') }}
</template>

<style scoped lang="sass">
.plus-body
  display: flex
  flex-direction: column
  gap: 14px
  max-width: 760px
  margin: 8px auto 0
  padding: 0 16px

// the whole picture (16:9, nothing cut off) with the promise on its lower edge
.plus-hero
  position: relative
  border-radius: 28px
  overflow: hidden
  box-shadow: 0 14px 34px -14px rgba(20, 40, 60, 0.5)

  img
    display: block
    width: 100%
    aspect-ratio: 16 / 9
    object-fit: cover

.plus-hero-badge
  position: absolute
  left: 12px
  top: 12px

.plus-hero-line
  margin: 0
  font-size: 1.15rem
  font-weight: 800
  line-height: 1.35
  text-align: center

.plus-h
  margin: 10px 0 0
  font-size: 1.4rem
  font-weight: 800

// what Plus brings: four big cards, each with its own colour and the painted symbol of its place in the app
.plus-cards
  display: grid
  grid-template-columns: 1fr
  gap: 12px

.plus-card
  --tone-a: #fff3cf
  --tone-b: #f9dc8a
  display: flex
  align-items: center
  gap: 16px
  padding: 16px
  border-radius: 26px
  background: linear-gradient(135deg, var(--tone-a), var(--tone-b))
  color: #2f2410
  box-shadow: 0 6px 16px -8px rgba(60, 40, 10, 0.4)

  &.is-rose
    --tone-a: #ffe7e9
    --tone-b: #f6b9c4

  &.is-blue
    --tone-a: #e3eefc
    --tone-b: #aecbf0

  &.is-teal
    --tone-a: #dcf3ec
    --tone-b: #9ed6c6

  h3
    margin: 0 0 4px
    font-size: 1.25rem
    font-weight: 800
    line-height: 1.2

  p
    margin: 0
    font-size: 1rem
    line-height: 1.4
    color: #3d3320

.plus-card-icon
  flex: none
  display: grid
  place-items: center
  width: 84px
  height: 84px
  border-radius: 50%
  background: rgba(255, 255, 255, 0.78)
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5), 0 4px 10px rgba(0, 0, 0, 0.15)

  img
    width: 66px
    height: 66px
    object-fit: contain

// the prices
.plus-plans
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px

.plus-plan
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 8px
  padding: 22px 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  text-align: center

  &.is-year
    border: 2px solid var(--lk-gold)
    background: linear-gradient(180deg, #fff6d6, #fbe39a)
    color: #2f2410
    box-shadow: 0 8px 20px -10px rgba(120, 80, 10, 0.5)

    .plus-plan-name
      color: #5a4510

    .plus-old
      color: #7a6a40

.plus-badge
  align-self: center
  white-space: nowrap
  margin-bottom: 2px
  padding: 3px 14px
  border-radius: 999px
  background: #d9962b
  color: #fff
  font-size: 0.8rem
  font-weight: 800

.plus-plan-name
  font-weight: 700
  color: var(--lk-muted)

.plus-plan-price
  display: flex
  flex-wrap: wrap
  align-items: baseline
  justify-content: center
  font-size: 1.7rem
  line-height: 1.2

.plus-old
  margin-right: 8px
  font-size: 1.2rem
  font-weight: 600
  color: var(--lk-muted)

.plus-new
  color: #a5600c

.plus-intro
  margin: 0
  padding: 10px 12px
  border-radius: 14px
  background: var(--lk-surface-2)
  font-weight: 700
  text-align: center

.plus-soon
  margin: 0
  color: var(--lk-text)
  font-size: 0.95rem
  font-weight: 800
  line-height: 1.4

// what stays free: ticks
.plus-free
  display: flex
  flex-direction: column
  gap: 10px
  padding: 16px 18px
  border-radius: 24px
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)

.plus-free-title
  margin: 0
  font-size: 1.2rem
  font-weight: 800

.plus-free-list
  display: flex
  flex-direction: column
  gap: 9px
  margin: 0
  padding: 0
  list-style: none

  li
    display: flex
    align-items: flex-start
    gap: 12px
    font-size: 1rem
    line-height: 1.4

.plus-tick
  flex: none
  display: grid
  place-items: center
  width: 24px
  height: 24px
  margin-top: 1px
  border-radius: 50%
  background: #2e8b57
  color: #fff
  font-size: 0.85rem
  font-weight: 900

.plus-family-title
  margin: 12px 0 0
  font-size: 1.15rem
  font-weight: 800

.plus-family-text
  margin: 0
  color: var(--lk-muted)
  line-height: 1.35

// why Plus exists
.plus-why
  display: flex
  flex-direction: column
  gap: 8px
  padding: 16px 18px
  border-radius: 22px
  background: var(--lk-accent-soft)

  p
    margin: 0
    font-size: 1.02rem
    line-height: 1.5

.plus-why-title
  margin: 0
  font-size: 1.15rem
  font-weight: 800

.plus-note,
.plus-test-text
  margin: 0
  color: var(--lk-muted)
  font-size: 0.95rem
  line-height: 1.4

.plus-more
  align-self: flex-start

.plus-buy
  display: flex
  flex-direction: column
  gap: 10px

.plus-restore
  align-self: center

.plus-status
  margin: 0
  text-align: center
  font-weight: 800

.plus-terms
  margin: 0
  color: var(--lk-muted)
  font-size: 0.85rem
  line-height: 1.4

.plus-links
  display: flex
  flex-wrap: wrap
  gap: 6px 16px

.plus-link
  padding: 4px 0
  border: none
  background: transparent
  color: var(--lk-accent)
  font: inherit
  font-size: 0.9rem
  font-weight: 700
  text-decoration: underline
  cursor: pointer

.plus-test
  margin-top: 8px
  padding: 14px 16px
  display: flex
  flex-direction: column
  gap: 8px
  border-style: dashed

.plus-test-title
  margin: 0
  font-size: 1.1rem
  font-weight: 800

// tablet and wide: the four cards in two columns
@media (min-width: 640px)
  .plus-cards
    grid-template-columns: 1fr 1fr

  .plus-card
    flex-direction: column
    align-items: flex-start
    text-align: left
</style>
