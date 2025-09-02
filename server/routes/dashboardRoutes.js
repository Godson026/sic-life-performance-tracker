const express = require('express');
const router = express.Router();
const { getAdminDashboardSummary, getBranchManagerDashboardSummary, getAdminReportSummary, getBranchManagerReportSummary, getCoordinatorReportSummary, getManagerTargetsPageData } = require('../controllers/dashboardController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

// Dashboard summary routes
router.get('/admin-summary', protect, admin, getAdminDashboardSummary);
router.get('/manager-summary', protect, branchManager, getBranchManagerDashboardSummary);

// Report routes
router.get('/admin-report', protect, admin, getAdminReportSummary);
router.get('/manager-report', protect, branchManager, getBranchManagerReportSummary);
router.get('/coordinator-report', protect, coordinator, getCoordinatorReportSummary);

// Manager targets page route
router.get('/manager-targets-page', protect, branchManager, getManagerTargetsPageData);

module.exports = router;
