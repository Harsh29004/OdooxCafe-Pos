// ---------------------------------------------------------------------------
// store.jsx — everything about DATA lives here (no UI).
//
// Merged from the old src/store/* and src/lib/* files:
//   • money helpers      (money, round2)
//   • cart pricing        (computeCart, orderTotal)
//   • backend API client  (getState, putState, fetchSuggestions, connectWS)
//   • seed/demo data       (buildInitialState)
//   • the global store      (StoreProvider, useStore, useSelectors)
//
// The app runs fully offline from localStorage; if a backend is present it
// syncs to it in the background.
// ---------------------------------------------------------------------------
import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase Realtime client for live-sync (replaces raw WebSocket)
const sbUrl = import.meta.env.VITE_SUPABASE_URL
const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseClient = sbUrl && sbKey ? createClient(sbUrl, sbKey) : null

/* =====================================================================
 * 1) Money helpers
 * ===================================================================== */
export function money(n) {
  const v = Number.isFinite(n) ? n : 0
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/* =====================================================================
 * 2) Cart pricing
 * ===================================================================== */
// items: [{ productId, name, price, qty, tax }]   opts: { coupon, promotions }
export function computeCart(items, { coupon = null, promotions = [] } = {}) {
  const lines = items.map((it) => {
    const lineSubtotal = round2(it.price * it.qty)
    const lineTax = round2((lineSubtotal * (it.tax || 0)) / 100)
    return { ...it, lineSubtotal, lineTax }
  })

  const subtotal = round2(lines.reduce((s, l) => s + l.lineSubtotal, 0))
  const taxTotal = round2(lines.reduce((s, l) => s + l.lineTax, 0))

  const discounts = [] // { id, label, amount }

  // Automated promotions (no code needed)
  for (const promo of promotions) {
    let fires = false
    if (promo.appliesTo === 'product') {
      const qty = lines.filter((l) => l.productId === promo.productId).reduce((s, l) => s + l.qty, 0)
      fires = qty >= (promo.minQty || 0) && qty > 0
    } else if (promo.appliesTo === 'order') {
      fires = subtotal >= (promo.minAmount || 0) && subtotal > 0
    }
    if (fires) {
      const amount =
        promo.discountType === 'percent'
          ? round2((subtotal * promo.value) / 100)
          : round2(Math.min(promo.value, subtotal))
      discounts.push({ id: promo.id, label: `${promo.name} (promo)`, amount, kind: 'promo' })
    }
  }

  // Coupon (entered manually)
  if (coupon) {
    const amount =
      coupon.discountType === 'percent'
        ? round2((subtotal * coupon.value) / 100)
        : round2(Math.min(coupon.value, subtotal))
    discounts.push({ id: coupon.id, label: `Coupon ${coupon.code}`, amount, kind: 'coupon' })
  }

  const discountTotal = round2(Math.min(discounts.reduce((s, d) => s + d.amount, 0), subtotal))
  const total = round2(subtotal + taxTotal - discountTotal)

  return { lines, subtotal, taxTotal, discounts, discountTotal, total }
}

/* =====================================================================
 * 3) Backend API client (everything degrades gracefully when offline)
 * ===================================================================== */
async function apiGetState() {
  const r = await fetch('/api/state')
  if (!r.ok) throw new Error('GET /api/state ' + r.status)
  return r.json()
}
async function apiPutState(domain, clientId) {
  const r = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: domain, clientId }),
  })
  if (!r.ok) throw new Error('PUT /api/state ' + r.status)
  return r.json()
}
// AI "Smart Suggestions" — top add-ons for the current cart (co-occurrence).
export async function fetchSuggestions(cartProductIds = []) {
  const q = encodeURIComponent(cartProductIds.join(','))
  const r = await fetch('/api/ai/suggestions?cart=' + q)
  if (!r.ok) throw new Error('GET /api/ai/suggestions ' + r.status)
  return r.json()
}
// Supabase Realtime subscription (replaces WebSocket).
// Listens to changes on the `meta` table — when any client saves state,
// the lastSync key is updated, triggering all other clients to re-fetch.
function subscribeRealtime(onStateChange) {
  if (!supabaseClient) return null
  try {
    const channel = supabaseClient
      .channel('meta-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meta' }, () => {
        onStateChange()
      })
      .subscribe()
    return channel
  } catch {
    return null
  }
}

/* =====================================================================
 * 4) Seed / demo data
 * ---------------------------------------------------------------------
 * The seed data lives in ./store/seed.js — a plain JS module (no React/JSX)
 * so the Node backend can import the SAME source of truth. Re-export it
 * here so existing `import { ... } from './store.jsx'` consumers keep working.
 * ===================================================================== */
export {
  seedCategories, seedProducts, seedFloors, seedPaymentMethods,
  seedCoupons, seedPromotions, seedUsers, seedCustomers, seedOrders,
  buildInitialState,
} from './store/seed.js'
import { buildInitialState } from './store/seed.js'

/* =====================================================================
 * 5) The global store (reducer + provider + hooks)
 * ===================================================================== */
const KEY = 'odoo-cafe-pos-state-v1'
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return buildInitialState()
}

const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 9)

function reducer(state, action) {
  switch (action.type) {
    case '__HYDRATE__':
      return action.state
    case '__HYDRATE_DOMAIN__':
      return { ...state, ...action.domain, session: state.session }
    case 'RESET_DEMO':
      return buildInitialState()

    /* ---------------- Auth & session ---------------- */
    case 'LOGIN': {
      const user = state.users.find(
        (u) =>
          u.email.toLowerCase() === action.email.toLowerCase() &&
          u.password === action.password &&
          !u.archived,
      )
      if (!user) return { ...state, session: { ...state.session, loginError: 'Invalid email or password' } }
      return {
        ...state,
        session: {
          ...state.session,
          currentUserId: user.id,
          loginError: null,
          posSession: { ...state.session.posSession, open: true, openedAt: new Date().toISOString() },
        },
      }
    }
    case 'SIGNUP': {
      if (state.users.some((u) => u.email.toLowerCase() === action.email.toLowerCase())) {
        return { ...state, session: { ...state.session, loginError: 'Email already registered' } }
      }
      const user = { id: uid('u'), name: action.name, email: action.email, password: action.password, role: 'admin', archived: false }
      return {
        ...state,
        users: [...state.users, user],
        session: {
          ...state.session,
          currentUserId: user.id,
          loginError: null,
          posSession: { ...state.session.posSession, open: true, openedAt: new Date().toISOString() },
        },
      }
    }
    case 'LOGOUT':
      return { ...state, session: { ...state.session, currentUserId: null, currentTableId: null, editingOrderId: null } }

    case 'SET_CURRENT_TABLE':
      return { ...state, session: { ...state.session, currentTableId: action.tableId } }
    case 'SET_EDITING_ORDER':
      return { ...state, session: { ...state.session, editingOrderId: action.orderId } }

    case 'OPEN_POS_SESSION':
      return { ...state, session: { ...state.session, posSession: { ...state.session.posSession, open: true, openedAt: new Date().toISOString() } } }
    case 'CLOSE_POS_SESSION': {
      const today = new Date().toDateString()
      const todaysSales = state.orders
        .filter((o) => o.status === 'paid' && new Date(o.paidAt || o.createdAt).toDateString() === today)
        .reduce((s, o) => s + (o.amount || 0), 0)
      return {
        ...state,
        session: {
          ...state.session,
          currentTableId: null,
          posSession: { open: false, openedAt: null, lastClosedAt: new Date().toISOString(), lastClosingAmount: round2(todaysSales) },
        },
      }
    }

    /* ---------------- Categories ---------------- */
    case 'ADD_CATEGORY': {
      const cat = { id: action.data.id || uid('cat'), name: action.data.name, color: action.data.color }
      return { ...state, categories: [...state.categories, cat] }
    }
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map((c) => (c.id === action.id ? { ...c, ...action.data } : c)) }
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) }

    /* ---------------- Products ---------------- */
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, { id: uid('p'), ...action.data }] }
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.data } : p)) }
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.id) }

    /* ---------------- Payment methods ---------------- */
    case 'UPDATE_PAYMENT_METHODS':
      return { ...state, paymentMethods: { ...state.paymentMethods, ...action.data } }

    /* ---------------- Coupons & promotions ---------------- */
    case 'ADD_COUPON':
      return { ...state, coupons: [...state.coupons, { id: uid('c'), ...action.data }] }
    case 'UPDATE_COUPON':
      return { ...state, coupons: state.coupons.map((c) => (c.id === action.id ? { ...c, ...action.data } : c)) }
    case 'DELETE_COUPON':
      return { ...state, coupons: state.coupons.filter((c) => c.id !== action.id) }
    case 'ADD_PROMO':
      return { ...state, promotions: [...state.promotions, { id: uid('pr'), ...action.data }] }
    case 'UPDATE_PROMO':
      return { ...state, promotions: state.promotions.map((p) => (p.id === action.id ? { ...p, ...action.data } : p)) }
    case 'DELETE_PROMO':
      return { ...state, promotions: state.promotions.filter((p) => p.id !== action.id) }

    /* ---------------- Floors & tables ---------------- */
    case 'ADD_FLOOR':
      return { ...state, floors: [...state.floors, { id: uid('floor'), name: action.name, tables: [] }] }
    case 'UPDATE_FLOOR':
      return { ...state, floors: state.floors.map((f) => (f.id === action.id ? { ...f, name: action.name } : f)) }
    case 'DELETE_FLOOR':
      return { ...state, floors: state.floors.filter((f) => f.id !== action.id) }
    case 'ADD_TABLE':
      return {
        ...state,
        floors: state.floors.map((f) =>
          f.id === action.floorId ? { ...f, tables: [...f.tables, { id: uid('t'), ...action.data }] } : f,
        ),
      }
    case 'UPDATE_TABLE':
      return {
        ...state,
        floors: state.floors.map((f) => ({
          ...f,
          tables: f.tables.map((t2) => (t2.id === action.id ? { ...t2, ...action.data } : t2)),
        })),
      }
    case 'DELETE_TABLE':
      return {
        ...state,
        floors: state.floors.map((f) => ({ ...f, tables: f.tables.filter((t2) => t2.id !== action.id) })),
      }

    /* ---------------- Users ---------------- */
    case 'ADD_USER':
      return { ...state, users: [...state.users, { id: uid('u'), archived: false, ...action.data }] }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map((u) => (u.id === action.id ? { ...u, ...action.data } : u)) }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter((u) => u.id !== action.id) }

    /* ---------------- Customers ---------------- */
    case 'ADD_CUSTOMER': {
      const c = { id: action.data.id || uid('cust'), ...action.data }
      return { ...state, customers: [...state.customers, c] }
    }
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map((c) => (c.id === action.id ? { ...c, ...action.data } : c)) }
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter((c) => c.id !== action.id) }

    /* ---------------- Orders ---------------- */
    case 'UPSERT_ORDER': {
      const exists = state.orders.some((o) => o.id === action.order.id)
      const orders = exists
        ? state.orders.map((o) => (o.id === action.order.id ? { ...o, ...action.order } : o))
        : [...state.orders, action.order]
      return { ...state, orders, orderCounter: Math.max(state.orderCounter, exists ? state.orderCounter : state.orderCounter + 1) }
    }
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.id),
        kitchenTickets: state.kitchenTickets.filter((k) => k.orderId !== action.id),
      }

    /* ---------------- Kitchen Display ---------------- */
    case 'SEND_TO_KITCHEN': {
      const tk = action.ticket
      const exists = state.kitchenTickets.some((k) => k.orderId === tk.orderId)
      const kitchenTickets = exists
        ? state.kitchenTickets.map((k) => (k.orderId === tk.orderId ? { ...tk, stage: k.stage === 'completed' ? 'to_cook' : k.stage } : k))
        : [...state.kitchenTickets, tk]
      return { ...state, kitchenTickets }
    }
    case 'KDS_ADVANCE': {
      const order = ['to_cook', 'preparing', 'completed']
      return {
        ...state,
        kitchenTickets: state.kitchenTickets.map((k) => {
          if (k.orderId !== action.orderId) return k
          const i = order.indexOf(k.stage)
          const next = order[Math.min(i + 1, order.length - 1)]
          const items = next === 'completed' ? k.items.map((it) => ({ ...it, done: true })) : k.items
          return { ...k, stage: next, items }
        }),
      }
    }
    case 'KDS_TOGGLE_ITEM':
      return {
        ...state,
        kitchenTickets: state.kitchenTickets.map((k) =>
          k.orderId === action.orderId
            ? { ...k, items: k.items.map((it) => (it.productId === action.productId ? { ...it, done: !it.done } : it)) }
            : k,
        ),
      }

    default:
      return state
  }
}

// Strip the per-client session before sending domain data to the server.
function domainOf(state) {
  const { session, ...domain } = state
  return domain
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const skipPersist = useRef(false)
  const ready = useRef(false)
  const pushTimer = useRef(null)
  const clientId = useRef('cid-' + Math.random().toString(36).slice(2, 9))

  // 1) On mount, pull authoritative state from the backend (if any).
  useEffect(() => {
    let cancelled = false
    apiGetState()
      .then((domain) => {
        if (cancelled) return
        skipPersist.current = true
        dispatch({ type: '__HYDRATE_DOMAIN__', domain })
      })
      .catch(() => { /* offline — run from local cache */ })
      .finally(() => { ready.current = true })
    return () => { cancelled = true }
  }, [])

  // 2) Persist on every change: cache locally + debounce-push to server.
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
    if (!ready.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      apiPutState(domainOf(state), clientId.current).catch(() => { /* offline */ })
    }, 350)
  }, [state])

  // 3) Live sync over Supabase Realtime (another device saved → re-fetch).
  useEffect(() => {
    const channel = subscribeRealtime(() => {
      apiGetState()
        .then((domain) => {
          skipPersist.current = true
          dispatch({ type: '__HYDRATE_DOMAIN__', domain })
        })
        .catch(() => {})
    })
    return () => {
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [])

  // 4) Offline cross-tab sync via the localStorage `storage` event.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) {
        try {
          skipPersist.current = true
          dispatch({ type: '__HYDRATE__', state: JSON.parse(e.newValue) })
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/* ---------------- Selectors / helpers ---------------- */
export function useSelectors() {
  const { state } = useStore()
  return {
    currentUser: state.users.find((u) => u.id === state.session.currentUserId) || null,
    allTables: state.floors.flatMap((f) => f.tables.map((t2) => ({ ...t2, floorId: f.id, floorName: f.name }))),
    tableById: (id) => state.floors.flatMap((f) => f.tables).find((t2) => t2.id === id) || null,
    categoryById: (id) => state.categories.find((c) => c.id === id) || null,
    productById: (id) => state.products.find((p) => p.id === id) || null,
    customerById: (id) => state.customers.find((c) => c.id === id) || null,
    userById: (id) => state.users.find((u) => u.id === id) || null,
    activeDraftForTable: (tableId) =>
      state.orders.find((o) => o.tableId === tableId && o.status === 'draft') || null,
  }
}
