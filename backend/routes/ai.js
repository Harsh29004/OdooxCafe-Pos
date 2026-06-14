// routes/ai.js — "Smart Suggestions": a product co-occurrence recommender built
// live from paid-order history, with a top-seller-in-category cold-start fallback.
//   GET /api/ai/suggestions?cart=p-2,p-7   ->  top 3 add-ons not already in cart
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

router.get('/suggestions', (req, res) => {
  const cart = String(req.query.cart || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  const cartSet = new Set(cart)

  // Build co-occurrence counts from paid orders.
  const rows = db.prepare(`
    SELECT oi.orderId AS orderId, oi.productId AS productId
    FROM order_items oi JOIN orders o ON o.id=oi.orderId
    WHERE o.status='paid'`).all()

  const byOrder = {}
  for (const r of rows) (byOrder[r.orderId] ||= new Set()).add(r.productId)

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

  // Cold start: fall back to top sellers in the same category as the cart.
  if (ranked.length < 3 && cart.length) {
    const cats = db.prepare(
      `SELECT DISTINCT categoryId FROM products WHERE id IN (${cart.map(() => '?').join(',')})`,
    ).all(...cart).map((r) => r.categoryId).filter(Boolean)
    if (cats.length) {
      const top = db.prepare(`
        SELECT p.id AS id, COALESCE(SUM(oi.qty),0) AS qty
        FROM products p LEFT JOIN order_items oi ON oi.productId=p.id
        WHERE p.categoryId IN (${cats.map(() => '?').join(',')})
        GROUP BY p.id ORDER BY qty DESC`).all(...cats).map((r) => r.id)
      for (const id of top) if (!cartSet.has(id) && !ranked.includes(id)) ranked.push(id)
    }
  }

  const ids = ranked.slice(0, 3)
  if (!ids.length) return res.json([])
  const products = db.prepare(
    `SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`,
  ).all(...ids).map((p) => ({ ...p, kitchen: !!p.kitchen }))
  // preserve ranked order
  products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  res.json(products)
})
