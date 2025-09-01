const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Send response without password
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and populate branch information
    const user = await User.findOne({ email }).populate('branch', 'name location');

    // Check if user exists and password matches
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({
        message: 'Invalid email or password'
      });
    }

  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('branch', 'name');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.deleteOne();
    res.status(200).json({ message: 'User removed' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const assignBranch = async (req, res) => {
  try {
    const { branchId } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if branch exists (optional validation)
    if (branchId) {
      const Branch = require('../models/branchModel');
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({ message: 'Branch not found' });
      }
    }

    // Update user's branch assignment
    user.branch = branchId || null; // Allow null to unassign
    await user.save();

    // Return updated user with populated branch
    const updatedUser = await User.findById(userId).select('-password').populate('branch', 'name');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in assignBranch:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getBranchAgents = async (req, res) => {
  try {
    // Check if coordinator has a branch assigned
    if (!req.user.branch) {
      return res.status(400).json({ 
        message: 'You must be assigned to a branch to view agents' 
      });
    }

    // Find all agents assigned to the same branch as the coordinator
    const agents = await User.find({
      role: 'agent',
      branch: req.user.branch
    }).select('-password').populate('branch', 'name');

    res.status(200).json(agents);
  } catch (error) {
    console.error('Error in getBranchAgents:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getBranchCoordinators = async (req, res) => {
  try {
    // Check if branch manager has a branch assigned
    if (!req.user.branch) {
      return res.status(400).json({ 
        message: 'You must be assigned to a branch to view coordinators' 
      });
    }

    // Find all coordinators assigned to the same branch as the branch manager
    const coordinators = await User.find({
      role: 'coordinator',
      branch: req.user.branch
    }).select('-password').populate('branch', 'name');

    res.status(200).json(coordinators);
  } catch (error) {
    console.error('Error in getBranchCoordinators:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc Get all Branch Managers (for Admin forms)
const getBranchManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'branch_manager' }).populate('branch', 'name');
        res.json(managers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getBranchUsers = async (req, res) => {
  try {
    // Check if branch manager has a branch assigned
    if (!req.user.branch) {
      return res.status(400).json({ 
        message: 'You must be assigned to a branch to view users' 
      });
    }

    // Find all users assigned to the same branch as the branch manager
    const users = await User.find({
      branch: req.user.branch
    }).select('-password').populate('branch', 'name');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getBranchUsers:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Validate role
    const validRoles = ['admin', 'branch_manager', 'coordinator', 'agent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be one of: admin, branch_manager, coordinator, agent'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's role
    user.role = role;
    await user.save();

    // Return updated user with populated branch
    const updatedUser = await User.findById(userId).select('-password').populate('branch', 'name');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// --- EXPORTS ---
// Ensure every function is exported
module.exports = {
    registerUser,
    loginUser,
    getUsers,
    getBranchAgents,
    getBranchCoordinators,
    getBranchManagers,
    deleteUser,
    assignBranch,
    updateUserRole
};
