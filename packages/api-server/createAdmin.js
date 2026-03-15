const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    const User = require('./src/models/userModel');

    // Remove existing admin if any (fresh start)
    await User.deleteOne({ email: 'admin@peopleconnect.com' });

    // Create admin — let the model's pre-save hook hash the password
    const admin = new User({
      name:     'Admin',
      email:    'admin@peopleconnect.com',
      phone:    '9999999999',
      password: 'admin123',   // plain text — model will hash it
      role:     'admin',
      district: 'Chennai',
      booth:    'Admin',
      isActive: true,
    });

    await admin.save();

    console.log('✅ Admin created!');
    console.log('📧 Email:    admin@peopleconnect.com');
    console.log('🔒 Password: admin123');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });