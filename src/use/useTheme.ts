/**
 * Day or night look of the app. The choice is made in the settings and is remembered on the device; "auto" follows the device.
 * The look is a `data-theme` attribute on `<html>`; all colours come from `assets/css/theme.css`.
 */
import { computed, ref } from 'vue'

export type ThemeChoice = 'day' | 'night' | 'auto'
export type ThemeName = 'day' | 'night'
/** The three colours of the day look (mint is the first look of the app). */
export type PaletteName = 'mint' | 'beige' | 'creme'

const KEY = 'lk-theme'
const BAR_COLORS: Record<ThemeName, string> = { day: '#edf3f1', night: '#162433' }
const PALETTE_BAR: Record<PaletteName, string> = { mint: '#edf3f1', beige: '#f0e9db', creme: '#f8f4e9' }
const PALETTE_KEY = 'lk-palette'

function readPalette(): PaletteName {
  try {
    const v = localStorage.getItem(PALETTE_KEY)
    if (v === 'mint' || v === 'beige' || v === 'creme') return v
  } catch {
    // private window: nothing remembered
  }
  return 'mint'
}

const palette = ref<PaletteName>(readPalette())

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'day' || v === 'night' || v === 'auto') return v
  } catch {
    // private window: nothing remembered
  }
  return 'day'
}

const choice = ref<ThemeChoice>(readChoice())
const systemNight = ref(false)

function systemQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
}

const theme = computed<ThemeName>(() => (choice.value === 'auto' ? (systemNight.value ? 'night' : 'day') : choice.value))

/** Writes the look onto the page (attribute, colour of the browser bar). */
export function applyTheme(name: ThemeName) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', name)
  document.documentElement.setAttribute('data-palette', palette.value)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', name === 'day' ? PALETTE_BAR[palette.value] : BAR_COLORS[name])
}

let started = false

/** Called once at the start of the app. */
export function startTheme() {
  if (started) return
  started = true
  const q = systemQuery()
  systemNight.value = !!q?.matches
  q?.addEventListener?.('change', (e) => {
    systemNight.value = e.matches
    applyTheme(theme.value)
  })
  applyTheme(theme.value)
}

export default function useTheme() {
  function setChoice(value: ThemeChoice) {
    choice.value = value
    try {
      localStorage.setItem(KEY, value)
    } catch {
      // not remembered
    }
    applyTheme(theme.value)
  }
  function setPalette(value: PaletteName) {
    palette.value = value
    try {
      localStorage.setItem(PALETTE_KEY, value)
    } catch {
      // not remembered
    }
    applyTheme(theme.value)
  }
  return { choice, theme, palette, isNight: computed(() => theme.value === 'night'), setChoice, setPalette }
}
