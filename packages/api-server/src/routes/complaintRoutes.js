const express = require('express');
const router = express.Router();
const { getComplaints } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getComplaints);

module.exports = router;
