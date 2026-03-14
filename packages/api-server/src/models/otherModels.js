const mongoose = require('mongoose');

// ── Camp ──────────────────────────────────────────────────────────
const campSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    type:      { type: String, enum: ['medical', 'blood', 'women', 'employment', 'education'], required: true },
    location:  { type: String, required: true },
    district:  { type: String },
    date:      { type: Date, required: true },
    slots:     { type: Number, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:    { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

// ── Video ─────────────────────────────────────────────────────────
const videoSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true },
    category:   { type: String, enum: ['Educational', 'General Knowledge', 'Competitive Exam', 'Women Skill', 'Career Guidance'], required: true },
    videoUrl:   { type: String, required: true },
    thumbnail:  { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views:      { type: Number, default: 0 },
    status:     { type: String, enum: ['published', 'draft'], default: 'published' },
  },
  { timestamps: true }
);

// ── Exam ──────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options:  [{ type: String }],
  answer:   { type: Number },
});

const examSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true },
    category:   { type: String },
    duration:   { type: String, default: '30 mins' },
    totalMarks: { type: Number, default: 10 },
    questions:  [questionSchema],
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:     { type: String, enum: ['published', 'draft'], default: 'published' },
  },
  { timestamps: true }
);

// ── ExamResult ────────────────────────────────────────────────────
const examResultSchema = new mongoose.Schema(
  {
    exam:        { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score:       { type: Number, required: true },
    total:       { type: Number, required: true },
    passed:      { type: Boolean, default: false },
    certificate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Notification ──────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    msg:            { type: String, required: true },
    type:           { type: String, enum: ['complaint', 'worker', 'camp', 'news', 'announcement'], default: 'announcement' },
    targetRole:     { type: String, enum: ['all', 'public', 'worker', 'admin'], default: 'all' },
    targetDistrict: { type: String },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// ── Emergency ─────────────────────────────────────────────────────
const emergencySchema = new mongoose.Schema({
  name:     { type: String, required: true },
  number:   { type: String, required: true },
  type:     { type: String, enum: ['police', 'ambulance', 'fire', 'women', 'child', 'district'], required: true },
  district: { type: String },
});

module.exports = {
  Camp:         mongoose.model('Camp', campSchema),
  Video:        mongoose.model('Video', videoSchema),
  Exam:         mongoose.model('Exam', examSchema),
  ExamResult:   mongoose.model('ExamResult', examResultSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Emergency:    mongoose.model('Emergency', emergencySchema),
};