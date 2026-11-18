<script setup lang="ts">
/**
 * Familien-Spiele v2: "Who plays along?" (replaces `MapSeats`, same props and events, so a game swaps one for the other). A card with the head
 * stripe of the game: round number chips (2 to 8, chosen = gold) and below them a row for every player with the painted figure and the name
 * field. A tap on the figure opens the row of the eight figures to choose another one (the choice is kept by `useFamilyTokens`, as before).
 * With `fixed` (one person, no choice of the number) only the name row is shown, without the head.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FamilyCard from './FamilyCard.vue'
import FamilyChip from './FamilyChip.vue'
import FamilyNameField from './FamilyNameField.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import { MAP_MAX_PLAYERS } from '@/components/molecules/map/tokenColors'
import useFamilyTokens from '@/use/useFamilyTokens'
import type { FamilyGameKey } from './familyGames'

const props = withDefaults(defineProps<{ count: number; names: string[]; min?: number; max?: number; question?: string; placeholderKey?: string; fixed?: boolean; symbol?: FamilyGameKey }>(), {
  min: 1,
  max: MAP_MAX_PLAYERS,
  question: '',
  placeholderKey: 'app.family.player',
  fixed: false,
  symbol: 'quiz'
})
const emit = defineEmits<{ 'update:count': [n: number]; 'update:names': [names: string[]] }>()
const { t } = useI18n({ useScope: 'global' })
const { tokens, setToken } = useFamilyTokens()
/** The seat whose figure row is open (-1: none). */
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
</script>

<template lang="pug">
  FamilyCard(class="fam-seats" :bare="fixed" :title="fixed ? '' : question || t('app.family.howMany')" :symbol="fixed ? undefined : symbol")
    div(v-if="!fixed" class="fam-seats-count" role="radiogroup")
      template(v-for="n in max" :key="n")
        FamilyChip(v-if="n >= min" round :selected="count === n" :aria-label="String(n)" @click="emit('update:count', n)") {{ n }}
    div(class="fam-seats-names")
      template(v-for="i in count" :key="i")
        FamilyNameField(
          :model-value="names[i - 1] ?? ''"
          :seat="i - 1"
          :open="picking === i - 1"
          :placeholder="t(placeholderKey, { n: i })"
          :token-label="t('app.family.pickToken')"
          @update:model-value="setName(i - 1, $event)"
          @token="picking = picking === i - 1 ? -1 : i - 1"
        )
        div(v-if="picking === i - 1" class="fam-seats-pick" role="radiogroup" :aria-label="t('app.family.pickToken')")
          button(
            v-for="k in 8"
            :key="k"
            type="button"
            role="radio"
            :aria-checked="tokens[i - 1] === k - 1"
            :class="['fam-seats-tok', { 'is-mine': tokens[i - 1] === k - 1 }]"
            @click="pick(i - 1, k - 1)"
          )
            MapToken(:index="k - 1" raw :size="38")
</template>

<style scoped lang="sass">
.fam-seats-count
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 12px
  padding: 4px 0 2px

.fam-seats-names
  display: flex
  flex-direction: column
  gap: 10px
  width: 100%

.fam-seats-pick
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  padding: 8px
  border: 1.5px dashed var(--fam-line-strong)
  border-radius: 20px
  background: var(--fam-field)

.fam-seats-tok
  display: grid
  place-items: center
  width: 52px
  height: 52px
  padding: 0
  border: 2px solid transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 1px

  &.is-mine
    border-color: var(--fam-gold)
    background: color-mix(in srgb, var(--fam-gold) 28%, transparent)
</style>
