<script setup lang="ts">
import { ref } from 'vue'
import ZIconography from '@/components/atoms/ZIconography.vue'

type IconName = 'home' | 'series' | 'compass' | 'headphones' | 'brush' | 'profile' | 'grid' | 'pencil' | 'library'

interface NavItem {
  id: string | number
  label: string
  icon: IconName
  image?: string
}

interface Props {
  items: NavItem[]
  modelValue: string | number
}

defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'select'])

const pressedId = ref<string | number | null>(null)

function onDown(item: NavItem) {
  pressedId.value = item.id
}

function onUp() {
  pressedId.value = null
}

function selectItem(item: NavItem) {
  emit('update:modelValue', item.id)
  emit('select', item)
}
</script>

<template lang="pug">
  nav(class="z-bottom-nav fixed bottom-0 left-0 right-0 z-50")
    div(class="z-bottom-nav-inner mx-auto max-w-2xl flex items-stretch justify-around")
      button(
        v-for="item in items"
        :key="item.id"
        type="button"
        :aria-label="item.label"
        :aria-current="modelValue === item.id ? 'page' : undefined"
        :class="['z-nav-btn group relative flex flex-1 flex-col items-center justify-center cursor-pointer select-none touch-manipulation', modelValue === item.id ? 'is-active' : 'is-inactive', pressedId === item.id ? 'is-pressed' : '']"
        @click="selectItem(item)"
        @pointerdown="onDown(item)"
        @pointerup="onUp"
        @pointerleave="onUp"
        @pointercancel="onUp"
      )
        span(class="z-nav-icon relative inline-flex items-center justify-center")
          img(v-if="item.image" :src="item.image" alt="" class="z-nav-star" draggable="false")
          ZIconography(v-else :name="item.icon" :size="26" :filled="modelValue === item.id")
        span(class="z-nav-label") {{ item.label }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  background: transparent
  border: none

// A floating capsule in the colour of the theme; the open tab is a filled capsule with icon and word.
.z-bottom-nav
  bottom: 0
  padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px))
  pointer-events: none

.z-bottom-nav-inner
  pointer-events: auto
  height: 72px
  padding: 6px
  gap: 2px
  border-radius: 36px
  background: var(--lk-nav-bg)
  border: 1px solid var(--lk-nav-line)
  box-shadow: 0 10px 28px -12px rgba(0, 0, 0, 0.45)

.z-nav-btn
  color: var(--lk-muted)
  min-width: 0
  height: 100%
  padding: 0 2px
  border-radius: 30px
  transition: background-color 160ms ease-out, color 160ms ease-out

  &.is-active
    flex: 1.35 1 0
    background: var(--lk-accent)
    color: var(--lk-on-accent)

  &.is-pressed
    transform: translateY(1px)

.z-nav-icon
  width: 40px
  height: 40px
  flex: none
  color: inherit

// the painted symbols: quiet when the tab is closed, on a cream disc when it is open (the disc stays above the word, never over it)
.z-nav-star
  display: block
  box-sizing: border-box
  width: 40px
  height: 40px
  padding: 2px
  border-radius: 50%
  object-fit: contain
  opacity: 1
  transition: background-color 160ms ease-out, opacity 160ms ease-out

.is-active .z-nav-star
  padding: 5px
  background: #f7f0e1
  opacity: 1

.z-nav-icon :deep(.z-icon-outline)
  color: currentColor

.z-nav-label
  margin-top: 2px
  font-size: 12px
  line-height: 1.1
  font-weight: 600
  color: inherit

.is-active .z-nav-label
  font-weight: 700
</style>
