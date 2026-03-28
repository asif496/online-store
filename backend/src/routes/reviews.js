// backend/src/routes/reviews.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { productId, customerName, rating, comment } = req.body;

    if (!productId || !customerName || !rating)
      return res.status(400).json({ success: false, message: 'productId, customerName, and rating are required.' });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    const [[product]] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const [result] = await db.query(
      'INSERT INTO reviews (productId, customerName, rating, comment, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [productId, customerName.trim(), Number(rating), comment?.trim() || '']
    );

    const [[newReview]] = await db.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
