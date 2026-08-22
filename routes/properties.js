const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// GET /api/properties - public
router.get('/', (req, res) => {
  const { featured, status } = req.query;
  
  let properties = db.find('properties');

  if (featured === '1') {
    properties = properties.filter(p => p.featured === true || p.featured === 1);
  }
  if (status) {
    properties = properties.filter(p => p.status === status);
  }

  // Sort by created_at desc (newest first)
  properties.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const result = properties.map(p => {
    const media = db.find('media', m => m.property_id === p.id);
    const images = media.filter(m => m.type === 'image').map(m => m.filename);
    return {
      ...p,
      images,
      media
    };
  });

  res.json({ success: true, data: result });
});

// GET /api/properties/:id - public
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const property = db.findOne('properties', p => p.id === id);
  if (!property) return res.status(404).json({ success: false, message: 'العقار غير موجود' });

  const media = db.find('media', m => m.property_id === id);
  res.json({ success: true, data: { ...property, media } });
});

// POST /api/properties - protected
router.post('/', auth, (req, res) => {
  const { title, description, price, location, area, bedrooms, bathrooms, status, featured } = req.body;

  if (!title) return res.status(400).json({ success: false, message: 'عنوان العقار مطلوب' });

  const newProp = db.insert('properties', {
    title,
    description: description || '',
    price: price || '',
    location: location || '',
    area: area || '',
    bedrooms: parseInt(bedrooms) || 0,
    bathrooms: parseInt(bathrooms) || 0,
    status: status || 'available',
    featured: featured === 1 || featured === true
  });

  res.status(201).json({ success: true, message: 'تم إضافة العقار بنجاح', data: newProp });
});

// PUT /api/properties/:id - protected
router.put('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, price, location, area, bedrooms, bathrooms, status, featured } = req.body;
  const existing = db.findOne('properties', p => p.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'العقار غير موجود' });

  const updated = db.update('properties', id, {
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    price: price !== undefined ? price : existing.price,
    location: location !== undefined ? location : existing.location,
    area: area !== undefined ? area : existing.area,
    bedrooms: bedrooms !== undefined ? parseInt(bedrooms) || 0 : existing.bedrooms,
    bathrooms: bathrooms !== undefined ? parseInt(bathrooms) || 0 : existing.bathrooms,
    status: status !== undefined ? status : existing.status,
    featured: featured !== undefined ? (featured === 1 || featured === true) : existing.featured
  });

  res.json({ success: true, message: 'تم تحديث العقار بنجاح', data: updated });
});

// DELETE /api/properties/:id - protected
router.delete('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.findOne('properties', p => p.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'العقار غير موجود' });

  // Delete associated media files
  const mediaFiles = db.find('media', m => m.property_id === id);
  const fs = require('fs');
  const path = require('path');
  for (const m of mediaFiles) {
    const filePath = path.join(__dirname, '../uploads', m.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  // Delete media records
  db.delete('media', m => m.property_id === id);

  // Delete property record
  db.delete('properties', p => p.id === id);
  
  res.json({ success: true, message: 'تم حذف العقار بنجاح' });
});

module.exports = router;
