const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const auth = require("../middleware/auth");

// RBAC Middleware (Enterprise RBAC)
const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireTeamManager,
} = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

// Get my teams (before :id routes to avoid conflict)
router.get("/my-teams", teamController.getMyTeams);

/**
 * Team CRUD - Enterprise RBAC
 */

// Create team - requires manage_team permission
router.post(
  "/",
  roleCheckAdvanced({
    permissions: ["manage_team"],
  }),
  teamController.create
);

// List all teams
router.get("/", teamController.list);

// Get team by ID
router.get("/:id", teamController.getById);

// Update team - requires manage_team permission
router.put(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_team"],
    checkOwnership: {
      resourceType: "team",
      resourceIdParam: "id",
    },
  }),
  teamController.update
);

// Delete team - requires system admin or manage_team permission
router.delete(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_team"],
    checkOwnership: {
      resourceType: "team",
      resourceIdParam: "id",
    },
  }),
  teamController.delete
);

/**
 * Team member operations - Enterprise RBAC
 */

// Get team members
router.get("/:id/members", teamController.getMembers);

// Add team member - requires manage_team_members permission
router.post(
  "/:id/members",
  roleCheckAdvanced({
    permissions: ["manage_team_members"],
    checkOwnership: {
      resourceType: "team",
      resourceIdParam: "id",
    },
  }),
  teamController.addMember
);

// Update team member role - requires manage_team_members permission
router.put(
  "/:id/members/:userId",
  roleCheckAdvanced({
    permissions: ["manage_team_members"],
    checkOwnership: {
      resourceType: "team",
      resourceIdParam: "id",
    },
  }),
  teamController.updateMember
);

// Remove team member - requires manage_team_members permission
router.delete(
  "/:id/members/:userId",
  roleCheckAdvanced({
    permissions: ["manage_team_members"],
    checkOwnership: {
      resourceType: "team",
      resourceIdParam: "id",
    },
  }),
  teamController.removeMember
);

// Get available users to add
router.get("/:id/available-users", teamController.getAvailableUsers);

module.exports = router;
