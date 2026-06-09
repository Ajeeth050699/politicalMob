const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'developer' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Admins only');
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'developer' || req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Super admin only');
  }
};

// Admin or Worker
const workerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'developer' || req.user.role === 'superadmin' || req.user.role === 'admin' || req.user.role === 'worker' || req.user.role === 'agent')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Workers or Admins only');
  }
};

// Developer only
const developerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'developer') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Developers only');
  }
};

// Authorize by roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'developer')) {
      res.status(403);
      throw new Error(`User role ${req.user ? req.user.role : 'unknown'} is not authorized`);
    }
    next();
  };
};

module.exports = { protect, adminOnly, superAdminOnly, workerOrAdmin, developerOnly, authorize };
