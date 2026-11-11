const express = require('express');
const router = express.Router();
const {
  upload,
  uploadMaterial,
  getMaterialsByCourse,
  getAllMaterials,
  downloadMaterial
} = require('../controllers/materialController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all materials
router.get('/', authenticateToken, getAllMaterials);

// Get materials for specific course
router.get('/course/:courseId', authenticateToken, getMaterialsByCourse);

// Download material file
router.get('/download/:filename', downloadMaterial);

// Upload material (Teacher and Admin only)
router.post('/upload', authenticateToken, authorizeRoles('teacher', 'admin'), upload.single('file'), uploadMaterial);

module.exports = router;
