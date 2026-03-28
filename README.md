# 🛒 Online Store — Bangladesh

A full-stack inventory management & e-commerce system built with Node.js, MySQL, Socket.IO and Bootstrap 5.

---

## Project Structure

```
online-store/
├── backend/       ← Node.js / Express REST API + Socket.IO
└── frontend/      ← Pure HTML / CSS / Vanilla JS (no build step)
```

---

## Quick Start (Windows PC)

### Prerequisites

| Software | Version | Download |
|---|---|---|
| Node.js | v18 or v20 LTS | https://nodejs.org |
| MySQL | v8.x | https://dev.mysql.com/downloads/mysql/ |

---

### Step 1 — Set up the database

Open **MySQL Command Line Client** or **MySQL Workbench** and run:

```sql
SOURCE path\to\backend\sql\schema.sql;
SOURCE path\to\backend\sql\seed.sql;
SOURCE path\to\backend\sql\add_photos_table.sql;
```

Or from Command Prompt / PowerShell:

```cmd
mysql -u root -p < backend\sql\schema.sql
mysql -u root -p online_store < backend\sql\seed.sql
mysql -u root -p online_store < backend\sql\add_photos_table.sql
```

---

### Step 2 — Configure the backend

```cmd
cd backend
copy .env.example .env
```

Open `backend\.env` and fill in your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=online_store
PORT=3000
FRONTEND_ORIGIN=http://localhost:8080
```

---

### Step 3 — Install backend dependencies

```cmd
cd backend
npm install
```

> ⚠️ First install downloads Puppeteer's Chromium browser (~170 MB). Be patient.

---

### Step 4 — Run the backend

```cmd
npm run dev
```

Expected output:
```
✅  Backend API running → http://localhost:3000
📁  Uploads served  → http://localhost:3000/uploads/products/
🔌  Socket.IO ready → ws://localhost:3000
```

Test: open `http://localhost:3000/api/health` in your browser.

---

### Step 5 — Run the frontend

Open a **second terminal** in the `frontend/` folder.

**Option A — VS Code Live Server** (recommended)
1. Install the "Live Server" extension in VS Code
2. Open `frontend/` folder in VS Code
3. Right-click `index.html` → "Open with Live Server"
4. Opens at `http://127.0.0.1:5500`

**Option B — npx http-server**
```cmd
cd frontend
npx http-server -p 8080 --cors
```
Then open `http://localhost:8080`

---

## Pages

| URL | Description |
|---|---|
| `/index.html` | 🛒 Storefront — browse, filter, search products |
| `/product.html?id=1` | 📦 Product detail with photo gallery & reviews |
| `/cart.html` | 🛍️ Shopping cart & checkout |
| `/dashboard.html` | 📊 Analytics dashboard with Chart.js charts |
| `/reports.html` | 📋 Orders table + PDF invoice downloads |
| `/add-product.html` | ➕ Add new product with drag & drop image upload |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product with reviews & photos |
| POST | `/api/products` | Add product (multipart/form-data with images) |
| PATCH | `/api/products/:id/stock` | Adjust stock level |
| POST | `/api/reviews` | Submit a product review |
| POST | `/api/checkout` | Place an order |
| POST | `/api/cart/validate` | Validate cart stock before checkout |
| GET | `/api/orders/recent` | Last 30 orders |
| GET | `/api/orders/:id` | Single order with items |
| DELETE | `/api/orders/reset-demo` | Reset demo data |
| GET | `/api/analytics` | KPIs + chart data |
| GET | `/api/reports/products.pdf` | Product report PDF |
| GET | `/api/reports/stock.pdf` | Stock report PDF |
| GET | `/api/reports/invoice/:id` | Invoice PDF for an order |
| GET | `/api/health` | Server health check |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails on Puppeteer | Run `npm install --ignore-scripts` then `npx puppeteer browsers install chrome` |
| `ECONNREFUSED` on MySQL | Start MySQL service: Windows → search "Services" → MySQL → Start |
| CORS error in browser | Check `FRONTEND_ORIGIN` in `backend/.env` matches your frontend URL exactly |
| Socket.IO not connecting | Start backend first; check browser console for WebSocket errors |
| Images not loading | Copy image files from original `public/uploads/products/` into `backend/public/uploads/products/` |
| PDF reports fail | Puppeteer needs Chrome — run `npx puppeteer browsers install chrome` inside `backend/` |
| Port already in use | Change `PORT=3001` in `.env` and set `API_BASE = 'http://localhost:3001'` in `frontend/js/api.js` |
| `ER_BAD_DB_ERROR` | Database not created — run `schema.sql` first |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js 18+ |
| Web Framework | Express 4.18 |
| Database | MySQL 8 (via mysql2) |
| Real-time | Socket.IO 4.6 |
| PDF Generation | Puppeteer 21 (headless Chrome) |
| File Uploads | Multer |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript |
| CSS Framework | Bootstrap 5.3 (CDN) |
| Charts | Chart.js (CDN) |
| Dev Server | Nodemon |
