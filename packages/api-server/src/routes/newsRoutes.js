const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const News = require('../models/newsModel');
const { Camp } = require('../models/otherModels');
const { protect, adminOnly, workerOrAdmin } = require('../middleware/authMiddleware');

// GET /api/news
router.get('/', protect, asyncHandler(async (req, res) => {
  const { level, district, booth } = req.query;
  let filter = { status: 'published' };
  if (level)    filter.level    = level;
  if (district) filter.district = district;
  if (booth)    filter.booth    = booth;
  const news = await News.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json(news.map((n) => ({
    id: n._id, title: n.title, description: n.description,
    level: n.level, status: n.status,
    date: n.createdAt.toLocaleDateString('en-IN'),
    imageUrl: n.imageUrl,
  })));
}));

// POST /api/news
router.post('/', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const news = await News.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(news);
}));

// PUT /api/news/:id
router.put('/:id', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!news) { res.status(404); throw new Error('News not found'); }
  res.json(news);
}));

// DELETE /api/news/:id
router.delete('/:id', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ message: 'News deleted' });
}));

// GET /api/news/camps
router.get('/camps', protect, asyncHandler(async (req, res) => {
  const camps = await Camp.find().sort({ date: 1 });
  res.json(camps.map((c) => ({
    id: c._id, name: c.name, type: c.type, location: c.location,
    district: c.district, date: c.date.toLocaleDateString('en-IN'),
    slots: c.slots, status: c.status,
  })));
}));

// POST /api/news/camps
router.post('/camps', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const camp = await Camp.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(camp);
}));

// PUT /api/news/camps/:id
router.put('/camps/:id', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const camp = await Camp.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!camp) { res.status(404); throw new Error('Camp not found'); }
  res.json(camp);
}));

// DELETE /api/news/camps/:id
router.delete('/camps/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Camp.findByIdAndDelete(req.params.id);
  res.json({ message: 'Camp deleted' });
}));

module.exports = router;
