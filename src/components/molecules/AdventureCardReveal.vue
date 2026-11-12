<script setup lang="ts">
/**
 * The collector card of an adventure lights up the moment it is won (Anton, 12.11.2026): over the page it turns over with a fanfare and a line
 * "New collector card unlocked!". A tap on the cross (or beside it) closes it and the child stays on the page it was on. It shows once per card
 * (the same memory as the album: afterwards the card is no longer "new" there either).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CollectionCardViewer from '@/components/molecules/CollectionCardViewer.vue'
import useAdventure from '@/use/useAdventure'
import { adventureLanguage } from '@/use/adventureLanguage'
import useCardsSeen, { cardKey } from '@/use/useCardsSeen'
import { CARD_ART } from '@/data/cardArt'
import { memoryVerseOf } from '@/data/memoryVerses'
import { albumCards, albumSetCard } from '@/utils/collection'
import { prependBaseUrl } from '@/utils/function'
import type { Journey } from '@/types/adventure'

const props = defineProps<{ journey: Journey; /** Wait this long (ms) before the card shows, so that the stars of the result can ring first. */ delay?: number }>()
const { t } = useI18n({ useScope: 'global' })
const adv = useAdventure()
const { isNew, markSeen } = useCardsSeen()

const set = computed(() => albumSetCard(props.journey, albumCards(props.journey, (id) => adv.stageOf(props.journey.id, id))))
const art = computed(() => CARD_ART[props.journey.id])
const key = computed(() => cardKey(props.journey.id, 'set'))
const shown = ref(false)
let timer: number | undefined

onMounted(() => {
  if (!isNew(key.value, set.value.have)) return
  timer = window.setTimeout(() => (shown.value = true), props.delay ?? 1400)
})
onBeforeUnmount(() => window.clearTimeout(timer))

function close() {
  markSeen(key.value)
  shown.value = false
}
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : undefined)
const verse = computed(() => memoryVerseOf(props.journey.id, adventureLanguage.value) ?? undefined)
</script>

<template lang="pug">
  CollectionCardViewer(
    v-if="shown"
    :title="journey.title"
    :image="pic(art?.front ?? journey.medal)"
    :back-image="pic(art?.back)"
    :art="!!art"
    :reference="journey.subtitle"
    :journey-title="t('app.collection.setBack', { n: set.all })"
    :verse="verse"
    :caption="t('app.adventure.cardNewCaption')"
    special
    reveal
    @close="close"
  )
</template>
