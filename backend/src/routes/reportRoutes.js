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
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

// ============================================
// PROJECT REPORTS
// ============================================

/**
 * @route   GET /api/reports/projects/:projectId/summary
 * @desc    Get project statistics summary
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/summary",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getProjectSummary
);

/**
 * @route   GET /api/reports/projects/:projectId/burndown
 * @desc    Get burndown chart data for active sprint
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/burndown",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getBurndownData
);

/**
 * @route   GET /api/reports/projects/:projectId/velocity
 * @desc    Get velocity chart data (completed sprints)
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/velocity",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getVelocityData
);

/**
 * @route   GET /api/reports/projects/:projectId/workload
 * @desc    Get workload distribution per team member
 * @access  Private (requires view_report or workload_management permission)
 */
router.get(
  "/projects/:projectId/workload",
  roleCheckAdvanced({
    permissions: ["view_report", "workload_management", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getWorkloadDistribution
);

/**
 * @route   GET /api/reports/projects/:projectId/activity
 * @desc    Get activity timeline for project
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/activity",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getActivityTimeline
);

/**
 * @route   GET /api/reports/projects/:projectId/time-tracking
 * @desc    Get time tracking report for project
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/time-tracking",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getTimeTrackingReport
);

// ============================================
// SPRINT REPORTS
// ============================================

/**
 * @route   GET /api/reports/sprints/:sprintId/burndown
 * @desc    Get burndown chart data for specific sprint
 * @access  Private (requires view_report or view_sprint permission)
 */
router.get(
  "/sprints/:sprintId/burndown",
  roleCheckAdvanced({
    permissions: ["view_report", "view_sprint", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getBurndownData
);

/**
 * @route   GET /api/reports/sprints/:sprintId/report
 * @desc    Get comprehensive sprint report
 * @access  Private (requires view_report permission)
 */
router.get(
  "/sprints/:sprintId/report",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  reportController.getSprintReport
);

// ============================================
// EXPORT ROUTES
// ============================================

/**
 * @route   GET /api/reports/projects/:projectId/export/pdf
 * @desc    Export project report to PDF
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/export/pdf",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  exportController.exportProjectPDF
);

/**
 * @route   GET /api/reports/projects/:projectId/export/excel
 * @desc    Export project report to Excel
 * @access  Private (requires view_report permission)
 */
router.get(
  "/projects/:projectId/export/excel",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  exportController.exportProjectExcel
);

/**
 * @route   GET /api/reports/sprints/:sprintId/export/pdf
 * @desc    Export sprint report to PDF
 * @access  Private (requires view_report permission)
 */
router.get(
  "/sprints/:sprintId/export/pdf",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  exportController.exportSprintPDF
);

/**
 * @route   GET /api/reports/sprints/:sprintId/export/excel
 * @desc    Export sprint report to Excel
 * @access  Private (requires view_report permission)
 */
router.get(
  "/sprints/:sprintId/export/excel",
  roleCheckAdvanced({
    permissions: ["view_report", "view_all_reports"],
    allowProjectMember: true,
  }),
  exportController.exportSprintExcel
);

module.exports = router;
