const notifications = [
  {
    id: 1,
    msg: "CMP-1042 assigned to Rajan K. (Booth #12)",
    time: "12m ago",
    type: "complaint",
  },
  {
    id: 2,
    msg: "Worker Anitha M. has gone offline",
    time: "1h ago",
    type: "worker",
  },
  {
    id: 3,
    msg: "New camp announced: Medical camp – Salem",
    time: "2h ago",
    type: "camp",
  },
  {
    id: 4,
    msg: "State news published: CM Welfare Scheme",
    time: "3h ago",
    type: "news",
  },
  {
    id: 5,
    msg: "CMP-1038 marked COMPLETED by Selvam P.",
    time: "5h ago",
    type: "complaint",
  },
];

const getNotifications = async (req, res) => {
  res.json(notifications);
};

module.exports = {
  getNotifications,
};
