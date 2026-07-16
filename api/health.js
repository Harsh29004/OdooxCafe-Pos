// api/health.js — GET /api/health
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.status(200).json({ ok: true, ts: new Date().toISOString() })
}
