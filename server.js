const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize DB (runs migrations and seeds)
require('./database/db');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/media', require('./routes/media'));
app.use('/api/content', require('./routes/content'));

// SPA fallback
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'خطأ في الخادم' });
});

app.listen(PORT, () => {
  console.log(`\n🏢 العناني للتسويق العقاري`);
  console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
  console.log(`📊 لوحة التحكم: http://localhost:${PORT}/login`);
  console.log(`👤 المستخدم: admin | كلمة المرور: admin123\n`);
});

module.exports = app;
