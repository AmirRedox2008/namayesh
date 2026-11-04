import { describe, it, expect } from 'vitest'
import { app, request, createUser } from './utils.js'

async function findVipEpisodeId() {
  const list = await request(app).get('/api/titles').query({ type: 'series' })
  const vipShow = list.body.find((t) => t.vip === 1)
  const detail = await request(app).get('/api/titles/' + vipShow.id)
  return detail.body.episodes[0].id
}

describe('plans and vip access', () => {
  it('lists free and vip plans', async () => {
    const res = await request(app).get('/api/plans')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
    expect(res.body.map((p) => p.code).sort()).toEqual(['free', 'vip'])
  })

  it('needs a token to subscribe', async () => {
    const res = await request(app).post('/api/subscribe').send({ plan: 'vip' })

    expect(res.status).toBe(401)
  })

  it('rejects an unknown plan', async () => {
    const { token } = await createUser()
    const res = await request(app).post('/api/subscribe').set('Authorization', 'Bearer ' + token).send({ plan: 'gold' })

    expect(res.status).toBe(400)
  })

  it('rejects buying the free plan', async () => {
    const { token } = await createUser()
    const res = await request(app).post('/api/subscribe').set('Authorization', 'Bearer ' + token).send({ plan: 'free' })

    expect(res.status).toBe(400)
  })

  it('activates vip for 30 days', async () => {
    const { token } = await createUser()
    const res = await request(app).post('/api/subscribe').set('Authorization', 'Bearer ' + token).send({ plan: 'vip' })

    expect(res.status).toBe(200)
    const days = (new Date(res.body.expires_at) - Date.now()) / 86400000
    expect(days).toBeGreaterThan(29.9)
    expect(days).toBeLessThan(30.1)
  })

  it('blocks a vip episode for a free user', async () => {
    const { token } = await createUser()
    const episodeId = await findVipEpisodeId()
    const res = await request(app).get('/api/play/' + episodeId).set('Authorization', 'Bearer ' + token)

    expect(res.status).toBe(403)
    expect(res.body.need_vip).toBe(true)
  })

  it('opens the same episode after subscribing', async () => {
    const { token } = await createUser()
    const episodeId = await findVipEpisodeId()
    await request(app).post('/api/subscribe').set('Authorization', 'Bearer ' + token).send({ plan: 'vip' })
    const res = await request(app).get('/api/play/' + episodeId).set('Authorization', 'Bearer ' + token)

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('/api/stream/')
  })
})
