const getAnalyticsStats = async (req, res) => {
  res.json({
    avgResolutionTime: "4.2h",
    citizenSatisfaction: "94%",
    workerEfficiency: "87%",
    repeatComplaints: "3.1%",
  });
};

module.exports = {
  getAnalyticsStats,
};
