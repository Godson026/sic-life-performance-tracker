const express = require('express');
const router = express.Router();
const { createBranch, getBranches, getBranchDetails } = require('../controllers/branchController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getBranches);
router.post('/', protect, admin, createBranch);
router.get('/:id', protect, admin, getBranchDetails);

module.exports = router;
