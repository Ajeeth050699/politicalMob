const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    phone:    { type: String },
    password: { type: String, required: true },
    role:     { type: String, enum: ['superadmin', 'admin', 'worker', 'public'], default: 'public' },
    booth:    { type: String },
    district: { type: String },
    address:  { type: String },
    pincode:  { type: String },          // booth fallback matching

    isActive:        { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    fcmToken: { type: String },

    // Phone OTP (registration)
    phoneVerificationOtp:        { type: String },
    phoneVerificationOtpExpires: { type: Date   },

    // Email verification
    emailVerificationToken:        { type: String },
    emailVerificationTokenExpires: { type: Date  },

    // Password reset (token)
    resetPasswordToken:  { type: String },
    resetPasswordExpire: { type: Date   },

    // Password reset (OTP - for web admin forgot password)
    resetOtp:       { type: String },
    resetOtpExpire: { type: Date   },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);
