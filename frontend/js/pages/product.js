// public/js/pages/product.js
'use strict';

const CATEGORY_EMOJIS = {
  'Apparel':'👘','Handicrafts':'🧵','Grocery':'🥗','Sweets':'🍮',
  'Seafood':'🐟','Spices':'🌶️','Snacks':'🥙','Home':'🏺',
};

const params    = new URLSearchParams(location.search);
const productId = Number(params.get('id'));
let starWidget;
let productData;
let currentPhotoIndex = 0;
let photosArr = [];

// ── Escape helper ────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Gallery helpers ──────────────────────────────────────────────────────────
function buildGallery(photos, emoji) {
  const hasPhotos = photos && photos.length > 0;

  // Main image area
  const mainArea = hasPhotos
    ? `<div class="gallery-main-wrap" id="gallery-main-wrap">
         <img id="gallery-main-img" class="gallery-main-img"
              src="${escHtml(photos[0].imageUrl)}" alt="Product photo">
         ${photos.length > 1
           ? `<span class="gallery-count-badge">
                <i class="bi bi-images me-1"></i>${photos.length} photos
              </span>`
           : ''}
       </div>`
    : `<div class="gallery-main-wrap">
         <div class="gallery-main-placeholder">${emoji}</div>
       </div>`;

  // Thumbnail strip (only when 2+ photos)
  const thumbStrip = hasPhotos && photos.length > 1
    ? `<div class="gallery-thumb-strip" id="gallery-thumbs">
         ${photos.map((ph, i) => `
           <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" data-src="${escHtml(ph.imageUrl)}">
             <img src="${escHtml(ph.imageUrl)}" alt="Thumbnail ${i+1}" loading="lazy">
           </div>`).join('')}
       </div>`
    : '';

  return mainArea + thumbStrip;
}

function attachGalleryEvents() {
  const thumbs = document.querySelectorAll('.gallery-thumb');
  if (!thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = Number(thumb.dataset.idx);
      const src = thumb.dataset.src;
      currentPhotoIndex = idx;

      const mainImg = document.getElementById('gallery-main-img');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.style.opacity = '1';
        }, 150);
      }

      // Update active thumb
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

// ── Load product ─────────────────────────────────────────────────────────────
async function loadProduct() {
  if (!productId) {
    document.getElementById('product-detail-container').innerHTML = `
      <div class="col-12 empty-state">
        <div class="icon">❌</div>
        <p>Product not found. <a href="index.html" class="text-gold">Go back to store</a></p>
      </div>`;
    return;
  }

  document.getElementById('product-id-holder').dataset.id = productId;

  const data = await api.get(`/api/products/${productId}`);
  if (!data.success) { ui.toast('Failed to load product', 'error'); return; }

  const { product, reviews, ratingBreakdown, photos } = data.data;
  productData = product;
  photosArr   = photos || [];
  const emoji = CATEGORY_EMOJIS[product.category] || '🛍️';

  document.title = `${product.name} — Online Store`;
  document.getElementById('breadcrumb-name').textContent = product.name;

  const outOfStock = product.stockQty <= 0;
  const galleryHtml = buildGallery(photosArr, emoji);

  document.getElementById('product-detail-container').innerHTML = `
    <div class="col-md-5">
      ${galleryHtml}
    </div>
    <div class="col-md-7">
      <h1 style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:600;line-height:1.2">
        ${escHtml(product.name)}
      </h1>
      <div class="d-flex align-items-center gap-2 my-2">
        ${ui.stars(product.avgRating, product.reviewCount)}
        ${ui.catBadge(product.category)}
      </div>
      <p style="color:var(--text-muted);font-size:.92rem;line-height:1.75;margin-top:.5rem">
        ${escHtml(product.description || 'No description available.')}
      </p>

      <div class="row g-3 my-3">
        <div class="col-6">
          <div style="background:var(--bg3);border-radius:10px;padding:14px">
            <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Price</div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--gold)">
              ৳${Number(product.price).toLocaleString()}
            </div>
          </div>
        </div>
        <div class="col-6">
          <div style="background:var(--bg3);border-radius:10px;padding:14px">
            <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Tax</div>
            <div style="font-size:1.6rem;font-weight:700;color:var(--text)">
              ${(product.taxRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        <div class="col-6">
          <div style="background:var(--bg3);border-radius:10px;padding:14px">
            <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Stock</div>
            <div id="detail-stock-badge">${ui.stockBadge(product.stockQty)}</div>
          </div>
        </div>
        <div class="col-6">
          <div style="background:var(--bg3);border-radius:10px;padding:14px">
            <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Incl. Tax</div>
            <div style="font-size:1.1rem;font-weight:600;color:var(--text)">
              ৳${(product.price * (1 + product.taxRate)).toLocaleString('en-BD',
                   {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-gold px-4" id="add-to-cart-btn"
          ${outOfStock ? 'disabled' : ''} style="font-size:.95rem">
          ${outOfStock
            ? '<i class="bi bi-x-circle me-2"></i>Out of Stock'
            : '<i class="bi bi-cart-plus me-2"></i>Add to Cart'}
        </button>
        <a href="cart.html" class="btn btn-outline-gold px-4">
          <i class="bi bi-cart3 me-2"></i>View Cart
        </a>
      </div>
    </div>`;

  // Attach gallery thumbnail click events
  attachGalleryEvents();

  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    cart.addItem({ ...product, _emoji: emoji });
    ui.toast('Added to cart! 🛒', 'success');
  });

  renderRatingBreakdown(ratingBreakdown, Number(product.reviewCount));
  renderReviews(reviews);
}

// ── Rating breakdown ─────────────────────────────────────────────────────────
function renderRatingBreakdown(breakdown, total) {
  const container = document.getElementById('rating-breakdown');
  if (!total) {
    container.innerHTML = `<div class="empty-state" style="padding:1.5rem 0">
      <div class="icon">⭐</div><p>No reviews yet—be the first!</p></div>`;
    return;
  }
  const rows = [5,4,3,2,1].map(star => {
    const cnt = breakdown[star] || 0;
    const pct = Math.round((cnt / total) * 100);
    return `<div class="rating-bar-row">
      <span style="font-size:.8rem;min-width:14px">${star}</span>
      <span class="stars" style="font-size:.8rem">★</span>
      <div class="rating-bar"><div class="rating-bar-fill" style="width:${pct}%"></div></div>
      <span style="font-size:.75rem;min-width:28px;text-align:right;color:var(--text-muted)">${cnt}</span>
    </div>`;
  }).join('');

  const avg = Object.entries(breakdown)
    .reduce((s, [r, c]) => s + Number(r) * Number(c), 0) / total;

  container.innerHTML = `
    <div class="text-center mb-3">
      <div style="font-size:3rem;font-weight:700;color:var(--gold);line-height:1">${avg.toFixed(1)}</div>
      <div>${ui.stars(avg)}</div>
      <div style="font-size:.8rem;color:var(--text-muted);margin-top:4px">
        ${total} review${total !== 1 ? 's' : ''}
      </div>
    </div>${rows}`;
}

// ── Reviews list ─────────────────────────────────────────────────────────────
function renderReviews(reviews) {
  const container = document.getElementById('review-list');
  if (!reviews.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="icon">💬</div><p>No reviews yet—be the first!</p></div>`;
    return;
  }
  container.innerHTML = reviews.map(r => {
    const initials = r.customerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const date = new Date(r.createdAt).toLocaleDateString('en-BD',
      { year:'numeric', month:'short', day:'numeric' });
    return `
      <div class="review-card fade-in-up">
        <div class="d-flex gap-3">
          <div class="reviewer-avatar">${initials}</div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <strong style="font-size:.9rem">${escHtml(r.customerName)}</strong>
              <span style="font-size:.75rem;color:var(--text-soft)">${date}</span>
            </div>
            <div class="my-1">${ui.stars(r.rating)}</div>
            <p style="font-size:.85rem;color:var(--text-muted);margin:0">${escHtml(r.comment || '')}</p>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Write review toggle ──────────────────────────────────────────────────────
document.getElementById('write-review-btn').addEventListener('click', () => {
  const form = document.getElementById('review-form-card');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    starWidget = ui.starsInput(document.getElementById('star-input'), val => {
      document.getElementById('rating-value').value = val;
    });
  }
});
document.getElementById('cancel-review-btn').addEventListener('click', () => {
  document.getElementById('review-form-card').style.display = 'none';
});
document.getElementById('submit-review-btn').addEventListener('click', async () => {
  const rating       = Number(document.getElementById('rating-value').value);
  const customerName = document.getElementById('reviewer-name').value.trim();
  const comment      = document.getElementById('review-comment').value.trim();

  if (!rating)       { ui.toast('Please select a rating ⭐', 'warning'); return; }
  if (!customerName) { ui.toast('Please enter your name', 'warning'); return; }

  const btn = document.getElementById('submit-review-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';

  const res = await api.post('/api/reviews', { productId, customerName, rating, comment });
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-send me-1"></i>Submit Review';

  if (!res.success) { ui.toast(res.message || 'Failed to submit review', 'error'); return; }

  ui.toast('Review submitted! Thank you 🌟', 'success');
  document.getElementById('review-form-card').style.display = 'none';
  document.getElementById('reviewer-name').value  = '';
  document.getElementById('review-comment').value = '';
  document.getElementById('rating-value').value   = 0;
  loadProduct();
});

// Init
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
loadProduct();
