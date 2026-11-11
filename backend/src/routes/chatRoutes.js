const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, clearChatHistory } = require('../controllers/chatController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Student chat with EduBot advising assistant
router.post('/', authenticateToken, authorizeRoles('student'), sendMessage);
router.get('/history', authenticateToken, authorizeRoles('student'), getChatHistory);
router.delete('/history', authenticateToken, authorizeRoles('student'), clearChatHistory);

module.exports = router;
