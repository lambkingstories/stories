<script setup lang="ts">
/**
 * The parents' window, opened by the "Eltern" button: a floating, softly rounded window with the companion lamb on its rim.
 * It collects everything that is meant for grown-ups: support us (PayPal, Ko-fi, on iOS the in-app tip), the shop, the settings
 * and the legal texts. Everything that leaves the app goes through `openExternal`, which asks the parental gate first.
 * The symbols (PayPal, Ko-fi, shop, settings, shield) are pictures in `public/images/icons/ui/`.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import TipButton from '@/components/molecules/TipButton.vue'
import { isIOS } from '@/utils/platform'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'
import { bank } from '@/data/donation'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

const STORE_URL = 'https://lambking.store'
const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/5CWTQPB6NGWLU'
const KOFI_URL = 'https://ko-fi.com/U6U21YO0Z5'

// a normal bank transfer: shown only when the account is filled in (data/donation.ts)
const showBank = computed(() => !isIOS && bank.iban.trim().length > 0 && bank.holder.trim().length > 0)
const copied = ref('')

async function copy(what: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = what
    setTimeout(() => (copied.value = ''), 1800)
  } catch {
    // the text is on the screen and can be copied by hand
  }
}

const brand = (name: string) => prependBaseUrl(`images/icons/ui/${name}.webp`)

function go(name: string) {
  emit('close')
  void router.push({ name })
}

/** A picture that does not exist yet is simply hidden. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="parent-sheet")
      div(v-if="open" class="sheet-backdrop" @click.self="emit('close')")
        div(class="sheet" role="dialog" aria-modal="true" aria-labelledby="parent-title")
          //- the lamb sits on the upper rim of the window
          LkCompanion(class="sheet-lamb" pose="blick" :size="88")
          div(class="sheet-scroll")
            div(class="sheet-head")
              h2#parent-title(class="sheet-title") {{ t('app.parent.title') }}
              button(type="button" class="sheet-close" :aria-label="t('app.parent.close')" @click="emit('close')")
                ZIconography(name="plus" :size="22" class="close-x")
                span(class="close-label") {{ t('app.parent.close') }}
            p(class="sheet-intro") {{ t('app.parent.intro') }}

            div(class="sheet-rule")

            section(class="support")
              h3(class="support-title") {{ t('app.parent.supportTitle') }}
              p(class="support-text") {{ t('app.parent.supportText') }}
              div(class="support-actions")
                TipButton(v-if="isIOS")
                template(v-else)
                  button(type="button" class="support-btn is-main" @click="openExternal(PAYPAL_URL)")
                    img(:src="brand('paypal')" alt="" class="brand-img" draggable="false" @error="hideBroken")
                    span {{ t('app.parent.viaPaypal') }}
                  button(type="button" class="support-btn is-second" @click="openExternal(KOFI_URL)")
                    img(:src="brand('kofi')" alt="" class="brand-img" draggable="false" @error="hideBroken")
                    span {{ t('app.parent.viaKofi') }}

            section(v-if="showBank" class="bank")
              h3(class="bank-title") {{ t('app.parent.bankTitle') }}
              dl(class="bank-list")
                div(class="bank-line")
                  dt {{ t('app.parent.bankHolder') }}
                  dd {{ bank.holder }}
                div(class="bank-line")
                  dt IBAN
                  dd
                    span(class="bank-iban") {{ bank.iban }}
                    button(type="button" class="bank-copy" @click="copy('iban', bank.iban.replace(/\s/g, ''))") {{ copied === 'iban' ? t('app.parent.bankCopied') : t('app.parent.bankCopy') }}
                div(v-if="bank.bic" class="bank-line")
                  dt BIC
                  dd {{ bank.bic }}
                div(v-if="bank.bankName" class="bank-line")
                  dt {{ t('app.parent.bankName') }}
                  dd {{ bank.bankName }}
                div(class="bank-line")
                  dt {{ t('app.parent.bankPurpose') }}
                  dd {{ bank.purpose }}

            button(type="button" class="sheet-row" @click="openExternal(STORE_URL)")
              ZIconography(name="shop" :size="30" class="row-icon")
              span(class="row-text")
                span(class="row-title") {{ t('app.parent.shopTitle') }}
                span(class="row-sub") {{ t('app.parent.shopText') }}
              ZIconography(name="chevron-right" :size="22")

            button(type="button" class="sheet-row" @click="go('app-profile')")
              ZIconography(name="settings" :size="30" class="row-icon")
              span(class="row-text")
                span(class="row-title") {{ t('app.parent.settingsTitle') }}
                span(class="row-sub") {{ t('app.parent.settingsText') }}
              ZIconography(name="chevron-right" :size="22")

            button(type="button" class="sheet-row" @click="go('app-legal')")
              ZIconography(name="shield" :size="30" class="row-icon")
              span(class="row-text")
                span(class="row-title") {{ t('app.parent.legalTitle') }}
                span(class="row-sub") {{ t('app.parent.legalText') }}
              ZIconography(name="chevron-right" :size="22")
</template>

<style scoped lang="sass">
.sheet-backdrop
  position: fixed
  inset: 0
  z-index: 80
  display: flex
  align-items: flex-end
  justify-content: center
  background: rgba(8, 16, 26, 0.55)

// a floating window with room around it, not a sheet that touches the screen edges
.sheet
  position: relative
  width: calc(100% - 28px)
  max-width: 560px
  margin: 0 14px calc(14px + env(safe-area-inset-bottom, 0px))
  border-radius: var(--lk-r-panel)
  background: var(--lk-surface)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  box-shadow: 0 20px 50px -14px rgba(0, 0, 0, 0.55)

.sheet-lamb
  position: absolute
  right: 24px
  top: -66px
  z-index: 1

.sheet-scroll
  max-height: calc(86vh - 70px)
  overflow-y: auto
  padding: 24px 20px 20px
  display: flex
  flex-direction: column
  gap: 14px

.sheet-head
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 12px

.sheet-title
  margin: 0
  font-size: 2rem
  font-weight: 800
  line-height: 1.1

.sheet-close
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-width: 56px
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  cursor: pointer

  .z-icon
    width: 48px
    height: 48px
    border: 1px solid var(--lk-line)
    border-radius: 50%
    display: flex
    align-items: center
    justify-content: center
    background: var(--lk-surface)

.close-x
  transform: rotate(45deg)

.close-label
  font-size: 0.8rem
  color: var(--lk-muted)

.sheet-intro
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

.sheet-rule
  height: 1px
  background: var(--lk-line)

.support-title
  margin: 0
  font-size: 1.4rem
  font-weight: 800

.support-text
  margin: 2px 0 0
  color: var(--lk-muted)
  font-size: 1.05rem

.support-actions
  // one button per row, full width: the label stays on ONE line (also with the longer English and Spanish words)
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 10px
  margin-top: 12px

// the two support buttons: wide capsules with the sign of the service on the left and the label on one line
.support-btn
  display: flex
  align-items: center
  justify-content: flex-start
  gap: 12px
  min-height: 60px
  padding: 8px 18px
  border: 1px solid transparent
  border-radius: 32px
  font-family: inherit
  // shrinks a little on narrow phones instead of breaking the line
  font-size: clamp(0.82rem, 4.3vw, 1.05rem)
  font-weight: 700
  line-height: 1.2
  text-align: left
  white-space: nowrap
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

  span
    flex: 1
    min-width: 0
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  &.is-main
    background: var(--lk-accent)
    color: var(--lk-on-accent)

  &.is-second
    background: var(--lk-read)
    color: var(--lk-on-color)

:root[data-theme='night'] .support-btn.is-second
  background: transparent
  border-color: rgba(244, 244, 238, 0.45)

.brand-img
  flex: none
  width: 34px
  height: 34px
  object-fit: contain
  display: block

.sheet-row
  display: flex
  align-items: center
  gap: 14px
  min-height: 88px
  padding: 14px 16px
  text-align: left
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: transparent
  color: var(--lk-text)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.row-icon
  flex: none
  color: var(--lk-accent)

.sheet-row :deep(.z-icon-outline)
  color: currentColor

.row-text
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 5px

.row-title
  font-weight: 800
  font-size: 1.15rem
  line-height: 1.25

.row-sub
  font-size: 0.95rem
  line-height: 1.35
  color: var(--lk-muted)

.bank
  padding: 14px 16px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)

.bank-title
  margin: 0 0 8px
  font-weight: 800
  font-size: 1.15rem

.bank-list
  margin: 0
  display: flex
  flex-direction: column
  gap: 8px

.bank-line
  display: flex
  flex-direction: column
  gap: 2px

  dt
    font-size: 0.8rem
    font-weight: 700
    color: var(--lk-muted)
    text-transform: uppercase
    letter-spacing: 0.04em

  dd
    margin: 0
    display: flex
    align-items: center
    flex-wrap: wrap
    gap: 10px
    font-weight: 700
    font-size: 1.02rem
    -webkit-user-select: text
    user-select: text

.bank-iban
  letter-spacing: 0.03em
  -webkit-user-select: text
  user-select: text

.bank-copy
  min-height: 40px
  padding: 0 16px
  border: 1px solid var(--lk-line)
  border-radius: 20px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-size: 0.9rem
  font-weight: 700
  cursor: pointer

.parent-sheet-enter-active,
.parent-sheet-leave-active
  transition: opacity 180ms ease-out
  .sheet
    transition: transform 220ms ease-out

.parent-sheet-enter-from,
.parent-sheet-leave-to
  opacity: 0
  .sheet
    transform: translateY(30px)
</style>
