const asyncHandler = require('express-async-handler');
const Complaint    = require('../models/complaintModel');
const User         = require('../models/userModel');
const { findWard } = require('../constants/wards');
const { emitComplaintEvent } = require('../realtime/complaintEvents');

// ── In-app notification helper ─────────────────────────────────────
const notify = async (userId, msg, type = 'complaint', complaintId = null, workerId = null) => {
  try {
    const { Notification } = require('../models/otherModels');
    await Notification.create({ 
      user: userId, 
      msg, 
      type,
      relatedComplaintId: complaintId,
      relatedWorkerId: workerId,
      status: 'unread'
    });
  } catch {}
};

const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const workerCanSeeComplaint = (worker, complaint) => {
  if (!worker || !complaint) return false;
  if (String(complaint.assignedWorker || '') === String(worker._id || '')) return true;
  
  const sameThokuthi = same(complaint.ward || complaint.thokuthi, worker.ward || worker.thokuthi);
  const sameWardNo = !complaint.wardNo || !worker.wardNo || Number(complaint.wardNo) === Number(worker.wardNo);
  
  if (sameThokuthi && sameWardNo) return true;
  return false;
};

const findRoutingAgents = async ({ ward, wardNo, thokuthi, pincode, district }) => {
  let agents = [];
  let routingLevel = 'ward';

  if (ward || thokuthi) {
    agents = await User.find({
      role: 'worker',
      isActive: true,
      $or: [
        { ward: ward || thokuthi, wardNo },
        { thokuthi: ward || thokuthi, wardNo },
      ],
    });

    if (agents.length === 0 && !wardNo) {
      agents = await User.find({
        role: 'worker',
        isActive: true,
        $or: [
          { ward: ward || thokuthi },
          { thokuthi: ward || thokuthi },
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
  userProfilePhoto: c.user?.profilePhoto,
  ward:             c.ward || c.thokuthi,
  wardNo:           c.wardNo,
  thokuthi:            c.thokuthi,
  district:         c.district,
  pincode:          c.pincode,
  priority:         c.priority,
  status:           c.status,
  assignedWorker:   c.assignedWorker?.name,
  assignedWorkerId: c.assignedWorker?._id,
  assignedWorkerPhone: c.assignedWorker?.phone,
  assignedWorkerProfilePhoto: c.assignedWorker?.profilePhoto,
  lockedToAgent:    c.lockedToAgent,
  acceptedAt:       c.acceptedAt,
  proofPhoto:       c.proofPhoto,
  proofVideo:       c.proofVideo,
  proofLocation:    c.proofLocation,
  proofUploadedAt:  c.proofUploadedAt,
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
// public → own | worker → thokuthi + pincode fallback + escalated | admin/agent → all
// ─────────────────────────────────────────────────────────────────
const getComplaints = asyncHandler(async (req, res) => {
  const { status, district, thokuthi, category, pincode, workerName, workerId } = req.query;
  let filter = {};

  if (['public', 'citizen'].includes(req.user.role)) {
    filter.user = req.user._id;

  } else if (req.user.role === 'worker') {
    const orConditions = [];
    if (req.user.ward || req.user.thokuthi) {
      const area = req.user.ward || req.user.thokuthi;
      if (req.user.wardNo) {
        orConditions.push({ ward: area, wardNo: req.user.wardNo });
        orConditions.push({ thokuthi: area, wardNo: req.user.wardNo });
      } else {
        orConditions.push({ ward: area });
        orConditions.push({ thokuthi: area });
      }
    }
    
    // Always show complaints explicitly assigned to this worker
    orConditions.push({ assignedWorker: req.user._id });
    
    filter.$or = orConditions;
  }
  // admin, superadmin, agent: no filter

  const isAdminOrAgent = ['admin', 'superadmin', 'agent'].includes(req.user.role);

  if (status   && status   !== 'ALL') filter.status   = status;
  if (district && district !== 'ALL') filter.district = district;
  if (thokuthi && thokuthi !== 'ALL' && isAdminOrAgent) filter.thokuthi = thokuthi;
  if (req.query.ward && req.query.ward !== 'ALL' && isAdminOrAgent) filter.ward = req.query.ward;
  if (req.query.wardNo && isAdminOrAgent) filter.wardNo = Number(req.query.wardNo);
  if (pincode && isAdminOrAgent) filter.pincode = pincode;
  if (workerId && isAdminOrAgent) filter.assignedWorker = workerId;
  if (category) filter.category = category;

  let complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .populate('user',           'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

  if (workerName && isAdminOrAgent) {
    const q = String(workerName).trim().toLowerCase();
    complaints = complaints.filter(c => (c.assignedWorker?.name || '').toLowerCase().includes(q));
  }

  res.json(complaints.map(fmt));
});

// ─────────────────────────────────────────────────────────────────
// POST /api/complaints
// Smart routing: thokuthi → pincode → district → escalate to admin
// ─────────────────────────────────────────────────────────────────
const createComplaint = asyncHandler(async (req, res) => {
  const {
    category, description, ward, wardNo, thokuthi, district,
    pincode, address, location, attachments, citizenPhone
  } = req.body;

  const matchedWard = findWard(ward || thokuthi || req.user.ward || req.user.thokuthi);
  if (!matchedWard) { res.status(400); throw new Error('Valid Tamil Nadu assembly constituency/ward is required'); }

  const userWard     = matchedWard.name;
  const userWardNo   = wardNo || req.user.wardNo;
  const userThokuthi    = userWard;
  const userPincode  = pincode  || req.user.pincode;
  const userDistrict = district || req.user.district;

  const { agents, routingLevel, fallbackUsed } = await findRoutingAgents({
    ward: userWard,
    wardNo: userWardNo,
    thokuthi: userThokuthi,
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
    thokuthi:            userThokuthi,
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
      'complaint',
      complaint._id,
      agent._id
    );
  }

  // Escalate to admins if no agents found
  if (escalateImmediately) {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
    for (const admin of admins) {
      await notify(
        admin._id, 
        `No workers/agents for: ${category} in ward ${userWard}`, 
        'complaint',
        complaint._id
      );
    }
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

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
    'complaint',
    updated._id,
    req.user._id
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
  if (req.body.status === 'COMPLETED' && !complaint.proofPhoto) {
    res.status(400);
    throw new Error('Upload an after-repair photo before completing this complaint.');
  }

  complaint.status   = req.body.status   || complaint.status;
  complaint.priority = req.body.priority || complaint.priority;
  if (req.body.assignedWorker && (['admin', 'superadmin', 'agent'].includes(req.user.role))) {
    complaint.assignedWorker = req.body.assignedWorker;
    complaint.lockedToAgent = true;
    complaint.acceptedAt = complaint.acceptedAt || new Date();
    if (complaint.status === 'NEW') complaint.status = 'ACCEPTED';
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
    const workerId = typeof complaint.assignedWorker === 'object' ? complaint.assignedWorker._id : complaint.assignedWorker;
    if (msgs[complaint.status]) {
      await notify(citizenId, msgs[complaint.status], 'complaint', complaint._id, workerId);
    }
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

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

  const photoUrl = req.body.photoUrl || (req.file ? `/uploads/${req.file.filename}` : null);
  const proofLocation = req.body.proofLocation || {};
  const hasValidProofLocation =
    Number.isFinite(Number(proofLocation.lat)) &&
    Number.isFinite(Number(proofLocation.lng));

  if (req.user.role === 'worker') {
    if (!photoUrl) {
      res.status(400);
      throw new Error('After-repair photo is required to complete this complaint.');
    }

    if (!hasValidProofLocation) {
      res.status(400);
      throw new Error('Current GPS location is required with the after-repair photo.');
    }
  }

  complaint.proofPhoto = photoUrl || complaint.proofPhoto;
  complaint.proofVideo = req.body.videoUrl || complaint.proofVideo;
  if (hasValidProofLocation) {
    complaint.proofLocation = {
      lat: Number(proofLocation.lat),
      lng: Number(proofLocation.lng),
      accuracy: Number.isFinite(Number(proofLocation.accuracy)) ? Number(proofLocation.accuracy) : undefined,
    };
  }
  complaint.proofUploadedAt = new Date();
  complaint.status     = 'COMPLETED';
  await complaint.save();

  const citizenId = typeof complaint.user === 'object' ? complaint.user._id : complaint.user;
  await notify(citizenId, `🎉 "${complaint.category}" is resolved! Proof uploaded by worker.`, 'complaint');

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

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
      await notify(admin._id, `⚠️ Unattended 2+ hrs: ${c.category} in thokuthi ${c.thokuthi}`, 'complaint', c._id);
    }
  }

  res.json({ message: `Escalated ${pending.length} complaints`, escalated: pending.length });
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/reject
// Worker rejects an assigned complaint with a remark
// ─────────────────────────────────────────────────────────────────
const rejectComplaint = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    res.status(403); throw new Error('Only workers can reject complaints.');
  }
  const { reason } = req.body;
  if (!reason) {
    res.status(400); throw new Error('Rejection reason is required.');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  // A worker can reject if it's assigned to them, or if it's new and they are just declining to take it
  if (complaint.assignedWorker && String(complaint.assignedWorker) !== String(req.user._id)) {
    res.status(403); throw new Error('This complaint is assigned to another worker.');
  }

  complaint.rejectedBy.push({ worker: req.user._id, reason });
  
  if (String(complaint.assignedWorker) === String(req.user._id)) {
    complaint.assignedWorker = null;
    complaint.lockedToAgent = false;
    complaint.acceptedAt = null;
    // We send it back to NEW so someone else can pick it up
    complaint.status = 'NEW';
  }

  await complaint.save();

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

  const out = fmt(populated);
  emitComplaintEvent('updated', out);
  res.json(out);
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/revoke
// Citizen revokes their own complaint
// ─────────────────────────────────────────────────────────────────
const revokeComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400); throw new Error('Revocation reason is required.');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  if (String(complaint.user) !== String(req.user._id)) {
    res.status(403); throw new Error('You can only revoke your own complaints.');
  }

  if (['COMPLETED', 'REVOKED'].includes(complaint.status)) {
    res.status(400); throw new Error(`Cannot revoke a ${complaint.status} complaint.`);
  }

  complaint.status = 'REVOKED';
  complaint.revokeReason = reason;
  await complaint.save();

  // Notify worker if it was assigned
  if (complaint.assignedWorker) {
    await notify(
      complaint.assignedWorker, 
      `❌ Complaint "${complaint.category}" has been revoked by the citizen.`, 
      'complaint',
      complaint._id,
      complaint.assignedWorker
    );
  }

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name phone profilePhoto')
    .populate('assignedWorker', 'name phone profilePhoto');

  const out = fmt(populated);
  emitComplaintEvent('updated', out);
  res.json(out);
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
  rejectComplaint,
  revokeComplaint,
};
