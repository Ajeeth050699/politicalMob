const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    const User = require('./src/models/userModel');

    const existing = await User.findOne({ email: 'admin@peopleconnect.com' });
    if (existing) {
      console.log('⚠️  Admin already exists. Login with admin@peopleconnect.com / admin123');
      process.exit();
    }

    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      name:     'Admin',
      email:    'admin@peopleconnect.com',
      phone:    '9999999999',
      password: hash,
      role:     'admin',
      district: 'Chennai',
      booth:    'Admin',
      isActive: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:    admin@peopleconnect.com');
    console.log('🔒 Password: admin123');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });