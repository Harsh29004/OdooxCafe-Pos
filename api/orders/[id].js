// api/orders/[id].js — GET /api/orders/:id
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id } = req.query
    const { data: o } = await supabase.from('orders').select('*').eq('id', id).single()
    if (!o) return res.status(404).json({ error: 'Not found' })

    const { data: items } = await supabase
      .from('order_items')
      .select('productId,name,price,qty,tax')
      .eq('orderId', o.id)

    let extra = {}
    try { extra = o.extra ? JSON.parse(o.extra) : {} } catch { /* ignore */ }
    const { extra: _drop, ...cols } = o

    return res.status(200).json({ ...extra, ...cols, items: items || [] })
  } catch (err) {
    console.error('orders/[id] error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
