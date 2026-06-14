// routes/auth.js — login/signup/me against the users table. Tokens are simple
// signed-ish blobs (base64 of the user id) — enough for an offline POS demo.
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

const tokenFor = (id) => Buffer.from(`uid:${id}`).toString('base64')
const idFromToken = (t) => {
  try {
    const s = Buffer.from(String(t), 'base64').toString('utf8')
    return s.startsWith('uid:') ? s.slice(4) : null
  } catch { return null }
}

const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role, archived: !!u.archived }

router.post('/login', (req, res) => {
  const { email = '', password = '' } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(email)
  if (!u || u.password !== password || u.archived) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  res.json({ token: tokenFor(u.id), user: publicUser(u) })
})

router.post('/signup', (req, res) => {
  const { name = '', email = '', password = '' } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' })
  const exists = db.prepare('SELECT 1 FROM users WHERE lower(email)=lower(?)').get(email)
  if (exists) return res.status(409).json({ error: 'Email already registered' })
  const id = 'u-' + Math.random().toString(36).slice(2, 9)
  db.prepare('INSERT INTO users (id,name,email,password,role,archived) VALUES (?,?,?,?,?,0)')
    .run(id, name, email, password, 'admin')
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id)
  res.status(201).json({ token: tokenFor(id), user: publicUser(u) })
})

router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const id = idFromToken(token)
  const u = id && db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!u) return res.status(401).json({ error: 'Not authenticated' })
  res.json({ user: publicUser(u) })
})
