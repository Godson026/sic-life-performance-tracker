const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Flexible leaderboard route with query parameters
router.route('/').get(protect, getLeaderboard);

module.exports = router;
