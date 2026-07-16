// api/reports/summary.js — GET /api/reports/summary
import { supabase } from '../_lib/supabase.js'

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
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
  } catch (err) {
    console.error('reports/summary error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
