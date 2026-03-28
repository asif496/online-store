// backend/src/routes/orders.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/orders/recent
router.get('/recent', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, COUNT(oi.id) AS itemCount
      FROM   orders o
      LEFT JOIN order_items oi ON oi.orderId = o.id
      GROUP BY o.id
      ORDER BY o.createdAt DESC
      LIMIT 30
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/reset-demo  (must come before /:id)
router.delete('/reset-demo', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM order_items');
    await conn.query('DELETE FROM orders');
    const seedStock = [4, 12, 9, 25, 40, 14, 6, 30, 20, 16, 22, 10, 60, 3, 18];
    for (let i = 0; i < seedStock.length; i++) {
      await conn.query('UPDATE products SET stockQty = ? WHERE id = ?', [seedStock[i], i + 1]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Demo data reset.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query(`
      SELECT oi.*, p.name AS productName, p.category
      FROM order_items oi
      JOIN products p ON p.id = oi.productId
      WHERE oi.orderId = ?
    `, [req.params.id]);

    res.json({ success: true, data: { order, items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
