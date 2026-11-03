<script setup lang="ts">
/**
 * Small sheet shown when a child taps something locked behind LambKing Plus.
 * It is only reachable when `VITE_PREMIUM_TEASER=true` (see `usePremium`).
 * For a coloring book it offers the two ways to open it (Plus, or this one book); for everything else one way to the page about Plus.
 * Every way to spend money goes through the parental gate (inside `usePurchases` and `requireParent`).
 */
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import usePremium, { PLUS_TEST, setTestBook } from '@/use/usePremium'
import usePurchases from '@/use/usePurchases'
import { introRuns, plusOffer } from '@/data/plus'
import { bookProductId } from '@/data/plusProducts'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'
import { useRouter } from 'vue-router'
import { requireParent } from '@/use/useParentalGate'

const { t } = useI18n({ useScope: 'global' })
const { upsellFeature, upsellContext, isOpen, closeUpsell } = usePremium()
const router = useRouter()
const purchases = usePurchases()
const crown = prependBaseUrl('images/icons/navi/plus.webp')

/** The single book of the open sheet can be bought for good (in the app from the store; the test build pretends). */
const bookId = computed(() => upsellContext.value?.bookId ?? '')
const bookPrice = computed(() => purchases.prices.value[bookProductId(bookId.value)] ?? plusOffer.book)
const monthPrice = computed(() => purchases.prices.value.month ?? plusOffer.month)
const yearPrice = computed(() => purchases.prices.value.year ?? plusOffer.year)
const canBuyBook = computed(() => !!bookId.value && (purchases.available || PLUS_TEST))
watch(bookId, (id) => {
  purchases.resetPurchaseStatus()
  if (id) void purchases.loadBookPrice(id)
})

async function buyThisBook() {
  if (!purchases.available) {
    // the test build: the purchase is only pretended, so the book can be tried
    if (await requireParent()) {
      setTestBook(bookId.value, true)
      closeUpsell()
    }
    return
  }
  await purchases.buyBook(bookId.value)
  if (purchases.status.value === 'done') closeUpsell()
}

/** The page about Plus is for grown-ups, so the way there leads through the parental gate. */
async function openPlusPage() {
  if (!(await requireParent())) return
  closeUpsell()
  void router.push({ name: 'app-plus' })
}

/** The printed book is somewhere else on the internet. */
async function openShop() {
  const link = upsellContext.value?.shopLink
  if (!link) return
  await openExternal(link)
}

function onKey(e: KeyboardEvent) {
  if (isOpen.value && e.key === 'Escape') closeUpsell()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="premium-sheet")
      div(
        v-if="isOpen"
        class="premium-backdrop fixed inset-0 z-[85] flex items-center justify-center px-5"
        @click.self="closeUpsell"
      )
        div(class="premium-panel" role="dialog" aria-modal="true" aria-labelledby="premium-title")
          button(type="button" class="premium-x" :aria-label="t('app.premium.close')" @click="closeUpsell") ×
          span(class="premium-crown")
            img(:src="crown" alt="" draggable="false")
          h3#premium-title(class="premium-title") {{ upsellContext ? t(`app.premium.bookTitle_${upsellContext.kind}`) : t('app.premium.title') }}
          p(v-if="upsellContext" class="premium-text") {{ t(`app.premium.bookShort_${upsellContext.kind}`, { total: upsellContext.totalPages }) }}
          p(v-else class="premium-text") {{ t(`app.premium.${upsellFeature}`) }}

          //- a coloring book: the two ways to open it
          div(v-if="upsellContext" class="premium-opts")
            button(type="button" class="premium-opt is-plus" @click="openPlusPage")
              span(class="premium-opt-name") {{ t('app.premium.optPlus') }}
              span(class="premium-opt-price") {{ monthPrice }}
              span(class="premium-opt-sub") {{ t('app.premium.optPlusMonth') }}
            button(type="button" class="premium-opt is-plus is-best" @click="openPlusPage")
              span(class="premium-badge") {{ t('app.plus.cheaper') }}
              span(class="premium-opt-name") {{ t('app.premium.optPlus') }}
              span(class="premium-opt-price") {{ introRuns() && plusOffer.introPrice ? plusOffer.introPrice : yearPrice }}
              span(class="premium-opt-sub")
                s(v-if="introRuns() && plusOffer.introPrice" class="premium-old") {{ yearPrice }}
                | {{ t('app.premium.optPlusYear') }}
            button(v-if="canBuyBook" type="button" class="premium-opt is-book" :disabled="purchases.status.value === 'purchasing'" @click="buyThisBook")
              span(class="premium-opt-name") {{ t('app.premium.optBook') }}
              span(class="premium-opt-price") {{ bookPrice }}
              span(class="premium-opt-sub") {{ t('app.premium.optBookSub') }}
          button(v-else type="button" class="premium-cta" @click="openPlusPage") {{ t('app.premium.more') }}

          p(v-if="purchases.status.value !== 'idle' && purchases.status.value !== 'done'" class="premium-status" role="status") {{ t(`app.plus.status_${purchases.status.value}`) }}
          button(v-if="upsellContext?.shopLink" type="button" class="premium-link" @click="openShop") {{ t('app.premium.shop') }} ›
</template>

<style scoped lang="sass">
.premium-backdrop
  background-color: rgba(8, 16, 26, 0.6)
  backdrop-filter: blur(4px)

.premium-panel
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  width: 100%
  max-width: min(360px, 92vw)
  padding: 40px 18px 18px
  margin-top: 34px
  border-radius: 30px
  text-align: center
  background: linear-gradient(180deg, var(--lk-surface) 0%, var(--lk-bg) 100%)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  box-shadow: 0 22px 54px -14px rgba(0, 0, 0, 0.55)

// the golden crown sits on the rim, like a medal
.premium-crown
  position: absolute
  top: -34px
  left: 50%
  transform: translateX(-50%)
  display: grid
  place-items: center
  width: 68px
  height: 68px
  border-radius: 50%
  background: radial-gradient(circle at 35% 30%, #fffdf5, #f6ecd2)
  border: 2px solid var(--lk-gold)
  box-shadow: 0 8px 18px -6px rgba(90, 60, 10, 0.45)

  img
    width: 44px
    height: 44px
    object-fit: contain

.premium-x
  position: absolute
  top: 10px
  right: 12px
  width: 34px
  height: 34px
  border: none
  border-radius: 50%
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  font: inherit
  font-size: 1.4rem
  line-height: 1
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.premium-title
  margin: 8px 0 0
  font-size: 1.4rem
  font-weight: 800
  color: var(--lk-text)

.premium-text
  margin: 6px 0 0
  font-size: 1rem
  line-height: 1.4
  color: var(--lk-muted)

// the two ways to open a book
.premium-opts
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px
  width: 100%
  margin-top: 16px

.premium-opt
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px
  position: relative
  min-height: 104px
  padding: 14px 8px 10px
  border: 1px solid var(--lk-line)
  border-radius: 20px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  cursor: pointer
  box-shadow: var(--lk-shadow)
  -webkit-tap-highlight-color: transparent
  transition: transform 120ms ease-out

  &:active
    transform: scale(0.97)

  &:disabled
    opacity: 0.6

  // Plus is the golden choice
  &.is-plus
    border: 2px solid var(--lk-gold)
    background: linear-gradient(180deg, #fff8e2 0%, #f6e6b6 100%)
    color: #4a3410

    .premium-opt-sub
      color: #7a5d22

.premium-opt.is-book
  grid-column: 1 / -1
  min-height: 76px

.premium-badge
  position: absolute
  top: -10px
  left: 50%
  transform: translateX(-50%)
  padding: 1px 10px
  border-radius: 999px
  background: var(--lk-gold)
  color: #3a2c10
  font-size: 0.72rem
  font-weight: 800
  white-space: nowrap

.premium-old
  margin-right: 5px
  text-decoration: line-through

.premium-opt-name
  font-weight: 800
  font-size: 0.95rem

.premium-opt-price
  font-weight: 900
  font-size: 1.35rem
  line-height: 1.15

.premium-opt-sub
  font-size: 0.8rem
  line-height: 1.25
  color: var(--lk-muted)

// one big button for the other locked things
.premium-cta
  width: 100%
  min-height: 54px
  margin-top: 16px
  border: none
  border-radius: 999px
  background: linear-gradient(180deg, #f9e5a6 0%, #e6b840 100%)
  color: #4a3410
  font: inherit
  font-weight: 800
  font-size: 1.02rem
  cursor: pointer
  box-shadow: 0 8px 16px -8px rgba(120, 80, 10, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.7)
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

.premium-status
  margin: 12px 0 0
  font-size: 0.95rem
  font-weight: 800

.premium-link
  margin-top: 14px
  padding: 4px 8px
  border: none
  background: transparent
  color: var(--lk-accent)
  font: inherit
  font-size: 0.92rem
  font-weight: 700
  cursor: pointer
</style>
