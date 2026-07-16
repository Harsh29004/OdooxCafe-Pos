// api/auth/signup.js — POST /api/auth/signup
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
    const { name = '', email = '', password = '' } = req.body || {}
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password required' })
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .limit(1)
    if (existing?.length) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const id = 'u-' + Math.random().toString(36).slice(2, 9)
    await supabase.from('users').insert({
      id, name, email, password, role: 'admin', archived: false,
    })

    const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
    return res.status(201).json({ token: tokenFor(id), user: publicUser(u) })
  } catch (err) {
    console.error('signup error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
