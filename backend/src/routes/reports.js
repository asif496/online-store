// backend/src/routes/reports.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const PDFDocument = require('pdfkit');

function fmt(n) {
  return Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeDoc(res, filename) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

// GET /api/reports/products.pdf
router.get('/products.pdf', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, COALESCE(AVG(r.rating),0) AS avgRating, COUNT(r.id) AS reviewCount
      FROM products p LEFT JOIN reviews r ON r.productId = p.id
      GROUP BY p.id ORDER BY p.category, p.name
    `);

    const doc = makeDoc(res, 'product-report.pdf');

    doc.fontSize(20).font('Helvetica-Bold').text('Product Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Products: ${products.length}   |   Total Reviews: ${products.reduce((s,p) => s + Number(p.reviewCount), 0)}`, { align: 'center' });
    doc.moveDown();

    const colX = [40, 200, 290, 360, 420, 480];
    const headers = ['Name', 'Category', 'Price', 'Tax', 'Rating', 'Stock'];

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 100, continued: i < headers.length - 1 }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    products.forEach(p => {
      const y = doc.y;
      if (y > 750) { doc.addPage(); }
      doc.text(p.name.slice(0, 22), colX[0], doc.y, { width: 155 });
      const rowY = doc.y - 11;
      doc.text(p.category,                         colX[1], rowY, { width: 85 });
      doc.text('৳ ' + fmt(p.price),               colX[2], rowY, { width: 65 });
      doc.text((Number(p.taxRate)*100).toFixed(0)+'%', colX[3], rowY, { width: 55 });
      doc.text(Number(p.avgRating).toFixed(1),     colX[4], rowY, { width: 55 });
      doc.text(String(p.stockQty),                 colX[5], rowY, { width: 55 });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/stock.pdf
router.get('/stock.pdf', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY stockQty ASC');
    const doc = makeDoc(res, 'stock-report.pdf');

    doc.fontSize(20).font('Helvetica-Bold').text('Stock Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    const totalUnits = products.reduce((s,p) => s + p.stockQty, 0);
    const lowStock   = products.filter(p => p.stockQty <= 5 && p.stockQty > 0).length;
    const outOfStock = products.filter(p => p.stockQty === 0).length;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Products: ${products.length}   |   Total Units: ${totalUnits}   |   Low Stock: ${lowStock}   |   Out of Stock: ${outOfStock}`, { align: 'center' });
    doc.moveDown();

    const colX = [40, 220, 340, 440];
    const headers = ['Name', 'Category', 'Stock Qty', 'Status'];

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 150, continued: i < headers.length - 1 }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    products.forEach(p => {
      if (doc.y > 750) { doc.addPage(); }
      const status = p.stockQty === 0 ? 'OUT OF STOCK' : p.stockQty <= 5 ? 'LOW' : 'OK';
      doc.text(p.name.slice(0, 26), colX[0], doc.y, { width: 175 });
      const rowY = doc.y - 11;
      doc.text(p.category,        colX[1], rowY, { width: 115 });
      doc.text(String(p.stockQty),colX[2], rowY, { width: 95 });
      doc.text(status,            colX[3], rowY, { width: 95 });
      doc.moveDown(0.3);
    });

    doc.end();
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

    const doc = makeDoc(res, `invoice-${order.id}.pdf`);

    doc.fontSize(20).font('Helvetica-Bold').text('Invoice', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Order #${order.id}   |   ${new Date(order.createdAt).toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text(`Customer: ${order.customerName}`);
    if (order.note) doc.fontSize(10).font('Helvetica').text(`Note: ${order.note}`);
    doc.moveDown();

    const colX = [40, 200, 290, 350, 420, 490];
    const headers = ['Product', 'Category', 'Price', 'Qty', 'Tax', 'Total'];

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 100, continued: i < headers.length - 1 }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    items.forEach(item => {
      if (doc.y > 750) { doc.addPage(); }
      doc.text(item.productName.slice(0, 22), colX[0], doc.y, { width: 155 });
      const rowY = doc.y - 11;
      doc.text(item.category,              colX[1], rowY, { width: 85 });
      doc.text('৳'+fmt(item.unitPrice),    colX[2], rowY, { width: 55 });
      doc.text(String(item.qty),           colX[3], rowY, { width: 65 });
      doc.text('৳'+fmt(item.lineTax),      colX[4], rowY, { width: 65 });
      doc.text('৳'+fmt(item.lineTotal),    colX[5], rowY, { width: 65 });
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Subtotal: ৳${fmt(order.subtotal)}`, { align: 'right' });
    doc.text(`Tax: ৳${fmt(order.taxTotal)}`,       { align: 'right' });
    doc.text(`Grand Total: ৳${fmt(order.grandTotal)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;