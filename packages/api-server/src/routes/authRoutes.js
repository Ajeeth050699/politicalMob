const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
