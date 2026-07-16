// api/state.js — GET + PUT /api/state (the main state bridge)
import { loadState, saveState } from './_lib/state.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const state = await loadState()
      return res.status(200).json(state)
    }

    if (req.method === 'PUT') {
      const state = req.body?.state ?? req.body
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'state required' })
      }
      await saveState(state)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('api/state error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
