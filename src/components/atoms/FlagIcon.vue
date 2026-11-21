<script setup lang="ts">
/** The flag of German (black, red, gold) or the Union Jack for English, inline SVG on a 3:2 canvas (emoji flags do not show on Windows). */
import { useId } from 'vue'

defineProps<{ lang: 'de' | 'en' }>()
const clipId = `fi-uk-${useId()}`
</script>

<template lang="pug">
  svg(v-if="lang === 'de'" viewBox="0 0 60 40" focusable="false" aria-hidden="true")
    rect(width="60" height="13.5" y="0" fill="#000000")
    rect(width="60" height="13.5" y="13.3" fill="#dd0000")
    rect(width="60" height="13.4" y="26.6" fill="#ffce00")
  svg(v-else viewBox="0 0 60 40" focusable="false" aria-hidden="true")
    clipPath(:id="clipId")
      path(d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z")
    path(d="M0,0 v40 h60 v-40 z" fill="#012169")
    path(d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" stroke-width="8")
    path(d="M0,0 L60,40 M60,0 L0,40" :clip-path="`url(#${clipId})`" stroke="#c8102e" stroke-width="5")
    path(d="M30,0 v40 M0,20 h60" stroke="#ffffff" stroke-width="13")
    path(d="M30,0 v40 M0,20 h60" stroke="#c8102e" stroke-width="7.5")
</template>
