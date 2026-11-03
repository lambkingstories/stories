/**
 * The soft tick of the journey's buttons: a button of the journey ticks, the tab bar at the bottom (which leaves the journey) and
 * `data-silent` buttons do not.
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const play = vi.fn()
let lastPlay = 0
vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: (...a: unknown[]) => {
      lastPlay = performance.now()
      play(...a)
    },
    playedSince: (t: number) => lastPlay >= t
  })
}))

afterEach(() => {
  play.mockClear()
  document.body.innerHTML = ''
})

async function mountView() {
  const { default: useButtonSounds } = await import('@/use/useButtonSounds')
  const View = defineComponent({
    setup() {
      useButtonSounds()
      return () =>
        h('div', [
          h('button', { class: 'plain' }, 'Weiter'),
          h('button', { class: 'quiet', 'data-silent': '' }, 'Leise'),
          h('nav', { class: 'z-bottom-nav' }, [h('button', { class: 'tab' }, 'Start')])
        ])
    }
  })
  return mount(View, { attachTo: document.body })
}

const tick = () => new Promise((r) => setTimeout(r, 20))

describe('the tick of the buttons', () => {
  it('ticks for a button of the journey', async () => {
    const w = await mountView()
    await w.find('.plain').trigger('click')
    await tick()
    expect(play).toHaveBeenCalledWith('button')
  })

  it('is silent for the tab bar at the bottom and for data-silent buttons', async () => {
    const w = await mountView()
    await w.find('.tab').trigger('click')
    await w.find('.quiet').trigger('click')
    await tick()
    expect(play).not.toHaveBeenCalled()
  })
})
