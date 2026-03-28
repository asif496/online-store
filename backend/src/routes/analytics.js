// backend/src/routes/analytics.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ totalOrders }]]   = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]]  = await db.query('SELECT COALESCE(SUM(grandTotal),0) AS totalRevenue FROM orders');
    const [[{ lowStockCount }]] = await db.query('SELECT COUNT(*) AS lowStockCount FROM products WHERE stockQty <= 5');
    const [[{ totalReviews }]]  = await db.query('SELECT COUNT(*) AS totalReviews FROM reviews');
    const [[{ avgRating }]]     = await db.query('SELECT COALESCE(AVG(rating),0) AS avgRating FROM reviews');

    const [ratingDist] = await db.query(
      'SELECT rating, COUNT(*) AS cnt FROM reviews GROUP BY rating ORDER BY rating'
    );
    const ratingDistMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDist.forEach(r => { ratingDistMap[r.rating] = Number(r.cnt); });

    const [topRated] = await db.query(`
      SELECT p.name, ROUND(AVG(r.rating),2) AS avgRating, COUNT(r.id) AS reviewCount
      FROM products p
      JOIN reviews r ON r.productId = p.id
      GROUP BY p.id
      ORDER BY avgRating DESC, reviewCount DESC
      LIMIT 8
    `);

    const [categoryRevenue] = await db.query(`
      SELECT p.category, COALESCE(SUM(oi.lineTotal),0) AS revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.productId = p.id
      GROUP BY p.category
      ORDER BY revenue DESC
    `);

    const [lowStockItems] = await db.query(
      'SELECT id, name, category, stockQty FROM products WHERE stockQty <= 10 ORDER BY stockQty ASC'
    );

    const [revenueTrend] = await db.query(`
      SELECT
        DATE(createdAt)               AS day,
        COALESCE(SUM(grandTotal), 0)  AS revenue,
        COUNT(*)                      AS ordersCount
      FROM orders
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
    `);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalOrders,
          totalRevenue:  +totalRevenue,
          lowStockCount,
          totalReviews,
          avgRating: +Number(avgRating).toFixed(2),
        },
        charts: { ratingDistribution: ratingDistMap, topRated, categoryRevenue, revenueTrend },
        lowStockItems,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
