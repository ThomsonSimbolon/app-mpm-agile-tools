/**
 * Report Routes
 *
 * Routes for dashboard reporting and analytics
 */

const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const exportController = require("../controllers/exportController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// ============================================
// PROJECT REPORTS
// ============================================

/**
 * @route   GET /api/reports/projects/:projectId/summary
 * @desc    Get project statistics summary
 * @access  Private
 */
router.get("/projects/:projectId/summary", reportController.getProjectSummary);

/**
 * @route   GET /api/reports/projects/:projectId/burndown
 * @desc    Get burndown chart data for active sprint
 * @access  Private
 */
router.get("/projects/:projectId/burndown", reportController.getBurndownData);

/**
 * @route   GET /api/reports/projects/:projectId/velocity
 * @desc    Get velocity chart data (completed sprints)
 * @access  Private
 */
router.get("/projects/:projectId/velocity", reportController.getVelocityData);

/**
 * @route   GET /api/reports/projects/:projectId/workload
 * @desc    Get workload distribution per team member
 * @access  Private
 */
router.get(
  "/projects/:projectId/workload",
  reportController.getWorkloadDistribution
);

/**
 * @route   GET /api/reports/projects/:projectId/activity
 * @desc    Get activity timeline for project
 * @access  Private
 */
router.get(
  "/projects/:projectId/activity",
  reportController.getActivityTimeline
);

/**
 * @route   GET /api/reports/projects/:projectId/time-tracking
 * @desc    Get time tracking report for project
 * @access  Private
 */
router.get(
  "/projects/:projectId/time-tracking",
  reportController.getTimeTrackingReport
);

// ============================================
// SPRINT REPORTS
// ============================================

/**
 * @route   GET /api/reports/sprints/:sprintId/burndown
 * @desc    Get burndown chart data for specific sprint
 * @access  Private
 */
router.get("/sprints/:sprintId/burndown", reportController.getBurndownData);

/**
 * @route   GET /api/reports/sprints/:sprintId/report
 * @desc    Get comprehensive sprint report
 * @access  Private
 */
router.get("/sprints/:sprintId/report", reportController.getSprintReport);

// ============================================
// EXPORT ROUTES
// ============================================

/**
 * @route   GET /api/reports/projects/:projectId/export/pdf
 * @desc    Export project report to PDF
 * @access  Private
 */
router.get(
  "/projects/:projectId/export/pdf",
  exportController.exportProjectPDF
);

/**
 * @route   GET /api/reports/projects/:projectId/export/excel
 * @desc    Export project report to Excel
 * @access  Private
 */
router.get(
  "/projects/:projectId/export/excel",
  exportController.exportProjectExcel
);

/**
 * @route   GET /api/reports/sprints/:sprintId/export/pdf
 * @desc    Export sprint report to PDF
 * @access  Private
 */
router.get("/sprints/:sprintId/export/pdf", exportController.exportSprintPDF);

/**
 * @route   GET /api/reports/sprints/:sprintId/export/excel
 * @desc    Export sprint report to Excel
 * @access  Private
 */
router.get(
  "/sprints/:sprintId/export/excel",
  exportController.exportSprintExcel
);

module.exports = router;
