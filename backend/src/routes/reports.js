'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const PDFDocument = require('pdfkit');

const GOLD   = '#C8952A';
const DARK   = '#1a1a2e';
const GRAY   = '#6b7280';
const LIGHT  = '#f9f7f4';
const RED    = '#ef4444';
const AMBER  = '#d97706';
const GREEN  = '#16a34a';

function fmt(n) {
  return 'BDT ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function stars(avg) {
  const full  = Math.round(Number(avg));
  const empty = 5 - full;
  return '*'.repeat(full) + '-'.repeat(empty) + '  ' + Number(avg).toFixed(1);
}

function makeDoc(res, filename) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

function drawHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 80).fill(DARK);
  doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold')
     .text('Online Store', 50, 18);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
     .text('Inventory Database  Bangladesh', 50, 44);
  doc.fillColor('white').fontSize(15).font('Helvetica-Bold')
     .text(title, 0, 28, { align: 'right', width: doc.page.width - 50 });
  doc.fillColor(DARK);
  doc.y = 100;
}

function drawSummaryCard(doc, x, y, w, h, label, value, color) {
  doc.rect(x, y, w, h).fillAndStroke('#ffffff', '#e5e7eb');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text(label.toUpperCase(), x + 10, y + 10, { width: w - 20 });
  doc.fillColor(color || DARK).fontSize(18).font('Helvetica-Bold')
     .text(String(value), x + 10, y + 24, { width: w - 20 });
  doc.fillColor(DARK);
}

function tableHeader(doc, cols, y) {
  doc.rect(50, y, doc.page.width - 100, 20).fill('#f3f4f6');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold');
  cols.forEach(col => {
    doc.text(col.label.toUpperCase(), col.x, y + 6, { width: col.w, align: col.align || 'left' });
  });
  doc.fillColor(DARK);
  return y + 20;
}

function tableRow(doc, cols, data, y, shade) {
  if (shade) doc.rect(50, y, doc.page.width - 100, 18).fill('#fafafa');
  doc.fillColor(DARK).fontSize(8).font('Helvetica');
  cols.forEach((col, i) => {
    const val   = data[i] !== undefined ? String(data[i]) : '';
    const color = col.color ? col.color(data[i]) : DARK;
    doc.fillColor(color).text(val, col.x, y + 5, { width: col.w, align: col.align || 'left' });
  });
  doc.moveTo(50, y + 18).lineTo(doc.page.width - 50, y + 18).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.fillColor(DARK);
  return y + 18;
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
    drawHeader(doc, 'PRODUCT REPORT');

    const date = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text('Generated: ' + date, 50, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    const totalProducts = products.length;
    const totalReviews  = products.reduce((s, p) => s + Number(p.reviewCount), 0);
    const avgPrice      = products.reduce((s, p) => s + Number(p.price), 0) / totalProducts;
    const bestRated     = [...products].sort((a,b) => Number(b.avgRating)-Number(a.avgRating))[0]?.name || 'N/A';

    const cardY = doc.y;
    const cw = 115, ch = 52, gap = 10;
    drawSummaryCard(doc, 50,        cardY, cw, ch, 'Total Products',  totalProducts, GOLD);
    drawSummaryCard(doc, 50+cw+gap, cardY, cw, ch, 'Avg Price',  'BDT '+fmtNum(avgPrice), DARK);
    drawSummaryCard(doc, 50+2*(cw+gap), cardY, cw, ch, 'Total Reviews', totalReviews, DARK);
    drawSummaryCard(doc, 50+3*(cw+gap), cardY, cw+5, ch, 'Best Rated', bestRated.slice(0,14), GOLD);
    doc.y = cardY + ch + 16;

    const cols = [
      { label: '#',        x: 50,  w: 18,  align: 'right' },
      { label: 'Product',  x: 72,  w: 138 },
      { label: 'Category', x: 214, w: 70 },
      { label: 'Price',    x: 288, w: 70, align: 'right' },
      { label: 'Tax',      x: 362, w: 30, align: 'right' },
      { label: 'Rating',   x: 396, w: 68 },
      { label: 'Reviews',  x: 468, w: 32, align: 'right' },
      { label: 'Stock',    x: 504, w: 40, align: 'right',
        color: v => Number(v) === 0 ? RED : Number(v) <= 5 ? AMBER : GREEN },
    ];

    let y = tableHeader(doc, cols, doc.y);

    products.forEach((p, i) => {
      if (y > 760) { doc.addPage(); drawHeader(doc, 'PRODUCT REPORT'); y = 110; y = tableHeader(doc, cols, y); }
      y = tableRow(doc, cols, [
        i + 1,
        p.name.slice(0, 22),
        p.category,
        'BDT ' + fmtNum(p.price),
        (Number(p.taxRate)*100).toFixed(0) + '%',
        stars(p.avgRating),
        p.reviewCount,
        p.stockQty,
      ], y, i % 2 === 1);
    });

    doc.moveDown(1.5);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text('Online Store Inventory Database  ·  Product Report  ·  ' + date,
             50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
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
    drawHeader(doc, 'STOCK REPORT');

    const date        = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
    const totalUnits  = products.reduce((s,p) => s + p.stockQty, 0);
    const lowStock    = products.filter(p => p.stockQty <= 5 && p.stockQty > 0).length;
    const outOfStock  = products.filter(p => p.stockQty === 0).length;

    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text('Generated: ' + date, 50, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    const cardY = doc.y;
    const cw = 115, ch = 52, gap = 10;
    drawSummaryCard(doc, 50,            cardY, cw, ch, 'Total Products', products.length, GOLD);
    drawSummaryCard(doc, 50+cw+gap,     cardY, cw, ch, 'Total Units',    totalUnits, DARK);
    drawSummaryCard(doc, 50+2*(cw+gap), cardY, cw, ch, 'Low Stock (<=5)',lowStock, AMBER);
    drawSummaryCard(doc, 50+3*(cw+gap), cardY, cw+5, ch, 'Out of Stock', outOfStock, outOfStock > 0 ? RED : GREEN);
    doc.y = cardY + ch + 16;

    const cols = [
      { label: '#',        x: 50,  w: 20,  align: 'right' },
      { label: 'Product',  x: 74,  w: 185 },
      { label: 'Category', x: 263, w: 85 },
      { label: 'Stock Qty',x: 352, w: 60,  align: 'right',
        color: v => Number(v) === 0 ? RED : Number(v) <= 5 ? AMBER : DARK },
      { label: 'Status',   x: 416, w: 80,
        color: v => v === 'OUT OF STOCK' ? RED : v === 'LOW' ? AMBER : GREEN },
    ];

    let y = tableHeader(doc, cols, doc.y);

    products.forEach((p, i) => {
      if (y > 760) { doc.addPage(); drawHeader(doc, 'STOCK REPORT'); y = 110; y = tableHeader(doc, cols, y); }
      const status = p.stockQty === 0 ? 'OUT OF STOCK' : p.stockQty <= 5 ? 'LOW' : 'OK';
      y = tableRow(doc, cols, [i+1, p.name.slice(0,28), p.category, p.stockQty, status], y, i % 2 === 1);
    });

    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text('Online Store Inventory Database  ·  Stock Report  ·  Low-stock threshold: 5 units',
             50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
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

    const doc  = makeDoc(res, `invoice-${order.id}.pdf`);
    const date = new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold').text('Online Store', 50, 18);
    doc.fillColor('#9ca3af').fontSize(9).font('Helvetica').text('Inventory Database  Bangladesh', 50, 44);
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
       .text('INVOICE', 0, 22, { align: 'right', width: doc.page.width - 50 });
    doc.fillColor(GOLD).fontSize(13).font('Helvetica-Bold')
       .text('#' + order.id, 0, 50, { align: 'right', width: doc.page.width - 50 });

    doc.y = 105;

    doc.rect(50, doc.y, 220, 60).fillAndStroke(LIGHT, '#e5e7eb');
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('BILLED TO', 62, doc.y + 8);
    doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold').text(order.customerName, 62, doc.y + 20);
    if (order.note) {
      doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('Note: ' + order.note, 62, doc.y + 36);
    }
    const topY = doc.y;

    doc.rect(280, topY, 265, 60).fillAndStroke(LIGHT, '#e5e7eb');
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('ORDER INFO', 292, topY + 8);
    doc.fillColor(DARK).fontSize(9).font('Helvetica')
       .text('Invoice #' + order.id, 292, topY + 20)
       .text(date, 292, topY + 34);

    doc.rect(430, topY, 115, 60).fillAndStroke('#d1fae5', '#6ee7b7');
    doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold').text('PAID', 430, topY + 22, { width: 115, align: 'center' });

    doc.y = topY + 75;

    const cols = [
      { label: '#',         x: 50,  w: 18,  align: 'right' },
      { label: 'Product',   x: 72,  w: 150 },
      { label: 'Category',  x: 226, w: 70 },
      { label: 'Unit Price',x: 300, w: 65,  align: 'right' },
      { label: 'Qty',       x: 369, w: 25,  align: 'right' },
      { label: 'Tax',       x: 398, w: 70,  align: 'right' },
      { label: 'Total',     x: 472, w: 75,  align: 'right' },
    ];

    let y = tableHeader(doc, cols, doc.y);

    items.forEach((item, i) => {
      if (y > 700) { doc.addPage(); y = 50; y = tableHeader(doc, cols, y); }
      y = tableRow(doc, cols, [
        i + 1,
        item.productName.slice(0, 22),
        item.category,
        'BDT ' + fmtNum(item.unitPrice),
        item.qty,
        (Number(item.unitTaxRate)*100).toFixed(0) + '%  (BDT ' + fmtNum(item.lineTax) + ')',
        'BDT ' + fmtNum(item.lineTotal),
      ], y, i % 2 === 1);
    });

    doc.moveDown(1);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    const totals = [
      ['Subtotal',   fmtNum(order.subtotal)],
      ['Tax Total',  fmtNum(order.taxTotal)],
    ];
    totals.forEach(([label, val]) => {
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
         .text(label, 350, doc.y, { width: 100 });
      doc.fillColor(DARK).text('BDT ' + val, 454, doc.y - 11, { width: 90, align: 'right' });
      doc.moveDown(0.4);
    });

    doc.rect(350, doc.y, 195, 24).fill(DARK);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text('Grand Total', 358, doc.y + 6, { width: 90 });
    doc.fillColor(GOLD).text('BDT ' + fmtNum(order.grandTotal), 358, doc.y - 12, { width: 179, align: 'right' });

    doc.moveDown(3);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text('Thank you for your purchase!  ·  Online Store Inventory Database  ·  Assignment Project',
             50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;