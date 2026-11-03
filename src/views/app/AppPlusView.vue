<script setup lang="ts">
/**
 * The page about LambKing Plus, meant for parents (it is reached from the window for parents and from the slide on the start page).
 * It says what Plus brings, what stays free for ever and what it costs. There is no purchase yet (stage 2): in the test build a switch
 * lets Anton try the app with Plus on and off.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import usePremium, { PLUS_TEST } from '@/use/usePremium'
import { introRuns, plusOffer } from '@/data/plus'
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

// every line has the symbol of the part of the app it belongs to (the same ones as in the bar at the bottom)
const symbol = (name: string) => prependBaseUrl(`images/icons/navi/${name}.webp`)
/**
 * The four areas of the app, each with what Plus adds and what stays free (the texts are `app.plus.area<N>Get<M>` / `area<N>Free<M>`).
 * The family area is free for everybody: that is a promise, so it has no "with Plus" part.
 */
const areas = [
  { n: 1, icon: 'lesen', gets: 2, free: 2 },
  { n: 2, icon: 'abenteuer', gets: 5, free: 3 },
  { n: 3, icon: 'malen', gets: 2, free: 3 },
  { n: 4, icon: 'ich', gets: 0, free: 4 }
]
const hero = prependBaseUrl('images/bg/willkommen-plus-2.webp')
</script>

<template lang="pug">
  div(class="app-page plus-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    LkPageHead(:title="t('app.plus.title')" :subtitle="t('app.plus.subtitle')" :lamb="false" @back="goBack")

    section(class="section-wrap plus-body")
      div(class="plus-hero")
        img(:src="hero" alt="" draggable="false")

      p(class="plus-state" :class="{ 'is-on': plusOn }" role="status")
        ZIconography(name="star" :size="22")
        span {{ plusOn ? t('app.plus.stateOn') : t('app.plus.stateOff') }}

      router-link(:to="{ name: 'app-features' }" class="lk-btn lk-btn--outline lk-btn--full") {{ t('app.features.title') }}

      //- why it exists: the work behind the stories, and that Plus is a way to help
      div(class="plus-why")
        h2(class="plus-h") {{ t('app.plus.whyTitle') }}
        p {{ t('app.plus.whyText1') }}
        p {{ t('app.plus.whyText2') }}
        p(class="plus-why-free") {{ t('app.plus.whyText3') }}

      h2(class="plus-h") {{ t('app.plus.areasTitle') }}
      div(class="plus-areas")
        section(v-for="a in areas" :key="a.n" :class="['plus-area', { 'is-family': a.gets === 0 }]")
          header(class="plus-area-head")
            img(:src="symbol(a.icon)" alt="" draggable="false")
            h3 {{ t(`app.plus.area${a.n}Title`) }}
          div(v-if="a.gets" class="plus-block")
            span(class="plus-tag is-plus") {{ t('app.plus.tagPlus') }}
            ul(class="plus-list")
              li(v-for="m in a.gets" :key="m" class="is-plus") {{ t(`app.plus.area${a.n}Get${m}`) }}
          div(class="plus-block")
            span(class="plus-tag is-free") {{ t('app.plus.tagFree') }}
            ul(class="plus-list")
              li(v-for="m in a.free" :key="m" class="is-free") {{ t(`app.plus.area${a.n}Free${m}`) }}

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
      //- the family: up to five people, one price
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
      p(class="plus-note") {{ t('app.plus.priceBook') }}: {{ plusOffer.book }}. {{ t('app.plus.priceNote') }}
      p(v-if="!available && !PLUS_TEST" class="plus-soon") {{ t('app.plus.webHint') }}
      p(v-else-if="!available" class="plus-soon") {{ t('app.plus.soon') }}

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

      p(class="plus-help") {{ t('app.plus.donateHint') }}

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
  gap: 12px
  max-width: 760px
  margin: 8px auto 0
  padding: 0 16px

.plus-hero
  border-radius: 26px
  overflow: hidden
  box-shadow: 0 12px 30px -14px rgba(20, 40, 60, .45)

  img
    display: block
    width: 100%
    height: 200px
    object-fit: cover
    object-position: 50% 50%

.plus-state
  display: flex
  align-items: center
  gap: 10px
  margin: 0
  padding: 12px 16px
  border: 1px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface)
  font-weight: 700
  font-size: 1rem
  line-height: 1.35

  &.is-on
    border-color: var(--lk-gold)
    background: var(--lk-accent-soft)

// why Plus exists
.plus-why
  display: flex
  flex-direction: column
  gap: 8px
  padding: 16px 18px
  border-radius: 22px
  background: var(--lk-accent-soft)

  .plus-h
    margin: 0

  p
    margin: 0
    font-size: 1.02rem
    line-height: 1.5

.plus-why-free
  font-weight: 700

.plus-h
  margin: 14px 0 0
  font-size: 1.3rem
  font-weight: 800

// the lines of what Plus brings and what stays free: the symbol of the part of the app in front
.plus-rows
  margin: 0
  padding: 6px 16px
  list-style: none
  display: flex
  flex-direction: column

  li
    display: flex
    align-items: center
    gap: 14px
    padding: 11px 0
    font-size: 1.02rem
    line-height: 1.4

    & + li
      border-top: 1px solid var(--lk-line)

  img
    flex: 0 0 auto
    width: 34px
    height: 34px
    object-fit: contain

.plus-rows.is-free img
  opacity: .8

// one card per area of the app: what Plus adds (golden) and what stays free
.plus-areas
  display: grid
  gap: 12px

.plus-area
  display: flex
  flex-direction: column
  gap: 12px
  padding: 16px 16px 18px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

  &.is-family
    background: var(--lk-accent-soft)

.plus-area-head
  display: flex
  align-items: center
  gap: 12px

  img
    flex: none
    width: 46px
    height: 46px
    object-fit: contain

  h3
    margin: 0
    font-size: 1.25rem
    font-weight: 800

.plus-block
  display: flex
  flex-direction: column
  gap: 6px

.plus-tag
  align-self: flex-start
  padding: 2px 12px
  border-radius: 999px
  font-size: 0.74rem
  font-weight: 800
  letter-spacing: 0.04em
  text-transform: uppercase

  &.is-plus
    background: var(--lk-gold)
    color: #3a2c10

  &.is-free
    background: var(--lk-surface-2)
    color: var(--lk-muted)

.plus-list
  margin: 0
  padding: 0
  list-style: none
  display: grid
  gap: 6px

  li
    position: relative
    padding-left: 28px
    font-size: 1rem
    line-height: 1.4

    &::before
      content: ''
      position: absolute
      left: 4px
      top: 0.42em
      width: 12px
      height: 12px
      border-radius: 50%

    &.is-plus::before
      background: var(--lk-gold)
      box-shadow: 0 0 0 3px rgba(230, 184, 64, 0.25)

    &.is-free::before
      background: var(--lk-line)

.plus-old
  margin-right: 8px
  font-weight: 600
  color: var(--lk-muted)

.plus-new
  color: #b3751a

// the two ways to help
.plus-plans
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px

.plus-plan
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-end
  gap: 6px
  padding: 22px 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 22px
  background: var(--lk-surface)
  text-align: center

  &.is-year
    border: 2px solid var(--lk-gold)
    background: var(--lk-accent-soft)

.plus-badge
  position: absolute
  top: -11px
  left: 50%
  transform: translateX(-50%)
  padding: 2px 12px
  border-radius: 999px
  background: var(--lk-gold)
  color: #3a2c10
  font-size: 0.78rem
  font-weight: 800

.plus-plan-name
  font-weight: 700
  color: var(--lk-muted)

.plus-plan-price
  display: flex
  flex-wrap: wrap
  align-items: baseline
  justify-content: center
  font-size: 1.5rem
  line-height: 1.2

.plus-family-title
  margin: 12px 0 0
  font-size: 1.1rem
  font-weight: 800

.plus-family-text
  margin: 0
  color: var(--lk-muted)
  line-height: 1.35

.plus-intro
  margin: 0
  padding: 10px 12px
  border-radius: 14px
  background: var(--lk-surface-2)
  font-weight: 700
  text-align: center

.plus-note,
.plus-soon,
.plus-help,
.plus-test-text
  margin: 0
  color: var(--lk-muted)
  font-size: 0.95rem
  line-height: 1.4

.plus-soon
  color: var(--lk-text)
  font-weight: 800

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
</style>
