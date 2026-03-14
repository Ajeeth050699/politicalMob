const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Complaint = require('../models/complaintModel');
const User = require('../models/userModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

// GET /api/dashboard/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const totalComplaints = await Complaint.countDocuments();
  const pending         = await Complaint.countDocuments({ status: 'NEW' });
  const inProgress      = await Complaint.countDocuments({ status: 'IN PROGRESS' });
  const completed       = await Complaint.countDocuments({ status: 'COMPLETED' });
  const activeWorkers   = await User.countDocuments({ role: 'worker', isActive: true });
  res.json({ totalComplaints, pending, inProgress, completed, activeWorkers });
}));

// GET /api/dashboard/complaints/weekly
router.get('/complaints/weekly', asyncHandler(async (req, res) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const complaints = await Complaint.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const resolved   = await Complaint.countDocuments({ status: 'COMPLETED', updatedAt: { $gte: start, $lte: end } });
    result.push({ day: days[(start.getDay() + 6) % 7], complaints, resolved });
  }
  res.json(result);
}));

// GET /api/dashboard/complaints/by-category
router.get('/complaints/by-category', asyncHandler(async (req, res) => {
  const colors = {
    'Street Light Problem':  '#7B1C1C',
    'Road Damage':           '#C9982A',
    'Garbage Issue':         '#22c55e',
    'Water Supply Problem':  '#3b82f6',
    'Drainage Issue':        '#f59e0b',
    'Public Safety Issue':   '#ef4444',
    'Others':                '#9B9B9B',
  };
  const total = await Complaint.countDocuments();
  const agg = await Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  res.json(agg.map((item) => ({
    name:  item._id,
    value: total ? Math.round((item.count / total) * 100) : 0,
    color: colors[item._id] || '#9B9B9B',
  })));
}));

// GET /api/dashboard/complaints/recent
router.get('/complaints/recent', asyncHandler(async (req, res) => {
  const complaints = await Complaint.find()
    .sort({ createdAt: -1 }).limit(10)
    .populate('user', 'name')
    .populate('assignedWorker', 'name');
  res.json(complaints.map((c) => ({
    id: c._id, category: c.category, user: c.user?.name || 'Unknown',
    booth: c.booth, district: c.district, priority: c.priority,
    status: c.status, time: timeAgo(c.createdAt),
  })));
}));

// GET /api/dashboard/districts/performance
router.get('/districts/performance', asyncHandler(async (req, res) => {
  const agg = await Complaint.aggregate([
    { $group: {
        _id:      '$district',
        total:    { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        pending:  { $sum: { $cond: [{ $ne:  ['$status', 'COMPLETED'] }, 1, 0] } },
    }},
    { $sort: { total: -1 } },
    { $limit: 8 },
  ]);
  res.json(agg.map((d) => ({ district: d._id || 'Unknown', total: d.total, resolved: d.resolved, pending: d.pending })));
}));

function timeAgo(date) {
  const s = Math.floor((new Date() - date) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

module.exports = router;
