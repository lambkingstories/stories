import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp, sampleBook } from './helpers.js'
import { leanBook } from '../src/utils/leanBook.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

const story = () =>
  sampleBook({
    localizations: {
      de: {
        title: 'Der Apfel',
        shortDescription: 'Kurz',
        description: 'Lang',
        content: [
          { page: 1, title: 'Seite 1', text: 'Es war einmal ein Apfel.' },
          { page: 2, title: 'Seite 2', text: 'Der Apfel fiel vom Baum.' }
        ]
      },
      en: { title: 'The apple', shortDescription: 'Short', description: 'Long', content: [{ page: 1, title: 'Page 1', text: 'Once upon a time.' }] }
    }
  })

describe('GET /api/books?lean=1', () => {
  it('without lean the list is complete, exactly as before (old apps)', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(story())
    const res = await request(app).get('/api/books')
    expect(res.status).toBe(200)
    const b = res.body.books[0]
    expect(b.lean).toBeUndefined()
    expect(b.localizations.de.content[0].text).toBe('Es war einmal ein Apfel.')
    expect(b.localizations.en.content[0].text).toBe('Once upon a time.')
  })

  it('lean=1 leaves the page text out of story books and marks them lean; the rest stays', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(story())
    const res = await request(app).get('/api/books?lean=1')
    expect(res.status).toBe(200)
    const b = res.body.books[0]
    expect(b.lean).toBe(true)
    expect(b.bookId).toBe('fa-1-apple')
    expect(b.localizations.de.title).toBe('Der Apfel')
    expect(b.localizations.de.description).toBe('Lang')
    expect(b.localizations.de.content).toEqual([
      { page: 1, title: 'Seite 1' },
      { page: 2, title: 'Seite 2' }
    ])
    expect(b.localizations.en.content[0].text).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('Es war einmal')
  })

  it('lean=true works as well, and a lean list is much smaller than the full one', async () => {
    const long = 'Ein langer Satz, der oft vorkommt. '.repeat(200)
    await request(app)
      .post('/api/books')
      .set('Authorization', ADMIN_AUTH)
      .send(sampleBook({ localizations: { de: { title: 'A', shortDescription: 's', description: 'd', content: [{ page: 1, title: 'S', text: long }] } } }))
    const full = await request(app).get('/api/books')
    const lean = await request(app).get('/api/books?lean=true')
    expect(lean.body.books[0].lean).toBe(true)
    expect(JSON.stringify(lean.body).length).toBeLessThan(JSON.stringify(full.body).length / 5)
  })

  it('the single book is always complete, also when the list was asked for lean', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(story())
    await request(app).get('/api/books?lean=1')
    const one = await request(app).get('/api/book/fa-1-apple')
    expect(one.body.book.lean).toBeUndefined()
    expect(one.body.book.localizations.de.content[1].text).toBe('Der Apfel fiel vom Baum.')
  })

  it('coloring books stay complete in the lean list (the pictures sit in the page text)', async () => {
    const md = '![Ausmalbild: Arche](https://example.test/a.png)'
    await request(app)
      .post('/api/books')
      .set('Authorization', ADMIN_AUTH)
      .send(
        sampleBook({
          bookId: 'ab-1-noah',
          category: 'Ausmalbücher',
          localizations: { de: { title: 'Noah', shortDescription: 's', description: 'd', content: [{ page: 1, title: 'Arche · 1 Mose 6', text: md }] } }
        })
      )
    const res = await request(app).get('/api/books?lean=1')
    const b = res.body.books[0]
    expect(b.lean).toBeUndefined()
    expect(b.localizations.de.content[0].text).toContain('Ausmalbild')
  })

  it('the cache is shared: a lean request does not change what a full request returns', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(story())
    await request(app).get('/api/books?lean=1')
    const res = await request(app).get('/api/books')
    expect(res.headers['x-cache']).toBe('HIT')
    expect(res.body.books[0].localizations.de.content[0].text).toBe('Es war einmal ein Apfel.')
  })
})

describe('leanBook', () => {
  it('is safe for odd input', () => {
    expect(leanBook(null)).toBeNull()
    expect(leanBook({ bookId: 'x' })).toEqual({ bookId: 'x' })
    expect(leanBook({ localizations: { de: null, en: {} } })).toMatchObject({ lean: true })
  })
})
