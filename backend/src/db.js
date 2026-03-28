// backend/src/db.js
'use strict';
const mysql = require('mysql2/promise');
require('dotenv').config();

// Cloud MySQL providers (Railway, PlanetScale, etc.) require SSL.
// Set DB_SSL=true in your production environment variables.
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
