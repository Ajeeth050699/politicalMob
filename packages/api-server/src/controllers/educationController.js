const videos = [
  {
    id: 1,
    title: "Tamil Nadu History — Class 8",
    category: "Educational",
    views: 1240,
    status: "published",
  },
  {
    id: 2,
    title: "TNPSC Group 2 Preparation",
    category: "Competitive Exam",
    views: 3450,
    status: "published",
  },
  {
    id: 3,
    title: "Women Entrepreneurship Basics",
    category: "Women Skills",
    views: 890,
    status: "published",
  },
  {
    id: 4,
    title: "General Knowledge — Current Affairs",
    category: "GK",
    views: 2100,
    status: "draft",
  },
];

const exams = [
  {
    id: 1,
    title: "TNPSC General Awareness Mock",
    questions: 50,
    duration: "60 min",
    taken: 312,
  },
  {
    id: 2,
    title: "Women Self-Employment Basics",
    questions: 30,
    duration: "40 min",
    taken: 189,
  },
  {
    id: 3,
    title: "Civic Knowledge Test",
    questions: 25,
    duration: "30 min",
    taken: 450,
  },
];

const getVideos = async (req, res) => {
  res.json(videos);
};

const getExams = async (req, res) => {
    res.json(exams);
}

module.exports = {
  getVideos,
  getExams,
};
