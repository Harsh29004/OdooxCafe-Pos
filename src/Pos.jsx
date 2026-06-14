// ---------------------------------------------------------------------------
// Pos.jsx — the cashier-facing POS terminal:
//   <PosLayout/>   top nav + floor pop-up (wraps the pages via <Outlet/>)
//   <OrderView/>   take an order: products, cart, coupons, payment, receipt
//   <Orders/> <TableView/> <Customers/>
// Plus the payment + receipt modals used inside OrderView.
//
// The printable receipt keeps id="receipt"; the print stylesheet lives in
// main.jsx (so "Save as PDF" stays a tidy 80mm slip with no browser header).
// ---------------------------------------------------------------------------
import { useState, useEffect, useMemo, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, useOutletContext, useSearchParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  Coffee, ShoppingCart, ReceiptText, Users as UsersIcon, Armchair, Search,
  Menu, LogOut, ChefHat, Package, Tags, CreditCard, TicketPercent, LayoutDashboard,
  X, PauseCircle, Plus, Minus, Trash2, Tag, User, Check, Sparkles, Layers,
  Pencil, Mail, Phone, Banknote, QrCode as QrIcon, Printer, PartyPopper,
} from 'lucide-react'
import { useStore, useSelectors, computeCart, money, round2, fetchSuggestions } from './store.jsx'
import { t, shadow, cardStyle, Button, IconButton, Input, Select, Field, Modal, Badge, EmptyState, labelStyle, useWide } from './ui.jsx'

function useHover() {
  const [h, setH] = useState(false)
  return [h, { onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) }]
}

/* =====================================================================
 * PosLayout — top navigation bar + floor pop-up
 * ===================================================================== */
const TABS = [
  { to: '/pos/order', label: 'POS Order', icon: ShoppingCart },
  { to: '/pos/orders', label: 'Orders', icon: ReceiptText },
  { to: '/pos/customers', label: 'Customer', icon: UsersIcon },
  { to: '/pos/tables', label: 'Table View', icon: Armchair },
]
const MENU_LINKS = [
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Category', icon: Tags },
  { to: '/admin/payments', label: 'Payment Method', icon: CreditCard },
  { to: '/admin/coupons', label: 'Coupon & Promotion', icon: TicketPercent },
  { to: '/admin/tables', label: 'Booking', icon: Armchair },
  { to: '/admin/users', label: 'User / Employee', icon: UsersIcon },
  { to: '/admin/reports', label: 'Reports', icon: LayoutDashboard },
]

export function PosLayout() {
  const { state, dispatch } = useStore()
  const { currentUser, tableById } = useSelectors()
  const navigate = useNavigate()
  const [showFloor, setShowFloor] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const menuRef = useRef(null)
  const wide = useWide(768)

  const currentTable = tableById(state.session.currentTableId)

  useEffect(() => { if (!state.session.currentTableId) setShowFloor(true) }, []) // eslint-disable-line
  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selectTable = (tableId) => {
    dispatch({ type: 'SET_CURRENT_TABLE', tableId })
    dispatch({ type: 'SET_EDITING_ORDER', orderId: null })
    setShowFloor(false)
    navigate('/pos/order')
  }
  const logout = () => { dispatch({ type: 'LOGOUT' }); navigate('/login', { replace: true }) }
  const closeSession = () => {
    if (window.confirm('Close the POS session for this shift?')) { dispatch({ type: 'CLOSE_POS_SESSION' }); logout() }
  }
  const submitSearch = (e) => { e.preventDefault(); navigate('/pos/order?q=' + encodeURIComponent(search)) }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', overflow: 'hidden', background: t.slate100 }}>
      <header style={{ zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.slate200}`, background: t.white, padding: '10px 16px', boxShadow: shadow.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
          <div style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, borderRadius: 8, background: t.brand500, color: t.white }}><Coffee style={{ height: 20, width: 20 }} /></div>
          {wide && <span style={{ fontSize: 18, fontWeight: 800, color: t.slate800 }}>Cafe POS</span>}
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => <NavTab active={isActive} wide={wide}><Icon style={{ height: 16, width: 16 }} />{wide && label}</NavTab>}
            </NavLink>
          ))}
        </nav>

        {wide && (
          <form onSubmit={submitSearch} style={{ position: 'relative', marginLeft: 8, flex: 1, maxWidth: 320 }}>
            <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
            <Input style={{ paddingLeft: 36 }} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowFloor(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, border: `1px solid ${t.slate200}`, background: t.white, padding: '6px 12px', fontSize: 14, fontWeight: 600, color: t.slate600, cursor: 'pointer' }}>
            <Armchair style={{ height: 16, width: 16, color: t.brand500 }} />
            {currentTable ? `Table ${currentTable.number}` : 'Pick table'}
          </button>

          {wide && (
            <div style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, borderRadius: 999, background: t.brand100, fontSize: 12, fontWeight: 700, color: t.brand600 }}>
              {currentUser?.name?.[0]?.toUpperCase()}
            </div>
          )}

          <div style={{ position: 'relative' }} ref={menuRef}>
            <IconButton onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X style={{ height: 20, width: 20 }} /> : <Menu style={{ height: 20, width: 20 }} />}</IconButton>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 48, zIndex: 30, width: 240, ...cardStyle, padding: 8, transformOrigin: 'top right', animation: 'scaleIn .15s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ borderBottom: `1px solid ${t.slate100}`, padding: '8px 12px' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.slate800 }}>{currentUser?.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{currentUser?.email}</p>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {MENU_LINKS.map(({ to, label, icon: Icon }) => (
                    <MenuItem key={to} as={Link} to={to} onClick={() => setMenuOpen(false)}><Icon style={{ height: 16, width: 16, color: t.slate400 }} /> {label}</MenuItem>
                  ))}
                  <MenuItem as="a" href="/kitchen" target="_blank" rel="noreferrer"><ChefHat style={{ height: 16, width: 16, color: t.slate400 }} /> Kitchen Display</MenuItem>
                </div>
                <div style={{ borderTop: `1px solid ${t.slate100}`, padding: '4px 0' }}>
                  <MenuItem as="button" onClick={closeSession}><PauseCircle style={{ height: 16, width: 16, color: t.slate400 }} /> Close Session</MenuItem>
                  <MenuItem as="button" danger onClick={logout}><LogOut style={{ height: 16, width: 16 }} /> Log Out</MenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet context={{ openFloor: () => setShowFloor(true) }} />
      </main>

      <FloorPopup open={showFloor} onClose={() => setShowFloor(false)} onSelect={selectTable} dismissable={!!currentTable} />
    </div>
  )
}

function NavTab({ active, wide, children }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{
      display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      background: active ? t.brand50 : hover ? t.slate100 : 'transparent', color: active ? t.brand700 : t.slate500,
    }}>{children}</div>
  )
}
function MenuItem({ as: As = 'button', danger, children, ...props }) {
  const [hover, bind] = useHover()
  return (
    <As {...props} {...bind} style={{
      display: 'flex', width: '100%', alignItems: 'center', gap: 12, borderRadius: 8, padding: '8px 12px',
      fontSize: 14, textAlign: 'left', textDecoration: 'none', border: 'none', cursor: 'pointer',
      background: hover ? (danger ? t.rose50 : t.slate100) : 'transparent', color: danger ? t.rose600 : t.slate600,
    }}>{children}</As>
  )
}

/* =====================================================================
 * FloorPopup — choose a table
 * ===================================================================== */
export function FloorPopup({ open, onClose, onSelect, dismissable = true }) {
  const { state } = useStore()
  const { activeDraftForTable } = useSelectors()
  if (!open) return null

  const draftAmount = (tableId) => {
    const d = activeDraftForTable(tableId)
    return d ? computeCart(d.items || [], { promotions: state.promotions }).total : null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={dismissable ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', animation: 'fadeIn .2s ease' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 896, ...cardStyle, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'scaleIn .25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate100}`, padding: '16px 24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.slate800 }}>Select a Table</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: t.slate500 }}>Pick a table to start or resume an order.</p>
          </div>
          {dismissable && <IconButton onClick={onClose}><X style={{ height: 20, width: 20 }} /></IconButton>}
        </div>

        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {state.floors.map((floor) => (
            <div key={floor.id}>
              <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate400 }}>
                <Layers style={{ height: 16, width: 16 }} /> {floor.name}
              </h3>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                {floor.tables.filter((tb) => tb.active).map((tb) => {
                  const amt = draftAmount(tb.id)
                  return <TableButton key={tb.id} tb={tb} amt={amt} compact onClick={() => onSelect(tb.id)} />
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Shared table card used by FloorPopup and TableView.
function TableButton({ tb, amt, compact, onClick }) {
  const [hover, bind] = useHover()
  const busy = amt !== null
  return (
    <button {...bind} onClick={onClick} style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
      borderRadius: compact ? 12 : 16, padding: compact ? 16 : 20, transition: 'transform .15s, box-shadow .15s',
      border: `2px solid ${busy ? t.accent300 : hover ? t.brand300 : t.slate200}`, background: busy ? t.accent50 : t.white,
      transform: hover ? `translateY(${compact ? -2 : -4}px)` : 'none', boxShadow: hover ? shadow.soft : 'none',
    }}>
      <Armchair style={{ height: compact ? 32 : 36, width: compact ? 32 : 36, color: busy ? t.accent500 : t.brand400 }} />
      <p style={{ margin: '4px 0 0', fontSize: compact ? 20 : 24, fontWeight: 800, color: t.slate800 }}>{tb.number}</p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: t.slate400 }}><UsersIcon style={{ height: 12, width: 12 }} /> {tb.seats}{compact ? '' : ' seats'}</p>
      {busy ? (
        <span style={{ marginTop: compact ? 4 : 8, borderRadius: 999, background: t.accent500, padding: compact ? '2px 8px' : '2px 10px', fontSize: compact ? 10 : 12, fontWeight: 700, color: t.white }}>{money(amt)}</span>
      ) : (
        <span style={{ marginTop: compact ? 4 : 8, fontSize: compact ? 10 : 12, fontWeight: 600, textTransform: 'uppercase', color: t.emerald500 }}>{compact ? 'Available' : 'Open'}</span>
      )}
    </button>
  )
}

/* =====================================================================
 * OrderView — the main order-taking screen
 * ===================================================================== */
export function OrderView() {
  const { state, dispatch } = useStore()
  const sel = useSelectors()
  const { openFloor } = useOutletContext()
  const [params] = useSearchParams()
  const wide = useWide(1024)

  const [cart, setCart] = useState([])
  const [couponId, setCouponId] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [orderNumber, setOrderNumber] = useState(null)
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState(params.get('q') || '')

  const [discountOpen, setDiscountOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [sentFlash, setSentFlash] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const currentTable = sel.tableById(state.session.currentTableId)

  useEffect(() => {
    const editId = state.session.editingOrderId
    const source = editId ? state.orders.find((o) => o.id === editId) : sel.activeDraftForTable(state.session.currentTableId)
    if (source) {
      setCart(source.items.map((i) => ({ ...i })))
      setCouponId(source.couponId || null)
      setCustomerId(source.customerId || null)
      setOrderId(source.id)
      setOrderNumber(source.number)
      if (editId && source.tableId !== state.session.currentTableId) dispatch({ type: 'SET_CURRENT_TABLE', tableId: source.tableId })
    } else { resetCart() }
  }, [state.session.currentTableId, state.session.editingOrderId]) // eslint-disable-line

  const resetCart = () => { setCart([]); setCouponId(null); setCustomerId(null); setOrderId(null); setOrderNumber(null) }

  const coupon = couponId ? state.coupons.find((c) => c.id === couponId) : null
  const breakdown = useMemo(() => computeCart(cart, { coupon, promotions: state.promotions }), [cart, coupon, state.promotions])

  const products = useMemo(() => state.products.filter((p) => {
    const okCat = activeCat === 'all' || p.categoryId === activeCat
    const okSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return okCat && okSearch
  }), [state.products, activeCat, search])

  useEffect(() => {
    const ids = cart.map((i) => i.productId)
    if (!ids.length) { setSuggestions([]); return }
    let cancelled = false
    const tm = setTimeout(() => {
      fetchSuggestions(ids)
        .then((list) => {
          if (cancelled) return
          const inCart = new Set(cart.map((i) => i.productId))
          setSuggestions(list.filter((p) => !inCart.has(p.id) && state.products.some((sp) => sp.id === p.id)))
        })
        .catch(() => { if (!cancelled) setSuggestions([]) })
    }, 250)
    return () => { cancelled = true; clearTimeout(tm) }
  }, [cart, state.products])

  const addToCart = (p) => setCart((c) => {
    const ex = c.find((i) => i.productId === p.id)
    if (ex) return c.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i))
    return [...c, { productId: p.id, name: p.name, price: p.price, qty: 1, tax: p.tax }]
  })
  const changeQty = (productId, d) => setCart((c) => c.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, i.qty + d) } : i)))
  const removeItem = (productId) => setCart((c) => c.filter((i) => i.productId !== productId))

  const persistOrder = (extra = {}) => {
    const id = orderId || 'o-' + Math.random().toString(36).slice(2, 9)
    const number = orderNumber || 'ORD-' + state.orderCounter
    const order = {
      id, number, tableId: state.session.currentTableId,
      floorId: sel.allTables.find((tb) => tb.id === state.session.currentTableId)?.floorId || null,
      employeeId: state.session.currentUserId, customerId, couponId, status: 'draft',
      createdAt: orderId ? state.orders.find((o) => o.id === orderId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      items: cart.map((i) => ({ ...i })), amount: breakdown.total, ...extra,
    }
    dispatch({ type: 'UPSERT_ORDER', order })
    setOrderId(id); setOrderNumber(number)
    return order
  }

  const sendToKitchen = () => {
    if (!cart.length) return
    const order = persistOrder()
    const kitchenItems = cart.filter((i) => sel.productById(i.productId)?.kitchen).map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, done: false }))
    if (kitchenItems.length) dispatch({ type: 'SEND_TO_KITCHEN', ticket: { orderId: order.id, number: order.number, items: kitchenItems, stage: 'to_cook', createdAt: new Date().toISOString() } })
    setSentFlash(true)
    setTimeout(() => setSentFlash(false), 1800)
  }
  const applyCoupon = (code) => {
    const found = state.coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase())
    if (!found) { setCouponError('Invalid coupon code'); return }
    setCouponId(found.id); setCouponError(''); setDiscountOpen(false)
  }
  const completePayment = (method, meta) => {
    const order = persistOrder({ status: 'paid', paymentMethod: method, paidAt: new Date().toISOString() })
    setPayOpen(false)
    setReceipt({ order, breakdown, payMeta: meta })
  }
  const newOrder = () => { setReceipt(null); resetCart(); dispatch({ type: 'SET_EDITING_ORDER', orderId: null }); openFloor() }

  if (!currentTable) {
    return (
      <div style={{ display: 'grid', height: '100%', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Armchair style={{ margin: '0 auto', height: 48, width: 48, color: t.slate300 }} />
          <p style={{ marginTop: 12, fontWeight: 600, color: t.slate600 }}>No table selected</p>
          <Button style={{ marginTop: 16 }} onClick={openFloor}>Pick a table</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', height: '100%', gridTemplateColumns: wide ? '1fr 400px' : '1fr' }}>
      {/* Products */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${t.slate200}` }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', borderBottom: `1px solid ${t.slate200}`, background: t.white, padding: '12px 16px' }}>
          <CatTab active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="All" />
          {state.categories.map((c) => <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} label={c.name} color={c.color} />)}
        </div>
        {!wide && (
          <div style={{ borderBottom: `1px solid ${t.slate200}`, background: t.white, padding: '8px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
              <Input style={{ paddingLeft: 36 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {products.length === 0 ? (
            <p style={{ padding: '64px 0', textAlign: 'center', fontSize: 14, color: t.slate400 }}>No products match.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {products.map((p) => <ProductCard key={p.id} p={p} cat={sel.categoryById(p.categoryId)} onClick={() => addToCart(p)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Cart / payment */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.white }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate200}`, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, borderRadius: 8, background: t.brand50, color: t.brand600 }}><Armchair style={{ height: 16, width: 16 }} /></span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.slate800 }}>Table {currentTable.number}</p>
              <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{orderNumber || 'New order'}{customerId ? ` · ${sel.customerById(customerId)?.name}` : ''}</p>
            </div>
          </div>
          <Badge color="slate">{cart.reduce((s, i) => s + i.qty, 0)} items</Badge>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'grid', height: '100%', placeItems: 'center', textAlign: 'center' }}>
              <div>
                <ShoppingCart style={{ margin: '0 auto', height: 40, width: 40, color: t.slate200 }} />
                <p style={{ marginTop: 8, fontSize: 14, color: t.slate400 }}>Tap products to add them</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.map((i) => {
                const line = breakdown.lines.find((l) => l.productId === i.productId)
                return (
                  <div key={i.productId} style={{ borderRadius: 12, border: `1px solid ${t.slate100}`, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: t.slate800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{money(i.price)} each</p>
                      </div>
                      <IconButton hoverColor={t.rose500} hoverBg={t.rose50} onClick={() => removeItem(i.productId)}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QtyBtn onClick={() => changeQty(i.productId, -1)}><Minus style={{ height: 14, width: 14 }} /></QtyBtn>
                        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: t.slate800 }}>{i.qty}</span>
                        <QtyBtn onClick={() => changeQty(i.productId, 1)}><Plus style={{ height: 14, width: 14 }} /></QtyBtn>
                      </div>
                      <span style={{ fontWeight: 700, color: t.slate800 }}>{money(line?.lineSubtotal || 0)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div style={{ borderTop: `1px solid ${t.slate100}`, padding: '12px 16px' }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.brand500 }}>
              <Sparkles style={{ height: 14, width: 14 }} /> Suggested for this order
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {suggestions.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} title={`Add ${p.name}`} style={{
                  display: 'flex', flexShrink: 0, alignItems: 'center', gap: 6, borderRadius: 999, border: `1px solid ${t.brand200}`,
                  background: t.brand50, padding: '6px 12px', fontSize: 14, fontWeight: 600, color: t.brand700, cursor: 'pointer',
                }}>
                  <Plus style={{ height: 14, width: 14 }} /> {p.name}
                  <span style={{ fontSize: 12, fontWeight: 400, color: t.brand400 }}>{money(p.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${t.slate200}`, padding: '12px 16px' }}>
          <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <ActionBtn onClick={() => setCustomerOpen(true)}><User style={{ height: 16, width: 16 }} /> Customer</ActionBtn>
            <ActionBtn onClick={() => setDiscountOpen(true)}><Tag style={{ height: 16, width: 16 }} /> Coupon</ActionBtn>
            <ActionBtn onClick={sendToKitchen} disabled={!cart.length} flash={sentFlash}>{sentFlash ? <Check style={{ height: 16, width: 16 }} /> : <ChefHat style={{ height: 16, width: 16 }} />} {sentFlash ? 'Sent!' : 'Kitchen'}</ActionBtn>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            <SummaryRow label="Subtotal" value={money(breakdown.subtotal)} />
            <SummaryRow label="Tax" value={money(breakdown.taxTotal)} />
            {breakdown.discounts.map((d, i) => <SummaryRow key={i} label={d.label} value={`−${money(d.amount)}`} green />)}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.slate200}`, paddingTop: 8, fontSize: 18, fontWeight: 800, color: t.slate800 }}>
              <span>Total</span><span>{money(breakdown.total)}</span>
            </div>
          </div>

          <Button size="lg" disabled={!cart.length} onClick={() => setPayOpen(true)} style={{ marginTop: 12, width: '100%' }}>Pay {money(breakdown.total)}</Button>
        </div>
      </div>

      <DiscountPopup open={discountOpen} onClose={() => setDiscountOpen(false)} onApply={applyCoupon} error={couponError} applied={coupon} onRemove={() => { setCouponId(null); setDiscountOpen(false) }} />
      <CustomerPicker open={customerOpen} onClose={() => setCustomerOpen(false)} selectedId={customerId} onSelect={(id) => { setCustomerId(id); setCustomerOpen(false) }} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} total={breakdown.total} paymentMethods={state.paymentMethods} onConfirm={completePayment} />
      <ReceiptModal open={!!receipt} onClose={newOrder} order={receipt?.order} breakdown={receipt?.breakdown || breakdown} payMeta={receipt?.payMeta} customer={sel.customerById(customerId)} employee={sel.currentUser} table={currentTable} />
    </div>
  )
}

function ProductCard({ p, cat, onClick }) {
  const [hover, bind] = useHover()
  return (
    <button {...bind} onClick={onClick} style={{
      position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
      borderRadius: 12, border: `1px solid ${t.slate200}`, background: t.white, padding: 0,
      transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? shadow.soft : 'none', transition: 'transform .15s, box-shadow .15s',
    }}>
      <div style={{ height: 6, width: '100%', background: cat?.color || t.slate300 }} />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.3, color: t.slate800 }}>{p.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: t.slate400 }}>per {p.uom}</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, color: t.brand600 }}>{money(p.price)}</span>
          <span style={{ display: 'grid', placeItems: 'center', height: 28, width: 28, borderRadius: 999, background: hover ? t.brand500 : t.brand50, color: hover ? t.white : t.brand500, transition: 'all .15s' }}>
            <Plus style={{ height: 16, width: 16 }} />
          </span>
        </div>
      </div>
    </button>
  )
}
function CatTab({ active, onClick, label, color }) {
  const [hover, bind] = useHover()
  return (
    <button {...bind} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', borderRadius: 999, padding: '6px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
      background: active ? (color || t.brand500) : hover ? t.slate200 : t.slate100, color: active ? t.white : t.slate600,
    }}>
      {color && <span style={{ height: 8, width: 8, borderRadius: 999, background: active ? 'rgba(255,255,255,0.7)' : color }} />}
      {label}
    </button>
  )
}
function QtyBtn({ children, onClick }) {
  const [hover, bind] = useHover()
  return <button {...bind} onClick={onClick} style={{ display: 'grid', placeItems: 'center', height: 28, width: 28, borderRadius: 8, border: `1px solid ${t.slate200}`, background: hover ? t.slate50 : t.white, color: t.slate500, cursor: 'pointer' }}>{children}</button>
}
function ActionBtn({ children, onClick, disabled, flash }) {
  const [hover, bind] = useHover()
  return (
    <button {...bind} onClick={onClick} disabled={disabled} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${flash ? t.emerald400 : t.slate200}`, background: flash ? t.emerald50 : hover && !disabled ? t.slate50 : t.white,
      color: flash ? t.emerald600 : t.slate600, opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  )
}
function SummaryRow({ label, value, green }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', color: green ? t.emerald600 : t.slate500 }}><span>{label}</span><span style={{ fontWeight: 500 }}>{value}</span></div>
}

function DiscountPopup({ open, onClose, onApply, error, applied, onRemove }) {
  const [code, setCode] = useState('')
  useEffect(() => { if (open) setCode('') }, [open])
  return (
    <Modal open={open} onClose={onClose} title="Apply Coupon" size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={() => onApply(code)}>Apply</Button></>}>
      {applied && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, background: t.emerald50, padding: '8px 12px', fontSize: 14 }}>
          <span style={{ fontWeight: 600, color: t.emerald700 }}>{applied.code} applied</span>
          <IconButton color={t.emerald700} hoverColor={t.rose500} onClick={onRemove}><X style={{ height: 16, width: 16 }} /></IconButton>
        </div>
      )}
      <Field label="Coupon Code">
        <Input style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" onKeyDown={(e) => e.key === 'Enter' && onApply(code)} />
      </Field>
      {error && <p style={{ marginTop: 8, fontSize: 14, color: t.rose500 }}>{error}</p>}
      <p style={{ marginTop: 8, fontSize: 12, color: t.slate400 }}>Automated promotions apply on their own — no code needed.</p>
    </Modal>
  )
}

function CustomerPicker({ open, onClose, selectedId, onSelect }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  useEffect(() => { if (open) { setQ(''); setAdding(false); setForm({ name: '', email: '', phone: '' }) } }, [open])

  const list = state.customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
  const create = () => {
    if (!form.name.trim()) return
    const id = 'cust-' + Math.random().toString(36).slice(2, 9)
    dispatch({ type: 'ADD_CUSTOMER', data: { id, ...form } })
    onSelect(id)
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Customer">
      {!adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
              <Input style={{ paddingLeft: 36 }} placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setAdding(true)}><Plus style={{ height: 16, width: 16 }} /> New</Button>
          </div>
          <div style={{ maxHeight: 288, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {list.map((c) => (
              <button key={c.id} onClick={() => onSelect(c.id)} style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: '8px 12px', textAlign: 'left', fontSize: 14, cursor: 'pointer',
                border: `1px solid ${selectedId === c.id ? t.brand300 : t.slate200}`, background: selectedId === c.id ? t.brand50 : t.white,
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: t.slate800 }}>{c.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{c.email || c.phone || 'No contact'}</p>
                </div>
                {selectedId === c.id && <Check style={{ height: 16, width: 16, color: t.brand600 }} />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Name"><Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setAdding(false)}>Back</Button>
            <Button onClick={create}>Create & Assign</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* =====================================================================
 * Payment + Receipt modals
 * ===================================================================== */
function PaymentModal({ open, onClose, total, paymentMethods, onConfirm }) {
  const enabled = [
    paymentMethods.cash.enabled && { id: 'cash', label: 'Cash', icon: Banknote },
    paymentMethods.card.enabled && { id: 'card', label: 'Card / Digital', icon: CreditCard },
    paymentMethods.upi.enabled && { id: 'upi', label: 'UPI QR', icon: QrIcon },
  ].filter(Boolean)

  const [method, setMethod] = useState(enabled[0]?.id || 'cash')
  const [received, setReceived] = useState('')
  const [ref, setRef] = useState('')
  const [upiRef, setUpiRef] = useState('')
  const [qr, setQr] = useState('')

  useEffect(() => { if (!open) { setReceived(''); setRef(''); setUpiRef(''); setMethod(enabled[0]?.id || 'cash') } }, [open]) // eslint-disable-line
  useEffect(() => {
    if (method === 'upi' && paymentMethods.upi.upiId) {
      const uri = `upi://pay?pa=${encodeURIComponent(paymentMethods.upi.upiId)}&pn=BrewMatic&am=${total}&cu=INR`
      QRCode.toDataURL(uri, { width: 220, margin: 1, color: { dark: '#2a1b27', light: '#ffffff' } }).then(setQr)
    }
  }, [method, total, paymentMethods.upi.upiId])

  if (!open) return null
  const change = round2(Number(received || 0) - total)

  const confirm = () => {
    const meta = method === 'cash'
      ? { received: Number(received), change }
      : method === 'card'
        ? { ref }
        : { upiId: upiRef.trim() || paymentMethods.upi.upiId }
    onConfirm(method, meta)
  }
  const canConfirm = method === 'cash' ? Number(received) >= total : method === 'card' ? ref.trim().length > 0 : true


  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', animation: 'fadeIn .2s ease' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 448, ...cardStyle, animation: 'scaleIn .2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate100}`, padding: '16px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.slate800 }}>Payment</h3>
          <IconButton onClick={onClose}><X style={{ height: 20, width: 20 }} /></IconButton>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 16, borderRadius: 12, background: t.brand50, padding: 16, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: t.brand600 }}>Amount Due</p>
            <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: t.brand700 }}>{money(total)}</p>
          </div>

          <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {enabled.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMethod(id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 8, padding: '12px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${method === id ? t.brand400 : t.slate200}`, background: method === id ? t.brand50 : t.white, color: method === id ? t.brand700 : t.slate500,
              }}><Icon style={{ height: 20, width: 20 }} /> {label}</button>
            ))}
          </div>

          {method === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Amount Received</label>
                <Input style={{ fontSize: 18 }} type="number" autoFocus value={received} onChange={(e) => setReceived(e.target.value)} placeholder="0" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setReceived(String(v))}>{money(v)}</Button>
                ))}
              </div>
              {received !== '' && (
                <div style={{ borderRadius: 8, padding: 12, textAlign: 'center', fontWeight: 600, background: change >= 0 ? t.emerald50 : t.rose50, color: change >= 0 ? t.emerald700 : t.rose600 }}>
                  {change >= 0 ? `Change due: ${money(change)}` : `Short by ${money(-change)}`}
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div>
              <label style={labelStyle}>Transaction Reference</label>
              <Input autoFocus value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. TXN-48213" />
            </div>
          )}

          {method === 'upi' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {paymentMethods.upi.upiId ? (
                <>
                  {qr && <img src={qr} alt="UPI QR" style={{ height: 176, width: 176, borderRadius: 12, border: `1px solid ${t.slate200}`, padding: 8 }} />}
                  <p style={{ margin: 0, fontSize: 14, color: t.slate500 }}>Scan to pay <span style={{ fontWeight: 600, color: t.slate700 }}>{money(total)}</span></p>
                  <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{paymentMethods.upi.upiId}</p>
                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: t.slate600 }}>Customer UPI ID (optional)</label>
                    <Input value={upiRef} onChange={(e) => setUpiRef(e.target.value)} placeholder="e.g. customer@upi" />
                  </div>
                </>
              ) : <p style={{ padding: '32px 0', fontSize: 14, color: t.rose500 }}>No UPI ID configured in backend.</p>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${t.slate100}`, padding: '16px 20px' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canConfirm} onClick={confirm}><Check style={{ height: 16, width: 16 }} /> {method === 'upi' ? 'Confirm Paid' : 'Confirm Payment'}</Button>
        </div>
      </div>
    </div>
  )
}

function ReceiptModal({ open, onClose, order, breakdown, customer, employee, table, payMeta }) {
  const [emailSent, setEmailSent] = useState(false)
  if (!open || !order) return null
  const sendEmail = () => { setEmailSent(true); setTimeout(() => setEmailSent(false), 2500) }

  const rowStyle = { display: 'flex', justifyContent: 'space-between' }
  const metaRow = { ...rowStyle, fontSize: 12, color: t.slate500 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', animation: 'fadeIn .2s ease' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 384, ...cardStyle, animation: 'scaleIn .25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${t.slate100}`, padding: '20px', textAlign: 'center' }}>
          <IconButton onClick={onClose} style={{ position: 'absolute', top: 8, right: 8 }}><X style={{ height: 20, width: 20 }} /></IconButton>
          <div style={{ marginBottom: 8, display: 'grid', placeItems: 'center', height: 48, width: 48, borderRadius: 999, background: t.emerald100, color: t.emerald600 }}><PartyPopper style={{ height: 24, width: 24 }} /></div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.slate800 }}>Payment Successful</h3>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: t.slate400 }}>Order {order.number} marked as paid</p>
        </div>

        {/* Printable receipt (the print stylesheet in main.jsx targets #receipt) */}
        <div id="receipt" style={{ padding: '16px 24px', fontSize: 14 }}>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.slate800 }}>☕ BrewMatic</p>
            <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>Thank you for visiting!</p>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2, borderTop: `1px dashed ${t.slate200}`, borderBottom: `1px dashed ${t.slate200}`, padding: '8px 0' }}>
            <div style={metaRow}><span>Order</span><span style={{ fontWeight: 600, color: t.slate700 }}>{order.number}</span></div>
            <div style={metaRow}><span>Table</span><span>{table?.number || '—'}</span></div>
            <div style={metaRow}><span>Cashier</span><span>{employee?.name || '—'}</span></div>
            {customer && <div style={metaRow}><span>Customer</span><span>{customer.name}</span></div>}
            <div style={metaRow}><span>Payment</span><span style={{ textTransform: 'capitalize' }}>{order.paymentMethod === 'card' ? 'Credit / Debit Card' : order.paymentMethod === 'upi' ? 'UPI' : 'Cash'}</span></div>
            {order.paymentMethod === 'card' && payMeta?.ref && (
              <div style={metaRow}><span>Txn ID</span><span style={{ fontFamily: 'monospace', fontWeight: 600, color: t.slate700 }}>{payMeta.ref}</span></div>
            )}
            {order.paymentMethod === 'upi' && payMeta?.upiId && (
              <div style={metaRow}><span>UPI ID</span><span style={{ fontFamily: 'monospace', fontWeight: 600, color: t.slate700 }}>{payMeta.upiId}</span></div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {breakdown.lines.map((l) => (
              <div key={l.productId} style={rowStyle}>
                <span style={{ color: t.slate600 }}>{l.qty} × {l.name}</span>
                <span style={{ color: t.slate700 }}>{money(l.lineSubtotal)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px dashed ${t.slate200}`, paddingTop: 8, fontSize: 12 }}>
            <div style={metaRow}><span>Subtotal</span><span>{money(breakdown.subtotal)}</span></div>
            <div style={metaRow}><span>Tax</span><span>{money(breakdown.taxTotal)}</span></div>
            {breakdown.discounts.map((d, i) => <div key={i} style={{ ...rowStyle, color: t.emerald600 }}><span>{d.label}</span><span>−{money(d.amount)}</span></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${t.slate200}`, paddingTop: 4, fontSize: 16, fontWeight: 800, color: t.slate800 }}><span>Total</span><span>{money(breakdown.total)}</span></div>
            {payMeta?.change > 0 && <div style={metaRow}><span>Change</span><span>{money(payMeta.change)}</span></div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${t.slate100}`, padding: '16px 20px' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => window.print()}><Printer style={{ height: 16, width: 16 }} /> Print</Button>
          <Button variant="outline" style={{ flex: 1 }} onClick={sendEmail} disabled={!customer?.email}>{emailSent ? <><Check style={{ height: 16, width: 16 }} /> Sent</> : <><Mail style={{ height: 16, width: 16 }} /> Email</>}</Button>
          <Button style={{ flex: 1 }} onClick={onClose}>New Order</Button>
        </div>
        {!customer?.email && <p style={{ margin: 0, padding: '0 20px 12px', textAlign: 'center', fontSize: 12, color: t.slate400 }}>Assign a customer with an email to send the receipt.</p>}
      </div>
    </div>
  )
}

/* =====================================================================
 * Orders — list of all orders with a detail drawer
 * ===================================================================== */
const STATUS_COLOR = { draft: 'amber', paid: 'green', cancelled: 'red' }

export function Orders() {
  const { state, dispatch } = useStore()
  const sel = useSelectors()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [detail, setDetail] = useState(null)

  const amountOf = (o) => {
    const coupon = o.couponId ? state.coupons.find((c) => c.id === o.couponId) : null
    return computeCart(o.items || [], { coupon, promotions: state.promotions }).total
  }
  const orders = useMemo(() => [...state.orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((o) => status === 'all' || o.status === status)
    .filter((o) => {
      const cust = sel.customerById(o.customerId)?.name || ''
      return `${o.number} ${cust} ${new Date(o.createdAt).toLocaleDateString()}`.toLowerCase().includes(q.toLowerCase())
    }), [state.orders, q, status]) // eslint-disable-line

  const editOrder = (o) => {
    dispatch({ type: 'SET_EDITING_ORDER', orderId: o.id })
    dispatch({ type: 'SET_CURRENT_TABLE', tableId: o.tableId })
    navigate('/pos/order')
  }
  const deleteOrder = (id) => { if (window.confirm('Delete this draft order?')) { dispatch({ type: 'DELETE_ORDER', id }); setDetail(null) } }

  return (
    <div style={{ margin: '0 auto', height: '100%', maxWidth: 1024, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.slate800 }}>Orders</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
            <Input style={{ paddingLeft: 36 }} placeholder="Customer, number or date…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option><option value="draft">Draft</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders" subtitle="Orders you take will appear here." />
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.slate100}`, background: t.slate50, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate500 }}>
                {['Order', 'Date', 'Customer', 'Amount', 'Status'].map((h) => <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => <OrderRow key={o.id} o={o} amount={amountOf(o)} customer={sel.customerById(o.customerId)?.name || 'Walk-in'} onClick={() => setDetail(o)} />)}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setDetail(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', animation: 'fadeIn .2s ease' }} />
          <div style={{ position: 'relative', height: '100%', width: '100%', maxWidth: 448, overflowY: 'auto', background: t.white, boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', animation: 'slideInRight .25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate100}`, padding: '16px 20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.slate800 }}>{detail.number}</h3>
                <p style={{ margin: 0, fontSize: 12, color: t.slate400 }}>{new Date(detail.createdAt).toLocaleString()}</p>
              </div>
              <IconButton onClick={() => setDetail(null)}><X style={{ height: 20, width: 20 }} /></IconButton>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Badge color={STATUS_COLOR[detail.status]}>{detail.status}</Badge>
                <Badge color="slate">Table {sel.tableById(detail.tableId)?.number || '—'}</Badge>
                <Badge color="slate">{sel.customerById(detail.customerId)?.name || 'Walk-in'}</Badge>
                <Badge color="slate">{sel.userById(detail.employeeId)?.name || '—'}</Badge>
              </div>
              <div style={{ borderRadius: 12, border: `1px solid ${t.slate100}` }}>
                {detail.items.map((i) => (
                  <div key={i.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate50}`, padding: '10px 16px', fontSize: 14 }}>
                    <span style={{ color: t.slate600 }}>{i.qty} × {i.name}</span>
                    <span style={{ fontWeight: 600, color: t.slate700 }}>{money(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${t.slate200}`, paddingTop: 12, fontSize: 18, fontWeight: 800, color: t.slate800 }}>
                <span>Total</span><span>{money(amountOf(detail))}</span>
              </div>
              {detail.status === 'draft' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="danger" style={{ flex: 1 }} onClick={() => deleteOrder(detail.id)}><Trash2 style={{ height: 16, width: 16 }} /> Delete</Button>
                  <Button style={{ flex: 1 }} onClick={() => editOrder(detail)}><Pencil style={{ height: 16, width: 16 }} /> Edit Order</Button>
                </div>
              ) : <p style={{ margin: 0, borderRadius: 8, background: t.slate50, padding: '8px 12px', textAlign: 'center', fontSize: 14, color: t.slate400 }}>Paid orders are view-only.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderRow({ o, amount, customer, onClick }) {
  const [hover, bind] = useHover()
  return (
    <tr {...bind} onClick={onClick} style={{ cursor: 'pointer', borderBottom: `1px solid ${t.slate50}`, background: hover ? t.slate50 : 'transparent' }}>
      <td style={{ padding: '12px 16px', fontWeight: 600, color: t.slate800 }}>{o.number}</td>
      <td style={{ padding: '12px 16px', color: t.slate500 }}>{new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
      <td style={{ padding: '12px 16px', color: t.slate500 }}>{customer}</td>
      <td style={{ padding: '12px 16px', fontWeight: 600, color: t.slate700 }}>{money(amount)}</td>
      <td style={{ padding: '12px 16px' }}><Badge color={STATUS_COLOR[o.status]}>{o.status}</Badge></td>
    </tr>
  )
}

/* =====================================================================
 * TableView — all tables across floors
 * ===================================================================== */
export function TableView() {
  const { state, dispatch } = useStore()
  const { activeDraftForTable } = useSelectors()
  const navigate = useNavigate()

  const select = (tableId, draft) => {
    dispatch({ type: 'SET_CURRENT_TABLE', tableId })
    dispatch({ type: 'SET_EDITING_ORDER', orderId: draft ? draft.id : null })
    navigate('/pos/order')
  }
  const amount = (id) => {
    const d = activeDraftForTable(id)
    return d ? computeCart(d.items || [], { promotions: state.promotions }).total : null
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.slate800 }}>Floor & Tables</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ height: 12, width: 12, borderRadius: 999, background: t.emerald400 }} /> Available</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ height: 12, width: 12, borderRadius: 999, background: t.accent500 }} /> Active order</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {state.floors.map((floor) => (
          <div key={floor.id}>
            <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate400 }}>
              <Layers style={{ height: 16, width: 16 }} /> {floor.name}
            </h3>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {floor.tables.filter((tb) => tb.active).map((tb) => {
                const amt = amount(tb.id)
                const draft = activeDraftForTable(tb.id)
                return <TableButton key={tb.id} tb={tb} amt={amt} onClick={() => select(tb.id, draft)} />
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =====================================================================
 * Customers
 * ===================================================================== */
export function Customers() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)

  const list = state.customers.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))
  const save = () => {
    if (!modal.name.trim()) return
    const data = { name: modal.name.trim(), email: modal.email.trim(), phone: modal.phone.trim() }
    if (modal.id) dispatch({ type: 'UPDATE_CUSTOMER', id: modal.id, data })
    else dispatch({ type: 'ADD_CUSTOMER', data })
    setModal(null)
  }

  return (
    <div style={{ margin: '0 auto', height: '100%', maxWidth: 896, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.slate800 }}>Customers</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
            <Input style={{ paddingLeft: 36 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => setModal({ name: '', email: '', phone: '' })}><Plus style={{ height: 16, width: 16 }} /> New</Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No customers" subtitle="Add a customer to link receipts." />
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {list.map((c) => <CustomerCard key={c.id} c={c} onEdit={() => setModal({ ...c })} onDelete={() => window.confirm('Delete customer?') && dispatch({ type: 'DELETE_CUSTOMER', id: c.id })} />)}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Customer' : 'New Customer'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {modal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Name"><Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CustomerCard({ c, onEdit, onDelete }) {
  const [hover, bind] = useHover()
  return (
    <div {...bind} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'grid', placeItems: 'center', height: 40, width: 40, borderRadius: 999, background: t.brand100, fontWeight: 700, color: t.brand600 }}>{c.name[0]?.toUpperCase()}</span>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: t.slate800 }}>{c.name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: t.slate400 }}>
            {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail style={{ height: 12, width: 12 }} /> {c.email}</span>}
            {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone style={{ height: 12, width: 12 }} /> {c.phone}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
        <IconButton onClick={onEdit}><Pencil style={{ height: 16, width: 16 }} /></IconButton>
        <IconButton hoverColor={t.rose600} hoverBg={t.rose50} onClick={onDelete}><Trash2 style={{ height: 16, width: 16 }} /></IconButton>
      </div>
    </div>
  )
}
