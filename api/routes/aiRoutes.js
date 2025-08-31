const express = require('express');
const router = express.Router();
const { getAIInsights, getAIInsightsByDateRange } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

// This route is protected and only accessible by admins
router.route('/summary').get(protect, admin, getAIInsights);

// Route for getting AI insights for specific date ranges (admin only)
router.route('/insights-by-date').get(protect, admin, getAIInsightsByDateRange);

module.exports = router;
