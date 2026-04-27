const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const complaintRoutes    = require('./routes/complaintRoutes');
const workerRoutes       = require('./routes/workerRoutes');
const newsRoutes         = require('./routes/newsRoutes');
const educationRoutes    = require('./routes/educationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const emergencyRoutes    = require('./routes/emergencyRoutes');

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://political-mob.vercel.app', // Deployed frontend
  'http://localhost:5173',            // Local Vite dev server
  'http://localhost:8081',            // Local Expo dev server
];

if (process.env.CORS_ALLOWED_ORIGINS) {
  // Add origins from environment variable, splitting by comma
  allowedOrigins.push(...process.env.CORS_ALLOWED_ORIGINS.split(','));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and requests from whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/workers',       workerRoutes);
app.use('/api/news',          newsRoutes);
app.use('/api/education',     educationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/emergency',     emergencyRoutes);

app.get('/', (req, res) => {
  res.send('PoliticalMob API is running!');
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/politicalMob';

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// ── Start server ──────────────────────────────────────────────────


module.exports = app;
