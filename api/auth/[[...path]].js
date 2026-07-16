// api/auth/[[...path]].js — Handles /api/auth/login, /api/auth/signup, /api/auth/me
// Consolidated into one function to stay within Vercel Hobby plan limits.
import { supabase } from '../_lib/supabase.js'

const tokenFor = (id) => Buffer.from(`uid:${id}`).toString('base64')
const idFromToken = (t) => {
  try {
    const s = Buffer.from(String(t), 'base64').toString('utf8')
    return s.startsWith('uid:') ? s.slice(4) : null
  } catch { return null }
}
const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role, archived: !!u.archived }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Extract the sub-path: /api/auth/login → "login"
  const segments = (req.query.path || [])
  const action = Array.isArray(segments) ? segments[0] : segments

  try {
    // ── POST /api/auth/login ──
    if (action === 'login' && req.method === 'POST') {
      const { email = '', password = '' } = req.body || {}
      const { data: u } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .single()
      if (!u || u.password !== password || u.archived) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      return res.status(200).json({ token: tokenFor(u.id), user: publicUser(u) })
    }

    // ── POST /api/auth/signup ──
    if (action === 'signup' && req.method === 'POST') {
      const { name = '', email = '', password = '' } = req.body || {}
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password required' })
      }
      const { data: existing } = await supabase
        .from('users').select('id').ilike('email', email).limit(1)
      if (existing?.length) {
        return res.status(409).json({ error: 'Email already registered' })
      }
      const id = 'u-' + Math.random().toString(36).slice(2, 9)
      await supabase.from('users').insert({
        id, name, email, password, role: 'admin', archived: false,
      })
      const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
      return res.status(201).json({ token: tokenFor(id), user: publicUser(u) })
    }

    // ── GET /api/auth/me ──
    if (action === 'me' && req.method === 'GET') {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
      const id = idFromToken(token)
      if (!id) return res.status(401).json({ error: 'Not authenticated' })
      const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
      if (!u) return res.status(401).json({ error: 'Not authenticated' })
      return res.status(200).json({ user: publicUser(u) })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('auth error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
