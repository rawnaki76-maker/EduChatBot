const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse } = require('../controllers/courseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public or authenticated list of courses
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Admin-only course creation
router.post('/', authenticateToken, authorizeRoles('admin'), createCourse);

module.exports = router;
