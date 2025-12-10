const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All routes require authentication
router.use(auth);

// Get my teams (before :id routes to avoid conflict)
router.get("/my-teams", teamController.getMyTeams);

// Team CRUD
router.post(
  "/",
  roleCheck(["admin", "project_manager"]),
  teamController.create
);
router.get("/", teamController.list);
router.get("/:id", teamController.getById);
router.put(
  "/:id",
  roleCheck(["admin", "project_manager"]),
  teamController.update
);
router.delete("/:id", roleCheck(["admin"]), teamController.delete);

// Team member operations
router.get("/:id/members", teamController.getMembers);
router.post(
  "/:id/members",
  roleCheck(["admin", "project_manager"]),
  teamController.addMember
);
router.put(
  "/:id/members/:userId",
  roleCheck(["admin", "project_manager"]),
  teamController.updateMember
);
router.delete(
  "/:id/members/:userId",
  roleCheck(["admin", "project_manager"]),
  teamController.removeMember
);

// Get available users to add
router.get("/:id/available-users", teamController.getAvailableUsers);

module.exports = router;
