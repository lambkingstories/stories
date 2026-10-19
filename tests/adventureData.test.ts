/**
 * Prüft JEDES Abenteuer in `journeys` auf die Regeln des LambKing-Abenteuer-Skills (Daten, Bilder, Töne, Fragen, Karte).
 * Ein neues Abenteuer wird nur dann angenommen, wenn dieser Test für es grün ist.
 */
import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { noah } from '@/data/adventures/noah'
import { journeyFiles } from '@/utils/journeyFiles'
import type { AdventureQuestion } from '@/types/adventure'

const KINDS = ['quiz', 'zaehlen', 'ausmalen', 'puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'teilen', 'paare', 'bauen', 'punkte', 'steuern']

describe.each([...journeys, noah].map((j) => [j.id, j] as const))('Abenteuer %s', (_id, j) => {
  const questionsOf = (qs: AdventureQuestion[]) => qs.map((q) => q.q)

  it('hat Kopfdaten und eine zusammenhängende Nummerierung der Etappen', () => {
    expect(j.id).toMatch(/^[a-z0-9-]+$/)
    expect(j.title.length).toBeGreaterThan(1)
    expect(j.age).toBe('8-10')
    expect(j.stages.map((s) => s.id)).toEqual(j.stages.map((_, i) => i + 1))
    expect(j.stages.length).toBeGreaterThanOrEqual(6)
    expect(j.stages.length).toBeLessThanOrEqual(15)
    expect(j.stages.length % 3, 'Etappenzahl in Dreierschritten (3 Etappen je Kachel)').toBe(0)
    expect(j.downloadMb).toBeGreaterThan(0)
  })

  it('jede Etappe hat Titel, Bibelstelle, 1–5 Absätze Text, eine gültige Aufgabe und 1–3 Fragen', () => {
    for (const s of j.stages) {
      expect(s.title.trim().length, `Titel ${s.id}`).toBeGreaterThan(2)
      expect(s.ref.trim().length, `Bibelstelle ${s.id}`).toBeGreaterThan(3)
      expect(s.text.length, `Absätze ${s.id}`).toBeGreaterThanOrEqual(1)
      expect(s.text.length, `Absätze ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `Textlänge Etappe ${s.id}`).toBeGreaterThan(40)
      expect(words, `Textlänge Etappe ${s.id}`).toBeLessThan(330)
      expect(KINDS, `Aufgabe ${s.id}`).toContain(s.task.kind)
      expect(s.task.hint?.length ?? 0, `Hinweis ${s.id}`).toBeGreaterThan(8)
      expect(s.questions.length, `Fragen ${s.id}`).toBeGreaterThanOrEqual(1)
      expect(s.questions.length, `Fragen ${s.id}`).toBeLessThanOrEqual(3)
    }
  })

  it('die Fragen sind gültig, die richtige Antwort steht zuerst, und keine Frage kommt zweimal vor', () => {
    const all = [...j.stages.flatMap((s) => s.questions), ...j.exam]
    for (const q of all) {
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(q.options.length)
      expect(/[?？]['“”"]?$/.test(q.q.trim()), q.q).toBe(true)
    }
    // das Abschlussquiz darf Fragen der Etappen wiederholen (Wiederholung ist gewollt), die Etappen untereinander nicht
    const qs = questionsOf(j.stages.flatMap((s) => s.questions))
    expect(new Set(qs).size, 'doppelte Frage in den Etappen').toBe(qs.length)
    expect(new Set(questionsOf(j.exam)).size, 'doppelte Frage im Abschlussquiz').toBe(j.exam.length)
    expect(j.exam.length).toBeGreaterThanOrEqual(5)
  })

  it('Fragen fragen nach dem Text: jede richtige Antwort kommt (dem Sinn nach) im Text der Etappe vor – Stichprobe auf Zahlwörter und Namen', () => {
    // Die Regel „nur Fragen zu dem, was im Text steht“ prüft ein Mensch (Gegenlesen). Hier nur die grobe Kontrolle: ein Zahlwort in einer
    // Antwort muss auch im Text derselben Etappe stehen.
    const NUM = /\b(zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|hundert)\b/i
    for (const s of j.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const m = q.options[0]!.match(NUM)
        if (m) expect(text, `Etappe ${s.id}: „${q.options[0]}“ steht nicht im Text`).toContain(m[1]!.toLowerCase())
      }
    }
  })

  it('die Bibelstellen sind reiner Kindertext: Buch, Kapitel, Verse, keine Klammern und keine internen Notizen', () => {
    for (const s of j.stages) {
      expect(s.ref, `Etappe ${s.id}`).toMatch(/^[1-5]\. Mose \d+(?:[,.\-–;]\s?\d+)*$/)
      expect(s.ref, `Etappe ${s.id}`).not.toMatch(/[()]|gekürzt|Verseinhalt|gelesen|Entwurf|prüfen/i)
    }
  })

  it('jede Aufgabe hat die Daten ihres Spiels', () => {
    for (const s of j.stages) {
      const t = s.task
      if (t.kind === 'puzzle') expect(t.puzzle, `Puzzle ${s.id}`).toBeTruthy()
      if (t.kind === 'weg') expect(t.way?.scenes.length, `Weg ${s.id}`).toBeGreaterThanOrEqual(2)
      if (t.kind === 'ernten') expect(t.harvest?.count, `Ernten ${s.id}`).toBeGreaterThan(5)
      if (t.kind === 'memory') expect(t.memory?.pairs.length, `Memory ${s.id}`).toBeGreaterThanOrEqual(4)
      if (t.kind === 'sortieren') expect(t.sort?.bins.length, `Sortieren ${s.id}`).toBeGreaterThanOrEqual(2)
      if (t.kind === 'wimmelbild') expect(t.find?.finds.length, `Wimmelbild ${s.id}`).toBe(t.count)
      if (t.kind === 'ausmalen') expect(t.image, `Ausmalen ${s.id}`).toBeTruthy()
      // Anton (18.10.2026): kein Spiel hat mehr als zwei Runden
      if (t.kind === 'teilen') expect(t.share?.rounds.length, `Teilen ${s.id}`).toBe(2)
      // die Arche hat zwei Runden (Teile, Pech), der Altar nur eine (Anton, 18.10.2026)
      if (t.kind === 'bauen') expect(t.build?.rounds.length, `Bauen ${s.id}`).toBe(t.build?.rotate ? 1 : 2)
      if (t.kind === 'punkte') expect(t.dots?.points.length, `Punkte ${s.id}`).toBeGreaterThanOrEqual(12)
      if (t.kind === 'steuern') expect(t.fly?.rounds.length, `Steuern ${s.id}`).toBe(2)
      if (t.kind === 'zaehlen') expect((t.groups ?? []).reduce((n, g) => n + g.count, t.groups ? 0 : t.count ?? 0), `Zählen ${s.id}`).toBe(t.count)
    }
  })

  it('die Karte passt zu den Etappen: ein Bild, Medaillons, Perlenweg', () => {
    const m = j.map
    expect(m.stages).toHaveLength(j.stages.length)
    expect(m.path).toHaveLength(j.stages.length)
    for (const sp of [...m.stages, m.exam]) {
      expect(sp.x).toBeGreaterThan(0)
      expect(sp.x).toBeLessThan(1)
      expect(sp.y).toBeGreaterThan(0)
      expect(sp.y).toBeLessThan(1)
      expect(sp.d).toBeGreaterThan(0.02)
      expect(sp.d).toBeLessThan(0.08)
    }
    // die Etappen liegen nicht in einer Reihe, aber ihre Reihenfolge führt insgesamt von links nach rechts
    const xs = [...m.stages, m.exam].map((sp) => sp.x)
    expect(xs[xs.length - 1]).toBeGreaterThan(xs[0]!)
  })

  it('alle Bilder und Töne gibt es, und das Paket ist nicht zu groß', () => {
    const files = journeyFiles(j)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
    const mb = files.reduce((n, f) => n + statSync(`public/${f}`).size, 0) / 1024 / 1024
    expect(mb, 'Paketgröße in MB (Ziel ≤ 18, mit Vorlese-Stimme und großer Karte)').toBeLessThanOrEqual(18)
    for (const f of files.filter((x) => /\.webp$/.test(x))) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(f.includes('karte-pano') ? 1800 : 620)
  })
})


/**
 * Noah ist noch nicht öffentlich (nicht in `journeys`), seine drei neuen Spiele (Etappen 2, 3, 4) werden hier schon geprüft:
 * Arche bauen, Teilen/Verteilen, Tier-Memory (die Tierpaare sind entfernt).
 */
describe('Noah: die Spiele der Etappen 2, 3 und 4', () => {
  const stage = (id: number) => noah.stages.find((s) => s.id === id)!
  const build = stage(2).task.build!
  const share = stage(3).task.share!

  it('Etappen 2–4 haben Text, Bibelstelle, die richtige Aufgabenart und gültige Fragen', () => {
    expect([2, 3, 4].map((id) => stage(id).task.kind)).toEqual(['bauen', 'teilen', 'memory'])
    for (const id of [2, 3, 4]) {
      const s = stage(id)
      expect(s.ref).toMatch(/Mose/)
      expect(s.text.join(' ').split(/\s+/).length, `Textlänge ${id}`).toBeGreaterThan(40)
      expect(s.task.hint!.length).toBeGreaterThan(8)
      expect(s.questions).toHaveLength(2)
      for (const q of s.questions) {
        expect(q.answer).toBe(0)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(/[?]$/.test(q.q)).toBe(true)
      }
    }
    // Etappe 4 ist ein Memory; der Hinweis sagt kindgerecht, dass die Tierarten nur Beispiele sind (die Bibel nennt keine Arten)
    expect(stage(4).task.hint).toBe('Finde Männchen und Weibchen. Du siehst nur einige Tierarten als Beispiel.')
    expect(stage(4).task.pairs).toBeUndefined()
  })

  it('Arche bauen: sechs Teile in freier Reihenfolge, zwei Runden (Umriss, Pech), drei Fugen zum Nachfahren', () => {
    expect(build.ordered).toBe(false)
    expect(build.rotate).toBe(false)
    expect(build.pieces.map((p) => p.id)).toEqual(['oben', 'mitte', 'unten', 'tuer', 'fenster', 'rampe'])
    expect(new Set(build.pieces.map((p) => p.id)).size).toBe(build.pieces.length)
    for (const p of build.pieces) {
      expect(p.x, p.id).toBeGreaterThanOrEqual(0)
      expect(p.y, p.id).toBeGreaterThanOrEqual(0)
      expect(p.x + p.w, p.id).toBeLessThanOrEqual(100.01)
      expect(p.y + p.h, p.id).toBeLessThanOrEqual(100.01)
      expect(p.label.length).toBeGreaterThan(3)
    }
    expect(build.rounds.map((r) => [!!r.outline, !!r.pitch])).toEqual([[true, false], [false, true]])
    // Pech schmieren: drei Fugen von links nach rechts (gerade, geschwungen, Zickzack), weit genug auseinander
    const seams = build.pitch!.seams.map((sm) => sm.points)
    expect(seams).toHaveLength(3)
    for (const pts of seams) {
      for (const [x, y] of pts) {
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(100)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(100)
      }
      for (let i = 1; i < pts.length; i++) expect(pts[i]![0], 'von links nach rechts').toBeGreaterThan(pts[i - 1]![0])
      expect(pts[pts.length - 1]![0] - pts[0]![0], 'lang genug').toBeGreaterThan(60)
    }
    const turns = (pts: number[][]) => {
      let n = 0
      for (let i = 2; i < pts.length; i++) if (Math.sign(pts[i]![1] - pts[i - 1]![1]) * Math.sign(pts[i - 1]![1] - pts[i - 2]![1]) < 0) n++
      return n
    }
    const [straight, curved, zigzag] = seams as [number[][], number[][], number[][]]
    expect(new Set(straight.map((q) => q[1])).size, 'gerade').toBe(1)
    expect(curved.length, 'geschwungen').toBeGreaterThanOrEqual(10)
    expect(turns(curved), 'geschwungen: sanfte Wellen').toBeGreaterThanOrEqual(1)
    expect(turns(curved), 'geschwungen: keine Zacken').toBeLessThanOrEqual(3)
    expect(turns(zigzag), 'Zickzack').toBeGreaterThanOrEqual(4)
    // zwischen zwei Fugen genug Holz: der Abstand (in Prozent der Höhe) ist größer als die Toleranz
    const tol = (build.pitch!.tolerance ?? 5.5) * (900 / 1200)
    const mid = (pts: number[][]) => pts.reduce((a2, q) => a2 + q[1]!, 0) / pts.length
    expect(mid(curved) - mid(straight)).toBeGreaterThan(tol * 3)
    expect(mid(zigzag) - mid(curved)).toBeGreaterThan(tol * 3)
  })

  it('Teilen: zwei Runden ohne Zahlen; die Familie bekommt verschiedene Früchte, jedes Tier sein Futter; in Runde 2 mehr Tiere und keiner geht leer aus', () => {
    expect(share.rounds).toHaveLength(2)
    const kinds = new Set(share.baskets.map((b) => b.id))
    const nobody = share.baskets.filter((b) => b.nobody).map((b) => b.id)
    const food = share.baskets.filter((b) => !b.nobody).map((b) => b.id)
    const byId = (id: string) => share.receivers.find((r) => r.id === id)!
    for (const r of share.rounds) {
      for (const k of r.baskets) expect(kinds.has(k), k).toBe(true)
      expect(r.hint.length).toBeGreaterThan(8)
      // keine Zielkörbe und keine Zahlen (Anton, 18.10.2026)
      expect(r.marks, 'Marken zeigen Zahlen').toBeUndefined()
      expect(r.checkContent).toBe(true)
      for (const id of r.receivers ?? []) expect(byId(id), id).toBeTruthy()
    }
    const [r1, r2] = share.rounds as [(typeof share.rounds)[number], (typeof share.rounds)[number]]
    expect(r1.free).toBeFalsy()
    expect(r2.free).toBe(true)
    // Menschen: Früchte in vier Sorten (kein Brot); Taube: Körner; Kamel, Schaf, Ziege, Esel: Heu; kein Essen gehört zu zwei Gruppen
    const takers = (k: string) => share.receivers.filter((x) => x.accepts.includes(k)).map((x) => x.id)
    expect(food.sort()).toEqual(['dattel', 'feige', 'granat', 'heu', 'korn', 'olive', 'traube'])
    expect(byId('familie').accepts.sort()).toEqual(['dattel', 'feige', 'granat', 'olive', 'traube'])
    expect(byId('taube').accepts).toEqual(['korn'])
    for (const id of ['kamel', 'schaf', 'ziege', 'esel']) expect(byId(id).accepts, id).toEqual(['heu'])
    for (const k of food) expect(takers(k).length, k).toBeGreaterThan(0)
    for (const k of ['feige', 'dattel', 'traube', 'granat', 'olive', 'korn']) expect(takers(k).length, `${k} gehört zu mehreren Gruppen`).toBe(1)
    expect(takers('heu').sort()).toEqual(['esel', 'kamel', 'schaf', 'ziege'])
    // die Früchte sehen verschieden aus
    expect(new Set(byId('familie').accepts.map((k) => share.baskets.find((b) => b.id === k)!.image)).size).toBe(5)
    // die Früchte sind Körbe im Stil von Heu und Futtersack
    for (const k of byId('familie').accepts) expect(share.baskets.find((b) => b.id === k)!.image, k).toMatch(/teilen\/korb-/)
    // Ablenker (leerer Krug, Holzhammer): für niemanden, und in jeder Runde dabei
    expect(nobody.length).toBeGreaterThanOrEqual(2)
    for (const k of nobody) expect(takers(k), k).toEqual([])
    for (const r of [r1, r2]) expect(r.baskets.some((k) => nobody.includes(k)), r.hint).toBe(true)
    // Runde 1: Familie und drei Tiere; Runde 2: mehr Tiere, und das Essen reicht für jeden
    expect(r1.receivers).toEqual(['familie', 'taube', 'kamel', 'schaf'])
    expect(r2.receivers!.length).toBeGreaterThan(r1.receivers!.length)
    for (const id of r1.receivers!) expect(r2.receivers, id).toContain(id)
    for (const id of r2.receivers!) expect(r2.baskets.filter((k) => byId(id).accepts.includes(k)).length, id).toBeGreaterThanOrEqual(id === 'esel' || id === 'ziege' || id === 'kamel' || id === 'schaf' ? 1 : 1)
    // jedes Tier genau ein Futterstück: genau vier Mal Heu und ein Futtersack in Runde 2, in Runde 1 zwei Mal Heu und ein Futtersack
    expect(r2.baskets.filter((k) => k === 'heu').length).toBe(4)
    expect(r2.baskets.filter((k) => k === 'korn').length).toBe(1)
    expect(r1.baskets.filter((k) => k === 'heu').length).toBe(2)
    expect(r1.baskets.filter((k) => k === 'korn').length).toBe(1)
    for (const id of ['taube', 'kamel', 'schaf', 'ziege', 'esel']) expect(byId(id).single, id).toBe(true)
    expect(r2.baskets.filter((k) => byId('familie').accepts.includes(k)).length).toBeGreaterThanOrEqual(2)
    for (const k of r1.baskets.filter((x) => !nobody.includes(x))) expect(r1.receivers!.some((id) => byId(id).accepts.includes(k)), k).toBe(true)
    // falsches Futter: ein kurzer Satz für jedes Tier (Taube kein Heu, Kamel keine Körner), keine Futterbilder auf den Karten
    expect(byId('taube').rejects!.heu).toBe('Die Taube frisst kein Heu.')
    expect(byId('kamel').rejects!.korn).toBe('Das Kamel mag keine Körner.')
    for (const r of share.receivers) {
      for (const k of food.filter((x) => !r.accepts.includes(x))) {
        const text = r.rejects?.[k] ?? r.rejects?.['*']
        expect(text, `${r.id}: ${k}`).toBeTruthy()
        expect(text!.length, `${r.id}: ${k}`).toBeLessThan(50)
        expect(text, `${r.id}: ${k}`).toMatch(/\.$/)
      }
    }
    // die Futterkörner liegen im Futtersack (Codex-Nachlieferung), nicht im Korb
    expect(share.baskets.find((b) => b.id === 'korn')!.image).toMatch(/futtersack/)
  })

  it('Tier-Memory (Etappe 4): sechs Paare aus Männchen und Weibchen, jede Karte nur einmal, die Sätze sagen nur, was in der Etappe steht', () => {
    const m = stage(4).task.memory!
    expect(m.pairs).toHaveLength(6)
    // zwölf verschiedene Karten: die zwei Karten eines Paares sind nicht gleich (Männchen und Weibchen), keine Karte kommt zweimal vor
    const images = m.pairs.flatMap((p) => [p.image, p.imageB!])
    expect(images.every(Boolean)).toBe(true)
    expect(new Set(images).size).toBe(12)
    for (const p of m.pairs) expect(p.image).not.toBe(p.imageB)
    expect(m.pairs.map((p) => p.labels)).toEqual([['Löwe', 'Löwin'], ['Hirsch', 'Hirschkuh'], ['Widder', 'Schaf'], ['Pfau', 'Pfauenhenne'], ['Stier', 'Kuh'], ['Hahn', 'Henne']])
    // die Sätze: nur Männchen und Weibchen von den Arten, keine feste Zahl, keine Zahlen
    for (const p of m.pairs) {
      expect(p.text.length, p.text).toBeLessThan(120)
      expect(p.text, p.text).toMatch(/Männchen/)
      expect(p.text, p.text).not.toMatch(/\d|zwei Tiere|Paare/)
    }
    // keine Eisbären und Kängurus; die Karten sind gemalt (256 x 256) und liegen im Ordner nur für Noah
    expect(images.join(' ')).not.toMatch(/eisbaer|kaenguru|känguru|ente-/i)
    for (const f of [...images, m.back]) expect(f, f).toMatch(/memory-paare\//)
    expect(m.plainFront).toBeUndefined()
  })

  it('alle Spielbilder gibt es, jedes unter 620 KB, zusammen höchstens 3 MB', () => {
    const files = journeyFiles(noah).filter((f) => f.startsWith('images/abenteuer/spiele/'))
    expect(files.length).toBeGreaterThan(30)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const f of files) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(620)
    const mb = files.reduce((n, f) => n + statSync(`public/${f}`).size, 0) / 1024 / 1024
    expect(mb).toBeLessThanOrEqual(3)
  })
})

/**
 * Noah, Welle 2: Punkte verbinden (6), Steuern (7), Altar bauen (8). Die Bilder dieser drei Spiele fehlen noch (siehe
 * D:/Claude/Abenteuer-Noah/SPIELE/BILDAUFTRAG-Welle-2.md); Punkte, Lichter und Steinumrisse in den Daten sind Platzhalter, bis die
 * Bilder und ihre Messdateien da sind. Diese Regeln gelten auch für die echten Werte.
 */
describe('Noah: die Spiele der Etappen 6, 7 und 8', () => {
  const stage = (id: number) => noah.stages.find((s) => s.id === id)!
  const dots = stage(6).task.dots!
  const fly = stage(7).task.fly!
  const altar = stage(8).task.build!
  /** Abstände in Breiten (Bilder 3:4: eine Höhe von 1 % ist 4/3 einer Breite von 1 %). */
  const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, (a[1]! - b[1]!) * (4 / 3))

  it('Etappen 6–8 haben Text, Bibelstelle, die richtige Aufgabenart und gültige Fragen', () => {
    expect([6, 7, 8].map((id) => stage(id).task.kind)).toEqual(['punkte', 'steuern', 'bauen'])
    for (const id of [6, 7, 8]) {
      const s = stage(id)
      expect(s.ref).toMatch(/Mose/)
      expect(s.text.join(' ').split(/\s+/).length, `Textlänge ${id}`).toBeGreaterThan(40)
      expect(s.task.hint!.length).toBeGreaterThan(8)
      expect(s.questions).toHaveLength(2)
      for (const q of s.questions) {
        expect(q.answer).toBe(0)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(/[?]$/.test(q.q)).toBe(true)
      }
    }
  })

  it('Punkte verbinden: 12–30 Punkte von links nach rechts, so weit auseinander, dass ein Finger sie trifft', () => {
    expect(dots.points.length).toBeGreaterThanOrEqual(12)
    expect(dots.points.length).toBeLessThanOrEqual(30)
    for (const p of dots.points) {
      expect(p[0]).toBeGreaterThanOrEqual(3)
      expect(p[0]).toBeLessThan(97)
      expect(p[1]).toBeGreaterThan(3)
      expect(p[1]).toBeLessThan(97)
    }
    for (let i = 1; i < dots.points.length; i++) expect(dots.points[i]![0], `Punkt ${i + 1} liegt links von Punkt ${i}`).toBeGreaterThanOrEqual(dots.points[i - 1]![0])
    // ein Punkt ist etwa 44 px groß, das sind bei 300 px Bildbreite knapp 15 %; zwei Punkte dürfen sich nicht überdecken (8 % = 24 px)
    for (let i = 0; i < dots.points.length; i++) for (let j = i + 1; j < dots.points.length; j++) expect(dist(dots.points[i]!, dots.points[j]!), `Punkt ${i + 1} und ${j + 1}`).toBeGreaterThanOrEqual(8)
  })

  it('Steuern: zwei Flüge; Lichter liegen weit genug auseinander; Runde 2 verlangt das Ölblatt; Landeplatz frei', () => {
    expect(fly.rounds).toHaveLength(2)
    const [r1, r2] = fly.rounds as [(typeof fly.rounds)[number], (typeof fly.rounds)[number]]
    expect(r1.needLeaf).toBeFalsy()
    expect(r2.needLeaf).toBe(true)
    expect(r1.targets.every((t) => t.kind === 'light') && r1.targets.length >= 3).toBe(true)
    expect(r2.targets.filter((t) => t.kind === 'leaf')).toHaveLength(1)
    expect(r2.targets.filter((t) => t.kind === 'light').length).toBeGreaterThanOrEqual(2)
    for (const r of fly.rounds) {
      expect(r.hint.length).toBeGreaterThan(8)
      for (const t of r.targets) {
        expect(t.x).toBeGreaterThan(8)
        expect(t.x).toBeLessThan(92)
        expect(t.y).toBeGreaterThan(8)
        expect(t.y).toBeLessThan(92)
        // der Landeplatz ist frei: nichts liegt in seinem Kreis
        expect(dist([t.x, t.y], [fly.home.x, fly.home.y]), 'nahe am Landeplatz').toBeGreaterThan(20)
      }
      for (let i = 0; i < r.targets.length; i++) for (let j = i + 1; j < r.targets.length; j++) expect(dist([r.targets[i]!.x, r.targets[i]!.y], [r.targets[j]!.x, r.targets[j]!.y])).toBeGreaterThan(21)
    }
    // der dritte Flug (die Taube kommt nicht zurück) kommt nur im Text vor, nicht im Spiel
    expect(stage(7).text.join(' ')).toMatch(/dritten Mal/)
  })

  it('Altar bauen: zwölf Steine in vier Schichten von unten nach oben, jeder Stein ein eigener Umriss, Drehen und feste Reihenfolge', () => {
    expect(altar.ordered).toBe(true)
    expect(altar.rotate).toBe(true)
    expect(altar.pieces).toHaveLength(12)
    expect(altar.rounds.map((r) => !!r.outline)).toEqual([true])
    const layers = altar.pieces.map((p) => p.layer)
    expect(layers).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
    // jede Schicht liegt im Mittel höher als die darunter (kleineres y)
    const centerY = (p: (typeof altar.pieces)[number]) => p.y + p.h / 2
    const meanOf = (layer: number) => altar.pieces.filter((p) => p.layer === layer).reduce((n, p) => n + centerY(p), 0) / 3
    for (let l = 2; l <= 4; l++) expect(meanOf(l), `Schicht ${l} liegt höher als ${l - 1}`).toBeLessThan(meanOf(l - 1))
    // in jeder Schicht von links nach rechts
    for (let l = 1; l <= 4; l++) {
      const xs = altar.pieces.filter((p) => p.layer === l).map((p) => p.x + p.w / 2)
      expect(xs, `Schicht ${l} von links nach rechts`).toEqual([...xs].sort((a, b) => a - b))
    }
    for (const p of altar.pieces) {
      expect(p.polygon!.length, p.id).toBeGreaterThanOrEqual(4)
      for (const q of p.polygon!) for (const v of q) expect(v >= 0 && v <= 100, `${p.id}: Punkt im Bild`).toBe(true)
      const xs = p.polygon!.map((q) => q[0])
      const ys = p.polygon!.map((q) => q[1])
      expect(Math.min(...xs)).toBeCloseTo(p.x, 0)
      expect(Math.min(...ys)).toBeCloseTo(p.y, 0)
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(p.w, 0)
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(p.h, 0)
    }
    expect(new Set(altar.pieces.map((p) => JSON.stringify(p.polygon))).size).toBe(12)
    expect(altar.image).toMatch(/altar/)
  })

  it('die Bilder der Welle 2 (Etappen 6–8) sind da, jedes unter 620 KB', () => {
    const waiting = /^images\/abenteuer\/spiele\/(punkte|steuern|altar)\//
    // die Etappen 6–8 sind noch `soon` und kommen darum nicht ins Paket; für diese Prüfung zählen sie trotzdem
    const files = journeyFiles({ ...noah, stages: noah.stages.map((s) => ({ ...s, soon: false })) }).filter((f) => waiting.test(f))
    expect(files.length).toBe(1 + 6 + 2)
    for (const f of files) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(620)
  })
})

describe('Noah: Test-Vorschau (versteckter Zugang)', () => {
  it('nur die Etappen mit fertigen Bildern sind offen, die anderen stehen auf „bald“', () => {
    // alle neun Etappen sind spielbar (die Bilder von Codex, Teil 3, sind eingebaut); `soon` bleibt für künftige Reisen
    expect(noah.stages.filter((s) => !s.soon).map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('das Paket enthält nur Dateien, die es gibt (sonst bricht das Laden ab), auch die Bilder der Etappen 6–8', () => {
    const files = journeyFiles(noah)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
    expect(files.some((f) => /\/spiele\/(punkte|steuern|altar)\//.test(f))).toBe(true)
    expect(files).toContain(noah.medal)
    expect(files.some((f) => f.includes('/spiele/bauen/'))).toBe(true)
    expect(files).toContain(noah.gift.image)
    const mb = files.reduce((n, f) => n + statSync(`public/${f}`).size, 0) / 1024 / 1024
    expect(noah.downloadMb!, 'downloadMb stimmt ungefähr').toBeGreaterThan(mb * 0.7)
    expect(noah.downloadMb!, 'downloadMb stimmt ungefähr').toBeLessThan(mb * 1.5)
    expect(mb).toBeLessThanOrEqual(13) // 12 bis zur Vertonung (Version 2) und den zehn Spielstücken der Musik
  })
})

describe('Noah: die Karte', () => {
  const m = noah.map
  it('vier Stücke eines Bildes, jedes unter 1,8 MB; Stationen von links nach rechts, nicht zu tief und nicht zu dicht', () => {
    expect(m.images).toHaveLength(4)
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(9908)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 3)
    expect(m.stages).toHaveLength(9)
    const spots = [...m.stages, m.exam]
    for (let i = 0; i < spots.length; i++) {
      expect(spots[i]!.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      expect(spots[i]!.d).toBeCloseTo(336 / 9908, 3)
      if (i > 0) {
        expect(spots[i]!.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
        // zwei Ringe (336 px) berühren sich nicht: mindestens 340 px Abstand
        expect(Math.hypot((spots[i]!.x - spots[i - 1]!.x) * 9908, (spots[i]!.y - spots[i - 1]!.y) * 1648)).toBeGreaterThanOrEqual(338)
      }
    }
  })
  it('nichts liegt in den unteren 20 % der Karte: dort verdeckt die Navigationsleiste Ringe, Namen und Perlen', () => {
    // 1318 von 1648 px (Sperrzone der Bild-Sitzung); Ring-Mitte höchstens bei 1060 px
    for (const sp of [...m.stages, m.exam]) expect(sp.y * 1648, 'Ring-Mitte').toBeLessThanOrEqual(1070)
    for (const seg of m.path) for (const [, y] of seg) expect(y * 1648, 'Perle').toBeLessThanOrEqual(1318)
  })
  it('der Perlenweg hat eine Strecke je Etappe (die letzte führt zum Ziel), alle Perlen liegen im Bild', () => {
    expect(m.path).toHaveLength(9)
    for (const seg of m.path) for (const [x, y] of seg) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(1)
    }
    expect(m.path.reduce((n, s) => n + s.length, 0)).toBeGreaterThan(40)
  })
  it('jede Etappe hat ihr Bild (960 x 640 WebP, unter 620 KB), auch die, die noch „bald“ sind', () => {
    const files = journeyFiles(noah)
    for (const s of noah.stages) {
      expect(s.image, `Bild ${s.id}`).toBeTruthy()
      expect(files, `im Paket: ${s.image}`).toContain(s.image)
      expect(existsSync(`public/${s.image}`)).toBe(true)
    }
    expect(files).toContain(noah.map.ring)
  })
})
