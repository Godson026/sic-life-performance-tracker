const express = require('express');
const router = express.Router();
const { buildBranch, getBranches, getBranchDetails } = require('../controllers/branchController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBranches) // All authenticated users can see branches
    .post(protect, admin, buildBranch);

router.route('/:id')
    .get(protect, admin, getBranchDetails);

module.exports = router;
