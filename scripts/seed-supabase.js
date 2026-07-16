// scripts/seed-supabase.js — One-time seed script for Supabase.
// Run with:  node scripts/seed-supabase.js
// Add --reset flag to clear existing data and re-seed.
//
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// You can set them in .env at the project root.
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from project root
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'))
} catch {
  // .env not present — env vars must be set directly
}

// Now import supabase client and seed data
const { createClient } = await import('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env or environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Load the seed data — set up VITE_* env vars before importing
// (the seed reads employee data from env)
const { buildInitialState } = await import('../src/store/seed.js')
const { session, ...domain } = buildInitialState()

const force = process.argv.includes('--reset')

// Check if DB already has data
const { data: existingUsers } = await supabase.from('users').select('id').limit(1)
if (existingUsers?.length && !force) {
  console.log('• Database already has data (use --reset to overwrite).')
  process.exit(0)
}

console.log('🌱 Seeding Supabase database...')
const start = Date.now()

// Clear all tables in child-first order
console.log('  Clearing existing data...')
for (const t of [
  'order_items', 'kitchen_ticket_items', 'orders', 'kitchen_tickets',
  'tables', 'products', 'promotions', 'coupons', 'payment_methods',
  'floors', 'categories', 'customers', 'users', 'meta',
]) {
  // Use a broad delete that matches everything
  const { error } = await supabase.from(t).delete().gte('id', '')
  // For tables with non-text id or different PK, try alternative
  if (error) {
    await supabase.from(t).delete().neq('id', -99999)
  }
}
// Also clean tables with special PKs
await supabase.from('kitchen_tickets').delete().gte('orderId', '')
await supabase.from('order_items').delete().gte('id', 0)
await supabase.from('kitchen_ticket_items').delete().gte('id', 0)
await supabase.from('meta').delete().gte('key', '')

// ── Insert users ──
console.log(`  Inserting ${domain.users.length} users...`)
await supabase.from('users').insert(
  domain.users.map((u) => ({
    id: u.id, name: u.name, email: u.email, password: u.password,
    role: u.role || 'employee', archived: !!u.archived,
  }))
)

// ── Insert customers (batch 500) ──
console.log(`  Inserting ${domain.customers.length} customers...`)
const custs = domain.customers.map((c) => ({ id: c.id, name: c.name, email: c.email || '', phone: c.phone || '' }))
for (let i = 0; i < custs.length; i += 500) {
  await supabase.from('customers').insert(custs.slice(i, i + 500))
}

// ── Insert categories ──
console.log(`  Inserting ${domain.categories.length} categories...`)
await supabase.from('categories').insert(domain.categories)

// ── Insert products (batch 500) ──
console.log(`  Inserting ${domain.products.length} products...`)
const prods = domain.products.map((p) => ({
  id: p.id, name: p.name, categoryId: p.categoryId, price: p.price,
  uom: p.uom || 'piece', tax: p.tax || 0, description: p.description || '',
  kitchen: !!p.kitchen,
}))
for (let i = 0; i < prods.length; i += 500) {
  await supabase.from('products').insert(prods.slice(i, i + 500))
}

// ── Insert floors + tables ──
console.log(`  Inserting ${domain.floors.length} floors...`)
await supabase.from('floors').insert(domain.floors.map((f) => ({ id: f.id, name: f.name })))
const allTables = domain.floors.flatMap((f) =>
  (f.tables || []).map((t) => ({
    id: t.id, floorId: f.id, number: String(t.number),
    seats: t.seats ?? 4, active: t.active !== false,
  }))
)
console.log(`  Inserting ${allTables.length} tables...`)
await supabase.from('tables').insert(allTables)

// ── Insert payment methods ──
console.log('  Inserting payment methods...')
for (const id of ['cash', 'card', 'upi']) {
  const pm = (domain.paymentMethods || {})[id] || { enabled: true }
  await supabase.from('payment_methods').insert({
    id, enabled: pm.enabled !== false, upiId: pm.upiId || null,
  })
}

// ── Insert coupons ──
console.log(`  Inserting ${domain.coupons.length} coupons...`)
await supabase.from('coupons').insert(
  domain.coupons.map((c) => ({ id: c.id, code: c.code, discountType: c.discountType || 'percent', value: c.value || 0 }))
)

// ── Insert promotions ──
console.log(`  Inserting ${domain.promotions.length} promotions...`)
await supabase.from('promotions').insert(
  domain.promotions.map((p) => ({
    id: p.id, name: p.name, appliesTo: p.appliesTo || 'order',
    productId: p.productId || null, minQty: p.minQty ?? null,
    minAmount: p.minAmount ?? null, discountType: p.discountType || 'percent',
    value: p.value || 0,
  }))
)

// ── Insert orders (batch 500) ──
const ORDER_COLS = [
  'id', 'number', 'tableId', 'floorId', 'employeeId', 'customerId',
  'status', 'paymentMethod', 'couponId', 'amount', 'createdAt', 'paidAt',
]
console.log(`  Inserting ${domain.orders.length} orders...`)
const orderRows = domain.orders.map((o) => {
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
  const batch = i / 500 + 1
  const total = Math.ceil(orderRows.length / 500)
  process.stdout.write(`    batch ${batch}/${total}\r`)
  await supabase.from('orders').insert(orderRows.slice(i, i + 500))
}
console.log()

// ── Insert order items (batch 500) ──
const allOrderItems = domain.orders.flatMap((o) =>
  (o.items || []).map((it) => ({
    orderId: o.id, productId: it.productId ?? null,
    name: it.name ?? '', price: it.price ?? 0, qty: it.qty ?? 1, tax: it.tax ?? 0,
  }))
)
console.log(`  Inserting ${allOrderItems.length} order items...`)
for (let i = 0; i < allOrderItems.length; i += 500) {
  const batch = i / 500 + 1
  const total = Math.ceil(allOrderItems.length / 500)
  process.stdout.write(`    batch ${batch}/${total}\r`)
  await supabase.from('order_items').insert(allOrderItems.slice(i, i + 500))
}
console.log()

// ── Insert kitchen tickets (if any) ──
if (domain.kitchenTickets?.length) {
  console.log(`  Inserting ${domain.kitchenTickets.length} kitchen tickets...`)
  await supabase.from('kitchen_tickets').insert(
    domain.kitchenTickets.map((k) => ({
      orderId: k.orderId, number: k.number ?? null,
      stage: k.stage || 'to_cook', createdAt: k.createdAt ?? null,
    }))
  )
}

// ── Set meta ──
await supabase.from('meta').upsert({ key: 'orderCounter', value: String(domain.orderCounter) }, { onConflict: 'key' })
await supabase.from('meta').upsert({ key: 'lastSync', value: new Date().toISOString() }, { onConflict: 'key' })

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`✅ Database seeded in ${elapsed}s`)
console.log(`   ${domain.users.length} users, ${domain.customers.length} customers, ${domain.products.length} products, ${domain.orders.length} orders`)
