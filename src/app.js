require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { router: authRouter } = require('./auth')
const catalogRouter = require('./catalog')
const plansRouter = require('./plans')
const watchRouter = require('./watch')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ name: 'namayesh', description: 'Mini streaming platform API', docs: 'See README.md' })
})

app.use('/api/auth', authRouter)
app.use('/api', catalogRouter)
app.use('/api', plansRouter)
app.use('/api', watchRouter)

module.exports = app
