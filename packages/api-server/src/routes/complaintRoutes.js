const express = require('express');
const router  = express.Router();
const {
  getComplaints,
  createComplaint,
  getComplaintById,
  acceptComplaint,
  updateComplaintStatus,
  uploadProof,
  deleteComplaint,
  escalatePending,
} = require('../controllers/complaintController');
const { protect, adminOnly, workerOrAdmin } = require('../middleware/authMiddleware');

// ── Main routes ───────────────────────────────────────────────────
router.route('/')
  .get(protect,  getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .get(protect,              getComplaintById)
  .delete(protect, adminOnly, deleteComplaint);

// ── Agent actions ─────────────────────────────────────────────────
router.put('/:id/accept', protect, workerOrAdmin, acceptComplaint);    // ← NEW
router.put('/:id/status', protect, workerOrAdmin, updateComplaintStatus);
router.put('/:id/proof',  protect, workerOrAdmin, uploadProof);

// ── Admin / cron ──────────────────────────────────────────────────
router.post('/escalate-pending', protect, adminOnly, escalatePending); // ← NEW

module.exports = router;