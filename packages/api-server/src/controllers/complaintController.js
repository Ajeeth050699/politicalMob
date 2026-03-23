const asyncHandler = require('express-async-handler');
const Complaint    = require('../models/complaintModel');
const User         = require('../models/userModel');

// ── In-app notification helper ─────────────────────────────────────
const notify = async (userId, msg, type = 'complaint') => {
  try {
    const Notification = require('../models/Other');
    await Notification.create({ user: userId, msg, type });
  } catch {}
};

// ── Format complaint for response ─────────────────────────────────
const fmt = (c) => ({
  id:               c._id,
  category:         c.category,
  description:      c.description,
  user:             c.user?.name    || 'Unknown',
  userId:           c.user?._id,
  userPhone:        c.user?.phone,
  booth:            c.booth,
  district:         c.district,
  pincode:          c.pincode,
  priority:         c.priority,
  status:           c.status,
  assignedWorker:   c.assignedWorker?.name,
  assignedWorkerId: c.assignedWorker?._id,
  lockedToAgent:    c.lockedToAgent,
  acceptedAt:       c.acceptedAt,
  proofPhoto:       c.proofPhoto,
  proofVideo:       c.proofVideo,
  attachments:      c.attachments   || [],
  fallbackUsed:     c.fallbackUsed,
  escalatedToAdmin: c.escalatedToAdmin,
  time:             c.createdAt,
});

// ─────────────────────────────────────────────────────────────────
// GET /api/complaints
// public → own | worker → booth + pincode fallback + escalated | admin → all
// ─────────────────────────────────────────────────────────────────
const getComplaints = asyncHandler(async (req, res) => {
  const { status, district, booth, category } = req.query;
  let filter = {};

  if (req.user.role === 'public') {
    filter.user = req.user._id;

  } else if (req.user.role === 'worker') {
    const orConditions = [
      { booth: req.user.booth },
      { escalatedToAdmin: true },
    ];
    if (req.user.pincode) {
      orConditions.push({ pincode: req.user.pincode, fallbackUsed: true });
    }
    filter.$or = orConditions;
  }
  // admin: no filter

  if (status   && status   !== 'ALL') filter.status   = status;
  if (district && district !== 'ALL') filter.district = district;
  if (booth    && req.user.role === 'admin') filter.booth = booth;
  if (category) filter.category = category;

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user',           'name phone')
    .populate('assignedWorker', 'name phone');

  res.json(complaints.map(fmt));
});

// ─────────────────────────────────────────────────────────────────
// POST /api/complaints
// Smart routing: booth → pincode → district → escalate to admin
// ─────────────────────────────────────────────────────────────────
const createComplaint = asyncHandler(async (req, res) => {
  const {
    category, description, booth, district,
    pincode, address, location, attachments,
  } = req.body;

  const userBooth    = booth    || req.user.booth;
  const userPincode  = pincode  || req.user.pincode;
  const userDistrict = district || req.user.district;

  let agents       = [];
  let fallbackUsed = false;

  // 1. Same booth
  agents = await User.find({ role: 'worker', booth: userBooth, isActive: true });

  // 2. Same pincode fallback
  if (agents.length === 0 && userPincode) {
    agents = await User.find({ role: 'worker', pincode: userPincode, isActive: true });
    if (agents.length > 0) fallbackUsed = true;
  }

  // 3. Same district fallback
  if (agents.length === 0) {
    agents = await User.find({ role: 'worker', district: userDistrict, isActive: true });
    if (agents.length > 0) fallbackUsed = true;
  }

  const escalateImmediately = agents.length === 0;

  const complaint = await Complaint.create({
    user:             req.user._id,
    category,
    description,
    booth:            userBooth,
    district:         userDistrict,
    pincode:          userPincode,
    address,
    location,
    attachments:      attachments || [],
    fallbackUsed,
    escalatedToAdmin: escalateImmediately,
    escalatedAt:      escalateImmediately ? new Date() : undefined,
  });

  // Notify all available agents
  for (const agent of agents) {
    await notify(
      agent._id,
      `🆕 New complaint in your ${fallbackUsed ? 'nearby area' : 'booth'}: ${category}`,
      'complaint'
    );
  }

  // Escalate to admins if no agents found
  if (escalateImmediately) {
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await notify(admin._id, `⚠️ No agents for: ${category} in booth ${userBooth}`, 'complaint');
    }
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name phone');

  res.status(201).json(fmt(populated));
});

// ─────────────────────────────────────────────────────────────────
// GET /api/complaints/:id
// ─────────────────────────────────────────────────────────────────
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user',           'name phone address')
    .populate('assignedWorker', 'name phone');
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  res.json(fmt(complaint));
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/accept   ← NEW
// Atomic accept — first agent wins, complaint locked to them
// ─────────────────────────────────────────────────────────────────
const acceptComplaint = asyncHandler(async (req, res) => {
  // Atomic update — prevents race condition if two agents tap simultaneously
  const updated = await Complaint.findOneAndUpdate(
    { _id: req.params.id, status: 'NEW' },  // only matches if still NEW
    {
      assignedWorker: req.user._id,
      status:         'ACCEPTED',
      acceptedAt:     new Date(),
      lockedToAgent:  true,
    },
    { new: true }
  ).populate('user', 'name phone').populate('assignedWorker', 'name phone');

  if (!updated) {
    res.status(400);
    throw new Error('This complaint was already accepted by another agent. Please refresh.');
  }

  // Notify citizen
  await notify(
    updated.user._id,
    `✅ Your complaint "${updated.category}" has been accepted by Agent ${req.user.name}.`,
    'complaint'
  );

  res.json(fmt(updated));
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/status
// Only locked agent or admin can update
// ─────────────────────────────────────────────────────────────────
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  // Enforce agent lock
  if (
    req.user.role === 'worker' &&
    complaint.lockedToAgent &&
    String(complaint.assignedWorker) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error('Access denied. This complaint belongs to another agent.');
  }

  const oldStatus    = complaint.status;
  complaint.status   = req.body.status   || complaint.status;
  complaint.priority = req.body.priority || complaint.priority;
  if (req.body.assignedWorker && req.user.role === 'admin') {
    complaint.assignedWorker = req.body.assignedWorker;
  }
  await complaint.save();

  // Notify citizen on status change
  if (oldStatus !== complaint.status) {
    const msgs = {
      'ACCEPTED':    `✅ Your complaint "${complaint.category}" was accepted by an agent.`,
      'IN PROGRESS': `🔧 An agent is working on your complaint "${complaint.category}".`,
      'COMPLETED':   `🎉 Your complaint "${complaint.category}" has been resolved!`,
    };
    const citizenId = typeof complaint.user === 'object' ? complaint.user._id : complaint.user;
    if (msgs[complaint.status]) {
      await notify(citizenId, msgs[complaint.status], 'complaint');
    }
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name phone');

  res.json(fmt(populated));
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/proof
// Upload proof — auto-completes complaint
// ─────────────────────────────────────────────────────────────────
const uploadProof = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  if (
    req.user.role === 'worker' &&
    complaint.lockedToAgent &&
    String(complaint.assignedWorker) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error('Only the assigned agent can upload proof.');
  }

  complaint.proofPhoto = req.body.photoUrl || (req.file ? `/uploads/${req.file.filename}` : complaint.proofPhoto);
  complaint.proofVideo = req.body.videoUrl || complaint.proofVideo;
  complaint.status     = 'COMPLETED';
  await complaint.save();

  const citizenId = typeof complaint.user === 'object' ? complaint.user._id : complaint.user;
  await notify(citizenId, `🎉 "${complaint.category}" is resolved! Proof uploaded by agent.`, 'complaint');

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name phone');

  res.json(fmt(populated));
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/complaints/:id  (admin only)
// ─────────────────────────────────────────────────────────────────
const deleteComplaint = asyncHandler(async (req, res) => {
  await Complaint.findByIdAndDelete(req.params.id);
  res.json({ message: 'Complaint deleted' });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/complaints/escalate-pending  (admin / cron)
// Escalates NEW complaints unattended for 2+ hours
// ─────────────────────────────────────────────────────────────────
const escalatePending = asyncHandler(async (req, res) => {
  const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const pending = await Complaint.find({
    status:           'NEW',
    escalatedToAdmin: false,
    createdAt:        { $lt: TWO_HOURS_AGO },
  });

  const admins = await User.find({ role: 'admin', isActive: true });

  for (const c of pending) {
    c.escalatedToAdmin = true;
    c.escalatedAt      = new Date();
    await c.save();
    for (const admin of admins) {
      await notify(admin._id, `⚠️ Unattended 2+ hrs: ${c.category} in booth ${c.booth}`, 'complaint');
    }
  }

  res.json({ message: `Escalated ${pending.length} complaints`, escalated: pending.length });
});

module.exports = {
  getComplaints,
  createComplaint,
  getComplaintById,
  acceptComplaint,
  updateComplaintStatus,
  uploadProof,
  deleteComplaint,
  escalatePending,
};