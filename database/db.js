/**
 * JSON-based database — no native modules required
 * Data is stored in database/data.json (auto-created)
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data.json');

// ===== DEFAULT DATA STRUCTURE =====
const DEFAULT_DATA = {
  users: [],
  properties: [],
  media: [],
  site_content: {},
  _counters: { users: 0, properties: 0, media: 0 }
};

// ===== READ / WRITE =====
function readDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeDB(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('DB read error:', e);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ===== QUERY HELPERS =====
const db = {
  // Generic find
  find(table, predicate) {
    const data = readDB();
    const rows = data[table] || [];
    return predicate ? rows.filter(predicate) : rows;
  },
  findOne(table, predicate) {
    return this.find(table, predicate)[0] || null;
  },

  // Insert
  insert(table, record) {
    const data = readDB();
    if (!data[table]) data[table] = [];
    if (!data._counters) data._counters = {};
    data._counters[table] = (data._counters[table] || 0) + 1;
    const newRecord = { id: data._counters[table], created_at: new Date().toISOString(), ...record };
    data[table].push(newRecord);
    writeDB(data);
    return newRecord;
  },

  // Update
  update(table, id, updates) {
    const data = readDB();
    const idx = (data[table] || []).findIndex(r => r.id === id);
    if (idx === -1) return null;
    data[table][idx] = { ...data[table][idx], ...updates, updated_at: new Date().toISOString() };
    writeDB(data);
    return data[table][idx];
  },

  // Delete
  delete(table, predicate) {
    const data = readDB();
    const before = (data[table] || []).length;
    data[table] = (data[table] || []).filter(r => !predicate(r));
    writeDB(data);
    return before - data[table].length;
  },

  // Content (key-value)
  getContent() {
    return readDB().site_content || {};
  },
  setContent(updates) {
    const data = readDB();
    data.site_content = { ...data.site_content, ...updates };
    writeDB(data);
  }
};

// ===== SEED DATA =====
function seedData() {
  const data = readDB();

  // Seed admin user
  if (!data.users || data.users.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.insert('users', { username: 'admin', password_hash: hash, role: 'admin' });
    console.log('✅ Default admin created: admin / admin123');
  }

  // Seed site content
  const defaults = {
    hero_title: 'العناني للتسويق العقاري',
    hero_subtitle: 'نجد لك البيت الذي تحلم به بأفضل الأسعار وأعلى المعايير',
    hero_cta: 'اكتشف العقارات',
    about_title: 'من نحن',
    about_text: 'شركة العناني للتسويق العقاري هي شركة رائدة في مجال العقارات، نقدم أفضل الفرص الاستثمارية والسكنية بخبرة تمتد لسنوات طويلة في السوق العقاري.',
    contact_phone: '01000000000',
    contact_email: 'info@alanani.com',
    contact_address: 'القاهرة، مصر',
    footer_text: 'جميع الحقوق محفوظة © 2024 العناني للتسويق العقاري',
    stats_projects: '500+',
    stats_clients: '1200+',
    stats_years: '15+'
  };
  const existing = db.getContent();
  const merged = { ...defaults, ...existing };
  db.setContent(merged);

  // Seed sample properties
  const freshData = readDB();
  if (!freshData.properties || freshData.properties.length === 0) {
    db.insert('properties', { title: 'شقة فاخرة بالتجمع الخامس', description: 'شقة راقية بتشطيبات سوبر لوكس، 3 غرف نوم، صالة واسعة', price: '3,500,000', location: 'التجمع الخامس، القاهرة', area: '180 م²', bedrooms: 3, bathrooms: 2, status: 'available', featured: true });
    db.insert('properties', { title: 'فيلا مودرن بالشيخ زايد', description: 'فيلا مستقلة بحديقة خاصة وحمام سباحة، تشطيبات فاخرة', price: '12,000,000', location: 'الشيخ زايد، الجيزة', area: '450 م²', bedrooms: 5, bathrooms: 4, status: 'available', featured: true });
    db.insert('properties', { title: 'محل تجاري بالمعادي', description: 'محل تجاري في موقع استراتيجي بالمعادي القاهرة', price: '2,200,000', location: 'المعادي، القاهرة', area: '85 م²', bedrooms: 0, bathrooms: 1, status: 'available', featured: false });
    console.log('✅ Sample properties created');
  }
}

seedData();

module.exports = db;
