// ---------------------------------------------------------------------------
// store/seed.js — the demo/seed data, in a plain JS module (no React/JSX) so
// that BOTH the frontend store (store.jsx) and the Node backend (backend/seed.js)
// import it as a single source of truth.
//
// Privacy notes (intentional design):
//   • Employees are NEVER written here. Their names, emails and passwords are
//     loaded from the .env file (VITE_ADMIN_* / VITE_EMP{n}_*) so no credential
//     ever lives in committed source. See buildUsersFromEnv() below.
//   • Customers are GENERATED procedurally from neutral word pools — this file
//     contains no real person's contact details. The generated records are what
//     gets written into the database; the source only holds the generator.
// ---------------------------------------------------------------------------

// This module runs in two very different environments:
//   • the browser, bundled by Vite, where config comes from import.meta.env
//   • the Node backend, where the same vars live on process.env
// Reading import.meta.env directly throws in Node (it's undefined), so resolve
// a single env source up front and read every VITE_* value through env().
const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : null
const nodeEnv = typeof process !== 'undefined' && process.env ? process.env : null
function env(key, fallback = '') {
  return (viteEnv && viteEnv[key]) || (nodeEnv && nodeEnv[key]) || fallback
}

// mulberry32 — tiny deterministic PRNG. Same seed → same sequence everywhere,
// so the frontend fallback and the backend DB are seeded with identical data.
function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const seedCategories = [
  { id: 'cat-coffee', name: 'Coffee', color: '#714B67' },
  { id: 'cat-tea', name: 'Tea', color: '#2E7D6F' },
  { id: 'cat-pastry', name: 'Pastries', color: '#E07B05' },
  { id: 'cat-snacks', name: 'Snacks', color: '#C2410C' },
  { id: 'cat-cold', name: 'Cold Drinks', color: '#2563EB' },
  { id: 'cat-dessert', name: 'Desserts', color: '#DB2777' },
]

// ── Hand-written base menu (36 items) ───────────────────────────────────────
const baseProducts = [
  { id: 'p-1', name: 'Espresso', categoryId: 'cat-coffee', price: 120, uom: 'piece', tax: 5, description: 'Single shot of rich espresso.', kitchen: true },
  { id: 'p-2', name: 'Cappuccino', categoryId: 'cat-coffee', price: 180, uom: 'piece', tax: 5, description: 'Espresso with steamed milk foam.', kitchen: true },
  { id: 'p-3', name: 'Caffe Latte', categoryId: 'cat-coffee', price: 190, uom: 'piece', tax: 5, description: 'Smooth espresso with steamed milk.', kitchen: true },
  { id: 'p-4', name: 'Cold Brew', categoryId: 'cat-coffee', price: 210, uom: 'piece', tax: 5, description: '18-hour slow steeped cold brew.', kitchen: true },
  { id: 'p-5', name: 'Masala Chai', categoryId: 'cat-tea', price: 90, uom: 'piece', tax: 5, description: 'Spiced Indian milk tea.', kitchen: true },
  { id: 'p-6', name: 'Green Tea', categoryId: 'cat-tea', price: 100, uom: 'piece', tax: 5, description: 'Light and refreshing green tea.', kitchen: true },
  { id: 'p-7', name: 'Butter Croissant', categoryId: 'cat-pastry', price: 150, uom: 'piece', tax: 12, description: 'Flaky all-butter croissant.', kitchen: true },
  { id: 'p-8', name: 'Chocolate Muffin', categoryId: 'cat-pastry', price: 140, uom: 'piece', tax: 12, description: 'Double chocolate chip muffin.', kitchen: true },
  { id: 'p-9', name: 'Veg Sandwich', categoryId: 'cat-snacks', price: 170, uom: 'piece', tax: 12, description: 'Grilled veggies with cheese.', kitchen: true },
  { id: 'p-10', name: 'French Fries', categoryId: 'cat-snacks', price: 130, uom: 'piece', tax: 12, description: 'Crispy salted fries.', kitchen: true },
  { id: 'p-11', name: 'Iced Lemonade', categoryId: 'cat-cold', price: 110, uom: 'piece', tax: 5, description: 'Fresh squeezed lemonade.', kitchen: false },
  { id: 'p-12', name: 'Sparkling Water', categoryId: 'cat-cold', price: 80, uom: 'piece', tax: 5, description: 'Chilled sparkling water.', kitchen: false },
  { id: 'p-13', name: 'Cheesecake', categoryId: 'cat-dessert', price: 220, uom: 'piece', tax: 12, description: 'New York style cheesecake.', kitchen: true },
  { id: 'p-14', name: 'Brownie', categoryId: 'cat-dessert', price: 160, uom: 'piece', tax: 12, description: 'Fudgy walnut brownie.', kitchen: true },
  { id: 'p-15', name: 'Mocha', categoryId: 'cat-coffee', price: 200, uom: 'piece', tax: 5, description: 'Espresso with chocolate and milk.', kitchen: true },
  { id: 'p-16', name: 'Bottled Cola', categoryId: 'cat-cold', price: 70, uom: 'piece', tax: 5, description: 'Classic chilled cola.', kitchen: false },
  // ☕ Coffee
  { id: 'p-17', name: 'Americano', categoryId: 'cat-coffee', price: 140, uom: 'piece', tax: 5, description: 'Espresso diluted with hot water, lighter body.', kitchen: true },
  { id: 'p-18', name: 'Flat White', categoryId: 'cat-coffee', price: 200, uom: 'piece', tax: 5, description: 'Espresso with velvety steamed milk, minimal foam.', kitchen: true },
  { id: 'p-19', name: 'Filter Coffee', categoryId: 'cat-coffee', price: 100, uom: 'piece', tax: 5, description: 'South Indian style filter coffee with chicory.', kitchen: true },
  { id: 'p-20', name: 'Affogato', categoryId: 'cat-coffee', price: 230, uom: 'piece', tax: 5, description: 'Hot espresso poured over vanilla ice cream.', kitchen: true },
  // 🍵 Tea
  { id: 'p-21', name: 'Ginger Chai', categoryId: 'cat-tea', price: 95, uom: 'piece', tax: 5, description: 'Masala chai with an extra ginger kick.', kitchen: true },
  { id: 'p-22', name: 'Peach Iced Tea', categoryId: 'cat-tea', price: 130, uom: 'piece', tax: 5, description: 'Chilled black tea with a fruity twist.', kitchen: true },
  { id: 'p-23', name: 'Lemongrass Herbal Tea', categoryId: 'cat-tea', price: 110, uom: 'piece', tax: 5, description: 'Caffeine-free, calming infusion.', kitchen: true },
  // 🥐 Pastry
  { id: 'p-24', name: 'Cinnamon Roll', categoryId: 'cat-pastry', price: 160, uom: 'piece', tax: 12, description: 'Soft roll with cinnamon-sugar swirl and icing.', kitchen: true },
  { id: 'p-25', name: 'Blueberry Muffin', categoryId: 'cat-pastry', price: 150, uom: 'piece', tax: 12, description: 'Moist muffin packed with blueberries.', kitchen: true },
  { id: 'p-26', name: 'Almond Croissant', categoryId: 'cat-pastry', price: 170, uom: 'piece', tax: 12, description: 'Croissant filled with sweet almond cream.', kitchen: true },
  // 🍟 Snacks
  { id: 'p-27', name: 'Masala Maggi', categoryId: 'cat-snacks', price: 90, uom: 'piece', tax: 12, description: 'Spiced instant noodles, cafe classic.', kitchen: true },
  { id: 'p-28', name: 'Grilled Cheese Sandwich', categoryId: 'cat-snacks', price: 180, uom: 'piece', tax: 12, description: 'Toasted bread with melted cheese.', kitchen: true },
  { id: 'p-29', name: 'Veg Burger', categoryId: 'cat-snacks', price: 170, uom: 'piece', tax: 12, description: 'Crispy veg patty burger.', kitchen: true },
  { id: 'p-30', name: 'Loaded Nachos', categoryId: 'cat-snacks', price: 190, uom: 'piece', tax: 12, description: 'Tortilla chips, cheese, salsa, jalapeños.', kitchen: true },
  // 🧃 Cold Drinks
  { id: 'p-31', name: 'Cold Coffee', categoryId: 'cat-cold', price: 170, uom: 'piece', tax: 5, description: 'Blended chilled coffee with ice cream.', kitchen: true },
  { id: 'p-32', name: 'Fresh Lime Soda', categoryId: 'cat-cold', price: 90, uom: 'piece', tax: 5, description: 'Sweet or salted lime soda.', kitchen: false },
  { id: 'p-33', name: 'Mango Smoothie', categoryId: 'cat-cold', price: 160, uom: 'piece', tax: 5, description: 'Creamy blended mango and yogurt.', kitchen: true },
  // 🍰 Dessert
  { id: 'p-34', name: 'Belgian Waffle', categoryId: 'cat-dessert', price: 200, uom: 'piece', tax: 12, description: 'Crispy waffle with chocolate sauce and ice cream.', kitchen: true },
  { id: 'p-35', name: 'Tiramisu', categoryId: 'cat-dessert', price: 240, uom: 'piece', tax: 12, description: 'Coffee-soaked layers with mascarpone cream.', kitchen: true },
  { id: 'p-36', name: 'Ice Cream Scoop', categoryId: 'cat-dessert', price: 90, uom: 'piece', tax: 12, description: 'Single scoop — vanilla, chocolate, or strawberry.', kitchen: true },
]

// Pools used to generate the rest of the menu up to 100 products. Each combo is
// "<modifier> <base>"; prices are picked within the category's band.
const PRODUCT_POOLS = {
  'cat-coffee': {
    tax: 5, kitchen: true, priceMin: 100, priceMax: 250,
    mods: ['Hazelnut', 'Vanilla', 'Caramel', 'Salted Caramel', 'Cinnamon', 'Coconut', 'Irish', 'Toffee Nut', 'Maple', 'Pumpkin Spice'],
    bases: ['Latte', 'Cappuccino', 'Macchiato', 'Cortado', 'Frappe'],
  },
  'cat-tea': {
    tax: 5, kitchen: true, priceMin: 80, priceMax: 160,
    mods: ['Earl Grey', 'Jasmine', 'Chamomile', 'Hibiscus', 'Mint', 'Tulsi', 'Oolong', 'Darjeeling', 'Assam', 'Rose'],
    bases: ['Tea', 'Iced Tea', 'Infusion'],
  },
  'cat-pastry': {
    tax: 12, kitchen: true, priceMin: 120, priceMax: 230,
    mods: ['Chocolate', 'Apple', 'Raspberry', 'Custard', 'Pecan', 'Lemon', 'Strawberry', 'Hazelnut'],
    bases: ['Danish', 'Scone', 'Eclair', 'Tart', 'Brioche', 'Puff'],
  },
  'cat-snacks': {
    tax: 12, kitchen: true, priceMin: 90, priceMax: 250,
    mods: ['Cheese', 'Paneer', 'Peri Peri', 'Veg', 'Spicy', 'Corn', 'Mushroom', 'Pesto'],
    bases: ['Spring Rolls', 'Quesadilla', 'Wrap', 'Pizza Slice', 'Garlic Bread', 'Pasta', 'Sliders', 'Tacos'],
  },
  'cat-cold': {
    tax: 5, kitchen: true, priceMin: 90, priceMax: 220,
    mods: ['Strawberry', 'Mango', 'Blueberry', 'Passion Fruit', 'Chocolate', 'Oreo', 'Banana', 'Mixed Berry'],
    bases: ['Milkshake', 'Smoothie', 'Frappe', 'Slush'],
  },
  'cat-dessert': {
    tax: 12, kitchen: true, priceMin: 90, priceMax: 280,
    mods: ['Chocolate', 'Strawberry', 'Caramel', 'Mango', 'Coffee', 'Red Velvet', 'Pistachio', 'Blueberry'],
    bases: ['Mousse', 'Pudding', 'Pie', 'Cupcake', 'Macaron', 'Gelato', 'Cake Slice'],
  },
}

function generateProducts(existing, target) {
  const rng = makeRng(0x9E3779B1)
  const used = new Set(existing.map((p) => p.name.toLowerCase()))
  const out = existing.slice()

  // Every possible "<mod> <base>" combo, across all categories.
  const combos = []
  for (const [categoryId, pool] of Object.entries(PRODUCT_POOLS)) {
    for (const mod of pool.mods) for (const base of pool.bases) {
      combos.push({ categoryId, pool, name: `${mod} ${base}` })
    }
  }
  // Deterministic Fisher-Yates shuffle so the extra menu is varied but stable.
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[combos[i], combos[j]] = [combos[j], combos[i]]
  }

  let n = existing.length
  for (const c of combos) {
    if (out.length >= target) break
    if (used.has(c.name.toLowerCase())) continue
    used.add(c.name.toLowerCase())
    n++
    const span = c.pool.priceMax - c.pool.priceMin
    const price = Math.round((c.pool.priceMin + rng() * span) / 10) * 10
    out.push({
      id: 'p-' + n,
      name: c.name,
      categoryId: c.categoryId,
      price,
      uom: 'piece',
      tax: c.pool.tax,
      description: `Freshly prepared ${c.name.toLowerCase()}.`,
      kitchen: c.pool.kitchen,
    })
  }
  return out
}

export const seedProducts = generateProducts(baseProducts, 100)

// ── Floors & tables (50 tables across 5 floors) ─────────────────────────────
const FLOOR_DEFS = [
  { id: 'floor-1', name: 'Main Hall', count: 12 },
  { id: 'floor-2', name: 'Terrace', count: 10 },
  { id: 'floor-3', name: 'Garden Court', count: 10 },
  { id: 'floor-4', name: 'Rooftop', count: 10 },
  { id: 'floor-5', name: 'Private Dining', count: 8 },
]

function generateFloors() {
  const rng = makeRng(0x7A8B9C)
  const seatOptions = [2, 2, 4, 4, 4, 6, 8]
  let num = 0
  return FLOOR_DEFS.map((f) => {
    const tables = []
    for (let i = 0; i < f.count; i++) {
      num++
      tables.push({
        id: 't-' + num,
        number: String(num),
        seats: seatOptions[Math.floor(rng() * seatOptions.length)],
        active: rng() > 0.08, // ~8% parked out of service
      })
    }
    return { id: f.id, name: f.name, tables }
  })
}

export const seedFloors = generateFloors()

export const seedPaymentMethods = {
  cash: { enabled: true },
  card: { enabled: true },
  upi: { enabled: true, upiId: env('VITE_UPI_ID', 'your-upi-id@bank') },
}

export const seedCoupons = [
  { id: 'c-1', code: 'WELCOME10', discountType: 'percent', value: 10 },
  { id: 'c-2', code: 'FLAT50', discountType: 'fixed', value: 50 },
]

export const seedPromotions = [
  { id: 'pr-1', name: 'Coffee Lovers', appliesTo: 'product', productId: 'p-2', minQty: 3, discountType: 'percent', value: 15 },
  { id: 'pr-2', name: 'Big Order Bonus', appliesTo: 'order', minAmount: 800, discountType: 'fixed', value: 100 },
]

// ---------------------------------------------------------------------------
// Users / employees — loaded ENTIRELY from .env, never hardcoded here.
//
// The admin comes from VITE_ADMIN_*; employees from VITE_EMP{n}_* (scanned
// 1..MAX, gaps allowed). This keeps every name and password out of committed
// source — fill them in your gitignored .env file. See .env.example.
// ---------------------------------------------------------------------------
const MAX_EMPLOYEES = 200

function buildUsersFromEnv() {
  const users = [{
    id: 'u-1',
    name: env('VITE_ADMIN_NAME', 'Admin Owner'),
    email: env('VITE_ADMIN_EMAIL', 'admin@cafe.com'),
    password: env('VITE_ADMIN_PASSWORD', ''),
    role: 'admin',
    archived: false,
  }]
  for (let i = 1; i <= MAX_EMPLOYEES; i++) {
    const email = env(`VITE_EMP${i}_EMAIL`, '')
    if (!email) continue // not defined → skip (allows gaps in numbering)
    users.push({
      id: 'u-' + (i + 1),
      name: env(`VITE_EMP${i}_NAME`, `Employee ${i}`),
      email,
      password: env(`VITE_EMP${i}_PASSWORD`, ''),
      role: 'employee',
      archived: false,
    })
  }
  return users
}

export const seedUsers = buildUsersFromEnv()

// ---------------------------------------------------------------------------
// Customers — 500 records generated procedurally from neutral word pools.
// No real person's details are written in source; the generated rows are what
// land in the database. "Walk-in" (cust-1) is the anonymous default.
// ---------------------------------------------------------------------------
const CUST_FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan', 'Kabir',
  'Aanya', 'Aadhya', 'Diya', 'Saanvi', 'Ananya', 'Ira', 'Myra', 'Pari', 'Anika', 'Navya',
  'Karan', 'Nikhil', 'Rahul', 'Siddharth', 'Varun', 'Aryan', 'Dev', 'Yash', 'Manav', 'Ved',
  'Sneha', 'Pooja', 'Riya', 'Tanvi', 'Meera', 'Kavya', 'Isha', 'Nisha', 'Priya', 'Shreya',
]
const CUST_LAST = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Mehta', 'Patel', 'Singh', 'Gupta', 'Rao',
  'Joshi', 'Malhotra', 'Chopra', 'Kapoor', 'Desai', 'Bhatt', 'Menon', 'Ghosh', 'Shah', 'Agarwal',
  'Pillai', 'Khanna', 'Banerjee', 'Mishra', 'Saxena', 'Sinha', 'Kaur', 'Trivedi', 'Hegde', 'Bose',
]

function generateCustomers(count) {
  const rng = makeRng(0x5EEDFACE)
  const out = [{ id: 'cust-1', name: 'Walk-in', email: '', phone: '' }]
  for (let i = 2; i <= count; i++) {
    const first = CUST_FIRST[Math.floor(rng() * CUST_FIRST.length)]
    const last = CUST_LAST[Math.floor(rng() * CUST_LAST.length)]
    // index keeps email unique even when a name pair repeats
    const email = `${first}.${last}${i}`.toLowerCase() + '@example.com'
    const phone = '+91 9' + String(1000 + Math.floor(rng() * 9000)) + ' ' + String(10000 + Math.floor(rng() * 90000))
    out.push({ id: 'cust-' + i, name: `${first} ${last}`, email, phone })
  }
  return out
}

export const seedCustomers = generateCustomers(500)

// ---------------------------------------------------------------------------
// Order history — 5000 orders produced deterministically (seeded PRNG, so every
// reload and both the frontend fallback + backend DB get the exact same data)
// and split across all env-loaded employees with an uneven distribution.
// ---------------------------------------------------------------------------

// Every cashier (role === 'employee'), each with a deterministic uneven weight.
const ORDER_EMPLOYEES = (() => {
  const rng = makeRng(0xBADC0DE5)
  const list = seedUsers
    .filter((u) => u.role === 'employee')
    .map((u) => ({ id: u.id, weight: 5 + Math.floor(rng() * 36) }))
  // Fallback so orders always have a valid owner even if no employees in .env.
  return list.length ? list : [{ id: seedUsers[0]?.id || 'u-1', weight: 1 }]
})()

// Flatten every table to { id, floorId } so orders can be placed anywhere.
const ALL_TABLE_REFS = seedFloors.flatMap((f) => f.tables.map((tb) => ({ id: tb.id, floorId: f.id })))

function buildSeedOrders(count = 5000) {
  const rng = makeRng(0xC0FFEE)
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const pickWeighted = (arr) => {
    const total = arr.reduce((s, x) => s + x.weight, 0)
    let r = rng() * total
    for (const x of arr) { if ((r -= x.weight) < 0) return x }
    return arr[arr.length - 1]
  }
  // A date in the last `days`, with a plausible cafe hour (8am–9pm).
  const dateWithin = (days) => {
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(rng() * days))
    d.setHours(8 + Math.floor(rng() * 13), Math.floor(rng() * 60), Math.floor(rng() * 60), 0)
    return d
  }

  const orders = []
  for (let i = 0; i < count; i++) {
    const number = 1001 + i
    const created = dateWithin(90)
    const createdAt = created.toISOString()

    // 1–4 distinct line items, qty 1–3 each.
    const lineCount = 1 + Math.floor(rng() * 4)
    const chosen = new Set()
    const items = []
    for (let j = 0; j < lineCount; j++) {
      const p = pick(seedProducts)
      if (chosen.has(p.id)) continue
      chosen.add(p.id)
      items.push({ productId: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(rng() * 3), tax: p.tax })
    }

    const amount = Math.round(items.reduce((s, it) => s + it.price * it.qty * (1 + it.tax / 100), 0))

    // Most orders are paid; a few are still drafts or were cancelled.
    const roll = rng()
    const status = roll < 0.9 ? 'paid' : roll < 0.96 ? 'draft' : 'cancelled'
    const table = pick(ALL_TABLE_REFS)

    orders.push({
      id: 'o-' + number,
      number: 'ORD-' + number,
      tableId: table.id,
      floorId: table.floorId,
      employeeId: pickWeighted(ORDER_EMPLOYEES).id,
      customerId: rng() < 0.55 ? pick(seedCustomers).id : null,
      status,
      createdAt,
      paidAt: status === 'paid' ? createdAt : null,
      paymentMethod: status === 'paid' ? pick(['cash', 'card', 'upi']) : null,
      couponId: null,
      items,
    })
  }
  // Newest first, matching the original hand-written ordering.
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const seedOrders = buildSeedOrders(5000)

export function buildInitialState() {
  return {
    users: seedUsers,
    customers: seedCustomers,
    categories: seedCategories,
    products: seedProducts,
    floors: seedFloors,
    paymentMethods: seedPaymentMethods,
    coupons: seedCoupons,
    promotions: seedPromotions,
    orders: seedOrders,
    kitchenTickets: [], // { orderId, number, items:[{productId,name,qty,done}], stage, createdAt }
    session: {
      currentUserId: null,
      currentTableId: null,
      editingOrderId: null,
      posSession: { open: false, openedAt: null, lastClosedAt: null, lastClosingAmount: 0 },
    },
    orderCounter: 6001, // next order number after the 5000 seeded (1001..6000)
  }
}
