const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, getBranchAgents, getBranchCoordinators, getBranchManagers, deleteUser, assignBranch, updateUserRole } = require('../controllers/userController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/branch-agents', protect, coordinator, getBranchAgents);
router.get('/branch-coordinators', protect, branchManager, getBranchCoordinators);
router.get('/managers', protect, admin, getBranchManagers); // For admin modals

router.route('/')
    .get(protect, admin, getUsers);

router.route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUserRole); // General purpose update

router.put('/assign-branch/:id', protect, admin, assignBranch); // Specific branch assignment

module.exports = router;
