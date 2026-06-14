# ☕ Odoo Cafe POS

A complete web-based **Restaurant Point-of-Sale** system built for the Odoo Cafe POS hackathon.
Covers the full flow described in the brief — **Backend (admin) → POS Terminal (cashier) → Kitchen Display** — all working end-to-end.

> Built with **React + Vite** on the front, a **Node.js + Express + SQLite**
> backend on the back. All state lives in a real local SQLite database and syncs **live
> across devices over a WebSocket**, so the Kitchen Display updates instantly when the
> cashier hits *Send to Kitchen*. Everything runs **fully offline** — and if the backend
> is ever down, the app transparently falls back to browser storage so the demo never dies.

---

## 🔐 Environment Setup (required before first run)

Sensitive credentials (user passwords, UPI ID) are loaded from a `.env` file — they are
**never hardcoded in source code** and are **never committed to Git**.

```bash
# 1. Copy the example env file
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
# Admin user
VITE_ADMIN_NAME=Admin Owner
VITE_ADMIN_EMAIL=admin@cafe.com
VITE_ADMIN_PASSWORD=your-secure-password

# Employee 1
VITE_EMP1_NAME=Priya Sharma
VITE_EMP1_EMAIL=priya@cafe.com
VITE_EMP1_PASSWORD=your-secure-password

# Employee 2
VITE_EMP2_NAME=Rahul Verma
VITE_EMP2_EMAIL=rahul@cafe.com
VITE_EMP2_PASSWORD=your-secure-password

# UPI Payment
VITE_UPI_ID=your-upi-id@bank
```

> ⚠️ `.env` is listed in `.gitignore` — it will never be pushed to version control.
> `.env.example` (no real values) **is** safe to commit and acts as a reference template.

---

## 🚀 Run it

```bash
# 1. Install both apps (frontend + backend)
npm run setup

# 2. Start backend + frontend together (one command)
npm run dev:all
#   → web  http://localhost:5173   (Vite, proxies /api + /ws to the backend)
#   → api  http://localhost:8000   (Express + SQLite + WebSocket)
```

Prefer two terminals? Run `npm run backend` in one and `npm run dev` in the other.

**Production (single origin):** `npm start` builds the frontend and serves it straight
from the backend on http://localhost:8000.

The SQLite database (`backend/cafe_pos.db`) is created and **seeded automatically** on first
boot. Reset it any time with `npm run seed`.

---

## 🔑 Demo logins

Credentials are set via your `.env` file (see Environment Setup above).

| Role            | Email                      | Password                    |
| --------------- | -------------------------- | --------------------------- |
| Admin / Owner   | `VITE_ADMIN_EMAIL` in .env | `VITE_ADMIN_PASSWORD` in .env |
| Cashier (Emp 1) | `VITE_EMP1_EMAIL` in .env  | `VITE_EMP1_PASSWORD` in .env  |
| Cashier (Emp 2) | `VITE_EMP2_EMAIL` in .env  | `VITE_EMP2_PASSWORD` in .env  |

Admins land in the **Backend**; cashiers land in the **POS Terminal**.

---

## 🍽️ Suggested demo flow (for judges)

1. **Log in as Cashier** → the **Floor pop-up** appears → pick a table.
2. Tap products to build a cart, adjust quantities, add a **Customer**, apply coupon **`WELCOME10`**.
   - Add 3× Cappuccino to watch the **automated "Coffee Lovers" promo** fire on its own.
3. Hit **Kitchen** to fire the ticket. Open **`/kitchen`** in a second tab/screen → watch it appear live.
4. In the Kitchen Display, click items to strike them through, click the ticket to move it
   **To Cook → Preparing → Completed**.
5. Back in the POS, **Pay** with Cash / Card / **UPI QR** (scannable, generated from the saved UPI ID),
   then **Print** or **Email** the receipt.
6. **Log in as Admin** → open the **Dashboard** to see the sale reflected in charts & tables;
   configure Products, Categories (colors propagate everywhere), Payment Methods, Coupons, Tables & Users.

> Tip: the sidebar **"Reset demo data"** restores the seeded sample at any time.

---

## 🗺️ What's implemented (per the brief)

**Backend (admin)**
- Login / Signup
- Product management (CRUD) with on-the-fly category creation, UoM, tax, KDS assignment
- Category management with color that propagates to POS cards, tabs & order view
- Payment methods (enable/disable toggles + UPI ID with live QR preview)
- Coupons (code-based) & automated promotions (product-qty and order-amount triggers)
- Floors & tables (CRUD, seats, active status)
- Users/employees (roles, change password, archive, delete)
- Reporting dashboard: filters (period / employee / product), summary metrics, sales-trend chart,
  top-categories pie, top orders / products / categories tables, PDF (print) & XLS export

**POS Terminal (cashier)**
- Top navigation, product search, current-table indicator, employee, hamburger menu
- Floor pop-up & full Table View (active tables visually distinct)
- Order View: product cards + category tabs, cart with live totals (subtotal / tax / discounts / total)
- Discount popup (coupons), automated promotions applied automatically
- Customer management (search / create / assign for receipt email)
- Payment: Cash (change due), Card (txn ref), UPI (dynamic QR) → receipt (print / email)
- Orders list + detail; draft orders are editable/deletable, paid orders view-only
- Session open on login, close-session summary

**Kitchen Display** (`/kitchen`)
- Real-time tickets across tabs/devices, three stages (To Cook / Preparing / Completed)
- Click ticket → advance stage; click item → strike through; search + category filter
- Only products flagged for the kitchen appear

---

## 🧱 Project structure

```
src/                      ← THE frontend (React + Vite)
  store/        Global state — now backend-synced (hydrate + persist + WebSocket),
                with localStorage as an offline fallback. Seed data lives here too.
                Credentials and UPI ID are loaded from .env (VITE_* variables).
  lib/          api.js (backend client), money & pricing engine, event bus
  components/   Reusable UI kit (Modal, Toggle, Badge, …)
  pages/
    auth/       Login, Signup
    admin/      AdminLayout + Products, Categories, PaymentMethods, Coupons, Tables, Users, Reports
    pos/        PosLayout + OrderView, Orders, TableView, Customers, FloorPopup, PaymentFlow
    kds/        KitchenDisplay

backend/                  ← Node.js + Express + SQLite API (plain JavaScript)
  db.js         Relational SQLite schema (users, products, orders, order_items, …)
  state.js      Loads/saves the whole app state across the relational tables
  seed.js       Seeds the DB from the frontend's seed (one source of truth)
  server.js     Express app + REST routes + WebSocket live-sync
  routes/       auth, catalog, orders, kds, reports, ai (co-occurrence suggestions)

.env            ← YOUR private credentials (gitignored — never committed)
.env.example    ← Template showing all required variables (safe to commit)
```

The pricing logic lives in `src/lib/pricing.js`; the data model & all mutations live in
`src/store/StoreContext.jsx`, which hydrates from `GET /api/state`, persists changes back
with `PUT /api/state`, and listens on the WebSocket for live updates from other devices.

---

## 🔌 Backend API (real, queryable)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`  | `/api/state` | Whole app state (used by the frontend store) |
| `PUT`  | `/api/state` | Persist state → SQLite, broadcast to all devices |
| `POST` | `/api/auth/login` · `/api/auth/signup` | Auth against the users table |
| `GET`  | `/api/products` · `/api/categories` | Menu data |
| `GET`  | `/api/orders` · `/api/orders/:id` | Order history (filter `?status=&search=`) |
| `GET`  | `/api/kds/tickets` | Kitchen tickets |
| `GET`  | `/api/reports/summary` · `/top-products` · `/top-categories` | Dashboard metrics |
| `GET`  | `/api/ai/suggestions?cart=p-2,p-7` | **Smart Suggestions** (live co-occurrence) |
| `WS`   | `/ws` | Live state sync across devices |

---

## 🔒 Security Notes

- All sensitive values (passwords, UPI ID) are stored in `.env` — **not in source code**.
- `.env` is gitignored so it is never accidentally pushed to version control.
- Use `.env.example` as a reference when setting up on a new machine or sharing with teammates.
- In production, consider using a secrets manager or environment variable injection from your hosting platform instead of a `.env` file.
