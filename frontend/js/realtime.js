// frontend/js/realtime.js
'use strict';

const realtime = {
  socket: null,
  _handlers: {},

  init() {
    if (typeof io === 'undefined') return;

    // Connect explicitly to the backend server (cross-origin safe)
    this.socket = io(API_BASE, { transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => {
      console.log('[Socket] connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] connection error:', err.message);
    });

    this.socket.on('stockUpdate', (updates) => {
      console.log('[Socket] stockUpdate:', updates);

      if (typeof cart !== 'undefined') cart.syncStock(updates);

      updates.forEach(u => {
        const badge = document.querySelector(`[data-product-id="${u.productId}"] .stock-badge-el`);
        if (badge) {
          badge.outerHTML = typeof ui !== 'undefined'
            ? ui.stockBadge(u.newStock)
            : u.newStock;
          const card = document.querySelector(`[data-product-id="${u.productId}"]`);
          if (card) {
            card.classList.add('stock-flash');
            setTimeout(() => card.classList.remove('stock-flash'), 1000);
          }
        }

        const addBtn = document.querySelector(`[data-add-id="${u.productId}"]`);
        if (addBtn) {
          if (u.newStock <= 0) {
            addBtn.disabled    = true;
            addBtn.textContent = 'Out of Stock';
          } else {
            addBtn.disabled    = false;
            addBtn.textContent = 'Add to Cart';
          }
        }

        const stockEl = document.getElementById('detail-stock-badge');
        if (stockEl) {
          const pid = Number(document.getElementById('product-id-holder')?.dataset.id);
          if (pid === u.productId) {
            stockEl.outerHTML = typeof ui !== 'undefined'
              ? `<span id="detail-stock-badge">${ui.stockBadge(u.newStock)}</span>`
              : u.newStock;
          }
        }
      });

      if (this._handlers.stockUpdate) this._handlers.stockUpdate(updates);

      if (typeof ui !== 'undefined') {
        ui.toast('📦 Stock updated in real-time!', 'info');
      }
    });

    this.socket.on('newOrder', (order) => {
      console.log('[Socket] newOrder:', order);
      if (this._handlers.newOrder) this._handlers.newOrder(order);
    });
  },

  on(event, handler) {
    this._handlers[event] = handler;
  },
};
