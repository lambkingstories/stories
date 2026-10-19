/**
 * Every button of the journey makes a very soft sound when it is pressed. A view calls this once (the journey list, the map and every
 * stage do). One listener hears all clicks, so no button has to be wired by hand and new ones are included. A button that has its own sound
 * (an answer, a card, a game piece) is left alone: the tick is only played when no other sound started with the same click.
 * A button can opt out with `data-silent`.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import useSfx from '@/use/useSfx'

export default function useButtonSounds() {
  const { play, playedSince } = useSfx()
  const onClick = (e: Event) => {
    const el = (e.target as Element | null)?.closest?.('button, [role="button"]') as HTMLElement | null
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true' || el.dataset.silent !== undefined) return
    const t0 = performance.now()
    // the handlers of the button run first; whether one of them started a sound is known one tick later
    window.setTimeout(() => {
      if (!playedSince(t0)) play('button')
    }, 0)
  }
  // capture phase: a button that closes its own view still gets its sound
  onMounted(() => document.addEventListener('click', onClick, true))
  onBeforeUnmount(() => document.removeEventListener('click', onClick, true))
}
