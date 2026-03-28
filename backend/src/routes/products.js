// backend/src/routes/products.js
'use strict';
const express  = require('express');
const router   = express.Router();
const path     = require('path');
const crypto   = require('crypto');
const fs       = require('fs');
const multer   = require('multer');
const db       = require('../db');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

/**
 * Returns an absolute URL for a product image so the frontend (on a different
 * origin) can actually fetch it from the backend's /uploads route.
 */
function absoluteImageUrl(relPath) {
  if (!relPath) return null;
  if (relPath.startsWith('http')) return relPath;          // already absolute
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}${relPath.startsWith('/') ? '' : '/'}${relPath}`;
}

function findLocalImage(slug) {
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of exts) {
    const localName = `${slug}${ext}`;
    const localPath = path.join(__dirname, '../../public/uploads/products', localName);
    if (fs.existsSync(localPath)) return absoluteImageUrl(`/uploads/products/${localName}`);
  }
  return null;
}

// ── Multer ────────────────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_SIZE_MB  = 5;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/products'));
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safe = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only jpg, png, webp allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 10 },
});

// ── GET /api/products ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.*,
        COALESCE(AVG(r.rating), 0)  AS avgRating,
        COUNT(DISTINCT r.id)        AS reviewCount,
        (
          SELECT pp.imageUrl
          FROM   product_photos pp
          WHERE  pp.productId = p.id
          ORDER  BY pp.sortOrder ASC, pp.id ASC
          LIMIT  1
        ) AS primaryImage
      FROM   products p
      LEFT JOIN reviews r ON r.productId = p.id
      GROUP  BY p.id
      ORDER  BY p.category, p.name
    `);

    const rowsWithImages = rows.map(p => {
      let image = findLocalImage(buildSlug(p.name));
      if (!image) {
        if (p.primaryImage && !p.primaryImage.startsWith('http')) {
          image = absoluteImageUrl(p.primaryImage);
        } else {
          image = null;
        }
      }
      return { ...p, primaryImage: image };
    });

    res.json({ success: true, data: rowsWithImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products (multipart/form-data) ──────────────────────────────────
router.post('/', upload.array('images', 10), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name, description, category, price, taxRate, stockQty } = req.body;

    const errors = [];
    if (!name?.trim())                                                errors.push('Name is required.');
    if (!category?.trim())                                            errors.push('Category is required.');
    if (isNaN(Number(price)) || Number(price) <= 0)                  errors.push('Price must be a positive number.');
    if (isNaN(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 1)
                                                                      errors.push('Tax rate must be 0–1 (e.g. 0.05 = 5%).');
    if (isNaN(Number(stockQty)) || Number(stockQty) < 0)             errors.push('Stock quantity must be >= 0.');

    if (errors.length) {
      (req.files || []).forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
      return res.status(400).json({ success: false, errors });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO products (name, description, category, price, taxRate, stockQty, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        name.trim(),
        description?.trim() || '',
        category.trim(),
        Number(price).toFixed(2),
        Number(taxRate).toFixed(4),
        parseInt(stockQty, 10),
      ]
    );
    const productId = result.insertId;

    const photos = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const relUrl  = `/uploads/products/${req.files[i].filename}`;
        const absUrl  = absoluteImageUrl(relUrl);
        await conn.query(
          'INSERT INTO product_photos (productId, imageUrl, sortOrder, createdAt) VALUES (?, ?, ?, NOW())',
          [productId, relUrl, i]
        );
        photos.push({ imageUrl: absUrl, sortOrder: i });
      }
    }

    await conn.commit();

    const [[newProduct]] = await conn.query('SELECT * FROM products WHERE id = ?', [productId]);
    newProduct.avgRating    = 0;
    newProduct.reviewCount  = 0;
    newProduct.primaryImage = photos[0]?.imageUrl || null;

    res.status(201).json({ success: true, data: { product: newProduct, photos } });
  } catch (err) {
    await conn.rollback();
    (req.files || []).forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*,
             COALESCE(AVG(r.rating), 0) AS avgRating,
             COUNT(DISTINCT r.id)       AS reviewCount
      FROM   products p
      LEFT JOIN reviews r ON r.productId = p.id
      WHERE  p.id = ?
      GROUP  BY p.id
    `, [req.params.id]);

    if (!products.length)
      return res.status(404).json({ success: false, message: 'Product not found' });

    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC',
      [req.params.id]
    );

    const [breakdown] = await db.query(
      'SELECT rating, COUNT(*) AS cnt FROM reviews WHERE productId = ? GROUP BY rating',
      [req.params.id]
    );
    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach(b => { ratingMap[b.rating] = Number(b.cnt); });

    const [photos] = await db.query(
      'SELECT id, imageUrl, sortOrder FROM product_photos WHERE productId = ? ORDER BY sortOrder ASC, id ASC',
      [req.params.id]
    );

    let finalPhotos = [];
    const localImage = findLocalImage(buildSlug(products[0].name));
    if (localImage) {
      finalPhotos.push({ id: 'local', imageUrl: localImage, sortOrder: 0 });
    }
    photos.forEach(p => {
      if (!p.imageUrl.startsWith('http')) {
        finalPhotos.push({ ...p, imageUrl: absoluteImageUrl(p.imageUrl) });
      }
    });

    res.json({
      success: true,
      data: { product: products[0], reviews, ratingBreakdown: ratingMap, photos: finalPhotos },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/products/:id/stock ─────────────────────────────────────────────
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number' || !Number.isInteger(delta))
      return res.status(400).json({ success: false, message: 'delta must be an integer' });

    const [[product]] = await db.query('SELECT id, stockQty FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const newStock = Math.max(0, product.stockQty + delta);
    await db.query('UPDATE products SET stockQty = ? WHERE id = ?', [newStock, req.params.id]);

    const sockets = require('../sockets');
    sockets.emitStockUpdate([{ productId: product.id, newStock }]);

    res.json({ success: true, data: { id: product.id, stockQty: newStock } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: `File too large. Max ${MAX_SIZE_MB}MB per image.` });
    if (err.code === 'LIMIT_FILE_COUNT')
      return res.status(400).json({ success: false, message: 'Maximum 10 images allowed.' });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
});

module.exports = router;
