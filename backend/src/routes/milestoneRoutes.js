/**
 * Milestone Routes
 * Routes for project milestones management
 */

const express = require("express");
const router = express.Router();
const milestoneController = require("../controllers/milestoneController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Get single milestone (before project-scoped routes to avoid conflicts)
router.get("/:id", milestoneController.getMilestone);
router.put("/:id", milestoneController.updateMilestone);
router.delete("/:id", milestoneController.deleteMilestone);
router.patch("/:id/complete", milestoneController.completeMilestone);

// Project-scoped milestone routes
router.get("/project/:project_id", milestoneController.getMilestones);
router.post("/project/:project_id", milestoneController.createMilestone);
router.put(
  "/project/:project_id/reorder",
  milestoneController.reorderMilestones
);
router.get(
  "/project/:project_id/roadmap",
  milestoneController.getProjectRoadmap
);

module.exports = router;
