const express = require('express');
const router = express.Router();
// Import EVERYTHING from the controller to be safe
const { 
    registerUser, loginUser, getUsers, getBranchAgents, 
    getBranchCoordinators, getBranchManagers, deleteUser, 
    assignBranch, updateUserRole 
} = require('../controllers/userController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// GET routes
router.get('/branch-agents', protect, coordinator, getBranchAgents);
router.get('/branch-coordinators', protect, branchManager, getBranchCoordinators);
router.get('/managers', protect, admin, getBranchManagers); // For admin modals
router.get('/', protect, admin, getUsers);

// DELETE route
router.delete('/:id', protect, admin, deleteUser);

// PUT routes
router.put('/:id', protect, admin, updateUserRole); // General role update
router.put('/assign-branch/:id', protect, admin, assignBranch);

module.exports = router;
