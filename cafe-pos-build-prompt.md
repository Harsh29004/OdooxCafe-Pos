# Cafe POS — Full-Stack Build Prompt (Hackathon, Local-First)

## 0. Agent Brief
Build a full-stack Restaurant POS system end-to-end: FastAPI backend + SQLite DB + React frontend (Admin Backend, POS Terminal, Kitchen Display). Everything must run **fully offline** — no cloud DB, no external payment/email APIs as hard dependencies. Implement the spec below exactly. Where a section is marked "Open Question," implement the minimal version given and flag it — don't invent unrelated features.

---

## 1. Tech Stack (locked)
| Layer | Choice | Why |
|---|---|---|
| DB | SQLite + SQLAlchemy | zero-config, single file, satisfies "local DB" |
| Backend | FastAPI + Pydantic + python-jose (JWT) + passlib (bcrypt) | async, native WebSocket support |
| Realtime | FastAPI WebSockets (`/ws/kds`) | live KDS updates, no polling |
| Frontend | React 18 + Vite + Tailwind + React Router | fast build, you already know it |
| QR | `qrcode` (Python, server-side PNG/base64) | UPI QR generated locally, no API |
| Reports export | `reportlab` (PDF) + `openpyxl` (XLS) | local, no cloud |
| Receipt email | `aiosmtpd` local debug server as default; real SMTP only if venue WiFi confirmed | avoids live-demo failure |

---

## 2. Database Schema (SQLAlchemy models)

**users** — id, name, email (unique), password_hash, role (`admin`|`employee`), is_archived (bool), created_at

**categories** — id, name, color (hex string)

**products** — id, name, category_id (FK), price, unit (`piece`|`kg`|`litre`|...), tax_percent, description, show_on_kds (bool)

**payment_methods** — id, type (`cash`|`card`|`upi`), enabled (bool), upi_id (nullable)

**floors** — id, name

**tables** — id, floor_id (FK), table_number, seats, is_active

**customers** — id, name, email, phone

**discounts** (covers both coupons & promotions) — id, name, kind (`coupon`|`promotion`), code (nullable, unique — required if coupon), discount_type (`percent`|`fixed`), discount_value, scope (`order`|`product`), trigger_product_id (nullable FK → products, for product-scoped promo), min_quantity (nullable int), min_order_amount (nullable float), is_active

**pos_sessions** — id, employee_id (FK), opened_at, closed_at (nullable), closing_summary (JSON, nullable)

**orders** — id, order_number, table_id (nullable FK), customer_id (nullable FK), employee_id (FK), session_id (FK), status (`draft`|`paid`|`cancelled`), subtotal, tax_total, discount_total, total, applied_discount_id (nullable FK), payment_method_id (nullable FK), amount_received (nullable, cash), payment_reference (nullable, card), created_at, paid_at (nullable)

**order_items** — id, order_id (FK), product_id (FK), quantity, unit_price (snapshot), line_discount_amount (nullable), line_total, kitchen_status (`not_sent`|`to_cook`|`preparing`|`completed`), sent_to_kitchen_at (nullable)

**bookings** — *(see Open Questions — minimal impl)* id, customer_name, phone, table_id (FK), date_time, party_size, status (`confirmed`|`cancelled`)

---

## 3. Backend API Endpoints

- **Auth**: `POST /auth/signup`, `POST /auth/login` (returns JWT), `GET /auth/me`
- **Products**: full CRUD `/products` (category create-on-the-fly via nested payload)
- **Categories**: full CRUD `/categories`
- **Payment Methods**: `GET/PUT /payment-methods/{id}` (toggle enabled, set upi_id)
- **Floors/Tables**: full CRUD `/floors`, `/tables`
- **Discounts**: full CRUD `/discounts`, `POST /discounts/validate-coupon`
- **Users**: full CRUD `/users`, `PATCH /users/{id}/password`, `PATCH /users/{id}/archive`
- **Sessions**: `POST /sessions/open`, `POST /sessions/{id}/close`, `GET /sessions/current`, `GET /sessions/last-closed`
- **Orders**: full CRUD `/orders`, `POST /orders/{id}/send-to-kitchen`, `POST /orders/{id}/pay`, `GET /orders?status=&search=`, `GET /orders/{id}`
- **Customers**: full CRUD `/customers`
- **KDS**: `GET /kds/tickets`, `PATCH /kds/items/{id}/status`, `PATCH /kds/orders/{id}/advance-stage`
- **Reports**: `GET /reports/summary`, `/reports/sales-trend`, `/reports/top-categories`, `/reports/top-products`, `/reports/top-orders`, `/reports/export?format=pdf|xls`
- **AI Suggestions**: `GET /ai/suggestions?cart_product_ids=1,2,3`

---

## 4. WebSocket — `/ws/kds`
Server broadcasts on:
- `order_sent` → new ticket card appears
- `item_status_updated` → strikethrough single item
- `order_stage_updated` → ticket moves column (To Cook → Preparing → Completed)

---

## 5. Frontend Routes

**Auth**: `/login`, `/signup`

**Admin Backend** (role=admin): `/admin/products`, `/admin/categories`, `/admin/payment-methods`, `/admin/floors`, `/admin/discounts`, `/admin/users`, `/admin/reports`

**POS Terminal** (role=employee, opens on login):
- `/pos` → Floor Pop-up (table grid, active vs available styling)
- `/pos/order/:tableId` → Order View (Product | Cart | Payment columns)
- `/pos/orders` → session order list + detail
- `/pos/tables` → Table View
- `/pos/customers` → Customer management
- Hamburger menu → links to all Admin routes + KDS + Logout

**Kitchen Display**: `/kds` — separate route, connects to `/ws/kds`, columns = To Cook / Preparing / Completed, search + product/category filters

---

## 6. Business Logic Notes (read carefully — common bug sources)

1. **Per-item KDS tracking**: clicking a ticket card advances the whole order's stage; clicking ONE item inside marks only `order_items.kitchen_status` for that item (strikethrough). Only items where `product.show_on_kds = true` appear on KDS at all.
2. **Discount display vs. effect**: discount **value** always reduces the order `total`. **Display location** differs — product-scoped promo discount is shown on that product's cart line; order-scoped promo or coupon shows as a separate "Discount" line in the order summary.
3. **Category color**: single source of truth on `categories.color`, read everywhere (product cards, filter tabs, order view) — never hardcode/duplicate.
4. **Session close**: compute `closing_summary` (total sales, order count, breakdown by payment method) from orders where `session_id = X AND status = 'paid'`, store as JSON on close. Next session-open screen reads `last-closed` for "last closing sale amount."
5. **UPI flow**: generate QR server-side from `payment_methods.upi_id` + order total using `qrcode`, return as base64 PNG. Employee clicks Confirmed/Cancel — no real payment verification needed.
6. **Receipt**: print = `window.print()` on a print-styled receipt component (no hardware needed). Email = send via local `aiosmtpd` debug server by default so the demo never hangs on a real SMTP timeout; swap to real SMTP only if venue internet is confirmed.

---

## 7. AI Smart Suggestions Module (the differentiator)

- On every paid order, the `order_items` rows already give you co-purchase data.
- Build a simple **product co-occurrence matrix** (pandas/numpy): for each pair of products that appear in the same order, increment a count.
- Endpoint `GET /ai/suggestions?cart_product_ids=...` → returns top-3 products with highest co-occurrence score against the current cart, excluding items already in cart.
- **Cold start**: if no/low order history for a product, fall back to "top-selling in same category."
- Recompute matrix on each request (cheap for hackathon-scale data — a few hundred orders) or cache + refresh every N orders.
- Surface as a "Suggested for this order" strip in the Cart section — clicking adds to cart directly.

---

## 8. Seed Data (critical — demo needs data from second 1)

- 4–5 categories with distinct colors
- 15–20 products spread across categories, realistic prices, a few with `show_on_kds=true` / a few false
- 2 floors, 6–8 tables, mixed active/inactive
- Payment methods: all 3 enabled, `upi_id = cafe@ybl`
- 3 discounts: 1 coupon (e.g. 10% off), 1 product-scoped promo (buy 3 of X → discount), 1 order-scoped promo (order > ₹500 → discount)
- **~50–80 synthetic PAID orders** with realistic product combos (e.g. coffee+pastry, burger+fries+drink repeated often) — this is what gives the AI Suggestions module signal AND populates the Reports dashboard with real-looking charts immediately

---

## 9. Build Priority Order

1. **Phase 1 — Foundation**: DB models, seed script, auth (signup/login/JWT)
2. **Phase 2 — Core POS loop** (this is the demo backbone): Floor Pop-up → Order View → Cart → Payment → Paid order. Get this rock-solid first.
3. **Phase 3 — Realtime KDS**: Send to Kitchen, `/ws/kds`, ticket cards, stage + item-level status
4. **Phase 4 — Admin CRUD**: Products, Categories, Payment Methods, Floors/Tables, Users
5. **Phase 5 — Discounts/Promotions**: coupon popup + automated promo logic
6. **Phase 6 — AI Smart Suggestions**: co-occurrence endpoint + cart strip UI
7. **Phase 7 — Reports Dashboard**: filters, charts, tables, PDF/XLS export
8. **Phase 8 — Polish**: Customers module, receipt print/email, Bookings (minimal)

---

## 10. Suggested Team Split (3–4 people)
- **Backend/DB**: models, auth, sessions, all CRUD endpoints
- **POS Frontend**: Floor Pop-up, Order View (Product/Cart/Payment), WebSocket client
- **KDS + Admin**: Kitchen Display screen, Admin CRUD pages
- **AI + Reports**: co-occurrence module, dashboard charts, export

---

## 11. Demo Script (for judges — 5 min)
1. Admin: show Products/Categories with a category color, then create a new promo live
2. Switch to Employee → Open Session (show last-closed summary) → Floor → pick table
3. Order View: add 2–3 products → **AI suggestion strip appears** with a relevant add-on → add it → apply coupon
4. Send to Kitchen → switch to KDS tab → ticket appears **live via WebSocket** → advance stages, complete one item individually (strikethrough)
5. Back to POS → Pay via UPI → show generated QR → Confirm → print receipt
6. Close session → Admin Reports dashboard updates with the new order in real time

---

## 12. Open Questions / Assumptions (flagged, not hallucinated)
- **Booking**: spec lists it only in nav with no fields. Minimal table given in Section 2 (customer name, phone, table, date/time, party size, status). Lowest build priority — confirm with organizers if a fuller spec exists.
- **Discount stacking**: spec doesn't address multiple simultaneous discounts. Assumed one `applied_discount_id` per order (coupon OR promotion, not both) for simplicity — extend if time permits.
- **Email**: real SMTP needs internet. Default to local debug SMTP (logs the email) so the demo can't fail on this.
