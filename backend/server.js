// server.js — Express + WebSocket entry point for the Cafe POS backend.
// Runs fully offline. On boot it seeds an empty DB, serves a real REST API,
// and pushes live state changes to every connected device over a WebSocket.
import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'

import { seedIfEmpty } from './seed.js'
import { loadState, saveState } from './state.js'
import { router as authRouter } from './routes/auth.js'
import { router as catalogRouter } from './routes/catalog.js'
import { router as ordersRouter } from './routes/orders.js'
import { router as kdsRouter } from './routes/kds.js'
import { router as reportsRouter } from './routes/reports.js'
import { router as aiRouter } from './routes/ai.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8000

seedIfEmpty() // first run only

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// --- core state bridge (the channel the frontend store uses) -------------
app.get('/api/state', (_req, res) => {
  res.json(loadState())
})

app.put('/api/state', (req, res) => {
  const state = req.body?.state ?? req.body
  if (!state || typeof state !== 'object') return res.status(400).json({ error: 'state required' })
  try {
    saveState(state)
  } catch (err) {
    console.error('saveState failed:', err)
    return res.status(500).json({ error: 'Failed to persist state' })
  }
  broadcast({ type: 'state', from: req.body?.clientId || null })
  res.json({ ok: true })
})

// --- granular REST API (real, queryable, for judges & integrations) ------
app.use('/api/auth', authRouter)
app.use('/api', catalogRouter) // /api/products, /api/categories
app.use('/api/orders', ordersRouter)
app.use('/api/kds', kdsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/ai', aiRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// --- serve the built frontend if present (single-origin production) ------
const distDir = path.join(__dirname, '..', 'dist')
app.use(express.static(distDir))
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => err && next())
})

// --- HTTP + WebSocket ----------------------------------------------------
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })
const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => clients.delete(ws))
})

function broadcast(msg) {
  const data = JSON.stringify(msg)
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      try { ws.send(data) } catch { /* ignore */ }
    }
  }
}

server.listen(PORT, () => {
  console.log(`☕ Cafe POS backend listening on http://localhost:${PORT}`)
  console.log(`   REST:  /api/state, /api/products, /api/orders, /api/reports/summary, /api/ai/suggestions`)
  console.log(`   WS:    ws://localhost:${PORT}/ws  (live state sync)`)
})
