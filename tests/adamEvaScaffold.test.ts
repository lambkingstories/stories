/**
 * The scaffold of the adventure "Adam und Eva" (id adam-eva, 9 stages): until the texts, games and pictures are integrated its stages are "soon".
 * The test keeps the plan (`D:/Claude/Abenteuer-Adam-Eva/ETAPPENPLAN.md`) and the English file in step and makes sure the scaffold cannot be played
 * or downloaded by mistake.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { adamEva } from '@/data/adventures/adamEva'
import { adamEvaEn } from '@/data/adventures/en/adamEva.en'
import { ADAM_EVA_PATH } from '@/data/adventures/adamEvaPath'
import { adventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { journeyFiles } from '@/utils/journeyFiles'

afterEach(() => {
  adventureLanguage.value = 'de'
})

const PLAN: [string, string][] = [
  ['Am Anfang', '1. Mose 1,1–13'],
  ['Sonne, Mond und Sterne', '1. Mose 1,14–23'],
  ['Tiere und Menschen', '1. Mose 1,24–2,3'],
  ['Der Garten Eden', '1. Mose 2,4–17'],
  ['Adam gibt den Tieren Namen', '1. Mose 2,18–20'],
  ['Eva', '1. Mose 2,21–25'],
  ['Die Schlange', '1. Mose 3,1–7'],
  ['Wo bist du?', '1. Mose 3,8–21'],
  ['Der Weg aus dem Garten', '1. Mose 3,22–24; 4,1']
]

describe('Adam und Eva: the scaffold', () => {
  it('has the id, nine stages in the order of 1. Mose 1 to 3 (titles and passages of the plan) and the right age group', () => {
    expect(adamEva.id).toBe('adam-eva')
    expect(adamEva.age).toBe('8-10')
    expect(adamEva.subtitle).toBe('Der Garten Eden')
    expect(adamEva.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(adamEva.stages.map((s) => [s.title, s.ref])).toEqual(PLAN)
  })

  it('all stages are still "soon": none can be opened, no game or recording is downloaded; there is no map and no way yet', () => {
    for (const s of adamEva.stages) expect(s.soon, `stage ${s.id}`).toBe(true)
    for (let i = 0; i < adamEva.stages.length; i++) expect(isStageOpen(adamEva, undefined, i), `stage ${i + 1}`).toBe(false)
    expect(adamEva.map.images).toEqual([])
    expect(ADAM_EVA_PATH).toEqual([])
    expect(adamEva.exam).toHaveLength(6)
    // the files of the journey: the medal and the gift in the folder that the normal build removes (and the shared ring and sounds)
    const files = journeyFiles(adamEva)
    const own = files.filter((f) => f.includes('adam-eva/'))
    // the medal and the gift, and the pictures of the stages (they stand on the map even while a stage is not ready); no picture of a game yet
    expect(own).toEqual([...Array.from({ length: 9 }, (_, i) => `images/abenteuer/adam-eva/etappe-bild-${String(i + 1).padStart(2, '0')}.webp`), 'images/abenteuer/adam-eva/medaille.webp', 'images/abenteuer/adam-eva/geschenk.webp'].sort((a, b) => own.indexOf(a) - own.indexOf(b)))
    // everything else is shared with the other journeys and the app itself: the screens, the ring, the sounds and the general music pieces
    const shared = /^(images\/abenteuer\/ui\/|audio\/abenteuer\/(klang|musik)-|images\/abenteuer\/josef\/medaillon-ring)/
    expect(files.filter((f) => !own.includes(f) && !shared.test(f))).toEqual([])
  })

  it('the English file has the same number of stages in the same order and shows when the app is English; German stays the default', () => {
    const en = adamEvaEn.stages!
    expect(en).toHaveLength(adamEva.stages.length)
    expect(en.map((s) => s.ref)).toEqual([
      'Genesis 1:1–13', 'Genesis 1:14–23', 'Genesis 1:24–2:3', 'Genesis 2:4–17', 'Genesis 2:18–20', 'Genesis 2:21–25', 'Genesis 3:1–7', 'Genesis 3:8–21', 'Genesis 3:22–24; 4:1'
    ])
    expect(adamEva.title).toBe('Adam und Eva')
    adventureLanguage.value = 'en'
    expect(adamEva.title).toBe('Adam and Eve')
    expect(adamEva.subtitle).toBe('The Garden of Eden')
    expect(adamEva.stages[0]!.title).toBe('In the Beginning')
    expect(adamEva.stages[8]!.ref).toBe('Genesis 3:22–24; 4:1')
    expect(adamEva.gift.title).toBe('Adam and Eve in the Garden with the Animals')
  })
})
