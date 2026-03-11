const express = require('express');
const router = express.Router();
const {
  getStats,
  getWeeklyComplaints,
  getComplaintsByCategory,
  getRecentComplaints,
  getDistrictPerformance,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/complaints/weekly', protect, getWeeklyComplaints);
router.get('/complaints/by-category', protect, getComplaintsByCategory);
router.get('/complaints/recent', protect, getRecentComplaints);
router.get('/districts/performance', protect, getDistrictPerformance);

module.exports = router;
