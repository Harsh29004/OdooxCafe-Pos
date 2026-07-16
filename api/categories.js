// api/categories.js — GET /api/categories
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data } = await supabase.from('categories').select('id,name,color')
    return res.status(200).json(data || [])
  } catch (err) {
    console.error('categories error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
