import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installPenTaps } from '@/use/usePenTaps'

function pointer(type: string, target: Element, opts: { x?: number; y?: number; pointerType?: string } = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: opts.x ?? 10, clientY: opts.y ?? 10 })
  Object.defineProperty(e, 'pointerType', { value: opts.pointerType ?? 'pen' })
  Object.defineProperty(e, 'pointerId', { value: 7 })
  target.dispatchEvent(e)
}

let stop: () => void
let button: HTMLButtonElement
let other: HTMLButtonElement
let clicks: number

beforeEach(() => {
  vi.useFakeTimers()
  document.body.innerHTML = '<button id="a"><span id="inner">A</span></button><button id="b">B</button>'
  button = document.getElementById('a') as HTMLButtonElement
  other = document.getElementById('b') as HTMLButtonElement
  clicks = 0
  button.addEventListener('click', () => clicks++)
  stop = installPenTaps({ delay: 100 })
})

afterEach(() => {
  stop()
  vi.useRealTimers()
})

describe('pen taps', () => {
  it('sends a click when the pen touched a button and the browser sent none', () => {
    pointer('pointerdown', button)
    pointer('pointerup', button, { x: 14, y: 12 })
    expect(clicks).toBe(0)
    vi.advanceTimersByTime(150)
    expect(clicks).toBe(1)
  })

  it('also works when the pen touches something inside the button', () => {
    const inner = document.getElementById('inner')!
    pointer('pointerdown', inner)
    pointer('pointerup', inner)
    vi.advanceTimersByTime(150)
    expect(clicks).toBe(1)
  })

  it('does not click twice when the browser did send its own click', () => {
    pointer('pointerdown', button)
    pointer('pointerup', button)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    vi.advanceTimersByTime(150)
    expect(clicks).toBe(1)
  })

  it('does nothing for a finger or a mouse (they click on their own)', () => {
    pointer('pointerdown', button, { pointerType: 'touch' })
    pointer('pointerup', button, { pointerType: 'touch' })
    pointer('pointerdown', button, { pointerType: 'mouse' })
    pointer('pointerup', button, { pointerType: 'mouse' })
    vi.advanceTimersByTime(300)
    expect(clicks).toBe(0)
  })

  it('does nothing when the pen moved far (it was a stroke, not a tap)', () => {
    pointer('pointerdown', button, { x: 10, y: 10 })
    pointer('pointerup', button, { x: 200, y: 10 })
    vi.advanceTimersByTime(300)
    expect(clicks).toBe(0)
  })

  it('does nothing when the pen was lifted over another button or the touch was cancelled', () => {
    pointer('pointerdown', button)
    pointer('pointerup', other)
    pointer('pointerdown', button)
    pointer('pointercancel', button)
    pointer('pointerup', button)
    vi.advanceTimersByTime(300)
    expect(clicks).toBe(0)
  })

  it('does not click a button that is disabled', () => {
    button.disabled = true
    pointer('pointerdown', button)
    pointer('pointerup', button)
    vi.advanceTimersByTime(300)
    expect(clicks).toBe(0)
  })

  it('stops watching when told to', () => {
    stop()
    pointer('pointerdown', button)
    pointer('pointerup', button)
    vi.advanceTimersByTime(300)
    expect(clicks).toBe(0)
  })
})
