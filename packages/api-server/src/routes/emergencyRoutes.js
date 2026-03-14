const express = require('express');
const eRouter = express.Router();
const { getEmergencyContacts, createEmergency } = require('../controllers/otherControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');
eRouter.get('/',  protect, getEmergencyContacts);
eRouter.post('/', protect, adminOnly, createEmergency);
module.exports = eRouter;
