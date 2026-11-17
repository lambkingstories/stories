<script setup lang="ts">
interface Props {
  label?: string
  variant?: 'new' | 'hot' | 'sale' | 'info'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'static'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  label: 'NEU',
  variant: 'new',
  position: 'top-left',
  size: 'md'
})
</script>

<template lang="pug">
  span(
    :class="[\
      'z-badge',\
      `z-badge-${variant}`,\
      `z-badge-${size}`,\
      position !== 'static' ? `z-badge-${position} absolute` : 'inline-block'\
    ]"
    class="z-badge select-none pointer-events-none"
  )
    slot {{ label }}
</template>

<style scoped lang="sass">
.z-badge
  font-family: 'Nunito', "Nunito", "Arial Narrow", "Roboto Condensed", "Helvetica Neue Condensed", system-ui, sans-serif
  font-weight: 700
  font-stretch: condensed
  letter-spacing: 0.08em
  line-height: 1
  color: #ffffff
  border-radius: 4px
  text-transform: uppercase
  z-index: 5
  white-space: nowrap

// sizes
.z-badge-sm
  font-size: 12px
  padding: 4px 7px
  border-radius: 3px

.z-badge-md
  font-size: 12px
  padding: 5px 9px

.z-badge-lg
  font-size: 14px
  padding: 6px 11px
  border-radius: 5px

// variants
// "new" — navy ribbon (matches "NEU ERSCHIENEN" in design)
.z-badge-new
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35)
  box-shadow: 0 3px 0 -1px #0a1a30, 0 6px 14px -4px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)
  border: 1px solid #0a1a30

.z-badge-hot
  background: linear-gradient(180deg, #cc5142 0%, #a93d2e 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35)
  box-shadow: 0 3px 0 -1px #6a1d12, 0 6px 14px -4px rgba(106, 29, 18, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)
  border: 1px solid #6a1d12

.z-badge-sale
  background: linear-gradient(180deg, #e9b94c 0%, #c89030 100%)
  color: #3a2a10
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45)
  box-shadow: 0 3px 0 -1px #80590f, 0 6px 14px -4px rgba(128, 89, 15, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.55)
  border: 1px solid #80590f

.z-badge-info
  background: linear-gradient(180deg, #5d7a9a 0%, #3a5577 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)
  box-shadow: 0 3px 0 -1px #1a2f4a, 0 6px 14px -4px rgba(26, 47, 74, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)
  border: 1px solid #1a2f4a

// positions — overlay on a relatively-positioned parent (no tilt — clean rectangular ribbons)
.z-badge-top-left
  top: 8px
  left: 8px

.z-badge-top-right
  top: 8px
  right: 8px

.z-badge-bottom-left
  bottom: 8px
  left: 8px

.z-badge-bottom-right
  bottom: 8px
  right: 8px
</style>
