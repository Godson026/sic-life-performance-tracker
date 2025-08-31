const express = require('express');
const { 
  createBranch, 
  getBranches, 
  getBranchStats, 
  getBranchDetails, 
  updateBranch, 
  deleteBranch 
} = require('../controllers/branchController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected admin routes for branch management
router.route('/')
  .post(protect, admin, createBranch)
  .get(protect, admin, getBranches);

// Get branch statistics (MUST come before /:id routes)
router.get('/stats', protect, admin, getBranchStats);

// Get detailed branch information
router.get('/:id', protect, admin, getBranchDetails);

// Update and delete specific branch
router.route('/:id')
  .put(protect, admin, updateBranch)
  .delete(protect, admin, deleteBranch);

module.exports = router;
