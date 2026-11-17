<script setup lang="ts">
/**
 * The little window of a closed big game: the picture of its tile, its name and one sentence. With a free wish there are two buttons,
 * "Unlock" (big) and "Back"; the choice is for good. Without a wish it only says how many stars are still missing for the next one.
 * The sentence is the first sentence of a text the game has already (nothing is written anew).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvDialog from '@/components/molecules/AdvDialog.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import type { BigGame } from '@/data/bigGames'
import { firstSentence } from '@/utils/bigGames'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: BigGame; /** Wishes free now. */ free: number; /** Stars still missing for the next wish. */ missing: number }>()
const emit = defineEmits<{ close: []; pick: [id: string] }>()
const { t, te } = useI18n({ useScope: 'global' })

const title = computed(() => t(`app.bigGames.${props.game.id}.title`))
const sentence = computed(() => {
  for (const key of ['intro', 'story', 'sub']) {
    const path = `app.bigGames.${props.game.id}.${key}`
    if (!te(path)) continue
    const v = t(path)
    if (typeof v === 'string' && v && v !== path) return firstSentence(v)
  }
  return ''
})
</script>

<template lang="pug">
  AdvDialog(:title="title" @close="emit('close')")
    div(class="bp")
      img(:src="prependBaseUrl(game.image)" alt="" class="bp-img" draggable="false")
      p(v-if="sentence" class="bp-text") {{ sentence }}
      p(v-if="free <= 0" class="bp-missing" data-test="bp-missing") {{ t('app.bigGames.nextGame', { n: missing }, missing) }}
    template(#actions)
      AdvButton(v-if="free > 0" tone="gold" class="bp-unlock" data-test="bp-unlock" @click="emit('pick', game.id)") {{ t('app.bigGames.unlock') }}
      AdvButton(tone="blau" data-test="bp-back" @click="emit('close')") {{ t('app.bigGames.back') }}
</template>

<style scoped lang="sass">
.bp
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px

.bp-img
  width: 100%
  aspect-ratio: 3 / 2
  border-radius: 14px
  object-fit: cover
  display: block

.bp-text
  margin: 0
  color: var(--lk-text)
  font-size: 1.05rem
  line-height: 1.4

.bp-missing
  margin: 0
  font-weight: 800
  color: var(--lk-text)

.bp-unlock
  min-height: 56px
  font-size: 1.15rem
</style>
