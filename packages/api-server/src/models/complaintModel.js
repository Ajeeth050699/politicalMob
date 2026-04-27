const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    // ── Who filed ──────────────────────────────────────────────────
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Details ───────────────────────────────────────────────────
    category: {
      type: String,
      enum: [
        'Street Light Problem', 'Road Damage', 'Garbage Issue',
        'Water Supply Problem', 'Drainage Issue', 'Public Safety Issue', 'Others',
      ],
      required: true,
    },
    description: { type: String, required: true },

    // ── Location matching ─────────────────────────────────────────
    booth:    { type: String, required: true },
    district: { type: String, required: true },
    pincode:  { type: String },   // for fallback matching
    address:  { type: String },

    // ── Status flow: NEW → ACCEPTED → IN PROGRESS → COMPLETED ─────
    status: {
      type: String,
      enum: ['NEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED'],
      default: 'NEW',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

    // ── Agent assignment ──────────────────────────────────────────
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt:     { type: Date },
    lockedToAgent:  { type: Boolean, default: false },

    // ── Proof ─────────────────────────────────────────────────────
    proofPhoto: { type: String },
    proofVideo: { type: String },

    // ── Citizen attachments ───────────────────────────────────────
    attachments: [
      {
        url:      { type: String, required: true },
        type:     { type: String, enum: ['image', 'video', 'document'], default: 'image' },
        filename: { type: String },
      },
    ],

    // ── Fallback & escalation ─────────────────────────────────────
    fallbackUsed:     { type: Boolean, default: false },
    routingLevel:     { type: String, enum: ['booth', 'pincode', 'nearby', 'admin'], default: 'booth' },
    escalatedToAdmin: { type: Boolean, default: false },
    escalatedAt:      { type: Date },

    // ── Location ──────────────────────────────────────────────────
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
