const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['Street Light Problem', 'Road Damage', 'Garbage Issue', 'Water Supply Problem', 'Drainage Issue', 'Public Safety Issue', 'Others'],
      required: true,
    },
    description:    { type: String, required: true },
    booth:          { type: String, required: true },
    district:       { type: String, required: true },
    status:         { type: String, enum: ['NEW', 'IN PROGRESS', 'COMPLETED'], default: 'NEW' },
    priority:       { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proofPhoto:     { type: String },

    // ── Citizen attachments (uploaded when filing complaint) ──────────
    attachments: [
      {
        url:      { type: String, required: true },
        type:     { type: String, enum: ['image', 'video'], default: 'image' },
        filename: { type: String },
      },
    ],

    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);