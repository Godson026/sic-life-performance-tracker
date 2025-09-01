const express = require('express');
const router = express.Router();
const { createSalesRecord } = require('../controllers/salesRecordController');
const { protect, coordinator } = require('../middleware/authMiddleware');

router.route('/').post(protect, coordinator, createSalesRecord);

module.exports = router;
