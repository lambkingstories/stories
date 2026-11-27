<script setup lang="ts">
/**
 * "Lesen → Books → Vorschau" and "Jetzt lesen": both are read the same way, full screen with pages that turn (`BookFlip`; Anton 27.11.2026).
 * The look inside has the cover, the sample pages and a closing page: a book that is for sale as a digital book (`digital` in `storeBooks`)
 * offers "Digital kaufen" there (one purchase of the store, not part of Plus) and the printed book (a button to the store, which leaves the
 * app through `openExternal`, which asks the parents first); who owns it finds "Jetzt lesen" and "Als PDF speichern" instead. A book that
 * is not in the store yet ("coming soon") only says that it comes soon. The route "lesen" shows all pages of a bought book.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BookFlip from '@/components/molecules/BookFlip.vue'
import type { BookFlipEnd, BookFlipPage } from '@/components/atoms/BookFlipPage.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import { storeBooks } from '@/data/storeBooks'
import { bookProductId } from '@/data/plusProducts'
import usePremium, { PLUS_TEST } from '@/use/usePremium'
import usePurchases from '@/use/usePurchases'
import { goBackTo } from '@/utils/navBack'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

const book = computed(() => storeBooks.find((b) => b.id === String(route.params.bookId)) ?? null)

const { ownsBook, setTestBook } = usePremium()
const purchases = usePurchases()
/** The person has bought this book as a digital book. */
const owned = computed(() => !!book.value?.digital && ownsBook(book.value.id))
/** The whole book is read (the route "lesen", and the book is owned); anything else is the look inside. */
const fullBook = computed(() => route.name === 'app-book-read' && owned.value)
const price = computed(() => (book.value?.digital ? (purchases.prices.value[bookProductId(book.value.id)] ?? book.value.digital.price) : ''))

function goBack() {
  goBackTo(router, { name: 'app-books' })
}

function toStore() {
  if (book.value) void openExternal(book.value.url)
}

/** The digital book is bought through the store of the phone (the parental gate comes first); the test build only pretends. */
function buyDigital() {
  if (book.value) void purchases.buyBook(book.value.id)
}

/** The whole book, page by page. */
function toRead() {
  if (book.value) void router.push({ name: 'app-book-read', params: { bookId: book.value.id } })
}

/** The whole book as a file: the PDF is laid on the device. */
function download() {
  if (!book.value?.digital) return
  const a = document.createElement('a')
  a.href = prependBaseUrl(book.value.digital.pdf)
  a.download = `${book.value.title.de}.pdf`
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}

/** Said under the buy button when the purchase did not go through. */
const buyMessage = computed(() => {
  const s = purchases.status.value
  if (s === 'pending') return t('app.read.digitalPending')
  if (s === 'failed') return t('app.read.digitalFailed')
  if (s === 'unavailable') return t('app.read.digitalUnavailable')
  return ''
})

/** The closing page of the look inside. */
const endPage = computed<BookFlipEnd>(() => {
  const b = book.value!
  const cover = prependBaseUrl(b.cover)
  if (b.comingSoon) return { cover, badge: t('app.read.comingSoon'), title: t('app.read.previewSoonTitle'), text: t('app.read.previewSoonText'), buttons: [] }
  if (owned.value) {
    const buttons: BookFlipEnd['buttons'] = [
      { label: t('app.read.digitalRead'), kind: 'primary', testid: 'bp-read', action: toRead },
      { label: t('app.read.digitalDownload'), kind: 'outline', testid: 'bp-download', action: download }
    ]
    if (PLUS_TEST) buttons.push({ label: t('app.read.digitalTestUndo'), kind: 'link', testid: 'bp-test-undo', action: () => setTestBook(b.id, false) })
    return { cover, title: t('app.read.digitalOwned'), text: t('app.read.digitalOwnedText'), buttons }
  }
  const store = (label: string, kind: 'primary' | 'outline') => ({ label, kind, testid: 'bp-store', action: toStore })
  if (b.digital) {
    return {
      cover,
      title: t('app.read.previewBuyTitle'),
      text: t('app.read.digitalBuyText'),
      note: buyMessage.value || t('app.read.digitalNote'),
      buttons: [
        { label: t('app.read.digitalBuy', { price: price.value }), kind: 'primary', testid: 'bp-digital', disabled: purchases.status.value === 'purchasing', action: buyDigital },
        store(t('app.read.printedBook'), 'outline')
      ]
    }
  }
  return { cover, title: t('app.read.previewBuyTitle'), text: t('app.read.previewBuyText'), note: t('app.read.storeParents'), buttons: [store(t('app.read.storeButton'), 'primary')] }
})

/** The whole book, or the cover, the sample pages and the closing page. */
const pages = computed<BookFlipPage[]>(() => {
  const b = book.value
  if (!b) return []
  if (fullBook.value) return b.digital!.pages.map((p) => prependBaseUrl(p.src))
  return [prependBaseUrl(b.cover), ...(b.preview?.pages ?? []).map((p) => prependBaseUrl(p.src)), { end: endPage.value }]
})

onMounted(() => {
  purchases.resetPurchaseStatus()
  if (book.value?.digital) void purchases.loadBookPrice(book.value.id)
})
</script>

<template lang="pug">
  div(class="bp-page")
    //- a full-screen reader on top of everything (the page below stays empty); the look inside and the whole book each start at the cover
    Teleport(v-if="book" to="body")
      BookFlip(:key="fullBook ? 'lesen' : 'vorschau'" :pages="pages" :ratio="book.coverRatio ?? 1" @close="goBack")
    template(v-else)
      button(type="button" class="bp-back lk-btn lk-btn--outline lk-btn--small" @click="goBack")
        ZIconography(name="chevron-left" :size="20")
        span {{ t('app.read.back') }}
      p(class="bp-empty") {{ t('app.read.booksEmpty') }}
</template>

<style scoped lang="sass">
.bp-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)

.bp-back
  margin: 16px
  gap: 4px
  padding: 0 18px 0 10px

.bp-empty
  text-align: center
  color: var(--lk-muted)
  margin: 32px 0
</style>
