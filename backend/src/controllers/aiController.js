/**
 * AI Controller
 *
 * Handles all AI-related API requests
 */

const geminiService = require("../services/geminiService");
const aiQueueService = require("../services/aiQueueService");
const geminiConfig = require("../config/gemini");
const { AiUsageLog, AiCache, AiSetting, Task, Project } = require("../models");
const { formatResponse } = require("../utils/helpers");

/**
 * Log AI usage
 */
const logUsage = async (userId, feature, result, options = {}) => {
  try {
    await AiUsageLog.create({
      user_id: userId,
      feature,
      project_id: options.projectId || null,
      task_id: options.taskId || null,
      request_tokens: result.tokensUsed?.prompt || 0,
      response_tokens: result.tokensUsed?.completion || 0,
      total_tokens: result.tokensUsed?.total || 0,
      response_time_ms: result.responseTime || 0,
      status: result.success ? "success" : "error",
      error_message: result.error || null,
      cached: options.cached || false,
    });
  } catch (error) {
    console.error("[AI] Error logging usage:", error.message);
  }
};

/**
 * Check AI availability
 * GET /api/ai/status
 */
exports.getStatus = async (req, res, next) => {
  try {
    const configValid = geminiConfig.validateConfig();
    const queueStatus = await aiQueueService.getQueueStatus();

    let healthCheck = { available: false };
    if (configValid.valid && geminiConfig.enabled) {
      healthCheck = await geminiService.healthCheck();
    }

    res.json(
      formatResponse(true, "AI status retrieved", {
        enabled: geminiConfig.enabled,
        configured: configValid.valid,
        configErrors: configValid.errors,
        gemini: healthCheck,
        queue: queueStatus,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate task description
 * POST /api/ai/generate-task
 */
exports.generateTask = async (req, res, next) => {
  try {
    // Check if AI is available
    if (!geminiConfig.isAiAvailable()) {
      return res
        .status(503)
        .json(formatResponse(false, "AI service is not available"));
    }

    const { title, projectContext } = req.body;

    if (!title) {
      return res.status(400).json(formatResponse(false, "Title is required"));
    }

    // Check cache first
    const cacheKey = { feature: "generate_task", title, projectContext };
    const cached = await AiCache.getCached("generate_task", cacheKey);

    if (cached) {
      await logUsage(
        req.user.id,
        "generate_task",
        { success: true, tokensUsed: { total: 0 } },
        {
          projectId: projectContext?.id,
          cached: true,
        }
      );

      return res.json(
        formatResponse(true, "Task description generated (cached)", {
          ...cached.data,
          cached: true,
        })
      );
    }

    // Generate using AI queue
    const result = await aiQueueService.addJob(
      "generateTask",
      {
        title,
        projectContext,
      },
      {
        priority: aiQueueService.PRIORITY.HIGH,
      }
    );

    // Log usage
    await logUsage(req.user.id, "generate_task", result, {
      projectId: projectContext?.id,
    });

    if (!result.success) {
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            result.error || "Failed to generate task description"
          )
        );
    }

    // Cache the result
    await AiCache.setCache(
      "generate_task",
      cacheKey,
      result,
      geminiConfig.cache.ttl
    );

    res.json(
      formatResponse(true, "Task description generated successfully", {
        ...result.data,
        tokensUsed: result.tokensUsed,
        responseTime: result.responseTime,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest tasks for sprint
 * POST /api/ai/suggest-sprint-tasks
 */
exports.suggestSprintTasks = async (req, res, next) => {
  try {
    if (!geminiConfig.isAiAvailable()) {
      return res
        .status(503)
        .json(formatResponse(false, "AI service is not available"));
    }

    const { projectId, sprintId, capacity, preferences } = req.body;

    if (!projectId || !capacity) {
      return res
        .status(400)
        .json(formatResponse(false, "Project ID and capacity are required"));
    }

    // Get backlog tasks
    const tasks = await Task.findAll({
      where: {
        project_id: projectId,
        status: "backlog",
        sprint_id: null,
      },
      include: [
        {
          model: require("../models").User,
          as: "assignee",
          attributes: ["id", "full_name"],
        },
      ],
    });

    if (tasks.length === 0) {
      return res.json(
        formatResponse(true, "No backlog tasks available", {
          suggestions: [],
          message: "No tasks in backlog to suggest",
        })
      );
    }

    // Generate suggestions
    const result = await aiQueueService.addJob(
      "suggestSprint",
      {
        tasks: tasks.map((t) => t.toJSON()),
        capacity,
        preferences,
      },
      {
        priority: aiQueueService.PRIORITY.NORMAL,
      }
    );

    // Log usage
    await logUsage(req.user.id, "suggest_sprint", result, { projectId });

    if (!result.success) {
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            result.error || "Failed to generate suggestions"
          )
        );
    }

    // Enrich suggestions with task data
    const enrichedSuggestions = result.data.suggestions.map((suggestion) => {
      const task = tasks.find((t) => t.id === suggestion.taskId);
      return {
        ...suggestion,
        task: task
          ? {
              id: task.id,
              title: task.title,
              priority: task.priority,
              story_points: task.story_points,
              assignee: task.assignee,
            }
          : null,
      };
    });

    res.json(
      formatResponse(true, "Sprint task suggestions generated", {
        suggestions: enrichedSuggestions,
        totalPoints: result.data.totalPoints,
        analysis: result.data.analysis,
        tokensUsed: result.tokensUsed,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get project insights
 * POST /api/ai/project-insights
 */
exports.getProjectInsights = async (req, res, next) => {
  try {
    if (!geminiConfig.isAiAvailable()) {
      return res
        .status(503)
        .json(formatResponse(false, "AI service is not available"));
    }

    const { projectId } = req.body;

    if (!projectId) {
      return res
        .status(400)
        .json(formatResponse(false, "Project ID is required"));
    }

    // Get project with statistics
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: require("../models").User,
          as: "owner",
          attributes: ["id", "full_name"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json(formatResponse(false, "Project not found"));
    }

    // Get task statistics
    const tasks = await Task.findAll({ where: { project_id: projectId } });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "in_progress"
    ).length;
    const overdueTasks = tasks.filter(
      (t) =>
        t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    ).length;

    // Check cache
    const cacheKey = {
      feature: "project_insights",
      projectId,
      totalTasks,
      completedTasks,
    };
    const cached = await AiCache.getCached("project_insights", cacheKey);

    if (cached) {
      return res.json(
        formatResponse(true, "Project insights retrieved (cached)", {
          ...cached.data,
          cached: true,
        })
      );
    }

    // Generate insights
    const result = await aiQueueService.addJob(
      "projectInsights",
      {
        projectData: {
          name: project.name,
          description: project.description,
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          sprintProgress:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
          teamSize: 1, // TODO: Get actual team size
        },
      },
      {
        priority: aiQueueService.PRIORITY.LOW,
      }
    );

    // Log usage
    await logUsage(req.user.id, "project_insights", result, { projectId });

    if (!result.success) {
      return res
        .status(500)
        .json(
          formatResponse(false, result.error || "Failed to generate insights")
        );
    }

    // Cache the result
    await AiCache.setCache(
      "project_insights",
      cacheKey,
      result,
      geminiConfig.cache.ttl
    );

    res.json(
      formatResponse(true, "Project insights generated", {
        insights: result.data.insights,
        statistics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          completionRate:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        },
        tokensUsed: result.tokensUsed,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Chat about a task
 * POST /api/ai/chat
 */
exports.chat = async (req, res, next) => {
  try {
    if (!geminiConfig.isAiAvailable()) {
      return res
        .status(503)
        .json(formatResponse(false, "AI service is not available"));
    }

    const { taskId, message, history } = req.body;

    if (!taskId || !message) {
      return res
        .status(400)
        .json(formatResponse(false, "Task ID and message are required"));
    }

    // Get task with context
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: require("../models").User,
          as: "assignee",
          attributes: ["id", "full_name"],
        },
        {
          model: require("../models").Project,
          as: "project",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!task) {
      return res.status(404).json(formatResponse(false, "Task not found"));
    }

    // Generate chat response
    const result = await aiQueueService.addJob(
      "chat",
      {
        taskContext: task.toJSON(),
        message,
        history: history || [],
      },
      {
        priority: aiQueueService.PRIORITY.CRITICAL, // Chat needs fast response
      }
    );

    // Log usage
    await logUsage(req.user.id, "chat", result, {
      projectId: task.project_id,
      taskId,
    });

    if (!result.success) {
      return res
        .status(500)
        .json(formatResponse(false, result.error || "Failed to get response"));
    }

    res.json(
      formatResponse(true, "Response generated", {
        response: result.text,
        tokensUsed: result.tokensUsed,
        responseTime: result.responseTime,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI usage statistics (Admin)
 * GET /api/ai/admin/usage
 */
exports.getUsageStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const where = {};
    if (startDate) {
      where.created_at = { [require("sequelize").Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [require("sequelize").Op.lte]: new Date(endDate),
      };
    }

    // Get usage statistics
    const totalRequests = await AiUsageLog.count({ where });
    const totalTokens = (await AiUsageLog.sum("total_tokens", { where })) || 0;
    const successCount = await AiUsageLog.count({
      where: { ...where, status: "success" },
    });
    const errorCount = await AiUsageLog.count({
      where: { ...where, status: "error" },
    });

    // Get by feature
    const byFeature = await AiUsageLog.findAll({
      where,
      attributes: [
        "feature",
        [
          require("sequelize").fn("COUNT", require("sequelize").col("id")),
          "count",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("total_tokens")
          ),
          "tokens",
        ],
      ],
      group: ["feature"],
      raw: true,
    });

    // Get cache stats
    const cacheStats = await AiCache.getStats();

    res.json(
      formatResponse(true, "AI usage statistics retrieved", {
        summary: {
          totalRequests,
          totalTokens,
          successCount,
          errorCount,
          successRate:
            totalRequests > 0
              ? Math.round((successCount / totalRequests) * 100)
              : 0,
        },
        byFeature,
        cache: cacheStats,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage by user (Admin)
 * GET /api/ai/admin/usage/by-user
 */
exports.getUsageByUser = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const usage = await AiUsageLog.findAll({
      attributes: [
        "user_id",
        [
          require("sequelize").fn(
            "COUNT",
            require("sequelize").col("AiUsageLog.id")
          ),
          "requests",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("total_tokens")
          ),
          "tokens",
        ],
      ],
      include: [
        {
          model: require("../models").User,
          as: "user",
          attributes: ["id", "username", "email", "full_name"],
        },
      ],
      group: ["user_id", "user.id"],
      order: [
        [
          require("sequelize").fn(
            "COUNT",
            require("sequelize").col("AiUsageLog.id")
          ),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
    });

    res.json(formatResponse(true, "Usage by user retrieved", { usage }));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle AI feature (Admin)
 * POST /api/ai/admin/toggle
 */
exports.toggleAi = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    await AiSetting.setValue(
      "ai_enabled",
      String(enabled),
      "Master toggle for AI features",
      req.user.id
    );

    res.json(
      formatResponse(true, `AI features ${enabled ? "enabled" : "disabled"}`, {
        enabled,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Clear AI cache (Admin)
 * DELETE /api/ai/admin/cache
 */
exports.clearCache = async (req, res, next) => {
  try {
    const deleted = await AiCache.clearAll();

    res.json(
      formatResponse(true, "AI cache cleared", { entriesDeleted: deleted })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue status (Admin)
 * GET /api/ai/admin/queue-status
 */
exports.getQueueStatus = async (req, res, next) => {
  try {
    const status = await aiQueueService.getQueueStatus();

    res.json(formatResponse(true, "Queue status retrieved", status));
  } catch (error) {
    next(error);
  }
};

/**
 * Chat with streaming response (SSE)
 * POST /api/ai/chat/stream
 */
exports.chatStream = async (req, res, next) => {
  try {
    if (!geminiConfig.isAiAvailable()) {
      return res
        .status(503)
        .json(formatResponse(false, "AI service is not available"));
    }

    const { taskId, message, history } = req.body;

    if (!message) {
      return res.status(400).json(formatResponse(false, "Message is required"));
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    // If taskId is provided, get task context
    let taskContext = null;
    if (taskId) {
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: require("../models").User,
            as: "assignee",
            attributes: ["id", "full_name"],
          },
          {
            model: require("../models").Project,
            as: "project",
            attributes: ["id", "name"],
          },
        ],
      });

      if (!task) {
        res.write(`data: ${JSON.stringify({ error: "Task not found" })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      taskContext = task.toJSON();
    }

    // Use appropriate streaming function based on whether taskContext exists
    const streamFunction = taskContext
      ? geminiService.chatStreamAboutTask.bind(
          null,
          taskContext,
          message,
          history || []
        )
      : geminiService.chatStream.bind(null, message, history || []);

    // Stream callback handlers
    const onChunk = (chunk) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    };

    const onComplete = async (result) => {
      // Log usage
      await logUsage(req.user.id, "chat_stream", result, {
        projectId: taskContext?.project_id || null,
        taskId: taskId || null,
      });

      // Send completion signal
      res.write(
        `data: ${JSON.stringify({
          done: true,
          tokensUsed: result.tokensUsed,
          responseTime: result.responseTime,
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    };

    const onError = async (result) => {
      // Log error
      await logUsage(req.user.id, "chat_stream", result, {
        projectId: taskContext?.project_id || null,
        taskId: taskId || null,
      });

      res.write(
        `data: ${JSON.stringify({
          error: result.error || "Streaming failed",
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    };

    // Start streaming
    await streamFunction(onChunk, onComplete, onError);
  } catch (error) {
    console.error("[AI] Streaming error:", error);

    // If headers already sent, send error in SSE format
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      next(error);
    }
  }
};
