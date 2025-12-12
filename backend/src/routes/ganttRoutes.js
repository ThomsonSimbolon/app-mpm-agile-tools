/**
 * Gantt Routes
 * Routes for Gantt chart and task dependencies
 */

const express = require("express");
const router = express.Router();
const ganttController = require("../controllers/ganttController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Gantt chart data
router.get("/project/:project_id", ganttController.getGanttData);
router.get(
  "/project/:project_id/critical-path",
  ganttController.getCriticalPath
);

// Task dependencies
router.get(
  "/project/:project_id/dependencies",
  ganttController.getDependencies
);
router.post("/dependencies", ganttController.createDependency);
router.put("/dependencies/:id", ganttController.updateDependency);
router.delete("/dependencies/:id", ganttController.deleteDependency);

// Task date updates from Gantt
router.patch("/tasks/:task_id/dates", ganttController.updateTaskDates);
router.patch("/tasks/bulk-update", ganttController.bulkUpdateTasks);

module.exports = router;
