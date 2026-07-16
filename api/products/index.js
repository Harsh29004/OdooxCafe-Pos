// api/products.js — GET /api/products (with optional ?category= filter)
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { category } = req.query || {}
    let query = supabase.from('products').select('*')
    if (category) query = query.eq('categoryId', category)

    const { data } = await query
    const rows = (data || []).map((p) => ({ ...p, kitchen: !!p.kitchen }))
    return res.status(200).json(rows)
  } catch (err) {
    console.error('products error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
