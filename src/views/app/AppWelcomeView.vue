<script setup lang="ts">
/**
 * Welcome / title screen — the app's front door.
 *
 * Everything the user reads (logo, "Willkommen!", the subtitle) is baked
 * into the artwork, so this view is just the picture plus a single CTA that
 * hands over to the home page. Four assets cover the matrix: {de,en} ×
 * {portrait,landscape}. Language comes from the i18n locale; the
 * orientation swap is native `<picture media>` so a rotation re-picks the
 * source without a resize listener.
 *
 * The artwork is `contain`-fitted — never cropped by a screen edge — which
 * means its rendered box rarely matches the viewport. The CTA therefore
 * lives inside `.welcome-stage`, a shrink-to-fit wrapper that ends up
 * exactly the size of the `<img>`, so the button's percentage offsets track
 * the illustration itself instead of the screen. That keeps it planted on
 * the flower meadow (portrait) / below the text block (landscape) at every
 * aspect ratio, letterbox bars included.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZLanguageSwitcher from '@/components/atoms/ZLanguageSwitcher.vue'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

// Portrait assets are spelled "wilkommen", landscape ones "willkommen" —
// that's how they ship in `public/images/bg/`, so keep both spellings.
const art = computed(() => {
  const lang = locale.value === 'en' ? 'en' : 'de'
  return {
    portrait: prependBaseUrl(`images/bg/wilkommen_portrait_${lang}.webp`),
    landscape: prependBaseUrl(`images/bg/willkommen_landscape_${lang}.webp`)
  }
})

// The same two artworks, fed to CSS for the blurred tablet backdrop. The
// files live in `public/`, so a bare `url(…)` in the style block would be
// resolved by Vite as a bundled asset.
const backdropVars = computed(() => ({
  '--welcome-bg-portrait': `url(${art.value.portrait})`,
  '--welcome-bg-landscape': `url(${art.value.landscape})`
}))

function onStart() {
  router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(class="welcome-page" :style="backdropVars")
    div(class="welcome-stage")
      picture
        source(:srcset="art.landscape" media="(orientation: landscape)")
        img(
          :src="art.portrait"
          :alt="t('app.welcome.artAlt')"
          class="welcome-art"
          fetchpriority="high"
          decoding="async"
        )
      //- Language picker — parked in the artwork's top-right corner so a
      //- parent can flip the welcome copy (which is baked into the picture)
      //- to their language before handing the phone over.
      div(class="welcome-lang")
        ZLanguageSwitcher(:size="34")
      button(
        type="button"
        class="welcome-cta"
        @click="onStart"
      ) {{ t('app.welcome.cta') }}
</template>

<style scoped lang="sass">
$navy: #21406a
$navy-dark: #142a47
$gold: #d4a83e

// Fixed + grid-centred: the screen never scrolls and the artwork sits dead
// centre. The beige matches #app-root so the letterbox strip (whenever the
// screen's ratio differs from the artwork's) blends into the app shell.
.welcome-page
  position: fixed
  inset: 0
  display: grid
  place-items: center
  overflow: hidden
  background-color: var(--color-bg-main)

// No explicit size: the box shrinks to the <img>'s rendered dimensions, so
// the absolutely-positioned CTA inside resolves its percentages against the
// artwork's real box. `line-height: 0` kills the inline descender gap that
// would otherwise offset it by a couple of pixels.
.welcome-stage
  position: relative
  line-height: 0

  picture
    background-size: fill

// Same trick as the CTA: percentage offsets inside .welcome-stage track the
// artwork's own box, so the flags stay pinned to the picture's corner rather
// than the screen's — letterbox bars included. The frosted plaque is what
// lets two small flags read against the foliage that fills that corner in
// both the portrait and the landscape art.
.welcome-lang
  position: absolute
  top: 3%
  right: 4%
  display: inline-flex
  padding: 5px 7px
  border-radius: 999px
  line-height: 0
  background: rgba(255, 255, 255, 0.62)
  backdrop-filter: blur(6px)
  -webkit-backdrop-filter: blur(6px)
  box-shadow: 0 4px 14px -8px rgba(10, 26, 48, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.85)

// Navy plaque with a gold rim, mirroring the app's primary buttons. Sizes
// are percentages of the artwork box so the CTA keeps its proportions on
// every screen; the font falls back to vmin, which tracks whichever axis
// the `contain` fit is bounded by.
.welcome-cta
  position: absolute
  left: 50%
  bottom: 20%
  transform: translateX(-50%)
  width: 78%
  padding: 0.72em 1em
  border: 2px solid rgba(212, 168, 62, 0.85)
  border-radius: 1.2em
  background: linear-gradient(180deg, $navy 0%, $navy-dark 100%)
  color: #ffffff
  font-family: inherit
  font-weight: 800
  font-size: clamp(1rem, 4.4vmin, 1.75rem)
  line-height: 1.2
  letter-spacing: 0.01em
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 10px 24px -10px rgba(10, 26, 48, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.18)
  transition: transform 140ms ease-out, box-shadow 140ms ease-out

  &:hover
    box-shadow: 0 14px 28px -10px rgba(10, 26, 48, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.24)

  &:active
    transform: translateX(-50%) scale(0.96)

  &:focus-visible
    outline: 3px solid rgba(212, 168, 62, 0.9)
    outline-offset: 3px

// Landscape artwork puts the copy in the left third — park the CTA under it
// so it never covers the illustration on the right.
@media (orientation: landscape)
  .welcome-cta
    left: 26%
    bottom: 16%
    width: 30%

// ===== Tablet =====
// The copy is baked into the artwork, so it is never cropped to fill the
// screen. Instead the art scales up to a full `contain` fit (it would stop
// at its natural size otherwise) and the strips beside it show a blurred,
// cover-fitted copy of the same picture rather than bare beige.
@media (min-width: 768px)
  .welcome-page::before
    content: ''
    position: absolute
    // Overscan so the blur's soft edge stays off-screen.
    inset: -40px
    background-image: var(--welcome-bg-portrait)
    background-position: center
    background-size: cover
    filter: blur(28px) saturate(1.1)
    opacity: 0.85

  .welcome-stage
    box-shadow: 0 20px 60px -20px rgba(10, 26, 48, 0.55)

  // 692×1500 portrait art (the en file is 700×1517, the same ratio).
  .welcome-art
    width: min(100vw, 100dvh * 692 / 1500)
    height: auto

@media (min-width: 768px) and (orientation: landscape)
  .welcome-page::before
    background-image: var(--welcome-bg-landscape)

  // 1244×700 landscape art.
  .welcome-art
    width: min(100vw, 100dvh * 1244 / 700)
</style>
