const express = require('express');
const router = express.Router();
const { createBranch, getBranches, getBranchStats, getBranchDetails } = require('../controllers/branchController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBranches) // All authenticated users can see branches
    .post(protect, admin, createBranch);

// Get branch statistics (MUST come before /:id routes)
router.get('/stats', protect, admin, getBranchStats);

router.route('/:id')
    .get(protect, admin, getBranchDetails);

module.exports = router;
