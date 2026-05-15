const asyncHandler = require('express-async-handler');
const Complaint    = require('../models/complaintModel');
const User         = require('../models/userModel');
const { findWard } = require('../constants/wards');
const { emitComplaintEvent } = require('../realtime/complaintEvents');

// ── In-app notification helper ─────────────────────────────────────
const notify = async (userId, msg, type = 'complaint') => {
  try {
    const { Notification } = require('../models/otherModels');
    await Notification.create({ user: userId, msg, type });
  } catch {}
};

const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const workerCanSeeComplaint = (worker, complaint) => {
  if (!worker || !complaint) return false;
  if (String(complaint.assignedWorker || '') === String(worker._id || '')) return true;
  const sameThokuthi = same(complaint.ward || complaint.booth, worker.ward || worker.booth);
  const sameWardNo = !complaint.wardNo || !worker.wardNo || Number(complaint.wardNo) === Number(worker.wardNo);
  if (sameThokuthi && sameWardNo && complaint.routingLevel === 'ward') return true;
  if (complaint.fallbackUsed && worker.pincode && same(complaint.pincode, worker.pincode)) return true;
  if (complaint.routingLevel === 'nearby' && worker.district && same(complaint.district, worker.district)) return true;
  if (complaint.escalatedToAdmin) return true;
  return false;
};

const findRoutingAgents = async ({ ward, wardNo, booth, pincode, district }) => {
  let agents = [];
  let routingLevel = 'ward';

  if (ward || booth) {
    agents = await User.find({
      role: 'worker',
      isActive: true,
      $or: [
        { ward: ward || booth, wardNo },
        { booth: ward || booth, wardNo },
      ],
    });

    if (agents.length === 0 && !wardNo) {
      agents = await User.find({
        role: 'worker',
        isActive: true,
        $or: [
          { ward: ward || booth },
          { booth: ward || booth },
        ],
      });
    }
  }

  if (agents.length === 0 && pincode) {
    agents = await User.find({ role: 'worker', pincode, isActive: true });
    if (agents.length > 0) routingLevel = 'pincode';
  }

  if (agents.length === 0 && district) {
    agents = await User.find({ role: 'worker', district, isActive: true });
    if (agents.length > 0) routingLevel = 'nearby';
  }

  if (agents.length === 0) routingLevel = 'admin';
  return { agents, routingLevel, fallbackUsed: routingLevel === 'pincode' || routingLevel === 'nearby' };
};

// ── Format complaint for response ─────────────────────────────────
const fmt = (c) => ({
  id:               c._id,
  category:         c.category,
  description:      c.description,
  user:             c.user?.name    || 'Unknown',
  userId:           c.user?._id,
  userPhone:        c.citizenPhone  || c.user?.phone,
  ward:             c.ward || c.booth,
  wardNo:           c.wardNo,
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
  routingLevel:     c.routingLevel,
  escalatedToAdmin: c.escalatedToAdmin,
  address:          c.address,
  location:         c.location,
  time:             c.createdAt,
  createdAt:        c.createdAt,
});

// ─────────────────────────────────────────────────────────────────
// GET /api/complaints
// public → own | worker → booth + pincode fallback + escalated | admin/agent → all
// ─────────────────────────────────────────────────────────────────
const getComplaints = asyncHandler(async (req, res) => {
  const { status, district, booth, category, pincode, workerName, workerId } = req.query;
  let filter = {};

  if (['public', 'citizen'].includes(req.user.role)) {
    filter.user = req.user._id;

  } else if (req.user.role === 'worker') {
    const orConditions = [{ escalatedToAdmin: true }];
    if (req.user.ward || req.user.booth) {
      const area = req.user.ward || req.user.booth;
      if (req.user.wardNo) {
        orConditions.push({ ward: area, wardNo: req.user.wardNo, routingLevel: 'ward' });
        orConditions.push({ booth: area, wardNo: req.user.wardNo, routingLevel: 'ward' });
      } else {
        orConditions.push({ ward: area, routingLevel: 'ward' });
        orConditions.push({ booth: area, routingLevel: 'ward' });
      }
    }
    if (req.user.pincode) {
      orConditions.push({ pincode: req.user.pincode, fallbackUsed: true });
    }
    if (req.user.district) {
      orConditions.push({ district: req.user.district, routingLevel: 'nearby' });
    }
    filter.$or = orConditions;
  }
  // admin, superadmin, agent: no filter

  const isAdminOrAgent = ['admin', 'superadmin', 'agent'].includes(req.user.role);

  if (status   && status   !== 'ALL') filter.status   = status;
  if (district && district !== 'ALL') filter.district = district;
  if (booth    && isAdminOrAgent) filter.booth = booth;
  if (req.query.ward && isAdminOrAgent) filter.ward = req.query.ward;
  if (req.query.wardNo && isAdminOrAgent) filter.wardNo = Number(req.query.wardNo);
  if (pincode && isAdminOrAgent) filter.pincode = pincode;
  if (workerId && isAdminOrAgent) filter.assignedWorker = workerId;
  if (category) filter.category = category;

  let complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user',           'name phone')
    .populate('assignedWorker', 'name phone');

  if (workerName && isAdminOrAgent) {
    const q = String(workerName).trim().toLowerCase();
    complaints = complaints.filter(c => (c.assignedWorker?.name || '').toLowerCase().includes(q));
  }

  res.json(complaints.map(fmt));
});

// ─────────────────────────────────────────────────────────────────
// POST /api/complaints
// Smart routing: booth → pincode → district → escalate to admin
// ─────────────────────────────────────────────────────────────────
const createComplaint = asyncHandler(async (req, res) => {
  const {
    category, description, ward, wardNo, booth, district,
    pincode, address, location, attachments, citizenPhone
  } = req.body;

  const matchedWard = findWard(ward || booth || req.user.ward || req.user.booth);
  if (!matchedWard) { res.status(400); throw new Error('Valid Tamil Nadu assembly constituency/ward is required'); }

  const userWard     = matchedWard.name;
  const userWardNo   = wardNo || req.user.wardNo;
  const userBooth    = userWard;
  const userPincode  = pincode  || req.user.pincode;
  const userDistrict = district || req.user.district;

  const { agents, routingLevel, fallbackUsed } = await findRoutingAgents({
    ward: userWard,
    wardNo: userWardNo,
    booth: userBooth,
    pincode: userPincode,
    district: userDistrict,
  });

  const escalateImmediately = agents.length === 0;

  const complaint = await Complaint.create({
    user:             req.user._id,
    category,
    description,
    ward:             userWard,
    wardNo:           userWardNo,
    booth:            userBooth,
    district:         userDistrict,
    pincode:          userPincode,
    address,
    location,
    citizenPhone,
    attachments:      attachments || [],
    fallbackUsed,
    routingLevel,
    escalatedToAdmin: escalateImmediately,
    escalatedAt:      escalateImmediately ? new Date() : undefined,
  });

  // Notify all available agents
  for (const agent of agents) {
    await notify(
      agent._id,
      `New complaint in your ${routingLevel === 'ward' ? 'ward' : 'nearby area'}: ${category}`,
      'complaint'
    );
  }

  // Escalate to admins if no agents found
  if (escalateImmediately) {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
    for (const admin of admins) {
      await notify(admin._id, `No workers/agents for: ${category} in ward ${userWard}`, 'complaint');
    }
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name phone');

  const out = fmt(populated);
  emitComplaintEvent('created', out);
  res.status(201).json(out);
});

// ─────────────────────────────────────────────────────────────────
// GET /api/complaints/:id
// ─────────────────────────────────────────────────────────────────
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user',           'name phone address')
    .populate('assignedWorker', 'name phone');
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  if (['public', 'citizen'].includes(req.user.role) && String(complaint.user?._id || complaint.user) !== String(req.user._id)) {
    res.status(403); throw new Error('Access denied. You can only view your own complaints.');
  }
  if (req.user.role === 'worker' && !workerCanSeeComplaint(req.user, complaint)) {
    res.status(403); throw new Error('Access denied. This complaint is outside your assigned area.');
  }
  res.json(fmt(complaint));
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/accept   ← NEW
// Atomic accept — first worker wins, complaint locked to them
// ─────────────────────────────────────────────────────────────────
const acceptComplaint = asyncHandler(async (req, res) => {
  if (req.user.role === 'agent') {
    res.status(403); throw new Error('Agents cannot accept complaints.');
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  if (req.user.role === 'worker' && !workerCanSeeComplaint(req.user, complaint)) {
    res.status(403);
    throw new Error('Access denied. This complaint is outside your assigned area.');
  }

  // Atomic update — prevents race condition if two workers tap simultaneously
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
    throw new Error('This complaint was already accepted by another worker. Please refresh.');
  }

  // Notify citizen
  await notify(
    updated.user._id,
    `✅ Your complaint "${updated.category}" has been accepted by Worker ${req.user.name}.`,
    'complaint'
  );

  const out = fmt(updated);
  emitComplaintEvent('accepted', out);
  res.json(out);
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/status
// Only locked worker or admin can update
// ─────────────────────────────────────────────────────────────────
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  if (req.user.role === 'worker' && !workerCanSeeComplaint(req.user, complaint)) {
    res.status(403);
    throw new Error('Access denied. This complaint is outside your assigned area.');
  }

  // Enforce worker lock
  if (
    req.user.role === 'worker' &&
    complaint.lockedToAgent &&
    String(complaint.assignedWorker) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error('Access denied. This complaint belongs to another worker.');
  }

  const oldStatus    = complaint.status;
  complaint.status   = req.body.status   || complaint.status;
  complaint.priority = req.body.priority || complaint.priority;
  if (req.body.assignedWorker && (['admin', 'superadmin', 'agent'].includes(req.user.role))) {
    complaint.assignedWorker = req.body.assignedWorker;
  }
  await complaint.save();

  // Notify citizen on status change
  if (oldStatus !== complaint.status) {
    const msgs = {
      'ACCEPTED':    `✅ Your complaint "${complaint.category}" was accepted by a worker.`,
      'IN PROGRESS': `🔧 A worker is working on your complaint "${complaint.category}".`,
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

  const out = fmt(populated);
  emitComplaintEvent('updated', out);
  res.json(out);
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/proof
// Upload proof — auto-completes complaint
// ─────────────────────────────────────────────────────────────────
const uploadProof = asyncHandler(async (req, res) => {
  if (req.user.role === 'agent') {
    res.status(403); throw new Error('Agents cannot upload proof.');
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  if (req.user.role === 'worker' && !workerCanSeeComplaint(req.user, complaint)) {
    res.status(403);
    throw new Error('Access denied. This complaint is outside your assigned area.');
  }

  if (
    req.user.role === 'worker' &&
    complaint.lockedToAgent &&
    String(complaint.assignedWorker) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error('Only the assigned worker can upload proof.');
  }

  complaint.proofPhoto = req.body.photoUrl || (req.file ? `/uploads/${req.file.filename}` : complaint.proofPhoto);
  complaint.proofVideo = req.body.videoUrl || complaint.proofVideo;
  complaint.status     = 'COMPLETED';
  await complaint.save();

  const citizenId = typeof complaint.user === 'object' ? complaint.user._id : complaint.user;
  await notify(citizenId, `🎉 "${complaint.category}" is resolved! Proof uploaded by worker.`, 'complaint');

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone')
    .populate('assignedWorker', 'name phone');

  const out = fmt(populated);
  emitComplaintEvent('proof_uploaded', out);
  res.json(out);
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

  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });

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
