import request from 'supertest'
import app from '../src/app.js'

export { app, request }

export async function createUser(email, password = 'secret123') {
  const mail = email || 'user' + Date.now() + Math.floor(Math.random() * 10000) + '@test.com'
  const res = await request(app).post('/api/auth/register').send({ email: mail, password })
  return { email: mail, password, token: res.body.token }
}
