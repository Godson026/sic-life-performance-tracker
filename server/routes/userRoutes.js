const express = require('express');
const { registerUser, loginUser, getUsers, deleteUser, assignBranch, getBranchAgents, getBranchCoordinators, getBranchUsers, updateUserRole } = require('../controllers/userController');
const { protect, admin, coordinator, branchManager } = require('../middleware/authMiddleware');

const router = express.Router();

// POST route for user registration
router.post('/', registerUser);

// POST route for admin to create users (protected + admin only)
router.post('/admin/create', protect, admin, registerUser);

// POST route for user login
router.post('/login', loginUser);

// GET route for admin to fetch all users (protected + admin only)
router.route('/').get(protect, admin, getUsers);

// GET route for coordinators to fetch branch agents (protected + coordinator only)
router.get('/branch-agents', protect, coordinator, getBranchAgents);

// GET route for branch managers to fetch branch coordinators (protected + branch manager only)
router.get('/branch-coordinators', protect, branchManager, getBranchCoordinators);

// GET route for branch managers to fetch all branch users (protected + branch manager only)
router.get('/branch-users', protect, branchManager, getBranchUsers);

// DELETE route for admin to delete a user (protected + admin only)
// PUT route for admin to assign a branch to a user (protected + admin only)
router.route('/:id').delete(protect, admin, deleteUser).put(protect, admin, assignBranch);

// PUT route for admin to update user role (protected + admin only)
router.put('/:id/role', protect, admin, updateUserRole);

module.exports = router;
