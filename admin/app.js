// ═══════════════════════════════════════════
//  MINIMAL LUXE — Admin Panel JS v2
// ═══════════════════════════════════════════

const API = '/api';
const token = localStorage.getItem('ml_token');
const user = JSON.parse(localStorage.getItem('ml_user') || '{}');

if (!token) window.location.href = '/admin/index.html';

document.getElementById('userInfo').textContent = user.name + ' · ' + user.email;

// ★ FIXED CATEGORY LIST — used everywhere
const CATEGORIES = ['New Arrival', "Summer'26", 'Occasions', 'Everyday', 'Bottoms'];

// ── API HELPER ────────────────────────────
async function api(path, opts = {}) {
  const headers = opts.headers || {};
  if (!opts._noAuth) headers.Authorization = 'Bearer ' + token;
  if (!opts._form) headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(API + path, { ...opts, headers });
    if (res.status === 401) { localStorage.clear(); window.location.href = '/admin/index.html'; return; }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  } catch (e) { toast(e.message, 'error'); throw e; }
}

// ── UTIL ──────────────────────────────────
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3000);
}
function openModal(html) { document.getElementById('modalContent').innerHTML = html; document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
function escapeHtml(s = '') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function currency(n, sym = 'Rs.') { return sym + Number(n || 0).toLocaleString(); }

// ── NAVIGATION ────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.id === 'logoutBtn') return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.getElementById('pageTitle').textContent = item.textContent.trim();
    document.getElementById('sidebar').classList.remove('open');
    loadPage(page);
  });
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Logout from admin panel?')) { localStorage.clear(); window.location.href = '/admin/index.html'; }
});
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── PAGE ROUTER ───────────────────────────
async function loadPage(page) {
  const c = document.getElementById('content');
  c.innerHTML = '<div class="empty"><i class="fas fa-spinner fa-spin"></i>Loading...</div>';
  switch (page) {
    case 'dashboard': await renderDashboard(); break;
    case 'products': await renderProducts(); break;
    case 'orders': await renderOrders(); break;
    case 'home-settings': await renderHomeSettings(); break;
    case 'forher-settings': await renderForHerSettings(); break;
    case 'shop-category': await renderShopCategory(); break;
    case 'category-heroes': await renderCategoryHeroes(); break;
    case 'announcement': await renderAnnouncement(); break;
    case 'contact': await renderContact(); break;
  }
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
async function renderDashboard() {
  const c = document.getElementById('content');
  try {
    const { stats, recentOrders } = await api('/orders/stats/dashboard');
    c.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Total Orders</div><div class="value">${stats.totalOrders}</div></div>
        <div class="stat-card"><div class="label">Pending</div><div class="value">${stats.pendingOrders}</div><div class="sub">Need attention</div></div>
        <div class="stat-card"><div class="label">Delivered</div><div class="value">${stats.deliveredOrders}</div></div>
        <div class="stat-card"><div class="label">Total Revenue</div><div class="value">${currency(stats.revenue)}</div></div>
        <div class="stat-card"><div class="label">Products</div><div class="value">${stats.totalProducts}</div><div class="sub">${stats.activeProducts} active</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Recent Orders</h3></div>
        <div class="table-wrap">
        <table>
          <thead><tr><th>Order#</th><th>Customer</th><th>Phone</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
          ${recentOrders.length ? recentOrders.map(o => `
            <tr>
              <td class="mono">${o.orderNumber}</td>
              <td>${escapeHtml(o.customer.name)}</td>
              <td>${escapeHtml(o.customer.phone)}</td>
              <td>${currency(o.total)}</td>
              <td><span class="badge ${o.status}">${o.status}</span></td>
              <td class="muted">${new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>`).join('') : '<tr><td colspan="6" class="empty">No orders yet</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>`;
  } catch (e) {}
}

// ═══════════════════════════════════════════
// PRODUCTS LIST
// ═══════════════════════════════════════════
let productSearch = '';

async function renderProducts() {
  const c = document.getElementById('content');
  const { products } = await api('/products/admin/all');
  const filtered = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.category||'').toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Products (${filtered.length})</h3>
        <div class="flex">
          <input class="search-box" id="psearch" placeholder="Search products..." value="${escapeHtml(productSearch)}">
          <button class="btn" onclick="openProductForm()"><i class="fas fa-plus"></i>&nbsp; Add Product</button>
        </div>
      </div>
      <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Image</th><th>Name</th><th>Category</th><th>Price (PKR)</th><th>Stock</th><th>Status</th><th>Link</th><th>Actions</th>
        </tr></thead>
        <tbody>
        ${filtered.length ? filtered.map(p => `
          <tr>
            <td><img src="${p.mainImage || 'https://placehold.co/40x50/eee/999?text=N/A'}" class="thumb" onerror="this.src='https://placehold.co/40x50/eee/999?text=N/A'"></td>
            <td><strong>${escapeHtml(p.name)}</strong><br><span class="muted mono">${p.slug}</span></td>
            <td>${escapeHtml(p.category)}</td>
            <td>${currency(p.pricePKR)}${p.discountPricePKR ? `<br><span class="muted">Disc: ${currency(p.discountPricePKR)}</span>` : ''}</td>
            <td>${p.stock}</td>
            <td>
              <span class="badge ${p.isActive ? 'active' : 'inactive'}">${p.isActive ? 'Active' : 'Inactive'}</span>
              ${p.isFeatured ? '<br><span class="badge featured">Featured</span>' : ''}
            </td>
            <td><button class="copy-btn" onclick="copyLink('${p.productLink || ''}')"><i class="fas fa-copy"></i> Copy</button></td>
            <td>
              <div class="actions">
                <button class="btn btn-sm btn-outline" onclick="openProductForm('${p._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm ${p.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleProduct('${p._id}')" title="Toggle Active">
                  <i class="fas fa-${p.isActive ? 'eye-slash' : 'eye'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}', '${escapeHtml(p.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`).join('') : '<tr><td colspan="8" class="empty"><i class="fas fa-box-open"></i>No products yet. Click "Add Product" to create one.</td></tr>'}
        </tbody>
      </table>
      </div>
    </div>`;
  document.getElementById('psearch').addEventListener('input', e => { productSearch = e.target.value; renderProducts(); });
}

function copyLink(link) {
  if (!link) { toast('No link available', 'error'); return; }
  navigator.clipboard.writeText(link);
  toast('Link copied: ' + link, 'success');
}
async function toggleProduct(id) {
  await api(`/products/${id}/toggle`, { method:'PATCH' });
  toast('Status updated', 'success');
  renderProducts();
}
async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  await api(`/products/${id}`, { method:'DELETE' });
  toast('Product deleted', 'success');
  renderProducts();
}

// ═══════════════════════════════════════════
// ★ FULL-PAGE PRODUCT FORM (not popup!)
// ═══════════════════════════════════════════
async function openProductForm(id = null) {
  let product = {
    name:'', category:'New Arrival', fabric:'',
    pricePKR:'', discountPricePKR:'', priceUSD:'', discountPriceUSD:'',
    priceEUR:'', discountPriceEUR:'', priceGBP:'', discountPriceGBP:'',
    sizes:[], sizeChart:{ columns:['Size','Bust','Waist','Hip','Length'], rows:[] },
    hasDupatta:false, dupattaPricePKR:0, dupattaPriceUSD:0, dupattaPriceEUR:0, dupattaPriceGBP:0,
    mainImage:'', variantImages:[],
    description:'', additionalDetails:[], reviews:[],
    isActive:true, isFeatured:false, stock:0, sku:'',
  };
  if (id) {
    const { product: p } = await api(`/products/${id}`);
    product = { ...product, ...p };
    if (!product.sizeChart || !product.sizeChart.columns) product.sizeChart = { columns:['Size','Bust','Waist','Hip','Length'], rows:[] };
  }
  window._editingProduct = product;
  window._editingProductId = id;

  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="product-form-page">
      <div class="form-page-header">
        <h2><i class="fas fa-${id ? 'edit' : 'plus'}" style="color:#c4a88b;"></i>&nbsp; ${id ? 'Edit Product' : 'Add New Product'}</h2>
        <div class="actions-right">
          <button class="btn btn-outline" onclick="cancelProductForm()"><i class="fas fa-times"></i> Cancel</button>
          <button class="btn" onclick="saveProduct()"><i class="fas fa-save"></i> ${id ? 'Update Product' : 'Create Product'}</button>
        </div>
      </div>

      <div class="form-tabs">
        <button class="form-tab active" onclick="switchFormTab(this,'basic')">Basic Info</button>
        <button class="form-tab" onclick="switchFormTab(this,'pricing')">Pricing</button>
        <button class="form-tab" onclick="switchFormTab(this,'sizes')">Sizes & Chart</button>
        <button class="form-tab" onclick="switchFormTab(this,'dupatta')">Dupatta</button>
        <button class="form-tab" onclick="switchFormTab(this,'images')">Images</button>
        <button class="form-tab" onclick="switchFormTab(this,'details')">Description</button>
        <button class="form-tab" onclick="switchFormTab(this,'reviews')">Reviews</button>
        <button class="form-tab" onclick="switchFormTab(this,'status')">Status & Stock</button>
      </div>

      <div id="panel-basic" class="form-panel active">${renderBasicPanel(product)}</div>
      <div id="panel-pricing" class="form-panel">${renderPricingPanel(product)}</div>
      <div id="panel-sizes" class="form-panel">${renderSizesPanel(product)}</div>
      <div id="panel-dupatta" class="form-panel">${renderDupattaPanel(product)}</div>
      <div id="panel-images" class="form-panel">${renderImagesPanel(product)}</div>
      <div id="panel-details" class="form-panel">${renderDetailsPanel(product)}</div>
      <div id="panel-reviews" class="form-panel">${renderReviewsPanel(product)}</div>
      <div id="panel-status" class="form-panel">${renderStatusPanel(product)}</div>
    </div>`;

  renderSizeChartTable();
  bindStarSelectors();
  window.scrollTo({ top: 0 });
}

function cancelProductForm() {
  if (confirm('Discard changes and return to product list?')) renderProducts();
}

function switchFormTab(btn, name) {
  document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// ── Panels ──────────────────────────────
function renderBasicPanel(p) {
  return `
    <div class="form-grid">
      <div class="field">
        <label>Product Name *</label>
        <input id="f_name" value="${escapeHtml(p.name)}" placeholder="e.g. Embroidered Kurta">
      </div>
      <div class="field">
        <label>Category *</label>
        <select id="f_category">
          ${CATEGORIES.map(c => `<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <p class="hint">Select from predefined categories only</p>
      </div>
      <div class="field">
        <label>Fabric</label>
        <input id="f_fabric" value="${escapeHtml(p.fabric)}" placeholder="e.g. 100% Cotton">
      </div>
      <div class="field">
        <label>SKU (optional)</label>
        <input id="f_sku" value="${escapeHtml(p.sku)}" placeholder="e.g. ML-KUR-001">
      </div>
    </div>
    ${window._editingProductId ? `
    <div class="field full" style="margin-top:10px;">
      <label>Slug / Product Link</label>
      <input id="f_slug" value="${p.slug || ''}" class="mono" readonly style="background:#fafaf8; color:#666; font-weight:400;">
      <p class="hint">Full link: <span class="mono">${p.productLink || ''}</span></p>
    </div>` : '<p class="hint" style="margin-top:10px;"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> Slug auto-generates on create: productname-XXXXX (5 digit unique)</p>'}`;
}

function renderPricingPanel(p) {
  return `
    <div class="form-section-title">🇵🇰 Pakistani Rupees (Primary) *</div>
    <div class="form-grid">
      <div class="field"><label>Price PKR *</label><input type="number" id="f_pricePKR" value="${p.pricePKR}" placeholder="8500"></div>
      <div class="field"><label>Discount Price PKR</label><input type="number" id="f_discountPricePKR" value="${p.discountPricePKR || ''}" placeholder="5500 (optional)"></div>
    </div>

    <div class="form-section-title">🇺🇸 US Dollars</div>
    <div class="form-grid">
      <div class="field"><label>Price USD</label><input type="number" step="0.01" id="f_priceUSD" value="${p.priceUSD || ''}" placeholder="30.00"></div>
      <div class="field"><label>Discount Price USD</label><input type="number" step="0.01" id="f_discountPriceUSD" value="${p.discountPriceUSD || ''}" placeholder="19.50"></div>
    </div>

    <div class="form-section-title">🇪🇺 Euros</div>
    <div class="form-grid">
      <div class="field"><label>Price EUR</label><input type="number" step="0.01" id="f_priceEUR" value="${p.priceEUR || ''}" placeholder="28.00"></div>
      <div class="field"><label>Discount Price EUR</label><input type="number" step="0.01" id="f_discountPriceEUR" value="${p.discountPriceEUR || ''}" placeholder="18.00"></div>
    </div>

    <div class="form-section-title">🇬🇧 British Pounds</div>
    <div class="form-grid">
      <div class="field"><label>Price GBP</label><input type="number" step="0.01" id="f_priceGBP" value="${p.priceGBP || ''}" placeholder="24.00"></div>
      <div class="field"><label>Discount Price GBP</label><input type="number" step="0.01" id="f_discountPriceGBP" value="${p.discountPriceGBP || ''}" placeholder="15.50"></div>
    </div>`;
}

function renderSizesPanel(p) {
  return `
    <div class="field">
      <label>Available Sizes (comma-separated)</label>
      <input id="f_sizes" value="${(p.sizes || []).join(', ')}" placeholder="XS, S, M, L, XL, XXL">
      <p class="hint">These sizes will show as selectable buttons on the product page</p>
    </div>

    <div class="form-section-title" style="margin-top:30px;">
      Size Chart Builder
      <div style="float:right; display:flex; gap:6px;">
        <button class="btn btn-sm btn-outline" onclick="addSizeChartCol()"><i class="fas fa-plus"></i> Column</button>
        <button class="btn btn-sm btn-gold" onclick="addSizeChartRow()"><i class="fas fa-plus"></i> Row</button>
      </div>
    </div>
    <div class="size-chart-builder">
      <div class="table-wrap"><table class="size-chart-table" id="sizeChartTable"></table></div>
      <p class="hint" style="margin-top:6px;"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> Add columns for headers (Size, Bust, Waist etc.), then add rows and fill values. This is the chart that opens when customer clicks "View Size Chart" on product page.</p>
    </div>`;
}

function renderDupattaPanel(p) {
  return `
    <div class="list-item" style="background:#f9f3ee;">
      <div class="field-inline" style="margin-bottom:0;">
        <input type="checkbox" id="f_hasDupatta" ${p.hasDupatta ? 'checked' : ''} style="width:18px; height:18px;">
        <label for="f_hasDupatta" style="margin:0; font-size:13px; font-weight:600;">This product includes a Dupatta</label>
      </div>
    </div>
    <p class="hint" style="margin:10px 0 20px;"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> If checked, a "+Dupatta" badge shows on the product. Customer can toggle dupatta ON/OFF on detail page. Dupatta price adds to main product price.</p>

    <div class="form-section-title">Dupatta Extra Pricing</div>
    <div class="form-grid">
      <div class="field"><label>PKR</label><input type="number" id="f_dupattaPricePKR" value="${p.dupattaPricePKR || 0}" placeholder="1500"></div>
      <div class="field"><label>USD</label><input type="number" step="0.01" id="f_dupattaPriceUSD" value="${p.dupattaPriceUSD || 0}" placeholder="5.50"></div>
      <div class="field"><label>EUR</label><input type="number" step="0.01" id="f_dupattaPriceEUR" value="${p.dupattaPriceEUR || 0}" placeholder="5.00"></div>
      <div class="field"><label>GBP</label><input type="number" step="0.01" id="f_dupattaPriceGBP" value="${p.dupattaPriceGBP || 0}" placeholder="4.50"></div>
    </div>`;
}

function renderImagesPanel(p) {
  return `
    <div class="form-section-title">Main Image *</div>
    <div class="img-upload-row">
      <input type="text" id="f_mainImage" value="${escapeHtml(p.mainImage)}" placeholder="Paste image URL here">
      <input type="file" accept="image/*" onchange="uploadImage(this, 'f_mainImage')">
    </div>
    <p class="hint">Paste a URL <strong>OR</strong> upload an image. Uploaded files saved to /uploads.</p>
    ${p.mainImage ? `<div class="img-preview"><img src="${p.mainImage}"></div>` : ''}

    <div class="form-section-title" style="margin-top:30px;">
      Variant Images
      <div style="float:right;"><button class="btn btn-sm btn-outline" onclick="addVariantRow()"><i class="fas fa-plus"></i> Add Variant</button></div>
    </div>
    <div id="variantImagesList">
      ${(p.variantImages || []).map((v, i) => variantRowHTML(v, i)).join('')}
    </div>`;
}

function variantRowHTML(v, i) {
  return `
    <div class="img-upload-row" data-idx="${i}">
      <input type="text" class="variant-url" value="${escapeHtml(v.url || '')}" placeholder="Image URL">
      <input type="text" class="variant-color" value="${escapeHtml(v.color || '')}" placeholder="Color (optional)" style="max-width:140px;">
      <input type="file" accept="image/*" onchange="uploadVariantImage(this, ${i})">
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()" type="button"><i class="fas fa-times"></i></button>
    </div>`;
}

function renderDetailsPanel(p) {
  return `
    <div class="field">
      <label>Description</label>
      <textarea id="f_description" rows="6" placeholder="Full product description...">${escapeHtml(p.description)}</textarea>
    </div>

    <div class="form-section-title" style="margin-top:20px;">
      Additional Details (Key-Value)
      <div style="float:right;"><button class="btn btn-sm btn-outline" onclick="addAdditionalDetail()"><i class="fas fa-plus"></i> Add Detail</button></div>
    </div>
    <div id="additionalDetailsList">
      ${(p.additionalDetails || []).map((d, i) => additionalDetailHTML(d, i)).join('')}
    </div>
    <p class="hint"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> Extra details shown under "Additional Info" tab on product page (e.g. Care: Dry Clean, Length: 48")</p>`;
}

function additionalDetailHTML(d, i) {
  return `
    <div class="list-item" data-idx="${i}">
      <div class="form-grid">
        <div class="field" style="margin:0;"><label>Key</label><input class="add-key" value="${escapeHtml(d.key || '')}" placeholder="e.g. Length"></div>
        <div class="field" style="margin:0;"><label>Value</label><input class="add-val" value="${escapeHtml(d.value || '')}" placeholder="e.g. 48 inches"></div>
      </div>
      <div style="text-align:right;"><button class="btn btn-sm btn-danger" onclick="this.closest('.list-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
    </div>`;
}

function renderReviewsPanel(p) {
  return `
    <div class="form-section-title">
      Customer Reviews (${(p.reviews || []).length})
      <div style="float:right;"><button class="btn btn-sm btn-outline" onclick="addReviewRow()"><i class="fas fa-plus"></i> Add Review</button></div>
    </div>
    <div id="reviewsList">
      ${(p.reviews || []).map((r, i) => reviewRowHTML(r, i)).join('')}
    </div>
    <p class="hint"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> Click stars to set rating. All fields required.</p>`;
}

function reviewRowHTML(r, i) {
  return `
    <div class="list-item" data-idx="${i}">
      <div class="form-grid">
        <div class="field" style="margin:0;">
          <label>Customer Name</label>
          <input class="rev-name" value="${escapeHtml(r.name || '')}" placeholder="Sarah K.">
        </div>
        <div class="field" style="margin:0;">
          <label>Star Rating</label>
          <div class="star-selector" data-rating="${r.rating || 5}">
            ${[1,2,3,4,5].map(n => `<span class="star ${n <= (r.rating||5) ? 'filled' : ''}" data-val="${n}">★</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="field" style="margin:0;">
        <label>Comment</label>
        <textarea class="rev-comment" rows="2" placeholder="Review text...">${escapeHtml(r.comment || '')}</textarea>
      </div>
      <div style="text-align:right;"><button class="btn btn-sm btn-danger" onclick="this.closest('.list-item').remove()"><i class="fas fa-trash"></i> Remove Review</button></div>
    </div>`;
}

function renderStatusPanel(p) {
  return `
    <div class="form-grid">
      <div class="list-item" style="background:${p.isActive ? '#f0faf0' : '#faf0f0'};">
        <div class="field-inline"><input type="checkbox" id="f_isActive" ${p.isActive ? 'checked' : ''} style="width:18px;height:18px;"><label for="f_isActive" style="margin:0; font-weight:600;">Active (visible on website)</label></div>
      </div>
      <div class="list-item" style="background:${p.isFeatured ? '#f9f3ee' : '#fafaf8'};">
        <div class="field-inline"><input type="checkbox" id="f_isFeatured" ${p.isFeatured ? 'checked' : ''} style="width:18px;height:18px;"><label for="f_isFeatured" style="margin:0; font-weight:600;">Featured Product (highlighted on homepage)</label></div>
      </div>
    </div>
    <div class="field" style="margin-top:20px;">
      <label>Stock Quantity</label>
      <input type="number" id="f_stock" value="${p.stock}" min="0" placeholder="0">
      <p class="hint">Number of items available. Set to 0 to mark as "Sold Out".</p>
    </div>`;
}

// ── Star Selector Binding ──
function bindStarSelectors() {
  document.querySelectorAll('.star-selector').forEach(selector => {
    selector.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        selector.dataset.rating = val;
        selector.querySelectorAll('.star').forEach(s => {
          s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
        });
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.val);
        selector.querySelectorAll('.star').forEach(s => {
          s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
        });
      });
    });
    selector.addEventListener('mouseleave', () => {
      const val = parseInt(selector.dataset.rating) || 5;
      selector.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
      });
    });
  });
}

// ── Size Chart Builder ──
function renderSizeChartTable() {
  const table = document.getElementById('sizeChartTable');
  if (!table || !window._editingProduct) return;
  const chart = window._editingProduct.sizeChart;

  let html = '<thead><tr>';
  chart.columns.forEach((col, ci) => {
    html += `<th><input value="${escapeHtml(col)}" onchange="updateChartCol(${ci}, this.value)" style="background:#fff; font-size:11px; font-weight:600; text-transform:uppercase;"><button class="btn btn-sm btn-danger" onclick="removeChartCol(${ci})" style="margin-top:4px; width:100%; padding:3px;" type="button"><i class="fas fa-times"></i></button></th>`;
  });
  html += '<th style="width:40px;"></th></tr></thead><tbody>';
  chart.rows.forEach((row, ri) => {
    html += '<tr>';
    chart.columns.forEach((col, ci) => {
      const val = row[ci] || '';
      html += `<td><input value="${escapeHtml(val)}" onchange="updateChartCell(${ri},${ci},this.value)" placeholder="—"></td>`;
    });
    html += `<td><button class="btn btn-sm btn-danger" onclick="removeChartRow(${ri})" type="button"><i class="fas fa-times"></i></button></td>`;
    html += '</tr>';
  });
  if (!chart.rows.length) {
    html += `<tr><td colspan="${chart.columns.length + 1}" style="text-align:center; color:#999; padding:20px; font-size:12px;">No rows yet. Click "Add Row" to start building your size chart.</td></tr>`;
  }
  html += '</tbody>';
  table.innerHTML = html;
}

function addSizeChartCol() { window._editingProduct.sizeChart.columns.push('New Col'); renderSizeChartTable(); }
function removeChartCol(i) { window._editingProduct.sizeChart.columns.splice(i, 1); window._editingProduct.sizeChart.rows.forEach(r => r.splice(i, 1)); renderSizeChartTable(); }
function updateChartCol(i, val) { window._editingProduct.sizeChart.columns[i] = val; }
function addSizeChartRow() { const cols = window._editingProduct.sizeChart.columns.length; window._editingProduct.sizeChart.rows.push(Array(cols).fill('')); renderSizeChartTable(); }
function removeChartRow(i) { window._editingProduct.sizeChart.rows.splice(i, 1); renderSizeChartTable(); }
function updateChartCell(ri, ci, val) { if (!window._editingProduct.sizeChart.rows[ri]) window._editingProduct.sizeChart.rows[ri] = []; window._editingProduct.sizeChart.rows[ri][ci] = val; }

// ── Dynamic lists ──
function addVariantRow() {
  const list = document.getElementById('variantImagesList');
  const idx = list.children.length;
  list.insertAdjacentHTML('beforeend', variantRowHTML({}, idx));
}
function addAdditionalDetail() {
  const list = document.getElementById('additionalDetailsList');
  const idx = list.children.length;
  list.insertAdjacentHTML('beforeend', additionalDetailHTML({}, idx));
}
function addReviewRow() {
  const list = document.getElementById('reviewsList');
  const idx = list.children.length;
  list.insertAdjacentHTML('beforeend', reviewRowHTML({ rating: 5 }, idx));
  bindStarSelectors();
}

// ── Image upload ──
async function uploadImage(fileInput, targetId) {
  if (!fileInput.files[0]) return;
  const fd = new FormData();
  fd.append('image', fileInput.files[0]);
  try {
    toast('Uploading...', '');
    const res = await fetch(API + '/upload/single', { method:'POST', headers:{ Authorization:'Bearer '+token }, body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    document.getElementById(targetId).value = data.fullUrl;
    toast('Image uploaded', 'success');
  } catch (e) { toast('Upload failed: ' + e.message, 'error'); }
}
async function uploadVariantImage(fileInput, idx) {
  if (!fileInput.files[0]) return;
  const fd = new FormData();
  fd.append('image', fileInput.files[0]);
  try {
    toast('Uploading...', '');
    const res = await fetch(API + '/upload/single', { method:'POST', headers:{ Authorization:'Bearer '+token }, body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const row = fileInput.closest('.img-upload-row');
    if (row) row.querySelector('.variant-url').value = data.fullUrl;
    toast('Image uploaded', 'success');
  } catch (e) { toast('Upload failed: ' + e.message, 'error'); }
}

// ── Save Product ──
async function saveProduct() {
  const p = window._editingProduct;
  const id = window._editingProductId;

  const data = {
    name: document.getElementById('f_name').value.trim(),
    category: document.getElementById('f_category').value,
    fabric: document.getElementById('f_fabric').value.trim(),
    sku: document.getElementById('f_sku').value.trim(),
    pricePKR: Number(document.getElementById('f_pricePKR').value) || 0,
    discountPricePKR: Number(document.getElementById('f_discountPricePKR').value) || null,
    priceUSD: Number(document.getElementById('f_priceUSD').value) || null,
    discountPriceUSD: Number(document.getElementById('f_discountPriceUSD').value) || null,
    priceEUR: Number(document.getElementById('f_priceEUR').value) || null,
    discountPriceEUR: Number(document.getElementById('f_discountPriceEUR').value) || null,
    priceGBP: Number(document.getElementById('f_priceGBP').value) || null,
    discountPriceGBP: Number(document.getElementById('f_discountPriceGBP').value) || null,
    sizes: document.getElementById('f_sizes').value.split(',').map(s => s.trim()).filter(Boolean),
    sizeChart: p.sizeChart,
    hasDupatta: document.getElementById('f_hasDupatta').checked,
    dupattaPricePKR: Number(document.getElementById('f_dupattaPricePKR').value) || 0,
    dupattaPriceUSD: Number(document.getElementById('f_dupattaPriceUSD').value) || 0,
    dupattaPriceEUR: Number(document.getElementById('f_dupattaPriceEUR').value) || 0,
    dupattaPriceGBP: Number(document.getElementById('f_dupattaPriceGBP').value) || 0,
    mainImage: document.getElementById('f_mainImage').value.trim(),
    variantImages: [...document.querySelectorAll('#variantImagesList .img-upload-row')].map(row => ({
      url: row.querySelector('.variant-url').value.trim(),
      color: row.querySelector('.variant-color').value.trim(),
    })).filter(v => v.url),
    description: document.getElementById('f_description').value.trim(),
    additionalDetails: [...document.querySelectorAll('#additionalDetailsList .list-item')].map(item => ({
      key: item.querySelector('.add-key').value.trim(),
      value: item.querySelector('.add-val').value.trim(),
    })).filter(d => d.key),
    reviews: [...document.querySelectorAll('#reviewsList .list-item')].map(item => ({
      name: item.querySelector('.rev-name').value.trim(),
      rating: Number(item.querySelector('.star-selector').dataset.rating) || 5,
      comment: item.querySelector('.rev-comment').value.trim(),
    })).filter(r => r.name && r.comment),
    isActive: document.getElementById('f_isActive').checked,
    isFeatured: document.getElementById('f_isFeatured').checked,
    stock: Number(document.getElementById('f_stock').value) || 0,
  };

  if (!data.name || !data.pricePKR || !data.category) {
    toast('Name, category, and PKR price are required', 'error');
    return;
  }

  try {
    if (id) {
      await api(`/products/${id}`, { method:'PUT', body: JSON.stringify(data) });
      toast('Product updated successfully!', 'success');
    } else {
      const res = await api('/products', { method:'POST', body: JSON.stringify(data) });
      toast(`Created! Link: ${res.product.productLink}`, 'success');
    }
    renderProducts();
  } catch (e) {}
}

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════
async function renderOrders() {
  const c = document.getElementById('content');
  const { orders } = await api('/orders');

  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>All Orders (${orders.length})</h3></div>
      <div class="table-wrap">
      <table>
        <thead><tr><th>Order#</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
        ${orders.length ? orders.map(o => `
          <tr>
            <td class="mono">${o.orderNumber}</td>
            <td>${escapeHtml(o.customer.name)}<br><span class="muted">${escapeHtml(o.customer.email || '')}</span></td>
            <td>${escapeHtml(o.customer.phone)}</td>
            <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
            <td>${currency(o.total, o.currency === 'PKR' ? 'Rs.' : o.currency + ' ')}</td>
            <td>
              <select onchange="updateOrderStatus('${o._id}', this.value)" class="badge ${o.status}" style="padding:4px 8px; border:none; font-weight:500;">
                ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
              </select>
            </td>
            <td class="muted">${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm btn-outline" onclick="viewOrder('${o._id}')" title="View"><i class="fas fa-eye"></i></button>
                <a class="btn btn-sm btn-success" href="https://wa.me/${o.customer.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('Hello '+o.customer.name+', thanks for your order '+o.orderNumber)}" target="_blank" style="text-decoration:none;" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${o._id}', '${o.orderNumber}')" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`).join('') : '<tr><td colspan="8" class="empty"><i class="fas fa-shopping-cart"></i>No orders yet</td></tr>'}
        </tbody>
      </table>
      </div>
    </div>`;
}

async function updateOrderStatus(id, status) {
  await api(`/orders/${id}/status`, { method:'PATCH', body: JSON.stringify({ status }) });
  toast('Status updated', 'success');
}

async function viewOrder(id) {
  const { order } = await api(`/orders/${id}`);
  openModal(`
    <div class="modal-header">
      <h3>Order ${order.orderNumber}</h3>
      <button class="close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div class="form-grid">
      <div class="field"><label>Customer</label><div style="font-weight:600;">${escapeHtml(order.customer.name)}</div></div>
      <div class="field"><label>Phone</label><div><a href="https://wa.me/${order.customer.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i> ${escapeHtml(order.customer.phone)}</a></div></div>
      <div class="field"><label>Email</label><div>${escapeHtml(order.customer.email || '—')}</div></div>
      <div class="field"><label>City</label><div>${escapeHtml(order.customer.city || '—')}</div></div>
      <div class="field full"><label>Address</label><div>${escapeHtml(order.customer.address || '—')}</div></div>
    </div>
    <h4 style="margin:16px 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#2c2c2c;">Items</h4>
    <table>
      <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        ${order.items.map(i => `<tr>
          <td>${escapeHtml(i.name)}${i.hasDupatta ? ' <span class="badge featured">+Dupatta</span>' : ''}</td>
          <td>${i.size || '—'}</td>
          <td>${i.quantity}</td>
          <td>${currency(i.price)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:16px; text-align:right;">
      <p>Subtotal: <strong>${currency(order.subtotal)}</strong></p>
      <p>Shipping: <strong>${currency(order.shipping)}</strong></p>
      <p style="font-size:16px; margin-top:8px;">Total: <strong style="color:#c4a88b;">${currency(order.total)}</strong></p>
    </div>
    ${order.notes ? `<div class="field" style="margin-top:14px;"><label>Order Notes</label><div style="background:#fafaf8; padding:10px; border-left:3px solid #c4a88b;">${escapeHtml(order.notes)}</div></div>` : ''}
  `);
}

async function deleteOrder(id, num) {
  if (!confirm(`Delete order ${num}?`)) return;
  await api(`/orders/${id}`, { method:'DELETE' });
  toast('Order deleted', 'success');
  renderOrders();
}

// ═══════════════════════════════════════════
// HOME SETTINGS (Hero)
// ═══════════════════════════════════════════
async function renderHomeSettings() {
  const { settings } = await api('/settings');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Home Page Hero</h3></div>
      <div class="field full">
        <label>Hero Image</label>
        <div class="img-upload-row">
          <input type="text" id="s_heroImage" value="${escapeHtml(settings.heroImage || '')}" placeholder="Paste image URL">
          <input type="file" accept="image/*" onchange="uploadImage(this, 's_heroImage')">
        </div>
        ${settings.heroImage ? `<img src="${settings.heroImage}" style="width:300px; margin-top:10px; border:1px solid #eee;">` : ''}
      </div>
      <div class="form-grid">
        <div class="field"><label>Hero Heading</label><input id="s_heroHeading" value="${escapeHtml(settings.heroHeading || '')}" placeholder="SPRING SUMMER"></div>
        <div class="field"><label>Shop Button Text</label><input id="s_heroSubtext" value="${escapeHtml(settings.heroSubtext || '')}" placeholder="SHOP NOW"></div>
      </div>
      <div class="field full"><label>Shop Button Link</label><input id="s_heroSubLink" value="${escapeHtml(settings.heroSubLink || '#')}" placeholder="category.html"></div>
      <button class="btn" onclick="saveHomeSettings()"><i class="fas fa-save"></i> Save Changes</button>
    </div>`;
}

async function saveHomeSettings() {
  await api('/settings', { method:'PUT', body: JSON.stringify({
    heroImage: document.getElementById('s_heroImage').value.trim(),
    heroHeading: document.getElementById('s_heroHeading').value.trim(),
    heroSubtext: document.getElementById('s_heroSubtext').value.trim(),
    heroSubLink: document.getElementById('s_heroSubLink').value.trim(),
  }) });
  toast('Saved', 'success');
  renderHomeSettings();
}

// ═══════════════════════════════════════════
// FOR HER SETTINGS
// ═══════════════════════════════════════════
async function renderForHerSettings() {
  const { settings } = await api('/settings');
  const c = document.getElementById('content');
  const slot = (n) => settings['forherSlot' + n] || {};

  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>For Her — Main Large Image</h3></div>
      <div class="field">
        <div class="img-upload-row">
          <input type="text" id="s_forherMain" value="${escapeHtml(settings.forherMainImage || '')}" placeholder="Image URL">
          <input type="file" accept="image/*" onchange="uploadImage(this, 's_forherMain')">
        </div>
        ${settings.forherMainImage ? `<img src="${settings.forherMainImage}" style="width:250px; margin-top:10px; border:1px solid #eee;">` : ''}
      </div>
    </div>

    ${[1,2,3,4].map(n => {
      const s = slot(n);
      return `
      <div class="card">
        <div class="card-header"><h3>Mini Slot ${n}</h3></div>
        <div class="field full">
          <label>Image</label>
          <div class="img-upload-row">
            <input type="text" id="s_slot${n}_img" value="${escapeHtml(s.customImage || '')}" placeholder="Image URL">
            <input type="file" accept="image/*" onchange="uploadImage(this, 's_slot${n}_img')">
          </div>
          ${s.customImage ? `<img src="${s.customImage}" style="width:120px; margin-top:8px; border:1px solid #eee;">` : ''}
        </div>
        <div class="form-grid">
          <div class="field"><label>Title</label><input id="s_slot${n}_title" value="${escapeHtml(s.customTitle || '')}" placeholder="Silk Blouse"></div>
          <div class="field"><label>Product Slug (link)</label><input id="s_slot${n}_slug" value="${escapeHtml(s.slug || '')}" placeholder="embroidered-kurta-12345"></div>
          <div class="field"><label>Price PKR</label><input type="number" id="s_slot${n}_pkr" value="${s.pricePKR || ''}" placeholder="4200"></div>
          <div class="field"><label>Price USD</label><input type="number" step="0.01" id="s_slot${n}_usd" value="${s.priceUSD || ''}" placeholder="15.00"></div>
          <div class="field"><label>Price EUR</label><input type="number" step="0.01" id="s_slot${n}_eur" value="${s.priceEUR || ''}" placeholder="14.00"></div>
          <div class="field"><label>Price GBP</label><input type="number" step="0.01" id="s_slot${n}_gbp" value="${s.priceGBP || ''}" placeholder="12.00"></div>
        </div>
      </div>`;
    }).join('')}

    <button class="btn" onclick="saveForHer()"><i class="fas fa-save"></i> Save All</button>`;
}

async function saveForHer() {
  const body = { forherMainImage: document.getElementById('s_forherMain').value.trim() };
  [1,2,3,4].forEach(n => {
    body['forherSlot' + n] = {
      customImage: document.getElementById(`s_slot${n}_img`).value.trim(),
      customTitle: document.getElementById(`s_slot${n}_title`).value.trim(),
      slug: document.getElementById(`s_slot${n}_slug`).value.trim(),
      pricePKR: Number(document.getElementById(`s_slot${n}_pkr`).value) || undefined,
      priceUSD: Number(document.getElementById(`s_slot${n}_usd`).value) || undefined,
      priceEUR: Number(document.getElementById(`s_slot${n}_eur`).value) || undefined,
      priceGBP: Number(document.getElementById(`s_slot${n}_gbp`).value) || undefined,
    };
  });
  await api('/settings', { method:'PUT', body: JSON.stringify(body) });
  toast('Saved', 'success');
  renderForHerSettings();
}

// ═══════════════════════════════════════════
// SHOP BY CATEGORY (home grid)
// ═══════════════════════════════════════════
async function renderShopCategory() {
  const { settings } = await api('/settings');
  const cats = settings.shopCategories || [];
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Shop By Category (Home Grid)</h3>
        <button class="btn btn-sm" onclick="addShopCat()"><i class="fas fa-plus"></i> Add</button>
      </div>
      <div id="shopCatList">
        ${cats.map((c, i) => shopCatHTML(c, i)).join('') || '<p class="empty">No categories yet. Click "Add" to create one.</p>'}
      </div>
      <button class="btn" onclick="saveShopCats()" style="margin-top:16px;"><i class="fas fa-save"></i> Save All</button>
    </div>`;
}

function shopCatHTML(c, i) {
  return `
    <div class="list-item" data-idx="${i}">
      <div class="form-grid three">
        <div class="field" style="margin:0;"><label>Display Name</label><input class="sc-name" value="${escapeHtml(c.name || '')}" placeholder="WOMEN"></div>
        <div class="field" style="margin:0;">
          <label>Links to Category</label>
          <select class="sc-category">
            <option value="">— Select —</option>
            ${CATEGORIES.map(cat => `<option value="${cat}" ${c.category===cat?'selected':''}>${cat}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin:0;"><label>&nbsp;</label><button class="btn btn-sm btn-danger" onclick="this.closest('.list-item').remove()" style="width:100%;"><i class="fas fa-trash"></i> Remove</button></div>
      </div>
      <div class="field" style="margin:0;">
        <label>Image</label>
        <div class="img-upload-row">
          <input type="text" class="sc-image" value="${escapeHtml(c.image || '')}" placeholder="Image URL">
          <input type="file" accept="image/*" onchange="uploadShopCatImage(this, ${i})">
        </div>
        ${c.image ? `<img src="${c.image}" style="width:90px; margin-top:6px; border:1px solid #eee;">` : ''}
      </div>
    </div>`;
}

function addShopCat() {
  const list = document.getElementById('shopCatList');
  // clear empty state
  if (list.querySelector('.empty')) list.innerHTML = '';
  const idx = list.querySelectorAll('.list-item').length;
  list.insertAdjacentHTML('beforeend', shopCatHTML({}, idx));
}
async function uploadShopCatImage(fileInput, idx) {
  if (!fileInput.files[0]) return;
  const fd = new FormData(); fd.append('image', fileInput.files[0]);
  const res = await fetch(API + '/upload/single', { method:'POST', headers:{ Authorization:'Bearer '+token }, body: fd });
  const data = await res.json();
  if (data.success) {
    const row = fileInput.closest('.list-item');
    if (row) row.querySelector('.sc-image').value = data.fullUrl;
    toast('Uploaded', 'success');
  }
}
async function saveShopCats() {
  const shopCategories = [...document.querySelectorAll('#shopCatList .list-item')].map(item => ({
    name: item.querySelector('.sc-name').value.trim(),
    category: item.querySelector('.sc-category').value.trim(),
    image: item.querySelector('.sc-image').value.trim(),
  })).filter(c => c.name);
  await api('/settings', { method:'PUT', body: JSON.stringify({ shopCategories }) });
  toast('Saved', 'success');
  renderShopCategory();
}

// ═══════════════════════════════════════════
// CATEGORY HEROES
// ═══════════════════════════════════════════
async function renderCategoryHeroes() {
  const { settings } = await api('/settings');
  const existing = settings.categoryHeroes || [];
  const c = document.getElementById('content');

  // Auto-populate all CATEGORIES (create missing)
  const allHeroes = CATEGORIES.map(cat => {
    const found = existing.find(h => h.category === cat);
    return found || { category: cat, label: cat.toUpperCase(), subtitle:'', heroImage:'', thumbImage:'' };
  });

  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Category Page Heroes</h3></div>
      <p class="hint" style="margin-bottom:16px;"><i class="fas fa-info-circle" style="color:#c4a88b;"></i> Set hero image for each category page. One entry for each of your 5 predefined categories.</p>
      <div id="catHeroList">
        ${allHeroes.map((h, i) => catHeroHTML(h, i)).join('')}
      </div>
      <button class="btn" onclick="saveCategoryHeroes()" style="margin-top:16px;"><i class="fas fa-save"></i> Save All</button>
    </div>`;
}

function catHeroHTML(h, i) {
  return `
    <div class="list-item" data-idx="${i}">
      <div class="form-grid three">
        <div class="field" style="margin:0;">
          <label>Category</label>
          <input class="ch-cat" value="${escapeHtml(h.category || '')}" readonly style="background:#fafaf8; font-weight:600; color:#2c2c2c;">
        </div>
        <div class="field" style="margin:0;"><label>Display Label</label><input class="ch-label" value="${escapeHtml(h.label || '')}" placeholder="NEW ARRIVAL"></div>
        <div class="field" style="margin:0;"><label>Subtitle</label><input class="ch-sub" value="${escapeHtml(h.subtitle || '')}" placeholder="Fresh · Curated"></div>
      </div>
      <div class="field" style="margin:0;">
        <label>Hero Image</label>
        <div class="img-upload-row">
          <input type="text" class="ch-hero" value="${escapeHtml(h.heroImage || '')}" placeholder="Hero image URL">
          <input type="file" accept="image/*" onchange="uploadCatHeroImg(this, 'hero')">
        </div>
        ${h.heroImage ? `<img src="${h.heroImage}" style="width:180px; margin-top:6px; border:1px solid #eee;">` : ''}
      </div>
      <div class="field" style="margin:0;">
        <label>Thumbnail (for home Shop Category grid)</label>
        <div class="img-upload-row">
          <input type="text" class="ch-thumb" value="${escapeHtml(h.thumbImage || '')}" placeholder="Thumbnail URL (optional)">
          <input type="file" accept="image/*" onchange="uploadCatHeroImg(this, 'thumb')">
        </div>
      </div>
    </div>`;
}

async function uploadCatHeroImg(fileInput, type) {
  if (!fileInput.files[0]) return;
  const fd = new FormData(); fd.append('image', fileInput.files[0]);
  const res = await fetch(API + '/upload/single', { method:'POST', headers:{ Authorization:'Bearer '+token }, body: fd });
  const data = await res.json();
  if (data.success) {
    const row = fileInput.closest('.list-item');
    if (row) row.querySelector(type === 'hero' ? '.ch-hero' : '.ch-thumb').value = data.fullUrl;
    toast('Uploaded', 'success');
  }
}

async function saveCategoryHeroes() {
  const categoryHeroes = [...document.querySelectorAll('#catHeroList .list-item')].map(item => ({
    category: item.querySelector('.ch-cat').value.trim(),
    label: item.querySelector('.ch-label').value.trim(),
    subtitle: item.querySelector('.ch-sub').value.trim(),
    heroImage: item.querySelector('.ch-hero').value.trim(),
    thumbImage: item.querySelector('.ch-thumb').value.trim(),
  })).filter(h => h.category);
  await api('/settings', { method:'PUT', body: JSON.stringify({ categoryHeroes }) });
  toast('Saved', 'success');
  renderCategoryHeroes();
}

// ═══════════════════════════════════════════
// ANNOUNCEMENT
// ═══════════════════════════════════════════
async function renderAnnouncement() {
  const { settings } = await api('/settings');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Announcement Bar</h3></div>
      <div class="field"><label>Desktop Text</label><input id="s_announce" value="${escapeHtml(settings.announcementText || '')}" placeholder="✦ FREE SHIPPING OVER Rs.5,000 ✦"></div>
      <div class="field"><label>Mobile Marquee Text</label><input id="s_announceMob" value="${escapeHtml(settings.announcementMobile || '')}" placeholder="✦ FREE SHIPPING ✦ EASY RETURNS ✦"></div>
      <button class="btn" onclick="saveAnnouncement()"><i class="fas fa-save"></i> Save</button>
    </div>`;
}
async function saveAnnouncement() {
  await api('/settings', { method:'PUT', body: JSON.stringify({
    announcementText: document.getElementById('s_announce').value.trim(),
    announcementMobile: document.getElementById('s_announceMob').value.trim(),
  })});
  toast('Saved', 'success');
}

// ═══════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════
async function renderContact() {
  const { settings } = await api('/settings');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Contact Info</h3></div>
      <div class="form-grid">
        <div class="field"><label>WhatsApp Number (no +)</label><input id="c_whatsapp" value="${escapeHtml(settings.whatsappNumber || '')}" placeholder="923001234567"></div>
        <div class="field"><label>Contact Phone</label><input id="c_phone" value="${escapeHtml(settings.contactPhone || '')}" placeholder="+92 300 1234567"></div>
        <div class="field"><label>Contact Email</label><input id="c_email" value="${escapeHtml(settings.contactEmail || '')}" placeholder="contact@minimalluxe.com"></div>
        <div class="field"><label>Address</label><input id="c_address" value="${escapeHtml(settings.contactAddress || '')}" placeholder="Lahore, Pakistan"></div>
        <div class="field"><label>Facebook URL</label><input id="c_fb" value="${escapeHtml(settings.facebookUrl || '')}" placeholder="https://facebook.com/..."></div>
        <div class="field"><label>Instagram URL</label><input id="c_ig" value="${escapeHtml(settings.instagramUrl || '')}" placeholder="https://instagram.com/..."></div>
      </div>
      <button class="btn" onclick="saveContact()"><i class="fas fa-save"></i> Save</button>
    </div>`;
}
async function saveContact() {
  await api('/settings', { method:'PUT', body: JSON.stringify({
    whatsappNumber: document.getElementById('c_whatsapp').value.trim(),
    contactPhone: document.getElementById('c_phone').value.trim(),
    contactEmail: document.getElementById('c_email').value.trim(),
    contactAddress: document.getElementById('c_address').value.trim(),
    facebookUrl: document.getElementById('c_fb').value.trim(),
    instagramUrl: document.getElementById('c_ig').value.trim(),
  })});
  toast('Saved', 'success');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
loadPage('dashboard');