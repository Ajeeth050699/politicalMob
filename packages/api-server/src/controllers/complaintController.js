const complaints = [
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
  {
    id: "CMP-1039",
    category: "Garbage Issue",
    user: "Lakshmi P.",
    booth: "Booth #23",
    district: "Salem",
    status: "IN PROGRESS",
    time: "3h ago",
    priority: "medium",
  },
  {
    id: "CMP-1038",
    category: "Drainage",
    user: "Vijay N.",
    booth: "Booth #61",
    district: "Trichy",
    status: "COMPLETED",
    time: "5h ago",
    priority: "low",
  },
  {
    id: "CMP-1037",
    category: "Public Safety",
    user: "Preethi K.",
    booth: "Booth #34",
    district: "Chennai",
    status: "NEW",
    time: "6h ago",
    priority: "high",
  },
];

const getComplaints = async (req, res) => {
  res.json(complaints);
};

module.exports = {
  getComplaints,
};
