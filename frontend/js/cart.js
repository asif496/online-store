// public/js/cart.js
'use strict';

const cart = {
  _key: 'store_cart',

  getItems() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  saveItems(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    this._updateBadge();
  },

  addItem(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stockQty);
    } else {
      items.push({
        productId:   product.id,
        name:        product.name,
        price:       product.price,
        taxRate:     product.taxRate,
        stockQty:    product.stockQty,
        qty:         Math.min(qty, product.stockQty),
        categoryEmoji: product._emoji || '🛍️',
      });
    }
    this.saveItems(items);
    const badge = document.getElementById('cart-badge');
    if (badge) badge.classList.add('bump');
    setTimeout(() => badge && badge.classList.remove('bump'), 300);
  },

  removeItem(productId) {
    this.saveItems(this.getItems().filter(i => i.productId !== productId));
  },

  updateQty(productId, qty) {
    const items = this.getItems();
    const item = items.find(i => i.productId === productId);
    if (item) {
      item.qty = qty;
      if (qty <= 0) return this.removeItem(productId);
    }
    this.saveItems(items);
  },

  clear() { this.saveItems([]); },

  count() { return this.getItems().reduce((s, i) => s + i.qty, 0); },

  totals() {
    return this.getItems().reduce((acc, item) => {
      const sub = item.price * item.qty;
      const tax = sub * item.taxRate;
      acc.subtotal   += sub;
      acc.taxTotal   += tax;
      acc.grandTotal += sub + tax;
      return acc;
    }, { subtotal: 0, taxTotal: 0, grandTotal: 0 });
  },

  // Update stock info from real-time event
  syncStock(updates) {
    const items = this.getItems();
    let changed = false;
    updates.forEach(u => {
      const item = items.find(i => i.productId === u.productId);
      if (item) { item.stockQty = u.newStock; changed = true; }
    });
    if (changed) this.saveItems(items);
  },

  _updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = this.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  },

  init() { this._updateBadge(); }
};
