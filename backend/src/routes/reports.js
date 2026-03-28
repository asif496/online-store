// backend/src/routes/reports.js
'use strict';
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { renderPdf, loadTemplate } = require('../pdf/renderPdf');

function fmt(n) {
  return Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function badgeClass(cat) {
  const map = {
    apparel: 'apparel', grocery: 'grocery', handicrafts: 'handicrafts',
    seafood: 'seafood', sweets: 'sweets', spices: 'spices',
    snacks: 'snacks', home: 'home',
  };
  return 'badge-' + (map[cat?.toLowerCase()] || 'default');
}
function stars(avg) {
  const full = Math.round(avg);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// GET /api/reports/products.pdf
router.get('/products.pdf', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, COALESCE(AVG(r.rating),0) AS avgRating, COUNT(r.id) AS reviewCount
      FROM products p LEFT JOIN reviews r ON r.productId = p.id
      GROUP BY p.id ORDER BY p.category, p.name
    `);

    const totalProducts = products.length;
    const avgPrice      = (products.reduce((s, p) => s + Number(p.price), 0) / totalProducts).toFixed(2);
    const totalReviews  = products.reduce((s, p) => s + Number(p.reviewCount), 0);
    const bestRated     = [...products].sort((a, b) => Number(b.avgRating) - Number(a.avgRating))[0]?.name || 'N/A';
    const date          = new Date().toLocaleString('en-BD', { dateStyle: 'long', timeStyle: 'short' });

    const rows = products.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge ${badgeClass(p.category)}">${p.category}</span></td>
        <td style="text-align:right">৳ ${fmt(p.price)}</td>
        <td style="text-align:right">${(Number(p.taxRate) * 100).toFixed(0)}%</td>
        <td style="text-align:right"><span class="star">${stars(Number(p.avgRating))}</span> ${Number(p.avgRating).toFixed(1)}</td>
        <td style="text-align:right">${p.reviewCount}</td>
        <td style="text-align:right">${p.stockQty}</td>
      </tr>
    `).join('');

    let html = loadTemplate('productReport.html')
      .replace('{{totalProducts}}', totalProducts)
      .replace('{{avgPrice}}',      fmt(avgPrice))
      .replace('{{bestRated}}',     bestRated)
      .replace('{{totalReviews}}',  totalReviews)
      .replace('{{date}}',          date)
      .replace('{{rows}}',          rows);

    const pdf = await renderPdf(html);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="product-report.pdf"',
    });
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/stock.pdf
router.get('/stock.pdf', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY stockQty ASC');
    const totalProducts = products.length;
    const totalUnits    = products.reduce((s, p) => s + p.stockQty, 0);
    const lowStockCount = products.filter(p => p.stockQty <= 5 && p.stockQty > 0).length;
    const outOfStock    = products.filter(p => p.stockQty === 0).length;
    const date          = new Date().toLocaleString('en-BD', { dateStyle: 'long', timeStyle: 'short' });

    const rows = products.map((p, i) => {
      const isLow = p.stockQty <= 5;
      const isOut = p.stockQty === 0;
      const qtyClass = isOut ? 'qty-critical' : isLow ? 'qty-warn' : 'qty-ok';
      const badge    = isOut
        ? '<span class="badge-low">OUT</span>'
        : isLow
          ? '<span class="badge-low">LOW</span>'
          : '<span class="badge-ok">OK</span>';
      return `
        <tr class="${isLow ? 'low-stock' : ''}">
          <td>${i + 1}</td>
          <td><strong>${p.name}</strong></td>
          <td>${p.category}</td>
          <td style="text-align:right" class="${qtyClass}">${p.stockQty}</td>
          <td style="text-align:center">${badge}</td>
        </tr>
      `;
    }).join('');

    let html = loadTemplate('stockReport.html')
      .replace('{{totalProducts}}', totalProducts)
      .replace('{{totalUnits}}',    totalUnits)
      .replace('{{lowStockCount}}', lowStockCount)
      .replace('{{outOfStock}}',    outOfStock)
      .replace('{{date}}',          date)
      .replace('{{rows}}',          rows);

    const pdf = await renderPdf(html);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="stock-report.pdf"',
    });
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/invoice/:orderId
router.get('/invoice/:orderId', async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.orderId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query(`
      SELECT oi.*, p.name AS productName, p.category
      FROM order_items oi JOIN products p ON p.id = oi.productId
      WHERE oi.orderId = ?
    `, [req.params.orderId]);

    const date    = new Date(order.createdAt).toLocaleString('en-BD', { dateStyle: 'long', timeStyle: 'short' });
    const noteRow = order.note ? `<p style="font-size:11px;color:#6b7280;margin-top:3px">Note: ${order.note}</p>` : '';

    const rows = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${item.productName}</strong></td>
        <td>${item.category}</td>
        <td class="num">৳ ${fmt(item.unitPrice)}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${(Number(item.unitTaxRate) * 100).toFixed(0)}%  (৳${fmt(item.lineTax)})</td>
        <td class="num"><strong>৳ ${fmt(item.lineTotal)}</strong></td>
      </tr>
    `).join('');

    let html = loadTemplate('invoice.html')
      .replace(/\{\{orderId\}\}/g,       order.id)
      .replace(/\{\{customerName\}\}/g,  order.customerName)
      .replace(/\{\{date\}\}/g,          date)
      .replace('{{noteRow}}',            noteRow)
      .replace('{{rows}}',               rows)
      .replace('{{subtotal}}',           fmt(order.subtotal))
      .replace('{{taxTotal}}',           fmt(order.taxTotal))
      .replace('{{grandTotal}}',         fmt(order.grandTotal));

    const pdf = await renderPdf(html);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`,
    });
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
