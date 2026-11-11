const express = require('express');
const router = express.Router();
const {
  createSlot,
  getAvailableSlots,
  bookSlot,
  getSessions,
  updateSessionStatus,
  getEscalations,
  resolveEscalation,
  exportAdvisingSummary
} = require('../controllers/advisingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Slots
router.post('/slots', authenticateToken, authorizeRoles('teacher', 'admin'), createSlot);
router.get('/slots', authenticateToken, getAvailableSlots);

// Booking
router.post('/book', authenticateToken, authorizeRoles('student'), bookSlot);

// Sessions
router.get('/sessions', authenticateToken, getSessions);
router.patch('/sessions/:id', authenticateToken, authorizeRoles('teacher', 'admin'), updateSessionStatus);

// Escalations
router.get('/escalations', authenticateToken, authorizeRoles('teacher', 'admin'), getEscalations);
router.patch('/escalations/:id', authenticateToken, authorizeRoles('teacher', 'admin'), resolveEscalation);

// Export summary
router.get('/summary/:studentId?', authenticateToken, exportAdvisingSummary);

module.exports = router;
