// public/js/ui.js
'use strict';

/* ── Dark mode ──────────────────────────────────────── */
const ui = {
  initDarkMode() {
    const html = document.documentElement;
    const btn  = document.getElementById('dark-toggle');
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-bs-theme', saved);
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';

    if (btn) {
      btn.addEventListener('click', () => {
        const cur = html.getAttribute('data-bs-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', next);
        localStorage.setItem('theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
      });
    }
  },

  /* ── Toasts ─────────────────────────────────────── */
  toast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }
    const typeIcon = { success: '✅', error: '❌', info: '🔔', warning: '⚠️' };
    const typeClass = { success: 'toast-success', error: 'toast-error', info: 'toast-info', warning: 'toast-info' };
    const id = 'toast-' + Date.now();
    const html = `
      <div id="${id}" class="toast ${typeClass[type] || ''} align-items-center border-0 bg-surface text-start"
           role="alert" aria-live="assertive" data-bs-delay="3500">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2" style="font-size:.88rem">
            <span>${typeIcon[type] || '🔔'}</span>
            <span>${msg}</span>
          </div>
          <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const bsToast = new bootstrap.Toast(el);
    bsToast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  },

  /* ── Stars ──────────────────────────────────────── */
  stars(avg, reviewCount) {
    const filled = Math.round(Number(avg));
    const empty  = 5 - filled;
    const starsHtml = '★'.repeat(filled) + '<span class="stars-empty">' + '★'.repeat(empty) + '</span>';
    const ratingText = reviewCount !== undefined
      ? `<span class="rating-text">${Number(avg).toFixed(1)} (${reviewCount})</span>`
      : `<span class="rating-text">${Number(avg).toFixed(1)}</span>`;
    return `<span class="stars">${starsHtml}</span>${ratingText}`;
  },

  starsInput(container, onSelect) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn p-0 me-1 fs-4';
      btn.textContent = '☆';
      btn.style.color = '#f59e0b';
      btn.dataset.val = i;
      container.appendChild(btn);
    }
    let selected = 0;
    const btns = container.querySelectorAll('button');
    btns.forEach(b => {
      b.addEventListener('mouseenter', () => highlight(b.dataset.val));
      b.addEventListener('mouseleave', () => highlight(selected));
      b.addEventListener('click', () => {
        selected = Number(b.dataset.val);
        highlight(selected);
        if (onSelect) onSelect(selected);
      });
    });
    function highlight(n) {
      btns.forEach(b => { b.textContent = Number(b.dataset.val) <= n ? '★' : '☆'; });
    }
    return { getValue: () => selected };
  },

  /* ── Stock badge ────────────────────────────────── */
  stockBadge(qty) {
    if (qty <= 0)  return `<span class="stock-badge stock-out">Out of Stock</span>`;
    if (qty <= 5)  return `<span class="stock-badge stock-low">Low Stock (${qty})</span>`;
    return `<span class="stock-badge stock-ok">In Stock (${qty})</span>`;
  },

  /* ── Category badge ─────────────────────────────── */
  catBadge(cat) {
    const slug = cat?.toLowerCase().replace(/[^a-z]/g,'') || 'default';
    return `<span class="cat-badge cat-${slug}">${cat}</span>`;
  },

  /* ── Format BDT ─────────────────────────────────── */
  bdt(n) {
    return '৳ ' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  /* ── Skeletons ──────────────────────────────────── */
  skeletonGrid(container, count = 8) {
    container.innerHTML = Array(count).fill(0).map(() => `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="skeleton-card">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton skeleton-line medium mt-3"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line thin"></div>
          <div class="skeleton skeleton-line thin short"></div>
        </div>
      </div>`).join('');
  },

  /* ── Active nav link ────────────────────────────── */
  setActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar .nav-link').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === page || (page === 'index.html' && href === '/') || href === '/' + page) {
        a.classList.add('active');
      }
    });
  },

  /* ── Back to Top ────────────────────────────────── */
  initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('visible', window.scrollY > 320);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  },

  /* ── Scroll Reveal ──────────────────────────────── */
  initScrollReveal(selector = '.reveal') {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  },

  /* ── Footer Year ─────────────────────────────────── */
  setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  },
};
