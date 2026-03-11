const getStats = async (req, res) => {
  res.json({
    totalComplaints: 1248,
    pending: 147,
    completed: 1089,
    activeWorkers: 234,
  });
};

const getWeeklyComplaints = async (req, res) => {
  res.json([
    { day: "Mon", complaints: 142, resolved: 118 },
    { day: "Tue", complaints: 189, resolved: 154 },
    { day: "Wed", complaints: 167, resolved: 143 },
    { day: "Thu", complaints: 213, resolved: 187 },
    { day: "Fri", complaints: 198, resolved: 172 },
    { day: "Sat", complaints: 145, resolved: 130 },
    { day: "Sun", complaints: 98, resolved: 89 },
  ]);
};

const getComplaintsByCategory = async (req, res) => {
  res.json([
    { name: "Road", value: 28, color: "#7B1C1C" },
    { name: "Water", value: 22, color: "#C9982A" },
    { name: "Light", value: 18, color: "#3b82f6" },
    { name: "Garbage", value: 16, color: "#22c55e" },
    { name: "Drainage", value: 10, color: "#f59e0b" },
    { name: "Safety", value: 6, color: "#ef4444" },
  ]);
};

const getRecentComplaints = async (req, res) => {
  res.json([
    {
      id: "CMP-1042",
      category: "Road Damage",
      user: "Arjun V.",
      booth: "Booth #12",
      district: "Chennai",
      status: "NEW",
      time: "12m ago",
      priority: "high",
    },
    {
      id: "CMP-1041",
      category: "Water Supply",
      user: "Meena R.",
      booth: "Booth #47",
      district: "Coimbatore",
      status: "IN PROGRESS",
      time: "45m ago",
      priority: "medium",
    },
    {
      id: "CMP-1040",
      category: "Street Light",
      user: "Kumar S.",
      booth: "Booth #89",
      district: "Madurai",
      status: "COMPLETED",
      time: "2h ago",
      priority: "low",
    },
  ]);
};

const getDistrictPerformance = async (req, res) => {
  res.json([
    { district: "Chennai", total: 312, resolved: 289, pending: 23 },
    { district: "Coimbatore", total: 245, resolved: 218, pending: 27 },
    { district: "Madurai", total: 198, resolved: 171, pending: 27 },
    { district: "Salem", total: 167, resolved: 142, pending: 25 },
    { district: "Trichy", total: 143, resolved: 121, pending: 22 },
  ]);
};

module.exports = {
  getStats,
  getWeeklyComplaints,
  getComplaintsByCategory,
  getRecentComplaints,
  getDistrictPerformance,
};
