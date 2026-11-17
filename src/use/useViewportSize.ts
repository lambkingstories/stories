/**
 * The size of the window as reactive numbers (it changes with a turn of the phone). Used where a rule of the layout needs the
 * numbers and not only a CSS media query.
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export default function useViewportSize(): { width: Ref<number>; height: Ref<number> } {
  const read = () => (typeof window === 'undefined' ? { w: 1024, h: 768 } : { w: window.innerWidth, h: window.innerHeight })
  const now = read()
  const width = ref(now.w)
  const height = ref(now.h)
  const update = () => {
    const s = read()
    width.value = s.w
    height.value = s.h
  }
  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
  })
  return { width, height }
}
