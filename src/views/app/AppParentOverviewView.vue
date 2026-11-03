<script setup lang="ts">
/**
 * The overview for grown-ups: how long the app was used this week, in which part, and what the child read, played and painted.
 * It is reached only through the parents' window (behind the parental gate). The numbers come from the diary in `useActivity`
 * and never leave the device.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import useActivity, { type Section } from '@/use/useActivity'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

const activity = useActivity()
const week = computed(() => activity.lastDays(7))
const weekMinutes = computed(() => week.value.reduce((n, d) => n + d.minutes, 0))
const todayMinutes = computed(() => week.value[week.value.length - 1]?.minutes ?? 0)
const average = computed(() => Math.round(weekMinutes.value / 7))
const maxMinutes = computed(() => Math.max(10, ...week.value.map((d) => d.minutes)))
const totals = computed(() => ({
  pages: week.value.reduce((n, d) => n + d.pages, 0),
  stages: week.value.reduce((n, d) => n + d.stages, 0),
  pictures: week.value.reduce((n, d) => n + d.pictures, 0)
}))
const parts = computed(() => {
  const m = activity.sectionMinutes(7)
  const rows: { id: Section; minutes: number }[] = [
    { id: 'read', minutes: m.read },
    { id: 'adventure', minutes: m.adventure },
    { id: 'paint', minutes: m.paint },
    { id: 'home', minutes: m.home + m.other }
  ]
  const sum = Math.max(1, rows.reduce((n, r) => n + r.minutes, 0))
  return rows.map((r) => ({ ...r, share: Math.round((r.minutes / sum) * 100) }))
})
const empty = computed(() => weekMinutes.value === 0 && totals.value.pages + totals.value.stages + totals.value.pictures === 0)

const weekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(locale.value, { weekday: 'short' })
const hm = (min: number) => (min >= 60 ? t('app.parents.hm', { h: Math.floor(min / 60), m: min % 60 }) : t('app.parents.min', { n: min }))

const confirmClear = ref(false)
function clearAll() {
  activity.clear()
  confirmClear.value = false
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.parents.title')" :subtitle="t('app.parents.sub')" @back="goBack")

    section(class="po-wrap")
      //- today and the week at a glance
      div(class="po-card")
        div(class="po-numbers")
          div(class="po-num")
            span(class="po-big") {{ hm(todayMinutes) }}
            span(class="po-cap") {{ t('app.parents.today') }}
          div(class="po-num")
            span(class="po-big") {{ hm(weekMinutes) }}
            span(class="po-cap") {{ t('app.parents.week') }}
          div(class="po-num")
            span(class="po-big") {{ hm(average) }}
            span(class="po-cap") {{ t('app.parents.average') }}

        div(class="po-bars" role="img" :aria-label="t('app.parents.chartLabel')")
          div(v-for="d in week" :key="d.day" class="po-bar-col")
            span(class="po-bar-min") {{ d.minutes || '' }}
            div(class="po-bar-track")
              div(class="po-bar" :class="{ 'is-today': d.day === week[week.length - 1]?.day }" :style="{ height: `${Math.max(d.minutes ? 6 : 0, Math.round((d.minutes / maxMinutes) * 100))}%` }")
            span(class="po-bar-day") {{ weekday(d.day) }}

      p(v-if="empty" class="po-empty") {{ t('app.parents.empty') }}

      //- where the time went
      div(class="po-card")
        h3(class="po-h") {{ t('app.parents.where') }}
        div(v-for="p in parts" :key="p.id" class="po-part")
          div(class="po-part-row")
            span(class="po-part-name") {{ t(`app.parents.part_${p.id}`) }}
            span(class="po-part-min") {{ hm(p.minutes) }}
          div(class="po-part-track"): div(class="po-part-fill" :class="`is-${p.id}`" :style="{ width: `${p.share}%` }")

      //- what was done
      div(class="po-card")
        h3(class="po-h") {{ t('app.parents.did') }}
        div(class="po-did")
          div(class="po-did-item")
            span(class="po-did-n") {{ totals.pages }}
            span(class="po-did-t") {{ t('app.parents.pages', totals.pages) }}
          div(class="po-did-item")
            span(class="po-did-n") {{ totals.stages }}
            span(class="po-did-t") {{ t('app.parents.stages', totals.stages) }}
          div(class="po-did-item")
            span(class="po-did-n") {{ totals.pictures }}
            span(class="po-did-t") {{ t('app.parents.pictures', totals.pictures) }}

      p(class="po-note") {{ t('app.parents.note') }}

      div(class="po-clear")
        button(v-if="!confirmClear" type="button" class="lk-btn lk-btn--outline lk-btn--small" @click="confirmClear = true") {{ t('app.parents.clear') }}
        template(v-else)
          span(class="po-clear-q") {{ t('app.parents.clearAsk') }}
          button(type="button" class="lk-btn lk-btn--small" @click="clearAll") {{ t('app.parents.clearYes') }}
          button(type="button" class="lk-btn lk-btn--outline lk-btn--small" @click="confirmClear = false") {{ t('app.parents.clearNo') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.po-wrap
  display: grid
  gap: 14px
  max-width: 42rem
  margin: 18px auto 0
  padding: 0 16px

.po-card
  padding: 16px
  border-radius: 22px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.po-h
  margin: 0 0 10px
  font-size: 1.05rem
  font-weight: 800

.po-numbers
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px
  text-align: center

.po-num
  display: flex
  flex-direction: column
  gap: 2px

.po-big
  font-size: 1.35rem
  font-weight: 900
  line-height: 1.15

.po-cap
  font-size: 0.8rem
  color: var(--lk-muted)

// seven bars, one per day
.po-bars
  display: grid
  grid-template-columns: repeat(7, 1fr)
  gap: 8px
  margin-top: 16px

.po-bar-col
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px

.po-bar-min
  height: 1em
  font-size: 0.72rem
  color: var(--lk-muted)

.po-bar-track
  display: flex
  align-items: flex-end
  width: 100%
  height: 96px
  border-radius: 10px
  background: var(--lk-surface-2)
  overflow: hidden

.po-bar
  width: 100%
  border-radius: 10px 10px 0 0
  background: var(--lk-accent)
  opacity: 0.55

  &.is-today
    opacity: 1

.po-bar-day
  font-size: 0.78rem
  font-weight: 700
  color: var(--lk-muted)

.po-empty
  margin: 0
  text-align: center
  color: var(--lk-muted)

.po-part
  margin-top: 10px

.po-part-row
  display: flex
  justify-content: space-between
  font-weight: 700

.po-part-min
  color: var(--lk-muted)
  font-weight: 600

.po-part-track
  height: 10px
  margin-top: 4px
  border-radius: 6px
  background: var(--lk-surface-2)
  overflow: hidden

.po-part-fill
  height: 100%
  border-radius: 6px
  background: var(--lk-accent)

  &.is-adventure
    background: var(--lk-gold)

  &.is-paint
    background: #c8553d

  &.is-home
    background: var(--lk-muted)

.po-did
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px
  text-align: center

.po-did-item
  display: flex
  flex-direction: column
  padding: 12px 6px
  border-radius: 16px
  background: var(--lk-surface-2)

.po-did-n
  font-size: 1.7rem
  font-weight: 900
  line-height: 1.1

.po-did-t
  font-size: 0.82rem
  color: var(--lk-muted)

.po-note
  margin: 0
  font-size: 0.85rem
  line-height: 1.4
  color: var(--lk-muted)
  text-align: center

.po-clear
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 8px

.po-clear-q
  font-weight: 700
</style>
