const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRoutes");
const sprintRoutes = require("./sprintRoutes");
const taskRoutes = require("./taskRoutes");
const commentRoutes = require("./commentRoutes");
const attachmentRoutes = require("./attachmentRoutes");
const activityRoutes = require("./activityRoutes");
const labelRoutes = require("./labelRoutes");
const timeLogRoutes = require("./timeLogRoutes");
const notificationRoutes = require("./notificationRoutes");
const aiRoutes = require("./aiRoutes");
const reportRoutes = require("./reportRoutes");
const departmentRoutes = require("./departmentRoutes");
const teamRoutes = require("./teamRoutes");

// Enterprise RBAC Routes
const rbacRoutes = require("./rbacRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/sprints", sprintRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/attachments", attachmentRoutes);
router.use("/activities", activityRoutes);
router.use("/labels", labelRoutes);
router.use("/time-logs", timeLogRoutes);
router.use("/notifications", notificationRoutes);
router.use("/ai", aiRoutes);
router.use("/reports", reportRoutes);
router.use("/departments", departmentRoutes);
router.use("/teams", teamRoutes);

// Enterprise RBAC
router.use("/rbac", rbacRoutes);

module.exports = router;
