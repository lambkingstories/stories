/**
 * One-shot migration: coloring books get `kind: 'coloring'` and their pages the new fields.
 *
 * Before: the book was recognised by its category name ("Ausmalbücher"), and each page kept the picture as markdown in the text
 * (`![Ausmalbild: Titel](url)`, the Bible passage after " · " in the page title).
 * After:  `kind: 'coloring'`, and each page has `image`, `title`, `reference` and (if there is one) `text` as its own fields.
 *
 * Run with:
 *   pnpm migrate:coloring-kind             # dry run — prints the plan, writes nothing
 *   pnpm migrate:coloring-kind -- --apply  # performs the updates (back up first: pnpm backup:now)
 *
 * Idempotent: books that already have `kind: 'coloring'` and pages in the new form are skipped. Run it, then clear the cache
 * (or wait for it to expire) so the lists are built again.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { isColoringCategory, normalizeColoringPage, type BookPage } from '../src/utils/coloring.js'

async function main() {
  const apply = process.argv.slice(2).includes('--apply')
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via dotenv-cli, e.g. `dotenv -e .env.local -- tsx scripts/...`).')
    process.exit(1)
  }
  const dbName = process.env.MONGO_DB_NAME || 'main_db'
  console.log(`→ ${apply ? 'Applying' : 'Dry-run'} coloring-kind migration on "${dbName}"`)

  await mongoose.connect(uri, { dbName })
  const db = mongoose.connection.db
  if (!db) throw new Error('No database connection')
  const books = db.collection('books')

  let inspected = 0
  let changed = 0
  let pagesConverted = 0
  for await (const doc of books.find({})) {
    inspected++
    const d = doc as Record<string, unknown> & { localizations?: Record<string, { content?: BookPage[] } | null> }
    const isColoring = d.kind === 'coloring' || (d.kind !== 'story' && isColoringCategory(String(d.category ?? '')))
    if (!isColoring) continue

    const set: Record<string, unknown> = {}
    if (d.kind !== 'coloring') set.kind = 'coloring'
    let converted = 0
    for (const [lang, loc] of Object.entries(d.localizations ?? {})) {
      if (!loc || !Array.isArray(loc.content)) continue
      const next = loc.content.map((p) => {
        const n = normalizeColoringPage(p)
        if (n !== p && n.image !== p.image) converted++
        return n
      })
      if (JSON.stringify(next) !== JSON.stringify(loc.content)) set[`localizations.${lang}.content`] = next
    }
    if (!Object.keys(set).length) continue
    changed++
    pagesConverted += converted
    console.log(`  ${String(d.bookId)}: kind ${d.kind ?? '(none)'} → coloring, ${converted} page(s) converted`)
    if (apply) await books.updateOne({ _id: doc._id }, { $set: set })
  }
  console.log(`✓ ${inspected} books inspected, ${changed} to change, ${pagesConverted} pages converted${apply ? ' (written)' : ' (dry run, nothing written)'}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
