// ---------------------------------------------------------------------------
// Admin.jsx — the whole "backend" admin area:
//   <AdminLayout/>  the sidebar shell (wraps the pages below via <Outlet/>)
//   <Reports/>       sales dashboard with charts
//   <Products/> <Categories/> <PaymentMethods/> <Coupons/> <Tables/> <Users/>
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  LayoutDashboard, Package, Tags, CreditCard, TicketPercent, Armchair,
  Users as UsersIcon, ChefHat, LogOut, Coffee, Store, ExternalLink, RotateCcw,
  TrendingUp, ShoppingBag, IndianRupee, Receipt, Download, FileText,
  Plus, Pencil, Trash2, Search, Banknote, QrCode as QrIcon, Check,
  Ticket, Zap, Layers, KeyRound, Archive, ArchiveRestore,
} from 'lucide-react'
import { useStore, useSelectors, computeCart, money } from './store.jsx'
import {
  t, shadow, cardStyle, Button, IconButton, Input, Select, Textarea, Field,
  Modal, Toggle, Badge, EmptyState, PageHeader, labelStyle,
} from './ui.jsx'

// small helper: hover state for rows/cards (replaces Tailwind group-hover)
function useHover() {
  const [h, setH] = useState(false)
  return [h, { onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) }]
}

/* =====================================================================
 * AdminLayout — sidebar + top bar + page area
 * ===================================================================== */
const NAV = [
  { to: 'reports', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'products', label: 'Products', icon: Package },
  { to: 'categories', label: 'Category', icon: Tags },
  { to: 'payments', label: 'Payment Method', icon: CreditCard },
  { to: 'coupons', label: 'Coupon & Promotion', icon: TicketPercent },
  { to: 'tables', label: 'Booking / Tables', icon: Armchair },
  { to: 'users', label: 'User / Employee', icon: UsersIcon },
]

function SidebarLink({ active, children, onMouseEnter, onMouseLeave, hover, ...props }) {
  return (
    <a {...props} style={{
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, padding: '10px 12px',
      fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all .15s',
      background: active || hover ? 'rgba(255,255,255,0.15)' : 'transparent',
      color: active || hover ? t.white : 'rgba(255,255,255,0.7)',
    }}>{children}</a>
  )
}

export function AdminLayout() {
  const { dispatch } = useStore()
  const { currentUser } = useSelectors()
  const navigate = useNavigate()

  const logout = () => { dispatch({ type: 'LOGOUT' }); navigate('/login', { replace: true }) }
  const resetDemo = () => {
    if (window.confirm('Reset all demo data back to the seeded sample? This clears your changes.')) {
      dispatch({ type: 'RESET_DEMO' })
      navigate('/login', { replace: true })
    }
  }

  const iconStyle = { height: 18, width: 18, flexShrink: 0 }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.slate100 }}>
      {/* Sidebar */}
      <aside style={{ display: 'flex', width: 256, flexShrink: 0, flexDirection: 'column', background: t.brand700, color: t.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px' }}>
          <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
            <Coffee style={{ height: 20, width: 20 }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, lineHeight: 1, margin: 0 }}>BrewMatic</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>Backend</p>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <SidebarLinkInner active={isActive}><Icon style={iconStyle} />{label}</SidebarLinkInner>
              )}
            </NavLink>
          ))}

          <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          <ExternalNavLink href="/kitchen" target="_blank" rel="noreferrer">
            <ChefHat style={iconStyle} /> Kitchen Display
            <ExternalLink style={{ marginLeft: 'auto', height: 14, width: 14, opacity: 0.6 }} />
          </ExternalNavLink>
          <RouterNavLink to="/pos"><Store style={iconStyle} /> Open POS Terminal</RouterNavLink>
        </nav>

        <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarButton onClick={resetDemo}><RotateCcw style={iconStyle} /> Reset demo data</SidebarButton>
          <SidebarButton onClick={logout} danger><LogOut style={iconStyle} /> Log Out</SidebarButton>
        </div>
      </aside>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate200}`, background: t.white, padding: '12px 24px' }}>
          <p style={{ fontSize: 14, color: t.slate400, margin: 0 }}>Backend Configuration</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.slate700, margin: 0 }}>{currentUser?.name}</p>
              <p style={{ fontSize: 12, color: t.slate400, margin: 0, textTransform: 'capitalize' }}>{currentUser?.role}</p>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, borderRadius: 999, background: t.brand100, fontWeight: 700, color: t.brand600 }}>
              {currentUser?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Sidebar entries with their own hover state
function SidebarLinkInner({ active, children }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, padding: '10px 12px',
      fontSize: 14, fontWeight: 500, transition: 'all .15s',
      background: active || hover ? 'rgba(255,255,255,0.15)' : 'transparent',
      color: active || hover ? t.white : 'rgba(255,255,255,0.7)',
    }}>{children}</div>
  )
}
function ExternalNavLink({ children, ...props }) {
  const [hover, bind] = useHover()
  return (
    <a {...props} {...bind} style={{
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, padding: '10px 12px',
      fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all .15s',
      background: hover ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: hover ? t.white : 'rgba(255,255,255,0.7)',
    }}>{children}</a>
  )
}
function RouterNavLink({ to, children }) {
  const [hover, bind] = useHover()
  return (
    <Link to={to} {...bind} style={{
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, padding: '10px 12px',
      fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all .15s',
      background: hover ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: hover ? t.white : 'rgba(255,255,255,0.7)',
    }}>{children}</Link>
  )
}
function SidebarButton({ children, danger, ...props }) {
  const [hover, bind] = useHover()
  return (
    <button {...props} {...bind} style={{
      display: 'flex', width: '100%', alignItems: 'center', gap: 12, borderRadius: 8, padding: '10px 12px',
      fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all .15s',
      background: hover ? (danger ? 'rgba(244,63,94,0.8)' : 'rgba(255,255,255,0.1)') : 'transparent',
      color: hover ? t.white : (danger ? t.rose50 : 'rgba(255,255,255,0.7)'),
    }}>{children}</button>
  )
}

/* =====================================================================
 * Reports — sales dashboard
 * ===================================================================== */
function orderAmount(order, state) {
  const coupon = order.couponId ? state.coupons.find((c) => c.id === order.couponId) : null
  return computeCart(order.items || [], { coupon, promotions: state.promotions }).total
}
function inPeriod(dateStr, period) {
  const d = new Date(dateStr)
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w }
  if (period === 'month') { const m = new Date(now); m.setMonth(now.getMonth() - 1); return d >= m }
  return true
}
const PIE_FALLBACK = ['#714B67', '#2E7D6F', '#E07B05', '#2563EB', '#DB2777', '#0891B2']

export function Reports() {
  const { state } = useStore()
  const { categoryById, productById, userById } = useSelectors()
  const [period, setPeriod] = useState('month')
  const [employee, setEmployee] = useState('all')
  const [product, setProduct] = useState('all')

  const data = useMemo(() => {
    let paid = state.orders.filter((o) => o.status === 'paid')
    paid = paid.filter((o) => inPeriod(o.paidAt || o.createdAt, period))
    if (employee !== 'all') paid = paid.filter((o) => o.employeeId === employee)
    if (product !== 'all') paid = paid.filter((o) => (o.items || []).some((i) => i.productId === product))

    const withAmt = paid.map((o) => ({ ...o, amount: orderAmount(o, state) }))
    const revenue = withAmt.reduce((s, o) => s + o.amount, 0)
    const totalOrders = withAmt.length
    const aov = totalOrders ? revenue / totalOrders : 0

    const byDay = {}
    withAmt.forEach((o) => {
      const key = new Date(o.paidAt || o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      byDay[key] = byDay[key] || { date: key, revenue: 0, orders: 0 }
      byDay[key].revenue += o.amount
      byDay[key].orders += 1
    })
    const trend = Object.values(byDay)

    const catMap = {}
    const prodMap = {}
    withAmt.forEach((o) => {
      ;(o.items || []).forEach((it) => {
        const p = productById(it.productId)
        const catId = p?.categoryId
        const lineRev = it.price * it.qty
        if (catId) {
          catMap[catId] = catMap[catId] || { id: catId, revenue: 0, qty: 0 }
          catMap[catId].revenue += lineRev
          catMap[catId].qty += it.qty
        }
        prodMap[it.productId] = prodMap[it.productId] || { id: it.productId, name: it.name, revenue: 0, qty: 0 }
        prodMap[it.productId].revenue += lineRev
        prodMap[it.productId].qty += it.qty
      })
    })

    const topCategories = Object.values(catMap)
      .map((c) => ({ ...c, name: categoryById(c.id)?.name || '—', color: categoryById(c.id)?.color }))
      .sort((a, b) => b.revenue - a.revenue)
    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
    const topOrders = [...withAmt].sort((a, b) => b.amount - a.amount).slice(0, 6)

    return { revenue, totalOrders, aov, trend, topCategories, topProducts, topOrders }
  }, [state, period, employee, product]) // eslint-disable-line

  const exportCSV = () => {
    const rows = [['Order', 'Date', 'Employee', 'Amount']]
    data.topOrders.forEach((o) => rows.push([o.number, new Date(o.paidAt || o.createdAt).toLocaleString(), userById(o.employeeId)?.name || '', o.amount]))
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cafe-report.xls'
    a.click()
  }

  const periods = [{ v: 'today', l: 'Today' }, { v: 'week', l: 'This Week' }, { v: 'month', l: 'This Month' }, { v: 'all', l: 'All Time' }]
  const ico = { height: 16, width: 16 }

  return (
    <div>
      <PageHeader title="Sales Dashboard" subtitle="Real-time insights — everything updates as you change filters.">
        <Button variant="outline" onClick={() => window.print()}><FileText style={ico} /> PDF</Button>
        <Button variant="outline" onClick={exportCSV}><Download style={ico} /> XLS</Button>
      </PageHeader>

      {/* Filters */}
      <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', borderRadius: 8, border: `1px solid ${t.slate200}`, background: t.white, padding: 4 }}>
          {periods.map(({ v, l }) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              borderRadius: 6, padding: '6px 12px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: period === v ? t.brand500 : 'transparent', color: period === v ? t.white : t.slate500,
            }}>{l}</button>
          ))}
        </div>
        <Select style={{ maxWidth: 192 }} value={employee} onChange={(e) => setEmployee(e.target.value)}>
          <option value="all">All Employees</option>
          {state.users.filter((u) => u.role === 'employee').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select style={{ maxWidth: 192 }} value={product} onChange={(e) => setProduct(e.target.value)}>
          <option value="all">All Products</option>
          {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Metric icon={ShoppingBag} label="Total Orders" value={data.totalOrders} color={t.brand500} />
        <Metric icon={IndianRupee} label="Revenue" value={money(data.revenue)} color={t.emerald500} />
        <Metric icon={Receipt} label="Avg. Order Value" value={money(data.aov)} color={t.accent500} />
      </div>

      {/* Charts */}
      <div style={{ marginTop: 24, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ ...cardStyle, padding: 20, gridColumn: 'span 2 / span 2', minWidth: 0 }}>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: t.slate800 }}>
            <TrendingUp style={{ height: 20, width: 20, color: t.brand500 }} /> Sales Trend
          </h3>
          <div style={{ height: 256 }}>
            {data.trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ left: -10, right: 10, top: 5 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#714B67" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#714B67" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#714B67" strokeWidth={2.5} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 20, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: t.slate800 }}>Top Categories</h3>
          <div style={{ height: 256 }}>
            {data.topCategories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.topCategories} dataKey="revenue" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {data.topCategories.map((c, i) => <Cell key={c.id} fill={c.color || PIE_FALLBACK[i % PIE_FALLBACK.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ marginTop: 24, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <TableCard title="Top Orders">
          <Th cols={['Order', 'Employee', 'Amount']} />
          <tbody>
            {data.topOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: `1px solid ${t.slate50}` }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: t.slate700 }}>{o.number}</td>
                <td style={{ ...tdStyle, color: t.slate500 }}>{userById(o.employeeId)?.name || '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: t.slate800 }}>{money(o.amount)}</td>
              </tr>
            ))}
            {!data.topOrders.length && <EmptyRow cols={3} />}
          </tbody>
        </TableCard>

        <TableCard title="Top Products">
          <Th cols={['Product', 'Qty', 'Revenue']} />
          <tbody>
            {data.topProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${t.slate50}` }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: t.slate700 }}>{p.name}</td>
                <td style={{ ...tdStyle, color: t.slate500 }}>{p.qty}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: t.slate800 }}>{money(p.revenue)}</td>
              </tr>
            ))}
            {!data.topProducts.length && <EmptyRow cols={3} />}
          </tbody>
        </TableCard>

        <TableCard title="Category-wise Revenue" full>
          <Th cols={['Category', 'Items Sold', 'Revenue', 'Share']} />
          <tbody>
            {data.topCategories.map((c) => {
              const totalRev = data.topCategories.reduce((s, x) => s + x.revenue, 0)
              const share = totalRev ? Math.round((c.revenue / totalRev) * 100) : 0
              const color = c.color || '#714B67'
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${t.slate50}` }}>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, background: color + '22', color }}>
                      <span style={{ height: 6, width: 6, borderRadius: 999, background: color }} /> {c.name}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: t.slate500 }}>{c.qty}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: t.slate800 }}>{money(c.revenue)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 8, width: 96, overflow: 'hidden', borderRadius: 999, background: t.slate100 }}>
                        <div style={{ height: '100%', borderRadius: 999, width: `${share}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 12, color: t.slate400 }}>{share}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!data.topCategories.length && <EmptyRow cols={4} />}
          </tbody>
        </TableCard>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{ display: 'grid', placeItems: 'center', height: 48, width: 48, borderRadius: 12, color: t.white, background: color }}>
        <Icon style={{ height: 24, width: 24 }} />
      </div>
      <div>
        <p style={{ fontSize: 14, color: t.slate400, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: t.slate800, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}
const thStyle = { padding: '10px 16px', fontWeight: 600 }
const tdStyle = { padding: '10px 16px' }
function TableCard({ title, children, full }) {
  return (
    <div style={{ ...cardStyle, overflow: 'hidden', gridColumn: full ? 'span 2 / span 2' : undefined, minWidth: 0 }}>
      <div style={{ borderBottom: `1px solid ${t.slate100}`, padding: '12px 16px' }}>
        <h3 style={{ margin: 0, fontWeight: 700, color: t.slate800 }}>{title}</h3>
      </div>
      <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>{children}</table>
    </div>
  )
}
function Th({ cols }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${t.slate100}`, background: t.slate50, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate500 }}>
        {cols.map((c, i) => <th key={c} style={{ ...thStyle, textAlign: i === cols.length - 1 && i > 0 ? 'right' : 'left' }}>{c}</th>)}
      </tr>
    </thead>
  )
}
function EmptyRow({ cols }) {
  return <tr><td colSpan={cols} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 14, color: t.slate400 }}>No data for this filter</td></tr>
}
function NoData() {
  return <div style={{ display: 'grid', height: '100%', placeItems: 'center', fontSize: 14, color: t.slate400 }}>No data for this filter</div>
}

/* =====================================================================
 * Products
 * ===================================================================== */
const UOMS = ['piece', 'kg', 'litre', 'plate', 'cup']
const blankProduct = { name: '', categoryId: '', price: '', uom: 'piece', tax: 5, description: '', kitchen: true }

export function Products() {
  const { state, dispatch } = useStore()
  const { categoryById } = useSelectors()
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')
  const [newCat, setNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const filtered = useMemo(
    () => state.products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [state.products, q],
  )

  const openNew = () => { setModal({ ...blankProduct, categoryId: state.categories[0]?.id || '' }); setNewCat(false); setNewCatName('') }
  const save = () => {
    if (!modal.name.trim() || modal.price === '') return
    let categoryId = modal.categoryId
    if (newCat && newCatName.trim()) {
      categoryId = 'cat-' + Math.random().toString(36).slice(2, 9)
      dispatch({ type: 'ADD_CATEGORY', data: { id: categoryId, name: newCatName.trim(), color: '#714B67' } })
    }
    const data = {
      name: modal.name.trim(), categoryId, price: Number(modal.price), uom: modal.uom,
      tax: Number(modal.tax) || 0, description: modal.description, kitchen: !!modal.kitchen,
    }
    if (modal.id) dispatch({ type: 'UPDATE_PRODUCT', id: modal.id, data })
    else dispatch({ type: 'ADD_PRODUCT', data })
    setModal(null)
  }
  const remove = (id) => { if (window.confirm('Delete this product?')) dispatch({ type: 'DELETE_PRODUCT', id }) }

  return (
    <div>
      <PageHeader title="Products" subtitle={`${state.products.length} items in your menu`}>
        <Button onClick={openNew}><Plus style={{ height: 16, width: 16 }} /> New Product</Button>
      </PageHeader>

      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 384 }}>
        <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
        <Input style={{ paddingLeft: 36 }} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products found" subtitle="Try a different search or add a new product." />
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.slate100}`, background: t.slate50, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate500 }}>
                {['Product', 'Category', 'Price', 'UoM', 'Tax', 'Kitchen', ''].map((h, i) => <th key={i} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRow key={p.id} p={p} cat={categoryById(p.categoryId)}
                  onEdit={() => { setModal({ ...p, price: String(p.price) }); setNewCat(false) }} onDelete={() => remove(p.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Product' : 'New Product'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save Product</Button></>}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Name">
              <Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Cappuccino" />
            </Field>
            <Field label="Category">
              {!newCat ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Select value={modal.categoryId} onChange={(e) => setModal({ ...modal, categoryId: e.target.value })}>
                    {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Button variant="outline" onClick={() => setNewCat(true)}><Plus style={{ height: 16, width: 16 }} /> New</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input autoFocus placeholder="New category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                  <Button variant="ghost" onClick={() => { setNewCat(false); setNewCatName('') }}>Cancel</Button>
                </div>
              )}
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Price (₹)"><Input type="number" min="0" value={modal.price} onChange={(e) => setModal({ ...modal, price: e.target.value })} placeholder="0" /></Field>
              <Field label="Tax (%)"><Input type="number" min="0" value={modal.tax} onChange={(e) => setModal({ ...modal, tax: e.target.value })} /></Field>
            </div>
            <Field label="Unit of Measure">
              <Select value={modal.uom} onChange={(e) => setModal({ ...modal, uom: e.target.value })}>
                {UOMS.map((u) => <option key={u} value={u}>per {u}</option>)}
              </Select>
            </Field>
            <Field label="Description">
              <Textarea rows={2} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} placeholder="Optional notes shown on the product." />
            </Field>
            <label style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 12, borderRadius: 8, border: `1px solid ${t.slate200}`, padding: 12 }}>
              <input type="checkbox" style={{ height: 16, width: 16, accentColor: t.brand500 }} checked={modal.kitchen} onChange={(e) => setModal({ ...modal, kitchen: e.target.checked })} />
              <span style={{ fontSize: 14, fontWeight: 500, color: t.slate700 }}>Send to Kitchen Display when ordered</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ProductRow({ p, cat, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <tr {...bind} style={{ borderBottom: `1px solid ${t.slate50}`, background: hover ? t.slate50 : 'transparent' }}>
      <td style={tdStyle}>
        <p style={{ margin: 0, fontWeight: 600, color: t.slate800 }}>{p.name}</p>
        {p.description && <p style={{ margin: 0, fontSize: 12, color: t.slate400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{p.description}</p>}
      </td>
      <td style={tdStyle}>
        {cat ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, background: cat.color + '22', color: cat.color }}>
            <span style={{ height: 6, width: 6, borderRadius: 999, background: cat.color }} /> {cat.name}
          </span>
        ) : <span style={{ color: t.slate400 }}>—</span>}
      </td>
      <td style={{ ...tdStyle, fontWeight: 600, color: t.slate700 }}>{money(p.price)}</td>
      <td style={{ ...tdStyle, color: t.slate500 }}>per {p.uom}</td>
      <td style={{ ...tdStyle, color: t.slate500 }}>{p.tax}%</td>
      <td style={tdStyle}>{p.kitchen ? <Badge color="amber"><ChefHat style={{ height: 12, width: 12 }} /> KDS</Badge> : <span style={{ color: t.slate300 }}>—</span>}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
          <IconButton onClick={onEdit}><Pencil style={{ height: 16, width: 16 }} /></IconButton>
          <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
        </div>
      </td>
    </tr>
  )
}

/* =====================================================================
 * Categories
 * ===================================================================== */
const PALETTE = ['#714B67', '#2E7D6F', '#E07B05', '#C2410C', '#2563EB', '#DB2777', '#0891B2', '#65A30D', '#9333EA', '#DC2626']

export function Categories() {
  const { state, dispatch } = useStore()
  const [modal, setModal] = useState(null)

  const save = () => {
    if (!modal.name.trim()) return
    if (modal.id) dispatch({ type: 'UPDATE_CATEGORY', id: modal.id, data: { name: modal.name, color: modal.color } })
    else dispatch({ type: 'ADD_CATEGORY', data: { name: modal.name, color: modal.color } })
    setModal(null)
  }
  const remove = (id) => {
    if (window.confirm('Delete this category? Products keep their reference but lose the color.')) dispatch({ type: 'DELETE_CATEGORY', id })
  }
  const countFor = (id) => state.products.filter((p) => p.categoryId === id).length

  return (
    <div>
      <PageHeader title="Categories" subtitle="Colors appear on POS product cards, filter tabs and the order view.">
        <Button onClick={() => setModal({ name: '', color: PALETTE[0] })}><Plus style={{ height: 16, width: 16 }} /> New Category</Button>
      </PageHeader>

      {state.categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" subtitle="Create one to start grouping products." />
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {state.categories.map((c) => (
            <CategoryCard key={c.id} c={c} count={countFor(c.id)} onEdit={() => setModal({ ...c })} onDelete={() => remove(c.id)} />
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Category' : 'New Category'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Name"><Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Coffee" /></Field>
            <Field label="Color">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PALETTE.map((color) => (
                  <button key={color} onClick={() => setModal({ ...modal, color })} style={{
                    height: 36, width: 36, borderRadius: 8, cursor: 'pointer', background: color,
                    border: 'none', outline: modal.color === color ? `2px solid ${t.slate800}` : 'none', outlineOffset: 2,
                  }} />
                ))}
                <input type="color" value={modal.color} onChange={(e) => setModal({ ...modal, color: e.target.value })}
                  style={{ height: 36, width: 36, cursor: 'pointer', borderRadius: 8, border: `1px solid ${t.slate200}` }} />
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CategoryCard({ c, count, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{ height: 8, background: c.color }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ height: 36, width: 36, borderRadius: 8, background: c.color }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: t.slate800 }}>{c.name}</p>
            <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{count} products</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
          <IconButton onClick={onEdit}><Pencil style={{ height: 16, width: 16 }} /></IconButton>
          <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
        </div>
      </div>
    </div>
  )
}

/* =====================================================================
 * Payment Methods
 * ===================================================================== */
export function PaymentMethods() {
  const { state, dispatch } = useStore()
  const pm = state.paymentMethods
  const [upiId, setUpiId] = useState(pm.upi.upiId || '')
  const [qr, setQr] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!upiId) return setQr('')
    const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('BrewMatic')}&cu=INR`
    QRCode.toDataURL(uri, { width: 220, margin: 1, color: { dark: '#2a1b27', light: '#ffffff' } }).then(setQr)
  }, [upiId])

  const set = (key, data) => dispatch({ type: 'UPDATE_PAYMENT_METHODS', data: { [key]: { ...pm[key], ...data } } })
  const saveUpi = () => { set('upi', { upiId }); setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <div>
      <PageHeader title="Payment Methods" subtitle="Enable the methods your cashiers can accept at checkout." />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <MethodCard icon={Banknote} title="Cash" desc="Accept cash. Cashier enters amount received; change is calculated." color={{ bg: t.emerald100, fg: t.emerald600 }} enabled={pm.cash.enabled} onToggle={(v) => set('cash', { enabled: v })} />
        <MethodCard icon={CreditCard} title="Digital / Card" desc="Represents card and bank payments. Cashier records a transaction reference." color={{ bg: t.blue100, fg: t.blue600 }} enabled={pm.card.enabled} onToggle={(v) => set('card', { enabled: v })} />
        <MethodCard icon={QrIcon} title="UPI QR" desc="A QR is generated from your UPI ID at the payment screen." color={{ bg: t.brand100, fg: t.brand600 }} enabled={pm.upi.enabled} onToggle={(v) => set('upi', { enabled: v })} />
      </div>

      {pm.upi.enabled && (
        <div style={{ ...cardStyle, marginTop: 24, maxWidth: 672, padding: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontWeight: 700, color: t.slate800 }}>UPI Configuration</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: t.slate500 }}>Save your UPI ID — the system generates the payment QR dynamically.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Field label="UPI ID"><Input placeholder="cafe@ybl" value={upiId} onChange={(e) => setUpiId(e.target.value)} /></Field>
              <Button style={{ marginTop: 12 }} onClick={saveUpi}>{saved ? <><Check style={{ height: 16, width: 16 }} /> Saved</> : 'Save UPI ID'}</Button>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              {qr ? <img src={qr} alt="UPI QR preview" style={{ height: 160, width: 160, borderRadius: 12, border: `1px solid ${t.slate200}`, padding: 8 }} />
                : <div style={{ display: 'grid', height: 160, width: 160, placeItems: 'center', borderRadius: 12, border: `2px dashed ${t.slate200}`, fontSize: 12, color: t.slate400 }}>Enter a UPI ID</div>}
              <p style={{ marginTop: 8, fontSize: 12, color: t.slate400 }}>Live preview</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MethodCard({ icon: Icon, title, desc, enabled, onToggle, color }) {
  return (
    <div style={{ ...cardStyle, padding: 20, opacity: enabled ? 1 : 0.8, outline: enabled ? `1px solid ${t.brand200}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', placeItems: 'center', height: 44, width: 44, borderRadius: 12, background: color.bg, color: color.fg }}>
          <Icon style={{ height: 20, width: 20 }} />
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={title} />
      </div>
      <h3 style={{ margin: '12px 0 0', fontWeight: 700, color: t.slate800 }}>{title}</h3>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: t.slate500 }}>{desc}</p>
      <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 600, color: enabled ? t.emerald600 : t.slate400 }}>{enabled ? '● Enabled at checkout' : '○ Disabled'}</p>
    </div>
  )
}

/* =====================================================================
 * Coupons & Promotions
 * ===================================================================== */
export function Coupons() {
  const { state, dispatch } = useStore()
  const { productById } = useSelectors()
  const [couponModal, setCouponModal] = useState(null)
  const [promoModal, setPromoModal] = useState(null)

  const saveCoupon = () => {
    const data = { code: couponModal.code.trim().toUpperCase(), discountType: couponModal.discountType, value: Number(couponModal.value) || 0 }
    if (!data.code) return
    if (couponModal.id) dispatch({ type: 'UPDATE_COUPON', id: couponModal.id, data })
    else dispatch({ type: 'ADD_COUPON', data })
    setCouponModal(null)
  }
  const savePromo = () => {
    const m = promoModal
    const data = {
      name: m.name.trim(), appliesTo: m.appliesTo,
      productId: m.appliesTo === 'product' ? m.productId : null,
      minQty: m.appliesTo === 'product' ? Number(m.minQty) || 1 : null,
      minAmount: m.appliesTo === 'order' ? Number(m.minAmount) || 0 : null,
      discountType: m.discountType, value: Number(m.value) || 0,
    }
    if (!data.name) return
    if (m.id) dispatch({ type: 'UPDATE_PROMO', id: m.id, data })
    else dispatch({ type: 'ADD_PROMO', data })
    setPromoModal(null)
  }
  const fmtValue = (ty, v) => (ty === 'percent' ? `${v}% off` : `${money(v)} off`)

  return (
    <div>
      <PageHeader title="Coupons & Promotions" subtitle="Manual coupon codes and automatic promotions." />

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Coupons */}
        <section>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: t.slate800, margin: 0 }}>
              <Ticket style={{ height: 20, width: 20, color: t.brand500 }} /> Coupon Codes
            </h2>
            <Button variant="outline" onClick={() => setCouponModal({ code: '', discountType: 'percent', value: 10 })}><Plus style={{ height: 16, width: 16 }} /> Add</Button>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: t.slate500 }}>Entered manually by the cashier to redeem.</p>

          {state.coupons.length === 0 ? <EmptyState icon={Ticket} title="No coupons" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.coupons.map((c) => (
                <CouponRow key={c.id} onEdit={() => setCouponModal({ ...c })} onDelete={() => dispatch({ type: 'DELETE_COUPON', id: c.id })}>
                  <span style={{ borderRadius: 8, border: `2px dashed ${t.brand300}`, background: t.brand50, padding: '6px 12px', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', color: t.brand700 }}>{c.code}</span>
                  <Badge color="purple">{fmtValue(c.discountType, c.value)}</Badge>
                </CouponRow>
              ))}
            </div>
          )}
        </section>

        {/* Promotions */}
        <section>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: t.slate800, margin: 0 }}>
              <Zap style={{ height: 20, width: 20, color: t.accent500 }} /> Automated Promotions
            </h2>
            <Button variant="outline" onClick={() => setPromoModal({ name: '', appliesTo: 'order', productId: state.products[0]?.id || '', minQty: 3, minAmount: 500, discountType: 'percent', value: 10 })}><Plus style={{ height: 16, width: 16 }} /> Add</Button>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: t.slate500 }}>Trigger automatically — no code needed.</p>

          {state.promotions.length === 0 ? <EmptyState icon={Zap} title="No promotions" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.promotions.map((p) => (
                <PromoRow key={p.id} onEdit={() => setPromoModal({ ...p })} onDelete={() => dispatch({ type: 'DELETE_PROMO', id: p.id })}>
                  <p style={{ margin: 0, fontWeight: 600, color: t.slate800 }}>{p.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, color: t.slate500 }}>
                    {p.appliesTo === 'product' ? `Buy ${p.minQty}+ × ${productById(p.productId)?.name || 'product'}` : `Order over ${money(p.minAmount)}`}
                    {' → '}<span style={{ fontWeight: 600, color: t.accent600 }}>{fmtValue(p.discountType, p.value)}</span>
                  </p>
                  <div style={{ marginTop: 8 }}><Badge color="amber">{p.appliesTo === 'product' ? 'Product promo' : 'Order promo'}</Badge></div>
                </PromoRow>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Coupon modal */}
      <Modal open={!!couponModal} onClose={() => setCouponModal(null)} title={couponModal?.id ? 'Edit Coupon' : 'New Coupon'}
        footer={<><Button variant="ghost" onClick={() => setCouponModal(null)}>Cancel</Button><Button onClick={saveCoupon}>Save</Button></>}>
        {couponModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Coupon Code"><Input style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} autoFocus value={couponModal.code} onChange={(e) => setCouponModal({ ...couponModal, code: e.target.value })} placeholder="WELCOME10" /></Field>
            <DiscountFields obj={couponModal} set={setCouponModal} />
          </div>
        )}
      </Modal>

      {/* Promotion modal */}
      <Modal open={!!promoModal} onClose={() => setPromoModal(null)} title={promoModal?.id ? 'Edit Promotion' : 'New Promotion'}
        footer={<><Button variant="ghost" onClick={() => setPromoModal(null)}>Cancel</Button><Button onClick={savePromo}>Save</Button></>}>
        {promoModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Promotion Name"><Input autoFocus value={promoModal.name} onChange={(e) => setPromoModal({ ...promoModal, name: e.target.value })} placeholder="e.g. Coffee Lovers" /></Field>
            <Field label="Applies To">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['order', 'product'].map((ty) => (
                  <button key={ty} onClick={() => setPromoModal({ ...promoModal, appliesTo: ty })} style={{
                    borderRadius: 8, padding: '8px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${promoModal.appliesTo === ty ? t.brand400 : t.slate200}`,
                    background: promoModal.appliesTo === ty ? t.brand50 : t.white,
                    color: promoModal.appliesTo === ty ? t.brand700 : t.slate500,
                  }}>{ty === 'order' ? 'Whole Order' : 'Specific Product'}</button>
                ))}
              </div>
            </Field>
            {promoModal.appliesTo === 'product' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Product">
                  <Select value={promoModal.productId} onChange={(e) => setPromoModal({ ...promoModal, productId: e.target.value })}>
                    {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <Field label="Minimum Quantity"><Input type="number" min="1" value={promoModal.minQty} onChange={(e) => setPromoModal({ ...promoModal, minQty: e.target.value })} /></Field>
              </div>
            ) : (
              <Field label="Minimum Order Amount (₹)"><Input type="number" min="0" value={promoModal.minAmount} onChange={(e) => setPromoModal({ ...promoModal, minAmount: e.target.value })} /></Field>
            )}
            <DiscountFields obj={promoModal} set={setPromoModal} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function CouponRow({ children, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{children}</div>
      <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
        <IconButton onClick={onEdit}><Pencil style={{ height: 16, width: 16 }} /></IconButton>
        <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
      </div>
    </div>
  )
}
function PromoRow({ children, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{ ...cardStyle, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>{children}</div>
        <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
          <IconButton onClick={onEdit}><Pencil style={{ height: 16, width: 16 }} /></IconButton>
          <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
        </div>
      </div>
    </div>
  )
}
function DiscountFields({ obj, set }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Field label="Discount Type">
        <Select value={obj.discountType} onChange={(e) => set({ ...obj, discountType: e.target.value })}>
          <option value="percent">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </Select>
      </Field>
      <Field label={obj.discountType === 'percent' ? 'Percent' : 'Amount (₹)'}>
        <Input type="number" min="0" value={obj.value} onChange={(e) => set({ ...obj, value: e.target.value })} />
      </Field>
    </div>
  )
}

/* =====================================================================
 * Floors & Tables
 * ===================================================================== */
export function Tables() {
  const { state, dispatch } = useStore()
  const [floorModal, setFloorModal] = useState(null)
  const [tableModal, setTableModal] = useState(null)

  const saveFloor = () => {
    if (!floorModal.name.trim()) return
    if (floorModal.id) dispatch({ type: 'UPDATE_FLOOR', id: floorModal.id, name: floorModal.name })
    else dispatch({ type: 'ADD_FLOOR', name: floorModal.name })
    setFloorModal(null)
  }
  const saveTable = () => {
    const data = { number: String(tableModal.number).trim(), seats: Number(tableModal.seats) || 1, active: tableModal.active }
    if (!data.number) return
    if (tableModal.id) dispatch({ type: 'UPDATE_TABLE', id: tableModal.id, data })
    else dispatch({ type: 'ADD_TABLE', floorId: tableModal.floorId, data })
    setTableModal(null)
  }

  return (
    <div>
      <PageHeader title="Floors & Tables" subtitle="Tables appear in the POS floor pop-up.">
        <Button onClick={() => setFloorModal({ name: '' })}><Plus style={{ height: 16, width: 16 }} /> New Floor</Button>
      </PageHeader>

      {state.floors.length === 0 ? (
        <EmptyState icon={Layers} title="No floors yet" subtitle="Add a floor, then place tables on it." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {state.floors.map((floor) => (
            <div key={floor.id} style={{ ...cardStyle, padding: 20 }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers style={{ height: 20, width: 20, color: t.brand500 }} />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.slate800 }}>{floor.name}</h3>
                  <span style={{ fontSize: 14, color: t.slate400 }}>· {floor.tables.length} tables</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="sm" onClick={() => setFloorModal({ ...floor })}><Pencil style={{ height: 16, width: 16 }} /> Rename</Button>
                  <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={() => window.confirm('Delete floor and its tables?') && dispatch({ type: 'DELETE_FLOOR', id: floor.id })}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {floor.tables.map((tb) => (
                  <TableTile key={tb.id} tb={tb} onEdit={() => setTableModal({ ...tb, floorId: floor.id })} onDelete={() => dispatch({ type: 'DELETE_TABLE', id: tb.id })} />
                ))}
                <button onClick={() => setTableModal({ floorId: floor.id, number: '', seats: 4, active: true })} style={{
                  display: 'flex', minHeight: 112, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, border: `2px dashed ${t.slate200}`, background: 'transparent', color: t.slate400, cursor: 'pointer',
                }}>
                  <Plus style={{ height: 24, width: 24 }} />
                  <span style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>Add Table</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!floorModal} onClose={() => setFloorModal(null)} title={floorModal?.id ? 'Rename Floor' : 'New Floor'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setFloorModal(null)}>Cancel</Button><Button onClick={saveFloor}>Save</Button></>}>
        {floorModal && <Field label="Floor Name"><Input autoFocus value={floorModal.name} onChange={(e) => setFloorModal({ ...floorModal, name: e.target.value })} placeholder="e.g. Terrace" /></Field>}
      </Modal>

      <Modal open={!!tableModal} onClose={() => setTableModal(null)} title={tableModal?.id ? 'Edit Table' : 'New Table'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setTableModal(null)}>Cancel</Button><Button onClick={saveTable}>Save</Button></>}>
        {tableModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Table Number"><Input autoFocus value={tableModal.number} onChange={(e) => setTableModal({ ...tableModal, number: e.target.value })} placeholder="e.g. 12" /></Field>
              <Field label="Number of Seats"><Input type="number" min="1" value={tableModal.seats} onChange={(e) => setTableModal({ ...tableModal, seats: e.target.value })} /></Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, border: `1px solid ${t.slate200}`, padding: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: t.slate700 }}>Active</p>
                <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>Inactive tables are hidden from the POS floor.</p>
              </div>
              <Toggle checked={tableModal.active} onChange={(v) => setTableModal({ ...tableModal, active: v })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TableTile({ tb, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{
      position: 'relative', borderRadius: 12, border: `2px solid ${tb.active ? t.slate200 : t.slate100}`,
      padding: 16, textAlign: 'center', background: tb.active ? t.white : t.slate50, opacity: tb.active ? 1 : 0.6,
    }}>
      <Armchair style={{ margin: '0 auto', height: 28, width: 28, color: tb.active ? t.brand400 : t.slate300 }} />
      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: t.slate800 }}>{tb.number}</p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, color: t.slate400 }}>
        <UsersIcon style={{ height: 12, width: 12 }} /> {tb.seats} seats
      </p>
      {!tb.active && <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: t.slate400 }}>Inactive</p>}
      <div style={{ position: 'absolute', right: 4, top: 4, display: 'flex', gap: 2, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
        <IconButton style={{ background: 'rgba(255,255,255,0.9)', boxShadow: shadow.card, padding: 4 }} onClick={onEdit}><Pencil style={{ height: 14, width: 14 }} /></IconButton>
        <IconButton hoverColor={t.rose600} style={{ background: 'rgba(255,255,255,0.9)', boxShadow: shadow.card, padding: 4 }} onClick={onDelete}><Trash2 style={{ height: 14, width: 14 }} /></IconButton>
      </div>
    </div>
  )
}

/* =====================================================================
 * Users & Employees
 * ===================================================================== */
export function Users() {
  const { state, dispatch } = useStore()
  const { currentUser } = useSelectors()
  const [modal, setModal] = useState(null)
  const [pwModal, setPwModal] = useState(null)

  const saveUser = () => {
    const data = { name: modal.name.trim(), email: modal.email.trim(), role: modal.role }
    if (!data.name || !data.email) return
    if (modal.id) dispatch({ type: 'UPDATE_USER', id: modal.id, data })
    else dispatch({ type: 'ADD_USER', data: { ...data, password: modal.password || 'changeme' } })
    setModal(null)
  }
  const savePw = () => {
    if (!pwModal.password) return
    dispatch({ type: 'UPDATE_USER', id: pwModal.id, data: { password: pwModal.password } })
    setPwModal(null)
  }

  return (
    <div>
      <PageHeader title="Users & Employees" subtitle="Admins manage the backend; cashiers operate the POS.">
        <Button onClick={() => setModal({ name: '', email: '', role: 'employee', password: '' })}><Plus style={{ height: 16, width: 16 }} /> New User</Button>
      </PageHeader>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.slate100}`, background: t.slate50, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate500 }}>
              {['Name', 'Email', 'Role', 'Status', ''].map((h, i) => <th key={i} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <UserRow key={u.id} u={u} isMe={u.id === currentUser?.id}
                onPw={() => setPwModal({ id: u.id, password: '' })}
                onEdit={() => setModal({ ...u })}
                onArchive={() => dispatch({ type: 'UPDATE_USER', id: u.id, data: { archived: !u.archived } })}
                onDelete={() => window.confirm('Delete this user?') && dispatch({ type: 'DELETE_USER', id: u.id })} />
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit User' : 'New User'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={saveUser}>Save</Button></>}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Name"><Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></Field>
            <Field label="Role">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ v: 'admin', l: 'Admin / Owner' }, { v: 'employee', l: 'Employee / Cashier' }].map(({ v, l }) => (
                  <button key={v} onClick={() => setModal({ ...modal, role: v })} style={{
                    borderRadius: 8, padding: '8px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${modal.role === v ? t.brand400 : t.slate200}`,
                    background: modal.role === v ? t.brand50 : t.white, color: modal.role === v ? t.brand700 : t.slate500,
                  }}>{l}</button>
                ))}
              </div>
            </Field>
            {!modal.id && (
              <Field label="Initial Password" hint="The user can change this later.">
                <Input value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} placeholder="changeme" />
              </Field>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!pwModal} onClose={() => setPwModal(null)} title="Change Password" size="sm"
        footer={<><Button variant="ghost" onClick={() => setPwModal(null)}>Cancel</Button><Button onClick={savePw}>Update</Button></>}>
        {pwModal && <Field label="New Password"><Input autoFocus value={pwModal.password} onChange={(e) => setPwModal({ ...pwModal, password: e.target.value })} /></Field>}
      </Modal>
    </div>
  )
}

function UserRow({ u, isMe, onPw, onEdit, onArchive, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <tr {...bind} style={{ borderBottom: `1px solid ${t.slate50}`, opacity: u.archived ? 0.5 : 1, background: hover ? t.slate50 : 'transparent' }}>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, borderRadius: 999, background: t.brand100, fontSize: 12, fontWeight: 700, color: t.brand600 }}>{u.name[0]?.toUpperCase()}</span>
          <span style={{ fontWeight: 600, color: t.slate800 }}>{u.name}</span>
          {isMe && <Badge color="green">You</Badge>}
        </div>
      </td>
      <td style={{ ...tdStyle, color: t.slate500 }}>{u.email}</td>
      <td style={tdStyle}><Badge color={u.role === 'admin' ? 'purple' : 'blue'}>{u.role === 'admin' ? 'Admin' : 'Cashier'}</Badge></td>
      <td style={tdStyle}>{u.archived ? <Badge color="amber">Archived</Badge> : <Badge color="green" dot>Active</Badge>}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
          <IconButton title="Change password" onClick={onPw}><KeyRound style={{ height: 16, width: 16 }} /></IconButton>
          <IconButton title={u.archived ? 'Restore' : 'Archive'} hoverColor={t.amber600} hoverBg={t.amber50} onClick={onArchive}>{u.archived ? <ArchiveRestore style={{ height: 16, width: 16 }} /> : <Archive style={{ height: 16, width: 16 }} />}</IconButton>
          <IconButton title="Delete" hoverColor={t.rose600} hoverBg={t.rose50} disabled={isMe} style={{ opacity: isMe ? 0.4 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }} onClick={isMe ? undefined : onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
        </div>
      </td>
    </tr>
  )
}
