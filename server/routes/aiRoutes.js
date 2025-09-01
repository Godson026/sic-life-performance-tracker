const express = require('express');
const router = express.Router();
const { getAIInsights } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/summary', protect, admin, getAIInsights);

module.exports = router;
