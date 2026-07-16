// api/products/[id].js — GET /api/products/:id
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id } = req.query
    const { data: p } = await supabase.from('products').select('*').eq('id', id).single()
    if (!p) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ ...p, kitchen: !!p.kitchen })
  } catch (err) {
    console.error('products/[id] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
