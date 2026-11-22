/**
 * The layout of the tiles of the start page: the rules (what a layout is, how it changes), and the memory on the device.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { HOME_SHORTCUTS } from '@/data/homeShortcuts'
import useHomeLayout, { HOME_LAYOUT_KEY } from '@/use/useHomeLayout'
import { BIG_GAMES } from '@/data/bigGames'
import { ALL_TILES, CORE_TILES, DEFAULT_LAYOUT, EXTRA_TILES, GAME_TILES, MAX_SLOTS, addTile, canAddTile, canWiden, defaultLayout, missingTiles, moveTile, normalizeLayout, removeTile, setSize, slotsUsed, toggleSize } from '@/utils/homeTiles'

const ids = (l: readonly { id: string }[]) => l.map((t) => t.id)

describe('the tiles that exist', () => {
  it('begin with the five main tiles, all small (Anton 22.11.2026), and every extra tile has a shortcut with a painted symbol', () => {
    expect(ids(DEFAULT_LAYOUT)).toEqual([...CORE_TILES])
    expect(DEFAULT_LAYOUT.every((t) => t.size === 'small')).toBe(true)
    expect(new Set(ALL_TILES).size).toBe(ALL_TILES.length)
    for (const id of EXTRA_TILES) {
      const sc = HOME_SHORTCUTS[id]!
      expect(sc, id).toBeTruthy()
      expect(sc.image, id).toMatch(/^images\/.+\.webp$/)
    }
    // the shortcuts are exactly the extra tiles (nothing is left over, nothing is missing)
    expect(Object.keys(HOME_SHORTCUTS).sort()).toEqual([...EXTRA_TILES].sort())
  })

  it('every adventure game can be a tile of its own', () => {
    expect(GAME_TILES).toHaveLength(BIG_GAMES.length)
    for (const g of BIG_GAMES) expect(ALL_TILES).toContain(`game-${g.id}`)
    expect(addTile([], 'game-david' as never).map((t) => t.id)).toEqual(['game-david'])
    // a saved layout with an old, unknown game tile loses it
    expect(normalizeLayout([{ id: 'game-toepfer', size: 'small' }, { id: 'game-arche', size: 'wide' }])).toEqual([{ id: 'game-arche', size: 'wide' }])
  })
})

describe('changing a layout', () => {
  it('moves a tile to the place of another one; the ones between move over', () => {
    const l = defaultLayout()
    expect(ids(moveTile(l, 'family', 'adventure'))).toEqual(['family', 'adventure', 'book', 'picture', 'games'])
    expect(ids(moveTile(l, 'adventure', 'family'))).toEqual(['book', 'picture', 'games', 'family', 'adventure'])
    expect(ids(moveTile(l, 'book', 'picture'))).toEqual(['adventure', 'picture', 'book', 'games', 'family'])
    // the sizes go with the tiles; unknown tiles and the same tile change nothing; the old layout is not touched
    expect(moveTile(l, 'family', 'adventure')[0]).toEqual({ id: 'family', size: 'small' })
    expect(ids(moveTile(l, 'book', 'book'))).toEqual(ids(l))
    expect(ids(moveTile(l, 'book', 'quiz'))).toEqual(ids(l))
    expect(ids(l)).toEqual([...CORE_TILES])
  })

  it('makes a tile small or wide, and back', () => {
    const l = defaultLayout()
    expect(setSize(l, 'family', 'wide').find((t) => t.id === 'family')?.size).toBe('wide')
    expect(toggleSize(l, 'family').find((t) => t.id === 'family')?.size).toBe('wide')
    expect(toggleSize(toggleSize(l, 'book'), 'book').find((t) => t.id === 'book')?.size).toBe('small')
    expect(toggleSize(l, 'book').find((t) => t.id === 'book')?.size).toBe('wide')
    // the others stay as they were
    expect(toggleSize(l, 'book').filter((t) => t.id !== 'book')).toEqual(l.filter((t) => t.id !== 'book'))
  })

  it('takes a tile away and puts it back at the end (small); a tile cannot be there twice', () => {
    const l = defaultLayout()
    const less = removeTile(l, 'games')
    expect(ids(less)).toEqual(['adventure', 'book', 'picture', 'family'])
    expect(missingTiles(less)).toContain('games')
    expect(missingTiles(less)).toContain('quiz')
    const again = addTile(less, 'games')
    expect(again[again.length - 1]).toEqual({ id: 'games', size: 'small' })
    expect(ids(addTile(again, 'games'))).toEqual(ids(again))
    expect(missingTiles(l)).toEqual([...EXTRA_TILES, ...GAME_TILES])
  })
})

describe('reading what was saved', () => {
  it('drops unknown and double tiles, makes a wrong size small, and says "nothing saved" for what is not a list', () => {
    expect(normalizeLayout(null)).toBeNull()
    expect(normalizeLayout('x')).toBeNull()
    expect(normalizeLayout({})).toBeNull()
    expect(normalizeLayout([{ id: 'book', size: 'wide' }, { id: 'book', size: 'small' }, { id: 'nope', size: 'small' }, { id: 'quiz', size: 'huge' }, 5, null])).toEqual([
      { id: 'book', size: 'wide' },
      { id: 'quiz', size: 'small' }
    ])
    // a real empty layout stays empty (the child took everything away)
    expect(normalizeLayout([])).toEqual([])
  })
})

describe('the memory on the device', () => {
  beforeEach(() => {
    localStorage.clear()
    useHomeLayout().reload()
  })

  it('starts with the default, keeps every change, and finds it again', () => {
    const h = useHomeLayout()
    expect(ids(h.layout.value)).toEqual([...CORE_TILES])
    h.move('family', 'adventure')
    h.resize('family')
    h.resize('family')
    h.remove('picture')
    h.add('quiz')
    const saved = JSON.parse(localStorage.getItem(HOME_LAYOUT_KEY) ?? 'null') as { id: string; size: string }[]
    expect(saved).toEqual([
      { id: 'family', size: 'small' },
      { id: 'adventure', size: 'small' },
      { id: 'book', size: 'small' },
      { id: 'games', size: 'small' },
      { id: 'quiz', size: 'small' }
    ])
    h.reload()
    expect(ids(h.layout.value)).toEqual(['family', 'adventure', 'book', 'games', 'quiz'])
  })

  it('"reset" brings the default back; broken saved data gives the default', () => {
    const h = useHomeLayout()
    h.remove('book')
    h.reset()
    expect(ids(h.layout.value)).toEqual([...CORE_TILES])
    localStorage.setItem(HOME_LAYOUT_KEY, '{not json')
    h.reload()
    expect(ids(h.layout.value)).toEqual([...CORE_TILES])
  })
})

describe('the 8 places (Anton 22.11.2026)', () => {
  it('a small tile takes one place, a wide tile two, and the page has 8', () => {
    expect(MAX_SLOTS).toBe(8)
    expect(slotsUsed(defaultLayout())).toBe(5)
    expect(slotsUsed([{ id: 'family', size: 'wide' }, { id: 'book', size: 'small' }])).toBe(3)
  })

  it('adds tiles only while a place is free', () => {
    let l = defaultLayout()
    expect(canAddTile(l)).toBe(true)
    l = addTile(addTile(addTile(l, 'quiz'), 'who'), 'order')
    expect(slotsUsed(l)).toBe(8)
    expect(canAddTile(l)).toBe(false)
    expect(ids(addTile(l, 'bingo'))).toEqual(ids(l))
  })

  it('makes a tile wide only when a second place is free', () => {
    const l = defaultLayout()
    expect(canWiden(l, 'book')).toBe(true)
    const wide = setSize(setSize(setSize(l, 'book', 'wide'), 'picture', 'wide'), 'games', 'wide')
    expect(slotsUsed(wide)).toBe(8)
    expect(canWiden(wide, 'adventure')).toBe(false)
    expect(setSize(wide, 'adventure', 'wide').find((t) => t.id === 'adventure')?.size).toBe('small')
    // back to small is always possible
    expect(setSize(wide, 'book', 'small').find((t) => t.id === 'book')?.size).toBe('small')
  })

  it('a saved layout with more than 8 places loses the tiles that do not fit (they can be added again later)', () => {
    const raw = ['adventure', 'book', 'picture', 'games', 'family', 'quiz', 'who', 'order', 'bingo', 'memory'].map((id) => ({ id, size: 'small' }))
    const l = normalizeLayout(raw)!
    expect(slotsUsed(l)).toBe(8)
    expect(ids(l)).toEqual(['adventure', 'book', 'picture', 'games', 'family', 'quiz', 'who', 'order'])
    // a wide tile that would not fit stays off, a small one after it can still come
    const l2 = normalizeLayout([...raw.slice(0, 7), { id: 'order', size: 'wide' }, { id: 'bingo', size: 'small' }])!
    expect(ids(l2)).toEqual(['adventure', 'book', 'picture', 'games', 'family', 'quiz', 'who', 'bingo'])
  })
})
