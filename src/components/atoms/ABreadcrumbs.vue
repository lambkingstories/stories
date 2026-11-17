<script setup lang="ts">
interface Crumb {
  label: string
  id?: string | number
}

interface Props {
  items?: Crumb[]
  label?: string
  separator?: string
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  label: '',
  separator: '·'
})

defineEmits(['select'])
</script>

<template lang="pug">
  nav(
    class="a-breadcrumbs w-full"
    aria-label="Breadcrumb"
  )
    ol(
      v-if="items && items.length"
      class="flex items-center flex-wrap gap-x-3 gap-y-1"
    )
      template(v-for="(c, i) in items" :key="c.id ?? c.label")
        li
          button(
            type="button"
            class="a-breadcrumb-item cursor-pointer"
            @click="$emit('select', c)"
          )
            | {{ c.label }}
        li(
          v-if="i < items.length - 1"
          aria-hidden="true"
          class="a-breadcrumb-sep"
        ) {{ separator }}

    span(
      v-else
      class="a-breadcrumb-item"
    )
      slot {{ label }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  background: transparent
  border: none
  padding: 0
  color: inherit
  font: inherit

.a-breadcrumbs
  font-family: 'Nunito', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif

.a-breadcrumb-item
  display: inline-block
  font-size: 12px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.22em
  color: #a98cdc
  transition: color 160ms ease-out

  &:hover
    color: #6929c4

.a-breadcrumb-sep
  display: inline-block
  color: #d1c0f0
  font-size: 12px
  letter-spacing: 0.22em
</style>
