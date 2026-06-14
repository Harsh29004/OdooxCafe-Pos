// routes/kds.js — read-only kitchen tickets (the live channel is the WebSocket).
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

router.get('/tickets', (_req, res) => {
  const tickets = db.prepare('SELECT orderId,number,stage,createdAt FROM kitchen_tickets ORDER BY createdAt').all()
  const items = db.prepare('SELECT orderId,productId,name,qty,done FROM kitchen_ticket_items').all()
  res.json(tickets.map((t) => ({
    ...t,
    items: items.filter((i) => i.orderId === t.orderId).map((i) => ({ ...i, done: !!i.done })),
  })))
})
