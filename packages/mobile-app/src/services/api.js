import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";

// ─────────────────────────────────────────────────────────────────
// Backend is running on PORT 5003
//
// Android Emulator  →  http://10.0.2.2:5003   (maps to PC localhost)
// iOS Simulator     →  http://localhost:5003
// Physical device   →  http://YOUR_PC_IP:5003  (run `ipconfig` on Windows)
// ─────────────────────────────────────────────────────────────────
// export const BASE_URL = 'http://192.168.0.103:5003';
const BASE_URL = __DEV__
  ? Constants.expoConfig.extra.API_URL_DEV
  : Constants.expoConfig.extra.API_URL_PROD;
// export const BASE_URL = 'http://localhost:5003';
// export const BASE_URL = 'http://192.168.0.102:5003'; // ← your PC IP

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
});

// Attach JWT to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const raw = await AsyncStorage.getItem('userInfo');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore storage errors
  }
  return config;
});

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)       => api.post('/auth/login', data),
  register:       (data)       => api.post('/auth/register', data),
  getProfile:     ()           => api.get('/auth/profile'),
  updateProfile:  (data)       => api.put('/auth/profile', data),
  updateFcmToken: (token)      => api.put('/auth/fcm-token', { fcmToken: token }),
  sendOtp:        (phone)      => api.post('/auth/send-otp', { phone }),
  verifyOtp:      (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  verifyPhoneEmail: (user_json_url)   => api.post('/auth/verify-phone-email', { user_json_url }), // ← phone.email
  verifyBooth:      (booth, district) => api.post('/auth/verify-booth', { booth, district }),           // ← NEW
  forgotPassword:   (email)           => api.post('/auth/forgot-password', { email }),
  verifyResetOtp:  (email, otp)      => api.post('/auth/verify-reset-otp', { email, otp }), // ← NEW
  resetPassword:   (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }), // ← UPDATED
};

// ── COMPLAINTS ───────────────────────────────────────────────────
export const complaintAPI = {
  getAll:          (params)   => api.get('/complaints', { params }),
  getById:         (id)       => api.get(`/complaints/${id}`),
  create:          (data)     => api.post('/complaints', data),
  accept:          (id)       => api.put(`/complaints/${id}/accept`),   // ← NEW
  updateStatus:    (id, data) => api.put(`/complaints/${id}/status`, data),
  uploadProof:     (id, data) => api.put(`/complaints/${id}/proof`, data),
  escalatePending: ()         => api.post('/complaints/escalate-pending'), // ← NEW
  delete:          (id)       => api.delete(`/complaints/${id}`),
};

// ── WORKERS ──────────────────────────────────────────────────────
export const workerAPI = {
  getAll:  (params) => api.get('/workers', { params }),
  create:  (data)   => api.post('/workers', data),
  update:  (id, d)  => api.put(`/workers/${id}`, d),
  delete:  (id)     => api.delete(`/workers/${id}`),
};

// ── NEWS & CAMPS ─────────────────────────────────────────────────
export const newsAPI = {
  getAll:     (params) => api.get('/news', { params }),
  create:     (data)   => api.post('/news', data),
  update:     (id, d)  => api.put(`/news/${id}`, d),
  delete:     (id)     => api.delete(`/news/${id}`),
  getCamps:   ()       => api.get('/news/camps'),
  createCamp: (data)   => api.post('/news/camps', data),
  updateCamp: (id, d)  => api.put(`/news/camps/${id}`, d),
  deleteCamp: (id)     => api.delete(`/news/camps/${id}`),
};

// ── EDUCATION ────────────────────────────────────────────────────
export const educationAPI = {
  getVideos:     ()      => api.get('/education/videos'),
  createVideo:   (data)  => api.post('/education/videos', data),
  incrementView: (id)    => api.put(`/education/videos/${id}/view`),
  getExams:      ()      => api.get('/education/exams'),
  getExamById:   (id)    => api.get(`/education/exams/${id}`),
  createExam:    (data)  => api.post('/education/exams', data),
  submitExam:    (id, d) => api.post(`/education/exams/${id}/submit`, d),
  getCertCount:  ()      => api.get('/education/certificates/count'),
};

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const notificationAPI = {
  getAll:  ()     => api.get('/notifications'),
  create:  (data) => api.post('/notifications', data),
};

// ── DASHBOARD ────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:            () => api.get('/dashboard/stats'),
  getWeekly:           () => api.get('/dashboard/complaints/weekly'),
  getByCategory:       () => api.get('/dashboard/complaints/by-category'),
  getRecentComplaints: () => api.get('/dashboard/complaints/recent'),
  getDistrictPerf:     () => api.get('/dashboard/districts/performance'),
};

// ── ANALYTICS ────────────────────────────────────────────────────
export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
};

// ── EMERGENCY ────────────────────────────────────────────────────
export const emergencyAPI = {
  getAll:  ()     => api.get('/emergency'),
  create:  (data) => api.post('/emergency', data),
};

export default api;