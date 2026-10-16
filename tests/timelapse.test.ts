import { describe, expect, it } from 'vitest'
import { FPS, MIN_STEPS, TimelapseLog, blobBytes, frameSchedule, packTimelapse, pickVideoType, unpackTimelapse, videoExtension } from '@/utils/timelapse'

const piece = (text: string) => new Blob([text])
const textOf = async (b: Blob) => new TextDecoder().decode(await blobBytes(b))
const step = (i: number) => ({ x: i, y: i * 2, w: 3, h: 4, blob: piece(`step-${i}`) })

describe('time-lapse log', () => {
  it('follows undo and redo, and forgets the steps taken back when something new is painted', () => {
    const log = new TimelapseLog()
    log.reset(1000, 800)
    expect([log.w, log.h]).toEqual([500, 400])
    for (let i = 0; i < 4; i++) log.add(step(i))
    expect(log.count).toBe(4)
    expect(log.undo()).toBe(true)
    expect(log.undo()).toBe(true)
    expect(log.count).toBe(2)
    expect(log.redo()).toBe(true)
    expect(log.count).toBe(3)
    log.undo()
    log.add(step(9))
    expect(log.count).toBe(3)
    expect(log.steps.length).toBe(3)
    expect(log.redo()).toBe(false)
    for (let i = 0; i < 5; i++) log.undo()
    expect(log.count).toBe(0)
    expect(log.undo()).toBe(false)
  })

  it('shows only the steps that are in the picture when it is saved', async () => {
    const log = new TimelapseLog()
    log.reset(100, 100)
    for (let i = 0; i < 5; i++) log.add(step(i))
    log.undo()
    const snap = await log.snapshot()
    expect(snap.steps.length).toBe(4)
    expect(snap.w).toBe(50)
  })
})

describe('time-lapse in one piece', () => {
  it('packs and unpacks, step by step', async () => {
    const data = { w: 400, h: 300, base: piece('BASEPICTURE'), steps: [0, 1, 2, 3].map(step) }
    const blob = packTimelapse(data)!
    const back = (await unpackTimelapse(blob))!
    expect([back.w, back.h]).toEqual([400, 300])
    expect(await textOf(back.base!)).toBe('BASEPICTURE')
    expect(back.steps.length).toBe(4)
    for (let i = 0; i < 4; i++) {
      expect(await textOf(back.steps[i]!.blob)).toBe(`step-${i}`)
      expect(back.steps[i]!.x).toBe(i)
      expect(back.steps[i]!.y).toBe(i * 2)
    }
  })

  it('works without a base picture', async () => {
    const back = (await unpackTimelapse(packTimelapse({ w: 10, h: 10, base: null, steps: [0, 1, 2].map(step) })!))!
    expect(back.base).toBeNull()
    expect(await textOf(back.steps[2]!.blob)).toBe('step-2')
  })

  it('is not worth saving with only a few steps, and unpacking a damaged file gives nothing', async () => {
    expect(packTimelapse({ w: 10, h: 10, base: null, steps: [step(0)] })).toBeNull()
    expect(MIN_STEPS).toBeGreaterThan(1)
    expect(await unpackTimelapse(new Blob(['not a time-lapse']))).toBeNull()
    expect(await unpackTimelapse(new Blob([]))).toBeNull()
  })
})

describe('the film', () => {
  it('is 5 seconds for a short painting and never longer than 14 plus the looks at start and end', () => {
    const short = frameSchedule(10)
    expect(short.frames).toBe(Math.round(0.6 * FPS) + 5 * FPS + 2 * FPS)
    const long = frameSchedule(900)
    expect(long.frames).toBe(Math.round(0.6 * FPS) + 14 * FPS + 2 * FPS)
  })

  it('shows every step once, in order, never before the start look or after the body', () => {
    const { frames, stepAt } = frameSchedule(120)
    expect(stepAt.length).toBe(120)
    for (let i = 1; i < stepAt.length; i++) expect(stepAt[i]!).toBeGreaterThanOrEqual(stepAt[i - 1]!)
    expect(stepAt[0]).toBe(Math.round(0.6 * FPS))
    expect(stepAt[119]!).toBeLessThan(frames - 2 * FPS)
  })

  it('picks the best kind of video the browser can make', () => {
    expect(pickVideoType(() => true)).toBe('video/mp4;codecs=avc1.42E01E')
    expect(pickVideoType((t) => t.startsWith('video/webm'))).toBe('video/webm;codecs=vp9')
    expect(pickVideoType((t) => t === 'video/webm')).toBe('video/webm')
    expect(pickVideoType(() => false)).toBeNull()
    expect(videoExtension('video/mp4;codecs=avc1.42E01E')).toBe('mp4')
    expect(videoExtension('video/webm')).toBe('webm')
  })
})
