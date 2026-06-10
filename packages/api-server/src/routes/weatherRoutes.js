const express = require('express');
const router = express.Router();
const { getCurrentWeather, getActiveAlerts } = require('../controllers/weatherController');
const asyncHandler = require('express-async-handler');

// NOTE: no protect here because mobile may call without auth,
// but you can add auth middleware if your app requires it.
router.get('/weather/current', getCurrentWeather);
router.get('/alerts/active', getActiveAlerts);


module.exports = router;

