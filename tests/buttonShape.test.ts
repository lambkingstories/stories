/**
 * The shape of the buttons (Anton, 19.10.2026): in the adventures (Josef and Noah) and in all games the main buttons ("Weiter", "Fertig", "Zurück zur Karte",
 * "Neu spielen", the present ...) are always the same full capsule (pill), never a box with small corners. They all come from one place: the class
 * `lk-btn` (`theme.css`), used directly or through `AdvButton`. This test reads the sources, since the styles are not drawn in the test window.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '..', 'src')
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8').split(String.fromCharCode(13)).join('')
const vueIn = (dir: string) => readdirSync(join(SRC, dir)).filter((f) => f.endsWith('.vue')).map((f) => `${dir}/${f}`)
const FILES = [
  ...vueIn('views/app').filter((f) => /AppAdventure|AppColoringView/.test(f)),
  ...vueIn('components/molecules/games'),
  ...vueIn('components/molecules').filter((f) => /Adventure(Quiz|Count|Overview|Stars)\.vue$/.test(f))
]

describe('buttons of the adventures: always the capsule', () => {
  it('the one button style (`.lk-btn`) is a full capsule, whatever the length of the text', () => {
    const css = read('assets/css/theme.css')
    const block = css.slice(css.indexOf('.lk-btn {'), css.indexOf('}', css.indexOf('.lk-btn {')))
    expect(block).toMatch(/border-radius:\s*999px/)
    expect(block).not.toMatch(/var\(--lk-r-btn\)/)
  })

  it('AdvButton is the capsule class and brings no radius of its own', () => {
    const adv = read('components/atoms/AdvButton.vue')
    expect(adv).toMatch(/class="adv-btn lk-btn"/)
    expect(adv).not.toMatch(/border-radius/)
  })

  it('every main button of the adventure screens and games is an AdvButton or an `lk-btn` (no own button with an own shape)', () => {
    const MAIN = /t\('app\.(adventure\.(next|finish|toQuestions|toTask|retry|backToMap|backToJourneys|toExam|continue|gift|paint|paintOn|shareFinish|statsAgain|beginJourney|continueJourney|back)|coloring\.doneShort)'/
    const offenders: string[] = []
    for (const f of FILES) {
      read(f)
        .split('\n')
        .forEach((line, i) => {
          if (!MAIN.test(line) || !/^\s*(button|AdvButton)\(/.test(line)) return
          if (!/AdvButton\(|lk-btn/.test(line)) offenders.push(`${f}:${i + 1}: ${line.trim().slice(0, 90)}`)
        })
    }
    expect(offenders).toEqual([])
  })

  it('no button class for a main action has a corner smaller than the capsule', () => {
    const offenders: string[] = []
    // the classes of the "go on / done / again / skip" buttons that are not AdvButtons: their style must be the capsule, too
    const OWN = /^\.(stage-skip|spot-go|stats-again|stats-back|stage-back|map-back|bd-zoom|sh-finish)(?![\w-])/
    for (const f of FILES) {
      const src = read(f)
      const style = src.slice(src.indexOf('<style'))
      for (const m of style.matchAll(/\n(\.[\w-]+[^\n]*)\n((?:[ ]{2}[^\n]*\n)+)/g)) {
        if (!OWN.test(m[1]!)) continue
        const r = /border-radius:\s*([^\n]+)/.exec(m[2]!)
        if (r && !/999px|50%/.test(r[1]!)) offenders.push(`${f}: ${m[1]} -> ${r[1]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the lines of the map header, the stage and the statistics sit on one centre line (flex rows centre their items)', () => {
    const map = read('views/app/AppAdventureView.vue')
    const top = /\.map-top\n((?:  [^\n]*\n)+)/.exec(map)![1]!
    expect(top).toMatch(/align-items:\s*center/)
    // the pills do not push themselves out of the line with their own top margin
    expect(/\.map-points\n((?:  [^\n]*\n)+)/.exec(map)![1]!).not.toMatch(/margin:\s*[1-9]/)
    expect(read('components/molecules/SoundPanel.vue')).toMatch(/\.sp\n(?:  [^\n]*\n)*?  display:\s*inline-flex/)
    for (const [f, sel] of [['views/app/AppAdventureStatsView.vue', '.stats-top'], ['views/app/AppAdventureStageView.vue', '.stage-top']] as const) {
      const m = new RegExp(`\\n\\${sel}\\n((?:  [^\\n]*\\n)+)`).exec(read(f))
      expect(m, `${f} ${sel}`).toBeTruthy()
      expect(m![1], `${f} ${sel}`).toMatch(/align-items:\s*center/)
    }
  })
})
