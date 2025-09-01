const Branch = require('../models/branchModel');
const User = require('../models/userModel');
const SalesRecord = require('../models/salesRecordModel');
const Target = require('../models/targetModel');
const mongoose = require('mongoose');

const createBranch = async (req, res) => {
  try {
    const { name, location } = req.body;

    // Basic validation
    if (!name || !location) {
      return res.status(400).json({
        message: 'Please provide both name and location'
      });
    }

    // Create new branch
    const branch = await Branch.create({
      name,
      location
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Error in createBranch:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A branch with this name already exists'
      });
    }
    
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({}).sort({ createdAt: -1 });
    
    // Populate branch manager and coordinator information
    const populatedBranches = await Promise.all(
      branches.map(async (branch) => {
        const branchManager = await User.findOne({ 
          branch: branch._id, 
          role: 'branch_manager' 
        }).select('name email');
        
        const branchCoordinator = await User.findOne({ 
          branch: branch._id, 
          role: 'coordinator' 
        }).select('name email');
        
        const totalAgents = await User.countDocuments({ 
          branch: branch._id, 
          role: 'agent' 
        });

        return {
          ...branch.toObject(),
          branchManager,
          branchCoordinator,
          totalAgents
        };
      })
    );

    res.status(200).json(populatedBranches);
  } catch (error) {
    console.error('Error in getBranches:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getBranchStats = async (req, res) => {
  try {
    const totalBranches = await Branch.countDocuments({});
    const branchManagers = await User.countDocuments({ role: 'branch_manager' });
    const totalAgents = await User.countDocuments({ role: 'agent' });

    res.status(200).json({
      totalBranches,
      branchManagers,
      totalAgents
    });
  } catch (error) {
    console.error('Error in getBranchStats:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const getBranchDetails = async (req, res) => {
  try {
    const branchId = req.params.id;

    // Validate branchId format before using it
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: 'Invalid branch ID format' });
    }

    // Use Promise.all to fetch all data in parallel for this branch
    const [
      branchInfo,
      manager,
      agents,
      currentTarget,
      salesThisMonth,
      branchRank
    ] = await Promise.all([
      Branch.findById(branchId),
      User.findOne({ branch: branchId, role: 'branch_manager' }),
      User.find({ branch: branchId, role: 'agent' }),
      Target.findOne({ 
        branch: branchId, 
        target_type: 'sales',
        // Get the most recent target for current month
        start_date: { 
          $lte: new Date() 
        },
        end_date: { 
          $gte: new Date() 
        }
      }),
      SalesRecord.aggregate([
        { 
          $match: { 
            branch: new mongoose.Types.ObjectId(branchId),
            date: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          } 
        },
        { 
          $group: { 
            _id: null, 
            totalSales: { $sum: '$sales_amount' },
            totalRegistrations: { $sum: '$new_registrations' }
          } 
        }
      ]),
      // A simplified ranking query for this specific purpose
      SalesRecord.aggregate([
        { 
          $match: { 
            date: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          } 
        },
        { 
          $group: { 
            _id: "$branch", 
            totalSales: { $sum: "$sales_amount" } 
          } 
        },
        { 
          $sort: { totalSales: -1 } 
        }
      ])
    ]);

    if (!branchInfo) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Calculate the rank
    const rank = branchRank.findIndex(b => b._id.toString() === branchId) + 1;

    // Calculate achievement percentage
    const targetAmount = currentTarget ? currentTarget.amount : 0;
    const achievedAmount = salesThisMonth[0]?.totalSales || 0;
    const achievementPercentage = targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0;

    res.json({
      branchInfo,
      manager,
      agents,
      currentTarget: targetAmount,
      achieved: achievedAmount,
      ranking: rank > 0 ? rank : 'N/A',
      achievementPercentage,
      totalRegistrations: salesThisMonth[0]?.totalRegistrations || 0,
      monthYear: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });

  } catch (error) {
    console.error('Error fetching branch details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        message: 'Please provide both name and location'
      });
    }

    const branch = await Branch.findByIdAndUpdate(
      id,
      { name, location },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json(branch);
  } catch (error) {
    console.error('Error in updateBranch:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A branch with this name already exists'
      });
    }
    
    res.status(500).json({
      message: 'Server error'
    });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are users assigned to this branch
    const usersInBranch = await User.countDocuments({ branch: id });
    if (usersInBranch > 0) {
      return res.status(400).json({
        message: 'Cannot delete branch. There are users assigned to this branch. Please reassign users first.'
      });
    }

    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBranch:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchStats,
  getBranchDetails,
  updateBranch,
  deleteBranch
};
