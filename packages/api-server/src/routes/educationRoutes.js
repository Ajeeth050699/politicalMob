const express = require('express');
const router = express.Router();
const { getVideos, getExams } = require('../controllers/educationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/videos', protect, getVideos);
router.get('/exams', protect, getExams);

module.exports = router;
