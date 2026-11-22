/**
 * A book of "New for you" opens the whole list of its area (the stories, the books, the coloring books) and the list shows the book at once (Anton 22.11.2026): the address
 * carries `?book=<id>`, the card with `data-book-id="<id>"` is brought into the middle of the screen (also inside a shelf that scrolls sideways) and gets a ring for a few seconds.
 * The list may still be on its way (the books of the server): it looks again for a few seconds.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

/** A value for an attribute selector (old browsers have no `CSS.escape`). */
const esc = (v: string) => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(v) : v.replace(/["\\]/g, '\\$&'))

/** The first look comes after the screen change (the page that has just opened still sits in its change: the document is held and the scroll would be taken back). */
export const LOOK_FIRST_MS = 700
/** How often and how long the card is looked for. */
export const LOOK_EVERY_MS = 300
export const LOOK_TRIES = 14
/** How long the ring stays (counted from the first look, so that it is seen when the book is there). */
export const RING_MS = 5000

export default function useAskedBook() {
  const route = useRoute() as ReturnType<typeof useRoute> | undefined
  const asked = ref('')
  const timers: number[] = []

  onMounted(() => {
    const id = String(route?.query?.book ?? '')
    if (!id) return
    asked.value = id
    let tries = 0
    let settled = false
    const look = () => {
      const card = document.querySelector(`[data-book-id="${esc(id)}"]`)
      // at once, not gliding: the page has just opened, and the child wants to see the book, not the way to it
      if (card) {
        card.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
        // once more a moment later: the pictures that come in (lazy) move the card
        if (!settled) {
          settled = true
          timers.push(window.setTimeout(look, LOOK_FIRST_MS))
        }
      } else if (++tries < LOOK_TRIES) timers.push(window.setTimeout(look, LOOK_EVERY_MS))
    }
    timers.push(window.setTimeout(look, LOOK_FIRST_MS))
    timers.push(window.setTimeout(() => (asked.value = ''), LOOK_FIRST_MS + RING_MS))
  })

  onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

  return { asked }
}
