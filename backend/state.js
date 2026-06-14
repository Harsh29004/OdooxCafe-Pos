// state.js — the bridge between the frontend's single state object and the
// relational database. loadState() rebuilds the exact shape the React store
// expects; saveState() explodes that object back into proper tables in one
// transaction. Per-client `session` is intentionally NOT persisted here.
import { db } from './db.js'

// Columns we store as real order fields; everything else rides in `extra` JSON.
const ORDER_COLS = [
  'id', 'number', 'tableId', 'floorId', 'employeeId', 'customerId',
  'status', 'paymentMethod', 'couponId', 'amount', 'createdAt', 'paidAt',
]

export function loadState() {
  const users = db.prepare('SELECT id,name,email,password,role,archived FROM users').all()
    .map((u) => ({ ...u, archived: !!u.archived }))

  const customers = db.prepare('SELECT id,name,email,phone FROM customers').all()
  const categories = db.prepare('SELECT id,name,color FROM categories').all()

  const products = db.prepare('SELECT id,name,categoryId,price,uom,tax,description,kitchen FROM products').all()
    .map((p) => ({ ...p, kitchen: !!p.kitchen }))

  const floorRows = db.prepare('SELECT id,name FROM floors').all()
  const tableRows = db.prepare('SELECT id,floorId,number,seats,active FROM tables').all()
  const floors = floorRows.map((f) => ({
    id: f.id,
    name: f.name,
    tables: tableRows
      .filter((t) => t.floorId === f.id)
      .map((t) => ({ id: t.id, number: t.number, seats: t.seats, active: !!t.active })),
  }))

  const pmRows = db.prepare('SELECT id,enabled,upiId FROM payment_methods').all()
  const paymentMethods = { cash: { enabled: true }, card: { enabled: true }, upi: { enabled: true, upiId: '' } }
  for (const r of pmRows) {
    paymentMethods[r.id] = r.id === 'upi'
      ? { enabled: !!r.enabled, upiId: r.upiId || '' }
      : { enabled: !!r.enabled }
  }

  const coupons = db.prepare('SELECT id,code,discountType,value FROM coupons').all()
  const promotions = db.prepare(
    'SELECT id,name,appliesTo,productId,minQty,minAmount,discountType,value FROM promotions',
  ).all().map((p) => ({
    ...p,
    // drop null optionals so the object matches the frontend's seed shape
    ...(p.productId == null ? { productId: undefined } : {}),
  }))

  const itemsByOrder = {}
  for (const it of db.prepare('SELECT orderId,productId,name,price,qty,tax FROM order_items').all()) {
    ;(itemsByOrder[it.orderId] ||= []).push({
      productId: it.productId, name: it.name, price: it.price, qty: it.qty, tax: it.tax,
    })
  }
  const orders = db.prepare('SELECT * FROM orders').all().map((o) => {
    const extra = safeJson(o.extra)
    const base = {}
    for (const c of ORDER_COLS) base[c] = o[c]
    return { ...extra, ...base, items: itemsByOrder[o.id] || [] }
  })

  const ticketItemsByOrder = {}
  for (const it of db.prepare('SELECT orderId,productId,name,qty,done FROM kitchen_ticket_items').all()) {
    ;(ticketItemsByOrder[it.orderId] ||= []).push({
      productId: it.productId, name: it.name, qty: it.qty, done: !!it.done,
    })
  }
  const kitchenTickets = db.prepare('SELECT orderId,number,stage,createdAt FROM kitchen_tickets').all()
    .map((k) => ({ ...k, items: ticketItemsByOrder[k.orderId] || [] }))

  const orderCounter = Number(getMeta('orderCounter') ?? 1006)

  return {
    users, customers, categories, products, floors, paymentMethods,
    coupons, promotions, orders, kitchenTickets, orderCounter,
  }
}

// Replace the whole domain in one transaction. `session` is ignored on purpose.
export const saveState = db.transaction((state) => {
  // children first, then parents
  for (const t of [
    'order_items', 'kitchen_ticket_items', 'orders', 'kitchen_tickets',
    'tables', 'products', 'promotions', 'coupons', 'payment_methods',
    'floors', 'categories', 'customers', 'users',
  ]) db.prepare(`DELETE FROM ${t}`).run()

  const insUser = db.prepare('INSERT INTO users (id,name,email,password,role,archived) VALUES (@id,@name,@email,@password,@role,@archived)')
  for (const u of state.users || []) insUser.run({ ...u, archived: u.archived ? 1 : 0, role: u.role || 'employee' })

  const insCust = db.prepare('INSERT INTO customers (id,name,email,phone) VALUES (@id,@name,@email,@phone)')
  for (const c of state.customers || []) insCust.run({ email: '', phone: '', ...c })

  const insCat = db.prepare('INSERT INTO categories (id,name,color) VALUES (@id,@name,@color)')
  for (const c of state.categories || []) insCat.run(c)

  const insProd = db.prepare('INSERT INTO products (id,name,categoryId,price,uom,tax,description,kitchen) VALUES (@id,@name,@categoryId,@price,@uom,@tax,@description,@kitchen)')
  for (const p of state.products || []) insProd.run({
    uom: 'piece', tax: 0, description: '', ...p, kitchen: p.kitchen ? 1 : 0,
  })

  const insFloor = db.prepare('INSERT INTO floors (id,name) VALUES (@id,@name)')
  const insTable = db.prepare('INSERT INTO tables (id,floorId,number,seats,active) VALUES (@id,@floorId,@number,@seats,@active)')
  for (const f of state.floors || []) {
    insFloor.run({ id: f.id, name: f.name })
    for (const t of f.tables || []) insTable.run({
      id: t.id, floorId: f.id, number: String(t.number), seats: t.seats ?? 4, active: t.active ? 1 : 0,
    })
  }

  const insPm = db.prepare('INSERT INTO payment_methods (id,enabled,upiId) VALUES (@id,@enabled,@upiId)')
  for (const id of ['cash', 'card', 'upi']) {
    const pm = (state.paymentMethods || {})[id] || { enabled: true }
    insPm.run({ id, enabled: pm.enabled ? 1 : 0, upiId: pm.upiId || null })
  }

  const insCoupon = db.prepare('INSERT INTO coupons (id,code,discountType,value) VALUES (@id,@code,@discountType,@value)')
  for (const c of state.coupons || []) insCoupon.run({ discountType: 'percent', value: 0, ...c })

  const insPromo = db.prepare('INSERT INTO promotions (id,name,appliesTo,productId,minQty,minAmount,discountType,value) VALUES (@id,@name,@appliesTo,@productId,@minQty,@minAmount,@discountType,@value)')
  for (const p of state.promotions || []) insPromo.run({
    appliesTo: 'order', productId: null, minQty: null, minAmount: null, discountType: 'percent', value: 0, ...p,
  })

  const insOrder = db.prepare(`INSERT INTO orders
    (id,number,tableId,floorId,employeeId,customerId,status,paymentMethod,couponId,amount,createdAt,paidAt,extra)
    VALUES (@id,@number,@tableId,@floorId,@employeeId,@customerId,@status,@paymentMethod,@couponId,@amount,@createdAt,@paidAt,@extra)`)
  const insItem = db.prepare('INSERT INTO order_items (orderId,productId,name,price,qty,tax) VALUES (@orderId,@productId,@name,@price,@qty,@tax)')
  for (const o of state.orders || []) {
    const extra = {}
    for (const k of Object.keys(o)) if (!ORDER_COLS.includes(k) && k !== 'items') extra[k] = o[k]
    insOrder.run({
      id: o.id, number: o.number ?? null, tableId: o.tableId ?? null, floorId: o.floorId ?? null,
      employeeId: o.employeeId ?? null, customerId: o.customerId ?? null, status: o.status || 'draft',
      paymentMethod: o.paymentMethod ?? null, couponId: o.couponId ?? null, amount: o.amount ?? 0,
      createdAt: o.createdAt ?? null, paidAt: o.paidAt ?? null, extra: JSON.stringify(extra),
    })
    for (const it of o.items || []) insItem.run({
      orderId: o.id, productId: it.productId ?? null, name: it.name ?? '', price: it.price ?? 0, qty: it.qty ?? 1, tax: it.tax ?? 0,
    })
  }

  const insTicket = db.prepare('INSERT INTO kitchen_tickets (orderId,number,stage,createdAt) VALUES (@orderId,@number,@stage,@createdAt)')
  const insTItem = db.prepare('INSERT INTO kitchen_ticket_items (orderId,productId,name,qty,done) VALUES (@orderId,@productId,@name,@qty,@done)')
  for (const k of state.kitchenTickets || []) {
    insTicket.run({ orderId: k.orderId, number: k.number ?? null, stage: k.stage || 'to_cook', createdAt: k.createdAt ?? null })
    for (const it of k.items || []) insTItem.run({
      orderId: k.orderId, productId: it.productId ?? null, name: it.name ?? '', qty: it.qty ?? 1, done: it.done ? 1 : 0,
    })
  }

  if (state.orderCounter != null) setMeta('orderCounter', String(state.orderCounter))
})

// --- small helpers ------------------------------------------------------
function safeJson(s) { try { return s ? JSON.parse(s) : {} } catch { return {} } }
function getMeta(key) { return db.prepare('SELECT value FROM meta WHERE key=?').get(key)?.value }
function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value)
}
