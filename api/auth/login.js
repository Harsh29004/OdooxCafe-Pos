// api/auth/login.js — POST /api/auth/login
import { supabase } from '../_lib/supabase.js'

const tokenFor = (id) => Buffer.from(`uid:${id}`).toString('base64')
const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role, archived: !!u.archived }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
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
  } catch (err) {
    console.error('login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
