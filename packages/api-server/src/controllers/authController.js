const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, booth, district, address } =
    req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    booth,
    district,
    address,
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      booth: user.booth,
      district: user.district,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      booth: user.booth,
      district: user.district,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      booth: user.booth,
      district: user.district,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.booth = req.body.booth || user.booth;
    user.district = req.body.district || user.district;
    user.address = req.body.address || user.address;
    if (req.body.password) user.password = req.body.password;
    const u = await user.save();
    res.json({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      booth: u.booth,
      district: u.district,
      token: generateToken(u._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateFcmToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.fcmToken = req.body.fcmToken;
    await user.save();
    res.status(200).json({ message: "FCM token updated successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;
  const message = `Password reset request. Make a PUT request to:\n\n${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Email could not be sent");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error("Invalid token");
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.status(201).json({ success: true, data: "Password reset successful" });
});

const otpStore = {};

const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400);
    throw new Error("Phone number is required");
  }
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) {
    res.status(400);
    throw new Error("Enter a valid 10-digit phone number");
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log(`\n📱 OTP for ${phone} → ${otp}  (expires in 5 min)\n`);
  res
    .status(200)
    .json({
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400);
    throw new Error("Phone and OTP are required");
  }
  const record = otpStore[phone];
  if (!record) {
    res.status(400);
    throw new Error("OTP not found. Please request a new one");
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    res.status(400);
    throw new Error("OTP expired. Please request a new one");
  }
  if (record.otp !== String(otp)) {
    res.status(400);
    throw new Error("Invalid OTP. Please try again");
  }
  delete otpStore[phone];
  res
    .status(200)
    .json({ message: "OTP verified successfully", verified: true });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateFcmToken,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
};
