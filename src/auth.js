require('dotenv').config()

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'توکن ارسال نشده است' })
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'توکن نامعتبر است' })
  }
}

router.post('/register', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است' })
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) {
    return res.status(409).json({ error: 'این ایمیل قبلا ثبت شده است' })
  }
  const hash = bcrypt.hashSync(password, 10)
  const info = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
  const user = { id: Number(info.lastInsertRowid), email }
  db.prepare('INSERT INTO subscriptions (user_id, plan_code, starts_at, expires_at) VALUES (?, ?, ?, ?)').run(
    user.id,
    'free',
    new Date().toISOString(),
    '2999-01-01T00:00:00.000Z'
  )
  res.status(201).json({ token: signToken(user), user })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '')
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' })
  }
  res.json({ token: signToken(user), user: { id: user.id, email: user.email } })
})

router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.user.id)
  const subscription = db
    .prepare('SELECT plan_code, starts_at, expires_at FROM subscriptions WHERE user_id = ? ORDER BY starts_at DESC LIMIT 1')
    .get(req.user.id)
  res.json({ user, subscription })
})

module.exports = { router, auth }
