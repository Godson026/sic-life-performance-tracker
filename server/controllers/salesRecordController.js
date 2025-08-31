const SalesRecord = require('../models/salesRecordModel');

// This is the definitive data-entry function.
const createSalesRecord = async (req, res) => {
  try {
    const { agentId, date, sales_amount, new_registrations } = req.body;
    const coordinator = req.user; // The logged-in user is the coordinator.

    // --- THIS IS THE KEY LOGIC ---
    // First, validate that the coordinator is actually assigned to a branch.
    if (!coordinator.branch) {
      return res.status(400).json({ 
        message: 'Error: This coordinator is not assigned to a branch and cannot log sales.' 
      });
    }

    // Validate required fields
    if (!agentId || !date || sales_amount === undefined || new_registrations === undefined) {
      return res.status(400).json({
        message: 'Please provide agentId, date, sales_amount, and new_registrations'
      });
    }

    // Validate numeric values
    if (sales_amount < 0 || new_registrations < 0) {
      return res.status(400).json({
        message: 'Sales amount and new registrations must be non-negative numbers'
      });
    }

    // Create the new sales record with the complete hierarchy.
    const newRecord = await SalesRecord.create({
      agent: agentId,
      coordinator: coordinator._id,    // Save the logged-in coordinator's ID
      branch: coordinator.branch,      // Save the coordinator's assigned branch ID
      date: new Date(date),
      sales_amount: Number(sales_amount),
      new_registrations: Number(new_registrations),
    });
    // -----------------------------
    
    // Populate the references for better response
    const populatedRecord = await SalesRecord.findById(newRecord._id)
      .populate('agent', 'name')
      .populate('coordinator', 'name')
      .populate('branch', 'name');

    console.log('✅ Sales record created with complete hierarchy:', {
      agent: populatedRecord.agent?.name,
      coordinator: populatedRecord.coordinator?.name,
      branch: populatedRecord.branch?.name,
      sales_amount: populatedRecord.sales_amount,
      date: populatedRecord.date
    });

    res.status(201).json(populatedRecord);

  } catch (error) {
    console.error('FATAL ERROR creating sales record:', error);
    res.status(500).json({ message: 'Server Error: Could not create sales record.' });
  }
};

module.exports = {
  createSalesRecord
};
