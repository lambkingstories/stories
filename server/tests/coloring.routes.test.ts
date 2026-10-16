import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp, sampleBook } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

const coloringBook = (over: Record<string, unknown> = {}) =>
  sampleBook({
    bookId: 'ba-1-schoepfung',
    category: 'Ausmalbücher',
    kind: 'coloring',
    freePages: 5,
    localizations: {
      de: {
        title: 'Schöpfung',
        shortDescription: 'k',
        description: 'b',
        content: [
          { page: 1, title: 'Licht', image: 'https://example.test/uploads/content-images/1.webp', reference: '1. Mose 1,1', text: '' },
          { page: 2, title: 'Land', image: 'https://example.test/uploads/content-images/2.webp', reference: '1. Mose 1,9', text: 'Gras wächst.' }
        ]
      }
    },
    ...over
  })

describe('coloring books over the API', () => {
  it('stores kind, free pages and the fields of the pages', async () => {
    const res = await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(coloringBook())
    expect(res.status).toBe(201)
    expect(res.body.book.kind).toBe('coloring')
    expect(res.body.book.freePages).toBe(5)
    expect(res.body.book.localizations.de.content[1]).toMatchObject({ image: expect.stringContaining('/uploads/content-images/2.webp'), reference: '1. Mose 1,9' })
  })

  it('refuses a coloring page without picture and a story page without text', async () => {
    const noPicture = coloringBook()
    ;(noPicture.localizations as { de: { content: unknown[] } }).de.content = [{ page: 1, title: 'x', text: 'nur Text' }]
    const a = await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(noPicture)
    expect(a.status).toBe(400)
    const b = await request(app)
      .post('/api/books')
      .set('Authorization', ADMIN_AUTH)
      .send(sampleBook({ localizations: { de: { title: 't', shortDescription: 's', description: 'd', content: [{ page: 1, title: '', text: '' }] } } }))
    expect(b.status).toBe(400)
  })

  it('hands out an old-form coloring book in the new form', async () => {
    const old = sampleBook({
      bookId: 'ba-2-alt',
      category: 'Ausmalbücher',
      localizations: {
        de: {
          title: 'Alt',
          shortDescription: 's',
          description: 'd',
          content: [{ page: 1, title: 'Licht · 1. Mose 1,1', text: '![Ausmalbild: Licht](https://example.test/uploads/content-images/z.webp)\n\nEin Satz.' }]
        }
      }
    })
    expect((await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(old)).status).toBe(201)
    const one = await request(app).get('/api/book/ba-2-alt')
    expect(one.body.book.localizations.de.content[0]).toMatchObject({ title: 'Licht', reference: '1. Mose 1,1', text: 'Ein Satz.' })
    expect(one.body.book.localizations.de.content[0].image).toContain('/uploads/content-images/z.webp')
  })

  it('lists slim: no story text, whole coloring pages', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(sampleBook())
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(coloringBook())
    const slim = await request(app).get('/api/books?lean=1')
    const story = slim.body.books.find((b: { bookId: string }) => b.bookId === 'fa-1-apple')
    const col = slim.body.books.find((b: { bookId: string }) => b.bookId === 'ba-1-schoepfung')
    expect(story.lean).toBe(true)
    expect(story.localizations.de.content[0].text).toBeUndefined()
    expect(col.localizations.de.content[1].text).toBe('Gras wächst.')
    const full = await request(app).get('/api/books')
    expect(full.body.books.find((b: { bookId: string }) => b.bookId === 'fa-1-apple').localizations.de.content[0].text).toBe('Es war einmal ein Apfel.')
  })

  it('changes the kind of a book with an update', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(sampleBook())
    const res = await request(app).put('/api/book/fa-1-apple').set('Authorization', ADMIN_AUTH).send({ freePages: 3 })
    expect(res.status).toBe(200)
    expect(res.body.book.freePages).toBe(3)
    expect(res.body.book.kind).toBe('story')
  })
})
