require('dotenv').config()

const express = require('express')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const db = require('./db')
const { auth } = require('./auth')

const router = express.Router()
const VIDEO_DIR = path.join(__dirname, '..', 'videos')
const VIDEO_SECRET = process.env.VIDEO_SECRET || 'dev-video-secret'

function hasVip(userId) {
  const sub = db
    .prepare("SELECT expires_at FROM subscriptions WHERE user_id = ? AND plan_code = 'vip' AND expires_at > ?")
    .get(userId, new Date().toISOString())
  return Boolean(sub)
}

function signLink(file) {
  const expires = Date.now() + 5 * 60 * 1000
  const sig = crypto.createHmac('sha256', VIDEO_SECRET).update(file + expires).digest('hex')
  return '/api/stream/' + file + '?expires=' + expires + '&sig=' + sig
}

function validSignature(file, expires, sig) {
  if (!expires || !sig) {
    return false
  }
  if (Number(expires) < Date.now()) {
    return false
  }
  const expected = crypto.createHmac('sha256', VIDEO_SECRET).update(file + Number(expires)).digest('hex')
  return expected === sig
}

router.get('/play/:episodeId', auth, (req, res) => {
  const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.episodeId)
  if (!episode) {
    return res.status(404).json({ error: 'قسمت پیدا نشد' })
  }
  if (episode.vip && !hasVip(req.user.id)) {
    return res.status(403).json({ error: 'این قسمت مخصوص اشتراک ویژه است', need_vip: true })
  }
  const saved = db
    .prepare('SELECT position FROM progress WHERE user_id = ? AND episode_id = ?')
    .get(req.user.id, episode.id)
  res.json({
    episode: { id: episode.id, title: episode.title, duration: episode.duration },
    position: saved ? saved.position : 0,
    url: signLink(episode.file),
    expires_in: 300,
  })
})

router.get('/stream/:file', (req, res) => {
  const file = path.basename(req.params.file)
  if (!validSignature(file, req.query.expires, req.query.sig)) {
    return res.status(403).json({ error: 'لینک منقضی شده یا نامعتبر است' })
  }
  const filePath = path.join(VIDEO_DIR, file)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل ویدیو پیدا نشد' })
  }
  res.sendFile(filePath)
})

router.put('/progress/:episodeId', auth, (req, res) => {
  const episode = db.prepare('SELECT id FROM episodes WHERE id = ?').get(req.params.episodeId)
  if (!episode) {
    return res.status(404).json({ error: 'قسمت پیدا نشد' })
  }
  const position = Math.max(0, Math.floor(Number((req.body || {}).position) || 0))
  db.prepare(
    `INSERT INTO progress (user_id, episode_id, position, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, episode_id) DO UPDATE SET position = excluded.position, updated_at = excluded.updated_at`
  ).run(req.user.id, episode.id, position, new Date().toISOString())
  res.json({ message: 'پیشرفت ذخیره شد', position })
})

router.get('/continue', auth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.episode_id, p.position, p.updated_at, e.title AS episode_title, e.duration, e.vip,
              t.id AS title_id, t.title, t.type
       FROM progress p
       JOIN episodes e ON e.id = p.episode_id
       JOIN titles t ON t.id = e.title_id
       WHERE p.user_id = ? AND p.position < e.duration * 0.95
       ORDER BY p.updated_at DESC
       LIMIT 12`
    )
    .all(req.user.id)
  res.json(
    rows.map((row) => ({
      ...row,
      percent: Math.min(100, Math.round((row.position / row.duration) * 100)),
    }))
  )
})

module.exports = router
