<script setup lang="ts">
/**
 * "Who travels along?": the setup of the players on the map table. Eight travel tokens lie in a row; a tap on the n-th one makes n
 * players. Below, every player has a parchment strip with the token and a field for the name. The count and the names live in the game
 * that uses this (`v-model:count`, `v-model:names`).
 */
import { useI18n } from 'vue-i18n'
import MapPaper from './MapPaper.vue'
import MapToken from './MapToken.vue'
import { MAP_MAX_PLAYERS } from './tokenColors'
import { ref } from 'vue'
import useFamilyTokens from '@/use/useFamilyTokens'

const props = withDefaults(defineProps<{ count: number; names: string[]; min?: number; max?: number; question?: string; placeholderKey?: string; fixed?: boolean }>(), { min: 1, max: MAP_MAX_PLAYERS, question: '', placeholderKey: 'app.family.player', fixed: false })
const emit = defineEmits<{ 'update:count': [n: number]; 'update:names': [names: string[]] }>()
const { t } = useI18n({ useScope: 'global' })
const { tokens, setToken } = useFamilyTokens()
/** The seat whose token row is open (-1: none). */
const picking = ref(-1)

function pick(seat: number, token: number) {
  setToken(seat, token)
  picking.value = -1
}

function setName(i: number, v: string) {
  const next = props.names.slice()
  next[i] = v
  emit('update:names', next)
}

// (the cast to the input lives here: TypeScript is not allowed inside the pug template)
function onInput(i: number, e: Event) {
  setName(i, (e.target as HTMLInputElement).value)
}
</script>

<template lang="pug">
  div(class="ms")
    h2(v-if="!fixed" class="ms-q") {{ question || t('app.family.howMany') }}
    div(v-if="!fixed" class="ms-tokens" role="radiogroup")
      button(
        v-for="n in max"
        :key="n"
        v-show="n >= min"
        type="button"
        role="radio"
        :aria-checked="count === n"
        :aria-label="String(n)"
        :class="['ms-tok', { 'is-in': n <= count, 'is-last': n === count }]"
        @click="emit('update:count', n)"
      )
        MapToken(:index="n - 1" :size="46" :lit="n === count" :dim="n > count")
        span(class="ms-n") {{ n }}
    div(class="ms-names")
      template(v-for="i in count" :key="i")
        MapPaper(kind="strip")
          button(type="button" class="ms-own" :aria-label="t('app.family.pickToken')" :aria-expanded="picking === i - 1" @click="picking = picking === i - 1 ? -1 : i - 1")
            MapToken(:index="i - 1" :size="34")
            span(class="ms-swap" aria-hidden="true") ⇅
          input(
            :value="names[i - 1] ?? ''"
            class="ms-input"
            type="text"
            maxlength="16"
            :placeholder="t(placeholderKey, { n: i })"
            :aria-label="t(placeholderKey, { n: i })"
            @input="onInput(i - 1, $event)"
          )
        MapPaper(v-if="picking === i - 1" kind="strip" class="ms-pick")
          span(class="ms-pick-row" role="radiogroup" :aria-label="t('app.family.pickToken')")
            button(
              v-for="k in 8"
              :key="k"
              type="button"
              role="radio"
              :aria-checked="tokens[i - 1] === k - 1"
              :class="['ms-pick-tok', { 'is-mine': tokens[i - 1] === k - 1 }]"
              @click="pick(i - 1, k - 1)"
            )
              MapToken(:index="k - 1" raw :size="34")
</template>

<style scoped lang="sass">
.ms
  display: flex
  flex-direction: column
  gap: 14px
  width: 100%

.ms-q
  margin: 0
  font-size: 1.35rem
  font-weight: 800
  text-align: center
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9)

.ms-tokens
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 8px 4px
  justify-items: center

.ms-tok
  display: grid
  justify-items: center
  gap: 2px
  padding: 4px 0
  border: 0
  background: transparent
  color: var(--mp-cream, #f6ead0)
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.ms-n
  font-size: 0.95rem
  font-weight: 800
  color: #3a2812
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7)

.ms-tok
  padding: 4px 6px
  border-radius: 12px

.ms-tok:not(.is-in)
  background: rgba(255, 246, 214, 0.62)
  border: 2px solid rgba(154, 107, 28, 0.6)

  .ms-n
    opacity: 0.8

.ms-names
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 8px

  :deep(.mpa-in)
    gap: 8px
    justify-content: flex-start

.ms-own
  display: flex
  align-items: center
  gap: 1px
  flex: none
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  color: var(--mp-ink-soft, #6b5230)
  -webkit-tap-highlight-color: transparent

.ms-swap
  font-size: 0.8rem
  line-height: 1
  opacity: 0.7

.ms-pick
  grid-column: 1 / -1

  :deep(.mpa-in)
    justify-content: center

.ms-pick-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 4px 6px

.ms-pick-tok
  padding: 3px
  border: 2px solid transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-mine
    border-color: #a9802d
    background: rgba(169, 128, 45, 0.25)

@media (max-width: 420px)
  .ms-names
    grid-template-columns: minmax(0, 1fr)

.ms-input
  flex: 1
  min-width: 0
  width: 100%
  border: 0
  border-bottom: 1px solid rgba(58, 40, 18, 0.45)
  background: transparent
  color: var(--mp-ink, #3a2812)
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  padding: 2px 2px
  outline: none

  &::placeholder
    color: rgba(58, 40, 18, 0.5)
    font-weight: 600

  &:focus
    border-bottom-color: #8a5a10
</style>
