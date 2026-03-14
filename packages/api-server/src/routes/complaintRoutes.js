const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Complaint = require('../models/complaintModel');
const User = require('../models/userModel');
const { protect, adminOnly, workerOrAdmin } = require('../middleware/authMiddleware');

// GET /api/complaints
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, district, booth, category } = req.query;
  let filter = {};
  if (req.user.role === 'public') filter.user = req.user._id;
  if (req.user.role === 'worker') filter.assignedWorker = req.user._id;
  if (status   && status   !== 'ALL') filter.status   = status;
  if (district && district !== 'ALL') filter.district = district;
  if (booth)    filter.booth    = booth;
  if (category) filter.category = category;

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name');

  res.json(complaints.map((c) => ({
    id: c._id, category: c.category, description: c.description,
    user: c.user?.name || 'Unknown', userPhone: c.user?.phone,
    booth: c.booth, district: c.district, priority: c.priority,
    status: c.status, assignedWorker: c.assignedWorker?.name,
    proofPhoto: c.proofPhoto, time: c.createdAt,
  })));
}));

// POST /api/complaints
router.post('/', protect, asyncHandler(async (req, res) => {
  const { category, description, booth, district, location } = req.body;
  const worker = await User.findOne({ role: 'worker', booth: booth || req.user.booth, isActive: true });
  const complaint = await Complaint.create({
    user: req.user._id, category, description,
    booth: booth || req.user.booth, district: district || req.user.district,
    assignedWorker: worker?._id, location,
  });
  res.status(201).json(complaint);
}));

// GET /api/complaints/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name phone address')
    .populate('assignedWorker', 'name phone');
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  res.json(complaint);
}));

// PUT /api/complaints/:id/status
router.put('/:id/status', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  complaint.status   = req.body.status   || complaint.status;
  complaint.priority = req.body.priority || complaint.priority;
  if (req.body.assignedWorker) complaint.assignedWorker = req.body.assignedWorker;
  res.json(await complaint.save());
}));

// PUT /api/complaints/:id/proof
router.put('/:id/proof', protect, workerOrAdmin, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  complaint.proofPhoto = req.body.photoUrl;
  complaint.status     = 'COMPLETED';
  res.json(await complaint.save());
}));

// DELETE /api/complaints/:id
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Complaint.findByIdAndDelete(req.params.id);
  res.json({ message: 'Complaint deleted' });
}));

module.exports = router;
