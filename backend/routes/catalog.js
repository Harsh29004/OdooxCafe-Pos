// routes/catalog.js — read-only menu data straight from the relational tables.
import { Router } from 'express'
import { db } from '../db.js'

export const router = Router()

router.get('/categories', (_req, res) => {
  res.json(db.prepare('SELECT id,name,color FROM categories').all())
})

router.get('/products', (req, res) => {
  const { category } = req.query
  const rows = category
    ? db.prepare('SELECT * FROM products WHERE categoryId=?').all(category)
    : db.prepare('SELECT * FROM products').all()
  res.json(rows.map((p) => ({ ...p, kitchen: !!p.kitchen })))
})

router.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id)
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.json({ ...p, kitchen: !!p.kitchen })
})
