// backend/src/app.js
'use strict';
require('dotenv').config();
const express  = require('express');
const http     = require('http');
const path     = require('path');
const fs       = require('fs');
const cors     = require('cors');
const sockets  = require('./sockets');

const app    = express();
const server = http.createServer(app);
sockets.init(server);

// ── Uploads directory ────────────────────────────────────────────────────────
// Product images are stored here and served publicly so the frontend can
// display them across origins.
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow the frontend origin (set in .env) and localhost variants for dev.
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',   // VS Code Live Server default
  'http://127.0.0.1:5500',
  'null',                    // file:// origins show as "null" in some browsers
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Serve uploaded product images ─────────────────────────────────────────────
// The frontend references images as: http://localhost:3000/uploads/products/foo.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/products',  require('./routes/products'));
app.use('/api/reviews',   require('./routes/reviews'));
app.use('/api/checkout',  require('./routes/checkout'));
app.use('/api/cart',      require('./routes/checkout'));   // /api/cart/validate
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/orders',    require('./routes/orders'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 for unknown API routes ────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✅  Backend API running → http://localhost:${PORT}`);
  console.log(`📁  Uploads served  → http://localhost:${PORT}/uploads/products/`);
  console.log(`🔌  Socket.IO ready → ws://localhost:${PORT}\n`);
});
