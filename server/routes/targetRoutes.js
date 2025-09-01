const express = require('express');
const router = express.Router();
const { setBranchTarget, setCoordinatorTarget, getMyTargets } = require('../controllers/targetController');
const { protect, admin, branchManager } = require('../middleware/authMiddleware');

router.post('/branch', protect, admin, setBranchTarget);
router.post('/coordinator', protect, branchManager, setCoordinatorTarget);
router.get('/mytargets', protect, getMyTargets);

module.exports = router;
