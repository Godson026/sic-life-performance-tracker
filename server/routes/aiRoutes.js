const express = require('express');
const router = express.Router();
const { getAIInsights, getAIInsightsByDateRange } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

// AI insights routes (admin only)
router.get('/summary', protect, admin, getAIInsights);
router.get('/insights-by-date', protect, admin, getAIInsightsByDateRange);

module.exports = router;
