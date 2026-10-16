import { afterEach, describe, expect, it, vi } from 'vitest'
import { goBackTo, previousPath } from '@/utils/navBack'

function fakeRouter() {
  return {
    resolve: (to: { name: string }) => ({ path: to.name === 'app-main' ? '/app' : '/app/coloring' }),
    back: vi.fn(),
    replace: vi.fn(() => Promise.resolve())
  }
}

afterEach(() => window.history.replaceState(null, ''))

describe('going back to the page we came from', () => {
  it('knows the page before from the router state', () => {
    window.history.replaceState({ back: '/app' }, '')
    expect(previousPath()).toBe('/app')
    window.history.replaceState(null, '')
    expect(previousPath()).toBeNull()
  })

  it('steps back for real when the page before is the wanted one', () => {
    window.history.replaceState({ back: '/app' }, '')
    const router = fakeRouter()
    goBackTo(router as never, { name: 'app-main' })
    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('ignores a query on the page before', () => {
    window.history.replaceState({ back: '/app/coloring?book=x&p=3' }, '')
    const router = fakeRouter()
    goBackTo(router as never, { name: 'app-coloring' })
    expect(router.back).toHaveBeenCalledOnce()
  })

  it('replaces this page when the page before is something else, so no pages pile up', () => {
    window.history.replaceState({ back: '/app/coloring/book/ba-1' }, '')
    const router = fakeRouter()
    goBackTo(router as never, { name: 'app-main' })
    expect(router.back).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith({ name: 'app-main' })
  })

  it('replaces this page when it is the first one', () => {
    const router = fakeRouter()
    goBackTo(router as never, { name: 'app-main' })
    expect(router.replace).toHaveBeenCalledOnce()
  })
})
