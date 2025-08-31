const User = require('../models/userModel');
const Branch = require('../models/branchModel');

/**
 * Middleware to validate sales record creation with full hierarchy
 * This ensures every sales record has proper Agent -> Coordinator -> Branch linkage
 */
const validateSalesRecordHierarchy = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const coordinator = req.user;

    // 1. Validate coordinator has branch assignment
    if (!coordinator.branch) {
      return res.status(400).json({
        message: 'Coordinator must be assigned to a branch to create sales records',
        error: 'MISSING_BRANCH_ASSIGNMENT'
      });
    }

    // 2. Validate agent exists and is active
    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(400).json({
        message: 'Selected agent does not exist',
        error: 'AGENT_NOT_FOUND'
      });
    }

    if (agent.role !== 'agent') {
      return res.status(400).json({
        message: 'Selected user is not an agent',
        error: 'INVALID_AGENT_ROLE'
      });
    }

    // 3. Validate branch exists and is active
    const branch = await Branch.findById(coordinator.branch);
    if (!branch) {
      return res.status(400).json({
        message: 'Coordinator\'s assigned branch does not exist',
        error: 'BRANCH_NOT_FOUND'
      });
    }

    // 4. Validate agent belongs to the same branch as coordinator
    if (agent.branch && agent.branch.toString() !== coordinator.branch.toString()) {
      return res.status(400).json({
        message: 'Agent must belong to the same branch as the coordinator',
        error: 'BRANCH_MISMATCH'
      });
    }

    // 5. Add validated data to request for controller use
    req.validatedData = {
      agent: agent,
      coordinator: coordinator,
      branch: branch,
      agentId: agentId
    };

    next();
  } catch (error) {
    console.error('Sales record validation error:', error);
    res.status(500).json({
      message: 'Validation error occurred',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate sales record update permissions
 */
const validateSalesRecordUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coordinator = req.user;

    // Find the sales record
    const salesRecord = await SalesRecord.findById(id);
    if (!salesRecord) {
      return res.status(404).json({
        message: 'Sales record not found',
        error: 'RECORD_NOT_FOUND'
      });
    }

    // Only allow updates by the original coordinator or branch managers
    if (salesRecord.coordinator.toString() !== coordinator._id.toString() && 
        coordinator.role !== 'branch_manager') {
      return res.status(403).json({
        message: 'You can only update sales records you created',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    req.salesRecord = salesRecord;
    next();
  } catch (error) {
    console.error('Sales record update validation error:', error);
    res.status(500).json({
      message: 'Validation error occurred',
      error: 'VALIDATION_ERROR'
    });
  }
};

module.exports = {
  validateSalesRecordHierarchy,
  validateSalesRecordUpdate
};
