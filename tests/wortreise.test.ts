/**
 * The Wortreise (family game): the word lists, the generator of the puzzles (a letter circle and a crossword that fits together) and the proof
 * that every puzzle can be solved, the rules for a typed word, the points, the helps and the keeping of a game.
 */
import { describe, expect, it } from 'vitest'
import {
  WR_LANGS,
  WR_LEVELS,
  WR_SPEC,
  bonusPoints,
  canMake,
  cellsOf,
  dictFor,
  emptyProgress,
  filledCells,
  gridLetters,
  judge,
  keyOf,
  makePuzzle,
  mixCircle,
  mixSeed,
  pickHint,
  puzzleDone,
  rng,
  rootCount,
  validatePuzzle,
  wordPoints,
  type WrLang,
  type WrPuzzle
} from '@/utils/wortreise'
import {
  WR_ROUTES,
  buildStages,
  endTurn,
  newGame,
  nextStage,
  parseGame,
  pass,
  passesForFreeLetter,
  puzzleOf,
  showLetter,
  submit,
  type WrConfig,
  type WrGame
} from '@/utils/wortreiseGame'

describe('letters and words', () => {
  it('writes a word with the letters it is played with', () => {
    expect(keyOf('de', 'Zachäus')).toBe('ZACHÄUS')
    expect(keyOf('de', 'Fuß')).toBe('FUSS')
    expect(keyOf('es', 'Jericó')).toBe('JERICO')
    expect(keyOf('es', 'Año')).toBe('AÑO')
    expect(keyOf('en', 'Bet-El')).toBe('BETEL')
  })

  it('makes a word from the circle only with the letters it has, each as often as it has it', () => {
    expect(canMake('ARCHE', 'RACHE')).toBe(true)
    expect(canMake('ARCHE', 'ERE')).toBe(false)
    expect(canMake(['E', 'L', 'I', 'A'], 'ELIA')).toBe(true)
    expect(canMake('ABC', 'ABBA')).toBe(false)
  })

  it.each(WR_LANGS)('has a clean word list in %s: words of 3 to 7 letters, no double words, passages that look like passages', (lang) => {
    const d = dictFor(lang)
    expect(d.list.length).toBeGreaterThan(700)
    expect(d.list.filter((w) => w.bible).length).toBeGreaterThan(250)
    const re = lang === 'de' ? /^[1-5]?\.? ?[A-Za-zÄÖÜäöüß]+ \d+,\d+$/ : /^[1-3]? ?[A-Za-zÁÉÍÓÚáéíóúñÑ ]+ \d+:\d+$/
    for (const w of d.list) {
      expect(w.key.length).toBeGreaterThanOrEqual(3)
      expect(w.key.length).toBeLessThanOrEqual(7)
      expect(keyOf(lang, w.show)).toBe(w.key)
      if (w.ref) expect(w.ref).toMatch(re)
      // a passage is only given for a word of the Bible
      if (w.ref) expect(w.bible).toBe(true)
    }
    // most Bible words have a passage that was checked against the text
    const withRef = d.list.filter((w) => w.bible && w.ref).length
    expect(withRef / d.list.filter((w) => w.bible).length).toBeGreaterThan(0.8)
  })

  it('knows no unfit words', () => {
    const bad = ['ARSCH', 'FICKEN', 'SCHEISSE', 'FUCK', 'SHIT', 'PISS', 'PUTA', 'MIERDA', 'HURE', 'NAZI']
    for (const lang of WR_LANGS) for (const b of bad) expect(dictFor(lang).byKey.has(b)).toBe(false)
  })

  it('shows the passages that are known for sure', () => {
    expect(dictFor('de').byKey.get('ARCHE')?.ref).toBe('Matthäus 24,38')
    expect(dictFor('en').byKey.get('NOAH')?.ref).toBe('Genesis 6:9')
    expect(dictFor('es').byKey.get('NOE')?.ref).toBe('Génesis 6:9')
  })
})

describe('the random numbers', () => {
  it('give the same numbers for the same seed', () => {
    const a = rng(5)
    const b = rng(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(mixSeed(1, 2, 3)).toBe(mixSeed(1, 2, 3))
    expect(mixSeed(1, 2, 3)).not.toBe(mixSeed(1, 2, 4))
  })
})

describe('the puzzles', () => {
  it.each(WR_LANGS)('every level has several roots in %s', (lang) => {
    for (const level of WR_LEVELS) expect(rootCount(lang, level)).toBeGreaterThanOrEqual(6)
  })

  it('makes the same puzzle for the same seed', () => {
    for (const lang of WR_LANGS) for (const level of WR_LEVELS) expect(makePuzzle(lang, level, 42)).toEqual(makePuzzle(lang, level, 42))
  })

  it.each(WR_LANGS)('proves that 120 puzzles of every level in %s are good (made from the circle, fitting, connected, no stray word)', (lang) => {
    const signatures = new Set<string>()
    for (const level of WR_LEVELS) {
      const spec = WR_SPEC[level]
      for (let seed = 0; seed < 120; seed++) {
        const p = makePuzzle(lang, level, seed)
        expect(validatePuzzle(p), `${lang} ${level} ${seed}`).toEqual([])
        expect(p.circle).toHaveLength(spec.letters)
        expect(p.words.length).toBeGreaterThanOrEqual(spec.words[0])
        signatures.add(`${level}|${p.root}|${p.words.map((w) => `${w.dir}${w.row},${w.col}${w.key}`).join(' ')}`)
      }
    }
    // different puzzles (another circle or another grid)
    expect(signatures.size).toBeGreaterThanOrEqual(120 * 3 - 60)
  })

  it('every word of a grid can be made from the circle, every square belongs to a word, and a grid can be filled by typing its words', () => {
    for (const lang of WR_LANGS) {
      for (const level of WR_LEVELS) {
        for (let seed = 0; seed < 25; seed++) {
          const p = makePuzzle(lang, level, seed)
          const pr = emptyProgress()
          for (const w of p.words) {
            expect(canMake(p.circle, w.key)).toBe(true)
            if (judge(p, pr, w.key) === 'grid') pr.found.push(w.key)
          }
          expect(puzzleDone(p, pr)).toBe(true)
          expect(filledCells(p, pr).size).toBe(gridLetters(p).size)
        }
      }
    }
  })

  it('the validation finds faults that are made on purpose', () => {
    const p = makePuzzle('de', 'family', 3)
    const clash: WrPuzzle = { ...p, words: p.words.map((w, i) => (i === 1 ? { ...w, row: w.row + 1 } : w)) }
    expect(validatePuzzle(clash).length).toBeGreaterThan(0)
    const alien: WrPuzzle = { ...p, circle: [...p.circle.slice(1), 'Q'] }
    expect(validatePuzzle(alien).length).toBeGreaterThan(0)
    expect(validatePuzzle({ ...p, words: p.words.slice(0, 2) }).length).toBeGreaterThan(0)
    expect(validatePuzzle({ ...p, bonus: [...p.bonus, p.words[0]!.key] }).length).toBeGreaterThan(0)
  })

  it('does not put a word two times, and keeps the grid inside the size of its level', () => {
    for (const lang of WR_LANGS) {
      for (const level of WR_LEVELS) {
        const p = makePuzzle(lang, level, 7)
        expect(new Set(p.words.map((w) => w.key)).size).toBe(p.words.length)
        expect(p.rows).toBeLessThanOrEqual(WR_SPEC[level].maxGrid)
        expect(p.cols).toBeLessThanOrEqual(WR_SPEC[level].maxGrid)
        for (const w of p.words) for (const [r, c] of cellsOf(w)) expect(r >= 0 && c >= 0 && r < p.rows && c < p.cols).toBe(true)
      }
    }
  })

  it('gives different roots to the stages of a journey when there are enough of them', () => {
    for (const lang of WR_LANGS) {
      const cfg: WrConfig = { lang, level: 'family', players: 3, stages: 7, seed: 12345 }
      const stages = buildStages(cfg)
      expect(new Set(stages.map((s) => s.root)).size).toBe(7)
      for (const s of stages) expect(validatePuzzle(s)).toEqual([])
    }
  })

  it('makes the puzzles of a journey the same for the same seed', () => {
    const a = buildStages({ lang: 'en', level: 'kids', players: 2, stages: 5, seed: 9 })
    const b = buildStages({ lang: 'en', level: 'kids', players: 4, stages: 5, seed: 9 })
    expect(a.map((p) => p.root)).toEqual(b.map((p) => p.root))
  })
})

describe('a typed word', () => {
  const p = makePuzzle('de', 'family', 1)
  const word = p.words[0]!.key

  it('is a word of the grid, a bonus word, one that was found already, or nothing', () => {
    const pr = emptyProgress()
    expect(judge(p, pr, word)).toBe('grid')
    expect(judge(p, pr, word.toLowerCase())).toBe('grid')
    expect(judge(p, pr, 'XYZQ')).toBe('no')
    expect(judge(p, pr, 'AB')).toBe('no')
    if (p.bonus.length) expect(judge(p, pr, p.bonus[0]!)).toBe('bonus')
    pr.found.push(word)
    expect(judge(p, pr, word)).toBe('again')
    if (p.bonus.length) {
      pr.bonusFound.push(p.bonus[0]!)
      expect(judge(p, pr, p.bonus[0]!)).toBe('again')
    }
  })

  it('gives more points for a longer word', () => {
    expect(wordPoints(3)).toBeLessThan(wordPoints(4))
    expect(wordPoints(6)).toBeLessThan(wordPoints(7))
    expect(bonusPoints(3)).toBeLessThanOrEqual(bonusPoints(6))
  })

  it('counts a word as done when all its squares are filled by the words that cross it', () => {
    const q = makePuzzle('en', 'pro', 4)
    const pr = emptyProgress()
    // fill everything but the first word by typing; the squares of the first word that cross are filled, the others are not
    for (const w of q.words.slice(1)) pr.found.push(w.key)
    const f = filledCells(q, pr)
    const first = cellsOf(q.words[0]!)
    const allFilled = first.every(([r, c]) => f.has(`${r},${c}`))
    expect(puzzleDone(q, pr)).toBe(allFilled)
  })
})

describe('a game', () => {
  const cfg: WrConfig = { lang: 'de', level: 'kids', players: 3, stages: 3, seed: 77 }
  const stageWords = (g: WrGame) => puzzleOf(g).words.map((w) => w.key)

  it('starts with nothing: no points, the first person, one help for every stage', () => {
    const g = newGame(cfg)
    expect(g.scores).toEqual([0, 0, 0])
    expect(g.turn).toBe(0)
    expect(g.hints).toBe(3)
    expect(g.stage).toBe(0)
    expect(g.over).toBe(false)
  })

  it('a word of the grid gives its points and ends the turn; a wrong word changes nothing', () => {
    let g = newGame(cfg)
    const wrong = submit(g, 'QQQ')
    expect(wrong.result).toBe('no')
    expect(wrong.game).toBe(g)
    const key = stageWords(g)[0]!
    const move = submit(g, key)
    expect(move.result).toBe('grid')
    expect(move.endsTurn).toBe(true)
    expect(move.points).toBeGreaterThanOrEqual(wordPoints(key.length))
    g = move.game
    expect(g.scores[0]).toBe(move.points)
    expect(g.words[0]).toBe(1)
    expect(submit(g, key).result).toBe('again')
    expect(endTurn(g).turn).toBe(1)
    expect(endTurn(endTurn(endTurn(g))).turn).toBe(0)
  })

  it('a bonus word gives a point or two and does not end the turn', () => {
    const g = newGame(cfg)
    const b = puzzleOf(g).bonus[0]
    if (!b) return
    const move = submit(g, b)
    expect(move.result).toBe('bonus')
    expect(move.endsTurn).toBe(false)
    expect(move.points).toBe(bonusPoints(b.length))
    expect(move.game.bonusWords[0]).toBe(1)
    expect(submit(move.game, b).result).toBe('again')
  })

  it('the person who fills the last square gets the bonus of the stage, and the next stage opens', () => {
    let g = newGame(cfg)
    const keys = stageWords(g)
    let last = null as null | ReturnType<typeof submit>
    for (const [i, key] of keys.entries()) {
      last = submit(g, key)
      g = last.game
      if (i < keys.length - 1) {
        expect(last.stageDone).toBe(false)
        g = endTurn(g)
      }
    }
    expect(last?.stageDone).toBe(true)
    expect(g.stageWinners).toEqual([g.turn])
    const total = g.scores.reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThan(keys.reduce((a, k) => a + wordPoints(k.length), 0) - 1)
    g = nextStage(g)
    expect(g.stage).toBe(1)
    expect(g.progress.found).toEqual([])
    expect(g.over).toBe(false)
  })

  it('plays a whole journey with the right words and ends after the last stage', () => {
    let g = newGame({ ...cfg, players: 2 })
    for (let s = 0; s < 3; s++) {
      for (const key of stageWords(g)) {
        const m = submit(g, key)
        g = m.result === 'grid' ? endTurn(m.game) : m.game
      }
      expect(puzzleDone(puzzleOf(g), g.progress)).toBe(true)
      g = nextStage(g)
    }
    expect(g.over).toBe(true)
    expect(g.stageWinners).toHaveLength(3)
  })

  it('shows a letter from the shared helps, and no more when they are used up', () => {
    let g = newGame(cfg)
    const m = showLetter(g)
    expect(m.cell).not.toBeNull()
    expect(m.game.hints).toBe(2)
    expect(m.game.progress.shown).toHaveLength(1)
    g = m.game
    g = showLetter(showLetter(g).game).game
    expect(g.hints).toBe(0)
    expect(showLetter(g).cell).toBeNull()
    expect(showLetter(g).game).toBe(g)
  })

  it('shows a letter for free when everybody has passed one after the other', () => {
    let g = newGame(cfg)
    const a = pass(g)
    expect(a.freeLetter).toBe(false)
    g = endTurn(a.game)
    g = endTurn(pass(g).game)
    const c = pass(g)
    expect(c.freeLetter).toBe(true)
    expect(c.game.progress.shown).toHaveLength(1)
    expect(c.game.hints).toBe(cfg.stages)
    expect(c.game.passes).toBe(0)
  })

  it('a person who plays alone has to pass three times for a letter that is shown for free', () => {
    expect(passesForFreeLetter(1)).toBe(3)
    expect(passesForFreeLetter(4)).toBe(4)
    let g = newGame({ ...cfg, players: 1 })
    g = endTurn(pass(g).game)
    expect(g.progress.shown).toHaveLength(0)
    g = endTurn(pass(g).game)
    expect(g.progress.shown).toHaveLength(0)
    const third = pass(g)
    expect(third.freeLetter).toBe(true)
    expect(third.game.progress.shown).toHaveLength(1)
  })

  it('a found word makes the passes start again', () => {
    let g = newGame(cfg)
    g = endTurn(pass(g).game)
    expect(g.passes).toBe(1)
    g = submit(g, stageWords(g)[0]!).game
    expect(g.passes).toBe(0)
  })

  it('picks a square that is still empty, and none when the grid is full', () => {
    const p = makePuzzle('es', 'kids', 2)
    const pr = emptyProgress()
    const cell = pickHint(p, pr)!
    expect(gridLetters(p).has(`${cell[0]},${cell[1]}`)).toBe(true)
    for (const w of p.words) pr.found.push(w.key)
    expect(pickHint(p, pr)).toBeNull()
  })

  it('mixes the circle into another order', () => {
    const c = ['A', 'B', 'C', 'D', 'E']
    for (let i = 0; i < 20; i++) {
      const m = mixCircle(c, rng(i))
      expect([...m].sort()).toEqual([...c].sort())
      expect(m.join('')).not.toBe(c.join(''))
    }
  })

  it('the routes of the journey use places that exist', () => {
    for (const [n, list] of Object.entries(WR_ROUTES)) {
      expect(list).toHaveLength(Number(n))
      expect([...list].sort((a, b) => a - b)).toEqual(list)
      expect(list.every((i) => i >= 0 && i < 7)).toBe(true)
    }
  })

  it('keeps a game as plain data and takes it up again; refuses what does not fit', () => {
    let g = newGame(cfg)
    g = submit(g, stageWords(g)[0]!).game
    g = endTurn(g)
    const again = parseGame(JSON.parse(JSON.stringify(g)))
    expect(again).toEqual(g)
    expect(parseGame(null)).toBeNull()
    expect(parseGame({})).toBeNull()
    expect(parseGame({ ...g, cfg: { ...g.cfg, players: 9 } })).toBeNull()
    expect(parseGame({ ...g, scores: [1] })).toBeNull()
    expect(parseGame({ ...g, stage: 8 })).toBeNull()
    expect(parseGame({ ...g, progress: { ...g.progress, found: ['NOPE'] } })).toBeNull()
    expect(parseGame({ ...g, cfg: { ...g.cfg, lang: 'fr' } })).toBeNull()
  })

  it.each(['de', 'en', 'es'] as WrLang[])('every language can be played through with 2 to 6 people (%s)', (lang) => {
    for (const players of [2, 6]) {
      let g = newGame({ lang, level: 'family', players, stages: 3, seed: 5 })
      for (let s = 0; s < 3; s++) {
        for (const key of puzzleOf(g).words.map((w) => w.key)) {
          const m = submit(g, key)
          g = m.result === 'grid' ? endTurn(m.game) : m.game
        }
        g = nextStage(g)
      }
      expect(g.over).toBe(true)
      expect(g.scores.reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
    }
  })
})
