// ---------------------------------------------------------------------------
// store/seed.js — the demo/seed data, in a plain JS module (no React/JSX) so
// that BOTH the frontend store (store.jsx) and the Node backend (backend/seed.js)
// import it as a single source of truth.
// ---------------------------------------------------------------------------

export const seedCategories = [
  { id: 'cat-coffee', name: 'Coffee', color: '#714B67' },
  { id: 'cat-tea', name: 'Tea', color: '#2E7D6F' },
  { id: 'cat-pastry', name: 'Pastries', color: '#E07B05' },
  { id: 'cat-snacks', name: 'Snacks', color: '#C2410C' },
  { id: 'cat-cold', name: 'Cold Drinks', color: '#2563EB' },
  { id: 'cat-dessert', name: 'Desserts', color: '#DB2777' },
]

export const seedProducts = [
  // ── Existing ──────────────────────────────────────────────────────────────
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

  // ── New additions ─────────────────────────────────────────────────────────
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

export const seedFloors = [
  {
    id: 'floor-1', name: 'Main Hall',
    tables: [
      { id: 't-1', number: '1', seats: 2, active: true },
      { id: 't-2', number: '2', seats: 2, active: true },
      { id: 't-3', number: '3', seats: 4, active: true },
      { id: 't-4', number: '4', seats: 4, active: true },
      { id: 't-5', number: '5', seats: 6, active: true },
    ],
  },
  {
    id: 'floor-2', name: 'Terrace',
    tables: [
      { id: 't-6', number: '6', seats: 2, active: true },
      { id: 't-7', number: '7', seats: 4, active: true },
      { id: 't-8', number: '8', seats: 4, active: false },
    ],
  },
]

export const seedPaymentMethods = {
  cash: { enabled: true },
  card: { enabled: true },
  upi: { enabled: true, upiId: import.meta.env.VITE_UPI_ID || 'your-upi-id@bank' },
}

export const seedCoupons = [
  { id: 'c-1', code: 'WELCOME10', discountType: 'percent', value: 10 },
  { id: 'c-2', code: 'FLAT50', discountType: 'fixed', value: 50 },
]

export const seedPromotions = [
  { id: 'pr-1', name: 'Coffee Lovers', appliesTo: 'product', productId: 'p-2', minQty: 3, discountType: 'percent', value: 15 },
  { id: 'pr-2', name: 'Big Order Bonus', appliesTo: 'order', minAmount: 800, discountType: 'fixed', value: 100 },
]

// Values are loaded from your .env file (VITE_* variables).
// Fill in .env and restart the dev server — never hardcode credentials here.
export const seedUsers = [
  {
    id: 'u-1',
    name: import.meta.env.VITE_ADMIN_NAME || 'Admin Owner',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@cafe.com',
    password: import.meta.env.VITE_ADMIN_PASSWORD || '',
    role: 'admin',
    archived: false,
  },
  {
    id: 'u-2',
    name: import.meta.env.VITE_EMP1_NAME || 'Employee 1',
    email: import.meta.env.VITE_EMP1_EMAIL || '',
    password: import.meta.env.VITE_EMP1_PASSWORD || '',
    role: 'employee',
    archived: false,
  },
  {
    id: 'u-3',
    name: import.meta.env.VITE_EMP2_NAME || 'Employee 2',
    email: import.meta.env.VITE_EMP2_EMAIL || '',
    password: import.meta.env.VITE_EMP2_PASSWORD || '',
    role: 'employee',
    archived: false,
  },
]

export const seedCustomers = [
  { id: 'cust-1', name: 'Walk-in', email: '', phone: '' },
  { id: 'cust-2', name: 'Aarav Patel', email: 'aarav@example.com', phone: '+91 98765 43210' },
  { id: 'cust-3', name: 'Sneha Iyer', email: 'sneha@example.com', phone: '+91 91234 56789' },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0)
  return d.toISOString()
}

export const seedOrders = [
  {
    id: 'o-1001', number: 'ORD-1001', tableId: 't-1', floorId: 'floor-1',
    employeeId: 'u-2', customerId: 'cust-2', status: 'paid',
    createdAt: daysAgo(0), paidAt: daysAgo(0), paymentMethod: 'card', couponId: null,
    items: [
      { productId: 'p-2', name: 'Cappuccino', price: 180, qty: 2, tax: 5 },
      { productId: 'p-7', name: 'Butter Croissant', price: 150, qty: 1, tax: 12 },
    ],
  },
  {
    id: 'o-1002', number: 'ORD-1002', tableId: 't-3', floorId: 'floor-1',
    employeeId: 'u-3', customerId: 'cust-3', status: 'paid',
    createdAt: daysAgo(1), paidAt: daysAgo(1), paymentMethod: 'upi', couponId: null,
    items: [
      { productId: 'p-4', name: 'Cold Brew', price: 210, qty: 2, tax: 5 },
      { productId: 'p-13', name: 'Cheesecake', price: 220, qty: 1, tax: 12 },
      { productId: 'p-10', name: 'French Fries', price: 130, qty: 1, tax: 12 },
    ],
  },
  {
    id: 'o-1003', number: 'ORD-1003', tableId: 't-5', floorId: 'floor-1',
    employeeId: 'u-2', customerId: 'cust-2', status: 'paid',
    createdAt: daysAgo(2), paidAt: daysAgo(2), paymentMethod: 'cash', couponId: null,
    items: [
      { productId: 'p-3', name: 'Caffe Latte', price: 190, qty: 3, tax: 5 },
      { productId: 'p-8', name: 'Chocolate Muffin', price: 140, qty: 2, tax: 12 },
    ],
  },
  {
    id: 'o-1004', number: 'ORD-1004', tableId: 't-2', floorId: 'floor-1',
    employeeId: 'u-3', customerId: null, status: 'paid',
    createdAt: daysAgo(3), paidAt: daysAgo(3), paymentMethod: 'upi', couponId: null,
    items: [
      { productId: 'p-15', name: 'Mocha', price: 200, qty: 2, tax: 5 },
      { productId: 'p-14', name: 'Brownie', price: 160, qty: 2, tax: 12 },
    ],
  },
  {
    id: 'o-1005', number: 'ORD-1005', tableId: 't-7', floorId: 'floor-2',
    employeeId: 'u-2', customerId: 'cust-3', status: 'paid',
    createdAt: daysAgo(5), paidAt: daysAgo(5), paymentMethod: 'card', couponId: null,
    items: [
      { productId: 'p-9', name: 'Veg Sandwich', price: 170, qty: 2, tax: 12 },
      { productId: 'p-11', name: 'Iced Lemonade', price: 110, qty: 2, tax: 5 },
      { productId: 'p-1', name: 'Espresso', price: 120, qty: 1, tax: 5 },
    ],
  },
]

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
    orderCounter: 1006,
  }
}
