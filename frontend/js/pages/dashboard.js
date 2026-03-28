// public/js/pages/dashboard.js
'use strict';

let ratingChart, topRatedChart, categoryChart, trendChart;

function isDark() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

function chartColors() {
  return {
    text:   isDark() ? '#f0ece4' : '#1a1a2e',
    grid:   isDark() ? 'rgba(255,255,255,.08)' : 'rgba(26,26,46,.07)',
    gold:   '#c8952a',
  };
}

const PALETTE = ['#c8952a','#e8b84b','#9d6e1a','#2d6a9f','#4a9e6b','#9d4a6b','#6b4a9d','#4a6b9d'];

async function loadAnalytics() {
  const data = await api.get('/api/analytics');
  if (!data.success) { ui.toast('Failed to load analytics', 'error'); return; }

  const { kpis, charts, lowStockItems } = data.data;

  // 7-day Trend Chart
  const rc = chartColors();
  const trendCtx = document.getElementById('trendChart')?.getContext('2d');
  if (trendCtx) {
    // Build full 7-day labels regardless of DB data
    const today = new Date();
    const dayLabels = [], dayRevenue = [], dayOrders = [];
    const trendMap = {};
    (charts.revenueTrend || []).forEach(r => {
      trendMap[r.day.toString().slice(0, 10)] = { revenue: +r.revenue, orders: +r.ordersCount };
    });
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayLabels.push(d.toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' }));
      dayRevenue.push(trendMap[key]?.revenue || 0);
      dayOrders.push(trendMap[key]?.orders || 0);
    }
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Revenue (৳)',
          data: dayRevenue,
          borderColor: '#c8952a',
          backgroundColor: isDark() ? 'rgba(200,149,42,0.12)' : 'rgba(200,149,42,0.10)',
          borderWidth: 2.5,
          pointBackgroundColor: '#c8952a',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        }, {
          label: 'Orders',
          data: dayOrders,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [5, 4],
          fill: false,
          tension: 0.4,
          yAxisID: 'y1',
        }],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: rc.text, font: { size: 11 }, boxWidth: 12, padding: 12 } },
          tooltip: {
            callbacks: {
              label: ctx => ctx.datasetIndex === 0
                ? ` ৳${Number(ctx.raw).toLocaleString()}`
                : ` ${ctx.raw} orders`,
            },
          },
        },
        scales: {
          x: { grid: { color: rc.grid }, ticks: { color: rc.text, font: { size: 10 } } },
          y:  { position: 'left',  grid: { color: rc.grid }, ticks: { color: '#c8952a', font: { size: 10 }, callback: v => '৳' + v.toLocaleString() }, beginAtZero: true },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#3b82f6', font: { size: 10 } }, beginAtZero: true },
        },
      },
    });
  }

  // KPIs
  document.getElementById('kpi-products').textContent   = kpis.totalProducts;
  document.getElementById('kpi-orders').textContent     = kpis.totalOrders;
  document.getElementById('kpi-revenue').textContent    = kpis.totalRevenue >= 1000
    ? (kpis.totalRevenue / 1000).toFixed(1) + 'k'
    : Number(kpis.totalRevenue).toFixed(0);
  document.getElementById('kpi-reviews').textContent    = kpis.totalReviews;
  document.getElementById('kpi-avg-rating').textContent = kpis.avgRating;
  document.getElementById('kpi-low-stock').textContent  = kpis.lowStockCount;

  // Rating Distribution Chart
  const ratingCtx = document.getElementById('ratingChart').getContext('2d');
  if (ratingChart) ratingChart.destroy();
  ratingChart = new Chart(ratingCtx, {
    type: 'bar',
    data: {
      labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
      datasets: [{
        label: 'Reviews',
        data: [1,2,3,4,5].map(r => charts.ratingDistribution[r] || 0),
        backgroundColor: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} reviews` } },
      },
      scales: {
        x: { grid: { color: rc.grid }, ticks: { color: rc.text, font: { size: 11 } } },
        y: { grid: { color: rc.grid }, ticks: { color: rc.text, font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
      },
    },
  });

  // Top Rated Chart
  const trCtx = document.getElementById('topRatedChart').getContext('2d');
  if (topRatedChart) topRatedChart.destroy();
  topRatedChart = new Chart(trCtx, {
    type: 'bar',
    data: {
      labels: charts.topRated.map(p => p.name.length > 20 ? p.name.slice(0,20)+'…' : p.name),
      datasets: [{
        label: 'Avg Rating',
        data: charts.topRated.map(p => Number(p.avgRating)),
        backgroundColor: PALETTE,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: ctx => {
            const p = charts.topRated[ctx.dataIndex];
            return ` ${ctx.raw} ★ (${p.reviewCount} reviews)`;
          }
        }},
      },
      scales: {
        x: { min: 0, max: 5, grid: { color: rc.grid }, ticks: { color: rc.text, font: { size: 11 } } },
        y: { grid: { color: rc.grid }, ticks: { color: rc.text, font: { size: 10 } } },
      },
    },
  });

  // Category Revenue Doughnut
  const cvCtx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();
  const revCats = charts.categoryRevenue.filter(c => c.revenue > 0);
  categoryChart = new Chart(cvCtx, {
    type: 'doughnut',
    data: {
      labels: revCats.map(c => c.category),
      datasets: [{
        data: revCats.map(c => Number(c.revenue).toFixed(2)),
        backgroundColor: PALETTE,
        borderWidth: 2,
        borderColor: isDark() ? '#1e1e30' : '#fff',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: rc.text, font: { size: 11 }, boxWidth: 12, padding: 10 },
        },
        tooltip: { callbacks: {
          label: ctx => ` ৳${Number(ctx.raw).toLocaleString()} (${ctx.label})`
        }},
      },
    },
  });

  // Low stock table
  const tbody = document.getElementById('low-stock-table');
  if (!lowStockItems.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">All products are well-stocked! ✅</td></tr>`;
    return;
  }
  tbody.innerHTML = lowStockItems.map(p => {
    const isOut = p.stockQty === 0;
    const isLow = p.stockQty <= 5;
    const badge = isOut
      ? `<span class="stock-badge stock-out">Out of Stock</span>`
      : isLow
        ? `<span class="stock-badge stock-low">Low</span>`
        : `<span class="stock-badge stock-ok">Watch</span>`;
    return `
      <tr>
        <td><a href="product.html?id=${p.id}" class="text-decoration-none text-gold">${p.name}</a></td>
        <td>${ui.catBadge(p.category)}</td>
        <td style="text-align:right;font-weight:${isLow?'700':'400'};color:${isOut?'#ef4444':isLow?'#d97706':'inherit'}">${p.stockQty}</td>
        <td style="text-align:center">${badge}</td>
      </tr>`;
  }).join('');
}

document.getElementById('refresh-btn').addEventListener('click', () => {
  loadAnalytics();
  ui.toast('Dashboard refreshed', 'info');
});

// Auto-refresh on new orders
realtime.on('newOrder', () => { loadAnalytics(); });
realtime.on('stockUpdate', () => { loadAnalytics(); });

// Init
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
loadAnalytics();
