// ========== AUTH ==========
const token = localStorage.getItem('alanani_token');
const userInfo = JSON.parse(localStorage.getItem('alanani_user') || '{}');

if (!token) { window.location.href = '/login'; }

// Set user info in topbar
document.getElementById('userAvatar').textContent = (userInfo.username || 'A')[0].toUpperCase();
document.getElementById('userName').textContent = userInfo.username || 'Admin';

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/login'; return; }
  return res.json();
}

async function apiFormData(url, method, formData) {
  const res = await fetch(url, {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/login'; return; }
  return res.json();
}

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ========== NAVIGATION ==========
const pages = { titles: { overview: 'الرئيسية', properties: 'إدارة العقارات', media: 'الصور والفيديوهات', content: 'محتوى الموقع', settings: 'الإعدادات' } };

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  document.getElementById('pageTitle').textContent = pages.titles[page] || page;
  if (page === 'overview') loadOverview();
  if (page === 'properties') loadProperties();
  if (page === 'media') loadMedia();
  if (page === 'content') loadContent();
}

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login';
});

// ========== MODAL HELPERS ==========
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay.id); });
});

// ========== OVERVIEW ==========
async function loadOverview() {
  const stats = await apiFetch('/api/content/stats');
  if (!stats) return;
  const d = stats.data;
  document.getElementById('stat-total').textContent = d.totalProperties;
  document.getElementById('stat-available').textContent = d.availableProperties;
  document.getElementById('stat-images').textContent = d.totalImages;
  document.getElementById('stat-videos').textContent = d.totalVideos;

  const props = await apiFetch('/api/properties?featured=1');
  const container = document.getElementById('recentProperties');
  container.innerHTML = '';
  if (!props?.data?.length) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🏠</span><p>لا توجد عقارات مميزة بعد</p></div>';
    return;
  }
  props.data.slice(0, 6).forEach(p => {
    container.innerHTML += `
      <div class="prop-card">
        <div class="prop-card-title">${p.title}</div>
        <div class="prop-card-location">📍 ${p.location || '—'}</div>
        <div class="prop-card-price">💰 ${p.price || '—'} ج.م</div>
      </div>`;
  });
}

// ========== PROPERTIES ==========
let editingPropId = null;

async function loadProperties() {
  const res = await apiFetch('/api/properties');
  if (!res) return;
  const tbody = document.getElementById('propertiesTableBody');
  tbody.innerHTML = '';

  if (!res.data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);padding:32px;">لا توجد عقارات</td></tr>`;
    return;
  }

  res.data.forEach(p => {
    const statusLabels = { available: 'متاح', sold: 'مباع', reserved: 'محجوز' };
    tbody.innerHTML += `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td><strong>${p.title}</strong></td>
        <td>${p.location || '—'}</td>
        <td style="color:var(--gold);font-weight:700;">${p.price ? p.price + ' ج.م' : '—'}</td>
        <td><span class="status-badge status-${p.status}">${statusLabels[p.status] || p.status}</span></td>
        <td>${p.featured ? '<span class="featured-star">⭐</span>' : '—'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="editProperty(${p.id})">✏️ تعديل</button>
            <button class="btn-media" onclick="managePropertyMedia(${p.id}, '${p.title}')">🖼️ وسائط</button>
            <button class="btn-delete" onclick="deleteProperty(${p.id}, '${p.title}')">🗑️ حذف</button>
          </div>
        </td>
      </tr>`;
  });
}

document.getElementById('addPropertyBtn').addEventListener('click', () => {
  editingPropId = null;
  document.getElementById('propertyModalTitle').textContent = 'إضافة عقار جديد';
  document.getElementById('propertyForm').reset();
  document.getElementById('propId').value = '';
  document.getElementById('propMediaGroup').style.display = 'none';
  document.getElementById('existingMediaList').innerHTML = '';
  document.getElementById('propMediaPreview').innerHTML = '';
  openModal('propertyModal');
});

async function editProperty(id) {
  const res = await apiFetch(`/api/properties/${id}`);
  if (!res?.data) return;
  const p = res.data;
  editingPropId = id;
  document.getElementById('propertyModalTitle').textContent = 'تعديل العقار';
  document.getElementById('propId').value = p.id;
  document.getElementById('propTitle').value = p.title || '';
  document.getElementById('propLocation').value = p.location || '';
  document.getElementById('propPrice').value = p.price || '';
  document.getElementById('propArea').value = p.area || '';
  document.getElementById('propBedrooms').value = p.bedrooms || 0;
  document.getElementById('propBathrooms').value = p.bathrooms || 0;
  document.getElementById('propDesc').value = p.description || '';
  document.getElementById('propStatus').value = p.status || 'available';
  document.getElementById('propFeatured').checked = !!p.featured;
  document.getElementById('propMediaGroup').style.display = 'block';

  // Load existing media
  const existingList = document.getElementById('existingMediaList');
  existingList.innerHTML = '';
  if (p.media?.length) {
    existingList.innerHTML = '<div class="existing-media-title">الوسائط الحالية:</div>';
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.flexWrap = 'wrap'; row.style.gap = '8px';
    p.media.forEach(m => {
      const thumb = document.createElement('div');
      thumb.className = 'existing-thumb';
      thumb.innerHTML = m.type === 'image'
        ? `<img src="/uploads/${m.filename}" alt="" />`
        : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.5rem;background:var(--black-4)">🎬</div>`;
      thumb.innerHTML += `<button class="del-existing" onclick="deleteMedia(${m.id}, this.parentElement)">✕</button>`;
      row.appendChild(thumb);
    });
    existingList.appendChild(row);
  }
  openModal('propertyModal');
}

async function deleteProperty(id, title) {
  if (!confirm(`هل أنت متأكد من حذف "${title}"؟ سيتم حذف جميع الوسائط المرتبطة به.`)) return;
  const res = await apiFetch(`/api/properties/${id}`, { method: 'DELETE' });
  if (res?.success) { showToast('تم حذف العقار بنجاح', 'success'); loadProperties(); }
  else showToast(res?.message || 'حدث خطأ', 'error');
}

// Property form submit
document.getElementById('propertyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('savePropBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ الحفظ...';

  const body = {
    title: document.getElementById('propTitle').value,
    description: document.getElementById('propDesc').value,
    price: document.getElementById('propPrice').value,
    location: document.getElementById('propLocation').value,
    area: document.getElementById('propArea').value,
    bedrooms: document.getElementById('propBedrooms').value,
    bathrooms: document.getElementById('propBathrooms').value,
    status: document.getElementById('propStatus').value,
    featured: document.getElementById('propFeatured').checked ? 1 : 0
  };

  const id = document.getElementById('propId').value;
  const url = id ? `/api/properties/${id}` : '/api/properties';
  const method = id ? 'PUT' : 'POST';

  const res = await apiFetch(url, { method, body: JSON.stringify(body) });
  btn.disabled = false;
  btn.textContent = 'حفظ العقار';

  if (res?.success) {
    const savedId = res.data?.id || id;
    // Upload media files if any
    const files = document.getElementById('propMediaFiles').files;
    if (files.length > 0) {
      const fd = new FormData();
      fd.append('property_id', savedId);
      for (const f of files) fd.append('files', f);
      await apiFormData('/api/media/upload', 'POST', fd);
    }
    showToast(res.message, 'success');
    closeModal('propertyModal');
    loadProperties();
  } else {
    showToast(res?.message || 'حدث خطأ', 'error');
  }
});

// Property media upload zone
setupUploadZone('propUploadZone', 'propMediaFiles', 'propMediaPreview');

function managePropertyMedia(id, title) {
  editProperty(id);
}

// ========== MEDIA ==========
let allMedia = [];
let activeFilter = 'all';

async function loadMedia() {
  const res = await apiFetch('/api/media');
  if (!res) return;
  allMedia = res.data || [];
  renderMedia();
}

function renderMedia() {
  const grid = document.getElementById('mediaGrid');
  const filtered = activeFilter === 'all' ? allMedia : allMedia.filter(m => m.type === activeFilter);

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🖼️</span><p>لا توجد وسائط</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(m => `
    <div class="media-item" data-id="${m.id}">
      ${m.type === 'image'
        ? `<img class="media-thumb" src="/uploads/${m.filename}" alt="${m.original_name}" loading="lazy" />`
        : `<div class="media-thumb-video">🎬</div>`
      }
      <div class="media-info">
        <div class="media-name">${m.original_name || m.filename}</div>
        <span class="media-type-badge type-${m.type}">${m.type === 'image' ? '📷 صورة' : '🎬 فيديو'}</span>
      </div>
      <div class="media-overlay">
        <button class="overlay-btn overlay-replace" onclick="openReplace(${m.id})">🔄 استبدال</button>
        <button class="overlay-btn overlay-delete" onclick="deleteMedia(${m.id})">🗑️ حذف</button>
      </div>
    </div>
  `).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderMedia();
  });
});

async function deleteMedia(id, thumbEl) {
  if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
  const res = await apiFetch(`/api/media/${id}`, { method: 'DELETE' });
  if (res?.success) {
    showToast('تم حذف الملف بنجاح', 'success');
    if (thumbEl) thumbEl.remove();
    else { allMedia = allMedia.filter(m => m.id !== id); renderMedia(); }
  } else showToast(res?.message || 'حدث خطأ', 'error');
}

// Upload Modal
document.getElementById('uploadMediaBtn').addEventListener('click', async () => {
  // Load properties for select
  const res = await apiFetch('/api/properties');
  const sel = document.getElementById('uploadPropertySelect');
  sel.innerHTML = '<option value="">— بدون ربط بعقار —</option>';
  res?.data?.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.title}</option>`);
  document.getElementById('mainMediaPreview').innerHTML = '';
  document.getElementById('mainMediaFiles').value = '';
  document.getElementById('doUploadBtn').disabled = true;
  document.getElementById('uploadProgress').style.display = 'none';
  openModal('uploadModal');
});

setupUploadZone('mainUploadZone', 'mainMediaFiles', 'mainMediaPreview', () => {
  document.getElementById('doUploadBtn').disabled = document.getElementById('mainMediaFiles').files.length === 0;
});

document.getElementById('doUploadBtn').addEventListener('click', async () => {
  const files = document.getElementById('mainMediaFiles').files;
  const propertyId = document.getElementById('uploadPropertySelect').value;
  if (!files.length) return;

  const btn = document.getElementById('doUploadBtn');
  btn.disabled = true;
  const progress = document.getElementById('uploadProgress');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  progress.style.display = 'block';

  const fd = new FormData();
  if (propertyId) fd.append('property_id', propertyId);
  for (const f of files) fd.append('files', f);

  // Simulate progress
  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + 10, 85);
    fill.style.width = pct + '%';
  }, 200);

  text.textContent = 'جارٍ رفع الملفات...';
  const res = await apiFormData('/api/media/upload', 'POST', fd);
  clearInterval(interval);
  fill.style.width = '100%';

  if (res?.success) {
    text.textContent = res.message;
    showToast(res.message, 'success');
    setTimeout(() => { closeModal('uploadModal'); loadMedia(); }, 1000);
  } else {
    showToast(res?.message || 'فشل رفع الملفات', 'error');
    btn.disabled = false;
  }
});

// Replace Modal
function openReplace(id) {
  document.getElementById('replaceMediaId').value = id;
  document.getElementById('replaceFile').value = '';
  document.getElementById('replacePreview').innerHTML = '';
  document.getElementById('doReplaceBtn').disabled = true;
  openModal('replaceModal');
}

setupUploadZone('replaceUploadZone', 'replaceFile', 'replacePreview', () => {
  document.getElementById('doReplaceBtn').disabled = !document.getElementById('replaceFile').files.length;
});

document.getElementById('doReplaceBtn').addEventListener('click', async () => {
  const id = document.getElementById('replaceMediaId').value;
  const file = document.getElementById('replaceFile').files[0];
  if (!file) return;

  const btn = document.getElementById('doReplaceBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ الاستبدال...';

  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFormData(`/api/media/${id}/replace`, 'PUT', fd);
  btn.disabled = false;
  btn.textContent = 'استبدال';

  if (res?.success) {
    showToast('تم استبدال الملف بنجاح', 'success');
    closeModal('replaceModal');
    loadMedia();
  } else showToast(res?.message || 'فشل الاستبدال', 'error');
});

// ========== CONTENT ==========
async function loadContent() {
  const res = await apiFetch('/api/content');
  if (!res?.data) return;
  const data = res.data;
  Object.entries(data).forEach(([key, val]) => {
    const el = document.getElementById(`c-${key}`);
    if (el) el.value = val || '';
  });
}

document.getElementById('saveContentBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveContentBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ الحفظ...';

  const keys = ['hero_title','hero_subtitle','hero_cta','about_title','about_text','contact_phone','contact_email','contact_address','stats_projects','stats_clients','stats_years','footer_text'];
  const updates = {};
  keys.forEach(k => {
    const el = document.getElementById(`c-${k}`);
    if (el) updates[k] = el.value;
  });

  const res = await apiFetch('/api/content', { method: 'PUT', body: JSON.stringify(updates) });
  btn.disabled = false;
  btn.textContent = '💾 حفظ التغييرات';

  if (res?.success) showToast('تم حفظ المحتوى بنجاح ✅', 'success');
  else showToast(res?.message || 'حدث خطأ', 'error');
});

// ========== SETTINGS ==========
document.getElementById('changePassForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  const msg = document.getElementById('passMsg');

  if (newPass !== confirmPass) {
    msg.textContent = 'كلمتا المرور غير متطابقتين';
    msg.className = 'pass-msg error';
    msg.style.display = 'block';
    return;
  }

  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: document.getElementById('currentPass').value, newPassword: newPass })
  });

  msg.textContent = res?.message || 'حدث خطأ';
  msg.className = `pass-msg ${res?.success ? 'success' : 'error'}`;
  msg.style.display = 'block';
  if (res?.success) document.getElementById('changePassForm').reset();
});

// ========== UPLOAD ZONE HELPER ==========
function setupUploadZone(zoneId, inputId, previewId, onChange) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const dt = new DataTransfer();
    for (const f of e.dataTransfer.files) dt.items.add(f);
    input.files = dt.files;
    showPreviews(input, previewId);
    if (onChange) onChange();
  });
  input.addEventListener('change', () => { showPreviews(input, previewId); if (onChange) onChange(); });
}

function showPreviews(input, previewId) {
  const preview = document.getElementById(previewId);
  preview.innerHTML = '';
  for (const file of input.files) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      item.appendChild(img);
    } else {
      const div = document.createElement('div');
      div.className = 'preview-video-icon';
      div.textContent = '🎬';
      item.appendChild(div);
    }
    preview.appendChild(item);
  }
}

// ========== INIT ==========
loadOverview();
