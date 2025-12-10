const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const auth = require("../middleware/auth");

// RBAC Middleware (Enterprise RBAC)
const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireDivisionLead,
} = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

/**
 * Department/Division CRUD - Enterprise RBAC
 */

// Create department - requires system admin or manage_division permission
router.post(
  "/",
  roleCheckAdvanced({
    permissions: ["manage_division"],
  }),
  departmentController.create
);

// List all departments
router.get("/", departmentController.list);

// Get department by ID
router.get("/:id", departmentController.getById);

// Update department - requires manage_division permission
router.put(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_division"],
    checkOwnership: {
      resourceType: "department",
      resourceIdParam: "id",
    },
  }),
  departmentController.update
);

// Delete department - requires system admin
router.delete("/:id", requireSystemAdmin(), departmentController.delete);

/**
 * Additional endpoints
 */

// Get department stats - requires view_division_reports permission
router.get(
  "/:id/stats",
  roleCheckAdvanced({
    permissions: ["view_division_reports"],
    checkOwnership: {
      resourceType: "department",
      resourceIdParam: "id",
    },
  }),
  departmentController.getStats
);

// Reorder departments - requires system admin
router.put("/reorder", requireSystemAdmin(), departmentController.reorder);

module.exports = router;
