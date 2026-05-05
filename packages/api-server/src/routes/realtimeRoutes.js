const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { complaintEvents } = require('../realtime/complaintEvents');

const router = express.Router();

router.get('/complaints', protect, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const send = (event) => {
    const complaint = event.complaint || {};
    const userId = String(req.user._id);
    const canReceive =
      ['admin', 'superadmin'].includes(req.user.role) ||
      String(complaint.userId || complaint.user?._id || complaint.user || '') === userId ||
      String(complaint.assignedWorkerId || complaint.assignedWorker?._id || complaint.assignedWorker || '') === userId ||
      (
        ['worker', 'agent'].includes(req.user.role) &&
        String(complaint.ward || complaint.booth || '').trim().toLowerCase() === String(req.user.ward || req.user.booth || '').trim().toLowerCase()
      );

    if (canReceive) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  complaintEvents.on('complaint', send);
  res.write(`data: ${JSON.stringify({ type: 'connected', emittedAt: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    complaintEvents.off('complaint', send);
  });
});

module.exports = router;
