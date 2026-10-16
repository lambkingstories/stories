import { ref } from 'vue'

/**
 * Whether the painting screen shows its main menu (no picture open). Then the shared tab bar of the app stays at the bottom, as on the
 * other screens; with a picture open the whole screen belongs to the painting.
 */
const coloringMenuShown = ref(false)

export default function useChrome() {
  return { coloringMenuShown }
}
