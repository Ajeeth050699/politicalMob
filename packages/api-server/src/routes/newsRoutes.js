const express = require('express');
const router = express.Router();
const { getNews, getCamps } = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNews);
router.get('/camps', protect, getCamps);

module.exports = router;
