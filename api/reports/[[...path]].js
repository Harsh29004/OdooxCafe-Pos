// api/reports/[[...path]].js — Handles /api/reports/summary, /api/reports/top-products, /api/reports/top-categories
// Consolidated into one function for Vercel Hobby plan limits.
import { supabase } from '../_lib/supabase.js'

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const segments = req.query.path || []
  const action = Array.isArray(segments) ? segments[0] : segments

  try {
    // ── GET /api/reports/summary ──
    if (action === 'summary') {
      const { data: paid } = await supabase
        .from('orders')
        .select('id,amount,paymentMethod,createdAt,paidAt')
        .eq('status', 'paid')

      const { data: allItems } = await supabase
        .from('order_items')
        .select('orderId,price,qty,tax')

      const itemsByOrder = {}
      for (const it of allItems || []) {
        ;(itemsByOrder[it.orderId] ||= []).push(it)
      }

      const orderCount = (paid || []).length
      const orderTotal = (o) => {
        if (o.amount) return o.amount
        const items = itemsByOrder[o.id] || []
        return items.reduce((s, it) => s + it.price * it.qty * (1 + it.tax / 100), 0)
      }

      const totalSales = (paid || []).reduce((s, o) => s + orderTotal(o), 0)
      const byMethod = {}
      for (const o of paid || []) {
        const m = o.paymentMethod || 'unknown'
        byMethod[m] = round2((byMethod[m] || 0) + orderTotal(o))
      }

      return res.status(200).json({
        totalSales: round2(totalSales),
        orderCount,
        avgOrderValue: orderCount ? round2(totalSales / orderCount) : 0,
        byPaymentMethod: byMethod,
      })
    }

    // ── GET /api/reports/top-products ──
    if (action === 'top-products') {
      const { data: paidOrders } = await supabase.from('orders').select('id').eq('status', 'paid')
      const paidIds = new Set((paidOrders || []).map((o) => o.id))

      const { data: allItems } = await supabase.from('order_items').select('orderId,productId,name,price,qty')

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
    }

    // ── GET /api/reports/top-categories ──
    if (action === 'top-categories') {
      const { data: paidOrders } = await supabase.from('orders').select('id').eq('status', 'paid')
      const paidIds = new Set((paidOrders || []).map((o) => o.id))

      const { data: products } = await supabase.from('products').select('id,categoryId')
      const prodCat = {}
      for (const p of products || []) prodCat[p.id] = p.categoryId

      const { data: categories } = await supabase.from('categories').select('id,name,color')
      const catMap = {}
      for (const c of categories || []) catMap[c.id] = c

      const { data: allItems } = await supabase.from('order_items').select('orderId,productId,price,qty')

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
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('reports error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
