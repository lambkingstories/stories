<script setup lang="ts">
/**
 * Familien-Spiele v2: the card of a question (replaces the parchment with the seal). A white card with the head stripe of the game: its
 * painted symbol at the left and, centred, the small level chip ("Leicht", "Mittel", "Schwer", or where the question comes from). Under the
 * stripe an optional small line (`sub`, e.g. the stage) and the question, big and in the middle. `tone` frames the card after the answer
 * (`right`/`wrong`). With the slot the card holds anything else instead of the `text`.
 */
import FamilyCard from './FamilyCard.vue'
import type { FamilyGameKey } from './familyGames'

withDefaults(defineProps<{ chip?: string; sub?: string; text?: string; size?: string; symbol?: FamilyGameKey; tone?: 'default' | 'right' | 'wrong' | 'lit' }>(), { chip: '', sub: '', text: '', size: '1.3rem', symbol: 'quiz', tone: 'default' })
</script>

<template lang="pug">
  FamilyCard(class="fam-q" :symbol="symbol" :tone="tone")
    template(#head)
      span(v-if="chip" class="fam-q-chip") {{ chip }}
    span(v-if="sub" class="fam-q-sub") {{ sub }}
    h3(v-if="text" class="fam-q-text" :style="{ fontSize: size }") {{ text }}
    slot
</template>

<style scoped lang="sass">
.fam-q-chip
  display: inline-block
  padding: 5px 18px
  border: 1.5px solid rgba(255, 255, 255, 0.7)
  border-radius: 999px
  background: rgba(255, 255, 255, 0.2)
  font-size: 0.95rem
  font-weight: 800
  line-height: 1.2
  text-align: center

.fam-q-sub
  display: block
  max-width: 100%
  color: var(--fam-muted)
  font-size: 0.9rem
  font-weight: 700
  line-height: 1.25
  text-align: center

.fam-q-text
  margin: 0
  min-height: 56px
  display: flex
  align-items: center
  justify-content: center
  color: var(--fam-ink)
  font-weight: 800
  line-height: 1.3
  text-align: center
  overflow-wrap: anywhere
</style>
