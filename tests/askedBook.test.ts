/**
 * The list of an area brings the book that was asked for into view (`?book=<id>`), looks for it again while the list is on its way, and lights it for a few seconds.
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import useAskedBook, { LOOK_EVERY_MS, LOOK_FIRST_MS, LOOK_TRIES, RING_MS } from '@/use/useAskedBook'

const q = vi.hoisted(() => ({ query: {} as Record<string, string>, replace: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => q, useRouter: () => ({ replace: q.replace }) }))

const scroll = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  q.query = {}
  q.replace.mockClear()
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
      // the card is in view (jsdom has no layout)
      el.getBoundingClientRect = () => ({ top: 100, bottom: 400, left: 0, right: 100, width: 100, height: 300, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect
      document.body.appendChild(el)
    }, cardAt)
  }
  return { w, asked: () => asked.value }
}

describe('useAskedBook', () => {
  it('tries again when the card is not in view after the scroll (the screen change holds the height of the page)', async () => {
    q.query = { book: 'ba-05' }
    const el = document.createElement('div')
    el.setAttribute('data-book-id', 'ba-05')
    let top = 2200
    el.getBoundingClientRect = () => ({ top, bottom: top + 300, left: 0, right: 100, width: 100, height: 300, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
    document.body.appendChild(el)
    const { w } = open(null)
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS + 50)
    expect(scroll).toHaveBeenCalledTimes(1)
    // the height is let go: the card is in view with the next scroll
    top = 100
    await vi.advanceTimersByTimeAsync(LOOK_EVERY_MS + 50)
    expect(scroll).toHaveBeenCalledTimes(2)
    w.unmount()
  })

  it('does nothing when no book is asked for', async () => {
    const { w, asked } = open(0)
    await vi.advanceTimersByTimeAsync(3000)
    expect(asked()).toBe('')
    expect(scroll).not.toHaveBeenCalled()
    w.unmount()
  })

  it('takes the sign from the address at once, so that coming back to the list later shows no ring again', async () => {
    q.query = { book: 'ba-05', other: '1' }
    const { w } = open(0)
    await vi.advanceTimersByTimeAsync(LOOK_FIRST_MS + 50)
    expect(q.replace).toHaveBeenCalledTimes(1)
    expect(q.replace).toHaveBeenCalledWith({ query: { other: '1' } })
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
