const Target = require('../models/targetModel');
const User = require('../models/userModel');

const setBranchTarget = async (req, res) => {
  try {
    const { branchId, target_type, amount, start_date, end_date } = req.body;
    
    // --- ENHANCED VALIDATION WITH SPECIFIC ERROR MESSAGES ---
    
    // Check if branchId exists and is valid
    if (!branchId) {
      return res.status(400).json({
        message: 'Please select a branch.'
      });
    }
    
    // Validate branchId format (MongoDB ObjectId)
    if (!require('mongoose').Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        message: 'Invalid branch ID format.'
      });
    }
    
    // Check if target_type is valid
    if (!target_type || !['sales', 'registration'].includes(target_type)) {
      return res.status(400).json({
        message: 'Please select a valid target type (sales or registration).'
      });
    }
    
    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        message: 'Please enter a valid positive target amount.'
      });
    }
    
    // Validate start_date
    if (!start_date) {
      return res.status(400).json({
        message: 'Please provide a start date.'
      });
    }
    
    // Validate end_date
    if (!end_date) {
      return res.status(400).json({
        message: 'Please provide an end date.'
      });
    }
    
    // Convert dates and validate
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Please provide valid dates in the correct format.'
      });
    }
    
    // Check if start date is not in the past (optional business rule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return res.status(400).json({
        message: 'Start date cannot be in the past.'
      });
    }
    
    // Check if end date is after start date
    if (startDate >= endDate) {
      return res.status(400).json({
        message: 'End date must be after start date.'
      });
    }
    
    // Check if branch exists
    const Branch = require('../models/branchModel');
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(404).json({
        message: 'Selected branch not found.'
      });
    }
    
    // Check for overlapping targets (optional business rule)
    const overlappingTarget = await Target.findOne({
      branch: branchId,
      target_type,
      $or: [
        {
          start_date: { $lte: endDate },
          end_date: { $gte: startDate }
        }
      ]
    });
    
    if (overlappingTarget) {
      return res.status(400).json({
        message: 'A target already exists for this branch and type during the specified period.'
      });
    }
    
    // Create new branch target
    const target = await Target.create({
      target_type,
      amount: Number(amount),
      start_date: startDate,
      end_date: endDate,
      branch: branchId,
      setBy: req.user._id // Track who set the target
    });

    // Populate the branch reference for better response
    const populatedTarget = await Target.findById(target._id)
      .populate('branch', 'name location')
      .populate('setBy', 'name');
    
    res.status(201).json({
      message: 'Branch target set successfully!',
      target: populatedTarget
    });
    
  } catch (error) {
    console.error('Error in setBranchTarget:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A target with these exact parameters already exists.'
      });
    }
    
    res.status(500).json({
      message: 'Server error occurred while setting branch target.'
    });
  }
};

const setCoordinatorTarget = async (req, res) => {
  try {
    const { coordinatorId, target_type, amount, start_date, end_date } = req.body;
    
    // Validate required fields
    if (!coordinatorId || !target_type || !amount || !start_date || !end_date) {
      return res.status(400).json({
        message: 'Please provide all required fields: coordinatorId, target_type, amount, start_date, end_date'
      });
    }

    // Validate numeric values
    if (amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be a positive number'
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    // Check if coordinator exists and get their branch
    const coordinator = await User.findById(coordinatorId).populate('branch');
    if (!coordinator) {
      return res.status(404).json({
        message: 'Coordinator not found'
      });
    }

    if (coordinator.role !== 'coordinator') {
      return res.status(400).json({
        message: 'Target can only be set for users with coordinator role'
      });
    }

    // Check if branch manager is assigned to the same branch as the coordinator
    if (!req.user.branch || !coordinator.branch || 
        req.user.branch.toString() !== coordinator.branch._id.toString()) {
      return res.status(403).json({
        message: 'You can only set targets for coordinators in your branch'
      });
    }

    // Create new coordinator target
    const target = await Target.create({
      target_type,
      amount: Number(amount),
      start_date: startDate,
      end_date: endDate,
      coordinator: coordinatorId
    });

    // Populate the coordinator reference for better response
    const populatedTarget = await Target.findById(target._id)
      .populate('coordinator', 'name')
      .populate('branch', 'name');
    
    res.status(201).json(populatedTarget);
  } catch (error) {
    console.error('Error in setCoordinatorTarget:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getMyTargets = async (req, res) => {
  try {
    let targets = [];

    if (req.user.role === 'branch_manager') {
      // Branch managers see targets set for their branch
      targets = await Target.find({ branch: req.user.branch })
        .populate('branch', 'name')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'coordinator') {
      // Coordinators see targets set for them personally
      targets = await Target.find({ coordinator: req.user._id })
        .populate('coordinator', 'name')
        .populate('branch', 'name')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'admin') {
      // Admins see all targets
      targets = await Target.find({})
        .populate('branch', 'name')
        .populate('coordinator', 'name')
        .sort({ createdAt: -1 });
    }

    res.status(200).json(targets);
  } catch (error) {
    console.error('Error in getMyTargets:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {
  setBranchTarget,
  setCoordinatorTarget,
  getMyTargets
};
