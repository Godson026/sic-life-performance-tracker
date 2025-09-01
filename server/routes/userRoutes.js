const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, getBranchAgents, getBranchCoordinators, getBranchManagers, deleteUser, assignBranch, updateUserRole } = require('../controllers/userController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, admin, getUsers);
router.get('/branch-agents', protect, coordinator, getBranchAgents);
router.get('/branch-coordinators', protect, branchManager, getBranchCoordinators);
router.get('/managers', protect, admin, getBranchManagers);
router.delete('/:id', protect, admin, deleteUser);
router.put('/:id', protect, admin, updateUserRole);
router.put('/assign-branch/:id', protect, admin, assignBranch);

module.exports = router;
