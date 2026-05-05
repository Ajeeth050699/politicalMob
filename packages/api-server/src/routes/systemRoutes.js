const express = require('express');
const { TN_ASSEMBLY_CONSTITUENCIES } = require('../constants/wards');
const { ROLE_PLANS } = require('../constants/subscriptions');

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

module.exports = router;
