// Exports the English texts of the adventures as readable Markdown (for Anton) and as JSON (for the recordings, `tts-gemini-en.py`).
// Run: node_modules/.bin/tsx scripts/export-english-texts.ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { josefEn } from '../src/data/adventures/en/josef.en'
import { noahEn } from '../src/data/adventures/en/noah.en'

const OUT_SCRATCH = 'D:/Claude/Abenteuer-Noah/ENGLISCH/'

function walkTexts(v: any, label: string, out: string[]) {
  if (!v || typeof v !== 'object') return
  if (Array.isArray(v)) return v.forEach((x, i) => walkTexts(x, label, out))
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'string' && k === 'hint') out.push(`- ${label}hint: ${x}`)
    else if (typeof x === 'string' && k === 'text') out.push(`- ${label}sentence: ${x}`)
    else if (typeof x === 'string' && k === 'label') out.push(`- ${label}label: ${x}`)
    else if (typeof x === 'string' && k === 'doneText') out.push(`- ${label}end line: ${x}`)
    else if (typeof x === 'string' && k === 'question') out.push(`- ${label}question after counting: ${x}`)
    else if (k === 'labels' && Array.isArray(x)) out.push(`- ${label}labels: ${x.join(', ')}`)
    else if (k === 'rejects' && x && typeof x === 'object') for (const [r, s] of Object.entries(x as any)) out.push(`- ${label}wrong food (${r}): ${s}`)
    else walkTexts(x, label, out)
  }
}

function markdown(en: any, id: string, heading: string): string {
  const lines: string[] = []
  lines.push(`# ${heading} – English texts (${en.title})`, '')
  lines.push(`Adventure for 8 to 10 years. Subtitle: ${en.subtitle}. Gift (coloring page): ${en.gift.title}.`)
  lines.push('Bible: World English Bible (public domain) for names and wording; the stories are retold in our own words. ✔ marks the right answer (it is always the first option in the data).', '')
  for (const [i, s] of en.stages.entries()) {
    lines.push(`## Stage ${i + 1}: ${s.title}`, `*${s.ref}*`, '')
    for (const p of s.text) lines.push(p, '')
    const extra: string[] = []
    walkTexts(s.task, '', extra)
    lines.push(`**Task:** ${s.task?.hint ?? ''}`)
    for (const e of extra.filter((x) => !x.startsWith('- hint: ') || false)) lines.push(e)
    lines.push('', '**Questions:**')
    s.questions.forEach((q: any, k: number) => lines.push(`${k + 1}. ${q.q} *(${q.options.map((o: string, j: number) => (j === 0 ? `${o} ✔` : o)).join(' / ')})*`))
    lines.push('', `Recording: \`${s.audio}\``, '')
  }
  lines.push('## Final quiz (6 questions)')
  en.exam.forEach((q: any, k: number) => lines.push(`${k + 1}. ${q.q} *(${q.options.map((o: string, j: number) => (j === 0 ? `${o} ✔` : o)).join(' / ')})*`))
  lines.push('')
  return lines.join('\n')
}

mkdirSync('D:/Claude/Abenteuer-Noah/ENGLISCH/Josef', { recursive: true })
writeFileSync('D:/Claude/Abenteuer-Noah/ENGLISCH/Josef/Josef_English_Texte.md', markdown(josefEn, 'josef', 'Joseph'))
writeFileSync('D:/Claude/Abenteuer-Noah/ENGLISCH/Noah_English_Texte.md', markdown(noahEn, 'noah', 'Noah'))
const stories = (en: any) => en.stages.map((s: any, i: number) => ({ n: i + 1, text: s.text, audio: s.audio }))
writeFileSync(OUT_SCRATCH + 'stories-josef-en.json', JSON.stringify(stories(josefEn), null, 1))
writeFileSync(OUT_SCRATCH + 'stories-noah-en.json', JSON.stringify(stories(noahEn), null, 1))
console.log('ok')
