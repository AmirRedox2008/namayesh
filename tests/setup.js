import fs from 'node:fs'

process.env.DB_FILE = 'data/test.db'
process.env.JWT_SECRET = 'test-secret'
process.env.VIDEO_SECRET = 'test-video-secret'

fs.rmSync('data/test.db', { force: true })
fs.rmSync('data/test.db-wal', { force: true })
fs.rmSync('data/test.db-shm', { force: true })
