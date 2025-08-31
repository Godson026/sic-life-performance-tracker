const express = require('express');
const { getAdminDashboardSummary, getBranchManagerDashboardSummary, getAdminReportSummary, getBranchManagerReportSummary, getCoordinatorReportSummary, getManagerTargetsPageData } = require('../controllers/dashboardController');
const { protect, admin, branchManager, coordinator } = require('../middleware/authMiddleware');

const router = express.Router();

// Get admin dashboard summary
router.route('/admin-summary').get(protect, admin, getAdminDashboardSummary);

// Get branch manager dashboard summary
router.route('/manager-summary').get(protect, branchManager, getBranchManagerDashboardSummary);

// Admin Reports Route
router.route('/admin-report').get(protect, admin, getAdminReportSummary);

// Branch Manager Reports Route
router.route('/manager-report').get(protect, branchManager, getBranchManagerReportSummary);

// Coordinator Reports Route
router.route('/coordinator-report').get(protect, coordinator, getCoordinatorReportSummary);

// Branch Manager Targets Page Route
router.route('/manager-targets-page').get(protect, branchManager, getManagerTargetsPageData);

module.exports = router;
