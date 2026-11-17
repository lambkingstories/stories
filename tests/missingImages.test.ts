/**
 * Meldet Bilder, die die App anfordert und die es unter public/ nicht gibt (Optimierung D, 17.11.2026).
 * Die Test-App antwortet auf fehlende Dateien nicht mit "404" (siehe public/404.html), darum fiel das bisher nicht auf.
 *
 * Geprüft wird auf vier Wegen:
 *  1. alle Bildpfade, die im Quelltext als Zeichenkette stehen (scripts/find-missing-images.mjs),
 *  2. die Auszeichnungen (images/awards/<id>.webp),
 *  3. die kleinen Medaillen-Vorschauen jedes Abenteuers (medalThumb) und das große Bild,
 *  4. die Bilder des Wegs "Wer ist Jesus?" (images/jesus/schritt-N.webp).
 *
 * Ausnahmeliste: Bilder der Spiele, die gerade von anderen Sitzungen nachgemalt werden. Eine Ausnahme gilt nur, solange die Datei fehlt;
 * sobald das Bild da ist, kann der Eintrag gestrichen werden.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error reines Node-Skript ohne Typen
import { findMissingImages } from '../scripts/find-missing-images.mjs'
import { AWARDS } from '@/utils/awards'
import { JESUS_PATH } from '@/data/jesusPath'
import { medalThumb } from '@/utils/medalThumb'

/** Teile von Pfaden, die vorerst fehlen dürfen (laufender Bilder-Nachzug: Gideon, Lamm, Bogen, Karawane, Wortreise). */
const AUSNAHMEN = ['spiele-gross/gideon/', 'spiele-gross/lamm/', 'spiele-gross/bogen/', 'spiele-gross/karawane/', 'wortreise']
const erlaubt = (p: string) => AUSNAHMEN.some((a) => p.includes(a))
const da = (p: string) => existsSync(`public/${p}`)

describe('fehlende Bilder', () => {
  it('jeder Bildpfad im Quelltext zeigt auf eine vorhandene Datei', () => {
    const r = findMissingImages() as { referenced: number; missing: { path: string; from: string }[] }
    expect(r.referenced).toBeGreaterThan(100)
    const fehlt = r.missing.filter((m) => !erlaubt(m.path)).map((m) => `${m.path} (in ${m.from})`)
    expect(fehlt, 'fehlende Bilder').toEqual([])
  })

  it('jede Auszeichnung hat ihr eigenes Bild', () => {
    for (const a of AWARDS) expect(da(`images/awards/${a.image}.webp`), `Auszeichnung ${a.id}`).toBe(true)
  })

  it('jedes Abenteuer hat sein großes Medaillenbild und die kleine Vorschau', () => {
    const files = import.meta.glob('/src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, unknown>>
    const medals = new Set<string>()
    for (const mod of Object.values(files)) {
      for (const v of Object.values(mod)) {
        const j = v as { id?: string; medal?: string; stages?: unknown[] }
        if (j && typeof j === 'object' && typeof j.medal === 'string' && Array.isArray(j.stages)) medals.add(j.medal)
      }
    }
    expect(medals.size).toBeGreaterThanOrEqual(37)
    for (const m of medals) {
      expect(da(m), `Medaille ${m}`).toBe(true)
      expect(da(medalThumb(m)), `Vorschau ${medalThumb(m)} (python scripts/make-medal-thumbs.py)`).toBe(true)
    }
  })

  it('"Wer ist Jesus?": jeder Schritt hat sein Bild', () => {
    const n = JESUS_PATH.de.steps.length
    expect(n).toBe(JESUS_PATH.en.steps.length)
    for (let i = 1; i <= n; i++) expect(da(`images/jesus/schritt-${i}.webp`), `Schritt ${i}`).toBe(true)
  })
})

describe('fehlende Dateien als 404 (Cloudflare Pages)', () => {
  it('es gibt eine 404.html ohne Skript, damit fehlende Dateien nicht mit "200 OK" und der Startseite antworten', () => {
    expect(existsSync('public/404.html')).toBe(true)
    const html = readFileSync('public/404.html', 'utf8')
    expect(html).not.toMatch(/<script/i)
    expect(html).toMatch(/href="\/"/)
    expect(readFileSync('public/_headers', 'utf8')).toMatch(/\/404\.html\s+Cache-Control: no-cache/)
  })

  it('die App ruft keine Adresse ohne "#" als Seite auf (Hash-Router), sonst bräuchte sie den Single-Page-Rückfall', () => {
    // Cloudflare Pages liefert ohne 404.html für jede unbekannte Adresse die Startseite. Mit 404.html gilt das nicht mehr, darum muss der Router
    // im Hash-Modus bleiben. Fällt dieser Test, muss public/404.html entfernt oder durch eine `_redirects`-Regel `/* /index.html 200` ersetzt werden.
    expect(readFileSync('src/router/index.ts', 'utf8')).toMatch(/createWebHashHistory/)
  })
})
