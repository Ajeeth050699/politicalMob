const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Complaint = require('../models/complaintModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { findWard } = require('../constants/wards');

// GET /api/workers
router.get('/', protect, asyncHandler(async (req, res) => {
  const { district, search } = req.query;
  let filter = { role: { $in: ['worker', 'agent'] } };
  if (req.user.role === 'admin' && req.user.district) filter.district = req.user.district;
  if (district && district !== 'ALL') filter.district = district;
  let workers = await User.find(filter).select('-password');
  if (search) {
    const s = search.toLowerCase();
    workers = workers.filter((w) =>
      w.name.toLowerCase().includes(s) ||
      (w.ward || w.thokuthi || '').toLowerCase().includes(s) ||
      (w.district || '').toLowerCase().includes(s)
    );
  }
  const enriched = await Promise.all(workers.map(async (w) => {
    const resolved = await Complaint.countDocuments({ assignedWorker: w._id, status: 'COMPLETED' });
    const pending  = await Complaint.countDocuments({ assignedWorker: w._id, status: { $ne: 'COMPLETED' } });
    return {
      id: w._id, name: w.name, email: w.email, phone: w.phone,
      role: w.role,
      ward: w.ward,
      wardNo: w.wardNo,
      thokuthi: w.thokuthi, district: w.district,
      pincode: w.pincode,
      address: w.address,
      profilePhoto: w.profilePhoto,
      status: w.isActive ? 'active' : 'inactive',
      resolved, pending, rating: 4.5,
    };
  }));
  res.json(enriched);
}));

// POST /api/workers
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, email, phone, password, ward, wardNo, thokuthi, district, pincode, address, profilePhoto, role } = req.body;
  const matchedWard = findWard(ward || thokuthi);
  if (!matchedWard) { res.status(400); throw new Error('Valid Tamil Nadu assembly constituency/ward is required'); }
  if (!wardNo) { res.status(400); throw new Error('Ward number is required'); }
  const workerRole = role === 'agent' ? 'agent' : 'worker';
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }
  const worker = await User.create({
    name, email, phone, password,
    role: workerRole,
    ward: matchedWard.name,
    wardNo: Number(wardNo),
    thokuthi: matchedWard.name,
    district,
    pincode,
    address,
    profilePhoto,
  });
  res.status(201).json({ _id: worker._id, name: worker.name, email: worker.email, role: worker.role, ward: worker.ward, wardNo: worker.wardNo, thokuthi: worker.thokuthi, district: worker.district, pincode: worker.pincode });
}));

// PUT /api/workers/:id
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const worker = await User.findById(req.params.id);
  if (!worker || !['worker', 'agent'].includes(worker.role)) { res.status(404); throw new Error('Worker not found'); }
  worker.name     = req.body.name     || worker.name;
  worker.phone    = req.body.phone    || worker.phone;
  if (req.body.ward || req.body.thokuthi) {
    const matchedWard = findWard(req.body.ward || req.body.thokuthi);
    if (!matchedWard) { res.status(400); throw new Error('Valid Tamil Nadu assembly constituency/ward is required'); }
    worker.ward = matchedWard.name;
    worker.thokuthi = matchedWard.name;
  }
  worker.wardNo   = req.body.wardNo !== undefined ? Number(req.body.wardNo) : worker.wardNo;
  worker.district = req.body.district || worker.district;
  worker.pincode  = req.body.pincode  || worker.pincode;
  worker.address  = req.body.address  || worker.address;
  worker.profilePhoto = req.body.profilePhoto || worker.profilePhoto;
  worker.role     = req.body.role === 'agent' ? 'agent' : (req.body.role === 'worker' ? 'worker' : worker.role);
  worker.isActive = req.body.isActive !== undefined ? req.body.isActive : worker.isActive;
  const updated = await worker.save();
  res.json({ _id: updated._id, name: updated.name, role: updated.role, ward: updated.ward, wardNo: updated.wardNo, thokuthi: updated.thokuthi, district: updated.district, pincode: updated.pincode, isActive: updated.isActive });
}));

// DELETE /api/workers/:id
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Worker removed' });
}));

module.exports = router;
