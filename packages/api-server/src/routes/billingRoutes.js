const express = require('express');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');
const { ROLE_PLANS, getPlanForRole } = require('../constants/subscriptions');

const router = express.Router();

router.get('/plans', (req, res) => {
  res.json({ currency: 'INR', plans: ROLE_PLANS });
});

router.post('/subscribe', protect, asyncHandler(async (req, res) => {
  const requestedRole = req.body.role || req.user.role;
  const plan = getPlanForRole(requestedRole);
  const amountPaise = plan.amount * 100;

  let provider = 'manual';
  let providerOrder = null;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    provider = 'razorpay';
    const auth = Buffer
      .from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`)
      .toString('base64');
    const { data } = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: amountPaise,
        currency: plan.currency,
        receipt: `sub_${req.user._id}_${Date.now()}`,
        notes: {
          userId: String(req.user._id),
          role: plan.role,
          interval: plan.interval,
        },
      },
      { headers: { Authorization: `Basic ${auth}` } }
    );
    providerOrder = data;
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + 1);

  const user = await User.findById(req.user._id);
  user.subscription = {
    planRole: plan.role,
    amount: plan.amount,
    currency: plan.currency,
    interval: plan.interval,
    status: provider === 'manual' ? 'pending' : 'created',
    provider,
    providerOrderId: providerOrder?.id,
    currentPeriodStart: now,
    currentPeriodEnd: expires,
  };
  await user.save();

  res.status(201).json({
    plan,
    provider,
    order: providerOrder,
    subscription: user.subscription,
  });
}));

module.exports = router;
