// api/_lib/state.js — the bridge between the frontend's single state object
// and the Supabase PostgreSQL database. Async version of backend/state.js.
// loadState() rebuilds the exact shape the React store expects;
// saveState() explodes that object back into proper tables.
import { supabase } from './supabase.js'

// Columns we store as real order fields; everything else rides in `extra` JSON.
const ORDER_COLS = [
  'id', 'number', 'tableId', 'floorId', 'employeeId', 'customerId',
  'status', 'paymentMethod', 'couponId', 'amount', 'createdAt', 'paidAt',
]

export async function loadState() {
  const [
    { data: usersRaw },
    { data: customers },
    { data: categories },
    { data: productsRaw },
    { data: floorRows },
    { data: tableRows },
    { data: pmRows },
    { data: coupons },
    { data: promotionsRaw },
    { data: ordersRaw },
    { data: orderItemsRaw },
    { data: ticketsRaw },
    { data: ticketItemsRaw },
  ] = await Promise.all([
    supabase.from('users').select('id,name,email,password,role,archived'),
    supabase.from('customers').select('id,name,email,phone'),
    supabase.from('categories').select('id,name,color'),
    supabase.from('products').select('id,name,categoryId,price,uom,tax,description,kitchen'),
    supabase.from('floors').select('id,name'),
    supabase.from('tables').select('id,floorId,number,seats,active'),
    supabase.from('payment_methods').select('id,enabled,upiId'),
    supabase.from('coupons').select('id,code,discountType,value'),
    supabase.from('promotions').select('id,name,appliesTo,productId,minQty,minAmount,discountType,value'),
    supabase.from('orders').select('*'),
    supabase.from('order_items').select('orderId,productId,name,price,qty,tax'),
    supabase.from('kitchen_tickets').select('orderId,number,stage,createdAt'),
    supabase.from('kitchen_ticket_items').select('orderId,productId,name,qty,done'),
  ])

  const users = (usersRaw || []).map((u) => ({ ...u, archived: !!u.archived }))
  const products = (productsRaw || []).map((p) => ({ ...p, kitchen: !!p.kitchen }))

  const floors = (floorRows || []).map((f) => ({
    id: f.id,
    name: f.name,
    tables: (tableRows || [])
      .filter((t) => t.floorId === f.id)
      .map((t) => ({ id: t.id, number: t.number, seats: t.seats, active: !!t.active })),
  }))

  const paymentMethods = { cash: { enabled: true }, card: { enabled: true }, upi: { enabled: true, upiId: '' } }
  for (const r of pmRows || []) {
    paymentMethods[r.id] = r.id === 'upi'
      ? { enabled: !!r.enabled, upiId: r.upiId || '' }
      : { enabled: !!r.enabled }
  }

  const promotions = (promotionsRaw || []).map((p) => ({
    ...p,
    ...(p.productId == null ? { productId: undefined } : {}),
  }))

  const itemsByOrder = {}
  for (const it of orderItemsRaw || []) {
    ;(itemsByOrder[it.orderId] ||= []).push({
      productId: it.productId, name: it.name, price: it.price, qty: it.qty, tax: it.tax,
    })
  }

  const orders = (ordersRaw || []).map((o) => {
    const extra = safeJson(o.extra)
    const base = {}
    for (const c of ORDER_COLS) base[c] = o[c]
    return { ...extra, ...base, items: itemsByOrder[o.id] || [] }
  })

  const ticketItemsByOrder = {}
  for (const it of ticketItemsRaw || []) {
    ;(ticketItemsByOrder[it.orderId] ||= []).push({
      productId: it.productId, name: it.name, qty: it.qty, done: !!it.done,
    })
  }
  const kitchenTickets = (ticketsRaw || []).map((k) => ({
    ...k, items: ticketItemsByOrder[k.orderId] || [],
  }))

  const orderCounter = Number(await getMeta('orderCounter') ?? 1006)

  return {
    users, customers, categories, products, floors, paymentMethods,
    coupons, promotions, orders, kitchenTickets, orderCounter,
  }
}

// Replace the whole domain in one go. Supabase doesn't have native transactions
// via the JS client, so we delete-then-insert per table sequentially. The
// service-role key bypasses RLS so this is safe for a single-tenant POS.
export async function saveState(state) {
  // Delete in child-first order
  for (const t of [
    'order_items', 'kitchen_ticket_items', 'orders', 'kitchen_tickets',
    'tables', 'products', 'promotions', 'coupons', 'payment_methods',
    'floors', 'categories', 'customers', 'users',
  ]) {
    await supabase.from(t).delete().neq('id', '__never_match__')
    // For tables without 'id' as PK, delete differently:
  }
  // Also delete from tables that use different PK columns
  await supabase.from('kitchen_tickets').delete().neq('orderId', '__never_match__')
  await supabase.from('order_items').delete().neq('id', -1)
  await supabase.from('kitchen_ticket_items').delete().neq('id', -1)

  // Insert users
  if (state.users?.length) {
    await supabase.from('users').insert(
      state.users.map((u) => ({
        id: u.id, name: u.name, email: u.email, password: u.password,
        role: u.role || 'employee', archived: !!u.archived,
      }))
    )
  }

  // Insert customers
  if (state.customers?.length) {
    // Supabase has a max of ~1000 rows per insert, batch if needed
    const custs = state.customers.map((c) => ({ email: '', phone: '', ...c }))
    for (let i = 0; i < custs.length; i += 500) {
      await supabase.from('customers').insert(custs.slice(i, i + 500))
    }
  }

  // Insert categories
  if (state.categories?.length) {
    await supabase.from('categories').insert(state.categories)
  }

  // Insert products
  if (state.products?.length) {
    const prods = state.products.map((p) => ({
      id: p.id, name: p.name, categoryId: p.categoryId, price: p.price,
      uom: p.uom || 'piece', tax: p.tax || 0, description: p.description || '',
      kitchen: !!p.kitchen,
    }))
    for (let i = 0; i < prods.length; i += 500) {
      await supabase.from('products').insert(prods.slice(i, i + 500))
    }
  }

  // Insert floors and tables
  if (state.floors?.length) {
    await supabase.from('floors').insert(state.floors.map((f) => ({ id: f.id, name: f.name })))
    const allTables = state.floors.flatMap((f) =>
      (f.tables || []).map((t) => ({
        id: t.id, floorId: f.id, number: String(t.number),
        seats: t.seats ?? 4, active: t.active !== false,
      }))
    )
    if (allTables.length) {
      await supabase.from('tables').insert(allTables)
    }
  }

  // Insert payment methods
  for (const id of ['cash', 'card', 'upi']) {
    const pm = (state.paymentMethods || {})[id] || { enabled: true }
    await supabase.from('payment_methods').insert({
      id, enabled: pm.enabled !== false, upiId: pm.upiId || null,
    })
  }

  // Insert coupons
  if (state.coupons?.length) {
    await supabase.from('coupons').insert(
      state.coupons.map((c) => ({ id: c.id, code: c.code, discountType: c.discountType || 'percent', value: c.value || 0 }))
    )
  }

  // Insert promotions
  if (state.promotions?.length) {
    await supabase.from('promotions').insert(
      state.promotions.map((p) => ({
        id: p.id, name: p.name, appliesTo: p.appliesTo || 'order',
        productId: p.productId || null, minQty: p.minQty ?? null,
        minAmount: p.minAmount ?? null, discountType: p.discountType || 'percent',
        value: p.value || 0,
      }))
    )
  }

  // Insert orders + order_items (batch in chunks of 500)
  if (state.orders?.length) {
    const orderRows = state.orders.map((o) => {
      const extra = {}
      for (const k of Object.keys(o)) if (!ORDER_COLS.includes(k) && k !== 'items') extra[k] = o[k]
      return {
        id: o.id, number: o.number ?? null, tableId: o.tableId ?? null,
        floorId: o.floorId ?? null, employeeId: o.employeeId ?? null,
        customerId: o.customerId ?? null, status: o.status || 'draft',
        paymentMethod: o.paymentMethod ?? null, couponId: o.couponId ?? null,
        amount: o.amount ?? 0, createdAt: o.createdAt ?? null,
        paidAt: o.paidAt ?? null, extra: JSON.stringify(extra),
      }
    })
    for (let i = 0; i < orderRows.length; i += 500) {
      await supabase.from('orders').insert(orderRows.slice(i, i + 500))
    }

    const allItems = state.orders.flatMap((o) =>
      (o.items || []).map((it) => ({
        orderId: o.id, productId: it.productId ?? null,
        name: it.name ?? '', price: it.price ?? 0, qty: it.qty ?? 1, tax: it.tax ?? 0,
      }))
    )
    for (let i = 0; i < allItems.length; i += 500) {
      await supabase.from('order_items').insert(allItems.slice(i, i + 500))
    }
  }

  // Insert kitchen tickets + items
  if (state.kitchenTickets?.length) {
    await supabase.from('kitchen_tickets').insert(
      state.kitchenTickets.map((k) => ({
        orderId: k.orderId, number: k.number ?? null,
        stage: k.stage || 'to_cook', createdAt: k.createdAt ?? null,
      }))
    )
    const allTicketItems = state.kitchenTickets.flatMap((k) =>
      (k.items || []).map((it) => ({
        orderId: k.orderId, productId: it.productId ?? null,
        name: it.name ?? '', qty: it.qty ?? 1, done: !!it.done,
      }))
    )
    if (allTicketItems.length) {
      for (let i = 0; i < allTicketItems.length; i += 500) {
        await supabase.from('kitchen_ticket_items').insert(allTicketItems.slice(i, i + 500))
      }
    }
  }

  // Update order counter
  if (state.orderCounter != null) {
    await setMeta('orderCounter', String(state.orderCounter))
  }

  // Signal state change via meta table (triggers Supabase Realtime)
  await setMeta('lastSync', new Date().toISOString())
}

// --- small helpers ------------------------------------------------------
function safeJson(s) { try { return s ? JSON.parse(s) : {} } catch { return {} } }

async function getMeta(key) {
  const { data } = await supabase.from('meta').select('value').eq('key', key).single()
  return data?.value ?? null
}

async function setMeta(key, value) {
  await supabase.from('meta').upsert({ key, value }, { onConflict: 'key' })
}
