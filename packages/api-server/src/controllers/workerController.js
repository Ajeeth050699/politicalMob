const workers = [
  {
    id: 1,
    name: "Rajan K.",
    booth: "Booth #12",
    district: "Chennai",
    resolved: 94,
    pending: 3,
    rating: 4.9,
    status: "active",
  },
  {
    id: 2,
    name: "Priya S.",
    booth: "Booth #47",
    district: "Coimbatore",
    resolved: 87,
    pending: 5,
    rating: 4.7,
    status: "active",
  },
  {
    id: 3,
    name: "Murugan T.",
    booth: "Booth #89",
    district: "Madurai",
    resolved: 76,
    pending: 8,
    rating: 4.5,
    status: "active",
  },
  {
    id: 4,
    name: "Kavitha R.",
    booth: "Booth #23",
    district: "Salem",
    resolved: 68,
    pending: 12,
    rating: 4.3,
    status: "busy",
  },
  {
    id: 5,
    name: "Selvam P.",
    booth: "Booth #61",
    district: "Trichy",
    resolved: 55,
    pending: 15,
    rating: 4.1,
    status: "busy",
  },
  {
    id: 6,
    name: "Anitha M.",
    booth: "Booth #34",
    district: "Chennai",
    resolved: 43,
    pending: 19,
    rating: 3.8,
    status: "offline",
  },
];

const getWorkers = async (req, res) => {
  res.json(workers);
};

module.exports = {
  getWorkers,
};
