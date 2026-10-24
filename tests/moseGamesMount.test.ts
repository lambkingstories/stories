/**
 * The new games of "Mose" (`worte`, `unterschied`, `manna`, `wolke`, `flechten`, `leuchten`, `takt`, and the shared packing, verse and hidden-picture games with their stand-ins): each is mounted with
 * sample data and used: right and wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { BeatGame, CloudGame, DiffGame, GlowGame, MannaGame, PackGame, WeaveGame, WordsGame } from '@/types/adventure'

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: (n: string) => {
      played.push(n)
      return Promise.resolve()
    },
    preload: vi.fn(),
    stopAll: vi.fn(),
    lengthOf: () => 0,
    enabled: { value: true },
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    playedSince: () => true
  })
}))

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })




// ---------------------------------------------------------------- put the words in order
describe('Worte ordnen (words)', () => {
  const game: WordsGame = {
    background: 'images/x/sinai.webp',
    chip: 'images/x/chip.webp',
    strip: 'images/x/strip.webp',
    rounds: [
      { hint: 'Runde eins.', sentences: ['Du sollst nicht töten.', 'Ehre Vater und Mutter.'] },
      { hint: 'Runde zwei.', sentences: ['Halte den Ruhetag heilig.'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Words } = await import('@/components/molecules/games/GameWords.vue')
    const w = mount(Words, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose the chip with this word (a press and a release without moving), then tap the strip. */
  const lay = async (w: W, word: string) => {
    const el = w.findAll('.ww-chip').find((x) => x.text() === word)!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find('.ww-strip').trigger('click')
    await flushPromises()
  }
  const sentence = async (w: W, text: string) => {
    for (const word of text.split(' ')) await lay(w, word)
  }

  it('the goal is every sentence of both rounds; the chips lie in a mixed order that is not the right one; the strip has a gap for every word', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.ww-round').text()).toContain('Runde 1 von 2')
    const chips = w.findAll('.ww-chip').map((x) => x.text())
    expect([...chips].sort()).toEqual(['Du', 'nicht', 'sollst', 'töten.'].sort())
    expect(chips.join(' ')).not.toBe('Du sollst nicht töten.')
    expect(w.findAll('.ww-gap')).toHaveLength(4)
    expect(w.find('.ww-count').text()).toBe('Sätze geordnet: 0 von 3')
  })

  it('the right next word stays in the strip (a tick); the chip is gone from the stone', async () => {
    const w = await open()
    await lay(w, 'Du')
    expect(w.findAll('.ww-word').map((x) => x.text())).toEqual(['Du'])
    expect(w.findAll('.ww-chip')).toHaveLength(3)
    expect(w.findAll('.ww-gap')).toHaveLength(3)
    expect(played).toContain('snap')
  })

  it('a wrong word wobbles back with a cross and a mistake; nothing is laid', async () => {
    const w = await open()
    await lay(w, 'töten.')
    expect(played).toContain('wrong')
    expect(w.find('.ww-chip.wobble').exists()).toBe(true)
    expect(w.find('.ww-fb').text()).toContain('kommt noch nicht')
    expect(w.findAll('.ww-word')).toHaveLength(0)
    expect(w.findAll('.ww-chip')).toHaveLength(4)
  })

  it('the tip lays the next word and counts as a tip', async () => {
    const w = await open()
    await lay(w, 'Du')
    await w.find('.ww-tip').trigger('click')
    expect(w.findAll('.ww-word').map((x) => x.text())).toEqual(['Du', 'sollst'])
  })

  it('the whole sentence: it shines with a star and the point is counted; after a while the next sentence begins with new chips', async () => {
    const w = await open()
    await sentence(w, 'Du sollst nicht töten.')
    expect(w.find('.ww-strip').classes()).toContain('shine')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1200)
    expect(w.findAll('.ww-word')).toHaveLength(0)
    expect(w.findAll('.ww-chip').map((x) => x.text()).sort()).toEqual(['Ehre', 'Mutter.', 'Vater', 'und'].sort())
    expect(w.find('.ww-count').text()).toBe('Sätze geordnet: 1 von 3')
  })

  it('both sentences of round 1 end the round; round 2 begins after a while', async () => {
    const w = await open()
    await sentence(w, 'Du sollst nicht töten.')
    await tick(1200)
    await sentence(w, 'Ehre Vater und Mutter.')
    await tick(1200)
    await tick(1500)
    expect(w.find('.ww-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ww-chip')).toHaveLength(4)
  })

  it('the whole game: the end with three stars; mistakes and tips together give the stars (up to three: three, up to eight: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await lay(w, 'töten.')
      await sentence(w, 'Du sollst nicht töten.')
      await tick(1200)
      await sentence(w, 'Ehre Vater und Mutter.')
      await tick(2800)
      await sentence(w, 'Halte den Ruhetag heilig.')
      await tick(1200)
      expect(useTaskProgress().parts.value).toBe(3)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ww-count').text()).toBe('Sentences put in order: 0 of 3')
    expect(w.find('.ww-tip').text()).toBe('Tip')
    await lay(w, 'töten.')
    expect(w.find('.ww-fb').text()).toBe('This word does not come yet.')
  })
})

// ---------------------------------------------------------------- find the differences
describe('Unterschiede finden (diff)', () => {
  const game: DiffGame = {
    rounds: [
      {
        hint: 'Runde eins.',
        base: 'images/x/camp-1.webp',
        items: [
          { image: 'images/x/a.webp', x: 30, y: 40, w: 12 },
          { image: 'images/x/b.webp', x: 70, y: 60, w: 12 }
        ]
      },
      {
        hint: 'Runde zwei.',
        base: 'images/x/camp-2.webp',
        items: [
          { image: 'images/x/c.webp', x: 20, y: 30, w: 8 },
          { image: 'images/x/d.webp', x: 50, y: 70, w: 8 },
          { image: 'images/x/e.webp', x: 80, y: 40, w: 8 }
        ]
      }
    ]
  }
  // the pictures are 400 x 300 pixels: a percent of the width is four pixels, a percent of the height three
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Diff } = await import('@/components/molecules/games/GameDiff.vue')
    const w = mount(Diff, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** A tap on the right picture at this place (percent). */
  const tapAt = async (w: W, x: number, y: number) => {
    await w.find('.df-pic.right').trigger('click', { clientX: x * 4, clientY: y * 3 })
    await flushPromises()
  }
  const roundOne = async (w: W) => {
    await tapAt(w, 30, 40)
    await tapAt(w, 70, 60)
  }
  const roundTwo = async (w: W) => {
    await tapAt(w, 20, 30)
    await tapAt(w, 50, 70)
    await tapAt(w, 80, 40)
  }

  it('the goal is every extra thing of both rounds; two pictures, two things in the right one, no ring yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.df-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.df-pic')).toHaveLength(2)
    expect(w.findAll('.df-thing')).toHaveLength(2)
    expect(w.findAll('.df-ring.dashed').every((r) => r.attributes('style')?.includes('display: none'))).toBe(true)
    expect(w.find('.df-count').text()).toBe('Unterschiede gefunden: 0 von 2')
  })

  it('a tap on a thing (a little beside the middle is fine) finds it: a tick, a green ring on the right, a dashed circle on the left', async () => {
    const w = await open()
    await tapAt(w, 32, 41)
    expect(played).toContain('found')
    expect(w.findAll('.df-thing.found')).toHaveLength(1)
    expect(w.find('.df-ring.solid').exists()).toBe(true)
    expect(w.findAll('.df-ring.dashed').filter((r) => !r.attributes('style')?.includes('display: none'))).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.df-count').text()).toBe('Unterschiede gefunden: 1 von 2')
  })

  it('the thing is a button, too (Tab and Enter): a click on it finds it', async () => {
    const w = await open()
    await w.findAll('.df-thing')[1]!.trigger('click')
    expect(w.findAll('.df-thing.found')).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).not.toContain('wrong')
  })

  it('a tap on nothing is a cross and a mistake; a thing that is found already is not found twice', async () => {
    const w = await open()
    await tapAt(w, 5, 5)
    expect(played).toContain('wrong')
    expect(w.find('.df-cross').exists()).toBe(true)
    expect(w.find('.df-fb').text()).toContain('nichts Neues')
    await tapAt(w, 30, 40)
    played.length = 0
    await tapAt(w, 30, 40)
    expect(played).toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('after more than three empty taps in a row the hint says where to look (free); a find starts the count again', async () => {
    const w = await open()
    for (let i = 0; i < 3; i++) await tapAt(w, 5, 5)
    expect(w.find('.df-fb').text()).toContain('nichts Neues')
    await tapAt(w, 5, 5)
    expect(w.find('.df-fb').text()).toBe('Schau auf die Mitte des Lagers.')
    await tapAt(w, 30, 40)
    await tapAt(w, 5, 5)
    expect(w.find('.df-fb').text()).toContain('nichts Neues')
  })

  it('both things found: round 2 has the other picture and three things', async () => {
    const w = await open()
    await roundOne(w)
    await tick(1800)
    expect(w.find('.df-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.df-thing')).toHaveLength(3)
    expect(w.find('.df-pic').attributes('style')).toContain('camp-2')
    expect(w.find('.df-count').text()).toBe('Unterschiede gefunden: 0 von 3')
  })

  it('the whole game: the end with three stars; the empty taps give the stars (up to two: three, up to six: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await tapAt(w, 5, 5)
      await roundOne(w)
      await tick(1800)
      await roundTwo(w)
      await tick(1300)
      expect(useTaskProgress().parts.value).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} empty taps`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.df-count').text()).toBe('Differences found: 0 of 2')
    await tapAt(w, 5, 5)
    expect(w.find('.df-fb').text()).toBe('Nothing new here. Look again.')
  })
})

// ---------------------------------------------------------------- gather manna
describe('Manna sammeln (manna)', () => {
  const game: MannaGame = {
    background: 'images/x/desert.webp',
    flakes: ['images/x/f1.webp', 'images/x/f2.webp', 'images/x/f3.webp'],
    jar: 'images/x/jar.webp',
    jarFull: 'images/x/jar-full.webp',
    dwellers: 'images/x/dwellers.webp',
    flakesPerJar: 4,
    rounds: [
      { hint: 'Runde eins.', days: [{ jars: 1 }, { jars: 2 }] },
      { hint: 'Runde zwei.', days: [{ jars: 2 }, { jars: 0 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Manna } = await import('@/components/molecules/games/GameManna.vue')
    const w = mount(Manna, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const gather = async (w: W, n: number) => {
    for (let i = 0; i < n; i++) {
      await w.find('.mn-flake').trigger('click')
      await flushPromises()
    }
  }
  const enough = async (w: W) => {
    await w.find('.mn-enough').trigger('click')
    await flushPromises()
  }
  const fills = (w: W) => w.findAll('.mn-fill').map((x) => Number(x.text()))

  it('the goal is every day of both rounds; day 1, three jars (two needed and a spare one), twelve grains on the ground, the button says "Enough"', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.mn-day').text()).toBe('Tag 1')
    expect(w.findAll('.mn-jar')).toHaveLength(3)
    expect(w.findAll('.mn-flake')).toHaveLength(12)
    expect(w.find('.mn-enough').text()).toBe('Genug')
    expect(w.find('.mn-count').text()).toBe('Richtige Tage: 0 von 4')
  })

  it('a tapped grain goes into the next jar (a soft tone); four grains fill a jar, the next grain begins the next one', async () => {
    const w = await open()
    await gather(w, 1)
    expect(played).toContain('bead')
    expect(w.findAll('.mn-flake')).toHaveLength(11)
    expect(fills(w)).toEqual([1, 0, 0])
    await gather(w, 3)
    expect(fills(w)).toEqual([4, 0, 0])
    expect(w.findAll('.mn-jar')[0]!.classes()).toContain('full')
    await gather(w, 2)
    expect(fills(w)).toEqual([4, 2, 0])
  })

  it('"Enough" with the right amount: a tick, a star, the day counts; after a while day 2 begins with empty jars and new grains', async () => {
    const w = await open()
    await gather(w, 4)
    await enough(w)
    expect(played).toContain('star')
    expect(w.find('.mn-fb').text()).toBe('Der Tag stimmt!')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1600)
    expect(w.find('.mn-day').text()).toBe('Tag 2')
    expect(fills(w)).toEqual([0, 0, 0])
    expect(w.findAll('.mn-flake')).toHaveLength(12)
  })

  it('too little or too much: a cross, a hint what is needed, a mistake; the day does not count yet', async () => {
    const w = await open()
    await enough(w)
    expect(played).toContain('wrong')
    expect(w.find('.mn-fb').text()).toBe('Heute brauchen wir einen Krug.')
    await gather(w, 8)
    await enough(w)
    expect(w.find('.mn-fb').text()).toBe('Heute brauchen wir einen Krug.')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('.mn-day').text()).toBe('Tag 1')
  })

  it('a tap on a jar empties it and the jars after it: the grains lie on the ground again; then the amount can be right', async () => {
    const w = await open()
    await gather(w, 8)
    await w.findAll('.mn-jar')[1]!.trigger('click')
    expect(fills(w)).toEqual([4, 0, 0])
    expect(w.findAll('.mn-flake')).toHaveLength(8)
    await enough(w)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('day 2 needs two jars; round 2: the day of rest has nothing on the ground and the button says "Day of rest"', async () => {
    const w = await open()
    await gather(w, 4)
    await enough(w)
    await tick(1600)
    await gather(w, 8)
    await enough(w)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(1600)
    await tick(1500)
    expect(w.find('.mn-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.mn-day').text()).toBe('Tag 3')
    await gather(w, 8)
    await enough(w)
    await tick(1600)
    expect(w.find('.mn-day').text()).toBe('Tag 4')
    expect(w.findAll('.mn-flake')).toHaveLength(0)
    expect(w.find('.mn-enough').text()).toBe('Ruhetag')
    await enough(w)
    expect(w.find('.mn-fb').text()).toContain('ruhen')
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('the key G is "Enough"', async () => {
    const w = await open()
    await gather(w, 4)
    await w.find('.mn').trigger('keydown', { key: 'g' })
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('the whole game: the end with three stars; the wrong days give the stars (up to one: three, up to three: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await enough(w)
      await gather(w, 4)
      await enough(w)
      await tick(1600)
      await gather(w, 8)
      await enough(w)
      await tick(3200)
      await gather(w, 8)
      await enough(w)
      await tick(1600)
      await enough(w)
      await tick(1600)
      expect(useTaskProgress().parts.value).toBe(4)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.mn-day').text()).toBe('Day 1')
    expect(w.find('.mn-enough').text()).toBe('Enough')
    await enough(w)
    expect(w.find('.mn-fb').text()).toBe('Today we need one jar.')
  })
})

// ---------------------------------------------------------------- follow the cloud
describe('Der Wolke folgen (cloud)', () => {
  const game: CloudGame = {
    dayScene: 'images/x/day.webp',
    nightScene: 'images/x/night.webp',
    pillarDay: 'images/x/cloud.webp',
    pillarNight: 'images/x/fire.webp',
    extras: { smoke: 'images/x/smoke.webp', birds: 'images/x/bird.webp', sparks: 'images/x/sparks.webp' },
    rounds: [
      { hint: 'Runde eins.', mode: 'day', trials: [{ pillar: 'rises', distractors: ['smoke', 'birds'] }, { pillar: 'stays', distractors: ['birds'] }] },
      { hint: 'Runde zwei.', mode: 'night', trials: [{ pillar: 'stays', distractors: ['sparks'] }, { pillar: 'rises', distractors: ['sparks'] }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cloud } = await import('@/components/molecules/games/GameCloud.vue')
    const w = mount(Cloud, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const go = async (w: W) => {
    await w.findAll('.cd-answers button')[0]!.trigger('click')
    await flushPromises()
  }
  const stay = async (w: W) => {
    await w.findAll('.cd-answers button')[1]!.trigger('click')
    await flushPromises()
  }
  const rises = (w: W) => w.find('.cd-pillar').classes().includes('rises')
  /** Answer the trial that is shown right. */
  const right = async (w: W) => {
    if (rises(w)) await go(w)
    else await stay(w)
  }
  const wrong = async (w: W) => {
    if (rises(w)) await stay(w)
    else await go(w)
  }
  const allRight = async (w: W) => {
    await right(w)
    await tick(1100)
    await right(w)
    await tick(1100)
    await tick(1600)
    await right(w)
    await tick(1100)
    await right(w)
    await tick(1100)
  }

  it('the goal is every question of both rounds; the pillar of cloud by day, it rises first; things drift round it; two buttons answer', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.cd-round').text()).toContain('Runde 1 von 2')
    expect(rises(w)).toBe(true)
    expect(w.find('.cd-field').classes()).not.toContain('night')
    expect(w.find('.cd-pillar').attributes('aria-label')).toBe('Die Wolkensäule')
    expect(w.findAll('.cd-extra.smoke')).toHaveLength(2)
    expect(w.findAll('.cd-extra.birds')).toHaveLength(2)
    expect(w.findAll('.cd-answers button')).toHaveLength(2)
    expect(w.find('.cd-count').text()).toBe('Richtige Antworten: 0 von 2')
  })

  it('the right answer: a tick; the next question comes after a moment (here the pillar stays)', async () => {
    const w = await open()
    await go(w)
    expect(played).toContain('snap')
    expect(w.find('.cd-fb').text()).toBe('Richtig!')
    expect(useTaskProgress().parts.value).toBe(1)
    await go(w)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1100)
    expect(rises(w)).toBe(false)
    expect(w.find('.cd-pillar').classes()).toContain('stays')
  })

  it('a wrong answer: a cross, a dull sound, a mistake, the right way is told; the same question comes once more at the end of the round', async () => {
    const w = await open()
    await stay(w)
    expect(played).toContain('wrong')
    expect(w.find('.cd-fb').text()).toContain('Das Volk bricht auf')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(2300)
    // now the second question (the pillar stays) is shown
    expect(rises(w)).toBe(false)
    await stay(w)
    await tick(1100)
    // and the first one again at the end
    expect(rises(w)).toBe(true)
    await go(w)
    await tick(1100)
    await tick(1600)
    expect(w.find('.cd-round').text()).toContain('Runde 2 von 2')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('the arrow keys answer: up breaks up, down stays', async () => {
    const w = await open()
    await w.find('.cd').trigger('keydown', { key: 'ArrowUp' })
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1100)
    await w.find('.cd').trigger('keydown', { key: 'ArrowDown' })
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('round 2 is by night: the other scene, the pillar of fire, sparks', async () => {
    const w = await open()
    await right(w)
    await tick(1100)
    await right(w)
    await tick(1100)
    await tick(1600)
    expect(w.find('.cd-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.cd-field').classes()).toContain('night')
    expect(w.find('.cd-field').attributes('style')).toContain('night.webp')
    expect(w.find('.cd-pillar').attributes('aria-label')).toBe('Die Feuersäule')
    expect(w.findAll('.cd-extra.sparks')).toHaveLength(2)
  })

  it('the whole game: the end with three stars; the wrong answers give the stars (one: three, up to three: two, more: one)', async () => {
    for (const [mistakes, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await wrong(w)
        await tick(2300)
      }
      // the trials that were wrong are at the end of the round; answer whatever is shown, until the game is over
      for (let i = 0; i < 30 && !useTaskProgress().finished.value; i++) {
        await right(w)
        await tick(2800)
      }
      expect(useTaskProgress().parts.value).toBe(4)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.findAll('.cd-answers button')[0]!.text()).toBe('Set out')
    expect(w.findAll('.cd-answers button')[1]!.text()).toBe('Stay')
    await stay(w)
    expect(w.find('.cd-fb').text()).toContain('the people set out')
  })
})

// ---------------------------------------------------------------- plait the little basket
describe('Körbchen flechten (weave)', () => {
  const game: WeaveGame = {
    background: 'images/x/nile.webp',
    tiles: { stake: 'images/x/stake.webp', front: 'images/x/front.webp', behind: 'images/x/behind.webp', active: 'images/x/glow.webp' },
    done: 'images/x/basket.webp',
    rounds: [
      { hint: 'Runde eins.', stakes: 4, rows: 2, pattern: 'same' },
      { hint: 'Runde zwei.', stakes: 4, rows: 2, pattern: 'alternate' }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Weave } = await import('@/components/molecules/games/GameWeave.vue')
    const w = mount(Weave, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** The cell of a row (0 at the bottom, two rows in the test) and a stake (0 at the left); the top row comes first in the page. */
  const cell = (w: W, row: number, stake: number) => w.findAll('button.wv-cell')[(1 - row) * 4 + stake]!
  const tap = async (w: W, row: number, stake: number) => {
    await cell(w, row, stake).trigger('click')
    await flushPromises()
  }
  const roundOne = async (w: W) => {
    for (const r of [0, 1]) {
      await tap(w, r, 0)
      await tap(w, r, 2)
    }
  }
  const roundTwo = async (w: W) => {
    await tap(w, 0, 0)
    await tap(w, 0, 2)
    await tap(w, 1, 1)
    await tap(w, 1, 3)
  }

  it('the goal is every cell where the reed runs in front, of both rounds; eight cells, only the cells of the first row (the bottom one) can be tapped', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.find('.wv-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('button.wv-cell')).toHaveLength(8)
    expect(w.findAll('button.wv-cell.active')).toHaveLength(4)
    expect(cell(w, 0, 0).attributes('disabled')).toBeUndefined()
    expect(cell(w, 1, 0).attributes('disabled')).toBeDefined()
    expect(w.find('.wv-count').text()).toBe('Reihen geflochten: 0 von 2')
  })

  it('a cell where the reed runs in front: a piece of reed lies in front of the stake, a tick, the point is counted', async () => {
    const w = await open()
    await tap(w, 0, 0)
    expect(cell(w, 0, 0).find('.band.front').exists()).toBe(true)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a cell where the reed has to run behind: a cross, a dull sound, a mistake; nothing is set', async () => {
    const w = await open()
    await tap(w, 0, 1)
    expect(played).toContain('wrong')
    expect(w.find('.wv-fb').text()).toBe('Hier läuft das Rohr hinter dem Stab.')
    expect(cell(w, 0, 1).find('.band').exists()).toBe(false)
    expect(cell(w, 0, 1).find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('all the front cells of a row tapped: the reed lies behind the other stakes by itself and the next row glows', async () => {
    const w = await open()
    await tap(w, 0, 0)
    await tap(w, 0, 2)
    expect(cell(w, 0, 1).find('.band.behind').exists()).toBe(true)
    expect(cell(w, 0, 3).find('.band.behind').exists()).toBe(true)
    expect(cell(w, 0, 0).find('.band.front').exists()).toBe(true)
    expect(cell(w, 1, 0).attributes('disabled')).toBeUndefined()
    expect(cell(w, 0, 0).attributes('disabled')).toBeDefined()
    expect(w.find('.wv-count').text()).toBe('Reihen geflochten: 1 von 2')
  })

  it('the tip is shut until three mistakes in a row; then it shows the next right cell (free)', async () => {
    const w = await open()
    expect(w.find('.wv-tip').attributes('disabled')).toBeDefined()
    for (let i = 0; i < 3; i++) await tap(w, 0, 1)
    expect(w.find('.wv-tip').attributes('disabled')).toBeUndefined()
    await w.find('.wv-tip').trigger('click')
    expect(cell(w, 0, 0).classes()).toContain('tip')
    expect(w.find('.wv-fb').text()).toContain('vor dem Stab')
  })

  it('round 1 done: the basket is shown for a moment; round 2 begins with the rows the other way round', async () => {
    const w = await open()
    await roundOne(w)
    expect(w.find('.wv-done').exists()).toBe(true)
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(3100)
    expect(w.find('.wv-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('button.wv-cell.active')).toHaveLength(4)
    // the second row begins the other way round: its front cells are the stakes 2 and 4
    await tap(w, 0, 0)
    await tap(w, 0, 2)
    await tap(w, 1, 0)
    expect(cell(w, 1, 0).find('.band').exists()).toBe(false)
    expect(w.find('.wv-fb').text()).toContain('hinter')
  })

  it('the whole game: the end with three stars; the mistakes give the stars (up to two: three, up to five: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await tap(w, 0, 1)
      await roundOne(w)
      await tick(3100)
      await roundTwo(w)
      await tick(1800)
      expect(useTaskProgress().parts.value).toBe(8)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.wv-count').text()).toBe('Rows plaited: 0 of 2')
    await tap(w, 0, 1)
    expect(w.find('.wv-fb').text()).toBe('Here the reed runs behind the stake.')
  })
})

// ---------------------------------------------------------------- follow the glow
describe('Dem Leuchten nachgehen (glow)', () => {
  const game: GlowGame = {
    walker: 'images/x/moses.webp',
    bush: 'images/x/bush.webp',
    rounds: [
      { hint: 'Runde eins.', background: 'images/x/slope-1.webp', start: [10, 80], target: [70, 30], threshold: 7 },
      { hint: 'Runde zwei.', background: 'images/x/slope-2.webp', start: [10, 80], target: [80, 40], threshold: 7, cover: 'images/x/rocks.webp' }
    ]
  }
  // the slope is 400 x 300 pixels: a percent of the width is four pixels, a percent of the height three
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Glow } = await import('@/components/molecules/games/GameGlow.vue')
    const w = mount(Glow, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Put the finger down at this place (percent) and take it away again. */
  const touch = async (w: W, x: number, y: number) => {
    w.find('.gl-field').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x * 4, clientY: y * 3 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
  }
  const percent = (w: W) => Number(/(\d+) %/.exec(w.find('.gl-field').attributes('aria-label') ?? '')![1])
  const walkerX = (w: W) => Number(/left: ([\d.]+)%/.exec(w.find('.gl-walker').attributes('style') ?? '')![1])

  it('the goal is the bush of every round; Moses stands at the start, the glow is faint, the bush is not found', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.gl-round').text()).toContain('Runde 1 von 2')
    expect(walkerX(w)).toBe(10)
    expect(percent(w)).toBeLessThan(25)
    expect(w.find('.gl-bush').classes()).not.toContain('there')
    expect(w.find('.gl-cover').exists()).toBe(false)
    expect(w.find('.gl-count').text()).toBe('Büsche gefunden: 0 von 2')
  })

  it('the nearer Moses comes the stronger the glow; far away it is faint again', async () => {
    const w = await open()
    await touch(w, 30, 60)
    const a = percent(w)
    await touch(w, 50, 45)
    const b = percent(w)
    await touch(w, 62, 36)
    const c = percent(w)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
    await touch(w, 5, 95)
    expect(percent(w)).toBeLessThan(a)
    expect(played).toHaveLength(0)
  })

  it('near the bush Moses is there: he stops at the bush, the bush shines and stays green, a bright tone, the point is counted', async () => {
    const w = await open()
    await touch(w, 66, 32)
    expect(w.find('.gl-bush').classes()).toContain('there')
    expect(played).toContain('found')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gl-fb').text()).toContain('bleibt grün')
    expect(walkerX(w)).toBe(70)
    // he stays: a further touch does not move him
    await touch(w, 10, 10)
    expect(walkerX(w)).toBe(70)
  })

  it('the arrow keys lead Moses a step', async () => {
    const w = await open()
    await w.find('.gl').trigger('keydown', { key: 'ArrowRight' })
    expect(walkerX(w)).toBe(13)
    await w.find('.gl').trigger('keydown', { key: 'ArrowLeft' })
    await w.find('.gl').trigger('keydown', { key: 'ArrowLeft' })
    expect(walkerX(w)).toBe(7)
  })

  it('round 2: the rocks stand in front of the bush; it is found all the same, and the game ends', async () => {
    const w = await open()
    await touch(w, 66, 32)
    await tick(3000)
    expect(w.find('.gl-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.gl-cover').exists()).toBe(true)
    expect(walkerX(w)).toBe(10)
    expect(w.find('.gl-bush').classes()).not.toContain('there')
    await touch(w, 78, 42)
    await tick(2000)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(useTaskProgress().finished.value).toBe(true)
  })

  it('after twenty seconds without coming nearer the tip shows; it sends sparks towards the bush (a tip)', async () => {
    const w = await open()
    expect(w.find('.gl-tip').exists()).toBe(false)
    await tick(19000)
    expect(w.find('.gl-tip').exists()).toBe(false)
    await tick(2000)
    expect(w.find('.gl-tip').exists()).toBe(true)
    await w.find('.gl-tip').trigger('click')
    expect(w.findAll('.gl-spark').filter((s) => !s.attributes('style')?.includes('display: none'))).toHaveLength(3)
    expect(w.find('.gl-fb').text()).toContain('Funken')
    // coming nearer takes the tip away again
    await touch(w, 40, 55)
    await tick(500)
    expect(w.find('.gl-tip').exists()).toBe(false)
  })

  it('the whole game: the end with three stars without a tip, two stars with one tip, one star with more', async () => {
    for (const [tips, stars] of [[0, 3], [1, 2], [2, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < tips; i++) {
        await tick(21000)
        await w.find('.gl-tip').trigger('click')
        await tick(4100)
        await touch(w, 40, 55)
        await touch(w, 10, 80)
      }
      await touch(w, 66, 32)
      await tick(3000)
      await touch(w, 78, 42)
      await tick(2000)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${tips} tips`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.gl-count').text()).toBe('Bushes found: 0 of 2')
    await touch(w, 66, 32)
    expect(w.find('.gl-fb').text()).toBe('Moses is there: the bush shines and stays green.')
  })
})


// ---------------------------------------------------------------- Mirjam's drum
describe('Mirjams Pauke (beat)', () => {
  const game: BeatGame = {
    background: 'images/x/shore.webp',
    drum: 'images/x/drum.webp',
    ring: 'images/x/ring.webp',
    rounds: [
      { hint: 'Runde eins.', bpm: 72, pattern: [1, 1, 1, 1, 1, 1, 1, 1] },
      { hint: 'Runde zwei.', bpm: 80, pattern: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1] }
    ]
  }
  // the first ring arrives two seconds after the start; round 1 is 60 / 72 seconds apart, round 2 0.75 seconds
  const GAP1 = 60 / 72
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Beat } = await import('@/components/molecules/games/GameBeat.vue')
    const w = mount(Beat, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** A round of rings with a clock of its own: `to(seconds)` runs the time to this second after the start. */
  const run = async (w: W) => {
    await w.find('.bt-go').trigger('click')
    let now = 0
    return {
      to: async (s: number) => {
        await tick(Math.round((s - now) * 1000))
        now = s
      },
      tap: async () => {
        await w.find('.bt-drum').trigger('pointerdown')
      }
    }
  }
  const ringAt = (i: number) => 2 + i * GAP1

  it('the goal is every ring of both rounds (20); the drum waits for "Go"', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(20)
    expect(w.find('.bt-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.bt-count').text()).toBe('Ringe getroffen: 0 von 8')
    expect(w.find('.bt-drum').attributes('disabled')).toBeDefined()
    await w.find('.bt-go').trigger('click')
    expect(w.find('.bt-drum').attributes('disabled')).toBeUndefined()
    expect(w.find('.bt-go').exists()).toBe(false)
  })

  it('a tap when the ring arrives counts: the drum shines, a tick, the progress goes up; the same ring cannot be hit twice', async () => {
    const w = await open()
    const r = await run(w)
    await r.to(ringAt(0))
    await r.tap()
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('bead')
    expect(w.find('.bt-drum').classes()).toContain('shine')
    expect(w.find('.bt-count').text()).toBe('Ringe getroffen: 1 von 8')
    // a second tap on the same ring: no new ring in reach, a mistake
    await r.to(ringAt(0) + 0.1)
    await r.tap()
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('wrong')
    expect(w.find('.bt-fb').text()).toContain('kein Ring')
  })

  it('the window is a quarter of a second to both sides', async () => {
    for (const [offset, ok] of [[-0.24, true], [0.24, true], [-0.3, false], [0.3, false]] as const) {
      useTaskProgress().reset()
      played.length = 0
      const w = await open()
      const r = await run(w)
      await r.to(ringAt(0) + offset)
      await r.tap()
      expect(useTaskProgress().parts.value, `${offset}`).toBe(ok ? 1 : 0)
      expect(played.includes('wrong'), `${offset}`).toBe(!ok)
      w.unmount()
    }
  })

  it('a tap with no ring near is a dull sound, a cross and a mistake', async () => {
    const w = await open()
    const r = await run(w)
    await r.to(1)
    await r.tap()
    expect(played).toContain('wrong')
    expect(w.find('.bt-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a ring that is let go fades without a mistake and without a sound; after the round "Once more" or "Go on" shows', async () => {
    const w = await open()
    const r = await run(w)
    await r.to(ringAt(0) + 0.4)
    expect(w.findAll('.bt-ring').length).toBeGreaterThan(0)
    await r.to(ringAt(7) + 0.9)
    expect(played).not.toContain('wrong')
    expect(w.find('.bt-fb').text()).toContain('vorbeigezogen')
    expect(w.findAll('.bt-actions button').map((b) => b.text())).toEqual(['Noch einmal', 'Weiter'])
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('"Once more" plays the round again; the progress counts only what is beyond the best try', async () => {
    const w = await open()
    let r = await run(w)
    for (const i of [0, 1, 2]) {
      await r.to(ringAt(i))
      await r.tap()
    }
    await r.to(ringAt(7) + 0.9)
    expect(useTaskProgress().parts.value).toBe(3)
    await w.findAll('.bt-actions button')[0]!.trigger('click')
    expect(w.find('.bt-go').exists()).toBe(true)
    r = await run(w)
    for (const i of [0, 1, 2, 3, 4]) {
      await r.to(ringAt(i))
      await r.tap()
    }
    expect(useTaskProgress().parts.value).toBe(5)
    await r.to(ringAt(7) + 0.9)
    await w.findAll('.bt-actions button')[0]!.trigger('click')
    r = await run(w)
    for (const i of [0, 1]) {
      await r.to(ringAt(i))
      await r.tap()
    }
    expect(useTaskProgress().parts.value).toBe(5)
    expect(w.find('.bt-round').text()).toContain('Runde 1 von 2')
  })

  it('"Go on" after a round with misses leads to round 2', async () => {
    const w = await open()
    const r = await run(w)
    await r.to(ringAt(7) + 0.9)
    await w.findAll('.bt-actions button')[1]!.trigger('click')
    await tick(1500)
    expect(w.find('.bt-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.bt-count').text()).toBe('Ringe getroffen: 0 von 12')
  })

  it('round 2 has pauses: a tap where a ring is missing is a mistake; the whole game ends with three stars', async () => {
    const w = await open()
    let r = await run(w)
    for (let i = 0; i < 8; i++) {
      await r.to(ringAt(i))
      await r.tap()
    }
    expect(useTaskProgress().parts.value).toBe(8)
    await r.to(ringAt(7) + 0.9)
    expect(w.find('.bt-fb').text()).toContain('Alle Ringe getroffen')
    expect(played).toContain('star')
    await tick(3200)
    expect(w.find('.bt-round').text()).toContain('Runde 2 von 2')
    r = await run(w)
    const times = [0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 13].map((slot) => 2 + slot * 0.75)
    expect(times).toHaveLength(12)
    for (const [k, t] of times.entries()) {
      await r.to(t)
      await r.tap()
      if (k === 2) {
        // tap in the first pause (slot 3): nothing is near
        await r.to(2 + 3 * 0.75)
        await r.tap()
        expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
      }
    }
    await r.to(times[11]! + 1)
    expect(useTaskProgress().parts.value).toBe(20)
    await tick(2000)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('the stars follow the wrong taps: up to three three stars, up to seven two, more one', async () => {
    for (const [wrong, stars] of [[3, 3], [4, 2], [8, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      let r = await run(w)
      for (let i = 0; i < wrong; i++) {
        await r.to(0.1 + i * 0.05)
        await r.tap()
      }
      for (let i = 0; i < 8; i++) {
        await r.to(ringAt(i))
        await r.tap()
      }
      await r.to(ringAt(7) + 0.9)
      await tick(3200)
      r = await run(w)
      await r.to(2.1 + 14 * 0.75 + 2)
      await w.findAll('.bt-actions button')[1]!.trigger('click')
      await tick(100)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the space key starts the round and taps the drum', async () => {
    const w = await open()
    await w.find('.bt').trigger('keydown', { key: ' ' })
    expect(w.find('.bt-go').exists()).toBe(false)
    await tick(2000)
    await w.find('.bt').trigger('keydown', { key: ' ' })
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.bt-count').text()).toBe('Rings hit: 0 of 8')
    await w.find('.bt-go').trigger('click')
    await tick(1000)
    await w.find('.bt-drum').trigger('pointerdown')
    expect(w.find('.bt-fb').text()).toBe('There was no ring here. Wait until it reaches the drum.')
  })
})

// ---------------------------------------------------------------- the packing game with named pieces
describe('Das Tragetuch packen (pack with labels)', () => {
  const game: PackGame = {
    background: 'images/x/camp.webp',
    basket: 'images/x/cloth.webp',
    items: [
      { id: 'kleiderbuendel', image: 'images/x/clothes.webp', w: 3, h: 2, label: 'Kleiderbündel' },
      { id: 'teigtrog', image: 'images/x/dough.webp', w: 2, h: 2, label: 'Teigtrog' },
      { id: 'silberkrug', image: 'images/x/silver.webp', w: 1, h: 2, label: 'Silberkrug' }
    ],
    area: { x: 20, y: 32, w: 60, h: 56 },
    rounds: [{ hint: 'Runde eins.', cols: 4, rows: 3, items: ['kleiderbuendel', 'teigtrog', 'silberkrug'] }]
  }

  it('the pieces are called by their label (not by a name that the basket knows)', async () => {
    const { default: Pack } = await import('@/components/molecules/games/GamePack.vue')
    const w = mount(Pack, { ...opts('de'), props: { game } })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(3)
    const names = w.findAll('.pk-tray .pk-item').map((b) => b.attributes('aria-label'))
    expect(names).toEqual(['Kleiderbündel', 'Teigtrog', 'Silberkrug'])
    expect(w.html()).not.toContain('packName')
    expect(problems()).toEqual([])
  })
})
