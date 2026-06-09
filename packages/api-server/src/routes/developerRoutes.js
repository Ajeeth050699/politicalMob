const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/developerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/settings')
  .get(protect, authorize('developer'), getSettings)
  .put(protect, authorize('developer'), updateSettings);

module.exports = router;
