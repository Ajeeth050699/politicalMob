const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      mobileApp: { type: Boolean, default: false },
      adminPortal: { type: Boolean, default: false },
      superAdminPortal: { type: Boolean, default: false },
      api: { type: Boolean, default: false },
      message: { type: String, default: 'System is currently under maintenance. Please try again later.' }
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
