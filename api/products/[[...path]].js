// api/products/[[...path]].js — GET /api/products and GET /api/products/:id
// Consolidated into one function for Vercel Hobby plan limits.
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const segments = req.query.path || []
  const id = Array.isArray(segments) ? segments[0] : segments

  try {
    // GET /api/products/:id
    if (id) {
      const { data: p } = await supabase.from('products').select('*').eq('id', id).single()
      if (!p) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json({ ...p, kitchen: !!p.kitchen })
    }

    // GET /api/products?category=...
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
