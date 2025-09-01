const express = require('express');
const router = express.Router();
const { getAdminReportSummary, getBranchManagerReportSummary, getCoordinatorReportSummary, getManagerTargetsPageData } = require('../controllers/dashboardController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

router.get('/admin-report', protect, admin, getAdminReportSummary);
router.get('/manager-report', protect, branchManager, getBranchManagerReportSummary);
router.get('/coordinator-report', protect, coordinator, getCoordinatorReportSummary);
router.get('/manager-targets-page', protect, branchManager, getManagerTargetsPageData);

module.exports = router;
