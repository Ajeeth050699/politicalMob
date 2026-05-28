const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Video, Exam, ExamResult, MockTest, MockTestResult, GovernmentJob, Notification } = require('../models/otherModels');
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

const jobDto = (job, userId) => {
  const applications = job.applications || [];
  const mine = applications.find((a) => a.user?.toString() === userId?.toString());
  return {
    id: job._id,
    title: job.title,
    department: job.department,
    category: job.category,
    location: job.location,
    qualification: job.qualification,
    vacancies: job.vacancies,
    salary: job.salary,
    applicationUrl: job.applicationUrl,
    notificationUrl: job.notificationUrl,
    applyBy: job.applyBy,
    examDate: job.examDate,
    year: job.year,
    status: job.status,
    tags: job.tags || [],
    applications: applications.length,
    myApplication: mine ? { status: mine.status, appliedAt: mine.appliedAt, note: mine.note } : null,
  };
};

const mockTestListDto = async (test) => {
  const taken = await MockTestResult.countDocuments({ mockTest: test._id });
  return {
    id: test._id,
    title: test.title,
    category: test.category,
    examType: test.examType,
    questions: test.questions.length,
    duration: `${test.durationMinutes} mins`,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    negativeMarks: test.negativeMarks,
    taken,
    status: test.status,
  };
};

// GET /api/education/mock-tests
router.get('/mock-tests', protect, asyncHandler(async (req, res) => {
  const { status = 'published', category, q, limit = 50, page = 1 } = req.query;
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (category && category !== 'all') filter.category = category;
  if (q) filter.$text = { $search: q };
  const safeLimit = Math.min(Number(limit) || 50, 100);
  const skip = Math.max(Number(page) - 1, 0) * safeLimit;
  const [tests, total] = await Promise.all([
    MockTest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    MockTest.countDocuments(filter),
  ]);
  const data = await Promise.all(tests.map(mockTestListDto));
  res.json({ data, total, page: Number(page) || 1, limit: safeLimit });
}));

// GET /api/education/mock-tests/:id
router.get('/mock-tests/:id', protect, asyncHandler(async (req, res) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) { res.status(404); throw new Error('Mock test not found'); }
  const questions = test.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
    topic: q.topic,
    difficulty: q.difficulty,
  }));
  res.json({
    id: test._id,
    title: test.title,
    category: test.category,
    examType: test.examType,
    duration: `${test.durationMinutes} mins`,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    negativeMarks: test.negativeMarks,
    instructions: test.instructions,
    questions,
  });
}));

// POST /api/education/mock-tests
router.post('/mock-tests', protect, adminOnly, asyncHandler(async (req, res) => {
  const test = await MockTest.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(await mockTestListDto(test));
}));

// PUT /api/education/mock-tests/:id
router.put('/mock-tests/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const test = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!test) { res.status(404); throw new Error('Mock test not found'); }
  res.json(await mockTestListDto(test));
}));

// POST /api/education/mock-tests/:id/submit
router.post('/mock-tests/:id/submit', protect, asyncHandler(async (req, res) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) { res.status(404); throw new Error('Mock test not found'); }
  const answers = req.body.answers || {};
  let correct = 0;
  let wrong = 0;
  const weakTopics = [];
  test.questions.forEach((q) => {
    const value = answers[q._id.toString()];
    if (value === undefined || value === null) return;
    if (Number(value) === q.answer) {
      correct++;
    } else {
      wrong++;
      if (q.topic) weakTopics.push(q.topic);
    }
  });
  const unanswered = Math.max(test.questions.length - correct - wrong, 0);
  const rawScore = correct - (wrong * (test.negativeMarks || 0));
  const score = Math.max(0, Number(rawScore.toFixed(2)));
  const total = test.questions.length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const passed = total > 0 && score / total >= 0.6;
  const difficultyBand = accuracy >= 80 ? 'advanced' : accuracy >= 60 ? 'intermediate' : 'foundation';
  const result = await MockTestResult.create({
    mockTest: test._id,
    user: req.user._id,
    answers,
    score,
    total,
    correct,
    wrong,
    unanswered,
    timeTakenSec: Number(req.body.timeTakenSec) || 0,
    accuracy,
    passed,
    weakTopics: [...new Set(weakTopics)],
    difficultyBand,
  });
  res.json({
    score,
    total,
    correct,
    wrong,
    unanswered,
    accuracy,
    passed,
    certificate: passed,
    resultId: result._id,
    weakTopics: result.weakTopics,
    timeTakenSec: result.timeTakenSec,
  });
}));

// GET /api/education/mock-test-analytics/aggregate
router.get('/mock-test-analytics/aggregate', protect, adminOnly, asyncHandler(async (req, res) => {
  const [summary, categoryRows, recent] = await Promise.all([
    MockTestResult.aggregate([
      { $group: { _id: null, attempts: { $sum: 1 }, avgAccuracy: { $avg: '$accuracy' }, avgScore: { $avg: '$score' }, passCount: { $sum: { $cond: ['$passed', 1, 0] } } } },
    ]),
    MockTestResult.aggregate([
      { $lookup: { from: 'mocktests', localField: 'mockTest', foreignField: '_id', as: 'test' } },
      { $unwind: '$test' },
      { $group: { _id: '$test.category', attempts: { $sum: 1 }, avgAccuracy: { $avg: '$accuracy' } } },
      { $sort: { attempts: -1 } },
    ]),
    MockTestResult.find().populate('mockTest', 'title category').populate('user', 'name district').sort({ createdAt: -1 }).limit(10),
  ]);
  const s = summary[0] || {};
  res.json({
    attempts: s.attempts || 0,
    avgAccuracy: Math.round(s.avgAccuracy || 0),
    avgScore: Number((s.avgScore || 0).toFixed(2)),
    passRate: s.attempts ? Math.round(((s.passCount || 0) / s.attempts) * 100) : 0,
    categories: categoryRows.map((r) => ({ category: r._id || 'General', attempts: r.attempts, avgAccuracy: Math.round(r.avgAccuracy || 0) })),
    recent: recent.map((r) => ({
      id: r._id,
      test: r.mockTest?.title || 'Mock Test',
      category: r.mockTest?.category || 'General',
      user: r.user?.name || 'Learner',
      district: r.user?.district || 'Tamil Nadu',
      score: r.score,
      total: r.total,
      accuracy: r.accuracy,
      time: r.createdAt,
    })),
  });
}));

// GET /api/education/government-jobs
router.get('/government-jobs', protect, asyncHandler(async (req, res) => {
  const { status, category, location, q, year, limit = 50, page = 1 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (category && category !== 'all') filter.category = category;
  if (location && location !== 'all') filter.location = new RegExp(location, 'i');
  if (year) filter.year = Number(year);
  if (q) filter.$text = { $search: q };

  const safeLimit = Math.min(Number(limit) || 50, 100);
  const skip = Math.max(Number(page) - 1, 0) * safeLimit;
  const [jobs, total] = await Promise.all([
    GovernmentJob.find(filter).sort({ status: 1, applyBy: 1, createdAt: -1 }).skip(skip).limit(safeLimit),
    GovernmentJob.countDocuments(filter),
  ]);

  res.json({
    data: jobs.map((job) => jobDto(job, req.user._id)),
    page: Number(page) || 1,
    limit: safeLimit,
    total,
  });
}));

// GET /api/education/government-jobs/summary
router.get('/government-jobs/summary', protect, asyncHandler(async (req, res) => {
  const [live, upcoming, previous, applications, latestNotifications] = await Promise.all([
    GovernmentJob.countDocuments({ status: 'live' }),
    GovernmentJob.countDocuments({ status: 'upcoming' }),
    GovernmentJob.countDocuments({ status: 'previous' }),
    GovernmentJob.countDocuments({ 'applications.user': req.user._id }),
    Notification.find({ type: 'announcement', msg: /job|recruitment|exam/i }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    live,
    upcoming,
    previous,
    applications,
    updates: latestNotifications.map((n) => ({ id: n._id, msg: n.msg, time: n.createdAt })),
  });
}));

// POST /api/education/government-jobs
router.post('/government-jobs', protect, adminOnly, asyncHandler(async (req, res) => {
  const job = await GovernmentJob.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(jobDto(job, req.user._id));
}));

// PUT /api/education/government-jobs/:id
router.put('/government-jobs/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const job = await GovernmentJob.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!job) { res.status(404); throw new Error('Government job not found'); }
  res.json(jobDto(job, req.user._id));
}));

// POST /api/education/government-jobs/:id/apply
router.post('/government-jobs/:id/apply', protect, asyncHandler(async (req, res) => {
  const job = await GovernmentJob.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Government job not found'); }

  const existing = job.applications.find((a) => a.user.toString() === req.user._id.toString());
  if (existing) {
    existing.status = req.body.status || 'applied';
    existing.note = req.body.note;
    existing.appliedAt = existing.status === 'applied' ? new Date() : existing.appliedAt;
  } else {
    job.applications.push({
      user: req.user._id,
      status: req.body.status || 'applied',
      note: req.body.note,
      appliedAt: (req.body.status || 'applied') === 'applied' ? new Date() : undefined,
    });
  }
  await job.save();
  res.json(jobDto(job, req.user._id));
}));

// GET /api/education/jobs/analytics
router.get('/jobs/analytics', protect, asyncHandler(async (req, res) => {
  const [attempts, best, recent] = await Promise.all([
    MockTestResult.countDocuments({ user: req.user._id }),
    MockTestResult.find({ user: req.user._id }).sort({ score: -1, createdAt: -1 }).limit(1),
    MockTestResult.find({ user: req.user._id }).populate('mockTest', 'title category').sort({ createdAt: -1 }).limit(8),
  ]);
  const totalScore = recent.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalMarks = recent.reduce((sum, r) => sum + (r.total || 0), 0);
  res.json({
    attempts,
    bestScore: best[0] ? Math.round((best[0].score / best[0].total) * 100) : 0,
    averageScore: totalMarks ? Math.round((totalScore / totalMarks) * 100) : 0,
    streak: Math.min(attempts, 7),
    badges: [
      attempts >= 1 ? 'First Attempt' : null,
      attempts >= 5 ? 'Consistent Learner' : null,
      best[0]?.passed ? 'Exam Ready' : null,
    ].filter(Boolean),
    recent: recent.map((r) => ({
      id: r._id,
      exam: r.mockTest?.title || 'Mock Test',
      category: r.mockTest?.category || 'General',
      score: r.score,
      total: r.total,
      passed: r.passed,
      time: r.createdAt,
    })),
  });
}));

// GET /api/education/jobs/leaderboard
router.get('/jobs/leaderboard', protect, asyncHandler(async (req, res) => {
  const rows = await MockTestResult.aggregate([
    { $group: { _id: '$user', score: { $sum: '$score' }, total: { $sum: '$total' }, attempts: { $sum: 1 } } },
    { $sort: { score: -1, attempts: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { name: '$user.name', district: '$user.district', score: 1, total: 1, attempts: 1 } },
  ]);
  res.json(rows.map((row, index) => ({
    rank: index + 1,
    name: row.name || 'Learner',
    district: row.district || 'Tamil Nadu',
    score: row.score,
    attempts: row.attempts,
    accuracy: row.total ? Math.round((row.score / row.total) * 100) : 0,
  })));
}));

// GET /api/education/jobs/adaptive-practice
router.get('/jobs/adaptive-practice', protect, asyncHandler(async (req, res) => {
  const recent = await MockTestResult.find({ user: req.user._id }).populate('mockTest', 'category title').sort({ createdAt: -1 }).limit(10);
  const weak = recent
    .filter((r) => r.total && r.score / r.total < 0.6)
    .flatMap((r) => (r.weakTopics?.length ? r.weakTopics : [r.mockTest?.category]))
    .filter(Boolean);
  const categories = [...new Set(weak)];
  const exams = await MockTest.find({
    status: 'published',
    ...(categories.length ? { category: { $in: categories } } : {}),
  }).limit(5);
  res.json({
    focusAreas: categories.length ? categories : ['General Knowledge', 'Aptitude', 'Current Affairs'],
    nextDifficulty: recent.some((r) => r.total && r.score / r.total >= 0.8) ? 'intermediate' : 'foundation',
    recommendedExams: exams.map((e) => ({ id: e._id, title: e.title, category: e.category, questions: e.questions.length, duration: `${e.durationMinutes} mins` })),
  });
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
