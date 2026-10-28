<script setup lang="ts">
/**
 * "By bank transfer": a button for the support slide that opens the account (holder, IBAN, purpose) right under it, with a button to
 * copy the IBAN. It shows up only when the account is filled in (data/donation.ts: IBAN and holder), and never on iOS (no gifts outside
 * the app there, as with PayPal and Ko-fi).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ZIconography from '@/components/atoms/ZIconography.vue'
import { bank } from '@/data/donation'
import { isIOS } from '@/utils/platform'

const { t } = useI18n({ useScope: 'global' })

const visible = computed(() => !isIOS && bank.iban.trim().length > 0 && bank.holder.trim().length > 0)
const open = ref(false)
const copied = ref(false)

async function copyIban() {
  try {
    await navigator.clipboard.writeText(bank.iban.replace(/\s/g, ''))
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    // the IBAN is on the screen and can be copied by hand
  }
}
</script>

<template lang="pug">
  div(v-if="visible" class="bank-box")
    button(type="button" class="lk-btn lk-btn--outline bank-open" :aria-expanded="open" @click="open = !open")
      span {{ t('app.home.bankButton') }}
      ZIconography(:name="open ? 'chevron-down' : 'chevron-right'" :size="20")
    dl(v-if="open" class="bank-list")
      div(class="bank-line")
        dt {{ t('app.parent.bankHolder') }}
        dd {{ bank.holder }}
      div(class="bank-line")
        dt IBAN
        dd
          span(class="bank-iban") {{ bank.iban }}
          button(type="button" class="bank-copy" @click="copyIban") {{ copied ? t('app.parent.bankCopied') : t('app.parent.bankCopy') }}
      div(v-if="bank.bic" class="bank-line")
        dt BIC
        dd {{ bank.bic }}
      div(class="bank-line")
        dt {{ t('app.parent.bankPurpose') }}
        dd {{ bank.purpose }}
</template>

<style scoped lang="sass">
.bank-box
  width: 100%
  display: flex
  flex-direction: column
  gap: 10px

.bank-open
  width: 100%
  justify-content: center
  gap: 8px

.bank-list
  margin: 0
  padding: 12px 14px
  display: flex
  flex-direction: column
  gap: 8px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface-2)

.bank-line
  display: flex
  flex-direction: column
  gap: 2px

  dt
    font-size: 0.78rem
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
    font-size: 1rem
    color: var(--lk-text)
    -webkit-user-select: text
    user-select: text

.bank-iban
  letter-spacing: 0.03em

.bank-copy
  min-height: 40px
  padding: 0 16px
  border: 1px solid var(--lk-line)
  border-radius: 20px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-size: 0.9rem
  font-weight: 700
  cursor: pointer
</style>
