const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    const User = require('./src/models/userModel');

    await User.deleteOne({ email: 'superadmin@peopleconnect.com' });
    await User.deleteOne({ email: 'admin@peopleconnect.com' });

    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@peopleconnect.com',
      phone: '9000000000',
      password: 'superadmin123',
      role: 'superadmin',
      district: 'Tamil Nadu',
      booth: 'STATE',
      address: 'State Control Room',
      pincode: '600001',
      isActive: true,
    });
    await superAdmin.save();

    const admin = new User({
      name: 'Admin',
      email: 'admin@peopleconnect.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'admin',
      district: 'Chennai',
      booth: 'Admin',
      address: 'Chennai Admin Office',
      pincode: '600001',
      isActive: true,
    });
    await admin.save();

    console.log('Super admin created');
    console.log('Email:    superadmin@peopleconnect.com');
    console.log('Password: superadmin123');
    console.log('Admin created');
    console.log('Email:    admin@peopleconnect.com');
    console.log('Password: admin123');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
