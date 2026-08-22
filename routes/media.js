const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const auth = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4|mov|avi|mkv|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedImages.test(ext) || allowedVideos.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// POST /api/media/upload - protected
router.post('/upload', auth, upload.array('files', 10), (req, res) => {
  const property_id = req.body.property_id ? parseInt(req.body.property_id) : null;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملفات' });
  }

  const inserted = [];
  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const type = /mp4|mov|avi|mkv|webm/.test(ext) ? 'video' : 'image';
    
    const newMedia = db.insert('media', {
      property_id,
      type,
      filename: file.filename,
      original_name: file.originalname
    });

    inserted.push({
      ...newMedia,
      url: `/uploads/${file.filename}`
    });
  }

  res.status(201).json({ success: true, message: `تم رفع ${inserted.length} ملف بنجاح`, data: inserted });
});

// GET /api/media - protected (all media)
router.get('/', auth, (req, res) => {
  const property_id = req.query.property_id ? parseInt(req.query.property_id) : null;
  const { type } = req.query;

  let media = db.find('media');

  if (property_id !== null) {
    media = media.filter(m => m.property_id === property_id);
  }
  if (type) {
    media = media.filter(m => m.type === type);
  }

  // Sort by created_at desc
  media.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const result = media.map(m => ({ ...m, url: `/uploads/${m.filename}` }));

  res.json({ success: true, data: result });
});

// DELETE /api/media/:id - protected
router.delete('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const media = db.findOne('media', m => m.id === id);
  if (!media) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

  const filePath = path.join(__dirname, '../uploads', media.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.delete('media', m => m.id === id);
  res.json({ success: true, message: 'تم حذف الملف بنجاح' });
});

// PUT /api/media/:id/replace - protected (replace a file)
router.put('/:id/replace', auth, upload.single('file'), (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.findOne('media', m => m.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع ملف' });

  // Delete old file
  const oldPath = path.join(__dirname, '../uploads', existing.filename);
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  const type = /mp4|mov|avi|mkv|webm/.test(ext) ? 'video' : 'image';

  const updated = db.update('media', id, {
    filename: req.file.filename,
    original_name: req.file.originalname,
    type
  });

  res.json({ success: true, message: 'تم استبدال الملف بنجاح', data: { ...updated, url: `/uploads/${updated.filename}` } });
});

module.exports = router;
