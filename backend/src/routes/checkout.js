// backend/src/routes/checkout.js
'use strict';
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const sockets  = require('../sockets');

// POST /api/cart/validate
router.post('/validate', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ success: false, message: 'items array required.' });

    const errors = [];
    for (const item of items) {
      const [[p]] = await db.query('SELECT id, name, stockQty FROM products WHERE id = ?', [item.productId]);
      if (!p) { errors.push(`Product #${item.productId} not found.`); continue; }
      if (p.stockQty < item.qty) errors.push(`"${p.name}" only has ${p.stockQty} in stock.`);
    }
    if (errors.length) return res.status(422).json({ success: false, errors });
    res.json({ success: true, message: 'Stock available.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/checkout
router.post('/', async (req, res) => {
  const { customerName, note, items } = req.body;

  if (!customerName?.trim())
    return res.status(400).json({ success: false, message: 'customerName is required.' });
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ success: false, message: 'Cart is empty.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let subtotal  = 0;
    let taxTotal  = 0;
    const lineItems = [];

    for (const item of items) {
      const [[p]] = await conn.query(
        'SELECT id, name, price, taxRate, stockQty FROM products WHERE id = ? FOR UPDATE',
        [item.productId]
      );
      if (!p) throw { status: 404, message: `Product #${item.productId} not found.` };
      if (p.stockQty < item.qty)
        throw { status: 422, message: `Insufficient stock for "${p.name}". Available: ${p.stockQty}.` };

      const lineSubtotal = +(p.price * item.qty).toFixed(2);
      const lineTax      = +(lineSubtotal * p.taxRate).toFixed(2);
      const lineTotal    = +(lineSubtotal + lineTax).toFixed(2);

      subtotal += lineSubtotal;
      taxTotal += lineTax;
      lineItems.push({
        productId: p.id, name: p.name, qty: item.qty,
        unitPrice: p.price, unitTaxRate: p.taxRate,
        lineSubtotal, lineTax, lineTotal,
      });
    }

    subtotal   = +subtotal.toFixed(2);
    taxTotal   = +taxTotal.toFixed(2);
    const grandTotal = +(subtotal + taxTotal).toFixed(2);

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customerName, note, createdAt, subtotal, taxTotal, grandTotal) VALUES (?, ?, NOW(), ?, ?, ?)',
      [customerName.trim(), note?.trim() || null, subtotal, taxTotal, grandTotal]
    );
    const orderId = orderResult.insertId;

    const stockUpdates = [];
    for (const li of lineItems) {
      await conn.query(
        `INSERT INTO order_items (orderId, productId, qty, unitPrice, unitTaxRate, lineSubtotal, lineTax, lineTotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, li.productId, li.qty, li.unitPrice, li.unitTaxRate, li.lineSubtotal, li.lineTax, li.lineTotal]
      );
      await conn.query('UPDATE products SET stockQty = stockQty - ? WHERE id = ?', [li.qty, li.productId]);
      const [[updated]] = await conn.query('SELECT stockQty FROM products WHERE id = ?', [li.productId]);
      stockUpdates.push({ productId: li.productId, newStock: updated.stockQty });
    }

    await conn.commit();

    sockets.emitStockUpdate(stockUpdates);
    sockets.emitNewOrder({ orderId, customerName, grandTotal, createdAt: new Date().toISOString() });

    res.status(201).json({
      success: true,
      data: { orderId, customerName, subtotal, taxTotal, grandTotal, stockUpdates },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Checkout failed.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
