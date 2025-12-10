/**
 * =============================================================================
 * EXAMPLE ROUTES WITH ENTERPRISE RBAC
 * =============================================================================
 * Contoh penggunaan middleware roleCheckAdvanced pada routes
 * File ini menunjukkan pattern penggunaan RBAC di berbagai endpoint
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Import RBAC middleware dan constants
const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireSuperAdmin,
  requireDivisionLead,
  requireProjectManager,
  requireSprintManager,
  requireTaskEditor,
  requireTaskCreator,
  requireTeamManager,
  requireAiAdmin,
  checkPermission,
  checkRole,
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// =============================================================================
// PATTERN 1: SYSTEM-LEVEL ROUTES (Super Admin / Admin only)
// =============================================================================

/**
 * Kelola semua pengguna - hanya super_admin dan admin
 */
router.get("/users", auth, requireSystemAdmin(), async (req, res) => {
  // Controller logic here
  res.json({ success: true, message: "List all users" });
});

/**
 * Hapus pengguna - hanya super_admin
 */
router.delete("/users/:id", auth, requireSuperAdmin(), async (req, res) => {
  res.json({ success: true, message: "Delete user" });
});

/**
 * Override permission - hanya super_admin
 */
router.post(
  "/override-permission",
  auth,
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN],
    permissions: [PERMISSIONS.OVERRIDE_PERMISSION],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Permission overridden" });
  }
);

// =============================================================================
// PATTERN 2: DIVISION-LEVEL ROUTES
// =============================================================================

/**
 * Buat project baru - Division Head / Manager atau System Admin
 */
router.post(
  "/projects",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      DIVISION_ROLES.DIVISION_HEAD,
      DIVISION_ROLES.DIVISION_MANAGER,
    ],
    permissions: [PERMISSIONS.CREATE_PROJECT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Project created" });
  }
);

/**
 * Hapus project - hanya Division Head atau Super Admin
 */
router.delete(
  "/projects/:id",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      DIVISION_ROLES.DIVISION_HEAD,
      PROJECT_ROLES.PROJECT_OWNER,
    ],
    permissions: [PERMISSIONS.DELETE_PROJECT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Project deleted" });
  }
);

/**
 * Approve workflow - Division Head / Manager / HR Reviewer
 */
router.post(
  "/workflows/:id/approve",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.APPROVE_WORKFLOW],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Workflow approved" });
  }
);

// =============================================================================
// PATTERN 3: TEAM-LEVEL ROUTES
// =============================================================================

/**
 * Kelola anggota tim - Team Admin / Lead
 */
router.post(
  "/teams/:teamId/members",
  auth,
  requireTeamManager(),
  async (req, res) => {
    res.json({ success: true, message: "Team member added" });
  }
);

/**
 * Start sprint - Scrum Master / Team Lead / Team Admin
 */
router.post(
  "/sprints/:id/start",
  auth,
  requireSprintManager(),
  async (req, res) => {
    res.json({ success: true, message: "Sprint started" });
  }
);

/**
 * Complete sprint - sama dengan start sprint
 */
router.post(
  "/sprints/:id/complete",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      TEAM_ROLES.TEAM_ADMIN,
      TEAM_ROLES.TEAM_LEAD,
      TEAM_ROLES.SCRUM_MASTER,
    ],
    permissions: [PERMISSIONS.START_END_SPRINT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Sprint completed" });
  }
);

/**
 * Prioritize backlog - Team Admin / Lead / Product Owner
 */
router.put(
  "/backlog/prioritize",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      TEAM_ROLES.TEAM_ADMIN,
      TEAM_ROLES.TEAM_LEAD,
      TEAM_ROLES.PRODUCT_OWNER,
    ],
    permissions: [PERMISSIONS.PRIORITIZE_BACKLOG],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Backlog prioritized" });
  }
);

/**
 * QA Approval - hanya QA Lead
 */
router.post(
  "/tasks/:id/qa-approve",
  auth,
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN, TEAM_ROLES.QA_LEAD],
    permissions: [PERMISSIONS.QA_APPROVAL],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Task QA approved" });
  }
);

// =============================================================================
// PATTERN 4: PROJECT-LEVEL ROUTES
// =============================================================================

/**
 * Edit project - Project Owner / Manager
 */
router.put(
  "/projects/:projectId",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      PROJECT_ROLES.PROJECT_OWNER,
      PROJECT_ROLES.PROJECT_MANAGER,
    ],
    permissions: [PERMISSIONS.EDIT_PROJECT_DETAILS],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Project updated" });
  }
);

/**
 * Create sprint - Project Owner / Manager
 */
router.post(
  "/projects/:projectId/sprints",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.CREATE_SPRINT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Sprint created" });
  }
);

/**
 * Create task - multiple roles dengan permission create_task
 */
router.post(
  "/projects/:projectId/tasks",
  auth,
  requireTaskCreator(),
  async (req, res) => {
    res.json({ success: true, message: "Task created" });
  }
);

/**
 * Edit task - dengan ownership check untuk developer
 * Developer hanya bisa edit task yang di-assign ke mereka
 */
router.put(
  "/tasks/:id",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.EDIT_TASK, PERMISSIONS.EDIT_TASK_DETAILS],
    checkOwnership: true,
    resourceType: "task",
    resourceIdParam: "id",
  }),
  async (req, res) => {
    res.json({ success: true, message: "Task updated" });
  }
);

/**
 * Delete task - hanya Team Admin / Lead atau Project Manager
 */
router.delete(
  "/tasks/:id",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      TEAM_ROLES.TEAM_ADMIN,
      TEAM_ROLES.TEAM_LEAD,
      PROJECT_ROLES.PROJECT_OWNER,
      PROJECT_ROLES.PROJECT_MANAGER,
    ],
    permissions: [PERMISSIONS.DELETE_TASK],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Task deleted" });
  }
);

/**
 * Assign task - Team Lead / Scrum Master / Project Manager
 */
router.put(
  "/tasks/:id/assign",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.ASSIGN_TASK],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Task assigned" });
  }
);

/**
 * Move task in Kanban - semua team member
 */
router.put(
  "/tasks/:id/status",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.MOVE_TASK_KANBAN, PERMISSIONS.CHANGE_TASK_STATUS],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Task status changed" });
  }
);

/**
 * QA Testing - hanya QA Tester
 */
router.post(
  "/tasks/:id/qa-test",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      PROJECT_ROLES.QA_TESTER,
      TEAM_ROLES.QA_LEAD,
    ],
    permissions: [PERMISSIONS.QA_TESTING],
  }),
  async (req, res) => {
    res.json({ success: true, message: "QA test recorded" });
  }
);

/**
 * View reports - multiple viewers
 */
router.get(
  "/projects/:projectId/reports",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.VIEW_REPORT, PERMISSIONS.VIEW_ALL_REPORTS],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Project reports" });
  }
);

/**
 * Workload management - Project Manager / Tech Lead
 */
router.get(
  "/projects/:projectId/workload",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.WORKLOAD_MANAGEMENT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Workload data" });
  }
);

// =============================================================================
// PATTERN 5: COMMON OPERATIONS (Lebih permisif)
// =============================================================================

/**
 * Add comment - semua member (common permission)
 */
router.post(
  "/tasks/:taskId/comments",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.ADD_COMMENT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Comment added" });
  }
);

/**
 * Upload attachment - semua member
 */
router.post(
  "/tasks/:taskId/attachments",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.UPLOAD_ATTACHMENT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Attachment uploaded" });
  }
);

/**
 * Log time - semua member
 */
router.post(
  "/tasks/:taskId/time-logs",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.LOG_TIME],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Time logged" });
  }
);

// =============================================================================
// PATTERN 6: AI ROUTES
// =============================================================================

/**
 * Kelola AI settings - AI Admin / Super Admin
 */
router.put("/ai/settings", auth, requireAiAdmin(), async (req, res) => {
  res.json({ success: true, message: "AI settings updated" });
});

// =============================================================================
// PATTERN 7: CONDITIONAL PERMISSION CHECK IN CONTROLLER
// =============================================================================

/**
 * Edit sprint - dengan conditional check di controller
 * Tech Lead bisa edit tapi tidak bisa start/complete
 */
router.put(
  "/sprints/:id",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.EDIT_SPRINT, PERMISSIONS.MANAGE_SPRINT],
  }),
  async (req, res) => {
    // Additional check in controller untuk conditional permission
    const canStartComplete = await checkPermission(
      req,
      PERMISSIONS.START_END_SPRINT
    );

    if (req.body.status && !canStartComplete) {
      return res.status(403).json({
        success: false,
        message: "You can edit sprint details but cannot change status",
      });
    }

    res.json({ success: true, message: "Sprint updated" });
  }
);

/**
 * Edit task dengan field restriction untuk QA
 */
router.put(
  "/tasks/:id/qa-fields",
  auth,
  roleCheckAdvanced({
    roles: [PROJECT_ROLES.QA_TESTER, TEAM_ROLES.QA_LEAD],
  }),
  async (req, res) => {
    // QA hanya bisa edit field tertentu
    const allowedFields = ["qa_status", "test_notes", "bug_details"];
    const requestedFields = Object.keys(req.body);

    const invalidFields = requestedFields.filter(
      (f) => !allowedFields.includes(f)
    );
    if (invalidFields.length > 0) {
      return res.status(403).json({
        success: false,
        message: "QA can only modify QA-related fields",
        invalidFields,
        allowedFields,
      });
    }

    res.json({ success: true, message: "QA fields updated" });
  }
);

// =============================================================================
// PATTERN 8: MULTIPLE PERMISSIONS REQUIRED (requireAll: true)
// =============================================================================

/**
 * Bulk delete tasks - membutuhkan SEMUA permission
 */
router.post(
  "/tasks/bulk-delete",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.DELETE_TASK, PERMISSIONS.MANAGE_ALL_PROJECTS],
    requireAll: true, // User harus punya KEDUA permission
  }),
  async (req, res) => {
    res.json({ success: true, message: "Tasks bulk deleted" });
  }
);

// =============================================================================
// PATTERN 9: VIEW-ONLY ROUTES (Stakeholder / Report Viewer)
// =============================================================================

/**
 * Dashboard view - semua yang punya view permission
 */
router.get(
  "/dashboard",
  auth,
  roleCheckAdvanced({
    permissions: [
      PERMISSIONS.VIEW_PROJECT,
      PERMISSIONS.VIEW_REPORT,
      PERMISSIONS.VIEW_ALL_REPORTS,
    ],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Dashboard data" });
  }
);

/**
 * Public project view - stakeholder
 */
router.get(
  "/projects/:id/overview",
  auth,
  roleCheckAdvanced({
    roles: [
      ...Object.values(SYSTEM_ROLES),
      ...Object.values(DIVISION_ROLES),
      ...Object.values(TEAM_ROLES),
      ...Object.values(PROJECT_ROLES),
    ],
    permissions: [PERMISSIONS.VIEW_PROJECT],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Project overview" });
  }
);

// =============================================================================
// PATTERN 10: AUDIT LOGS
// =============================================================================

/**
 * View audit logs - Security Officer / Admin
 */
router.get(
  "/audit-logs",
  auth,
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SECURITY_OFFICER,
    ],
    permissions: [PERMISSIONS.VIEW_AUDIT_LOGS],
  }),
  async (req, res) => {
    // Admin mungkin punya partial access (lihat CONDITIONAL_RULES)
    const isSecurityOfficer = checkRole(req, SYSTEM_ROLES.SECURITY_OFFICER);
    const isSuperAdmin = checkRole(req, SYSTEM_ROLES.SUPER_ADMIN);

    // Filter sensitive data untuk non-security officer
    const includeSensitive = isSecurityOfficer || isSuperAdmin;

    res.json({
      success: true,
      message: "Audit logs",
      includeSensitive,
    });
  }
);

/**
 * Manage audit logs - hanya Security Officer / Super Admin
 */
router.delete(
  "/audit-logs/:id",
  auth,
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.SECURITY_OFFICER],
    permissions: [PERMISSIONS.MANAGE_AUDIT_LOGS],
  }),
  async (req, res) => {
    res.json({ success: true, message: "Audit log deleted" });
  }
);

module.exports = router;
