const express = require('express');
const router = express.Router();
const { getWorkers } = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWorkers);

module.exports = router;
