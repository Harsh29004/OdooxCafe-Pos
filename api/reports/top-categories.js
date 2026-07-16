// api/reports/top-categories.js — GET /api/reports/top-categories
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

    // Get products (for category mapping)
    const { data: products } = await supabase
      .from('products')
      .select('id,categoryId')

    const prodCat = {}
    for (const p of products || []) prodCat[p.id] = p.categoryId

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id,name,color')

    const catMap = {}
    for (const c of categories || []) catMap[c.id] = c

    // Get all order items
    const { data: allItems } = await supabase
      .from('order_items')
      .select('orderId,productId,price,qty')

    // Aggregate by category
    const agg = {}
    for (const it of allItems || []) {
      if (!paidIds.has(it.orderId)) continue
      const catId = prodCat[it.productId]
      if (!catId || !catMap[catId]) continue
      if (!agg[catId]) agg[catId] = { categoryId: catId, name: catMap[catId].name, color: catMap[catId].color, revenue: 0, qty: 0 }
      agg[catId].revenue += it.price * it.qty
      agg[catId].qty += it.qty
    }

    const rows = Object.values(agg)
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({ ...r, revenue: round2(r.revenue) }))

    return res.status(200).json(rows)
  } catch (err) {
    console.error('reports/top-categories error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
