const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Notification } = require('../models/otherModels');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/notifications - get all notifications with filters
router.get('/', protect, asyncHandler(async (req, res) => {
  const { type, status = 'unread', page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    $or: [
      { user: req.user._id },
      { targetRole: 'all' },
      { targetRole: req.user.role },
    ],
  };

  if (type && type !== 'ALL') {
    filter.type = type;
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }

  const notifs = await Notification.find(filter)
    .populate('relatedComplaintId', 'category status')
    .populate('relatedWorkerId', 'name phone')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(filter);

  res.json({
    data: notifs.map((n) => ({
      id: n._id,
      msg: n.msg,
      type: n.type,
      time: n.createdAt,
      status: n.status,
      relatedComplaintId: n.relatedComplaintId?._id,
      relatedComplaint: n.relatedComplaintId,
      createdBy: n.createdBy?.name,
    })),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
}));

// GET /api/notifications/:id - get notification details
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id)
    .populate('relatedComplaintId')
    .populate('relatedWorkerId', 'name phone profilePhoto')
    .populate('createdBy', 'name')
    .populate('user', 'name phone');

  if (!notif) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Mark as read
  if (!notif.readBy.includes(req.user._id)) {
    notif.readBy.push(req.user._id);
    notif.status = 'read';
    await notif.save();
  }

  res.json({
    id: notif._id,
    msg: notif.msg,
    type: notif.type,
    time: notif.createdAt,
    status: notif.status,
    relatedComplaint: notif.relatedComplaintId,
    relatedWorker: notif.relatedWorkerId,
    createdBy: notif.createdBy?.name,
    actionUrl: notif.actionUrl,
  });
}));

// PUT /api/notifications/:id/read - mark as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (!notif.readBy.includes(req.user._id)) {
    notif.readBy.push(req.user._id);
  }
  notif.status = 'read';
  await notif.save();

  res.json({ success: true });
}));

// PUT /api/notifications/:id/archive - archive notification
router.put('/:id/archive', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notif.status = 'archived';
  await notif.save();

  res.json({ success: true });
}));

// POST /api/notifications - create notification (admin only)
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const notif = await Notification.create({ 
    ...req.body, 
    createdBy: req.user._id,
    status: 'unread'
  });
  res.status(201).json(notif);
}));

module.exports = router;
