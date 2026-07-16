// api/ai/suggestions.js — GET /api/ai/suggestions?cart=p-2,p-7
// Co-occurrence recommender built live from paid-order history,
// with a top-seller-in-category cold-start fallback.
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const cart = String(req.query.cart || '')
      .split(',').map((s) => s.trim()).filter(Boolean)
    const cartSet = new Set(cart)

    // Get paid order items for co-occurrence analysis
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'paid')
    const paidIds = new Set((paidOrders || []).map((o) => o.id))

    const { data: allItems } = await supabase
      .from('order_items')
      .select('orderId,productId')

    const byOrder = {}
    for (const r of allItems || []) {
      if (!paidIds.has(r.orderId)) continue
      ;(byOrder[r.orderId] ||= new Set()).add(r.productId)
    }

    const score = {}
    for (const set of Object.values(byOrder)) {
      const has = cart.some((id) => set.has(id))
      if (!has && cart.length) continue
      for (const pid of set) {
        if (cartSet.has(pid)) continue
        score[pid] = (score[pid] || 0) + 1
      }
    }

    let ranked = Object.entries(score).sort((a, b) => b[1] - a[1]).map(([id]) => id)

    // Cold start: fall back to top sellers in the same category
    if (ranked.length < 3 && cart.length) {
      const { data: cartProducts } = await supabase
        .from('products')
        .select('categoryId')
        .in('id', cart)
      const cats = [...new Set((cartProducts || []).map((r) => r.categoryId).filter(Boolean))]

      if (cats.length) {
        const { data: catProducts } = await supabase
          .from('products')
          .select('id')
          .in('categoryId', cats)
        const catProdIds = (catProducts || []).map((r) => r.id)

        // Count qty sold per product
        const qtySold = {}
        for (const it of allItems || []) {
          if (!paidIds.has(it.orderId)) continue
          if (!catProdIds.includes(it.productId)) continue
          qtySold[it.productId] = (qtySold[it.productId] || 0) + 1
        }

        const top = Object.entries(qtySold)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
        for (const id of top) if (!cartSet.has(id) && !ranked.includes(id)) ranked.push(id)
      }
    }

    const ids = ranked.slice(0, 3)
    if (!ids.length) return res.status(200).json([])

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
    const result = (products || [])
      .map((p) => ({ ...p, kitchen: !!p.kitchen }))
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))

    return res.status(200).json(result)
  } catch (err) {
    console.error('ai/suggestions error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
