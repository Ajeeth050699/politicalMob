const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envName = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, '..', `.env.${envName}`) });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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
const systemRoutes       = require('./routes/systemRoutes');
const billingRoutes      = require('./routes/billingRoutes');
const realtimeRoutes     = require('./routes/realtimeRoutes');
const developerRoutes    = require('./routes/developerRoutes');
const weatherRoutes      = require('./routes/weatherRoutes');
const SystemSettings     = require('./models/systemSettingsModel');


const app = express();

const allowedOrigins = [
  'https://political-mob.vercel.app',
  'https://political-mob-21fu.vercel.app/', // Deployed frontend // Deployed frontend
  'http://localhost:5173',            // Local Vite dev server
  'http://localhost:5174',            // Local Vite dev server (Super Admin)
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
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));


// Global Maintenance Middleware
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/system/public-settings') || req.path.startsWith('/api/developer')) {
    return next();
  }
  try {
    const settings = await SystemSettings.findOne();
    if (settings && settings.maintenanceMode && settings.maintenanceMode.api) {
      if (req.path === '/api/auth/login') {
        return next();
      }
      
      // Allow developer bypass
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          if (user && user.role === 'developer') {
             return next();
          }
        } catch (e) {
          // ignore error, fall through to 503
        }
      }

      return res.status(503).json({ message: settings.maintenanceMode.message || 'API is under maintenance' });
    }
    next();
  } catch (err) {
    next();
  }
});
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
app.use('/api/system',        systemRoutes);
app.use('/api/developer',     developerRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/realtime',      realtimeRoutes);
app.use(weatherRoutes);

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
