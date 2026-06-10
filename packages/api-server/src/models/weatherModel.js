const mongoose = require('mongoose');

const weatherSnapshotSchema = new mongoose.Schema(
  {
    district: { type: String, index: true },
    ward: { type: String, index: true },

    // For future: allow lat/lng
    lat: Number,
    lng: Number,

    provider: { type: String, default: 'internal-sim' },
    timezone: { type: String },

    // normalized fields for UI
    temperatureC: { type: Number },
    condition: { type: String },
    precipitationMm: { type: Number, default: 0 },

    raw: { type: Object },

    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

weatherSnapshotSchema.index({ district: 1, ward: 1, fetchedAt: -1 });

const weatherAlertSchema = new mongoose.Schema(
  {
    district: { type: String, index: true },
    ward: { type: String, index: true },

    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      index: true,
    },

    alertType: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },

    isActive: { type: Boolean, default: true, index: true },

    expiresAt: { type: Date, index: true },

    // optional linkage to weather snapshot
    weatherSnapshotId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

weatherAlertSchema.index({ district: 1, ward: 1, isActive: 1, expiresAt: 1 });

module.exports = {
  WeatherSnapshot: mongoose.model('WeatherSnapshot', weatherSnapshotSchema),
  WeatherAlert: mongoose.model('WeatherAlert', weatherAlertSchema),
};

