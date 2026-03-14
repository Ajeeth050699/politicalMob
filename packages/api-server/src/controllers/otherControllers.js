const asyncHandler = require('express-async-handler');
const News         = require('../models/newsModel');
const { Camp, Video, Exam, ExamResult, Notification, Emergency } = require('../models/otherModels');

// ══════════════════════════════════════════════════════════════════
// NEWS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/news
const getNews = asyncHandler(async (req, res) => {
  const { level, district, booth } = req.query;
  let filter = { status: 'published' };
  if (level)    filter.level    = level;
  if (district) filter.district = district;
  if (booth)    filter.booth    = booth;

  const news = await News.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json(news.map((n) => ({
    id:          n._id,
    title:       n.title,
    description: n.description,
    level:       n.level,
    status:      n.status,
    date:        n.createdAt.toLocaleDateString('en-IN'),
    imageUrl:    n.imageUrl,
  })));
});

// @route POST /api/news
const createNews = asyncHandler(async (req, res) => {
  const { title, description, level, district, booth, status } = req.body;
  const news = await News.create({
    title, description, level, district, booth, status,
    createdBy: req.user._id,
  });
  res.status(201).json(news);
});

// @route PUT /api/news/:id
const updateNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!news) { res.status(404); throw new Error('News not found'); }
  res.json(news);
});

// @route DELETE /api/news/:id
const deleteNews = asyncHandler(async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ message: 'News deleted' });
});

// ══════════════════════════════════════════════════════════════════
// CAMPS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/news/camps
const getCamps = asyncHandler(async (req, res) => {
  const camps = await Camp.find().sort({ date: 1 });
  res.json(camps.map((c) => ({
    id:       c._id,
    name:     c.name,
    type:     c.type,
    location: c.location,
    district: c.district,
    date:     c.date.toLocaleDateString('en-IN'),
    slots:    c.slots,
    status:   c.status,
  })));
});

// @route POST /api/news/camps
const createCamp = asyncHandler(async (req, res) => {
  const camp = await Camp.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(camp);
});

// @route PUT /api/news/camps/:id
const updateCamp = asyncHandler(async (req, res) => {
  const camp = await Camp.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!camp) { res.status(404); throw new Error('Camp not found'); }
  res.json(camp);
});

// @route DELETE /api/news/camps/:id
const deleteCamp = asyncHandler(async (req, res) => {
  await Camp.findByIdAndDelete(req.params.id);
  res.json({ message: 'Camp deleted' });
});

// ══════════════════════════════════════════════════════════════════
// VIDEOS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/education/videos
const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ status: 'published' }).sort({ createdAt: -1 });
  res.json(videos.map((v) => ({
    id:        v._id,
    title:     v.title,
    category:  v.category,
    videoUrl:  v.videoUrl,
    thumbnail: v.thumbnail,
    views:     v.views,
    status:    v.status,
  })));
});

// @route POST /api/education/videos
const createVideo = asyncHandler(async (req, res) => {
  const video = await Video.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json(video);
});

// @route PUT /api/education/videos/:id/view
const incrementVideoView = asyncHandler(async (req, res) => {
  await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ message: 'View counted' });
});

// ══════════════════════════════════════════════════════════════════
// EXAMS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/education/exams
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ status: 'published' });
  const results = await Promise.all(
    exams.map(async (e) => {
      const taken = await ExamResult.countDocuments({ exam: e._id });
      return {
        id:        e._id,
        title:     e.title,
        category:  e.category,
        questions: e.questions.length,
        duration:  e.duration,
        taken,
      };
    })
  );
  res.json(results);
});

// @route GET /api/education/exams/:id
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error('Exam not found'); }

  // Strip answers before sending to client
  const questions = exam.questions.map((q) => ({
    _id:      q._id,
    question: q.question,
    options:  q.options,
  }));

  res.json({
    id:         exam._id,
    title:      exam.title,
    duration:   exam.duration,
    totalMarks: exam.totalMarks,
    questions,
  });
});

// @route POST /api/education/exams
const createExam = asyncHandler(async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(exam);
});

// @route POST /api/education/exams/:id/submit
const submitExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error('Exam not found'); }

  const { answers } = req.body; // { questionId: selectedOptionIndex }
  let score = 0;
  exam.questions.forEach((q) => {
    if (answers[q._id.toString()] === q.answer) score++;
  });

  const total  = exam.questions.length;
  const passed = total > 0 && score / total >= 0.6;
  const result = await ExamResult.create({
    exam:        exam._id,
    user:        req.user._id,
    score,
    total,
    passed,
    certificate: passed,
  });

  res.json({ score, total, passed, certificate: passed, resultId: result._id });
});

// @route GET /api/education/certificates/count
const getCertificateCount = asyncHandler(async (req, res) => {
  const count = await ExamResult.countDocuments({ certificate: true });
  res.json({ count });
});

// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifs = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json(notifs.map((n) => ({
    id:   n._id,
    msg:  n.msg,
    type: n.type,
    time: n.createdAt,
  })));
});

// @route POST /api/notifications
const createNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(notif);
});

// ══════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════

// @route GET /api/analytics/stats
const getAnalyticsStats = asyncHandler(async (req, res) => {
  const Complaint = require('../models/complaintModel');

  const resolved = await Complaint.find({ status: 'COMPLETED' }).select('createdAt updatedAt');
  let avgHours = 0;
  if (resolved.length > 0) {
    const totalMs = resolved.reduce((sum, c) => sum + (c.updatedAt - c.createdAt), 0);
    avgHours = Math.round(totalMs / resolved.length / 3600000);
  }

  const repeatAgg = await Complaint.aggregate([
    { $group: { _id: { booth: '$booth', category: '$category' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  res.json({
    avgResolutionTime:   `${avgHours}h`,
    citizenSatisfaction: '87%',
    workerEfficiency:    '91%',
    repeatComplaints:    repeatAgg.length,
  });
});

// ══════════════════════════════════════════════════════════════════
// EMERGENCY
// ══════════════════════════════════════════════════════════════════

// @route GET /api/emergency
const getEmergencyContacts = asyncHandler(async (req, res) => {
  const contacts = await Emergency.find();
  if (contacts.length === 0) {
    return res.json([
      { name: 'Police',           number: '100',  type: 'police'   },
      { name: 'Ambulance',        number: '108',  type: 'ambulance'},
      { name: 'Fire Service',     number: '101',  type: 'fire'     },
      { name: 'Women Helpline',   number: '181',  type: 'women'    },
      { name: 'Child Helpline',   number: '1098', type: 'child'    },
      { name: 'District Control', number: '1077', type: 'district' },
    ]);
  }
  res.json(contacts);
});

// @route POST /api/emergency
const createEmergency = asyncHandler(async (req, res) => {
  const contact = await Emergency.create(req.body);
  res.status(201).json(contact);
});

module.exports = {
  // news
  getNews, createNews, updateNews, deleteNews,
  // camps
  getCamps, createCamp, updateCamp, deleteCamp,
  // videos
  getVideos, createVideo, incrementVideoView,
  // exams
  getExams, getExamById, createExam, submitExam, getCertificateCount,
  // notifications
  getNotifications, createNotification,
  // analytics
  getAnalyticsStats,
  // emergency
  getEmergencyContacts, createEmergency,
};