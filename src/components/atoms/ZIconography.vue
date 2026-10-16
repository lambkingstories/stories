<script lang="ts">
/**
 * The symbols of the app are pictures made by the image model (`public/images/icons/ui/<name>.webp`, one colour, transparent;
 * the code only tints them with the colour of the text). A symbol that is open (active tab, filled) has the extra file
 * `<name>-an.webp`. While a picture does not exist, the older line symbol below is shown, so that nothing is ever empty.
 */
import { reactive } from 'vue'

/** The name of a symbol in the code -> the name of its picture file. */
export const ICON_FILES: Record<string, string> = {
  home: 'start',
  series: 'lesen',
  library: 'lesen',
  compass: 'reise',
  brush: 'malen',
  pencil: 'malen',
  profile: 'ich',
  lock: 'schloss',
  'chevron-left': 'zurueck',
  'chevron-right': 'weiter',
  'chevron-down': 'unten',
  check: 'haken',
  headphones: 'anhoeren',
  bookmark: 'merken',
  plus: 'plus',
  search: 'suche',
  settings: 'einstellungen',
  shop: 'shop',
  shield: 'datenschutz',
  heart: 'herz',
  sun: 'sonne',
  moon: 'mond',
  auto: 'automatisch',
  globe: 'sprache',
  edit: 'bearbeiten',
  download: 'download',
  restart: 'neustart',
  eye: 'auge',
  error: 'fehler',
  'wifi-off': 'wlan-aus',
  image: 'bild'
}

const known = reactive<Record<string, boolean | undefined>>({})

/** Does the picture exist? Asks once per file (the answer is remembered), `undefined` while it is being asked. */
export function iconFileExists(url: string): boolean | undefined {
  if (known[url] === undefined && typeof Image !== 'undefined' && !(url in known)) {
    known[url] = undefined
    const img = new Image()
    img.onload = () => {
      known[url] = true
    }
    img.onerror = () => {
      known[url] = false
    }
    img.src = url
  }
  return known[url]
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
type IconName =
  | 'heart'        // 3D crimson heart
  | 'speaker'      // 3D navy/gold speaker
  | 'home'         // outline nav
  | 'search'       // outline nav
  | 'series'       // outline nav (book icon for Serien)
  | 'library'      // outline nav (legacy alias)
  | 'profile'      // outline nav
  | 'star'         // outline nav
  | 'bookmark'     // outline nav
  | 'compass'      // outline nav (Abenteuer)
  | 'headphones'   // outline nav (Hören)
  | 'brush'        // outline nav (Malen)
  | 'pencil'       // outline nav alias
  | 'grid'         // outline nav alias
  | 'grid-3'       // layout switch — 3-column grid
  | 'grid-2'       // layout switch — 2-column grid
  | 'rows'         // layout switch — list (image-left rows)
  | 'settings'     // outline (gear)
  | 'camera'       // outline (photo picker)
  | 'bell'         // outline (notifications)
  | 'crown'        // crown
  | 'check'        // checkmark
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'plus'
  | 'lock'          // outline (parents)
  | 'shop'          // picture only (bag)
  | 'shield'        // picture only (privacy)
  | 'sun' | 'moon' | 'auto' | 'globe' | 'edit' | 'download' | 'restart' | 'eye' | 'error' | 'wifi-off' | 'image' // pictures only

interface Props {
  name: IconName
  size?: number | string
  label?: string
  /** The open form of the symbol (active tab): uses `<name>-an.webp` when it exists. */
  filled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
  label: '',
  filled: false
})

const base = import.meta.env.BASE_URL || '/'
const fileUrl = (file: string) => `${base}images/icons/ui/${file}.webp`

/** The picture to show, or '' while there is none (then the older line symbol is shown). */
const maskUrl = computed(() => {
  const file = ICON_FILES[props.name]
  if (!file) return ''
  if (props.filled) {
    const on = fileUrl(`${file}-an`)
    if (iconFileExists(on)) return on
  }
  const url = fileUrl(file)
  return iconFileExists(url) ? url : ''
})
</script>

<template lang="pug">
  span(
    class="z-icon inline-flex items-center justify-center align-middle"
    :style="{ width: typeof size === 'number' ? size + 'px' : size, height: typeof size === 'number' ? size + 'px' : size }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  )
    //- the symbol as a picture (tinted with the text colour)
    span(
      v-if="maskUrl"
      class="z-icon-mask"
      :style="{ '-webkit-mask-image': `url(${maskUrl})`, 'mask-image': `url(${maskUrl})` }"
    )
    //- 3D crimson heart
    svg(
      v-else-if="name === 'heart'"
      viewBox="0 0 48 48"
      class="w-full h-full z-icon-heart"
    )
      defs
        radialGradient(id="zHeartBody" cx="38%" cy="32%" r="75%")
          stop(offset="0%" stop-color="#ffd9d2")
          stop(offset="45%" stop-color="#d96354")
          stop(offset="80%" stop-color="#a93d2e")
          stop(offset="100%" stop-color="#6a1d12")
        linearGradient(id="zHeartRim" x1="0" y1="0" x2="0" y2="1")
          stop(offset="0%" stop-color="#ffffff" stop-opacity="0.9")
          stop(offset="100%" stop-color="#6a1d12" stop-opacity="0.7")
        filter(id="zHeartShadow" x="-20%" y="-20%" width="140%" height="140%")
          feDropShadow(dx="0" dy="2" stdDeviation="2" flood-color="#4a160e" flood-opacity="0.4")
      path(
        d="M24 42 C8 30 4 22 8 15 C11 9 19 9 24 16 C29 9 37 9 40 15 C44 22 40 30 24 42 Z"
        fill="url(#zHeartBody)"
        stroke="url(#zHeartRim)"
        stroke-width="1.5"
        filter="url(#zHeartShadow)"
      )
      ellipse(cx="17" cy="18" rx="5" ry="3" fill="#ffffff" fill-opacity="0.55")
      ellipse(cx="30" cy="20" rx="1.8" ry="1.2" fill="#ffffff" fill-opacity="0.45")

    //- 3D navy speaker with gold glow
    svg(
      v-else-if="name === 'speaker'"
      viewBox="0 0 48 48"
      class="w-full h-full z-icon-speaker"
    )
      defs
        linearGradient(id="zSpkBody" x1="0" y1="0" x2="0" y2="1")
          stop(offset="0%" stop-color="#4a6688")
          stop(offset="55%" stop-color="#21406a")
          stop(offset="100%" stop-color="#0e2440")
        radialGradient(id="zSpkGlow" cx="50%" cy="50%" r="50%")
          stop(offset="0%" stop-color="#d4a83e" stop-opacity="0.55")
          stop(offset="100%" stop-color="#d4a83e" stop-opacity="0")
        filter(id="zSpkShadow" x="-30%" y="-30%" width="160%" height="160%")
          feDropShadow(dx="0" dy="2" stdDeviation="2.5" flood-color="#0a1a30" flood-opacity="0.5")
      circle(cx="24" cy="24" r="22" fill="url(#zSpkGlow)")
      path(
        d="M10 18h7l10-7v26L17 30h-7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
        fill="url(#zSpkBody)"
        stroke="#06182d"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#zSpkShadow)"
      )
      path(d="M32 17c3.2 2.4 3.2 11.6 0 14" stroke="#d4a83e" stroke-width="2.2" stroke-linecap="round" fill="none")
      path(d="M36 13c5 4 5 18 0 22" stroke="#d4a83e" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85")
      path(d="M13 19h3l8-5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.55")

    //- Outline nav: home
    svg(
      v-else-if="name === 'home'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M3 11 12 3l9 8")
      path(d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10")

    //- Outline nav: search
    svg(
      v-else-if="name === 'search'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      circle(cx="11" cy="11" r="7")
      path(d="m20 20-3.5-3.5")

    //- Outline nav: series (open book — used for "Serien")
    svg(
      v-else-if="name === 'series' || name === 'library'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M12 6v14")
      path(d="M3 6c3.5 0 6 1 9 2.5C15 7 17.5 6 21 6v12.5c-3.5 0-6 1-9 2.5-3-1.5-5.5-2.5-9-2.5V6Z")

    //- Outline nav: profile
    svg(
      v-else-if="name === 'profile'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      circle(cx="12" cy="8" r="4")
      path(d="M4 21a8 8 0 0 1 16 0")

    //- Outline nav: star
    svg(
      v-else-if="name === 'star'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z")

    //- Headphones (Hören)
    svg(
      v-else-if="name === 'headphones'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M3 17v-5a9 9 0 0 1 18 0v5")
      path(d="M3 17a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v2Z")
      path(d="M21 17a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1a2 2 0 0 1 2 2v2Z")

    //- Compass (Abenteuer)
    svg(
      v-else-if="name === 'compass'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      circle(cx="12" cy="12" r="9")
      path(d="m15.5 8.5-2 5-5 2 2-5 5-2z")

    //- Brush / pencil (Malen)
    svg(
      v-else-if="name === 'brush' || name === 'pencil'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z")
      path(d="m14.5 5.5 3 3")

    //- Grid (legacy)
    svg(
      v-else-if="name === 'grid'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="3" y="3" width="7" height="7" rx="1.5")
      rect(x="14" y="3" width="7" height="7" rx="1.5")
      rect(x="3" y="14" width="7" height="7" rx="1.5")
      rect(x="14" y="14" width="7" height="7" rx="1.5")

    //- Layout switch — 3 narrow columns
    svg(
      v-else-if="name === 'grid-3'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="3" y="4" width="4.5" height="16" rx="1.2")
      rect(x="9.75" y="4" width="4.5" height="16" rx="1.2")
      rect(x="16.5" y="4" width="4.5" height="16" rx="1.2")

    //- Layout switch — 2 wide columns
    svg(
      v-else-if="name === 'grid-2'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="4" y="4" width="7" height="16" rx="1.5")
      rect(x="13" y="4" width="7" height="16" rx="1.5")

    //- Layout switch — list (image-left rows)
    svg(
      v-else-if="name === 'rows'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="3" y="4" width="5" height="4" rx="1")
      line(x1="10" y1="5" x2="21" y2="5")
      line(x1="10" y1="7" x2="18" y2="7")
      rect(x="3" y="10" width="5" height="4" rx="1")
      line(x1="10" y1="11" x2="21" y2="11")
      line(x1="10" y1="13" x2="18" y2="13")
      rect(x="3" y="16" width="5" height="4" rx="1")
      line(x1="10" y1="17" x2="21" y2="17")
      line(x1="10" y1="19" x2="18" y2="19")

    //- Settings (gear)
    svg(
      v-else-if="name === 'settings'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      //- Cog silhouette first, hub second: the cog outline encloses the
      //- centre, so a consumer that fills it (see AppProfileView) would
      //- paint over the hub if the circle were drawn underneath.
      path(d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z")
      circle(cx="12" cy="12" r="3")

    //- Camera (avatar picker)
    svg(
      v-else-if="name === 'camera'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z")
      circle(cx="12" cy="13" r="4")

    //- Bell (notifications)
    svg(
      v-else-if="name === 'bell'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9")
      path(d="M13.73 21a2 2 0 0 1-3.46 0")

    //- Crown
    svg(
      v-else-if="name === 'crown'"
      viewBox="0 0 32 32"
      class="w-full h-full"
    )
      defs
        linearGradient(id="zCrownGrad" x1="0" y1="0" x2="0" y2="1")
          stop(offset="0%" stop-color="#f3d167")
          stop(offset="55%" stop-color="#d4a83e")
          stop(offset="100%" stop-color="#8a5a14")
      path(
        d="M4 22l3-12 6 6 3-10 3 10 6-6 3 12z"
        fill="url(#zCrownGrad)"
        stroke="#5a3a08"
        stroke-width="1.2"
        stroke-linejoin="round"
      )
      rect(x="4" y="22" width="24" height="4" rx="1" fill="#1a2f4a" stroke="#0a1a30" stroke-width="1")
      circle(cx="16" cy="11" r="1.6" fill="#a93d2e")

    //- Check
    svg(
      v-else-if="name === 'check'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    )
      path(d="M20 6 9 17l-5-5")

    //- Chevron right
    svg(
      v-else-if="name === 'chevron-right'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    )
      path(d="m9 6 6 6-6 6")

    //- Chevron left
    svg(
      v-else-if="name === 'chevron-left'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    )
      path(d="m15 18-6-6 6-6")

    //- Chevron down
    svg(
      v-else-if="name === 'chevron-down'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    )
      path(d="m6 9 6 6 6-6")

    //- Plus
    svg(
      v-else-if="name === 'plus'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    )
      path(d="M12 5v14M5 12h14")

    //- Lock (parents)
    svg(
      v-else-if="name === 'lock'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="5" y="11" width="14" height="9" rx="2.5")
      path(d="M8 11V8a4 4 0 0 1 8 0v3")

    //- shop / shield exist as pictures only
    template(v-else-if="['shop', 'shield', 'sun', 'moon', 'auto', 'globe', 'edit', 'download', 'restart', 'eye', 'error', 'wifi-off', 'image'].includes(name)")
    //- Outline nav: bookmark (default fallback)
    svg(
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M6 3h12v18l-6-4-6 4V3z")
</template>

<style scoped lang="sass">
.z-icon
  line-height: 0

.z-icon-mask
  display: block
  width: 100%
  height: 100%
  background-color: currentColor
  -webkit-mask-repeat: no-repeat
  mask-repeat: no-repeat
  -webkit-mask-position: center
  mask-position: center
  -webkit-mask-size: contain
  mask-size: contain

.z-icon-heart
  animation: z-heart-pulse 3.6s ease-in-out infinite

.z-icon-speaker
  animation: z-speaker-wobble 4s ease-in-out infinite
  transform-origin: 24px 24px

// outline icons inherit currentColor — default to navy when standalone
.z-icon-outline
  color: var(--lk-text, #1a2f4a)

@keyframes z-heart-pulse
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.04)

@keyframes z-speaker-wobble
  0%, 100%
    transform: rotate(0deg)
  25%
    transform: rotate(-2deg)
  75%
    transform: rotate(2deg)
</style>
