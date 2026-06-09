const SystemSettings = require('../models/systemSettingsModel');

// @desc    Get system settings
// @route   GET /api/developer/settings
// @access  Private/Developer
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/developer/settings
// @access  Private/Developer
const updateSettings = async (req, res) => {
  try {
    const { maintenanceMode, featureFlags } = req.body;
    
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({});
    }
    
    if (maintenanceMode) {
      settings.maintenanceMode = { ...settings.maintenanceMode, ...maintenanceMode };
    }
    
    if (featureFlags) {
      settings.featureFlags = featureFlags;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
