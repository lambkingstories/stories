import { describe, expect, it } from 'vitest'
import { nearestDock, parseDock } from '@/use/useToolbarDock'

describe('tool bar place', () => {
  it('is the left edge in the middle when nothing (or something broken) was saved', () => {
    expect(parseDock(null)).toEqual({ edge: 'left', pos: 0.5 })
    expect(parseDock('not json')).toEqual({ edge: 'left', pos: 0.5 })
    expect(parseDock('{"edge":"middle","pos":0.3}')).toEqual({ edge: 'left', pos: 0.5 })
    expect(parseDock('{"edge":"left","pos":"x"}')).toEqual({ edge: 'left', pos: 0.5 })
  })

  it('reads a saved place and keeps it away from the very corners', () => {
    expect(parseDock('{"edge":"right","pos":0.3}')).toEqual({ edge: 'right', pos: 0.3 })
    expect(parseDock('{"edge":"left","pos":0}').pos).toBe(0.08)
    expect(parseDock('{"edge":"right","pos":1}').pos).toBe(0.92)
  })

  it('moves a bar that was saved at the top or the bottom to a side', () => {
    expect(parseDock('{"edge":"top","pos":0.2}')).toEqual({ edge: 'left', pos: 0.5 })
    expect(parseDock('{"edge":"bottom","pos":0.8}')).toEqual({ edge: 'right', pos: 0.5 })
  })

  it('puts a bar that was let go at the nearer side, at the height where it was let go', () => {
    expect(nearestDock(20, 400, 1000, 800)).toEqual({ edge: 'left', pos: 0.5 })
    expect(nearestDock(980, 200, 1000, 800)).toEqual({ edge: 'right', pos: 0.25 })
    // never the top or the bottom edge, however close the finger is to it
    expect(nearestDock(300, 10, 1000, 800)).toEqual({ edge: 'left', pos: 0.08 })
    expect(nearestDock(700, 790, 1000, 800)).toEqual({ edge: 'right', pos: 0.92 })
  })

  it('never puts the bar exactly into a corner', () => {
    expect(nearestDock(0, 0, 1000, 800).pos).toBe(0.08)
    expect(nearestDock(1000, 800, 1000, 800).pos).toBeLessThanOrEqual(0.92)
  })
})
