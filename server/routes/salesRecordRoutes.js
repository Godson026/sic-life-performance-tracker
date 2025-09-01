const express = require('express');
const router = express.Router();
const { createSalesRecord } = require('../controllers/salesRecordController');
const { protect, coordinator } = require('../middleware/authMiddleware');

// Create new sales record (coordinator only)
router.post('/', protect, coordinator, createSalesRecord);

module.exports = router;
