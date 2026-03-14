const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Notification } = require('../models/otherModels');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', protect, asyncHandler(async (req, res) => {
  const notifs = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json(notifs.map((n) => ({
    id: n._id, msg: n.msg, type: n.type, time: n.createdAt,
  })));
}));

// POST /api/notifications
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const notif = await Notification.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(notif);
}));

module.exports = router;
