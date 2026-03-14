const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Video, Exam, ExamResult } = require('../models/otherModels');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/education/videos
router.get('/videos', protect, asyncHandler(async (req, res) => {
  const videos = await Video.find({ status: 'published' }).sort({ createdAt: -1 });
  res.json(videos.map((v) => ({
    id: v._id, title: v.title, category: v.category,
    videoUrl: v.videoUrl, thumbnail: v.thumbnail,
    views: v.views, status: v.status,
  })));
}));

// POST /api/education/videos
router.post('/videos', protect, adminOnly, asyncHandler(async (req, res) => {
  const video = await Video.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json(video);
}));

// PUT /api/education/videos/:id/view
router.put('/videos/:id/view', protect, asyncHandler(async (req, res) => {
  await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ message: 'View counted' });
}));

// GET /api/education/exams
router.get('/exams', protect, asyncHandler(async (req, res) => {
  const exams = await Exam.find({ status: 'published' });
  const results = await Promise.all(exams.map(async (e) => {
    const taken = await ExamResult.countDocuments({ exam: e._id });
    return { id: e._id, title: e.title, category: e.category, questions: e.questions.length, duration: e.duration, taken };
  }));
  res.json(results);
}));

// GET /api/education/exams/:id
router.get('/exams/:id', protect, asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error('Exam not found'); }
  // strip answers before sending to client
  const questions = exam.questions.map((q) => ({ _id: q._id, question: q.question, options: q.options }));
  res.json({ id: exam._id, title: exam.title, duration: exam.duration, totalMarks: exam.totalMarks, questions });
}));

// POST /api/education/exams
router.post('/exams', protect, adminOnly, asyncHandler(async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(exam);
}));

// POST /api/education/exams/:id/submit
router.post('/exams/:id/submit', protect, asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error('Exam not found'); }
  const { answers } = req.body;
  let score = 0;
  exam.questions.forEach((q) => {
    if (answers[q._id.toString()] === q.answer) score++;
  });
  const total   = exam.questions.length;
  const passed  = total > 0 && score / total >= 0.6;
  const result  = await ExamResult.create({ exam: exam._id, user: req.user._id, score, total, passed, certificate: passed });
  res.json({ score, total, passed, certificate: passed, resultId: result._id });
}));

// GET /api/education/certificates/count
router.get('/certificates/count', protect, adminOnly, asyncHandler(async (req, res) => {
  const count = await ExamResult.countDocuments({ certificate: true });
  res.json({ count });
}));

module.exports = router;
