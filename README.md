<div align="center">

# 🛒 Online Store — Bangladesh

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=C8952A&center=true&vCenter=true&width=600&lines=Full-Stack+E-Commerce+%26+Inventory+System;Real-Time+Stock+Updates+via+Socket.IO;PDF+Reports+%7C+Analytics+Dashboard;Authentic+Bangladeshi+Products" alt="Typing SVG" />

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-online--store--xi--ashen.vercel.app-C8952A?style=for-the-badge&logoColor=white)](https://online-store-xi-ashen.vercel.app)
[![Backend API](https://img.shields.io/badge/⚡_Backend_API-Render-46E3B7?style=for-the-badge)](https://online-store-mvnu.onrender.com/api/health)
[![Database](https://img.shields.io/badge/🗄️_Database-Railway_MySQL-0B0D0E?style=for-the-badge)](https://railway.app)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?style=flat-square&logo=socket.io&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)

<br/>

> A production-deployed, full-stack inventory management and e-commerce system featuring real-time stock updates, PDF report generation, analytics dashboard, and multi-image product uploads — built with authentic Bangladeshi products.

</div>

---

## ✨ Live Demo

<div align="center">

|                                 🌐 Frontend                                  |                                ⚡ Backend API                                |     🗄️ Database     |
| :--------------------------------------------------------------------------: | :--------------------------------------------------------------------------: | :-----------------: |
| [online-store-xi-ashen.vercel.app](https://online-store-xi-ashen.vercel.app) | [onrender.com/api/health](https://online-store-mvnu.onrender.com/api/health) |    Railway MySQL    |
|                             Vercel CDN — Global                              |                            Render.com — Free Tier                            | Railway — Free Tier |

</div>

---

## 🎯 Key Features

<table>
<tr>
<td width="50%">

### 🛍️ Storefront

- Browse 16 authentic Bangladeshi products
- Filter by category (Apparel, Grocery, Seafood, Sweets, Spices, Snacks, Handicrafts, Home)
- Search, sort by price/rating/name
- Price range filter
- Wishlist with localStorage persistence
- Real-time stock badge updates

</td>
<td width="50%">

### 📦 Product Management

- Product detail pages with photo gallery
- Multi-image upload with drag & drop
- Star ratings and customer reviews
- Stock level management
- Tax rate per product
- Category badges

</td>
</tr>
<tr>
<td width="50%">

### 🛒 Cart & Checkout

- Persistent cart via localStorage
- Real-time stock validation
- Tax calculation per item
- Order placement with customer name
- Order confirmation with order ID
- Stock auto-decrements on checkout

</td>
<td width="50%">

### 📊 Analytics Dashboard

- KPI cards: Total products, orders, revenue
- 7-day revenue trend chart
- Rating distribution chart
- Top-rated products chart
- Category revenue breakdown
- Low stock alerts table

</td>
</tr>
<tr>
<td width="50%">

### 📄 PDF Reports

- **Product Report** — Full product catalogue with ratings
- **Stock Report** — Color-coded stock status (OK / LOW / OUT)
- **Invoice PDF** — Per-order invoice with tax breakdown
- Generated server-side with PDFKit
- One-click download

</td>
<td width="50%">

### 🔌 Real-Time Features

- Socket.IO WebSocket connection
- Live stock updates across all browser tabs
- New order notifications on dashboard
- "Live Updates Active" indicator in footer
- Auto-refresh dashboard on new orders

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEPLOYED STACK                               │
│                                                                     │
│   FRONTEND (Vercel)          BACKEND (Render)      DB (Railway)     │
│   ─────────────────          ──────────────────    ──────────────── │
│                                                                     │
│   HTML5 / CSS3 / JS    →     Node.js + Express  →  MySQL 8          │
│   Bootstrap 5.3 CDN          Socket.IO 4.6          5 Tables        │
│   Chart.js CDN               PDFKit                 15+ Products    │
│   Vanilla JavaScript         Multer uploads          All reviews     │
│                              REST API                All orders      │
│                                                                     │
│   online-store-xi-           online-store-mvnu.      gondola.proxy. │
│   ashen.vercel.app           onrender.com            rlwy.net        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
online-store/
│
├── 📁 backend/                     ← Node.js / Express API Server
│   ├── 📄 package.json             ← Dependencies (no Puppeteer — uses PDFKit)
│   ├── 📄 .env.example             ← Environment variables template
│   ├── 📁 public/
│   │   └── 📁 uploads/products/    ← Product images (served as /uploads/...)
│   ├── 📁 sql/
│   │   ├── 📄 schema.sql           ← Creates all 5 tables
│   │   ├── 📄 seed.sql             ← 15 demo products + 60+ reviews
│   │   └── 📄 add_photos_table.sql ← Product photos migration
│   └── 📁 src/
│       ├── 📄 app.js               ← Express entry point, CORS, routes
│       ├── 📄 db.js                ← MySQL connection pool (SSL-ready)
│       ├── 📄 sockets.js           ← Socket.IO server + emitters
│       ├── 📁 routes/
│       │   ├── 📄 products.js      ← CRUD + Multer image upload
│       │   ├── 📄 reviews.js       ← POST review
│       │   ├── 📄 checkout.js      ← Cart validate + place order
│       │   ├── 📄 orders.js        ← Recent orders + demo reset
│       │   ├── 📄 analytics.js     ← KPIs + chart data
│       │   └── 📄 reports.js       ← PDF generation (PDFKit)
│       └── 📁 pdf/
│           └── 📄 renderPdf.js     ← PDF renderer
│
├── 📁 frontend/                    ← Pure Static HTML/CSS/JS
│   ├── 📄 index.html               ← 🛒 Storefront
│   ├── 📄 product.html             ← 📦 Product detail + gallery
│   ├── 📄 cart.html                ← 🛍️ Cart + checkout
│   ├── 📄 dashboard.html           ← 📊 Analytics dashboard
│   ├── 📄 reports.html             ← 📋 Orders + PDF downloads
│   ├── 📄 add-product.html         ← ➕ Add product form
│   ├── 📄 vercel.json              ← Vercel static config
│   ├── 📁 css/
│   │   └── 📄 app.css              ← All styles (~36KB)
│   └── 📁 js/
│       ├── 📄 api.js               ← Fetch wrapper (API_BASE config)
│       ├── 📄 cart.js              ← localStorage cart logic
│       ├── 📄 ui.js                ← Shared UI helpers (toasts, stars, badges)
│       ├── 📄 realtime.js          ← Socket.IO client handler
│       └── 📁 pages/
│           ├── 📄 index.js         ← Storefront logic
│           ├── 📄 product.js       ← Product detail + reviews
│           ├── 📄 cart-page.js     ← Cart + checkout flow
│           ├── 📄 dashboard.js     ← Chart.js analytics
│           ├── 📄 add-product.js   ← Image upload form
│           └── 📄 reports.js       ← Orders table + PDF links
│
├── 📄 render.yaml                  ← Render deployment config
├── 📄 .gitignore
├── 📄 start-dev.bat                ← Windows: launch both servers
└── 📄 start-dev.ps1               ← PowerShell launcher
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Software | Version        | Download                                                |
| -------- | -------------- | ------------------------------------------------------- |
| Node.js  | v18 or v20 LTS | [nodejs.org](https://nodejs.org)                        |
| MySQL    | v8.x           | [dev.mysql.com](https://dev.mysql.com/downloads/mysql/) |
| Git      | Latest         | [git-scm.com](https://git-scm.com)                      |

### 1️⃣ Clone the repository

```bash
git clone https://github.com/asif496/online-store.git
cd online-store
```

### 2️⃣ Set up the database

```bash
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p online_store < backend/sql/seed.sql
mysql -u root -p online_store < backend/sql/add_photos_table.sql
```

### 3️⃣ Configure environment variables

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD
DB_NAME=online_store
PORT=3000
FRONTEND_ORIGIN=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

### 4️⃣ Install dependencies & run

```bash
# Install backend dependencies
cd backend
npm install

# Run backend (in terminal 1)
npm run dev
```

```bash
# Run frontend (in terminal 2)
cd frontend
npx http-server -p 8080 --cors
```

Or on Windows, simply double-click **`start-dev.bat`** to launch both at once.

### 5️⃣ Open in browser

| Page           | URL                                    |
| -------------- | -------------------------------------- |
| 🛒 Store       | http://localhost:8080/index.html       |
| 📊 Dashboard   | http://localhost:8080/dashboard.html   |
| 📋 Reports     | http://localhost:8080/reports.html     |
| ➕ Add Product | http://localhost:8080/add-product.html |
| ⚡ API Health  | http://localhost:3000/api/health       |

---

## 🌐 API Reference

### Products

| Method  | Endpoint                  | Description                                            |
| ------- | ------------------------- | ------------------------------------------------------ |
| `GET`   | `/api/products`           | List all products with ratings & images                |
| `GET`   | `/api/products/:id`       | Single product with reviews, rating breakdown & photos |
| `POST`  | `/api/products`           | Create product (`multipart/form-data` with images)     |
| `PATCH` | `/api/products/:id/stock` | Adjust stock by delta (+N or -N)                       |

### Orders & Checkout

| Method   | Endpoint                 | Description                                      |
| -------- | ------------------------ | ------------------------------------------------ |
| `POST`   | `/api/cart/validate`     | Validate stock before checkout                   |
| `POST`   | `/api/checkout`          | Place order, decrement stock, emit Socket events |
| `GET`    | `/api/orders/recent`     | Last 30 orders with item count                   |
| `GET`    | `/api/orders/:id`        | Single order with line items                     |
| `DELETE` | `/api/orders/reset-demo` | Reset all orders + restore seed stock            |

### Analytics & Reports

| Method | Endpoint                    | Description                       |
| ------ | --------------------------- | --------------------------------- |
| `GET`  | `/api/analytics`            | KPIs, chart data, low-stock items |
| `GET`  | `/api/reports/products.pdf` | Download product catalogue PDF    |
| `GET`  | `/api/reports/stock.pdf`    | Download stock status PDF         |
| `GET`  | `/api/reports/invoice/:id`  | Download order invoice PDF        |
| `GET`  | `/api/health`               | Server health check               |

### Reviews

| Method | Endpoint       | Description                         |
| ------ | -------------- | ----------------------------------- |
| `POST` | `/api/reviews` | Submit a product review (1–5 stars) |

---

## 🗄️ Database Schema

```sql
┌─────────────────┐       ┌──────────────────┐
│    products     │       │     reviews      │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │◄──────│ productId (FK)   │
│ name            │       │ customerName     │
│ description     │       │ rating (1-5)     │
│ category        │       │ comment          │
│ price           │       │ createdAt        │
│ taxRate         │       └──────────────────┘
│ stockQty        │
│ createdAt       │       ┌──────────────────┐
└─────────────────┘       │  product_photos  │
         │                ├──────────────────┤
         │                │ productId (FK)   │
         │                │ imageUrl         │
         └───────────────►│ sortOrder        │
                          └──────────────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│     orders      │       │   order_items    │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │◄──────│ orderId (FK)     │
│ customerName    │       │ productId (FK)   │
│ note            │       │ qty              │
│ subtotal        │       │ unitPrice        │
│ taxTotal        │       │ unitTaxRate      │
│ grandTotal      │       │ lineSubtotal     │
│ createdAt       │       │ lineTax          │
└─────────────────┘       │ lineTotal        │
                          └──────────────────┘
```

---

## 🌍 Deployment Guide

This project is deployed on a **3-platform free stack**:

```
Frontend  →  Vercel        (static HTML/CSS/JS — global CDN)
Backend   →  Render.com    (Node.js persistent server + Socket.IO)
Database  →  Railway       (MySQL 8 — free $5/month credit)
```

### Key environment variables for production (Render):

```env
DB_HOST=gondola.proxy.rlwy.net        # Railway public host
DB_PORT=11327                          # Railway public port (NOT 3306)
DB_USER=root
DB_PASS=your_railway_password
DB_NAME=railway
DB_SSL=true
NODE_ENV=production
BACKEND_URL=https://your-app.onrender.com
FRONTEND_ORIGIN=https://your-app.vercel.app
```

> ⚠️ **Important:** Render free tier sleeps after 15 minutes of inactivity. Open `/api/health` 2 minutes before any demo to wake it up.

---

## 🛠️ Tech Stack

<div align="center">

| Layer              | Technology                | Version |
| ------------------ | ------------------------- | ------- |
| **Runtime**        | Node.js                   | 22.x    |
| **Framework**      | Express                   | 4.18    |
| **Database**       | MySQL (via mysql2)        | 8.0     |
| **Real-time**      | Socket.IO                 | 4.6     |
| **PDF Generation** | PDFKit                    | 0.15    |
| **File Uploads**   | Multer (disk storage)     | 1.4     |
| **Frontend**       | Vanilla HTML5 / CSS3 / JS | —       |
| **CSS Framework**  | Bootstrap                 | 5.3     |
| **Charts**         | Chart.js                  | CDN     |
| **Dev Server**     | Nodemon                   | 3.0     |
| **Frontend Host**  | Vercel                    | —       |
| **Backend Host**   | Render.com                | Free    |
| **Database Host**  | Railway                   | Free    |

</div>

---

## 🐛 Troubleshooting

| Problem                     | Solution                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Products don't load         | Check browser Console for CORS errors. Verify `FRONTEND_ORIGIN` in Render matches your Vercel URL exactly      |
| `ECONNREFUSED` on MySQL     | Verify all 5 DB\_ variables in Render. Use Railway's **public** host (not `.railway.internal`)                 |
| Images not showing          | Ensure `BACKEND_URL` in Render is set to `https://your-app.onrender.com` (no trailing slash, no `/api/health`) |
| PDFs fail to download       | Check Render logs. PDFKit is pure JS — no Chrome needed                                                        |
| Socket not connecting       | `FRONTEND_ORIGIN` must match Vercel URL. Check browser console for WebSocket errors                            |
| Render shows 503            | Server is sleeping — open `/api/health` and wait 60 seconds                                                    |
| `ER_BAD_DB_ERROR`           | Wrong `DB_NAME`. Use `railway` (the Railway default database name)                                             |
| Port already in use (local) | Change `PORT=3001` in `.env` and update `API_BASE` in `frontend/js/api.js`                                     |
| Git push rejected           | Run `git pull --rebase origin main` then `git push`                                                            |

---

## 📸 Pages Overview

| Page                  | Route                | Description                                                 |
| --------------------- | -------------------- | ----------------------------------------------------------- |
| 🛒 **Storefront**     | `/index.html`        | Browse products, filter by category, search, sort, wishlist |
| 📦 **Product Detail** | `/product.html?id=1` | Photo gallery, description, reviews, add to cart            |
| 🛍️ **Shopping Cart**  | `/cart.html`         | Cart items, quantity controls, checkout modal               |
| 📊 **Dashboard**      | `/dashboard.html`    | KPI cards, 4 Chart.js charts, low-stock table               |
| 📋 **Reports**        | `/reports.html`      | Order history table, PDF download buttons                   |
| ➕ **Add Product**    | `/add-product.html`  | Product form with drag & drop multi-image upload            |

---

## 🔌 Real-Time Events (Socket.IO)

| Event         | Direction       | Payload                                 | Effect                                         |
| ------------- | --------------- | --------------------------------------- | ---------------------------------------------- |
| `stockUpdate` | Server → Client | `[{ productId, newStock }]`             | Updates stock badges on storefront, syncs cart |
| `newOrder`    | Server → Client | `{ orderId, customerName, grandTotal }` | Refreshes dashboard, shows toast notification  |

---

<div align="center">

## 🎓 About This Project

This is a full-stack academic assignment project demonstrating:

- **RESTful API design** with Express.js
- **Relational database** modeling with MySQL
- **Real-time communication** with Socket.IO WebSockets
- **PDF generation** server-side with PDFKit
- **File upload** handling with Multer
- **Frontend-backend separation** with CORS
- **Production deployment** on a 3-platform free stack

---

Built with ❤️ for Bangladesh 🇧🇩

[![Made with Node.js](https://img.shields.io/badge/Made_with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Database on Railway](https://img.shields.io/badge/Database_on-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)

</div>
