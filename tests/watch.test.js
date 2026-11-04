import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { app, request, createUser } from './utils.js'

const SECRET = 'test-video-secret'

function makeSig(expires) {
  return crypto.createHmac('sha256', SECRET).update('sample.mp4' + expires).digest('hex')
}

async function firstFreeEpisode() {
  const list = await request(app).get('/api/titles').query({ type: 'series' })
  const freeShow = list.body.find((t) => t.vip === 0)
  const detail = await request(app).get('/api/titles/' + freeShow.id)
  return detail.body.episodes[0]
}

describe('watch progress and streaming', () => {
  it('gives a signed play link for a free episode', async () => {
    const { token } = await createUser()
    const episode = await firstFreeEpisode()
    const res = await request(app).get('/api/play/' + episode.id).set('Authorization', 'Bearer ' + token)

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('/api/stream/sample.mp4?')
    expect(res.body.url).toContain('sig=')
    expect(res.body.position).toBe(0)
    expect(res.body.expires_in).toBe(300)
  })

  it('saves progress and shows it in continue watching', async () => {
    const { token } = await createUser()
    const episode = await firstFreeEpisode()
    await request(app).put('/api/progress/' + episode.id).set('Authorization', 'Bearer ' + token).send({ position: 600 })

    const res = await request(app).get('/api/continue').set('Authorization', 'Bearer ' + token)
    const item = res.body.find((i) => i.episode_id === episode.id)

    expect(res.status).toBe(200)
    expect(item).toBeTruthy()
    expect(item.percent).toBe(Math.round((600 / episode.duration) * 100))
  })

  it('resumes from the saved position on the next play', async () => {
    const { token } = await createUser()
    const episode = await firstFreeEpisode()
    await request(app).put('/api/progress/' + episode.id).set('Authorization', 'Bearer ' + token).send({ position: 735 })

    const res = await request(app).get('/api/play/' + episode.id).set('Authorization', 'Bearer ' + token)

    expect(res.body.position).toBe(735)
  })

  it('hides finished episodes from continue watching', async () => {
    const { token } = await createUser()
    const episode = await firstFreeEpisode()
    await request(app).put('/api/progress/' + episode.id).set('Authorization', 'Bearer ' + token).send({ position: episode.duration })

    const res = await request(app).get('/api/continue').set('Authorization', 'Bearer ' + token)

    expect(res.body.find((i) => i.episode_id === episode.id)).toBeUndefined()
  })

  it('rejects the stream link without a signature', async () => {
    const res = await request(app).get('/api/stream/sample.mp4?expires=99999999999999')

    expect(res.status).toBe(403)
  })

  it('rejects an expired signature', async () => {
    const expires = Date.now() - 1000
    const res = await request(app).get('/api/stream/sample.mp4?expires=' + expires + '&sig=' + makeSig(expires))

    expect(res.status).toBe(403)
  })

  it('rejects a tampered signature', async () => {
    const expires = Date.now() + 60000
    const res = await request(app).get('/api/stream/sample.mp4?expires=' + expires + '&sig=' + makeSig(expires) + 'x')

    expect(res.status).toBe(403)
  })

  it('serves the video with a valid signature', async () => {
    const expires = Date.now() + 60000
    const res = await request(app).get('/api/stream/sample.mp4?expires=' + expires + '&sig=' + makeSig(expires))

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('video/mp4')
  })

  it('supports range requests for real streaming', async () => {
    const expires = Date.now() + 60000
    const res = await request(app)
      .get('/api/stream/sample.mp4?expires=' + expires + '&sig=' + makeSig(expires))
      .set('Range', 'bytes=0-99')

    expect(res.status).toBe(206)
    expect(res.headers['content-range']).toContain('bytes 0-99/')
  })
})
