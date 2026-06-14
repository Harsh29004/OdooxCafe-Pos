// ---------------------------------------------------------------------------
// Kitchen.jsx — the Kitchen Display Screen (KDS).
// Opened on its own tab/device at /kitchen. Dark theme. Shows live tickets in
// three columns (To Cook → Preparing → Completed); tap to advance / tick items.
// ---------------------------------------------------------------------------
import { useState, useMemo } from 'react'
import { ChefHat, Search, Clock, Flame, CheckCircle2, Coffee } from 'lucide-react'
import { useStore, useSelectors } from './store.jsx'
import { t } from './ui.jsx'

const STAGES = [
  { id: 'to_cook', label: 'To Cook', icon: Clock, head: t.sky500, ring: 'rgba(14,165,233,0.4)', bg: 'rgba(14,165,233,0.1)' },
  { id: 'preparing', label: 'Preparing', icon: Flame, head: t.amber500, ring: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, head: t.emerald500, ring: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.1)' },
]

function ago(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

const darkField = {
  borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  padding: '8px 12px', fontSize: 14, color: t.white, outline: 'none',
}

export default function KitchenDisplay() {
  const { state, dispatch } = useStore()
  const { productById } = useSelectors()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const tickets = useMemo(() => [...state.kitchenTickets]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((tk) => ({
      ...tk,
      items: catFilter === 'all' ? tk.items : tk.items.filter((it) => productById(it.productId)?.categoryId === catFilter),
    }))
    .filter((tk) => tk.items.length > 0)
    .filter((tk) => {
      if (!q) return true
      return `${tk.number} ${tk.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())
    }), [state.kitchenTickets, q, catFilter]) // eslint-disable-line

  const byStage = (s) => tickets.filter((tk) => tk.stage === s)

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', flexDirection: 'column', background: t.slate900, color: t.slate100 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'grid', placeItems: 'center', height: 40, width: 40, borderRadius: 12, background: t.accent500 }}><ChefHat style={{ height: 24, width: 24, color: t.white }} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Kitchen Display</h1>
            <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>Live tickets · updates in real time</p>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
            <input style={{ ...darkField, width: 224, paddingLeft: 36 }} placeholder="Search ticket / item…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select style={darkField} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">All categories</option>
            {state.categories.map((c) => <option key={c.id} value={c.id} style={{ color: t.slate800 }}>{c.name}</option>)}
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', flex: 1, gap: 16, overflow: 'hidden', padding: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {STAGES.map((stage) => {
          const list = byStage(stage.id)
          return (
            <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 16, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: stage.head }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: t.white }}><stage.icon style={{ height: 20, width: 20 }} /> {stage.label}</div>
                <span style={{ borderRadius: 999, background: 'rgba(0,0,0,0.2)', padding: '2px 10px', fontSize: 14, fontWeight: 700, color: t.white }}>{list.length}</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.length === 0 ? (
                  <div style={{ display: 'grid', height: 128, placeItems: 'center', fontSize: 14, color: t.slate500 }}>No tickets</div>
                ) : list.map((tk) => (
                  <div key={tk.orderId} style={{ borderRadius: 12, border: `1px solid ${stage.ring}`, background: stage.bg, padding: 12 }}>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button onClick={() => dispatch({ type: 'KDS_ADVANCE', orderId: tk.orderId })} title={stage.id === 'completed' ? 'Completed' : 'Tap to advance stage'}
                        style={{ borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', fontSize: 14, fontWeight: 800, letterSpacing: '0.03em', color: t.white, cursor: 'pointer' }}>#{tk.number}</button>
                      <span style={{ fontSize: 12, color: t.slate400 }}>{ago(tk.createdAt)}</span>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {tk.items.map((it) => (
                        <li key={it.productId}>
                          <button onClick={() => dispatch({ type: 'KDS_TOGGLE_ITEM', orderId: tk.orderId, productId: it.productId })}
                            style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, borderRadius: 6, border: 'none', background: 'transparent', padding: '4px 6px', textAlign: 'left', fontSize: 14, color: 'inherit', cursor: 'pointer' }}>
                            <span style={{
                              display: 'grid', height: 20, width: 20, flexShrink: 0, placeItems: 'center', borderRadius: 4,
                              border: `1px solid ${it.done ? t.emerald400 : 'rgba(255,255,255,0.3)'}`, background: it.done ? t.emerald400 : 'transparent', color: t.slate900,
                            }}>{it.done && <CheckCircle2 style={{ height: 16, width: 16 }} />}</span>
                            <span style={{ fontWeight: 600, color: it.done ? t.slate500 : t.slate100, textDecoration: it.done ? 'line-through' : 'none' }}>{it.qty} × {it.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {stage.id !== 'completed' && (
                      <button onClick={() => dispatch({ type: 'KDS_ADVANCE', orderId: tk.orderId })}
                        style={{ marginTop: 8, width: '100%', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', padding: '6px 0', fontSize: 12, fontWeight: 600, color: t.white, cursor: 'pointer' }}>
                        Move to {stage.id === 'to_cook' ? 'Preparing →' : 'Completed →'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {state.kitchenTickets.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: t.slate600 }}>
            <Coffee style={{ height: 48, width: 48 }} />
            <p style={{ marginTop: 8, fontSize: 14 }}>Waiting for orders from the POS…</p>
          </div>
        </div>
      )}
    </div>
  )
}
