const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Complaint = require('../models/complaintModel');
const generateToken = require('../utils/generateToken');
const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');
const { findWard } = require('../constants/wards');
const { getPlanForRole } = require('../constants/subscriptions');

const router = express.Router();

const publicUser = (u) => ({
  id: u._id,
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  ward: u.ward,
  wardNo: u.wardNo,
  thokuthi: u.thokuthi,
  district: u.district,
  address: u.address,
  pincode: u.pincode,
  subscription: u.subscription,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { role, district, search } = req.query;
  const filter = {};

  if (role && role !== 'ALL') filter.role = role;
  if (district && district !== 'ALL') filter.district = district;

  if (req.user.role !== 'superadmin') {
    filter.role = { $in: ['public', 'citizen', 'worker', 'agent'] };
    if (req.user.district) filter.district = req.user.district;
  }

  let users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.ward || u.thokuthi || '').toLowerCase().includes(q)
    );
  }

  const enriched = await Promise.all(users.map(async (u) => {
    const base = publicUser(u);
    if (u.role === 'worker') {
      base.completedComplaints = await Complaint.countDocuments({ assignedWorker: u._id, status: 'COMPLETED' });
      base.activeComplaints = await Complaint.countDocuments({ assignedWorker: u._id, status: { $ne: 'COMPLETED' } });
    }
    if (u.role === 'public') {
      base.totalComplaints = await Complaint.countDocuments({ user: u._id });
    }
    return base;
  }));

  res.json(enriched);
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, ward, thokuthi, district, address, pincode } = req.body;
  const requestedRole = role === 'citizen' ? 'public' : (role || 'public');

  if (!['public', 'citizen', 'worker', 'agent', 'admin', 'superadmin'].includes(requestedRole)) {
    res.status(400); throw new Error('Invalid role');
  }
  if (['admin', 'superadmin'].includes(requestedRole) && req.user.role !== 'superadmin') {
    res.status(403); throw new Error('Only super admin can create admin accounts');
  }
  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email and password are required');
  }
  const matchedWard = ['public', 'citizen', 'worker', 'agent'].includes(requestedRole)
    ? findWard(ward || thokuthi)
    : null;
  if (['public', 'citizen', 'worker', 'agent'].includes(requestedRole) && (!matchedWard || !district || !address || !pincode)) {
    res.status(400); throw new Error('Ward, district, address and pincode are required');
  }

  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const plan = getPlanForRole(requestedRole);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const user = await User.create({
    name, email, phone, password,
    role: requestedRole,
    ward: matchedWard?.name || '',
    wardNo: matchedWard?.id,
    thokuthi: matchedWard?.name || thokuthi || '',
    district: district || '',
    address: address || '',
    pincode: pincode || '',
    subscription: ['public', 'citizen', 'worker', 'agent'].includes(requestedRole) ? {
      planRole: plan.role,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      status: 'pending',
      provider: 'manual',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    } : undefined,
  });

  const out = publicUser(user);
  out.token = generateToken(user._id);
  res.status(201).json(out);
}));

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (req.user.role !== 'superadmin' && ['admin', 'superadmin'].includes(user.role)) {
    res.status(403); throw new Error('Only super admin can update admin accounts');
  }

  const nextRole = req.body.role || user.role;
  if (!['public', 'citizen', 'worker', 'agent', 'admin', 'superadmin'].includes(nextRole)) {
    res.status(400); throw new Error('Invalid role');
  }
  if (['admin', 'superadmin'].includes(nextRole) && req.user.role !== 'superadmin') {
    res.status(403); throw new Error('Only super admin can assign admin roles');
  }

  user.name = req.body.name ?? user.name;
  user.email = req.body.email ?? user.email;
  user.phone = req.body.phone ?? user.phone;
  user.role = nextRole;
  if (req.body.ward !== undefined || req.body.thokuthi !== undefined) {
    const matchedWard = findWard(req.body.ward || req.body.thokuthi);
    if (['public', 'citizen', 'worker', 'agent'].includes(nextRole) && !matchedWard) {
      res.status(400); throw new Error('Valid Tamil Nadu assembly constituency/ward is required');
    }
    if (matchedWard) {
      user.ward = matchedWard.name;
      user.wardNo = matchedWard.id;
      user.thokuthi = matchedWard.name;
    }
  }
  user.district = req.body.district ?? user.district;
  user.address = req.body.address ?? user.address;
  user.pincode = req.body.pincode ?? user.pincode;
  user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
  if (req.body.password) user.password = req.body.password;

  await user.save();
  res.json(publicUser(user));
}));

router.delete('/:id', protect, superAdminOnly, asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    res.status(400); throw new Error('Super admin cannot delete own account');
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
}));

module.exports = router;
