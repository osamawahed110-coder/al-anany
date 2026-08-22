const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'alanani-super-secret-key-2024';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const user = db.findOne('users', u => u.username === username);

  if (!user) {
    return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth'), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);

  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.update('users', user.id, { password_hash: newHash });

  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

// GET /api/auth/verify
router.get('/verify', require('../middleware/auth'), (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
