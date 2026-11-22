/**
 * A book of "New for you" opens the whole list of its area (the stories, the books, the coloring books) and the list shows the book at once (Anton 22.11.2026): the address
 * carries `?book=<id>`, the card with `data-book-id="<id>"` is brought into the middle of the screen (also inside a shelf that scrolls sideways) and gets a ring for a few seconds.
 * The list may still be on its way (the books of the server): it looks again for a few seconds.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** A value for an attribute selector (old browsers have no `CSS.escape`). */
const esc = (v: string) => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(v) : v.replace(/["\\]/g, '\\$&'))

/** The first look comes after the screen change (the page that has just opened still sits in its change: the document is held and the scroll would be taken back). */
export const LOOK_FIRST_MS = 700
/** How often and how long the card is looked for. */
export const LOOK_EVERY_MS = 300
export const LOOK_TRIES = 14
/** How long the ring stays (counted from the first look, so that it is seen when the book is there): a few seconds, then it fades. */
export const RING_MS = 3000

export default function useAskedBook() {
  const route = useRoute() as ReturnType<typeof useRoute> | undefined
  const router = useRouter() as ReturnType<typeof useRouter> | undefined
  const asked = ref('')
  const timers: number[] = []

  onMounted(() => {
    const id = String(route?.query?.book ?? '')
    if (!id) return
    asked.value = id
    // the ring and the scroll are for this one time: the sign is taken from the address (the screen is not made new, see App.vue), so that coming back to the list later
    // (after another book was opened) does not show the ring again
    if (router && route) {
      const { book: _once, ...rest } = route.query
      void router.replace({ query: rest })
    }
    let tries = 0
    let settled = false
    const look = () => {
      const card = document.querySelector(`[data-book-id="${esc(id)}"]`)
      if (card) {
        // at once, not gliding: the page has just opened, and the child wants to see the book, not the way to it
        card.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
        // the screen change may still hold the height of the page (the scroll is cut short then): when the card is not in view yet, it is tried again
        const r = card.getBoundingClientRect()
        const seen = r.bottom > window.innerHeight * 0.1 && r.top < window.innerHeight * 0.9
        if (!seen && ++tries < LOOK_TRIES) timers.push(window.setTimeout(look, LOOK_EVERY_MS))
        else if (!settled) {
          // once more a moment later: the pictures that come in (lazy) move the card
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
