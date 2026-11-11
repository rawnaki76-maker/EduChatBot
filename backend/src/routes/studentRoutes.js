const express = require('express');
const router = express.Router();
const { getMyProfile, getStudentById, getAllStudents } = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Current student profile
router.get('/profile', authenticateToken, authorizeRoles('student'), getMyProfile);

// List all students (Teacher & Admin)
router.get('/', authenticateToken, authorizeRoles('teacher', 'admin'), getAllStudents);

// Get specific student by ID (Teacher & Admin)
router.get('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), getStudentById);

module.exports = router;
