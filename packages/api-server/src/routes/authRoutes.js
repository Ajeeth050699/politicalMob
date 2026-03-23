const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  updateFcmToken,
  sendOtp,
  verifyOtp,
  verifyPhoneEmail,
  verifyBooth,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── Public routes ─────────────────────────────────────────────────
router.post('/register',           register);
router.post('/login',              login);

// Phone.email OTP verification
router.post('/verify-phone-email', verifyPhoneEmail);  // ← phone.email widget

// Fallback OTP (dev/testing)
router.post('/send-otp',           sendOtp);
router.post('/verify-otp',         verifyOtp);

// Booth verification for agents
router.post('/verify-booth',       verifyBooth);       // ← NEW

// Password reset
router.post('/forgot-password',    forgotPassword);
router.post('/verify-reset-otp',   verifyResetOtp);
router.post('/reset-password',     resetPassword);

// ── Private routes ────────────────────────────────────────────────
router.get ('/profile',   protect, getProfile);
router.put ('/profile',   protect, updateProfile);
router.put ('/fcm-token', protect, updateFcmToken);

module.exports = router;