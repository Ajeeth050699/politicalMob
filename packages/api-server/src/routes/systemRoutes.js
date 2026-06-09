const express = require('express');
const { TN_ASSEMBLY_CONSTITUENCIES } = require('../constants/wards');
const { ROLE_PLANS } = require('../constants/subscriptions');
const SystemSettings = require('../models/systemSettingsModel');

const router = express.Router();

router.get('/wards', (req, res) => {
  res.json({
    count: TN_ASSEMBLY_CONSTITUENCIES.length,
    wards: TN_ASSEMBLY_CONSTITUENCIES,
  });
});

router.get('/pricing', (req, res) => {
  res.json({
    currency: 'INR',
    plans: ROLE_PLANS,
  });
});


router.get('/public-settings', async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    if (settings) {
      res.json({
        maintenanceMode: settings.maintenanceMode,
        featureFlags: settings.featureFlags
      });
    } else {
      res.json({
        maintenanceMode: { mobileApp: false, adminPortal: false, superAdminPortal: false, api: false, message: '' },
        featureFlags: {}
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

