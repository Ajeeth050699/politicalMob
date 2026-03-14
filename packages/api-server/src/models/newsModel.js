const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    level:       { type: String, enum: ['Booth', 'District', 'State'], required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    booth:       { type: String },
    district:    { type: String },
    status:      { type: String, enum: ['published', 'draft'], default: 'published' },
    imageUrl:    { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);