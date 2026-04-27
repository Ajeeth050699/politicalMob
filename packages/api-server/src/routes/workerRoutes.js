const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Complaint = require('../models/complaintModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/workers
router.get('/', protect, asyncHandler(async (req, res) => {
  const { district, search } = req.query;
  let filter = { role: 'worker' };
  if (req.user.role === 'admin' && req.user.district) filter.district = req.user.district;
  if (district && district !== 'ALL') filter.district = district;
  let workers = await User.find(filter).select('-password');
  if (search) {
    const s = search.toLowerCase();
    workers = workers.filter((w) =>
      w.name.toLowerCase().includes(s) ||
      (w.booth || '').toLowerCase().includes(s) ||
      (w.district || '').toLowerCase().includes(s)
    );
  }
  const enriched = await Promise.all(workers.map(async (w) => {
    const resolved = await Complaint.countDocuments({ assignedWorker: w._id, status: 'COMPLETED' });
    const pending  = await Complaint.countDocuments({ assignedWorker: w._id, status: { $ne: 'COMPLETED' } });
    return {
      id: w._id, name: w.name, email: w.email, phone: w.phone,
      booth: w.booth, district: w.district,
      status: w.isActive ? 'active' : 'inactive',
      resolved, pending, rating: 4.5,
    };
  }));
  res.json(enriched);
}));

// POST /api/workers
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, email, phone, password, booth, district } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }
  const worker = await User.create({ name, email, phone, password, role: 'worker', booth, district });
  res.status(201).json({ _id: worker._id, name: worker.name, email: worker.email, booth: worker.booth, district: worker.district });
}));

// PUT /api/workers/:id
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const worker = await User.findById(req.params.id);
  if (!worker || worker.role !== 'worker') { res.status(404); throw new Error('Worker not found'); }
  worker.name     = req.body.name     || worker.name;
  worker.phone    = req.body.phone    || worker.phone;
  worker.booth    = req.body.booth    || worker.booth;
  worker.district = req.body.district || worker.district;
  worker.isActive = req.body.isActive !== undefined ? req.body.isActive : worker.isActive;
  const updated = await worker.save();
  res.json({ _id: updated._id, name: updated.name, booth: updated.booth, district: updated.district, isActive: updated.isActive });
}));

// DELETE /api/workers/:id
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Worker removed' });
}));

module.exports = router;
