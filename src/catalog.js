const express = require('express')
const db = require('./db')
const normalize = require('./normalize')

const router = express.Router()

router.get('/titles', (req, res) => {
  const { type, genre } = req.query
  let sql = 'SELECT id, type, title, description, year, genres, rating, vip FROM titles WHERE 1=1'
  const params = []
  if (type === 'movie' || type === 'series') {
    sql += ' AND type = ?'
    params.push(type)
  }
  if (genre) {
    sql += ' AND genres LIKE ?'
    params.push('%' + genre + '%')
  }
  sql += ' ORDER BY rating DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/titles/:id', (req, res) => {
  const title = db.prepare('SELECT * FROM titles WHERE id = ?').get(req.params.id)
  if (!title) {
    return res.status(404).json({ error: 'فیلم یا سریال پیدا نشد' })
  }
  const result = { ...title }
  if (title.type === 'series') {
    result.episodes = db
      .prepare('SELECT id, season, number, title, duration, vip FROM episodes WHERE title_id = ? ORDER BY season, number')
      .all(title.id)
  }
  res.json(result)
})

router.get('/titles/:id/similar', (req, res) => {
  const title = db.prepare('SELECT * FROM titles WHERE id = ?').get(req.params.id)
  if (!title) {
    return res.status(404).json({ error: 'فیلم یا سریال پیدا نشد' })
  }
  const mainGenre = title.genres.split(',')[0]
  const similar = db
    .prepare('SELECT id, type, title, year, genres, rating, vip FROM titles WHERE genres LIKE ? AND id != ? ORDER BY rating DESC LIMIT 6')
    .all('%' + mainGenre + '%', title.id)
  res.json(similar)
})

router.get('/search', (req, res) => {
  const q = normalize(req.query.q)
  if (!q) {
    return res.json([])
  }
  const rows = db
    .prepare('SELECT id, type, title, description, year, genres, rating, vip FROM titles WHERE search_title LIKE ? ORDER BY rating DESC')
    .all('%' + q + '%')
  res.json(rows)
})

router.get('/genres', (req, res) => {
  const rows = db.prepare('SELECT genres FROM titles').all()
  const genres = []
  for (const row of rows) {
    for (const genre of row.genres.split(',')) {
      if (!genres.includes(genre)) {
        genres.push(genre)
      }
    }
  }
  res.json(genres.sort())
})

module.exports = router
