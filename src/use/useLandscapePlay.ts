/**
 * Playing a game with the phone turned on its side. `landscape` follows the phone (the media query), `turn()` asks for the full screen and
 * the landscape position (this works in the browser of an Android phone when the system allows it; the button is only shown on a touch
 * screen), `back()` gives the screen back. The game leaves the full screen when it is closed.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

type OrientationLock = { lock?: (o: string) => Promise<void>; unlock?: () => void }
const orientationOf = (): OrientationLock | undefined => (screen as unknown as { orientation?: OrientationLock }).orientation

export default function useLandscapePlay() {
  const landscape = ref(false)
  const full = ref(false)
  /** The button is shown on touch screens only. */
  const canTurn = ref(false)
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  let query: MediaQueryList | undefined
  const onQuery = () => (landscape.value = !!query?.matches)
  const onFull = () => (full.value = !!document.fullscreenElement)
  const onSize = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    query = window.matchMedia('(orientation: landscape)')
    landscape.value = query.matches
    canTurn.value = window.matchMedia('(pointer: coarse)').matches && !!document.documentElement.requestFullscreen
    query.addEventListener('change', onQuery)
    document.addEventListener('fullscreenchange', onFull)
    window.addEventListener('resize', onSize)
    onSize()
  })

  async function turn() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      await orientationOf()?.lock?.('landscape')
    } catch {
      // not possible here: the phone can still be turned by hand
    }
  }

  function back() {
    try {
      orientationOf()?.unlock?.()
      if (document.fullscreenElement) void document.exitFullscreen()
    } catch {
      // nothing to give back
    }
  }

  onBeforeUnmount(() => {
    query?.removeEventListener('change', onQuery)
    document.removeEventListener('fullscreenchange', onFull)
    window.removeEventListener('resize', onSize)
    back()
  })

  return { landscape, full, canTurn, width, height, turn, back, toggle: () => (full.value ? back() : void turn()) }
}
