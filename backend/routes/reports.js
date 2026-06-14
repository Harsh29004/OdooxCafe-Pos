// routes/reports.js — dashboard metrics computed live from paid orders.
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

router.get('/summary', (_req, res) => {
  const paid = db.prepare("SELECT id, amount, paymentMethod, createdAt, paidAt FROM orders WHERE status='paid'").all()
  const orderCount = paid.length

  // per-order total: use the stored amount, else compute from its line items
  const orderTotal = (o) => o.amount || db
    .prepare('SELECT COALESCE(SUM(price*qty*(1+tax/100.0)),0) AS t FROM order_items WHERE orderId=?')
    .get(o.id).t
  const totalSales = paid.reduce((s, o) => s + orderTotal(o), 0)

  const byMethod = {}
  for (const o of paid) {
    const m = o.paymentMethod || 'unknown'
    byMethod[m] = round2((byMethod[m] || 0) + orderTotal(o))
  }

  res.json({
    totalSales: round2(totalSales),
    orderCount,
    avgOrderValue: orderCount ? round2(totalSales / orderCount) : 0,
    byPaymentMethod: byMethod,
  })
})

router.get('/top-products', (_req, res) => {
  const rows = db.prepare(`
    SELECT oi.productId AS productId, oi.name AS name,
           SUM(oi.qty) AS qty, SUM(oi.price*oi.qty) AS revenue
    FROM order_items oi JOIN orders o ON o.id=oi.orderId
    WHERE o.status='paid'
    GROUP BY oi.productId ORDER BY qty DESC LIMIT 10`).all()
  res.json(rows.map((r) => ({ ...r, revenue: round2(r.revenue) })))
})

router.get('/top-categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.id AS categoryId, c.name AS name, c.color AS color,
           SUM(oi.price*oi.qty) AS revenue, SUM(oi.qty) AS qty
    FROM order_items oi
    JOIN orders o ON o.id=oi.orderId
    JOIN products p ON p.id=oi.productId
    JOIN categories c ON c.id=p.categoryId
    WHERE o.status='paid'
    GROUP BY c.id ORDER BY revenue DESC`).all()
  res.json(rows.map((r) => ({ ...r, revenue: round2(r.revenue) })))
})

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
