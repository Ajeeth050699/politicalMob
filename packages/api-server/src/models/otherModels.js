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

const mockQuestionSchema = new mongoose.Schema({
  question:    { type: String, required: true },
  options:     [{ type: String, required: true }],
  answer:      { type: Number, required: true },
  explanation: { type: String },
  topic:       { type: String, index: true },
  difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
});

const mockTestSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, index: true },
    category:        { type: String, default: 'General', index: true },
    examType:        { type: String, default: 'Government Jobs', index: true },
    durationMinutes: { type: Number, default: 30 },
    totalMarks:      { type: Number, default: 10 },
    negativeMarks:   { type: Number, default: 0 },
    instructions:    { type: String },
    questions:       [mockQuestionSchema],
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:          { type: String, enum: ['published', 'draft'], default: 'published', index: true },
  },
  { timestamps: true }
);

mockTestSchema.index({ title: 'text', category: 'text', examType: 'text', 'questions.topic': 'text' });

const mockTestResultSchema = new mongoose.Schema(
  {
    mockTest:       { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true, index: true },
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers:        { type: Map, of: Number, default: {} },
    score:          { type: Number, required: true, index: true },
    total:          { type: Number, required: true },
    correct:        { type: Number, default: 0 },
    wrong:          { type: Number, default: 0 },
    unanswered:     { type: Number, default: 0 },
    timeTakenSec:   { type: Number, default: 0 },
    accuracy:       { type: Number, default: 0, index: true },
    passed:         { type: Boolean, default: false },
    weakTopics:     [{ type: String }],
    difficultyBand: { type: String, enum: ['foundation', 'intermediate', 'advanced'], default: 'foundation', index: true },
  },
  { timestamps: true }
);

mockTestResultSchema.index({ user: 1, createdAt: -1 });
mockTestResultSchema.index({ score: -1, accuracy: -1, timeTakenSec: 1 });

const jobApplicationSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:    { type: String, enum: ['saved', 'applied'], default: 'saved' },
    note:      { type: String },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

const governmentJobSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, index: true },
    department:      { type: String, required: true, index: true },
    category:        { type: String, default: 'General', index: true },
    location:        { type: String, default: 'Tamil Nadu', index: true },
    qualification:   { type: String, default: 'Any Degree' },
    vacancies:       { type: Number, default: 0 },
    salary:          { type: String },
    applicationUrl:  { type: String },
    notificationUrl: { type: String },
    applyBy:         { type: Date, index: true },
    examDate:        { type: Date },
    year:            { type: Number, index: true },
    status:          { type: String, enum: ['upcoming', 'live', 'previous'], default: 'upcoming', index: true },
    tags:            [{ type: String }],
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applications:    [jobApplicationSchema],
  },
  { timestamps: true }
);

governmentJobSchema.index({ title: 'text', department: 'text', category: 'text', qualification: 'text', tags: 'text' });

// ── Notification ──────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    user:                 { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    msg:                  { type: String, required: true },
    type:                 { type: String, enum: ['complaint', 'worker', 'camp', 'news', 'announcement'], default: 'announcement' },
    targetRole:           { type: String, enum: ['all', 'public', 'worker', 'admin'], default: 'all' },
    targetDistrict:       { type: String },
    createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readBy:               [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    relatedComplaintId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    relatedWorkerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:               { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
    actionUrl:            { type: String },
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
  MockTest:      mongoose.model('MockTest', mockTestSchema),
  MockTestResult: mongoose.model('MockTestResult', mockTestResultSchema),
  GovernmentJob: mongoose.model('GovernmentJob', governmentJobSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Emergency:    mongoose.model('Emergency', emergencySchema),
};
