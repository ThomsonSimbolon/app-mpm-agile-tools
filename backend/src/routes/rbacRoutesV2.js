/**
 * =============================================================================
 * RBAC ROUTES V2 - Using Controller
 * =============================================================================
 * Routes yang menggunakan rbacController untuk clean code
 * Import file ini jika ingin mengganti rbacRoutes.js yang inline
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const rbacController = require("../controllers/rbacController");

const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireSuperAdmin,
} = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

// =============================================================================
// ROLE DEFINITIONS (Public - for dropdowns)
// =============================================================================
router.get("/role-definitions", rbacController.getRoleDefinitions);

// =============================================================================
// DASHBOARD
// =============================================================================
router.get(
  "/dashboard",
  requireSystemAdmin(),
  rbacController.getDashboardStats
);

// =============================================================================
// PERMISSION MANAGEMENT
// =============================================================================
router.get(
  "/permissions",
  requireSystemAdmin(),
  rbacController.getAllPermissions
);
router.get(
  "/permissions/:code",
  requireSystemAdmin(),
  rbacController.getPermissionByCode
);
router.post(
  "/permissions",
  requireSuperAdmin(),
  rbacController.createPermission
);

// =============================================================================
// ROLE-PERMISSION MAPPING
// =============================================================================
router.get(
  "/role-permissions",
  requireSystemAdmin(),
  rbacController.getRolePermissionMappings
);
router.post(
  "/role-permissions",
  requireSuperAdmin(),
  rbacController.addPermissionToRole
);
router.delete(
  "/role-permissions",
  requireSuperAdmin(),
  rbacController.removePermissionFromRole
);

// =============================================================================
// USER ROLE MANAGEMENT
// =============================================================================
router.get(
  "/users/:userId/roles",
  requireSystemAdmin(),
  rbacController.getUserRoles
);
router.put(
  "/users/:userId/system-role",
  requireSuperAdmin(),
  rbacController.updateUserSystemRole
);
router.post(
  "/users/:userId/division-role",
  requireSystemAdmin(),
  rbacController.assignDivisionRole
);
router.post(
  "/users/:userId/team-role",
  requireSystemAdmin(),
  rbacController.assignTeamRole
);
router.post(
  "/users/:userId/project-role",
  requireSystemAdmin(),
  rbacController.assignProjectRole
);
router.delete(
  "/users/:userId/division-role",
  requireSystemAdmin(),
  rbacController.removeDivisionRole
);

// =============================================================================
// EFFECTIVE PERMISSIONS (For current user)
// =============================================================================
router.get("/my-permissions", rbacController.getMyPermissions);
router.post("/check-permission", rbacController.checkPermission);
router.post("/bulk-check-permissions", rbacController.bulkCheckPermissions);

// =============================================================================
// AUDIT LOGS
// =============================================================================
router.get(
  "/audit-logs",
  roleCheckAdvanced({
    permissions: ["view_audit_logs"],
  }),
  rbacController.getAuditLogs
);

module.exports = router;
