// api/reports/top-products.js — GET /api/reports/top-products
import { supabase } from '../_lib/supabase.js'

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Get paid order IDs
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'paid')
    const paidIds = new Set((paidOrders || []).map((o) => o.id))

    // Get all order items
    const { data: allItems } = await supabase
      .from('order_items')
      .select('orderId,productId,name,price,qty')

    // Aggregate only items from paid orders
    const agg = {}
    for (const it of allItems || []) {
      if (!paidIds.has(it.orderId)) continue
      if (!agg[it.productId]) agg[it.productId] = { productId: it.productId, name: it.name, qty: 0, revenue: 0 }
      agg[it.productId].qty += it.qty
      agg[it.productId].revenue += it.price * it.qty
    }

    const rows = Object.values(agg)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
      .map((r) => ({ ...r, revenue: round2(r.revenue) }))

    return res.status(200).json(rows)
  } catch (err) {
    console.error('reports/top-products error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
