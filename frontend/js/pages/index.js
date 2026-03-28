// public/js/pages/index.js
'use strict';

const CATEGORY_EMOJIS = {
  'Apparel':'👘','Handicrafts':'🧵','Grocery':'🥗','Sweets':'🍮',
  'Seafood':'🐟','Spices':'🌶️','Snacks':'🥙','Home':'🏺',
};

/* ── State ──────────────────────────────────────────────── */
let allProducts    = [];
let activeCategory = 'all';
let searchQuery    = '';
let sortOrder      = 'default';
let priceMin       = null;
let priceMax       = null;

/* ── Wishlist helpers (localStorage) ────────────────────── */
const WL_KEY = 'online-store-wishlist';
const wishlist = {
  get()          { try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch { return []; } },
  set(arr)       { localStorage.setItem(WL_KEY, JSON.stringify(arr)); },
  has(id)        { return this.get().includes(Number(id)); },
  toggle(id) {
    id = Number(id);
    const cur = this.get();
    const idx = cur.indexOf(id);
    idx === -1 ? cur.push(id) : cur.splice(idx, 1);
    this.set(cur);
    return idx === -1; // true = was added
  },
};

/* ── Search highlight ────────────────────────────────────── */
function highlight(text, query) {
  if (!query) return escHtml(text);
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escHtml(text).replace(
    new RegExp(safe.replace(/&amp;/g, '&'), 'gi'),
    m => `<mark class="search-match">${m}</mark>`
  );
}

/* ── Sort helper ─────────────────────────────────────────── */
function applySort(arr) {
  const sorted = [...arr];
  switch (sortOrder) {
    case 'price-asc':    return sorted.sort((a,b) => a.price - b.price);
    case 'price-desc':   return sorted.sort((a,b) => b.price - a.price);
    case 'rating-desc':  return sorted.sort((a,b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    case 'name-asc':     return sorted.sort((a,b) => a.name.localeCompare(b.name));
    case 'name-desc':    return sorted.sort((a,b) => b.name.localeCompare(a.name));
    default:             return sorted;
  }
}

/* ── Load products ───────────────────────────────────────── */
async function loadProducts() {
  const grid = document.getElementById('product-grid');
  ui.skeletonGrid(grid, 8);

  const data = await api.get('/api/products');
  if (!data.success) { ui.toast('Failed to load products', 'error'); return; }

  allProducts = data.data.map(p => ({
    ...p,
    _emoji: CATEGORY_EMOJIS[p.category] || '🛍️',
  }));

  // Build category filters
  const cats = [...new Set(allProducts.map(p => p.category))].sort();
  const filterContainer = document.getElementById('category-filters');
  filterContainer.innerHTML = `<button class="filter-chip active" data-cat="all">All (${allProducts.length})</button>`;
  cats.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat).length;
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.cat = cat;
    btn.textContent = `${CATEGORY_EMOJIS[cat] || ''} ${cat} (${count})`;
    filterContainer.appendChild(btn);
  });

  filterContainer.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    filterContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderProducts();
  });

  renderProducts();
}

/* ── Render ─────────────────────────────────────────────── */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const q = searchQuery.toLowerCase().trim();

  let filtered = allProducts.filter(p => {
    const matchCat  = activeCategory === 'all' || p.category === activeCategory;
    const matchText = !q || p.name.toLowerCase().includes(q)
      || p.description?.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q);
    const matchMin  = priceMin === null || Number(p.price) >= priceMin;
    const matchMax  = priceMax === null || Number(p.price) <= priceMax;
    return matchCat && matchText && matchMin && matchMax;
  });

  filtered = applySort(filtered);

  document.getElementById('result-count').textContent =
    `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state">
      <div class="icon">🔍</div>
      <p>No products found. Try adjusting your search, filters, or price range.</p>
    </div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => productCard(p, q)).join('');
  grid.querySelectorAll('.product-card').forEach(card => card.classList.add('fade-in-up'));

  // Add to cart
  grid.querySelectorAll('[data-add-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const pid = Number(btn.dataset.addId);
      const product = allProducts.find(p => p.id === pid);
      if (!product || product.stockQty <= 0) return;
      cart.addItem(product);
      ui.toast(`Added "${product.name}" to cart 🛒`, 'success');
    });
  });

  // View button
  grid.querySelectorAll('[data-view-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      window.location.href = `product.html?id=${btn.dataset.viewId}`;
    });
  });

  // Wishlist toggle
  grid.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.wishId;
      const added = wishlist.toggle(id);
      btn.textContent = added ? '❤️' : '🤍';
      btn.classList.toggle('wishlisted', added);
      btn.classList.remove('pop');
      void btn.offsetWidth; // reflow
      btn.classList.add('pop');
      ui.toast(added ? 'Added to wishlist ❤️' : 'Removed from wishlist', added ? 'success' : 'info');
    });
  });

  // Card click
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.productId;
      if (id) window.location.href = `product.html?id=${id}`;
    });
  });
}

/* ── Product card ────────────────────────────────────────── */
function productCard(p, q = '') {
  const outOfStock   = p.stockQty <= 0;
  const isWishlisted = wishlist.has(p.id);

  // New/Hot badges: products with id <= 5 are "hot" for demo (seed data); newest products are "new"
  let cornerBadge = '';
  if (p.reviewCount === 0 && p.stockQty > 0) cornerBadge = '<span class="badge-corner badge-new">New</span>';
  else if (Number(p.avgRating) >= 4.5 && p.reviewCount >= 3) cornerBadge = '<span class="badge-corner badge-hot">🔥 Hot</span>';

  // Image area
  const imageArea = p.primaryImage
    ? `<div class="card-photo-wrap" style="position:relative">
         ${cornerBadge}
         <button class="wish-btn${isWishlisted?' wishlisted':''}" data-wish-id="${p.id}">${isWishlisted?'❤️':'🤍'}</button>
         <img class="card-photo-img" src="${p.primaryImage}" alt="${escHtml(p.name)}"
              loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-emoji-img\\'>${p._emoji}</div>'">
         <span class="card-cat-badge">${ui.catBadge(p.category)}</span>
       </div>`
    : `<div class="card-emoji-img" style="position:relative">
         ${cornerBadge}
         <button class="wish-btn${isWishlisted?' wishlisted':''}" data-wish-id="${p.id}">${isWishlisted?'❤️':'🤍'}</button>
         ${p._emoji}
         <span style="position:absolute;bottom:8px;right:8px">${ui.catBadge(p.category)}</span>
       </div>`;

  const nameHtml = highlight(p.name, q);

  return `
  <div class="col-sm-6 col-md-4 col-lg-3">
    <div class="product-card h-100" data-product-id="${p.id}">
      ${imageArea}
      <div class="card-body d-flex flex-column">
        <div class="product-name mb-1" title="${escHtml(p.name)}">${nameHtml}</div>
        <div class="mb-1">${ui.stars(p.avgRating, p.reviewCount)}</div>
        <div class="d-flex align-items-center justify-content-between mt-1 mb-2">
          <div class="product-price"><span class="taka">৳</span>${Number(p.price).toLocaleString()}</div>
          <span class="stock-badge-el">${ui.stockBadge(p.stockQty)}</span>
        </div>
        <div class="d-flex gap-2 mt-auto">
          <button class="btn btn-outline-gold btn-sm flex-grow-1" data-view-id="${p.id}">
            <i class="bi bi-eye me-1"></i>View
          </button>
          <button class="btn btn-gold btn-sm flex-grow-1" data-add-id="${p.id}"
            ${outOfStock ? 'disabled' : ''}>
            ${outOfStock
              ? 'Out of Stock'
              : '<i class="bi bi-cart-plus me-1"></i>Add'}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Event Wiring ────────────────────────────────────────── */
// Search
document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value;
  renderProducts();
});

// Sort
const sortEl = document.getElementById('sort-select');
if (sortEl) sortEl.addEventListener('change', e => { sortOrder = e.target.value; renderProducts(); });

// Price range (debounced 400ms)
let priceTimer;
const priceDebouncedRender = () => { clearTimeout(priceTimer); priceTimer = setTimeout(renderProducts, 400); };
const priceMinEl = document.getElementById('price-min');
const priceMaxEl = document.getElementById('price-max');
if (priceMinEl) priceMinEl.addEventListener('input', e => { priceMin = e.target.value ? Number(e.target.value) : null; priceDebouncedRender(); });
if (priceMaxEl) priceMaxEl.addEventListener('input', e => { priceMax = e.target.value ? Number(e.target.value) : null; priceDebouncedRender(); });

// Real-time stock updates
realtime.on('stockUpdate', updates => {
  updates.forEach(u => {
    const product = allProducts.find(p => p.id === u.productId);
    if (product) product.stockQty = u.newStock;
  });
  renderProducts();
  const ind = document.getElementById('realtime-indicator');
  if (ind) ind.style.display = 'inline';
});

/* ── Init ────────────────────────────────────────────────── */
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
loadProducts();
