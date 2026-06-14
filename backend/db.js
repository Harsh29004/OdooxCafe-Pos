// db.js — SQLite database (local-first, single file). Real relational schema
// with foreign keys, mirroring the shape the React frontend already uses so the
// whole app state round-trips losslessly.
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'cafe_pos.db')

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// --- Schema -------------------------------------------------------------
// String primary keys (e.g. 'cat-coffee', 'p-1', 'o-1001') match the ids the
// frontend generates, so state survives a full save/load cycle unchanged.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT 'employee',
  archived  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  email  TEXT DEFAULT '',
  phone  TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  color  TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  categoryId   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price        REAL NOT NULL DEFAULT 0,
  uom          TEXT DEFAULT 'piece',
  tax          REAL DEFAULT 0,
  description  TEXT DEFAULT '',
  kitchen      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS floors (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tables (
  id       TEXT PRIMARY KEY,
  floorId  TEXT REFERENCES floors(id) ON DELETE CASCADE,
  number   TEXT NOT NULL,
  seats    INTEGER NOT NULL DEFAULT 4,
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id       TEXT PRIMARY KEY,   -- 'cash' | 'card' | 'upi'
  enabled  INTEGER NOT NULL DEFAULT 1,
  upiId    TEXT
);

CREATE TABLE IF NOT EXISTS coupons (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL,
  discountType  TEXT NOT NULL DEFAULT 'percent',
  value         REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS promotions (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  appliesTo     TEXT NOT NULL DEFAULT 'order',   -- 'product' | 'order'
  productId     TEXT REFERENCES products(id) ON DELETE SET NULL,
  minQty        INTEGER,
  minAmount     REAL,
  discountType  TEXT NOT NULL DEFAULT 'percent',
  value         REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  number         TEXT,
  tableId        TEXT REFERENCES tables(id) ON DELETE SET NULL,
  floorId        TEXT,
  employeeId     TEXT REFERENCES users(id) ON DELETE SET NULL,
  customerId     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'paid' | 'cancelled'
  paymentMethod  TEXT,
  couponId       TEXT,
  amount         REAL DEFAULT 0,
  createdAt      TEXT,
  paidAt         TEXT,
  extra          TEXT DEFAULT '{}'   -- lossless JSON of any extra order fields
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  productId  TEXT,
  name       TEXT,
  price      REAL DEFAULT 0,
  qty        REAL DEFAULT 1,
  tax        REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kitchen_tickets (
  orderId    TEXT PRIMARY KEY,
  number     TEXT,
  stage      TEXT NOT NULL DEFAULT 'to_cook',  -- 'to_cook' | 'preparing' | 'completed'
  createdAt  TEXT
);

CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId    TEXT NOT NULL REFERENCES kitchen_tickets(orderId) ON DELETE CASCADE,
  productId  TEXT,
  name       TEXT,
  qty        REAL DEFAULT 1,
  done       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(productId);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
`)

export function isEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get()
  return row.n === 0
}
