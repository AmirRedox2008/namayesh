import { describe, it, expect } from 'vitest'
import { app, request, createUser } from './utils.js'

describe('auth', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'amir@test.com', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe('amir@test.com')
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dup@test.com', password: 'secret123' })
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@test.com', password: 'secret123' })

    expect(res.status).toBe(409)
  })

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'only-email@test.com' })

    expect(res.status).toBe(400)
  })

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ email: 'login@test.com', password: 'secret123' })
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })

  it('rejects a wrong password', async () => {
    await request(app).post('/api/auth/register').send({ email: 'wrong@test.com', password: 'secret123' })
    const res = await request(app).post('/api/auth/login').send({ email: 'wrong@test.com', password: 'nope' })

    expect(res.status).toBe(401)
  })

  it('shows profile and free subscription with a valid token', async () => {
    const { token } = await createUser()
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + token)

    expect(res.status).toBe(200)
    expect(res.body.subscription.plan_code).toBe('free')
  })

  it('blocks /me without a token', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
  })
})
