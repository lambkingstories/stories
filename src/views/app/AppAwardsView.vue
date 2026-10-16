<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import { useRouter } from 'vue-router'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import useAwards from '@/use/useAwards'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-main' })
}

const { list } = useAwards()
const earnedCount = computed(() => list.value.filter((a) => a.earned).length)
const imageOf = (name: string) => prependBaseUrl(`images/awards/${name}.webp`)
const dateOf = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString(locale.value) : '')
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.awards.title')" :subtitle="t('app.awards.sub')" @back="goBack")

    section(class="section-wrap mt-6")
      ABreadcrumbs(:label="`${t('app.awards.achievements')} · ${earnedCount} / ${list.length}`")
      div(class="mt-3 grid grid-cols-2 gap-3 md:gap-4")
        div(
          v-for="award in list"
          :key="award.id"
          class="award-tile relative p-4 text-center"
          :class="{ earned: award.earned }"
        )
          img(class="award-medal mx-auto" :src="imageOf(award.image)" alt="" draggable="false")
          h3(class="mt-2 text-sm md:text-base font-black award-title") {{ t(`app.awards.items.${award.id}.title`) }}
          p(class="mt-1 text-[11px] md:text-xs award-desc") {{ t(`app.awards.items.${award.id}.desc`) }}
          p(v-if="award.earned && award.earnedAt" class="mt-2 text-[11px] award-date") {{ t('app.awards.earnedOn', { date: dateOf(award.earnedAt) }) }}
          div(v-else-if="award.goal > 1" class="award-bar" aria-hidden="true")
            span(:style="{ width: `${Math.round((award.done / award.goal) * 100)}%` }")
          p(v-if="!award.earned && award.goal > 1" class="mt-1 text-[11px] award-date") {{ t('app.awards.progress', { done: award.done, goal: award.goal }) }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.awards-title
  margin: 0
  font-weight: 800
  font-size: 1.9rem

.awards-sub
  margin: 2px 0 0
  color: var(--color-text-secondary)

.section-wrap
  max-width: 42rem
  margin-left: auto
  margin-right: auto
  padding-left: 20px
  padding-right: 20px

.award-tile
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 20px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.05), 0 10px 28px -12px rgba(126, 58, 242, 0.2)

.award-medal
  width: 88px
  height: 88px
  object-fit: contain
  filter: grayscale(1) opacity(0.4)
  transition: filter 200ms ease-out

.award-tile.earned .award-medal
  filter: drop-shadow(0 8px 12px rgba(40, 30, 10, 0.3))

.award-date
  color: var(--color-text-secondary)
  font-weight: 700

.award-bar
  height: 5px
  margin: 10px auto 0
  max-width: 120px
  border-radius: 3px
  background: rgba(20, 24, 32, 0.12)
  overflow: hidden

  span
    display: block
    height: 100%
    background: #1f3a5f

.award-title
  color: var(--color-text-primary)

.award-desc
  color: var(--color-text-secondary)
</style>

