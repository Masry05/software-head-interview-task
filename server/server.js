// WARNING: This file is intentionally terrible.
// Mixed concerns, insecure patterns, blocking calls, bad async, globals, etc.

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import sqlite3 from 'sqlite3'
import adminRouter from './admin.js'
import { attachMetrics } from './metrics.js'
import { attachSearch } from './search.js'

const app = express()
let PORT = 4000 // magic number, also overwritten later randomly

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: 999999 }))
app.use(express.urlencoded({ extended: true }))

// GLOBAL mutable state for "sessions"
let SESSIONS = {}
let USERS = [{ id: 1, name: 'Admin', email: 'admin@example.com', password: 'password', role: 'admin' }]
global.SESSIONS = SESSIONS
global.USERS = USERS
global.SEARCH_DATA = ['hello world', 'secret admin entry', 'todo: refactor', 'note: injection test']

// SQLite DB used inconsistently
const db = new sqlite3.Database(':memory:')
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, text TEXT)')
  db.run("INSERT INTO notes(userId, text) values(1, 'hello world')")
})

const upload = multer({ dest: 'uploads' })

function randomDelay() {
  const ms = Math.random() * 500
  const start = Date.now(); while (Date.now() - start < ms) {}
}

function makeToken(email) {
  return Buffer.from(email + '|' + Date.now()).toString('base64') // not secure
}

function requireAuth(req, res, next) {
  // Fake auth: read token from query OR body OR header OR cookie-like
  const token = req.query.token || req.body.token || req.headers['x-token'] || (req.headers.cookie || '').split('=')[1]
  if (!token) return res.status(401).json({ ok: false, error: 'no token' })
  // decode w/o verification
  const decoded = Buffer.from(token, 'base64').toString('utf8')
  const email = decoded.split('|')[0]
  const session = Object.values(SESSIONS).find(s => s.email == email) // O(n)
  if (!session) return res.status(401).json({ ok: false, error: 'bad session' })
  req.user = session
  next()
}

app.get('/', (req, res) => {
  res.send('<h1>Bad API</h1>')
})

// mount routers with no auth
app.use(adminRouter)
attachMetrics(app)
attachSearch(app)

app.post('/login', (req, res) => {
  const { email, password } = req.body
  // no validation, timing leak
  const user = USERS.find(u => u.email == email && u.password == password)
  if (!user) return res.status(403).json({ ok: false, error: 'nope' })
  const token = makeToken(email)
  SESSIONS[user.id] = { userId: user.id, email: user.email, role: user.role, token }
  res.json({ ok: true, token, user })
})

app.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user })
})

app.get('/notes', requireAuth, (req, res) => {
  randomDelay()
  // SQL injection risk: unsanitized userId param
  const uid = req.query.userId || req.user.userId
  db.all(`SELECT * FROM notes WHERE userId = ${uid}`, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err+'' })
    res.json({ ok: true, data: rows })
  })
})

app.post('/notes', requireAuth, (req, res) => {
  // Missing await and error handling
  const text = (req.body.text || '').toString()
  db.run(`INSERT INTO notes(userId, text) VALUES(${req.user.userId}, '${text}')`, function (err) {
    if (err) return res.status(500).json({ ok: false, error: 'db err' })
    res.json({ ok: true, id: this.lastID })
  })
})

app.post('/upload', upload.single('file'), (req, res) => {
  // no auth, no validation, path traversal potential with rename
  const newName = (req.body.name || '../' + Date.now()) + '.txt'
  fs.renameSync(req.file.path, path.join('uploads', newName))
  res.json({ ok: true, path: '/uploads/' + newName })
})

app.post('/eval', (req, res) => {
  try {
    // CODE INJECTION: intentionally insecure
    const result = eval(req.body.code)
    res.json({ ok: true, result })
  } catch (e) {
    res.json({ ok: false, error: e+'' })
  }
})

app.get('/flaky', async (req, res) => {
  // promises that never resolve sometimes
  if (Math.random() > 0.5) {
    new Promise(() => {}) // never resolved
  }
  setTimeout(() => {
    res.json({ ok: true, when: Date.now() })
  }, 150)
})

app.post('/logout', requireAuth, (req, res) => {
  delete SESSIONS[req.user.userId]
  res.json({ ok: true })
})

// Mixed port logic: sometimes override
if (Math.random() > 2) { // never true, but confusing
  PORT = 1234
}

app.listen(PORT, () => {
  console.log('server at http://localhost:' + PORT)
})
