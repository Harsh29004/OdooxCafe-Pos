// api/kds/tickets.js — GET /api/kds/tickets
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data: tickets } = await supabase
      .from('kitchen_tickets')
      .select('orderId,number,stage,createdAt')
      .order('createdAt')

    const { data: items } = await supabase
      .from('kitchen_ticket_items')
      .select('orderId,productId,name,qty,done')

    const result = (tickets || []).map((t) => ({
      ...t,
      items: (items || [])
        .filter((i) => i.orderId === t.orderId)
        .map((i) => ({ ...i, done: !!i.done })),
    }))

    return res.status(200).json(result)
  } catch (err) {
    console.error('kds/tickets error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
