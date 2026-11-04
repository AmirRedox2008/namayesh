import { describe, it, expect } from 'vitest'
import { app, request } from './utils.js'

describe('catalog', () => {
  it('lists all seeded titles', async () => {
    const res = await request(app).get('/api/titles')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(12)
  })

  it('filters movies', async () => {
    const res = await request(app).get('/api/titles').query({ type: 'movie' })

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(8)
    expect(res.body.every((t) => t.type === 'movie')).toBe(true)
  })

  it('filters series', async () => {
    const res = await request(app).get('/api/titles').query({ type: 'series' })

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(4)
    expect(res.body.every((t) => t.type === 'series')).toBe(true)
  })

  it('filters by genre', async () => {
    const res = await request(app).get('/api/titles').query({ genre: 'کمدی' })

    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body.every((t) => t.genres.includes('کمدی'))).toBe(true)
  })

  it('shows one title', async () => {
    const list = await request(app).get('/api/titles')
    const id = list.body[0].id
    const res = await request(app).get('/api/titles/' + id)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(id)
  })

  it('shows episodes for a series', async () => {
    const list = await request(app).get('/api/titles').query({ type: 'series' })
    const id = list.body[0].id
    const res = await request(app).get('/api/titles/' + id)

    expect(res.status).toBe(200)
    expect(res.body.episodes.length).toBe(4)
  })

  it('returns 404 for an unknown title', async () => {
    const res = await request(app).get('/api/titles/999')

    expect(res.status).toBe(404)
  })

  it('finds a title even with arabic ي instead of persian ی', async () => {
    const res = await request(app).get('/api/search').query({ q: 'جدايي نادر' })

    expect(res.status).toBe(200)
    expect(res.body.some((t) => t.title === 'جدایی نادر از سیمین')).toBe(true)
  })

  it('finds a title with a space instead of half-space', async () => {
    const res = await request(app).get('/api/search').query({ q: 'گوزن ها' })

    expect(res.status).toBe(200)
    expect(res.body.some((t) => t.title === 'گوزن‌ها')).toBe(true)
  })

  it('returns an empty list for a nonsense query', async () => {
    const res = await request(app).get('/api/search').query({ q: 'چیزی که نیست' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('suggests similar titles from the same genre', async () => {
    const list = await request(app).get('/api/search').query({ q: 'جدایی' })
    const id = list.body[0].id
    const res = await request(app).get('/api/titles/' + id + '/similar')

    expect(res.status).toBe(200)
    expect(res.body.every((t) => t.id !== id)).toBe(true)
    expect(res.body.every((t) => t.genres.includes('درام'))).toBe(true)
  })

  it('lists all genres', async () => {
    const res = await request(app).get('/api/genres')

    expect(res.status).toBe(200)
    expect(res.body).toContain('کمدی')
    expect(res.body).toContain('درام')
  })
})
