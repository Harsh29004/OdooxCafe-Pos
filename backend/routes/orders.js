// routes/orders.js — read-only order history with optional status/search filters.
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

function hydrateOrder(o) {
  const items = db.prepare('SELECT productId,name,price,qty,tax FROM order_items WHERE orderId=?').all(o.id)
  let extra = {}
  try { extra = o.extra ? JSON.parse(o.extra) : {} } catch { /* ignore */ }
  const { extra: _drop, ...cols } = o
  return { ...extra, ...cols, items }
}

router.get('/', (req, res) => {
  const { status, search } = req.query
  let rows = status
    ? db.prepare('SELECT * FROM orders WHERE status=? ORDER BY createdAt DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all()
  let orders = rows.map(hydrateOrder)
  if (search) {
    const q = String(search).toLowerCase()
    orders = orders.filter((o) =>
      (o.number || '').toLowerCase().includes(q) ||
      o.items.some((it) => (it.name || '').toLowerCase().includes(q)),
    )
  }
  res.json(orders)
})

router.get('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id)
  if (!o) return res.status(404).json({ error: 'Not found' })
  res.json(hydrateOrder(o))
})
