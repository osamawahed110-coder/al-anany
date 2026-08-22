// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// ===== MOBILE MENU =====
document.getElementById('navHamburger').addEventListener('click', () => {
  document.getElementById('navMobileMenu').classList.toggle('open');
});

// ===== PARTICLES =====
const particlesContainer = document.getElementById('heroParticles');
for (let i = 0; i < 25; i++) {
  const p = document.createElement('div');
  p.className = 'hero-particle';
  const size = 1 + Math.random() * 3;
  p.style.cssText = `
    left: ${Math.random() * 100}%;
    width: ${size}px; height: ${size}px;
    background: rgba(201,168,76,${0.3 + Math.random() * 0.4});
    animation-duration: ${10 + Math.random() * 15}s;
    animation-delay: ${Math.random() * 10}s;
  `;
  particlesContainer.appendChild(p);
}

// ===== LOAD CONTENT =====
async function loadSiteContent() {
  try {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (!data.success) return;
    const c = data.data;

    if (c.hero_title) document.getElementById('heroTitle').textContent = c.hero_title;
    if (c.hero_subtitle) document.getElementById('heroSubtitle').textContent = c.hero_subtitle;
    if (c.hero_cta) document.getElementById('heroCta').textContent = c.hero_cta;
    if (c.about_title) document.getElementById('aboutTitle').textContent = c.about_title;
    if (c.about_text) document.getElementById('aboutText').textContent = c.about_text;
    if (c.contact_phone) { const el = document.getElementById('contactPhone'); el.textContent = c.contact_phone; el.href = `tel:${c.contact_phone}`; }
    if (c.contact_email) { const el = document.getElementById('contactEmail'); el.textContent = c.contact_email; el.href = `mailto:${c.contact_email}`; }
    if (c.contact_address) document.getElementById('contactAddress').textContent = c.contact_address;
    if (c.footer_text) document.getElementById('footerText').textContent = c.footer_text;
    if (c.stats_projects) document.getElementById('statsProjects').textContent = c.stats_projects;
    if (c.stats_clients) document.getElementById('statsClients').textContent = c.stats_clients;
    if (c.stats_years) document.getElementById('statsYears').textContent = c.stats_years;
  } catch (err) { console.log('Could not load content'); }
}

// ===== LOAD PROPERTIES =====
let allProperties = [];
let currentFilter = 'all';

async function loadProperties() {
  try {
    const res = await fetch('/api/properties');
    const data = await res.json();
    allProperties = data.data || [];
    renderProperties();
  } catch (err) {
    document.getElementById('propsGrid').innerHTML = '<div class="loading-spinner">تعذّر تحميل العقارات</div>';
  }
}

function renderProperties() {
  const grid = document.getElementById('propsGrid');
  const filtered = currentFilter === 'all'
    ? allProperties
    : allProperties.filter(p => p.status === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '<div class="loading-spinner">لا توجد عقارات في هذه الفئة</div>';
    return;
  }

  const statusMap = { available: 'متاح', sold: 'مباع', reserved: 'محجوز' };
  const tagMap = { available: 'tag-available', sold: 'tag-sold', reserved: 'tag-reserved' };

  grid.innerHTML = filtered.map(p => {
    const firstImage = p.media?.find(m => m.type === 'image');
    const thumbHtml = firstImage
      ? `<img src="/uploads/${firstImage.filename}" alt="${p.title}" loading="lazy" />`
      : `🏠`;
    return `
      <div class="prop-card-main" onclick="openPropModal(${p.id})">
        <div class="prop-thumb">
          ${thumbHtml}
          <span class="prop-status-tag ${tagMap[p.status] || 'tag-available'}">${statusMap[p.status] || p.status}</span>
        </div>
        <div class="prop-body">
          <div class="prop-title-main">${p.title}</div>
          <div class="prop-loc">📍 ${p.location || 'غير محدد'}</div>
          <div class="prop-meta">
            ${p.area ? `<span class="prop-meta-item">📐 ${p.area}</span>` : ''}
            ${p.bedrooms ? `<span class="prop-meta-item">🛏️ ${p.bedrooms} غرفة</span>` : ''}
            ${p.bathrooms ? `<span class="prop-meta-item">🚿 ${p.bathrooms} حمام</span>` : ''}
          </div>
          <div class="prop-price-main">${p.price ? p.price + ' ج.م' : 'السعر عند التواصل'}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Property filter
document.querySelectorAll('.prop-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.prop-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProperties();
  });
});

// ===== PROPERTY MODAL =====
async function openPropModal(id) {
  const prop = allProperties.find(p => p.id === id);
  if (!prop) return;
  const overlay = document.getElementById('propModalOverlay');
  const content = document.getElementById('propModalContent');
  const statusMap = { available: 'متاح', sold: 'مباع', reserved: 'محجوز' };

  const images = prop.media?.filter(m => m.type === 'image') || [];
  const firstImage = images[0];

  content.innerHTML = `
    ${firstImage ? `<img class="modal-prop-img" src="/uploads/${firstImage.filename}" alt="${prop.title}" />` : `<div class="modal-prop-img" style="display:flex;align-items:center;justify-content:center;font-size:4rem;">🏠</div>`}
    <div class="modal-prop-title">${prop.title}</div>
    <div class="modal-prop-loc">📍 ${prop.location || 'غير محدد'}</div>
    <div class="modal-prop-price">${prop.price ? prop.price + ' ج.م' : 'السعر عند التواصل'}</div>
    ${prop.description ? `<div class="modal-prop-desc">${prop.description}</div>` : ''}
    <div class="modal-prop-meta">
      ${prop.area ? `<div class="modal-meta-item"><span class="modal-meta-val">📐 ${prop.area}</span><span class="modal-meta-lbl">المساحة</span></div>` : ''}
      ${prop.bedrooms ? `<div class="modal-meta-item"><span class="modal-meta-val">🛏️ ${prop.bedrooms}</span><span class="modal-meta-lbl">غرف نوم</span></div>` : ''}
      ${prop.bathrooms ? `<div class="modal-meta-item"><span class="modal-meta-val">🚿 ${prop.bathrooms}</span><span class="modal-meta-lbl">حمامات</span></div>` : ''}
      <div class="modal-meta-item"><span class="modal-meta-val">${statusMap[prop.status] || prop.status}</span><span class="modal-meta-lbl">الحالة</span></div>
    </div>
    ${images.length > 1 ? `
      <div class="modal-gallery" style="margin-top:16px;">
        ${images.map(m => `<img class="modal-gallery-img" src="/uploads/${m.filename}" alt="" />`).join('')}
      </div>
    ` : ''}
  `;
  overlay.classList.add('open');
}

document.getElementById('propModalClose').addEventListener('click', () => {
  document.getElementById('propModalOverlay').classList.remove('open');
});
document.getElementById('propModalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('propModalOverlay')) {
    document.getElementById('propModalOverlay').classList.remove('open');
  }
});

// ===== ADMIN AUTH CHECK =====
async function checkAdminAuth() {
  const token = localStorage.getItem('alanani_token');
  if (!token) return;

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('navCta').style.display = 'inline-block';
      document.getElementById('mobileNavCta').style.display = 'block';
    }
  } catch (err) {
    console.error('Auth verification failed', err);
  }
}

// ===== INIT =====
loadSiteContent();
loadProperties();
checkAdminAuth();

