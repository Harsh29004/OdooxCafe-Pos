// api/orders/[[...path]].js — GET /api/orders and GET /api/orders/:id
// Consolidated into one function for Vercel Hobby plan limits.
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const segments = req.query.path || []
  const id = Array.isArray(segments) ? segments[0] : segments

  try {
    // GET /api/orders/:id
    if (id) {
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
    }

    // GET /api/orders?status=...&search=...
    const { status, search } = req.query || {}
    let query = supabase.from('orders').select('*').order('createdAt', { ascending: false })
    if (status) query = query.eq('status', status)

    const { data: ordersRaw } = await query
    const { data: allItems } = await supabase.from('order_items').select('orderId,productId,name,price,qty,tax')

    const itemsByOrder = {}
    for (const it of allItems || []) {
      ;(itemsByOrder[it.orderId] ||= []).push({
        productId: it.productId, name: it.name, price: it.price, qty: it.qty, tax: it.tax,
      })
    }

    let orders = (ordersRaw || []).map((o) => {
      let extra = {}
      try { extra = o.extra ? JSON.parse(o.extra) : {} } catch { /* ignore */ }
      const { extra: _drop, ...cols } = o
      return { ...extra, ...cols, items: itemsByOrder[o.id] || [] }
    })

    if (search) {
      const q = String(search).toLowerCase()
      orders = orders.filter((o) =>
        (o.number || '').toLowerCase().includes(q) ||
        o.items.some((it) => (it.name || '').toLowerCase().includes(q)),
      )
    }

    return res.status(200).json(orders)
  } catch (err) {
    console.error('orders error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
