require('dotenv').config()

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const dbFile = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(__dirname, '..', 'data', 'namayesh.db')

fs.mkdirSync(path.dirname(dbFile), { recursive: true })

const db = new Database(dbFile)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    days INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_code TEXT NOT NULL REFERENCES plans(code),
    starts_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('movie', 'series')),
    title TEXT NOT NULL,
    search_title TEXT NOT NULL,
    description TEXT NOT NULL,
    year INTEGER NOT NULL,
    genres TEXT NOT NULL,
    rating REAL NOT NULL,
    vip INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL REFERENCES titles(id),
    season INTEGER NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    vip INTEGER NOT NULL DEFAULT 0,
    file TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL REFERENCES users(id),
    episode_id INTEGER NOT NULL REFERENCES episodes(id),
    position INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, episode_id)
  );
`)

const planCount = db.prepare('SELECT COUNT(*) AS n FROM plans').get().n
if (planCount === 0) {
  require('./seed')(db)
}

module.exports = db
