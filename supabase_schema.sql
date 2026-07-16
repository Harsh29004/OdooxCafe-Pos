-- ============================================================
--  Supabase (PostgreSQL) schema for Cafe POS
--  Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Users (admin + employees)
CREATE TABLE IF NOT EXISTS users (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT 'employee',
  archived  BOOLEAN NOT NULL DEFAULT false
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  email  TEXT DEFAULT '',
  phone  TEXT DEFAULT ''
);

-- Menu categories
CREATE TABLE IF NOT EXISTS categories (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  color  TEXT NOT NULL DEFAULT '#6366f1'
);

-- Products (menu items)
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  "categoryId" TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price        DOUBLE PRECISION NOT NULL DEFAULT 0,
  uom          TEXT DEFAULT 'piece',
  tax          DOUBLE PRECISION DEFAULT 0,
  description  TEXT DEFAULT '',
  kitchen      BOOLEAN NOT NULL DEFAULT true
);

-- Floor plans
CREATE TABLE IF NOT EXISTS floors (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

-- Tables (within floors)
CREATE TABLE IF NOT EXISTS tables (
  id        TEXT PRIMARY KEY,
  "floorId" TEXT REFERENCES floors(id) ON DELETE CASCADE,
  number    TEXT NOT NULL,
  seats     INTEGER NOT NULL DEFAULT 4,
  active    BOOLEAN NOT NULL DEFAULT true
);

-- Payment method settings
CREATE TABLE IF NOT EXISTS payment_methods (
  id       TEXT PRIMARY KEY,   -- 'cash' | 'card' | 'upi'
  enabled  BOOLEAN NOT NULL DEFAULT true,
  "upiId"  TEXT
);

-- Discount coupons
CREATE TABLE IF NOT EXISTS coupons (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL,
  "discountType" TEXT NOT NULL DEFAULT 'percent',
  value          DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Automated promotions
CREATE TABLE IF NOT EXISTS promotions (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  "appliesTo"    TEXT NOT NULL DEFAULT 'order',
  "productId"    TEXT REFERENCES products(id) ON DELETE SET NULL,
  "minQty"       INTEGER,
  "minAmount"    DOUBLE PRECISION,
  "discountType" TEXT NOT NULL DEFAULT 'percent',
  value          DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  number          TEXT,
  "tableId"       TEXT REFERENCES tables(id) ON DELETE SET NULL,
  "floorId"       TEXT,
  "employeeId"    TEXT REFERENCES users(id) ON DELETE SET NULL,
  "customerId"    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  "paymentMethod" TEXT,
  "couponId"      TEXT,
  amount          DOUBLE PRECISION DEFAULT 0,
  "createdAt"     TEXT,
  "paidAt"        TEXT,
  extra           TEXT DEFAULT '{}'
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  "orderId"   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId" TEXT,
  name        TEXT,
  price       DOUBLE PRECISION DEFAULT 0,
  qty         DOUBLE PRECISION DEFAULT 1,
  tax         DOUBLE PRECISION DEFAULT 0
);

-- Kitchen display tickets
CREATE TABLE IF NOT EXISTS kitchen_tickets (
  "orderId"    TEXT PRIMARY KEY,
  number       TEXT,
  stage        TEXT NOT NULL DEFAULT 'to_cook',
  "createdAt"  TEXT
);

-- Kitchen ticket line items
CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
  id          SERIAL PRIMARY KEY,
  "orderId"   TEXT NOT NULL REFERENCES kitchen_tickets("orderId") ON DELETE CASCADE,
  "productId" TEXT,
  name        TEXT,
  qty         DOUBLE PRECISION DEFAULT 1,
  done        BOOLEAN NOT NULL DEFAULT false
);

-- Key-value metadata (order counter, etc.)
-- Realtime is enabled on this table to broadcast state-change notifications.
CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items("productId");
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);

-- Enable Realtime on meta table for live-sync notifications
ALTER PUBLICATION supabase_realtime ADD TABLE meta;
