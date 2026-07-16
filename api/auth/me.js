// api/auth/me.js — GET /api/auth/me
import { supabase } from '../_lib/supabase.js'

const idFromToken = (t) => {
  try {
    const s = Buffer.from(String(t), 'base64').toString('utf8')
    return s.startsWith('uid:') ? s.slice(4) : null
  } catch { return null }
}
const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role, archived: !!u.archived }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const id = idFromToken(token)
    if (!id) return res.status(401).json({ error: 'Not authenticated' })

    const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
    if (!u) return res.status(401).json({ error: 'Not authenticated' })

    return res.status(200).json({ user: publicUser(u) })
  } catch (err) {
    console.error('auth/me error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
