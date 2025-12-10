/**
 * AI Routes
 *
 * API endpoints for AI features
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  aiRateLimiter,
  checkAiAvailability,
} = require("../middleware/aiRateLimiter");

// All AI routes require authentication
router.use(auth);

// =============================================
// PUBLIC AI ENDPOINTS (authenticated users)
// =============================================

/**
 * GET /api/ai/status
 * Get AI service status
 */
router.get("/status", aiController.getStatus);

/**
 * POST /api/ai/generate-task
 * Generate task description from title
 */
router.post(
  "/generate-task",
  checkAiAvailability,
  aiRateLimiter,
  aiController.generateTask
);

/**
 * POST /api/ai/suggest-sprint-tasks
 * Get AI suggestions for sprint planning
 */
router.post(
  "/suggest-sprint-tasks",
  checkAiAvailability,
  aiRateLimiter,
  aiController.suggestSprintTasks
);

/**
 * POST /api/ai/project-insights
 * Get AI-generated project insights
 */
router.post(
  "/project-insights",
  checkAiAvailability,
  aiRateLimiter,
  aiController.getProjectInsights
);

/**
 * POST /api/ai/chat
 * Chat with AI about a task
 */
router.post("/chat", checkAiAvailability, aiRateLimiter, aiController.chat);

/**
 * POST /api/ai/chat/stream
 * Chat with AI using streaming response (SSE)
 */
router.post(
  "/chat/stream",
  checkAiAvailability,
  aiRateLimiter,
  aiController.chatStream
);

// =============================================
// ADMIN AI ENDPOINTS
// =============================================

/**
 * GET /api/ai/admin/usage
 * Get AI usage statistics
 */
router.get("/admin/usage", roleCheck(["admin"]), aiController.getUsageStats);

/**
 * GET /api/ai/admin/usage/by-user
 * Get AI usage by user
 */
router.get(
  "/admin/usage/by-user",
  roleCheck(["admin"]),
  aiController.getUsageByUser
);

/**
 * GET /api/ai/admin/queue-status
 * Get AI queue status
 */
router.get(
  "/admin/queue-status",
  roleCheck(["admin"]),
  aiController.getQueueStatus
);

/**
 * POST /api/ai/admin/toggle
 * Enable/disable AI features
 */
router.post("/admin/toggle", roleCheck(["admin"]), aiController.toggleAi);

/**
 * DELETE /api/ai/admin/cache
 * Clear AI cache
 */
router.delete("/admin/cache", roleCheck(["admin"]), aiController.clearCache);

module.exports = router;
