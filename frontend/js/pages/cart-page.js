// public/js/pages/cart-page.js
'use strict';

const CATEGORY_EMOJIS = {
  'Apparel':'👘','Handicrafts':'🧵','Grocery':'🥗','Sweets':'🍮',
  'Seafood':'🐟','Spices':'🌶️','Snacks':'🥙','Home':'🏺',
};

function renderCart() {
  const items = cart.getItems();
  const listEl = document.getElementById('cart-items-list');
  const countHeader = document.getElementById('cart-count-header');
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearBtn    = document.getElementById('clear-cart-btn');
  const total = cart.totals();

  countHeader.textContent = items.length ? `(${cart.count()} items)` : '';

  // Totals
  document.getElementById('summary-subtotal').textContent = ui.bdt(total.subtotal);
  document.getElementById('summary-tax').textContent      = ui.bdt(total.taxTotal);
  document.getElementById('summary-total').textContent    = ui.bdt(total.grandTotal);
  document.getElementById('modal-subtotal').textContent   = ui.bdt(total.subtotal);
  document.getElementById('modal-tax').textContent        = ui.bdt(total.taxTotal);
  document.getElementById('modal-total').textContent      = ui.bdt(total.grandTotal);

  checkoutBtn.disabled = items.length === 0;
  clearBtn.style.display = items.length ? 'block' : 'none';

  if (!items.length) {
    listEl.innerHTML = `<div class="empty-state">
      <div class="icon">🛒</div>
      <p>Your cart is empty.</p>
      <a href="index.html" class="btn btn-gold btn-sm mt-2"><i class="bi bi-shop me-1"></i>Browse Products</a>
    </div>`;
    return;
  }

  listEl.innerHTML = items.map(item => {
    const emoji = item.categoryEmoji || CATEGORY_EMOJIS[item.category] || '🛍️';
    const lineTotal = (item.price * item.qty * (1 + item.taxRate)).toFixed(2);
    return `
      <div class="cart-item">
        <div class="cart-emoji">${emoji}</div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <a href="product.html?id=${item.productId}" class="text-decoration-none">
              <strong style="font-size:.92rem;color:var(--text)">${item.name}</strong>
            </a>
            <button class="btn p-0 ms-2" style="color:var(--text-muted);font-size:1rem" data-remove="${item.productId}" title="Remove">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">
            ৳${Number(item.price).toLocaleString()} × ${item.qty} + ${(item.taxRate*100).toFixed(0)}% tax
          </div>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <div class="d-flex align-items-center gap-2">
              <button class="qty-btn" data-minus="${item.productId}">−</button>
              <span class="qty-display">${item.qty}</span>
              <button class="qty-btn" data-plus="${item.productId}" ${item.qty >= item.stockQty ? 'disabled style="opacity:.4"' : ''}>+</button>
              ${item.stockQty <= 5 ? `<span class="stock-badge stock-low ms-1">Only ${item.stockQty} left</span>` : ''}
            </div>
            <strong class="text-gold">৳${Number(lineTotal).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
          </div>
        </div>
      </div>`;
  }).join('');

  // Qty buttons
  listEl.querySelectorAll('[data-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = Number(btn.dataset.minus);
      const item = cart.getItems().find(i => i.productId === pid);
      if (item) cart.updateQty(pid, item.qty - 1);
      renderCart();
    });
  });
  listEl.querySelectorAll('[data-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = Number(btn.dataset.plus);
      const item = cart.getItems().find(i => i.productId === pid);
      if (item && item.qty < item.stockQty) cart.updateQty(pid, item.qty + 1);
      renderCart();
    });
  });
  listEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.removeItem(Number(btn.dataset.remove));
      ui.toast('Item removed from cart', 'info');
      renderCart();
    });
  });
}

// Checkout flow
document.getElementById('checkout-btn').addEventListener('click', () => {
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
});

document.getElementById('clear-cart-btn').addEventListener('click', () => {
  cart.clear();
  ui.toast('Cart cleared', 'info');
  renderCart();
});

document.getElementById('confirm-order-btn').addEventListener('click', async () => {
  const customerName = document.getElementById('customer-name').value.trim();
  const note         = document.getElementById('order-note').value.trim();

  if (!customerName) { ui.toast('Please enter your name', 'warning'); return; }

  const btn = document.getElementById('confirm-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing Order…';

  const items = cart.getItems().map(i => ({ productId: i.productId, qty: i.qty }));
  const res = await api.post('/api/checkout', { customerName, note, items });

  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Place Order';

  if (!res.success) {
    ui.toast(res.message || 'Checkout failed. Please try again.', 'error');
    return;
  }

  // Close checkout modal
  bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();

  // Success
  const total = ui.bdt(res.data.grandTotal);
  document.getElementById('success-message').innerHTML =
    `Order <strong>#${res.data.orderId}</strong> placed for <strong>${customerName}</strong>.<br>Total: <strong class="text-gold">${total}</strong>`;

  cart.clear();
  new bootstrap.Modal(document.getElementById('successModal')).show();
  renderCart();
  ui.toast(`🎉 Order #${res.data.orderId} placed successfully!`, 'success');
});

// Real-time stock sync
realtime.on('stockUpdate', () => { renderCart(); });

// Init
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
renderCart();
