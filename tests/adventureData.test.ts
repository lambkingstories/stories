/**
 * Prüft JEDES Abenteuer in `journeys` auf die Regeln des LambKing-Abenteuer-Skills (Daten, Bilder, Töne, Fragen, Karte).
 * Ein neues Abenteuer wird nur dann angenommen, wenn dieser Test für es grün ist.
 */
import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { journeyFiles } from '@/utils/journeyFiles'
import type { AdventureQuestion } from '@/types/adventure'

const KINDS = ['quiz', 'zaehlen', 'ausmalen', 'puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild']

describe.each(journeys.map((j) => [j.id, j] as const))('Abenteuer %s', (_id, j) => {
  const questionsOf = (qs: AdventureQuestion[]) => qs.map((q) => q.q)

  it('hat Kopfdaten und eine zusammenhängende Nummerierung der Etappen', () => {
    expect(j.id).toMatch(/^[a-z0-9-]+$/)
    expect(j.title.length).toBeGreaterThan(1)
    expect(['5-8', '9-12']).toContain(j.age)
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
