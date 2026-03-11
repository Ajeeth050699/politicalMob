const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
const complaintRoutes = require('./routes/complaintRoutes');
app.use('/api/complaints', complaintRoutes);
const workerRoutes = require('./routes/workerRoutes');
app.use('/api/workers', workerRoutes);
const newsRoutes = require('./routes/newsRoutes');
app.use('/api/news', newsRoutes);
const educationRoutes = require('./routes/educationRoutes');
app.use('/api/education', educationRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('PoliticalMob API is running!');
});

// Basic MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/politicalMob';

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

module.exports = app;
