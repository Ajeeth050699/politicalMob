const newsItems = [
  {
    id: 1,
    title: "New Road Development Project - Anna Nagar",
    level: "District",
    date: "Mar 10",
    status: "published",
  },
  {
    id: 2,
    title: "Blood Donation Camp - Mar 15 @ Booth #12",
    level: "Booth",
    date: "Mar 9",
    status: "published",
  },
  {
    id: 3,
    title: "CM Welfare Scheme — New Beneficiary List",
    level: "State",
    date: "Mar 8",
    status: "draft",
  },
  {
    id: 4,
    title: "Women Employment Camp - Coimbatore",
    level: "District",
    date: "Mar 7",
    status: "published",
  },
];

const camps = [
      {
        name: "Medical Camp",
        location: "Anna Nagar, Chennai",
        date: "Mar 15",
        type: "medical",
        slots: 120,
      },
      {
        name: "Blood Donation Drive",
        location: "RS Puram, Coimbatore",
        date: "Mar 18",
        type: "blood",
        slots: 80,
      },
      {
        name: "Women Welfare Camp",
        location: "Alwarpet, Chennai",
        date: "Mar 20",
        type: "women",
        slots: 150,
      },
      {
        name: "Employment Guidance",
        location: "Salem HQ",
        date: "Mar 22",
        type: "employment",
        slots: 200,
      },
      {
        name: "Educational Guidance",
        location: "Madurai Booth #23",
        date: "Mar 25",
        type: "education",
        slots: 100,
      },
    ];

const getNews = async (req, res) => {
  res.json(newsItems);
};

const getCamps = async (req, res) => {
    res.json(camps);
}

module.exports = {
  getNews,
  getCamps,
};
