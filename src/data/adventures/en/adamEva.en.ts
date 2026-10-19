/**
 * English texts of the adventure "Adam and Eve" (8 to 10 years): the same shape as `../adamEva.ts`, only the words. Laid over the German data
 * by `localize()`. SCAFFOLD: titles and Bible passages only; the stories, questions, hints and recordings come with the integration (the source
 * as a readable file: D:/Claude/Abenteuer-Adam-Eva/ENGLISCH/). Wording follows the public-domain translations (KJV, World English Bible).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const adamEvaEn: TextOverlay<Journey> = {
  title: 'Adam and Eve',
  subtitle: 'The Garden of Eden',
  gift: { title: 'Adam and Eve in the Garden' },
  stages: [
    { title: 'In the Beginning', ref: 'Genesis 1:1–13' },
    { title: 'Sun, Moon and Stars', ref: 'Genesis 1:14–23' },
    { title: 'Animals and People', ref: 'Genesis 1:24–2:3' },
    { title: 'The Garden of Eden', ref: 'Genesis 2:4–17' },
    { title: 'Adam Names the Animals', ref: 'Genesis 2:18–20' },
    { title: 'Eve', ref: 'Genesis 2:21–25' },
    { title: 'The Serpent', ref: 'Genesis 3:1–7' },
    { title: 'Where Are You?', ref: 'Genesis 3:8–21' },
    { title: 'The Way Out of the Garden', ref: 'Genesis 3:22–24' }
  ]
}
