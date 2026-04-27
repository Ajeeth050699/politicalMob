const asyncHandler = require('express-async-handler');
const User         = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const crypto       = require('crypto');
const sendEmail    = require('../utils/sendEmail');
const sendSms      = require('../utils/sendSms');

// ── In-memory OTP stores (fast, no DB writes needed) ───────────────
const registrationOtpStore = {};  // for new registration phone verify
const resetOtpStore        = {};  // for forgot-password flow

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone, role,
    booth, district, address, pincode,
  } = req.body;

  const digits = phone ? String(phone).replace(/\D/g, '') : '';
  const normalizedEmail = email || (digits ? `${digits}@phone.local` : undefined);
  if (!normalizedEmail) { res.status(400); throw new Error('Email or phone number is required'); }
  if (!district) { res.status(400); throw new Error('District is required'); }
  if (!booth) { res.status(400); throw new Error('Booth number is required'); }
  if (!address) { res.status(400); throw new Error('Address is required'); }
  if (!pincode) { res.status(400); throw new Error('Pincode is required'); }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) { res.status(400); throw new Error('Email already exists'); }

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) { res.status(400); throw new Error('Phone number already taken'); }
  }

  const user = await User.create({
    name, email: normalizedEmail, password, phone,
    role:    role    || 'public',
    booth:   booth   || '',
    district: district || '',
    address: address || '',
    pincode: pincode || '',
  });

  if (user) {
    // Send email verification
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken        = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000;
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        email:   user.email,
        subject: 'Email Verification',
        message: `Please verify your email:\n\n${verificationUrl}`,
      });
    } catch (err) {
      console.error('Email send failed:', err.message);
    }
    await user.save();

    res.status(201).json({
      _id:             user._id,
      name:            user.name,
      email:           user.email,
      phone:           user.phone,
      role:            user.role,
      booth:           user.booth,
      district:        user.district,
      address:         user.address,
      pincode:         user.pincode,
      token:           generateToken(user._id),
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
    });
  } else {
    res.status(400); throw new Error('Invalid user data');
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Please provide email/mobile and password'); }

  const loginId = String(email).trim();
  const user = await User.findOne({
    $or: [{ email: loginId }, { phone: loginId }],
  }).select('+password');
  if (user && (await user.matchPassword(password))) {
    if (!user.isActive) { res.status(403); throw new Error('Account is disabled'); }
    res.json({
      _id:             user._id,
      name:            user.name,
      email:           user.email,
      phone:           user.phone,
      role:            user.role,
      booth:           user.booth,
      district:        user.district,
      address:         user.address,
      pincode:         user.pincode,
      token:           generateToken(user._id),
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
    });
  } else {
    res.status(401); throw new Error('Invalid email or password');
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ─────────────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({
    _id:             user._id,
    name:            user.name,
    email:           user.email,
    phone:           user.phone,
    role:            user.role,
    booth:           user.booth,
    district:        user.district,
    address:         user.address,
    pincode:         user.pincode,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
  });
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.name     = req.body.name     || user.name;
  user.email    = req.body.email    || user.email;
  user.phone    = req.body.phone    || user.phone;
  user.booth    = req.body.booth    !== undefined ? req.body.booth    : user.booth;
  user.district = req.body.district !== undefined ? req.body.district : user.district;
  user.address  = req.body.address  !== undefined ? req.body.address  : user.address;
  user.pincode  = req.body.pincode  !== undefined ? req.body.pincode  : user.pincode;
  if (req.body.password) user.password = req.body.password;

  const saved = await user.save();
  res.json({
    _id:      saved._id,
    name:     saved.name,
    email:    saved.email,
    phone:    saved.phone,
    role:     saved.role,
    booth:    saved.booth,
    district: saved.district,
    address:  saved.address,
    pincode:  saved.pincode,
    token:    generateToken(saved._id),
  });
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/auth/fcm-token
// ─────────────────────────────────────────────────────────────────
const updateFcmToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.fcmToken = req.body.fcmToken;
  await user.save();
  res.json({ message: 'FCM token updated successfully' });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp   (in-memory — for registration flow)
// ─────────────────────────────────────────────────────────────────
const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) { res.status(400); throw new Error('Phone number is required'); }

  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10) { res.status(400); throw new Error('Enter a valid 10-digit phone number'); }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  registrationOtpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  console.log(`\n📱 OTP for ${phone} → ${otp}  (expires 5 min)\n`);

  // Send the OTP via SMS in production
  if (process.env.NODE_ENV === 'production') {
    await sendSms({
      message: `Your verification code is: ${otp}`,
      numbers: digits,
    });
  }

  res.json({
    message: 'OTP sent successfully',
    ...(process.env.NODE_ENV !== 'production' && { otp }),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp   (in-memory — registration)
// ─────────────────────────────────────────────────────────────────
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) { res.status(400); throw new Error('Phone and OTP required'); }

  const record = registrationOtpStore[phone];
  if (!record)                       { res.status(400); throw new Error('OTP not found. Request a new one'); }
  if (Date.now() > record.expiresAt) { delete registrationOtpStore[phone]; res.status(400); throw new Error('OTP expired'); }
  if (record.otp !== String(otp))    { res.status(400); throw new Error('Invalid OTP'); }

  delete registrationOtpStore[phone];
  res.json({ message: 'OTP verified', verified: true });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/verify-phone-email   (DB-based — existing flow)
// ─────────────────────────────────────────────────────────────────
const verifyPhoneEmail = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) { res.status(400); throw new Error('Phone and OTP are required'); }

  const user = await User.findOne({
    phone,
    phoneVerificationOtp:        otp,
    phoneVerificationOtpExpires: { $gt: Date.now() },
  });

  if (!user) { res.status(400); throw new Error('Invalid OTP or OTP has expired'); }

  user.isPhoneVerified            = true;
  user.phoneVerificationOtp       = undefined;
  user.phoneVerificationOtpExpires = undefined;
  await user.save();

  res.json({ message: 'Phone verified successfully' });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email/:token
// ─────────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) { res.status(400); throw new Error('Invalid token or token has expired'); }

  user.isEmailVerified               = true;
  user.emailVerificationToken        = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp   (DB-based — existing flow)
// ─────────────────────────────────────────────────────────────────
const resendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user) { res.status(404); throw new Error('User not found'); }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.phoneVerificationOtp        = otp;
  user.phoneVerificationOtpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  console.log(`\n📱 OTP for ${user.phone} → ${otp}  (expires 10 min)\n`);

  // Send the OTP via SMS in production
  if (process.env.NODE_ENV === 'production') {
    await sendSms({
      message: `Your new verification code is: ${otp}`,
      numbers: user.phone,
    });
  }

  res.json({ message: 'OTP sent successfully' });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Generates OTP and stores in memory for reset flow
// ─────────────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) { res.status(404); throw new Error('No account found with this email'); }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  resetOtpStore[req.body.email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

  console.log(`\n🔐 Reset OTP for ${req.body.email} → ${otp}  (expires 10 min)\n`);

  // Send the OTP via SMS in production
  if (process.env.NODE_ENV === 'production' && user.phone) {
    await sendSms({
      message: `Your password reset code is: ${otp}`,
      numbers: user.phone,
    });
  }

  res.json({
    message: 'Reset OTP sent to registered phone number',
    phone:   user.phone ? `*****${String(user.phone).slice(-4)}` : undefined,
    ...(process.env.NODE_ENV !== 'production' && { otp }),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/verify-reset-otp   ← NEW — verifies OTP before reset
// ─────────────────────────────────────────────────────────────────
const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400); throw new Error('Email and OTP required'); }

  const record = resetOtpStore[email];
  if (!record)                       { res.status(400); throw new Error('OTP not found. Request again'); }
  if (Date.now() > record.expiresAt) { delete resetOtpStore[email]; res.status(400); throw new Error('OTP expired. Request a new one'); }
  if (record.otp !== String(otp))    { res.status(400); throw new Error('Invalid OTP. Try again'); }

  // Keep OTP alive for the final reset step
  res.json({ message: 'OTP verified', verified: true });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password   ← Updated to support OTP flow
// Supports both: OTP-based (new) and token-based (old)
// ─────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  // ── OTP-based reset (new flow for web admin) ───────────────────
  if (req.body.email && req.body.otp && req.body.newPassword) {
    const { email, otp, newPassword } = req.body;

    const record = resetOtpStore[email];
    if (!record)                       { res.status(400); throw new Error('OTP session expired. Start over'); }
    if (Date.now() > record.expiresAt) { delete resetOtpStore[email]; res.status(400); throw new Error('OTP expired'); }
    if (record.otp !== String(otp))    { res.status(400); throw new Error('Invalid OTP'); }

    const user = await User.findOne({ email });
    if (!user) { res.status(404); throw new Error('User not found'); }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    delete resetOtpStore[email];

    return res.json({ message: 'Password reset successfully' });
  }

  // ── Token-based reset (old flow) ──────────────────────────────
  if (req.params?.resettoken) {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) { res.status(400); throw new Error('Invalid or expired token'); }

    user.password           = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(201).json({ success: true, data: 'Password reset successful' });
  }

  res.status(400); throw new Error('Invalid reset request');
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/verify-booth
// ─────────────────────────────────────────────────────────────────
const verifyBooth = asyncHandler(async (req, res) => {
  const { booth, district } = req.body;
  if (!booth || !district) {
    res.status(400); throw new Error('Booth and district are required');
  }

  const workerCount = await User.countDocuments({
    role: 'worker',
    booth,
    district,
    isActive: true,
  });

  res.json({
    booth,
    district,
    workerCount,
    message: workerCount > 0
      ? `${workerCount} active agent(s) already cover this booth.`
      : 'No active agent found for this booth yet. You can register to cover it.',
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateFcmToken,
  sendOtp,
  verifyOtp,
  verifyPhoneEmail,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyBooth,
};
