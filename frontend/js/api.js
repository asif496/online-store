// frontend/js/api.js
'use strict';

/**
 * API_BASE — points to the backend server.
 *
 * LOCAL DEVELOPMENT:  'http://localhost:3000'
 * AFTER DEPLOYMENT:   Replace with your Render backend URL, e.g.:
 *                     'https://online-store-backend.onrender.com'
 *
 * ⚠️  Change this ONE line before deploying the frontend to Vercel.
 */
const API_BASE = 'https://online-store-mvnu.onrender.com/';  // ← replace this

const api = {
  async get(path) {
    const r = await fetch(API_BASE + path);
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(API_BASE + path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return r.json();
  },

  async del(path) {
    const r = await fetch(API_BASE + path, { method: 'DELETE' });
    return r.json();
  },
};
