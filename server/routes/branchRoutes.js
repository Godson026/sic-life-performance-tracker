const express = require('express');
const router = express.Router();
const { createBranch, getBranches, getBranchStats, getBranchDetails } = require('../controllers/branchController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all branches (all authenticated users)
router.get('/', protect, getBranches);

// Create new branch (admin only)
router.post('/', protect, admin, createBranch);

// Get branch statistics (MUST come before /:id routes)
router.get('/stats', protect, admin, getBranchStats);

// Get branch details by ID (admin only)
router.get('/:id', protect, admin, getBranchDetails);

module.exports = router;
