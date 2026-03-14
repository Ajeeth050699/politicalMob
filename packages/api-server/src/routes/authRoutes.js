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
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── Public routes ─────────────────────────────────────────────────
router.post('/register',        register);
router.post('/login',           login);
router.post('/send-otp',        sendOtp);
router.post('/verify-otp',      verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// ── Private routes ────────────────────────────────────────────────
router.get ('/profile',   protect, getProfile);
router.put ('/profile',   protect, updateProfile);
router.put ('/fcm-token', protect, updateFcmToken);

module.exports = router;