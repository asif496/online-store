// public/js/pages/add-product.js
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let selectedFiles = []; // Array of { file: File, objectUrl: string }
const MAX_FILES   = 10;
const MAX_MB      = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// ── DOM refs ──────────────────────────────────────────────────────────────────
const photoInput      = document.getElementById('photo-input');
const uploadZone      = document.getElementById('upload-zone');
const previewGrid     = document.getElementById('preview-grid');
const photoCountHint  = document.getElementById('photo-count-hint');
const formErrors      = document.getElementById('form-errors');
const submitBtn       = document.getElementById('submit-btn');
const taxInput        = document.getElementById('f-taxrate');
const priceInput      = document.getElementById('f-price');
const taxPctDisplay   = document.getElementById('tax-pct-display');
const priceInclTax    = document.getElementById('price-incl-tax');
const catInput        = document.getElementById('f-category');
const successBanner   = document.getElementById('success-banner');
const formCard        = document.getElementById('product-form-card');

// ── Category pills ────────────────────────────────────────────────────────────
document.getElementById('cat-pills').addEventListener('click', e => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  catInput.value = pill.dataset.cat;
});

document.getElementById('custom-cat-btn').addEventListener('click', () => {
  const val = document.getElementById('custom-cat-input').value.trim();
  if (!val) return;
  // Deselect pills, set value
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  catInput.value = val;
  document.getElementById('custom-cat-input').value = '';
  ui.toast(`Category set to "${val}"`, 'info');
});

// ── Live price preview ────────────────────────────────────────────────────────
function updatePricePreview() {
  const price   = parseFloat(priceInput.value) || 0;
  const taxRate = parseFloat(taxInput.value)   || 0;
  const pct     = Math.round(taxRate * 100);
  taxPctDisplay.textContent = `${pct}%`;
  if (price > 0) {
    priceInclTax.textContent = `৳${(price * (1 + taxRate)).toLocaleString('en-BD',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    priceInclTax.textContent = '—';
  }
}
priceInput.addEventListener('input', updatePricePreview);
taxInput.addEventListener('input', updatePricePreview);

// ── File handling ─────────────────────────────────────────────────────────────
function addFiles(fileList) {
  const errors = [];
  Array.from(fileList).forEach(file => {
    if (selectedFiles.length >= MAX_FILES) {
      errors.push(`Max ${MAX_FILES} images allowed.`);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`"${file.name}" is not a valid image type (jpg/png/webp).`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      errors.push(`"${file.name}" exceeds ${MAX_MB} MB.`);
      return;
    }
    // Dedup by name+size
    const exists = selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size);
    if (exists) return;

    selectedFiles.push({ file, objectUrl: URL.createObjectURL(file) });
  });

  if (errors.length) ui.toast(errors[0], 'error');
  renderPreview();
}

function renderPreview() {
  previewGrid.innerHTML = '';

  if (!selectedFiles.length) {
    photoCountHint.textContent = '';
    return;
  }

  photoCountHint.textContent = `${selectedFiles.length} / ${MAX_FILES} image${selectedFiles.length !== 1 ? 's' : ''} selected. First image = storefront thumbnail.`;

  selectedFiles.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'preview-item';

    const img = document.createElement('img');
    img.src = item.objectUrl;
    img.alt = item.file.name;

    const label = document.createElement('div');
    label.className = 'img-label';
    label.title = item.file.name;
    label.textContent = item.file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'preview-remove';
    removeBtn.title = 'Remove';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      URL.revokeObjectURL(item.objectUrl);
      selectedFiles.splice(idx, 1);
      renderPreview();
    });

    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(removeBtn);
    previewGrid.appendChild(div);
  });
}

// File input change
photoInput.addEventListener('change', () => {
  addFiles(photoInput.files);
  photoInput.value = ''; // Reset so same file can be re-added after removal
});

// Drag & drop
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  const errors = [];
  const name     = document.getElementById('f-name').value.trim();
  const category = catInput.value.trim();
  const price    = parseFloat(document.getElementById('f-price').value);
  const taxRate  = parseFloat(document.getElementById('f-taxrate').value);
  const stock    = parseInt(document.getElementById('f-stock').value, 10);

  if (!name)                       errors.push('Product name is required.');
  if (!category)                   errors.push('Please select or enter a category.');
  if (isNaN(price) || price <= 0)  errors.push('Price must be a positive number.');
  if (isNaN(taxRate) || taxRate < 0 || taxRate > 1)
                                   errors.push('Tax rate must be between 0 and 1 (e.g. 0.05 = 5%).');
  if (isNaN(stock) || stock < 0)   errors.push('Stock quantity must be 0 or more.');

  return errors;
}

function showErrors(errors) {
  if (!errors.length) { formErrors.classList.add('d-none'); return; }
  formErrors.classList.remove('d-none');
  formErrors.innerHTML = errors.map(e => `<div><i class="bi bi-exclamation-circle me-1"></i>${e}</div>`).join('');
}

// ── Submit ────────────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
  const errors = validate();
  if (errors.length) { showErrors(errors); return; }
  showErrors([]);

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading…';

  // Show upload progress bar
  const progressWrap = document.getElementById('upload-progress');
  const progressBar  = document.getElementById('upload-progress-bar');
  progressWrap.style.display = 'block';

  // Animate progress bar (fake progress while XHR runs)
  let prog = 0;
  const progInterval = setInterval(() => {
    prog = Math.min(prog + Math.random() * 12, 85);
    progressBar.style.width = prog + '%';
  }, 200);

  try {
    // Build FormData
    const fd = new FormData();
    fd.append('name',        document.getElementById('f-name').value.trim());
    fd.append('description', document.getElementById('f-desc').value.trim());
    fd.append('category',    catInput.value.trim());
    fd.append('price',       document.getElementById('f-price').value);
    fd.append('taxRate',     document.getElementById('f-taxrate').value);
    fd.append('stockQty',    document.getElementById('f-stock').value);
    selectedFiles.forEach(item => fd.append('images', item.file));

    const resp = await fetch(API_BASE + '/api/products', { method: 'POST', body: fd });
    const data = await resp.json();

    clearInterval(progInterval);
    progressBar.style.width = '100%';
    setTimeout(() => { progressWrap.style.display = 'none'; progressBar.style.width = '0%'; }, 600);

    if (!data.success) {
      const msgs = data.errors || [data.message || 'Failed to add product.'];
      showErrors(msgs);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Product';
      return;
    }

    // ── Success ──
    const product = data.data.product;
    const photoCount = data.data.photos?.length || 0;

    // Revoke object URLs
    selectedFiles.forEach(f => URL.revokeObjectURL(f.objectUrl));

    // Show success banner
    document.getElementById('success-text').innerHTML =
      `<strong>${product.name}</strong> has been added to the store with
       <strong>${photoCount}</strong> photo${photoCount !== 1 ? 's' : ''}.
       <br>Product ID: #${product.id}`;
    document.getElementById('view-product-link').href = `product.html?id=${product.id}`;
    successBanner.style.display = 'block';

    // Scroll to banner
    successBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Reset form
    resetForm();
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Product';
    ui.toast(`✅ "${product.name}" added to store!`, 'success');

  } catch (err) {
    clearInterval(progInterval);
    progressWrap.style.display = 'none';
    showErrors([err.message || 'Network error. Please try again.']);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Product';
  }
});

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetForm() {
  document.getElementById('f-name').value    = '';
  document.getElementById('f-desc').value    = '';
  document.getElementById('f-price').value   = '';
  document.getElementById('f-taxrate').value = '0.05';
  document.getElementById('f-stock').value   = '0';
  catInput.value = '';
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  selectedFiles.forEach(f => URL.revokeObjectURL(f.objectUrl));
  selectedFiles = [];
  renderPreview();
  formErrors.classList.add('d-none');
  updatePricePreview();
}

document.getElementById('reset-form-btn').addEventListener('click', () => {
  if (confirm('Clear the form?')) resetForm();
});

document.getElementById('add-another-btn').addEventListener('click', () => {
  successBanner.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Init ──────────────────────────────────────────────────────────────────────
ui.initDarkMode();
ui.initBackToTop();
ui.setFooterYear();
cart.init();
realtime.init();
updatePricePreview();
