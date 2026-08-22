const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// GET /api/content - public
router.get('/', (req, res) => {
  const content = db.getContent();
  res.json({ success: true, data: content });
});

// PUT /api/content - protected (bulk update)
router.put('/', auth, (req, res) => {
  const updates = req.body;

  if (typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, message: 'بيانات غير صحيحة' });
  }

  db.setContent(updates);
  res.json({ success: true, message: 'تم تحديث المحتوى بنجاح' });
});

// GET /api/content/stats - protected
router.get('/stats', auth, (req, res) => {
  const properties = db.find('properties');
  const media = db.find('media');

  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const totalMedia = media.length;
  const totalImages = media.filter(m => m.type === 'image').length;
  const totalVideos = media.filter(m => m.type === 'video').length;

  res.json({
    success: true,
    data: {
      totalProperties,
      availableProperties,
      totalMedia,
      totalImages,
      totalVideos
    }
  });
});

module.exports = router;
