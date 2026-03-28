# 🚀 Online Store — Complete Deployment Guide
### For Assignment Demo (Free, Beginner-Friendly)

---

## PART 1 — Project Deployment Analysis

### What This Project Actually Uses

After inspecting the full codebase, here is every technology this project relies on:

| Component | Technology | Notes |
|---|---|---|
| Frontend | Pure HTML5 + CSS3 + Vanilla JS | No React, no build step |
| CSS Framework | Bootstrap 5.3 (CDN) | Loaded from internet |
| Charts | Chart.js (CDN) | Dashboard page only |
| Backend | Node.js + Express 4 | Long-running server |
| Real-time | Socket.IO 4.6 | WebSocket connections |
| Database | MySQL 8 | 5 tables, relational |
| PDF Generation | Puppeteer 21 (headless Chrome) | ~170 MB Chromium binary |
| File Uploads | Multer (disk storage) | Saves images to local disk |
| Architecture | Frontend + Backend SEPARATED | Two different origins |

---

## PART 2 — Can Vercel Handle This Project?

### ❌ NO. Vercel CANNOT fully run this project.

This is not an opinion. Here are the exact technical reasons, based on the actual code:

---

### Reason 1 — Socket.IO WebSockets ❌

Your `backend/src/sockets.js` creates a persistent Socket.IO server:

```js
_io = new Server(server, { cors: {...} });
_io.on('connection', (socket) => { ... });
```

Vercel uses **serverless functions**. Each API request spins up a fresh container and shuts it down
immediately after. A WebSocket connection is persistent — it stays open for minutes or hours.
Serverless containers cannot hold persistent connections.

**Result on Vercel:** Real-time stock updates (`stockUpdate`) and live order notifications
(`newOrder`) would be completely broken. Every connected browser would disconnect instantly.

---

### Reason 2 — Puppeteer / Headless Chrome ❌

Your `backend/src/pdf/renderPdf.js`:

```js
const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

Puppeteer downloads and runs a **full Chromium browser** (~170 MB). Vercel serverless
functions have a hard limit of **50 MB** compressed. The Chromium binary alone exceeds
this by more than 3x. This is a hard technical wall with no workaround.

**Result on Vercel:** PDF reports (product report, stock report, invoices) would fail
100% of the time with a "Function exceeded size limit" error during deployment.

---

### Reason 3 — Multer Disk Storage ❌

Your `backend/src/routes/products.js`:

```js
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/products'));
  },
```

Multer is configured to save uploaded product images **directly to the server's disk**.
Vercel's filesystem is **read-only and ephemeral** — you cannot write files to disk,
and even if you could, they would be deleted between every function invocation.

**Result on Vercel:** Product image uploads would fail with a "read-only filesystem"
error. All existing seeded images would also not be accessible.

---

### Reason 4 — Long-Running Express Server ❌

Your `backend/src/app.js` starts a traditional HTTP server:

```js
const server = http.createServer(app);
sockets.init(server);
server.listen(PORT, () => { ... });
```

Vercel's model converts Express apps into short-lived serverless Lambda functions.
Each function invocation has a maximum timeout (10s on free, 30s on Pro). A Puppeteer
PDF generation call alone takes 5–15 seconds, which combined with cold start time
would regularly timeout.

**Result on Vercel:** Intermittent timeout errors on all routes, and guaranteed
timeout errors on PDF routes.

---

### Summary Table — Vercel Compatibility

| Feature | Vercel | Why |
|---|---|---|
| Serve static HTML pages | ✅ Works | Vercel excels at static files |
| REST API routes (GET/POST) | ⚠️ Partially | Works but with cold start delays |
| MySQL database | ❌ Not hosted | Needs external DB either way |
| Socket.IO WebSockets | ❌ Broken | Serverless cannot hold connections |
| Puppeteer PDF generation | ❌ Broken | 170MB binary > 50MB function limit |
| Multer disk image upload | ❌ Broken | Read-only ephemeral filesystem |
| Long-running Express server | ❌ Wrong model | Serverless ≠ persistent server |

**Conclusion: Vercel is suitable for your frontend only. It cannot run your backend.**

---

## PART 3 — Best Recommended Deployment Strategy

### The Winning Stack (Free, Reliable, Beginner-Friendly)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│   FRONTEND              BACKEND               DATABASE            │
│   ─────────             ─────────             ─────────           │
│                                                                   │
│   Vercel          →     Render.com      →     Railway             │
│   (free)                (free tier)           (MySQL, free)       │
│                                                                   │
│   Hosts your            Runs your             Hosts your          │
│   HTML/CSS/JS           Node.js server        MySQL database      │
│   static files          with WebSockets       with all 5 tables   │
│                         and Puppeteer                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Stack?

**Vercel for Frontend:**
- Free, unlimited bandwidth
- Deploys in under 2 minutes from GitHub
- Global CDN — loads fast anywhere in the world
- Zero configuration needed for static HTML/JS/CSS

**Render.com for Backend:**
- Free tier supports persistent Node.js servers (not serverless)
- Supports WebSockets natively — Socket.IO works perfectly
- Supports Puppeteer with system Chrome installation
- Supports writing to disk (though not persistent across restarts — see note)
- Automatically reads your `PORT` environment variable
- Deploys from GitHub with zero configuration

**Railway for MySQL Database:**
- Provides a real MySQL 8 database (not Postgres, not SQLite — actual MySQL)
- Your existing `schema.sql`, `seed.sql`, and migrations run without any changes
- Free tier gives $5/month credit — more than enough for a demo project
- Connection credentials provided via environment variables — plug directly into your `.env`

---

### Important Note About Image Uploads on Render Free Tier

Render's free tier has an **ephemeral filesystem** — files written to disk are lost
whenever the server restarts (which happens on every deploy, and after 15 minutes of
inactivity on the free plan).

For your assignment demo, this means:
- The **seeded product images** (the ones that came with the project) will not persist
  after a restart because they were never on Render's disk
- **New images uploaded** via the Add Product page will disappear after the next restart

**Recommended solution for demo:** Pre-load all demo product images into the database
during seed, and use the seed data for your demo. During your live demo with your
professor, avoid restarting the server mid-demo.

For a production-grade solution (beyond the scope of an assignment), you would use
Cloudinary for image storage.

---

---

## PART 4 — Full Step-by-Step Deployment Guide

---

### PHASE 0 — Prerequisites (Do This First)

#### Things to install on your PC:

1. **Git** — https://git-scm.com/download/win
   - During install: choose "Git from the command line and also from 3rd-party software"
   - After install, open Command Prompt and type: `git --version` — you should see a version number

2. **Node.js v18 LTS** — https://nodejs.org (needed locally for testing only)
   - After install, type: `node --version` — should show v18.x.x

3. **GitHub Desktop** (optional, easier than command line) — https://desktop.github.com

#### Accounts to create (all free):

| Service | Sign Up URL | What It's For |
|---|---|---|
| GitHub | https://github.com/signup | Stores your code — required for all deployments |
| Vercel | https://vercel.com/signup | Hosts your frontend |
| Render | https://render.com/register | Hosts your backend |
| Railway | https://railway.app/login | Hosts your MySQL database |

> **Tip:** Sign up to all four using your GitHub account ("Continue with GitHub" button).
> This makes connecting services much easier.

---

### PHASE 1 — Prepare Your Code

> You must do these steps BEFORE pushing to GitHub and deploying.
> Open the refactored project folder in a text editor (VS Code recommended).

#### Step 1.1 — Update the database connection to support SSL

Cloud databases require SSL encryption. Open `backend/src/db.js` and replace the
entire file contents with this:

```js
// backend/src/db.js
'use strict';
const mysql = require('mysql2/promise');
require('dotenv').config();

const sslConfig = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'online_store',
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4',
  ssl:                sslConfig,
});

module.exports = pool;
```

#### Step 1.2 — Add render.yaml to the project root

Create a new file called `render.yaml` in your project root (same level as `backend/`
and `frontend/` folders). Paste this content:

```yaml
services:
  - type: web
    name: online-store-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

> This tells Render exactly how to build and start your server.

#### Step 1.3 — Add vercel.json to the frontend folder

Create a new file called `vercel.json` inside the `frontend/` folder. Paste this:

```json
{
  "version": 2,
  "name": "online-store-frontend",
  "builds": [{ "src": "**/*", "use": "@vercel/static" }],
  "routes": [{ "src": "/(.*)", "dest": "/$1" }]
}
```

#### Step 1.4 — Create a .gitignore in the project root

Create a file called `.gitignore` in the project root folder. Paste this:

```
node_modules/
backend/.env
backend/public/uploads/products/*
!backend/public/uploads/products/.gitkeep
.DS_Store
*.log
```

> This prevents secrets and large files from being uploaded to GitHub.

#### Step 1.5 — Leave api.js as localhost for now

Keep `frontend/js/api.js` pointing to `http://localhost:3000` for now.
You will update it with the real Render URL in Phase 4, after deployment.

---

### PHASE 2 — Push Your Code to GitHub

#### Step 2.1 — Create a GitHub repository

1. Go to https://github.com and log in
2. Click the green **"New"** button (top left)
3. Repository name: `online-store`
4. Set to **Public** (free, easier for deployment)
5. Do NOT check "Add README" (your project already has one)
6. Click **"Create repository"**

#### Step 2.2 — Push your project to GitHub

Open Command Prompt in your project root folder (the folder containing `backend/`
and `frontend/`). Run these commands one by one:

```cmd
git init
git add .
git commit -m "Initial commit — online store project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/online-store.git
git push -u origin main
```

> Replace `YOUR-USERNAME` with your actual GitHub username.

After this, refresh your GitHub page — you should see all your files there.

---

### PHASE 3 — Deploy the MySQL Database on Railway

#### Step 3.1 — Create a Railway project

1. Go to https://railway.app and log in with GitHub
2. Click **"New Project"**
3. Click **"Provision MySQL"**
4. Railway will create a MySQL 8 database in about 30 seconds

#### Step 3.2 — Get your database connection details

1. Click on the MySQL service that was just created
2. Click the **"Variables"** tab
3. You will see these variables — copy them all, you need them later:
   - `MYSQLHOST` → this is your DB_HOST
   - `MYSQLPORT` → this is your DB_PORT
   - `MYSQLUSER` → this is your DB_USER
   - `MYSQLPASSWORD` → this is your DB_PASS
   - `MYSQLDATABASE` → this is your DB_NAME

#### Step 3.3 — Connect to the Railway database and run your SQL

Option A — Using a database GUI (recommended for beginners):
1. Download **TablePlus** (free) → https://tableplus.com
2. Click "Create a new connection" → choose MySQL
3. Fill in the Railway connection details from Step 3.2
4. Enable SSL (toggle it ON)
5. Click "Connect"
6. Once connected, click "File" → "Open" → select `backend/sql/schema.sql`
7. Press Cmd+R (Mac) or Ctrl+R (Windows) to run it
8. Repeat for `backend/sql/seed.sql`
9. Repeat for `backend/sql/add_photos_table.sql`

Option B — Using Railway's query panel:
1. In Railway, click on the MySQL service
2. Click the **"Data"** tab
3. Copy and paste the entire contents of `schema.sql` → click Run
4. Copy and paste the entire contents of `seed.sql` → click Run
5. Copy and paste the entire contents of `add_photos_table.sql` → click Run

> After running seed.sql, click on the "products" table to verify you see 15 products.

---

### PHASE 4 — Deploy the Backend on Render

#### Step 4.1 — Create a Render web service

1. Go to https://render.com and log in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select your `online-store` repository
5. Render will auto-detect settings. Verify:
   - **Name:** `online-store-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
6. Click **"Create Web Service"** — do NOT start it yet

#### Step 4.2 — Add environment variables in Render

In your Render service dashboard, click **"Environment"** in the left sidebar.
Click **"Add Environment Variable"** for each of these:

| Key | Value |
|---|---|
| `DB_HOST` | (paste MYSQLHOST from Railway) |
| `DB_PORT` | (paste MYSQLPORT from Railway, usually 3306) |
| `DB_USER` | (paste MYSQLUSER from Railway) |
| `DB_PASS` | (paste MYSQLPASSWORD from Railway) |
| `DB_NAME` | (paste MYSQLDATABASE from Railway) |
| `DB_SSL` | `true` |
| `NODE_ENV` | `production` |
| `BACKEND_URL` | (leave blank for now — you will fill this in Step 4.4) |
| `FRONTEND_ORIGIN` | (leave blank for now — you will fill this in Phase 5) |

Click **"Save Changes"** after adding all variables.

#### Step 4.3 — Deploy the backend

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Watch the build logs — this will take 3–8 minutes the first time
   (it downloads Node.js modules including Puppeteer's Chromium browser)
3. Wait until you see: `==> Your service is live 🎉`
4. Your backend URL will appear at the top — it looks like:
   `https://online-store-backend-xxxx.onrender.com`
5. Copy this URL — you need it in the next steps

#### Step 4.4 — Update BACKEND_URL

1. In Render → Environment → click on `BACKEND_URL`
2. Set the value to your Render URL (from Step 4.3), e.g.:
   `https://online-store-backend-xxxx.onrender.com`
3. Click Save — this triggers a redeploy (wait 2–3 minutes)

#### Step 4.5 — Test the backend is working

Open your browser and go to:
```
https://your-backend.onrender.com/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2026-03-28T..."}
```

Also test:
```
https://your-backend.onrender.com/api/products
```

You should see a JSON list of 15 products. If you do — your backend is working perfectly.

---

### PHASE 5 — Deploy the Frontend on Vercel

#### Step 5.1 — Update api.js with the real backend URL

Open `frontend/js/api.js` in your editor and change line 8:

```js
// Change this:
const API_BASE = 'http://localhost:3000';

// To this (use your actual Render URL):
const API_BASE = 'https://online-store-backend-xxxx.onrender.com';
```

#### Step 5.2 — Commit and push the updated api.js

```cmd
git add frontend/js/api.js
git commit -m "Update API_BASE to Render backend URL"
git push
```

#### Step 5.3 — Deploy to Vercel

1. Go to https://vercel.com and log in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find your `online-store` repository and click **"Import"**
4. In the configuration screen:
   - **Framework Preset:** Other (leave blank — it's static HTML)
   - **Root Directory:** Click "Edit" → type `frontend` → click "Continue"
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
5. Click **"Deploy"**
6. Wait 30–60 seconds
7. You will see a "Congratulations!" screen with your live URL:
   `https://online-store-xxxx.vercel.app`

#### Step 5.4 — Update FRONTEND_ORIGIN in Render

1. Go back to Render → your backend service → Environment
2. Click on `FRONTEND_ORIGIN`
3. Set the value to your Vercel URL, e.g.:
   `https://online-store-xxxx.vercel.app`
4. Click Save — this triggers a redeploy (wait 2–3 minutes for it to finish)

> This step is critical. Without it, your browser will get a CORS error when the
> frontend tries to talk to the backend.

---

### PHASE 6 — Final Verification

After both services have redeployed, open your Vercel URL and test everything:

#### Checklist:

- [ ] **Homepage loads** — you see the product listing with categories
- [ ] **Products appear** — 15 products from the seed data are visible
- [ ] **Product images show** — at least some images load (emoji fallbacks are OK)
- [ ] **Click a product** — product detail page opens with reviews
- [ ] **Add to cart** — click "Add to Cart" on any product
- [ ] **Cart badge updates** — the cart icon shows the count
- [ ] **Go to cart page** — items appear with correct prices
- [ ] **Place a test order** — enter your name, click "Place Order"
- [ ] **Order success message** — you see order confirmation with order number
- [ ] **Dashboard loads** — go to dashboard.html, you see charts
- [ ] **PDF reports** — go to reports.html, click "Product Report PDF" — PDF downloads
- [ ] **Real-time indicator** — look for the green "Live Updates Active" text in footer
- [ ] **Test real-time** — open the site in TWO different browser tabs, add to cart in one, both should update

---

### Common Deployment Errors and Fixes

| Error | Where | Fix |
|---|---|---|
| "CORS policy blocked" | Browser console | Go to Render → set FRONTEND_ORIGIN to your exact Vercel URL (no trailing slash) |
| Products don't load (API error) | Browser network tab | Check Render logs — database not connected. Verify DB_HOST, DB_PASS, DB_SSL=true |
| "Service unavailable" on Render | Render URL | Wait — Render free tier sleeps after 15 min. First request wakes it up (30–60 sec) |
| Images show as broken | Any product | The seeded image files are not on Render. This is expected — emoji fallbacks show instead |
| Socket not connecting | Browser console | Verify FRONTEND_ORIGIN is correct in Render. Check Render logs for socket errors |
| PDF download fails | Reports page | Render needs Chrome. Check build logs for Puppeteer install success |
| "ER_BAD_DB_ERROR" | Render logs | The database name is wrong — check MYSQLDATABASE variable in Railway |
| Deployment stuck at "Building" | Render dashboard | Cancel and redeploy. If it fails again, check the build logs for the error message |
| Vercel shows 404 on pages | Browser | Make sure you deployed the `frontend/` subfolder, not the whole project root |


---

## PART 5 — Free Platform Comparison

Here is an honest comparison of every major free hosting platform for this specific project:

---

### Vercel

| Attribute | Rating |
|---|---|
| Cost | Free |
| Frontend hosting | ⭐⭐⭐⭐⭐ Best-in-class |
| Backend (Node.js) | ⭐⭐ Serverless only — no WebSockets |
| MySQL hosting | ❌ Not available |
| Puppeteer support | ❌ File size limit exceeded |
| WebSocket / Socket.IO | ❌ Broken by design |
| Ease of use | ⭐⭐⭐⭐⭐ Excellent dashboard |
| Good for this project? | Frontend ONLY |
| Assignment suitable? | Frontend ONLY |

**Verdict:** Perfect for hosting your static frontend. Cannot run your backend at all.

---

### Netlify

| Attribute | Rating |
|---|---|
| Cost | Free |
| Frontend hosting | ⭐⭐⭐⭐⭐ Excellent |
| Backend (Node.js) | ⭐⭐ Serverless functions only |
| MySQL hosting | ❌ Not available |
| Puppeteer support | ❌ Function size limit |
| WebSocket / Socket.IO | ❌ Not supported |
| Ease of use | ⭐⭐⭐⭐ Very easy |
| Good for this project? | Frontend ONLY |

**Verdict:** Same story as Vercel for this project. Great for frontend, cannot run backend.
Use Vercel instead — it's slightly simpler for this use case.

---

### Render.com

| Attribute | Rating |
|---|---|
| Cost | Free (with limitations) |
| Frontend hosting | ⭐⭐⭐ Basic static hosting |
| Backend (Node.js) | ⭐⭐⭐⭐⭐ Full persistent server |
| MySQL hosting | ❌ Only PostgreSQL on free |
| Puppeteer support | ⭐⭐⭐⭐ Works with config |
| WebSocket / Socket.IO | ⭐⭐⭐⭐⭐ Fully supported |
| Ease of use | ⭐⭐⭐⭐ Very easy |
| Free tier limits | Sleeps after 15 min inactivity; 512MB RAM |
| Good for this project? | Backend ONLY (use Vercel for frontend) |
| Assignment suitable? | ✅ Yes — perfect for backend |

**Verdict:** The best free option for running your Node.js backend. The "sleep after 15
minutes" is the only real downside for demos — the first request after idle takes 30–60
seconds to respond. Just open the backend URL once before your demo to wake it up.

---

### Railway

| Attribute | Rating |
|---|---|
| Cost | Free ($5/month credit — enough for demo) |
| Frontend hosting | ⭐⭐⭐ Possible but not ideal |
| Backend (Node.js) | ⭐⭐⭐⭐⭐ Full persistent server |
| MySQL hosting | ⭐⭐⭐⭐⭐ Native MySQL 8 support |
| Puppeteer support | ⭐⭐⭐⭐ Works |
| WebSocket / Socket.IO | ⭐⭐⭐⭐⭐ Fully supported |
| Ease of use | ⭐⭐⭐⭐ Easy dashboard |
| Free tier limits | $5/month credit (resets monthly) — no sleeping |
| Good for this project? | Backend + Database |
| Assignment suitable? | ✅ Yes — great for MySQL database |

**Verdict:** The best free MySQL hosting available. Does NOT sleep like Render.
Ideal as the database host in our recommended stack. You could also host the
backend here instead of Render if you prefer one fewer platform.

---

### Firebase

| Attribute | Rating |
|---|---|
| Cost | Free (Spark plan) |
| Frontend hosting | ⭐⭐⭐⭐⭐ Excellent |
| Backend (Node.js) | ⭐⭐ Cloud Functions only (serverless) |
| MySQL hosting | ❌ Only Firestore/Realtime DB (NoSQL) |
| Puppeteer support | ❌ Serverless — won't work |
| WebSocket / Socket.IO | ⭐⭐⭐⭐ Firebase Realtime DB (but not Socket.IO) |
| Ease of use | ⭐⭐⭐ Requires significant code rewriting |
| Good for this project? | ❌ Requires rewriting to NoSQL |
| Assignment suitable? | ❌ Too much rewriting required |

**Verdict:** Firebase works great for projects built around it from the start. To use
Firebase with this project, you would need to rewrite the entire database layer to
use Firestore (NoSQL). That is a major undertaking — not worth it for an assignment.

---

### Supabase

| Attribute | Rating |
|---|---|
| Cost | Free |
| Frontend hosting | ❌ Not a hosting platform |
| Backend (Node.js) | ❌ Not a Node.js host |
| Database (PostgreSQL) | ⭐⭐⭐⭐⭐ Excellent |
| MySQL support | ❌ PostgreSQL only |
| Good for this project? | ❌ Wrong database type |
| Assignment suitable? | ❌ Would require DB migration |

**Verdict:** Supabase is an excellent PostgreSQL + auth platform, but this project
uses MySQL-specific syntax and features. Migrating is possible but requires work.
Stick with Railway for MySQL.

---

### Fly.io

| Attribute | Rating |
|---|---|
| Cost | Free tier available |
| Backend (Node.js) | ⭐⭐⭐⭐⭐ Full Docker containers |
| Puppeteer support | ⭐⭐⭐⭐⭐ Full Docker — anything works |
| WebSocket / Socket.IO | ⭐⭐⭐⭐⭐ Fully supported |
| Ease of use | ⭐⭐ Requires Dockerfile knowledge |
| Good for this project? | ✅ Yes — technically excellent |
| Assignment suitable? | ⚠️ Overkill, steeper learning curve |

**Verdict:** More powerful than Render, but requires writing a Dockerfile and
understanding containers. Not beginner-friendly. Use Render instead for this assignment.

---

## PART 6 — Paid Alternatives

If free hosting is not reliable enough for your demo (for example, if you are
presenting to multiple professors over several days), consider these paid options:

### Render Paid Plan ($7/month for backend)

- No sleeping — server stays awake permanently
- 512MB RAM → 2GB RAM (Puppeteer will be more stable)
- Persistent disk available — uploaded images survive restarts
- **Recommended if:** You need 100% uptime during your demo week

### Railway Developer Plan ($5+/month)

- Run backend + database together on one platform
- No sleeping
- More resources
- **Recommended if:** You want everything on one dashboard

### DigitalOcean App Platform ($5/month)

- Reliable, professional platform
- Supports Node.js persistent servers, WebSockets, Puppeteer
- PostgreSQL managed database ($7/month extra, or use Railway MySQL)
- **Recommended if:** You need production-grade reliability

### DigitalOcean Droplet ($4/month)

- Full virtual private server (VPS)
- Install MySQL, Node.js, Nginx — total control
- You manage everything yourself
- **Recommended if:** You want to learn real server management

---

## PART 7 — Final Recommendation for Your Assignment Demo

---

### Easiest Option 🥇
**Render (backend) + Vercel (frontend) + Railway (MySQL)**

Follow the step-by-step guide in Part 4 exactly. This stack requires:
- No code changes except `api.js` URL update and `db.js` SSL addition
- No Docker, no build tools, no configuration files beyond what is provided
- All three platforms have beginner-friendly dashboards
- Total setup time: approximately 45–90 minutes

---

### Best Free Option 🏆
**Same as above: Render + Vercel + Railway**

All three platforms are free for your scale of usage. The only cost consideration:
Railway gives $5/month free credit which resets monthly — more than enough for
a MySQL instance running a small demo project.

---

### Best Paid Option 💳
**Render Paid ($7/month) + Vercel (free) + Railway (free)**

Upgrading just the Render backend to a paid plan eliminates the 15-minute sleep
issue, gives more RAM for Puppeteer, and adds persistent disk (so uploaded images
survive restarts). This single upgrade makes the demo rock-solid.

---

### My Personal Recommendation for Your Assignment 🎯

**Use: Vercel + Render + Railway (all free)**

Here is my reasoning:

1. **It will work.** Every feature of your app — REST API, WebSockets, PDF generation,
   MySQL, image serving — is supported by this stack. Nothing is broken or missing.

2. **It is completely free.** No credit card needed for the basic demo.

3. **It deploys from GitHub in minutes.** No server management, no terminal
   configuration, no Docker. Just push to GitHub and click deploy.

4. **The URLs look professional.** Your professor will see:
   - `https://online-store.vercel.app` (or similar) for the frontend
   - The frontend works instantly, loads fast globally
   - Everything is on HTTPS automatically

5. **One important prep step before your demo:**
   Open `https://your-backend.onrender.com/api/health` in your browser 2 minutes
   before the demo. This "wakes up" the Render free tier server so there is no
   cold-start delay when your professor opens the site.

---

### Quick Reference — What Goes Where

| Part of Project | Deploy To | Cost |
|---|---|---|
| `frontend/` folder | Vercel | Free |
| `backend/` folder | Render.com | Free |
| MySQL database | Railway | Free ($5/mo credit) |
| Product images (seed) | Seed via SQL — stored in DB | N/A |

---

### Pre-Demo Checklist

Before showing your professor:

- [ ] Both Render and Vercel show green "Live" status
- [ ] Visit backend URL + `/api/health` — get `{"status":"ok"}`  
- [ ] Visit backend URL + `/api/products` — see 15 products in JSON
- [ ] Open your Vercel frontend URL — products load with emoji or images
- [ ] Test adding to cart and placing a test order
- [ ] Test dashboard — charts appear
- [ ] Test a PDF report — downloads successfully
- [ ] Check browser DevTools console — no CORS errors in red
- [ ] Do the "wake up" call 2 minutes before presenting

