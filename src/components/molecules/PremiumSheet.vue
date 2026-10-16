<script setup lang="ts">
/**
 * Small sheet shown when a child taps something locked behind LambKing Plus.
 * It is only reachable when `VITE_PREMIUM_TEASER=true` (see `usePremium`).
 * There is no purchase button yet: until the store products exist it just says
 * the feature is coming. The buy button goes here later, behind `requireParent()`.
 */
import { onMounted, onUnmounted } from 'vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import { useI18n } from 'vue-i18n'
import usePremium from '@/use/usePremium'
import { openExternal } from '@/utils/openExternal'

const { t } = useI18n({ useScope: 'global' })
const { upsellFeature, upsellContext, isOpen, closeUpsell } = usePremium()

/** The printed book is somewhere else on the internet, so the way there goes through the parental gate. */
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
        div(class="premium-wrap")
          LkCompanion(class="premium-lamb" pose="blick" :size="88")
          div(class="premium-panel" role="dialog" aria-modal="true" aria-labelledby="premium-title")
            h3#premium-title(class="premium-title") {{ upsellContext ? t(`app.premium.bookTitle_${upsellContext.kind}`) : t('app.premium.title') }}
            p(v-if="upsellContext" class="premium-text") {{ t(`app.premium.bookText_${upsellContext.kind}`, { title: upsellContext.title, free: upsellContext.freePages, total: upsellContext.totalPages }) }}
            p(v-else class="premium-text") {{ t(`app.premium.${upsellFeature}`) }}
            p(class="premium-soon") {{ t('app.premium.soon') }}
            button(type="button" class="premium-ok lk-btn lk-btn--full" @click="closeUpsell") {{ t('app.premium.ok') }}
            button(v-if="upsellContext?.shopLink" type="button" class="premium-shop lk-btn lk-btn--outline lk-btn--full" @click="openShop") {{ t('app.premium.shop') }}
</template>

<style scoped lang="sass">
.premium-backdrop
  background-color: rgba(8, 16, 26, 0.6)
  backdrop-filter: blur(4px)

.premium-wrap
  position: relative
  width: 100%
  max-width: min(360px, 92vw)
  margin-top: 56px

.premium-lamb
  position: absolute
  left: 50%
  top: -62px
  transform: translateX(-50%)
  z-index: 1

.premium-panel
  width: 100%
  padding: 34px 20px 20px
  border-radius: var(--lk-r-panel)
  text-align: center
  background: var(--lk-surface)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  box-shadow: 0 18px 50px -12px rgba(0, 0, 0, 0.5)

.premium-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800
  color: var(--lk-text)

.premium-text
  margin: 8px 0 0
  font-size: 1.02rem
  line-height: 1.45
  color: var(--lk-muted)

.premium-soon
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800
  color: var(--lk-text)

.premium-ok
  margin-top: 16px

.premium-shop
  margin-top: 10px
</style>
