const express = require('express');
const { createSalesRecord } = require('../controllers/salesRecordController');
const { protect, coordinator } = require('../middleware/authMiddleware');
const { validateSalesRecordHierarchy } = require('../middleware/salesRecordValidation');

const router = express.Router();

// Protected coordinator routes for sales records with hierarchy validation
router.route('/').post(protect, coordinator, validateSalesRecordHierarchy, createSalesRecord);

module.exports = router;
