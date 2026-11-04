const express = require('express')
const db = require('./db')
const { auth } = require('./auth')

const router = express.Router()

router.get('/plans', (req, res) => {
  res.json(db.prepare('SELECT code, name, price, days FROM plans ORDER BY price').all())
})

router.post('/subscribe', auth, (req, res) => {
  const plan = db.prepare('SELECT * FROM plans WHERE code = ?').get((req.body || {}).plan)
  if (!plan) {
    return res.status(400).json({ error: 'پلن پیدا نشد' })
  }
  if (plan.code === 'free') {
    return res.status(400).json({ error: 'پلن رایگان به خرید نیاز ندارد' })
  }
  const now = new Date()
  const current = db
    .prepare("SELECT expires_at FROM subscriptions WHERE user_id = ? AND plan_code = 'vip' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1")
    .get(req.user.id, now.toISOString())
  const base = current ? new Date(current.expires_at) : now
  const expiresAt = new Date(base.getTime() + plan.days * 24 * 60 * 60 * 1000)
  db.prepare('INSERT INTO subscriptions (user_id, plan_code, starts_at, expires_at) VALUES (?, ?, ?, ?)').run(
    req.user.id,
    plan.code,
    now.toISOString(),
    expiresAt.toISOString()
  )
  res.json({ message: 'اشتراک ویژه فعال شد', plan: plan.code, expires_at: expiresAt.toISOString() })
})

module.exports = router
