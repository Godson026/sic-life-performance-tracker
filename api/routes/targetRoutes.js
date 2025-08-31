const express = require('express');
const { setBranchTarget, setCoordinatorTarget, getMyTargets } = require('../controllers/targetController');
const { protect, admin, branchManager } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin route for setting branch targets
router.post('/branch', protect, admin, setBranchTarget);

// Branch Manager route for setting coordinator targets
router.post('/coordinator', protect, branchManager, setCoordinatorTarget);

// Route for getting user's targets (protected for all authenticated users)
router.get('/mytargets', protect, getMyTargets);

module.exports = router;
