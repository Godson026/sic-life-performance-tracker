const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

// Flexible leaderboard route with query parameters
router.get('/', protect, getLeaderboard);

module.exports = router;
