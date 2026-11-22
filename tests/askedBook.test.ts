/**
 * The list of an area brings the book that was asked for into view (`?book=<id>`), looks for it again while the list is on its way, and lights it for a few seconds.
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import useAskedBook, { LOOK_EVERY_MS, LOOK_FIRST_MS, LOOK_TRIES, RING_MS } from '@/use/useAskedBook'

const q = vi.hoisted(() => ({ query: {} as Record<string, string> }))
vi.mock('vue-router', () => ({ useRoute: () => q }))

const scroll = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  q.query = {}
  scroll.mockClear()
  Element.prototype.scrollIntoView = scroll as never
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function open(cardAt: number | null) {
  let asked!: { value: string }
  const Comp = defineComponent({
    setup() {
      asked = useAskedBook().asked
      return () => h('div')
    }
  })
  const w = mount(Comp, { attachTo: document.body })
  if (cardAt !== null) {
    window.setTimeout(() => {
      const el = document.createElement('div')
      el.setAttribute('data-book-id', 'ba-05')
      document.body.appendChild(el)
    }, cardAt)
  }
  return { w, asked: () => asked.value }
}

describe('useAskedBook', () => {
  it('does nothing when no book is asked for', async () => {
    const { w, asked } = open(0)
    await vi.advanceTimersByTimeAsync(3000)
    expect(asked()).toBe('')
    expect(scroll).not.toHaveBeenCalled()
    w.unmount()
  })

  it('scrolls to the card at once and lights it, then lets the ring go', async () => {
    q.query = { book: 'ba-05' }
    const { w, asked } = open(0)
    // not before the screen change is over
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS - 100)
    expect(scroll).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(150)
    expect(asked()).toBe('ba-05')
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll).toHaveBeenCalledWith({ block: 'center', inline: 'center', behavior: 'auto' })
    // and once more a moment later
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS)
    expect(scroll).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(RING_MS)
    expect(asked()).toBe('')
    w.unmount()
  })

  it('looks again while the list is on its way', async () => {
    q.query = { book: 'ba-05' }
    const { w } = open(1500)
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS + LOOK_EVERY_MS)
    expect(scroll).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2500)
    expect(scroll).toHaveBeenCalled()
    w.unmount()
  })

  it('gives up after a while when there is no such card', async () => {
    q.query = { book: 'ba-05' }
    const { w } = open(null)
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS + LOOK_EVERY_MS * (LOOK_TRIES + 3))
    expect(scroll).not.toHaveBeenCalled()
    await nextTick()
    w.unmount()
  })
})
