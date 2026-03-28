// public/js/pages/reports.js
'use strict';

async function loadOrders() {
  const tbody    = document.getElementById('orders-table');
  const noOrders = document.getElementById('no-orders');

  const data = await api.get('/api/orders/recent');
  if (!data.success) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Failed to load orders.</td></tr>`;
    return;
  }

  const orders = data.data;
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No orders yet.</td></tr>`;
    noOrders.style.display = 'block';
    return;
  }

  noOrders.style.display = 'none';
  tbody.innerHTML = orders.map(o => {
    const date = new Date(o.createdAt).toLocaleDateString('en-BD', {
      year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
    return `
      <tr>
        <td><strong class="text-gold">#${o.id}</strong></td>
        <td>${o.customerName}</td>
        <td><span style="background:var(--bg3);border-radius:99px;padding:1px 8px;font-size:.78rem">${o.itemCount} item${o.itemCount!==1?'s':''}</span></td>
        <td style="text-align:right">৳${Number(o.subtotal).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="text-align:right">৳${Number(o.taxTotal).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="text-align:right"><strong>৳${Number(o.grandTotal).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
        <td style="font-size:.8rem;color:var(--text-muted)">${date}</td>
        <td style="text-align:center">
          <a href="${API_BASE}/api/reports/invoice/${o.id}" target="_blank" class="btn btn-outline-secondary btn-sm" title="Download Invoice PDF">
            <i class="bi bi-download me-1"></i>PDF
          </a>
        </td>
      </tr>`;
  }).join('');
}

// Reset demo
document.getElementById('reset-demo-btn').addEventListener('click', async () => {
  if (!confirm('Reset all orders and restore demo stock levels?')) return;
  const btn = document.getElementById('reset-demo-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Resetting…';

  const res = await api.del('/api/orders/reset-demo');
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-1"></i>Reset Demo Data';

  if (res.success) {
    ui.toast('✅ Demo data reset! Stock restored.', 'success');
    loadOrders();
  } else {
    ui.toast('Reset failed: ' + (res.message || 'Unknown error'), 'error');
  }
});

// Real-time: refresh orders list on new order
realtime.on('newOrder', () => {
  loadOrders();
  ui.toast('🧾 New order received!', 'success');
});

// Init
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
loadOrders();
